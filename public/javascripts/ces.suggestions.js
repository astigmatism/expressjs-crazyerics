/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSuggestions = (function(_config, _Images, _Compression, _Tooltips, PlayGame, $grid, $wrapper) {

    //private members
    var self = this;
    var _grid = null;
    var _BOXSIZE = 116;
    var _lastRecipe = null;
    var _currentGameLinks = [];
    var _loading = false;
    var _loadingRequestCount = 0;
    var _allowMore = false;
    var _loadingIcon = 'Blocks-1s-61px.svg';
    var $loading;

    this.Load = function(recipe, allowMore, callback, opt_canned, _opt_alphaHelper) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;
        _allowMore = (allowMore == true) ? true : false;

        if (_loading) {
            //return;
        }

        //if an alpha recipe, allow the functionality of the "reveal more"
        if (_opt_alphaHelper) {
            $('#browse-show-obscure').removeAttr("disabled");
        } else {
            $('#browse-show-obscure').attr("disabled", true);
        }

        _lastRecipe = {
            recipe: recipe,
            canned: opt_canned
        };
        _loading = true;

        Clear();

        FetchAndBuild(recipe, opt_canned, callback);
    };

    this.LoadMore = function(callback) {

        if (!_lastRecipe || _loading || !_allowMore) {
            return;
        }

        FetchAndBuild(_lastRecipe.recipe, _lastRecipe.canned, callback);
    };

    var FetchAndBuild = function(recipe, opt_canned, callback) {

        Fetch(recipe, function (err, suggestions) {

            Build(suggestions, function() {

                _loading = false;
                _loadingRequestCount--;

                if (_loadingRequestCount < 1) {
                    $loading.addClass('close');
                }

                if (callback) {
                    callback();
                }
            });

        }, opt_canned);
    };

    var Fetch = function(recipe, callback, opt_canned) {

        _loadingRequestCount++;
        $loading.removeClass('close');

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
    
        for (var i = 0; i < suggestions.length; ++i) {
            
            var gameKey = _Compression.Decompress.gamekey(suggestions[i]);

            //spawn new gamelink
            gamelink = new cesGameLink(_config, _Images, _Tooltips, gameKey, _BOXSIZE, true, PlayGame);

            //create the grid item and insert it
            var $griditem = $('<div class="grid-item" />');
            $griditem.append(gamelink.GetDOM());
            
            _grid.isotope( 'insert', $griditem[0]);
        }

        //functionality for when each images loads
        _grid.find('img').imagesLoaded()
            .progress(function(imgLoad, image) {
                
                //relayout the grid on each image load (they trickle in)
                _grid.isotope('layout');
            })
            .done(function() {

                if (callback) {
                    callback();
                }
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
                    randomize: false,
                    maximum: -1
                };
                var above = {
                    systems: {},
                    randomize: false,
                    maximum: -1
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
                        self.Load(all, false, function() {
                            _Tooltips.Any();
                        }, false, true);
                    }
                    else {
                        self.Load(above, false, function() {
                            _Tooltips.Any();
                        }, false, true);
                    }
                });

                //false says, don't continue to load more
                self.Load($checkbox.is(':checked') ? all : above, false, function() {
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