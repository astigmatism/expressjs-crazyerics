/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(_config, tooltipSelector, tooltipContentSelector) {
    
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

                //attempt to obtain a titlescreen

                //var $loading = $('<img src="' + _config.paths.images + '/' + _loadingIcon + '" />');
                //$imagewrapper.append($loading);

                $.ajax({
                    url: _config.paths.titlescreens,
                    type: 'GET',
                    crossDomain: true,
                    data: { gk: gameKey.gk },
                    cache: false,
                    complete: function(response) {
                        
                        $imagewrapper.addClass('titlescreenloaded'); //set the flag for the tooltip to allowed to be open (whether it was returned or not)
                    
                        //in the case of an error, response comes back empty
                        if (response.responseJSON) {
                            
                            var $img = $('<img width="' + _TITLESCREENWIDTH + '" src="data:image/jpg;base64,' + response.responseJSON + '" />');

                            $imagewrapper.imagesLoaded()
                            .done(function() {
                                instance.open(); //when the title screen has loaded, try again, the flag will be set to allow the tooltip to show
                            });

                            $imagewrapper.empty().append($img);
                        }
                        else {
                            instance.open();
                        }
                    }
                });

                //on the initial open, unless the title screen has returned from the cdn, cancel this request to show the tooltip
                if (!$imagewrapper.hasClass('titlescreenloaded')) {
                    return false;
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