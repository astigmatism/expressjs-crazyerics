var cesRecentlyPlayed = (function(config, _Compression, PlayGame, GetBoxFront, $wrapper, initialData) {
		
	//private members
	var self = this;
	var _grid = null;
	var _BOXSIZE = 120;

	//public members

	//public methods

	this.Add = function (key, system, title, file, played, slots, callback) {

		AddToGrid(key, system, title, file, played, slots, function() {

			_grid.imagesLoaded().progress( function() {
	            _grid.isotope('layout');
	        });
		});
	};

	//private methods

	var AddToGrid = function(key, system, title, file, played, slots, callback) {

		var gamelink = BuildGameLink(system, title, file, 120, true); //get a game link

		gamelink.div.addClass('close');

        gamelink.img.load(function() {
            gamelink.div.removeClass('close');
        });

        //the remove link will delete the game from play history and any saved states
        gamelink.remove
        .addClass('tooltip')
        .attr('title', 'Remove this game and all saved progress')
        .on('click', function() {
            gamelink.div.addClass('slideup');
            $.ajax({
                url: '/states/delete?key=' + encodeURIComponent(key),
                type: 'DELETE',
                /**
                 * on successful state deletion
                 * @return {undef}
                 */
                complete: function() {
                    setTimeout(function() {
                        gamelink.div.remove();
                    }, 500);
                }
            });
        });

        var $griditem = $('<div class="grid-item" />');
        $griditem.append(gamelink.div);
        
        _grid.isotope( 'insert', $griditem[0]);

        if (callback) {
        	callback();
        }

	};

    /**
     * a common function which returns a clickable div of a game box which acts as a link to bootstrap load the game and emulator
     * @param  {string} system
     * @param  {string} title
     * @param  {number} size        the size of the box front image to load (114, 150)
     * @param  {boolean} close      if true, shows the close button at the corner, no event attached
     * @return {Object}             Contains reference to the li, img and close button
     */
    var BuildGameLink = function(system, title, file, size, close) {
        close = close || false;

        var $div = $('<div class="gamelink"></div>');
        var $box = GetBoxFront(system, title, size);

        $box.addClass('tooltip close');
        $box.attr('title', title);

        //show box art when finished loading
        $box.load(function() {
            $(this)
            .removeClass('close')
            .on('mousedown', function() {
                preventGamePause = true; //prevent current game from pausng before fadeout
            })
            .on('mouseup', function() {

                PlayGame(system, title, file);
                window.scrollTo(0, 0);
            });
        });

        var $imagewrapper = $('<div class="box zoom"></div>');

        $imagewrapper.append($box);

        //also when box load fails, in addition to showing the blank cartridge, let's create a fake label for it
        $box.error(function(e) {
            $(this).parent().append('<div class="boxlabel boxlabel-' + system + '"><p>' + title + '</p></div>');
        });

        $div.append($imagewrapper);

        var $remove = null;
        if (close) {
            $remove = $('<div class="remove"></div>');
            $imagewrapper
                .append($remove)
                .on('mouseover', function() {
                    $remove.show();
                })
                .on('mouseout', function() {
                    $remove.hide();
                });
        }

        return {
            div: $div,
            img: $box,
            remove: $remove
        };
    };

    //constructor
    var Constructor = (function() {

		_grid = $wrapper.isotope({
            itemSelector: '.grid-item'
        });

		var griditems = [];

        for (var game in initialData) {
            AddToGrid(game, initialData[game].system, initialData[game].title, initialData[game].file, initialData[game].played, initialData[game].slots); 
        }

        _grid.imagesLoaded().progress( function() {
            _grid.isotope('layout');
        });

	})();

	return this;

});