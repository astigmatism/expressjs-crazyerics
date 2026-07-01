var cesCollections = (function(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, _PlayGameHandler, _Logging, $collectionTitlesWrapper, $collectionNamesWrapper, _initialSyncPackage, copyToFeatured, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _titlesGrid = null;             //see constructor for assignment
    var _collectionsGrid = null;
    var _currentLoadingGame = null;
    var _baseUrl = '/collections';
    var _featureUrl = '/featured';
    var _copyToFeaturedButton = copyToFeatured;   //DISABLE FOR PROD. dont worry, end point protects on server too

    var _activeCollectionId = null;
    var _activeCollectionName = null;
    var _externalActiveCollection = null;
    var _TitlesSort = null;

    var _activeCollectionTitles = [];
    var _collectionNames = [];
    var _collectionControls = null;
    var $collectionHeaderWrapper = $('#collectionTitle');
    var $collectionsWrapper = $collectionNamesWrapper.closest('#collectionsWrapper');
    var _isCollectionNameEditorOpen = false;

    var _collectionEnterAnimationMs = 620;
    var _collectionStaggerStepMs = 16;
    var _collectionStaggerMaxDelayMs = 320;
    var _collectionImageReadyTimeout = 6000;
    var _collectionFlourishLimit = 48;
    var _defaultCollectionName = '$';
    var _defaultCollectionDisplayName = 'Untitled Collection';
    var _personalCollectionType = 'user';
    var _collectionOptionsTriggerSelector = '.collection-options-trigger';
    var _collectionOptionsDocumentNamespace = '.cesCollectionOptionsMenu';
    var _collectionToolsLockedClass = 'collection-tools-locked';
    var _collectionToolsStoragePrefix = 'ces.collections.toolsUnlocked.';
    var _collectionToolsStorageKey = null;
    var _collectionToolsUnlocked = false;

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

    this.HasDefaultCollection = function() {
        return _collectionNames.length === 1 && _collectionNames[0].name === _defaultCollectionName;
    };

    this.HasNoCollections = function() {
        return _collectionNames.length === 0;
    };

    //do we meet the conditions for which the user has no games in their collection? (new user, etc)
    this.IsEmpty = function() {
        return (_self.HasNoCollections() && _activeCollectionTitles.length === 0) || (_self.HasDefaultCollection() && _activeCollectionTitles.length === 0);
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
    this.SetActiveCollectionId = function(id, opt_collection) {
        _activeCollectionId = id;
        _externalActiveCollection = opt_collection || null;
        RenderCollectionHeader();
    };

    this.AddTitleWithoutPlaying = function(gameKey) {
        //use sync for outgoing. will update this object on response
        var url = _baseUrl + '/?gk=' + encodeURIComponent(gameKey.gk);
        _Sync.Put(url, function(data) {
            //sync will take care of updating the collection
        });
    };

    var BindKeyboardActivate = function($el, handler) {

        $el
            .off('click.collectionActivate keydown.collectionActivate')
            .on('click.collectionActivate', handler)
            .on('keydown.collectionActivate', function(e) {
                var key = e.which || e.keyCode;
                if (key === 13 || key === 32) {
                    e.preventDefault();
                    handler.call(this, e);
                }
            });
    };

    var GetCollectionsWrapper = function() {

        return $collectionsWrapper.length ? $collectionsWrapper : $collectionNamesWrapper.parent();
    };

    var SetCollectionToolsStorageKey = function(payload) {

        if (payload && payload.collectionToolsStorageKey) {
            _collectionToolsStorageKey = payload.collectionToolsStorageKey;
            _collectionToolsUnlocked = _collectionToolsUnlocked || LoadCollectionToolsUnlocked();
        }
    };

    var GetCollectionToolsStorageName = function() {

        if (!_collectionToolsStorageKey) {
            return null;
        }

        return _collectionToolsStoragePrefix + _collectionToolsStorageKey;
    };

    var LoadCollectionToolsUnlocked = function() {

        var storageName = GetCollectionToolsStorageName();

        if (!storageName) {
            return false;
        }

        try {
            return localStorage.getItem(storageName) === '1';
        }
        catch (err) {
            _Logging.Console('ces.collections', 'unable to read collection tools unlock flag', err);
        }

        return false;
    };

    var PersistCollectionToolsUnlocked = function() {

        var storageName = GetCollectionToolsStorageName();

        if (!storageName) {
            return;
        }

        try {
            localStorage.setItem(storageName, '1');
        }
        catch (err) {
            _Logging.Console('ces.collections', 'unable to persist collection tools unlock flag', err);
        }
    };

    var HasNamedPersonalCollection = function() {

        for (var i = 0, len = _collectionNames.length; i < len; ++i) {
            if (!IsDefaultCollection(_collectionNames[i])) {
                return true;
            }
        }

        return false;
    };

    var HasCollectionToolsUnlockThreshold = function() {

        if (_collectionNames.length >= 2) {
            return true;
        }

        if (_self.HasDefaultCollection() && _activeCollectionTitles.length >= 2) {
            return true;
        }

        // A named single collection means the user has already crossed the collection-management
        // threshold in an earlier session or browser, even if the local unlock flag is unavailable.
        if (HasNamedPersonalCollection()) {
            return true;
        }

        return false;
    };

    var IsSingleGameDefaultCollection = function() {

        return _self.HasDefaultCollection() && _activeCollectionTitles.length <= 1;
    };

    var UpdateCollectionToolsUnlocked = function() {

        if (_collectionToolsUnlocked || _self.HasNoCollections()) {
            return;
        }

        if (HasCollectionToolsUnlockThreshold()) {
            _collectionToolsUnlocked = true;
            PersistCollectionToolsUnlocked();
        }
    };

    var CanShowCollectionTools = function() {

        if (_self.IsEmpty()) {
            return false;
        }

        // A single game in the starter/default collection is not yet a meaningful
        // collection-management state. Keep the name/create affordance hidden even
        // if a prior local unlock flag exists for this browser.
        if (IsSingleGameDefaultCollection()) {
            return false;
        }

        return _collectionToolsUnlocked || HasCollectionToolsUnlockThreshold();
    };

    var ApplyCollectionToolsVisibility = function() {

        var showTools = CanShowCollectionTools();
        var $wrapper = GetCollectionsWrapper();
        var $rail = $collectionNamesWrapper.closest('#collectionsRail');
        var wasLocked = $wrapper.length && $wrapper.hasClass(_collectionToolsLockedClass);

        if ($wrapper.length) {
            $wrapper.toggleClass(_collectionToolsLockedClass, !showTools && !_self.IsEmpty());
        }

        if ($rail.length) {
            $rail.attr('aria-hidden', showTools ? 'false' : 'true');
        }

        if (!showTools) {
            CloseCollectionOptionsMenus();
            if (_isCollectionNameEditorOpen) {
                _isCollectionNameEditorOpen = false;
            }
            DestroyTooltipsIn($collectionHeaderWrapper);
            $collectionHeaderWrapper.empty();
        }
        else if (wasLocked && _collectionsGrid && _collectionsGrid.length) {
            _collectionsGrid.isotope('layout');
        }
    };

    var DestroyTooltipsIn = function($el) {

        if (!$el || !$el.length) {
            return;
        }

        $el.find('.tooltipstered').each(function() {
            try {
                $(this).tooltipster('destroy');
            }
            catch (err) {
                _Logging.Console('ces.collections', 'unable to destroy nested tooltip', err);
            }
        });

        _Tooltips.Destroy($el);
    };

    var GetCollectionOptionsTriggers = function() {

        var $scope = (_collectionsGrid && _collectionsGrid.length) ? _collectionsGrid : $collectionNamesWrapper;
        return $scope.find(_collectionOptionsTriggerSelector);
    };

    var CloseCollectionOptionsMenus = function($except) {

        GetCollectionOptionsTriggers().each(function() {
            var $trigger = $(this);

            if ($except && $except.length && $trigger[0] === $except[0]) {
                return;
            }

            _Tooltips.Close($trigger);
        });
    };

    var CloseCollectionOptionsMenu = function(collection) {

        if (collection && collection.optionsTrigger && collection.optionsTrigger.length) {
            _Tooltips.Close(collection.optionsTrigger);
        }
        else if (collection && collection.gridItem && collection.gridItem.length) {
            _Tooltips.Close(collection.gridItem);
        }
    };

    var BindCollectionOptionsDocumentHandlers = function() {

        $(document)
            .off('keyup' + _collectionOptionsDocumentNamespace)
            .on('keyup' + _collectionOptionsDocumentNamespace, function(e) {
                if (e.which === 27) {
                    CloseCollectionOptionsMenus();
                }
            })
            .off('click' + _collectionOptionsDocumentNamespace)
            .on('click' + _collectionOptionsDocumentNamespace, function(e) {

                var $target = $(e.target);

                if ($target.closest(_collectionOptionsTriggerSelector).length || $target.closest('.tooltipster-base').length) {
                    return;
                }

                CloseCollectionOptionsMenus();
            });
    };

    var BindCollectionOptionsTrigger = function(collection) {

        if (!collection || !collection.optionsTrigger || !collection.optionsTrigger.length) {
            return;
        }

        collection.optionsTrigger
            .off('click.collectionOptionsTrigger keydown.collectionOptionsTrigger')
            .on('click.collectionOptionsTrigger', function(e) {
                e.stopPropagation();
                CloseCollectionOptionsMenus($(this));
            })
            .on('keydown.collectionOptionsTrigger', function(e) {

                var key = e.which || e.keyCode;

                if (key === 13 || key === 32) {
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).trigger('click');
                }
                else if (key === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    CloseCollectionOptionsMenus();
                }
            });
    };

    var BindTooltipAction = function($el, handler) {

        $el.attr('role', 'menuitem').attr('tabindex', '0');
        BindKeyboardActivate($el, handler);
    };

    var IsDefaultCollection = function(collection) {
        return collection && collection.name === _defaultCollectionName;
    };

    var IsEditableCollection = function(collection) {

        if (!collection) {
            return false;
        }

        if (collection.editable === false || collection.readOnly === true) {
            return false;
        }

        if (collection.type === 'featured' || collection.type === 'server' || collection.name === '!') {
            return false;
        }

        return true;
    };

    var GetCollectionDisplayName = function(collection) {

        if (!collection) {
            return _defaultCollectionDisplayName;
        }

        if (IsDefaultCollection(collection)) {
            return _defaultCollectionDisplayName;
        }

        if (collection.name === '!') {
            return 'Featured Collection';
        }

        return collection.name || _defaultCollectionDisplayName;
    };

    var FindActiveCollection = function() {

        if (_externalActiveCollection && _externalActiveCollection.id === _activeCollectionId) {
            return _externalActiveCollection;
        }

        for (var i = 0, len = _collectionNames.length; i < len; ++i) {
            if (_collectionNames[i].id === _activeCollectionId) {
                return _collectionNames[i];
            }
        }

        if (_activeCollectionId && _activeCollectionName && _collectionNames.length > 0) {
            return {
                id: _activeCollectionId,
                name: _activeCollectionName,
                type: _personalCollectionType,
                editable: true
            };
        }

        return null;
    };

    var GetCollectionCountText = function(count) {
        return count + ' ' + (count === 1 ? 'game' : 'games');
    };

    var RenderCollectionHeader = function() {

        if (!$collectionHeaderWrapper.length || _isCollectionNameEditorOpen) {
            return;
        }

        if (!CanShowCollectionTools()) {
            DestroyTooltipsIn($collectionHeaderWrapper);
            $collectionHeaderWrapper.empty();
            return;
        }

        var activeCollection = FindActiveCollection();

        if (!activeCollection && _self.HasNoCollections() && _activeCollectionTitles.length === 0) {
            DestroyTooltipsIn($collectionHeaderWrapper);
            $collectionHeaderWrapper.empty();
            return;
        }

        var activeName = GetCollectionDisplayName(activeCollection);
        var collectionEyebrow = activeCollection && (activeCollection.type === 'featured' || activeCollection.type === 'server') ? 'Featured Collection' : 'Personal Library';
        var titleCount = activeCollection && activeCollection.hasOwnProperty('count') ? activeCollection.count : _activeCollectionTitles.length;
        var $titlebar = $('<div class="collection-library-titlebar" />');
        var $titlegroup = $('<div class="collection-library-titlegroup" />');
        var $eyebrow = $('<div class="collection-library-eyebrow" />').text(collectionEyebrow);
        var $headingRow = $('<div class="collection-library-heading-row" />');
        var $heading = $('<div class="collection-library-heading" />').text(activeName);
        var $meta = $('<div class="collection-library-meta" />');
        var $actions = $('<div class="collection-library-actions" />');

        $headingRow.append($heading);

        if (IsDefaultCollection(activeCollection)) {
            $meta.text(GetCollectionCountText(titleCount) + ' ready for a name');
        }
        else {
            $meta.text(GetCollectionCountText(titleCount));
        }

        if (IsEditableCollection(activeCollection) && !_self.IsEmpty()) {
            var $rename = $('<button type="button" class="collection-header-action collection-rename-action" />');
            $rename.text(IsDefaultCollection(activeCollection) ? 'Name' : 'Rename');
            $rename.attr('aria-label', IsDefaultCollection(activeCollection) ? 'Name this collection' : 'Rename ' + activeName);
            $rename.on('click', function() {
                OpenCollectionNameEditor('rename', activeCollection, $collectionHeaderWrapper);
            });
            $actions.append($rename);
        }

        $titlegroup.append($eyebrow);
        $titlegroup.append($headingRow);
        $titlegroup.append($meta);
        $titlebar.append($titlegroup);
        $titlebar.append($actions);

        DestroyTooltipsIn($collectionHeaderWrapper);
        $collectionHeaderWrapper.empty().append($titlebar);
    };

    var ShowCollectionNameError = function($input, message) {

        if ($input.hasClass('tooltipstered')) {
            $input.tooltipster('content', message);
            $input.tooltipster('show');
        }
        else {
            $input.attr('title', message);
            $input.addClass('tooltip');
            _Tooltips.Any();
            $input.tooltipster('content', message);
            $input.tooltipster('show');
        }
    };

    var ValidateCollectionName = function(rawValue, collectionBeingRenamed, $input) {

        var value = $.trim(rawValue || '');
        var offenders = value.match(/[^a-zA-Z0-9\s\-/]/g); //white list of acceptable characters

        if (offenders) {
            ShowCollectionNameError($input, 'The following characters are not allowed: ' + offenders);
            return null;
        }

        if (value.length === 0) {
            ShowCollectionNameError($input, 'Please enter a collection name');
            return null;
        }

        if (value.length > 60) {
            ShowCollectionNameError($input, 'A name cannot exceed 60 characters');
            return null;
        }

        for (var i = 0, len = _collectionNames.length; i < len; ++i) {
            if (_collectionNames[i].name === value && (!collectionBeingRenamed || _collectionNames[i].id !== collectionBeingRenamed.id)) {
                ShowCollectionNameError($input, 'This name is already used');
                return null;
            }
        }

        return value.replace(/[^a-zA-Z0-9\s\-/]/g,''); //sanitize anyway ;)
    };

    var SaveCollectionName = function(name, mode, collection, onComplete) {

        var postBody = {
            name: name
        };
        var url = _baseUrl;
        var isRename = mode === 'rename' || _self.HasDefaultCollection();

        if (isRename && collection && collection.id) {
            postBody.c = collection.id;
            url += '/rename';
        }

        _Sync.Post(url, postBody, function(data) {
            if (onComplete) {
                onComplete();
            }
        });
    };

    var OpenCollectionNameEditor = function(mode, collection, $host) {

        if (!CanShowCollectionTools()) {
            return;
        }

        collection = collection || FindActiveCollection();

        if (!collection || !IsEditableCollection(collection)) {
            return;
        }

        $host = ($host && $host.length) ? $host : $collectionHeaderWrapper;

        if (!$host.length) {
            return;
        }

        var isInlineHost = !$collectionHeaderWrapper.length || $host[0] !== $collectionHeaderWrapper[0];

        _isCollectionNameEditorOpen = true;
        CloseCollectionOptionsMenus();
        DestroyTooltipsIn($host);

        var isRename = mode === 'rename';
        var existingName = IsDefaultCollection(collection) ? '' : GetCollectionDisplayName(collection);
        var $editor = $('<div class="collection-name-editor collection-name-editor-header" />');
        var $label = $('<label class="collection-name-editor-label" for="collectionNameEditorInput" />');
        var $input = $('<input id="collectionNameEditorInput" type="text" maxlength="60" class="collection-name-editor-input tooltip" />');
        var $save = $('<button type="button" class="collection-name-editor-button collection-name-editor-save" />');
        var $cancel = $('<button type="button" class="collection-name-editor-button collection-name-editor-cancel" />');
        var RestoreInlineHost = function() {

            if (isInlineHost) {
                $host.removeClass('collection-tab-editor collection-tab-has-options');
            }
        };
        var CloseEditor = function(e) {

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            $input.val('');
            _isCollectionNameEditorOpen = false;
            RestoreInlineHost();
            _self.PopulateCollections();
            if (_collectionControls) {
                _collectionControls.Update();
            }
        };
        var Confirm = function(e) {

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            var value = ValidateCollectionName($input.val(), isRename ? collection : null, $input);

            if (!value) {
                return;
            }

            $save.prop('disabled', true);
            $cancel.prop('disabled', true);
            $editor.addClass('saving');

            SaveCollectionName(value, mode, collection, function() {
                _isCollectionNameEditorOpen = false;
                RestoreInlineHost();
                _self.PopulateCollections();
                if (_collectionControls) {
                    _collectionControls.Reset();
                }
                RenderCollectionHeader();
            });
        };

        $label.text(isRename ? 'Collection name' : 'New collection');
        $input.val(existingName);
        $save.text('Save');
        $cancel.text('Cancel');

        $editor
            .off('click.collectionNameEditor keydown.collectionNameEditor')
            .on('click.collectionNameEditor keydown.collectionNameEditor', function(e) {
                e.stopPropagation();
            });

        $input.on('keydown.collectionNameEditor', function(e) {
            if (e.which === 13) {
                Confirm(e);
            }
            else if (e.which === 27) {
                CloseEditor(e);
            }
        });

        $save.on('click.collectionNameEditor', Confirm);
        $cancel.on('click.collectionNameEditor', CloseEditor);

        $editor.append($label);
        $editor.append($input);
        $editor.append($save);
        $editor.append($cancel);

        if (isInlineHost) {
            $host
                .off('click.collectionActivate keydown.collectionActivate')
                .removeClass('tooltip tooltip-static-right collection-tab-has-options')
                .addClass('collection-tab-editor')
                .attr('role', 'presentation')
                .removeAttr('title aria-label tabindex aria-selected aria-current aria-controls')
                .empty()
                .append($editor);
        }
        else {
            $host.empty().append($editor);
        }

        _collectionsGrid.isotope('layout');
        _Tooltips.Any();
        $input.focus().select();
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

        CloseCollectionOptionsMenus();
        _isCollectionNameEditorOpen = false;

        _Tooltips.Destroy(collection.gridItem);
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

        var newTitleBatchIndex = 0;

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
                    $gridTitle.attr('data-topRanked', activeTitle.topRanked);
                }
            }

            if (!foundInGrid) {
                activeTitle.gridItem = AddTitle(activeTitle, newTitleBatchIndex);
                activeTitle.gridItem.data('active', 1);
                newTitleBatchIndex++;
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

    var AddTitle = function(activeTitle, batchIndex) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item collection-grid-item collection-card-awaiting-entry" />');

        //place sorting data on grid item
        $griditem.data('gk', activeTitle.gameKey.gk);
        $griditem.data('lastPlayed', activeTitle.lastPlayed); //store as epoch time for sorting
        $griditem.data('name', activeTitle.gameKey.title);
        $griditem.data('system', activeTitle.gameKey.system);
        $griditem.data('playCount', activeTitle.playCount);
        $griditem.data('type', 'personal'); //to denote collection type (personal/featured)
        $griditem.data('topRanked', activeTitle.topRanked); //bool. is this the top ranked file (true) or an alternate version?

        $griditem.append(activeTitle.gameLink.GetDOM()); //add all visual content from gamelink to grid

        _titlesGrid.isotope('insert', $griditem[0]);

        StartCollectionEntryWhenReady($griditem, batchIndex);

        return $griditem;
    };

    var StartCollectionEntryWhenReady = function($griditem, batchIndex) {

        var done = false;
        var $images = $griditem.find('img');

        var startEntry = function() {
            if (done) {
                return;
            }
            done = true;
            StartCollectionEntryAnimation($griditem, batchIndex);
        };

        if (!$images.length || !$.fn.imagesLoaded) {
            setTimeout(startEntry, 0);
            return;
        }

        var timeout = setTimeout(startEntry, _collectionImageReadyTimeout);

        $images.imagesLoaded()
            .progress(function(imgLoad, image) {
                _TitlesSort.Sort();
            })
            .always(function() {
                clearTimeout(timeout);
                startEntry();
            });
    };

    var StartCollectionEntryAnimation = function($griditem, batchIndex) {

        if (!$griditem || !$griditem.length || $griditem.data('collectionEntryComplete')) {
            return;
        }

        var delay = GetCollectionEntryDelay(batchIndex);
        var element = $griditem[0];

        $griditem.data('collectionEntryComplete', true);

        if (element && element.style && element.style.setProperty) {
            element.style.setProperty('--collection-entry-delay', delay + 'ms');
            element.style.setProperty('--collection-sheen-delay', (delay + 110) + 'ms');
        }

        $griditem
            .removeClass('collection-card-awaiting-entry')
            .addClass('collection-card-enter');

        if (batchIndex >= _collectionFlourishLimit) {
            $griditem.addClass('collection-card-enter-quiet');
        }

        setTimeout(function() {
            $griditem.removeClass('collection-card-enter collection-card-enter-quiet');

            if (element && element.style && element.style.removeProperty) {
                element.style.removeProperty('--collection-entry-delay');
                element.style.removeProperty('--collection-sheen-delay');
            }
        }, delay + _collectionEnterAnimationMs + 140);
    };

    var GetCollectionEntryDelay = function(batchIndex) {

        batchIndex = parseInt(batchIndex, 10);
        if (isNaN(batchIndex) || batchIndex < 0) {
            batchIndex = 0;
        }

        var delay = batchIndex * _collectionStaggerStepMs;

        if (delay > _collectionStaggerMaxDelayMs) {
            delay = _collectionStaggerMaxDelayMs;
        }

        return delay;
    };

    this.PopulateCollections = function()  {

        _collectionsGrid.find('.grid-item').removeClass('on').removeAttr('aria-current');
        _collectionsGrid.find('[role="tab"]').attr('aria-selected', 'false');

        //go through all collection names in cache
        for (var i = 0, len = _collectionNames.length; i < len; ++i) {

            var collection = _collectionNames[i];

            //The temporary first collection is represented by "$" on the server. Keep it out of
            //the tab rail and let the visible "Name Collection" affordance handle the rename.
            if (IsDefaultCollection(collection)) {
                continue;
            }

            //if not in grid, wont have griditem so create one
            if (!collection.hasOwnProperty('gridItem') || !collection.gridItem.length || !$.contains(document, collection.gridItem[0])) {
               collection.gridItem = CreateCollectionGirdItem(collection);
            }

            UpdateCollectionGridItem(collection);

            if (_activeCollectionId === collection.id) {
                collection.gridItem.addClass('on').attr('aria-selected', 'true').attr('aria-current', 'true');

                //apend with settings button
                //AddContentMenuToActiveCollection($(collection.gridItem));
            }

            //generate new toolips content for the explicit collection options trigger (sort options, remove etc)
            if (IsEditableCollection(collection) && collection.optionsTrigger && collection.optionsTrigger.length) {
                var $tooltipContent = GenerateCollectionTooltipContent(collection);

                // Older builds attached this menu to the whole badge. Keep the badge itself calm and clickable.
                _Tooltips.Destroy(collection.gridItem);
                _Tooltips.SingleHTML(collection.optionsTrigger, $tooltipContent, true, function() {
                    CloseCollectionOptionsMenus(collection.optionsTrigger);
                    return true;
                }, 'click'); //reapply tooltips on the three-dot button only
                BindCollectionOptionsTrigger(collection);
            }
            else {
                DestroyTooltipsIn(collection.gridItem);
            }
        }

        _collectionsGrid.isotope('updateSortData').isotope({ sortBy : 'type' }); //reapply layout for any new, renamed, or removed rail items
        RenderCollectionHeader();
    };

    var AddContentMenuToActiveCollection = function($gi) {

        var currentWidth = $gi.width();
        setTimeout(function() {
            $gi.animate({width: currentWidth + 40});

            var $context = $('<div class="context" />');
            $gi.append($context);

            $context.fadeIn();

        }, 2000);
        
    };

    var GetCollectionSortType = function(collection) {

        if (!collection || collection.name === '') {
            return 'z';
        }

        if (collection.name === '!') {
            return 'y';
        }

        if (collection.type === 'featured' || collection.type === 'server') {
            return 'd';
        }

        return collection.sortType || collection.type || 'c';
    };

    var UpdateCollectionGridItem = function(collection) {

        var displayName = GetCollectionDisplayName(collection);
        var typeName = collection.type || _personalCollectionType;
        var $name = collection.gridItem.find('.collection-tab-name').first();
        var $optionsTrigger = collection.gridItem.find(_collectionOptionsTriggerSelector).first();
        var showOptionsTrigger = IsEditableCollection(collection);

        collection.gridItem
            .data('id', collection.id)
            .data('type', GetCollectionSortType(collection))
            .data('collectionType', typeName)
            .attr('role', 'tab')
            .attr('tabindex', '0')
            .attr('aria-controls', 'openCollectionGrid')
            .attr('aria-selected', 'false')
            .attr('aria-label', 'Open collection ' + displayName);

        if (!$name.length) {
            collection.gridItem.empty();
            $name = $('<span class="collection-tab-name" />');
            collection.gridItem.append($name);
        }

        $name.text(displayName);

        if (showOptionsTrigger) {
            collection.gridItem.addClass('collection-tab-has-options');

            if (!$optionsTrigger.length) {
                $optionsTrigger = $('<button type="button" class="collection-options-trigger" />');
                collection.gridItem.append($optionsTrigger);
            }

            $optionsTrigger
                // .text('⋯')
                .text('▾')
                .attr('aria-label', 'Collection options for ' + displayName)
                .attr('aria-haspopup', 'menu')
                .attr('tabindex', '0');

            collection.optionsTrigger = $optionsTrigger;
        }
        else {
            collection.gridItem.removeClass('collection-tab-has-options');

            if ($optionsTrigger.length) {
                DestroyTooltipsIn($optionsTrigger);
                $optionsTrigger.remove();
            }

            collection.optionsTrigger = null;
        }
    };

    var CreateCollectionGirdItem = function(collection) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item collection-tab" />');

        //place sorting data on grid item
        $griditem.data('type', GetCollectionSortType(collection));

        //if making this collection a feature
        if (collection.name === '!') {
            $griditem
                .addClass('collection-tab-dev-action')
                .attr('role', 'button')
                .attr('tabindex', '0')
                .attr('aria-label', 'Copy the current collection to featured collections')
                .append($('<span class="collection-tab-name" />').text('Make Featured'));

            BindKeyboardActivate($griditem, function() {
                
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
        //the new collection button is reset and bound by NewCollectionControls
        else if (collection.name === '') {
            $griditem.addClass('collection-tab-add');
        }
        //on click, make active collection
        else {
            UpdateCollectionGridItem({
                id: collection.id,
                name: collection.name,
                type: collection.type,
                sortType: collection.sortType,
                gridItem: $griditem
            });

            BindKeyboardActivate($griditem, function() {
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
        
        var $tooltipContent = $('<div class="collection-tooltip game-tooltip-card game-tooltip-collection" />');
        $tooltipContent.append($('<div class="tooltiptitle" />').text(activeTitle.gameKey.title));
        var $mediawrapper = $('<div class="mediawrapper game-tooltip-media" />');
        $tooltipContent.append($mediawrapper);
        //if playing an alternate version, append the tooltip with that info
        if (!activeTitle.topRanked) {
            $tooltipContent.append($('<div class="tooltipfile" />').text('You are playing an alternate version: ' + activeTitle.gameKey.file));
        }

        var lastPlayed = activeTitle.lastPlayed < 0 ? 'Never' : $.format.prettyDate(activeTitle.lastPlayed);
        var $stats = $('<div class="game-tooltip-stats" />');
        
        //$tooltipContent.append('<div>Last Played: ' + $.format.date(activeTitle.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $stats.append($('<div />').text('Last Played: ' + lastPlayed)); //using the jquery dateFormat plugin
        $stats.append($('<div />').text('Play Count: ' + activeTitle.playCount));
        $stats.append($('<div />').text('Number of Saves: ' + activeTitle.saveCount));
        $tooltipContent.append($stats);

        var $actions = $('<div class="game-tooltip-actions" />');
        
        var $playbutton = $('<span class="button play first noselect">Play Now!</span>');
        $playbutton.click(function(e) { 

            _Tooltips.Close(activeTitle.gridItem); //sometimes the tooltip was staying up after clicking
            _PlayGameHandler(activeTitle.gameKey);
        });
        $actions.append($playbutton);

        var $remove = $('<span class="button remove noselect">Remove</span>');
        $remove.on('click', function() {
            _Tooltips.Close(activeTitle.gridItem);
            $remove.off('click');
            RemoveTitle(activeTitle, function() {
                
            });
        });
        $actions.append($remove);
        $tooltipContent.append($actions);

        _Tooltips.SingleHTMLWithTitleScreen(activeTitle.gridItem, $tooltipContent, $mediawrapper, activeTitle.gameKey, true, false, null, ['top']);
    };

    var GenerateCollectionTooltipContent = function(collection) {
        
        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip collection-options-menu" role="menu" />');

        $tooltipContent.append($('<div class="collection-tooltip-title" />').text(GetCollectionDisplayName(collection)));

        var $lastPlayed = $('<span class="button first noselect">Sort: Last Played</span>');
        BindTooltipAction($lastPlayed, function(e) {
            CloseCollectionOptionsMenu(collection);
            _TitlesSort.Change('lastPlayed', false);
        });
        $tooltipContent.append($lastPlayed);

        var $nameSort = $('<span class="button noselect">Sort: Name</span>');
        BindTooltipAction($nameSort, function(e) {
            CloseCollectionOptionsMenu(collection);
            _TitlesSort.Change('name', false);
        });
        $tooltipContent.append($nameSort);

        var $playCountSort = $('<span class="button noselect">Sort: Play Count</span>');
        BindTooltipAction($playCountSort, function(e) {
            CloseCollectionOptionsMenu(collection);
            _TitlesSort.Change('playCount', false);
        });
        $tooltipContent.append($playCountSort);

        var $rename = $('<span class="button noselect">Rename</span>');
        BindTooltipAction($rename, function(e) {
            CloseCollectionOptionsMenu(collection);
            OpenCollectionNameEditor('rename', collection, collection.gridItem);
        });
        $tooltipContent.append($rename);
    
        var $remove = $('<span class="button remove noselect">Delete</span>');
        BindTooltipAction($remove, function(e) {
            $remove.off('click.collectionActivate keydown.collectionActivate');
            CloseCollectionOptionsMenu(collection);
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
        var _isOpen = false;

        var Show = function(e) {

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!CanShowCollectionTools()) {
                return;
            }

            _isOpen = true;
            __self.Update(true);

            CloseCollectionOptionsMenus();
            DestroyTooltipsIn($gi);
            $gi
                .off('click.collectionActivate keydown.collectionActivate')
                .removeClass('tooltip tooltip-static-right collection-tab-has-options')
                .addClass('collection-tab-editor')
                .attr('role', 'presentation')
                .removeAttr('title aria-label tabindex aria-selected aria-current aria-controls')
                .empty();

            var $wrapper = $('<div class="collection-inline-editor" />');
            var $input = $('<input type="text" maxlength="60" class="collection-inline-editor-input tooltip" />');
            var $confirm = $('<button type="button" class="collection-inline-editor-button collection-inline-editor-confirm" />').text('Save');
            var $cancel = $('<button type="button" class="collection-inline-editor-button collection-inline-editor-cancel" />').text('Cancel');

            if (_self.HasDefaultCollection()) {
                $input.attr('placeholder', 'Collection name');
            }
            else {
                $input.attr('placeholder', 'New collection');
            }

            var Confirm = function(e) {

                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                var activeCollection = FindActiveCollection();
                var value = ValidateCollectionName($input.val(), _self.HasDefaultCollection() ? activeCollection : null, $input);

                if (!value) {
                    return;
                }

                $confirm.prop('disabled', true);
                $cancel.prop('disabled', true);
                $wrapper.addClass('saving');

                SaveCollectionName(value, 'create', activeCollection, function() {
                    _isOpen = false;
                    Reset();
                    RenderCollectionHeader();
                });
            };

            var Cancel = function(e) {

                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                $input.val('');
                Reset();
            };

            $wrapper
                .off('click.collectionInlineEditor keydown.collectionInlineEditor')
                .on('click.collectionInlineEditor keydown.collectionInlineEditor', function(e) {
                    e.stopPropagation();
                });

            $input.on('keydown.collectionInlineEditor', function(e) {
                //_Logging.Console('ces.collections', 'keydown event with code: ' + e.which);
                if (e.which === 13) {
                    Confirm(e);
                }
                else if (e.which === 27) {
                    Cancel(e);
                }
            });

            $confirm.on('click.collectionInlineEditor', Confirm);
            $cancel.on('click.collectionInlineEditor', Cancel);

            $wrapper.append($input);
            $wrapper.append($confirm);
            $wrapper.append($cancel);
            $gi.append($wrapper);

            _collectionsGrid.isotope('layout');
            _Tooltips.Any();
            $input.focus();
        };

        var Reset = function() {

            _isOpen = false;

            $gi.find('.collection-inline-editor, .collection-inline-editor-input, .collection-inline-editor-button').off('.collectionInlineEditor');
            DestroyTooltipsIn($gi);

            var label = _self.HasDefaultCollection() ? 'Name your collection' : '+ Collection';
            var ariaLabel = _self.HasDefaultCollection() ? 'Give a name to your current collection of games to begin creating a library of several more' : 'Create a new personal game collection';

            $gi
                .off('click.collectionActivate keydown.collectionActivate')
                .removeClass('collection-tab-editor collection-tab-has-options tooltip tooltip-static-right')
                .addClass('collection-tab collection-tab-add')
                .data('type', GetCollectionSortType({ name: '' }))
                .attr('role', 'button')
                .attr('tabindex', '0')
                .attr('aria-label', ariaLabel)
                .removeAttr('aria-selected aria-current aria-controls aria-haspopup')
                .empty();

            $gi.append($('<span class="collection-tab-name collection-tab-add-label" />').text(label));

            BindKeyboardActivate($gi, function(e) {
                Show(e);
            });

            _collectionsGrid.isotope('updateSortData').isotope({ sortBy : 'type' });
            __self.Update();
        };

        //changes to how the control should work or appear can be handled here
        this.Update = function(controlsOpenned) {
            
            _Tooltips.Destroy($griditem); //remove any existing tooltip

            //early exit if the controls are openned (dont want tooltips to get in the way)
            if (controlsOpenned || _isOpen) return;

            $griditem.find('.collection-tab-add-label').text(_self.HasDefaultCollection() ? 'Name your collection' : '+ Collection');
            $griditem.attr('aria-label', _self.HasDefaultCollection() ? 'Name your collection' : 'Create a new personal game collection');
            $griditem.removeClass('tooltip tooltip-static-right').removeAttr('title');

            //add a tooltip depending on context
            if (_self.IsEmpty()) {

            }
            else if (_self.HasDefaultCollection()) {
                $griditem.attr('title', 'Give a name to your current collection of games to begin creating a library of several more');
                $griditem.addClass('tooltip-static-right');
            }
            else {
                $griditem.attr('title', 'Create a new personal game collection');
                $griditem.addClass('tooltip');
            }
            _Tooltips.Any(); //reapply any changes
        };

        this.Reset = function() {
            Reset();
        };

        //to avoid confusion, this is the constructor for the "New Collection" controls
        var Constructor = (function() {
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
            var active;

            payload = payload || {};
            SetCollectionToolsStorageKey(payload);
            active = payload.active || {};
            active.titles = active.titles || [];
            payload.collections = payload.collections || [];

            //handle active collection titles
            ParseActiveTitles(active.titles);

            //determine if this collection is not the collection currently on display
            isNewCollection = (_activeCollectionId != active.id);
            _activeCollectionId = active.id || null;
            _activeCollectionName = active.name || null;
            _externalActiveCollection = null;

            if (!_activeCollectionId && payload.collections.length === 0) {
                CloseCollectionOptionsMenus();
                _isCollectionNameEditorOpen = false;
                _TitlesSort.Reset();
            }

            //handle other collection names data
            ParseCollectionNames(payload.collections);

            //unlock collection-management affordances only after the user has a real
            //collection, then keep that state for this user in local browser storage.
            UpdateCollectionToolsUnlocked();

            //populate updates grid
            _self.PopulateTitles();
            _self.PopulateCollections();

            //dont show default collection when no titles (new user experience)
            if (_self.IsEmpty()) {
                GetCollectionsWrapper().addClass('new-user');
                if (_collectionControls) {
                    _collectionControls.Reset();
                }
            } else {
                GetCollectionsWrapper().removeClass('new-user');
                
                //in this condition, the default collection is present with titles but unnamed
                if (_self.HasDefaultCollection()) {

                }
                //otherwise show all collections
                else {
                    _collectionsGrid.isotope('layout'); //reapply layout for any new or removed
                }

                //update tooltips for collection controls
                if (_collectionControls) {
                    _collectionControls.Update();
                }
            }

            ApplyCollectionToolsVisibility();
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

                        //retake this collection's server values in case of rename or future metadata changes
                        var existingGridItem = _collectionNames[j].gridItem;
                        _collectionNames[j] = $.extend({}, _collectionNames[j], payload[i]);
                        if (existingGridItem) {
                            _collectionNames[j].gridItem = existingGridItem;
                        }

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
                    if (_collectionNames[k].gridItem && _collectionNames[k].gridItem.length) {
                        _Tooltips.Destroy(_collectionNames[k].gridItem);
                        _collectionsGrid.isotope('remove', _collectionNames[k].gridItem);
                    }
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
                    var gameLink = new cesGameLink(_config, _Media, _Tooltips, _self, gameKey, 'a', false, _PlayGameHandler, OnImageLoaded, false);

                    //push to our local cache
                    _activeCollectionTitles.push({
                        gameKey: gameKey,
                        lastPlayed: lastPlayed,
                        lastPlayedServerDate: utcDate,
                        playCount: payload[i].playCount,
                        saveCount: payload[i].saveCount,
                        topRanked: payload[i].topRanked,
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

        BindCollectionOptionsDocumentHandlers();

        var $add = CreateCollectionGirdItem({
            name: '', 
            type: 'z'
        });
        _collectionControls = new NewCollectionControls($add);

        //will also disable on the server for prod
        if (_copyToFeaturedButton) {
            var $featureAdd = CreateCollectionGirdItem({
                name: '!', 
                type: 'y'
            }); //! since this name cannot be entered by a user
        }

        //parse the incoming sync data from server
        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});