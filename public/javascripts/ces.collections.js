var cesCollections = (function(config, _Compression, _Sync, _Tooltips, _PlayGameHandler, $wrapper, $title, _initialSyncPackage, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _grid = null; //see constructor for assignment
    var _activeCollectionData = {};
    var _activeCollectionTitles = [];
    var _BOXSIZE = 120;
    var _currentLoadingGame = null;

    //original incoming data from sync
    var _collections = [];
    var _active = {};

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
    
    // var Remove = function(gk, gamelink, griditem) {

    //     //before removing, is this the current game being loaded? 
    //     //we cannot allow it to be deleted (like if there are selecting a save)
    //     if (_currentLoadingGame && _currentLoadingGame.hasOwnProperty('gk') && gk == _currentLoadingGame.gk) {
    //         return;
    //     }

    //     //maybe set a loading spinner on image here?
    //     gamelink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

    //     //immediately remove from grid (i used to wait for response but why right?)
    //     _grid.isotope('remove', griditem).isotope('layout');

    //     var url = '/collections/game?gk=' + encodeURIComponent(gk);

    //     _Sync.Delete(url, function(data) {
    //         //sync will take care of updating the collection
    //     });
    // };

    //examines the local cache about the active collection and populates the grid as needed
    this.Populate = function() {

        var gridTitles = _grid.isotope('getItemElements');

        //go through all titles in cache
        for (var i = 0, len = _activeCollectionTitles.length; i < len; ++i) {

            var activeTitle = _activeCollectionTitles[i];

            //does this title already exist in the grid?
            var foundInGrid = false;
            for (var j = 0, jlen = gridTitles.length; j < jlen; ++j) {

                var $gridTitle = $(gridTitles[j]);
                var gridGk = $gridTitle.data('gk');      //take the gk from the element for comparison. will be unique

                if (gridGk === activeTitle.gameKey.gk) {
                    foundInGrid = true;

                    //found this title in the grid, update its attributes to keep it up to date
                    $gridTitle.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
                    
                }
            }

            if (!foundInGrid) {
                Add(activeTitle);
            }

            //ok, by this time the title should be on the grid and updated
            var $tooltipContent = GenerateTooltipContent(activeTitle, i);
            activeTitle.gameLink.UpdateToolTipContent($tooltipContent);
        }

        _Tooltips.AnyContent(true);

        //finally, sort everything
        _self.SortBy('lastPlayed', false);
    };

    var Add = function(activeTitle) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //place sorting data on grid item
        $griditem.attr('data-gk', activeTitle.gameKey.gk);
        $griditem.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting

        $griditem.append(activeTitle.gameLink.GetDOM()); //add all visual content from gamelink to grid
        
        _grid.isotope('insert', $griditem[0]);

        OnImagesLoaded($griditem[0]);
    };

    var GenerateTooltipContent = function(activeTitle, index) {

        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" id="collection' + index + '"></div>');
        $tooltipContent.append('<div>' + activeTitle.gameKey.title + '</div>');
        $tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $tooltipContent.append('<div>Play Count: ' + activeTitle.playCount + '</div>');

        return $tooltipContent;
    };

    var OnImagesLoaded = function($element) {
        
        $element.find('img').imagesLoaded().progress(function(imgLoad, image) {
            
            $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
            _grid.isotope('layout');
        });
    };

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        //a package is the entire payload of data shared between client and server
        var package = (function(active, collections) {
            this.active = active;
            this.collections = collections;
        });

        this.Incoming = function(package) {

            var isNewCollection = true;
            
            //reset local cache on incoming data
            _activeCollectionTitles = [];
            _activeCollectionData = {};

            //locally cache data
            if (package.active.hasOwnProperty('titles')) {
                var payload = package.active.titles;

                //let's set up our local cache with massaged data appropriate for consumption
                for (var i = 0, len = payload.length; i < len; ++i) {

                    //decompress gk
                    var gameKey = _Compression.Decompress.gamekey(payload[i].gk);
                    
                    //get timezone correct last played date
                    var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000; //convert from minutes to mili
                    var utcDate = new Date(payload[i].lastPlayed);
                    var utcTime = utcDate.getTime();
                    var lastPlayed = utcTime - timezoneOffset;

                    //if the box image fails to load, resync this grid to make room for the error images
                    var onBoxImageLoadError = function(el) {
                        _grid.isotope('layout');
                    };

                    //generate gamelink
                    var gameLink = new cesGameLink(config, gameKey, _BOXSIZE, true, _PlayGameHandler, onBoxImageLoadError);

                    //set the on remove function
                    gameLink.OnRemoveClick(function() {
                        //Remove(game.gk, gamelink, $griditem);
                    });

                    //push to our local cache
                    _activeCollectionTitles.push({
                        gameKey: gameKey,
                        lastPlayed: lastPlayed,
                        lastPlayedServerDate: utcDate,
                        playCount: payload[i].playCount,
                        gameLink: gameLink
                    });
                }
            }
            if (package.active.hasOwnProperty('data')) {

                //determine if this collection is not the collection currently on display
                if (_activeCollectionData.hasOwnProperty('name') && package.active.data.hasOwnProperty('name')) {
                    isNewCollection = (_activeCollectionData.name != package.active.data.name);
                }
                _activeCollectionData = package.active.data;
            }

            //save incoming data for later use in outgoing in needed
            _active = package.active;
            _collections = package.collections;

            //if this is entire package contains data for a new collection not currently being shown, clear the grid
            if (isNewCollection) {
                _grid.isotope('remove', _grid.children()); //clear grid first
                
            }

            //populate updates grid
            _self.Populate();
        };

        //not used (yet). delete forces update on server
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
        
        //first, build the grid
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

        //parse the incoming sync data from server
        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});