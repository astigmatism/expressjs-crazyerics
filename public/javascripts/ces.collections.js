var cesCollections = (function(_config, _Compression, _Preferences, _Images, _Sync, _Tooltips, _PlayGameHandler, $collectionTitlesWrapper, $collectionNamesWrapper, _initialSyncPackage, copyToFeatured, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _titlesGrid = null;             //see constructor for assignment
    var _collectionsGrid = null;
    var _TITLESCREENWIDTH = 160;
    var _currentLoadingGame = null;
    var _baseUrl = '/collections';
    var _featureUrl = '/featured';
    var _copyToFeaturedButton = copyToFeatured;   //DISABLE FOR PROD. dont worry, end point protects on server too

    var _activeCollectionId = null;
    var _activeCollectionName = null;
    var _TitlesSort = null;

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

    //do we meet the conditions for which the user has no games in their collection? (new user, etc)
    this.IsEmpty = function() {
        return _activeCollectionTitles.length === 0 && _collectionNames.length === 1; //there will always be one name (the default)
    };

    //asked for by the featured component
    this.GetGrids = function() {
        return {
            collections: _collectionsGrid,
            titles: _titlesGrid
        };
    };

    this.SetCurrentGameLoading = function(gameKey) {
        _currentLoadingGame = gameKey;
    };

    this.RemoveCurrentGameLoading = function() {
        _currentLoadingGame = null;
    };

    //is allows the featured component to override any currently selected personal collection
    this.SetActiveCollectionId = function(id) {
        _activeCollectionId = id; 
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
        _Tooltips.Destroy(activeTitle.gridItem); //destory its custom tooltip

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
        var url = _baseUrl + '?c=' + encodeURIComponent(collection.id);
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
        
        //put a flag in each grid item saying this is not in the current collection (unless we find a match later)
        for (var x = 0, xlen = gridTitles.length; x < xlen; ++x) {
            $(gridTitles[x]).data('active', 0);
        }

        //go through all titles in cache
        for (var i = 0, len = _activeCollectionTitles.length; i < len; ++i) {

            var activeTitle = _activeCollectionTitles[i];

            //does this title already exist in the grid?
            //we only care about keeping the existing title in the grid if it is a personal collection title, 
            //that way we understand it has the structure to update it
            var foundInGrid = false;
            for (var j = 0, jlen = gridTitles.length; j < jlen; ++j) {

                var $gridTitle = $(gridTitles[j]);
                var gridGk = $gridTitle.data('gk');      //take the gk from the element for comparison. will be unique
                var type = $gridTitle.data('type');      //to recognize personal collection from featured collection

                if (gridGk === activeTitle.gameKey.gk && type == 'personal') {
                    foundInGrid = true;
                    $gridTitle.data('active', 1);

                    //found this title in the grid, update its attributes to keep it up to date
                    $gridTitle.attr('data-lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
                    $gridTitle.attr('data-playCount', activeTitle.playCount);
                }
            }

            if (!foundInGrid) {
                activeTitle.gridItem = AddTitle(activeTitle);
                activeTitle.gridItem.data('active', 1);
            }

            //generate new toolips content
            GenerateTitleTooltipContent(activeTitle);   //generate html specific for collections
        }

        //remove anything from the grid not found
        for (var k = 0, klen = gridTitles.length; k < klen; ++k) {
            var m = $.data(gridTitles[k], 'active');
            if (m === 0) {
                _titlesGrid.isotope('remove', gridTitles[k]);
            }
        }

        _TitlesSort.Sort();
    };

    var AddTitle = function(activeTitle) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //place sorting data on grid item
        $griditem.data('gk', activeTitle.gameKey.gk);
        $griditem.data('lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
        $griditem.data('name', activeTitle.gameKey.title);
        $griditem.data('system', activeTitle.gameKey.system);
        $griditem.data('playCount', activeTitle.playCount);
        $griditem.data('type', 'personal'); //to denote collection type (personal/featured)

        $griditem.append(activeTitle.gameLink.GetDOM()); //add all visual content from gamelink to grid

        $griditem.find('img').imagesLoaded().progress(function(imgLoad, image) {
            _TitlesSort.Sort();
        });

        _titlesGrid.isotope('insert', $griditem[0]);

        return $griditem;
    };

    this.PopulateCollections = function()  {

        var gridCollections = _collectionsGrid.isotope('getItemElements');
        
        //remove select
        _collectionsGrid.find('.grid-item').removeClass('on');

        //go through all collection names in cache
        for (var i = 0, len = _collectionNames.length; i < len; ++i) {

            var collection = _collectionNames[i];

            //if not in grid, wont have griditem
            if (!collection.hasOwnProperty('gridItem')) {
                collection.gridItem = AddCollection(collection);
            }

            if (_activeCollectionId === collection.id) {
                collection.gridItem.addClass('on');
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
        $griditem.data('type', collection.type || 'c');

        $griditem.append(collection.name); //add all visual content from gamelink to grid

        //if making this collection a feature
        if (collection.name === '!') {
            $griditem.on('click', function() {
                
                //get list of gameKeys in order from the grid
                var gridTitles = _titlesGrid.isotope('getItemElements');
                var gks = [];
                for (var i = 0, len = gridTitles.length; i < len; ++i) {
                    //console.log($(gridTitles[i]).data('name') + ' ' + $(gridTitles[i]).data('gk'));
                    gks.push($(gridTitles[i]).data('gk'));
                }

                _Sync.Post(_featureUrl, {
                    name: _activeCollectionName,
                    gks: gks
                }, function(data) {
                    
                });
            });
        }
        //on click, make active collection
        else if (collection.name != '') {
            $griditem.on('click', function() {
                if (_activeCollectionId != collection.id) {
                    _Sync.Get(_baseUrl + '?c=' + encodeURIComponent(collection.id), function(data) {
                        
                    });
                }
            });
        }

        _collectionsGrid.isotope('insert', $griditem[0]);
        _collectionsGrid.isotope({ sortBy : 'type' });

        return $griditem;
    };

    var GenerateTitleTooltipContent = function(activeTitle) {

        //create the tooltip content
        
        var $tooltipContent = $('<div class="collection-tooltip" />');
        $tooltipContent.append('<div class="tooltiptitle">' + activeTitle.gameKey.title + '</div>');
        var $titlescreenwrapper = $('<div />');
        $tooltipContent.append($titlescreenwrapper);
        $tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $tooltipContent.append('<div>Play Count: ' + activeTitle.playCount + '</div>');
        $tooltipContent.append('<div>Number of Saves: ' + activeTitle.saveCount + '</div>');

        //
        
        $remove = $('<div class="remove">Remove from this Collection</div>');
        $remove.on('click', function() {
            $remove.off('click');
            RemoveTitle(activeTitle, function() {
                
            });
        });
        $tooltipContent.append($remove);
        
        _Tooltips.SingleHTMLWithTitleScreen(activeTitle.gridItem, $tooltipContent, $titlescreenwrapper, activeTitle.gameKey, true);
    };

    var GenerateCollectionTooltipContent = function(collection) {
        
        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" />');
        
        $lastPlayed = $('<div class="pointer">Sort Titles by Last Played</div>');
        $lastPlayed.on('click', function() {
            _TitlesSort.Change('lastPlayed', false);
        });
        $tooltipContent.append($lastPlayed);
        
        
        $nameSort = $('<div class="pointer">Sort Titles by Name</div>');
        $nameSort.on('click', function() {
            _TitlesSort.Change('name', true);
        });
        $tooltipContent.append($nameSort);

        $playCountSort = $('<div class="pointer">Sort Titles by Most Played</div>');
        $playCountSort.on('click', function() {
            _TitlesSort.Change('playCount', false);
        });
        $tooltipContent.append($playCountSort);
        
        $remove = $('<div class="remove">Delete this Collection</div>');
        $remove.on('click', function() {
            $remove.off('click');
            _Preferences.Remove('collections.sort.' + collection.name);
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
                width: 200    
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
            
                        _Tooltips.Any();
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

            //add a tooltip
            $griditem.attr('title', 'Create a New Personal Game Collection');
            $griditem.addClass('tooltip');

            Reset(); //start by resetting
        })();
    });
    
    var TitleSortHelper = (function() {

        var __self = this;
        var _sort = 'lastPlayed';
        var _asc = false;
        var _name = '';

        this.Set = function(payload) {
            
            _name = payload.name;

            var userPreferece = _Preferences.Get('collections.sort.' + _name);

            //first get user preferences for sorting
            if (userPreferece && userPreferece.hasOwnProperty('sort')) {
                _sort = userPreferece.sort;
            }
            //next the default value (if exists)
            else if (payload.hasOwnProperty('sort') && payload.sort != null) {
                _sort = payload.sort;
            }

            if (userPreferece && userPreferece.hasOwnProperty('asc')) {
                _asc = userPreferece.asc;
            }
            else if (payload.hasOwnProperty('asc') && payload.asc != null) {
                _asc = payload.asc;
            }

            return __self.Get();
        };

        this.Get = function() {
            return {
                sort: _sort,
                asc: _asc
            };
        };

        this.Reset = function() {
            _sort = 'lastPlayed';
            _asc = false;
        };

        this.Sort = function() {
            
            _self.SortBy(_sort, _asc);
    
            _titlesGrid.isotope('layout');
        };

        this.Change = function(sort, asc) {
            
            //if already set to this, change the sort order
            if (_sort === sort) {
                _asc = !_asc;
            }
            else {
                _sort = sort;
                _asc = asc;
            }

            _Preferences.Set('collections.sort.' + _name, __self.Get());
            __self.Sort();
        };
    });

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        this.Incoming = function(payload) {

            var isNewCollection = true;

            //handle active collection titles
            ParseActiveTitles(payload.titles);

            //determine if this collection is not the collection currently on display
            isNewCollection = (_activeCollectionId != payload.id);
            _activeCollectionId = payload.id;
            _activeCollectionName = payload.name;

            //handle other collection names data
            ParseCollectionNames(payload.collections);

            //populate updates grid
            _self.PopulateTitles();
            _self.PopulateCollections();

            //dont show default collection when no titles (new user experience)
            if (_self.IsEmpty()) {
                $collectionNamesWrapper.parent().addClass('new-user');
            } else {
                $collectionNamesWrapper.parent().removeClass('new-user');
                _collectionsGrid.isotope('layout'); //reapply layout
            }
        };

        //not used (yet). delete forces update on server
        this.Outgoing = function() {
            __self.reday = false;
            //return new package(_active, _collections);
        };

        var ParseCollectionNames = function(payload) {

            //let's step through the payload looking for new titles and updated info
            for (var i = 0, len = payload.length; i < len; ++i) {
                var newCollection = true;
                for (var j = 0, jlen = _collectionNames.length; j < jlen; ++j) {
                    if (_collectionNames[j].id === payload[i].id) {
                        newCollection = false;
                        break;
                    }
                }
                if (newCollection) {
                    _collectionNames.push(payload[i]);
                }

                if (_activeCollectionId === payload[i].id) {
                    _TitlesSort.Set(payload[i]);
                }
            }

            //check for removals
            for (var k = (_collectionNames.length - 1); k > -1; --k) {
                var found = false;
                for (var l = 0, llen = payload.length; l < llen; ++l) {
                    if (payload[l].id === _collectionNames[k].id) {
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
                    var OnImageLoaded = function(image) {
                        _titlesGrid.isotope('layout');
                    };

                    //generate gamelink
                    var gameLink = new cesGameLink(_config, _Images, _Tooltips, gameKey, 'a', false, _PlayGameHandler, OnImageLoaded);

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
        
        _TitlesSort = new TitleSortHelper(); //sorting helper

        //first, build the grid
        _titlesGrid = $collectionTitlesWrapper.isotope({
            layoutMode: 'masonry',
            masonry: {
                horizontalOrder: true
            },
            itemSelector: '.grid-item',
            getSortData: {
                lastPlayed: function(item) {
                    var played = $(item).data('lastPlayed');
                    return parseInt(played, 10);
                },
                name: function(item) {
                    return $(item).data('name');
                    
                },
                playCount: function(item) {
                    var played = $(item).data('playCount');
                    return parseInt(played, 10);
                }
            }
        });

        _collectionsGrid = $collectionNamesWrapper.isotope({
            layoutMode: 'fitRows',
            itemSelector: '.grid-item',
            getSortData: {
                type: function(item) {
                    return $(item).data('type');
                }
            }
        });

        $add = AddCollection({
            name: '', 
            type: 'a'
        });
        new NewCollectionControls($add);

        //will also disable on the server for prod
        if (_copyToFeaturedButton) {
            $featureAdd = AddCollection({
                name: '!', 
                type: 'b'
            }); //! since this name cannot be entered by a user
        }

        //parse the incoming sync data from server
        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});