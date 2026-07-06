/*
Featured collections share the user collection rail but are server-managed and read-only.
The server sends one featured collection for the page/session; this component renders only
that one pill and reuses normal game-card interactions for the games inside it.
*/
var cesFeatured = (function(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, _PlayGameHandler, _Collections, _initialSyncPackage, _OnRemoveHandler) {

//private members
var _self = this;
var _collection = null;
var _activeFeaturedId = null;
var _titlesGrid = _Collections.GetGrids().titles;
var _collectionsGrid = _Collections.GetGrids().collections;
var _baseUrl = '/featured';
var _isAdminActive = false;
var _featuredCollectionSortType = 'za';

var ReadAdminActive = function() {

    if (window.cesAdmin && window.cesAdmin.IsActive) {
        return window.cesAdmin.IsActive() === true;
    }

    return $('body').hasClass('runtime-admin-active');
};

var CanRenderFeaturedCollection = function() {

    if (_Collections && _Collections.CanShowServerManagedCollections) {
        return _Collections.CanShowServerManagedCollections() === true;
    }

    return true;
};

var FeaturedId = function(collection) {

    if (!collection || collection.id === undefined || collection.id === null) {
        return '';
    }

    return String(collection.id);
};

var BindKeyboardActivate = function($el, handler) {

    $el
        .off('click.featuredCollectionActivate keydown.featuredCollectionActivate')
        .on('click.featuredCollectionActivate', handler)
        .on('keydown.featuredCollectionActivate', function(e) {
            var key = e.which || e.keyCode;
            if (key === 13 || key === 32) {
                e.preventDefault();
                handler.call(this, e);
            }
        });
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

    if (!item || !item.name || !$.isArray(item.gks) || item.gks.length < 1) {
        return null;
    }

    return {
        id: item.id || _Compression.Compress.string(item.name),
        index: typeof item.index === 'number' ? item.index : (index || 0),
        name: item.name,
        gks: item.gks,
        titles: $.isArray(item.titles) ? item.titles : [],
        titleMetadata: NormalizeTitleMetadata(item.titles),
        sort: NormalizeSortName(item.sort),
        asc: NormalizeSortAscending(item.asc),
        type: 'featured',
        readOnly: true,
        editable: false,
        created: item.created,
        updated: item.updated
    };
};

var RemoveCurrentPill = function() {

    if (!_collection || !_collection.gridItem || !_collection.gridItem.length) {
        return;
    }

    _Tooltips.Destroy(_collection.gridItem);
    _collectionsGrid.isotope('remove', _collection.gridItem);
    if (_Collections.LayoutCollectionTabs) {
        _Collections.LayoutCollectionTabs();
    }
    else {
        _collectionsGrid.isotope('layout');
    }
    delete _collection.gridItem;
};

var RemoveFeaturedTitles = function() {

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

var ClearFeaturedIfActive = function(collectionId) {

    if (_activeFeaturedId !== collectionId) {
        return;
    }

    RemoveFeaturedTitles();
    _Collections.SetActiveCollectionId(null, null);
    _activeFeaturedId = null;
};

var Render = function() {

    var collectionId = _collection ? FeaturedId(_collection) : null;

    if (!_collection) {
        _Collections.SetFeaturedAvailable(false);
        return;
    }

    _Collections.SetFeaturedAvailable(true);

    if (!CanRenderFeaturedCollection()) {
        RemoveCurrentPill();
        ClearFeaturedIfActive(collectionId);
        return;
    }

    if (!_collection.gridItem || !_collection.gridItem.length || !$.contains(document, _collection.gridItem[0])) {
        _collection.gridItem = AddCollection(_collection);
    }

    UpdateCollectionGridItem(_collection);
    _collectionsGrid.isotope('updateSortData');
    if (_Collections.LayoutCollectionTabs) {
        _Collections.LayoutCollectionTabs({ sortBy : 'type' });
    }
    else {
        _collectionsGrid.isotope({ sortBy : 'type' });
    }
};

var AddCollection = function(collection) {

    var $griditem = $('<div class="grid-item collection-tab collection-tab-featured" />');

    $griditem.data('type', _featuredCollectionSortType);
    _collectionsGrid.isotope('insert', $griditem[0]);
    if (_Collections.LayoutCollectionTabs) {
        _Collections.LayoutCollectionTabs({ sortBy : 'type' });
    }

    return $griditem;
};

var UpdateCollectionGridItem = function(collection) {

    var $griditem = collection.gridItem;
    var $name = $griditem.find('.collection-tab-name').first();
    var $star = $griditem.find('.collection-tab-featured-star').first();
    var $delete = $griditem.find('.collection-featured-delete').first();

    $griditem
        .data('id', collection.id)
        .data('type', _featuredCollectionSortType)
        .data('collectionType', 'featured')
        .attr('role', 'tab')
        .attr('tabindex', '0')
        .attr('aria-controls', 'openCollectionGrid')
        .attr('aria-selected', _activeFeaturedId === FeaturedId(collection) ? 'true' : 'false')
        .attr('aria-label', 'Open featured collection ' + collection.name);

    if (!$name.length) {
        $griditem.empty();
        $star = $('<span class="collection-tab-featured-star" aria-hidden="true" />');
        $name = $('<span class="collection-tab-name" />');
        $griditem.append($star);
        $griditem.append($name);
    }
    else if (!$star.length) {
        $star = $('<span class="collection-tab-featured-star" aria-hidden="true" />');
        $name.before($star);
    }

    $star.text('\u2605');
    $name.text(collection.name);

    if (_isAdminActive && collection.id) {
        $griditem.addClass('collection-tab-has-featured-delete');

        if (!$delete.length) {
            $delete = $('<button type="button" class="collection-featured-delete" />');
            $griditem.append($delete);
        }

        $delete
            .text('×')
            .attr('aria-label', 'Delete featured collection ' + collection.name)
            .off('click.featuredDelete keydown.featuredDelete')
            .on('click.featuredDelete', function(e) {
                e.preventDefault();
                e.stopPropagation();
                DeleteCollection(collection);
            })
            .on('keydown.featuredDelete', function(e) {
                var key = e.which || e.keyCode;
                if (key === 13 || key === 32) {
                    e.preventDefault();
                    e.stopPropagation();
                    DeleteCollection(collection);
                }
            });
    }
    else {
        $griditem.removeClass('collection-tab-has-featured-delete');
        if ($delete.length) {
            $delete.remove();
        }
    }

    BindKeyboardActivate($griditem, function(e) {
        if ($(e.target).closest('.collection-featured-delete').length) {
            return;
        }

        OpenFeaturedCollection(collection);
    });
};

var OpenFeaturedCollection = function(collection) {

    if (!CanRenderFeaturedCollection()) {
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
        type: 'featured',
        editable: false,
        readOnly: true,
        count: collection.gks.length
    });

    _activeFeaturedId = FeaturedId(collection);
    Populate(collection);
};

var Populate = function(collection) {

    if (_Collections.HoldCollectionPanelHeight) {
        _Collections.HoldCollectionPanelHeight();
    }

    RemoveFeaturedTitles();

    for (var i = 0, len = collection.gks.length; i < len; ++i) {
        AddTitle(collection.gks[i], i, GetTitleMetadata(collection, collection.gks[i]));
    }

    ApplyFeaturedSort(collection);

    if (_Collections.ReleaseCollectionPanelHeight) {
        _Collections.ReleaseCollectionPanelHeight();
    }

    _Tooltips.Any();
};

var ApplyFeaturedSort = function(collection) {

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
    else if (collection && collection.sort === 'name') {
        _titlesGrid.isotope('updateSortData').isotope({
            sortBy: 'name',
            sortAscending: collection.asc === true
        });
    }
    else {
        // Preserve the curated/published game order for sort modes whose original
        // personal-collection data is user-specific or unavailable to featured viewers.
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

    var $griditem = $('<div class="grid-item collection-grid-item featured-grid-item collection-card-awaiting-entry" />');

    $griditem.data('gk', gk);
    $griditem.data('active', 1);
    $griditem.data('name', gameKey.title);
    $griditem.data('system', gameKey.system);
    $griditem.data('type', 'featured');
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

var DeleteCollection = function(collection) {

    if (!_isAdminActive || !collection || !collection.id) {
        return;
    }

    if (!confirm('Delete featured collection "' + collection.name + '"?')) {
        return;
    }

    if (collection.gridItem && collection.gridItem.length) {
        collection.gridItem.addClass('collection-tab-saving');
    }

    _Sync.Delete(_baseUrl + '?id=' + encodeURIComponent(collection.id), function(response) {
        if (response && response.ok === false && collection.gridItem && collection.gridItem.length) {
            collection.gridItem.removeClass('collection-tab-saving');
        }
    });
};

//in order to sync data between server and client, this structure must exist
this.Sync = new (function() {

    var __self = this;
    this.ready = false;

    this.Incoming = function(payload) {

        var nextCollection = null;

        payload = payload || [];

        if (payload.length > 0) {
            nextCollection = NormalizeCollection(payload[0], 0);
        }

        if (_collection && (!nextCollection || FeaturedId(_collection) !== FeaturedId(nextCollection))) {
            var oldId = FeaturedId(_collection);
            RemoveCurrentPill();
            ClearFeaturedIfActive(oldId);
        }

        _collection = nextCollection;
        Render();
    };

    this.Outgoing = function() {
        __self.ready = false;
        return;
    };

    return this;
})();

$(document).on('ces.admin.state', function(e, active) {
    _isAdminActive = active === true;
    Render();
});

$(document).on('ces.collections.serverManagedVisibility', function(e, visible) {
    Render();
});

_isAdminActive = ReadAdminActive();
this.Sync.Incoming(_initialSyncPackage);

return this;

});
