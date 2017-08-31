var cesCollections = (function(config, _Compression, _PlayGameHandler, $wrapper, _initialSyncPackage, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _collections = [];
    var _active = {};
    var _BOXSIZE = 120;

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        sortAscending = sortAscending === true || false;

        //ensure data is up to date5
        _grid.isotope('updateSortData').isotope();

        _grid.isotope({ 
            sortBy : property,
            sortAscending: sortAscending
        });
    };

	this.Add = function (key, data, isNew, callback) {

        //data comes in from playerdata
        // if (data.system && data.title && data.file && data.lastPlayed) {

        //     //is new, create a gamelink and add
        //     if (isNew) {

        // 		AddToGrid(key, data.system, data.title, data.file, data.lastPlayed, function() {
        //             OnImagesLoaded();
        //         });
        //     }
        //     //update detils and resort
        //     else {
                
        //         var $item = _grid.find('*[data-key="' + key + '"]');
        //         $item.attr('data-lastPlayed', data.lastPlayed);
        //         self.SortBy('lastPlayed', false);
        //         OnImagesLoaded();
        //     }
        // }
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

		var gamelink = new cesGameLink(config, gameKey, _BOXSIZE, true, _PlayGameHandler);

        //set the on remove function
        gamelink.OnRemoveClick(function() {
            Remove(gk, gamelink, $griditem);
        });

        //place sorting data on grid item
        $griditem.attr('data-key', gk);
        $griditem.attr('data-lastPlayed', lastPlayed);

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
    var Remove = function(gameKey, gamelink, griditem) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (gameKey == _currentLoadingGame) {
            return;
        }

        //maybe set a loading spinner on image here?
        gamelink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

        //immediately remove from grid (i used to wait for response but why right?)
        _grid.isotope('remove', griditem).isotope('layout');

        // $.ajax({
        //     url: '/saves/delete?gk=' + encodeURIComponent(gameKey),
        //     type: 'DELETE',
        //     /**
        //      * on successful state deletion
        //      * @return {undef}
        //      */
        //     complete: function() {
                
        //         //clear mem
        //         gamelink = null;

        //         //callback the function to remove from player data
        //         if (_OnRemoveHandler) {
        //             _OnRemoveHandler(gameKey); //passed in, will remove from player data at main level 
        //         }
        //     }
        // });
    };

    this.Refresh = function() {

        for (var i = 0, len = _active.titles.length; i < len; ++i) {
            var game = _active.titles[i];
            AddToGrid(game.gk, game.lastPlayed, game.playCount); 
        }

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

            _active = package.active;
            _collections = package.collections;
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
        _self.Refresh();

    })();

	return this;

});