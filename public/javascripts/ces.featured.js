/*
This component is unique in that it depends upon Collections which was built just before it (see ces.main). It takes in references to the
two isotope grids which the collections component initialized
*/
var cesFeatured = (function(_config, _Compression, _Preferences, _Images, _Sync, _Tooltips, _PlayGameHandler, _Collections, _initialSyncPackage, _OnRemoveHandler) {
    
//private members
var _self = this;
var _set = {};
var _currentIndex = 0;
var _BOXSIZE = 120;
var _titlesGrid = _Collections.GetGrids().titles;
var _collectionsGrid = _Collections.GetGrids().collections;
var _baseUrl = '/featured';

var Populate = function(collection) {

    var gridTitles = _titlesGrid.isotope('getItemElements');

    //put a flag in each grid item saying this is not in the current collection (unless we find a match later)
    for (var x = 0, xlen = gridTitles.length; x < xlen; ++x) {
        $(gridTitles[x]).data('active', 0);
    }

    //go through all titles in cache
    for (var i = 0, len = collection.gks.length; i < len; ++i) {
        
        //dont try and find preexisting, just wipe it out and start over
        AddTitle(collection.gks[i]);
    }

    //remove anything from the grid not found
    for (var k = 0, klen = gridTitles.length; k < klen; ++k) {
        var m = $.data(gridTitles[k], 'active');
        if (m === 0) {
            _titlesGrid.isotope('remove', gridTitles[k]);
        }
    }

    //restore to original collection sort
    _titlesGrid.isotope({
        sortBy: 'original-order',
        sortAscending: true
    });

    _Tooltips.Any();
};

var AddTitle = function(gk) {
    
    //create the grid item
    var $griditem = $('<div class="grid-item" />');

    //place sorting data on grid item
    $griditem.attr('data-gk', gk);
    $griditem.data('active', 1);
    $griditem.data('type', 'feature');

    var gameKey = _Compression.Decompress.gamekey(gk);

    var gameLink = new cesGameLink(_config, _Images, _Tooltips, gameKey, _BOXSIZE, true, _PlayGameHandler);

    $griditem.append(gameLink.GetDOM()); //add all visual content from gamelink to grid

    //set box image load error
    gameLink.SetImageLoadError(function() {
        _titlesGrid.isotope('layout');
    });

    $griditem.find('img').imagesLoaded().progress(function(imgLoad, image) {
        $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
        _titlesGrid.isotope('layout');
    });

    _titlesGrid.isotope('insert', $griditem[0]);

    return $griditem;
};

var PopulateCollections = function() {

    var items = _collectionsGrid.isotope('getItemElements');
    
    //go through all collection names in cache
    for (var key in _set) {

        var collection = _set[key];

        //if not in grid, wont have griditem property, add it
        if (!collection.hasOwnProperty('gridItem')) {
            collection.gridItem = AddCollection(collection);
        }

        //generate new toolips content
        var $tooltipContent = GenerateCollectionTooltipContent(collection);   //generate html specific for collections
        _Tooltips.SingleHTML(collection.gridItem, $tooltipContent); //reapply tooltips
    }
};

var AddCollection = function(collection) {
    
    //create the grid item
    var $griditem = $('<div class="grid-item" />');

    $griditem.data('id', collection.id);
    //place sorting data on grid item
    
    $griditem.data('type', collection.type || 'd');

    //if making this collection a feature
    if (collection.name === '!') {
        //add a tooltip
        $griditem.attr('title', 'Load Another Featured Collection');
        $griditem.addClass('tooltip');
        $griditem.append('<div class="loadFeature" />');
        $griditem.on('click', function() {
            //use sync to get the next featured collection.
            //here i am using sync purely for compressing data from the server, it does not go through the routine
            //of using client sync and the incoming funtion, just returns the pure data from the call, so we have to call it directly
            _Sync.Get(_baseUrl + '?i=' + _currentIndex++, function(data) {
                _self.Sync.Incoming(data);
            }); 
        });
    }
    else {

        $griditem.append('Featured Collection: ' + collection.name);

        $griditem.on('click', function() {
            $(this).parent().find('.grid-item').removeClass('on');
            $(this).addClass('on');

            _Collections.SetActiveCollectionId(collection.id);
            
            Populate(collection);
        });
    }

    _collectionsGrid.isotope('insert', $griditem[0]);
    _collectionsGrid.isotope({ sortBy : 'type' });

    return $griditem;
};

var GenerateCollectionTooltipContent = function(collection) {
    
    //create the tooltip content
    var $tooltipContent = $('<div class="collection-tooltip" />');
    
    // $loadMore = $('<div class="pointer">Load Another Featured Collection</div>');
    // $loadMore.on('click', function() {

    //     //use sync to get the next featured collection.
    //     //here i am using sync purely for compressing data from the server, it does not go through the routine
    //     //of using client sync and the incoming funtion, just returns the pure data from the call, so we have to call it directly
    //     _Sync.Get(_baseUrl + '?i=' + _currentIndex++, function(data) {
    //         _self.Sync.Incoming(data);
    //     });
    // });
    // $tooltipContent.append($loadMore);

    $remove = $('<div class="remove">Remove</div>');
    $remove.on('click', function() {
        $remove.off('click');
        if (collection.gridItem.hasClass('on')) {

        }
        _collectionsGrid.isotope('remove', collection.gridItem).isotope('layout'); //immediately remove from grid (i used to wait for response but why right?)        
    });
    $tooltipContent.append($remove);

    return $tooltipContent;
};


//in order to sync data between server and client, this structure must exist
this.Sync = new (function() {

    var __self = this;
    this.ready = false;

    /*
    payload: [
        {
            index: Number
            name: String
            set: []
        }
    ]
    */

    this.Incoming = function(payload) {

        if (!payload) {
            return;
        }

        for (var i = 0, len = payload.length; i < len; ++i) {

            //store by name internally, will update local cache
            var item = payload[i];
            _set[item.name] = {
                index: item.index,
                gks: item.gks,
                id: _Compression.Compress.string(item.name),
                name: item.name
            };

            // for (var j = 0; j < item.gks.length; ++j) {
            //     var gameKey = _Compression.Decompress.gamekey(item.gks[j]);
            //     console.log(gameKey.title);
            // }
        }

        PopulateCollections();

        //select feature when collections is empty
        if (_Collections.IsEmpty()) {
            
            //select a feature
            // var keys = Object.keys(_set);
            // if (keys.length > 0) {
            //     if (_set[keys[0]].hasOwnProperty('gridItem')) {
            //         $(_set[keys[0]].gridItem).click();
            //     }
            // }
        }
    };

    this.Outgoing = function() {
        __self.reday = false;
        return;
    };

    return this;
})();

/**
 * Constructors live at the bottom so that all private functions are available
 * @param  {} function(
 */
var Constructor = (function() {

    if (!_initialSyncPackage) return;

    //parse the incoming sync data from server
    _self.Sync.Incoming(_initialSyncPackage);

    $loadMore = AddCollection({
        name: '!', 
        type: 'e'
    });

    //also save off the highest index returned, we will increment it to retrieve the next feature
    for (var i = 0, len = _initialSyncPackage.length; i < len; ++i) {
        if (_initialSyncPackage[i].hasOwnProperty('index')) {
            var index = parseInt(_initialSyncPackage[i].index, 10);
            if (index > _currentIndex) {
                _currentIndex = index;
            }
        }
    }
})();

return this;

});