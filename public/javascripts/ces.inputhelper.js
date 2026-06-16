
var cesInputHelper = (function(_Emulator, _Preferences, _Gamepad, _ui, _Logging) {

    //private members
    var self = this;
    var _keypresslocked = false; //if we are simulating a keypress (down and up) this boolean prevents another keypress until the current one is complete
    var _disposed = false;
    
    var _originalEmulatorKeydownHandlerFunctions = {}; //the separated original work functions attached to the keydown handlers
    var _modifiedEmulatorKeydownHandlers = {};
    
    var _originalEmulatorKeyupHandlerFunctions = {}; //the separated original work functions attached to the keyup handlers
    var _modifiedEmulatorKeyupHandlers = {};

    var _keydownOperationHandlers = {}; // { keycode: function}
    var _keyupOperationHandlers = {};
    var _keyUpDelay = 200; //the 1.6.7 emulator was happy with this value. make it no less
    var _simulatedKeyupTimeouts = [];
    var _keyboardListener = null;
    var _activeEmulatorKeyCodes = {};

    //auto save
    var _idleKeyTimeout = null;
    var _idleKeyDuration = 10000; //the amount of time to required to be idle to fire the OnIdleKeys functionality when checked
    var _lastInputKeyCode = null;
    var _disableAutoSave = true; //i'd like to disable this for now to explore auto-saving only when paused (11-10-2020)

    var _operationMap = {
        'statesave': 49,        //1
        'loadstate': 52,        //4
        'mute': 77,             //m
        'screenshot': 84,       //t
        'pause': 80,            //p
        'reverse': 82,          //r
        'slowmotion': 69,       //e
        'fastforward': 32,      //space
        'reset': 72,            //h
        'exit': 27              //esc  
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

        if (_disposed) {
            return eventHandler;
        }
        
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

            if (_disposed) {
                return false;
            }

            //sometimes I want to influence behaviors of keystokes before the emulator
            OnBeforeEmulatorKeydown(event, function(proceed) {

                if (_disposed) {
                    return;
                }

                //perform original handler function
                if (proceed) {

                    try {
                        _originalEmulatorKeydownHandlerFunctions[target](event);
                    } catch (e) {
                        console.log('Emulator throw an error on keydown event: ' + event, e);
                    }
                }
            }, args);
        };

        _modifiedEmulatorKeydownHandlers[target] = eventHandler;

        return eventHandler;
    };

    this.DisableAutoSave = function(disable) {

        self.CancelIdleTimeout();
        _disableAutoSave = disable;
    };

    this.SetIdleTimeoutDuration = function(duration) {
        _idleKeyDuration = duration;
    };

    this.CancelIdleTimeout = function() {

        if (_idleKeyTimeout) {
            clearTimeout(_idleKeyTimeout);
            _idleKeyTimeout = null;
        }
    };

    this.Dispose = function() {

        if (_disposed) {
            return;
        }

        _disposed = true;

        self.CancelIdleTimeout();
        RemoveKeyboardListener();
        ClearSimulatedKeyupTimeouts();

        _keydownOperationHandlers = {};
        _keyupOperationHandlers = {};
        _originalEmulatorKeydownHandlerFunctions = {};
        _modifiedEmulatorKeydownHandlers = {};
        _originalEmulatorKeyupHandlerFunctions = {};
        _modifiedEmulatorKeyupHandlers = {};
        _activeEmulatorKeyCodes = {};

        _Logging.Console('cesInputHelper', 'Disposed input helper handlers');
    };

    this.IsDisposed = function() {

        return _disposed;
    };

    this.OverrideEmulatorKeyupHandler = function(eventHandler) {

        if (_disposed) {
            return eventHandler;
        }

        if (!eventHandler.hasOwnProperty('target')) {
            return eventHandler;
        }

        var target = eventHandler.target;

        //if already intercepted, return handler
        if (target in _modifiedEmulatorKeyupHandlers) {
            return _modifiedEmulatorKeyupHandlers[target];
        }

        _originalEmulatorKeyupHandlerFunctions[target] = eventHandler.handlerFunc;

        eventHandler.handlerFunc = function(event, args) {

            if (_disposed) {
                return false;
            }

            //sometimes I want to influence behaviors of keyups before the emulator
            OnBeforeEmulatorKeyup(event, function(proceed) {

                if (_disposed) {
                    return;
                }

                //perform original handler function
                if (proceed) {
                    _originalEmulatorKeyupHandlerFunctions[target](event);
                }
            }, args);
        };

        //although no modifications to the handler were performed
        _modifiedEmulatorKeyupHandlers[target] = eventHandler;

        return eventHandler;
    };

    this.RegisterKeydownOperationHandler = function(operation, handler) {

        if (_disposed) {
            return;
        }

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }

        var keycode = _operationMap[operation];
        _keydownOperationHandlers[keycode] = handler;
    };

    this.RegisterKeyupOperationHandler = function(operation, handler) {

        if (_disposed) {
            return;
        }

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }

        var keycode = _operationMap[operation];
        _keyupOperationHandlers[keycode] = handler;
    };

    this.UnregisterKeydownHandler = function(operation) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }
        var keycode = _operationMap[operation];
        delete _keydownOperationHandlers[keycode];
    };

    this.UnregisterKeyupHandler = function(operation) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }
        var keycode = _operationMap[operation];
        delete _keyupOperationHandlers[keycode];
    };

    this.Keypress = function(operation, callback, args) {

        if (_disposed) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for ' + operation + ': input helper is disposed');
            if (callback) {
                callback('input helper disposed');
            }
            return false;
        }

        if (!_operationMap.hasOwnProperty(operation)) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for unknown operation: ' + operation);
            if (callback) {
                callback('unknown operation');
            }
            return false;
        }

        if (_keypresslocked) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for ' + operation + ': keypress helper is locked');
            if (callback) {
                callback('keypress locked');
            }
            return false;
        }

        if ($.isEmptyObject(_originalEmulatorKeydownHandlerFunctions)) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for ' + operation + ': emulator keydown handlers are not available yet');
            if (callback) {
                callback('emulator keydown handlers unavailable');
            }
            return false;
        }

        var keycode = _operationMap[operation];
        _Logging.Console('cesInputHelper', 'Simulating keypress for ' + operation);

        return SimulateEmulatorKeypress(keycode, callback, args);
    };

    this.ReleaseActiveEmulatorKeys = function(reason) {
        return ReleaseActiveEmulatorKeys(reason || 'release active emulator keys');
    };

    this.GiveEmulatorControlOfInput = function(giveInput) {

        if (_disposed) {
            if (!giveInput) {
                self.CancelIdleTimeout();
                RemoveKeyboardListener();
            }
            return;
        }

        if (giveInput) {

            AddKeyboardListener();

        } else {
            
            self.CancelIdleTimeout(); //in case its running
            ReleaseActiveEmulatorKeys('emulator input revoked');
            RemoveKeyboardListener();
        }
    };

    var AddKeyboardListener = function() {

        RemoveKeyboardListener();

        //common listener definition
        _keyboardListener = function (e) {
            if (_keysWhichHaveFunctionalityInTheBrowserWeWantToPrevent[e.which]) {
                e.preventDefault();
            }
        };
        $(window).on('keydown.cesInputHelper', _keyboardListener); //using jQuerys on and off here worked :P
    };

    var RemoveKeyboardListener = function() {

        if (_keyboardListener) {
            $(window).off('keydown.cesInputHelper', _keyboardListener);
            $(window).off('keydown', _keyboardListener);
            _keyboardListener = null;
            return;
        }

        $(window).off('keydown.cesInputHelper');
    };

    /**
     * This is the function we override the emulator handler with. Its resulting callback will pass a boolean to indictae if the original functionality should proceed
     * to the emulator.
     * @param {Object} event                        Event object
     * @param {Function} proceedToEmulatorCallback  The callback function which with the boolean passed with it, determines if the emulator should handle the input
     * @param {Array} args                          This parameter is sourced from the Keypress function. If we simulate a keypress, we can pass args here that will show up in the handler for this operation.
     */
    var OnBeforeEmulatorKeydown = function(event, proceedToEmulatorCallback, args) {

        if (_disposed) {
            proceedToEmulatorCallback(false);
            return;
        }

        var keycode = event.keyCode;

        if (keycode in _keydownOperationHandlers) {
            _keydownOperationHandlers[keycode](event, function(result) {

                if (_disposed) {
                    proceedToEmulatorCallback(false);
                    return;
                }
                
                //a true result will allow the input to each the emulator, false stops it here
                proceedToEmulatorCallback(result);

                //if true, we want to record the input as happened
                if (result) {
                    TrackActiveEmulatorKey(keycode);
                    _lastInputKeyCode = keycode;
                    ResetIdleTimeout();
                }

            }, args);
        }
        //no operation handlers, normal keydown
        else {

            proceedToEmulatorCallback(true);

            TrackActiveEmulatorKey(keycode);
            _lastInputKeyCode = keycode;
            ResetIdleTimeout();
        }
    };

    var ResetIdleTimeout = function() {

        if (_disposed) {
            return;
        }

        //bail early is disabled
        if (_disableAutoSave) {
            return;
        }

        self.CancelIdleTimeout(); //clear the current

        _idleKeyTimeout = setTimeout(function() {

            if (_disposed) {
                return;
            }

            //catch if an operational input was last used
            var operationalKeyUsed = false;
            for (var operation in _operationMap) {
                if (_lastInputKeyCode == _operationMap[operation]) {
                    operationalKeyUsed = true;
                    break;
                }
            }

            if (!operationalKeyUsed && _Emulator && _Emulator.OnInputIdle) {
                _Emulator.OnInputIdle();
            }

        }, _idleKeyDuration);
    };

    var OnBeforeEmulatorKeyup = function(event, proceedToEmulatorCallback, args) {

        if (_disposed) {
            proceedToEmulatorCallback(false);
            return;
        }

        var keycode = event.keyCode;

        if (keycode in _keyupOperationHandlers) {
            _keyupOperationHandlers[keycode](event, function(result) {

                if (_disposed) {
                    proceedToEmulatorCallback(false);
                    return;
                }
                
                //a true result will allow the input to each the emulator, false stops it here
                proceedToEmulatorCallback(result);

                if (result) {
                    UntrackActiveEmulatorKey(keycode);
                }
            }, args);
        }
        //no operation handlers, normal keyup
        else {
            proceedToEmulatorCallback(true);
            UntrackActiveEmulatorKey(keycode);
        }
    };

    var TrackActiveEmulatorKey = function(keycode) {
        keycode = parseInt(keycode, 10);

        if (!keycode || isNaN(keycode)) {
            return;
        }

        _activeEmulatorKeyCodes[keycode] = true;
    };

    var UntrackActiveEmulatorKey = function(keycode) {
        keycode = parseInt(keycode, 10);

        if (!keycode || isNaN(keycode)) {
            return;
        }

        delete _activeEmulatorKeyCodes[keycode];
    };

    var ReleaseActiveEmulatorKeys = function(reason) {
        var keycodes = Object.keys(_activeEmulatorKeyCodes);
        var released = 0;
        var i;

        if (!keycodes.length) {
            return 0;
        }

        for (i = 0; i < keycodes.length; i++) {
            if (DispatchEmulatorKeyup(parseInt(keycodes[i], 10), reason)) {
                released++;
            }

            delete _activeEmulatorKeyCodes[keycodes[i]];
        }

        if (released && _Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('cesInputHelper', 'Released ' + released + ' active emulator key(s)' + (reason ? ': ' + reason : ''));
        }

        return released;
    };

    var DispatchEmulatorKeyup = function(keycode, reason) {
        var handlerKeys = Object.keys(_modifiedEmulatorKeyupHandlers);
        var keyupHandlerRecord;
        var keyupHandler;
        var keyup;

        if (!handlerKeys.length) {
            return false;
        }

        keyupHandlerRecord = _modifiedEmulatorKeyupHandlers[handlerKeys[0]];
        keyupHandler = keyupHandlerRecord && keyupHandlerRecord.handlerFunc;

        if (typeof keyupHandler !== 'function') {
            return false;
        }

        keyup = GenerateEvent(keycode, 'keyup');

        try {
            keyup.cesInputHelperReleasedKey = true;
            keyup.cesInputHelperReleaseReason = reason || 'release active emulator key';
        } catch (e) {}

        keyupHandler(keyup, ['input-helper-release', reason || 'release active emulator key']);
        return true;
    };

    /**
     * Given a keycode, simulate a keypress by generating a keydown and keyup event and pass them through the handlers destined for the emulator (but first pass through here ;)
     * @param {int}   keycode
     * @param {Function} callback   After keyup fires
     * @param {int}   keyUpDelay    Define this for long holds, otherwise leave it and allow the default of 30
     */
    var SimulateEmulatorKeypress = function(keycode, callback, args, keyUpDelay) {

        if (_disposed) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for code ' + keycode + ': input helper is disposed');
            if (callback) {
                callback('input helper disposed');
            }
            return false;
        }

        //we need to have keydown and up handlers cached to simulate keypresses
        if ($.isEmptyObject(_modifiedEmulatorKeydownHandlers) || $.isEmptyObject(_modifiedEmulatorKeyupHandlers)) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for code ' + keycode + ': modified emulator handlers are not available yet');
            if (callback) {
                callback('modified emulator handlers unavailable');
            }
            return false;
        }

        keyUpDelay = keyUpDelay || _keyUpDelay;
        
        var keydownHandlerRecord = _modifiedEmulatorKeydownHandlers[Object.keys(_modifiedEmulatorKeydownHandlers)[0]]; //take first handler, doesn't matter which really, its likely attached to window
        var keyupHandlerRecord = _modifiedEmulatorKeyupHandlers[Object.keys(_modifiedEmulatorKeyupHandlers)[0]]; //take first handler, doesn't matter which really

        if (!keydownHandlerRecord || !keydownHandlerRecord.handlerFunc || !keyupHandlerRecord || !keyupHandlerRecord.handlerFunc) {
            _Logging.Console('cesInputHelper', 'Unable to simulate keypress for code ' + keycode + ': emulator handlers are not usable');
            if (callback) {
                callback('emulator handlers unusable');
            }
            return false;
        }

        var keydownHandler = keydownHandlerRecord.handlerFunc;
        var keyupHandler = keyupHandlerRecord.handlerFunc;
        
        var keydown = GenerateEvent(keycode, 'keydown');
        var keyup = GenerateEvent(keycode, 'keyup');

        var keyupTimeout = setTimeout(function() {

            RemoveSimulatedKeyupTimeout(keyupTimeout);

            if (_disposed) {
                return;
            }

            keyupHandler(keyup, args); //send the keyup event
            _Logging.Console('cesInputHelper', 'keyup for code ' + keycode + ' after ' + keyUpDelay + 'ms');
            
            if (callback) {
                callback();
            }
        }, keyUpDelay);

        _simulatedKeyupTimeouts.push(keyupTimeout);
        keydownHandler(keydown, args); //send the keydown event
        
        _Logging.Console('cesInputHelper', 'keydown with code ' + keycode);
        return true;
    };

    var ClearSimulatedKeyupTimeouts = function() {

        for (var i = 0; i < _simulatedKeyupTimeouts.length; i++) {
            clearTimeout(_simulatedKeyupTimeouts[i]);
        }

        _simulatedKeyupTimeouts = [];
    };

    var RemoveSimulatedKeyupTimeout = function(timeout) {

        for (var i = 0; i < _simulatedKeyupTimeouts.length; i++) {
            if (_simulatedKeyupTimeouts[i] === timeout) {
                _simulatedKeyupTimeouts.splice(i, 1);
                return;
            }
        }
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
    };

    var IsAxisAssignment = function(assignment) {
        return (typeof assignment === 'string' && /^[+-]\d+$/.test(assignment));
    };

    var IsButtonAssignment = function(assignment) {
        return (typeof assignment === 'number' || (typeof assignment === 'string' && (/^\d+$/.test(assignment) || /^h\d+(up|down|left|right)$/i.test(assignment))));
    };

    var GetInputBaseName = function(configName) {
        return String(configName).replace(/_(btn|axis)$/, '');
    };

    var ResolveConfigNameForAssignment = function(configName, assignment, normalizeAssignmentType) {

        if (!normalizeAssignmentType) {
            return configName;
        }

        var inputBaseName = GetInputBaseName(configName);
        if (IsAxisAssignment(assignment)) {
            return inputBaseName + '_axis';
        }

        if (IsButtonAssignment(assignment)) {
            return inputBaseName + '_btn';
        }

        return configName;
    };

    var SerializeInputAssignment = function(assignment, quoteAxisAssignments) {

        if (assignment === '') {
            return '';
        }

        if (!quoteAxisAssignments) {
            return assignment;
        }

        if (typeof assignment === 'number') {
            return assignment;
        }

        if (typeof assignment === 'string' && /^\d+$/.test(assignment)) {
            return assignment;
        }

        return '"' + String(assignment).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    };

    var LogInputConfiguration = function(message, options) {

        var logName = (options && options.logPrefix) ? options.logPrefix : 'cesInputHelper';
        if (_Logging && _Logging.Console) {
            _Logging.Console(logName, message);
            return;
        }

        if (window.console && console.log) {
            console.log('[' + logName + '] ' + message);
        }
    };

    this.BuildInputConfiguration = function(gameKey, options) {

        options = options || {};

        var inputConfig = '';
        var playerIndex = 0;

        var inputProfile = options.inputProfile || 'legacy-sdl2';
        var applyLegacySdl2Conversion = (typeof options.applyLegacySdl2Conversion === 'boolean') ? options.applyLegacySdl2Conversion : (inputProfile !== 'browser-gamepad');
        var includeJoypadIndex = !!options.includeJoypadIndex;
        var normalizeAssignmentType = !!options.normalizeAssignmentType;
        var quoteAxisAssignments = !!options.quoteAxisAssignments;

        //for each game pad, get input, returns array of array of input configurations (like _defaultKeyboardMapping)
        var mappings = _Gamepad.GetConfiguredGamepadInput(gameKey, {
            includeMetadata: true,
            logMissing: true
        });

        LogInputConfiguration('Building controller input config for system=' + gameKey.system + ', mappings=' + mappings.length + ', profile=' + inputProfile + ', includeJoypadIndex=' + includeJoypadIndex + ', normalizeAssignmentType=' + normalizeAssignmentType + ', legacySdl2Conversion=' + applyLegacySdl2Conversion + '. Keyboard bindings remain in the base RetroArch config; appending joypad bindings here.', options);

        for (playerIndex; playerIndex < mappings.length; playerIndex++) {

            var mappingRecord = mappings[playerIndex] || {};
            var mapping = mappingRecord.inputconfig || mappingRecord;
            var joypadIndex = (typeof mappingRecord.index !== 'undefined') ? mappingRecord.index : playerIndex;

            if (includeJoypadIndex) {
                inputConfig += 'input_player' + (playerIndex + 1) + '_joypad_index = ' + joypadIndex + '\n';
                LogInputConfiguration('Mapped player ' + (playerIndex + 1) + ' to browser gamepad index=' + joypadIndex + ', id=' + (mappingRecord.id || '(unknown)'), options);
            }

            for (var configName in mapping) {
                if (!mapping.hasOwnProperty(configName)) {
                    continue;
                }

                var assignment = mapping[configName];

                if (assignment === null || typeof assignment === 'undefined') {
                    LogInputConfiguration('Skipping missing input field for player ' + (playerIndex + 1) + ': ' + configName, options);
                    continue;
                }

                if (assignment === '') {
                    LogInputConfiguration('Writing blank/unassigned input field for player ' + (playerIndex + 1) + ': ' + configName, options);
                }

                var retroArchConfigName = ResolveConfigNameForAssignment(configName, assignment, normalizeAssignmentType);

                //HACK!!!  browser input to sdl2 conversion:
                var sdl2 = {
                    4: 9,
                    10: 7,
                    11: 8,
                    6: '\"+4\"',
                    7: '\"+5\"'
                };

                if (applyLegacySdl2Conversion && sdl2.hasOwnProperty(assignment)) {
                    assignment = sdl2[assignment];
                }

                if (retroArchConfigName !== configName) {
                    LogInputConfiguration('Normalized input_player' + (playerIndex + 1) + '_' + configName + ' to input_player' + (playerIndex + 1) + '_' + retroArchConfigName + ' for assignment=' + assignment, options);
                }

                //we don't save the "input_playerx_" in preferences, so add it here
                inputConfig += 'input_player' + (playerIndex + 1) + '_' + retroArchConfigName + ' = ';
                inputConfig += SerializeInputAssignment(assignment, quoteAxisAssignments) + '\n';
            }
        }

        if (!mappings.length) {
            LogInputConfiguration('No configured gamepad mappings were available; no joypad fields were appended to RetroArch config.', options);
        }

        //ok, gamepads have been added (or not), playerIndex now equals the next available player

        //TODO: allow custom keyboard??

        return inputConfig;
    };

    //public members
    return this;
});