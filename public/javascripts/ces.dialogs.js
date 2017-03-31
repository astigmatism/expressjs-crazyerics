/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesDialogs = (function(dialogs) {

    //private members
    var self = this;
    var dialogOperational = false;
    var currentOpenDialog = null;
    var maxHeight = 600;
    var defaultDuration = 500;
    var cssTransition = 200; //see css file for .dialog transition:

    var Constructor = function() {

        //to all the dialogs, add close (for animating in and out)
        for (dialog in dialogs) {
            $(dialogs[dialog]).addClass('dialog hide close');
        }

    }();

    //public members

    //public methods
    
    this.AddDialog = function(name, element) {
        $(element).addClass('close');
        dialogs[name] = element;
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

                $(dialogs[name]).removeClass('hide').removeClass('close');

                dialogOperational = false;

                if (callback) {
                    callback();
                }
            });
        });
    }

    this.CloseDialog = function(alsoCloseWrapper, callback) {

        alsoCloseWrapper = alsoCloseWrapper || false;

        if (currentOpenDialog) {

            $(dialogs[currentOpenDialog]).addClass('close');

            setTimeout(function() {

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
        duration = duration || defaultDuration;

        $('#dialogs').animate({
            'height': height + 'px'
        }, duration, callback);
    }

    return this;

});