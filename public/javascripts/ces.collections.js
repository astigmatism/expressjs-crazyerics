var cesCollections = (function(config, _Compression, _Sync, _PlayGameHandler, $wrapper, $title, _initialSyncPackage, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _collections = [];
    var _active = {};
    var _BOXSIZE = 120;
    var _currentLoadingGame = null;

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        sortAscending = sortAscending === true || false;

        //ensure data is up to date5
        _grid.isotope('updateSortData').isotope();

        _grid.isotope({
            sortBy: property,
            sortAscending: sortAscending,
        });
    };

    this.SetCurrentGameLoading = function(gameKey) {
        _currentLoadingGame = gameKey;
    };

    this.RemoveCurrentGameLoading = function() {
        _currentLoadingGame = null;
    };

    var OnImagesLoaded = function() {

        _grid.find('img').imagesLoaded().progress(function(imgLoad, image) {
            
            $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
            _grid.isotope('layout');
        });
    };

	/**
     * Assign actions to a gamelink and then append it to the grid but does NOT perform grid layout
     * @param {[type]}   key      [description]
     * @param {[type]}   system   [description]
     * @param {[type]}   title    [description]
     * @param {[type]}   file     [description]
     * @param {[type]}   played   [description]
     * @param {[type]}   slots    [description]
     * @param {Function} callback [description]
     */
	var AddToGrid = function(gk, lastPlayed, playCount, callback) {

        var gameKey = _Compression.Decompress.gamekey(gk);

        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //if the box image fails to load, resync this grid to make room for the error images
        var onBoxImageLoadError = function(el) {
            _grid.isotope('layout');
        };

		var gamelink = new cesGameLink(config, gameKey, _BOXSIZE, true, _PlayGameHandler, onBoxImageLoadError);

        //set the on remove function
        gamelink.OnRemoveClick(function() {
            Remove(gk, gamelink, $griditem);
        });

        //place sorting data on grid item
        $griditem.attr('data-gk', gk);
        $griditem.attr('data-lastPlayed', new Date(lastPlayed).getTime()); //store as epoch time for sorting

        $griditem.append(gamelink.GetDOM()); //add gamelink
        
        _grid.isotope( 'insert', $griditem[0]);

        if (callback) {
        	callback();
        }
	};

    
    /**
     * @param  {String} gameKey
     * @param  {Object} gamelink
     * @param  {Object} griditem
     */
    var Remove = function(gk, gamelink, griditem) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (_currentLoadingGame && _currentLoadingGame.hasOwnProperty('gk') && gk == _currentLoadingGame.gk) {
            return;
        }

        //maybe set a loading spinner on image here?
        gamelink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

        //immediately remove from grid (i used to wait for response but why right?)
        _grid.isotope('remove', griditem).isotope('layout');

        _Sync.Post(url, options, function(data) {
            deffered.resolve(data);
        });

        //now I could use sync. remove the item from the grid and wait until next server hit for sync to work
        //that could be a problem however and I'd rather inform the server/cache right away
        $.ajax({
            url: '/collections/game?gk=' + encodeURIComponent(gk),
            type: 'DELETE',
            /**
             * on successful state deletion
             * @return {undef}
             */
            complete: function() {
                
                //clear mem
                gamelink = null;

                //not used, but handler to report back removed gk
                if (_OnRemoveHandler) {
                    _OnRemoveHandler(gk); //passed in, reports back to ces.main function
                }
            }
        });
    };

    //populate clears the grid from scratch
    this.Populate = function() {

        _grid.isotope('remove', _grid.children()); //clear grid

        for (var i = 0, len = _active.titles.length; i < len; ++i) {
            var game = _active.titles[i];
            AddToGrid(game.gk, game.lastPlayed, game.playCount); 
        }

        _self.SortBy('lastPlayed', false);

        OnImagesLoaded();
    };

    //updates the grid with new titles (or deleted ones)
    this.Refresh = function() {

        var items = _grid.isotope('getItemElements');

        //step through all updated active titles
        for (var i = 0, len = _active.titles.length; i < len; ++i) {
            var game = _active.titles[i];

            var found = false;
            for (var j = 0, jlen = items.length; j < jlen; ++j) {
                var gk = $(items[j]).data('gk');
                if (gk === game.gk) {
                    found = true;
                    
                    //update details
                    $(items[j]).attr('data-lastPlayed', new Date(game.lastPlayed).getTime()); //store date in epoch time for sorting
                    
                    break;
                }
            }
            if (!found) {
                AddToGrid(game.gk, game.lastPlayed, game.playCount);
            }
        };

        _self.SortBy('lastPlayed', false);
        
        OnImagesLoaded();
    };

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        var package = (function(active, collections) {
            this.active = active,
            this.collections = collections;
        });

        this.Incoming = function(package) {

            var isNewCollection = true; 
            if (_active.data) {
                isNewCollection = (_active.data.name != package.active.data.name);
            }

            _active = package.active;
            _collections = package.collections;

            if (isNewCollection) {
                _self.Populate();
            }
            else {
                _self.Refresh();
            }

            //title
            // if (_active.titles.length > 0) {
            //     $title.text(_active.data.name);
            // }
            // else {
            //     $title.empty();
            // }
        };

        this.Outgoing = function() {
            __self.reday = false;
            return new package(_active, _collections);
        };

        return this;
    })();

    /**
     * Constructors live at the bottom so that all private functions are available
     * @param  {} function(
     */
    var Constructor = (function() {
        
        _grid = $wrapper.isotope({
            layoutMode: 'masonry',
            itemSelector: '.grid-item',
            getSortData: {
                lastPlayed: function(item) {
                    var played = $(item).attr('data-lastPlayed');
                    return parseInt(played, 10);
                }
            }
        });

        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});