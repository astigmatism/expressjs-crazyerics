/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @return {undef}
 */
var cesGamePad = (function(_config, _Compression, _PubSub, _Tooltips, _Preferences, _Dialogs, $gamepad0, $gamepad1) {

    // private members
    var self = this;
    var _$gamepads = [$gamepad0, $gamepad1]; //ui placeholders
    var _gamepads = {};
    var _haveEvents = false; //boolean, indicates if browser has gamepad events
    var _captureInputCallback; //when we simply need to capture input for configuration, assign a function here to terminate the loop
    var _gameLoop;
    var _configureScanFrameLimit = 90;
    var _inputCaptureNeutralThreshold = 0.5;
    var _connectionStateTopic = 'gamepadconnectionstatechanged';

    //debug
    var reconfigureEachTime = false; //when true will avoid checking preferences for saved configuration

    //these values are specific to retroarch config

    // public methods

    //determine if controllers need configuration, if so, use dialog
    this.Configure = function(gameKey, callback) {

        var systemDetails = (_config.systemdetails && _config.systemdetails[gameKey.system]) || {};
        Log('Configure requested for system=' + gameKey.system + ', emulatorExtension=' + (systemDetails.emuextention || '(unknown)') + ', emulatorScript=' + (systemDetails.emuscript || '(unknown)'));

        EnsureGamepadsReadyBeforeConfigure(function() {

            if ($.isEmptyObject(_gamepads)) {
                Log('Configure skipped: no active gamepads detected. Press a gamepad button, make sure the page has focus, and retry if the browser has not exposed the controller yet.');
                return callback();
            }

            //we expect a mappings in the config to allow this system to be configured with a gamepad
            if (!_config.mappings || !_config.mappings[gameKey.system]) {
                Log('Configure skipped: no controller mapping labels found for system=' + gameKey.system);
                return callback();
            }

            var gamepadIndexes = GetGamepadIndexes();
            Log('Configure eligible: gamepad indexes=' + gamepadIndexes.join(',') + ', system=' + gameKey.system);

            ConfigureGamepadList(gamepadIndexes, 0, gameKey, function() {
                //all gamepads configured and saved to prefs
                callback();
            });
        });
    };

    this.GetConfiguredGamepadInput = function(gameKey, options) {

        options = options || {};
        ScanForGamepads('get configured input');

        var mappings = [];
        for (var index in _gamepads) {
            if (!_gamepads.hasOwnProperty(index)) {
                continue;
            }

            var gamepad = _gamepads[index];

            if (gamepad.skipinputconfig) {
                if (options.logMissing) {
                    Log('Skipping configured input for gamepad index=' + index + ', id=' + gamepad.id + ', system=' + gameKey.system + ': player chose not to use this gamepad for the current launch.');
                }
                continue;
            }

            var prefname = GetPreferenceName(gameKey, gamepad, index);
            var savedMappings = _Preferences.Get(prefname); //a unique name includes the port plugged into (for duplicate gamepads on all ports)
            var decompressedConfig = null;

            if (savedMappings) {
                decompressedConfig = _Compression.Decompress.json(savedMappings);
            }
            else if (gamepad.inputconfig) {
                decompressedConfig = gamepad.inputconfig;
            }

            if (decompressedConfig) {
                if (options.includeMetadata) {
                    mappings.push({
                        index: parseInt(index, 10),
                        id: gamepad.id,
                        inputconfig: decompressedConfig
                    });
                }
                else {
                    mappings.push(decompressedConfig);
                }
            }
            else if (options.logMissing) {
                Log('No saved mapping found for gamepad index=' + index + ', id=' + gamepad.id + ', system=' + gameKey.system + ', profile=' + GetInputPreferenceProfile(gameKey));
            }
        }
        return mappings;
    };

    this.GetNextInput = function(callback) {

        var captureFinished = false;
        var hasSeenNeutralState = false;
        var waitingForReleaseLogged = false;

        var FinishCapture = function(value, label) {
            if (captureFinished) {
                return;
            }

            captureFinished = true;
            cancelAnimationFrame(_gameLoop); //stop loop
            _captureInputCallback = null;
            $(document).off('keypress', KeyboardSkipHandler);
            return callback(value, label);
        };

        var KeyboardSkipHandler = function() {
            return FinishCapture('', 'Not Assigned');
        };

        _captureInputCallback = function(value, label) {
            return FinishCapture(value, label);
        };

        _captureInputCallback.WaitForNeutralBeforeCapture = function(activeInputs) {
            if (hasSeenNeutralState) {
                return false;
            }

            if (!activeInputs.length) {
                hasSeenNeutralState = true;
                return false;
            }

            if (!waitingForReleaseLogged) {
                waitingForReleaseLogged = true;
                Log('Waiting for all gamepad buttons/axes to be released before capturing the next assignment. Active inputs=' + activeInputs.join(','));
            }
            return true;
        };

        //any keyboard event during the capture will not assign current assignment
        $(document).on('keypress', KeyboardSkipHandler);

        _gameLoop = requestAnimationFrame(Update); //loop start
    };

    this.GetGamePadDetails = function() {
        ScanForGamepads('get details');
        return _gamepads;
    };

    this.GetConnectionState = function(options) {

        options = options || {};

        if (options.scan !== false) {
            ScanForGamepads('get connection state');
        }

        return BuildConnectionState(options.reason || 'status request');
    };

    this.HasConnectedGamepad = function() {
        return self.GetConnectionState().connected;
    };

    this.SubscribeConnectionState = function(context, handler) {

        if (!_PubSub || typeof _PubSub.Subscribe !== 'function' || typeof handler !== 'function') {
            return function() {};
        }

        return _PubSub.Subscribe(_connectionStateTopic, context || self, handler);
    };

    // private methods

    var ConfigureGamepadList = function(gamepadIndexes, position, gameKey, callback) {

        if (position >= gamepadIndexes.length) {
            return callback();
        }

        ConfigureGamepad(gamepadIndexes[position], gameKey, function() {
            return ConfigureGamepadList(gamepadIndexes, position + 1, gameKey, callback);
        });
    };

    var ConfigureGamepad = function(index, gameKey, callback) {

        var gamepad = _gamepads[index];

        //base case, bail
        if (!gamepad) {
            Log('Configure skipped for missing gamepad index=' + index);
            return callback();
        }

        var prefName = GetPreferenceName(gameKey, gamepad, index);
        var legacyPrefName = GetLegacyPreferenceName(gameKey, gamepad, index);
        var savedMappings = _Preferences.Get(prefName);
        var legacySavedMappings = (legacyPrefName !== prefName) ? _Preferences.Get(legacyPrefName) : null;
        var savedInputConfig = savedMappings ? _Compression.Decompress.json(savedMappings) : null;
        var promptForSavedMapping = ShouldPromptForSavedMapping(gameKey);

        if (!savedMappings && legacySavedMappings) {
            Log('Legacy controller mapping exists for gamepad index=' + index + ', system=' + gameKey.system + ', but it is ignored for input profile=' + GetInputPreferenceProfile(gameKey) + '. A fresh mapping dialog will be shown.');
        }

        //if we found preferences for the gamepad already, older emulator profiles keep the old behavior and skip the dialog
        if (savedInputConfig && !reconfigureEachTime && !promptForSavedMapping) {

            //cache locally
            gamepad.inputconfig = savedInputConfig;
            gamepad.skipinputconfig = false;
            Log('Configure skipped for gamepad index=' + index + ': saved mapping found for system=' + gameKey.system + ', id=' + gamepad.id + ', profile=' + GetInputPreferenceProfile(gameKey));

            return callback();
        }

        if (savedInputConfig && promptForSavedMapping && !reconfigureEachTime) {
            gamepad.inputconfig = savedInputConfig;
            gamepad.skipinputconfig = false;
            Log('Saved mapping found for gamepad index=' + index + ', system=' + gameKey.system + ', profile=' + GetInputPreferenceProfile(gameKey) + '; opening ConfigureGamepad dialog so the player can confirm, remap, or skip this controller.');
        }

        Log('Opening ConfigureGamepad dialog for gamepad index=' + index + ', id=' + gamepad.id + ', system=' + gameKey.system + ', profile=' + GetInputPreferenceProfile(gameKey));
        _Dialogs.Open('ConfigureGamepad', [_config, gamepad, gameKey, {
            savedInputConfig: savedInputConfig,
            promptForSavedMapping: !!(savedInputConfig && promptForSavedMapping && !reconfigureEachTime),
            inputPreferenceProfile: GetInputPreferenceProfile(gameKey)
        }], false, function(inputconfig) {

            //if the dialog is returning a successful configuration, let's save it
            if (inputconfig) {

                //cache locally
                gamepad.inputconfig = inputconfig;
                gamepad.skipinputconfig = false;

                _Preferences.Set(prefName, _Compression.Compress.json(inputconfig));
                Log('Saved controller mapping for gamepad index=' + index + ', system=' + gameKey.system + ', profile=' + GetInputPreferenceProfile(gameKey));
            }
            else {
                gamepad.inputconfig = null;
                gamepad.skipinputconfig = true;
                Log('ConfigureGamepad dialog completed without a saved mapping for gamepad index=' + index + ', system=' + gameKey.system + '; this gamepad will not be used for the current launch.');
            }

            return callback();
        });
    };

    var GetCompressedGamepadName = function(gamepad) {
        return _Compression.Compress.string(gamepad.id);
    };

    var GetInputPreferenceProfile = function(gameKey) {
        var systemDetails = (_config.systemdetails && _config.systemdetails[gameKey.system]) || {};

        if (systemDetails.emuextention === '1.22.2-stable') {
            return 'browser-gamepad-v2';
        }

        return 'legacy';
    };

    var GetLegacyPreferenceName = function(gameKey, gamepad, index) {
        return 'mappings.gamepad.' + gameKey.system + '.' + GetCompressedGamepadName(gamepad) + '.' + index;
    };

    var GetPreferenceName = function(gameKey, gamepad, index) {
        var profile = GetInputPreferenceProfile(gameKey);

        if (profile === 'legacy') {
            return GetLegacyPreferenceName(gameKey, gamepad, index);
        }

        return 'mappings.gamepad.' + profile + '.' + gameKey.system + '.' + GetCompressedGamepadName(gamepad) + '.' + index;
    };

    var ShouldPromptForSavedMapping = function(gameKey) {
        return GetInputPreferenceProfile(gameKey) === 'browser-gamepad-v2';
    };

    var AddGamepad = function(gamepad, reason) {

        if (!gamepad) {
            return;
        }

        //if gamepad already assigned, keep latest browser snapshot and preserve CES session-only flags
        if (_gamepads[gamepad.index]) {
            gamepad.inputconfig = _gamepads[gamepad.index].inputconfig;
            gamepad.skipinputconfig = _gamepads[gamepad.index].skipinputconfig;
            _gamepads[gamepad.index] = gamepad;
            return;
        }

        _gamepads[gamepad.index] = gamepad;

        Log('Gamepad connected at index=' + gamepad.index + ', id=' + gamepad.id + ', buttons=' + gamepad.buttons.length + ', axes=' + gamepad.axes.length + ', source=' + (reason || 'unknown'));

        var $gamepad = _$gamepads[gamepad.index];
        if ($gamepad && $gamepad.length) {
            $gamepad.addClass('connected');
            _Tooltips.SingleHTML($gamepad, 'Gamepad Connected: ' + gamepad.id); //reapply tooltips
        }
        else {
            Log('No UI placeholder exists for gamepad index=' + gamepad.index + '; keeping it available for input config.');
        }

        PublishConnectionState(reason || 'gamepad connected');

        //after all the work I did, I found the web retroarch worked with gamepads out of the box. lol
        //requestAnimationFrame(Update); //loop start
    };

    var RemoveGamepad = function(gamepad, reason) {

        if (!gamepad) {
            return;
        }

        Log('Gamepad disconnected from index=' + gamepad.index + ', id=' + gamepad.id + ', source=' + (reason || 'unknown'));

        var $gamepad = _$gamepads[gamepad.index];
        if ($gamepad && $gamepad.length) {
            $gamepad.removeClass('connected');
            _Tooltips.SingleHTML($gamepad, 'Gamepad Disconnected'); //reapply tooltips
        }

        delete _gamepads[gamepad.index];

        PublishConnectionState(reason || 'gamepad disconnected');
    };

    var Update = function() {
        ScanForGamepads('capture');

        var activeInputs = GetActiveInputs();

        if (_captureInputCallback && _captureInputCallback.WaitForNeutralBeforeCapture(activeInputs.keys)) {
            _gameLoop = requestAnimationFrame(Update);
            return;
        }

        if (_captureInputCallback && activeInputs.first) {
            _captureInputCallback(activeInputs.first.value, activeInputs.first.label);
        }

        if (_captureInputCallback) {
            _gameLoop = requestAnimationFrame(Update); //loop
        }
    };

    var GetActiveInputs = function() {

        var active = {
            keys: [],
            first: null
        };

        //for each controller
        for (var j in _gamepads) {
            if (!_gamepads.hasOwnProperty(j)) {
                continue;
            }

            var gamepad = _gamepads[j];

            //buttons
            for (var i = 0; i < gamepad.buttons.length; i++) {
                var button = gamepad.buttons[i];
                if (button.pressed) {
                    var buttonInput = {
                        value: i,
                        label: 'Button ' + i,
                        key: 'b' + i
                    };
                    active.keys.push(buttonInput.key);
                    if (!active.first) {
                        active.first = buttonInput;
                    }
                }
            }
            //axes
            for (i = 0; i < gamepad.axes.length; i++) {
                var val = gamepad.axes[i];
                if (Math.abs(val) >= _inputCaptureNeutralThreshold) {
                    var sign = (val < 0 ? '-' : '+');
                    var retroarchconfigvalue = sign + i; //eg -0, +0, -1
                    var axisInput = {
                        value: retroarchconfigvalue,
                        label: 'Axis ' + i + sign,
                        key: 'a' + i + sign
                    };
                    active.keys.push(axisInput.key);
                    if (!active.first) {
                        active.first = axisInput;
                    }
                }
            }
        }

        return active;
    };

    //this function is called in leu of the window "ongamepadconnected" for different browsers
    var ScanForGamepads = function(reason) {

        if (!HasGamepadApi()) {
            return 0;
        }

        var gamepads = GetRawGamepads();
        var seenIndexes = {};

        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                seenIndexes[gamepads[i].index] = true;
                if (gamepads[i].index in _gamepads) {
                    gamepads[i].inputconfig = _gamepads[gamepads[i].index].inputconfig;
                    gamepads[i].skipinputconfig = _gamepads[gamepads[i].index].skipinputconfig;
                    _gamepads[gamepads[i].index] = gamepads[i];
                } else {
                    AddGamepad(gamepads[i], reason || 'scan');
                }
            }
        }

        for (var index in _gamepads) {
            if (!_gamepads.hasOwnProperty(index)) {
                continue;
            }

            if (!seenIndexes[index]) {
                RemoveGamepad(_gamepads[index], reason || 'scan missing');
            }
        }

        return GetGamepadIndexes().length;
    };

    var EnsureGamepadsReadyBeforeConfigure = function(callback) {

        if (!HasGamepadApi()) {
            Log('Configure skipped: navigator.getGamepads is not available in this browser.');
            return callback();
        }

        ScanForGamepads('configure start');

        if (!$.isEmptyObject(_gamepads)) {
            return callback();
        }

        var frames = 0;
        var callbackCalled = false;

        var Finish = function() {
            if (callbackCalled) {
                return;
            }

            callbackCalled = true;
            return callback();
        };

        var TryScan = function() {
            ScanForGamepads('configure retry');

            if (!$.isEmptyObject(_gamepads)) {
                Log('Gamepad detected during configure readiness scan: indexes=' + GetGamepadIndexes().join(','));
                return Finish();
            }

            frames++;
            if (frames >= _configureScanFrameLimit) {
                Log('No gamepad detected during configure readiness scan. Modern browsers may wait for a button press or page focus before exposing the controller.');
                return Finish();
            }

            requestAnimationFrame(TryScan);
        };

        requestAnimationFrame(TryScan);
    };

    var HasGamepadApi = function() {
        return !!(navigator.getGamepads || navigator.webkitGetGamepads);
    };

    var GetRawGamepads = function() {
        try {
            return navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        }
        catch (e) {
            Log('navigator.getGamepads failed: ' + e);
            return [];
        }
    };

    var GetGamepadIndexes = function() {
        var indexes = [];
        for (var index in _gamepads) {
            if (_gamepads.hasOwnProperty(index)) {
                indexes.push(parseInt(index, 10));
            }
        }

        indexes.sort(function(a, b) {
            return a - b;
        });
        return indexes;
    };

    var BuildConnectionState = function(reason) {
        var indexes = GetGamepadIndexes();

        return {
            connected: indexes.length > 0,
            count: indexes.length,
            indexes: indexes,
            reason: reason || 'unknown'
        };
    };

    var PublishConnectionState = function(reason) {

        if (!_PubSub || typeof _PubSub.Publish !== 'function') {
            return;
        }

        _PubSub.Publish(_connectionStateTopic, [BuildConnectionState(reason)], true);
    };

    var GetSecureContextLabel = function() {
        if (typeof window.isSecureContext === 'undefined') {
            return 'unknown';
        }
        return window.isSecureContext;
    };

    var Log = function(message) {
        if (window.console && console.log) {
            console.log('[cesGamePad] ' + message);
        }
    };

    $(document).ready(function() {

        _haveEvents = 'ongamepadconnected' in window;

        Log('Browser gamepad support: api=' + HasGamepadApi() + ', events=' + _haveEvents + ', secureContext=' + GetSecureContextLabel());

        if (!_haveEvents) {
            setInterval(function() {
                ScanForGamepads('poll');
            }, 17); //17 is 60fps
        }

        window.addEventListener('gamepadconnected', function(e) {
            AddGamepad(e.gamepad, 'gamepadconnected event');
        });
        window.addEventListener("gamepaddisconnected", function(e) {
            RemoveGamepad(e.gamepad, 'gamepaddisconnected event');
        });

        //default gamepad tooltips
        for (var i = 0, len = _$gamepads.length; i < len; ++i) {
            _Tooltips.SingleHTML(_$gamepads[i], 'Connect a Gamepad!');
        }

        ScanForGamepads('document ready');
        PublishConnectionState('document ready');
    });


    return this;
});
