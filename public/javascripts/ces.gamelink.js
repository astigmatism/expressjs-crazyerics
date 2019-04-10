var cesGameLink = (function(_config, _Media, _Tooltips, gameKey, cdnPathValue, opt_tooltip, opt_PlayGame, opt_OnImageLoaded, opt_removeSelector, opt_onRemove) {

    //private members
    var self = this;
    var _gamelink;

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
        var $imagewrapper = $('<div class="box zoom transparent"></div>');

        //zoom on click, if zoomed (selected, trigger play)
        $div.on('click', function() {

            if (opt_PlayGame && $imagewrapper.hasClass('zoom-on')) {
                _Tooltips.Close($imagewrapper); //sometimes the tooltip was staying up after clicking
                opt_PlayGame(gameKey);
            }
            $imagewrapper.addClass('zoom-on');
        });
        $div.on('mouseout', function() {
            $imagewrapper.removeClass('zoom-on');
        });

        var $img = _Media.$BoxFront(gameKey, cdnPathValue);

        $img.imagesLoaded().progress(function(imgLoad, image) {
            
            //$imagewrapper.removeClass('close'); //remove close on parent to reveal image
            $imagewrapper.removeClass('transparent').cssAnimation('flipInY', 1000);

            if (opt_OnImageLoaded) {
                opt_OnImageLoaded(image);
            }
        });
        
        $imagewrapper.append($img);

        if (opt_tooltip) {

            //generate new toolips content
            var $tooltipContent = $('<div class="gamelink-tooltip" />');
            $tooltipContent.append('<div class="tooltiptitle">' + gameKey.title + '</div>');
            var $mediawrapper = $('<div class="mediawrapper"></div>');
            $tooltipContent.append($mediawrapper);
            $tooltipContent.append('<div class="tooltipcaption clickplay">Click again to play!</div>');

            _Tooltips.SingleHTMLWithTitleScreen($imagewrapper, $tooltipContent, $mediawrapper, gameKey, false);
        }

        $div.append($imagewrapper);


        _gamelink = $div; //save to the instance for manipulation later        
    })();

    return this;

});
