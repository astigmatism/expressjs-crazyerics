/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 */
var cesEmulatorBase = (function(_Compression, _PubSub, _config, _Sync, _GamePad, _Preferences, _gameKey, _ui, _Media, _ClientCache, _Logging) {

    // private members
    var self = this;
    var _isLoading = false;
    var _isPaused = false; //flag for the screen overlay pause
    var _isEmulatorPaused = false; //flag for emulator pause (with user input)
    var _isMuted = false;
    var _isSavingState = false;
    var _isLoadingState = false;
    var _hasStateToLoad = false; //flag for whether it is possible to load state
    var _hasEmulationBegin = false; //flags true when emulation has started (player is playing!)
    var _gracefulExitInProgress = false;
    var _gracefulExitCallbacks = [];
    var _cleanupInProgress = false;
    var _cleanupComplete = false;
    var _cleanupCallbacks = [];
    var _cacheEmulatorScripts = true; //do we want to use _ClientCache to store emulator script responses (in raw form before globalEval)
    var _cacheName = _gameKey.system + '.' + _config.systemdetails[_gameKey.system].emuextention + '.' + _config.systemdetails[_gameKey.system].emuscript + '.script';
    var _loadPriority = 'emulator'; //emulator first, game first or null for simultanious
    var _activeContentFile = _gameKey.file; //actual file passed to RetroArch after archive expansion
    var _activeContentPath = null;
    var _lastStartupStateWrite = null;
    var _lastStartupStateLoadSignal = null;
    var _lastStartupStateLoadFailure = null;
    var _startupStateWriteTimeout = 2500;
    var _runtimeGamepadConfigurationFocusFence = false;
    var _runtimeGamepadConfigurationLayout = null;
    var _runtimeGamepadConfigurationLayoutRestoreTimer = null;
    var _runtimeGamepadConfigurationShimClass = 'ces-runtime-gamepad-configure-shim';
    var _runtimeGamepadConfigurationInputRevoked = false;
    var _fullscreenTransitionBlurSuppressUntil = 0;
    var _fullscreenTransitionBlurSuppressReason = '';

    var _displayDurationShow = 1000;
    var _displayDurationHide = 500;
    var _timeToWaitForScreenshot = 2000; //hopefully never take more than 2 sec
    var _timeToWaitForSaveState = 30000; //hopefully never more than 30 sec
    var _timeToWaitForEmulatorInstantiation = 500; //x2 once for global eval, again for instantiation
    var _timeToWaitForSrmFileOnExit = 3000;

    //instances
    var _EmulatorInstance = null;
    var _Module = null;
    var _SavesManager = null;
    var _SaveFilesManager = null;
    var _saveFilePageLifecycleHandlersInstalled = false;
    var _saveFileFreezeHandler = null;
    var _normalSaveMonitorTimer = null;
    var _lastNormalSaveBestEffortAt = 0;
    var _runtimeNormalSaveFlushCommandLastAt = 0;
    var _normalSaveNotificationLastAt = {};
    
    //protected instance
    this._InputHelper = null;

    //protected
    //this.loadedSaveData = null; //this is a space I use for indictaing a state file was written during load

    //wait for document as this is an external script
    $(document).ready(function() {

        self._InputHelper = new cesInputHelper(self, _Preferences, _GamePad, _ui, _Logging);
    });

    var LogLifecycle = function(message) {

        if (_Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('cesEmulatorBase.lifecycle', message);
        }
    };

    var NotifyNormalSaveFailure = function(message, topic) {
        var key = topic || message;
        var now = Date.now();
        var throttleMs = 30000;

        if (_normalSaveNotificationLastAt[key] && now - _normalSaveNotificationLastAt[key] < throttleMs) {
            if (_Logging && typeof _Logging.Console === 'function') {
                _Logging.Console('cesEmulatorBase', 'Suppressed repeat normal in-game save notification: ' + message);
            }
            return;
        }

        _normalSaveNotificationLastAt[key] = now;
        _PubSub.Publish('notification', [message, 2, false, false, topic || null]);
    };

    var NormalizeEventListenerCapture = function(options) {

        if (typeof options === 'boolean') {
            return options;
        }

        if (options && typeof options === 'object') {
            return !!options.capture;
        }

        return false;
    };

    var GetListenerSourceForDiagnostics = function(listener) {

        var target = listener;

        if (listener && typeof listener !== 'function' && typeof listener.handleEvent === 'function') {
            target = listener.handleEvent;
        }

        if (typeof target !== 'function') {
            return '';
        }

        try {
            return Function.prototype.toString.call(target);
        } catch (e) {
            return '';
        }
    };

    var GetListenerNameForDiagnostics = function(listener) {

        if (!listener) {
            return '';
        }

        if (typeof listener === 'function') {
            return listener.name || '';
        }

        if (listener.handleEvent && typeof listener.handleEvent === 'function') {
            return listener.handleEvent.name || '';
        }

        return '';
    };

    var LooksLikeEmscriptenSetImmediateMessageListener = function(listener) {

        var listenerName = GetListenerNameForDiagnostics(listener);
        var listenerSource = GetListenerSourceForDiagnostics(listener);
        var combined = listenerName + '\n' + listenerSource;

        return /Browser_setImmediate_messageHandler|setImmediates|__setImmediate|setImmediateWrapped|emSetImmediate/.test(combined);
    };

    var EnsureRuntimeMessageListenerTracking = function(module) {

        if (!module || module.cesRuntimeMessageListenerTrackingInstalled) {
            return;
        }

        module.cesTrackedRuntimeMessageListeners = module.cesTrackedRuntimeMessageListeners || [];

        module.cesTrackRuntimeMessageListener = function(target, type, listener, options, reason) {

            var capture = NormalizeEventListenerCapture(options);
            var listenerName;
            var i;

            if (target !== window || type !== 'message' || !listener || !LooksLikeEmscriptenSetImmediateMessageListener(listener)) {
                return;
            }

            for (i = 0; i < module.cesTrackedRuntimeMessageListeners.length; i++) {
                if (module.cesTrackedRuntimeMessageListeners[i].target === target &&
                    module.cesTrackedRuntimeMessageListeners[i].type === type &&
                    module.cesTrackedRuntimeMessageListeners[i].listener === listener &&
                    module.cesTrackedRuntimeMessageListeners[i].capture === capture &&
                    !module.cesTrackedRuntimeMessageListeners[i].removed) {
                    return;
                }
            }

            listenerName = GetListenerNameForDiagnostics(listener) || '(anonymous)';
            module.cesTrackedRuntimeMessageListeners.push({
                target: target,
                type: type,
                listener: listener,
                capture: capture,
                addedAt: Date.now(),
                reason: reason || 'runtime listener capture',
                name: listenerName,
                removed: false
            });

            LogLifecycle('Tracked Emscripten setImmediate message listener "' + listenerName + '" for ' + GetLifecycleDescriptor() + '; reason=' + (reason || 'runtime listener capture') + ', capture=' + capture);
        };

        module.cesMarkRuntimeMessageListenerRemoved = function(target, type, listener, options) {

            var capture = NormalizeEventListenerCapture(options);
            var i;

            if (!module.cesTrackedRuntimeMessageListeners) {
                return;
            }

            for (i = 0; i < module.cesTrackedRuntimeMessageListeners.length; i++) {
                if (module.cesTrackedRuntimeMessageListeners[i].target === target &&
                    module.cesTrackedRuntimeMessageListeners[i].type === type &&
                    module.cesTrackedRuntimeMessageListeners[i].listener === listener &&
                    module.cesTrackedRuntimeMessageListeners[i].capture === capture) {
                    module.cesTrackedRuntimeMessageListeners[i].removed = true;
                }
            }
        };

        module.cesRemoveTrackedRuntimeMessageListeners = function(reason) {

            var listeners = module.cesTrackedRuntimeMessageListeners || [];
            var removed = 0;
            var failed = 0;
            var i;

            for (i = 0; i < listeners.length; i++) {
                if (listeners[i].removed) {
                    continue;
                }

                try {
                    listeners[i].target.removeEventListener(listeners[i].type, listeners[i].listener, listeners[i].capture);
                    listeners[i].removed = true;
                    removed++;
                } catch (e) {
                    failed++;
                    LogLifecycle('Failed to remove tracked runtime message listener for ' + GetLifecycleDescriptor() + ': ' + e);
                }
            }

            if (removed || failed) {
                LogLifecycle('Removed tracked Emscripten setImmediate message listeners for ' + GetLifecycleDescriptor() + '; removed=' + removed + ', failed=' + failed + ', reason=' + (reason || 'cleanup'));
            }

            return { removed: removed, failed: failed, tracked: listeners.length };
        };

        module.cesGetRuntimeMessageListenerDiagnostics = function() {

            var listeners = module.cesTrackedRuntimeMessageListeners || [];
            var result = [];
            var i;

            for (i = 0; i < listeners.length; i++) {
                result.push({
                    type: listeners[i].type,
                    capture: listeners[i].capture,
                    name: listeners[i].name,
                    removed: !!listeners[i].removed,
                    reason: listeners[i].reason,
                    ageMs: Date.now() - listeners[i].addedAt
                });
            }

            return result;
        };

        module.cesRuntimeMessageListenerTrackingInstalled = true;
    };

    var StartRuntimeMessageListenerCapture = function(module, reason) {

        var capture;

        if (!module || typeof window === 'undefined' || !window.addEventListener || !window.removeEventListener) {
            return;
        }

        EnsureRuntimeMessageListenerTracking(module);

        if (module.cesRuntimeMessageListenerCapture && module.cesRuntimeMessageListenerCapture.active) {
            module.cesRuntimeMessageListenerCapture.depth++;
            return;
        }

        capture = {
            active: true,
            depth: 1,
            module: module,
            originalAddEventListener: window.addEventListener,
            originalRemoveEventListener: window.removeEventListener,
            addEventListenerWrapper: null,
            removeEventListenerWrapper: null
        };

        capture.addEventListenerWrapper = function(type, listener, options) {

            var result = capture.originalAddEventListener.apply(this, arguments);

            try {
                if (capture.active && capture.module && typeof capture.module.cesTrackRuntimeMessageListener === 'function') {
                    capture.module.cesTrackRuntimeMessageListener(this, type, listener, options, reason || 'emulator runtime startup');
                }
            } catch (e) {
                LogLifecycle('Runtime message listener tracking failed for ' + GetLifecycleDescriptor() + ': ' + e);
            }

            return result;
        };

        capture.removeEventListenerWrapper = function(type, listener, options) {

            var result = capture.originalRemoveEventListener.apply(this, arguments);

            try {
                if (capture.active && capture.module && typeof capture.module.cesMarkRuntimeMessageListenerRemoved === 'function') {
                    capture.module.cesMarkRuntimeMessageListenerRemoved(this, type, listener, options);
                }
            } catch (e) {
                LogLifecycle('Runtime message listener removal tracking failed for ' + GetLifecycleDescriptor() + ': ' + e);
            }

            return result;
        };

        module.cesStopRuntimeMessageListenerCapture = function(stopReason) {

            if (!capture.active) {
                return false;
            }

            capture.depth--;
            if (capture.depth > 0) {
                return false;
            }

            if (window.addEventListener === capture.addEventListenerWrapper) {
                window.addEventListener = capture.originalAddEventListener;
            } else {
                LogLifecycle('Runtime addEventListener wrapper was not current during cleanup for ' + GetLifecycleDescriptor() + '; leaving current handler untouched.');
            }

            if (window.removeEventListener === capture.removeEventListenerWrapper) {
                window.removeEventListener = capture.originalRemoveEventListener;
            } else {
                LogLifecycle('Runtime removeEventListener wrapper was not current during cleanup for ' + GetLifecycleDescriptor() + '; leaving current handler untouched.');
            }

            capture.active = false;
            module.cesRuntimeMessageListenerCapture = null;
            LogLifecycle('Stopped runtime message listener capture for ' + GetLifecycleDescriptor() + '; reason=' + (stopReason || 'cleanup'));
            return true;
        };

        module.cesRuntimeMessageListenerCapture = capture;
        window.addEventListener = capture.addEventListenerWrapper;
        window.removeEventListener = capture.removeEventListenerWrapper;

        LogLifecycle('Started runtime message listener capture for ' + GetLifecycleDescriptor() + '; reason=' + (reason || 'emulator runtime startup'));
    };

    var StopRuntimeMessageListenerCapture = function(module, reason, removeListeners) {

        if (!module) {
            return;
        }

        if (removeListeners && typeof module.cesRemoveTrackedRuntimeMessageListeners === 'function') {
            try {
                module.cesRemoveTrackedRuntimeMessageListeners(reason || 'runtime listener cleanup');
            } catch (e) {
                LogLifecycle('Failed while removing tracked runtime message listeners for ' + GetLifecycleDescriptor() + ': ' + e);
            }
        }

        if (typeof module.cesStopRuntimeMessageListenerCapture === 'function') {
            try {
                module.cesStopRuntimeMessageListenerCapture(reason || 'runtime listener cleanup');
            } catch (e2) {
                LogLifecycle('Failed while stopping runtime message listener capture for ' + GetLifecycleDescriptor() + ': ' + e2);
            }
        }
    };

    var RejectEmulatorScriptLoad = function(module, deffered, error, reason, removeTrackedListeners) {

        StopRuntimeMessageListenerCapture(module, reason || 'emulator script load failed', !!removeTrackedListeners);
        deffered.reject(error);
    };

    var GetLifecycleDescriptor = function() {

        var system = _gameKey && _gameKey.system ? _gameKey.system : 'unknown';
        var extension = 'unknown';
        var script = 'unknown';

        if (_config.systemdetails && _config.systemdetails[system]) {
            extension = _config.systemdetails[system].emuextention || extension;
            script = _config.systemdetails[system].emuscript || script;
        }

        return 'system=' + system + ', extension=' + extension + ', script=' + script +
            (_gameKey && _gameKey.title ? ', title=' + _gameKey.title : '') +
            (_activeContentFile ? ', file=' + _activeContentFile : (_gameKey && _gameKey.file ? ', file=' + _gameKey.file : ''));
    };

    var RunLifecycleCallbacks = function(callbacks, context) {

        var i;

        for (i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i]();
            } catch (e) {
                LogLifecycle(context + ' callback failed: ' + e);
            }
        }
    };

    this.GetLifecycleDiagnostics = function() {

        var system = _gameKey && _gameKey.system ? _gameKey.system : 'unknown';
        var extension = 'unknown';
        var script = 'unknown';

        if (_config.systemdetails && _config.systemdetails[system]) {
            extension = _config.systemdetails[system].emuextention || extension;
            script = _config.systemdetails[system].emuscript || script;
        }

        return {
            system: system,
            extension: extension,
            script: script,
            title: _gameKey ? _gameKey.title : null,
            file: _activeContentFile || (_gameKey ? _gameKey.file : null),
            contentPath: _activeContentPath,
            loading: _isLoading,
            pausedByOverlay: _isPaused,
            emulatorPaused: _isEmulatorPaused,
            muted: _isMuted,
            hasEmulationBegin: _hasEmulationBegin,
            gracefulExitInProgress: _gracefulExitInProgress,
            cleanupInProgress: _cleanupInProgress,
            cleanupComplete: _cleanupComplete,
            moduleAvailable: !!_Module,
            emulatorInstanceAvailable: !!_EmulatorInstance,
            inputHelperAvailable: !!self._InputHelper,
            inputHelperDisposed: !!(self._InputHelper && typeof self._InputHelper.IsDisposed === 'function' && self._InputHelper.IsDisposed())
        };
    };

    var AddUniqueValue = function(list, value) {

        if (!value) {
            return;
        }

        value = String(value);

        if ($.inArray(value, list) === -1) {
            list.push(value);
        }
    };

    var GetBasename = function(path) {

        if (!path) {
            return null;
        }

        path = String(path);
        return path.replace(/\\/g, '/').split('/').pop();
    };

    var StripRomExtension = function(filename) {

        var basename = GetBasename(filename);

        if (!basename) {
            return null;
        }

        return basename.replace(/\.[a-z0-9]{1,8}$/i, '');
    };

    var NormalizeStartupStateFileCandidate = function(candidate) {

        if (!candidate) {
            return null;
        }

        candidate = String(candidate).replace(/\\/g, '/');

        if (candidate.indexOf('/states/') === 0) {
            candidate = candidate.substr('/states'.length);
        }

        while (candidate.length > 1 && candidate.charAt(0) === '/' && candidate.charAt(1) === '/') {
            candidate = candidate.substr(1);
        }

        if (candidate.charAt(0) !== '/') {
            candidate = '/' + candidate;
        }

        return candidate;
    };

    var AddUniqueStartupStateCandidate = function(candidates, candidate) {

        candidate = NormalizeStartupStateFileCandidate(candidate);

        if (!candidate) {
            return;
        }

        AddUniqueValue(candidates, candidate);
    };

    var BuildDefaultStartupStateFileCandidates = function() {

        var stateBasenames = [];
        var candidates = [];
        var i;

        AddUniqueValue(stateBasenames, StripRomExtension(_gameKey.file));
        AddUniqueValue(stateBasenames, StripRomExtension(_activeContentFile));
        AddUniqueValue(stateBasenames, StripRomExtension(_activeContentPath));

        for (i = 0; i < stateBasenames.length; i++) {
            AddUniqueStartupStateCandidate(candidates, '/' + stateBasenames[i] + '.state');
        }

        return candidates;
    };

    var BuildStartupStateFileCandidates = function() {

        var candidates = BuildDefaultStartupStateFileCandidates();
        var emulatorCandidates;

        if (_Module && typeof _Module.cesGetStartupStateFileCandidates === 'function') {
            try {
                emulatorCandidates = _Module.cesGetStartupStateFileCandidates({
                    system: _gameKey.system,
                    gameFile: _gameKey.file,
                    activeContentFile: _activeContentFile,
                    activeContentPath: _activeContentPath,
                    defaultCandidates: candidates.slice(0)
                });

                if (emulatorCandidates && emulatorCandidates.length) {
                    $.each(emulatorCandidates, function(index, candidate) {
                        AddUniqueStartupStateCandidate(candidates, candidate);
                    });
                }
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Unable to get emulator-specific startup state candidates: ' + e);
            }
        }

        return candidates;
    };

    // public methods

    this.IsAudioMuted = function() {
        return _isMuted;
    };

    this.IsEmulatorPaused = function() {
        return _isEmulatorPaused;
    };

    this.PrepareStartupStateAudioMute = function(reason) {

        var result = {
            prepared: false,
            reason: 'emulator startup audio mute hook unavailable'
        };

        if (_Module && typeof _Module.cesPrepareStartupStateAudioMute === 'function') {
            try {
                result = _Module.cesPrepareStartupStateAudioMute(reason) || result;
            } catch (e) {
                result = {
                    prepared: false,
                    reason: 'emulator startup audio mute hook failed: ' + e
                };
                _Logging.Console('cesEmulatorBase', result.reason);
            }
        }

        if (result && result.prepared) {
            _isMuted = true;
            _Logging.Console('cesEmulatorBase', 'Marked emulator audio muted before startup state-load sequence' + (reason ? ': ' + reason : ''));
        }

        return result;
    };

    this.ReleaseStartupStateAudioMute = function(reason) {

        var result = {
            released: false,
            reason: 'emulator startup audio mute release hook unavailable'
        };

        if (_Module && typeof _Module.cesReleaseStartupStateAudioMute === 'function') {
            try {
                result = _Module.cesReleaseStartupStateAudioMute(reason) || result;
            } catch (e) {
                result = {
                    released: false,
                    reason: 'emulator startup audio mute release hook failed: ' + e
                };
                _Logging.Console('cesEmulatorBase', result.reason);
            }
        }

        if (result && result.released) {
            _isMuted = false;
            _Logging.Console('cesEmulatorBase', 'Marked emulator audio unmuted after startup state-load sequence' + (reason ? ': ' + reason : ''));
        }

        return result;
    };

    this.RecoverStartupStateLoadFailure = function(reason) {

        if (_isLoadingState) {
            _Logging.Console('cesEmulatorBase', 'Clearing pending startup state-load flag after recovery: ' + reason);
            _isLoadingState = false;
        }
    };
    
    this.SetActiveContentFile = function(filename, path) {

        if (filename) {
            _activeContentFile = filename;
        }

        if (path) {
            _activeContentPath = path;
        }

        _Logging.Console('cesEmulatorBase', 'Active emulator content for state lookup: file=' + (_activeContentFile || '(none)') + ', path=' + (_activeContentPath || '(none)') + ', stateCandidates=' + BuildStartupStateFileCandidates().join(', '));
    };

    this.GetStartupStateDiagnostics = function() {

        return {
            gameFile: _gameKey.file,
            activeContentFile: _activeContentFile,
            activeContentPath: _activeContentPath,
            candidates: BuildStartupStateFileCandidates(),
            lastWrite: _lastStartupStateWrite,
            lastLoadSignal: _lastStartupStateLoadSignal,
            lastLoadFailure: _lastStartupStateLoadFailure,
            hasStateToLoad: _hasStateToLoad,
            isLoadingState: _isLoadingState,
            isSavingState: _isSavingState,
            isMuted: _isMuted,
            isEmulatorPaused: _isEmulatorPaused
        };
    };

    this.AttemptStartupStateLoadCommand = function(context) {

        context = context || {};
        context.stateCandidates = BuildStartupStateFileCandidates();
        context.lastStartupStateWrite = _lastStartupStateWrite;
        context.hasStateToLoad = _hasStateToLoad;
        context.isLoadingState = _isLoadingState;

        if (_Module && typeof _Module.cesAttemptStartupStateLoadCommand === 'function') {
            return _Module.cesAttemptStartupStateLoadCommand(context);
        }

        _Logging.Console('cesEmulatorBase', 'No emulator-specific startup state-load command helper is available');
        return null;
    };

    this.IsStartupReadyForCommands = function() {

        if (_Module && typeof _Module.cesIsStartupReadyForCommands === 'function') {
            try {
                return !!_Module.cesIsStartupReadyForCommands();
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Emulator readiness helper failed: ' + e);
            }
        }

        return false;
    };

    this.GetStartupReadinessDiagnostics = function() {

        if (_Module && typeof _Module.cesGetStartupReadinessDiagnostics === 'function') {
            try {
                return _Module.cesGetStartupReadinessDiagnostics();
            } catch (e) {
                return { error: String(e) };
            }
        }

        return null;
    };

    this.OnEmulatorStateLoadComplete = function(source, detail) {

        _lastStartupStateLoadSignal = {
            source: source || 'unknown',
            detail: detail || null,
            timestamp: Date.now()
        };

        _Logging.Console('cesEmulatorBase', 'Observed emulator state-load completion signal from ' + _lastStartupStateLoadSignal.source);
        _PubSub.Publish('stateRead', [_lastStartupStateLoadSignal.source, detail || null]);
        OnStateLoaded();
    };

    this.OnEmulatorStateLoadFailed = function(source, detail) {

        _lastStartupStateLoadFailure = {
            source: source || 'unknown',
            detail: detail || null,
            timestamp: Date.now()
        };

        if (_isLoadingState) {
            _isLoadingState = false;
        }

        _Logging.Console('cesEmulatorBase', 'Observed emulator state-load failure signal from ' + _lastStartupStateLoadFailure.source);
        _PubSub.Publish('stateLoadFailed', [_lastStartupStateLoadFailure.source, detail || null]);
    };

    /**
     * Calls the start function of the emulator script
     * @param {Function} callback the function to handle exceptions thrown by the emulator script
     */
    this.StartEmulator = function(callback) {

        try {
            if (_Module && typeof _Module.cesBeforeEmulatorMain === 'function') {
                _Module.cesBeforeEmulatorMain(_ui);
            } else if (_Module && typeof _Module.cesPrepareCanvas === 'function') {
                _Logging.Console('cesEmulatorBase', 'Preparing emulator canvas before callMain');
                _Module.cesPrepareCanvas('before callMain');
            }

            _Logging.Console('cesEmulatorBase', 'Calling emulator main with arguments: ' + (_Module.arguments || []).join(' '));
            _Module.callMain(_Module.arguments);

            if (_Module && typeof _Module.cesAfterEmulatorMainStarted === 'function') {
                _Module.cesAfterEmulatorMainStarted(_ui);
            }
        
        } catch (e) {
            if (callback) {
                return callback(e);
            }
        }

        //pub subs
        _PubSub.Subscribe('saveready', self, OnNewSaveSubscription);
    };

    /**
     * Load all components necssary for game to run
     * @param {Object} module   from the emulator extention, this custom made module is extended to the emulators "module"
     * @param {string} shader   a shader selection or pre-defined
     * @param {Object} deffered when complete
     */
    this.Load = function(module, shader, loadSupportFiles, deffered) {

        var emulatorLoadComplete = $.Deferred();
        var supportLoadComplete = $.Deferred();
        var gameLoadComplete = $.Deferred();
        var shaderLoadComplete = $.Deferred();

        _isLoading = true;

        //loading technique 1 -> emulator first

        LoadEmulatorScript(_gameKey.system, module, emulatorLoadComplete);
        
        $.when(emulatorLoadComplete).done(function(a, b, c) {
            
            var emulator = [a,b,c]; //combine as it were

            LoadSupportFiles(_gameKey.system, loadSupportFiles, supportLoadComplete);
            LoadGame(gameLoadComplete);
            LoadShader(shader, shaderLoadComplete);

            $.when(emulatorLoadComplete, supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(emulator, support, game, shader) {
                
                _isLoading = false;
                OnAllLoadsComplete(emulator, support, game, shader, function(success) {
                    if (success === false) {
                        deffered.reject('Emulator local filesystem build failed');
                        return;
                    }
                    deffered.resolve(true);
                });
            });
        });

        //loading technique 2 -> everything all at once

        // LoadEmulatorScript(_ProgressBar, _gameKey.system, module, emulatorFileSize, emulatorLoadComplete);
        // LoadSupportFiles(_ProgressBar, _gameKey.system, supportFileSize, supportLoadComplete);
        // LoadGame(_ProgressBar, filesize, gameLoadComplete);
        // LoadShader(_ProgressBar, shader, shaderFileSize, shaderLoadComplete);
        
        // $.when(emulatorLoadComplete, supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(emulator, support, game, shader) {

        //     _isLoading = false;
        //     OnAllLoadsComplete(emulator, support, game, shader);
        //     deffered.resolve(true);
        // });
    };

    this.WriteSaveData = function(timeStamp, callback) {

        var finishCallback = function(result) {
            if (callback) {
                callback(result);
            }
        };

        //if null, we want to inform the loading process can continue with a load
        if (timeStamp) {

            _Logging.Console('cesEmulatorBase', 'Preparing startup save-state data for timestamp ' + timeStamp + ' on ' + _gameKey.system + '/' + _gameKey.file);

            _SavesManager.GetState(timeStamp, function(err, stateData) {
                var statefilenames;
                var pending;
                var successes = [];
                var failures = [];
                var finished = false;

                if (err) {
                    _Logging.Console('cesEmulatorBase', 'Unable to retrieve startup save-state data for timestamp ' + timeStamp + ': ' + err);
                    finishCallback(false);
                    return;
                }

                statefilenames = BuildStartupStateFileCandidates();

                if (!statefilenames.length) {
                    _Logging.Console('cesEmulatorBase', 'Unable to determine startup save-state filename candidates for ' + _gameKey.system + '/' + _gameKey.file);
                    finishCallback(false);
                    return;
                }

                pending = statefilenames.length;
                _Logging.Console('cesEmulatorBase', 'Writing startup save-state data to candidate file(s): /states' + statefilenames.join(', /states') + ' (' + (stateData && stateData.length ? stateData.length : 0) + ' bytes)');

                var finalizeIfDone = function() {
                    if (pending > 0 || finished) {
                        return;
                    }

                    finished = true;
                    _hasStateToLoad = successes.length > 0;
                    _lastStartupStateWrite = {
                        timestamp: timeStamp,
                        bytes: (stateData && stateData.length ? stateData.length : 0),
                        candidates: statefilenames.slice(0),
                        successes: successes.slice(0),
                        failures: failures.slice(0)
                    };

                    _Logging.Console('cesEmulatorBase', 'Startup save-state write complete; successCount=' + successes.length + ', failureCount=' + failures.length + ', candidates=' + statefilenames.join(', '));
                    finishCallback(_hasStateToLoad); //true indicating there is a state to load now
                };

                var completeCandidate = function(statefilename, result, reason) {
                    if (result === false) {
                        failures.push(statefilename + (reason ? ' (' + reason + ')' : ''));
                    } else {
                        successes.push(statefilename);
                    }

                    _Logging.Console('cesEmulatorBase', 'Startup save-state candidate write completed for /states' + statefilename + '; result=' + (result !== false) + (reason ? '; reason=' + reason : ''));
                    pending--;
                    finalizeIfDone();
                };

                $.each(statefilenames, function(index, statefilename) {
                    var candidateFinished = false;
                    var timeout = setTimeout(function() {
                        if (candidateFinished) {
                            return;
                        }
                        candidateFinished = true;
                        completeCandidate(statefilename, false, 'write callback timeout');
                    }, _startupStateWriteTimeout);

                    var completeOnce = function(result, reason) {
                        if (candidateFinished) {
                            return;
                        }

                        candidateFinished = true;
                        clearTimeout(timeout);
                        completeCandidate(statefilename, result, reason);
                    };

                    try {
                        _Module.cesWriteFile('/states', statefilename, stateData, function(result) {
                            completeOnce(result, null);
                        });
                    } catch (e) {
                        completeOnce(false, e);
                    }
                });
            });
        }
        else {
            _Logging.Console('cesEmulatorBase', 'No startup save-state timestamp supplied; no state file written');
            finishCallback(false); //false indicating there is not a save to load
            return;
        }
    };

    this.PauseGame = function() {
        if (_Module && !_isPaused) {
            
            self.GiveEmulatorControlOfInput(false);
            
            //if making a save during pause
            if (_isSavingState) {
                
                //mute these subscriptions
                _PubSub.Mute('screenshotWritten');
                _PubSub.Mute('stateWritten');
                
                //notification of save pause
                _PubSub.Publish('notification', ['Saving Paused', 1, true, false]);
            }

            //finally mute any notes
             _PubSub.Mute('notification');

            _Module.pauseMainLoop();
            _isPaused = true;
        }
    };

    this.ResumeGame = function() {
        if (_Module && _isPaused) {

            self.GiveEmulatorControlOfInput(true);
            _Module.resumeMainLoop();
            _isPaused = false;

            _PubSub.Unmute('notification');

            //if saving was in progress, unmute
            if (_isSavingState) {
                
                _PubSub.Unmute('screenshotWritten');
                _PubSub.Unmute('stateWritten');

                //again show saving note, 1 priority replaces "paused" doesnt matter if auto or not really
                _PubSub.Publish('notification', ['Saving Game Progress...', 1, true, true]); //1 priority intentional
            }
        }
    };

    var GetEmulatorPauseOverlay = function() {
        return $('#emulatorwrapperoverlay');
    };

    var IsRuntimeGamepadConfigurationShimVisible = function() {
        var $overlay = GetEmulatorPauseOverlay();
        return !!($overlay.length && $overlay.hasClass(_runtimeGamepadConfigurationShimClass) && $overlay.is(':visible'));
    };

    var ShowRuntimeGamepadConfigurationShim = function() {
        try {
            GetEmulatorPauseOverlay()
                .stop(true, true)
                .addClass(_runtimeGamepadConfigurationShimClass)
                .show();
        } catch (ignoreShowShim) {}
    };

    var HideEmulatorPauseOverlay = function() {
        try {
            GetEmulatorPauseOverlay()
                .stop(true, true)
                .removeClass(_runtimeGamepadConfigurationShimClass)
                .hide();
        } catch (ignoreHideOverlay) {}
    };

    var SuppressPauseOnBlurForFullscreenTransition = function(reason, durationMs) {

        var duration = Math.max(250, parseInt(durationMs, 10) || 1800);

        _fullscreenTransitionBlurSuppressUntil = Date.now() + duration;
        _fullscreenTransitionBlurSuppressReason = reason || 'fullscreen transition';

        if (_Module && typeof _Module.cesSuppressAutoPauseFor === 'function') {
            try {
                _Module.cesSuppressAutoPauseFor(duration, _fullscreenTransitionBlurSuppressReason);
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Unable to forward fullscreen transition blur suppression to emulator module: ' + e);
            }
        }

        _Logging.Console('cesEmulatorBase', 'Suppressing canvas blur auto-pause for ' + duration + 'ms during ' + _fullscreenTransitionBlurSuppressReason);
    };

    var IsFullscreenTransitionBlurSuppressed = function() {

        return Date.now() < _fullscreenTransitionBlurSuppressUntil;
    };

    var IsRuntimeGamepadConfigurationFocusFenceActive = function() {
        if (_runtimeGamepadConfigurationFocusFence) {
            return true;
        }

        if (_Module && typeof _Module.cesIsRuntimeGamepadConfigurationUiActive === 'function') {
            try {
                return !!_Module.cesIsRuntimeGamepadConfigurationUiActive();
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Unable to read runtime gamepad configuration UI fence state: ' + e);
            }
        }

        return false;
    };

    var RevokeEmulatorInputForRuntimeGamepadConfiguration = function(reason) {
        if (_runtimeGamepadConfigurationInputRevoked) {
            return;
        }

        try {
            self.GiveEmulatorControlOfInput(false);
            _runtimeGamepadConfigurationInputRevoked = true;
            LogLifecycle('Revoked emulator keyboard input for runtime gamepad configuration' + (reason ? ': ' + reason : ''));
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Unable to revoke emulator input for runtime gamepad configuration: ' + e);
        }
    };

    var RestoreEmulatorInputAfterRuntimeGamepadConfiguration = function(reason) {
        if (!_runtimeGamepadConfigurationInputRevoked) {
            return;
        }

        _runtimeGamepadConfigurationInputRevoked = false;

        if (_cleanupInProgress || _cleanupComplete) {
            return;
        }

        try {
            self.GiveEmulatorControlOfInput(true);
            LogLifecycle('Restored emulator keyboard input after runtime gamepad configuration' + (reason ? ': ' + reason : ''));
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Unable to restore emulator input after runtime gamepad configuration: ' + e);
        }
    };

    var BeginRuntimeGamepadConfigurationTransaction = function(context) {
        var $dialogs = $('#dialogs');
        var $wrapper = $(_ui.wrapper);

        context = context || {};
        _runtimeGamepadConfigurationFocusFence = true;

        if (_runtimeGamepadConfigurationLayoutRestoreTimer) {
            clearTimeout(_runtimeGamepadConfigurationLayoutRestoreTimer);
            _runtimeGamepadConfigurationLayoutRestoreTimer = null;
        }

        if (!_runtimeGamepadConfigurationLayout) {
            _runtimeGamepadConfigurationLayout = {
                dialogsHeight: $dialogs.length ? Math.ceil($dialogs.outerHeight()) : null,
                dialogsInlineHeight: ($dialogs.length && $dialogs[0]) ? $dialogs[0].style.height : '',
                wrapperInlineHeight: ($wrapper.length && $wrapper[0]) ? $wrapper[0].style.height : '',
                wrapperInlineMinHeight: ($wrapper.length && $wrapper[0]) ? $wrapper[0].style.minHeight : '',
                startedAt: Date.now()
            };
        }

        if ($dialogs.length) {
            $dialogs
                .addClass('ces-runtime-gamepad-configure-active')
                .data('ces-runtime-gamepad-configure-base-height', _runtimeGamepadConfigurationLayout.dialogsHeight || $dialogs.outerHeight());
        }

        if ($wrapper.length) {
            $wrapper.addClass('ces-runtime-gamepad-configure-active');
        }

        // If the normal CES focus overlay already slipped in before the pre-click fence,
        // clear that UI pause before the runtime configuration flow takes ownership and
        // applies an explicit RetroArch pause command.
        if (_isPaused) {
            try {
                self.ResumeGame();
            } catch (resumeOverlayError) {
                _Logging.Console('cesEmulatorBase', 'Unable to clear existing overlay pause before runtime gamepad configuration: ' + resumeOverlayError);
            }
        }

        RevokeEmulatorInputForRuntimeGamepadConfiguration(context.reason || 'runtime gamepad configuration focus fence');
        HideEmulatorPauseOverlay();

        if (_Module && typeof _Module.cesBeginRuntimeGamepadConfigurationUi === 'function') {
            try {
                _Module.cesBeginRuntimeGamepadConfigurationUi(context.reason || 'runtime gamepad configuration focus fence');
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Runtime gamepad configuration UI fence hook failed: ' + e);
            }
        }

        if (_isEmulatorPaused) {
            ShowRuntimeGamepadConfigurationShim();
        }

        return true;
    };

    var EndRuntimeGamepadConfigurationTransaction = function(context) {
        var $dialogs = $('#dialogs');
        var $wrapper = $(_ui.wrapper);
        var layout = _runtimeGamepadConfigurationLayout;
        var restoreHeight = layout && layout.dialogsHeight ? layout.dialogsHeight : null;

        context = context || {};

        if (_Module && typeof _Module.cesEndRuntimeGamepadConfigurationUi === 'function') {
            try {
                _Module.cesEndRuntimeGamepadConfigurationUi(context.reason || 'runtime gamepad configuration focus fence ended');
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Runtime gamepad configuration UI fence cleanup hook failed: ' + e);
            }
        }

        _runtimeGamepadConfigurationFocusFence = false;
        _runtimeGamepadConfigurationLayout = null;

        HideEmulatorPauseOverlay();

        if ($wrapper.length) {
            $wrapper.removeClass('ces-runtime-gamepad-configure-active');

            if ($wrapper[0] && layout) {
                $wrapper[0].style.height = layout.wrapperInlineHeight || '';
                $wrapper[0].style.minHeight = layout.wrapperInlineMinHeight || '';
            }
        }

        if ($dialogs.length) {
            $dialogs
                .removeClass('ces-runtime-gamepad-configure-active')
                .removeData('ces-runtime-gamepad-configure-base-height');

            if (restoreHeight) {
                $dialogs.stop(true, true).animate({
                    height: restoreHeight
                }, {
                    duration: 250,
                    easing: 'swing'
                });
            }
            else if ($dialogs[0] && layout) {
                $dialogs[0].style.height = layout.dialogsInlineHeight || '';
            }
        }

        _runtimeGamepadConfigurationLayoutRestoreTimer = setTimeout(function() {
            _runtimeGamepadConfigurationLayoutRestoreTimer = null;
            HideEmulatorPauseOverlay();
        }, 0);

        RestoreEmulatorInputAfterRuntimeGamepadConfiguration(context.reason || 'runtime gamepad configuration ended');

        return true;
    };

    var NormalizeRuntimePauseBridgeResult = function(result, shouldPause, fallbackReason) {
        if (result === true) {
            return {
                ok: true,
                paused: !!shouldPause,
                reason: fallbackReason || 'runtime gamepad configuration pause bridge returned true'
            };
        }

        if (result && typeof result === 'object') {
            if (typeof result.ok === 'undefined') {
                result.ok = true;
            }
            if (typeof result.paused === 'undefined') {
                result.paused = !!shouldPause;
            }
            return result;
        }

        return {
            ok: false,
            paused: !shouldPause,
            reason: fallbackReason || 'runtime gamepad configuration pause bridge returned false'
        };
    };

    var SetRetroArchRuntimeConfigurationPause = function(shouldPause, reason, callback) {
        var method = shouldPause ? 'cesPauseForRuntimeGamepadConfiguration' : 'cesResumeForRuntimeGamepadConfiguration';
        var result;

        callback = (typeof callback === 'function') ? callback : function() {};

        if (!_Module || typeof _Module[method] !== 'function') {
            result = NormalizeRuntimePauseBridgeResult(false, shouldPause, 'RetroArch runtime pause hook unavailable');
            callback(result);
            return false;
        }

        try {
            result = NormalizeRuntimePauseBridgeResult(_Module[method](reason || 'runtime gamepad configuration'), shouldPause, 'RetroArch runtime pause hook completed');
        } catch (e) {
            result = NormalizeRuntimePauseBridgeResult(false, shouldPause, 'RetroArch runtime pause hook failed: ' + e);
            _Logging.Console('cesEmulatorBase', result.reason);
            callback(result);
            return false;
        }

        if (result.ok) {
            _isEmulatorPaused = !!shouldPause;

            if (shouldPause && IsRuntimeGamepadConfigurationFocusFenceActive()) {
                ShowRuntimeGamepadConfigurationShim();
            }
            else {
                HideEmulatorPauseOverlay();
            }
        }

        callback(result);
        return !!result.ok;
    };

    var BeginRuntimeGamepadActivation = function(reason) {
        if (!_GamePad || typeof _GamePad.BeginRuntimeGamepadActivation !== 'function') {
            return;
        }

        try {
            _GamePad.BeginRuntimeGamepadActivation({
                gameKey: _gameKey,
                maxControllers: 2,
                reason: reason || 'emulator ready',
                bridge: {
                    focusEmulator: function() {
                        if (_ui && _ui.canvas && _ui.canvas.length) {
                            _ui.canvas.focus();
                        }
                    },
                    dispatchGamepadEventToRetroArch: function(type, gamepad, dispatchReason) {
                        if (_Module && typeof _Module.cesDispatchGamepadEventForRetroArch === 'function') {
                            return _Module.cesDispatchGamepadEventForRetroArch(type, gamepad, dispatchReason || 'runtime gamepad activation');
                        }
                        return false;
                    },
                    beginRuntimeGamepadConfiguration: function(context) {
                        return BeginRuntimeGamepadConfigurationTransaction(context || {});
                    },
                    endRuntimeGamepadConfiguration: function(context) {
                        return EndRuntimeGamepadConfigurationTransaction(context || {});
                    },
                    pauseEmulationForRuntimeConfiguration: function(callback, pauseReason) {
                        return SetRetroArchRuntimeConfigurationPause(true, pauseReason || 'runtime gamepad configuration pause', callback);
                    },
                    resumeEmulationForRuntimeConfiguration: function(callback, pauseReason) {
                        return SetRetroArchRuntimeConfigurationPause(false, pauseReason || 'runtime gamepad configuration resume', callback);
                    },
                    simulatePauseToggle: function(callback, pauseReason) {
                        var shouldPause = !_isEmulatorPaused;
                        return SetRetroArchRuntimeConfigurationPause(shouldPause, pauseReason || 'runtime gamepad configuration pause toggle compatibility', callback);
                    },
                    isEmulatorPaused: function() {
                        return !!_isEmulatorPaused;
                    },
                    isInputActive: function() {
                        return !!(_hasEmulationBegin && !_isPaused && !_cleanupInProgress && !_cleanupComplete);
                    }
                }
            });
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Unable to begin runtime gamepad activation: ' + e);
        }
    };

    var EndRuntimeGamepadActivation = function(reason) {
        if (!_GamePad || typeof _GamePad.EndRuntimeGamepadActivation !== 'function') {
            return;
        }

        try {
            _GamePad.EndRuntimeGamepadActivation(reason || 'emulator cleanup');
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Unable to end runtime gamepad activation: ' + e);
        }
    };

    this.SuppressPauseOnBlurForFullscreenTransition = function(reason, durationMs) {

        SuppressPauseOnBlurForFullscreenTransition(reason || 'fullscreen transition', durationMs);
        return true;
    };

    this.ResumeAudioForFullscreenTransition = function(reason) {

        var audioContext = _Module && _Module.RA ? _Module.RA.context : null;
        var resumeResult;

        if (!audioContext || typeof audioContext.resume !== 'function') {
            return { resumed: false, reason: 'audio context unavailable' };
        }

        if (audioContext.state && audioContext.state !== 'suspended') {
            return { resumed: false, state: audioContext.state, reason: 'audio context is not suspended' };
        }

        if (!audioContext.state) {
            return { resumed: false, reason: 'audio context state unavailable' };
        }

        try {
            resumeResult = audioContext.resume();
            _Logging.Console('cesEmulatorBase', 'Requested suspended WebAudio context resume after ' + (reason || 'fullscreen transition'));

            if (resumeResult && typeof resumeResult.then === 'function') {
                resumeResult.then(function() {
                    _Logging.Console('cesEmulatorBase', 'WebAudio context resume completed after ' + (reason || 'fullscreen transition'));
                }, function(error) {
                    _Logging.Console('cesEmulatorBase', 'WebAudio context resume rejected after ' + (reason || 'fullscreen transition') + ': ' + error);
                });
            }

            return { resumed: true, state: audioContext.state || null };
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'WebAudio context resume failed after ' + (reason || 'fullscreen transition') + ': ' + e);
            return { resumed: false, error: String(e) };
        }
    };

    //emulator is revealed, control is given to player
    this.ReadyPlayerOne = function (duration, callback) {

        if (typeof duration === 'function') {
            callback = duration;
            duration = _displayDurationShow;
        }

        duration = duration || _displayDurationShow;

        var onEmulatorVisible = function() {

            self.GiveEmulatorControlOfInput(true);

            //attach operation handlers
            AttachOperationHandlers();

            _hasEmulationBegin = true;

            //give focus
            _ui.canvas.focus();

            BeginRuntimeGamepadActivation('emulator visible');

            //define operations on blur/focus next
            _ui.canvas
                .blur(function(event) {
                    if (IsRuntimeGamepadConfigurationFocusFenceActive()) {
                        if (!IsRuntimeGamepadConfigurationShimVisible()) {
                            HideEmulatorPauseOverlay();
                        }
                        _Logging.Console('cesEmulatorBase', 'Suppressed CES pause overlay while runtime gamepad configuration owns focus.');
                        return;
                    }

                    if (IsFullscreenTransitionBlurSuppressed()) {
                        HideEmulatorPauseOverlay();
                        _Logging.Console('cesEmulatorBase', 'Suppressed CES pause overlay during fullscreen transition blur (' + (_fullscreenTransitionBlurSuppressReason || 'fullscreen transition') + ')');
                        return;
                    }

                    if (_Module && typeof _Module.cesBeforeCanvasBlurPause === 'function') {
                        if (_Module.cesBeforeCanvasBlurPause(event) === false) {
                            return;
                        }
                    }

                    self.PauseGame();
                    $('#emulatorwrapperoverlay').fadeIn();
                })
                .focus(function(event) {
                    if (!IsRuntimeGamepadConfigurationFocusFenceActive()) {
                        self.ResumeGame();
                        HideEmulatorPauseOverlay();
                    }
                    else if (!IsRuntimeGamepadConfigurationShimVisible()) {
                        HideEmulatorPauseOverlay();
                    }

                    if (_Module && typeof _Module.cesAfterCanvasFocusResume === 'function') {
                        _Module.cesAfterCanvasFocusResume(event);
                    }
                });

            if (_Module && typeof _Module.cesRegisterBasePauseResumeBridge === 'function') {
                _Module.cesRegisterBasePauseResumeBridge({
                    pause: function() {
                        self.PauseGame();
                        $('#emulatorwrapperoverlay').fadeIn();
                    },
                    resume: function() {
                        self.ResumeGame();
                        $('#emulatorwrapperoverlay').hide();
                    },
                    isPaused: function() {
                        return _isPaused;
                    }
                });
            }

            if (callback) {
                callback();
            }
        };

        if (_Module && typeof _Module.cesRevealEmulatorWrapper === 'function') {
            _Module.cesRevealEmulatorWrapper(_ui, duration, onEmulatorVisible);
            return;
        }

        $(_ui.wrapper).fadeIn(duration, onEmulatorVisible);
    };

    this.Hide = function(duration, callback) {

        duration = duration || _displayDurationHide;

        //revoke input from player
        self.GiveEmulatorControlOfInput(false);

        //hide
        $(_ui.wrapper).fadeOut(_displayDurationHide, function() {

            if (callback) {
                return callback();
            }
        });
    };

    var FinishGracefulExit = function(reason) {

        var callbacks = _gracefulExitCallbacks.slice(0);
        _gracefulExitCallbacks = [];
        _gracefulExitInProgress = false;

        LogLifecycle('Graceful exit finishing for ' + GetLifecycleDescriptor() + '; reason=' + reason + ', callbacks=' + callbacks.length);

        self.CleanUp(function() {
            RunLifecycleCallbacks(callbacks, 'ExitGracefully');
        });
    };

    //ok, to exit gracefully, the game is likely already paused because the user clicked elsewhere, triggering it to be paused
    this.ExitGracefully = function(callback) {

        if (callback) {
            _gracefulExitCallbacks.push(callback);
        }

        if (_cleanupComplete) {
            var alreadyCompleteCallbacks = _gracefulExitCallbacks.slice(0);
            _gracefulExitCallbacks = [];
            LogLifecycle('ExitGracefully skipped because cleanup already completed for ' + GetLifecycleDescriptor());
            RunLifecycleCallbacks(alreadyCompleteCallbacks, 'ExitGracefully already-complete');
            return;
        }

        if (_gracefulExitInProgress) {
            LogLifecycle('ExitGracefully request joined in-progress graceful exit for ' + GetLifecycleDescriptor() + '; callbacks=' + _gracefulExitCallbacks.length);
            return;
        }

        _gracefulExitInProgress = true;
        LogLifecycle('ExitGracefully starting for ' + GetLifecycleDescriptor() + '; hasEmulationBegin=' + _hasEmulationBegin + ', pausedByOverlay=' + _isPaused + ', inputHelperAvailable=' + (!!self._InputHelper));

        if (!_hasEmulationBegin) {
            FinishGracefulExit('emulation had not begun');
            return;
        }

        if (!self._InputHelper || typeof self._InputHelper.Keypress !== 'function') {
            FinishGracefulExit('input helper unavailable before graceful exit keypresses');
            return;
        }

        //the emulator must be active to gracefully exit
        if (_isPaused) {
            LogLifecycle('ExitGracefully resuming paused emulator before shutdown for ' + GetLifecycleDescriptor());
            self.ResumeGame();
        }
        _PubSub.Mute('notification');
        LogLifecycle('ExitGracefully simulating mute keypress before shutdown for ' + GetLifecycleDescriptor());
        self._InputHelper.Keypress('mute', function() {

            //make a final auto save before exiting (removing this 11-11-2020, rethinking my auto-save stategy)
            //self.MakeAutoSave(function(err) {

                //for graceful exit to complete we will wait _timeToWaitForSrmFileOnExit secs for a srm file to be written, if not, then clean up anyway
                
                _PubSub.SubscribeOnceWithTimer('retroArchGracefulExit', self, function() {

                    //success handler, means srm file was written
                    FinishGracefulExit('retroArchGracefulExit topic observed');
                }, function() {
                    
                    //timeout handler, does the same thing really
                    FinishGracefulExit('retroArchGracefulExit timeout after ' + _timeToWaitForSrmFileOnExit + 'ms');

                }, true, _timeToWaitForSrmFileOnExit);

                //EXIT!
                LogLifecycle('ExitGracefully simulating exit keypress for ' + GetLifecycleDescriptor());
                self._InputHelper.Keypress('exit', function() {

                    _PubSub.Unmute('notification');
                    LogLifecycle('ExitGracefully exit keypress callback returned for ' + GetLifecycleDescriptor());
                
                }, [true]); //true argument says to allow the emulator to process the input
            });
        //}); 
    };

    var DisposeInputHelper = function() {

        if (!self._InputHelper) {
            return;
        }

        try {
            if (typeof self._InputHelper.Dispose === 'function') {
                LogLifecycle('Disposing input helper for ' + GetLifecycleDescriptor());
                self._InputHelper.Dispose();
                return;
            }

            if (typeof self._InputHelper.GiveEmulatorControlOfInput === 'function') {
                self._InputHelper.GiveEmulatorControlOfInput(false);
            }
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Unable to dispose input helper: ' + e);
        }
    };

    this.CleanUp = function(callback) {

        var callbacks;
        var moduleBeforeCleanUpInvoked = false;
        var moduleExitInvoked = false;
        var postExitSaveFlushDelayMs = 400;

        var InvokeModuleBeforeCleanUp = function(reason) {

            if (!_Module || moduleBeforeCleanUpInvoked) {
                return;
            }

            moduleBeforeCleanUpInvoked = true;

            try {
                if (typeof _Module.cesBeforeCleanUp === 'function') {
                    _Module.cesBeforeCleanUp(reason || 'cesEmulatorBase.CleanUp');
                }
            } catch (e) {
                LogLifecycle('Module cesBeforeCleanUp failed for ' + GetLifecycleDescriptor() + ': ' + e);
            }
        };

        var InvokeModuleExit = function(reason) {

            if (!_Module || moduleExitInvoked) {
                return;
            }

            moduleExitInvoked = true;

            //also unbinds events from document and window. this may have been done already through exit gracefully, but keep it as a sanity check
            self.GiveEmulatorControlOfInput(false);
            DisposeInputHelper();

            try {

                //calls exit on emulator ending loop. For normal cartridge saves this is important:
                //some libretro cores keep save RAM in memory until content close/runtime exit.
                if (typeof _Module.cesExit === 'function') {
                    LogLifecycle('Invoking module cesExit for ' + GetLifecycleDescriptor() + '; reason=' + (reason || 'cleanup'));
                    _Module.cesExit(); //see module class for implementation
                }
                else {
                    LogLifecycle('Module cesExit unavailable during cleanup for ' + GetLifecycleDescriptor());
                }

            } catch (e2) {
                LogLifecycle('Module cesExit threw during cleanup for ' + GetLifecycleDescriptor() + ': ' + e2);
            }
        };

        var CompleteCleanupAfterSavePersistence = function() {

            RemoveSaveFilePageLifecycleHandlers();

            //since each Module attached an event to the parent document, we need to clean those up too:
            $(document).unbind('fullscreenchange');
            $(document).unbind('mozfullscreenchange');
            $(document).unbind('webkitfullscreenchange');
            $(document).unbind('MSFullscreenChange');

            $(document).unbind('pointerlockchange');
            $(document).unbind('mozpointerlockchange');
            $(document).unbind('webkitpointerlockchange');
            $(document).unbind('mspointerlockchange');

            //important! tear down all topics subscribed in this class otherwise the handlers will remain and fire on the next instance of emulator
            _PubSub.Unsubscribe('saveready');
            _PubSub.Unsubscribe('screenshotWritten');
            _PubSub.Unsubscribe('stateWritten');

            _isSavingState = false;
            _isLoadingState = false;

            EndRuntimeGamepadActivation('emulator cleanup');

            //remove the save-state manager component from sync
            _SavesManager = null;
            _Sync.DeregisterComponent('s');

            StopNormalSaveMonitor();

            if (_SaveFilesManager && typeof _SaveFilesManager.Stop === 'function') {
                _SaveFilesManager.Stop();
            }
            _SaveFilesManager = null;

            EndRuntimeGamepadConfigurationTransaction({ reason: 'emulator cleanup' });
            RestoreEmulatorInputAfterRuntimeGamepadConfiguration('emulator cleanup');
            $('#emulatorwrapperoverlay').hide(); //ensure pause is hidden for next game

            if (_Module) {

                InvokeModuleBeforeCleanUp('cesEmulatorBase.CleanUp final cleanup');
                InvokeModuleExit('cesEmulatorBase.CleanUp final cleanup');

                StopRuntimeMessageListenerCapture(_Module, 'cesEmulatorBase.CleanUp after module exit', true);

                //we need to manually clear up the audio context
                if (_Module.RA && _Module.RA.context && _Module.RA.context.close) {
                     _Module.RA.context.close().then(function() {
                        //no need
                    });
                }

                _Module = null;
                LogLifecycle('Module reference nulled for ' + GetLifecycleDescriptor());

                if (_EmulatorInstance) {
                    _EmulatorInstance = null;
                    LogLifecycle('Emulator instance reference nulled for ' + GetLifecycleDescriptor());
                }
                
                $(_ui.canvas).remove(); //kill all events attached (keyboard, focus, etc)
            }

            DisposeInputHelper();
            self._InputHelper = null;

            _cleanupComplete = true;
            _cleanupInProgress = false;
            callbacks = _cleanupCallbacks.slice(0);
            _cleanupCallbacks = [];

            LogLifecycle('CleanUp completed for ' + GetLifecycleDescriptor() + '; callbacks=' + callbacks.length);
            RunLifecycleCallbacks(callbacks, 'CleanUp');
        };

        var ExitRuntimeThenFlushNormalSaveFiles = function() {

            FlushNormalSaveFiles('cleanup before emulator exit', function() {

                InvokeModuleBeforeCleanUp('cesEmulatorBase.CleanUp before module exit');
                InvokeModuleExit('cesEmulatorBase.CleanUp normal save persistence');

                window.setTimeout(function() {
                    FlushNormalSaveFiles('cleanup after emulator exit', CompleteCleanupAfterSavePersistence);
                }, postExitSaveFlushDelayMs);
            });
        };

        if (callback) {
            _cleanupCallbacks.push(callback);
        }

        if (_cleanupComplete) {
            callbacks = _cleanupCallbacks.slice(0);
            _cleanupCallbacks = [];
            LogLifecycle('CleanUp skipped because it was already completed for ' + GetLifecycleDescriptor() + '; callbacks=' + callbacks.length);
            RunLifecycleCallbacks(callbacks, 'CleanUp already-complete');
            return;
        }

        if (_cleanupInProgress) {
            LogLifecycle('CleanUp request joined in-progress cleanup for ' + GetLifecycleDescriptor() + '; callbacks=' + _cleanupCallbacks.length);
            return;
        }

        _cleanupInProgress = true;
        LogLifecycle('CleanUp started for ' + GetLifecycleDescriptor() + '; moduleAvailable=' + (!!_Module) + ', emulatorInstanceAvailable=' + (!!_EmulatorInstance));

        ExitRuntimeThenFlushNormalSaveFiles();
    };

    this.GiveEmulatorControlOfInput = function(giveEmulatorInput) {

        if (self._InputHelper && typeof self._InputHelper.GiveEmulatorControlOfInput === 'function') {
            self._InputHelper.GiveEmulatorControlOfInput(giveEmulatorInput);
        }
        else if (giveEmulatorInput) {
            _Logging.Console('cesEmulatorBase', 'Unable to give emulator control of input because the input helper is not available');
        }

        //also set emulator-specific event handlers on and off (see custom module def)
        if (_Module) {
            _Module.GiveEmulatorControlOfInput(giveEmulatorInput);
        }
    };

    var GetFilenameFromPath = function(path) {
        var match;

        if (!path) {
            return '';
        }

        match = String(path).replace(/\\/g, '/').match(/[^\/]+$/);
        return match ? match[0] : String(path);
    };

    var NormalizeEmulatorFileWrite = function(pathOrInfo, contents) {
        var info = {};

        if (pathOrInfo && typeof pathOrInfo === 'object' && !pathOrInfo.subarray && !pathOrInfo.byteLength) {
            info.path = pathOrInfo.path || pathOrInfo.fullPath || pathOrInfo.filename || pathOrInfo.name || '';
            info.filename = pathOrInfo.filename || pathOrInfo.name || GetFilenameFromPath(info.path);
            info.contents = pathOrInfo.contents || contents || pathOrInfo.data;
            info.relativePath = pathOrInfo.relativePath || null;
        } else {
            info.path = pathOrInfo || '';
            info.filename = GetFilenameFromPath(pathOrInfo);
            info.contents = contents;
            info.relativePath = null;
        }

        if (!info.filename) {
            info.filename = GetFilenameFromPath(info.path);
        }

        return info;
    };

    var GetNormalSaveRelativePath = function(fileWrite) {
        var relativePath = null;

        if (!fileWrite || !_Module) {
            return null;
        }

        if (fileWrite.relativePath) {
            relativePath = fileWrite.relativePath;
        }
        else if (typeof _Module.cesGetSaveFileRelativePath === 'function') {
            relativePath = _Module.cesGetSaveFileRelativePath(fileWrite.path || fileWrite.filename);
        }

        return relativePath || null;
    };

    var QueueLocalNormalSaveFlush = function(reason) {
        if (_Module && typeof _Module.cesFlushSaveFileSystem === 'function') {
            try {
                _Module.cesFlushSaveFileSystem(function(err) {
                    if (err) {
                        _Logging.Console('cesEmulatorBase', 'Normal in-game save local filesystem flush failed after ' + reason + ': ' + err);
                        NotifyNormalSaveFailure('Could not save in-game progress.', 'normalSaveFileSaveFailure');
                    }
                });
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Unable to queue normal in-game save local filesystem flush: ' + e);
            }
        }
    };

    /**
     * this function is registered with the emulator when a file is written.
     * Normal in-game save files are separate from save states and are tracked
     * by path under RetroArch's active savefile_directory.
     * @param  {string|Object} filename the file name/path or write event object
     * @param  {UInt8Array} contents the contents of the file saved by the emulator
     * @return {undef}
     */
    this.OnEmulatorFileWrite = function(filename, contents) {

        var fileWrite = NormalizeEmulatorFileWrite(filename, contents);
        var fileNameOnly = fileWrite.filename || '';
        var fileContents = fileWrite.contents || contents;
        var statematch = fileNameOnly.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)
        var screenshotmatch = fileNameOnly.match(/\.bmp$|\.png$/);
        var srammatch = fileNameOnly.match(/\.(srm|sav|eep|eeprom|flash|fla|rtc|psrm|dsv|mcr|mcd)$/i);
        var normalSaveRelativePath = GetNormalSaveRelativePath(fileWrite);

        // match will return an array when match was successful, our capture group with the slot value, its 1 index
        if (statematch) {

            _PubSub.Publish('stateWritten', [fileNameOnly, fileContents]);
            return;
        }

        if (normalSaveRelativePath && _SaveFilesManager) {
            _Logging.Console('cesEmulatorBase', 'Observed normal in-game save-file write: ' + normalSaveRelativePath + ' (' + (fileContents && fileContents.length ? fileContents.length : 0) + ' bytes)');
            _SaveFilesManager.MarkSaveFileDirty(normalSaveRelativePath, fileContents, { reason: 'emulator write' });
            QueueLocalNormalSaveFlush('emulator write');
            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var screenDataUnzipped = new Uint8Array(fileContents);

            _PubSub.Publish('screenshotWritten', [fileNameOnly, fileContents, screenDataUnzipped, _gameKey.system, _gameKey.title]);
            return;
        }

        if (srammatch && _SaveFilesManager) {

            // Defensive fallback for older wrappers that only provide the basename.
            _Logging.Console('cesEmulatorBase', 'Observed basename-only normal save-file write; treating as normal in-game save-file: ' + fileNameOnly);
            _SaveFilesManager.MarkSaveFileDirty(fileNameOnly, fileContents, { reason: 'basename normal save-file write' });
            QueueLocalNormalSaveFlush('basename normal save-file write');
            return;
        }

        if (fileNameOnly === 'retroarch.cfg') {
            _PubSub.Publish('retroArchConfigWritten', [fileContents]);
            return;
        }

        //when this file is written, its the final thing retroarch does on graneful shutdown
        if (fileNameOnly === 'retroarch-core-options.cfg') {
            _PubSub.Publish('retroArchGracefulExit', [fileContents]);
            return;
        }
    };

    this.OnEmulatorFileRead = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)

        if (statematch) {

            _Logging.Console('cesEmulatorBase', 'Observed emulator state file read: ' + filename + ' (' + (contents && contents.length ? contents.length : 0) + ' bytes)');
            _PubSub.Publish('stateRead', [filename, contents]);
            OnStateLoaded();
            return;
        }
    };

    this.OnInputIdle = function() {

        //the keys are idle while the game runs! let's auto save
        self.MakeAutoSave();
    };

    var DescribeNormalSaveFilesForLog = function(files) {
        var descriptions = [];
        var i;

        files = files || [];
        for (i = 0; i < files.length; i++) {
            if (!files[i]) {
                continue;
            }

            descriptions.push(String(files[i].relativePath || '(unknown)') + ':' + String(files[i].sizeBytes || (files[i].data && files[i].data.length) || 0) + 'b');
        }

        return descriptions.join(', ');
    };

    var GetNormalSaveScanIntervalMs = function() {
        var context = null;
        var interval = null;

        if (_SaveFilesManager && typeof _SaveFilesManager.GetContext === 'function') {
            context = _SaveFilesManager.GetContext() || {};
            interval = context.scanIntervalMs;
        }

        if ((interval === null || typeof interval === 'undefined') && _config && _config.normalSaveFiles) {
            interval = _config.normalSaveFiles.scanIntervalMs;
        }

        interval = parseInt(interval || 5000, 10);
        if (isNaN(interval) || interval < 1000) {
            interval = 5000;
        }

        return interval;
    };

    var GetNormalSaveConfigValue = function(name, defaultValue) {
        var context = null;

        if (_SaveFilesManager && typeof _SaveFilesManager.GetContext === 'function') {
            try {
                context = _SaveFilesManager.GetContext() || {};
                if (Object.prototype.hasOwnProperty.call(context, name)) {
                    return context[name];
                }
            } catch (e) {}
        }

        if (_config && _config.normalSaveFiles && Object.prototype.hasOwnProperty.call(_config.normalSaveFiles, name)) {
            return _config.normalSaveFiles[name];
        }

        return defaultValue;
    };

    var IsNormalSaveRuntimeFlushCommandEnabled = function() {
        var value = GetNormalSaveConfigValue('runtimeFlushCommandEnabled', true);

        return value !== false && value !== 'false';
    };

    var GetNormalSaveRuntimeFlushThrottleMs = function() {
        var ms = parseInt(GetNormalSaveConfigValue('runtimeFlushCommandThrottleMs', 5000), 10);

        if (isNaN(ms) || ms < 0) {
            ms = 5000;
        }

        if (ms > 60000) {
            ms = 60000;
        }

        return ms;
    };

    var GetNormalSaveRuntimeFlushSettleMs = function() {
        var ms = parseInt(GetNormalSaveConfigValue('runtimeFlushCommandSettleMs', 250), 10);

        if (isNaN(ms) || ms < 0) {
            ms = 250;
        }

        if (ms > 2000) {
            ms = 2000;
        }

        return ms;
    };

    var RequestRetroArchSaveFileFlush = function(reason, options) {
        var now = Date.now();
        var throttleMs;

        options = options || {};
        reason = reason || 'runtime save-file flush';

        if (!IsNormalSaveRuntimeFlushCommandEnabled()) {
            if (options.forceLog) {
                _Logging.Console('cesEmulatorBase', 'RetroArch SAVE_FILES request skipped because normal save runtime flush commands are disabled; reason=' + reason);
            }
            return { requested: false, reason: 'disabled' };
        }

        if (!_Module || typeof _Module.EmscriptenSendCommand !== 'function') {
            if (options.forceLog) {
                _Logging.Console('cesEmulatorBase', 'RetroArch SAVE_FILES request skipped because the runtime command interface is unavailable; reason=' + reason + ', moduleAvailable=' + (!!_Module));
            }
            return { requested: false, reason: 'command interface unavailable' };
        }

        throttleMs = GetNormalSaveRuntimeFlushThrottleMs();
        if (!options.force && throttleMs > 0 && now - _runtimeNormalSaveFlushCommandLastAt < throttleMs) {
            return { requested: false, reason: 'throttled' };
        }

        try {
            _Module.EmscriptenSendCommand('SAVE_FILES');
            _runtimeNormalSaveFlushCommandLastAt = now;
            _Logging.Console('cesEmulatorBase', 'Requested RetroArch SAVE_FILES normal in-game save flush; reason=' + reason + ', saveDirectory=' + GetActiveNormalSaveDirectoryForLog());
            return { requested: true };
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'RetroArch SAVE_FILES request failed; reason=' + reason + ': ' + e);
            return { requested: false, reason: 'command failed', error: e };
        }
    };

    var GetActiveNormalSaveDirectoryForLog = function() {
        try {
            if (_Module && typeof _Module.cesGetActiveSaveDirectory === 'function') {
                return _Module.cesGetActiveSaveDirectory();
            }
        } catch (e) {}

        return '(unknown)';
    };

    var ScanNormalSaveFiles = function(reason, options) {
        var files = [];
        var marked = 0;
        var shouldLog;

        options = options || {};
        reason = reason || 'runtime scan';

        if (!_SaveFilesManager || !_Module || typeof _Module.cesExportSaveFiles !== 'function') {
            if (options.forceLog) {
                _Logging.Console('cesEmulatorBase', 'Normal in-game save scan skipped; manager/module unavailable; reason=' + reason + ', moduleAvailable=' + (!!_Module));
            }
            return { files: [], marked: 0 };
        }

        try {
            files = _Module.cesExportSaveFiles({ quiet: !!options.quiet });
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Unable to scan normal in-game save files: ' + e + '; reason=' + reason);
            return { files: [], marked: 0, error: e };
        }

        if (files && files.length && typeof _SaveFilesManager.MarkSaveFilesDirty === 'function') {
            marked = _SaveFilesManager.MarkSaveFilesDirty(files, reason);
        }

        shouldLog = options.forceLog || marked > 0 || (files && files.length && !options.quiet);
        if (shouldLog) {
            _Logging.Console('cesEmulatorBase', 'Normal in-game save scan completed; reason=' + reason + ', saveDirectory=' + GetActiveNormalSaveDirectoryForLog() + ', files=' + ((files && files.length) || 0) + ', changed=' + marked + (files && files.length ? ': ' + DescribeNormalSaveFilesForLog(files) : ''));
        }

        if (marked > 0) {
            QueueLocalNormalSaveFlush(reason);
        }

        return { files: files || [], marked: marked };
    };

    var ScanNormalSaveFilesAfterRuntimeFlush = function(reason, options, callback) {
        var flushResult;
        var settleMs = 0;

        options = options || {};
        callback = callback || function() {};

        flushResult = RequestRetroArchSaveFileFlush(reason, {
            force: !!options.forceRuntimeFlush,
            forceLog: !!options.forceLog,
            quiet: !!options.quiet
        });

        if (flushResult && flushResult.requested) {
            settleMs = GetNormalSaveRuntimeFlushSettleMs();
        }

        if (settleMs > 0) {
            window.setTimeout(function() {
                callback(ScanNormalSaveFiles(reason, options));
            }, settleMs);
            return;
        }

        callback(ScanNormalSaveFiles(reason, options));
    };

    var StartNormalSaveMonitor = function() {
        var interval;

        if (_normalSaveMonitorTimer || !_SaveFilesManager) {
            return;
        }

        interval = GetNormalSaveScanIntervalMs();
        _Logging.Console('cesEmulatorBase', 'Normal in-game save monitor started; intervalMs=' + interval + ', saveDirectory=' + GetActiveNormalSaveDirectoryForLog());

        // Run one logged scan after startup. After this, unchanged scans stay quiet.
        window.setTimeout(function() {
            ScanNormalSaveFilesAfterRuntimeFlush('save monitor startup scan', { forceLog: true, forceRuntimeFlush: true }, function() {});
        }, 0);

        _normalSaveMonitorTimer = window.setInterval(function() {
            ScanNormalSaveFilesAfterRuntimeFlush('save monitor interval', { quiet: true }, function() {});
        }, interval);
    };

    var StopNormalSaveMonitor = function() {
        if (_normalSaveMonitorTimer) {
            window.clearInterval(_normalSaveMonitorTimer);
            _normalSaveMonitorTimer = null;
            _Logging.Console('cesEmulatorBase', 'Normal in-game save monitor stopped; saveDirectory=' + GetActiveNormalSaveDirectoryForLog());
        }
    };

    var FlushNormalSaveFiles = function(reason, callback) {
        var finished = false;
        var finishTimer;
        var scanResult;

        callback = callback || function() {};
        reason = reason || 'flush';

        var finish = function(err) {
            if (finished) {
                return;
            }
            finished = true;
            if (finishTimer) {
                clearTimeout(finishTimer);
            }
            callback(err);
        };

        if (!_SaveFilesManager) {
            return callback();
        }

        _Logging.Console('cesEmulatorBase', 'Normal in-game save persistence started; reason=' + reason + ', moduleAvailable=' + (!!_Module) + ', saveDirectory=' + GetActiveNormalSaveDirectoryForLog());

        finishTimer = setTimeout(function() {
            _Logging.Console('cesEmulatorBase', 'Timed out while flushing normal in-game saves for ' + reason);
            finish('timeout while flushing normal in-game saves');
        }, 8000);

        var flushServer = function(localErr) {
            if (localErr) {
                _Logging.Console('cesEmulatorBase', 'Normal in-game save local flush failed during ' + reason + ': ' + localErr);
                NotifyNormalSaveFailure('Could not save in-game progress.', 'normalSaveFileSaveFailure');
            }

            if (_SaveFilesManager && typeof _SaveFilesManager.FlushServer === 'function') {
                _SaveFilesManager.FlushServer(function(serverErr) {
                    if (serverErr) {
                        _Logging.Console('cesEmulatorBase', 'Normal in-game save server flush failed during ' + reason + ': ' + serverErr);
                    }
                    finish(serverErr || localErr || (scanResult && scanResult.error));
                }, reason);
                return;
            }

            finish(localErr || (scanResult && scanResult.error));
        };

        var flushLocalAndServer = function(result) {
            scanResult = result || { files: [], marked: 0 };

            if (_Module && typeof _Module.cesFlushSaveFileSystem === 'function') {
                try {
                    _Module.cesFlushSaveFileSystem(function(err) {
                        flushServer(err);
                    });
                    return;
                } catch (e2) {
                    flushServer(e2);
                    return;
                }
            }

            flushServer();
        };

        ScanNormalSaveFilesAfterRuntimeFlush(reason, { forceLog: true, forceRuntimeFlush: true }, flushLocalAndServer);
    };

    var FlushNormalSaveFilesBestEffort = function(reason) {
        var scanResult;
        var queued = false;
        var now = Date.now();

        reason = reason || 'page lifecycle best effort';

        if (now - _lastNormalSaveBestEffortAt < 250) {
            _Logging.Console('cesEmulatorBase', 'Page lifecycle normal in-game save attempt skipped because another attempt just ran; reason=' + reason);
            return false;
        }
        _lastNormalSaveBestEffortAt = now;

        _Logging.Console('cesEmulatorBase', 'Page lifecycle normal in-game save attempt started; reason=' + reason + ', saveDirectory=' + GetActiveNormalSaveDirectoryForLog());

        RequestRetroArchSaveFileFlush(reason, { force: true, forceLog: true });
        scanResult = ScanNormalSaveFiles(reason, { forceLog: true });

        if (_SaveFilesManager && typeof _SaveFilesManager.FlushServerBestEffort === 'function') {
            queued = _SaveFilesManager.FlushServerBestEffort(reason);
        }

        if (!queued && _SaveFilesManager && typeof _SaveFilesManager.HasDirtyFiles === 'function' && _SaveFilesManager.HasDirtyFiles()) {
            _Logging.Console('cesEmulatorBase', 'Page lifecycle normal save best-effort upload was not queued; dirty files remain local/in-memory; reason=' + reason + ', files=' + ((scanResult && scanResult.files && scanResult.files.length) || 0));
        }

        return queued;
    };

    var InstallSaveFilePageLifecycleHandlers = function() {
        if (_saveFilePageLifecycleHandlersInstalled) {
            return;
        }

        _saveFilePageLifecycleHandlersInstalled = true;

        $(window).on('pagehide.cesSaveFiles', function() {
            FlushNormalSaveFilesBestEffort('pagehide');
        });

        $(window).on('beforeunload.cesSaveFiles', function() {
            FlushNormalSaveFilesBestEffort('beforeunload');
        });

        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            _saveFileFreezeHandler = function() {
                FlushNormalSaveFilesBestEffort('freeze');
            };
            document.addEventListener('freeze', _saveFileFreezeHandler, false);
        }

        $(document).on('visibilitychange.cesSaveFiles', function() {
            if (document.visibilityState === 'hidden') {
                FlushNormalSaveFilesBestEffort('visibilitychange hidden');
                FlushNormalSaveFiles('visibilitychange hidden async fallback', function() {});
            }
        });

        _Logging.Console('cesEmulatorBase', 'Normal in-game save page lifecycle handlers installed.');
    };

    var RemoveSaveFilePageLifecycleHandlers = function() {
        if (!_saveFilePageLifecycleHandlersInstalled) {
            return;
        }

        $(window).off('pagehide.cesSaveFiles');
        $(window).off('beforeunload.cesSaveFiles');
        $(document).off('visibilitychange.cesSaveFiles');

        if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function' && _saveFileFreezeHandler) {
            document.removeEventListener('freeze', _saveFileFreezeHandler, false);
        }
        _saveFileFreezeHandler = null;
        _saveFilePageLifecycleHandlersInstalled = false;
    };

    /* exposed saves manager functionality */

    this.InitializeSavesManager = function(saveData, gameKey, callback) {

        _SavesManager = new cesSavesManager(_config, _Compression, _Sync, gameKey, saveData);
        _Sync.RegisterComponent('s', _SavesManager.Sync);
    };

    this.InitializeSaveFilesManager = function(saveFileData, saveFileContext, gameKey) {

        if (typeof cesSaveFilesManager !== 'function') {
            _Logging.Console('cesEmulatorBase', 'Normal in-game save-file manager script is not loaded.');
            return;
        }

        _SaveFilesManager = new cesSaveFilesManager(_config, _Compression, _Sync, gameKey, saveFileData || [], saveFileContext || {}, _Logging, _PubSub);
        InstallSaveFilePageLifecycleHandlers();

        if (_Module) {
            StartNormalSaveMonitor();
        }
    };

    this.ScanNormalSaveFiles = function(reason) {
        return ScanNormalSaveFiles(reason || 'manual scan', { forceLog: true });
    };

    this.FlushNormalSaveFiles = function(callback) {
        FlushNormalSaveFiles('manual flush', callback);
    };

    this.FlushNormalSaveFilesBestEffort = function(reason) {
        return FlushNormalSaveFilesBestEffort(reason || 'manual best-effort flush');
    };


    this.GetMostRecentSaves = function(count) { 

        return _SavesManager.GetMostRecentSaves(count);
    };

    this.MaximumSavesCheck = function() {

        return _SavesManager.MaximumSavesCheck();
    };

    //private methods

    var AttachOperationHandlers = function() {

        //save 

        self._InputHelper.RegisterKeydownOperationHandler('statesave', function(event, proceed, args) {

            if (_isSavingState || _isLoadingState) {
                proceed(false);
                return;
            }

            //the default save type is the player triggered it
            var saveType = 'user';

            //the default callback is to print any error
            var callback = function(err) {
                if (err) console.log(err);
            };  

            //the savetype can come in on args (auto)
            if (args) {
                if (args[0]) {
                    saveType = args[0];
                }
                if (args[1]) {
                    callback = args[1];
                }
            }

            CreateNewSave(saveType, proceed, callback);
        });

        //screen

        self._InputHelper.RegisterKeydownOperationHandler('screenshot', function(event, proceed, args) {
            
            //dont show the screenshot note when making a save state=
            if (!_isSavingState) {
                _PubSub.Publish('notification', ['Saving Game Screenshot', 3, true, true, 'screenshotWritten']);
            }
            proceed(true);
        });

        //load

        self._InputHelper.RegisterKeydownOperationHandler('loadstate', function(event, proceed, args) {
            
            var isStartupStateLoadRetry = args && args[0] === 'startup-state-load-retry';

            if (_isSavingState) {
                _Logging.Console('cesEmulatorBase', 'Blocked loadstate while a save-state operation is in progress');
                proceed(false);
                return;
            }

            if (_isLoadingState && !isStartupStateLoadRetry) {
                _Logging.Console('cesEmulatorBase', 'Blocked loadstate because a state-load operation is already in progress');
                proceed(false);
                return;
            }

            //check if we've written a state file to load
            if (_hasStateToLoad) {
                _isLoadingState = true;
                _Logging.Console('cesEmulatorBase', 'Allowing loadstate operation' + (isStartupStateLoadRetry ? ' for startup retry' : ''));
                _PubSub.Publish('notification', ['Loading Previous Saved Game Progress...', 3, true, true]);
                proceed(true);
            }
            else {
                _Logging.Console('cesEmulatorBase', 'No saved game progress is available to load; suppressing routine no-save notification');
                proceed(false);
            }
        });

        //mute

        self._InputHelper.RegisterKeydownOperationHandler('mute', function(event, proceed, args) {
            _isMuted = !_isMuted;
            _PubSub.Publish('notification', [(_isMuted ? 'Game Audio Muted' : 'Game Audio Unmuted')]);
            proceed(true);
        });

        //pause

        self._InputHelper.RegisterKeydownOperationHandler('pause', function(event, proceed, args) {
            _isEmulatorPaused = !_isEmulatorPaused;
            if (_isEmulatorPaused) {
                self._InputHelper.CancelIdleTimeout();
                _PubSub.Publish('notification', ['Game Paused', 3, true, false, 'emulatorunpause']);
            }
            else {
                _PubSub.Publish('emulatorunpause');
            }
            proceed(true);
        });

        //reset

        self._InputHelper.RegisterKeydownOperationHandler('reset', function(event, proceed, args) {
            _PubSub.Publish('notification', ['Game Reset', 3, false, false]);
            proceed(true);
        });

        //exit (close emulator).

        self._InputHelper.RegisterKeydownOperationHandler('exit', function(event, proceed, args) {
            
            var wasPublished = false;

            if (args) {
                wasPublished = args[0];
            }
            
            if (wasPublished) {
                proceed(true);
                return;    
            }

            _PubSub.Publish('closeEmulator'); //publish this request since the process to unload the emulator begins in main. 
            proceed(false);
        });

        //condensing the simple keydown and keyup operations
        var DownUpHandlers = function(operation, message, topic) {

            self._InputHelper.RegisterKeydownOperationHandler(operation, function(event, proceed, args) {
                _PubSub.Publish('notification', [message, 3, true, true, topic]);
                _PubSub.Mute('notification'); //since the user is holding a key, prevent this note from showing again while down
                proceed(true);
            });

            self._InputHelper.RegisterKeyupOperationHandler(operation, function(event, proceed, args) {
                _PubSub.Unmute('notification');
                _PubSub.Publish(topic);
                proceed(true);
            });
        };

        //reverse
        DownUpHandlers('reverse', 'Rewinding', 'emulatorreverse');

        //slow motion
        DownUpHandlers('slowmotion', 'Slow Motion Active', 'emulatorslowmotion');

        //fast forward
        DownUpHandlers('fastforward', 'Fast Forwarding', 'emulatorfastforward');
    };

    var OnStateLoaded = function() {
        
        //sanity check
        if (_isLoadingState) {
        
            _PubSub.Publish('notification', ['Load Complete', 1, false, false]);
        
            _isLoadingState = false;
        }
    };

    this.MakeAutoSave = function(callback) {

        if (self._InputHelper) {
            self._InputHelper.Keypress('statesave', null, ['auto', callback]);
        }
    };

    //buttonPressProceed tells emulator to continue original operation (the button to save state). this is only allowed when we have a successful screenshot capture
    //callback will pass null for success or a string if an error occurred.
    var CreateNewSave = function(saveType, buttonPressProceed, callback) {

        var inputHelper = self._InputHelper;
        var saveFinished = false;
        var screenshotSubscriptionRemover = null;
        var screenshotKeypressError = null;

        var ProceedWithButtonPress = function(proceed) {

            if (buttonPressProceed) {
                buttonPressProceed(proceed);
            }
        };

        var FinishSave = function(err) {

            if (saveFinished) {
                return;
            }

            saveFinished = true;
            _isSavingState = false;

            if (err) {
                _Logging.Console('cesEmulatorBase', 'Save state failed: ' + err);
            }

            if (callback) {
                return callback(err);
            }
        };

        var FailBeforeStateSave = function(err) {

            if (saveFinished) {
                return;
            }

            ProceedWithButtonPress(false);
            return FinishSave(err);
        };

        if (!inputHelper || typeof inputHelper.Keypress !== 'function') {
            return FailBeforeStateSave('Input helper is not available; save state cannot capture screenshot');
        }

        if (inputHelper.IsDisposed && inputHelper.IsDisposed()) {
            return FailBeforeStateSave('Input helper has been disposed; save state cannot capture screenshot');
        }

        //bail if already working
        if (_isSavingState) {
            _Logging.Console('cesEmulatorBase', 'Blocked save state because a save-state operation is already in progress');
            ProceedWithButtonPress(false);
            if (callback) {
                callback('Save state is already being generated');
            }
            return;
        }

        _isSavingState = true;

        //show the notification
        if (saveType === 'user') {
            _PubSub.Publish('notification', ['Saving Game Progress...', 3, true, true]);
        }
        else if (saveType === 'auto') {
            _PubSub.Publish('notification', ['Auto Saving Game Progress...', 3, true, true]);
        }

        //ok, for state saving, we need to capture a screenshot first and then a state second. Both will need a timeout in case the file is not returned.

        screenshotSubscriptionRemover = _PubSub.SubscribeOnceWithTimer('screenshotWritten', self, function(filename, contents, screenDataUnzipped, system, title) {

            //success handler, means screenshot was written
            //ok, now we capture state
            if (screenDataUnzipped) {

                _PubSub.SubscribeOnceWithTimer('stateWritten', self, function(filename, stateDataUnzipped) {

                    //success handler, means state was written
                    //ok, to publish a new save is ready, we require screen and state data
                    if (stateDataUnzipped) {

                        //will also close the notification
                        _PubSub.Publish('saveready', [saveType, screenDataUnzipped, stateDataUnzipped]);

                        _hasStateToLoad = true;

                        return FinishSave(); //success
                    }
                    else {
                        return FinishSave('Save state data not included in file?');
                    }

                }, function() {
                    //timeout handler, screenshot was not written
                    return FinishSave('State timeout was reached, file was seemingly never written');
        
                }, true, _timeToWaitForSaveState); //suboncewith time: exclusive flag, time to wait

                ProceedWithButtonPress(true); //continue by allowing the original button press to proceed.
            }
            else {
                
                return FailBeforeStateSave('Screenshot data not included in capture');
            }

        }, function() {
            //timeout handler, screenshot was not written
            return FailBeforeStateSave('Screenshot timeout was reached, file was seemingly never written');

        }, true, _timeToWaitForScreenshot); //suboncewith time: exclusive flag, time to wait

        //press key to begin screenshot capture
        try {
            if (inputHelper.Keypress('screenshot', function(err) {
                if (err) {
                    screenshotKeypressError = err;

                    if (screenshotSubscriptionRemover) {
                        screenshotSubscriptionRemover();
                    }

                    return FailBeforeStateSave('Unable to start screenshot capture: ' + err);
                }
            }) === false) {
                if (screenshotSubscriptionRemover) {
                    screenshotSubscriptionRemover();
                }

                return FailBeforeStateSave('Unable to start screenshot capture' + (screenshotKeypressError ? ': ' + screenshotKeypressError : ''));
            }
        } catch (e) {
            if (screenshotSubscriptionRemover) {
                screenshotSubscriptionRemover();
            }

            return FailBeforeStateSave('Unable to start screenshot capture: ' + e);
        }
    };

    var OnNewSaveSubscription = function(saveType, screenDataUnzipped, stateDataUnzipped) {

        _SavesManager.AddSave(saveType, screenDataUnzipped, stateDataUnzipped, function() {

            _PubSub.Publish('notification', ['Save Complete', 1, false, false]);
        });
    };

    var ConfigureNormalSaveFilesOnModule = function() {
        var context;
        var files;

        if (!_Module || !_SaveFilesManager || typeof _SaveFilesManager.GetContext !== 'function') {
            return;
        }

        context = _SaveFilesManager.GetContext();
        files = typeof _SaveFilesManager.GetInitialFiles === 'function' ? _SaveFilesManager.GetInitialFiles() : [];

        if (_Module && typeof _Module.cesSetSaveFileContext === 'function') {
            try {
                _Module.cesSetSaveFileContext(context, files);
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Unable to set normal save-file context on module: ' + e);
            }
        }
    };

    var PrepareNormalSaveFileSystemBeforeStart = function(callback) {
        var context;
        var files;
        var finished = false;
        var finishTimer;

        callback = callback || function() {};

        var finish = function(err, result) {
            if (finished) {
                return;
            }

            finished = true;
            if (finishTimer) {
                clearTimeout(finishTimer);
            }

            if (err) {
                _Logging.Console('cesEmulatorBase', 'Normal in-game save filesystem preparation failed; continuing with available local data: ' + err);
                NotifyNormalSaveFailure('Could not restore in-game save data.', 'normalSaveFileRestoreFailure');
            }
            else {
                if (_SaveFilesManager && typeof _SaveFilesManager.OnImportedToRuntime === 'function') {
                    _SaveFilesManager.OnImportedToRuntime((result && result.importedFiles) || files || []);
                }

                if (result && result.dirtyLocalFiles && result.dirtyLocalFiles.length && _SaveFilesManager && typeof _SaveFilesManager.MarkSaveFilesDirty === 'function') {
                    _Logging.Console('cesEmulatorBase', 'Preserved ' + result.dirtyLocalFiles.length + ' differing browser-local normal save file(s); scheduling upload after launch.');
                    _SaveFilesManager.MarkSaveFilesDirty(result.dirtyLocalFiles, 'preserved browser-local save');
                }
            }

            StartNormalSaveMonitor();
            callback(true);
        };

        if (!_Module || !_SaveFilesManager || typeof _Module.cesPrepareSaveFileSystem !== 'function') {
            return callback(true);
        }

        context = _SaveFilesManager.GetContext();
        files = typeof _SaveFilesManager.GetInitialFiles === 'function' ? _SaveFilesManager.GetInitialFiles() : [];

        finishTimer = setTimeout(function() {
            finish('timeout while preparing normal save-file filesystem');
        }, 8000);

        try {
            _Module.cesPrepareSaveFileSystem(context, files, function(err, result) {
                finish(err, result);
            });
        } catch (e) {
            finish(e);
        }
    };

    /**
     * A helper function to separate the post-response functionality from the LoadEmulator function.
     * Normal in-game save files require an asynchronous IDBFS populate/import step before callMain.
     * @param {Array} emulator
     * @param {Array} support
     * @param {Array} game
     * @param {Array} shader
     */
    var OnAllLoadsComplete = function(emulator, support, game, shader, callback) {

        //LoadEmulator result
        if (emulator[0]) {
            console.error(emulator[0]);
            return callback(false);
        }
        _Module = emulator[1];
        _EmulatorInstance = emulator[2];

        //LoadSupportFiles result
        var compressedSupprtData = (support && support[1]) ? support[1] : null; //if not defined, no emulator support

        //LoadGame result
        var gameLoadError = game[0];
        var compressedGameData = game[1]; //compressed game data

        //Load Shader result
        //shader data is compressed from server, unpack later
        var compressedShaderData = (shader && shader[1]) ? shader[1] : null; //if not defined, not shader used

        //adjust play area for available client screen size
        self.AdjustPlayArea();

        try {
            ConfigureNormalSaveFilesOnModule();
            _Logging.Console('cesEmulatorBase', 'Building emulator local filesystem for ' + _gameKey.system);
            _Module.BuildLocalFileSystem(_gameKey, compressedGameData, compressedSupprtData, compressedShaderData);
            _Logging.Console('cesEmulatorBase', 'Built emulator local filesystem for ' + _gameKey.system);
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'BuildLocalFileSystem failed for ' + _gameKey.system + ': ' + (e && e.stack ? e.stack : e));
            _PubSub.Publish('error', ['Emulator File System Error:', e]);
            return callback(false);
        }

        PrepareNormalSaveFileSystemBeforeStart(function() {
            callback(true);
        });
    };

    this.RefreshPlayArea = function(reason) {

        self.AdjustPlayArea();

        if (_Module && typeof _Module.cesPrepareCanvas === 'function') {
            _Module.cesPrepareCanvas(reason || 'play area refresh', _ui);
        }

        if (_ui.canvas && _ui.canvas.length) {
            _ui.canvas.focus();
        }
    };

    this.GetShaderRuntimeState = function() {

        var state = {
            runtimeSupported: false,
            canApply: false,
            canUnload: false,
            activePresetPath: null,
            activePresetRelativePath: null,
            activeSelection: null,
            system: _gameKey.system,
            rawGlslCapable: IsRawGlslShaderCapableSystem(),
            reason: 'Runtime shader controls are not available.'
        };
        var moduleState;

        if (_Module && typeof _Module.cesGetShaderRuntimeState === 'function') {
            try {
                moduleState = _Module.cesGetShaderRuntimeState() || {};
                for (var key in moduleState) {
                    if (Object.prototype.hasOwnProperty.call(moduleState, key)) {
                        state[key] = moduleState[key];
                    }
                }
                state.system = _gameKey.system;
                state.rawGlslCapable = IsRawGlslShaderCapableSystem();
                if (!state.activePresetRelativePath && state.activePresetPath) {
                    state.activePresetRelativePath = NormalizeRawGlslShaderAssetPath(state.activePresetPath);
                }
                return state;
            } catch (e) {
                state.reason = 'Runtime shader state failed: ' + e;
                _Logging.Console('cesEmulatorBase', state.reason);
            }
        }

        if (IsRawGlslShaderCapableSystem()) {
            state.reason = 'RetroArch 1.22.2 runtime shader helper is not ready.';
        } else {
            state.reason = 'This emulator extension uses the older shader package loader.';
        }

        return state;
    };

    this.ApplyShaderRuntime = function(selection, callback) {

        var deferred;

        if (!IsRawGlslShaderCapableSystem()) {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Live shader changes are only available for RetroArch 1.22.2 systems.', true));
        }

        if (!_Module || typeof _Module.cesApplyShaderPackageAtRuntime !== 'function') {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'The running emulator does not expose a safe live shader apply helper.', true));
        }

        selection = ResolveRawGlslShaderPresetForSelection(selection);

        if (!selection) {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Selected look is not a compatible RetroArch GLSL preset.', false));
        }

        deferred = $.Deferred();
        LoadRawGlslShaderPreset(selection, selection, deferred);

        $.when(deferred).done(function(err, shaderPackage) {
            var result;

            if (err) {
                return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Shader preset could not be loaded: ' + err, false));
            }

            if (!shaderPackage || !shaderPackage.valid) {
                return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Shader preset is missing one or more required files.', false, shaderPackage));
            }

            try {
                result = _Module.cesApplyShaderPackageAtRuntime(shaderPackage, 'Game Look slider');
            } catch (e) {
                result = BuildRuntimeShaderResult(false, 'Live shader apply failed: ' + e, false);
            }

            RunShaderRuntimeCallback(callback, result || BuildRuntimeShaderResult(false, 'Live shader apply did not return a result.', false));
        });
    };

    this.ClearShaderRuntime = function(callback) {

        var result;

        if (!IsRawGlslShaderCapableSystem()) {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Live shader unloading is only available for RetroArch 1.22.2 systems.', true));
        }

        if (!_Module || typeof _Module.cesClearShaderPresetAtRuntime !== 'function') {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'The running emulator does not expose a safe live shader unload helper.', true));
        }

        try {
            result = _Module.cesClearShaderPresetAtRuntime('Game Look slider');
        } catch (e) {
            result = BuildRuntimeShaderResult(false, 'Live shader unload failed: ' + e, false);
        }

        RunShaderRuntimeCallback(callback, result || BuildRuntimeShaderResult(false, 'Live shader unload did not return a result.', false));
    };

    this.ReapplyShaderRuntime = function(callback) {

        var result;

        if (!_Module || typeof _Module.cesReapplyActiveShaderPreset !== 'function') {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Reapply is not available for this emulator session.', true));
        }

        try {
            result = _Module.cesReapplyActiveShaderPreset('Game Look slider');
        } catch (e) {
            return RunShaderRuntimeCallback(callback, BuildRuntimeShaderResult(false, 'Reapply failed: ' + e, false));
        }

        RunShaderRuntimeCallback(callback, {
            ok: !!result,
            error: result ? null : 'The current look could not be reapplied.',
            state: self.GetShaderRuntimeState()
        });
    };

    var BuildRuntimeShaderResult = function(ok, message, nextLaunchOnly, shaderPackage) {
        return {
            ok: !!ok,
            error: ok ? null : message,
            message: ok ? message : null,
            nextLaunchOnly: !!nextLaunchOnly,
            shaderPackage: shaderPackage || null,
            state: self.GetShaderRuntimeState ? self.GetShaderRuntimeState() : null
        };
    };

    var RunShaderRuntimeCallback = function(callback, result) {
        if (callback) {
            callback(result);
        }
        return result;
    };

    this.AdjustPlayArea = function(toggle) {

        //for now, always the more limited size, if they want larger, full screen in an option
        _ui.canvas.addClass('limited');
        _ui.helper.addClass('limited');

        /*
        if ($(window).height() < 1000) {
            _ui.canvas.addClass('limited');
            _ui.helper.addClass('limited');
        }
        else {
            _ui.canvas.removeClass('limited');
            _ui.helper.removeClass('limited');
        }
        */
    };

    // attach app-specific loader details before evaluating or importing the generated emulator script
    var SetEmulatorModuleMetadata = function(module, systemDetails, emulatorAssetRoot, scriptPath) {

        module.cesEmulatorScriptPath = scriptPath;
        module.cesEmulatorAssetRoot = emulatorAssetRoot;
        module.cesEmulatorVersion = systemDetails.emuextention;
        module.cesEmulatorScriptName = systemDetails.emuscript;

        // Newer Emscripten ES module builds use this to resolve workers and other sidecars.
        // Keep it pointed at the real emulator URL even when we import an adapter Blob.
        try {
            module.mainScriptUrlOrBlob = new URL(scriptPath, window.location.href).href;
        } catch (e) {
            module.mainScriptUrlOrBlob = scriptPath;
        }
    };

    var LooksLikeEsModuleEmulatorScript = function(module, script) {

        if (module && module.cesEmulatorScriptFormat === 'module') {
            return true;
        }

        if (!script || typeof script !== 'string') {
            return false;
        }

        return script.indexOf('import.meta') >= 0 || /(^|[;\s])export\s+default\b/.test(script) || /(^|[;\s])export\s*\{/.test(script);
    };

    var HasExplicitEsModuleExport = function(script) {

        if (!script || typeof script !== 'string') {
            return false;
        }

        return /(^|[;\s])export\s+default\b/.test(script) || /(^|[;\s])export\s*\{/.test(script);
    };

    var BuildAbsoluteUrl = function(path) {

        try {
            return new URL(path, window.location.href).href;
        } catch (e) {
            return path;
        }
    };

    var BuildCacheBustedUrl = function(path) {

        var url = BuildAbsoluteUrl(path);
        var separator = url.indexOf('?') === -1 ? '?' : '&';
        return url + separator + 'cesmodule=' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    };

    var DynamicImport = function(url) {

        // Keep import() out of the top-level parser for older browsers that do not support it.
        var importer = new Function('url', 'return import(url);');
        return importer(url);
    };

    var CopyMissingModuleProperties = function(source, target) {

        if (!source || !target || source === target) {
            return target || source;
        }

        for (var key in source) {
            if (source.hasOwnProperty(key) && typeof target[key] === 'undefined') {
                target[key] = source[key];
            }
        }

        return target;
    };

    var ResolveImportedEmulatorExport = function(importedModule) {

        if (!importedModule) {
            return null;
        }

        if (typeof importedModule.default === 'function' || (importedModule.default && typeof importedModule.default === 'object')) {
            return importedModule.default;
        }

        if (typeof importedModule.cesRetroArchEmulator === 'function') {
            return importedModule.cesRetroArchEmulator;
        }

        if (typeof importedModule.createModule === 'function') {
            return importedModule.createModule;
        }

        if (typeof importedModule.Module === 'function' || (importedModule.Module && typeof importedModule.Module === 'object')) {
            return importedModule.Module;
        }

        if (typeof window.cesRetroArchEmulator === 'function') {
            return window.cesRetroArchEmulator;
        }

        return null;
    };

    var FinishEmulatorScriptLoad = function(module, emulatorScriptInstance, scriptPath, deffered) {

        var runtimeModule = module || {};

        if (runtimeModule !== module) {
            runtimeModule = CopyMissingModuleProperties(module, runtimeModule);
        }

        if (typeof runtimeModule.callMain !== 'function') {
            var runtimeError = 'Emulator module loaded but did not expose callMain: ' + scriptPath;
            _Logging.Console('cesEmulatorBase', runtimeError);
            _PubSub.Publish('error', ['Emulator Runtime Error:', runtimeError]);
            RejectEmulatorScriptLoad(runtimeModule, deffered, runtimeError, 'emulator module missing callMain', true);
            return;
        }

        //this timeout is important, it gives the previous steps (globalEval, import, instantiation) enough time
        //to sort themselves out. without this timeout, I get errors
        setTimeout(function() {
            deffered.resolve(null, runtimeModule, emulatorScriptInstance);
        }, _timeToWaitForEmulatorInstantiation);
    };

    var LoadClassicEmulatorScript = function(script, systemDetails, module, emulatorAssetRoot, scriptPath, deffered) {

        SetEmulatorModuleMetadata(module, systemDetails, emulatorAssetRoot, scriptPath);

        // Newer Emscripten output can contain import.meta/export syntax. That cannot be run by $.globalEval.
        if (LooksLikeEsModuleEmulatorScript(module, script)) {
            LoadEsModuleEmulatorScript(script, systemDetails, module, emulatorAssetRoot, scriptPath, deffered);
            return;
        }

        StartRuntimeMessageListenerCapture(module, 'classic emulator script evaluation: ' + (systemDetails.emuscript || scriptPath));

        //evaluate the response text and place it in the global scope
        try {
            window.cesRetroArchEmulator = undefined;
            $.globalEval(script);
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Emulator script evaluation failed for ' + scriptPath + ': ' + e);
            _PubSub.Publish('error', ['Emulator Evaluation Error:', e]);
            RejectEmulatorScriptLoad(module, deffered, e, 'classic emulator script evaluation failed', true);
            return;
        }

        if (typeof cesRetroArchEmulator !== 'function') {
            var constructorError = 'Expected global cesRetroArchEmulator constructor was not defined by ' + scriptPath;
            _Logging.Console('cesEmulatorBase', constructorError);
            _PubSub.Publish('error', ['Emulator Runtime Error:', constructorError]);
            RejectEmulatorScriptLoad(module, deffered, constructorError, 'classic emulator constructor missing', true);
            return;
        }

        var emulatorScriptInstance;
        try {
            emulatorScriptInstance = new cesRetroArchEmulator(module);
        } catch (e) {
            _Logging.Console('cesEmulatorBase', 'Emulator script instantiation failed for ' + scriptPath + ': ' + e);
            _PubSub.Publish('error', ['Emulator Instantiation Error:', e]);
            RejectEmulatorScriptLoad(module, deffered, e, 'classic emulator script instantiation failed', true);
            return;
        }

        FinishEmulatorScriptLoad(module, emulatorScriptInstance, scriptPath, deffered);
    };

    var LoadEsModuleEmulatorScript = function(script, systemDetails, module, emulatorAssetRoot, scriptPath, deffered) {

        SetEmulatorModuleMetadata(module, systemDetails, emulatorAssetRoot, scriptPath);

        StartRuntimeMessageListenerCapture(module, 'ES module emulator script import: ' + (systemDetails.emuscript || scriptPath));

        var importUrl = null;
        var blobUrl = null;
        var hasExplicitExport = HasExplicitEsModuleExport(script);

        if (hasExplicitExport) {
            importUrl = BuildCacheBustedUrl(scriptPath);
            _Logging.Console('cesEmulatorBase', 'Detected ES module emulator script. Importing from URL: ' + importUrl);
        } else {
            var adaptedScript = script;

            // Some patched Emscripten builds still assign a local cesRetroArchEmulator constructor but now use import.meta.
            // Classic-script globals are not exported from ES modules, so expose that constructor when no export exists.
            if (script && script.indexOf('cesRetroArchEmulator') >= 0) {
                adaptedScript += '\n;export default (typeof cesRetroArchEmulator !== "undefined" ? cesRetroArchEmulator : undefined);\n';
            }

            try {
                blobUrl = URL.createObjectURL(new Blob([adaptedScript], { type: 'text/javascript' }));
                importUrl = blobUrl;
                _Logging.Console('cesEmulatorBase', 'Detected ES module emulator script without an explicit export. Importing through a Blob adapter for: ' + scriptPath);
            } catch (e) {
                _Logging.Console('cesEmulatorBase', 'Could not create ES module adapter for ' + scriptPath + ': ' + e);
                _PubSub.Publish('error', ['Emulator Module Adapter Error:', e]);
                RejectEmulatorScriptLoad(module, deffered, e, 'ES module adapter creation failed', true);
                return;
            }
        }

        var importPromise;
        try {
            importPromise = DynamicImport(importUrl);
        } catch (e) {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            _Logging.Console('cesEmulatorBase', 'Browser could not start dynamic import for ' + scriptPath + ': ' + e);
            _PubSub.Publish('error', ['Emulator Module Import Error:', e]);
            RejectEmulatorScriptLoad(module, deffered, e, 'ES module dynamic import start failed', true);
            return;
        }

        if (!importPromise || typeof importPromise.then !== 'function') {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            var importError = 'Dynamic import did not return a Promise for ' + scriptPath;
            _Logging.Console('cesEmulatorBase', importError);
            _PubSub.Publish('error', ['Emulator Module Import Error:', importError]);
            RejectEmulatorScriptLoad(module, deffered, importError, 'ES module dynamic import did not return a promise', true);
            return;
        }

        importPromise.then(function(importedModule) {

            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }

            _Logging.Console('cesEmulatorBase', 'ES module emulator script imported for ' + scriptPath);

            var exportedEmulator = ResolveImportedEmulatorExport(importedModule);

            if (!exportedEmulator) {
                var exportError = 'ES module emulator script did not export a usable factory or cesRetroArchEmulator constructor: ' + scriptPath;
                _Logging.Console('cesEmulatorBase', exportError);
                _PubSub.Publish('error', ['Emulator Module Export Error:', exportError]);
                RejectEmulatorScriptLoad(module, deffered, exportError, 'ES module missing usable export', true);
                return;
            }

            var finishFromRuntime = function(runtimeModule, emulatorScriptInstance) {

                runtimeModule = runtimeModule || module;
                if (runtimeModule !== module) {
                    runtimeModule = CopyMissingModuleProperties(module, runtimeModule);
                }

                FinishEmulatorScriptLoad(runtimeModule, emulatorScriptInstance || exportedEmulator, scriptPath, deffered);
            };

            if (typeof exportedEmulator === 'function') {
                var factoryResult;
                try {
                    _Logging.Console('cesEmulatorBase', 'Calling ES module emulator factory for ' + scriptPath);
                    factoryResult = exportedEmulator(module);
                } catch (e) {
                    _Logging.Console('cesEmulatorBase', 'ES module emulator factory failed for ' + scriptPath + ': ' + e);
                    _PubSub.Publish('error', ['Emulator Module Factory Error:', e]);
                    RejectEmulatorScriptLoad(module, deffered, e, 'ES module emulator factory failed', true);
                    return;
                }

                if (factoryResult && typeof factoryResult.then === 'function') {
                    factoryResult.then(function(runtimeModule) {
                        _Logging.Console('cesEmulatorBase', 'ES module emulator factory resolved for ' + scriptPath);
                        finishFromRuntime(runtimeModule || module, factoryResult);
                    }).catch(function(e) {
                        _Logging.Console('cesEmulatorBase', 'ES module emulator factory promise rejected for ' + scriptPath + ': ' + e);
                        _PubSub.Publish('error', ['Emulator Module Factory Error:', e]);
                        RejectEmulatorScriptLoad(module, deffered, e, 'ES module emulator factory promise rejected', true);
                    });
                    return;
                }

                if (factoryResult && factoryResult.ready && typeof factoryResult.ready.then === 'function') {
                    factoryResult.ready.then(function(runtimeModule) {
                        _Logging.Console('cesEmulatorBase', 'ES module emulator ready promise resolved for ' + scriptPath);
                        finishFromRuntime(runtimeModule || factoryResult, factoryResult);
                    }).catch(function(e) {
                        _Logging.Console('cesEmulatorBase', 'ES module emulator ready promise rejected for ' + scriptPath + ': ' + e);
                        _PubSub.Publish('error', ['Emulator Module Factory Error:', e]);
                        RejectEmulatorScriptLoad(module, deffered, e, 'ES module emulator ready promise rejected', true);
                    });
                    return;
                }

                finishFromRuntime(factoryResult || module, factoryResult);
                return;
            }

            if (exportedEmulator && typeof exportedEmulator === 'object') {
                if (exportedEmulator.ready && typeof exportedEmulator.ready.then === 'function') {
                    exportedEmulator.ready.then(function(runtimeModule) {
                        _Logging.Console('cesEmulatorBase', 'ES module emulator ready promise resolved for ' + scriptPath);
                        finishFromRuntime(runtimeModule || exportedEmulator, exportedEmulator);
                    }).catch(function(e) {
                        _Logging.Console('cesEmulatorBase', 'ES module emulator ready promise rejected for ' + scriptPath + ': ' + e);
                        _PubSub.Publish('error', ['Emulator Module Runtime Error:', e]);
                        RejectEmulatorScriptLoad(module, deffered, e, 'ES module emulator object ready promise rejected', true);
                    });
                    return;
                }

                finishFromRuntime(exportedEmulator, exportedEmulator);
                return;
            }

            var unsupportedError = 'ES module emulator export was not a function or object: ' + scriptPath;
            _Logging.Console('cesEmulatorBase', unsupportedError);
            _PubSub.Publish('error', ['Emulator Module Export Error:', unsupportedError]);
            RejectEmulatorScriptLoad(module, deffered, unsupportedError, 'ES module export unsupported', true);
        }).catch(function(e) {

            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }

            _Logging.Console('cesEmulatorBase', 'ES module import failed for ' + scriptPath + ': ' + e);
            _PubSub.Publish('error', ['Emulator Module Import Error:', e]);
            RejectEmulatorScriptLoad(module, deffered, e, 'ES module import failed', true);
        });
    };

    /**
     * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadEmulatorScript = function(system, module, deffered) {

        //the path is made of three sections, 1) cdn or local 2) the extention name is the folder where they are stored 3) the file itself
        var systemDetails = _config.systemdetails[system];
        var emulatorRoot = systemDetails.emulatorpath || _config.paths.emulators;
        emulatorRoot = emulatorRoot.replace(/\/$/, '');
        var emulatorAssetRoot = emulatorRoot + '/' + systemDetails.emuextention;
        var scriptPath = emulatorAssetRoot + '/' + systemDetails.emuscript;

        SetEmulatorModuleMetadata(module, systemDetails, emulatorAssetRoot, scriptPath);
        _Logging.Console('cesEmulatorBase', 'Requesting emulator script: ' + scriptPath);

        //first check local cache
        if (_cacheEmulatorScripts && _ClientCache.hasOwnProperty(_cacheName)) {
            _Logging.Console('cesEmulatorBase', 'Using cached emulator script: ' + _cacheName);
            LoadClassicEmulatorScript(_ClientCache[_cacheName], systemDetails, module, emulatorAssetRoot, scriptPath, deffered);
            return;
        }

        _PubSub.Publish('emulatorloading', [_gameKey]);
        
        var emulatorProgressBar = new cesProgressBar(_Media, _gameKey, loadingprogressbar); //this weird syntax just picks up this name from the dom

        LoadResource(scriptPath,
            //onProgress Update
            function(loaded, total) {
                var perc = emulatorProgressBar.Update(loaded, total);
                _ui.status.text(perc + '% Loading ' + _config.systemdetails[_gameKey.system].name);
            },
            //onSuccess
            function(response, status, jqXHR) {
                
                _Logging.Console('cesEmulatorBase', 'Emulator script loaded from ' + scriptPath + ' (' + response.length + ' bytes)');
                if (_cacheEmulatorScripts) {
                    _ClientCache[_cacheName] = response;
                }

                LoadClassicEmulatorScript(response, systemDetails, module, emulatorAssetRoot, scriptPath, deffered);
            },
            //onFailure
            function(jqXHR, status, error) {
                _Logging.Console('cesEmulatorBase', 'Emulator script request failed: ' + scriptPath + ' status=' + jqXHR.status + ' error=' + error);
                _PubSub.Publish('error', ['Emulator Retrieval Error:', jqXHR.status]);
                deffered.reject(error || jqXHR.status);
            }
        );
    };

    /**
     * Emulator support is any additional resources required by the emulator needed for play
     * This isnt included in the LoadEmulator call because sometimes support files are needed for an emulator
     * which can play 1several systems (Sega CD, support needed, Genesis, no support)
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadSupportFiles = function(system, loadSupportFiles, deffered) {

        if (!loadSupportFiles) {
            //system not handled, bail
            console.log('Support files are not needed for ' + system);
            deffered.resolve();
            return;
        }

        //var supportProgressBar = new cesProgressBar(_Media, _gameKey, loadingprogressbar); //this weird syntax just picks up this name from the dom

        //support location also includes a folder which must match the emulator version
        var location = _config.paths.supportfiles + '/' + _config.systemdetails[system].emuextention + '/' + system;

        _PubSub.Publish('supportFilesLoading', [_gameKey]);
        var startTime = Date.now();

        LoadResource(location,
            //onProgress Update
            function(loaded, total) {
                //supportProgressBar.Update(loaded, total);
            },
            //onSuccess
            function(response, status, jqXHR) {
                try {
                    response = JSON.parse(response);

                    var endTime = Date.now();

                    console.log('Support Files Loading took: ' + (endTime - startTime) + 'ms');

                } catch (e) {
                    _PubSub.Publish('error', ['Support Files Parse Error:', e]);
                    return;
                }
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Support Files Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * load rom file from whatever is defined in the config "paths.roms" (CDN/crossdomain or local). will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
     * @param  {string} system
     * @param  {string} _gameKey.title
     * @param  {string} file
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadGame = function(deffered) {

        //var filename = _Compression.Zip.string(_gameKey.title + _gameKey.file);
        var location = _config.paths.game + '/' + _gameKey.system + '/' + encodeURIComponent(_gameKey.gk);

        //encode twice: once for the trip, the second because the files are saved that way on the CDN
        //var firstEncode = encodeURIComponent(filename);
        //var secondEncode = encodeURIComponent(firstEncode);

        _PubSub.Publish('gameloading', [_gameKey]);
        _ui.status.text('Packaging Content');
        
        //location += secondEncode;
        var gameProgressBar = new cesProgressBar(_Media, _gameKey, loadingprogressbar); //this weird syntax just picks up this name from the dom
        var startTime = Date.now();

        //converted from jsonp to straight up json. Seems to work. Going this route allows me to add
        //an event listener to progress for a download progress bar
        LoadResource(location,
            //onProgress Update
            function(loaded, total) {
                var perc = gameProgressBar.Update(loaded, total);
                _ui.status.text(perc + '% Loading ' + _gameKey.title);
            },
            //onSuccess
            function(response, status, jqXHR) {
                
                var endTime = Date.now();

                console.log('Game Loading took: ' + (endTime - startTime) + 'ms');
                
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Game Parse Error:', e]);
                    return;
                }

                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Game Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * load a shader from whatever source format is selected. The shader dialog
     * still returns the configured CES shader id (for example crt-crt-lottes),
     * while RetroArch 1.22.2 resolves that id to a configured raw .glslp preset.
     * Older emulator extensions keep using the legacy CES shader JSON package.
     * @param  {string} name
     * @param  {Object} deffered
     * @return {undefined}
     */
    var virtualBoyVintageLcdShaderId = 'handheld-lcd-shader';
    var virtualBoyVintageLcdBrokenPreset = 'handheld/lcd-shader.glslp';
    var virtualBoyVintageLcdGameplayPreset = 'handheld/virtual-boy-vintage-lcd.glslp';
    var virtualBoyVintageLcdLegacyPresetMap = {
        'handheld/lcd-shader.glslp': true,
        'handheld/lcd-grid.glslp': true,
        'handheld/zfast-lcd.glslp': true,
        'handheld/virtual-boy-vintage-lcd.glslp': true
    };

    var IsVirtualBoySystem = function() {

        return !!(_gameKey && _gameKey.system === 'vb');
    };

    var NormalizeVirtualBoyVintageLcdSelection = function(selection) {

        if (!selection) {
            return '';
        }

        return NormalizeRawGlslShaderAssetPath(selection);
    };

    var IsVirtualBoyVintageLcdGameplayPresetPath = function(path) {

        return NormalizeVirtualBoyVintageLcdSelection(path) === virtualBoyVintageLcdGameplayPreset;
    };

    var ResolveVirtualBoyVintageLcdGameplayPreset = function(selection) {

        var normalizedSelection;

        if (!IsVirtualBoySystem() || !selection) {
            return null;
        }

        normalizedSelection = NormalizeVirtualBoyVintageLcdSelection(selection);

        if (String(selection) === virtualBoyVintageLcdShaderId ||
            normalizedSelection === virtualBoyVintageLcdShaderId ||
            normalizedSelection === virtualBoyVintageLcdBrokenPreset ||
            virtualBoyVintageLcdLegacyPresetMap[normalizedSelection] ||
            normalizedSelection === virtualBoyVintageLcdGameplayPreset) {
            return virtualBoyVintageLcdGameplayPreset;
        }

        return null;
    };

    var LoadShader = function(name, deffered) {

        var rawGlslPreset;

        //if no shader selected, bail and let RetroArch start with shaders disabled
        if (!name) {
            _Logging.Console('cesEmulatorBase', 'No shader selected from shader dialog; video_shader_enable will be false');
            deffered.resolve();
            return;
        }

        name = String(name);
        _Logging.Console('cesEmulatorBase', 'Selected shader value from dialog/preferences: ' + name);

        rawGlslPreset = ResolveRawGlslShaderPresetForSelection(name);

        if (rawGlslPreset) {
            _Logging.Console('cesEmulatorBase', 'Resolved selected shader to raw RetroArch GLSL preset: selection=' + name + ', glslp=' + rawGlslPreset);
            LoadRawGlslShaderPreset(rawGlslPreset, name, deffered);
            return;
        }

        if (IsRawGlslShaderCapableSystem()) {
            _Logging.Console('cesEmulatorBase', 'Selected shader has no configured raw GLSL preset for RetroArch 1.22.2; shaders will be disabled: ' + name);
            deffered.resolve();
            return;
        }

        if (IsRawGlslShaderPresetSelection(name)) {
            _Logging.Console('cesEmulatorBase', 'Raw GLSL preset selection ignored for non-1.22.2 emulator extension; shaders will be disabled: ' + name);
            deffered.resolve();
            return;
        }

        LoadLegacyCesShaderPackage(name, deffered);
    };

    var ResolveRawGlslShaderPresetForSelection = function(selection) {

        var systemDetails;
        var recommended;
        var i;
        var rawGlslPreset;

        if (!selection) {
            return null;
        }

        if (!IsRawGlslShaderCapableSystem()) {
            return null;
        }

        rawGlslPreset = ResolveVirtualBoyVintageLcdGameplayPreset(selection);

        if (rawGlslPreset) {
            _Logging.Console('cesEmulatorBase', 'Virtual Boy Vintage LCD shader candidate selected: ' + rawGlslPreset + ' (selection=' + selection + ')');
            return rawGlslPreset;
        }

        if (IsRawGlslShaderPresetSelection(selection)) {
            return selection;
        }

        systemDetails = _config.systemdetails[_gameKey.system] || {};
        recommended = systemDetails.recommendedshaders || [];

        for (i = 0; i < recommended.length; i++) {
            if (ShaderDefinitionContainsSelectedValue(recommended[i], selection)) {
                rawGlslPreset = GetRawGlslPresetFromShaderDefinition(recommended[i]);
                if (rawGlslPreset) {
                    return rawGlslPreset;
                }
            }
        }

        return null;
    };

    var ShaderDefinitionContainsSelectedValue = function(shaderDefinition, selection) {

        if (typeof shaderDefinition === 'string') {
            return shaderDefinition === selection;
        }

        if (!shaderDefinition) {
            return false;
        }

        return shaderDefinition.shader === selection ||
            shaderDefinition.glslp === selection ||
            shaderDefinition.preset === selection ||
            shaderDefinition.path === selection ||
            shaderDefinition.rawglsl === selection ||
            shaderDefinition.rawGlsl === selection ||
            shaderDefinition.raw_glsl === selection;
    };

    var GetRawGlslPresetFromShaderDefinition = function(shaderDefinition) {

        if (!shaderDefinition || typeof shaderDefinition === 'string') {
            return null;
        }

        return shaderDefinition.glslp ||
            shaderDefinition.preset ||
            shaderDefinition.path ||
            shaderDefinition.rawglsl ||
            shaderDefinition.rawGlsl ||
            shaderDefinition.raw_glsl ||
            null;
    };

    var IsRawGlslShaderCapableSystem = function() {

        var systemDetails = _config.systemdetails[_gameKey.system] || {};

        return systemDetails.emuextention === '1.22.2-stable';
    };

    var LoadLegacyCesShaderPackage = function(name, deffered) {

        //var shaderProgressBar = new cesProgressBar(_Media, _gameKey, loadingprogressbar); //this weird syntax just picks up this name from the dom

        var location = _config.paths.shaders + '/' + name;

        _Logging.Console('cesEmulatorBase', 'Requesting legacy CES shader package URL: ' + location);

        LoadResource(location,
            //onProgress Update
            function(loaded, total) {
                //var perc = shaderProgressBar.Update(loaded, total);
            },
            //onSuccess
            function(response, status, jqXHR) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Shader Parse Error:', e]);
                    return;
                }
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _Logging.Console('cesEmulatorBase', 'Legacy CES shader package fetch failed: url=' + location + ', status=' + (jqXHR ? jqXHR.status : '(unknown)') + ', error=' + error);
                _PubSub.Publish('error', ['Shader Retrieval Error:', jqXHR.status]);
            }
        );
    };

    var LoadRawGlslShaderPreset = function(selection, originalSelection, deffered) {

        var presetRelativePath = NormalizeRawGlslShaderSelectionPath(selection);
        var shaderPackage;
        var state;

        if (!presetRelativePath) {
            _Logging.Console('cesEmulatorBase', 'Invalid raw GLSL shader preset selection; disabling shader: ' + selection);
            deffered.resolve(null, BuildRawGlslShaderPackage(originalSelection, selection, null, false, ['invalid preset selection']));
            return;
        }

        shaderPackage = BuildRawGlslShaderPackage(originalSelection, selection, presetRelativePath, true, []);
        state = {
            pending: 0,
            complete: false,
            queued: {}
        };

        _Logging.Console('cesEmulatorBase', 'Selected shader preset path: ' + presetRelativePath);
        _Logging.Console('cesEmulatorBase', 'Requesting raw GLSL preset URL: ' + BuildRawGlslShaderAssetUrl(presetRelativePath));

        QueueRawGlslShaderAsset(shaderPackage, state, presetRelativePath, 'preset', 'video_shader', selection, null, function() {
            FinishRawGlslShaderPackageLoad(shaderPackage, deffered);
        });
    };

    var BuildRawGlslShaderPackage = function(originalSelection, selection, presetRelativePath, valid, warnings) {

        return {
            type: 'retroarch-glslp',
            selection: originalSelection || selection || null,
            rawSelection: selection || null,
            valid: !!valid,
            presetRelativePath: presetRelativePath || null,
            presetVirtualPath: presetRelativePath ? BuildRawGlslShaderVirtualPath(presetRelativePath) : null,
            presetUrl: presetRelativePath ? BuildRawGlslShaderAssetUrl(presetRelativePath) : null,
            virtualRoot: '/shaders/shaders_glsl',
            files: [],
            dependencies: [],
            missingDependencies: [],
            warnings: warnings || [],
            hasShaderPass: false
        };
    };

    var QueueRawGlslShaderAsset = function(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, allComplete) {

        var url;
        var binary;
        var loadType;

        relativePath = NormalizeRawGlslShaderAssetPath(relativePath);

        if (!relativePath) {
            RecordRawGlslShaderDependencyFailure(shaderPackage, {
                type: role,
                key: key,
                relativePath: relativePath,
                sourcePath: sourcePath,
                parentPath: parentPath,
                url: null
            }, null, 'unsupported or unsafe dependency path');
            return;
        }

        if (state.queued[relativePath]) {
            _Logging.Console('cesEmulatorBase', 'Raw GLSL asset already queued; skipping duplicate fetch: ' + relativePath);
            return;
        }

        state.queued[relativePath] = true;
        state.pending++;

        url = BuildRawGlslShaderAssetUrl(relativePath);
        binary = IsBinaryRawGlslShaderAssetPath(relativePath);
        loadType = binary ? 'binary' : 'text';

        if (role !== 'preset') {
            _Logging.Console('cesEmulatorBase', 'Requesting raw GLSL dependency URL: ' + url + ' (' + key + ', loadType=' + loadType + ')');
        }

        if (binary) {
            _Logging.Console('cesEmulatorBase', 'Raw GLSL asset classified as binary: path=' + relativePath + ', role=' + role + ', key=' + (key || '(none)') + ', url=' + url);
            LoadBinaryResource(url,
                function(response) {
                    OnRawGlslShaderAssetFetched(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, url, loadType, CoerceBinaryResourceResponse(response), allComplete);
                },
                function(jqXHR, status, error) {
                    OnRawGlslShaderAssetFetchFailed(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, url, loadType, jqXHR, error || status, allComplete);
                }
            );
            return;
        }

        LoadResource(url,
            function(loaded, total) {},
            function(response, status, jqXHR) {
                OnRawGlslShaderAssetFetched(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, url, loadType, response, allComplete);
            },
            function(jqXHR, status, error) {
                OnRawGlslShaderAssetFetchFailed(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, url, loadType, jqXHR, error || status, allComplete);
            }
        );
    };

    var OnRawGlslShaderAssetFetched = function(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, url, loadType, content, allComplete) {

        var virtualPath = BuildRawGlslShaderVirtualPath(relativePath);

        if (loadType === 'binary') {
            _Logging.Console('cesEmulatorBase', 'Raw GLSL binary asset load succeeded: path=' + relativePath + ', url=' + url + ', bytes=' + GetRawGlslAssetContentLength(content) + ', virtualPath=' + virtualPath);
        }

        shaderPackage.files.push({
            role: role,
            key: key || null,
            sourcePath: sourcePath || relativePath,
            parentPath: parentPath || null,
            relativePath: relativePath,
            virtualPath: virtualPath,
            url: url,
            loadType: loadType || (IsBinaryRawGlslShaderAssetPath(relativePath) ? 'binary' : 'text'),
            content: content
        });

        if (IsRawGlslPresetOrParamsPath(relativePath)) {
            ParseRawGlslPresetDependencies(content, relativePath, shaderPackage, state, allComplete);
        }

        CompleteRawGlslShaderAssetFetch(shaderPackage, state, allComplete);
    };

    var OnRawGlslShaderAssetFetchFailed = function(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, url, loadType, jqXHR, error, allComplete) {

        RecordRawGlslShaderDependencyFailure(shaderPackage, {
            type: role,
            key: key,
            relativePath: relativePath,
            sourcePath: sourcePath,
            parentPath: parentPath,
            url: url,
            loadType: loadType || (IsBinaryRawGlslShaderAssetPath(relativePath) ? 'binary' : 'text')
        }, jqXHR, error);

        CompleteRawGlslShaderAssetFetch(shaderPackage, state, allComplete);
    };

    var CompleteRawGlslShaderAssetFetch = function(shaderPackage, state, allComplete) {

        state.pending--;

        if (state.pending === 0 && !state.complete) {
            state.complete = true;
            allComplete();
        }
    };

    var RecordRawGlslShaderDependencyFailure = function(shaderPackage, dependency, jqXHR, error) {

        var warning = 'Missing or failed raw GLSL dependency: key=' + (dependency.key || '(none)') + ', path=' + (dependency.relativePath || dependency.sourcePath || '(none)') + ', url=' + (dependency.url || '(none)') + ', loadType=' + (dependency.loadType || '(unknown)') + ', status=' + (jqXHR ? jqXHR.status : '(unknown)') + ', error=' + (error || '(unknown)');

        _Logging.Console('cesEmulatorBase', warning);
        shaderPackage.valid = false;
        shaderPackage.warnings.push(warning);
        shaderPackage.missingDependencies.push({
            type: dependency.type || null,
            key: dependency.key || null,
            relativePath: dependency.relativePath || null,
            sourcePath: dependency.sourcePath || null,
            parentPath: dependency.parentPath || null,
            url: dependency.url || null,
            loadType: dependency.loadType || null,
            status: jqXHR ? jqXHR.status : null,
            error: error || null
        });
    };

    var FinishRawGlslShaderPackageLoad = function(shaderPackage, deffered) {

        if (shaderPackage.valid && !shaderPackage.hasShaderPass) {
            var noShaderWarning = 'Raw GLSL preset dependency graph does not contain any shaderN pass dependencies: ' + (shaderPackage.presetRelativePath || '(none)');
            _Logging.Console('cesEmulatorBase', noShaderWarning);
            shaderPackage.valid = false;
            shaderPackage.warnings.push(noShaderWarning);
        }

        _Logging.Console('cesEmulatorBase', 'Raw GLSL shader load result: preset=' + (shaderPackage.presetRelativePath || '(none)') + ', valid=' + shaderPackage.valid + ', files=' + shaderPackage.files.length + ', dependencies=' + shaderPackage.dependencies.length + ', missing=' + shaderPackage.missingDependencies.length);

        if (IsVirtualBoySystem() && IsVirtualBoyVintageLcdGameplayPresetPath(shaderPackage.presetRelativePath)) {
            if (shaderPackage.valid) {
                _Logging.Console('cesEmulatorBase', 'Virtual Boy Vintage LCD shader verified: preset and dependencies found. preset=' + shaderPackage.presetRelativePath);
            } else {
                _Logging.Console('cesEmulatorBase', 'Virtual Boy Vintage LCD gameplay shader fallback: selected preset is invalid and RetroArch will start with shaders disabled. preset=' + (shaderPackage.presetRelativePath || '(none)'));
            }
        }

        if (!shaderPackage.valid) {
            _Logging.Console('cesEmulatorBase', 'Raw GLSL shader is invalid and will be disabled: ' + (shaderPackage.warnings || []).join(' | '));
        }

        deffered.resolve(null, shaderPackage);
    };

    var ParseRawGlslPresetDependencies = function(presetText, presetRelativePath, shaderPackage, state, allComplete) {

        var lines = String(presetText || '').split(/\r?\n/);
        var presetDirectory = GetPathDirectoryName(presetRelativePath);
        var assignments = {};
        var textureAliases = [];
        var i;

        for (i = 0; i < lines.length; i++) {
            var referencePath = ParseRawGlslPresetReference(lines[i]);
            var assignment;

            if (referencePath) {
                AddRawGlslShaderDependency(shaderPackage, state, presetDirectory, 'reference', referencePath, 'reference', presetRelativePath, allComplete);
                continue;
            }

            assignment = ParseRawGlslPresetAssignment(lines[i]);

            if (!assignment) {
                continue;
            }

            assignments[assignment.key] = assignment.value;

            if (assignment.key.match(/^shader\d+$/i)) {
                AddRawGlslShaderDependency(shaderPackage, state, presetDirectory, assignment.key, assignment.value, 'shader', presetRelativePath, allComplete);
            }

            if (assignment.key.toLowerCase() === 'textures') {
                textureAliases = textureAliases.concat(SplitRawGlslTextureAliases(assignment.value));
            }
        }

        for (i = 0; i < textureAliases.length; i++) {
            var alias = textureAliases[i];

            if (HasOwnProperty(assignments, alias)) {
                AddRawGlslShaderDependency(shaderPackage, state, presetDirectory, alias, assignments[alias], 'texture', presetRelativePath, allComplete);
            } else {
                var warning = 'Raw GLSL preset declares texture alias without path: ' + alias + ' in ' + presetRelativePath;
                _Logging.Console('cesEmulatorBase', warning);
                shaderPackage.valid = false;
                shaderPackage.warnings.push(warning);
                shaderPackage.missingDependencies.push({
                    type: 'texture',
                    key: alias,
                    relativePath: null,
                    url: null,
                    error: 'texture alias missing path'
                });
            }
        }

        for (var assignmentKey in assignments) {
            if (HasOwnProperty(assignments, assignmentKey) && IsClearlyRawGlslAssetAssignment(assignmentKey, assignments[assignmentKey], textureAliases)) {
                AddRawGlslShaderDependency(shaderPackage, state, presetDirectory, assignmentKey, assignments[assignmentKey], 'texture', presetRelativePath, allComplete);
            }
        }
    };

    var AddRawGlslShaderDependency = function(shaderPackage, state, presetDirectory, key, sourcePath, type, parentPath, allComplete) {

        var relativePath = ResolveRawGlslShaderDependencyPath(presetDirectory, sourcePath);
        var dependency;
        var role;
        var warning;

        if (!relativePath) {
            warning = 'Unsupported raw GLSL dependency path: parent=' + (parentPath || '(none)') + ', key=' + key + ', value=' + sourcePath;
            _Logging.Console('cesEmulatorBase', warning);
            shaderPackage.valid = false;
            shaderPackage.warnings.push(warning);
            shaderPackage.missingDependencies.push({
                type: type,
                key: key,
                sourcePath: sourcePath,
                parentPath: parentPath || null,
                error: 'unsupported dependency path'
            });
            return;
        }

        if (type === 'shader') {
            shaderPackage.hasShaderPass = true;
        }

        dependency = {
            type: type,
            key: key,
            sourcePath: sourcePath,
            parentPath: parentPath || null,
            relativePath: relativePath,
            url: BuildRawGlslShaderAssetUrl(relativePath),
            virtualPath: BuildRawGlslShaderVirtualPath(relativePath)
        };

        shaderPackage.dependencies.push(dependency);
        _Logging.Console('cesEmulatorBase', 'Raw GLSL dependency discovered: parent=' + (parentPath || '(none)') + ', ' + key + ' = ' + sourcePath + ' -> ' + relativePath);

        role = type;
        if (type === 'reference' && relativePath.match(/\.params$/i)) {
            role = 'params';
        }

        QueueRawGlslShaderAsset(shaderPackage, state, relativePath, role, key, sourcePath, parentPath, allComplete);
    };

    var ParseRawGlslPresetReference = function(line) {

        var match = String(line || '').match(/^\s*#reference\s+["']?([^"'\s]+)["']?/i);

        if (!match) {
            return null;
        }

        return TrimRawGlslPresetValue(match[1]);
    };

    var ParseRawGlslPresetAssignment = function(line) {

        var match;

        line = StripRawGlslPresetComment(line);
        match = String(line || '').match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);

        if (!match) {
            return null;
        }

        return {
            key: $.trim(match[1]),
            value: TrimRawGlslPresetValue(match[2])
        };
    };

    var StripRawGlslPresetComment = function(line) {

        var text = String(line || '');
        var quote = null;
        var i;

        if (text.match(/^\s*#reference\b/i)) {
            return text;
        }

        for (i = 0; i < text.length; i++) {
            var character = text.charAt(i);

            if ((character === '"' || character === "'") && (i === 0 || text.charAt(i - 1) !== '\\')) {
                quote = quote === character ? null : (quote || character);
            }

            if (!quote && character === '#') {
                return text.substr(0, i);
            }
        }

        return text;
    };

    var TrimRawGlslPresetValue = function(value) {

        value = $.trim(String(value || ''));
        value = value.replace(/^["']+/, '').replace(/["']+$/, '');
        return $.trim(value);
    };

    var SplitRawGlslTextureAliases = function(value) {

        var aliases = [];
        var parts = String(value || '').split(';');

        for (var i = 0; i < parts.length; i++) {
            var alias = $.trim(parts[i]);

            if (alias) {
                aliases.push(alias);
            }
        }

        return aliases;
    };

    var IsClearlyRawGlslAssetAssignment = function(key, value, textureAliases) {

        if (!value || $.inArray(key, textureAliases) !== -1 || key.match(/^shader\d+$/i) || key.toLowerCase() === 'textures') {
            return false;
        }

        if (key.match(/^texture\d+$/i) || key.match(/^lut\d*$/i) || key.match(/_lut$/i)) {
            return IsRawGlslFetchableAssetPath(value);
        }

        return !!String(value).match(/\.(png|jpg|jpeg|gif|bmp|webp|tga|lut|cube)$/i);
    };

    var IsRawGlslShaderPresetSelection = function(name) {

        return !!(name && String(name).match(/\.glslp$/i));
    };

    var IsRawGlslPresetOrParamsPath = function(path) {

        return !!(path && String(path).match(/\.(glslp|params)$/i));
    };

    var IsRawGlslFetchableAssetPath = function(path) {

        return !!(path && !String(path).match(/^[a-z][a-z0-9+.-]*:\/\//i));
    };

    var IsBinaryRawGlslShaderAssetPath = function(path) {

        return !!(path && String(path).match(/\.(png|jpg|jpeg|gif|bmp|webp|tga|lut|cube)$/i));
    };

    var NormalizeRawGlslShaderSelectionPath = function(selection) {

        var path = NormalizeRawGlslShaderAssetPath(selection);

        if (!path || !path.match(/\.glslp$/i)) {
            return null;
        }

        return path;
    };

    var ResolveRawGlslShaderDependencyPath = function(presetDirectory, dependencyPath) {

        dependencyPath = TrimRawGlslPresetValue(dependencyPath).replace(/\\/g, '/');

        if (!dependencyPath || dependencyPath.match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return null;
        }

        if (dependencyPath.indexOf(':/') === 0) {
            return NormalizeRawGlslShaderRootPath(dependencyPath.substr(2));
        }

        if (dependencyPath.charAt(0) === '/') {
            return NormalizeRawGlslShaderRootPath(dependencyPath);
        }

        return NormalizeRelativePath(presetDirectory, dependencyPath);
    };

    var NormalizeRawGlslShaderAssetPath = function(path) {

        path = TrimRawGlslPresetValue(path).replace(/\\/g, '/');

        path = path.replace(/[?#].*$/, '');
        path = path.replace(/^\.\//, '');
        path = path.replace(/^public\/shaders_glsl\//i, '');
        path = path.replace(/^.*\/public\/shaders_glsl\//i, '');
        path = path.replace(/^\/?shaders_glsl\//i, '');
        path = path.replace(/^\/shaders\/shaders_glsl\//i, '');
        path = path.replace(/^shaders\/shaders_glsl\//i, '');
        path = path.replace(/^:\/shaders\/shaders_glsl\//i, '');
        path = path.replace(/^:\/shaders_glsl\//i, '');

        while (path.charAt(0) === '/') {
            path = path.substr(1);
        }

        return NormalizeRelativePath('', path);
    };

    var NormalizeRawGlslShaderRootPath = function(path) {

        path = TrimRawGlslPresetValue(path).replace(/\\/g, '/');

        while (path.charAt(0) === '/') {
            path = path.substr(1);
        }

        if (path.match(/^shaders\/shaders_glsl\//i)) {
            return NormalizeRelativePath('', path.replace(/^shaders\/shaders_glsl\//i, ''));
        }

        if (path.match(/^shaders_glsl\//i)) {
            return NormalizeRelativePath('', path.replace(/^shaders_glsl\//i, ''));
        }

        return null;
    };

    var NormalizeRelativePath = function(baseDirectory, relativePath) {

        var combined = (baseDirectory ? baseDirectory + '/' : '') + String(relativePath || '');
        var parts = combined.replace(/\\/g, '/').split('/');
        var normalized = [];
        var i;

        for (i = 0; i < parts.length; i++) {
            var part = parts[i];

            if (!part || part === '.') {
                continue;
            }

            if (part === '..') {
                if (!normalized.length) {
                    return null;
                }
                normalized.pop();
                continue;
            }

            normalized.push(part);
        }

        return normalized.join('/');
    };

    var GetPathDirectoryName = function(path) {

        path = String(path || '').replace(/\\/g, '/');

        if (path.indexOf('/') === -1) {
            return '';
        }

        return path.substr(0, path.lastIndexOf('/'));
    };

    var BuildRawGlslShaderAssetUrl = function(relativePath) {

        var root = (_config.paths && _config.paths.shaders_glsl) ? _config.paths.shaders_glsl : '/shaders_glsl';
        var encodedRelativePath = EncodePathSegments(relativePath);

        return String(root).replace(/\/$/, '') + '/' + encodedRelativePath;
    };

    var BuildRawGlslShaderVirtualPath = function(relativePath) {

        return '/shaders/shaders_glsl/' + relativePath;
    };

    var EncodePathSegments = function(path) {

        var parts = String(path || '').replace(/\\/g, '/').split('/');
        var encoded = [];

        for (var i = 0; i < parts.length; i++) {
            encoded.push(encodeURIComponent(parts[i]));
        }

        return encoded.join('/');
    };

    var HasOwnProperty = function(obj, key) {

        return Object.prototype.hasOwnProperty.call(obj, key);
    };

    var GetRawGlslAssetContentLength = function(contents) {

        if (contents === null || typeof contents === 'undefined') {
            return 0;
        }

        if (typeof contents === 'string') {
            return contents.length;
        }

        if (typeof contents.byteLength === 'number') {
            return contents.byteLength;
        }

        if (typeof contents.length === 'number') {
            return contents.length;
        }

        return 0;
    };

    var CoerceBinaryResourceResponse = function(response) {

        var bytes;
        var i;

        if (response instanceof Uint8Array) {
            return response;
        }

        if (response instanceof ArrayBuffer) {
            return new Uint8Array(response);
        }

        if (response && response.buffer instanceof ArrayBuffer && typeof response.byteLength === 'number') {
            return new Uint8Array(response.buffer, response.byteOffset || 0, response.byteLength);
        }

        if (typeof response === 'string') {
            bytes = new Uint8Array(response.length);
            for (i = 0; i < response.length; i++) {
                bytes[i] = response.charCodeAt(i) & 0xff;
            }
            return bytes;
        }

        return response;
    };

    var CallBinaryResourceFailure = function(xhr, status, error, onFailure) {

        if (onFailure) {
            onFailure(xhr || { status: 0 }, status || 'error', error || status || 'binary resource load failed');
        }
    };

    var LoadBinaryResource = function(location, onSuccess, onFailure, onProgressUpdate) {

        var xhr = null;

        try {
            xhr = new window.XMLHttpRequest();
            xhr.open('GET', location, true);
            xhr.responseType = 'arraybuffer';

            if (typeof onProgressUpdate === 'function') {
                xhr.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded, event.total);
                    }
                }, false);
            }

            xhr.onload = function() {
                var successStatus = (xhr.status >= 200 && xhr.status < 300) || xhr.status === 0;

                if (!successStatus) {
                    CallBinaryResourceFailure(xhr, xhr.statusText || 'error', 'HTTP status ' + xhr.status, onFailure);
                    return;
                }

                if (typeof xhr.response === 'undefined' || xhr.response === null) {
                    CallBinaryResourceFailure(xhr, 'parsererror', 'empty binary response', onFailure);
                    return;
                }

                if (onSuccess) {
                    onSuccess(xhr.response, 'success', xhr);
                }
            };

            xhr.onerror = function() {
                CallBinaryResourceFailure(xhr, xhr.statusText || 'error', 'network error', onFailure);
            };

            xhr.onabort = function() {
                CallBinaryResourceFailure(xhr, 'abort', 'request aborted', onFailure);
            };

            xhr.ontimeout = function() {
                CallBinaryResourceFailure(xhr, 'timeout', 'request timed out', onFailure);
            };

            xhr.send(null);
        } catch (e) {
            CallBinaryResourceFailure(xhr, 'error', e, onFailure);
        }
    };
    
    //a common function for retirving anything dynamically
    var LoadResource = function(location, onProgressUpdate, onSuccess, onFailure) {

        $.ajax({
            url: location,
            type: 'GET',
            crossDomain: true,
            dataType: 'text',
            cache: false,
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded, event.total);
                    }
                }, false);

                xhr.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded, event.total);
                    }
                }, false);

                return xhr;
            },
            success: onSuccess,
            error: onFailure
        });
    };

    return this;
});
