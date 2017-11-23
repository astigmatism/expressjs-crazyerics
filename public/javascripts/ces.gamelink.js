var cesGameLink = (function(_BoxArt, gameKey, size, opt_tooltip, opt_PlayGame, opt_onImageLoadError, opt_removeSelector, opt_onRemove) {

    //private members
    var self = this;
    var _gamelink;
    var _imagewrapper;
    var _image;

    //public members

    this.GetDOM = function() {
        return _gamelink;
    };
    
    this.DisableAllEvents = function() {

        $(_gamelink).find('*').off();
    };

    this.SetImageLoadError = function(handler) {
        opt_onImageLoadError = handler;
    };

    var Constructor = (function() {

        var _self = this;

        var $div = $('<div class="gamelink"></div>');
        var $box = _BoxArt.Get$(gameKey, size, function(image) {
            //on image load failure
            $(image).parent().append('<div class="boxlabel boxlabel-' + gameKey.system + '"><p>' + gameKey.title + '</p></div>');
            if (opt_onImageLoadError) {
                opt_onImageLoadError(image);
            }
        });

        //show box art when finished loading
        $box.load(function() {
            $(this)
            .removeClass('close')
            .on('mousedown', function() {
                preventGamePause = true; //prevent current game from pausng before fadeout
            })
            .on('mouseup', function() {

                if (opt_PlayGame) {
                    opt_PlayGame(gameKey);
                }
            });
        });

        var $imagewrapper = $('<div class="box zoom close"></div>');
        
        $imagewrapper.addClass('close');
        if (opt_tooltip) {
            $imagewrapper.addClass('tooltip');
            $imagewrapper.attr('title', gameKey.title);
        }

        $imagewrapper.append($box);

        $div.append($imagewrapper);

        if (opt_removeSelector) {
            _self.AssignRemove(opt_removeSelector, opt_onRemove);
        }

        _gamelink = $div;
        _imagewrapper = $imagewrapper;
        _image = $box;
    })();

    return this;

});
