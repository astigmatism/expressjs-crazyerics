var cesGameLink = (function(_config, _Media, _Tooltips, _Collections, gameKey, cdnPathValue, opt_tooltip, opt_PlayGame, opt_OnImageLoaded, opt_ImageAnimation, opt_ShowAddWhenCollectionEmpty) {

    //private members
    var self = this;
    var _gamelink;
    var _imageAnimation = opt_ImageAnimation === undefined ? 'flipInY' : opt_ImageAnimation;
    var _gameTooltipOriginClass = 'ces-game-tooltip-origin';
    var _gameTooltipBoxOpenClass = 'ces-game-tooltip-box-open';
    var _collectionGameTooltipOpenClass = 'ces-collection-game-tooltip-open';

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

        var IsCollectionPopoverLockingAdjacentBoxes = function() {

            var $collectionGrid = $imagewrapper.closest('#openCollectionGrid');

            return $collectionGrid.length > 0 &&
                $collectionGrid.hasClass(_collectionGameTooltipOpenClass) &&
                !KeepPopoverBoxLifted();
        };

        var ClearBoxZoomState = function() {
            $imagewrapper.removeClass('zoom-on');
            $imagewrapper.removeClass('zoom-down');
        };

        //zoom on click, if zoomed (selected, trigger play)
        $div.on('click', function() {

            // if (opt_PlayGame && $imagewrapper.hasClass('zoom-on')) {
            //     _Tooltips.Close($imagewrapper); //sometimes the tooltip was staying up after clicking
            //     opt_PlayGame(gameKey);
            // }

            if (IsCollectionPopoverLockingAdjacentBoxes()) {
                ClearBoxZoomState();
                return;
            }

            if (HasGamePopover()) {
                $imagewrapper.removeClass('zoom-down');
                $imagewrapper.addClass('zoom-on');
                return;
            }

            $imagewrapper.removeClass('zoom-on');
            $imagewrapper.addClass('zoom-down');

        }).on('mouseenter', function() {
            if (IsCollectionPopoverLockingAdjacentBoxes()) {
                ClearBoxZoomState();
                return;
            }

            $imagewrapper.removeClass('zoom-down');
            $imagewrapper.addClass('zoom-on');
        })
        .on('mouseleave', function() {
            if (KeepPopoverBoxLifted()) {
                ClearBoxZoomState();
                return;
            }

            ClearBoxZoomState();
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
            var actionHandled = false;
            var actionResetTimer = null;

            var ResetActionGuard = function() {
                actionHandled = false;
                actionResetTimer = null;
            };

            var HandleTooltipAction = function(action, e) {

                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                if (actionHandled) {
                    return false;
                }

                actionHandled = true;

                if (actionResetTimer) {
                    clearTimeout(actionResetTimer);
                }

                actionResetTimer = setTimeout(ResetActionGuard, 750);

                _Tooltips.Close($imagewrapper);

                if (action === 'add') {
                    _Collections.AddTitleWithoutPlaying(gameKey);
                }
                else if (action === 'play' && opt_PlayGame) {
                    opt_PlayGame(gameKey);
                }

                return false;
            };

            var $addbutton = $('<span class="button add first noselect game-tooltip-action" data-game-tooltip-action="add">Add to Collection</span>');
            $actions.append($addbutton);


            var $playbutton = $('<span class="button play noselect game-tooltip-action" data-game-tooltip-action="play">Play Now!</span>');
            $actions.append($playbutton);
            $tooltipContent.append($actions);

            $tooltipContent.on('mousedown.cesSuggestionActions touchstart.cesSuggestionActions click.cesSuggestionActions', '.game-tooltip-action', function(e) {
                return HandleTooltipAction($(this).attr('data-game-tooltip-action'), e);
            });

            var CheckCollectionOnTooltipOpen = (function() {
                if (_Collections.IsEmpty() && !opt_ShowAddWhenCollectionEmpty) {
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
