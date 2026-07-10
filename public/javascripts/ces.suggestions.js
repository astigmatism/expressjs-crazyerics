/**
 * Object which wraps common functions related to game suggestions.
 * Suggestions use an application-owned waterfall renderer so the collection
 * grids can continue using Isotope while this grid controls its own layout,
 * lazy loading, duplicate prevention, and entry animation.
 * @type {Object}
 */
var cesSuggestions = (function(_config, _Media, _Compression, _Tooltips, _Collections, PlayGameHandler, $grid, $wrapper) {

    //private members
    var self = this;
    var _grid = null;
    var _lastRecipe = null;
    var _currentGameLinks = [];
    var _loading = false;
    var _loadingRequestCount = 0; //a handle on the number of requests sent to the server
    var _page = 0;
    var _loadingIcon = 'Blocks-1s-61px.svg';
    var $loading;
    var $loadingAnimations = ['flipInX', 'pulse', 'flipOutX']; //in, stay, out

    var _desktopColumnCount = 10;
    var _minimumColumnWidth = 118;
    var _loadMoreThreshold = 600;
    var _imageReadyTimeout = 6000;
    var _staggerStepMs = 22;
    var _staggerWindow = 24;
    var _enterAnimationMs = 720;

    var _columns = [];
    var _columnHeights = [];
    var _columnCount = 0;
    var _renderedKeys = {};
    var _renderSequence = 0;
    var _loadGeneration = 0;
    var _activeSuggestionRequest = null;
    var _ended = false;
    var _observer = null;
    var _scrollHandler = null;
    var _resizeHandler = null;
    var _layoutRefreshHandler = null;
    var _suggestionDragNamespace = '.cesSuggestionDrag';
    var _suggestionDragState = null;
    var _suggestionDragThreshold = 6;
    var _suggestionDragHoldMs = 240;
    var _suppressNextSuggestionClick = false;
    var _suppressNextSuggestionClickTimer = null;

    this.Load = function(recipe, callback, opt_canned, _opt_alphaHelper) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;
        _page = 0;
        _ended = false;
        _loading = true;
        _loadGeneration++;
        _loadingRequestCount = 0;

        AbortActiveSuggestionRequest();

        if (!_opt_alphaHelper) {
            ClearActiveBrowseLetter();
        }

        ResetLoadingState();

        //if an alpha recipe, allow the functionality of the "reveal more"
        if (_opt_alphaHelper) {
            $('#browse-show-obscure').removeAttr('disabled');
        } else {
            $('#browse-show-obscure').attr('disabled', true);
        }

        //include page on recipe, canned recipes are strings, normal are json
        if (!opt_canned && recipe) {
            recipe.page = _page;
        }

        _lastRecipe = {
            recipe: recipe,
            canned: opt_canned
        };

        Clear();

        FetchAndBuild(recipe, opt_canned, callback, _loadGeneration);
    };

    //load more is triggered when the loading sentinel gets close to the viewport
    this.LoadMore = function(callback) {

        //conditions for bail
        if (!_lastRecipe || _loading || _ended) {
            return false;
        }

        _loading = true;
        _page++; //pagination increases. only matters for non-randomized recipes

        if (!_lastRecipe.canned && _lastRecipe.recipe) {
            _lastRecipe.recipe.page = _page; //include new pagination on recipe
        }

        FetchAndBuild(_lastRecipe.recipe, _lastRecipe.canned, callback, _loadGeneration);
        return true;
    };

    this.MaybeLoadMore = function() {

        if (!_lastRecipe || _loading || _ended || !IsNearLoadTrigger()) {
            return false;
        }

        return self.LoadMore(function() {
            _Tooltips.Any();
        });
    };

    this.RefreshLayout = function() {
        RelayoutExistingItems();
    };

    var FetchAndBuild = function(recipe, opt_canned, callback, loadGeneration) {

        Fetch(recipe, function(err, suggestions) {

            if (loadGeneration !== _loadGeneration) {
                return CompleteRequest(callback, false, loadGeneration);
            }

            if (err) {
                _ended = true;
                _loading = false;
                return CompleteRequest(callback, true, loadGeneration);
            }

            Build(suggestions, function(batchSummary) {

                if (loadGeneration !== _loadGeneration) {
                    return CompleteRequest(callback, false, loadGeneration);
                }

                _loading = false;
                _ended = ShouldEndAfterBatch(batchSummary, recipe, opt_canned);

                CompleteRequest(callback, true, loadGeneration);
                ScheduleLoadCheck(loadGeneration);
            }, loadGeneration);

        }, opt_canned, loadGeneration);
    };

    var CompleteRequest = function(callback, invokeCallback, loadGeneration) {

        if (IsCurrentLoadGeneration(loadGeneration)) {
            _loadingRequestCount--;
            if (_loadingRequestCount < 0) {
                _loadingRequestCount = 0;
            }

            if (_loadingRequestCount < 1) {
                HideLoading();
            }
        }

        if (invokeCallback && callback && IsCurrentLoadGeneration(loadGeneration)) {
            callback();
        }
    };

    var Fetch = function(recipe, callback, opt_canned, loadGeneration) {

        _loadingRequestCount++;
        ShowLoading();

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;

        var request = null;

        if (opt_canned) {

            request = $.get('/suggest?rp=' + recipe, function(response) {
                ClearActiveSuggestionRequest(request);
                callback(null, DecodeResponse(response));
            }).fail(function(response) {
                ClearActiveSuggestionRequest(request);
                callback(response || true);
            });
        }
        else {
            var compressedRecipe = _Compression.Zip.json(recipe);

            request = $.post('/suggest', {
                'recipe': compressedRecipe

            }, function(response) {
                ClearActiveSuggestionRequest(request);
                callback(null, DecodeResponse(response));
            }).fail(function(response) {
                ClearActiveSuggestionRequest(request);
                callback(response || true);
            });
        }

        TrackActiveSuggestionRequest(request, loadGeneration);
        return request;
    };

    var TrackActiveSuggestionRequest = function(request, loadGeneration) {

        if (!IsCurrentLoadGeneration(loadGeneration) || !request || !request.abort) {
            return;
        }

        _activeSuggestionRequest = request;
    };

    var ClearActiveSuggestionRequest = function(request) {

        if (_activeSuggestionRequest === request) {
            _activeSuggestionRequest = null;
        }
    };

    var AbortActiveSuggestionRequest = function() {

        if (!_activeSuggestionRequest || !_activeSuggestionRequest.abort) {
            _activeSuggestionRequest = null;
            return;
        }

        try {
            _activeSuggestionRequest.abort();
        }
        catch (err) {
            // The request may already have completed or been canceled.
        }

        _activeSuggestionRequest = null;
    };

    var IsCurrentLoadGeneration = function(loadGeneration) {

        return loadGeneration === _loadGeneration;
    };

    var IsCurrentSuggestionItem = function($item, loadGeneration) {

        return IsCurrentLoadGeneration(loadGeneration) && $item && $item.data('suggestionLoadGeneration') === loadGeneration;
    };

    var DecodeResponse = function(response) {

        try {
            return _Compression.Out.json(response);
        }
        catch (err) {
            return [];
        }
    };

    var Clear = function() {

        CancelActiveSuggestionDrag();
        DestroyGridTooltips();

        for (var i = 0, len = _currentGameLinks.length; i < len; i++) {
            if (_currentGameLinks[i] && _currentGameLinks[i].DisableAllEvents) {
                _currentGameLinks[i].DisableAllEvents();
            }
            _currentGameLinks[i] = null;
        }
        _currentGameLinks = [];
        _renderedKeys = {};
        _renderSequence = 0;

        _grid.empty().height('');
        _columns = [];
        _columnHeights = [];
        _columnCount = 0;

        EnsureColumns();
    };

    var DestroyGridTooltips = function() {

        _grid.find('.tooltipstered').each(function() {
            try {
                _Tooltips.Destroy($(this));
            }
            catch (err) {
                // A tooltip may already be closing while a filter is changed.
            }
        });
    };

    var ClearActiveBrowseLetter = function() {

        $wrapper.find('div.suggestionsbar a.active')
            .removeClass('active')
            .removeAttr('aria-current');
    };

    var SetActiveBrowseLetter = function($link) {

        ClearActiveBrowseLetter();

        $link
            .addClass('active')
            .attr('aria-current', 'true');
    };

    var Build = function(suggestions, callback, loadGeneration) {

        var batchSummary = {
            received: suggestions ? suggestions.length : 0,
            prepared: 0,
            inserted: 0
        };

        if (!IsCurrentLoadGeneration(loadGeneration) || !suggestions || !suggestions.length) {
            return callback(batchSummary);
        }

        EnsureColumns();

        var items = [];

        for (var i = 0; i < suggestions.length; ++i) {
            var item = CreateSuggestionItem(suggestions[i], items.length, loadGeneration);

            if (item) {
                items.push(item);
                batchSummary.prepared++;
            }
        }

        if (!items.length) {
            return callback(batchSummary);
        }

        WaitForItemsAndInsert(items, batchSummary, callback, loadGeneration);
    };

    var CreateSuggestionItem = function(compressedGameKey, batchIndex, loadGeneration) {

        if (!IsCurrentLoadGeneration(loadGeneration)) {
            return null;
        }

        var gameKey = null;

        try {
            gameKey = _Compression.Decompress.gamekey(compressedGameKey);
        }
        catch (err) {
            return null;
        }

        if (!gameKey || !gameKey.gk || _renderedKeys[gameKey.gk]) {
            return null;
        }

        _renderedKeys[gameKey.gk] = true;

        var $griditem = $('<div class="grid-item suggestion-grid-item" />');
        $griditem.attr('data-gk', gameKey.gk);
        $griditem.attr('draggable', 'false');
        $griditem.data('suggestionSequence', _renderSequence++);
        $griditem.data('suggestionLoadGeneration', loadGeneration);
        $griditem.data('gameKey', gameKey);

        var onImageLoaded = function() {
            if (IsCurrentSuggestionItem($griditem, loadGeneration) && $griditem.parent().length) {
                ScheduleLayoutRefresh(loadGeneration);
            }
        };

        // Suggestions animate at the grid-item level, so disable the older
        // flip/turnstile image animation for this instance only.
        var gamelink = new cesGameLink(_config, _Media, _Tooltips, _Collections, gameKey, 'a', true, PlayGameHandler, onImageLoaded, false);
        _currentGameLinks.push(gamelink);

        $griditem.append(gamelink.GetDOM());

        return {
            $el: $griditem,
            batchIndex: batchIndex,
            ready: false,
            inserted: false
        };
    };

    var WaitForItemsAndInsert = function(items, batchSummary, callback, loadGeneration) {

        var nextToInsert = 0;
        var remaining = items.length;
        var finished = false;

        var finish = function() {

            if (finished) {
                return;
            }

            finished = true;
            callback(batchSummary);
        };

        var flushReadyItems = function() {

            if (finished) {
                return;
            }

            if (!IsCurrentLoadGeneration(loadGeneration)) {
                return finish();
            }

            while (nextToInsert < items.length && items[nextToInsert].ready) {
                if (InsertGridItem(items[nextToInsert].$el, items[nextToInsert].batchIndex, false, loadGeneration)) {
                    items[nextToInsert].inserted = true;
                    batchSummary.inserted++;
                }

                nextToInsert++;
                remaining--;
            }

            if (remaining < 1) {
                finish();
            }
        };

        for (var i = 0; i < items.length; ++i) {
            MarkItemReadyWhenImagesSettle(items[i], flushReadyItems, loadGeneration);
        }
    };

    var MarkItemReadyWhenImagesSettle = function(item, onReady, loadGeneration) {

        var done = false;
        var $images = item.$el.find('img');

        var markReady = function() {
            if (done) {
                return;
            }
            done = true;

            if (!IsCurrentLoadGeneration(loadGeneration)) {
                onReady();
                return;
            }

            item.ready = true;
            onReady();
        };

        if (!$images.length || !$.fn.imagesLoaded) {
            setTimeout(markReady, 0);
            return;
        }

        var timeout = setTimeout(markReady, _imageReadyTimeout);

        $images.imagesLoaded().always(function() {
            clearTimeout(timeout);
            markReady();
        });
    };

    var EnsureColumns = function() {

        var targetColumnCount = GetColumnCount();

        if (_columnCount === targetColumnCount && _columns.length === targetColumnCount) {
            return;
        }

        var existingItems = GetGridItemsInRenderOrder();

        $(existingItems).detach();
        _grid.empty();
        _columns = [];
        _columnHeights = [];
        _columnCount = targetColumnCount;

        for (var i = 0; i < _columnCount; i++) {
            var $column = $('<div class="suggestions-column" />');
            var width = (100 / _columnCount) + '%';

            $column.attr('data-suggestion-column', i);
            $column.css({
                'width': width,
                'max-width': width
            });

            _columns.push($column);
            _columnHeights.push(0);
            _grid.append($column);
        }

        for (var j = 0; j < existingItems.length; j++) {
            InsertGridItem($(existingItems[j]), 0, true);
        }
    };

    var GetColumnCount = function() {

        var gridWidth = $grid.width() || 0;
        var viewportWidth = window.innerWidth || $(window).width() || gridWidth;
        var availableWidth = gridWidth;

        if (viewportWidth && gridWidth) {
            availableWidth = Math.min(gridWidth, viewportWidth - 20);
        }

        if (availableWidth < 1) {
            availableWidth = _desktopColumnCount * _minimumColumnWidth;
        }

        var columnCount = Math.floor(availableWidth / _minimumColumnWidth);

        if (columnCount > _desktopColumnCount) {
            columnCount = _desktopColumnCount;
        }

        if (columnCount < 1) {
            columnCount = 1;
        }

        return columnCount;
    };

    var GetGridItemsInRenderOrder = function() {

        var items = _grid.find('.suggestion-grid-item').toArray();

        items.sort(function(a, b) {
            var aSequence = $(a).data('suggestionSequence') || 0;
            var bSequence = $(b).data('suggestionSequence') || 0;
            return aSequence - bSequence;
        });

        return items;
    };

    var InsertGridItem = function($item, batchIndex, skipAnimation, loadGeneration) {

        if (typeof loadGeneration !== 'undefined' && !IsCurrentSuggestionItem($item, loadGeneration)) {
            return false;
        }

        var columnIndex = GetShortestColumnIndex();

        if (!skipAnimation) {
            PrepareEntryAnimation($item, batchIndex);
        }

        _columns[columnIndex].append($item);
        _columnHeights[columnIndex] += GetItemHeight($item);

        return true;
    };

    var GetShortestColumnIndex = function() {

        var shortestIndex = 0;
        var shortestHeight = _columnHeights[0] || 0;

        for (var i = 1; i < _columnHeights.length; i++) {
            if (_columnHeights[i] < shortestHeight) {
                shortestIndex = i;
                shortestHeight = _columnHeights[i];
            }
        }

        return shortestIndex;
    };

    var GetItemHeight = function($item) {

        var height = $item.outerHeight(true) || 0;

        if (height < 1) {
            height = $item.find('img').first().height() || $item.height() || 0;
        }

        return height;
    };

    var PrepareEntryAnimation = function($item, batchIndex) {

        var delay = (batchIndex % _staggerWindow) * _staggerStepMs;

        $item
            .addClass('suggestion-card-enter')
            .css({
                '-webkit-animation-delay': delay + 'ms',
                'animation-delay': delay + 'ms'
            });

        setTimeout(function() {
            $item
                .removeClass('suggestion-card-enter')
                .css({
                    '-webkit-animation-delay': '',
                    'animation-delay': ''
                });
        }, delay + _enterAnimationMs);
    };

    var RelayoutExistingItems = function() {

        if (!_grid || !_grid.length) {
            return;
        }

        var existingItems = GetGridItemsInRenderOrder();
        var targetColumnCount = GetColumnCount();

        $(existingItems).detach();
        _grid.empty();
        _columns = [];
        _columnHeights = [];
        _columnCount = targetColumnCount;

        for (var i = 0; i < _columnCount; i++) {
            var $column = $('<div class="suggestions-column" />');
            var width = (100 / _columnCount) + '%';

            $column.attr('data-suggestion-column', i);
            $column.css({
                'width': width,
                'max-width': width
            });

            _columns.push($column);
            _columnHeights.push(0);
            _grid.append($column);
        }

        for (var j = 0; j < existingItems.length; j++) {
            InsertGridItem($(existingItems[j]), 0, true);
        }
    };

    var ScheduleLayoutRefresh = function(loadGeneration) {

        if (typeof loadGeneration !== 'undefined' && !IsCurrentLoadGeneration(loadGeneration)) {
            return;
        }

        if (_layoutRefreshHandler) {
            _layoutRefreshHandler(loadGeneration);
        }
    };

    var ShouldEndAfterBatch = function(batchSummary, recipe, opt_canned) {

        if (!batchSummary || batchSummary.received < 1) {
            return true;
        }

        if (batchSummary.inserted < 1) {
            return true;
        }

        if (!opt_canned && recipe && recipe.randomize === false) {
            var maximum = recipe.maximum || 80;

            if (batchSummary.received < maximum) {
                return true;
            }
        }

        return false;
    };

    var ShowLoading = function() {

        $loading
            .removeClass('suggestions-ended transparent')
            .empty()
            .css('background-image', 'url("' + _config.paths.images + '/' + _loadingIcon + '")')
            .cssAnimation($loadingAnimations[0], 1000, false, function() {
                $loading.cssAnimation($loadingAnimations[1], 1000, true);
            });
    };

    var HideLoading = function() {

        if (_ended) {
            ShowEndOfSuggestions();
            return;
        }

        $loading.addClass('transparent').cssAnimation($loadingAnimations[2], 1000);
    };

    var ResetLoadingState = function() {

        $loading
            .removeClass('suggestions-ended transparent')
            .empty()
            .css('background-image', 'url("' + _config.paths.images + '/' + _loadingIcon + '")');
    };

    var ShowEndOfSuggestions = function() {

        $loading
            .cssAnimation(null)
            .removeClass('transparent')
            .addClass('suggestions-ended')
            .css('background-image', 'none')
            .text('No more suggestions for this view.');
    };

    var IsNearLoadTrigger = function() {

        if (!$loading || !$loading.length) {
            return false;
        }

        var trigger = $loading[0];
        var windowHeight = window.innerHeight || $(window).height();

        if (trigger.getBoundingClientRect) {
            return trigger.getBoundingClientRect().top - windowHeight <= _loadMoreThreshold;
        }

        var scrollBottom = $(window).scrollTop() + windowHeight;
        return scrollBottom >= $(document).height() - _loadMoreThreshold;
    };

    var ScheduleLoadCheck = function(loadGeneration) {

        if (_ended || !IsCurrentLoadGeneration(loadGeneration)) {
            return;
        }

        setTimeout(function() {
            if (IsCurrentLoadGeneration(loadGeneration)) {
                self.MaybeLoadMore();
            }
        }, 120);
    };

    var CreateThrottle = function(fn, delay) {

        var lastRun = 0;
        var timer = null;

        return function() {
            var now = Date.now();
            var context = this;
            var args = arguments;
            var remaining = delay - (now - lastRun);

            if (remaining <= 0) {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                lastRun = now;
                fn.apply(context, args);
                return;
            }

            if (!timer) {
                timer = setTimeout(function() {
                    timer = null;
                    lastRun = Date.now();
                    fn.apply(context, args);
                }, remaining);
            }
        };
    };

    var RefreshSuggestionDragConfig = function() {

        var config;
        var threshold;
        var holdMs;

        if (!_Collections || typeof _Collections.GetSuggestionDragConfig !== 'function') {
            return;
        }

        config = _Collections.GetSuggestionDragConfig() || {};
        threshold = parseInt(config.threshold, 10);
        holdMs = parseInt(config.holdMs, 10);

        if (!isNaN(threshold) && threshold > 0) {
            _suggestionDragThreshold = threshold;
        }

        if (!isNaN(holdMs) && holdMs > 0) {
            _suggestionDragHoldMs = holdMs;
        }
    };

    var GetSuggestionDragEventCoordinates = function(e) {

        var original = e && (e.originalEvent || e) || {};
        var doc = document.documentElement || document.body;
        var body = document.body || { scrollLeft: 0, scrollTop: 0 };
        var pageX = original.pageX;
        var pageY = original.pageY;
        var clientX = original.clientX;
        var clientY = original.clientY;

        if ((pageX === undefined || pageY === undefined) && clientX !== undefined && clientY !== undefined) {
            pageX = clientX + (window.pageXOffset || doc.scrollLeft || body.scrollLeft || 0);
            pageY = clientY + (window.pageYOffset || doc.scrollTop || body.scrollTop || 0);
        }

        return {
            pageX: pageX || 0,
            pageY: pageY || 0,
            clientX: clientX || 0,
            clientY: clientY || 0
        };
    };

    var GetSuggestionGameKey = function($item) {

        var gameKey;
        var gk;

        if (!$item || !$item.length) {
            return null;
        }

        gameKey = $item.data('gameKey');

        if (gameKey && gameKey.gk) {
            return gameKey;
        }

        gk = $item.data('gk') || $item.attr('data-gk');

        if (!gk) {
            return null;
        }

        return {
            gk: gk
        };
    };

    var IsSuggestionDragInteractiveTarget = function(target) {

        return $(target).closest('button, input, textarea, select, option, .button, .game-tooltip-action, .tooltipster-box, .tooltipster-content').length > 0;
    };

    var CanStartSuggestionDrag = function($item, e) {

        var original = e.originalEvent || e;
        var pointerType = original.pointerType;

        if (_suggestionDragState) {
            return false;
        }

        if (!_Collections || typeof _Collections.CommitSuggestionDrop !== 'function' || typeof _Collections.UpdateSuggestionDropPreview !== 'function') {
            return false;
        }

        if (!$item || !$item.length || !$item.hasClass('suggestion-grid-item')) {
            return false;
        }

        if (!GetSuggestionGameKey($item)) {
            return false;
        }

        if (original.isPrimary === false) {
            return false;
        }

        if (pointerType && pointerType !== 'mouse' && pointerType !== 'pen') {
            return false;
        }

        if ((original.button !== undefined && original.button !== 0) || (e.which && e.which !== 1)) {
            return false;
        }

        if (IsSuggestionDragInteractiveTarget(e.target)) {
            return false;
        }

        return true;
    };

    var SuppressNextSuggestionClick = function() {

        _suppressNextSuggestionClick = true;

        if (_suppressNextSuggestionClickTimer) {
            clearTimeout(_suppressNextSuggestionClickTimer);
        }

        _suppressNextSuggestionClickTimer = setTimeout(function() {
            _suppressNextSuggestionClick = false;
            _suppressNextSuggestionClickTimer = null;
        }, 450);
    };

    var BindSuggestionClickSuppressor = function() {

        if (!_grid || !_grid.length || _grid.data('suggestionClickSuppressorBound')) {
            return;
        }

        _grid[0].addEventListener('click', function(e) {
            if (!_suppressNextSuggestionClick) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (e.stopImmediatePropagation) {
                e.stopImmediatePropagation();
            }

            _suppressNextSuggestionClick = false;
        }, true);

        _grid.data('suggestionClickSuppressorBound', true);
    };

    var ClearSuggestionDragHoldTimer = function() {

        if (_suggestionDragState && _suggestionDragState.holdTimer) {
            clearTimeout(_suggestionDragState.holdTimer);
            _suggestionDragState.holdTimer = null;
        }
    };

    var MoveSuggestionDragClone = function(coords) {

        var state = _suggestionDragState;
        var left;
        var top;
        var transform;

        if (!state || !state.$clone || !state.$clone.length || !coords) {
            return;
        }

        left = coords.clientX - state.pointerOffsetX;
        top = coords.clientY - state.pointerOffsetY;
        transform = 'translate3d(' + Math.round(left) + 'px, ' + Math.round(top) + 'px, 0px)';

        state.$clone.css({
            '-webkit-transform': transform,
            '-moz-transform': transform,
            '-o-transform': transform,
            '-ms-transform': transform,
            transform: transform
        });
    };

    var CreateSuggestionDragClone = function(state, coords) {

        var $clone;

        if (!state || !state.$item || !state.$item.length || !_grid || !_grid.length) {
            return;
        }

        $clone = state.$item.clone(false, false);
        $clone.find('[id]').removeAttr('id');
        $clone.find('.zoom-down, .ces-game-tooltip-box-open')
            .removeClass('zoom-down ces-game-tooltip-box-open');
        $clone.find('.gamelink .box').first()
            .removeClass('zoom-down ces-game-tooltip-box-open')
            .addClass('zoom-on suggestion-drag-held-box');

        $clone
            .removeClass('suggestion-grid-item suggestion-card-enter ces-game-tooltip-origin-open')
            .addClass('suggestion-drag-clone')
            .attr('aria-hidden', 'true')
            .removeAttr('id')
            .removeAttr('aria-grabbed')
            .removeAttr('data-gk')
            .removeData('gameKey')
            .css({
                width: state.itemWidth + 'px',
                height: state.itemHeight + 'px',
                position: 'fixed',
                left: '0px',
                top: '0px',
                margin: '0px',
                zIndex: 100000,
                pointerEvents: 'none',
                visibility: 'visible'
            });

        _grid.append($clone);
        state.$clone = $clone;
        MoveSuggestionDragClone(coords);
    };

    var BeginSuggestionDrag = function(coords) {

        var state = _suggestionDragState;
        var rect;

        if (!state || state.dragging) {
            return;
        }

        coords = coords || state.lastCoords || {
            clientX: state.startClientX,
            clientY: state.startClientY,
            pageX: state.startX,
            pageY: state.startY
        };

        rect = state.$item[0].getBoundingClientRect();
        state.dragging = true;
        state.itemWidth = rect.width || rect.right - rect.left || state.$item.outerWidth();
        state.itemHeight = rect.height || rect.bottom - rect.top || state.$item.outerHeight();
        state.pointerOffsetX = coords.clientX - rect.left;
        state.pointerOffsetY = coords.clientY - rect.top;

        if (state.pointerOffsetX < 0 || state.pointerOffsetX > state.itemWidth) {
            state.pointerOffsetX = state.itemWidth / 2;
        }

        if (state.pointerOffsetY < 0 || state.pointerOffsetY > state.itemHeight) {
            state.pointerOffsetY = state.itemHeight / 2;
        }

        ClearSuggestionDragHoldTimer();
        SuppressNextSuggestionClick();

        try {
            _Tooltips.Close(state.$item.find('.gamelink .box').first());
        }
        catch (err) {

        }

        $('body').addClass('suggestion-drag-active');
        state.$item
            .addClass('suggestion-drag-source')
            .attr('aria-grabbed', 'true')
            .find('.gamelink .box')
            .removeClass('zoom-on zoom-down ces-game-tooltip-box-open');

        CreateSuggestionDragClone(state, coords);

        if (_Collections && typeof _Collections.UpdateSuggestionDropPreview === 'function') {
            _Collections.UpdateSuggestionDropPreview(state.gameKey, coords);
        }
    };

    var CleanupSuggestionDrag = function(options) {

        var state = _suggestionDragState;

        options = options || {};

        if (!state) {
            return;
        }

        ClearSuggestionDragHoldTimer();
        $(document).off(_suggestionDragNamespace);

        if (state.$clone) {
            state.$clone.remove();
            state.$clone = null;
        }

        if (state.$item && state.$item.length) {
            state.$item
                .removeClass('suggestion-drag-source')
                .removeAttr('aria-grabbed');
        }

        $('body').removeClass('suggestion-drag-active');

        if (!options.skipDropPreviewCleanup && _Collections && typeof _Collections.CancelSuggestionDropPreview === 'function') {
            _Collections.CancelSuggestionDropPreview();
        }

        _suggestionDragState = null;
    };

    var FinishSuggestionDrag = function(e, cancel) {

        var state = _suggestionDragState;
        var wasDragging;
        var committed = false;
        var coords;

        if (!state) {
            return;
        }

        wasDragging = state.dragging;
        coords = e && e.type !== 'keydown' ? GetSuggestionDragEventCoordinates(e) : state.lastCoords;
        state.lastCoords = coords || state.lastCoords;

        if (e && e.preventDefault && wasDragging) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (wasDragging && !cancel && _Collections && typeof _Collections.CommitSuggestionDrop === 'function') {
            committed = _Collections.CommitSuggestionDrop(state.gameKey, state.lastCoords);
        }

        if (wasDragging) {
            SuppressNextSuggestionClick();
        }

        CleanupSuggestionDrag({
            skipDropPreviewCleanup: committed
        });
    };

    var ContinueSuggestionDrag = function(e) {

        var state = _suggestionDragState;
        var original = e.originalEvent || e;
        var coords;
        var deltaX;
        var deltaY;

        if (!state) {
            return;
        }

        if (state.pointerId !== null && state.pointerId !== undefined && original.pointerId !== undefined && state.pointerId !== original.pointerId) {
            return;
        }

        coords = GetSuggestionDragEventCoordinates(e);
        state.lastCoords = coords;
        deltaX = coords.pageX - state.startX;
        deltaY = coords.pageY - state.startY;

        if (!state.dragging) {
            if (Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) < _suggestionDragThreshold) {
                return;
            }

            BeginSuggestionDrag(coords);
        }

        e.preventDefault();
        e.stopPropagation();
        MoveSuggestionDragClone(coords);

        if (_Collections && typeof _Collections.UpdateSuggestionDropPreview === 'function') {
            _Collections.UpdateSuggestionDropPreview(state.gameKey, coords);
        }
    };

    var CancelSuggestionDragOnEscape = function(e) {

        var key = e.which || e.keyCode;

        if (!_suggestionDragState || key !== 27) {
            return;
        }

        FinishSuggestionDrag(e, true);
    };

    var CancelActiveSuggestionDrag = function() {

        if (_suggestionDragState) {
            FinishSuggestionDrag(null, true);
        }
        else if (_Collections && typeof _Collections.CancelSuggestionDropPreview === 'function') {
            _Collections.CancelSuggestionDropPreview();
        }
    };

    var StartSuggestionDragPointer = function(e) {

        var $item = $(e.currentTarget);
        var original = e.originalEvent || e;
        var coords;

        if (e.type === 'mousedown' && window.PointerEvent) {
            return;
        }

        if (!CanStartSuggestionDrag($item, e)) {
            return;
        }

        RefreshSuggestionDragConfig();
        coords = GetSuggestionDragEventCoordinates(e);

        _suggestionDragState = {
            $item: $item,
            $clone: null,
            gameKey: GetSuggestionGameKey($item),
            startX: coords.pageX,
            startY: coords.pageY,
            startClientX: coords.clientX,
            startClientY: coords.clientY,
            lastCoords: coords,
            pointerId: original.pointerId,
            dragging: false,
            holdTimer: null,
            itemWidth: 0,
            itemHeight: 0,
            pointerOffsetX: 0,
            pointerOffsetY: 0
        };

        _suggestionDragState.holdTimer = setTimeout(function() {
            if (_suggestionDragState && _suggestionDragState.$item && _suggestionDragState.$item[0] === $item[0] && !_suggestionDragState.dragging) {
                BeginSuggestionDrag(_suggestionDragState.lastCoords);
            }
        }, _suggestionDragHoldMs);

        $(document)
            .off(_suggestionDragNamespace)
            .on('pointermove' + _suggestionDragNamespace, ContinueSuggestionDrag)
            .on('pointerup' + _suggestionDragNamespace, function(event) {
                FinishSuggestionDrag(event, false);
            })
            .on('pointercancel' + _suggestionDragNamespace, function(event) {
                FinishSuggestionDrag(event, true);
            })
            .on('mousemove' + _suggestionDragNamespace, ContinueSuggestionDrag)
            .on('mouseup' + _suggestionDragNamespace, function(event) {
                FinishSuggestionDrag(event, false);
            })
            .on('keydown' + _suggestionDragNamespace, CancelSuggestionDragOnEscape);
    };

    var BindSuggestionDragHandlers = function() {

        if (!_grid || !_grid.length) {
            return;
        }

        BindSuggestionClickSuppressor();

        _grid
            .off('pointerdown' + _suggestionDragNamespace)
            .on('pointerdown' + _suggestionDragNamespace, '.suggestion-grid-item', StartSuggestionDragPointer)
            .off('mousedown' + _suggestionDragNamespace)
            .on('mousedown' + _suggestionDragNamespace, '.suggestion-grid-item', StartSuggestionDragPointer)
            .off('dragstart' + _suggestionDragNamespace)
            .on('dragstart' + _suggestionDragNamespace, '.suggestion-grid-item, .suggestion-grid-item img', function(e) {
                e.preventDefault();
                return false;
            });
    };

    var SetupLoadTrigger = function() {

        if (window.IntersectionObserver && $loading.length) {
            _observer = new IntersectionObserver(function(entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].isIntersecting) {
                        self.MaybeLoadMore();
                        return;
                    }
                }
            }, {
                root: null,
                rootMargin: _loadMoreThreshold + 'px 0px',
                threshold: 0
            });

            _observer.observe($loading[0]);
        }
        else {
            _scrollHandler = CreateThrottle(function() {
                self.MaybeLoadMore();
            }, 140);

            $(window).off('scroll.cesSuggestions').on('scroll.cesSuggestions', _scrollHandler);
        }

        _resizeHandler = CreateThrottle(function() {
            RelayoutExistingItems();
            self.MaybeLoadMore();
        }, 180);

        $(window).off('resize.cesSuggestions').on('resize.cesSuggestions', _resizeHandler);
    };

    //constructor
    var Constructor = (function() {

        $loading = $('#suggestionsloading');
        _grid = $grid;
        _layoutRefreshHandler = CreateThrottle(function(loadGeneration) {
            if (typeof loadGeneration !== 'undefined' && !IsCurrentLoadGeneration(loadGeneration)) {
                return;
            }

            RelayoutExistingItems();
        }, 120);

        ResetLoadingState();
        EnsureColumns();
        SetupLoadTrigger();
        RefreshSuggestionDragConfig();
        BindSuggestionDragHandlers();

        var $checkbox = $('#browse-show-obscure');

        //for browsing with alpha characters
        $wrapper.find('div.suggestionsbar a').each(function(index, item) {
            $(item).off('click.cesSuggestionsBrowse').on('click.cesSuggestionsBrowse', function(e) {
                e.preventDefault();
                SetActiveBrowseLetter($(item));
                var system = $('#toolbar select').val();
                var term = $(item).text(); //is also cache name (A, B, #...)

                var all = {
                    systems: {},
                    randomize: false
                };
                var above = {
                    systems: {},
                    randomize: false
                };

                all.systems[system] = {
                    cache: 'alpha.all.' + term,
                    randomize: false
                };
                above.systems[system] = {
                    cache: 'alpha.above.' + term,
                    randomize: false
                };

                $checkbox.off('change.cesSuggestionsBrowse');
                $checkbox.on('change.cesSuggestionsBrowse', function() {
                    if($(this).is(':checked')) {
                        self.Load(all, function() {
                            _Tooltips.Any();
                        }, false, true);
                    }
                    else {
                        self.Load(above, function() {
                            _Tooltips.Any();
                        }, false, true);
                    }
                });

                self.Load($checkbox.is(':checked') ? all : above, function() {
                    _Tooltips.Any();
                }, false, true); //<-- canned no but alpha helper yes :)
            });
        });

    })();

    return this;

});
