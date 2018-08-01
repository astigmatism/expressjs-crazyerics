/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(config, tooltipSelector, tooltipContentSelector) {
    
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

    this.SingleHTML = function($el, $content, opt_interactive) {

        opt_interactive = opt_interactive == undefined ? true : opt_interactive;

        if (!$el.hasClass(alreadyProcessedName)) {
            $el.tooltipster({
                theme: 'tooltipster-shadow',
                animation: 'grow',
                delay: [1200, 200],
                interactive: opt_interactive,
                contentAsHTML: true
            });
        }
        $el.tooltipster('content', $content);
    };

    this.Destroy = function($el) {
        $el.find(alreadyProcessedSelector).tooltipster('destroy');
        $el.tooltipster('destroy');
    };

    this.TooltipTitleScreen = function(gameKey) {

        var $titlescreen = $('<img width="' + _TITLESCREENWIDTH + '" />');
        
        var titlescreenPath = config.paths.titlescreens + '/' + gameKey.system + '/' + encodeURIComponent(encodeURIComponent(gameKey.gk)) + '/0.jpg';
        var userContributedTitlescreenPath = config.paths.contributions + '/titlescreens/' + gameKey.system + '/' + encodeURIComponent(encodeURIComponent(gameKey.gk)) + '/0.jpg';

        $titlescreen.hide();
        $titlescreen.imagesLoaded()
            .done(function() {
                $titlescreen.show(); //remove close on parent to reveal image
            })
            .fail(function() {
                
                //attempt to load a user contributed image
                $titlescreen.imagesLoaded()
                .done(function() {
                    $titlescreen.show(); //remove close on parent to reveal image
                });
                $titlescreen.attr('src', userContributedTitlescreenPath); //other url
            });
        
        $titlescreen.attr('src', titlescreenPath);

        return $titlescreen;
    }

    //constructor
    var Constructor = (function() {
    })();

    return this;
});