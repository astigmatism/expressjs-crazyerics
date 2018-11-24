/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSuggestions = (function(_config, _Media, _Compression, _Tooltips, PlayGameHandler, $grid, $wrapper) {

    //private members
    var self = this;
    var _grid = null;
    var _lastRecipe = null;
    var _currentGameLinks = [];
    var _loading = false;
    var _loadingRequestCount = 0; //a handle on the number of requests send to the server
    var _page = 0;
    var _loadingIcon = 'Blocks-1s-61px.svg';
    var $loading;
    var $loadingAnimations = ['flipInX', 'pulse', 'flipOutX']; //in, stay, out

    this.Load = function(recipe, callback, opt_canned, _opt_alphaHelper) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;
        _page = 0;

        //the option to allow requests to finish before loadng more. I decided to disable this even though
        //it means multiple requests have to finish before new ones are made for the next set of suggestions
        if (_loading) {
            //return;
        }

        //if an alpha recipe, allow the functionality of the "reveal more"
        if (_opt_alphaHelper) {
            $('#browse-show-obscure').removeAttr("disabled");
        } else {
            $('#browse-show-obscure').attr("disabled", true);
        }

        //include page on recipe, canned recipes are strings, normal are json
        if (!opt_canned) {
            recipe.page = _page;
        }

        _lastRecipe = {
            recipe: recipe,
            canned: opt_canned
        };
        _loading = true;

        Clear();

        FetchAndBuild(recipe, opt_canned, callback);
    };

    //load more is triggered at bottom of window
    this.LoadMore = function(callback) {

        //conditions for bail
        if (!_lastRecipe || _loading) {
            return;
        }

        _page++; //pagination increases. only matters for non-randominzed recipes

        _lastRecipe.recipe.page = _page; //include new pagination on recipe

        FetchAndBuild(_lastRecipe.recipe, _lastRecipe.canned, callback);
    };

    var FetchAndBuild = function(recipe, opt_canned, callback) {

        Fetch(recipe, function (err, suggestions) {

            Build(suggestions, function() {

                _loading = false;
                _loadingRequestCount--;

                if (_loadingRequestCount < 1) {
                    
                    //outro 
                    $loading.addClass('transparent').cssAnimation($loadingAnimations[2], 1000);
                }

                if (callback) {
                    callback();
                }
            });

        }, opt_canned);
    };

    var Fetch = function(recipe, callback, opt_canned) {

        _loadingRequestCount++;

        //animation intro and stay
        $loading.removeClass('transparent').cssAnimation($loadingAnimations[0], 1000, false, function(item) {
            $loading.cssAnimation($loadingAnimations[1], 1000, true);
        });

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
        $grid.height(0);

        //attempt to free mem
        for (var i = 0, len = _currentGameLinks.length; i < len; i++) {
            _currentGameLinks[i] = null;
        }
        _currentGameLinks = [];
    };

    var Build = function(suggestions, callback) {

        var gamelink;

        if (!suggestions) {
            return callback();
        }
    
        for (var i = 0; i < suggestions.length; ++i) {
            
            var gameKey = _Compression.Decompress.gamekey(suggestions[i]);

            var OnImageLoaded = function(image) {
                _grid.isotope('layout');
            };

            //spawn new gamelink
            gamelink = new cesGameLink(_config, _Media, _Tooltips, gameKey, 'a', true, PlayGameHandler, OnImageLoaded);

            //create the grid item and insert it
            var $griditem = $('<div class="grid-item" />');
            $griditem.append(gamelink.GetDOM());
            
            _grid.isotope( 'insert', $griditem[0]);
        }

        //functionality for when each images loads
        _grid.find('img').imagesLoaded()
            .done(function() {

                return callback();
            });

        _currentGameLinks.push(gamelink);
    };

    //constructor
    var Constructor = (function() {

        $loading = $('#suggestionsloading');
        $loading.css('background-image','url("' + _config.paths.images + '/' + _loadingIcon + '")');
    

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

        //create grid
        _grid = $grid.isotope({
            itemSelector: '.grid-item'
        });

    })();

    return this;

});