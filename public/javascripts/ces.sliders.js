var cesSliders = (function(_config, _Compression, $silderIcons) {

    var _self = this;
    var _sliders = {};

    this.Open = function(name) {

        if (!_sliders.hasOwnProperty(name)) {
            return;
        }
    };

    this.Close = function(name) {
        
        if (!_sliders.hasOwnProperty(name)) {
            return;
        }
    }

    //self execute at end of script for availiblity of everything above
    var Constructor = (function() {

        $silderIcons.children().each(function(index, $li) {

            var sliderId = $(this).data('slider');
            var $panel = $('#' + sliderId + '-slider');

            //if a data reference was found along with the dom element
            if (sliderId && $('#' + sliderId + '-slider')) {

                var module;

                if (window.hasOwnProperty('cesSliders' + sliderId)) {
                    module = new window['cesSliders' + sliderId](_config, $li, $panel, args);
                }

                _sliders[sliderId] = {
                    icon: $li,
                    panel: $panel,
                    module: module
                }


            }
        });

    })();

    return this;
});