var cesGameLink = (function(_config, _Images, _Tooltips, gameKey, size, opt_tooltip, opt_PlayGame, opt_OnImageLoaded, opt_removeSelector, opt_onRemove) {

    //private members
    var self = this;
    var _gamelink;
    var _BOXFRONTWIDTH = 116;

    //public members

    this.GetDOM = function() {
        return _gamelink;
    };
    
    this.DisableAllEvents = function() {

        $(_gamelink).find('*').off();
    };

    var Constructor = (function() {

        var _self = this;

        var $div = $('<div class="gamelink"></div>');
        var $imagewrapper = $('<div class="box zoom close"></div>');

        var $img = _Images.$BoxFront(gameKey, _BOXFRONTWIDTH);

        $img.imagesLoaded().progress(function(imgLoad, image) {
            $imagewrapper.removeClass('close'); //remove close on parent to reveal image

            //attach play game event only when image is available
            $imagewrapper.on('mousedown', function() {
                    
                if (opt_PlayGame) {
                    opt_PlayGame(gameKey);
                }
            });

            if (opt_OnImageLoaded) {
                opt_OnImageLoaded(image);
            }
        });
        
        $imagewrapper.append($img);

        if (opt_tooltip) {

            //generate new toolips content
            var $tooltipContent = $('<div class="gamelink-tooltip" />');
            $tooltipContent.append('<div class="tooltiptitle">' + gameKey.title + '</div>');
            var $titlescreenwrapper = $('<div class="titlescreenplaceholder"></div>');
            $tooltipContent.append($titlescreenwrapper);

            _Tooltips.SingleHTMLWithTitleScreen($imagewrapper, $tooltipContent, $titlescreenwrapper, gameKey, false);
        }

        $div.append($imagewrapper);


        _gamelink = $div; //save to the instance for manipulation later        
    })();

    return this;

});
