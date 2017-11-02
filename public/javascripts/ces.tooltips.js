/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(config, tooltipSelector, tooltipContentSelector) {
    
    //private members
    var self = this;
    const alreadyProcessedSelector = '.tooltipstered';

    this.Any = function() {

        $(tooltipSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100
        });
    };

    this.AnyContent = function(opt_interactive) {

        $(tooltipContentSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100,
            interactive: opt_interactive || false,
            contactAsHTML: true
        });
    }

    this.Destory = function($element) {
        $element.find(alreadyProcessedSelector).tooltipster('destroy');
    }

    //constructor
    var Constructor = (function() {
    })();

    return this;
});