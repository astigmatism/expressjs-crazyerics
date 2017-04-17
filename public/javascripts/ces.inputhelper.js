
var cesInputHelper = (function(_ui) {

    //private members
    var self = this;
    var _keypresslocked = false; //if we are simulating a keypress (down and up) this boolean prevents another keypress until the current one is complete
    
    var _originalEmulatorKeydownHandlerFunctions = {}; //the separated original work functions attached to the keydown handlers
    var _modifiedEmulatorKeydownHandlers = {};
    
    var _originalEmulatorKeyupHandlerFunctions = {}; //the separated original work functions attached to the keyup handlers
    var _modifiedEmulatorKeyupHandlers = {};

    var _operationHandlers = {}; // { keycode: function}

    var _operationMap = {
        'statesave': 49,    //1
        'loadstate': 52,        //4
        'mute': 77,             //m
        'screenshot': 84        //t
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
                    
        eventHandler.handlerFunc = function(event) {

            //sometimes I want to influence behaviors before I begin
            OnBeforeEmulatorKeydown(event, function(proceed) {

                //perform original handler function
                if (proceed) {
                    _originalEmulatorKeydownHandlerFunctions[target](event);
                }
            });
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
        _modifiedEmulatorKeyupHandlers = eventHandler;

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

    this.Keypress = function(operation, callback) {

        if (!_operationMap.hasOwnProperty(operation) || _keypresslocked || $.isEmptyObject(_originalEmulatorKeydownHandlerFunctions)) {
            return;
        }
        var keycode = _operationMap[operation];
        SimulateEmulatorKeypress(keycode, callback);
    };

    this.PreventBrowserKeys = function(prevent) {

        if (prevent) {

            //common listener definition
            var keyboardListener = function (e) {
                if (_keysWhichHaveFunctionalityInTheBrowserWeWantToPrevent[e.which]) {
                    e.preventDefault();
                }
            }

            $(window).on('keydown', keyboardListener); //using jQuerys on and off here worked :P

        } else {
            $(window).off('keydown');
        }
    }

    var OnBeforeEmulatorKeydown = function(event, proceedToEmulatorCallback) {

        var keycode = event.keyCode;

        if (keycode in _operationHandlers) {
            _operationHandlers[keycode](event, function(result) {
                proceedToEmulatorCallback(result);
            });
            return;
        }

        proceedToEmulatorCallback(true);
    }

    /**
     * simulator keypress on emulator. used to allow interaction of dom elements
     * @param  {number} key ascii key code
     * @param {number} keyUpDelay the time delay (in ms) the key will be in the down position before lift
     * @return {undef}
     */
    var SimulateEmulatorKeypress = function(keycode, callback, keyUpDelay) {

        var keyUpDelay = keyUpDelay || 10;

        
        var keydownHandler = _originalEmulatorKeydownHandlerFunctions[Object.keys(_originalEmulatorKeydownHandlerFunctions)[0]]; //take first handler, doesn't matter which really
        var keyupHandler = _originalEmulatorKeyupHandlerFunctions[Object.keys(_originalEmulatorKeyupHandlerFunctions)[0]]; //take first handler, doesn't matter which really
        var keydown = GenerateEvent(keycode, 'keydown');
        var keyup = GenerateEvent(keycode, 'keyup');

        setTimeout(function() {
            keyupHandler(keyup);
            
            if (callback) {
                callback();
            }
        }, keyUpDelay);
        keydownHandler(keydown);
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