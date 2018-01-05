var cesSliders = (function($silderIcons) {

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

        $silderIcons.children().each(function() {

            var sliderId = $(this).data('slider');

            //if a data reference was found along with the dom element
            if (sliderId && $('#' + sliderId + '-slider')) {

                _sliders[sliderId] = $('#' + sliderId + '-slider');
            }
        });

    })();

    return this;
});