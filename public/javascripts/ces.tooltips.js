/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(config, tooltipSelector, tooltipContentSelector) {
    
    //private members
    var self = this;
    var alreadyProcessedName = 'tooltipstered';

    this.Any = function() {

        //convert name to selector by adding .
        $(tooltipSelector + ':not(.' + alreadyProcessedName + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 500
        });
    };

    this.SingleHTML = function($el, $content, opt_interactive) {

        if (!$el.hasClass(alreadyProcessedName)) {
            $el.tooltipster({
                theme: 'tooltipster-shadow',
                animation: 'grow',
                delay: 500,
                interactive: opt_interactive || false, //allows users to interact with tooltip
                contentAsHTML: true
            });
        }
        $el.tooltipster('content', $content);
    };

    this.Destory = function($element) {
        $element.find(alreadyProcessedSelector).tooltipster('destroy');
    };

    //constructor
    var Constructor = (function() {
    })();

    return this;
});