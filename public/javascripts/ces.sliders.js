var Sliders = (function() {

    // private members

    var self = this;
    var animating       = false; //old skool way to prevent action while animating
    var animationRate   = 250; //in ms

    //public methods

    /**
     * initialize this object
     * @return {undef}
     */
    this.init = function() {
        this.Bind();
    };

    /**
     * go through list of silder controls and seek the correct one to open. if open, then close.
     * @param  {string} key
     * @return {undef}
     */
    this.Open = function(key, stayopen) {

        if (this._animating) {
            return;
        }


        stayopen = stayopen || false; //if true and open, stay open. if false, will close if open
        this._animating = true;

        $('#gamecontrolslist li').each(function(index, item) {

            var slider = $('#' + $(this).attr('class'));

            //if match found
            if ($(item).hasClass(key)) {

                /**
                 * a quick anon function to toggle the slider intended
                 * @return {undef}
                 */
                var selfToggle = function() {
                    setTimeout(function() {
                        self._toggle(item, slider, function() {
                            self._animating = false;
                        });
                    }, self._animationRate);
                };

                //if closed, open
                if ($(slider).hasClass('closed')) {
                    $(slider).removeClass('closed');
                    selfToggle();
                } else {
                    //already open
                    //should I stay open?
                    if (!stayopen) {
                        $(slider).addClass('closed');
                        selfToggle();
                    } else {
                        //stay open
                        self._animating = false;
                    }
                }
            } else {
                //others in list
                //if does not have class closed, its open, close it. else case is has closed
                if (!$(slider).hasClass('closed')) {
                    $(slider).addClass('closed');
                    self._toggle(item, slider);
                }
            }

        });
    };

    /**
     * closes all sliders by asking to open one that does not exist
     * @return {undef}
     */
    this.Closeall = function() {

        this.Open('');

        //since nothing is opening, we need to turn off the animation flag when all are closed
        setTimeout(function() {
            self._animating = false;
        }, self._animationRate);
    };

    // private methods

    /**
     * toggle simply changes the state of the slider, if open then close, if closed, then open. controled only by this class
     * @param  {Object} li     list dom element, or button
     * @param  {Object} slider div dom element which is the sliding panel
     * @return {undef}
     */
    var Toggle = function(li, slider, callback) {


        callback = callback || null;

        //toggle dom with id of this class name (which is the sliding element)
        $(slider).animate({width: 'toggle', padding: 'toggle'}, self._animationRate, function() {
            if (callback) {
                callback();
            }
        });

        if ($(li).attr('data-click-state') == 0) {
            $(li).attr('data-click-state', 1);
            $(li).find('img').animateRotate(0, 90, self._animationRate);

        } else {
            $(li).attr('data-click-state', 0);
            $(li).find('img').animateRotate(90, 0, self._animationRate);
        }
    };

    /**
     * bind events to dom elements
     * @return {undef}
     */
    var Bind = function() {



        $('#gamecontrolslist li')
        .on('mousedown mouseup click', function(event) {
            event.preventDefault();
            $('#emulator').focus();
        })
        .on('mouseup', function(event) {

            self.open($(this).attr('class'));
        });
    };

});