/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesDialogs = (function(wrapper, ui) {

    //private members
    var self = this;
    var dialogOperational = false;
    var currentOpenDialog = null;
    var maxHeight = 600;
    var defaultHeightChangeDuration = 600;
    var defaultHeightChangeEasing = 'easeInOutSine'; // see more http://easings.net/#
    var cssTransition = 200; //see css file for .dialog transition:

    var Constructor = function() {

        //to all the dialog, add close (for animating in and out)
        for (dialog in ui) {
            $(ui[dialog]).addClass('dialog hide close').append();
        }
    }();

    //public members

    //public methods
    
    this.AddDialog = function(name, element) {
        $(element).addClass('close');
        ui[name] = element;
    };

    this.ShowDialog = function(name, height, callback) {

        height = parseInt(height || maxHeight, 10);

        if (dialogOperational) {
            if (callback) {
                callback();
            }
            return;
        }

        dialogOperational = true;

        //if currently open dialog
        this.CloseDialog(false, function() {

            currentOpenDialog = name;

            self.SetHeight(height, function() {

                $(ui[name]).removeClass('hide');
                setTimeout(function() {

                    $(ui[name]).removeClass('close');

                    dialogOperational = false;

                    if (callback) {
                        callback();
                    }

                }, cssTransition);
            });
        });
    }

    this.CloseDialog = function(alsoCloseWrapper, callback) {

        alsoCloseWrapper = alsoCloseWrapper || false;

        if (currentOpenDialog) {

            $(ui[currentOpenDialog]).addClass('close');

            setTimeout(function() {

                $(ui[currentOpenDialog]).addClass('hide');

                //if we also collapse the wrapper, do so
                if (alsoCloseWrapper) {
                    self.SetHeight(0, callback);
                } else {
                    
                    if (callback) {
                        callback();
                    }
                }

            }, cssTransition);
        } else {
            if (callback) {
                callback();
            }
        }
    };

    this.SetHeight = function(height, callback, duration, easing) {

        height = parseInt(height || maxHeight, 10);
        duration = duration || defaultHeightChangeDuration;

        //if the height is already in the set position, no need to animate, callback
        if ($(wrapper).height() == height) {
            if (callback) {
                callback();
            }
            return;
        }

        $(wrapper).animate({
            'height': height + 'px'
        }, duration, defaultHeightChangeEasing, callback);
    }

    return this;

});