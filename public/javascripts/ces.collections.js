var cesCollections = (function(config, _Compression, _Sync, _Tooltips, _PlayGameHandler, $collectionTitlesWrapper, $collectionNamesWrapper, $title, _initialSyncPackage, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _titlesGrid = null;             //see constructor for assignment
    var _collectionsGrid = null;
    var _BOXSIZE = 120;
    var _currentLoadingGame = null;

    //local data structures/cache
    var _activeCollectionName = "";
    var _activeCollectionTitles = [];
    var _collectionNames = [];

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        sortAscending = sortAscending === true || false;

        //ensure data is up to date5
        _titlesGrid.isotope('updateSortData').isotope();

        _titlesGrid.isotope({
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
        _titlesGrid.isotope('remove', activeTitle.gridItem).isotope('layout');

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
    this.PopulateTitles = function() {

        var gridTitles = _titlesGrid.isotope('getItemElements');

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
                AddTitle(activeTitle);
            }

            //generate new toolips content
            _Tooltips.Destory(activeTitle.gridItem);                        //this step ensures the tooltip plugin is removed
            var $tooltipContent = GenerateTitleTooltipContent(activeTitle, i);   //generate html specific for collections

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

    var AddTitle = function(activeTitle) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //place sorting data on grid item
        $griditem.attr('data-gk', activeTitle.gameKey.gk);
        $griditem.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting

        $griditem.append(activeTitle.gameLink.GetDOM()); //add all visual content from gamelink to grid

        $griditem.find('img').imagesLoaded().progress(function(imgLoad, image) {
            $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
            _titlesGrid.isotope('layout');
        });

        activeTitle.gridItem = $griditem; //hold reference to griditem in local cache

        _titlesGrid.isotope('insert', $griditem[0]);
    };

    this.PopulateCollections = function()  {

        var gridCollections = _collectionsGrid.isotope('getItemElements');
        
        //go through all collection names in cache
        for (var i = 0, len = _collectionNames.length; i < len; ++i) {

            var collection = _collectionNames[i];

            //does this title already exist in the grid?
            var foundInGrid = false;
            for (var j = 0, jlen = gridCollections.length; j < jlen; ++j) {
                if ($(gridCollections[i]).text() === collection.name) {
                    foundInGrid = true;
                }
            }

            if (!foundInGrid) {
                AddCollection(collection);
            }
        }
    };

    var AddCollection = function(collection) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //place sorting data on grid item
        //$griditem.attr('data-gk', activeTitle.gameKey.gk);
        //$griditem.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting

        $griditem.append(collection.name); //add all visual content from gamelink to grid

        // $griditem.find('img').imagesLoaded().progress(function(imgLoad, image) {
        //     $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
        //     _titlesGrid.isotope('layout');
        // });

        collection.gridItem = $griditem; //hold reference to griditem in local cache

        _collectionsGrid.isotope('insert', $griditem[0]);
    };

    var GenerateTitleTooltipContent = function(activeTitle, index) {

        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" id="collection' + index + '"></div>');
        $tooltipContent.append('<div>' + activeTitle.gameKey.title + '</div>');
        $tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $tooltipContent.append('<div>Play Count: ' + activeTitle.playCount + '</div>');
        $tooltipContent.append('<div>Number of Saves: ' + activeTitle.saveCount + '</div>');
        $tooltipContent.append('<div class="remove">Remove from Collection</div>');

        return $tooltipContent;
    };

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        //a package is the entire payload of data shared between client and server
        var package = (function(activeName, titles, collectionNames) {
            this.active = activeName;
            this.titles = titles;
            this.collections = collectionNames;
        });

        this.Incoming = function(package) {

            var isNewCollection = true;

            //handle active collection titles
            ParseActiveTitles(package.titles);

            //determine if this collection is not the collection currently on display
            isNewCollection = (_activeCollectionName != package.active);
            _activeCollectionName = package.active;

            //handle other collection names data
            _collectionNames = package.collections;

            //if this is entire package contains data for a new collection not currently being shown, clear the grid
            if (isNewCollection) {
                _titlesGrid.isotope('remove', _titlesGrid.children()); //clear grid first
            }

            //populate updates grid
            _self.PopulateTitles();
            _self.PopulateCollections();
        };

        //not used (yet). delete forces update on server
        this.Outgoing = function() {
            __self.reday = false;
            return new package(_active, _collections);
        };

        var ParseActiveTitles = function(payload) {

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
                        _activeCollectionTitles[j].saveCount = payload[i].saveCount;

                    }
                }

                //if this is a new title, build up other details for our local cache
                if (newTitle) {

                    //decompress gk
                    var gameKey = _Compression.Decompress.gamekey(payload[i].gk);

                    //if the box image fails to load, resync this grid to make room for the error images
                    var onBoxImageLoadError = function(el) {
                        _titlesGrid.isotope('layout');
                    };

                    //generate gamelink
                    var gameLink = new cesGameLink(config, gameKey, _BOXSIZE, _PlayGameHandler, onBoxImageLoadError);

                    //push to our local cache
                    _activeCollectionTitles.push({
                        gameKey: gameKey,
                        lastPlayed: lastPlayed,
                        lastPlayedServerDate: utcDate,
                        playCount: payload[i].playCount,
                        saveCount: payload[i].saveCount,
                        gameLink: gameLink
                    });
                }
            }

            //let's now check the opposite, run through local cache and ensure it exists in the payload,
            //if it does not, then it is likely the title was deleted and should be deleted from local cache as well
            //loop backwards in order to splice directly from the array we are iterating
            
            for (var k = (_activeCollectionTitles.length - 1); k > -1; --k) {
                var found = false;
                for (var l = 0, llen = payload.length; l < llen; ++l) {
                    if (payload[l].gk === _activeCollectionTitles[k].gameKey.gk) {
                        found = true;
                    }
                }
                if (!found) {
                    _activeCollectionTitles.splice(k, 1); //remove title from local cache if not found in payload
                }
            }
        };

        return this;
    })();

    /**
     * Constructors live at the bottom so that all private functions are available
     * @param  {} function(
     */
    var Constructor = (function() {
        
        //first, build the grid
        _titlesGrid = $collectionTitlesWrapper.isotope({
            layoutMode: 'masonry',
            itemSelector: '.grid-item',
            getSortData: {
                lastPlayed: function(item) {
                    var played = $(item).attr('data-lastPlayed');
                    return parseInt(played, 10);
                }
            }
        });

        _collectionsGrid = $collectionNamesWrapper.isotope({
            layoutMode: 'masonry',
            itemSelector: '.grid-item'
        });

        //parse the incoming sync data from server
        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});