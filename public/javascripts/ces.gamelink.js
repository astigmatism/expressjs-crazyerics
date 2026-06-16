var cesGameLink = (function(_config, _Media, _Tooltips, _Collections, gameKey, cdnPathValue, opt_tooltip, opt_PlayGame, opt_OnImageLoaded, opt_ImageAnimation) {

    //private members
    var self = this;
    var _gamelink;
    var _imageAnimation = opt_ImageAnimation === undefined ? 'flipInY' : opt_ImageAnimation;
    var _gameTooltipOriginClass = 'ces-game-tooltip-origin';
    var _gameTooltipBoxOpenClass = 'ces-game-tooltip-box-open';

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

        var HasGamePopover = function() {
            return $imagewrapper.hasClass(_gameTooltipOriginClass) || $imagewrapper.closest('.' + _gameTooltipOriginClass).length > 0;
        };

        var KeepPopoverBoxLifted = function() {
            return $imagewrapper.hasClass(_gameTooltipBoxOpenClass);
        };

        //zoom on click, if zoomed (selected, trigger play)
        $div.on('click', function() {

            // if (opt_PlayGame && $imagewrapper.hasClass('zoom-on')) {
            //     _Tooltips.Close($imagewrapper); //sometimes the tooltip was staying up after clicking
            //     opt_PlayGame(gameKey);
            // }

            if (HasGamePopover()) {
                $imagewrapper.removeClass('zoom-down');
                $imagewrapper.addClass('zoom-on');
                return;
            }

            $imagewrapper.removeClass('zoom-on');
            $imagewrapper.addClass('zoom-down');

        }).on('mouseenter', function() {
            $imagewrapper.removeClass('zoom-down');
            $imagewrapper.addClass('zoom-on');
        })
        .on('mouseleave', function() {
            if (KeepPopoverBoxLifted()) {
                $imagewrapper.removeClass('zoom-on');
                $imagewrapper.removeClass('zoom-down');
                return;
            }

            $imagewrapper.removeClass('zoom-on');
            $imagewrapper.removeClass('zoom-down');
        });

        var $img = _Media.$BoxFront(gameKey, cdnPathValue);

        $img.imagesLoaded().progress(function(imgLoad, image) {
            
            //$imagewrapper.removeClass('close'); //remove close on parent to reveal image
            $imagewrapper.removeClass('transparent');
            if (_imageAnimation) {
                $imagewrapper.cssAnimation(_imageAnimation, 1000);
            }

            if (opt_OnImageLoaded) {
                opt_OnImageLoaded(image);
            }
        });
        
        $imagewrapper.append($img);

        if (opt_tooltip) {

            //generate new toolips content
            var $tooltipContent = $('<div class="gamelink-tooltip game-tooltip-card game-tooltip-suggestion" />');
            $tooltipContent.append($('<div class="tooltiptitle" />').text(gameKey.title));
            var $mediawrapper = $('<div class="mediawrapper game-tooltip-media"></div>');
            $tooltipContent.append($mediawrapper);

            var $actions = $('<div class="game-tooltip-actions" />');
            
            var $addbutton = $('<span class="button add first noselect">Add to Collection</span>');
            $addbutton.on('click', function(e) { 
                _Tooltips.Close($imagewrapper);
                _Collections.AddTitleWithoutPlaying(gameKey);
            });
            $actions.append($addbutton);
            

            var $playbutton = $('<span class="button play noselect">Play Now!</span>');
            $playbutton.on('click', function(e) { 

                _Tooltips.Close($imagewrapper); //sometimes the tooltip was staying up after clicking
                opt_PlayGame(gameKey);
            });
            $actions.append($playbutton);
            $tooltipContent.append($actions);

            var CheckCollectionOnTooltipOpen = (function() {
                if (_Collections.IsEmpty()) {
                    $addbutton.hide();
                    $playbutton.addClass('first');
                }
                else {
                    $addbutton.css('display', 'inline-block');
                    $playbutton.removeClass('first');
                }
                return true; //returning true allows the dialog to continue openning (false would be early exit)
            });

            _Tooltips.SingleHTMLWithTitleScreen($imagewrapper, $tooltipContent, $mediawrapper, gameKey, true, true, CheckCollectionOnTooltipOpen);
        }

        $div.append($imagewrapper);

        _gamelink = $div; //save to the instance for manipulation later        
    })();

    return this;

});
