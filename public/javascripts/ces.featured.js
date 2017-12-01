var cesFeatured = (function(_Compression, _Preferences, _BoxArt, _Sync, _Tooltips, _PlayGameHandler, $title, $grid, _initialSyncPackage, _OnRemoveHandler) {
    
//private members
var _self = this;
var _grid = null;
var _set = {};
var _BOXSIZE = 120;

var Populate = function(name, set) {
    
    //change title
    $title.text('Featured Collection - ' + name);

    var gridTitles = _grid.isotope('getItemElements');

    //put a flag in each grid item saying this is not in the current collection (unless we find a match later)
    for (var x = 0, xlen = gridTitles.length; x < xlen; ++x) {
        $(gridTitles[x]).data('active', 0);
    }

    //go through all titles in cache
    for (var i = 0, len = set.length; i < len; ++i) {
        
        var currentGk = set[i];

        //does this title already exist in the grid?
        var foundInGrid = false;
        for (var j = 0, jlen = gridTitles.length; j < jlen; ++j) {

            var $gridTitle = $(gridTitles[j]);
            var gridGk = $gridTitle.data('gk');      //take the gk from the element for comparison. will be unique

            //already found in this grid, keep it here
            if (gridGk === currentGk) {
                foundInGrid = true;
                $gridTitle.data('active', 1);
            }
        }

        if (!foundInGrid) {
            AddTitle(currentGk);
        }
    }

    //remove anything from the grid not found
    for (var k = 0, klen = gridTitles.length; k < klen; ++k) {
        var m = $.data(gridTitles[k], 'active');
        if (m === 0) {
            _titlesGrid.isotope('remove', gridTitles[k]);
        }
    }
};

var AddTitle = function(gk) {
    
    //create the grid item
    var $griditem = $('<div class="grid-item" />');

    //place sorting data on grid item
    $griditem.attr('data-gk', gk);
    $griditem.data('active', 1);

    var gameKey = _Compression.Decompress.gamekey(gk);

    var gameLink = new cesGameLink(_BoxArt, gameKey, _BOXSIZE, true, _PlayGameHandler);

    $griditem.append(gameLink.GetDOM()); //add all visual content from gamelink to grid

    //set box image load error
    gameLink.SetImageLoadError(function() {
        _grid.isotope('layout');
    });

    $griditem.find('img').imagesLoaded().progress(function(imgLoad, image) {
        $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
        _grid.isotope('layout');
    });

    _grid.isotope('insert', $griditem[0]);

    return $griditem;
};



//in order to sync data between server and client, this structure must exist
this.Sync = new (function() {

    var __self = this;
    this.ready = false;

    //payload is object with sets as properties, arrays as values of them
    this.Incoming = function(payload) {

        //update local set with those brought by the server. will override/append
        for (var set in payload) {
            if (payload.hasOwnProperty(set)) {
                _set[set] = payload[set];
            }
        }

        var startOnRandom = shuffle(Object.keys(_set))[0]; //crezy I know, just temp

        Populate(startOnRandom, _set[startOnRandom]);
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

    //first, build the grid
    _grid = $grid.isotope({
        layoutMode: 'masonry',
        itemSelector: '.grid-item'
    });

    //parse the incoming sync data from server
    _self.Sync.Incoming(_initialSyncPackage);

})();

return this;

});