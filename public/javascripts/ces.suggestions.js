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
    var _ended = false;
    var _observer = null;
    var _scrollHandler = null;
    var _resizeHandler = null;
    var _layoutRefreshHandler = null;

    this.Load = function(recipe, callback, opt_canned, _opt_alphaHelper) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;
        _page = 0;
        _ended = false;
        _loading = true;
        _loadGeneration++;

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
                return CompleteRequest(callback, false);
            }

            if (err) {
                _ended = true;
                _loading = false;
                return CompleteRequest(callback, true);
            }

            Build(suggestions, function(batchSummary) {

                if (loadGeneration !== _loadGeneration) {
                    return CompleteRequest(callback, false);
                }

                _loading = false;
                _ended = ShouldEndAfterBatch(batchSummary, recipe, opt_canned);

                CompleteRequest(callback, true);
                ScheduleLoadCheck();
            });

        }, opt_canned);
    };

    var CompleteRequest = function(callback, invokeCallback) {

        _loadingRequestCount--;
        if (_loadingRequestCount < 0) {
            _loadingRequestCount = 0;
        }

        if (_loadingRequestCount < 1) {
            HideLoading();
        }

        if (invokeCallback && callback) {
            callback();
        }
    };

    var Fetch = function(recipe, callback, opt_canned) {

        _loadingRequestCount++;
        ShowLoading();

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;

        if (opt_canned) {

            $.get('/suggest?rp=' + recipe, function(response) {
                callback(null, DecodeResponse(response));
            }).fail(function(response) {
                callback(response || true);
            });
        }
        else {
            var compressedRecipe = _Compression.Zip.json(recipe);

            $.post('/suggest', {
                'recipe': compressedRecipe

            }, function(response) {
                callback(null, DecodeResponse(response));
            }).fail(function(response) {
                callback(response || true);
            });
        }
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

    var Build = function(suggestions, callback) {

        var batchSummary = {
            received: suggestions ? suggestions.length : 0,
            prepared: 0,
            inserted: 0
        };

        if (!suggestions || !suggestions.length) {
            return callback(batchSummary);
        }

        EnsureColumns();

        var items = [];

        for (var i = 0; i < suggestions.length; ++i) {
            var item = CreateSuggestionItem(suggestions[i], items.length);

            if (item) {
                items.push(item);
                batchSummary.prepared++;
            }
        }

        if (!items.length) {
            return callback(batchSummary);
        }

        WaitForItemsAndInsert(items, batchSummary, callback);
    };

    var CreateSuggestionItem = function(compressedGameKey, batchIndex) {

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
        $griditem.data('suggestionSequence', _renderSequence++);

        var onImageLoaded = function() {
            if ($griditem.parent().length) {
                ScheduleLayoutRefresh();
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

    var WaitForItemsAndInsert = function(items, batchSummary, callback) {

        var nextToInsert = 0;
        var remaining = items.length;
        var finished = false;

        var flushReadyItems = function() {

            while (nextToInsert < items.length && items[nextToInsert].ready) {
                InsertGridItem(items[nextToInsert].$el, items[nextToInsert].batchIndex, false);
                items[nextToInsert].inserted = true;
                batchSummary.inserted++;
                nextToInsert++;
                remaining--;
            }

            if (remaining < 1 && !finished) {
                finished = true;
                callback(batchSummary);
            }
        };

        for (var i = 0; i < items.length; ++i) {
            MarkItemReadyWhenImagesSettle(items[i], flushReadyItems);
        }
    };

    var MarkItemReadyWhenImagesSettle = function(item, onReady) {

        var done = false;
        var $images = item.$el.find('img');

        var markReady = function() {
            if (done) {
                return;
            }
            done = true;
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

    var InsertGridItem = function($item, batchIndex, skipAnimation) {

        var columnIndex = GetShortestColumnIndex();

        if (!skipAnimation) {
            PrepareEntryAnimation($item, batchIndex);
        }

        _columns[columnIndex].append($item);
        _columnHeights[columnIndex] += GetItemHeight($item);
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

    var ScheduleLayoutRefresh = function() {

        if (_layoutRefreshHandler) {
            _layoutRefreshHandler();
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

    var ScheduleLoadCheck = function() {

        if (_ended) {
            return;
        }

        setTimeout(function() {
            self.MaybeLoadMore();
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
        _layoutRefreshHandler = CreateThrottle(function() {
            RelayoutExistingItems();
        }, 120);

        ResetLoadingState();
        EnsureColumns();
        SetupLoadTrigger();

        var $checkbox = $('#browse-show-obscure');

        //for browsing with alpha characters
        $wrapper.find('a').each(function(index, item) {
            $(item).on('click', function(e) {
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

                $checkbox.off('change');
                $checkbox.change(function() {
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
