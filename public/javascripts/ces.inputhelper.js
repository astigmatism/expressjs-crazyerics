
var cesInputHelper = (function() {

    //private members
    var self = this;
    var _keypresslocked = false; //if we are simulating a keypress (down and up) this boolean prevents another keypress until the current one is complete
    var _emulatorKeydownHandler = null;
    var _handlers = {};


    var _operationMap {
        'statesave': 'num1'
    };

    var _commandToKeycode { 'backspace':8,'right':39,'up':38,'down':40,'enter':13,'kp_enter':-1,'tab':9,'insert':45,'del':46,'end':35,'home':36,'rshift':-1,'shift':16,'ctrl':17,'alt':18,'space':32,'escape':27,'add':107,'subtract':109,'kp_plus':-1,'kp_minus':-1,'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'num0':48,'num1':49,'num2':50,'num3':51,'num4':52,'num5':53,'num6':54,'num7':55,'num8':56,'num9':57,'pageup':33,'pagedown':34,'keypad0':96,'keypad1':97,'keypad2':98,'keypad3':99,'keypad4':100,'keypad5':101,'keypad6':102,'keypad7':103,'keypad8':104,'keypad9':105,'period':190,'capslock':20,'numlock':144,'multiply':106,'divide':111,'print_screen':44,'scroll_lock':145,'tilde':192,'backquote':192,'pause':19,'quote':222,'comma':188,'minus':189,'slash':191,'semicolon':186,'equals':187,'leftbracket':219,'rightbracket':221,'backslash':220,'kp_period':190,'kp_equals':187,'rctrl':17,'ralt':18};
    var _keycodeToCommand = {};

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
    
    for (command in _commandToKeycode) {
        _keycodeToCommand[_commandToKeycode[command]] = command;
    }


    this.InterceptEmulatorKeydownHandler = function(eventHandler) {
        
        //if already intercepted, return modified handler
        if (_emulatorKeydownHandler) {
            return _emulatorKeydownHandler;
        }

        _emulatorKeydownHandler = eventHandler.handlerFunc;
                    
        eventHandler.handlerFunc = function(event) {

            //sometimes I want to influence behaviors before I begin
            OnBeforeEmulatorKeydown(event, function(proceed) {

                //perform original handler function
                if (proceed) {
                    _emulatorKeydownHandler.keydownHandler(event);
                }
            });
        };

        return eventHandler;
    };

    this.RegisterHandlerOnKeydown = function(operation, handler) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }

        var command = _operationMap[operation];
        var keycode = _commandToKeycode[command];

        _handlers[keycode] - handler;
    };

    var OnBeforeEmulatorKeydown = function(event, proceedToEmulatorCallback) {

        
        
        proceedToEmulatorCallback(true);
    }

    /**
     * simulator keypress on emulator. used to allow interaction of dom elements
     * @param  {number} key ascii key code
     * @param {number} keyUpDelay the time delay (in ms) the key will be in the down position before lift
     * @return {undef}
     */
    var SimulateEmulatorKeypress = function(key, keyUpDelay, callback) {

        var keyUpDelay = keyUpDelay || 10;

        //bail if in operation
        if (_keypresslocked) {
            return;
        }

        /**
         * [kp description]
         * @param  {number} k
         * @param  {Object} event
         * @return {undefined}
         */
        kp = function(k, event) {
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
                oEvent.initKeyboardEvent(event, true, true, document.defaultView, false, false, false, false, k, k);
            } else {
                oEvent.initKeyEvent(event, true, true, document.defaultView, false, false, false, false, k, 0);
            }

            oEvent.keyCodeVal = k;

            if (oEvent.keyCode !== k) {
                alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
            }

            document.dispatchEvent(oEvent);
            $(_ui.canvas).focus();
        };

        _keypresslocked = true;
        kp(key, 'keydown');

        setTimeout(function() {

            kp(key, 'keyup');
            _keypresslocked = false;
            if (callback) {
                callback();
            }

        }, keyUpDelay);

        $(_ui.canvas).focus();
        
    };

    //public members
    return this;
});