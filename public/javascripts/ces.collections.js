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
    
    var Remove = function(activeTitle, onRemoveComplete) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (_currentLoadingGame && _currentLoadingGame.hasOwnProperty('gk') && activeTitle.gameKey.gk == _currentLoadingGame.gk) {
            return;
        }

        // //maybe set a loading spinner on image here?
        activeTitle.gameLink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

        //immediately remove from grid (i used to wait for response but why right?)
        _grid.isotope('remove', activeTitle.gridItem).isotope('layout');

        //destory its custom tooltip
        _Tooltips.Destory(activeTitle.gridItem);

        //use sync for outgoing. will update this object on response

        var url = '/collections/game?gk=' + encodeURIComponent(activeTitle.gameKey.gk);

        _Sync.Delete(url, function(data) {
            //sync will take care of updating the collection
            if (onRemoveComplete) {
                onRemoveComplete();
            }
        });
    };

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

            //generate new toolips content
            _Tooltips.Destory(activeTitle.gridItem);                        //this step ensures the tooltip plugin is removed
            var $tooltipContent = GenerateTooltipContent(activeTitle, i);   //generate html specific for collections

            //update gamelink
            activeTitle.gameLink.UpdateToolTipContent($tooltipContent);     //pass the generated html to the gamelink to be applied as a tooltip
            
            //generate remove functionality
            //inside closure to ensure proper activeTitle passed to remove function
            (function(at) {
                at.gameLink.AssignRemove('.remove', function() {
                    
                    Remove(at, function() {
                        
                    });
                });
            })(activeTitle);
        }

        _Tooltips.AnyContent(true); //reapply tooltips

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

        $griditem.find('img').imagesLoaded().progress(function(imgLoad, image) {
            $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
            _grid.isotope('layout');
        });

        activeTitle.gridItem = $griditem; //hold reference to griditem in local cache

        _grid.isotope('insert', $griditem[0]);
    };

    var GenerateTooltipContent = function(activeTitle, index) {

        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" id="collection' + index + '"></div>');
        $tooltipContent.append('<div>' + activeTitle.gameKey.title + '</div>');
        $tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $tooltipContent.append('<div>Play Count: ' + activeTitle.playCount + '</div>');
        $tooltipContent.append('<div class="remove">Remove from Collection</div>');

        return $tooltipContent;
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

            //locally cache data
            if (package.active.hasOwnProperty('titles')) {
                var payload = package.active.titles;
                
                //let's step through the payload looking for new titles and updated info
                for (var i = 0, len = payload.length; i < len; ++i) {

                    //get timezone correction for last played date
                    var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000; //convert from minutes to mili
                    var utcDate = new Date(payload[i].lastPlayed);
                    var utcTime = utcDate.getTime();
                    var lastPlayed = utcTime - timezoneOffset;

                    //does this title already exist in local cache?
                    var newTitle = true;
                    for (var j = 0, jlen = _activeCollectionTitles.length; j < jlen; ++j) {
                        if (payload[i].gk === _activeCollectionTitles[j].gameKey.gk) {
                            newTitle = false;

                            //update these details in local cache to whatever the server says
                            _activeCollectionTitles[j].lastPlayed = lastPlayed;
                            _activeCollectionTitles[j].playCount = payload[i].playCount;

                        }
                    }

                    //if this is a new title, build up other details for our local cache
                    if (newTitle) {

                        //decompress gk
                        var gameKey = _Compression.Decompress.gamekey(payload[i].gk);

                        //if the box image fails to load, resync this grid to make room for the error images
                        var onBoxImageLoadError = function(el) {
                            _grid.isotope('layout');
                        };

                        //generate gamelink
                        var gameLink = new cesGameLink(config, gameKey, _BOXSIZE, _PlayGameHandler, onBoxImageLoadError);

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

                //let's now check the opposite, run through local cache and ensure it exists in the payload,
                //if it does not, then it is likely the title was deleted and should be deleted from local cache as well
                //loop backwards in order to splice directly from the array we are iterating
                var i = _activeCollectionTitles.length;
                while (--i) {
                    var found = false;
                    for (var j = 0, jlen = payload.length; j < jlen; ++j) {
                        if (payload[j].gk === _activeCollectionTitles[i].gameKey.gk) {
                            found = true;
                        }
                    }
                    if (!found) {
                        _activeCollectionTitles.splice(i, 1); //remove title from local cache if not found in payload
                    }
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