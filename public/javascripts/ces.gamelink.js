var cesGameLink = (function(_config, _Images, _Tooltips, gameKey, size, opt_tooltip, opt_PlayGame, opt_onImageLoadError, opt_removeSelector, opt_onRemove) {

    //private members
    var self = this;
    var _gamelink;
    var _imagewrapper;
    var _image;
    var _loadingIcon = 'Blocks-1s-61px.svg';
    var _BOXFRONTWIDTH = 116;

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
        var $imagewrapper = $('<div class="box zoom close"></div>');
        
        var img = document.createElement('img');
        img.src = _config.paths.boxfront + '/' + encodeURIComponent(gameKey.gk) + '?w=' + _BOXFRONTWIDTH;



        // _Images.BoxFront($box, gameKey, function(success, status) {

        //     if (success) {
        //         $imagewrapper.removeClass('close');

        //         $imagewrapper.on('mousedown', function() {
                    
        //             if (opt_PlayGame) {
        //                 opt_PlayGame(gameKey);
        //             }
        //         });
        //     }

        // }, _BOXFRONTWIDTH);
        
        //$imagewrapper.addClass('close');

        if (opt_tooltip) {

            //generate new toolips content
            var $tooltipContent = $('<div class="gamelink-tooltip" />');
            $tooltipContent.append('<div class="tooltiptitle">' + gameKey.title + '</div>');
            var $titlescreenwrapper = $('<div class="titlescreenplaceholder"></div>');
            $tooltipContent.append($titlescreenwrapper);

            _Tooltips.SingleHTMLWithTitleScreen($imagewrapper, $tooltipContent, $titlescreenwrapper, gameKey, false);
        }

        $imagewrapper.append($(img));

        $div.append($imagewrapper);

        if (opt_removeSelector) {
            _self.AssignRemove(opt_removeSelector, opt_onRemove);
        }

        _gamelink = $div;
        _imagewrapper = $imagewrapper;
        //_image = $box;
    })();

    return this;

});
