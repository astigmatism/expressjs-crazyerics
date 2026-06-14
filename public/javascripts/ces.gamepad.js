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
    var _runtimeActivation = null;
    var _runtimePollTimer = null;
    var _runtimePollInterval = 500;
    var _runtimeMaxControllersDefault = 2;
    var _runtimeVirtualButtonCount = 16;
    var _runtimeVirtualAxisCount = 4;
    var _runtimeInputThreshold = 0.5;
    var _runtimeVirtualShimInstalled = false;
    var _restoreNavigatorGetGamepads = null;
    var _restoreNavigatorWebkitGetGamepads = null;
    var _nativeGetGamepads = null;
    var _nativeWebkitGetGamepads = null;
    var _sessionSkippedGamepads = {};

    var _runtimeVirtualButtonMap = {
        up_axis: 12,
        down_axis: 13,
        left_axis: 14,
        right_axis: 15,
        a_btn: 0,
        b_btn: 1,
        x_btn: 2,
        y_btn: 3,
        l_btn: 4,
        r_btn: 5,
        l2_btn: 6,
        r2_btn: 7,
        select_btn: 8,
        start_btn: 9,
        l3_btn: 10,
        r3_btn: 11
    };

    //debug
    var reconfigureEachTime = false; //when true will avoid checking preferences for saved configuration

    //these values are specific to retroarch config

    // public methods

    //determine if controllers need configuration, if so, use dialog
    this.Configure = function(gameKey, callback) {

        var systemDetails = (_config.systemdetails && _config.systemdetails[gameKey.system]) || {};
        Log('Configure requested for system=' + gameKey.system + ', emulatorExtension=' + (systemDetails.emuextention || '(unknown)') + ', emulatorScript=' + (systemDetails.emuscript || '(unknown)'));

        ClearSessionSkippedGamepads(gameKey);

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
        var indexes = GetGamepadIndexes();
        for (var i = 0; i < indexes.length; i++) {
            var index = indexes[i];
            var gamepad = _gamepads[index];

            if (!gamepad) {
                continue;
            }

            if (gamepad.skipinputconfig || IsSessionSkippedGamepad(gameKey, gamepad, index)) {
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
                        name: gamepad.id,
                        slot: parseInt(index, 10) + 1,
                        player: parseInt(index, 10) + 1,
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

    this.PrepareRuntimeGamepadActivation = function(gameKey, options) {

        options = options || {};

        if (!IsRetroArch1222GameKey(gameKey)) {
            return {
                enabled: false,
                reason: 'runtime strict gamepad activation is scoped to RetroArch 1.22.2'
            };
        }

        EnsureRuntimeActivationContext(gameKey, options);
        _runtimeActivation.prepared = true;
        _runtimeActivation.prepareReason = options.reason || 'prepare runtime gamepad activation';
        _runtimeActivation.virtualShimEnabled = InstallRuntimeVirtualGamepadShim();

        ScanForGamepads('runtime activation prepare');
        ActivateExistingConfiguredRuntimeGamepads('runtime activation prepare');
        PublishConnectionState('runtime activation prepare');

        return BuildRuntimeActivationReport('runtime activation prepare');
    };

    this.BeginRuntimeGamepadActivation = function(options) {

        options = options || {};

        if (!IsRetroArch1222GameKey(options.gameKey)) {
            return {
                enabled: false,
                reason: 'runtime strict gamepad activation is scoped to RetroArch 1.22.2'
            };
        }

        EnsureRuntimeActivationContext(options.gameKey, options);
        _runtimeActivation.running = true;
        _runtimeActivation.bridge = options.bridge || _runtimeActivation.bridge || {};
        _runtimeActivation.beginReason = options.reason || 'begin runtime gamepad activation';
        _runtimeActivation.virtualShimEnabled = InstallRuntimeVirtualGamepadShim();

        ScanForGamepads('runtime activation begin');
        ActivateExistingConfiguredRuntimeGamepads('runtime activation begin');
        StartRuntimeActivationPoll();
        FocusRuntimeEmulator();
        PublishConnectionState('runtime activation begin');

        return BuildRuntimeActivationReport('runtime activation begin');
    };

    this.EndRuntimeGamepadActivation = function(reason) {
        EndRuntimeActivationContext(reason || 'end runtime gamepad activation');
    };

    this.BuildRuntimeVirtualGamepadInputConfiguration = function(gameKey, options) {
        return BuildRuntimeVirtualGamepadInputConfiguration(gameKey, options);
    };

    this.GetActiveRuntimeGamepadMappings = function(gameKey, options) {
        return GetActiveRuntimeGamepadMappings(gameKey, options);
    };

    this.GetRuntimeVirtualGamepadsForRetroArch = function(gameKey) {
        return GetRuntimeVirtualGamepadsForRetroArch(gameKey);
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
                MarkSessionSkippedGamepad(gameKey, gamepad, index);
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

    var IsRetroArch1222GameKey = function(gameKey) {
        if (!gameKey || !gameKey.system || !_config.systemdetails || !_config.systemdetails[gameKey.system]) {
            return false;
        }

        return _config.systemdetails[gameKey.system].emuextention === '1.22.2-stable';
    };

    var IsSameRuntimeGameKey = function(a, b) {
        return !!(a && b && a.system === b.system && a.file === b.file);
    };

    var CloneGameKey = function(gameKey) {
        return $.extend({}, gameKey || {});
    };

    var GetRuntimeMaxControllers = function(options) {
        var maxControllers = options && options.maxControllers;

        if (!maxControllers && _runtimeActivation && _runtimeActivation.maxControllers) {
            maxControllers = _runtimeActivation.maxControllers;
        }

        maxControllers = parseInt(maxControllers || _runtimeMaxControllersDefault, 10);

        if (!maxControllers || maxControllers < 1) {
            maxControllers = _runtimeMaxControllersDefault;
        }

        return Math.min(maxControllers, _$gamepads.length || _runtimeMaxControllersDefault);
    };

    var ClearSessionSkippedGamepads = function(gameKey) {
        var prefix;

        if (!gameKey || !gameKey.system) {
            _sessionSkippedGamepads = {};
            return;
        }

        prefix = GetInputPreferenceProfile(gameKey) + '|' + gameKey.system + '|';
        for (var key in _sessionSkippedGamepads) {
            if (_sessionSkippedGamepads.hasOwnProperty(key) && key.indexOf(prefix) === 0) {
                delete _sessionSkippedGamepads[key];
            }
        }
    };

    var GetSessionGamepadKey = function(gameKey, gamepad, index) {
        index = (typeof index === 'undefined' || index === null) ? (gamepad ? gamepad.index : '') : index;
        return GetInputPreferenceProfile(gameKey) + '|' + gameKey.system + '|' + GetCompressedGamepadName(gamepad || { id: '' }) + '|' + index;
    };

    var MarkSessionSkippedGamepad = function(gameKey, gamepad, index) {
        if (!gameKey || !gamepad) {
            return;
        }

        _sessionSkippedGamepads[GetSessionGamepadKey(gameKey, gamepad, index)] = true;
    };

    var IsSessionSkippedGamepad = function(gameKey, gamepad, index) {
        if (!gameKey || !gamepad) {
            return false;
        }

        return !!_sessionSkippedGamepads[GetSessionGamepadKey(gameKey, gamepad, index)];
    };

    var EnsureRuntimeActivationContext = function(gameKey, options) {
        options = options || {};

        if (_runtimeActivation && IsSameRuntimeGameKey(_runtimeActivation.gameKey, gameKey)) {
            _runtimeActivation.maxControllers = GetRuntimeMaxControllers(options);
            return _runtimeActivation;
        }

        EndRuntimeActivationContext('replace runtime gamepad activation context', { silent: true });

        _runtimeActivation = {
            gameKey: CloneGameKey(gameKey),
            maxControllers: GetRuntimeMaxControllers(options),
            prepared: false,
            running: false,
            bridge: options.bridge || {},
            activeSlots: {},
            notifiedActivations: {},
            notifiedDisconnects: {},
            rejections: {},
            virtualShimEnabled: false,
            createdAt: Date.now()
        };

        return _runtimeActivation;
    };

    var EndRuntimeActivationContext = function(reason, options) {
        options = options || {};

        StopRuntimeActivationPoll();

        if (_runtimeActivation) {
            _runtimeActivation.activeSlots = {};
            _runtimeActivation.running = false;
            _runtimeActivation.prepared = false;
        }

        _runtimeActivation = null;
        RestoreRuntimeVirtualGamepadShim();

        if (!options.silent) {
            PublishConnectionState(reason || 'runtime activation ended');
        }
    };

    var StartRuntimeActivationPoll = function() {
        if (_runtimePollTimer || !_runtimeActivation) {
            return;
        }

        // Browsers without gamepad events are already covered by the legacy page-level poll.
        if (!_haveEvents) {
            return;
        }

        _runtimePollTimer = setInterval(function() {
            if (!_runtimeActivation) {
                StopRuntimeActivationPoll();
                return;
            }

            ScanForGamepads('runtime activation poll');
        }, _runtimePollInterval);
    };

    var StopRuntimeActivationPoll = function() {
        if (_runtimePollTimer) {
            clearInterval(_runtimePollTimer);
            _runtimePollTimer = null;
        }
    };

    var CaptureNativeGamepadGetters = function() {
        if (typeof navigator === 'undefined') {
            return;
        }

        if (!_nativeGetGamepads && navigator.getGamepads && !navigator.getGamepads.cesRuntimeVirtualShim) {
            try {
                _nativeGetGamepads = navigator.getGamepads.bind(navigator);
            } catch (e) {
                _nativeGetGamepads = null;
            }
        }

        if (!_nativeWebkitGetGamepads && navigator.webkitGetGamepads && !navigator.webkitGetGamepads.cesRuntimeVirtualShim) {
            try {
                _nativeWebkitGetGamepads = navigator.webkitGetGamepads.bind(navigator);
            } catch (e) {
                _nativeWebkitGetGamepads = null;
            }
        }
    };

    var ReplaceNavigatorGamepadGetter = function(name, replacement) {
        var hadOwnProperty;
        var ownDescriptor;

        if (typeof navigator === 'undefined') {
            return null;
        }

        try {
            hadOwnProperty = Object.prototype.hasOwnProperty.call(navigator, name);
            ownDescriptor = hadOwnProperty ? Object.getOwnPropertyDescriptor(navigator, name) : null;
        } catch (e) {
            hadOwnProperty = false;
            ownDescriptor = null;
        }

        try {
            Object.defineProperty(navigator, name, {
                configurable: true,
                enumerable: false,
                writable: true,
                value: replacement
            });

            return function() {
                try {
                    if (hadOwnProperty && ownDescriptor) {
                        Object.defineProperty(navigator, name, ownDescriptor);
                    } else {
                        delete navigator[name];
                    }
                } catch (restoreError) {
                    try {
                        navigator[name] = ownDescriptor && ownDescriptor.value ? ownDescriptor.value : undefined;
                    } catch (ignoreRestoreError) {}
                }
            };
        } catch (defineError) {
            try {
                var original = navigator[name];
                navigator[name] = replacement;
                return function() {
                    try {
                        navigator[name] = original;
                    } catch (ignoreAssignmentRestoreError) {}
                };
            } catch (assignmentError) {
                Log('Unable to install runtime virtual gamepad shim for navigator.' + name + ': ' + assignmentError);
                return null;
            }
        }
    };

    var InstallRuntimeVirtualGamepadShim = function() {
        if (_runtimeVirtualShimInstalled) {
            return true;
        }

        CaptureNativeGamepadGetters();

        var virtualGetter = function() {
            return BuildRuntimeVirtualGamepadsForNavigator();
        };
        virtualGetter.cesRuntimeVirtualShim = true;

        if (typeof navigator === 'undefined') {
            return false;
        }

        if (navigator.getGamepads || _nativeGetGamepads) {
            _restoreNavigatorGetGamepads = ReplaceNavigatorGamepadGetter('getGamepads', virtualGetter);
        }

        if (navigator.webkitGetGamepads || _nativeWebkitGetGamepads) {
            _restoreNavigatorWebkitGetGamepads = ReplaceNavigatorGamepadGetter('webkitGetGamepads', virtualGetter);
        }

        _runtimeVirtualShimInstalled = !!(_restoreNavigatorGetGamepads || _restoreNavigatorWebkitGetGamepads);

        if (_runtimeVirtualShimInstalled) {
            Log('Installed strict runtime virtual Gamepad API shim for RetroArch 1.22.2. RetroArch will only see mapped active controllers.');
        } else {
            Log('Runtime virtual Gamepad API shim could not be installed; mapped runtime gamepads will remain inactive rather than falling back to generic browser mappings.');
        }

        return _runtimeVirtualShimInstalled;
    };

    var RestoreRuntimeVirtualGamepadShim = function() {
        if (_restoreNavigatorGetGamepads) {
            try { _restoreNavigatorGetGamepads(); } catch (e) { Log('Unable to restore navigator.getGamepads: ' + e); }
            _restoreNavigatorGetGamepads = null;
        }

        if (_restoreNavigatorWebkitGetGamepads) {
            try { _restoreNavigatorWebkitGetGamepads(); } catch (e) { Log('Unable to restore navigator.webkitGetGamepads: ' + e); }
            _restoreNavigatorWebkitGetGamepads = null;
        }

        if (_runtimeVirtualShimInstalled) {
            Log('Restored native Gamepad API after RetroArch runtime gamepad activation ended.');
        }

        _runtimeVirtualShimInstalled = false;
    };

    var GetInputNamesForSystem = function(gameKey) {
        var mappings;
        var names = [];

        if (!gameKey || !_config.mappings || !_config.mappings[gameKey.system]) {
            return names;
        }

        mappings = _config.mappings[gameKey.system];
        for (var inputName in mappings) {
            if (mappings.hasOwnProperty(inputName)) {
                names.push(inputName);
            }
        }

        return names;
    };

    var GetInputBaseName = function(inputName) {
        return String(inputName || '').replace(/_(btn|axis)$/, '');
    };

    var GetVirtualButtonForInputName = function(inputName) {
        var normalized = String(inputName || '');
        var baseName;

        if (_runtimeVirtualButtonMap.hasOwnProperty(normalized)) {
            return _runtimeVirtualButtonMap[normalized];
        }

        baseName = GetInputBaseName(normalized);
        if (_runtimeVirtualButtonMap.hasOwnProperty(baseName + '_btn')) {
            return _runtimeVirtualButtonMap[baseName + '_btn'];
        }
        if (_runtimeVirtualButtonMap.hasOwnProperty(baseName + '_axis')) {
            return _runtimeVirtualButtonMap[baseName + '_axis'];
        }

        return null;
    };

    var BuildRuntimeVirtualGamepadInputConfiguration = function(gameKey, options) {
        options = options || {};

        if (!IsRetroArch1222GameKey(gameKey)) {
            return '';
        }

        var maxControllers = GetRuntimeMaxControllers(options);
        var inputNames = GetInputNamesForSystem(gameKey);
        var configString = '';
        var player;
        var i;

        if (!inputNames.length) {
            Log('No system controller mapping exists for strict runtime virtual gamepad config; system=' + (gameKey && gameKey.system));
            return '';
        }

        for (player = 1; player <= maxControllers; player++) {
            configString += 'input_player' + player + '_joypad_index = ' + (player - 1) + '\n';

            for (i = 0; i < inputNames.length; i++) {
                var inputName = inputNames[i];
                var virtualButton = GetVirtualButtonForInputName(inputName);
                var baseName = GetInputBaseName(inputName);

                if (virtualButton === null) {
                    Log('No virtual button assigned for RetroArch runtime input ' + inputName + '; skipping player ' + player + ' config line.');
                    continue;
                }

                configString += 'input_player' + player + '_' + baseName + '_btn = ' + virtualButton + '\n';
            }
        }

        Log('Built strict runtime virtual gamepad RetroArch config for system=' + gameKey.system + ', controllers=' + maxControllers + ', mappedInputs=' + inputNames.length + '.');
        return configString;
    };

    var LoadStrictSavedMappingForGamepad = function(gameKey, gamepad, index) {
        var prefname;
        var savedMappings;
        var decompressedConfig;

        if (!gameKey || !gamepad) {
            return { valid: false, reason: 'missing gamepad or game key' };
        }

        if (IsSessionSkippedGamepad(gameKey, gamepad, index) || gamepad.skipinputconfig) {
            return { valid: false, reason: 'gamepad was skipped for this launch' };
        }

        prefname = GetPreferenceName(gameKey, gamepad, index);
        savedMappings = _Preferences.Get(prefname);

        if (!savedMappings) {
            return { valid: false, reason: 'no saved mapping for current system/id/slot', prefname: prefname };
        }

        try {
            decompressedConfig = _Compression.Decompress.json(savedMappings);
        } catch (e) {
            return { valid: false, reason: 'saved mapping could not be decompressed', prefname: prefname };
        }

        if (!IsValidSavedMappingForSystem(gameKey, decompressedConfig)) {
            return { valid: false, reason: 'saved mapping is incomplete for current system', prefname: prefname };
        }

        return {
            valid: true,
            prefname: prefname,
            inputconfig: decompressedConfig
        };
    };

    var IsValidSavedMappingForSystem = function(gameKey, inputconfig) {
        var inputNames = GetInputNamesForSystem(gameKey);
        var i;

        if (!inputNames.length || !inputconfig || typeof inputconfig !== 'object') {
            return false;
        }

        for (i = 0; i < inputNames.length; i++) {
            if (!inputconfig.hasOwnProperty(inputNames[i])) {
                return false;
            }
        }

        return true;
    };

    var ActivateExistingConfiguredRuntimeGamepads = function(reason) {
        var indexes;
        var changed = false;
        var i;

        if (!_runtimeActivation || !_runtimeActivation.gameKey) {
            return false;
        }

        indexes = GetGamepadIndexes();
        for (i = 0; i < indexes.length; i++) {
            var index = indexes[i];
            var gamepad = _gamepads[index];
            if (TryActivateRuntimeGamepad(gamepad, reason || 'existing configured gamepad', { startup: true, notify: false, dispatch: false })) {
                changed = true;
            }
        }

        return changed;
    };

    var TryActivateRuntimeGamepad = function(gamepad, reason, options) {
        options = options || {};

        if (!_runtimeActivation || !_runtimeActivation.gameKey || !IsRetroArch1222GameKey(_runtimeActivation.gameKey)) {
            return false;
        }

        if (!gamepad || typeof gamepad.index === 'undefined') {
            return false;
        }

        var index = parseInt(gamepad.index, 10);
        var slot = index + 1;
        var existing;
        var strictMapping;
        var record;

        if (slot < 1 || slot > _runtimeActivation.maxControllers) {
            RememberRuntimeActivationRejection(gamepad, 'outside supported controller slots');
            return false;
        }

        existing = _runtimeActivation.activeSlots[slot];
        if (existing) {
            if (existing.index === index && existing.id === gamepad.id) {
                existing.gamepad = gamepad;
                existing.connected = gamepad.connected !== false;
                return false;
            }

            RememberRuntimeActivationRejection(gamepad, 'controller slot ' + slot + ' is already active for ' + existing.id);
            return false;
        }

        strictMapping = LoadStrictSavedMappingForGamepad(_runtimeActivation.gameKey, gamepad, index);
        if (!strictMapping.valid) {
            RememberRuntimeActivationRejection(gamepad, strictMapping.reason);
            return false;
        }

        record = {
            slot: slot,
            player: slot,
            index: index,
            id: gamepad.id,
            name: gamepad.id || ('Gamepad ' + slot),
            inputconfig: strictMapping.inputconfig,
            prefname: strictMapping.prefname,
            gamepad: gamepad,
            connected: gamepad.connected !== false,
            virtual: true,
            activatedAt: Date.now(),
            startup: !!options.startup
        };

        _runtimeActivation.activeSlots[slot] = record;
        _runtimeActivation.rejections = {};

        gamepad.inputconfig = strictMapping.inputconfig;
        gamepad.skipinputconfig = false;

        if (!options.startup) {
            Log('Runtime gamepad activated for slot=' + slot + ', index=' + index + ', id=' + gamepad.id + ', system=' + _runtimeActivation.gameKey.system + ', source=' + (reason || 'unknown'));
        }

        if (options.dispatch !== false && _runtimeActivation.running) {
            DispatchRuntimeGamepadEventToRetroArch('gamepadconnected', record, reason || 'runtime activation');
        }

        if (options.notify !== false && _runtimeActivation.running) {
            NotifyRuntimeGamepadActivation(record);
        }

        if (_runtimeActivation.running) {
            FocusRuntimeEmulator();
        }

        return true;
    };

    var HandleRuntimeGamepadDisconnected = function(gamepad, reason) {
        var slot;
        var record;

        if (!_runtimeActivation || !gamepad) {
            return false;
        }

        for (slot in _runtimeActivation.activeSlots) {
            if (!_runtimeActivation.activeSlots.hasOwnProperty(slot)) {
                continue;
            }

            record = _runtimeActivation.activeSlots[slot];
            if (record && record.index === parseInt(gamepad.index, 10) && record.id === gamepad.id) {
                DispatchRuntimeGamepadEventToRetroArch('gamepaddisconnected', record, reason || 'runtime disconnect');
                delete _runtimeActivation.activeSlots[slot];
                NotifyRuntimeGamepadDisconnect(record);
                Log('Runtime gamepad disconnected for slot=' + slot + ', index=' + record.index + ', id=' + record.id + ', source=' + (reason || 'unknown'));
                return true;
            }
        }

        return false;
    };

    var RememberRuntimeActivationRejection = function(gamepad, reason) {
        if (!_runtimeActivation || !gamepad) {
            return;
        }

        var key = gamepad.index + '|' + gamepad.id + '|' + reason;
        if (_runtimeActivation.rejections[key]) {
            return;
        }

        _runtimeActivation.rejections[key] = true;
        Log('Runtime gamepad not activated: index=' + gamepad.index + ', id=' + gamepad.id + ', reason=' + reason);
    };

    var NotifyRuntimeGamepadActivation = function(record) {
        if (!_PubSub || typeof _PubSub.Publish !== 'function' || !record) {
            return;
        }

        var key = record.slot + '|' + record.id + '|connected';
        if (_runtimeActivation && _runtimeActivation.notifiedActivations[key]) {
            return;
        }

        if (_runtimeActivation) {
            _runtimeActivation.notifiedActivations[key] = true;
        }

        var message = record.slot === 1 ? 'Gamepad connected: ' + record.name : 'Controller ' + record.slot + ' connected: ' + record.name;
        _PubSub.Publish('notification', [message, 3, false, false]);
    };

    var NotifyRuntimeGamepadDisconnect = function(record) {
        if (!_PubSub || typeof _PubSub.Publish !== 'function' || !record || !_runtimeActivation || !_runtimeActivation.running) {
            return;
        }

        var key = record.slot + '|' + record.id + '|disconnected|' + Date.now();
        _runtimeActivation.notifiedDisconnects[key] = true;

        _PubSub.Publish('notification', ['Controller ' + record.slot + ' disconnected: ' + record.name, 3, false, false]);
    };

    var FocusRuntimeEmulator = function() {
        if (!_runtimeActivation || !_runtimeActivation.bridge || typeof _runtimeActivation.bridge.focusEmulator !== 'function') {
            return;
        }

        try {
            _runtimeActivation.bridge.focusEmulator();
        } catch (e) {
            Log('Unable to focus emulator after runtime gamepad activation: ' + e);
        }
    };

    var IsRuntimeEmulatorInputActive = function() {
        if (!_runtimeActivation || !_runtimeActivation.running) {
            return true;
        }

        if (!_runtimeActivation.bridge || typeof _runtimeActivation.bridge.isInputActive !== 'function') {
            return true;
        }

        try {
            return _runtimeActivation.bridge.isInputActive() !== false;
        } catch (e) {
            Log('Unable to read runtime emulator input state: ' + e);
            return true;
        }
    };

    var DispatchRuntimeGamepadEventToRetroArch = function(type, record, reason) {
        var virtualGamepad;

        if (!_runtimeActivation || !_runtimeActivation.bridge || typeof _runtimeActivation.bridge.dispatchGamepadEventToRetroArch !== 'function') {
            return false;
        }

        virtualGamepad = BuildRuntimeVirtualGamepad(record, record.gamepad, type !== 'gamepaddisconnected');
        if (!virtualGamepad) {
            return false;
        }

        try {
            return _runtimeActivation.bridge.dispatchGamepadEventToRetroArch(type, virtualGamepad, reason || 'runtime gamepad event');
        } catch (e) {
            Log('Unable to dispatch ' + type + ' to RetroArch for runtime gamepad index=' + record.index + ': ' + e);
            return false;
        }
    };

    var BuildRuntimeVirtualGamepadsForNavigator = function() {
        var gamepads = [];
        var rawGamepads = GetNativeRawGamepads();
        var maxLength = Math.max(rawGamepads.length || 0, GetRuntimeMaxControllers({}));
        var slot;
        var i;

        for (i = 0; i < maxLength; i++) {
            gamepads[i] = null;
        }

        if (!_runtimeActivation || !_runtimeActivation.virtualShimEnabled) {
            return gamepads;
        }

        if (!IsRuntimeEmulatorInputActive()) {
            return gamepads;
        }

        for (slot in _runtimeActivation.activeSlots) {
            if (!_runtimeActivation.activeSlots.hasOwnProperty(slot)) {
                continue;
            }

            var record = _runtimeActivation.activeSlots[slot];
            var rawGamepad = rawGamepads[record.index] || record.gamepad;

            if (!rawGamepad || rawGamepad.connected === false) {
                continue;
            }

            gamepads[record.index] = BuildRuntimeVirtualGamepad(record, rawGamepad, true);
        }

        return gamepads;
    };

    var GetRuntimeVirtualGamepadsForRetroArch = function(gameKey) {
        var rawGamepads = GetNativeRawGamepads();
        var virtualGamepads = [];
        var records;
        var i;

        if (!_runtimeActivation || !IsSameRuntimeGameKey(_runtimeActivation.gameKey, gameKey)) {
            return virtualGamepads;
        }

        records = GetActiveRuntimeRecordsSorted();
        for (i = 0; i < records.length; i++) {
            var record = records[i];
            var rawGamepad = rawGamepads[record.index] || record.gamepad;
            var virtualGamepad = BuildRuntimeVirtualGamepad(record, rawGamepad, true);
            if (virtualGamepad) {
                virtualGamepads.push(virtualGamepad);
            }
        }

        return virtualGamepads;
    };

    var BuildRuntimeVirtualGamepad = function(record, rawGamepad, connected) {
        var buttons = [];
        var axes = [];
        var inputconfig;
        var inputName;
        var i;

        if (!record) {
            return null;
        }

        for (i = 0; i < _runtimeVirtualButtonCount; i++) {
            buttons.push({
                pressed: false,
                touched: false,
                value: 0
            });
        }

        for (i = 0; i < _runtimeVirtualAxisCount; i++) {
            axes.push(0);
        }

        inputconfig = record.inputconfig || {};
        rawGamepad = rawGamepad || record.gamepad;

        if (rawGamepad && connected !== false) {
            for (inputName in inputconfig) {
                if (!inputconfig.hasOwnProperty(inputName)) {
                    continue;
                }

                var virtualButton = GetVirtualButtonForInputName(inputName);
                if (virtualButton === null || virtualButton >= buttons.length) {
                    continue;
                }

                var physicalState = ReadPhysicalAssignmentState(rawGamepad, inputconfig[inputName]);
                if (physicalState.pressed) {
                    buttons[virtualButton].pressed = true;
                    buttons[virtualButton].touched = true;
                    buttons[virtualButton].value = Math.max(buttons[virtualButton].value, physicalState.value);
                }
            }
        }

        return {
            id: record.id || (rawGamepad && rawGamepad.id) || ('CES Virtual Gamepad ' + record.slot),
            index: record.index,
            connected: connected !== false,
            mapping: 'standard',
            timestamp: rawGamepad && rawGamepad.timestamp ? rawGamepad.timestamp : Date.now(),
            buttons: buttons,
            axes: axes,
            cesRuntimeVirtualGamepad: true,
            cesRuntimeSourceId: record.id,
            cesRuntimeSlot: record.slot
        };
    };

    var ReadPhysicalAssignmentState = function(gamepad, assignment) {
        var empty = { pressed: false, value: 0 };
        var index;
        var button;
        var axisValue;

        if (!gamepad || assignment === null || typeof assignment === 'undefined' || assignment === '') {
            return empty;
        }

        if (typeof assignment === 'number' || (typeof assignment === 'string' && /^\d+$/.test(assignment))) {
            index = parseInt(assignment, 10);
            button = gamepad.buttons && gamepad.buttons[index];
            if (!button) {
                return empty;
            }

            return {
                pressed: !!button.pressed || button.value >= _runtimeInputThreshold,
                value: typeof button.value === 'number' ? button.value : (button.pressed ? 1 : 0)
            };
        }

        if (typeof assignment === 'string' && /^[+-]\d+$/.test(assignment)) {
            index = parseInt(assignment.substring(1), 10);
            axisValue = gamepad.axes && typeof gamepad.axes[index] === 'number' ? gamepad.axes[index] : 0;
            if (assignment.charAt(0) === '+') {
                return {
                    pressed: axisValue >= _runtimeInputThreshold,
                    value: Math.max(0, axisValue)
                };
            }

            return {
                pressed: axisValue <= -_runtimeInputThreshold,
                value: Math.max(0, Math.abs(axisValue))
            };
        }

        return empty;
    };

    var GetNativeRawGamepads = function() {
        CaptureNativeGamepadGetters();

        try {
            if (_nativeGetGamepads) {
                return _nativeGetGamepads() || [];
            }

            if (_nativeWebkitGetGamepads) {
                return _nativeWebkitGetGamepads() || [];
            }
        } catch (e) {
            Log('native navigator.getGamepads failed: ' + e);
        }

        return [];
    };

    var GetActiveRuntimeRecordsSorted = function() {
        var records = [];
        var slot;

        if (!_runtimeActivation) {
            return records;
        }

        for (slot in _runtimeActivation.activeSlots) {
            if (_runtimeActivation.activeSlots.hasOwnProperty(slot)) {
                records.push(_runtimeActivation.activeSlots[slot]);
            }
        }

        records.sort(function(a, b) {
            return a.slot - b.slot;
        });

        return records;
    };

    var GetActiveRuntimeGamepadMappings = function(gameKey, options) {
        options = options || {};

        if (!_runtimeActivation || !IsSameRuntimeGameKey(_runtimeActivation.gameKey, gameKey)) {
            return self.GetConfiguredGamepadInput(gameKey, options);
        }

        var records = GetActiveRuntimeRecordsSorted();
        var mappings = [];
        var i;

        for (i = 0; i < records.length; i++) {
            var record = records[i];
            if (options.includeMetadata) {
                mappings.push({
                    index: record.index,
                    id: record.id,
                    name: record.name,
                    slot: record.slot,
                    player: record.player,
                    active: true,
                    virtual: true,
                    inputconfig: record.inputconfig
                });
            } else {
                mappings.push(record.inputconfig);
            }
        }

        return mappings;
    };

    var BuildRuntimeActivationReport = function(reason) {
        return {
            enabled: !!_runtimeActivation,
            reason: reason || 'runtime activation status',
            prepared: !!(_runtimeActivation && _runtimeActivation.prepared),
            running: !!(_runtimeActivation && _runtimeActivation.running),
            virtualShim: _runtimeVirtualShimInstalled,
            activeGamepads: BuildActiveRuntimeGamepadSummaries()
        };
    };

    var BuildActiveRuntimeGamepadSummaries = function() {
        var records = GetActiveRuntimeRecordsSorted();
        var summaries = [];
        var i;

        for (i = 0; i < records.length; i++) {
            summaries.push({
                slot: records[i].slot,
                player: records[i].player,
                index: records[i].index,
                id: records[i].id,
                name: records[i].name,
                virtual: true,
                connected: records[i].connected !== false
            });
        }

        return summaries;
    };

    var ShouldGateNativeGamepadEventForRuntime = function(event) {
        if (!_runtimeActivation || !IsRetroArch1222GameKey(_runtimeActivation.gameKey)) {
            return false;
        }

        if (event && event.cesRuntimeGamepadApproved) {
            return false;
        }

        return true;
    };

    var StopNativeGamepadEvent = function(event) {
        if (!event) {
            return;
        }

        try { event.stopImmediatePropagation(); } catch (e) {
            try { event.stopPropagation(); } catch (ignoreStopPropagation) {}
        }
    };

    var RuntimeGamepadEventGate = function(event) {
        if (!ShouldGateNativeGamepadEventForRuntime(event)) {
            return;
        }

        if (event.type === 'gamepadconnected') {
            AddGamepad(event.gamepad, 'gamepadconnected event gated for strict runtime activation');
            StopNativeGamepadEvent(event);
            return;
        }

        if (event.type === 'gamepaddisconnected') {
            RemoveGamepad(event.gamepad, 'gamepaddisconnected event gated for strict runtime activation');
            StopNativeGamepadEvent(event);
        }
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
            if (TryActivateRuntimeGamepad(gamepad, reason || 'gamepad snapshot update')) {
                PublishConnectionState(reason || 'gamepad snapshot update');
            }
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

        TryActivateRuntimeGamepad(gamepad, reason || 'gamepad connected');
        PublishConnectionState(reason || 'gamepad connected');

        //after all the work I did, I found the web retroarch worked with gamepads out of the box. lol
        //requestAnimationFrame(Update); //loop start
    };

    var RemoveGamepad = function(gamepad, reason) {

        if (!gamepad) {
            return;
        }

        Log('Gamepad disconnected from index=' + gamepad.index + ', id=' + gamepad.id + ', source=' + (reason || 'unknown'));

        HandleRuntimeGamepadDisconnected(gamepad, reason || 'gamepad disconnected');

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
        var changed = false;

        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                seenIndexes[gamepads[i].index] = true;
                if (gamepads[i].index in _gamepads) {
                    gamepads[i].inputconfig = _gamepads[gamepads[i].index].inputconfig;
                    gamepads[i].skipinputconfig = _gamepads[gamepads[i].index].skipinputconfig;
                    _gamepads[gamepads[i].index] = gamepads[i];
                    if (TryActivateRuntimeGamepad(gamepads[i], reason || 'scan update')) {
                        changed = true;
                    }
                } else {
                    AddGamepad(gamepads[i], reason || 'scan');
                    changed = true;
                }
            }
        }

        if (changed) {
            PublishConnectionState(reason || 'scan');
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
        CaptureNativeGamepadGetters();
        return !!(_nativeGetGamepads || _nativeWebkitGetGamepads || navigator.getGamepads || navigator.webkitGetGamepads);
    };

    var GetRawGamepads = function() {
        return GetNativeRawGamepads();
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
        var runtimeState = _runtimeActivation ? {
            prepared: !!_runtimeActivation.prepared,
            running: !!_runtimeActivation.running,
            strictMappedOnly: true,
            virtualShim: _runtimeVirtualShimInstalled,
            maxControllers: _runtimeActivation.maxControllers,
            activeGamepads: BuildActiveRuntimeGamepadSummaries()
        } : null;

        return {
            connected: indexes.length > 0,
            count: indexes.length,
            indexes: indexes,
            activeMappedCount: runtimeState ? runtimeState.activeGamepads.length : 0,
            runtime: runtimeState,
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

        window.addEventListener('gamepadconnected', RuntimeGamepadEventGate, true);
        window.addEventListener('gamepaddisconnected', RuntimeGamepadEventGate, true);

        window.addEventListener('gamepadconnected', function(e) {
            if (e && e.cesRuntimeGamepadApproved) {
                return;
            }
            AddGamepad(e.gamepad, 'gamepadconnected event');
        });
        window.addEventListener("gamepaddisconnected", function(e) {
            if (e && e.cesRuntimeGamepadApproved) {
                return;
            }
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
