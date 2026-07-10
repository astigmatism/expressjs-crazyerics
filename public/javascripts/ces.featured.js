/*
 * Public featured collection browser.
 *
 * The server provides one cached snapshot containing every public featured
 * collection. Eligibility, weighted initial selection, filter changes, and
 * left/right navigation all run locally so browsing never needs one request
 * per collection.
 */
var cesFeatured = (function(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, _PlayGameHandler, _Collections, _initialSyncPackage, _OnRemoveHandler) {

//private members
var _self = this;
var _baseUrl = '/featured?all=1';
var _collections = [];
var _collectionsSignature = null;
var _eligibleCollections = [];
var _activeCollectionIndex = -1;
var _activeFilter = null;
var _renderGeneration = 0;
var _refreshGeneration = 0;
var _renderedGameLinks = [];
var _pendingRender = null;
var _heightTransitionToken = 0;
var _collectionStateObserver = null;
var _collectionStateTimer = null;
var _collectionStateCheckScheduled = false;
var _resizeTimer = null;
var _lastEstablishedState = null;
var _desktopColumnCount = 10;
var _minimumColumnWidth = 118;
var _navigationPreloadTimeout = 700;
var _mediaHardSettleTimeout = 2600;
var _heightTransitionCleanupTimeout = 320;
var _collectionMenuCloseTimer = null;
var _selection = window.cesFeaturedSelection || null;
var _systemAliasMap = {};

var $wrapper = $('#featuredCollectionsWrapper');
var $grid = null;
var $header = null;
var $eyebrow = null;
var $titleRow = null;
var $name = null;
var $nameText = null;
var $collectionMenu = null;
var $previous = null;
var $next = null;
var $systemFilter = $('#toolbar .systemfilter select').first();
var $collectionsWrapper = $('#collectionsWrapper');

var BuildAliasLookupKeys = function(value) {

    var normalized = String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    var compact = normalized.replace(/[^a-z0-9]/g, '');
    var keys = [];

    if (normalized) {
        keys.push(normalized);
    }

    if (compact && compact !== normalized) {
        keys.push(compact);
    }

    return keys;
};

var AddSystemAlias = function(alias, systemKey) {

    var keys = BuildAliasLookupKeys(alias);

    for (var i = 0, len = keys.length; i < len; ++i) {
        if (Object.prototype.hasOwnProperty.call(_systemAliasMap, keys[i]) && _systemAliasMap[keys[i]] !== systemKey) {
            _systemAliasMap[keys[i]] = false;
        }
        else {
            _systemAliasMap[keys[i]] = systemKey;
        }
    }
};

var BuildSystemAliasMap = function() {

    _systemAliasMap = {};
    AddSystemAlias('all', 'all');

    var systems = _config && _config.systemdetails ? _config.systemdetails : {};

    for (var systemKey in systems) {
        if (!Object.prototype.hasOwnProperty.call(systems, systemKey)) {
            continue;
        }

        AddSystemAlias(systemKey, systemKey);
        AddSystemAlias(systems[systemKey] && systems[systemKey].name, systemKey);
        AddSystemAlias(systems[systemKey] && systems[systemKey].shortname, systemKey);
    }
};

var ResolveCanonicalTag = function(value) {

    var keys = BuildAliasLookupKeys(value);
    var match = null;

    for (var i = 0, len = keys.length; i < len; ++i) {
        var candidate = _systemAliasMap[keys[i]];

        if (candidate === false) {
            return null;
        }

        if (candidate) {
            if (match && match !== candidate) {
                return null;
            }
            match = candidate;
        }
    }

    return match;
};

var ParseTags = function(value) {

    if ($.isArray(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return [];
    }

    value = value.trim();

    if (!value) {
        return [];
    }

    if (value.charAt(0) === '[') {
        try {
            var parsed = JSON.parse(value);
            return $.isArray(parsed) ? parsed : [];
        }
        catch (err) {
            return [];
        }
    }

    return value.split(/[\n,]/);
};

var NormalizeTags = function(value) {

    var rawTags = ParseTags(value);
    var tags = [];
    var seen = {};

    for (var i = 0, len = rawTags.length; i < len; ++i) {
        var tag = ResolveCanonicalTag(rawTags[i]);

        if (tag && !seen[tag]) {
            seen[tag] = true;
            tags.push(tag);
        }
    }

    return tags;
};

var NormalizeSortName = function(sort) {

    sort = String(sort || '').trim();

    if (sort === 'releaseDate' || sort === 'name' || sort === 'lastPlayed' || sort === 'playCount') {
        return sort;
    }

    return null;
};

var NormalizeSortAscending = function(asc) {

    if (asc === true || asc === false) {
        return asc;
    }

    if (asc === 'true' || asc === '1' || asc === 1) {
        return true;
    }

    if (asc === 'false' || asc === '0' || asc === 0) {
        return false;
    }

    return null;
};

var NormalizeCategory = function(value) {

    if (typeof value !== 'string') {
        return '';
    }

    return value.replace(/[\x00-\x1F\x7F]/g, '').trim().substring(0, 120);
};

var NormalizeWeight = function(value) {

    if (_selection && _selection.normalizeWeight) {
        return _selection.normalizeWeight(value);
    }

    // The standalone helper is loaded before this component in both production
    // and development. A missing helper degrades to uniform selection safely.
    return 0;
};

var NormalizeTitleMetadata = function(titles) {

    var result = {};

    if (!$.isArray(titles)) {
        return result;
    }

    for (var i = 0, len = titles.length; i < len; ++i) {
        if (titles[i] && typeof titles[i].gk === 'string' && titles[i].gk) {
            result[titles[i].gk] = {
                gk: titles[i].gk,
                releaseSort: titles[i].releaseSort,
                releaseLabel: titles[i].releaseLabel,
                playCount: titles[i].playCount,
                lastPlayed: titles[i].lastPlayed
            };
        }
    }

    return result;
};

var NormalizeGames = function(gks) {

    var games = [];
    var seen = {};

    if (!$.isArray(gks)) {
        return games;
    }

    for (var i = 0, len = gks.length; i < len; ++i) {
        var gameKey = null;

        if (typeof gks[i] !== 'string' || !gks[i]) {
            continue;
        }

        try {
            gameKey = _Compression.Decompress.gamekey(gks[i]);
        }
        catch (err) {
            gameKey = null;
        }

        if (!gameKey || !gameKey.gk || seen[gameKey.gk]) {
            continue;
        }

        seen[gameKey.gk] = true;
        games.push({
            gk: gameKey.gk,
            gameKey: gameKey,
            originalIndex: games.length
        });
    }

    return games;
};

var NormalizeCollection = function(item, index) {

    if (!item || item.active === false || typeof item.name !== 'string') {
        return null;
    }

    var name = item.name.replace(/\s+/g, ' ').trim();
    var games = NormalizeGames(item.gks);

    if (!name || !games.length) {
        return null;
    }

    return {
        id: item.id === null || typeof item.id === 'undefined' ? ('featured-' + index + '-' + name) : String(item.id),
        index: typeof item.index === 'number' ? item.index : index,
        name: name,
        games: games,
        titleMetadata: NormalizeTitleMetadata(item.titles),
        tags: NormalizeTags(item.tags),
        weight: NormalizeWeight(item.weight),
        category: NormalizeCategory(item.category),
        sort: NormalizeSortName(item.sort),
        asc: NormalizeSortAscending(item.asc),
        type: 'featured',
        readOnly: true,
        active: true,
        created: item.created,
        updated: item.updated
    };
};

var NormalizePayload = function(payload) {

    var result = [];

    if (!$.isArray(payload)) {
        return result;
    }

    for (var i = 0, len = payload.length; i < len; ++i) {
        var collection = NormalizeCollection(payload[i], i);

        if (collection) {
            result.push(collection);
        }
    }

    return result;
};

var BuildCollectionsSignature = function(collections) {

    var signature = [];
    collections = $.isArray(collections) ? collections : [];

    for (var i = 0, len = collections.length; i < len; ++i) {
        var collection = collections[i];
        var games = [];

        for (var j = 0, gameLen = collection.games.length; j < gameLen; ++j) {
            var metadata = GetGameMetadata(collection, collection.games[j]);

            games.push([
                collection.games[j].gk,
                metadata.releaseSort,
                metadata.releaseLabel,
                metadata.playCount,
                metadata.lastPlayed
            ]);
        }

        signature.push({
            id: collection.id,
            name: collection.name,
            tags: collection.tags,
            weight: collection.weight,
            sort: collection.sort,
            asc: collection.asc,
            games: games
        });
    }

    return JSON.stringify(signature);
};

var HasTag = function(collection, tag) {

    if (!collection || !tag || !$.isArray(collection.tags)) {
        return false;
    }

    for (var i = 0, len = collection.tags.length; i < len; ++i) {
        if (collection.tags[i] === tag) {
            return true;
        }
    }

    return false;
};

var ReadActiveFilter = function() {

    var value = $systemFilter && $systemFilter.length ? $systemFilter.val() : 'all';
    return ResolveCanonicalTag(value);
};

var GetEligibleCollections = function(filter) {

    var result = [];

    if (!filter) {
        return result;
    }

    for (var i = 0, len = _collections.length; i < len; ++i) {
        if (_collections[i].active !== false && HasTag(_collections[i], filter)) {
            result.push(_collections[i]);
        }
    }

    return result;
};

var IsPersonalCollectionEstablished = function() {

    if (_Collections && typeof _Collections.IsEmpty === 'function') {
        return _Collections.IsEmpty() !== true;
    }

    return !$collectionsWrapper.hasClass('new-user');
};

var ChooseInitialIndex = function(collections) {

    if (!collections || !collections.length) {
        return -1;
    }

    if (_selection && _selection.chooseIndex) {
        return _selection.chooseIndex(collections);
    }

    return Math.floor(Math.random() * collections.length);
};

var CompareText = function(a, b) {

    a = String(a || '').toLowerCase();
    b = String(b || '').toLowerCase();

    if (a < b) {
        return -1;
    }

    if (a > b) {
        return 1;
    }

    return 0;
};

var ParseNumber = function(value, fallback) {

    value = typeof value === 'number' ? value : parseFloat(value);
    return isFinite(value) ? value : fallback;
};

var GetGameMetadata = function(collection, game) {

    if (!collection || !collection.titleMetadata || !game) {
        return {};
    }

    return collection.titleMetadata[game.gk] || {};
};

var CompareByName = function(a, b) {
    return CompareText(a.gameKey && a.gameKey.title, b.gameKey && b.gameKey.title);
};

var GetOrderedGames = function(collection) {

    var games = collection && collection.games ? collection.games.slice(0) : [];

    if (!collection || !collection.sort || games.length < 2) {
        return games;
    }

    var ascending = collection.asc;

    games.sort(function(a, b) {

        var comparison = 0;
        var aMetadata = GetGameMetadata(collection, a);
        var bMetadata = GetGameMetadata(collection, b);

        if (collection.sort === 'name') {
            comparison = CompareByName(a, b);
            comparison = (ascending === true ? 1 : -1) * comparison;
        }
        else if (collection.sort === 'releaseDate') {
            var aRelease = ParseNumber(aMetadata.releaseSort, null);
            var bRelease = ParseNumber(bMetadata.releaseSort, null);
            var aMissing = aRelease === null;
            var bMissing = bRelease === null;

            if (aMissing !== bMissing) {
                comparison = aMissing ? 1 : -1;
            }
            else if (!aMissing && aRelease !== bRelease) {
                comparison = (ascending === false ? -1 : 1) * (aRelease - bRelease);
            }
            else {
                comparison = CompareByName(a, b);
            }
        }
        else if (collection.sort === 'lastPlayed') {
            comparison = ParseNumber(aMetadata.lastPlayed, -1) - ParseNumber(bMetadata.lastPlayed, -1);
            comparison = (ascending === true ? 1 : -1) * comparison;
        }
        else if (collection.sort === 'playCount') {
            comparison = ParseNumber(aMetadata.playCount, 0) - ParseNumber(bMetadata.playCount, 0);
            comparison = (ascending === true ? 1 : -1) * comparison;
        }

        if (comparison === 0) {
            comparison = CompareByName(a, b);
        }

        if (comparison === 0) {
            comparison = a.originalIndex - b.originalIndex;
        }

        return comparison;
    });

    return games;
};

var BindNavigationControl = function($control, offset) {

    var pointerActivated = false;

    $control
        .on('pointerdown.cesFeaturedBrowser mousedown.cesFeaturedBrowser touchstart.cesFeaturedBrowser', function() {
            pointerActivated = true;
        })
        .on('keydown.cesFeaturedBrowser', function() {
            pointerActivated = false;
        })
        .on('blur.cesFeaturedBrowser', function() {
            pointerActivated = false;
        })
        .on('click.cesFeaturedBrowser', function(e) {
            e.preventDefault();
            Navigate(offset);

            if (pointerActivated && this.blur) {
                this.blur();
            }

            pointerActivated = false;
        });
};

var IsCollectionMenuOpen = function() {

    return !!($collectionMenu && $collectionMenu.length && $name && $name.length && $name.attr('aria-expanded') === 'true');
};

var GetCollectionMenuItems = function() {

    if (!$collectionMenu || !$collectionMenu.length) {
        return $();
    }

    return $collectionMenu.find('.featured-collections-menu-item:not(:disabled)');
};

var CloseCollectionMenu = function(opt_options) {

    var options = opt_options || {};
    var wasOpen = IsCollectionMenuOpen();

    if (_collectionMenuCloseTimer) {
        clearTimeout(_collectionMenuCloseTimer);
        _collectionMenuCloseTimer = null;
    }

    if (!$collectionMenu || !$collectionMenu.length) {
        return;
    }

    if ($name && $name.length) {
        $name
            .removeClass('featured-collections-name-open')
            .attr('aria-expanded', 'false');
    }

    $collectionMenu
        .removeClass('featured-collections-menu-open')
        .attr('aria-hidden', 'true');

    if (options.immediate === true || !wasOpen) {
        $collectionMenu.attr('hidden', 'hidden');
    }
    else {
        _collectionMenuCloseTimer = setTimeout(function() {
            _collectionMenuCloseTimer = null;

            if ($collectionMenu && $collectionMenu.length && !IsCollectionMenuOpen()) {
                $collectionMenu.attr('hidden', 'hidden');
            }
        }, 150);
    }

    if (options.restoreFocus === true && $name && $name.length && !$name.prop('disabled') && $name[0].focus) {
        $name[0].focus();
    }
};

var GetDisplayedCollectionIndex = function() {

    var displayedId = $wrapper && $wrapper.length ? $wrapper.attr('data-featured-collection-id') : null;

    if (displayedId !== null && typeof displayedId !== 'undefined') {
        for (var i = 0, len = _eligibleCollections.length; i < len; ++i) {
            if (_eligibleCollections[i].id === String(displayedId)) {
                return i;
            }
        }
    }

    return _activeCollectionIndex;
};

var BuildCollectionMenu = function() {

    if (!$collectionMenu || !$collectionMenu.length) {
        return $();
    }

    $collectionMenu.empty();

    var displayedCollectionIndex = GetDisplayedCollectionIndex();

    for (var offset = 1, len = _eligibleCollections.length; offset < len; ++offset) {
        var collectionIndex = (displayedCollectionIndex + offset) % len;
        var collection = _eligibleCollections[collectionIndex];
        var $item = $('<button type="button" class="featured-collections-menu-item noselect" role="menuitem" />');

        $item
            .text(collection.name)
            .attr('data-featured-collection-index', collectionIndex)
            .attr('title', 'Show ' + collection.name);

        $collectionMenu.append($item);
    }

    return GetCollectionMenuItems();
};

var FocusCollectionMenuItem = function($items, index) {

    if (!$items || !$items.length) {
        return;
    }

    index = (index + $items.length) % $items.length;

    if ($items[index] && $items[index].focus) {
        $items[index].focus();
    }
};

var OpenCollectionMenu = function(focusFirstItem) {

    if (!$name || !$name.length || $name.prop('disabled') || _eligibleCollections.length < 2) {
        return;
    }

    var $items = BuildCollectionMenu();

    if (!$items.length) {
        return;
    }

    if (_collectionMenuCloseTimer) {
        clearTimeout(_collectionMenuCloseTimer);
        _collectionMenuCloseTimer = null;
    }

    $name
        .addClass('featured-collections-name-open')
        .attr('aria-expanded', 'true');

    $collectionMenu
        .removeAttr('hidden')
        .attr('aria-hidden', 'false');

    OnNextAnimationFrame(function() {
        if (IsCollectionMenuOpen() && $collectionMenu && $collectionMenu.length) {
            $collectionMenu.addClass('featured-collections-menu-open');
        }
    });

    if (focusFirstItem === true) {
        setTimeout(function() {
            if (IsCollectionMenuOpen()) {
                FocusCollectionMenuItem(GetCollectionMenuItems(), 0);
            }
        }, 0);
    }
};

var ToggleCollectionMenu = function(focusFirstItem) {

    if (IsCollectionMenuOpen()) {
        CloseCollectionMenu();
    }
    else {
        OpenCollectionMenu(focusFirstItem);
    }
};

var SelectCollectionAtIndex = function(index) {

    index = parseInt(index, 10);

    if (!isFinite(index) || index < 0 || index >= _eligibleCollections.length) {
        return;
    }

    var liveFilter = ReadActiveFilter();

    CloseCollectionMenu({ immediate: true, restoreFocus: true });

    if (liveFilter !== _activeFilter) {
        return RebuildEligibleCollections();
    }

    if (index === _activeCollectionIndex) {
        return;
    }

    _activeCollectionIndex = index;
    RenderActiveCollection({ preserveCurrentGrid: true });
};

var BindCollectionMenu = function() {

    var keyboardActivated = false;

    $name
        .on('pointerdown.cesFeaturedBrowser mousedown.cesFeaturedBrowser touchstart.cesFeaturedBrowser', function() {
            keyboardActivated = false;
        })
        .on('keydown.cesFeaturedBrowser', function(e) {
            var key = e.which || e.keyCode;

            keyboardActivated = key === 13 || key === 32;

            if (key === 40) {
                e.preventDefault();
                keyboardActivated = false;
                OpenCollectionMenu(true);
            }
            else if (key === 27 && IsCollectionMenuOpen()) {
                e.preventDefault();
                keyboardActivated = false;
                CloseCollectionMenu({ restoreFocus: true });
            }
        })
        .on('click.cesFeaturedBrowser', function(e) {
            e.preventDefault();
            ToggleCollectionMenu(keyboardActivated);
            keyboardActivated = false;
        });

    $collectionMenu
        .on('click.cesFeaturedBrowser', '.featured-collections-menu-item', function(e) {
            e.preventDefault();
            SelectCollectionAtIndex($(this).attr('data-featured-collection-index'));
        })
        .on('keydown.cesFeaturedBrowser', '.featured-collections-menu-item', function(e) {
            var key = e.which || e.keyCode;
            var $items = GetCollectionMenuItems();
            var itemIndex = $items.index(this);

            if (key === 27) {
                e.preventDefault();
                CloseCollectionMenu({ restoreFocus: true });
            }
            else if (key === 38) {
                e.preventDefault();
                FocusCollectionMenuItem($items, itemIndex - 1);
            }
            else if (key === 40) {
                e.preventDefault();
                FocusCollectionMenuItem($items, itemIndex + 1);
            }
            else if (key === 36) {
                e.preventDefault();
                FocusCollectionMenuItem($items, 0);
            }
            else if (key === 35) {
                e.preventDefault();
                FocusCollectionMenuItem($items, $items.length - 1);
            }
            else if (key === 9) {
                e.preventDefault();
                CloseCollectionMenu({ immediate: true });

                if (e.shiftKey && $name && $name.length && $name[0].focus) {
                    $name[0].focus();
                }
                else if ($next && $next.length && !$next.prop('disabled') && $next[0].focus) {
                    $next[0].focus();
                }
            }
        });

    $(document)
        .off('pointerdown.cesFeaturedCollectionMenu mousedown.cesFeaturedCollectionMenu touchstart.cesFeaturedCollectionMenu')
        .on('pointerdown.cesFeaturedCollectionMenu mousedown.cesFeaturedCollectionMenu touchstart.cesFeaturedCollectionMenu', function(e) {
            if (!IsCollectionMenuOpen()) {
                return;
            }

            if ($(e.target).closest('#featuredCollectionsName, #featuredCollectionsMenu').length) {
                return;
            }

            CloseCollectionMenu();
        });
};

var EnsureStructure = function() {

    if (!$wrapper || !$wrapper.length) {
        return false;
    }

    if ($grid && $grid.length && $.contains(document, $grid[0])) {
        return true;
    }

    $wrapper.empty();

    $header = $('<div id="featuredCollectionsHeader" class="featured-collections-header" />');
    $eyebrow = $('<div id="featuredCollectionsEyebrow" class="featured-collections-eyebrow" />').text('Featured Collection');
    $titleRow = $('<div class="featured-collections-title-row" />');
    $grid = $('<div id="featuredCollectionsGrid" class="featured-collections-grid" role="list" aria-label="Games in the selected featured collection" />');
    $previous = $('<button id="featuredCollectionsPrevious" class="featured-collections-nav featured-collections-previous" type="button" aria-label="Previous featured collection" title="Previous featured collection" />').text('\u2039');
    $name = $('<button id="featuredCollectionsName" class="featured-collections-name" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="featuredCollectionsMenu" />');
    $nameText = $('<span class="featured-collections-name-text" aria-live="polite" />');
    $collectionMenu = $('<div id="featuredCollectionsMenu" class="featured-collections-menu" role="menu" aria-orientation="vertical" aria-label="Choose a featured collection" aria-hidden="true" hidden />');
    $next = $('<button id="featuredCollectionsNext" class="featured-collections-nav featured-collections-next" type="button" aria-label="Next featured collection" title="Next featured collection" />').text('\u203a');

    $name.append($nameText, $('<span class="featured-collections-name-disclosure" aria-hidden="true" />').text('\u25be'));

    BindNavigationControl($previous, -1);
    BindNavigationControl($next, 1);
    BindCollectionMenu();

    $titleRow.append($previous, $name, $next);
    $header.append($eyebrow, $titleRow, $collectionMenu);
    $wrapper.append($header, $grid);
    $wrapper.attr('aria-labelledby', 'featuredCollectionsEyebrow featuredCollectionsName');

    return true;
};

var DisableGameLinks = function(gameLinks) {

    gameLinks = gameLinks || [];

    for (var i = 0, len = gameLinks.length; i < len; ++i) {
        if (gameLinks[i] && gameLinks[i].DisableAllEvents) {
            gameLinks[i].DisableAllEvents();
        }
        gameLinks[i] = null;
    }
};

var DestroyRenderedCards = function() {

    if ($grid && $grid.length) {
        $grid.find('.tooltipstered').each(function() {
            try {
                _Tooltips.Destroy($(this));
            }
            catch (err) {
                // A tooltip may already be closing while the collection changes.
            }
        });
    }

    DisableGameLinks(_renderedGameLinks);
    _renderedGameLinks = [];
};

var CancelPendingRender = function() {

    var pending = _pendingRender;

    if (!pending) {
        return;
    }

    if (pending.commitTimer) {
        clearTimeout(pending.commitTimer);
        pending.commitTimer = null;
    }

    if (pending.hardSettleTimer) {
        clearTimeout(pending.hardSettleTimer);
        pending.hardSettleTimer = null;
    }

    if (!pending.committed) {
        DisableGameLinks(pending.gameLinks);

        if (pending.$grid && pending.$grid.length) {
            pending.$grid.remove();
        }
    }

    _pendingRender = null;
};

var GetColumnCount = function() {

    var gridWidth = ($wrapper && $wrapper.length ? $wrapper.width() : 0) || $('#suggestionsgrid').width() || $('#suggestionswrapper').width() || 0;
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

var ApplyColumnWidths = function(opt_grid) {

    var $targetGrid = opt_grid || $grid;

    if (!$targetGrid || !$targetGrid.length) {
        return;
    }

    var width = (100 / GetColumnCount()) + '%';

    $targetGrid.find('.featured-collection-game').css({
        'width': width,
        'max-width': width,
        '-webkit-flex-basis': width,
        '-ms-flex-preferred-size': width,
        'flex-basis': width
    });
};

var OnNextAnimationFrame = function(callback) {

    if (window.requestAnimationFrame) {
        window.requestAnimationFrame(callback);
        return;
    }

    setTimeout(callback, 16);
};

var MeasureNaturalGridHeight = function($targetGrid) {

    if (!$targetGrid || !$targetGrid.length) {
        return 0;
    }

    var previousVisibility = $targetGrid[0].style.visibility;

    $targetGrid
        .removeClass('featured-collections-grid-transition featured-collections-grid-entering featured-collections-grid-entered featured-collections-grid-awaiting-media')
        .css({
            'height': 'auto',
            'overflow': 'visible',
            'visibility': 'hidden'
        });

    var height = Math.ceil($targetGrid.outerHeight() || 0);

    $targetGrid.css('visibility', previousVisibility || '');
    return height;
};

var AnimateGridHeight = function($targetGrid, fromHeight, toHeight, holdHeight, fadeIn) {

    if (!$targetGrid || !$targetGrid.length) {
        return;
    }

    fromHeight = Math.max(0, Math.ceil(fromHeight || 0));
    toHeight = Math.max(0, Math.ceil(toHeight || 0));

    if (!toHeight) {
        toHeight = fromHeight;
    }

    if (!fromHeight) {
        fromHeight = toHeight;
    }

    var transitionToken = ++_heightTransitionToken;

    $targetGrid
        .attr('data-featured-transition-token', transitionToken)
        .removeClass('featured-collections-grid-transition featured-collections-grid-entering featured-collections-grid-entered featured-collections-grid-awaiting-media')
        .css({
            'height': fromHeight + 'px',
            'overflow': 'hidden',
            'visibility': 'visible'
        })
        .addClass('featured-collections-grid-transition');

    if (fadeIn) {
        $targetGrid.addClass('featured-collections-grid-entering');
    }

    // Force the starting height to be committed before applying the destination height.
    $targetGrid[0].offsetHeight;

    OnNextAnimationFrame(function() {
        if (!$targetGrid.length || String($targetGrid.attr('data-featured-transition-token')) !== String(transitionToken)) {
            return;
        }

        if (fadeIn) {
            $targetGrid.addClass('featured-collections-grid-entered');
        }

        $targetGrid.css('height', toHeight + 'px');
    });

    setTimeout(function() {
        if (!$targetGrid.length || String($targetGrid.attr('data-featured-transition-token')) !== String(transitionToken)) {
            return;
        }

        $targetGrid
            .removeClass('featured-collections-grid-transition featured-collections-grid-entering featured-collections-grid-entered')
            .removeAttr('data-featured-transition-token');

        if (holdHeight) {
            $targetGrid
                .addClass('featured-collections-grid-awaiting-media')
                .css({
                    'height': toHeight + 'px',
                    'overflow': 'hidden',
                    'visibility': 'visible'
                });
        }
        else {
            $targetGrid
                .removeClass('featured-collections-grid-awaiting-media')
                .css({
                    'height': '',
                    'overflow': '',
                    'visibility': ''
                });
        }
    }, _heightTransitionCleanupTimeout);
};

var CreateGameItem = function(game, renderGeneration, nextGameLinks) {

    if (!game || !game.gameKey) {
        return null;
    }

    var $griditem = $('<div class="featured-collection-game" role="listitem" />');
    $griditem.attr('data-gk', game.gk);

    var OnImageLoaded = function() {
        if (renderGeneration !== _renderGeneration || !$griditem.parent().length) {
            return;
        }

        var $parentGrid = $griditem.closest('.featured-collections-grid');
        ApplyColumnWidths($parentGrid.length ? $parentGrid : null);
    };

    var gameLink = new cesGameLink(_config, _Media, _Tooltips, _Collections, game.gameKey, 'a', true, _PlayGameHandler, OnImageLoaded, false, true);

    nextGameLinks.push(gameLink);
    $griditem.append(gameLink.GetDOM());

    return $griditem;
};

var SettleCommittedRender = function(pending) {

    if (_pendingRender !== pending || !pending.committed || pending.renderGeneration !== _renderGeneration || !pending.$grid || !pending.$grid.length) {
        return;
    }

    if (pending.hardSettleTimer) {
        clearTimeout(pending.hardSettleTimer);
        pending.hardSettleTimer = null;
    }

    pending.imagesSettled = true;

    var currentHeight = Math.ceil(pending.$grid.outerHeight() || 0);
    var naturalHeight = MeasureNaturalGridHeight(pending.$grid) || currentHeight;

    AnimateGridHeight(pending.$grid, currentHeight, naturalHeight, false, false);

    $wrapper.removeAttr('aria-busy');
    _pendingRender = null;
};

var CommitPendingRender = function(pending) {

    if (_pendingRender !== pending || pending.committed || pending.renderGeneration !== _renderGeneration) {
        return;
    }

    pending.committed = true;

    if (pending.commitTimer) {
        clearTimeout(pending.commitTimer);
        pending.commitTimer = null;
    }

    var hasVisibleGrid = $grid && $grid.length && $grid.children().length && !$wrapper.is('[hidden]');
    var previousHeight = hasVisibleGrid ? Math.ceil($grid.outerHeight() || 0) : 0;

    pending.$grid.css('visibility', 'hidden');
    DestroyRenderedCards();

    if ($grid && $grid.length) {
        $grid.replaceWith(pending.$grid);
    }
    else if ($header && $header.length) {
        pending.$grid.insertAfter($header);
    }
    else {
        $wrapper.append(pending.$grid);
    }

    $grid = pending.$grid;
    _renderedGameLinks = pending.gameLinks;

    CloseCollectionMenu({ immediate: true });
    $nameText.text(pending.collection.name);
    UpdateNavigationControls();

    $wrapper
        .removeAttr('hidden')
        .removeClass('featured-collections-is-loading')
        .attr('aria-hidden', 'false')
        .attr('data-featured-collection-id', pending.collection.id)
        .attr('data-featured-filter', _activeFilter);

    ApplyColumnWidths($grid);

    var naturalHeight = MeasureNaturalGridHeight($grid);
    var startingHeight = previousHeight || naturalHeight;
    var destinationHeight = pending.imagesSettled ? naturalHeight : Math.max(startingHeight, naturalHeight);

    AnimateGridHeight($grid, startingHeight, destinationHeight, !pending.imagesSettled, hasVisibleGrid);
    _Tooltips.Any();

    if (pending.imagesSettled) {
        $wrapper.removeAttr('aria-busy');
        _pendingRender = null;
        return;
    }

    pending.hardSettleTimer = setTimeout(function() {
        SettleCommittedRender(pending);
    }, _mediaHardSettleTimeout);
};

var QueueCollectionRender = function(pending, preserveCurrentGrid) {

    CancelPendingRender();
    _pendingRender = pending;

    ApplyColumnWidths(pending.$grid);

    var canPreserveCurrentGrid = preserveCurrentGrid === true && $grid && $grid.length && $grid.children().length && !$wrapper.is('[hidden]');

    $wrapper.attr('aria-busy', 'true');

    if (canPreserveCurrentGrid) {
        $wrapper.addClass('featured-collections-is-loading');
    }
    else {
        $wrapper.removeClass('featured-collections-is-loading');
    }

    var MarkImagesSettled = function() {
        if (_pendingRender !== pending || pending.renderGeneration !== _renderGeneration) {
            return;
        }

        pending.imagesSettled = true;

        if (pending.committed) {
            SettleCommittedRender(pending);
        }
        else {
            CommitPendingRender(pending);
        }
    };

    var $images = pending.$grid.find('img');

    if (!$images.length || typeof pending.$grid.imagesLoaded !== 'function') {
        pending.imagesSettled = true;
    }
    else {
        var imageLoader = pending.$grid.imagesLoaded();

        if (imageLoader && typeof imageLoader.always === 'function') {
            imageLoader.always(MarkImagesSettled);
        }
        else {
            pending.imagesSettled = true;
        }
    }

    if (pending.committed) {
        return;
    }

    if (pending.imagesSettled || !canPreserveCurrentGrid) {
        CommitPendingRender(pending);
        return;
    }

    pending.commitTimer = setTimeout(function() {
        CommitPendingRender(pending);
    }, _navigationPreloadTimeout);
};

var UpdateNavigationControls = function() {

    if (!$previous || !$next || !$name) {
        return;
    }

    var hasMultiple = _eligibleCollections.length > 1;
    var activeCollection = _activeCollectionIndex >= 0 ? _eligibleCollections[_activeCollectionIndex] : null;
    var activeName = activeCollection ? activeCollection.name : '';

    $previous
        .prop('disabled', !hasMultiple)
        .attr('aria-hidden', hasMultiple ? 'false' : 'true')
        .attr('hidden', hasMultiple ? null : 'hidden');

    $next
        .prop('disabled', !hasMultiple)
        .attr('aria-hidden', hasMultiple ? 'false' : 'true')
        .attr('hidden', hasMultiple ? null : 'hidden');

    $name
        .prop('disabled', !hasMultiple)
        .attr('aria-disabled', hasMultiple ? 'false' : 'true')
        .attr('aria-label', hasMultiple ? ('Browse featured collections. Current collection: ' + activeName) : ('Current featured collection: ' + activeName))
        .attr('title', hasMultiple ? 'Browse featured collections' : 'No other featured collections for this filter');

    if (!hasMultiple) {
        CloseCollectionMenu({ immediate: true });
    }
};

var RenderActiveCollection = function(opt_options) {

    if (_activeCollectionIndex < 0 || _activeCollectionIndex >= _eligibleCollections.length) {
        return HideArea();
    }

    if (!EnsureStructure()) {
        return;
    }

    var collection = _eligibleCollections[_activeCollectionIndex];
    var orderedGames = GetOrderedGames(collection);

    if (!orderedGames.length) {
        return HideArea();
    }

    var preserveCurrentGrid = opt_options && opt_options.preserveCurrentGrid === true;
    var renderGeneration = ++_renderGeneration;
    var $nextGrid = $('<div id="featuredCollectionsGrid" class="featured-collections-grid" role="list" aria-label="Games in the selected featured collection" />');
    var nextGameLinks = [];

    for (var i = 0, len = orderedGames.length; i < len; ++i) {
        var $item = CreateGameItem(orderedGames[i], renderGeneration, nextGameLinks);

        if ($item) {
            $nextGrid.append($item);
        }
    }

    if (!$nextGrid.children().length || renderGeneration !== _renderGeneration) {
        DisableGameLinks(nextGameLinks);
        return HideArea();
    }

    QueueCollectionRender({
        renderGeneration: renderGeneration,
        collection: collection,
        $grid: $nextGrid,
        gameLinks: nextGameLinks,
        imagesSettled: false,
        committed: false,
        commitTimer: null,
        hardSettleTimer: null
    }, preserveCurrentGrid);
};

var HideArea = function() {

    _renderGeneration++;
    CloseCollectionMenu({ immediate: true });
    CancelPendingRender();
    DestroyRenderedCards();

    if ($wrapper && $wrapper.length) {
        $wrapper
            .empty()
            .attr('hidden', 'hidden')
            .attr('aria-hidden', 'true')
            .removeClass('featured-collections-is-loading')
            .removeAttr('aria-busy')
            .removeAttr('aria-labelledby data-featured-collection-id data-featured-filter');
    }

    $grid = null;
    $header = null;
    $eyebrow = null;
    $titleRow = null;
    $name = null;
    $nameText = null;
    $collectionMenu = null;
    $previous = null;
    $next = null;
};

var RebuildEligibleCollections = function() {

    CloseCollectionMenu({ immediate: true });

    if (!IsPersonalCollectionEstablished()) {
        _eligibleCollections = [];
        _activeCollectionIndex = -1;
        _activeFilter = null;
        return HideArea();
    }

    var filter = ReadActiveFilter();
    var eligible = GetEligibleCollections(filter);

    _activeFilter = filter;
    _eligibleCollections = eligible;

    if (!eligible.length) {
        _activeCollectionIndex = -1;
        return HideArea();
    }

    _activeCollectionIndex = ChooseInitialIndex(eligible);
    RenderActiveCollection();
};

var Navigate = function(offset) {

    if (_eligibleCollections.length < 2 || !_activeFilter) {
        return;
    }

    CloseCollectionMenu({ immediate: true });

    var liveFilter = ReadActiveFilter();

    if (liveFilter !== _activeFilter) {
        return RebuildEligibleCollections();
    }

    _activeCollectionIndex = (_activeCollectionIndex + offset + _eligibleCollections.length) % _eligibleCollections.length;
    RenderActiveCollection({ preserveCurrentGrid: true });
};

var EvaluateCollectionState = function() {

    _collectionStateCheckScheduled = false;

    var established = IsPersonalCollectionEstablished();

    if (_lastEstablishedState === null) {
        _lastEstablishedState = established;
        return RebuildEligibleCollections();
    }

    if (_lastEstablishedState === established) {
        return;
    }

    _lastEstablishedState = established;
    RebuildEligibleCollections();
};

var ScheduleCollectionStateCheck = function() {

    if (_collectionStateCheckScheduled) {
        return;
    }

    _collectionStateCheckScheduled = true;
    setTimeout(EvaluateCollectionState, 0);
};

var ObserveCollectionState = function() {

    if (!$collectionsWrapper.length) {
        return;
    }

    if (window.MutationObserver) {
        _collectionStateObserver = new MutationObserver(ScheduleCollectionStateCheck);
        _collectionStateObserver.observe($collectionsWrapper[0], {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true
        });
    }
    else {
        _collectionStateTimer = setInterval(EvaluateCollectionState, 750);
    }
};

var BindSystemFilter = function() {

    if (!$systemFilter || !$systemFilter.length) {
        return;
    }

    $systemFilter
        .off('change.cesFeaturedBrowser')
        .on('change.cesFeaturedBrowser', function() {
            RebuildEligibleCollections();
        });
};

var BindResize = function() {

    $(window)
        .off('resize.cesFeaturedBrowser')
        .on('resize.cesFeaturedBrowser', function() {
            if (_resizeTimer) {
                clearTimeout(_resizeTimer);
            }

            _resizeTimer = setTimeout(function() {
                _resizeTimer = null;
                ApplyColumnWidths();
            }, 80);
        });
};

var RefreshFeaturedFromServer = function() {

    var refreshGeneration = ++_refreshGeneration;

    _Sync.Get(_baseUrl + '&_=' + refreshGeneration + '-' + new Date().getTime(), function(response) {
        if (refreshGeneration !== _refreshGeneration || !$.isArray(response)) {
            return;
        }

        _self.Sync.Incoming(response);
    });
};

//in order to sync data between server and client, this structure must exist
this.Sync = new (function() {

    var __self = this;
    this.ready = false;

    this.Incoming = function(payload) {
        var nextCollections = NormalizePayload(payload);
        var nextSignature = BuildCollectionsSignature(nextCollections);
        var established = IsPersonalCollectionEstablished();

        if (nextSignature === _collectionsSignature) {
            var establishmentChanged = _lastEstablishedState !== established;
            _lastEstablishedState = established;

            if (establishmentChanged) {
                RebuildEligibleCollections();
            }
            else if (!established) {
                HideArea();
            }
            return;
        }

        _collections = nextCollections;
        _collectionsSignature = nextSignature;
        _lastEstablishedState = established;
        RebuildEligibleCollections();
    };

    this.Outgoing = function() {
        __self.ready = false;
        return;
    };

    return this;
})();

$(document).on('ces.admin.featuredCollections.changed', function() {
    RefreshFeaturedFromServer();
});

BuildSystemAliasMap();
BindSystemFilter();
BindResize();
ObserveCollectionState();
this.Sync.Incoming(_initialSyncPackage);

return this;

});
