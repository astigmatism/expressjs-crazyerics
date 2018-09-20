/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(_config, _Media, _Logging, tooltipSelector, tooltipContentSelector) {
    
    //private members
    var self = this;
    var alreadyProcessedName = 'tooltipstered';
    var alreadyProcessedSelector = '.' + alreadyProcessedName;

    this.Any = function() {

        //convert name to selector by adding .
        $(tooltipSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: [1200, 0]
        });
    };

    this.SingleHTML = function($el, $content, opt_interactive, opt_functionBefore) {

        opt_interactive = opt_interactive == undefined ? true : opt_interactive;

        if (!$el.hasClass(alreadyProcessedName)) {
            $el.tooltipster({
                theme: 'tooltipster-shadow',
                animation: 'grow',
                delay: [1200, 200],
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

    this.SingleHTMLWithTitleScreen = function($el, $content, $mediawrapper, gameKey, opt_interactive) {

        opt_interactive = opt_interactive == undefined ? true : opt_interactive;

        if ($el.hasClass(alreadyProcessedName)) {
            $el.tooltipster('destroy'); //remove any previus def
        }

        //this will have multiple tooltips, one for loading

        $el.tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: [1000, 100],
            multiple: true,
            animationDuration: [200, 300],
            interactive: opt_interactive,
            contentAsHTML: true,
            content: '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>'
        });
        
        $el.tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: [1200, 100],
            animationDuration: [200, 300],
            interactive: opt_interactive,
            contentAsHTML: true,
            multiple: true,
            content: $content,
            functionBefore: function(instance, helper) {

                //on the initial open, we won't have loaded the image from the cdn yet and the tooltip will appear without it
                if (!$mediawrapper.hasClass('titlescreenloaded')) {

                    //obtain the image (a 160, b 320, c is 240)
                    _Media.TitleScreen($mediawrapper, gameKey, 'c', function(success, response, $img) {
                        
                        //disable the loading tooltip
                        var instances = $.tooltipster.instances($el);

                        //if the user is already moving away from the loading tooltip, bail showing the next content tooltip (the loading tooltip must be enabled of course, it won't be afterwards)
                        if (instances[0].status().enabled && (instances[0].status().state === 'disappearing' || instances[0].status().state === 'closed'))
                        {
                            _Logging.Console('ces.tooltips', 'state of "loading" tooltip: ' + instances[0].status().state + '. Not showing titlescreen tooltip', $el);
                            return;
                        }

                        instances[0].disable();

                        $mediawrapper.addClass('titlescreenloaded'); //set the flag for the tooltip to allowed to be open and no more attempts to get it
                        instance.open(); //calling open will refire this very functionBefore, which is why we added a class detection
                        $mediawrapper.removeClass('titlescreenloaded'); //after openning remove flag to try again on the next tooltip show (it would be pulled from cache, or will try again over the network)

                        //change speed of this tooltip now since the titlescreen image is cached and we wont need to show the loader
                        instance.option ('delay', [1000, 100]);
                        
                        //only consider video if a title screen was loaded
                        if (success) {

                            var checkTooltipState = function() {  
                                _Logging.Console('ces.tooltips', 'checking state of tooltip: ' + instance.status().state);
                                if (instance.status().state === 'disappearing' || instance.status().state === 'closed')
                                    return false;
                                return true;
                            };

                            if (checkTooltipState())
                            {
                                //callback when video loaded
                                _Media.Video($mediawrapper, 'sq', gameKey, function($video, videoLoadTime) {
                                    
                                    //hold the titlescreen for a minimum of a second before playing video
                                    var delay = (1000 - videoLoadTime) > 0 ? 1000 - videoLoadTime : 0;

                                    setTimeout(function() {
                                        if (checkTooltipState()) {
                                            $mediawrapper.empty().append($video).fadeIn(500);
                                            $video.get(0).play(); //function of dom element
                                        }
                                    }, delay);
                                
                                }, null, $img.height()); //optional params
                            }
                            
                            // setTimeout(function() {

                            //     var checkTooltipState = function() {  
                            //         _Logging.Console('ces.tooltips', 'checking state of tooltip: ' + instance.status().state);
                            //         if (instance.status().state === 'disappearing' || instance.status().state === 'closed')
                            //         return false;
                            //         return true;
                            //     };

                            //     //ensure the tooltip isnt closed or closing
                            //     if (checkTooltipState())
                            //     {
                            //         //callsback when video loaded
                            //         _Media.Video($mediawrapper, 'sq', gameKey, function($video) {
                                        

                            //             if (checkTooltipState()) {
                            //                 $mediawrapper.empty().append($video).fadeIn(500);
                            //                 $video.play();
                            //             }
                                    
                            //         }, null, $img.height()); //optional params
                            //     }
                            // }, 1000);
                        }
                    });

                    return false; //prevent from openning before getting art
                }
            }
        });
    };

    this.Close = function($el) {

        if ($el.hasClass(alreadyProcessedName)) {
            $el.tooltipster('close');
        }
    };

    this.Destroy = function($el) {
        $el.find(alreadyProcessedSelector).tooltipster('destroy');
        $el.tooltipster('destroy');
    };
    
    //constructor
    var Constructor = (function() {
    })();

    return this;
});