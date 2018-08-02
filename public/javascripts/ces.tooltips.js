/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(_config, _Images, tooltipSelector, tooltipContentSelector) {
    
    //private members
    var self = this;
    var alreadyProcessedName = 'tooltipstered';
    var alreadyProcessedSelector = '.' + alreadyProcessedName;
    var _TITLESCREENWIDTH = 160;

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

    this.SingleHTMLWithTitleScreen = function($el, $content, $imagewrapper, gameKey, opt_interactive) {

        opt_interactive = opt_interactive == undefined ? true : opt_interactive;

        if ($el.hasClass(alreadyProcessedName)) {
            $el.tooltipster('destroy'); //remove any previus def
        }
        
        $el.tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: [1200, 200],
            animationDuration: [200, 300],
            interactive: opt_interactive,
            contentAsHTML: true,
            content: $content,
            functionBefore: function(instance, helper) {

                //on the initial open, we won't have loaded the image from the cdn yet and the tooltip will appear without it
                if (!$imagewrapper.hasClass('titlescreenloaded')) {

                    //obtain the image
                    _Images.TitleScreen($imagewrapper, gameKey, function(success, response) {
                        
                        $imagewrapper.addClass('titlescreenloaded'); //set the flag for the tooltip to allowed to be open and no more attempts to get it
                        instance.open(); //calling open will refire the functionBefore

                        //after openning remove flag to try again on the next tooltip show (it would be pulled from cache, or will try again over the network)
                        $imagewrapper.removeClass('titlescreenloaded');
    
                    }, _TITLESCREENWIDTH);

                    return false; //prevent from openning before getting art
                }
            }
        });
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