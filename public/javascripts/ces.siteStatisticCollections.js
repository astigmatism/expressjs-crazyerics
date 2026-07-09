/*
Site statistic collections are server-generated, read-only collections based on
site-wide activity data. The server keeps the full configured set cached, then
supplies the configured non-empty statistic collections to display beside Featured. They share
the collection rail and game-card grid with user and featured collections but are
not editable or admin-published.
*/
var cesSiteStatisticCollections = (function(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, _PlayGameHandler, _Collections, _initialSyncPackage, _OnRemoveHandler) {

//private members
var _self = this;
var _collections = [];
var _collectionMap = {};
var _activeCollectionId = null;
var _titlesGrid = _Collections.GetGrids().titles;
var _collectionsGrid = _Collections.GetGrids().collections;
var _baseUrl = '/site-statistic-collections';
var _collectionSortPrefix = 'zb';
var _pollTimer = null;
var _pollInFlight = false;
var _defaultPollIntervalSeconds = 300;
var _minimumPollIntervalSeconds = 30;

var BindKeyboardActivate = function($el, handler) {

    $el
        .off('click.siteStatisticCollectionActivate keydown.siteStatisticCollectionActivate')
        .on('click.siteStatisticCollectionActivate', handler)
        .on('keydown.siteStatisticCollectionActivate', function(e) {
            var key = e.which || e.keyCode;
            if (key === 13 || key === 32) {
                e.preventDefault();
                handler.call(this, e);
            }
        });
};

var NormalizeIdentifier = function(value) {
    value = String(value || '').toLowerCase().trim();
    value = value.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    return value || null;
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

var NormalizeDateTicks = function(value) {

    if (!value) {
        return 0;
    }

    if (typeof value === 'number') {
        return value;
    }

    var date = new Date(value);
    var ticks = date.getTime();

    return isNaN(ticks) ? 0 : ticks;
};

var NormalizeTitleMetadata = function(titles) {

    var result = {};

    if (!$.isArray(titles)) {
        return result;
    }

    for (var i = 0, len = titles.length; i < len; ++i) {
        if (titles[i] && titles[i].gk) {
            result[titles[i].gk] = titles[i];
        }
    }

    return result;
};

var GetTitleMetadata = function(collection, gk) {

    if (!collection || !collection.titleMetadata || !gk) {
        return null;
    }

    return collection.titleMetadata[gk] || null;
};

var NormalizeCollection = function(item, index) {

    var name;
    var id;

    if (!item || !$.isArray(item.gks) || item.gks.length < 1) {
        return null;
    }

    name = String(item.label || item.name || '').replace(/\s+/g, ' ').trim();
    id = NormalizeIdentifier(item.id || name);

    if (!name || !id) {
        return null;
    }

    return {
        id: id,
        index: typeof item.index === 'number' ? item.index : (index || 0),
        name: name,
        label: name,
        icon: String(item.icon || '').trim() || '\u25c6',
        statisticType: item.statisticType || item.type || null,
        system: item.system || null,
        systemName: item.systemName || null,
        gks: item.gks,
        titles: $.isArray(item.titles) ? item.titles : [],
        titleMetadata: NormalizeTitleMetadata(item.titles),
        sort: NormalizeSortName(item.sort),
        asc: NormalizeSortAscending(item.asc),
        type: 'site-statistic',
        readOnly: true,
        editable: false,
        count: item.count || item.gks.length,
        generated: item.generated,
        updated: item.updated
    };
};

var NormalizePayload = function(payload) {

    var rawCollections;
    var collections = [];

    payload = payload || {};
    rawCollections = $.isArray(payload) ? payload : payload.collections;
    rawCollections = $.isArray(rawCollections) ? rawCollections : [];

    for (var i = 0, len = rawCollections.length; i < len; ++i) {
        var collection = NormalizeCollection(rawCollections[i], i);

        if (collection) {
            collection.index = collections.length;
            collections.push(collection);
        }
    }

    return {
        collections: collections,
        refreshIntervalSeconds: NormalizeRefreshInterval(payload.refreshIntervalSeconds),
        refreshedAt: payload.refreshedAt || null
    };
};

var NormalizeRefreshInterval = function(value) {

    value = parseInt(value, 10);

    if (isNaN(value) || value < 1) {
        value = _defaultPollIntervalSeconds;
    }

    if (value < _minimumPollIntervalSeconds) {
        value = _minimumPollIntervalSeconds;
    }

    return value;
};

var BuildSortType = function(index) {

    index = parseInt(index, 10);

    if (isNaN(index) || index < 0) {
        index = 0;
    }

    return _collectionSortPrefix + ('000' + index).slice(-4);
};

var SetSiteStatisticAvailable = function(available) {

    if (_Collections.SetSiteStatisticCollectionsAvailable) {
        _Collections.SetSiteStatisticCollectionsAvailable(available === true);
    }
    else {
        _Collections.SetFeaturedAvailable(available === true);
    }
};

var CanRenderSiteStatisticCollections = function() {

    if (!_collectionsGrid || !_collectionsGrid.length) {
        return false;
    }

    if (_Collections && _Collections.CanShowServerManagedCollections) {
        return _Collections.CanShowServerManagedCollections() === true;
    }

    return true;
};

var RemoveCollectionPill = function(collection) {

    if (!collection || !collection.gridItem || !collection.gridItem.length) {
        return;
    }

    _Tooltips.Destroy(collection.gridItem);
    if (!_collectionsGrid || !_collectionsGrid.length) {
        delete collection.gridItem;
        return;
    }

    _collectionsGrid.isotope('remove', collection.gridItem);
    if (_Collections.LayoutCollectionTabs) {
        _Collections.LayoutCollectionTabs();
    }
    else {
        _collectionsGrid.isotope('layout');
    }
    delete collection.gridItem;
};

var RemoveSiteStatisticTitles = function() {

    var gridTitles = _titlesGrid.isotope('getItemElements');

    if (!gridTitles || gridTitles.length < 1) {
        return;
    }

    for (var i = 0, len = gridTitles.length; i < len; ++i) {
        _Tooltips.Destroy($(gridTitles[i]));
    }

    _titlesGrid.isotope('remove', gridTitles).isotope('layout');
    _Tooltips.Any();
};

var ClearSiteStatisticIfActive = function(collectionId, wasActive) {

    if (!wasActive) {
        if (_activeCollectionId === collectionId) {
            _activeCollectionId = null;
        }
        return;
    }

    RemoveSiteStatisticTitles();
    _Collections.SetActiveCollectionId(null, null);
    _activeCollectionId = null;
};

var Render = function() {

    var nextMap = {};
    var activeCollection = null;

    SetSiteStatisticAvailable(_collections.length > 0);

    if (!CanRenderSiteStatisticCollections()) {
        for (var hiddenId in _collectionMap) {
            if (_collectionMap.hasOwnProperty(hiddenId)) {
                var wasHiddenActive = _collectionMap[hiddenId].gridItem && _collectionMap[hiddenId].gridItem.hasClass('on');
                RemoveCollectionPill(_collectionMap[hiddenId]);
                ClearSiteStatisticIfActive(hiddenId, wasHiddenActive);
            }
        }

        _collectionMap = {};
        return;
    }

    for (var i = 0, len = _collections.length; i < len; ++i) {
        var collection = _collections[i];
        var existing = _collectionMap[collection.id];

        if (existing && existing.gridItem && existing.gridItem.length && $.contains(document, existing.gridItem[0])) {
            collection.gridItem = existing.gridItem;
        }

        if (!collection.gridItem || !collection.gridItem.length || !$.contains(document, collection.gridItem[0])) {
            collection.gridItem = AddCollection(collection);
        }

        if (_activeCollectionId === collection.id && (!collection.gridItem || !collection.gridItem.hasClass('on'))) {
            _activeCollectionId = null;
        }

        UpdateCollectionGridItem(collection);
        nextMap[collection.id] = collection;

        if (_activeCollectionId === collection.id && collection.gridItem && collection.gridItem.hasClass('on')) {
            activeCollection = collection;
        }
    }

    for (var id in _collectionMap) {
        if (_collectionMap.hasOwnProperty(id) && !nextMap[id]) {
            var wasActive = _collectionMap[id].gridItem && _collectionMap[id].gridItem.hasClass('on');
            RemoveCollectionPill(_collectionMap[id]);
            ClearSiteStatisticIfActive(id, wasActive);
        }
    }

    _collectionMap = nextMap;
    _collectionsGrid.isotope('updateSortData');
    if (_Collections.LayoutCollectionTabs) {
        _Collections.LayoutCollectionTabs({ sortBy : 'type' });
    }
    else {
        _collectionsGrid.isotope({ sortBy : 'type' });
    }

    if (activeCollection) {
        OpenSiteStatisticCollection(activeCollection, true);
    }
};

var AddCollection = function(collection) {

    var $griditem = $('<div class="grid-item collection-tab collection-tab-site-statistic" />');

    $griditem.data('type', BuildSortType(collection.index));
    _collectionsGrid.isotope('insert', $griditem[0]);
    if (_Collections.LayoutCollectionTabs) {
        _Collections.LayoutCollectionTabs({ sortBy : 'type' });
    }

    return $griditem;
};

var UpdateCollectionGridItem = function(collection) {

    var $griditem = collection.gridItem;
    var $name = $griditem.find('.collection-tab-name').first();
    var $icon = $griditem.find('.collection-tab-site-statistic-icon').first();

    $griditem
        .data('id', collection.id)
        .data('type', BuildSortType(collection.index))
        .data('collectionType', 'site-statistic')
        .attr('role', 'tab')
        .attr('tabindex', '0')
        .attr('aria-controls', 'openCollectionGrid')
        .attr('aria-selected', _activeCollectionId === collection.id ? 'true' : 'false')
        .attr('aria-label', 'Open site statistic collection ' + collection.name);

    if (!$name.length) {
        $griditem.empty();
        $icon = $('<span class="collection-tab-site-statistic-icon" aria-hidden="true" />');
        $name = $('<span class="collection-tab-name" />');
        $griditem.append($icon);
        $griditem.append($name);
    }
    else if (!$icon.length) {
        $icon = $('<span class="collection-tab-site-statistic-icon" aria-hidden="true" />');
        $name.before($icon);
    }

    $icon.text(collection.icon || '\u25c6');
    $name.text(collection.name);

    BindKeyboardActivate($griditem, function() {
        OpenSiteStatisticCollection(collection);
    });
};

var OpenSiteStatisticCollection = function(collection, suppressPopulateIfMissing) {

    if (!collection || !CanRenderSiteStatisticCollections()) {
        return;
    }

    _collectionsGrid.find('.grid-item').removeClass('on').attr('aria-selected', 'false').removeAttr('aria-current');

    if (collection.gridItem && collection.gridItem.length) {
        collection.gridItem.addClass('on').attr('aria-selected', 'true').attr('aria-current', 'true');
    }

    _Collections.SetActiveCollectionId(collection.id, {
        id: collection.id,
        name: collection.name,
        sort: collection.sort,
        asc: collection.asc,
        type: 'site-statistic',
        statisticType: collection.statisticType,
        system: collection.system,
        editable: false,
        readOnly: true,
        count: collection.gks.length
    });

    _activeCollectionId = collection.id;

    if (suppressPopulateIfMissing && !collection.gks.length) {
        return;
    }

    Populate(collection);
};

var Populate = function(collection) {

    if (_Collections.HoldCollectionPanelHeight) {
        _Collections.HoldCollectionPanelHeight();
    }

    RemoveSiteStatisticTitles();

    for (var i = 0, len = collection.gks.length; i < len; ++i) {
        AddTitle(collection.gks[i], i, GetTitleMetadata(collection, collection.gks[i]));
    }

    ApplySiteStatisticSort(collection);

    if (_Collections.ReleaseCollectionPanelHeight) {
        _Collections.ReleaseCollectionPanelHeight();
    }

    _Tooltips.Any();
};

var ApplySiteStatisticSort = function(collection) {

    if (collection && collection.sort === 'releaseDate') {
        _titlesGrid.isotope('updateSortData').isotope({
            sortBy: ['releaseMissing', 'releaseDate', 'name'],
            sortAscending: {
                releaseMissing: true,
                releaseDate: collection.asc === false ? false : true,
                name: true
            }
        });
    }
    else if (collection && (collection.sort === 'lastPlayed' || collection.sort === 'playCount' || collection.sort === 'name')) {
        _titlesGrid.isotope('updateSortData').isotope({
            sortBy: collection.sort,
            sortAscending: collection.asc === true
        });
    }
    else {
        _titlesGrid.isotope({
            sortBy: 'original-order',
            sortAscending: true
        });
    }

    _titlesGrid.isotope('layout');
};

var AddTitle = function(gk, batchIndex, titleMetadata) {

    var gameKey;

    try {
        gameKey = _Compression.Decompress.gamekey(gk);
    }
    catch (err) {
        return null;
    }

    if (!gameKey || !gameKey.gk) {
        return null;
    }

    var $griditem = $('<div class="grid-item collection-grid-item site-statistic-grid-item collection-card-awaiting-entry" />');

    $griditem.data('gk', gk);
    $griditem.data('active', 1);
    $griditem.data('name', gameKey.title);
    $griditem.data('system', gameKey.system);
    $griditem.data('type', 'site-statistic');
    $griditem.data('playCount', titleMetadata && titleMetadata.playCount ? titleMetadata.playCount : 0);
    $griditem.data('lastPlayed', titleMetadata && titleMetadata.lastPlayed ? NormalizeDateTicks(titleMetadata.lastPlayed) : 0);
    ApplyReleaseSortData($griditem, titleMetadata && titleMetadata.releaseSort);

    var OnImageLoaded = function(image) {
        _titlesGrid.isotope('layout');
    };

    var gameLink = new cesGameLink(_config, _Media, _Tooltips, _Collections, gameKey, 'a', true, _PlayGameHandler, OnImageLoaded, false, true);

    $griditem.append(gameLink.GetDOM());
    _titlesGrid.isotope('insert', $griditem[0]);

    if (_Collections.StartCollectionTitleEntry) {
        _Collections.StartCollectionTitleEntry($griditem, batchIndex);
    }

    return $griditem;
};

var StartPoll = function(intervalSeconds) {

    intervalSeconds = NormalizeRefreshInterval(intervalSeconds);

    if (_pollTimer) {
        clearInterval(_pollTimer);
        _pollTimer = null;
    }

    _pollTimer = setInterval(function() {
        RefreshFromServer();
    }, intervalSeconds * 1000);
};

var BuildRefreshUrl = function() {

    if (_collections.length === 1 && _collections[0] && _collections[0].id) {
        return _baseUrl + '/' + encodeURIComponent(_collections[0].id);
    }

    return _baseUrl;
};

var RefreshFromServer = function() {

    if (_pollInFlight) {
        return;
    }

    _pollInFlight = true;

    _Sync.Get(BuildRefreshUrl(), function(payload) {
        _pollInFlight = false;
        _self.Sync.Incoming(payload);
    });
};

//in order to sync data between server and client, this structure must exist
this.Sync = new (function() {

    var __self = this;
    this.ready = false;

    this.Incoming = function(payload) {

        var normalized = NormalizePayload(payload);

        _collections = normalized.collections;
        Render();
        StartPoll(normalized.refreshIntervalSeconds);
    };

    this.Outgoing = function() {
        __self.ready = false;
        return;
    };

    return this;
})();

$(document).on('ces.collections.serverManagedVisibility', function(e, visible) {
    Render();
});

this.Sync.Incoming(_initialSyncPackage);

return this;

});
