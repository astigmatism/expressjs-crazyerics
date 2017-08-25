var cesGameLink = (function(config, system, title, file, size, includeRemove, opt_PlayGame) {

    //private members
    var self = this;
    var _gamelink;
    var _imagewrapper;
    var _image;
    var _remove;
    var _onRemove = null;

    //public members

    this.GetDOM = function() {
        return _gamelink;
    };

    this.OnRemoveClick = function(operation) {
        _onRemove = operation;
    };

    this.DisableAllEvents = function() {

        $(_gamelink).find('*').off();
    };

    var Constructor = (function() {

        includeRemove = includeRemove || false;

        var $div = $('<div class="gamelink"></div>');
        var $box = cesGetBoxFront(config, system, title, size);

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

                if (opt_PlayGame) {
                    opt_PlayGame(system, title, file);
                }
            });
        });

        var $imagewrapper = $('<div class="box zoom close"></div>');

        $imagewrapper.append($box);

        //also when box load fails, in addition to showing the blank cartridge, let's create a fake label for it
        $box.error(function(e) {
            $(this).parent().append('<div class="boxlabel boxlabel-' + system + '"><p>' + title + '</p></div>');
        });

        $div.append($imagewrapper);

        var $remove = null;

        //if including a remove button
        if (includeRemove) {
            $remove = $('<div class="remove tooltip" title="Remove this game and all saved progress"></div>');
            
            //attach event 
            $remove.on('click', function() {
                if (_onRemove) {
                    _onRemove();
                }
            });

            $imagewrapper.append($remove)
            
            //show remove on mouse over
            $imagewrapper
                .on('mouseover', function() {
                    $remove.show();
                })
                .on('mouseout', function() {
                    $remove.hide();
                });
        }

        _gamelink = $div;
        _imagewrapper = $imagewrapper;
        _image = $box;
        _remove = $remove;
    })();

    return this;

});