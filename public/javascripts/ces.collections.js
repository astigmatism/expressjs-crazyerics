var cesCollections = (function(_BoxArt, _Compression, _Sync, _Tooltips, _PlayGameHandler, $collectionTitlesWrapper, $collectionNamesWrapper, $title, _initialSyncPackage, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _titlesGrid = null;             //see constructor for assignment
    var _collectionsGrid = null;
    var _BOXSIZE = 120;
    var _currentLoadingGame = null;
    var _baseUrl = '/collections';

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
    
    var RemoveTitle = function(activeTitle, onRemoveComplete) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (_currentLoadingGame && _currentLoadingGame.hasOwnProperty('gk') && activeTitle.gameKey.gk == _currentLoadingGame.gk) {
            return;
        }

        // //maybe set a loading spinner on image here?
        activeTitle.gameLink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again
        _titlesGrid.isotope('remove', activeTitle.gridItem).isotope('layout'); //immediately remove from grid (i used to wait for response but why right?)
        _Tooltips.Destory(activeTitle.gridItem); //destory its custom tooltip

        //use sync for outgoing. will update this object on response
        var url = _baseUrl + '/game?gk=' + encodeURIComponent(activeTitle.gameKey.gk);
        _Sync.Delete(url, function(data) {
            //sync will take care of updating the collection
            if (onRemoveComplete) {
                onRemoveComplete();
            }
        });
    };

    var RemoveCollection = function(collection, onRemoveComplete) {

        _collectionsGrid.isotope('remove', collection.gridItem).isotope('layout'); //immediately remove from grid (i used to wait for response but why right?)

        //use sync for outgoing. will update this object on response
        var url = _baseUrl + '?n=' + encodeURIComponent(_Compression.Compress.string(collection.name));
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
        
        for (var x = 0, xlen = gridTitles.length; x < xlen; ++x) {
            $(gridTitles[x]).data('active', 0);
        }

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
                    $gridTitle.data('active', 1);

                    //found this title in the grid, update its attributes to keep it up to date
                    $gridTitle.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
                }
            }

            if (!foundInGrid) {
                activeTitle.gridItem = AddTitle(activeTitle);
                activeTitle.gridItem.data('active', 1);
            }

            //generate new toolips content
            var $tooltipContent = GenerateTitleTooltipContent(activeTitle);   //generate html specific for collections
            _Tooltips.SingleHTML(activeTitle.gridItem, $tooltipContent); //reapply tooltips
        }

        //remove anything from the grid not found
        for (var k = 0, klen = gridTitles.length; k < klen; ++k) {
            var m = $.data(gridTitles[k], 'active');
            if (m === 0) {
                _titlesGrid.isotope('remove', gridTitles[k]);
            }
        }

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

        _titlesGrid.isotope('insert', $griditem[0]);

        return $griditem;
    };

    this.PopulateCollections = function()  {

        var gridCollections = _collectionsGrid.isotope('getItemElements');
        
        //go through all collection names in cache
        for (var i = 0, len = _collectionNames.length; i < len; ++i) {

            var collection = _collectionNames[i];

            //does this title already exist in the grid?
            var foundInGrid = false;
            for (var j = 0, jlen = gridCollections.length; j < jlen; ++j) {
                var name = $(gridCollections[j]).text();
                if (name === collection.name) {
                    foundInGrid = true;
                }
            }

            if (!foundInGrid) {
                collection.gridItem = AddCollection(collection);
            }

            if (_activeCollectionName === collection.name) {
                collection.gridItem.addClass('on');
            }
            else {
                collection.gridItem.removeClass('on');
            }

            //generate new toolips content
            var $tooltipContent = GenerateCollectionTooltipContent(collection);   //generate html specific for collections
            _Tooltips.SingleHTML(collection.gridItem, $tooltipContent); //reapply tooltips
        }
    };

    var AddCollection = function(collection) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //place sorting data on grid item
        //$griditem.attr('data-gk', activeTitle.gameKey.gk);
        //$griditem.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting

        $griditem.append(collection.name); //add all visual content from gamelink to grid

        //on click, make active collection
        $griditem.on('click', function() {
            _Sync.Get(_baseUrl + '?n=' + encodeURIComponent(_Compression.Compress.string(collection.name)), function(data) {
                
            });
        });

        _collectionsGrid.isotope('insert', $griditem[0]);

        return $griditem;
    };

    var GenerateTitleTooltipContent = function(activeTitle) {

        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" />');
        $tooltipContent.append('<div>' + activeTitle.gameKey.title + '</div>');
        $tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $tooltipContent.append('<div>Play Count: ' + activeTitle.playCount + '</div>');
        $tooltipContent.append('<div>Number of Saves: ' + activeTitle.saveCount + '</div>');
        
        $remove = $('<div class="remove">Remove from this Collection</div>');
        $remove.on('click', function() {
            $remove.off('click');
            RemoveTitle(activeTitle, function() {
                
            });
        });
        $tooltipContent.append($remove);
        return $tooltipContent;
    };

    var GenerateCollectionTooltipContent = function(collection) {
        
        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" />');
        
        $remove = $('<div class="remove">Delete this Collection</div>');
        $remove.on('click', function() {
            $remove.off('click');
            RemoveCollection(collection, function() {
                
            });
        });
        $tooltipContent.append($remove);
        return $tooltipContent;
    };

    var NewCollectionControls = (function($griditem) {

        var __self = this;
        var $gi = $griditem;

        var Show = function() {

            $gi.animate({
                width: 150    
            },{
                duration: 300,
                easing: "linear",
                complete: function() {

                    $gi.empty();

                    $wrapper = $('<div class="controls" />');
                    $gi.append($wrapper);

                    _collectionsGrid.on('layoutComplete', function(event, laidOutItems ){
                        
                        _collectionsGrid.off('layoutComplete');
                        
                        $input = $('<input type="text" class="tooltip" />');
                        $input.bind('keydown', function(e) {
                            if (e.which === 13) {
                                Confirm($input, $wrapper);
                            }
                            else if (e.which === 27) {
                                Reset();
                            }
                        });
                        $wrapper.append($input);
                
                        $confirm = $('<div class="button confirm" />');
                        $confirm.bind('click', function() {
                            Confirm($input, $wrapper);
                        });
                        $wrapper.append($confirm);
                
                        $cancel = $('<div class="button cancel" />');
                        $cancel.bind('click', function(e) {
                            $cancel.unbind('click');
                            $wrapper.hide();
                            Reset();
                        });
                        $wrapper.append($cancel);

                        $wrapper.fadeIn();
                
                        $input.focus();
            
                        _Tooltips.Any($input);
                    });

                    _collectionsGrid.isotope('layout');
                }
            });
        };

        var Reset = function() {

            $gi.animate({
                width: 20    
            },{
                duration: 300,
                easing: "linear",
                complete: function() {

                    $gi.empty();

                    $button = $('<div class="add close" />');
                    $gi.append($button);
                    $button.removeClass('close');

                    _collectionsGrid.on('layoutComplete', function(event, laidOutItems ){
                        
                        _collectionsGrid.off('layoutComplete');
                        
                        $button.bind('click', function() {
                            $button.unbind('click');
                            $button.addClass('close');
                            Show();
                        });
                    });

                    _collectionsGrid.isotope('layout');
                }
            });
        };

        var Confirm = function($input, $wrapper) {
            
            var value = $input.val();

            offenders = value.match(/[^a-zA-Z0-9\s\-/]/g); //white list of acceptable characters
            
            //will show offenders as comma separated string
            if (offenders) {
                $input.tooltipster('content', 'The following characters are not allowed: ' + offenders);
                $input.tooltipster('show');
                return;
            }

            if (value.trim().length === 0) {
                $input.tooltipster('content', 'Please enter a name for your new collection');
                $input.tooltipster('show');
                return;
            }

            if (value.length > 60) {
                $input.tooltipster('content', 'A name cannot exceed 60 characters');
                $input.tooltipster('show');
                return;
            }

            for (var i = 0, len = _collectionNames.length; i < len; ++i) {
                if (_collectionNames[i].name === value) {
                    $input.tooltipster('content', 'This name is already used');
                    $input.tooltipster('show');
                    return;
                }
            }

            _Tooltips.Destory($gi); //remove tooltips from validation on text entry
            
            value = value.replace(/[^a-zA-Z0-9\s\-/]/g,''); //sanitize anyway ;)
            
            $wrapper.hide();

            _Sync.Post(_baseUrl, {
                name: value
            }, function(data) {
                
                //show spinner?

                Reset();
            });
        };

        var Constructor = (function() {
            Reset(); //start by resetting
        })();
    });

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
            ParseCollectionNames(package.collections);

            //if this is entire package contains data for a new collection not currently being shown, clear the grid
            if (isNewCollection) {
                //_titlesGrid.isotope('remove', _titlesGrid.children()); //clear grid first
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

        var ParseCollectionNames = function(payload) {

            //let's step through the payload looking for new titles and updated info
            for (var i = 0, len = payload.length; i < len; ++i) {
                var newCollection = true;
                for (var j = 0, jlen = _collectionNames.length; j < jlen; ++j) {
                    if (_collectionNames[j].name === payload[i].name) {
                        newCollection = false;
                        break;
                    }
                }
                if (newCollection) {
                    _collectionNames.push(payload[i]);
                }
            };

            //check for removals
            for (var k = (_collectionNames.length - 1); k > -1; --k) {
                var found = false;
                for (var l = 0, llen = payload.length; l < llen; ++l) {
                    if (payload[l].name === _collectionNames[k].name) {
                        found = true;
                    }
                }
                if (!found) {
                    _collectionNames.splice(k, 1); //remove title from local cache if not found in payload
                }
            }
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
                    var gameLink = new cesGameLink(_BoxArt, gameKey, _BOXSIZE, false, _PlayGameHandler, onBoxImageLoadError);

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
            layoutMode: 'fitRows',
            itemSelector: '.grid-item'
        });

        $add = AddCollection({name:''});
        new NewCollectionControls($add);

        //parse the incoming sync data from server
        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});