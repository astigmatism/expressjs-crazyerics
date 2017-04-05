/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSuggestions = (function(config, _Compression, PlayGame, $wrapper) {

    //private members
    var self = this;
    var suggestionsCurrentlyLoading = false;
    var cachedSuggestionRequests = [];
    var _grid = null;
    var _BOXSIZE = 120;

    this.Load = function(url, remove, loadMore, callback) {

        //remove all current gamelinks
        if (remove) {
            _grid.isotope('remove', _grid.children())
        }

        $.getJSON(url, function(response) {

            response = _Compression.Out.json(response);

            for (var i = 0; i < response.length; ++i) {
                
                //spawn new gamelink
                var gamelink = new cesGameLink(config, _Compression, PlayGame, response[i].system, response[i].title, response[i].file, _BOXSIZE, false);

                //create the grid item and insert it
                var $griditem = $('<div class="grid-item" />');
                $griditem.append(gamelink.GetDOM());
                
                _grid.isotope( 'insert', $griditem[0]);
            }

            //functionality for when each images loads
            _grid.find('img').imagesLoaded().progress(function(imgLoad, image) {
                
                $(image.img).parent().removeClass('close');
                _grid.isotope('layout');
            });

            if (callback) {
                callback();
            }
        });
    };

    //constructor
    var Constructor = (function() {

        //create grid
        _grid = $wrapper.isotope({
            itemSelector: '.grid-item'
        });

    })();

    return this;

});