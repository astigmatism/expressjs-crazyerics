/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(_config, _Media, _Logging, tooltipSelector, tooltipContentSelector) {
    
    //private members
    var self = this;
    var alreadyProcessedName = 'tooltipstered';
    var alreadyProcessedSelector = '.' + alreadyProcessedName;
    var gameTooltipSide = 'top';
    var gameTooltipOriginClass = 'ces-game-tooltip-origin';
    var gameTooltipOriginOpenClass = 'ces-game-tooltip-origin-open';
    var gameTooltipBoxOpenClass = 'ces-game-tooltip-box-open';
    var gameTooltipKeyupNamespace = 'keyup.cesGameTooltip';
    var gameTooltipMouseNamespace = '.cesGameTooltipMouse';
    var gameTooltipActionNamespace = '.cesGameTooltipAction';
    var gameTooltipMouseCloseDelay = 100;
    var mediaSessionTokenDataName = 'cesMediaSessionToken';
    var mediaSessionActiveDataName = 'cesMediaSessionActive';
    var mediaTransitionTimerDataName = 'cesMediaTransitionTimer';

    var FindGameTooltipBox = function($origin) {

        if (!$origin || !$origin.length) {
            return $();
        }

        if ($origin.hasClass('box')) {
            return $origin;
        }

        var $box = $origin.find('.gamelink .box').first();

        if (!$box.length) {
            $box = $origin.closest('.gamelink').find('.box').first();
        }

        return $box;
    };

    var IsGameTooltipBoxHovered = function($box) {

        if (!$box || !$box.length) {
            return false;
        }

        try {
            return $box.is(':hover') || $box.closest('.gamelink').is(':hover');
        }
        catch (err) {
            return false;
        }
    };

    var SetGameTooltipOpenState = function($origin, isOpen) {

        var $box = FindGameTooltipBox($origin);

        if (isOpen) {
            $origin.addClass(gameTooltipOriginOpenClass);
            $box
                .removeClass('zoom-down')
                .addClass(gameTooltipBoxOpenClass);
        }
        else {
            $origin.removeClass(gameTooltipOriginOpenClass);
            $box
                .removeClass(gameTooltipBoxOpenClass)
                .removeClass('zoom-down');

            if (!IsGameTooltipBoxHovered($box)) {
                $box.removeClass('zoom-on');
            }
        }
    };

    var IsTooltipActive = function(instance) {

        if (!instance || !instance.status) {
            return false;
        }

        var state = instance.status().state;
        return state !== 'closed' && state !== 'disappearing';
    };

    var CloseOpenGameTooltips = function($except) {

        $('.' + gameTooltipOriginClass + alreadyProcessedSelector).each(function() {
            var $origin = $(this);

            if ($except && $origin[0] === $except[0]) {
                return;
            }

            try {
                CancelMediaSession($origin.data('cesTooltipMediaWrapper'));
                $origin.tooltipster('close');
            }
            catch (err) {
                _Logging.Console('ces.tooltips', 'unable to close game tooltip', err);
            }
        });
    };

    var CloseGameTooltipsOnEscape = function() {

        $(document).off(gameTooltipKeyupNamespace).on(gameTooltipKeyupNamespace, function(e) {
            if (e.which === 27) {
                CloseOpenGameTooltips();
            }
        });
    };

    var StopTooltipVideo = function($mediawrapper) {

        $mediawrapper.find('video').each(function() {
            try {
                this.pause();
            }
            catch (err) {
                _Logging.Console('ces.tooltips', 'unable to pause tooltip video', err);
            }
        });
    };

    var CloseGameTooltipInstance = function(instance) {

        if (!IsTooltipActive(instance)) {
            return;
        }

        try {
            CancelMediaSession($(instance.elementOrigin()).data('cesTooltipMediaWrapper'));
            instance.close();
        }
        catch (err) {
            _Logging.Console('ces.tooltips', 'unable to close game tooltip', err);
        }
    };

    var BindCloseAfterTooltipLeave = function(instance, helper) {

        var tooltip = helper && helper.tooltip ? helper.tooltip : (instance.elementTooltip ? instance.elementTooltip() : null);
        var $tooltip = $(tooltip);
        var closeTimer = null;
        var tooltipWasEntered = false;

        if (!$tooltip.length) {
            return;
        }

        var clearCloseTimer = function() {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
        };

        $tooltip
            .off(gameTooltipMouseNamespace)
            .on('mouseenter' + gameTooltipMouseNamespace, function() {
                tooltipWasEntered = true;
                clearCloseTimer();
            })
            .on('mouseleave' + gameTooltipMouseNamespace, function() {

                if (!tooltipWasEntered) {
                    return;
                }

                clearCloseTimer();
                closeTimer = setTimeout(function() {
                    CloseGameTooltipInstance(instance);
                }, gameTooltipMouseCloseDelay);
            });
    };


    var BindCloseAfterTooltipAction = function(instance, helper) {

        var tooltip = helper && helper.tooltip ? helper.tooltip : (instance.elementTooltip ? instance.elementTooltip() : null);
        var $tooltip = $(tooltip);

        if (!$tooltip.length) {
            return;
        }

        $tooltip
            .off(gameTooltipActionNamespace, '.game-tooltip-actions .button')
            .on('click' + gameTooltipActionNamespace, '.game-tooltip-actions .button', function() {

                // Let the button's own click handler run first, then close the popover.
                setTimeout(function() {
                    CloseGameTooltipInstance(instance);
                }, 0);
            });
    };

    var TryPlayVideo = function($video) {

        if (!$video || !$video.length) {
            return;
        }

        try {
            var video = $video.get(0);
            var playResult = video.play();

            if (playResult && typeof playResult.catch === 'function') {
                playResult.catch(function() {
                    // Browsers may block preview autoplay. The title screen remains visible/usable.
                });
            }
        }
        catch (err) {
            _Logging.Console('ces.tooltips', 'unable to play tooltip video', err);
        }
    };


    var RepositionGameTooltip = function(instance, opt_delay) {

        var run = function() {

            if (!IsTooltipActive(instance) || !instance.reposition) {
                return;
            }

            try {
                instance.reposition();
            }
            catch (err) {
                _Logging.Console('ces.tooltips', 'unable to reposition game tooltip', err);
            }
        };

        if (opt_delay) {
            setTimeout(run, opt_delay);
        }
        else if (typeof window !== 'undefined' && window.requestAnimationFrame) {
            window.requestAnimationFrame(run);
        }
        else {
            run();
        }
    };

    var RepositionGameTooltipSoon = function(instance) {

        // CDN media can change the popover height after Tooltipster has measured it.
        // Re-measure immediately and once more after image/video fade transitions settle.
        RepositionGameTooltip(instance);
        RepositionGameTooltip(instance, 80);
        RepositionGameTooltip(instance, 240);
    };

    var NormalizeGameTooltipSides = function(opt_side) {

        var sides = $.isArray(opt_side) ? opt_side.slice(0) : [opt_side || gameTooltipSide];
        var fallbacks = ['top', 'bottom', 'right', 'left'];

        $.each(fallbacks, function(i, side) {
            if ($.inArray(side, sides) < 0) {
                sides.push(side);
            }
        });

        return sides;
    };

    var GetMediaSessionToken = function($mediawrapper) {

        if (!$mediawrapper || !$mediawrapper.length) {
            return 0;
        }

        return $mediawrapper.data(mediaSessionTokenDataName) || 0;
    };

    var SetNextMediaSessionToken = function($mediawrapper) {

        var nextToken = GetMediaSessionToken($mediawrapper) + 1;
        $mediawrapper.data(mediaSessionTokenDataName, nextToken);
        return nextToken;
    };

    var ClearMediaTransitionTimer = function($mediawrapper) {

        if (!$mediawrapper || !$mediawrapper.length) {
            return;
        }

        var transitionTimer = $mediawrapper.data(mediaTransitionTimerDataName);

        if (transitionTimer) {
            clearTimeout(transitionTimer);
            $mediawrapper.removeData(mediaTransitionTimerDataName);
        }
    };

    var HasReusableLoadedMedia = function($mediawrapper) {

        var loadState = $mediawrapper.data('cesMediaLoadState');
        return loadState === 'title-loaded' || loadState === 'video-loaded' || loadState === 'video-unavailable' || loadState === 'unavailable';
    };

    var PrepareMediaWrapper = function($mediawrapper, opt_loadMovie) {

        var label = opt_loadMovie ? 'Loading preview...' : 'Loading title screen...';

        ClearMediaTransitionTimer($mediawrapper);
        StopTooltipVideo($mediawrapper);
        $mediawrapper
            .removeData('cesMediaLoadState')
            .data(mediaSessionActiveDataName, false)
            .removeClass('game-tooltip-media-loaded game-tooltip-media-unavailable game-tooltip-media-video-unavailable')
            .addClass('game-tooltip-media game-tooltip-media-loading')
            .empty()
            .show()
            .append($('<div class="game-tooltip-media-placeholder" />').append($('<span />').text(label)));
    };

    var BeginMediaSession = function($mediawrapper, opt_loadMovie) {

        if (!HasReusableLoadedMedia($mediawrapper)) {
            PrepareMediaWrapper($mediawrapper, opt_loadMovie);
        }
        else {
            StopTooltipVideo($mediawrapper);
            ClearMediaTransitionTimer($mediawrapper);
        }

        $mediawrapper.data(mediaSessionActiveDataName, true);
        return SetNextMediaSessionToken($mediawrapper);
    };

    var CancelMediaSession = function($mediawrapper) {

        if (!$mediawrapper || !$mediawrapper.length) {
            return;
        }

        ClearMediaTransitionTimer($mediawrapper);
        $mediawrapper.data(mediaSessionActiveDataName, false);
        SetNextMediaSessionToken($mediawrapper);

        var loadState = $mediawrapper.data('cesMediaLoadState');

        if (loadState !== 'loading-title' && loadState !== 'loading-video') {
            return;
        }

        $mediawrapper.removeClass('game-tooltip-media-loading');

        if ($mediawrapper.find('video').length) {
            $mediawrapper
                .data('cesMediaLoadState', 'video-loaded')
                .addClass('game-tooltip-media-loaded');
        }
        else if ($mediawrapper.find('img').length) {
            $mediawrapper
                .data('cesMediaLoadState', 'title-loaded')
                .addClass('game-tooltip-media-loaded');
        }
        else {
            $mediawrapper.removeData('cesMediaLoadState');
        }
    };

    var IsMediaSessionCurrent = function($mediawrapper, mediaSession) {

        return !!$mediawrapper &&
            !!$mediawrapper.length &&
            $mediawrapper.data(mediaSessionTokenDataName) === mediaSession &&
            $mediawrapper.data(mediaSessionActiveDataName) !== false;
    };

    var IsMediaSessionActive = function($mediawrapper, mediaSession, instance) {

        return IsMediaSessionCurrent($mediawrapper, mediaSession) && IsTooltipActive(instance);
    };

    var StopDetachedVideo = function($video) {

        if (!$video || !$video.length) {
            return;
        }

        try {
            var video = $video.get(0);
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
        catch (err) {
            // Detached preview cleanup is best-effort only.
        }
    };

    var SetMediaUnavailable = function($mediawrapper, message, instance, mediaSession) {

        if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
            return;
        }

        $mediawrapper
            .data('cesMediaLoadState', 'unavailable')
            .removeClass('game-tooltip-media-loading game-tooltip-media-loaded game-tooltip-media-video-unavailable')
            .addClass('game-tooltip-media-unavailable')
            .empty()
            .show()
            .append($('<div class="game-tooltip-media-placeholder" />').append($('<span />').text(message || 'Preview unavailable')));

        RepositionGameTooltipSoon(instance);
    };

    var SetTitleScreenImage = function($mediawrapper, $img, instance, mediaSession) {

        if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
            return;
        }

        $mediawrapper
            .data('cesMediaLoadState', 'title-loaded')
            .removeClass('game-tooltip-media-loading game-tooltip-media-unavailable')
            .addClass('game-tooltip-media-loaded')
            .empty()
            .show()
            .append($img);

        $img.stop(true, true).css('opacity', 0).animate({
            opacity: 1
        }, 160, function() {
            RepositionGameTooltip(instance);
        });

        RepositionGameTooltipSoon(instance);
    };

    var SetPreviewVideoUnavailable = function($mediawrapper, instance, mediaSession) {

        if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
            return;
        }

        $mediawrapper
            .data('cesMediaLoadState', 'video-unavailable')
            .removeClass('game-tooltip-media-loading')
            .addClass('game-tooltip-media-video-unavailable');

        RepositionGameTooltipSoon(instance);
    };

    var SetPreviewVideo = function($mediawrapper, $video, instance, mediaSession) {

        var insertVideo = function() {

            $mediawrapper.removeData(mediaTransitionTimerDataName);

            if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                StopDetachedVideo($video);
                return;
            }

            $mediawrapper
                .data('cesMediaLoadState', 'video-loaded')
                .removeClass('game-tooltip-media-loading game-tooltip-media-unavailable game-tooltip-media-video-unavailable')
                .addClass('game-tooltip-media-loaded')
                .empty()
                .show()
                .append($video);

            $video.stop(true, true).css('opacity', 0).animate({
                opacity: 1
            }, 180, function() {
                RepositionGameTooltip(instance);
            });

            RepositionGameTooltipSoon(instance);
            TryPlayVideo($video);
        };

        // Let the title screen breathe before replacing it with motion.
        ClearMediaTransitionTimer($mediawrapper);
        $mediawrapper.data(mediaTransitionTimerDataName, setTimeout(insertVideo, 500));
    };

    var LoadProgressiveMedia = function($mediawrapper, gameKey, opt_loadMovie, instance, mediaSession) {

        if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
            return;
        }

        var loadState = $mediawrapper.data('cesMediaLoadState');

        if (loadState === 'loading-title' || loadState === 'loading-video') {
            return;
        }

        if (loadState === 'video-loaded') {
            TryPlayVideo($mediawrapper.find('video').first());
            return;
        }

        if (loadState === 'title-loaded' && opt_loadMovie) {
            LoadPreviewVideo($mediawrapper, gameKey, instance, mediaSession);
            return;
        }

        if (loadState === 'title-loaded' || loadState === 'unavailable' || loadState === 'video-unavailable') {
            return;
        }

        $mediawrapper.data('cesMediaLoadState', 'loading-title');

        if (_Media.TitleScreenSource) {
            _Media.TitleScreenSource(gameKey, 'c', function(success, status, src) {

                if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                    return;
                }

                if (!success || !src) {
                    SetMediaUnavailable($mediawrapper, 'Title screen unavailable', instance, mediaSession);
                    return;
                }

                var $img = $('<img />')
                    .attr('alt', gameKey.title + ' title screen')
                    .on('load', function() {

                        if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                            return;
                        }

                        SetTitleScreenImage($mediawrapper, $img, instance, mediaSession);

                        if (opt_loadMovie && IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                            LoadPreviewVideo($mediawrapper, gameKey, instance, mediaSession);
                        }
                    })
                    .on('error', function() {
                        SetMediaUnavailable($mediawrapper, 'Title screen unavailable', instance, mediaSession);
                    });

                $img.attr('src', src);
            });
        }
        else {
            _Media.TitleScreen($('<div />'), gameKey, 'c', function(success, response, $img) {

                if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                    return;
                }

                if (!success || !$img) {
                    SetMediaUnavailable($mediawrapper, 'Title screen unavailable', instance, mediaSession);
                    return;
                }

                $img.attr('alt', gameKey.title + ' title screen');
                SetTitleScreenImage($mediawrapper, $img, instance, mediaSession);

                if (opt_loadMovie && IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                    LoadPreviewVideo($mediawrapper, gameKey, instance, mediaSession);
                }
            });
        }
    };

    var LoadPreviewVideo = function($mediawrapper, gameKey, instance, mediaSession) {

        if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
            return;
        }

        if ($mediawrapper.data('cesMediaLoadState') === 'loading-video' || $mediawrapper.data('cesMediaLoadState') === 'video-loaded') {
            return;
        }

        var height = $mediawrapper.height() || null;
        $mediawrapper.data('cesMediaLoadState', 'loading-video');

        _Media.Video($mediawrapper, 'sq', gameKey, function($video) {

            if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                StopDetachedVideo($video);
                return;
            }

            if (!$video) {
                SetPreviewVideoUnavailable($mediawrapper, instance, mediaSession);
                return;
            }

            $video
                .attr('aria-label', gameKey.title + ' gameplay preview')
                .attr('playsinline', 'playsinline')
                .attr('muted', 'muted')
                .attr('loop', 'loop')
                .prop('muted', true)
                .prop('loop', true);

            SetPreviewVideo($mediawrapper, $video, instance, mediaSession);
        }, null, height, function() {

            if (!IsMediaSessionActive($mediawrapper, mediaSession, instance)) {
                return;
            }

            SetPreviewVideoUnavailable($mediawrapper, instance, mediaSession);
        });
    };

    this.Any = function() {

        //convert name to selector by adding .
        $(tooltipSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: [1000, 0]
        });

        //static tooltip to the right
        $(tooltipSelector + '-static-right:not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            position: 'right'
        });
    };

    this.SingleHTML = function($el, $content, opt_interactive, opt_functionBefore, opt_trigger) {

        opt_interactive = opt_interactive == undefined ? true : opt_interactive;
        opt_trigger = opt_trigger || 'hover';

        if (!$el.hasClass(alreadyProcessedName)) {
            $el.tooltipster({
                theme: 'tooltipster-shadow',
                animation: 'grow',
                trigger: opt_trigger,
                delay: [500, 200],
                animationDuration: [200, 300],
                interactive: opt_interactive,
                contentAsHTML: true,
                content: $content,
                functionBefore: opt_functionBefore //function(instance, helper)
            });
        }
        else {
            //if already processed, simply update its content
            $el.tooltipster('content', $content);
        }
    };

    this.SingleHTMLWithTitleScreen = function($el, $content, $mediawrapper, gameKey, opt_interactive, opt_loadMovie, opt_functionBefore, opt_side) {

        opt_interactive = opt_interactive == undefined ? true : opt_interactive;
        opt_loadMovie = opt_loadMovie == undefined ? true : opt_loadMovie;
        opt_side = NormalizeGameTooltipSides(opt_side == undefined ? gameTooltipSide : opt_side);

        if ($el.hasClass(alreadyProcessedName)) {
            SetGameTooltipOpenState($el, false);
            $el.tooltipster('destroy'); //remove any previus def
        }

        $el.addClass(gameTooltipOriginClass);
        $el.data('cesTooltipMediaWrapper', $mediawrapper);
        $content.addClass('game-tooltip-card');
        PrepareMediaWrapper($mediawrapper, opt_loadMovie);

        $el.tooltipster({
            theme: ['tooltipster-shadow', 'ces-game-popover-theme'],
            animation: 'gamefade',
            side: opt_side,
            trigger: 'custom',
            triggerOpen: {
                click: true,
                tap: true
            },
            triggerClose: {
                click: true,
                tap: true
            },
            delay: [0, 120],
            animationDuration: [120, 100],
            interactive: opt_interactive,
            contentAsHTML: true,
            content: $content,
            trackTooltip: true,
            trackerInterval: 120,
            repositionOnScroll: true,
            updateAnimation: 'fade',
            functionBefore: function(instance, helper) {

                if (opt_functionBefore) {
                    if (!opt_functionBefore()) {
                        return false;
                    }
                }

                CloseOpenGameTooltips($el);
                SetGameTooltipOpenState($el, true);
                return true;
            },
            functionReady: function(instance, helper) {

                SetGameTooltipOpenState($el, true);
                CloseGameTooltipsOnEscape();
                RepositionGameTooltipSoon(instance);
                BindCloseAfterTooltipLeave(instance, helper);
                BindCloseAfterTooltipAction(instance, helper);
                LoadProgressiveMedia($mediawrapper, gameKey, opt_loadMovie, instance, BeginMediaSession($mediawrapper, opt_loadMovie));
            },
            functionAfter: function(instance, helper) {

                SetGameTooltipOpenState($el, false);
                CancelMediaSession($mediawrapper);
                StopTooltipVideo($mediawrapper);

                if (!$('.' + gameTooltipOriginClass + alreadyProcessedSelector).filter(function() {
                    var instances = $.tooltipster.instances($(this));
                    return instances.length && IsTooltipActive(instances[0]);
                }).length) {
                    $(document).off(gameTooltipKeyupNamespace);
                }
            }
        });
    };

    this.Show = function($el) {
        if ($el.hasClass(alreadyProcessedName)) {
            $el.tooltipster('show');
        }
    }

    this.Hide = function($el) {
        if ($el.hasClass(alreadyProcessedName)) {
            CancelMediaSession($el.data('cesTooltipMediaWrapper'));
            $el.tooltipster('hide');
        }
    }

    this.Close = function($el) {
        if ($el.hasClass(alreadyProcessedName)) {
            CancelMediaSession($el.data('cesTooltipMediaWrapper'));
            $el.tooltipster('close');
            SetGameTooltipOpenState($el, false);
            $el.trigger('mouseleave');
        }
    };

    this.Destroy = function($el) {
        if ($el.hasClass(alreadyProcessedName)) {
            CancelMediaSession($el.data('cesTooltipMediaWrapper'));
            SetGameTooltipOpenState($el, false);
            $el.find(alreadyProcessedSelector).tooltipster('destroy');
            $el.tooltipster('destroy');
            $el.removeData('cesTooltipMediaWrapper');
        }
    };
    
    //constructor
    var Constructor = (function() {
    })();

    return this;
});
