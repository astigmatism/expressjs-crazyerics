var cesGameLink = (function(_config, _BoxArt, _Tooltips, gameKey, size, opt_tooltip, opt_PlayGame, opt_onImageLoadError, opt_removeSelector, opt_onRemove) {

    //private members
    var self = this;
    var _gamelink;
    var _imagewrapper;
    var _image;
    var _TITLESCREENWIDTH = 160;

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

    var GenerateTooltipContent = function(gameKey) {

        var $tooltipContent = $('<div class="gamelink-tooltip" />');
        $tooltipContent.append('<div>' + gameKey.title + '</div>');
        var $titlescreen = $('<img width="' + _TITLESCREENWIDTH + '" />');
        $tooltipContent.append($titlescreen);

        $titlescreen.hide();
        $titlescreen.imagesLoaded().done(function() {
            $titlescreen.show(); //remove close on parent to reveal image
        });
        $titlescreen.attr('src', _config.paths.images + '/titlescreens/' + gameKey.system + '/' + gameKey.title + '/original.jpg');
        
        return $tooltipContent;

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
                
                if (opt_PlayGame) {
                    opt_PlayGame(gameKey);
                }
            });
        });

        var $imagewrapper = $('<div class="box zoom close"></div>');
        
        $imagewrapper.addClass('close');
        if (opt_tooltip) {
            //$imagewrapper.addClass('tooltip');
            //$imagewrapper.attr('title', gameKey.title);

            //generate new toolips content
            var $tooltipContent = GenerateTooltipContent(gameKey);   //generate html specific for collections
            _Tooltips.SingleHTML($imagewrapper, $tooltipContent, false); //reapply tooltips
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
