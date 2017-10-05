/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(config, tooltipSelector) {
    
    //private members
    var self = this;
    const alreadyProcessedSelector = '.tooltipstered';

    this.Apply = function() {

        $(tooltipSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100
        });
    };

    //constructor
    var Constructor = (function() {
    })();

    return this;
});