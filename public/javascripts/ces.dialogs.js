/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesDialogs = (function($wrapper) {

    //private members
    var self = this;
    var _currentDialog = null;
    var _cssTranstionTime = 200;    //magic number. see #dialogs definition in css
    var _transitionQueue = [];
    var _inTransition = false;
    // var dialogOperational = false;
    // var currentOpenDialog = null;
    // var maxHeight = 600;
    // var defaultHeightChangeDuration = 600;
    // var defaultHeightChangeEasing = 'easeInOutSine'; // see more http://easings.net/#
    // var cssTransition = 200; //see css file for .dialog transition:

    var registry = {};

    //public members

    //public methods

    this.Register = function(name, $el, args) {

        if (!window.hasOwnProperty('cesDialogs' + name)) {
            return;
        }
        var module = new window['cesDialogs' + name]($el, args);
        $el.addClass('dialog hide close');

        registry[name] = {
            'element': $el,
            'module': module
        }
    };

    this.Open = function(name) {

        if (!registry.hasOwnProperty(name)) {
            return;
        }
        _transitionQueue.push({
            'action': 'open',
            'dialog': registry[name]
        });
        ProcessQueue();
    };

    this.Close = function(name) {
        if (!registry.hasOwnProperty(name)) {
            return;
        }
        _transitionQueue.push({
            'action': 'close',
            'dialog': registry[name]
        });
        ProcessQueue();
    }

    //process the next action in the queue
    var ProcessQueue = function() {
        if (_inTransition) {
            return; //we will all process queue again when the current transition in complete
        }
        if (_transitionQueue.length > 0) {

            _inTransition = true;
            var item = _transitionQueue.shift();
            Transition(item.action, item.dialog);
        }
    };

    var Transition = function(action, dialog) {
        
        switch(action) {
            case 'open':

                //if openning current dialog, don't care, go to next
                if (_currentDialog === name) {
                    break;
                }

                dialog.element.removeClass('close');

                break;
            case 'close':

                //only allow closing the currently open dialog
                if (name !== _currentDialog) {
                    break;
                }

                break;
        }
        
        _inTransition = false;
        ProcessQueue();
    };

    var Constructor = function() {

    }();
    
    // this.AddDialog = function(name, element) {
    //     $(element).addClass('close');
    //     ui[name] = element;
    // };

    // this.ShowDialog = function(name, height, callback) {

    //     height = parseInt(height || maxHeight, 10);

    //     if (dialogOperational) {
    //         if (callback) {
    //             callback();
    //         }
    //         return;
    //     }

    //     dialogOperational = true;

    //     //if currently open dialog
    //     this.CloseDialog(false, function() {

    //         currentOpenDialog = name;

    //         self.SetHeight(height, function() {

    //             $(ui[name]).removeClass('hide');
    //             setTimeout(function() {

    //                 $(ui[name]).removeClass('close');

    //                 dialogOperational = false;

    //                 if (callback) {
    //                     callback();
    //                 }

    //             }, cssTransition);
    //         });
    //     });
    // };

    // this.CloseDialog = function(alsoCloseWrapper, callback) {

    //     alsoCloseWrapper = alsoCloseWrapper || false;

    //     if (currentOpenDialog) {

    //         $(ui[currentOpenDialog]).addClass('close');

    //         setTimeout(function() {

    //             $(ui[currentOpenDialog]).addClass('hide');

    //             //if we also collapse the wrapper, do so
    //             if (alsoCloseWrapper) {
    //                 self.SetHeight(0, callback);
    //             } else {
                    
    //                 if (callback) {
    //                     callback();
    //                 }
    //             }

    //         }, cssTransition);
    //     } else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    // };

    // this.SetHeight = function(height, callback, duration, easing) {

    //     height = parseInt(height || maxHeight, 10);
    //     duration = duration || defaultHeightChangeDuration;

    //     //if the height is already in the set position, no need to animate, callback
    //     if ($(wrapper).height() == height) {
    //         if (callback) {
    //             callback();
    //         }
    //         return;
    //     }

    //     $(wrapper).animate({
    //         'height': height + 'px'
    //     }, duration, defaultHeightChangeEasing, callback);
    // };

    return this;

});