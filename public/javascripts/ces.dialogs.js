/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesDialogs = (function(_config, $wrapper) {

    //private members
    var self = this;
    var _currentDialog = null;
    var _cssTranstionTime = 200;    //magic number. see #dialogs definition in css
    var _transitionQueue = [];
    var _inTransition = false;
    // var dialogOperational = false;
    // var currentOpenDialog = null;
    var _maxDialogHeight = 600;
    var defaultHeightChangeDuration = 600;
    var defaultHeightChangeEasing = 'easeInOutSine'; // see more http://easings.net/#
    // var cssTransition = 200; //see css file for .dialog transition:

    var registry = {};

    //public members

    //public methods

    this.Register = function(name, height, args) {

        if (!window.hasOwnProperty('cesDialogs' + name)) {
            return;
        }
        
        var $el = $('#dialogs').find('.' + name);
        var module = new window['cesDialogs' + name](_config, $el, $wrapper, args);
        
        $el.addClass('dialog hide close');

        registry[name] = {
            'element': $el,
            'module': module,
            'height': height
        }
    };

    this.Open = function(name, args, closeOnCallback, callback) {

        if (!registry.hasOwnProperty(name)) {
            return;
        }

        var addOpen = function() {
            _transitionQueue.push({
                'name': name,
                'action': 'open',
                'dialog': registry[name],
                'args': args,
                'closeOnCallback': closeOnCallback,
                'callback': callback
            });

            ProcessQueue();
        }

        //if dialog is already open, lets setup to close it first
        if (_currentDialog) {
            PriorityClose(function() {
                addOpen();
            });

            ProcessQueue();
        }
        else {
            addOpen();
        }
    };

    this.Close = function(callback) {

        if (!registry.hasOwnProperty(_currentDialog)) {
            if (callback) {
                callback();
            }
            return;
        }
        _transitionQueue.push({
            'name': _currentDialog,
            'action': 'close',
            'dialog': registry[_currentDialog],
            'callback': callback
        });
        ProcessQueue();
    }

    var PriorityClose = function(callback) {

        _transitionQueue.unshift({
            'name': _currentDialog,
            'action': 'close',
            'dialog': registry[_currentDialog],
            'callback': callback
        });
        ProcessQueue();
    };

    //process the next action in the queue
    var ProcessQueue = function() {
        if (_inTransition) {
            return; //we will all process queue again when the current transition in complete
        }
        if (_transitionQueue.length > 0) {

            _inTransition = true;
            var item = _transitionQueue.shift();
            Transition(item);
        }
    };

    var Transition = function(item) {

console.log('transition', item);

        var action = item.action;
        var name = item.name;
        var dialog = item.dialog;
        var callback = item.callback;

        //at the end of each case, be sure to call
        var onTransitionComplete = function() {
            _inTransition = false;
            ProcessQueue();
        };
        
        switch(action) {
            case 'open':

                var args = item.args;
                var closeOnCallback = item.closeOnCallback;

                //if openning current dialog, don't care, go to next
                if (_currentDialog === name) {
                    break;
                }
                _currentDialog = name;

                dialog.element.removeClass('hide');

                dialog.module.OnOpen(args, function(result) {

                    //close dialog when player makes selection
                    if (closeOnCallback && callback) {

                        //wait for close dialog before returning selection
                        PriorityClose(function() {
                            return ($.isArray(result)) ? callback.apply(null, result) : callback(result);
                        });
                    }
                    else if (callback) {
                        return ($.isArray(result)) ? callback.apply(null, result) : callback(result);
                    }
                });

                //animate to ideal height
                self.SetHeight(dialog.height, function() {

                    dialog.element.removeClass('close');
                    onTransitionComplete();
                });
                break;
            case 'close':

                dialog.element.addClass('close');

                //wait for css animation
                setTimeout(function() {

                    dialog.module.OnClose(function(result) {

                        dialog.element.addClass('hide');

                        _currentDialog = null;
                        onTransitionComplete(); 

                        //callback could be optional for close
                        if (callback) {
                            callback(result);
                        }
                    });

                }, _cssTranstionTime);
                break;
        }
    };

    this.SetHeight = function(height, callback, duration, easing) {

        //duration and easing optional
        duration = duration || defaultHeightChangeDuration;
        easing = easing || defaultHeightChangeEasing;

        $wrapper.animate({
            height: height + 'px'
        }, duration, easing, function() {
            if (callback) {
                callback();
            }
        });
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