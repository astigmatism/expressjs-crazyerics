var cesRecentlyPlayed = (function(config, _Compression, _PlayGame, $wrapper, _initialData, _OnRemoveHandler) {
		
	//private members
	var self = this;
	var _grid = null;
	var _BOXSIZE = 120;

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        sortAscending = sortAscending === true || false;

        //ensure data is up to date
        _grid.isotope('updateSortData').isotope();

        _grid.isotope({ 
            sortBy : property,
            sortAscending: sortAscending
        });
    };

	this.Add = function (key, data, isNew, callback) {

        //data comes in from playerdata
        if (data.system && data.title && data.file && data.lastPlayed) {

            //is new, create a gamelink and add
            if (isNew) {

        		AddToGrid(key, data.system, data.title, data.file, data.lastPlayed, function() {

                    OnImagesLoaded();
                });
            }
            //update detils and resort
            else {
                
                var $item = _grid.find('*[data-key="' + key + '"]');

                $item.attr('data-lastPlayed', data.lastPlayed);

                self.SortBy('lastPlayed', false);

                OnImagesLoaded();
            }
        }
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
	var AddToGrid = function(key, system, title, file, lastPlayed, callback) {

        //create the grid item
        var $griditem = $('<div class="grid-item" />');

		var gamelink = new cesGameLink(config, system, title, file, 120, true, _PlayGame);

        //set the on remove function
        gamelink.OnRemoveClick(function() {
            Remove(key, gamelink, $griditem);
        });

        //place sorting data on grid item
        $griditem.attr('data-key', key);
        $griditem.attr('data-lastPlayed', lastPlayed);

        $griditem.append(gamelink.GetDOM()); //add gamelink
        
        _grid.isotope( 'insert', $griditem[0]);

        if (callback) {
        	callback();
        }
	};

    var Remove = function(key, gamelink, griditem) {

        //maybe set a loading spinner on image here?
        
        gamelink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

        //immediately remove from grid (i used to wait for response but why right?)
        _grid.isotope('remove', griditem).isotope('layout');

        $.ajax({
            url: '/states/delete?key=' + encodeURIComponent(key),
            type: 'DELETE',
            /**
             * on successful state deletion
             * @return {undef}
             */
            complete: function() {
                
                //clear mem
                gamelink = null;

                //callback the function to remove from player data
                if (_OnRemoveHandler) {
                    _OnRemoveHandler(key); //passed in, will remove from player data at main level 
                }
            }
        });
    };

    //constructor
    var Constructor = (function() {

		_grid = $wrapper.isotope({
            itemSelector: '.grid-item',
            getSortData: {
                lastPlayed: function(item) {
                    var played = $(item).attr('data-lastPlayed');
                    return parseInt(played, 10);
                }
            }
        });

        for (var game in _initialData) {
            AddToGrid(game, _initialData[game].system, _initialData[game].title, _initialData[game].file, _initialData[game].lastPlayed); 
        }

        self.SortBy('lastPlayed', false);

        OnImagesLoaded();

	})();

	return this;

});