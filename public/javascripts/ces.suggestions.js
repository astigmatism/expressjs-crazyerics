/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSuggestions = (function(config, _Compression, PlayGame, $wrapper) {

    //private members
    var self = this;
    var _grid = null;
    var _BOXSIZE = 120;
    var _lastRecipe = null;
    var _currentGameLinks = [];
    var _loading = false;
    var _allowMore = false;

    this.Load = function(recipe, allowMore, callback) {

        _allowMore = allowMore === true || false;

        if (_loading) {
            return;
        }

        Build(recipe, true, function() {

            if (callback) {
                callback();
            }
        })
    };

    this.LoadMore = function(callback) {

        if (!_lastRecipe || _loading || !_allowMore) {
            return;
        }

        Build(_lastRecipe, false, function() {

            if (callback) {
                callback();
            }
        });
    };

    var Build = function(recipe, clear, callback) {

        _lastRecipe = recipe;
        _loading = true;

        //remove all current gamelinks
        if (clear) {
            _grid.isotope('remove', _grid.children());

            //attempt to free mem
            for (var i = 0, len = _currentGameLinks.length; i < len; i++) {
                _currentGameLinks[i] = null;
            }
            _currentGameLinks = [];
        }

        var compressedRecipe = _Compression.Zip.json(recipe);

        $.post('/suggest', {
            'recipe': compressedRecipe

        }, function(response) {

           response = _Compression.Out.json(response);

            for (var i = 0; i < response.length; ++i) {
                
                var gameKey = _Compression.Decompress.gamekey(response[i].gk);

                //spawn new gamelink
                var gamelink = new cesGameLink(config, gameKey, _BOXSIZE, false, PlayGame);

                //create the grid item and insert it
                var $griditem = $('<div class="grid-item" />');
                $griditem.append(gamelink.GetDOM());
                
                _grid.isotope( 'insert', $griditem[0]);
            }

            //functionality for when each images loads
            _grid.find('img').imagesLoaded()
                .progress(function(imgLoad, image) {
                    
                    $(image.img).parent().removeClass('close');
                    _grid.isotope('layout');
                })
                .done(function() {

                    if (callback) {
                        callback();
                    }
                });

            _currentGameLinks.push(gamelink);

            _loading = false; 
        });
    }

    //constructor
    var Constructor = (function() {

        //create grid
        _grid = $wrapper.isotope({
            itemSelector: '.grid-item'
        });

    })();

    return this;

});