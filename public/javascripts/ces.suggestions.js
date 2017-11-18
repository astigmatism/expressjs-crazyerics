/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSuggestions = (function(_BoxArt, _Compression, PlayGame, $wrapper) {

    //private members
    var self = this;
    var _grid = null;
    var _BOXSIZE = 120;
    var _lastRecipe = null;
    var _currentGameLinks = [];
    var _loading = false;
    var _allowMore = false;

    this.Load = function(recipe, allowMore, callback, opt_canned) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;
        _allowMore = (allowMore == true) ? true : false;

        if (_loading) {
            return;
        }

        _lastRecipe = {
            recipe: recipe,
            canned: opt_canned
        };
        _loading = true;

        Clear();
        Fetch(recipe, function (err, suggestions) {

            Build(suggestions, function() {

                _loading = false; 

                if (callback) {
                    callback();
                }
            });

        }, opt_canned);
    };

    this.LoadMore = function(callback) {

        if (!_lastRecipe || _loading || !_allowMore) {
            return;
        }

        Fetch(_lastRecipe.recipe, function (err, suggestions) {

            Build(suggestions, function() {

                _loading = false;

                if (callback) {
                    callback();
                }
            });

        }, _lastRecipe.canned);
    };

    var Fetch = function(recipe, callback, opt_canned) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;

        if (opt_canned) {

            $.get('/suggest?rp=' + recipe, function(response) {
                response = _Compression.Out.json(response);
                callback(null, response);
            });
        } 
        else {
            var compressedRecipe = _Compression.Zip.json(recipe);

            $.post('/suggest', {
                'recipe': compressedRecipe

            }, function(response) {
                response = _Compression.Out.json(response);
                callback(null, response);
            });
        }
    };

    var Clear = function() {
        _grid.isotope('remove', _grid.children());

        //attempt to free mem
        for (var i = 0, len = _currentGameLinks.length; i < len; i++) {
            _currentGameLinks[i] = null;
        }
        _currentGameLinks = [];
    };

    var Build = function(suggestions, callback) {

        var gamelink;
    
        for (var i = 0; i < suggestions.length; ++i) {
            
            var gameKey = _Compression.Decompress.gamekey(suggestions[i].gk);

            //spawn new gamelink
            gamelink = new cesGameLink(_BoxArt, gameKey, _BOXSIZE, true, PlayGame);

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