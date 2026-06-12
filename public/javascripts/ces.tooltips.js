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
    var gameTooltipKeyupNamespace = 'keyup.cesGameTooltip';
    var gameTooltipMouseNamespace = '.cesGameTooltipMouse';
    var gameTooltipMouseCloseDelay = 100;

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

    var PrepareMediaWrapper = function($mediawrapper, opt_loadMovie) {

        var label = opt_loadMovie ? 'Loading preview...' : 'Loading title screen...';

        StopTooltipVideo($mediawrapper);
        $mediawrapper
            .removeData('cesMediaLoadState')
            .removeClass('game-tooltip-media-loaded game-tooltip-media-unavailable game-tooltip-media-video-unavailable')
            .addClass('game-tooltip-media game-tooltip-media-loading')
            .empty()
            .show()
            .append($('<div class="game-tooltip-media-placeholder" />').append($('<span />').text(label)));
    };

    var SetMediaUnavailable = function($mediawrapper, message, instance) {

        $mediawrapper
            .data('cesMediaLoadState', 'unavailable')
            .removeClass('game-tooltip-media-loading game-tooltip-media-loaded game-tooltip-media-video-unavailable')
            .addClass('game-tooltip-media-unavailable')
            .empty()
            .show()
            .append($('<div class="game-tooltip-media-placeholder" />').append($('<span />').text(message || 'Preview unavailable')));

        RepositionGameTooltipSoon(instance);
    };

    var SetTitleScreenImage = function($mediawrapper, $img, instance) {

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

    var SetPreviewVideoUnavailable = function($mediawrapper, instance) {

        $mediawrapper
            .data('cesMediaLoadState', 'video-unavailable')
            .removeClass('game-tooltip-media-loading')
            .addClass('game-tooltip-media-video-unavailable');

        RepositionGameTooltipSoon(instance);
    };

    var SetPreviewVideo = function($mediawrapper, $video, instance) {

        var insertVideo = function() {

            if (!IsTooltipActive(instance)) {
                $mediawrapper.data('cesMediaLoadState', 'title-loaded');
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
        setTimeout(insertVideo, 500);
    };

    var LoadProgressiveMedia = function($mediawrapper, gameKey, opt_loadMovie, instance) {

        var loadState = $mediawrapper.data('cesMediaLoadState');

        if (loadState === 'loading-title' || loadState === 'loading-video') {
            return;
        }

        if (loadState === 'video-loaded') {
            TryPlayVideo($mediawrapper.find('video').first());
            return;
        }

        if (loadState === 'title-loaded' && opt_loadMovie) {
            LoadPreviewVideo($mediawrapper, gameKey, instance);
            return;
        }

        if (loadState === 'title-loaded' || loadState === 'unavailable' || loadState === 'video-unavailable') {
            return;
        }

        $mediawrapper.data('cesMediaLoadState', 'loading-title');

        if (_Media.TitleScreenSource) {
            _Media.TitleScreenSource(gameKey, 'c', function(success, status, src) {

                if (!success || !src) {
                    SetMediaUnavailable($mediawrapper, 'Title screen unavailable', instance);
                    return;
                }

                var $img = $('<img />')
                    .attr('alt', gameKey.title + ' title screen')
                    .on('load', function() {
                        SetTitleScreenImage($mediawrapper, $img, instance);

                        if (opt_loadMovie) {
                            LoadPreviewVideo($mediawrapper, gameKey, instance);
                        }
                    })
                    .on('error', function() {
                        SetMediaUnavailable($mediawrapper, 'Title screen unavailable', instance);
                    });

                $img.attr('src', src);
            });
        }
        else {
            _Media.TitleScreen($mediawrapper, gameKey, 'c', function(success, response, $img) {

                if (!success || !$img) {
                    SetMediaUnavailable($mediawrapper, 'Title screen unavailable', instance);
                    return;
                }

                $img.attr('alt', gameKey.title + ' title screen');
                SetTitleScreenImage($mediawrapper, $img, instance);

                if (opt_loadMovie) {
                    LoadPreviewVideo($mediawrapper, gameKey, instance);
                }
            });
        }
    };

    var LoadPreviewVideo = function($mediawrapper, gameKey, instance) {

        if ($mediawrapper.data('cesMediaLoadState') === 'loading-video' || $mediawrapper.data('cesMediaLoadState') === 'video-loaded') {
            return;
        }

        var height = $mediawrapper.height() || null;
        $mediawrapper.data('cesMediaLoadState', 'loading-video');

        _Media.Video($mediawrapper, 'sq', gameKey, function($video) {

            if (!$video) {
                SetPreviewVideoUnavailable($mediawrapper, instance);
                return;
            }

            $video
                .attr('aria-label', gameKey.title + ' gameplay preview')
                .attr('playsinline', 'playsinline')
                .attr('muted', 'muted')
                .attr('loop', 'loop')
                .prop('muted', true)
                .prop('loop', true);

            SetPreviewVideo($mediawrapper, $video, instance);
        }, null, height, function() {
            SetPreviewVideoUnavailable($mediawrapper, instance);
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
            $el.tooltipster('destroy'); //remove any previus def
        }

        $el.addClass(gameTooltipOriginClass);
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
                return true;
            },
            functionReady: function(instance, helper) {

                CloseGameTooltipsOnEscape();
                RepositionGameTooltipSoon(instance);
                BindCloseAfterTooltipLeave(instance, helper);
                LoadProgressiveMedia($mediawrapper, gameKey, opt_loadMovie, instance);
            },
            functionAfter: function(instance, helper) {

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
            $el.tooltipster('hide');
        }
    }

    this.Close = function($el) {
        if ($el.hasClass(alreadyProcessedName)) {
            $el.tooltipster('close');
            $el.trigger('mouseleave');
        }
    };

    this.Destroy = function($el) {
        if ($el.hasClass(alreadyProcessedName)) {
            $el.find(alreadyProcessedSelector).tooltipster('destroy');
            $el.tooltipster('destroy');
        }
    };
    
    //constructor
    var Constructor = (function() {
    })();

    return this;
});
