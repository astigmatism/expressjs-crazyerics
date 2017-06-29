
var cesInputHelper = (function(_Emulator, _ui) {

    //private members
    var self = this;
    var _keypresslocked = false; //if we are simulating a keypress (down and up) this boolean prevents another keypress until the current one is complete
    
    var _originalEmulatorKeydownHandlerFunctions = {}; //the separated original work functions attached to the keydown handlers
    var _modifiedEmulatorKeydownHandlers = {};
    
    var _originalEmulatorKeyupHandlerFunctions = {}; //the separated original work functions attached to the keyup handlers
    var _modifiedEmulatorKeyupHandlers = {};

    var _operationHandlers = {}; // { keycode: function}

    var _idleKeyCheckInterval = null;
    var _idleKeyCheckDuration = 5000; //how often to check when the last key was pressed
    var _idleKeyDuration = 5000; //the amount of time to required to be idle to fire the OnIdleKeys functionality
    
    var _lastInputTime = null;
    var _lastInputKeyCode = null;

    var _operationMap = {
        'statesave': 49,        //1
        'loadstate': 52,        //4
        'mute': 77,             //m
        'screenshot': 84,       //t
        'pause': 80,            //p
        'reverse': 82           //r
    };

    var _keysWhichHaveFunctionalityInTheBrowserWeWantToPrevent = {
        9: "tab",
        13: "enter",
        16: "shift",
        18: "alt",
        27: "esc",
        33: "rePag",
        34: "avPag",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12"
    };

    /*
    from retroarchfig:
    #   left, right, up, down, enter, kp_enter, tab, insert, del, end, home,
    #   rshift, shift, ctrl, alt, space, escape, add, subtract, kp_plus, kp_minus,
    #   f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12,
    #   num0, num1, num2, num3, num4, num5, num6, num7, num8, num9, pageup, pagedown,
    #   keypad0, keypad1, keypad2, keypad3, keypad4, keypad5, keypad6, keypad7, keypad8, keypad9,
    #   period, capslock, numlock, backspace, multiply, divide, print_screen, scroll_lock,
    #   tilde, backquote, pause, quote, comma, minus, slash, semicolon, equals, leftbracket,
    #   backslash, rightbracket, kp_period, kp_equals, rctrl, ralt
     */

    this.OverrideEmulatorKeydownHandler = function(eventHandler) {
        
        if (!eventHandler.hasOwnProperty('target')) {
            return eventHandler;
        }

        var target = eventHandler.target;

        //if already intercepted, return modified handler
        if (target in _modifiedEmulatorKeydownHandlers) {
            return _modifiedEmulatorKeydownHandlers[target];
        }

        _originalEmulatorKeydownHandlerFunctions[target] = eventHandler.handlerFunc;
                    
        eventHandler.handlerFunc = function(event, args) {

            //sometimes I want to influence behaviors before I begin
            OnBeforeEmulatorKeydown(event, function(proceed) {

                //perform original handler function
                if (proceed) {
                    _originalEmulatorKeydownHandlerFunctions[target](event);
                }
            }, args);
        };

        _modifiedEmulatorKeydownHandlers[target] = eventHandler;

        return eventHandler;
    };

    this.OverrideEmulatorKeyupHandler = function(eventHandler) {

        if (!eventHandler.hasOwnProperty('target')) {
            return eventHandler;
        }

        var target = eventHandler.target;

        //if already intercepted, return handler
        if (target in _modifiedEmulatorKeyupHandlers) {
            return _modifiedEmulatorKeyupHandlers[target];
        }

        _originalEmulatorKeyupHandlerFunctions[target] = eventHandler.handlerFunc;

        //although no modifications to the handler were performed
        _modifiedEmulatorKeyupHandlers[target] = eventHandler;

        return eventHandler;
    };

    this.RegisterOperationHandler = function(operation, handler) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }

        var keycode = _operationMap[operation];
        _operationHandlers[keycode] = handler;
    };

    this.UnregisterHandler = function(operation) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }
        var keycode = _operationMap[operation];
        delete _operationHandlers[keycode];
    };

    this.Keypress = function(operation, callback, args) {

        if (!_operationMap.hasOwnProperty(operation) || _keypresslocked || $.isEmptyObject(_originalEmulatorKeydownHandlerFunctions)) {
            return;
        }
        var keycode = _operationMap[operation];
        SimulateEmulatorKeypress(keycode, callback, args);
    };

    this.GiveEmulatorControlOfInput = function(giveInput) {

        if (giveInput) {

            //common listener definition
            var keyboardListener = function (e) {
                if (_keysWhichHaveFunctionalityInTheBrowserWeWantToPrevent[e.which]) {
                    e.preventDefault();
                }
            }
            $(window).on('keydown', keyboardListener); //using jQuerys on and off here worked :P

            UpdateIdleKeyInterval(false); //begin idle key interval

        } else {
            
             UpdateIdleKeyInterval(true); //stop interval
            $(window).off('keydown');
        }
    }

    var UpdateIdleKeyInterval = function(terminate) {

        if (terminate) {
            clearInterval(_idleKeyCheckInterval);
            _idleKeyCheckInterval = null;
            return;
        }

        clearInterval(_idleKeyCheckInterval); //just in case, we cant have it running before we start another!
        _idleKeyCheckInterval = null;

        _idleKeyCheckInterval = setInterval(function() {

            if (_lastInputTime && _lastInputKeyCode) {

                var now = new Date();

                //if current time is greater than the last time input was taken plus the minimum amount of waiting for idle
                //also if last keycode is not loadstate or savestate
                if (now.getTime() > (_lastInputTime.getTime() + _idleKeyDuration)) {

                    //with that check out of the way, now a heavier one. We have to invalidate the opertational keys
                    var operationalKeyUsed = false;
                    for (operation in _operationMap) {
                        if (_lastInputKeyCode == _operationMap[operation]) {
                            operationalKeyUsed = true;
                            break;
                        }
                    }

                    if (!operationalKeyUsed) {
                        _Emulator.OnInputIdle();
                    }
                }
            }
        }, _idleKeyCheckDuration);
    };

    /**
     * This is the function we override the emulator handler with. Its resulting callback will pass a boolean to indictae if the original functionality should proceed
     * to the emulator.
     * @param {Object} event                        Event object
     * @param {Function} proceedToEmulatorCallback  The callback function which with the boolean passed with it, determines if the emulator should handle the input
     * @param {Array} args                          This parameter is sourced from the Keypress function. If we simulate a keypress, we can pass args here that will show up in the handler for this operation.
     */
    var OnBeforeEmulatorKeydown = function(event, proceedToEmulatorCallback, args) {

        var keycode = event.keyCode;

        if (keycode in _operationHandlers) {
            _operationHandlers[keycode](event, function(result) {
                proceedToEmulatorCallback(result);
            }, args);
            return;
        }

        proceedToEmulatorCallback(true);

        _lastInputTime = new Date();
        _lastInputKeyCode = keycode;
    }

    /**
     * Given a keycode, simulate a keypress by generating a keydown and keyup event and pass them through the handlers destined for the emulator (but first pass through here ;)
     * @param {int}   keycode
     * @param {Function} callback   After keyup fires
     * @param {int}   keyUpDelay    Define this for long holds, otherwise leave it and allow the default of 10
     */
    var SimulateEmulatorKeypress = function(keycode, callback, args, keyUpDelay) {

        //we need to have keydown and up handlers cached to simulate keypresses
        if ($.isEmptyObject(_modifiedEmulatorKeydownHandlers) || $.isEmptyObject(_modifiedEmulatorKeyupHandlers)) {
            callback();
            return;
        }

        var keyUpDelay = keyUpDelay || 10;

        
        var keydownHandler = _modifiedEmulatorKeydownHandlers[Object.keys(_modifiedEmulatorKeydownHandlers)[0]].handlerFunc; //take first handler, doesn't matter which really, its likely attached to window
        var keyupHandler = _modifiedEmulatorKeyupHandlers[Object.keys(_modifiedEmulatorKeyupHandlers)[0]].handlerFunc; //take first handler, doesn't matter which really
        
        var keydown = GenerateEvent(keycode, 'keydown');
        var keyup = GenerateEvent(keycode, 'keyup');

        setTimeout(function() {
            keyupHandler(keyup, args); //send the keyup event
            
            if (callback) {
                callback();
            }
        }, keyUpDelay);
        keydownHandler(keydown, args); //send the keydown event
    };

    var GenerateEvent = function(keyCode, eventType) {

        var oEvent = document.createEvent('KeyboardEvent');

        // Chromium Hack
        Object.defineProperty(oEvent, 'keyCode', {
            get : function() {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'which', {
            get : function() {
                return this.keyCodeVal;
            }
        });

        if (oEvent.initKeyboardEvent) {
            oEvent.initKeyboardEvent(eventType, true, true, document.defaultView, false, false, false, false, keyCode, keyCode);
        } else {
            oEvent.initKeyEvent(eventType, true, true, document.defaultView, false, false, false, false, keyCode, 0);
        }

        oEvent.keyCodeVal = keyCode;

        if (oEvent.keyCode !== keyCode) {
            //alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
        }

        return oEvent;
    }

    //public members
    return this;
});