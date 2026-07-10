var cesCollections = (function(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, _PlayGameHandler, _Logging, $collectionTitlesWrapper, $collectionNamesWrapper, _initialSyncPackage, copyToFeatured, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _titlesGrid = null;             //see constructor for assignment
    var _collectionsGrid = null;
    var _currentLoadingGame = null;
    var _baseUrl = '/collections';
    var _featureUrl = '/featured';
    var _copyToFeaturedButton = copyToFeatured;   //DISABLE FOR PROD. dont worry, end point protects on server too

    var _activeCollectionId = null;
    var _activeCollectionName = null;
    var _externalActiveCollection = null;
    var _TitlesSort = null;

    $collectionTitlesWrapper = $collectionTitlesWrapper && $collectionTitlesWrapper.length ? $collectionTitlesWrapper : $();
    $collectionNamesWrapper = $collectionNamesWrapper && $collectionNamesWrapper.length ? $collectionNamesWrapper : $();

    var _activeCollectionTitles = [];
    var _collectionNames = [];
    var _collectionControls = null;
    var $collectionHeaderWrapper = $('#collectionTitle');
    var $collectionsWrapper = $collectionTitlesWrapper.closest('#collectionsWrapper');
    var _isCollectionNameEditorOpen = false;

    var _collectionEnterAnimationMs = 260;
    var _collectionStaggerStepMs = 16;
    var _collectionStaggerMaxDelayMs = 320;
    var _collectionImageReadyTimeout = 6000;
    var _collectionFlourishLimit = 48;
    var _defaultCollectionName = '$';
    var _defaultCollectionDisplayName = 'My Collection';
    var _personalCollectionType = 'user';
    var _collectionOptionsTriggerSelector = '.collection-options-trigger';
    var _collectionOptionsDropdownSelector = '.collection-options-dropdown';
    var _collectionOptionsDropdownOpenClass = 'collection-options-dropdown-open';
    var _collectionOptionsDropdownClosingClass = 'collection-options-dropdown-closing';
    var _collectionOptionsDocumentNamespace = '.cesCollectionOptionsMenu';
    var _openCollectionOptionsDropdown = null;
    var _collectionOptionsDropdownAnimationMs = 130;
    var _collectionNameEditorSelector = '.collection-name-floating-editor';
    var _collectionNameEditorOpenClass = 'collection-name-floating-editor-open';
    var _collectionNameEditorAboveClass = 'collection-name-floating-editor-above';
    var _collectionNameEditorDocumentNamespace = '.cesCollectionNameEditor';
    var _openCollectionNameEditor = null;
    var _collectionToolsLockedClass = 'collection-tools-locked';
    var _collectionToolsStoragePrefix = 'ces.collections.toolsUnlocked.';
    var _collectionToolsStorageKey = null;
    var _collectionToolsUnlocked = false;
    var _featuredAvailable = false;
    var _siteStatisticCollectionsAvailable = false;
    var _isAdminActive = false;
    var _lastServerManagedCollectionsVisible = null;
    var _collectionPanelHeightReleaseTimer = null;
    var _collectionPanelImageReadyTimer = null;
    var _collectionTitlesResizeTimer = null;
    var _collectionPanelHeightTransitionToken = 0;
    var _collectionPanelHeightAnimationMs = 300;
    var _collectionPanelHeightReleaseBufferMs = 80;
    var _collectionPanelImageReadyMaxMs = 700;
    var _collectionTabRightGroupGap = 16;
    var _collectionTabsEnabledByConfig = !!(_config && _config.collections && _config.collections.renderCollectionTabs === true);
    var _renderCollectionTabs = _collectionTabsEnabledByConfig && $collectionNamesWrapper.length > 0;
    var _manualCollectionSort = 'manualOrder';
    var _collectionDragNamespace = '.collectionManualReorder';
    var _collectionDragState = null;
    var _collectionDragThreshold = 6;
    var _collectionDragHoldMs = 240;
    var _collectionDefaultLayoutDuration = 120;
    var _collectionDragLayoutDuration = 460;
    var _collectionDragSettleLayoutDuration = 320;
    var _collectionDragReflowMinInterval = 96;
    var _collectionDragLayoutThrottleMs = 90;
    var _collectionDragMoveEasing = 'cubic-bezier(.28,.08,.32,1)';
    var _collectionDragAdjacentDeadZoneRatio = 0.58;
    var _collectionDragFirstMoveGuardRatio = 0.42;
    var _collectionDragLayoutFrame = null;
    var _collectionDragLayoutTimer = null;
    var _collectionDragLastLayoutAt = 0;
    var _collectionDragVisualAnimationToken = 0;
    var _collectionDragVisualCleanupTimer = null;
    var _collectionDragSettleTimer = null;
    var _collectionDragPrimeTimer = null;
    var _manualCollectionInitialLayoutTimer = null;
    var _manualCollectionInitialLayoutToken = 0;
    var _manualCollectionInitialLayoutClass = 'collection-initial-layout-settling';
    var _manualCollectionShelfClass = 'collection-manual-shelf';
    var _suppressNextCollectionClick = false;
    var _suppressNextCollectionClickTimer = null;
    var _collectionOrderErrorTimer = null;
    var _collectionOrderSaveToken = 0;

    var RegisterCollectionShelfRowsLayout = function() {

        var IsotopeLayoutMode;
        var ShelfRows;
        var proto;

        if (!window.Isotope || !window.Isotope.LayoutMode) {
            return false;
        }

        IsotopeLayoutMode = window.Isotope.LayoutMode;

        if (IsotopeLayoutMode.modes && IsotopeLayoutMode.modes.collectionShelfRows) {
            return true;
        }

        ShelfRows = IsotopeLayoutMode.create('collectionShelfRows');
        proto = ShelfRows.prototype;

        proto._resetLayout = function() {

            this.x = 0;
            this.y = 0;
            this.maxY = 0;
            this.collectionShelfItemPositions = {};
            this.collectionShelfSequentialPositions = [];
            this.collectionShelfPositionIndex = 0;
            this._getMeasurement('gutter', 'outerWidth');
            this._measureCollectionShelfRows();
        };

        proto._measureCollectionShelfRows = function() {

            var items = (this.isotope && this.isotope.filteredItems) ? this.isotope.filteredItems : [];
            var containerWidth = (this.isotope && this.isotope.size) ? this.isotope.size.innerWidth : 0;
            var gutter = this.gutter || 0;
            var containerWithGutter = containerWidth + gutter;
            var maxItemsPerRow = parseInt(this.options && this.options.maxItemsPerRow, 10);
            var row = [];
            var rowX = 0;
            var rowY = 0;
            var rowHeight = 0;
            var flushRow;
            var item;
            var itemWidth;
            var itemHeight;
            var itemAdvance;
            var i;

            containerWidth = Math.max(0, containerWidth || 0);
            containerWithGutter = containerWidth + gutter;
            maxItemsPerRow = isNaN(maxItemsPerRow) || maxItemsPerRow < 1 ? 0 : maxItemsPerRow;

            flushRow = function(layoutMode) {

                var usedWidth;
                var rowOffset;
                var rowItem;
                var position;
                var j;

                if (!row.length) {
                    return;
                }

                usedWidth = rowX - gutter;
                usedWidth = usedWidth > 0 ? usedWidth : rowX;
                rowOffset = Math.max(0, Math.floor((containerWidth - usedWidth) / 2));

                for (j = 0; j < row.length; ++j) {
                    rowItem = row[j];
                    position = {
                        x: rowItem.x + rowOffset,
                        y: rowY
                    };

                    if (typeof rowItem.item.id !== 'undefined') {
                        layoutMode.collectionShelfItemPositions[rowItem.item.id] = position;
                    }

                    layoutMode.collectionShelfSequentialPositions.push(position);
                }

                rowY += rowHeight;
                layoutMode.maxY = Math.max(layoutMode.maxY, rowY);
                row = [];
                rowX = 0;
                rowHeight = 0;
            };

            for (i = 0; i < items.length; ++i) {

                item = items[i];

                item.getSize();
                itemWidth = item.size && item.size.outerWidth ? item.size.outerWidth : 0;
                itemHeight = item.size && item.size.outerHeight ? item.size.outerHeight : 0;
                itemAdvance = itemWidth + gutter;

                if (row.length && maxItemsPerRow && row.length >= maxItemsPerRow) {
                    flushRow(this);
                }

                if (row.length && rowX + itemAdvance > containerWithGutter) {
                    flushRow(this);
                }

                row.push({
                    item: item,
                    x: rowX
                });

                rowX += itemAdvance;
                rowHeight = Math.max(rowHeight, itemHeight);
            }

            flushRow(this);
        };

        proto._getItemLayoutPosition = function(item) {

            var position = null;

            if (item && typeof item.id !== 'undefined' && this.collectionShelfItemPositions) {
                position = this.collectionShelfItemPositions[item.id];
            }

            if (!position && this.collectionShelfSequentialPositions) {
                position = this.collectionShelfSequentialPositions[this.collectionShelfPositionIndex];
                this.collectionShelfPositionIndex++;
            }

            return position || {
                x: 0,
                y: 0
            };
        };

        proto._getContainerSize = function() {

            return {
                height: this.maxY
            };
        };

        return true;
    };

    var GetCollectionTitlesLayoutMode = function() {

        return RegisterCollectionShelfRowsLayout() ? 'collectionShelfRows' : 'fitRows';
    };

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        if (typeof sortAscending === 'undefined') {
            sortAscending = false;
        }

        //ensure data is up to date5
        _titlesGrid.isotope('updateSortData').isotope();

        _titlesGrid.isotope({
            sortBy: property,
            sortAscending: sortAscending,
        });
    };

    this.HasDefaultCollection = function() {
        return _collectionNames.length === 1 && _collectionNames[0].name === _defaultCollectionName;
    };

    this.HasNoCollections = function() {
        return _collectionNames.length === 0;
    };

    //do we meet the conditions for which the user has no games in their collection? (new user, etc)
    this.IsEmpty = function() {
        return (_self.HasNoCollections() && _activeCollectionTitles.length === 0) || (_self.HasDefaultCollection() && _activeCollectionTitles.length === 0);
    };

    //asked for by the featured component
    this.GetGrids = function() {
        return {
            collections: _collectionsGrid,
            titles: _titlesGrid
        };
    };

    this.SetCurrentGameLoading = function(gameKey) {
        _currentLoadingGame = gameKey;
    };

    this.RemoveCurrentGameLoading = function() {
        _currentLoadingGame = null;
    };

    //is allows the featured component to override any currently selected personal collection
    this.SetActiveCollectionId = function(id, opt_collection) {
        _activeCollectionId = id;
        _externalActiveCollection = opt_collection || null;
        RefreshManualReorderState();
        RenderCollectionHeader();
    };

    this.SetFeaturedAvailable = function(available) {
        _featuredAvailable = available === true;
        UpdateCollectionsWrapperEmptyState();
        ApplyCollectionToolsVisibility();
    };

    this.SetSiteStatisticCollectionsAvailable = function(available) {
        _siteStatisticCollectionsAvailable = available === true;
        UpdateCollectionsWrapperEmptyState();
        ApplyCollectionToolsVisibility();
    };

    this.CanShowCollectionRail = function() {
        return CanShowCollectionRail();
    };

    this.CanRenderCollectionTabs = function() {
        return CanRenderCollectionTabs();
    };

    this.CanShowServerManagedCollections = function() {
        return CanShowServerManagedCollections();
    };

    this.LayoutCollectionTabs = function(options) {
        LayoutCollectionTabs(options);
    };

    this.HoldCollectionPanelHeight = function() {
        HoldCollectionPanelHeight();
    };

    this.ReleaseCollectionPanelHeight = function(delay) {
        ReleaseCollectionPanelHeight(delay);
    };

    this.StartCollectionTitleEntry = function($griditem, batchIndex) {
        StartCollectionEntryWhenReady($griditem, batchIndex);
    };

    this.AddTitleWithoutPlaying = function(gameKey) {
        //use sync for outgoing. will update this object on response
        var url = _baseUrl + '/?gk=' + encodeURIComponent(gameKey.gk);
        _Sync.Put(url, function(data) {
            //sync will take care of updating the collection
        });
    };

    var BindKeyboardActivate = function($el, handler) {

        $el
            .off('click.collectionActivate keydown.collectionActivate')
            .on('click.collectionActivate', handler)
            .on('keydown.collectionActivate', function(e) {
                var key = e.which || e.keyCode;
                if (key === 13 || key === 32) {
                    e.preventDefault();
                    handler.call(this, e);
                }
            });
    };

    var CanRenderCollectionTabs = function() {

        return _renderCollectionTabs && _collectionsGrid && _collectionsGrid.length > 0;
    };

    var GetCollectionsWrapper = function() {

        if ($collectionsWrapper.length) {
            return $collectionsWrapper;
        }

        if ($collectionTitlesWrapper.length) {
            return $collectionTitlesWrapper.parent();
        }

        return $collectionNamesWrapper.parent();
    };

    var GetCollectionRail = function() {

        if (!_renderCollectionTabs || !$collectionNamesWrapper.length) {
            return $();
        }

        var $rail = $collectionNamesWrapper.closest('#collectionsRail');
        return $rail.length ? $rail : $collectionNamesWrapper.parent();
    };

    var IsRightAlignedCollectionTab = function($item) {

        return $item && $item.length && ($item.hasClass('collection-tab-featured') || $item.hasClass('collection-tab-site-statistic'));
    };

    var GetOrderedCollectionTabElements = function() {

        if (!CanRenderCollectionTabs()) {
            return [];
        }

        if ($.fn && $.fn.isotope && _collectionsGrid.data('isotope')) {
            try {
                return _collectionsGrid.isotope('getFilteredItemElements') || [];
            }
            catch (e) {

            }
        }

        return _collectionsGrid.children('.grid-item').toArray();
    };

    var MeasureCollectionTabs = function() {

        var groups = {
            left: [],
            right: [],
            leftWidth: 0,
            rightWidth: 0,
            itemCount: 0,
            maxHeight: 0
        };
        var elements = GetOrderedCollectionTabElements();

        $.each(elements, function(i, element) {
            var $item = $(element);
            var width;
            var height;
            var itemInfo;

            if (!$item.is(':visible')) {
                return;
            }

            width = Math.ceil($item.outerWidth(true));
            height = Math.ceil($item.outerHeight(true));
            itemInfo = {
                item: $item,
                width: width
            };

            groups.itemCount++;
            groups.maxHeight = Math.max(groups.maxHeight, height);

            if (IsRightAlignedCollectionTab($item)) {
                groups.right.push(itemInfo);
                groups.rightWidth += width;
            }
            else {
                groups.left.push(itemInfo);
                groups.leftWidth += width;
            }
        });

        return groups;
    };

    var GetCollectionTabsRequiredWidth = function(groups) {

        var splitGap = groups.left.length && groups.right.length ? _collectionTabRightGroupGap : 0;
        return groups.leftWidth + groups.rightWidth + splitGap + 2;
    };

    var StabilizeCollectionTabsWidth = function() {

        if (!CanRenderCollectionTabs()) {
            return;
        }

        var $rail = GetCollectionRail();
        var railWidth = $rail.length ? $rail.width() : 0;
        var groups = MeasureCollectionTabs();

        if (groups.itemCount < 1) {
            _collectionsGrid.css('width', '');
            return;
        }

        _collectionsGrid.css('width', Math.max(GetCollectionTabsRequiredWidth(groups), railWidth) + 'px');
    };

    var SetCollectionTabPosition = function($item, x, y) {

        $item.css({
            position: 'absolute',
            left: Math.max(0, Math.round(x)) + 'px',
            right: '',
            top: Math.max(0, Math.round(y)) + 'px',
            bottom: '',
            '-webkit-transform': '',
            '-moz-transform': '',
            '-ms-transform': '',
            '-o-transform': '',
            transform: ''
        });
    };

    var AlignCollectionTabGroups = function() {

        if (!CanRenderCollectionTabs()) {
            return;
        }

        var $rail = GetCollectionRail();
        var railWidth = $rail.length ? $rail.width() : 0;
        var groups = MeasureCollectionTabs();
        var gridWidth = Math.max(GetCollectionTabsRequiredWidth(groups), railWidth);
        var x = 0;
        var rightStart;

        if (groups.itemCount < 1) {
            _collectionsGrid.css({
                width: '',
                height: ''
            });
            return;
        }

        $.each(groups.left, function(i, itemInfo) {
            SetCollectionTabPosition(itemInfo.item, x, 0);
            x += itemInfo.width;
        });

        rightStart = groups.right.length ? Math.max(x + (groups.left.length ? _collectionTabRightGroupGap : 0), gridWidth - groups.rightWidth) : x;
        x = rightStart;

        $.each(groups.right, function(i, itemInfo) {
            SetCollectionTabPosition(itemInfo.item, x, 0);
            x += itemInfo.width;
        });

        _collectionsGrid.css({
            width: gridWidth + 'px',
            height: Math.max(groups.maxHeight, 1) + 'px'
        });
    };

    var LayoutCollectionTabs = function(options) {

        if (!CanRenderCollectionTabs()) {
            return;
        }

        StabilizeCollectionTabsWidth();

        if (options) {
            options = $.extend({ transitionDuration: 0 }, options);
            _collectionsGrid.isotope(options);
        }
        else {
            _collectionsGrid.isotope({ transitionDuration: 0 });
            _collectionsGrid.isotope('layout');
        }

        StabilizeCollectionTabsWidth();
        _collectionsGrid.isotope('layout');
        AlignCollectionTabGroups();
    };

    var PrefersReducedCollectionMotion = function() {

        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    var ClearCollectionPanelHeightTimers = function() {

        if (_collectionPanelHeightReleaseTimer) {
            clearTimeout(_collectionPanelHeightReleaseTimer);
            _collectionPanelHeightReleaseTimer = null;
        }

        if (_collectionPanelImageReadyTimer) {
            clearTimeout(_collectionPanelImageReadyTimer);
            _collectionPanelImageReadyTimer = null;
        }
    };

    var GetCollectionPanelCurrentHeight = function() {

        var currentHeight = 0;

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return currentHeight;
        }

        currentHeight = Math.ceil($collectionTitlesWrapper.outerHeight());

        return currentHeight > 0 ? currentHeight : 0;
    };

    var LayoutCollectionPanel = function() {

        if (!_titlesGrid || !_titlesGrid.length) {
            return;
        }

        if (IsActiveCollectionManualPersonalCollection()) {
            ApplyManualSortAndLayout({
                transitionDuration: IsManualCollectionInitialLayoutSettling() ? 0 : _collectionDefaultLayoutDuration,
                skipActiveTitleUpdate: true
            });
            return;
        }

        _titlesGrid.isotope('layout');
    };

    var CompleteCollectionPanelHeightRelease = function(token) {

        if (token && token !== _collectionPanelHeightTransitionToken) {
            return;
        }

        ClearCollectionPanelHeightTimers();

        $collectionTitlesWrapper
            .removeClass('collection-panel-height-held')
            .css({
                'min-height': '',
                'overflow': ''
            });

        LayoutCollectionPanel();
    };

    var HoldCollectionPanelHeight = function() {

        var currentHeight;

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        ClearCollectionPanelHeightTimers();
        _collectionPanelHeightTransitionToken++;

        if (PrefersReducedCollectionMotion()) {
            CompleteCollectionPanelHeightRelease(_collectionPanelHeightTransitionToken);
            return;
        }

        currentHeight = GetCollectionPanelCurrentHeight();

        if (currentHeight < 1) {
            return;
        }

        $collectionTitlesWrapper
            .removeClass('collection-panel-height-held')
            .css({
                'transition': 'none',
                '-webkit-transition': 'none',
                '-moz-transition': 'none',
                '-o-transition': 'none',
                'height': currentHeight + 'px',
                'min-height': '',
                'overflow': 'hidden'
            });

        if ($collectionTitlesWrapper[0]) {
            currentHeight = $collectionTitlesWrapper[0].offsetHeight;
        }

        $collectionTitlesWrapper
            .addClass('collection-panel-height-held')
            .css({
                'transition': '',
                '-webkit-transition': '',
                '-moz-transition': '',
                '-o-transition': ''
            });
    };

    var ReleaseCollectionPanelHeight = function(delay) {

        var token;
        var releaseScheduled = false;
        var scheduleRelease;
        var $images;

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        ClearCollectionPanelHeightTimers();
        LayoutCollectionPanel();

        delay = typeof delay === 'number' ? delay : (_collectionPanelHeightAnimationMs + _collectionPanelHeightReleaseBufferMs);

        if (PrefersReducedCollectionMotion() || !$collectionTitlesWrapper.hasClass('collection-panel-height-held')) {
            CompleteCollectionPanelHeightRelease(_collectionPanelHeightTransitionToken);
            return;
        }

        token = _collectionPanelHeightTransitionToken;

        scheduleRelease = function() {

            if (releaseScheduled || token !== _collectionPanelHeightTransitionToken) {
                return;
            }

            releaseScheduled = true;
            _collectionPanelHeightReleaseTimer = setTimeout(function() {
                CompleteCollectionPanelHeightRelease(token);
            }, delay);
        };

        $images = $collectionTitlesWrapper.find('img');

        if ($images.length && $.fn.imagesLoaded) {
            _collectionPanelImageReadyTimer = setTimeout(function() {
                _collectionPanelImageReadyTimer = null;
                LayoutCollectionPanel();
                scheduleRelease();
            }, _collectionPanelImageReadyMaxMs);

            $images.imagesLoaded()
                .progress(function() {
                    if (token === _collectionPanelHeightTransitionToken) {
                        LayoutCollectionPanel();
                    }
                })
                .always(function() {
                    if (token !== _collectionPanelHeightTransitionToken || releaseScheduled) {
                        return;
                    }

                    if (_collectionPanelImageReadyTimer) {
                        clearTimeout(_collectionPanelImageReadyTimer);
                        _collectionPanelImageReadyTimer = null;
                    }

                    LayoutCollectionPanel();
                    scheduleRelease();
                });
        }
        else {
            scheduleRelease();
        }
    };

    var ResolveCollectionNameEditorAnchor = function(mode, collection, $anchor) {

        if ($anchor && $anchor.length && $.contains(document, $anchor[0])) {
            return $anchor;
        }

        if (collection && collection.optionsTrigger && collection.optionsTrigger.length && $.contains(document, collection.optionsTrigger[0])) {
            return collection.optionsTrigger;
        }

        if (collection && collection.gridItem && collection.gridItem.length && $.contains(document, collection.gridItem[0])) {
            return collection.gridItem;
        }

        if (mode === 'create' && _collectionsGrid && _collectionsGrid.length) {
            var $add = _collectionsGrid.find('.collection-tab-add').first();
            if ($add.length) {
                return $add;
            }
        }

        if ($collectionNamesWrapper && $collectionNamesWrapper.length) {
            return $collectionNamesWrapper;
        }

        return $collectionHeaderWrapper;
    };

    var IsCollectionNameEditorTarget = function($target, open) {

        if (!$target || !$target.length) {
            return false;
        }

        if ($target.closest(_collectionNameEditorSelector).length || $target.closest(_collectionOptionsDropdownSelector).length || $target.closest(_collectionOptionsTriggerSelector).length) {
            return true;
        }

        if (open && open.$anchor && open.$anchor.length && ($target[0] === open.$anchor[0] || $.contains(open.$anchor[0], $target[0]))) {
            return true;
        }

        return false;
    };

    var PositionOpenCollectionNameEditor = function() {

        var open = _openCollectionNameEditor;
        var $editor;
        var $anchor;
        var anchorRect;
        var viewportWidth;
        var viewportHeight;
        var editorWidth;
        var editorHeight;
        var left;
        var top;
        var gap = 7;
        var margin = 8;
        var placedAbove = false;

        if (!open || !open.$editor || !open.$editor.length || !open.$anchor || !open.$anchor.length) {
            return;
        }

        if (!$.contains(document, open.$anchor[0])) {
            $anchor = ResolveCollectionNameEditorAnchor(open.mode, open.collection, null);
            if (!$anchor || !$anchor.length || !$.contains(document, $anchor[0])) {
                CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });
                return;
            }
            open.$anchor = $anchor;
        }

        $editor = open.$editor;
        $anchor = open.$anchor;
        anchorRect = $anchor[0].getBoundingClientRect();

        viewportWidth = window.innerWidth || document.documentElement.clientWidth || $(window).width();
        viewportHeight = window.innerHeight || document.documentElement.clientHeight || $(window).height();

        if ((anchorRect.width <= 0 && anchorRect.height <= 0) || anchorRect.right < 0 || anchorRect.left > viewportWidth || anchorRect.bottom < 0 || anchorRect.top > viewportHeight) {
            CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });
            return;
        }

        $editor.css('max-width', Math.max(220, viewportWidth - (margin * 2)) + 'px');

        editorWidth = Math.ceil($editor.outerWidth());
        editorHeight = Math.ceil($editor.outerHeight());
        left = anchorRect.left + (anchorRect.width / 2) - (editorWidth / 2);
        top = anchorRect.bottom + gap;

        if (left + editorWidth > viewportWidth - margin) {
            left = viewportWidth - editorWidth - margin;
        }

        if (left < margin) {
            left = margin;
        }

        if (top + editorHeight > viewportHeight - margin && anchorRect.top - editorHeight - gap > margin) {
            top = anchorRect.top - editorHeight - gap;
            placedAbove = true;
        }
        else if (top + editorHeight > viewportHeight - margin) {
            top = Math.max(margin, viewportHeight - editorHeight - margin);
        }

        $editor
            .toggleClass(_collectionNameEditorAboveClass, placedAbove)
            .css({
                left: Math.round(left) + 'px',
                top: Math.round(top) + 'px'
            });
    };

    var BindCollectionNameEditorDocumentHandlers = function() {

        $(document)
            .off('keydown' + _collectionNameEditorDocumentNamespace)
            .on('keydown' + _collectionNameEditorDocumentNamespace, function(e) {
                var key = e.which || e.keyCode;
                if (key === 27) {
                    e.preventDefault();
                    CloseCollectionNameEditor({ restoreFocus: true });
                }
            })
            .off('click' + _collectionNameEditorDocumentNamespace)
            .on('click' + _collectionNameEditorDocumentNamespace, function(e) {
                var open = _openCollectionNameEditor;
                var $target = $(e.target);

                if (!open || IsCollectionNameEditorTarget($target, open)) {
                    return;
                }

                CloseCollectionNameEditor();
            });

        $(window)
            .off('resize' + _collectionNameEditorDocumentNamespace + ' scroll' + _collectionNameEditorDocumentNamespace)
            .on('resize' + _collectionNameEditorDocumentNamespace + ' scroll' + _collectionNameEditorDocumentNamespace, function() {
                PositionOpenCollectionNameEditor();
            });

        GetCollectionRail()
            .off('scroll' + _collectionNameEditorDocumentNamespace)
            .on('scroll' + _collectionNameEditorDocumentNamespace, function() {
                PositionOpenCollectionNameEditor();
            });
    };

    var CloseCollectionNameEditor = function(opt_options) {

        var options = opt_options || {};
        var open = _openCollectionNameEditor;
        var $restoreFocus = open ? open.$anchor : null;

        _isCollectionNameEditorOpen = false;
        _openCollectionNameEditor = null;

        $(document).off(_collectionNameEditorDocumentNamespace);
        $(window).off(_collectionNameEditorDocumentNamespace);
        GetCollectionRail().off('scroll' + _collectionNameEditorDocumentNamespace);

        if (open && open.$editor && open.$editor.length) {
            DestroyTooltipsIn(open.$editor);
            open.$editor.remove();
        }

        $(_collectionNameEditorSelector).remove();

        if (!options.skipControlsUpdate && _collectionControls) {
            _collectionControls.Update();
        }

        if (!options.skipHeaderRender) {
            RenderCollectionHeader();
        }

        if (options.restoreFocus && $restoreFocus && $restoreFocus.length && $.contains(document, $restoreFocus[0])) {
            setTimeout(function() {
                $restoreFocus.focus();
            }, 0);
        }
    };

    var NormalizeCollectionNameForComparison = function(value) {

        return $.trim(String(value || '')).replace(/\s+/g, ' ').toLowerCase();
    };

    var ReadAdminActive = function() {

        if (window.cesAdmin && window.cesAdmin.IsActive) {
            return window.cesAdmin.IsActive() === true;
        }

        return $('body').hasClass('runtime-admin-active');
    };

    var HasServerManagedCollectionsAvailable = function() {

        return _featuredAvailable || _siteStatisticCollectionsAvailable;
    };

    var CanShowCollectionRail = function() {

        return CanRenderCollectionTabs() && CanShowCollectionTools();
    };

    var CanShowServerManagedCollections = function() {

        return CanRenderCollectionTabs() && CanShowCollectionRail();
    };

    var PublishServerManagedCollectionsVisibility = function() {

        var visible = CanShowServerManagedCollections();

        if (_lastServerManagedCollectionsVisible === visible) {
            return;
        }

        _lastServerManagedCollectionsVisible = visible;
        $(document).trigger('ces.collections.serverManagedVisibility', [visible]);
    };

    var UpdateCollectionsWrapperEmptyState = function() {

        var $wrapper = GetCollectionsWrapper();

        if (!$wrapper.length) {
            return;
        }

        $wrapper.toggleClass('collection-featured-available', HasServerManagedCollectionsAvailable());
        $wrapper.toggleClass('collection-site-statistics-available', _siteStatisticCollectionsAvailable);
        $wrapper.toggleClass('new-user', _self.IsEmpty());
    };

    var GetOrderedActiveCollectionGameKeys = function() {

        if (IsActiveCollectionManualPersonalCollection()) {
            return GetPersonalCollectionOrderFromDom();
        }

        var gridTitles = _titlesGrid ? _titlesGrid.isotope('getItemElements') : [];
        var gks = [];
        var seen = {};

        for (var i = 0, len = gridTitles.length; i < len; ++i) {
            var $gridTitle = $(gridTitles[i]);
            var gk = $gridTitle.data('gk');

            if ($gridTitle.data('type') === 'personal' && gk && !seen[gk]) {
                seen[gk] = true;
                gks.push(gk);
            }
        }

        if (gks.length < 1) {
            for (var j = 0, jlen = _activeCollectionTitles.length; j < jlen; ++j) {
                if (_activeCollectionTitles[j].gameKey && _activeCollectionTitles[j].gameKey.gk && !seen[_activeCollectionTitles[j].gameKey.gk]) {
                    seen[_activeCollectionTitles[j].gameKey.gk] = true;
                    gks.push(_activeCollectionTitles[j].gameKey.gk);
                }
            }
        }

        return gks;
    };

    var GetCurrentCollectionSortState = function() {

        if (IsActiveCollectionManualPersonalCollection()) {
            return {};
        }

        if (!_TitlesSort || !_TitlesSort.Get) {
            return {};
        }

        return _TitlesSort.Get();
    };

    var CanPublishCollection = function(collection) {

        return _isAdminActive &&
            collection &&
            collection.id &&
            _activeCollectionId === collection.id &&
            IsEditableCollection(collection) &&
            !IsDefaultCollection(collection) &&
            _activeCollectionTitles.length > 0;
    };

    var PublishCollection = function(collection, $button) {

        if (!CanPublishCollection(collection)) {
            return;
        }

        if ($button && $button.length) {
            $button.prop('disabled', true).addClass('saving').text('Publishing...');
        }

        var sortState = GetCurrentCollectionSortState();

        _Sync.Post(_featureUrl + '/publish', {
            c: collection.id,
            gks: GetOrderedActiveCollectionGameKeys(),
            sort: sortState.sort,
            asc: sortState.asc
        }, function(response) {
            if ($button && $button.length) {
                $button.prop('disabled', false).removeClass('saving').text('Publish as Featured');
            }

            CloseCollectionOptionsMenu(collection);
            RenderCollectionHeader();
        });
    };

    var RefreshAdminControls = function() {

        _isAdminActive = ReadAdminActive();

        if (_collectionNames && _collectionNames.length) {
            _self.PopulateCollections();
        }

        RenderCollectionHeader();
    };

    var SetCollectionToolsStorageKey = function(payload) {

        if (payload && payload.collectionToolsStorageKey) {
            _collectionToolsStorageKey = payload.collectionToolsStorageKey;
            _collectionToolsUnlocked = _collectionToolsUnlocked || LoadCollectionToolsUnlocked();
        }
    };

    var GetCollectionToolsStorageName = function() {

        if (!_collectionToolsStorageKey) {
            return null;
        }

        return _collectionToolsStoragePrefix + _collectionToolsStorageKey;
    };

    var LoadCollectionToolsUnlocked = function() {

        var storageName = GetCollectionToolsStorageName();

        if (!storageName) {
            return false;
        }

        try {
            return localStorage.getItem(storageName) === '1';
        }
        catch (err) {
            _Logging.Console('ces.collections', 'unable to read collection tools unlock flag', err);
        }

        return false;
    };

    var PersistCollectionToolsUnlocked = function() {

        var storageName = GetCollectionToolsStorageName();

        if (!storageName) {
            return;
        }

        try {
            localStorage.setItem(storageName, '1');
        }
        catch (err) {
            _Logging.Console('ces.collections', 'unable to persist collection tools unlock flag', err);
        }
    };

    var HasNamedPersonalCollection = function() {

        for (var i = 0, len = _collectionNames.length; i < len; ++i) {
            if (!IsDefaultCollection(_collectionNames[i])) {
                return true;
            }
        }

        return false;
    };

    var HasCollectionToolsUnlockThreshold = function() {

        if (_collectionNames.length >= 2) {
            return true;
        }

        if (_self.HasDefaultCollection() && _activeCollectionTitles.length >= 2) {
            return true;
        }

        // A named single collection means the user has already crossed the collection-management
        // threshold in an earlier session or browser, even if the local unlock flag is unavailable.
        if (HasNamedPersonalCollection()) {
            return true;
        }

        return false;
    };

    var IsSingleGameDefaultCollection = function() {

        return _self.HasDefaultCollection() && _activeCollectionTitles.length <= 1;
    };

    var UpdateCollectionToolsUnlocked = function() {

        if (_collectionToolsUnlocked || _self.HasNoCollections()) {
            return;
        }

        if (HasCollectionToolsUnlockThreshold()) {
            _collectionToolsUnlocked = true;
            PersistCollectionToolsUnlocked();
        }
    };

    var CanShowCollectionTools = function() {

        if (_self.IsEmpty()) {
            return false;
        }

        // A single game in the starter/default collection is not yet a meaningful
        // collection-management state. Keep the name/create affordance hidden even
        // if a prior local unlock flag exists for this browser.
        if (IsSingleGameDefaultCollection()) {
            return false;
        }

        return _collectionToolsUnlocked || HasCollectionToolsUnlockThreshold();
    };

    var ApplyCollectionToolsVisibility = function() {

        var showTools = CanShowCollectionTools();
        var tabsRendered = CanRenderCollectionTabs();
        var showRail = tabsRendered && CanShowCollectionRail();
        var $wrapper = GetCollectionsWrapper();
        var $rail = $collectionNamesWrapper.closest('#collectionsRail');
        var wasLocked = $wrapper.length && $wrapper.hasClass(_collectionToolsLockedClass);

        if ($wrapper.length) {
            $wrapper.toggleClass('collection-tabs-disabled', !tabsRendered);
            $wrapper.toggleClass('collection-featured-available', HasServerManagedCollectionsAvailable());
            $wrapper.toggleClass('collection-site-statistics-available', _siteStatisticCollectionsAvailable);
            $wrapper.toggleClass(_collectionToolsLockedClass, !showTools && !_self.IsEmpty());
        }

        if ($rail.length) {
            $rail.attr('aria-hidden', showRail ? 'false' : 'true');
        }

        PublishServerManagedCollectionsVisibility();

        if (!showTools || !tabsRendered) {
            CloseCollectionOptionsMenus();
            if (_isCollectionNameEditorOpen || _openCollectionNameEditor) {
                CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });
            }
            DestroyTooltipsIn($collectionHeaderWrapper);
            $collectionHeaderWrapper.empty();
        }
        else if ((wasLocked || showRail) && _collectionsGrid && _collectionsGrid.length) {
            LayoutCollectionTabs();
        }
    };

    var DestroyTooltipsIn = function($el) {

        var openDropdownTrigger = _openCollectionOptionsDropdown ? _openCollectionOptionsDropdown.$trigger : null;

        if (!$el || !$el.length) {
            return;
        }

        if (openDropdownTrigger && openDropdownTrigger.length && ($el[0] === openDropdownTrigger[0] || $.contains($el[0], openDropdownTrigger[0]))) {
            CloseCollectionOptionsDropdown({ animate: false });
        }

        $el.find('.tooltipstered').each(function() {
            try {
                $(this).tooltipster('destroy');
            }
            catch (err) {
                _Logging.Console('ces.collections', 'unable to destroy nested tooltip', err);
            }
        });

        _Tooltips.Destroy($el);
    };

    var GetCollectionOptionsTriggers = function() {

        var $scope = (_collectionsGrid && _collectionsGrid.length) ? _collectionsGrid : $collectionNamesWrapper;
        return $scope.find(_collectionOptionsTriggerSelector);
    };

    var SetCollectionOptionsTriggerOpenState = function($trigger, isOpen, $menu) {

        if (!$trigger || !$trigger.length) {
            return;
        }

        $trigger
            .toggleClass('collection-options-trigger-open', !!isOpen)
            .attr('aria-expanded', isOpen ? 'true' : 'false');

        if (isOpen && $menu && $menu.length && $menu.attr('id')) {
            $trigger.attr('aria-controls', $menu.attr('id'));
        }
        else {
            $trigger.removeAttr('aria-controls');
        }
    };

    var GetCollectionOptionsMenuId = function(collection) {

        var id = collection && collection.id ? collection.id : 'current';
        return 'collectionOptionsMenu_' + String(id).replace(/[^A-Za-z0-9_-]/g, '_');
    };

    var GetFocusableCollectionOptions = function($menu) {

        if (!$menu || !$menu.length) {
            return $();
        }

        return $menu.find('.collection-options-menu-item').filter(':visible:not(:disabled)');
    };

    var FocusCollectionOptionsItem = function($menu, index) {

        var $items = GetFocusableCollectionOptions($menu);

        if (!$items.length) {
            return;
        }

        if (index < 0) {
            index = $items.length - 1;
        }
        else if (index >= $items.length) {
            index = 0;
        }

        $items.eq(index).focus();
    };

    var BindCollectionOptionsMenuKeyboard = function($menu) {

        $menu
            .off('keydown.collectionOptionsMenu')
            .on('keydown.collectionOptionsMenu', function(e) {

                var key = e.which || e.keyCode;
                var $items;
                var itemElements;
                var currentIndex;
                var nextIndex;

                if (key === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    CloseCollectionOptionsMenus(null, { restoreFocus: true });
                    return;
                }

                if (key !== 38 && key !== 40 && key !== 36 && key !== 35) {
                    return;
                }

                $items = GetFocusableCollectionOptions($menu);

                if (!$items.length) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                itemElements = $items.toArray();
                currentIndex = $.inArray(document.activeElement, itemElements);

                if (key === 36) {
                    nextIndex = 0;
                }
                else if (key === 35) {
                    nextIndex = $items.length - 1;
                }
                else if (currentIndex < 0) {
                    nextIndex = key === 38 ? $items.length - 1 : 0;
                }
                else {
                    nextIndex = key === 38 ? currentIndex - 1 : currentIndex + 1;
                }

                FocusCollectionOptionsItem($menu, nextIndex);
            });
    };

    var RemoveCollectionOptionsDropdownElement = function($menu, animate) {

        var closeTimer;

        if (!$menu || !$menu.length) {
            return;
        }

        closeTimer = $menu.data('collectionOptionsCloseTimer');

        if (closeTimer) {
            clearTimeout(closeTimer);
            $menu.removeData('collectionOptionsCloseTimer');
        }

        if (animate === false) {
            $menu.remove();
            return;
        }

        $menu
            .removeClass(_collectionOptionsDropdownOpenClass)
            .addClass(_collectionOptionsDropdownClosingClass);

        closeTimer = setTimeout(function() {
            $menu.remove();
        }, _collectionOptionsDropdownAnimationMs);

        $menu.data('collectionOptionsCloseTimer', closeTimer);
    };

    var CloseCollectionOptionsDropdown = function(opt_options) {

        var options = opt_options || {};
        var open = _openCollectionOptionsDropdown;
        var $trigger;

        if (!open) {
            $(_collectionOptionsDropdownSelector).remove();
            return;
        }

        _openCollectionOptionsDropdown = null;
        $trigger = open.$trigger;

        SetCollectionOptionsTriggerOpenState($trigger, false);
        RemoveCollectionOptionsDropdownElement(open.$menu, options.animate);

        if (options.restoreFocus && $trigger && $trigger.length && $.contains(document, $trigger[0])) {
            setTimeout(function() {
                $trigger.focus();
            }, 0);
        }
    };

    var PositionOpenCollectionOptionsDropdown = function() {

        var open = _openCollectionOptionsDropdown;
        var $menu;
        var triggerRect;
        var viewportWidth;
        var viewportHeight;
        var menuWidth;
        var menuHeight;
        var left;
        var top;
        var gap = 6;
        var margin = 8;
        var placedAbove = false;

        if (!open || !open.$trigger || !open.$trigger.length || !open.$menu || !open.$menu.length) {
            return;
        }

        if (!$.contains(document, open.$trigger[0])) {
            CloseCollectionOptionsDropdown({ animate: false });
            return;
        }

        $menu = open.$menu;
        triggerRect = open.$trigger[0].getBoundingClientRect();

        if ((triggerRect.width <= 0 && triggerRect.height <= 0) || triggerRect.bottom < 0 || triggerRect.top > (window.innerHeight || $(window).height())) {
            CloseCollectionOptionsDropdown({ animate: false });
            return;
        }

        viewportWidth = window.innerWidth || document.documentElement.clientWidth || $(window).width();
        viewportHeight = window.innerHeight || document.documentElement.clientHeight || $(window).height();

        if (triggerRect.right < 0 || triggerRect.left > viewportWidth) {
            CloseCollectionOptionsDropdown({ animate: false });
            return;
        }

        $menu.css('max-height', Math.max(120, viewportHeight - (margin * 2)) + 'px');

        menuWidth = $menu.outerWidth();
        menuHeight = $menu.outerHeight();
        left = triggerRect.right - menuWidth;
        top = triggerRect.bottom + gap;

        if (left + menuWidth > viewportWidth - margin) {
            left = viewportWidth - menuWidth - margin;
        }

        if (left < margin) {
            left = margin;
        }

        if (top + menuHeight > viewportHeight - margin && triggerRect.top - menuHeight - gap > margin) {
            top = triggerRect.top - menuHeight - gap;
            placedAbove = true;
        }
        else if (top + menuHeight > viewportHeight - margin) {
            top = Math.max(margin, viewportHeight - menuHeight - margin);
        }

        $menu
            .toggleClass('collection-options-dropdown-above', placedAbove)
            .css({
                left: Math.round(left) + 'px',
                top: Math.round(top) + 'px'
            });
    };

    var OpenCollectionOptionsDropdown = function(collection, $trigger, focusTarget) {

        var $menu;
        var focusIndex;

        if (!collection || !$trigger || !$trigger.length || !IsEditableCollection(collection)) {
            return;
        }

        if (_openCollectionOptionsDropdown && _openCollectionOptionsDropdown.$trigger && _openCollectionOptionsDropdown.$trigger[0] === $trigger[0]) {
            CloseCollectionOptionsDropdown();
            return;
        }

        if (_isCollectionNameEditorOpen || _openCollectionNameEditor) {
            CloseCollectionNameEditor({ skipHeaderRender: true });
        }

        CloseCollectionOptionsMenus(null, { animate: false });
        $(_collectionOptionsDropdownSelector).remove();

        $menu = GenerateCollectionOptionsDropdownContent(collection);
        $('body').append($menu);

        _openCollectionOptionsDropdown = {
            collection: collection,
            $trigger: $trigger,
            $menu: $menu
        };

        SetCollectionOptionsTriggerOpenState($trigger, true, $menu);
        BindCollectionOptionsMenuKeyboard($menu);
        PositionOpenCollectionOptionsDropdown();

        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function() {
                $menu.addClass(_collectionOptionsDropdownOpenClass);
            });
        }
        else {
            setTimeout(function() {
                $menu.addClass(_collectionOptionsDropdownOpenClass);
            }, 0);
        }

        if (focusTarget) {
            focusIndex = focusTarget === 'last' ? -1 : 0;
            setTimeout(function() {
                FocusCollectionOptionsItem($menu, focusIndex);
            }, 0);
        }
    };

    var CloseCollectionOptionsMenus = function($except, opt_options) {

        if (!_openCollectionOptionsDropdown || !$except || !$except.length || _openCollectionOptionsDropdown.$trigger[0] !== $except[0]) {
            CloseCollectionOptionsDropdown(opt_options);
        }

        GetCollectionOptionsTriggers().each(function() {
            var $trigger = $(this);

            if ($except && $except.length && $trigger[0] === $except[0]) {
                return;
            }

            _Tooltips.Close($trigger);
        });
    };

    var CloseCollectionOptionsMenu = function(collection, opt_options) {

        if (_openCollectionOptionsDropdown && collection && collection.optionsTrigger && collection.optionsTrigger.length && _openCollectionOptionsDropdown.$trigger[0] === collection.optionsTrigger[0]) {
            CloseCollectionOptionsDropdown(opt_options);
        }
        else if (_openCollectionOptionsDropdown && collection && _openCollectionOptionsDropdown.collection && _openCollectionOptionsDropdown.collection.id === collection.id) {
            CloseCollectionOptionsDropdown(opt_options);
        }

        if (collection && collection.optionsTrigger && collection.optionsTrigger.length) {
            _Tooltips.Close(collection.optionsTrigger);
        }
        else if (collection && collection.gridItem && collection.gridItem.length) {
            _Tooltips.Close(collection.gridItem);
        }
    };

    var BindCollectionOptionsDocumentHandlers = function() {

        if (!CanRenderCollectionTabs()) {
            return;
        }

        $(document)
            .off('keyup' + _collectionOptionsDocumentNamespace)
            .off('keydown' + _collectionOptionsDocumentNamespace)
            .on('keydown' + _collectionOptionsDocumentNamespace, function(e) {
                if (e.which === 27) {
                    CloseCollectionOptionsMenus(null, { restoreFocus: true });
                }
            })
            .off('click' + _collectionOptionsDocumentNamespace)
            .on('click' + _collectionOptionsDocumentNamespace, function(e) {

                var $target = $(e.target);

                if ($target.closest(_collectionOptionsTriggerSelector).length || $target.closest(_collectionOptionsDropdownSelector).length || $target.closest('.tooltipster-base').length) {
                    return;
                }

                CloseCollectionOptionsMenus();
            });

        $(window)
            .off('resize' + _collectionOptionsDocumentNamespace + ' scroll' + _collectionOptionsDocumentNamespace)
            .on('resize' + _collectionOptionsDocumentNamespace + ' scroll' + _collectionOptionsDocumentNamespace, function() {
                PositionOpenCollectionOptionsDropdown();
            });

        var $rail = GetCollectionRail();
        if ($rail.length) {
            $rail
                .off('scroll' + _collectionOptionsDocumentNamespace)
                .on('scroll' + _collectionOptionsDocumentNamespace, function() {
                    PositionOpenCollectionOptionsDropdown();
                });
        }
    };

    var BindCollectionOptionsTrigger = function(collection) {

        if (!collection || !collection.optionsTrigger || !collection.optionsTrigger.length) {
            return;
        }

        collection.optionsTrigger
            .off('click.collectionOptionsTrigger keydown.collectionOptionsTrigger')
            .on('click.collectionOptionsTrigger', function(e) {
                e.preventDefault();
                e.stopPropagation();
                OpenCollectionOptionsDropdown(collection, $(this));
            })
            .on('keydown.collectionOptionsTrigger', function(e) {

                var key = e.which || e.keyCode;

                if (key === 13 || key === 32 || key === 40 || key === 38) {
                    e.preventDefault();
                    e.stopPropagation();
                    OpenCollectionOptionsDropdown(collection, $(this), key === 38 ? 'last' : 'first');
                }
                else if (key === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    CloseCollectionOptionsMenus(null, { restoreFocus: true });
                }
            });
    };

    var BindTooltipAction = function($el, handler) {

        $el.attr('role', 'menuitem').attr('tabindex', '0');
        BindKeyboardActivate($el, handler);
    };

    var IsDefaultCollection = function(collection) {
        return collection && collection.name === _defaultCollectionName;
    };

    var IsEditableCollection = function(collection) {

        if (!collection) {
            return false;
        }

        if (collection.editable === false || collection.readOnly === true) {
            return false;
        }

        if (collection.type === 'featured' || collection.type === 'server' || collection.type === 'site-statistic' || collection.name === '!') {
            return false;
        }

        return true;
    };

    var GetCollectionDisplayName = function(collection) {

        if (!collection) {
            return _defaultCollectionDisplayName;
        }

        if (IsDefaultCollection(collection)) {
            return _defaultCollectionDisplayName;
        }

        if (collection.name === '!') {
            return 'Featured Collection';
        }

        return collection.name || _defaultCollectionDisplayName;
    };

    var FindActiveCollection = function() {

        if (_externalActiveCollection && _externalActiveCollection.id === _activeCollectionId) {
            return _externalActiveCollection;
        }

        for (var i = 0, len = _collectionNames.length; i < len; ++i) {
            if (_collectionNames[i].id === _activeCollectionId) {
                return _collectionNames[i];
            }
        }

        if (_activeCollectionId && _activeCollectionName && _collectionNames.length > 0) {
            return {
                id: _activeCollectionId,
                name: _activeCollectionName,
                type: _personalCollectionType,
                editable: true
            };
        }

        return null;
    };

    var IsActiveCollectionManualPersonalCollection = function() {

        var collection = FindActiveCollection();

        return !!(_activeCollectionId && !_externalActiveCollection && IsEditableCollection(collection));
    };

    var GetManualOrderValue = function(value, fallback) {

        value = parseInt(value, 10);
        fallback = parseInt(fallback, 10);

        if (isNaN(value)) {
            return isNaN(fallback) ? 0 : fallback;
        }

        return value;
    };

    var ApplyManualOrderDataToGridItem = function($griditem, manualOrder) {

        manualOrder = GetManualOrderValue(manualOrder, 0);

        $griditem
            .data('manualOrder', manualOrder)
            .attr('data-manual-order', manualOrder);
    };

    var SortActiveCollectionTitlesByManualOrder = function() {

        _activeCollectionTitles.sort(function(a, b) {

            var aOrder = GetManualOrderValue(a.manualOrder, 0);
            var bOrder = GetManualOrderValue(b.manualOrder, 0);
            var aTie = GetManualOrderValue(a.manualTieBreak, aOrder);
            var bTie = GetManualOrderValue(b.manualTieBreak, bOrder);

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            return aTie - bTie;
        });
    };

    var ApplyManualSortAndLayout = function(options) {

        var layoutOptions;

        if (!_titlesGrid || !$collectionTitlesWrapper.length) {
            return;
        }

        options = options || {};
        layoutOptions = {
            sortBy: _manualCollectionSort,
            sortAscending: true,
            transitionDuration: typeof options.transitionDuration !== 'undefined' ? options.transitionDuration : _collectionDefaultLayoutDuration
        };

        if (_collectionDragState && _collectionDragState.dragging) {
            layoutOptions.transitionDuration = 0;
        }

        if (IsManualCollectionInitialLayoutSettling()) {
            layoutOptions.transitionDuration = 0;
        }

        _titlesGrid.isotope('updateSortData');
        _titlesGrid.isotope(layoutOptions);
    };

    var GetPersonalCollectionItemsInDomOrder = function() {

        if (!$collectionTitlesWrapper.length) {
            return $();
        }

        return $collectionTitlesWrapper.children('.collection-grid-item').not('.collection-reorder-drag-clone').filter(function() {
            var $item = $(this);

            /*
             * Isotope can leave just-removed items in the DOM while removal
             * transitions finish. PopulateTitles marks those nodes active=0, so
             * exclude them from the persisted order payload.
             */
            return $item.data('type') === 'personal' && $item.data('active') !== 0;
        });
    };

    var NormalizeClientTitleId = function(value) {

        var n;

        if (typeof value === 'number') {
            n = value;
        }
        else if (typeof value === 'string' && $.trim(value) !== '') {
            n = parseInt(value, 10);
        }
        else {
            return null;
        }

        if (!isFinite(n) || n < 1 || Math.floor(n) !== n) {
            return null;
        }

        return n;
    };

    var GetActiveCollectionOrderInfo = function() {

        var result = {
            gameKeys: [],
            titleIds: [],
            gameKeySet: {},
            titleIdSet: {}
        };
        var activeTitle;
        var gk;
        var titleId;

        for (var i = 0, len = _activeCollectionTitles.length; i < len; ++i) {
            activeTitle = _activeCollectionTitles[i];
            gk = activeTitle && activeTitle.gameKey && activeTitle.gameKey.gk;
            titleId = NormalizeClientTitleId(activeTitle && activeTitle.titleId);

            if (gk && !result.gameKeySet[gk]) {
                result.gameKeySet[gk] = true;
                result.gameKeys.push(gk);
            }

            if (titleId !== null && !result.titleIdSet[titleId]) {
                result.titleIdSet[titleId] = true;
                result.titleIds.push(titleId);
            }
        }

        return result;
    };

    var GetPersonalCollectionOrderFromDom = function(options) {

        var gks = [];
        var seen = {};
        var activeInfo;
        var filterToActive;
        var appendMissingActive;

        options = options || {};
        activeInfo = GetActiveCollectionOrderInfo();
        filterToActive = options.filterToActive !== false && activeInfo.gameKeys.length > 0;
        appendMissingActive = options.appendMissingActive !== false;

        GetPersonalCollectionItemsInDomOrder().each(function() {

            var gk = $(this).data('gk');

            if (!gk || seen[gk]) {
                return;
            }

            if (filterToActive && !activeInfo.gameKeySet[gk]) {
                return;
            }

            seen[gk] = true;
            gks.push(gk);
        });

        if (appendMissingActive) {
            for (var i = 0, len = activeInfo.gameKeys.length; i < len; ++i) {
                if (!seen[activeInfo.gameKeys[i]]) {
                    seen[activeInfo.gameKeys[i]] = true;
                    gks.push(activeInfo.gameKeys[i]);
                }
            }
        }

        return gks;
    };

    var GetPersonalCollectionTitleIdOrderFromDom = function(options) {

        var titleIds = [];
        var seen = {};
        var activeInfo;
        var filterToActive;
        var appendMissingActive;
        var titleId;

        options = options || {};
        activeInfo = GetActiveCollectionOrderInfo();
        filterToActive = options.filterToActive !== false && activeInfo.titleIds.length > 0;
        appendMissingActive = options.appendMissingActive !== false;

        GetPersonalCollectionItemsInDomOrder().each(function() {
            titleId = NormalizeClientTitleId($(this).data('titleId'));

            if (titleId === null || seen[titleId]) {
                return;
            }

            if (filterToActive && !activeInfo.titleIdSet[titleId]) {
                return;
            }

            seen[titleId] = true;
            titleIds.push(titleId);
        });

        if (appendMissingActive) {
            for (var i = 0, len = activeInfo.titleIds.length; i < len; ++i) {
                if (!seen[activeInfo.titleIds[i]]) {
                    seen[activeInfo.titleIds[i]] = true;
                    titleIds.push(activeInfo.titleIds[i]);
                }
            }
        }

        return titleIds;
    };

    var AreCollectionOrdersEqual = function(first, second) {

        first = first || [];
        second = second || [];

        if (first.length !== second.length) {
            return false;
        }

        for (var i = 0, len = first.length; i < len; ++i) {
            if (first[i] !== second[i]) {
                return false;
            }
        }

        return true;
    };

    var ApplyManualOrderToActiveTitlesFromDom = function() {

        var order = GetPersonalCollectionOrderFromDom();
        var orderByGk = {};
        var activeTitle;
        var i;

        for (i = 0; i < order.length; ++i) {
            orderByGk[order[i]] = i;
        }

        for (i = 0; i < _activeCollectionTitles.length; ++i) {
            activeTitle = _activeCollectionTitles[i];

            if (activeTitle.gameKey && orderByGk.hasOwnProperty(activeTitle.gameKey.gk)) {
                activeTitle.manualOrder = orderByGk[activeTitle.gameKey.gk];
                activeTitle.manualTieBreak = orderByGk[activeTitle.gameKey.gk];
            }
        }

        SortActiveCollectionTitlesByManualOrder();
    };

    var UpdateManualOrderDataFromDomOnly = function() {

        GetPersonalCollectionItemsInDomOrder().each(function(index) {
            ApplyManualOrderDataToGridItem($(this), index);
        });
    };

    var ApplyManualOrderDataFromDom = function(options) {

        options = options || {};

        UpdateManualOrderDataFromDomOnly();

        if (!options.skipActiveTitleUpdate) {
            ApplyManualOrderToActiveTitlesFromDom();
        }

        ApplyManualSortAndLayout(options);
    };

    var GetCollectionDragNow = function() {

        return Date.now ? Date.now() : new Date().getTime();
    };

    var GetCollectionDragAnimationItems = function($scope) {

        var $items;

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return $();
        }

        if ($scope && $scope.length) {
            $items = $scope.filter('.collection-grid-item').add($scope.find('.collection-grid-item'));
        }
        else {
            $items = GetPersonalCollectionItemsInDomOrder();
        }

        return $items
            .not('.collection-reorder-drag-clone')
            .not('.collection-reorder-placeholder')
            .filter(function() {
                return $(this).data('type') === 'personal';
            });
    };

    var GetCollectionDragVisualElement = function(item) {

        var $item = $(item);
        var $visual = $item.find('.gamelink').first();

        return $visual.length ? $visual : $item;
    };

    var CaptureCollectionDragVisualRects = function($scope) {

        var rects = {};

        GetCollectionDragAnimationItems($scope).each(function() {

            var $item = $(this);
            var gk = $item.data('gk');
            var visual = GetCollectionDragVisualElement(this)[0];

            if (!gk || !visual || !visual.getBoundingClientRect) {
                return;
            }

            rects[gk] = visual.getBoundingClientRect();
        });

        return rects;
    };

    var ClearCollectionDragVisualCleanupTimer = function() {

        if (_collectionDragVisualCleanupTimer) {
            clearTimeout(_collectionDragVisualCleanupTimer);
            _collectionDragVisualCleanupTimer = null;
        }
    };

    var ClearCollectionDragVisualAnimationStyles = function() {

        ClearCollectionDragVisualCleanupTimer();

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        $collectionTitlesWrapper
            .find('.collection-grid-item:not(.collection-reorder-drag-clone)')
            .removeClass('collection-reorder-visual-moving')
            .find('.gamelink')
            .css({
                '-webkit-transition': '',
                '-moz-transition': '',
                '-o-transition': '',
                transition: '',
                '-webkit-transform': '',
                '-moz-transform': '',
                '-o-transform': '',
                '-ms-transform': '',
                transform: '',
                willChange: ''
            });
    };

    var ForceCollectionDragReflow = function() {

        var element = $collectionTitlesWrapper && $collectionTitlesWrapper.length ? $collectionTitlesWrapper[0] : null;
        var unused;

        if (!element) {
            return;
        }

        unused = element.offsetHeight;
        return unused;
    };

    var ClearManualCollectionInitialLayoutTimer = function() {

        if (_manualCollectionInitialLayoutTimer) {
            clearTimeout(_manualCollectionInitialLayoutTimer);
            _manualCollectionInitialLayoutTimer = null;
        }
    };

    var ScheduleCollectionFrame = function(callback) {

        var schedule = window.requestAnimationFrame || function(fn) {
            return setTimeout(fn, 16);
        };

        return schedule(callback);
    };

    var UpdateManualCollectionShelfClass = function(isManualPersonalCollection) {

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        $collectionTitlesWrapper.toggleClass(_manualCollectionShelfClass, !!isManualPersonalCollection);
    };

    var IsManualCollectionInitialLayoutSettling = function() {

        return !!($collectionTitlesWrapper && $collectionTitlesWrapper.length && $collectionTitlesWrapper.hasClass(_manualCollectionInitialLayoutClass));
    };

    var CountManualCollectionGridMatches = function(gridTitles) {

        var activeKeys = {};
        var matches = 0;
        var activeTitle;
        var gk;
        var i;

        gridTitles = gridTitles || [];

        for (i = 0; i < _activeCollectionTitles.length; ++i) {
            activeTitle = _activeCollectionTitles[i];
            gk = activeTitle && activeTitle.gameKey && activeTitle.gameKey.gk;

            if (gk) {
                activeKeys[gk] = true;
            }
        }

        for (i = 0; i < gridTitles.length; ++i) {
            gk = $(gridTitles[i]).data('gk');

            if ($(gridTitles[i]).data('type') === 'personal' && gk && activeKeys[gk]) {
                matches++;
            }
        }

        return matches;
    };

    var ShouldSettleManualCollectionInitialLayout = function(gridTitles) {

        var matchingItems;

        if (!IsActiveCollectionManualPersonalCollection() || !$collectionTitlesWrapper.length) {
            return false;
        }

        if (!_activeCollectionTitles.length) {
            return false;
        }

        gridTitles = gridTitles || [];
        matchingItems = CountManualCollectionGridMatches(gridTitles);

        /*
         * On initial load, collection items are inserted one at a time. The
         * shelf row is centered after every insert, so the row offset changes
         * repeatedly while cards are being made visible. That produces the
         * one-time load "fan out / contract" spasm. Keep the manual shelf
         * hidden and transition-free when this render is a full hydration or a
         * collection replacement. Do not use it for a normal one-game append,
         * where most existing DOM items already match the active collection.
         */
        return matchingItems === 0 || matchingItems < Math.max(1, Math.floor(_activeCollectionTitles.length / 2));
    };

    var BeginManualCollectionInitialLayoutSettling = function() {

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length || !_titlesGrid) {
            return;
        }

        ClearManualCollectionInitialLayoutTimer();
        _manualCollectionInitialLayoutToken++;

        $collectionTitlesWrapper
            .addClass(_manualCollectionShelfClass)
            .addClass(_manualCollectionInitialLayoutClass)
            .addClass('collection-reorder-motion-quieted');

        ClearCollectionDragVisualAnimationStyles();
        _titlesGrid.isotope({ transitionDuration: 0 });

        _manualCollectionInitialLayoutTimer = setTimeout(function() {
            _manualCollectionInitialLayoutTimer = null;
            EndManualCollectionInitialLayoutSettling($(), _manualCollectionInitialLayoutToken, { force: true });
        }, 1600);
    };

    var StartDeferredCollectionEntryAnimations = function($items) {

        if (!$items || !$items.length) {
            return;
        }

        $items.each(function() {

            var $item = $(this);
            var batchIndex = $item.data('collectionEntryBatchIndex');

            $item.removeData('collectionEntryDeferred');
            $item.removeData('collectionEntryBatchIndex');

            if ($item.data('collectionEntryComplete')) {
                return;
            }

            StartCollectionEntryWhenReady($item, batchIndex);
        });
    };

    var EndManualCollectionInitialLayoutSettling = function($deferredEntryItems, token, options) {

        options = options || {};

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        if (!options.force && token && token !== _manualCollectionInitialLayoutToken) {
            return;
        }

        ClearManualCollectionInitialLayoutTimer();

        if ((!$deferredEntryItems || !$deferredEntryItems.length) && $collectionTitlesWrapper.length) {
            $deferredEntryItems = $collectionTitlesWrapper.find('.collection-grid-item').filter(function() {
                return $(this).data('collectionEntryDeferred') === true;
            });
        }

        if (IsActiveCollectionManualPersonalCollection() && _titlesGrid) {
            ApplyManualSortAndLayout({
                transitionDuration: 0,
                skipActiveTitleUpdate: true
            });
            ForceCollectionDragReflow();
            ClearCollectionDragVisualAnimationStyles();
            $collectionTitlesWrapper.addClass('collection-drag-layout-primed');
        }

        $collectionTitlesWrapper
            .removeClass(_manualCollectionInitialLayoutClass)
            .removeClass('collection-reorder-motion-quieted');

        StartDeferredCollectionEntryAnimations($deferredEntryItems);
    };

    var FinishManualCollectionInitialLayoutSettling = function($deferredEntryItems) {

        var token = _manualCollectionInitialLayoutToken;

        ScheduleCollectionFrame(function() {
            ScheduleCollectionFrame(function() {
                EndManualCollectionInitialLayoutSettling($deferredEntryItems, token);
            });
        });
    };

    var ClearManualCollectionDragPrimeTimer = function() {

        if (_collectionDragPrimeTimer) {
            clearTimeout(_collectionDragPrimeTimer);
            _collectionDragPrimeTimer = null;
        }
    };

    var PrimeManualCollectionDragLayout = function(options) {

        options = options || {};

        if (!IsActiveCollectionManualPersonalCollection() || !_titlesGrid || !$collectionTitlesWrapper.length) {
            return;
        }

        if (_collectionDragState && _collectionDragState.dragging && !options.allowDuringDrag) {
            return;
        }

        if (!options.allowDuringDrag && $collectionTitlesWrapper.find('.collection-grid-item.collection-card-awaiting-entry, .collection-grid-item.collection-card-enter').length) {
            ScheduleManualCollectionDragPrime(120);
            return;
        }

        ClearManualCollectionDragPrimeTimer();
        ClearCollectionDragVisualAnimationStyles();

        /*
         * First drag after a page load used to sample the cards while the
         * collection entry/lift animation and Isotope's first layout state were
         * still settling. That made the first FLIP pass animate every card from
         * stale positions, producing the one-time horizontal "spasm". Prime the
         * manual shelf by cancelling entry transforms and committing the current
         * Isotope slots without transition before drag hit-testing begins.
         */
        QuiesceCollectionDragChildAnimations(GetPersonalCollectionItemsInDomOrder(), { quietWrapper: false });
        ResetCollectionDragHoverState();
        ApplyManualSortAndLayout({
            transitionDuration: 0,
            skipActiveTitleUpdate: true
        });
        ForceCollectionDragReflow();
        ClearCollectionDragVisualAnimationStyles();
        $collectionTitlesWrapper.addClass('collection-drag-layout-primed');
    };

    var ScheduleManualCollectionDragPrime = function(delay) {

        if (!IsActiveCollectionManualPersonalCollection() || !$collectionTitlesWrapper.length) {
            ClearManualCollectionDragPrimeTimer();
            return;
        }

        ClearManualCollectionDragPrimeTimer();

        delay = typeof delay === 'number' ? delay : (_collectionStaggerMaxDelayMs + _collectionEnterAnimationMs + 180);

        _collectionDragPrimeTimer = setTimeout(function() {
            _collectionDragPrimeTimer = null;
            PrimeManualCollectionDragLayout();
        }, Math.max(0, delay));
    };

    var ApplyCollectionDragInstantLayout = function() {

        ApplyManualSortAndLayout({
            transitionDuration: 0,
            skipActiveTitleUpdate: true
        });
    };

    var AnimateCollectionDragVisualReflow = function(previousRects, options) {

        var duration;
        var token;
        var animations = [];
        var $animationItems;

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        options = options || {};
        duration = PrefersReducedCollectionMotion() ? 0 : (options.duration || _collectionDragLayoutDuration);
        token = ++_collectionDragVisualAnimationToken;
        $animationItems = options.items && options.items.length ? options.items : GetCollectionDragAnimationItems();

        ClearCollectionDragVisualCleanupTimer();

        GetCollectionDragAnimationItems($animationItems).each(function() {

            var $item = $(this);
            var gk = $item.data('gk');
            var previous = gk ? previousRects[gk] : null;
            var $visual = GetCollectionDragVisualElement(this);
            var current;
            var deltaX;
            var deltaY;
            var transform;

            if (!$visual.length) {
                return;
            }

            $item.removeClass('collection-reorder-visual-moving');
            $visual.css({
                '-webkit-transition': 'none',
                '-moz-transition': 'none',
                '-o-transition': 'none',
                transition: 'none',
                '-webkit-transform': 'none',
                '-moz-transform': 'none',
                '-o-transform': 'none',
                '-ms-transform': 'none',
                transform: 'none',
                willChange: ''
            });

            if (!previous || duration < 1) {
                return;
            }

            current = $visual[0].getBoundingClientRect();
            deltaX = previous.left - current.left;
            deltaY = previous.top - current.top;

            if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
                return;
            }

            transform = 'translate3d(' + Math.round(deltaX) + 'px, ' + Math.round(deltaY) + 'px, 0px)';

            $item.addClass('collection-reorder-visual-moving');
            $visual.css({
                '-webkit-transform': transform,
                '-moz-transform': transform,
                '-o-transform': transform,
                '-ms-transform': transform,
                transform: transform,
                willChange: 'transform'
            });

            animations.push($visual);
        });

        if (!animations.length || duration < 1) {
            return;
        }

        ForceCollectionDragReflow();

        for (var i = 0; i < animations.length; ++i) {
            animations[i].css({
                '-webkit-transition': '-webkit-transform ' + duration + 'ms ' + _collectionDragMoveEasing,
                '-moz-transition': '-moz-transform ' + duration + 'ms ' + _collectionDragMoveEasing,
                '-o-transition': '-o-transform ' + duration + 'ms ' + _collectionDragMoveEasing,
                transition: 'transform ' + duration + 'ms ' + _collectionDragMoveEasing,
                '-webkit-transform': 'translate3d(0px, 0px, 0px)',
                '-moz-transform': 'translate3d(0px, 0px, 0px)',
                '-o-transform': 'translate3d(0px, 0px, 0px)',
                '-ms-transform': 'translate3d(0px, 0px, 0px)',
                transform: 'translate3d(0px, 0px, 0px)'
            });
        }

        _collectionDragVisualCleanupTimer = setTimeout(function() {
            if (token === _collectionDragVisualAnimationToken) {
                ClearCollectionDragVisualAnimationStyles();
            }
        }, duration + 80);
    };

    var BeginCollectionDragSettling = function(duration) {

        duration = PrefersReducedCollectionMotion() ? 0 : (duration || _collectionDragSettleLayoutDuration);

        if (_collectionDragSettleTimer) {
            clearTimeout(_collectionDragSettleTimer);
            _collectionDragSettleTimer = null;
        }

        $('body').addClass('collection-reorder-settling');
        $collectionTitlesWrapper.addClass('collection-reorder-settling');

        _collectionDragSettleTimer = setTimeout(function() {
            $('body').removeClass('collection-reorder-settling');
            $collectionTitlesWrapper.removeClass('collection-reorder-settling');
            _collectionDragSettleTimer = null;
        }, duration + 90);
    };

    var ClearCollectionDragSettling = function() {

        if (_collectionDragSettleTimer) {
            clearTimeout(_collectionDragSettleTimer);
            _collectionDragSettleTimer = null;
        }

        $('body').removeClass('collection-reorder-settling');
        $collectionTitlesWrapper.removeClass('collection-reorder-settling');
    };

    var RemoveCollectionRuntimeAnimationClasses = function($element) {

        if (!$element || !$element.length) {
            return;
        }

        $element.each(function() {

            var $target = $(this);
            var classList = $target.attr('class') ? $target.attr('class').split(/\s+/) : [];
            var remove = [];

            $.each(classList, function(index, item) {
                if (/^anim-/.test(item)) {
                    remove.push(item);
                }
            });

            if (remove.length) {
                $target.removeClass(remove.join(' '));
            }

            if (this.style) {
                this.style.webkitAnimation = '';
                this.style.animation = '';
                this.style.webkitAnimationName = '';
                this.style.animationName = '';
                this.style.webkitAnimationDuration = '';
                this.style.animationDuration = '';
                this.style.webkitAnimationDelay = '';
                this.style.animationDelay = '';
                this.style.webkitAnimationIterationCount = '';
                this.style.animationIterationCount = '';
                this.style.webkitAnimationFillMode = '';
                this.style.animationFillMode = '';
            }
        });
    };

    var QuiesceCollectionDragChildAnimations = function($scope, options) {

        var $items;

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        options = options || {};
        $scope = $scope && $scope.length ? $scope : GetPersonalCollectionItemsInDomOrder();
        $items = $scope.filter('.collection-grid-item').add($scope.find('.collection-grid-item'));

        if (options.quietWrapper !== false) {
            $collectionTitlesWrapper.addClass('collection-reorder-motion-quieted');
        }

        $items
            .removeClass('collection-card-awaiting-entry collection-card-enter collection-card-enter-quiet')
            .each(function() {
                if (this.style && this.style.removeProperty) {
                    this.style.removeProperty('--collection-entry-delay');
                    this.style.removeProperty('--collection-sheen-delay');
                }
                $(this).data('collectionEntryComplete', true);
            });

        RemoveCollectionRuntimeAnimationClasses($scope.add($scope.find('*')));
    };

    var QueueCollectionDragLayoutFrame = function() {

        var schedule = window.requestAnimationFrame || function(callback) {
            return setTimeout(callback, 16);
        };

        if (_collectionDragLayoutFrame) {
            return;
        }

        _collectionDragLayoutFrame = schedule(function() {
            _collectionDragLayoutFrame = null;

            if (!_collectionDragState || !_collectionDragState.dragging) {
                return;
            }

            _collectionDragLastLayoutAt = GetCollectionDragNow();
            ApplyManualSortAndLayout({
                transitionDuration: PrefersReducedCollectionMotion() ? 0 : _collectionDragLayoutDuration
            });
        });
    };

    var CancelCollectionDragLayout = function() {

        if (_collectionDragLayoutFrame) {
            if (window.cancelAnimationFrame) {
                window.cancelAnimationFrame(_collectionDragLayoutFrame);
            }
            else {
                clearTimeout(_collectionDragLayoutFrame);
            }

            _collectionDragLayoutFrame = null;
        }

        if (_collectionDragLayoutTimer) {
            clearTimeout(_collectionDragLayoutTimer);
            _collectionDragLayoutTimer = null;
        }
    };

    var ScheduleCollectionDragLayout = function() {

        var now = GetCollectionDragNow();
        var elapsed = _collectionDragLastLayoutAt ? now - _collectionDragLastLayoutAt : _collectionDragLayoutThrottleMs;
        var delay = Math.max(0, _collectionDragLayoutThrottleMs - elapsed);

        if (_collectionDragLayoutFrame || _collectionDragLayoutTimer) {
            return;
        }

        if (delay > 0) {
            _collectionDragLayoutTimer = setTimeout(function() {
                _collectionDragLayoutTimer = null;
                QueueCollectionDragLayoutFrame();
            }, delay);
            return;
        }

        QueueCollectionDragLayoutFrame();
    };

    var ApplyManualOrderDataFromActiveTitles = function(options) {

        var itemsByGameKey = {};
        var activeTitle;
        var $griditem;
        var gk;
        var i;

        SortActiveCollectionTitlesByManualOrder();

        GetPersonalCollectionItemsInDomOrder().each(function() {
            var $item = $(this);
            var itemGameKey = $item.data('gk');

            if (itemGameKey) {
                itemsByGameKey[itemGameKey] = $item;
            }
        });

        for (i = 0; i < _activeCollectionTitles.length; ++i) {
            activeTitle = _activeCollectionTitles[i];
            gk = activeTitle.gameKey && activeTitle.gameKey.gk;

            if (!gk || !itemsByGameKey[gk]) {
                continue;
            }

            activeTitle.manualOrder = GetManualOrderValue(activeTitle.manualOrder, i);
            activeTitle.manualTieBreak = i;
            $griditem = itemsByGameKey[gk];
            ApplyManualOrderDataToGridItem($griditem, activeTitle.manualOrder);
            $collectionTitlesWrapper.append($griditem);
        }

        ApplyManualSortAndLayout(options);
    };

    var ReorderPersonalCollectionDom = function(order, options) {

        var applyOrder;

        options = options || {};
        order = order || [];

        applyOrder = function() {
            var itemsByGameKey = {};
            var appended = {};
            var $item;
            var gk;
            var i;

            GetPersonalCollectionItemsInDomOrder().each(function() {
                var $existing = $(this);
                var existingGameKey = $existing.data('gk');

                if (existingGameKey) {
                    itemsByGameKey[existingGameKey] = $existing;
                }
            });

            for (i = 0; i < order.length; ++i) {
                gk = order[i];
                $item = itemsByGameKey[gk];

                if ($item && $item.length && !appended[gk]) {
                    $collectionTitlesWrapper.append($item);
                    appended[gk] = true;
                }
            }

            GetPersonalCollectionItemsInDomOrder().each(function() {
                var $remaining = $(this);
                var remainingGameKey = $remaining.data('gk');

                if (remainingGameKey && !appended[remainingGameKey]) {
                    $collectionTitlesWrapper.append($remaining);
                    appended[remainingGameKey] = true;
                }
            });

            UpdateManualOrderDataFromDomOnly();
            ApplyManualOrderToActiveTitlesFromDom();
        };

        if (options.animate) {
            var previousRects = CaptureCollectionDragVisualRects();
            ClearCollectionDragVisualAnimationStyles();
            applyOrder();
            ApplyCollectionDragInstantLayout();
            AnimateCollectionDragVisualReflow(previousRects, {
                duration: typeof options.duration !== 'undefined' ? options.duration : _collectionDragSettleLayoutDuration
            });
            return;
        }

        applyOrder();
        ApplyManualSortAndLayout({
            transitionDuration: typeof options.transitionDuration !== 'undefined' ? options.transitionDuration : _collectionDefaultLayoutDuration
        });
    };

    var ShowCollectionOrderSaveError = function(message) {

        var $status;

        if (_collectionOrderErrorTimer) {
            clearTimeout(_collectionOrderErrorTimer);
            _collectionOrderErrorTimer = null;
        }

        if ($collectionsWrapper && $collectionsWrapper.length) {
            $status = $collectionsWrapper.find('#collectionOrderStatus');

            if (!$status.length) {
                $status = $('<div id="collectionOrderStatus" class="collection-order-status collection-order-status-error" role="status" aria-live="polite" />');
                $collectionTitlesWrapper.before($status);
            }

            $status.text(message).addClass('collection-order-status-visible');

            _collectionOrderErrorTimer = setTimeout(function() {
                $status.removeClass('collection-order-status-visible').empty();
                _collectionOrderErrorTimer = null;
            }, 4200);
        }

        if (_Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('ces.collections', message);
        }
        else if (window.console && window.console.log) {
            window.console.log(message);
        }
    };

    var SaveManualCollectionOrder = function(previousOrder) {

        var order = GetPersonalCollectionOrderFromDom();
        var titleIdOrder = GetPersonalCollectionTitleIdOrderFromDom();
        var saveToken = ++_collectionOrderSaveToken;

        $.ajax({
            url: _baseUrl + '/order',
            type: 'PATCH',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                c: _activeCollectionId,
                gks: order,
                tids: titleIdOrder
            })
        }).done(function(response) {
            if (!response || response.ok !== true) {
                if (saveToken === _collectionOrderSaveToken) {
                    ReorderPersonalCollectionDom(previousOrder, {
                        animate: true,
                        duration: _collectionDragSettleLayoutDuration
                    });
                    ShowCollectionOrderSaveError('Collection order could not be saved. The previous order was restored.');
                }
            }
        }).fail(function(xhr) {
            if (saveToken !== _collectionOrderSaveToken) {
                return;
            }

            ReorderPersonalCollectionDom(previousOrder, {
                animate: true,
                duration: _collectionDragSettleLayoutDuration
            });
            ShowCollectionOrderSaveError('Collection order could not be saved. The previous order was restored.');
        });
    };

    var SuppressNextCollectionClick = function() {

        _suppressNextCollectionClick = true;

        if (_suppressNextCollectionClickTimer) {
            clearTimeout(_suppressNextCollectionClickTimer);
        }

        _suppressNextCollectionClickTimer = setTimeout(function() {
            _suppressNextCollectionClick = false;
            _suppressNextCollectionClickTimer = null;
        }, 450);
    };

    var RefreshManualReorderState = function() {

        var manualPersonalCollection = IsActiveCollectionManualPersonalCollection();
        var enabled = manualPersonalCollection && _activeCollectionTitles.length > 1;

        if (!$collectionTitlesWrapper.length) {
            return;
        }

        UpdateManualCollectionShelfClass(manualPersonalCollection);
        $collectionTitlesWrapper.toggleClass('collection-manual-reorder-enabled', enabled);

        if (enabled) {
            ScheduleManualCollectionDragPrime();
        }
        else {
            ClearManualCollectionDragPrimeTimer();
            $collectionTitlesWrapper.removeClass('collection-drag-layout-primed');
        }

        if (!manualPersonalCollection) {
            ClearManualCollectionInitialLayoutTimer();
            $collectionTitlesWrapper
                .removeClass(_manualCollectionInitialLayoutClass)
                .removeClass('collection-reorder-motion-quieted');
        }

        if (!enabled && _collectionDragState) {
            FinishCollectionDrag(null, true);
        }
    };

    var BindManualCollectionClickSuppressor = function() {

        if (!$collectionTitlesWrapper.length || $collectionTitlesWrapper.data('collectionClickSuppressorBound')) {
            return;
        }

        $collectionTitlesWrapper[0].addEventListener('click', function(e) {
            if (!_suppressNextCollectionClick) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (e.stopImmediatePropagation) {
                e.stopImmediatePropagation();
            }

            _suppressNextCollectionClick = false;
        }, true);

        $collectionTitlesWrapper.data('collectionClickSuppressorBound', true);
    };

    var GetCollectionDragEventCoordinates = function(e) {

        var original = e.originalEvent || e;
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

    var ResetCollectionDragHoverState = function() {

        if (!$collectionTitlesWrapper || !$collectionTitlesWrapper.length) {
            return;
        }

        $collectionTitlesWrapper.find('.collection-grid-item:not(.collection-reorder-drag-clone) .gamelink .box')
            .removeClass('zoom-on zoom-down ces-game-tooltip-box-open');
        $collectionTitlesWrapper.find('.collection-grid-item:not(.collection-reorder-drag-clone)')
            .removeClass('ces-game-tooltip-origin-open');
    };

    var CanStartManualCollectionDrag = function($item, e) {

        var original = e.originalEvent || e;

        if (!IsActiveCollectionManualPersonalCollection()) {
            return false;
        }

        if (!$item || !$item.length || $item.data('type') !== 'personal' || $item.hasClass('collection-reorder-drag-clone')) {
            return false;
        }

        if (GetPersonalCollectionItemsInDomOrder().length < 2) {
            return false;
        }

        if (original.isPrimary === false) {
            return false;
        }

        if ((original.button !== undefined && original.button !== 0) || (e.which && e.which !== 1)) {
            return false;
        }

        if ($(e.target).closest('button, input, textarea, select, option, .button, .collection-options-trigger, .collection-options-dropdown').length) {
            return false;
        }

        return true;
    };

    var GetCollectionDragItemIndex = function($item) {

        var index = -1;

        if (!$item || !$item.length) {
            return index;
        }

        GetPersonalCollectionItemsInDomOrder().each(function(i) {
            if (this === $item[0]) {
                index = i;
                return false;
            }
        });

        return index;
    };

    var GetCollectionDragPointerCenter = function(coords) {

        var state = _collectionDragState;
        var itemWidth = state ? state.itemWidth || 0 : 0;
        var itemHeight = state ? state.itemHeight || 0 : 0;
        var offsetX = state ? state.pointerOffsetX || 0 : 0;
        var offsetY = state ? state.pointerOffsetY || 0 : 0;

        coords = coords || { clientX: 0, clientY: 0 };

        return {
            x: coords.clientX - offsetX + (itemWidth / 2),
            y: coords.clientY - offsetY + (itemHeight / 2)
        };
    };

    var GetCollectionDragSiblingElements = function() {

        var state = _collectionDragState;
        var items = [];

        GetPersonalCollectionItemsInDomOrder().each(function() {
            if (state && state.$item && this === state.$item[0]) {
                return;
            }

            items.push(this);
        });

        return items;
    };

    var GetCollectionDragShelfMetrics = function() {

        var state = _collectionDragState;
        var gridElement = $collectionTitlesWrapper && $collectionTitlesWrapper.length ? $collectionTitlesWrapper[0] : null;
        var gridRect = gridElement ? gridElement.getBoundingClientRect() : { left: 0, top: 0, width: 0 };
        var containerWidth = $collectionTitlesWrapper && $collectionTitlesWrapper.length ? ($collectionTitlesWrapper.innerWidth() || gridRect.width || 0) : 0;
        var itemWidth = state && state.itemWidth ? state.itemWidth : 0;
        var itemHeight = state && state.itemHeight ? state.itemHeight : 0;
        var itemsPerRow;

        if ((!itemWidth || itemWidth < 1) && state && state.$item && state.$item.length) {
            itemWidth = state.$item.outerWidth() || 1;
        }

        if ((!itemHeight || itemHeight < 1) && state && state.$item && state.$item.length) {
            itemHeight = state.$item.outerHeight() || 1;
        }

        itemWidth = itemWidth || 1;
        itemHeight = itemHeight || 1;
        containerWidth = containerWidth || itemWidth;
        itemsPerRow = Math.floor(containerWidth / itemWidth);
        itemsPerRow = Math.max(1, Math.min(10, itemsPerRow || 1));

        return {
            left: gridRect.left || 0,
            top: gridRect.top || 0,
            width: containerWidth,
            itemWidth: itemWidth,
            itemHeight: itemHeight,
            itemsPerRow: itemsPerRow
        };
    };

    var GetCollectionDragSlotCenter = function(index, totalItems, metrics) {

        var rowIndex;
        var rowStart;
        var rowItemCount;
        var rowOffset;
        var slotInRow;

        if (!metrics || totalItems < 1) {
            return { x: 0, y: 0, rowIndex: 0 };
        }

        if (index < 0) {
            index = 0;
        }

        if (index >= totalItems) {
            index = totalItems - 1;
        }

        rowIndex = Math.floor(index / metrics.itemsPerRow);
        rowStart = rowIndex * metrics.itemsPerRow;
        rowItemCount = Math.min(metrics.itemsPerRow, totalItems - rowStart);
        rowOffset = Math.max(0, Math.floor((metrics.width - (rowItemCount * metrics.itemWidth)) / 2));
        slotInRow = index - rowStart;

        return {
            x: metrics.left + rowOffset + (slotInRow * metrics.itemWidth) + (metrics.itemWidth / 2),
            y: metrics.top + (rowIndex * metrics.itemHeight) + (metrics.itemHeight / 2),
            rowIndex: rowIndex
        };
    };

    var ApplyCollectionDragInsertionDeadZone = function(insertionIndex, coords, metrics, totalItems) {

        var state = _collectionDragState;
        var currentIndex;
        var center;
        var currentSlot;
        var targetSlot;
        var moveX;
        var moveY;
        var moveDistance;
        var adjacentThreshold;
        var firstMoveThreshold;

        if (!state || !state.dragging || !metrics || totalItems < 2) {
            return insertionIndex;
        }

        currentIndex = state.currentInsertionIndex;

        if (currentIndex === null || typeof currentIndex === 'undefined' || currentIndex < 0) {
            return insertionIndex;
        }

        if (insertionIndex < 0) {
            insertionIndex = 0;
        }

        if (insertionIndex >= totalItems) {
            insertionIndex = totalItems - 1;
        }

        if (insertionIndex === currentIndex) {
            return insertionIndex;
        }

        center = GetCollectionDragPointerCenter(coords);
        currentSlot = GetCollectionDragSlotCenter(currentIndex, totalItems, metrics);
        targetSlot = GetCollectionDragSlotCenter(insertionIndex, totalItems, metrics);

        moveX = coords.pageX - state.startX;
        moveY = coords.pageY - state.startY;
        moveDistance = Math.sqrt((moveX * moveX) + (moveY * moveY));

        /*
         * A one-pixel first movement should never generate a reorder. If a tiny
         * initial delta resolves as a multi-slot jump, that is stale first-load
         * geometry rather than user intent; holding the current slot prevents
         * the post-refresh shelf spasm.
         */
        firstMoveThreshold = Math.max(12, metrics.itemWidth * _collectionDragFirstMoveGuardRatio);
        if (!state.hasMovedPlaceholder && Math.abs(insertionIndex - currentIndex) > 1 && moveDistance < firstMoveThreshold) {
            return currentIndex;
        }

        if (Math.abs(insertionIndex - currentIndex) !== 1 || currentSlot.rowIndex !== targetSlot.rowIndex) {
            return insertionIndex;
        }

        adjacentThreshold = Math.max(18, metrics.itemWidth * _collectionDragAdjacentDeadZoneRatio);

        if (insertionIndex > currentIndex && center.x < currentSlot.x + adjacentThreshold) {
            return currentIndex;
        }

        if (insertionIndex < currentIndex && center.x > currentSlot.x - adjacentThreshold) {
            return currentIndex;
        }

        return insertionIndex;
    };

    var GetCollectionDragInsertionIndex = function(coords) {

        var center = GetCollectionDragPointerCenter(coords);
        var totalItems = GetPersonalCollectionItemsInDomOrder().length;
        var metrics;
        var rowCount;
        var rowIndex;
        var rowStart;
        var rowItemCount;
        var rowOffset;
        var slotCenterX;
        var rawInsertionIndex;
        var i;

        if (totalItems < 2) {
            return 0;
        }

        metrics = GetCollectionDragShelfMetrics();
        rowCount = Math.ceil(totalItems / metrics.itemsPerRow);

        if (center.y < metrics.top) {
            rowIndex = 0;
        }
        else {
            rowIndex = Math.floor((center.y - metrics.top) / metrics.itemHeight);
        }

        if (rowIndex < 0) {
            rowIndex = 0;
        }

        if (rowIndex >= rowCount) {
            rawInsertionIndex = totalItems - 1;
            return ApplyCollectionDragInsertionDeadZone(rawInsertionIndex, coords, metrics, totalItems);
        }

        rowStart = rowIndex * metrics.itemsPerRow;
        rowItemCount = Math.min(metrics.itemsPerRow, totalItems - rowStart);
        rowOffset = Math.max(0, Math.floor((metrics.width - (rowItemCount * metrics.itemWidth)) / 2));

        for (i = 0; i < rowItemCount; ++i) {
            slotCenterX = metrics.left + rowOffset + (i * metrics.itemWidth) + (metrics.itemWidth / 2);

            if (center.x < slotCenterX) {
                rawInsertionIndex = Math.min(totalItems - 1, rowStart + i);
                return ApplyCollectionDragInsertionDeadZone(rawInsertionIndex, coords, metrics, totalItems);
            }
        }

        rawInsertionIndex = Math.min(totalItems - 1, rowStart + rowItemCount);
        return ApplyCollectionDragInsertionDeadZone(rawInsertionIndex, coords, metrics, totalItems);
    };

    var CreateCollectionDragClone = function(state, coords) {

        var $clone;

        if (!state || !state.$item || !state.$item.length || !$collectionTitlesWrapper.length) {
            return;
        }

        $clone = state.$item.clone(false, false);
        QuiesceCollectionDragChildAnimations($clone);

        $clone.find('[id]').removeAttr('id');
        $clone.find('.zoom-down, .ces-game-tooltip-box-open')
            .removeClass('zoom-down ces-game-tooltip-box-open');
        $clone.find('.gamelink .box').first()
            .removeClass('zoom-down ces-game-tooltip-box-open')
            .addClass('zoom-on collection-reorder-held-box');

        $clone
            .removeClass('grid-item collection-card-awaiting-entry collection-card-enter collection-card-enter-quiet collection-reorder-placeholder collection-reorder-dragging ces-game-tooltip-origin-open')
            .addClass('collection-reorder-drag-clone')
            .attr('aria-hidden', 'true')
            .removeAttr('id')
            .removeAttr('aria-grabbed')
            .removeData('type')
            .removeData('gk')
            .removeData('manualOrder')
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

        $collectionTitlesWrapper.append($clone);
        state.$clone = $clone;
        MoveCollectionDragClone(coords);
    };

    var MoveCollectionDragClone = function(coords) {

        var state = _collectionDragState;
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

    var BeginCollectionDrag = function(coords) {

        var state = _collectionDragState;
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

        PrimeManualCollectionDragLayout({ allowDuringDrag: true });
        rect = state.$item[0].getBoundingClientRect();

        state.dragging = true;
        state.itemWidth = rect.width || rect.right - rect.left || state.$item.outerWidth();
        state.itemHeight = rect.height || rect.bottom - rect.top || state.$item.outerHeight();
        state.pointerOffsetX = coords.clientX - rect.left;
        state.pointerOffsetY = coords.clientY - rect.top;
        state.currentInsertionIndex = GetCollectionDragItemIndex(state.$item);

        if (state.pointerOffsetX < 0 || state.pointerOffsetX > state.itemWidth) {
            state.pointerOffsetX = state.itemWidth / 2;
        }

        if (state.pointerOffsetY < 0 || state.pointerOffsetY > state.itemHeight) {
            state.pointerOffsetY = state.itemHeight / 2;
        }

        if (state.holdTimer) {
            clearTimeout(state.holdTimer);
            state.holdTimer = null;
        }

        SuppressNextCollectionClick();

        try {
            _Tooltips.Close(state.$item);
        }
        catch (err) {

        }

        _collectionDragLastLayoutAt = 0;
        CancelCollectionDragLayout();
        ClearCollectionDragSettling();
        ClearCollectionDragVisualAnimationStyles();
        QuiesceCollectionDragChildAnimations();
        ResetCollectionDragHoverState();
        CreateCollectionDragClone(state, coords);

        $('body').addClass('collection-reorder-active');
        $collectionTitlesWrapper.addClass('collection-reorder-active');
        state.$item
            .addClass('collection-reorder-placeholder collection-reorder-dragging')
            .attr('aria-grabbed', 'true');
    };

    var GetCollectionDragAffectedElements = function(siblingItems, fromIndex, toIndex) {

        var affected = [];
        var start;
        var end;
        var i;

        siblingItems = siblingItems || [];
        fromIndex = parseInt(fromIndex, 10);
        toIndex = parseInt(toIndex, 10);

        if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex === toIndex) {
            return $(affected);
        }

        start = Math.min(fromIndex, toIndex);
        end = Math.max(fromIndex, toIndex) - 1;

        if (start < 0) {
            start = 0;
        }

        if (end >= siblingItems.length) {
            end = siblingItems.length - 1;
        }

        for (i = start; i <= end; ++i) {
            if (siblingItems[i]) {
                affected.push(siblingItems[i]);
            }
        }

        return $(affected);
    };

    var PlaceCollectionDragPlaceholder = function(insertionIndex) {

        var state = _collectionDragState;
        var siblingItems;
        var target;
        var previousRects;
        var $affectedItems;

        if (!state || !state.dragging) {
            return;
        }

        siblingItems = GetCollectionDragSiblingElements();

        if (insertionIndex < 0) {
            insertionIndex = 0;
        }

        if (insertionIndex > siblingItems.length) {
            insertionIndex = siblingItems.length;
        }

        if (state.currentInsertionIndex === insertionIndex) {
            return;
        }

        $affectedItems = GetCollectionDragAffectedElements(siblingItems, state.currentInsertionIndex, insertionIndex);
        previousRects = CaptureCollectionDragVisualRects($affectedItems);
        target = siblingItems[insertionIndex];

        if (target) {
            $(target).before(state.$item);
        }
        else {
            $collectionTitlesWrapper.append(state.$item);
        }

        state.currentInsertionIndex = insertionIndex;
        state.hasMovedPlaceholder = true;
        ResetCollectionDragHoverState();
        UpdateManualOrderDataFromDomOnly();

        /*
         * Drag reflow is animated with a FLIP pass on the visible .gamelink
         * layer. Isotope still computes the shelf slots, but it is applied
         * instantly during drag so Outlayer's parent transform cleanup and the
         * game-link appearance animations cannot create a second end snap.
         */
        ApplyCollectionDragInstantLayout();
        AnimateCollectionDragVisualReflow(previousRects, {
            duration: _collectionDragLayoutDuration,
            items: $affectedItems
        });
    };

    var FlushCollectionDragPlaceholder = function() {

        var state = _collectionDragState;
        var insertionIndex;

        if (!state || !state.dragging) {
            return;
        }

        if (state.reflowTimer) {
            clearTimeout(state.reflowTimer);
            state.reflowTimer = null;
        }

        if (typeof state.pendingInsertionIndex === 'undefined' || state.pendingInsertionIndex === null) {
            return;
        }

        insertionIndex = state.pendingInsertionIndex;
        state.pendingInsertionIndex = null;
        state.lastReflowAt = GetCollectionDragNow();
        PlaceCollectionDragPlaceholder(insertionIndex);
    };

    var QueueCollectionDragPlaceholder = function(insertionIndex) {

        var state = _collectionDragState;
        var now;
        var elapsed;
        var delay;

        if (!state || !state.dragging) {
            return;
        }

        if (state.currentInsertionIndex === insertionIndex && !state.reflowTimer) {
            state.pendingInsertionIndex = null;
            return;
        }

        state.pendingInsertionIndex = insertionIndex;

        if (state.reflowTimer) {
            return;
        }

        now = GetCollectionDragNow();
        elapsed = state.lastReflowAt ? now - state.lastReflowAt : _collectionDragReflowMinInterval;
        delay = Math.max(0, _collectionDragReflowMinInterval - elapsed);

        if (delay < 12) {
            FlushCollectionDragPlaceholder();
            return;
        }

        state.reflowTimer = setTimeout(function() {
            FlushCollectionDragPlaceholder();
        }, delay);
    };

    var CancelCollectionDragReflow = function() {

        if (!_collectionDragState) {
            return;
        }

        if (_collectionDragState.reflowTimer) {
            clearTimeout(_collectionDragState.reflowTimer);
            _collectionDragState.reflowTimer = null;
        }

        _collectionDragState.pendingInsertionIndex = null;
    };

    var MoveCollectionDraggedItem = function(coords) {

        var insertionIndex;

        if (!_collectionDragState || !_collectionDragState.dragging || !coords) {
            return;
        }

        MoveCollectionDragClone(coords);
        insertionIndex = GetCollectionDragInsertionIndex(coords);
        QueueCollectionDragPlaceholder(insertionIndex);
    };

    var CleanupCollectionDrag = function() {

        var wasDragging = _collectionDragState && _collectionDragState.dragging;

        CancelCollectionDragReflow();
        CancelCollectionDragLayout();
        ClearManualCollectionDragPrimeTimer();
        $(document).off(_collectionDragNamespace);
        $('body').removeClass('collection-reorder-active');
        $collectionTitlesWrapper.removeClass('collection-reorder-active collection-reorder-motion-quieted');

        if (wasDragging) {
            BeginCollectionDragSettling(_collectionDragLayoutDuration);
        }
        else {
            ClearCollectionDragVisualAnimationStyles();
        }

        if (_collectionDragState && _collectionDragState.holdTimer) {
            clearTimeout(_collectionDragState.holdTimer);
            _collectionDragState.holdTimer = null;
        }

        if (_collectionDragState && _collectionDragState.$clone) {
            _collectionDragState.$clone.remove();
            _collectionDragState.$clone = null;
        }

        if (_collectionDragState && _collectionDragState.$item) {
            _collectionDragState.$item
                .removeClass('collection-reorder-placeholder collection-reorder-dragging')
                .removeAttr('aria-grabbed');
        }
    };

    var FinishCollectionDrag = function(e, cancel) {

        var state = _collectionDragState;
        var newOrder;
        var previousOrder;

        if (!state) {
            return;
        }

        if (e && e.preventDefault && state.dragging) {
            e.preventDefault();
            e.stopPropagation();
        }

        previousOrder = state.originalOrder ? state.originalOrder.slice(0) : [];

        if (state.dragging) {
            FlushCollectionDragPlaceholder();
        }

        CleanupCollectionDrag();
        _collectionDragState = null;

        if (!state.dragging) {
            return;
        }

        SuppressNextCollectionClick();

        if (cancel) {
            ReorderPersonalCollectionDom(previousOrder, {
                animate: true,
                duration: _collectionDragSettleLayoutDuration
            });
            return;
        }

        UpdateManualOrderDataFromDomOnly();
        ApplyManualOrderToActiveTitlesFromDom();

        if (_titlesGrid && $.fn && $.fn.isotope) {
            _titlesGrid.isotope('updateSortData');
        }

        newOrder = GetPersonalCollectionOrderFromDom();

        if (!AreCollectionOrdersEqual(previousOrder, newOrder)) {
            SaveManualCollectionOrder(previousOrder);
        }
    };

    var ContinueCollectionDrag = function(e) {

        var state = _collectionDragState;
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

        coords = GetCollectionDragEventCoordinates(e);
        state.lastCoords = coords;
        deltaX = coords.pageX - state.startX;
        deltaY = coords.pageY - state.startY;

        if (!state.dragging) {
            if (Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) < _collectionDragThreshold) {
                return;
            }

            BeginCollectionDrag(coords);
        }

        e.preventDefault();
        e.stopPropagation();
        MoveCollectionDraggedItem(coords);
    };

    var CancelCollectionDragOnEscape = function(e) {

        var key = e.which || e.keyCode;

        if (!_collectionDragState || key !== 27) {
            return;
        }

        FinishCollectionDrag(e, true);
    };

    var StartCollectionDragPointer = function(e) {

        var $item = $(e.currentTarget);
        var original = e.originalEvent || e;
        var coords;
        var sourceIndex;

        if (e.type === 'mousedown' && window.PointerEvent) {
            return;
        }

        if (!CanStartManualCollectionDrag($item, e)) {
            return;
        }

        coords = GetCollectionDragEventCoordinates(e);
        sourceIndex = GetCollectionDragItemIndex($item);

        _collectionDragState = {
            $item: $item,
            $clone: null,
            startX: coords.pageX,
            startY: coords.pageY,
            startClientX: coords.clientX,
            startClientY: coords.clientY,
            lastCoords: coords,
            pointerId: original.pointerId,
            originalOrder: GetPersonalCollectionOrderFromDom(),
            dragging: false,
            holdTimer: null,
            currentInsertionIndex: sourceIndex,
            itemWidth: 0,
            itemHeight: 0,
            pointerOffsetX: 0,
            pointerOffsetY: 0,
            pendingInsertionIndex: null,
            reflowTimer: null,
            lastReflowAt: 0,
            hasMovedPlaceholder: false
        };

        _collectionDragState.holdTimer = setTimeout(function() {
            if (_collectionDragState && _collectionDragState.$item && _collectionDragState.$item[0] === $item[0] && !_collectionDragState.dragging) {
                BeginCollectionDrag(_collectionDragState.lastCoords);
            }
        }, _collectionDragHoldMs);

        $(document)
            .off(_collectionDragNamespace)
            .on('pointermove' + _collectionDragNamespace, ContinueCollectionDrag)
            .on('pointerup' + _collectionDragNamespace, function(event) {
                FinishCollectionDrag(event, false);
            })
            .on('pointercancel' + _collectionDragNamespace, function(event) {
                FinishCollectionDrag(event, true);
            })
            .on('mousemove' + _collectionDragNamespace, ContinueCollectionDrag)
            .on('mouseup' + _collectionDragNamespace, function(event) {
                FinishCollectionDrag(event, false);
            })
            .on('keydown' + _collectionDragNamespace, CancelCollectionDragOnEscape);
    };

    var BindManualCollectionDragHandlers = function() {

        if (!$collectionTitlesWrapper.length) {
            return;
        }

        BindManualCollectionClickSuppressor();

        $collectionTitlesWrapper
            .off('pointerdown' + _collectionDragNamespace)
            .on('pointerdown' + _collectionDragNamespace, '.collection-grid-item:not(.collection-reorder-drag-clone)', StartCollectionDragPointer)
            .off('mousedown' + _collectionDragNamespace)
            .on('mousedown' + _collectionDragNamespace, '.collection-grid-item:not(.collection-reorder-drag-clone)', StartCollectionDragPointer)
            .off('dragstart' + _collectionDragNamespace)
            .on('dragstart' + _collectionDragNamespace, '.collection-grid-item img', function(e) {
                if (IsActiveCollectionManualPersonalCollection()) {
                    e.preventDefault();
                    return false;
                }
            });
    };

    var GetCollectionCountText = function(count) {
        return count + ' ' + (count === 1 ? 'game' : 'games');
    };

    var NormalizeReleaseSortValue = function(value) {

        value = parseInt(value, 10);

        if (isNaN(value)) {
            return null;
        }

        return value;
    };

    var ApplyReleaseSortData = function($griditem, releaseSort) {

        releaseSort = NormalizeReleaseSortValue(releaseSort);

        $griditem.data('releaseDate', releaseSort !== null ? releaseSort : 0);
        $griditem.data('releaseMissing', releaseSort === null ? 1 : 0);
    };

    var RenderCollectionHeader = function() {

        if (!$collectionHeaderWrapper.length || _isCollectionNameEditorOpen) {
            return;
        }

        if (!CanRenderCollectionTabs() || !CanShowCollectionTools()) {
            DestroyTooltipsIn($collectionHeaderWrapper);
            $collectionHeaderWrapper.empty();
            return;
        }

        var activeCollection = FindActiveCollection();

        if (!activeCollection && _self.HasNoCollections() && _activeCollectionTitles.length === 0) {
            DestroyTooltipsIn($collectionHeaderWrapper);
            $collectionHeaderWrapper.empty();
            return;
        }

        var activeName = GetCollectionDisplayName(activeCollection);
        var collectionEyebrow = activeCollection && activeCollection.type === 'site-statistic' ? 'Site Statistic Collection' : (activeCollection && (activeCollection.type === 'featured' || activeCollection.type === 'server') ? 'Featured Collection' : 'Personal Library');
        var titleCount = activeCollection && activeCollection.hasOwnProperty('count') ? activeCollection.count : _activeCollectionTitles.length;
        var $titlebar = $('<div class="collection-library-titlebar" />');
        var $titlegroup = $('<div class="collection-library-titlegroup" />');
        var $eyebrow = $('<div class="collection-library-eyebrow" />').text(collectionEyebrow);
        var $headingRow = $('<div class="collection-library-heading-row" />');
        var $heading = $('<div class="collection-library-heading" />').text(activeName);
        var $meta = $('<div class="collection-library-meta" />');
        var $actions = $('<div class="collection-library-actions" />');

        $headingRow.append($heading);

        if (IsDefaultCollection(activeCollection)) {
            $meta.text(GetCollectionCountText(titleCount) + ' ready for a name');
        }
        else {
            $meta.text(GetCollectionCountText(titleCount));
        }

        if (IsEditableCollection(activeCollection) && !_self.IsEmpty()) {
            var $rename = $('<button type="button" class="collection-header-action collection-rename-action" />');
            $rename.text(IsDefaultCollection(activeCollection) ? 'Name' : 'Rename');
            $rename.attr('aria-label', IsDefaultCollection(activeCollection) ? 'Name this collection' : 'Rename ' + activeName);
            $rename.on('click', function() {
                OpenCollectionNameEditor('rename', activeCollection, $rename);
            });
            $actions.append($rename);
        }

        if (CanPublishCollection(activeCollection)) {
            var $publish = $('<button type="button" class="collection-header-action collection-publish-featured-action" />');
            $publish.text('Publish Featured');
            $publish.attr('aria-label', 'Publish ' + activeName + ' as a featured collection');
            $publish.on('click', function() {
                PublishCollection(activeCollection, $publish);
            });
            $actions.append($publish);
        }

        $titlegroup.append($eyebrow);
        $titlegroup.append($headingRow);
        $titlegroup.append($meta);
        $titlebar.append($titlegroup);
        $titlebar.append($actions);

        DestroyTooltipsIn($collectionHeaderWrapper);
        $collectionHeaderWrapper.empty().append($titlebar);
    };

    var ShowCollectionNameError = function($input, message) {

        if ($input.hasClass('tooltipstered')) {
            $input.tooltipster('content', message);
            $input.tooltipster('show');
        }
        else {
            $input.attr('title', message);
            $input.addClass('tooltip');
            _Tooltips.Any();
            $input.tooltipster('content', message);
            $input.tooltipster('show');
        }
    };

    var ValidateCollectionName = function(rawValue, collectionBeingRenamed, $input) {

        var value = $.trim(rawValue || '');
        var offenders = value.match(/[^a-zA-Z0-9\s\-/]/g); //white list of acceptable characters

        if (offenders) {
            ShowCollectionNameError($input, 'The following characters are not allowed: ' + offenders);
            return null;
        }

        if (value.length === 0) {
            ShowCollectionNameError($input, 'Please enter a collection name');
            return null;
        }

        if (value.length > 60) {
            ShowCollectionNameError($input, 'A name cannot exceed 60 characters');
            return null;
        }

        var normalizedValue = NormalizeCollectionNameForComparison(value);

        for (var i = 0, len = _collectionNames.length; i < len; ++i) {
            var collectionName = NormalizeCollectionNameForComparison(GetCollectionDisplayName(_collectionNames[i]));

            if (collectionName === normalizedValue && (!collectionBeingRenamed || _collectionNames[i].id !== collectionBeingRenamed.id)) {
                ShowCollectionNameError($input, 'This name is already used');
                return null;
            }
        }

        return value.replace(/[^a-zA-Z0-9\s\-/]/g,''); //sanitize anyway ;)
    };

    var SaveCollectionName = function(name, mode, collection, onComplete) {

        var postBody = {
            name: name
        };
        var url = _baseUrl;
        var isRename = mode === 'rename';

        if (isRename && collection && collection.id) {
            postBody.c = collection.id;
            url += '/rename';
        }

        _Sync.Post(url, postBody, function(data) {
            if (onComplete) {
                onComplete();
            }
        });
    };

    var OpenCollectionNameEditor = function(mode, collection, $anchor) {

        if (!CanRenderCollectionTabs() || !CanShowCollectionTools()) {
            return;
        }

        var isCreate = mode === 'create';
        var isRename = mode === 'rename';

        if (!isCreate && !isRename) {
            mode = 'rename';
            isRename = true;
        }

        collection = collection || (isCreate ? null : FindActiveCollection());

        if (isRename && (!collection || !IsEditableCollection(collection))) {
            return;
        }

        $anchor = ResolveCollectionNameEditorAnchor(mode, collection, $anchor);

        if (!$anchor || !$anchor.length) {
            return;
        }

        CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });
        CloseCollectionOptionsMenus(null, { animate: false });

        _isCollectionNameEditorOpen = true;
        _Tooltips.Close($anchor);

        var displayName = collection ? GetCollectionDisplayName(collection) : '';
        var existingName = (isRename && collection && !IsDefaultCollection(collection)) ? displayName : '';
        var editorId = 'collectionNameEditorInput';
        var labelId = 'collectionNameEditorLabel';
        var $editor = $('<div class="collection-name-floating-editor" role="dialog" aria-modal="false" />');
        var $label = $('<label class="collection-name-floating-editor-label" />');
        var $body = $('<div class="collection-name-floating-editor-body" />');
        var $actions = $('<div class="collection-name-floating-editor-actions" />');
        var $input = $('<input type="text" maxlength="60" class="collection-name-floating-editor-input tooltip" autocomplete="off" />');
        var $save = $('<button type="button" class="collection-name-floating-editor-button collection-name-floating-editor-save" />');
        var $cancel = $('<button type="button" class="collection-name-floating-editor-button collection-name-floating-editor-cancel" />');
        var CloseEditor = function(e) {

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            $input.val('');
            CloseCollectionNameEditor({ restoreFocus: true });
        };
        var Confirm = function(e) {

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            var value = ValidateCollectionName($input.val(), isRename ? collection : null, $input);

            if (!value) {
                return;
            }

            $save.prop('disabled', true);
            $cancel.prop('disabled', true);
            $input.prop('disabled', true);
            $editor.addClass('collection-name-floating-editor-saving');

            SaveCollectionName(value, mode, isRename ? collection : null, function() {
                CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });
                _self.PopulateCollections();
                if (_collectionControls) {
                    _collectionControls.Reset();
                }
                RenderCollectionHeader();
            });
        };

        $editor
            .toggleClass('collection-name-floating-editor-create', isCreate)
            .toggleClass('collection-name-floating-editor-rename', isRename)
            .attr('aria-labelledby', labelId);

        $label
            .attr('id', labelId)
            .attr('for', editorId)
            .text(isCreate ? 'New collection' : 'Rename collection');

        $input.attr('id', editorId);
        $input.val(existingName);
        $input.attr('placeholder', isCreate ? 'Collection name' : (IsDefaultCollection(collection) ? _defaultCollectionDisplayName : displayName));
        $save.text('Save');
        $cancel.text('Cancel');

        $editor
            .off('click.collectionNameEditor keydown.collectionNameEditor')
            .on('click.collectionNameEditor keydown.collectionNameEditor', function(e) {
                e.stopPropagation();
            });

        $input.on('keydown.collectionNameEditor', function(e) {
            var key = e.which || e.keyCode;

            if (key === 13) {
                Confirm(e);
            }
            else if (key === 27) {
                CloseEditor(e);
            }
        });

        $save.on('click.collectionNameEditor', Confirm);
        $cancel.on('click.collectionNameEditor', CloseEditor);

        $actions.append($cancel);
        $actions.append($save);
        $body.append($input);
        $body.append($actions);
        $editor.append($label);
        $editor.append($body);

        $('body').append($editor);
        _openCollectionNameEditor = {
            mode: mode,
            collection: collection,
            $anchor: $anchor,
            $editor: $editor
        };

        BindCollectionNameEditorDocumentHandlers();
        PositionOpenCollectionNameEditor();

        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function() {
                $editor.addClass(_collectionNameEditorOpenClass);
                PositionOpenCollectionNameEditor();
            });
        }
        else {
            setTimeout(function() {
                $editor.addClass(_collectionNameEditorOpenClass);
                PositionOpenCollectionNameEditor();
            }, 0);
        }

        _Tooltips.Any();

        setTimeout(function() {
            $input.focus();
            if (isRename && existingName) {
                $input.select();
            }
        }, 0);
    };
    
    var RemoveTitle = function(activeTitle, onRemoveComplete) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (_currentLoadingGame && _currentLoadingGame.hasOwnProperty('gk') && activeTitle.gameKey.gk == _currentLoadingGame.gk) {
            return;
        }

        // //maybe set a loading spinner on image here?
        activeTitle.gameLink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again
        _titlesGrid.isotope('remove', activeTitle.gridItem).isotope('layout'); //immediately remove from grid (i used to wait for response but why right?)
        _Tooltips.Destroy(activeTitle.gridItem); //destory its custom tooltip

        //use sync for outgoing. will update this object on response
        var url = _baseUrl + '/game?gk=' + encodeURIComponent(activeTitle.gameKey.gk);
        _Sync.Delete(url, function(data) {
            //sync will take care of updating the collection
            if (onRemoveComplete) {
                onRemoveComplete();
            }
        });
    };

    var RemoveCollection = function(collection, onRemoveComplete) {

        CloseCollectionOptionsMenus();
        CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });

        if (CanRenderCollectionTabs() && collection.gridItem && collection.gridItem.length) {
            _Tooltips.Destroy(collection.gridItem);
            _collectionsGrid.isotope('remove', collection.gridItem); //immediately remove from grid (i used to wait for response but why right?)
            LayoutCollectionTabs();
        }

        //use sync for outgoing. will update this object on response
        var url = _baseUrl + '?c=' + encodeURIComponent(collection.id);
        _Sync.Delete(url, function(data) {
            //sync will take care of updating the collection
            if (onRemoveComplete) {
                onRemoveComplete();
            }
        });
    };

    var InsertCollectionTitleBatch = function($items, options) {

        var iso;
        var previousDuration;
        var duration;

        options = options || {};

        if (!$items || !$items.length || !_titlesGrid || !_titlesGrid.length) {
            return;
        }

        duration = typeof options.transitionDuration === 'number' ? options.transitionDuration : _collectionDefaultLayoutDuration;
        iso = _titlesGrid.data('isotope');
        previousDuration = iso && iso.options ? iso.options.transitionDuration : null;

        if (iso && iso.options) {
            iso.options.transitionDuration = duration;
        }

        _titlesGrid.isotope('insert', $items);

        if (iso && iso.options && previousDuration !== null) {
            iso.options.transitionDuration = previousDuration;
        }
    };

    //examines the local cache about the active collection and populates the grid as needed
    this.PopulateTitles = function() {

        HoldCollectionPanelHeight();

        var gridTitles = _titlesGrid.isotope('getItemElements');
        var manualPersonalCollection = IsActiveCollectionManualPersonalCollection();
        var settleInitialManualLayout = ShouldSettleManualCollectionInitialLayout(gridTitles);
        var $deferredEntryItems = $();
        var $deferredInsertItems = $();

        UpdateManualCollectionShelfClass(manualPersonalCollection);

        if (settleInitialManualLayout) {
            BeginManualCollectionInitialLayoutSettling();
        }

        //put a flag in each grid item saying this is not in the current collection (unless we find a match later)
        for (var x = 0, xlen = gridTitles.length; x < xlen; ++x) {
            $(gridTitles[x]).data('active', 0);
        }

        var newTitleBatchIndex = 0;

        //go through all titles in cache
        for (var i = 0, len = _activeCollectionTitles.length; i < len; ++i) {

            var activeTitle = _activeCollectionTitles[i];

            //does this title already exist in the grid?
            //we only care about keeping the existing title in the grid if it is a personal collection title, 
            //that way we understand it has the structure to update it
            var foundInGrid = false;
            for (var j = 0, jlen = gridTitles.length; j < jlen; ++j) {

                var $gridTitle = $(gridTitles[j]);
                var gridGk = $gridTitle.data('gk');      //take the gk from the element for comparison. will be unique
                var type = $gridTitle.data('type');      //to recognize personal collection from featured collection

                if (gridGk === activeTitle.gameKey.gk && type == 'personal') {
                    foundInGrid = true;
                    $gridTitle.data('active', 1);

                    //found this title in the grid, update its attributes to keep it up to date
                    $gridTitle.data('titleId', activeTitle.titleId).attr('data-title-id', activeTitle.titleId || '');
                    $gridTitle.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
                    $gridTitle.attr('data-playCount', activeTitle.playCount);
                    $gridTitle.attr('data-topRanked', activeTitle.topRanked);
                    ApplyManualOrderDataToGridItem($gridTitle, activeTitle.manualOrder);
                    ApplyReleaseSortData($gridTitle, activeTitle.releaseSort);
                }
            }

            if (!foundInGrid) {
                activeTitle.gridItem = AddTitle(activeTitle, newTitleBatchIndex, {
                    deferEntry: settleInitialManualLayout,
                    deferInsert: settleInitialManualLayout
                });
                activeTitle.gridItem.data('active', 1);

                if (settleInitialManualLayout) {
                    $deferredEntryItems = $deferredEntryItems.add(activeTitle.gridItem);
                    $deferredInsertItems = $deferredInsertItems.add(activeTitle.gridItem);
                }

                newTitleBatchIndex++;
            }

            //generate new toolips content
            GenerateTitleTooltipContent(activeTitle);   //generate html specific for collections
        }

        //remove anything from the grid not found
        for (var k = 0, klen = gridTitles.length; k < klen; ++k) {
            var m = $.data(gridTitles[k], 'active');
            if (m === 0) {
                _titlesGrid.isotope('remove', gridTitles[k]);
            }
        }

        if (settleInitialManualLayout && $deferredInsertItems.length) {
            InsertCollectionTitleBatch($deferredInsertItems, {
                transitionDuration: 0
            });
        }

        if (manualPersonalCollection) {
            ApplyManualOrderDataFromActiveTitles({
                transitionDuration: settleInitialManualLayout ? 0 : _collectionDefaultLayoutDuration
            });
        }
        else {
            _TitlesSort.Sort();
        }

        RefreshManualReorderState();

        if (settleInitialManualLayout) {
            FinishManualCollectionInitialLayoutSettling($deferredEntryItems);
        }

        ReleaseCollectionPanelHeight();
    };

    var AddTitle = function(activeTitle, batchIndex, options) {
        
        options = options || {};

        //create the grid item
        var $griditem = $('<div class="grid-item collection-grid-item collection-card-awaiting-entry" />');

        //place sorting data on grid item
        $griditem.data('gk', activeTitle.gameKey.gk);
        $griditem.data('titleId', activeTitle.titleId).attr('data-title-id', activeTitle.titleId || '');
        $griditem.data('lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
        $griditem.data('name', activeTitle.gameKey.title);
        $griditem.data('system', activeTitle.gameKey.system);
        $griditem.data('playCount', activeTitle.playCount);
        $griditem.data('type', 'personal'); //to denote collection type (personal/featured)
        $griditem.data('topRanked', activeTitle.topRanked); //bool. is this the top ranked file (true) or an alternate version?
        ApplyManualOrderDataToGridItem($griditem, activeTitle.manualOrder);
        ApplyReleaseSortData($griditem, activeTitle.releaseSort);

        $griditem.append(activeTitle.gameLink.GetDOM()); //add all visual content from gamelink to grid

        if (options.deferEntry) {
            $griditem.data('collectionEntryDeferred', true);
            $griditem.data('collectionEntryBatchIndex', batchIndex);
        }

        if (options.deferInsert) {
            return $griditem;
        }

        _titlesGrid.isotope('insert', $griditem[0]);

        if (!options.deferEntry) {
            StartCollectionEntryWhenReady($griditem, batchIndex);
        }

        return $griditem;
    };

    var StartCollectionEntryWhenReady = function($griditem, batchIndex) {

        var done = false;
        var $images = $griditem.find('img');

        var startEntry = function() {
            if (done) {
                return;
            }
            done = true;
            StartCollectionEntryAnimation($griditem, batchIndex);
        };

        if (!$images.length || !$.fn.imagesLoaded) {
            setTimeout(startEntry, 0);
            return;
        }

        var timeout = setTimeout(startEntry, _collectionImageReadyTimeout);

        $images.imagesLoaded()
            .progress(function(imgLoad, image) {
                if (IsActiveCollectionManualPersonalCollection()) {
                    ApplyManualSortAndLayout({
                        transitionDuration: 0
                    });
                }
                else if (_externalActiveCollection) {
                    _titlesGrid.isotope('layout');
                }
                else {
                    _TitlesSort.Sort();
                }
            })
            .always(function() {
                clearTimeout(timeout);
                startEntry();
            });
    };

    var StartCollectionEntryAnimation = function($griditem, batchIndex) {

        if (!$griditem || !$griditem.length || $griditem.data('collectionEntryComplete')) {
            return;
        }

        var delay = GetCollectionEntryDelay(batchIndex);
        var element = $griditem[0];

        $griditem.data('collectionEntryComplete', true);

        if (_collectionDragState && _collectionDragState.dragging) {
            $griditem.removeClass('collection-card-awaiting-entry collection-card-enter collection-card-enter-quiet');

            if (element && element.style && element.style.removeProperty) {
                element.style.removeProperty('--collection-entry-delay');
                element.style.removeProperty('--collection-sheen-delay');
            }

            ScheduleManualCollectionDragPrime(0);
            return;
        }

        if (element && element.style && element.style.setProperty) {
            element.style.setProperty('--collection-entry-delay', delay + 'ms');
            element.style.setProperty('--collection-sheen-delay', (delay + 110) + 'ms');
        }

        $griditem
            .removeClass('collection-card-awaiting-entry')
            .addClass('collection-card-enter');

        if (batchIndex >= _collectionFlourishLimit) {
            $griditem.addClass('collection-card-enter-quiet');
        }

        setTimeout(function() {
            $griditem.removeClass('collection-card-enter collection-card-enter-quiet');

            if (element && element.style && element.style.removeProperty) {
                element.style.removeProperty('--collection-entry-delay');
                element.style.removeProperty('--collection-sheen-delay');
            }

            if (IsActiveCollectionManualPersonalCollection()) {
                ScheduleManualCollectionDragPrime(0);
            }
        }, delay + _collectionEnterAnimationMs + 140);
    };

    var GetCollectionEntryDelay = function(batchIndex) {

        batchIndex = parseInt(batchIndex, 10);
        if (isNaN(batchIndex) || batchIndex < 0) {
            batchIndex = 0;
        }

        var delay = batchIndex * _collectionStaggerStepMs;

        if (delay > _collectionStaggerMaxDelayMs) {
            delay = _collectionStaggerMaxDelayMs;
        }

        return delay;
    };

    this.PopulateCollections = function()  {

        if (!CanRenderCollectionTabs()) {
            for (var dormantIndex = 0, dormantLen = _collectionNames.length; dormantIndex < dormantLen; ++dormantIndex) {
                if (_collectionNames[dormantIndex].gridItem && _collectionNames[dormantIndex].gridItem.length) {
                    _Tooltips.Destroy(_collectionNames[dormantIndex].gridItem);
                }
                _collectionNames[dormantIndex].gridItem = $();
                _collectionNames[dormantIndex].optionsTrigger = null;
            }

            RenderCollectionHeader();
            return;
        }

        _collectionsGrid.find('.grid-item').removeClass('on').removeAttr('aria-current');
        _collectionsGrid.find('[role="tab"]').attr('aria-selected', 'false');

        //go through all collection names in cache
        for (var i = 0, len = _collectionNames.length; i < len; ++i) {

            var collection = _collectionNames[i];

            //The temporary first collection is represented by "$" on the server, but it is
            //now displayed as a normal personal tab so users can always navigate back to it.

            //if not in grid, wont have griditem so create one
            if (!collection.hasOwnProperty('gridItem') || !collection.gridItem.length || !$.contains(document, collection.gridItem[0])) {
               collection.gridItem = CreateCollectionGirdItem(collection);
            }

            UpdateCollectionGridItem(collection);

            if (_activeCollectionId === collection.id) {
                collection.gridItem.addClass('on').attr('aria-selected', 'true').attr('aria-current', 'true');

                //apend with settings button
                //AddContentMenuToActiveCollection($(collection.gridItem));
            }

            //bind the explicit collection options trigger (sort options, rename, publish, remove etc)
            if (IsEditableCollection(collection) && collection.optionsTrigger && collection.optionsTrigger.length) {
                // Older builds attached this menu to Tooltipster, which rendered a popover bubble.
                // Ensure any previous tooltip instance is removed before binding the custom dropdown.
                DestroyTooltipsIn(collection.optionsTrigger);
                BindCollectionOptionsTrigger(collection);
            }
            else {
                DestroyTooltipsIn(collection.gridItem);
            }
        }

        _collectionsGrid.isotope('updateSortData');
        LayoutCollectionTabs({ sortBy : 'type' }); //reapply layout for any new, renamed, or removed rail items
        RenderCollectionHeader();
    };

    var AddContentMenuToActiveCollection = function($gi) {

        var currentWidth = $gi.width();
        setTimeout(function() {
            $gi.animate({width: currentWidth + 40});

            var $context = $('<div class="context" />');
            $gi.append($context);

            $context.fadeIn();

        }, 2000);
        
    };

    var GetCollectionSortType = function(collection) {

        if (!collection || collection.name === '') {
            return 'z';
        }

        if (collection.name === '!') {
            return 'y';
        }

        if (collection.type === 'featured' || collection.type === 'server') {
            // Keep server-managed/featured collections after the personal add-collection control.
            return 'za';
        }

        if (collection.type === 'site-statistic') {
            return collection.sortType || 'zb';
        }

        return collection.sortType || collection.type || 'c';
    };

    var UpdateCollectionGridItem = function(collection) {

        var displayName = GetCollectionDisplayName(collection);
        var typeName = collection.type || _personalCollectionType;
        var $name = collection.gridItem.find('.collection-tab-name').first();
        var $optionsTrigger = collection.gridItem.find(_collectionOptionsTriggerSelector).first();
        var showOptionsTrigger = IsEditableCollection(collection);
        var isOptionsDropdownOpen;

        collection.gridItem
            .removeClass('collection-tab-user collection-tab-default')
            .addClass('collection-tab-user')
            .toggleClass('collection-tab-default', IsDefaultCollection(collection))
            .data('id', collection.id)
            .data('type', GetCollectionSortType(collection))
            .data('collectionType', typeName)
            .attr('role', 'tab')
            .attr('tabindex', '0')
            .attr('aria-controls', 'openCollectionGrid')
            .attr('aria-selected', 'false')
            .attr('aria-label', 'Open collection ' + displayName);

        if (!$name.length) {
            collection.gridItem.empty();
            $name = $('<span class="collection-tab-name" />');
            collection.gridItem.append($name);
        }

        $name.text(displayName);

        if (showOptionsTrigger) {
            collection.gridItem.addClass('collection-tab-has-options');

            if (!$optionsTrigger.length) {
                $optionsTrigger = $('<button type="button" class="collection-options-trigger" />');
                collection.gridItem.append($optionsTrigger);
            }

            $optionsTrigger
                // .text('⋯')
                .text('▾')
                .attr('aria-label', 'Collection options for ' + displayName)
                .attr('aria-haspopup', 'menu')
                .attr('title', 'Collection options')
                .attr('tabindex', '0');

            collection.optionsTrigger = $optionsTrigger;
            isOptionsDropdownOpen = _openCollectionOptionsDropdown &&
                _openCollectionOptionsDropdown.$trigger &&
                _openCollectionOptionsDropdown.$trigger[0] === $optionsTrigger[0];

            SetCollectionOptionsTriggerOpenState($optionsTrigger, isOptionsDropdownOpen, _openCollectionOptionsDropdown ? _openCollectionOptionsDropdown.$menu : null);
        }
        else {
            collection.gridItem.removeClass('collection-tab-has-options');

            if ($optionsTrigger.length) {
                DestroyTooltipsIn($optionsTrigger);
                $optionsTrigger.remove();
            }

            collection.optionsTrigger = null;
        }
    };

    var CreateCollectionGirdItem = function(collection) {

        if (!CanRenderCollectionTabs()) {
            return $();
        }
        
        //create the grid item
        var $griditem = $('<div class="grid-item collection-tab" />');

        //place sorting data on grid item
        $griditem.data('type', GetCollectionSortType(collection));

        //if making this collection a feature
        if (collection.name === '!') {
            $griditem
                .addClass('collection-tab-dev-action')
                .attr('role', 'button')
                .attr('tabindex', '0')
                .attr('aria-label', 'Copy the current collection to featured collections')
                .append($('<span class="collection-tab-name" />').text('Make Featured'));

            BindKeyboardActivate($griditem, function() {
                
                //get list of gameKeys in order from the grid
                var gridTitles = _titlesGrid.isotope('getItemElements');
                var gks = [];
                for (var i = 0, len = gridTitles.length; i < len; ++i) {
                    //console.log($(gridTitles[i]).data('name') + ' ' + $(gridTitles[i]).data('gk'));
                    gks.push($(gridTitles[i]).data('gk'));
                }

                var sortState = GetCurrentCollectionSortState();

                _Sync.Post(_featureUrl, {
                    name: _activeCollectionName,
                    gks: gks,
                    sort: sortState.sort,
                    asc: sortState.asc
                }, function(data) {
                    
                });
            });
        }
        //the new collection button is reset and bound by NewCollectionControls
        else if (collection.name === '') {
            $griditem.addClass('collection-tab-add');
        }
        //on click, make active collection
        else {
            UpdateCollectionGridItem({
                id: collection.id,
                name: collection.name,
                type: collection.type,
                sortType: collection.sortType,
                gridItem: $griditem
            });

            BindKeyboardActivate($griditem, function() {
                if (_activeCollectionId != collection.id) {
                    _Sync.Get(_baseUrl + '?c=' + encodeURIComponent(collection.id), function(data) {
                        
                    });
                }
            });
        }

        _collectionsGrid.isotope('insert', $griditem[0]);
        LayoutCollectionTabs({ sortBy : 'type' });

        return $griditem;
    };

    var GetTitleTooltipOrigin = function(activeTitle) {

        if (!activeTitle || !activeTitle.gridItem || !activeTitle.gridItem.length) {
            return $();
        }

        var $origin = activeTitle.gridItem.find('.gamelink .box').first();

        if (!$origin.length) {
            $origin = activeTitle.gridItem.find('.gamelink').first();
        }

        if (!$origin.length) {
            $origin = activeTitle.gridItem;
        }

        return $origin;
    };

    var GenerateTitleTooltipContent = function(activeTitle) {

        //create the tooltip content
        
        var $tooltipContent = $('<div class="collection-tooltip game-tooltip-card game-tooltip-collection" />');
        $tooltipContent.append($('<div class="tooltiptitle" />').text(activeTitle.gameKey.title));
        var $mediawrapper = $('<div class="mediawrapper game-tooltip-media" />');
        $tooltipContent.append($mediawrapper);
        //if playing an alternate version, append the tooltip with that info
        if (!activeTitle.topRanked) {
            $tooltipContent.append($('<div class="tooltipfile" />').text('You are playing an alternate version: ' + activeTitle.gameKey.file));
        }

        var lastPlayed = activeTitle.lastPlayed < 0 ? 'Never' : $.format.prettyDate(activeTitle.lastPlayed);
        var $stats = $('<div class="game-tooltip-stats" />');
        
        //$tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $stats.append($('<div />').text('Last Played: ' + lastPlayed)); //using the jquery dateFormat plugin
        $stats.append($('<div />').text('Play Count: ' + activeTitle.playCount));
        $stats.append($('<div />').text('Number of Saves: ' + activeTitle.saveCount));
        $tooltipContent.append($stats);

        var $actions = $('<div class="game-tooltip-actions" />');
        
        var $playbutton = $('<span class="button play first noselect">Play Now!</span>');
        $playbutton.click(function(e) { 

            _Tooltips.Close(activeTitle.gridItem); //sometimes the tooltip was staying up after clicking
            _PlayGameHandler(activeTitle.gameKey);
        });
        $actions.append($playbutton);

        var $remove = $('<span class="button remove noselect">Remove</span>');
        $remove.on('click', function() {
            _Tooltips.Close(activeTitle.gridItem);
            $remove.off('click');
            RemoveTitle(activeTitle, function() {
                
            });
        });
        $actions.append($remove);
        $tooltipContent.append($actions);

        activeTitle.tooltipOrigin = GetTitleTooltipOrigin(activeTitle);
        _Tooltips.SingleHTMLWithTitleScreen(activeTitle.tooltipOrigin, $tooltipContent, $mediawrapper, activeTitle.gameKey, true, false, null, ['top']);
    };

    var GenerateCollectionOptionsDropdownContent = function(collection) {

        var displayName = GetCollectionDisplayName(collection);
        var $menu = $('<div class="collection-options-dropdown collection-options-menu" role="menu" />');
        var $title = $('<div class="collection-options-menu-title" />').text(displayName);
        var AppendSeparator = function() {
            $menu.append($('<div class="collection-options-menu-separator" aria-hidden="true" />'));
        };
        var CreateMenuItem = function(label, className, handler) {
            var $item = $('<button type="button" class="collection-options-menu-item noselect" />');

            $item.text(label);

            if (className) {
                $item.addClass(className);
            }

            BindTooltipAction($item, handler);
            return $item;
        };
        var $lastPlayed;
        var $nameSort;
        var $releaseDateSort;
        var $playCountSort;
        var $rename;
        var $publish;
        var $remove;

        $menu
            .attr('id', GetCollectionOptionsMenuId(collection))
            .attr('aria-label', 'Collection options for ' + displayName)
            .data('collectionId', collection.id);

        // $menu.append($title);

        // Personal collections now preserve manual shelf order. The old personal
        // sort controls are intentionally not rendered here so name/date/play-count
        // preferences cannot override the saved manual order.

        $rename = CreateMenuItem('Rename', 'collection-options-menu-item-rename', function(e) {
            CloseCollectionOptionsMenu(collection);
            OpenCollectionNameEditor('rename', collection, collection.optionsTrigger || collection.gridItem);
        });
        $menu.append($rename);

        if (CanPublishCollection(collection)) {
            $publish = CreateMenuItem('Publish as Featured', 'collection-options-menu-item-publish collection-tooltip-publish-featured', function(e) {
                PublishCollection(collection, $publish);
            });
            $menu.append($publish);
        }

        AppendSeparator();

        $remove = CreateMenuItem('Delete', 'collection-options-menu-item-danger remove', function(e) {
            $remove.off('click.collectionActivate keydown.collectionActivate');
            CloseCollectionOptionsMenu(collection);
            _Preferences.Remove('collections.sort.' + collection.name);
            RemoveCollection(collection, function() {

            });
        });
        $menu.append($remove);

        return $menu;
    };

    var NewCollectionControls = (function($griditem) {

        var __self = this;
        var $gi = $griditem;

        var Show = function(e) {

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!CanShowCollectionTools()) {
                return;
            }

            CloseCollectionOptionsMenus();
            OpenCollectionNameEditor('create', null, $gi);
            __self.Update();
        };

        var Reset = function() {

            DestroyTooltipsIn($gi);

            $gi
                .off('click.collectionActivate keydown.collectionActivate')
                .removeClass('collection-tab-has-options tooltip tooltip-static-right')
                .addClass('collection-tab collection-tab-add')
                .data('type', GetCollectionSortType({ name: '' }))
                .attr('role', 'button')
                .attr('tabindex', '0')
                .attr('aria-label', 'Add collection')
                .removeAttr('aria-selected aria-current aria-controls aria-haspopup')
                .empty();

            $gi.append($('<span class="collection-tab-name collection-tab-add-label" aria-hidden="true" />').text('+'));

            BindKeyboardActivate($gi, function(e) {
                Show(e);
            });

            _collectionsGrid.isotope('updateSortData');
            LayoutCollectionTabs({ sortBy : 'type' });
            __self.Update();
        };

        //changes to how the control should work or appear can be handled here
        this.Update = function() {
            
            _Tooltips.Destroy($griditem); //remove any existing tooltip

            $griditem.find('.collection-tab-add-label').text('+');
            $griditem.attr('aria-label', 'Add collection');
            $griditem.removeClass('tooltip tooltip-static-right').removeAttr('title');

            if (!_self.IsEmpty()) {
                $griditem.attr('title', 'Create a new personal game collection');
                $griditem.addClass('tooltip');
            }

            _Tooltips.Any(); //reapply any changes
        };

        this.Reset = function() {
            Reset();
        };

        //to avoid confusion, this is the constructor for the "New Collection" controls
        var Constructor = (function() {
            Reset(); //start by resetting
        })();
    });
    
    var TitleSortHelper = (function() {

        var __self = this;
        var _sort = _manualCollectionSort;
        var _asc = true;
        var _name = '';

        this.Set = function(payload) {
            
            _name = payload.name;
            _sort = _manualCollectionSort;
            _asc = true;

            return __self.Get();
        };

        this.Get = function() {
            return {
                sort: _sort,
                asc: _asc
            };
        };

        this.Reset = function() {
            _sort = _manualCollectionSort;
            _asc = true;
        };

        this.Sort = function() {

            if (IsActiveCollectionManualPersonalCollection() || _sort === _manualCollectionSort) {
                ApplyManualSortAndLayout();
                return;
            }
            
            if (_sort === 'releaseDate') {
                _self.SortBy(['releaseMissing', 'releaseDate', 'name'], {
                    releaseMissing: true,
                    releaseDate: _asc,
                    name: true
                });
            }
            else {
                _self.SortBy(_sort, _asc);
            }
    
            _titlesGrid.isotope('layout');
        };

        this.Change = function(sort, asc) {

            if (IsActiveCollectionManualPersonalCollection()) {
                _sort = _manualCollectionSort;
                _asc = true;
                ApplyManualSortAndLayout();
                return;
            }
            
            //if already set to this, change the sort order
            if (_sort === sort) {
                _asc = !_asc;
            }
            else {
                _sort = sort;
                _asc = asc;
            }

            _Preferences.Set('collections.sort.' + _name, __self.Get());
            __self.Sort();
        };
    });

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        this.Incoming = function(payload) {

            var isNewCollection = true;
            var active;

            payload = payload || {};
            SetCollectionToolsStorageKey(payload);
            active = payload.active || {};
            active.titles = active.titles || [];
            payload.collections = payload.collections || [];

            //handle active collection titles
            ParseActiveTitles(active.titles);

            //determine if this collection is not the collection currently on display
            isNewCollection = (_activeCollectionId != active.id);
            _activeCollectionId = active.id || null;
            _activeCollectionName = active.name || null;
            _externalActiveCollection = null;

            if (!_activeCollectionId && payload.collections.length === 0) {
                CloseCollectionOptionsMenus();
                CloseCollectionNameEditor({ skipHeaderRender: true, skipControlsUpdate: true });
                _TitlesSort.Reset();
            }

            //handle other collection names data
            ParseCollectionNames(payload.collections);
            UpdateManualCollectionShelfClass(IsActiveCollectionManualPersonalCollection());

            //unlock collection-management affordances only after the user has a real
            //collection, then keep that state for this user in local browser storage.
            UpdateCollectionToolsUnlocked();

            //populate updates grid
            _self.PopulateTitles();
            _self.PopulateCollections();

            //Keep the rail hidden for the truly empty new-user state; once the
            //collection-management threshold is reached, the unnamed default collection
            //is displayed as a normal My Collection tab.
            UpdateCollectionsWrapperEmptyState();

            if (_self.IsEmpty()) {
                if (_collectionControls) {
                    _collectionControls.Reset();
                }
            } else {
                
                //in this condition, the default collection is present with titles but unnamed
                if (_self.HasDefaultCollection()) {

                }
                //otherwise show all collections
                else {
                    LayoutCollectionTabs(); //reapply layout for any new or removed
                }

                //update tooltips for collection controls
                if (_collectionControls) {
                    _collectionControls.Update();
                }
            }

            ApplyCollectionToolsVisibility();
        };

        //not used (yet). delete forces update on server
        this.Outgoing = function() {
            __self.reday = false;
            //return new package(_active, _collections);
        };

        var ParseCollectionNames = function(payload) {

            //let's step through the payload looking for new titles and updated info
            for (var i = 0, len = payload.length; i < len; ++i) {
                var newCollection = true;
                for (var j = 0, jlen = _collectionNames.length; j < jlen; ++j) {
                    if (_collectionNames[j].id === payload[i].id) {

                        //retake this collection's server values in case of rename or future metadata changes
                        var existingGridItem = _collectionNames[j].gridItem;
                        _collectionNames[j] = $.extend({}, _collectionNames[j], payload[i]);
                        if (existingGridItem) {
                            _collectionNames[j].gridItem = existingGridItem;
                        }

                        newCollection = false;
                        break;
                    }
                }
                if (newCollection) {
                    _collectionNames.push(payload[i]);
                }

                if (_activeCollectionId === payload[i].id) {
                    _TitlesSort.Set(payload[i]);
                }
            }

            //check for removals
            for (var k = (_collectionNames.length - 1); k > -1; --k) {
                var found = false;
                for (var l = 0, llen = payload.length; l < llen; ++l) {
                    if (payload[l].id === _collectionNames[k].id) {
                        found = true;
                    }
                }
                if (!found) {
                    CloseCollectionOptionsMenu(_collectionNames[k], { animate: false });
                    if (CanRenderCollectionTabs() && _collectionNames[k].gridItem && _collectionNames[k].gridItem.length) {
                        _Tooltips.Destroy(_collectionNames[k].gridItem);
                        _collectionsGrid.isotope('remove', _collectionNames[k].gridItem);
                    }
                    _collectionNames.splice(k, 1); //remove title from local cache if not found in payload
                }
            }
        };

        var ParseActiveTitles = function(payload) {

            //let's step through the payload looking for new titles and updated info
            for (var i = 0, len = payload.length; i < len; ++i) {

                //get timezone correction for last played date
                var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000; //convert from minutes to mili
                var utcDate = new Date(payload[i].lastPlayed);
                var utcTime = utcDate.getTime();
                var lastPlayed = utcTime - timezoneOffset;
                var manualOrder = GetManualOrderValue(payload[i].manualOrder, i);

                //does this title already exist in local cache?
                var newTitle = true;
                for (var j = 0, jlen = _activeCollectionTitles.length; j < jlen; ++j) {
                    if (payload[i].gk === _activeCollectionTitles[j].gameKey.gk) {
                        newTitle = false;

                        //update these details in local cache to whatever the server says
                        _activeCollectionTitles[j].titleId = payload[i].titleId;
                        _activeCollectionTitles[j].lastPlayed = lastPlayed;
                        _activeCollectionTitles[j].playCount = payload[i].playCount;
                        _activeCollectionTitles[j].saveCount = payload[i].saveCount;
                        _activeCollectionTitles[j].releaseSort = payload[i].releaseSort;
                        _activeCollectionTitles[j].releaseLabel = payload[i].releaseLabel;
                        _activeCollectionTitles[j].manualOrder = manualOrder;
                        _activeCollectionTitles[j].manualTieBreak = i;

                    }
                }

                //if this is a new title, build up other details for our local cache
                if (newTitle) {

                    //decompress gk
                    var gameKey = _Compression.Decompress.gamekey(payload[i].gk);

                    //if the box image finishes/fails after initial render, resync this grid.
                    //For personal collections, keep image-load layout on the
                    //manual-order path so late image events cannot replay a raw
                    //Isotope arrangement during the first drag after refresh.
                    var OnImageLoaded = function(image) {
                        if (IsActiveCollectionManualPersonalCollection()) {
                            ApplyManualSortAndLayout({
                                transitionDuration: 0
                            });
                            ScheduleManualCollectionDragPrime(0);
                        }
                        else {
                            _titlesGrid.isotope('layout');
                        }
                    };

                    //generate gamelink
                    var gameLink = new cesGameLink(_config, _Media, _Tooltips, _self, gameKey, 'a', false, _PlayGameHandler, OnImageLoaded, false);

                    //push to our local cache
                    _activeCollectionTitles.push({
                        gameKey: gameKey,
                        titleId: payload[i].titleId,
                        lastPlayed: lastPlayed,
                        lastPlayedServerDate: utcDate,
                        playCount: payload[i].playCount,
                        saveCount: payload[i].saveCount,
                        topRanked: payload[i].topRanked,
                        releaseSort: payload[i].releaseSort,
                        releaseLabel: payload[i].releaseLabel,
                        manualOrder: manualOrder,
                        manualTieBreak: i,
                        gameLink: gameLink
                    });
                }
            }

            //let's now check the opposite, run through local cache and ensure it exists in the payload,
            //if it does not, then it is likely the title was deleted and should be deleted from local cache as well
            //loop backwards in order to splice directly from the array we are iterating
            
            for (var k = (_activeCollectionTitles.length - 1); k > -1; --k) {
                var found = false;
                for (var l = 0, llen = payload.length; l < llen; ++l) {
                    if (payload[l].gk === _activeCollectionTitles[k].gameKey.gk) {
                        found = true;
                    }
                }
                if (!found) {
                    _activeCollectionTitles.splice(k, 1); //remove title from local cache if not found in payload
                }
            }

            SortActiveCollectionTitlesByManualOrder();
        };

        return this;
    })();

    /**
     * Constructors live at the bottom so that all private functions are available
     * @param  {} function(
     */
    var Constructor = (function() {
        
        _isAdminActive = ReadAdminActive();
        $(document).on('ces.admin.state', function(e, active) {
            _isAdminActive = active === true;
            RefreshAdminControls();
        });

        _TitlesSort = new TitleSortHelper(); //sorting helper

        //first, build the grid
        _titlesGrid = $collectionTitlesWrapper.isotope({
            layoutMode: GetCollectionTitlesLayoutMode(),
            transitionDuration: _collectionDefaultLayoutDuration,
            fitRows: {
                gutter: 0
            },
            collectionShelfRows: {
                gutter: 0,
                maxItemsPerRow: 10
            },
            itemSelector: '.grid-item',
            getSortData: {
                manualOrder: function(item) {
                    var manualOrder = $(item).data('manualOrder');
                    manualOrder = parseInt(manualOrder, 10);
                    return isNaN(manualOrder) ? 0 : manualOrder;
                },
                lastPlayed: function(item) {
                    var played = $(item).data('lastPlayed');
                    return parseInt(played, 10);
                },
                name: function(item) {
                    return $(item).data('name');
                    
                },
                playCount: function(item) {
                    var played = $(item).data('playCount');
                    return parseInt(played, 10);
                },
                releaseMissing: function(item) {
                    var missing = $(item).data('releaseMissing');
                    missing = parseInt(missing, 10);
                    return isNaN(missing) ? 1 : missing;
                },
                releaseDate: function(item) {
                    var releaseDate = $(item).data('releaseDate');
                    releaseDate = parseInt(releaseDate, 10);
                    return isNaN(releaseDate) ? 0 : releaseDate;
                }
            }
        });

        BindManualCollectionDragHandlers();
        RefreshManualReorderState();

        $(window)
            .off('resize.collectionTitlesBookshelf')
            .on('resize.collectionTitlesBookshelf', function() {
                if (_collectionTitlesResizeTimer) {
                    clearTimeout(_collectionTitlesResizeTimer);
                }

                _collectionTitlesResizeTimer = setTimeout(function() {
                    _collectionTitlesResizeTimer = null;
                    LayoutCollectionPanel();
                }, 80);
            });

        if (_renderCollectionTabs) {
            _collectionsGrid = $collectionNamesWrapper.isotope({
                layoutMode: 'fitRows',
                transitionDuration: 0,
                itemSelector: '.grid-item',
                getSortData: {
                    type: function(item) {
                        return $(item).data('type');
                    }
                }
            });

            _collectionsGrid
                .off('arrangeComplete.collectionTabAlignment layoutComplete.collectionTabAlignment')
                .on('arrangeComplete.collectionTabAlignment layoutComplete.collectionTabAlignment', function() {
                    AlignCollectionTabGroups();
                });

            $(window)
                .off('resize.collectionTabAlignment')
                .on('resize.collectionTabAlignment', function() {
                    LayoutCollectionTabs();
                });

            BindCollectionOptionsDocumentHandlers();

            var $add = CreateCollectionGirdItem({
                name: '', 
                type: 'z'
            });
            _collectionControls = new NewCollectionControls($add);

            //will also disable on the server for prod
            if (_copyToFeaturedButton && _isAdminActive) {
                var $featureAdd = CreateCollectionGirdItem({
                    name: '!', 
                    type: 'y'
                }); //! since this name cannot be entered by a user
            }
        }
        else {
            _collectionsGrid = $collectionNamesWrapper;
        }

        //parse the incoming sync data from server
        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});