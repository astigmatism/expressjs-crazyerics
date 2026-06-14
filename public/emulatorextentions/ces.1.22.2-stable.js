/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulator = (function(_Compression, _PubSub, _config, _Sync, _GamePad, _Preferences, _gameKey, _Logging) {
    
    // private members
    var self = this;
    var _extensionName = 'ces.1.22.2-stable';
    var _fileWriteTimeout = {};
    var _fileReadTimeout = {};
    var _fileTimerDelay = 100;       //the amount of time we allow to pass in which we assume a file is no longer being written
    var _readyPublished = false;
    var _mainStarted = false;
    var _canvasReadyTimer = null;
    var _renderDiagnosticTimer = null;
    var _renderDiagnosticSamples = 0;
    var _inputHelperCompatibilityInstalled = false;
    var _legacyHotkeyDomBridgeInstalled = false;
    var _legacyInputBridge = null;
    var _legacyCommandRepeatTimers = {};
    var _pauseResumeCompatibilityInstalled = false;
    var _overlayResumeCompatibilityInstalled = false;
    var _cesMainLoopPausedByCes = false;
    var _browserMainLoopPausedByCes = false;
    var _overlayResumeFallbackTimer = null;
    var _overlayResumeTransactionTimer = null;
    var _basePauseResumeBridge = null;
    var _retroArchOverlayPauseActive = false;
    var _retroArchOverlayPauseCommandSent = false;
    var _retroArchOverlayPauseUsedToggle = false;
    var _lastCesPauseMainLoopAt = 0;
    var _lastCesResumeMainLoopAt = 0;
    var _lastRetroArchOverlayPauseAt = 0;
    var _lastRetroArchOverlayResumeAt = 0;
    var _lastSuppressedAutoPauseAt = 0;
    var _forcedOverlayResumeCount = 0;
    var _runtimeGamepadConfigurationUiActive = false;
    var _runtimeGamepadConfigurationPauseActive = false;
    var _runtimeGamepadConfigurationPauseUsedToggle = false;
    var _lastRuntimeGamepadConfigurationPauseAt = 0;
    var _lastRuntimeGamepadConfigurationResumeAt = 0;
    var _suppressAutoPauseUntil = 0;
    var _suppressAutoPauseReason = '';
    var _overlayResumeInProgress = false;
    var _suppressedAutoPauseCount = 0;
    var _fileSystemTrackingCompatibilityInstalled = false;
    var _screenshotRequestCounter = 0;
    var _activeScreenshotRequest = null;
    var _lastScreenshotFallbackAt = null;
    var _directScreenshotPublishCache = {};
    var _screenshotUiFallbackCache = {};
    var _fallbackRevealTimer = null;
    var _lastStartupStateCommandReport = null;
    var _lastStateLoadLogSignal = null;
    var _lastRetroArchStateRedirectPath = null;
    var _lastStartupStateCandidateLogKey = null;
    var _startupStateAudioMuteRequested = false;
    var _startupStateAudioMuteConfigApplied = false;
    var _startupStateAudioMuteQueuedBeforeMain = false;
    var _startupStateAudioMuteReleased = false;
    var _lastStartupStateAudioMuteReport = null;
    var _lastBrowserGamepadReplayReport = null;
    var _overlayResumeEventNames = ['pointerdown', 'mousedown', 'touchstart', 'click'];
    var _activeShaderPresetPath = null;
    var _postStartupShaderReapplyFrameRequest = null;
    var _postStartupShaderReapplyAttempted = false;
    var _postStartupShaderReapplyPolls = 0;
    var _postStartupShaderReapplyMaxPolls = 90;
    var _postStartupShaderReapplyPaintFrames = 2;
    var _fpsMeterAnimationFrame = null;
    var _fpsMeterElement = null;
    var _fpsMeterEnabled = false;
    var _fpsMeterConsoleEnabled = false;
    var _fpsMeterFrameCount = 0;
    var _fpsMeterSampleStartedAt = 0;
    var _fpsMeterLastConsoleAt = 0;
    var _fpsMeterLastReport = null;

    var PublishReady = function(reason) {
        if (_readyPublished) {
            return;
        }
        _readyPublished = true;
        _Logging.Console(_extensionName, 'Emulator seems ready: ' + reason);
        _PubSub.Publish('emulatorseemsready', [reason, _extensionName], true);

        // Keep the 1.22.2 wrapper measurable but hidden until CES finishes the
        // startup flow. Save-state startup deliberately keeps GameLoading/SaveLoading
        // on top until the selected state has loaded or failed; revealing here races
        // that UI and exposes the running canvas too early. The actual reveal still
        // happens through ReadyPlayerOne -> cesRevealEmulatorWrapper.
        _Logging.Console(_extensionName, 'Startup ready signal published; deferring emulator wrapper reveal to CES ReadyPlayerOne');
    };

    var IsWrapperStillHidden = function(wrapper) {
        if (!wrapper || !wrapper.length) {
            return false;
        }

        var opacity = parseFloat(wrapper.css('opacity'));

        return wrapper.css('display') === 'none' ||
            wrapper.css('visibility') === 'hidden' ||
            (!isNaN(opacity) && opacity <= 0.01);
    };

    var ForceRevealPreparedWrapper = function(reason) {
        var wrapper = $('#emulatorwrapper');

        if (!wrapper || !wrapper.length || !IsWrapperStillHidden(wrapper)) {
            return false;
        }

        wrapper.stop(true, true).css({
            display: 'block',
            visibility: 'visible',
            opacity: 1
        });

        _Logging.Console(_extensionName, 'Forced emulator wrapper visible because it was still hidden after ' + reason);
        return true;
    };

    var ScheduleFallbackReveal = function(reason) {
        if (_fallbackRevealTimer) {
            clearTimeout(_fallbackRevealTimer);
        }

        _fallbackRevealTimer = setTimeout(function() {
            _fallbackRevealTimer = null;
            ForceRevealPreparedWrapper(reason);
        }, 750);
    };
    
    
    //debugging
    var _startToMenu = false;

    // public/protected members (on prototytpe)

    // public/protected methods
    this.createModule = function() {
        _Logging.Console(_extensionName, 'Creating Module for ' + _gameKey.system + ' with emulator script ' + _config.systemdetails[_gameKey.system].emuscript);
        return new module();
    };

    //module def
    var module = (function() {

        var _module = this;

        this.noInitialRun = true;
        this.preRun = [];
        this.postRun = [];
        this.canvas = document.getElementById('emulator');
        this.keydownHandler = null;
        this.cesExtensionName = _extensionName;
        this.cesEmulatorScriptFormat = 'module';
        this.cesEmulatorAssetRoot = null;

        this.locateFile = function(path, prefix) {
            var filename = path;
            var match = filename.match(/[^\/\\]+$/);
            if (match) {
                filename = match[0];
            }

            var root = _module.cesEmulatorAssetRoot || prefix || '';
            if (root && root.charAt(root.length - 1) !== '/') {
                root += '/';
            }

            var resolved = root + filename;
            if (filename.match(/\.(wasm|data|mem|symbols)$/) || filename.match(/\.worker\.js$/)) {
                _Logging.Console(_extensionName, 'locateFile: ' + filename + ' -> ' + resolved);
            }
            return resolved;
        };

        this.onRuntimeInitialized = function() {
            _Logging.Console(_extensionName, 'Runtime initialized for ' + (_module.cesEmulatorScriptName || 'emulator script'));
            if (typeof _module.cesEnsureFileSystemCompatibility === 'function') {
                _module.cesEnsureFileSystemCompatibility();
            }
            if (typeof _module.cesInstallPauseResumeCompatibility === 'function') {
                _module.cesInstallPauseResumeCompatibility('runtime initialized');
            }
            if (typeof _module.cesInstallRenderDiagnostics === 'function') {
                _module.cesInstallRenderDiagnostics('runtime initialized');
            }
            if (typeof _module.cesReportRenderDiagnostics === 'function') {
                _module.cesReportRenderDiagnostics('runtime initialized');
            }
        };
        
        //run now
        this.print = (function() {
            
            var element = document.getElementById('output');
            element.value = ''; // clear browser cache

            return function(text) {
                text = Array.prototype.slice.call(arguments).join(' ');
                element.value += text + "\n";
                if (_module && typeof _module.cesHandleRetroArchLog === 'function') {
                    _module.cesHandleRetroArchLog('stdout', text);
                }
            };
        })();

        this.printErr = function(text) {
            var text = Array.prototype.slice.call(arguments).join(' ');
            var element = document.getElementById('output');
            element.value += text + "\n";
            if (_module && typeof _module.cesHandleRetroArchLog === 'function') {
                _module.cesHandleRetroArchLog('stderr', text);
            }
        };

        //an override to prevent
        this.setWindowTitle = function(title) {
            if (title) {
                _Logging.Console(_extensionName, 'Module wanted to rename title: ' + title);
                if (_mainStarted) {
                    PublishReady('window title update');
                }
            }
        };

        this.setStatus = function(text) {
            
            //for now
            if (text) {
                _Logging.Console(_extensionName, 'setStatus -> ' + text);
            }
            return;

            if (this.setStatus.interval) {
                clearInterval(this.setStatus.interval);
            }
            var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
            var statusElement = document.getElementById('status');
            var progressElement = document.getElementById('progress');
            if (m) {
                text = m[1];
                progressElement.value = parseInt(m[2])*100;
                progressElement.max = parseInt(m[4])*100;
                progressElement.hidden = false;
            } else {
                progressElement.value = null;
                progressElement.max = null;
                progressElement.hidden = true;
            }
            statusElement.innerHTML = text;
        };
        
        this.totalDependencies = 0;
        this.monitorRunDependencies = function(left) {
            this.totalDependencies = Math.max(this.totalDependencies, left);
            if (this) {
                this.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
            }
        };

        var _startupWrapperPrepared = false;
        var _renderDiagnosticsInstalled = false;
        var _lastRenderDiagnosticReport = null;
        var _lastViewportSizingReport = null;
        var _lastViewportSizingLogKey = null;
        var _retroArchLogMirrorCount = 0;
        var _retroArchLogMirrorLimit = 120;

        var SafeStringify = function(value) {
            try {
                return JSON.stringify(value);
            } catch (e) {
                return String(value);
            }
        };

        var GetPathBasename = function(path) {
            var match;

            if (!path) {
                return null;
            }

            match = String(path).replace(/\\/g, '/').match(/[^\/]+$/);
            return match ? match[0] : String(path);
        };

        var AddUniquePath = function(list, path) {
            if (!path) {
                return;
            }

            path = String(path).replace(/\\/g, '/');

            if ($.inArray(path, list) === -1) {
                list.push(path);
            }
        };

        var EscapeRegExp = function(value) {
            return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        var BytesToText = function(value) {
            var result = '';
            var i;

            if (typeof value === 'string') {
                return value;
            }

            if (!value) {
                return '';
            }

            if (typeof TextDecoder !== 'undefined') {
                try {
                    return new TextDecoder('utf-8').decode(value);
                } catch (e) {}
            }

            for (i = 0; i < value.length; i++) {
                result += String.fromCharCode(value[i]);
            }

            return result;
        };

        var ReadFsTextFile = function(FS, path) {
            var result;

            if (!FS || !path || typeof FS.readFile !== 'function') {
                return null;
            }

            try {
                result = FS.readFile(path, { encoding: 'utf8' });
                return BytesToText(result);
            } catch (e) {}

            try {
                result = FS.readFile(path);
                return BytesToText(result);
            } catch (readError) {
                return null;
            }
        };

        var BuildStartupAudioMuteReport = function(details) {
            var report = {
                requested: _startupStateAudioMuteRequested,
                configApplied: _startupStateAudioMuteConfigApplied,
                queuedBeforeMain: _startupStateAudioMuteQueuedBeforeMain,
                released: _startupStateAudioMuteReleased
            };

            details = details || {};
            for (var key in details) {
                report[key] = details[key];
            }

            _lastStartupStateAudioMuteReport = report;
            return report;
        };

        var WriteRetroArchConfigValue = function(key, value, reason) {
            var configPath = '/home/web_user/retroarch/userdata/retroarch.cfg';
            var currentConfig;
            var newLine = key + ' = ' + value;
            var pattern = new RegExp('(^|\\n)\\s*' + EscapeRegExp(key) + '\\s*=.*(?=\\n|$)');
            var updatedConfig;

            if (!_module || !_module.FS) {
                return {
                    ok: false,
                    reason: 'filesystem unavailable'
                };
            }

            currentConfig = ReadFsTextFile(_module.FS, configPath);
            if (currentConfig === null) {
                currentConfig = '';
            }

            if (pattern.test(currentConfig)) {
                updatedConfig = currentConfig.replace(pattern, function(match, prefix) {
                    return (prefix || '') + newLine;
                });
            } else {
                updatedConfig = currentConfig + (currentConfig && currentConfig.charAt(currentConfig.length - 1) !== '\n' ? '\n' : '') + newLine + '\n';
            }

            try {
                WriteFsFileReplacingExisting(_module.FS, configPath, updatedConfig);
                _Logging.Console(_extensionName, 'Updated RetroArch config for startup audio mute: ' + newLine + (reason ? ' (' + reason + ')' : ''));
                return {
                    ok: true,
                    path: configPath,
                    key: key,
                    value: value
                };
            } catch (e) {
                return {
                    ok: false,
                    reason: String(e)
                };
            }
        };

        var ApplyStartupAudioMuteConfig = function(reason) {
            var configResult;
            var queued;
            var report;

            if (!_startupStateAudioMuteRequested) {
                return BuildStartupAudioMuteReport({
                    prepared: false,
                    reason: 'startup audio mute was not requested'
                });
            }

            if (_startupStateAudioMuteConfigApplied || _startupStateAudioMuteQueuedBeforeMain) {
                return BuildStartupAudioMuteReport({
                    prepared: true,
                    reason: 'startup audio mute was already prepared',
                    requestReason: reason || null
                });
            }

            configResult = WriteRetroArchConfigValue('audio_mute_enable', 'true', reason || 'startup state load');
            if (configResult && configResult.ok) {
                _startupStateAudioMuteConfigApplied = true;
                report = BuildStartupAudioMuteReport({
                    prepared: true,
                    method: 'retroarch.cfg audio_mute_enable',
                    configResult: configResult,
                    requestReason: reason || null
                });
                _Logging.Console(_extensionName, 'Prepared startup audio mute before emulator main using retroarch.cfg');
                return report;
            }

            queued = SendQueuedCommand('MUTE', 'startup audio pre-mute before main', false);
            _startupStateAudioMuteQueuedBeforeMain = !!queued;
            report = BuildStartupAudioMuteReport({
                prepared: !!queued,
                method: queued ? 'queued MUTE before main' : 'none',
                configResult: configResult,
                requestReason: reason || null
            });

            if (queued) {
                _Logging.Console(_extensionName, 'Prepared startup audio mute before emulator main using queued MUTE fallback');
            } else {
                _Logging.Console(_extensionName, 'Unable to prepare startup audio mute before emulator main: ' + SafeStringify(report));
            }

            return report;
        };

        var GetConfiguredStartupStateSubdirectories = function() {
            var script = '';
            var result = [];

            if (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].emuscript) {
                script = String(_config.systemdetails[_gameKey.system].emuscript);
            }

            // RetroArch 1.22.2 redirects Nestopia save states into a core-named subdirectory
            // even though CES restores old saves to /states/<rom>.state by default. Keep this
            // Nestopia/core-specific so NES and FDS share the compatibility path without
            // changing older 1.6.9-style emulators.
            if (script.match(/nestopia/i)) {
                AddUniquePath(result, 'Nestopia');
            }

            return result;
        };

        var IsLikelyRenderMessage = function(text) {
            if (!text) {
                return false;
            }

            return !!String(text).match(/(webgl|emscripten|canvas|video|gl\b|egl|driver|shader|viewport|framebuffer|context|display|content|core|retroarch|state|slot|error|warn|failed|unsupported)/i);
        };

        var MirrorRetroArchLog = function(channel, text) {
            text = String(text || '');

            if (!IsLikelyRenderMessage(text)) {
                return;
            }

            if (_retroArchLogMirrorCount >= _retroArchLogMirrorLimit) {
                if (_retroArchLogMirrorCount === _retroArchLogMirrorLimit) {
                    _Logging.Console(_extensionName, 'RetroArch log mirror limit reached; further mirrored runtime lines are suppressed');
                }
                _retroArchLogMirrorCount++;
                return;
            }

            _retroArchLogMirrorCount++;
            _Logging.Console(_extensionName, 'RetroArch ' + channel + ': ' + text);
        };

        var NotifyStartupStateLoadFromRetroArchLog = function(channel, text) {
            var cleaned = String(text || '').replace(/^\[[^\]]+\]\s*/g, '').trim();
            var signalType = null;
            var now;
            var detail;

            if (!cleaned) {
                return;
            }

            if (cleaned.match(/(Loaded state from slot|Auto-loading save state.*succeeded|A save state was loaded)/i)) {
                signalType = 'complete';
            }
            else if (cleaned.match(/(Failed to load state|Auto-loading save state.*failed|state load failed|You must pause or disable Achievements Hardcore Mode to load states)/i)) {
                signalType = 'failure';
            }

            if (!signalType) {
                return;
            }

            now = Date.now();
            if (_lastStateLoadLogSignal &&
                _lastStateLoadLogSignal.type === signalType &&
                _lastStateLoadLogSignal.text === cleaned &&
                now - _lastStateLoadLogSignal.timestamp < 750) {
                return;
            }

            detail = {
                type: signalType,
                channel: channel,
                text: cleaned,
                timestamp: now
            };
            _lastStateLoadLogSignal = detail;

            _Logging.Console(_extensionName, 'RetroArch startup state-load ' + signalType + ' detected from log: ' + cleaned);

            if (signalType === 'complete') {
                if (self && typeof self.OnEmulatorStateLoadComplete === 'function') {
                    self.OnEmulatorStateLoadComplete('retroarch log', detail);
                }
                return;
            }

            if (self && typeof self.OnEmulatorStateLoadFailed === 'function') {
                self.OnEmulatorStateLoadFailed('retroarch log', detail);
            }
        };

        var GetCanvasMetrics = function(canvas) {
            var rect = null;
            var computed = null;

            if (!canvas) {
                return { found: false };
            }

            try {
                rect = canvas.getBoundingClientRect();
            } catch (e) {}

            try {
                computed = window.getComputedStyle(canvas);
            } catch (e) {}

            return {
                found: true,
                attrWidth: canvas.width,
                attrHeight: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight,
                rectWidth: rect ? Math.round(rect.width * 100) / 100 : null,
                rectHeight: rect ? Math.round(rect.height * 100) / 100 : null,
                display: computed ? computed.display : null,
                visibility: computed ? computed.visibility : null,
                opacity: computed ? computed.opacity : null,
                cssWidth: computed ? computed.width : null,
                cssHeight: computed ? computed.height : null,
                inlineWidth: canvas.style.width || null,
                inlineHeight: canvas.style.height || null
            };
        };

        var GetWebGlDiagnostics = function(canvas) {
            var contextObject = canvas && canvas.GLctxObject ? canvas.GLctxObject : null;
            var gl = contextObject && contextObject.GLctx ? contextObject.GLctx : (_module.ctx || null);
            var report = {
                hasModuleContext: !!_module.ctx,
                hasCanvasContextObject: !!contextObject,
                contextVersion: contextObject && contextObject.version ? contextObject.version : null,
                contextType: null,
                viewport: null,
                drawingBufferWidth: null,
                drawingBufferHeight: null,
                currentError: null,
                vendor: null,
                renderer: null
            };

            if (!gl) {
                return report;
            }

            report.contextType = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ? 'webgl2' : 'webgl';
            report.drawingBufferWidth = gl.drawingBufferWidth || null;
            report.drawingBufferHeight = gl.drawingBufferHeight || null;

            try {
                var viewport = gl.getParameter(gl.VIEWPORT);
                report.viewport = viewport ? Array.prototype.slice.call(viewport) : null;
            } catch (e) {
                report.viewport = 'unavailable: ' + e;
            }

            try {
                report.currentError = gl.getError ? gl.getError() : null;
            } catch (e) {
                report.currentError = 'unavailable: ' + e;
            }

            try {
                var debugInfo = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    report.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    report.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            } catch (e) {}

            return report;
        };

        var SampleDisplayedCanvas = function(canvas) {
            var sampleCanvas;
            var sampleContext;
            var image;
            var nonBlack = 0;
            var nonTransparent = 0;
            var total = 0;
            var i;

            if (!canvas || !canvas.width || !canvas.height) {
                return { ok: false, reason: 'canvas missing or zero-sized' };
            }

            try {
                sampleCanvas = document.createElement('canvas');
                sampleCanvas.width = 32;
                sampleCanvas.height = 32;
                sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });

                if (!sampleContext) {
                    return { ok: false, reason: '2d sample context unavailable' };
                }

                sampleContext.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
                image = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;

                for (i = 0; i < image.length; i += 4) {
                    total++;
                    if (image[i + 3] !== 0) {
                        nonTransparent++;
                    }
                    if (image[i] > 8 || image[i + 1] > 8 || image[i + 2] > 8) {
                        nonBlack++;
                    }
                }

                return {
                    ok: true,
                    sampledPixels: total,
                    nonBlackPixels: nonBlack,
                    nonTransparentPixels: nonTransparent,
                    percentNonBlack: total ? Math.round((nonBlack / total) * 1000) / 10 : 0
                };
            } catch (e) {
                return { ok: false, reason: String(e) };
            }
        };

        var HasWebGlContext = function(canvas) {
            return !!((canvas && canvas.GLctxObject && canvas.GLctxObject.GLctx) || _module.ctx);
        };

        var InstallRenderDiagnostics = function(reason) {
            var canvas = _module.canvas || document.getElementById('emulator');

            if (!canvas || _renderDiagnosticsInstalled) {
                return;
            }

            _renderDiagnosticsInstalled = true;
            _Logging.Console(_extensionName, 'Installing 1.22.2 render diagnostics' + (reason ? ' (' + reason + ')' : ''));

            window.cesRetroArch1222Diagnostics = window.cesRetroArch1222Diagnostics || {};
            window.cesRetroArch1222Diagnostics.module = _module;
            window.cesRetroArch1222Diagnostics.report = function() {
                return _module.cesReportRenderDiagnostics('manual report');
            };
            window.cesRetroArch1222Diagnostics.sample = function() {
                return SampleDisplayedCanvas(_module.canvas || document.getElementById('emulator'));
            };
            window.cesRetroArch1222Diagnostics.startRenderDiagnostics = function() {
                return _module.cesStartRenderDiagnostics('manual diagnostics helper');
            };
            window.cesRetroArch1222Diagnostics.enableFpsMeter = function(options) {
                return StartFpsMeter('manual diagnostics helper', options || {});
            };
            window.cesRetroArch1222Diagnostics.disableFpsMeter = function() {
                return StopFpsMeter('manual diagnostics helper');
            };
            window.cesRetroArch1222Diagnostics.fpsMeter = function() {
                return GetFpsMeterReport();
            };
            window.cesRetroArch1222Diagnostics.reapplyShader = function() {
                if (_module && typeof _module.cesReapplyActiveShaderPreset === 'function') {
                    return _module.cesReapplyActiveShaderPreset('manual diagnostics helper');
                }
                _Logging.Console(_extensionName, 'Manual shader reapply requested, but the module helper is not available.');
                return false;
            };

            // Backward-compatible alias for the original NES 1.22.2 testing helper.
            window.cesNes1222Diagnostics = window.cesRetroArch1222Diagnostics;

            canvas.addEventListener('webglcontextcreationerror', function(event) {
                _Logging.Console(_extensionName, 'webglcontextcreationerror: ' + (event && event.statusMessage ? event.statusMessage : 'no status message'));
            }, false);

            canvas.addEventListener('webglcontextlost', function(event) {
                _Logging.Console(_extensionName, 'webglcontextlost');
            }, false);

            canvas.addEventListener('webglcontextrestored', function(event) {
                _Logging.Console(_extensionName, 'webglcontextrestored');
                _module.cesReportRenderDiagnostics('webglcontextrestored');
            }, false);

            if (!canvas.ces1222OriginalGetContext && canvas.getContext) {
                canvas.ces1222OriginalGetContext = canvas.getContext;
                canvas.getContext = function(type, attrs) {
                    var result = canvas.ces1222OriginalGetContext.apply(canvas, arguments);
                    if (String(type).match(/webgl/i)) {
                        _Logging.Console(_extensionName, 'canvas.getContext(' + type + ') -> ' + (result ? 'ok' : 'null') + ', attrs=' + SafeStringify(attrs || null));
                        setTimeout(function() {
                            _module.cesReportRenderDiagnostics('after getContext(' + type + ')');
                        }, 0);
                    }
                    return result;
                };
            }
        };

        var GetJQueryObject = function(candidate, fallbackSelector) {
            if (candidate && candidate.jquery) {
                return candidate;
            }

            if (candidate && candidate.length !== undefined && candidate[0]) {
                return $(candidate);
            }

            return $(fallbackSelector);
        };

        var ParseCssPixels = function(value) {
            var parsed = parseFloat(value);
            return (!isNaN(parsed) && parsed > 0) ? parsed : 0;
        };

        var RoundMetric = function(value) {
            return (typeof value === 'number' && isFinite(value)) ? Math.round(value * 100) / 100 : null;
        };

        var IsConfigFlagEnabled = function(value) {
            if (value === true || value === 1) {
                return true;
            }

            if (typeof value === 'string') {
                value = value.toLowerCase();
                return value === 'true' || value === '1' || value === 'yes' || value === 'on';
            }

            return false;
        };

        var GetBrowserPerformanceConfig = function() {
            var retroArchConfig = (_config.retroarch && _config.retroarch['1.22.2-stable']) || {};
            return retroArchConfig.browserPerformance || {};
        };

        var IsBrowserPerformanceFlagEnabled = function(name) {
            return IsConfigFlagEnabled(GetBrowserPerformanceConfig()[name]);
        };

        var ShouldRunStartupRenderDiagnostics = function() {
            return IsBrowserPerformanceFlagEnabled('startupRenderDiagnostics');
        };

        var GetFpsMeterReport = function() {
            if (_fpsMeterLastReport) {
                return _fpsMeterLastReport;
            }

            return {
                enabled: _fpsMeterEnabled,
                fps: null,
                targetFps: 60,
                measurement: 'browser requestAnimationFrame cadence around the RetroArch canvas',
                reason: _fpsMeterEnabled ? 'waiting for first sample' : 'not enabled'
            };
        };

        var EnsureFpsMeterElement = function() {
            var canvas = _module.canvas || document.getElementById('emulator');
            var wrapper = document.getElementById('emulatorwrapper') || (canvas && canvas.parentNode) || document.body;
            var computed;

            if (!_fpsMeterElement || !_fpsMeterElement.parentNode) {
                _fpsMeterElement = document.createElement('div');
                _fpsMeterElement.id = 'ces-retroarch-1222-fps-meter';
                _fpsMeterElement.setAttribute('aria-live', 'polite');
                _fpsMeterElement.style.position = 'absolute';
                _fpsMeterElement.style.top = '8px';
                _fpsMeterElement.style.right = '8px';
                _fpsMeterElement.style.zIndex = '20';
                _fpsMeterElement.style.padding = '4px 7px';
                _fpsMeterElement.style.borderRadius = '4px';
                _fpsMeterElement.style.background = 'rgba(0, 0, 0, 0.72)';
                _fpsMeterElement.style.color = '#fff';
                _fpsMeterElement.style.font = '12px/1.2 monospace';
                _fpsMeterElement.style.pointerEvents = 'none';
                _fpsMeterElement.style.textShadow = '0 1px 1px rgba(0, 0, 0, 0.8)';
            }

            try {
                computed = window.getComputedStyle(wrapper);
                if (computed && computed.position === 'static') {
                    wrapper.style.position = 'relative';
                }
            } catch (e) {}

            if (_fpsMeterElement.parentNode !== wrapper) {
                wrapper.appendChild(_fpsMeterElement);
            }

            return _fpsMeterElement;
        };

        var UpdateFpsMeterElement = function(report) {
            var element = EnsureFpsMeterElement();
            var fpsText = report && typeof report.fps === 'number' ? report.fps.toFixed(1) : '--';

            element.textContent = 'Browser cadence: ' + fpsText + ' fps';
        };

        var StopFpsMeter = function(reason) {
            if (_fpsMeterAnimationFrame !== null && window.cancelAnimationFrame) {
                window.cancelAnimationFrame(_fpsMeterAnimationFrame);
            }

            _fpsMeterAnimationFrame = null;
            _fpsMeterEnabled = false;
            _fpsMeterConsoleEnabled = false;
            _fpsMeterFrameCount = 0;
            _fpsMeterSampleStartedAt = 0;
            _fpsMeterLastConsoleAt = 0;

            if (_fpsMeterElement && _fpsMeterElement.parentNode) {
                _fpsMeterElement.parentNode.removeChild(_fpsMeterElement);
            }

            _fpsMeterElement = null;
            _fpsMeterLastReport = {
                enabled: false,
                fps: null,
                targetFps: 60,
                measurement: 'browser requestAnimationFrame cadence around the RetroArch canvas',
                reason: reason || 'stopped',
                at: new Date().toISOString()
            };

            return _fpsMeterLastReport;
        };

        var StartFpsMeter = function(reason, options) {
            var config = GetBrowserPerformanceConfig();
            var loop;

            options = options || {};

            if (!window.requestAnimationFrame) {
                _fpsMeterLastReport = {
                    enabled: false,
                    fps: null,
                    targetFps: 60,
                    measurement: 'browser requestAnimationFrame cadence around the RetroArch canvas',
                    reason: 'requestAnimationFrame unavailable',
                    at: new Date().toISOString()
                };
                return _fpsMeterLastReport;
            }

            if (_fpsMeterEnabled) {
                return GetFpsMeterReport();
            }

            _fpsMeterEnabled = true;
            _fpsMeterConsoleEnabled = IsConfigFlagEnabled(options.console) || IsConfigFlagEnabled(config.fpsMeterConsole);
            _fpsMeterFrameCount = 0;
            _fpsMeterSampleStartedAt = 0;
            _fpsMeterLastConsoleAt = 0;
            _fpsMeterLastReport = {
                enabled: true,
                fps: null,
                targetFps: 60,
                measurement: 'browser requestAnimationFrame cadence around the RetroArch canvas',
                reason: reason || 'started',
                at: new Date().toISOString()
            };

            UpdateFpsMeterElement(_fpsMeterLastReport);

            loop = function(timestamp) {
                var elapsed;
                var fps;
                var report;

                if (!_fpsMeterEnabled) {
                    return;
                }

                if (!_fpsMeterSampleStartedAt) {
                    _fpsMeterSampleStartedAt = timestamp;
                }

                _fpsMeterFrameCount++;
                elapsed = timestamp - _fpsMeterSampleStartedAt;

                if (elapsed >= 1000) {
                    fps = _fpsMeterFrameCount * 1000 / elapsed;
                    report = {
                        enabled: true,
                        fps: RoundMetric(fps),
                        targetFps: 60,
                        sampleMs: RoundMetric(elapsed),
                        frames: _fpsMeterFrameCount,
                        measurement: 'browser requestAnimationFrame cadence around the RetroArch canvas',
                        reason: reason || 'running',
                        console: _fpsMeterConsoleEnabled,
                        at: new Date().toISOString()
                    };

                    _fpsMeterLastReport = report;
                    window.cesRetroArch1222Diagnostics = window.cesRetroArch1222Diagnostics || {};
                    window.cesRetroArch1222Diagnostics.lastFpsMeterReport = report;
                    window.cesNes1222Diagnostics = window.cesRetroArch1222Diagnostics;
                    UpdateFpsMeterElement(report);

                    if (_fpsMeterConsoleEnabled && timestamp - _fpsMeterLastConsoleAt >= 5000) {
                        _fpsMeterLastConsoleAt = timestamp;
                        _Logging.Console(_extensionName, 'Browser FPS meter: ' + report.fps + ' fps over ' + report.sampleMs + 'ms (' + report.frames + ' requestAnimationFrame callbacks)');
                    }

                    _fpsMeterFrameCount = 0;
                    _fpsMeterSampleStartedAt = timestamp;
                }

                _fpsMeterAnimationFrame = window.requestAnimationFrame(loop);
            };

            _Logging.Console(_extensionName, 'Enabled RetroArch 1.22.2 browser FPS meter' + (reason ? ' (' + reason + ')' : ''));
            _fpsMeterAnimationFrame = window.requestAnimationFrame(loop);
            return GetFpsMeterReport();
        };

        var StartConfiguredFpsMeter = function(reason) {
            if (IsBrowserPerformanceFlagEnabled('fpsMeter')) {
                return StartFpsMeter(reason || 'configured', {
                    console: IsBrowserPerformanceFlagEnabled('fpsMeterConsole')
                });
            }

            return GetFpsMeterReport();
        };

        var GetDomElement = function(candidate, fallbackSelector) {
            if (candidate && candidate.jquery) {
                return candidate[0] || null;
            }

            if (candidate && candidate.nodeType === 1) {
                return candidate;
            }

            if (candidate && candidate.length !== undefined && candidate[0]) {
                return candidate[0];
            }

            if (fallbackSelector && typeof document !== 'undefined' && document.querySelector) {
                return document.querySelector(fallbackSelector);
            }

            return null;
        };

        var GetElementMetrics = function(candidate, fallbackSelector) {
            var element = GetDomElement(candidate, fallbackSelector);
            var rect = null;
            var computed = null;

            if (!element) {
                return {
                    found: false,
                    selector: fallbackSelector || null
                };
            }

            try {
                rect = element.getBoundingClientRect();
            } catch (e) {}

            try {
                computed = window.getComputedStyle(element);
            } catch (e) {}

            return {
                found: true,
                selector: fallbackSelector || null,
                id: element.id || null,
                className: element.className || null,
                clientWidth: element.clientWidth,
                clientHeight: element.clientHeight,
                offsetWidth: element.offsetWidth,
                offsetHeight: element.offsetHeight,
                rectWidth: rect ? RoundMetric(rect.width) : null,
                rectHeight: rect ? RoundMetric(rect.height) : null,
                display: computed ? computed.display : null,
                position: computed ? computed.position : null,
                visibility: computed ? computed.visibility : null,
                opacity: computed ? computed.opacity : null,
                cssWidth: computed ? computed.width : null,
                cssHeight: computed ? computed.height : null,
                paddingTop: computed ? computed.paddingTop : null,
                paddingBottom: computed ? computed.paddingBottom : null,
                marginTop: computed ? computed.marginTop : null,
                marginBottom: computed ? computed.marginBottom : null,
                overflow: computed ? computed.overflow : null,
                inlineWidth: element.style ? (element.style.width || null) : null,
                inlineHeight: element.style ? (element.style.height || null) : null
            };
        };

        var GetViewportMetrics = function(ui, canvas) {
            return {
                content: GetElementMetrics(null, '#content'),
                mainColumn: GetElementMetrics(null, '#maincolumn'),
                wrapper: GetElementMetrics(ui && ui.wrapper, '#emulatorwrapper'),
                canvasHost: GetElementMetrics(null, '#emulatorcanvas'),
                helper: GetElementMetrics(ui && ui.helper, '#emulatorpositionhelper'),
                canvas: GetCanvasMetrics(canvas || document.getElementById('emulator'))
            };
        };

        var PrepareWrapperForStartup = function(ui) {
            var wrapper = GetJQueryObject(ui && ui.wrapper, '#emulatorwrapper');

            if (!wrapper || !wrapper.length) {
                return;
            }

            // The 1.22.2 Emscripten/RetroArch frontend samples canvas.clientWidth/clientHeight
            // during startup. CES normally starts the emulator while the wrapper is display:none,
            // which can cause the new runtime to lock the canvas to 0px. Keep the area measurable
            // but invisible until ReadyPlayerOne reveals it.
            if (!wrapper.is(':visible')) {
                wrapper.stop(true, true).css({
                    display: 'block',
                    visibility: 'hidden',
                    opacity: 0
                });

                if (!_startupWrapperPrepared) {
                    _startupWrapperPrepared = true;
                    _Logging.Console(_extensionName, 'Prepared hidden emulator wrapper for measurable canvas startup');
                }
            }
        };

        var GetConfiguredAspectRatioDetails = function() {
            var details = _config.systemdetails[_gameKey.system] || {};
            var aspectRatio = 0;
            var rawValue = null;
            var source = 'fallback 4:3';
            var hasVideoAspectRatio = details.retroarch &&
                typeof details.retroarch.video_aspect_ratio !== 'undefined' &&
                details.retroarch.video_aspect_ratio !== null &&
                details.retroarch.video_aspect_ratio !== '';

            if (hasVideoAspectRatio) {
                rawValue = details.retroarch.video_aspect_ratio;
                aspectRatio = parseFloat(rawValue);
                source = 'system retroarch.video_aspect_ratio';
            }

            if ((!aspectRatio || isNaN(aspectRatio) || aspectRatio <= 0) && details.screenshotaspectratio) {
                rawValue = details.screenshotaspectratio;
                aspectRatio = parseFloat(rawValue);
                source = 'system screenshotaspectratio';
            }

            if (!aspectRatio || isNaN(aspectRatio) || aspectRatio <= 0) {
                rawValue = 4 / 3;
                aspectRatio = 4 / 3;
                source = 'fallback 4:3';
            }

            return {
                value: aspectRatio,
                source: source,
                rawValue: rawValue,
                system: _gameKey.system,
                extension: details.emuextention || _extensionName,
                script: details.emuscript || null,
                screenshotaspectratio: details.screenshotaspectratio || null,
                videoForceAspect: details.retroarch && typeof details.retroarch.video_force_aspect !== 'undefined' ? details.retroarch.video_force_aspect : null
            };
        };

        var GetConfiguredAspectRatio = function() {
            return GetConfiguredAspectRatioDetails().value;
        };

        var GetCanvasWidthDetails = function(canvas, ui) {
            var rect;
            var helper = GetJQueryObject(ui && ui.helper, '#emulatorpositionhelper');
            var cssWidth;

            if (!canvas) {
                return {
                    value: 0,
                    source: 'canvas missing',
                    rawValue: 0
                };
            }

            // CES controls the intended embedded play-area width on the helper element.
            // Prefer it over any inline width Emscripten may have written to the canvas early.
            if (helper && helper.length) {
                if (helper[0].clientWidth) {
                    return {
                        value: helper[0].clientWidth,
                        source: '#emulatorpositionhelper.clientWidth',
                        rawValue: helper[0].clientWidth
                    };
                }

                cssWidth = ParseCssPixels(helper.css('width'));
                if (cssWidth) {
                    return {
                        value: cssWidth,
                        source: '#emulatorpositionhelper.css(width)',
                        rawValue: helper.css('width')
                    };
                }
            }

            if (canvas.parentNode && canvas.parentNode.clientWidth) {
                return {
                    value: canvas.parentNode.clientWidth,
                    source: 'canvas.parentNode.clientWidth',
                    rawValue: canvas.parentNode.clientWidth
                };
            }

            try {
                rect = canvas.getBoundingClientRect();
                if (rect && rect.width) {
                    return {
                        value: rect.width,
                        source: 'canvas.getBoundingClientRect().width',
                        rawValue: RoundMetric(rect.width)
                    };
                }
            } catch (e) {}

            if (canvas.clientWidth) {
                return {
                    value: canvas.clientWidth,
                    source: 'canvas.clientWidth',
                    rawValue: canvas.clientWidth
                };
            }

            cssWidth = ParseCssPixels($(canvas).css('width'));
            if (cssWidth) {
                return {
                    value: cssWidth,
                    source: 'canvas.css(width)',
                    rawValue: $(canvas).css('width')
                };
            }

            return {
                value: 800,
                source: 'fallback default width',
                rawValue: 800
            };
        };

        var GetCanvasWidth = function(canvas, ui) {
            return GetCanvasWidthDetails(canvas, ui).value;
        };

        var LogViewportSizing = function(reason, report) {
            var key;
            var shouldLogMetrics;

            report = report || {};
            report.reason = reason || 'unspecified';
            report.at = new Date().toISOString();

            _lastViewportSizingReport = report;
            window.cesRetroArch1222Diagnostics = window.cesRetroArch1222Diagnostics || {};
            window.cesRetroArch1222Diagnostics.lastViewportSizing = report;
            window.cesNes1222Diagnostics = window.cesRetroArch1222Diagnostics;

            key = [
                report.targetCssWidth,
                report.targetCssHeight,
                report.aspectRatio && report.aspectRatio.value,
                report.aspectRatio && report.aspectRatio.source,
                report.width && report.width.source,
                report.canvas && report.canvas.attrWidth,
                report.canvas && report.canvas.attrHeight,
                report.canvas && report.canvas.cssWidth,
                report.canvas && report.canvas.cssHeight,
                report.webgl && report.webgl.hasModuleContext,
                report.webgl && report.webgl.hasCanvasContextObject
            ].join('|');

            shouldLogMetrics = !_lastViewportSizingLogKey || _lastViewportSizingLogKey !== key;
            _lastViewportSizingLogKey = key;

            _Logging.Console(_extensionName, 'Viewport sizing [' + report.reason + ']: system=' + report.system + ', extension=' + report.extension + ', script=' + (report.script || '(unknown)') + ', targetCss=' + report.targetCssWidth + 'x' + report.targetCssHeight + ', widthSource=' + (report.width ? report.width.source : '(unknown)') + ', aspect=' + (report.aspectRatio ? report.aspectRatio.value : '(unknown)') + ' (' + (report.aspectRatio ? report.aspectRatio.source : '(unknown)') + '), canvasBacking=' + (report.canvas ? report.canvas.attrWidth + 'x' + report.canvas.attrHeight : '(missing)') + ', webgl=' + report.hasWebGlContext + (report.skippedBackingStoreResize ? ', skippedBackingResize=true' : ''));

            if (shouldLogMetrics) {
                _Logging.Console(_extensionName, 'Viewport element metrics [' + report.reason + ']: ' + SafeStringify({
                    content: report.metrics && report.metrics.content,
                    mainColumn: report.metrics && report.metrics.mainColumn,
                    wrapper: report.metrics && report.metrics.wrapper,
                    canvasHost: report.metrics && report.metrics.canvasHost,
                    helper: report.metrics && report.metrics.helper,
                    canvas: report.metrics && report.metrics.canvas
                }));
            }
        };

        this.cesInstallRenderDiagnostics = function(reason) {
            InstallRenderDiagnostics(reason);
        };

        this.cesReportRenderDiagnostics = function(reason) {
            var canvas = this.canvas || document.getElementById('emulator');
            var report = {
                reason: reason || 'unspecified',
                at: new Date().toISOString(),
                system: _gameKey.system,
                extension: (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].emuextention) || _extensionName,
                script: (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].emuscript) || null,
                aspectRatio: GetConfiguredAspectRatioDetails(),
                viewport: GetViewportMetrics(null, canvas),
                lastViewportSizing: _lastViewportSizingReport,
                canvas: GetCanvasMetrics(canvas),
                webgl: GetWebGlDiagnostics(canvas),
                sample: SampleDisplayedCanvas(canvas),
                fpsMeter: GetFpsMeterReport(),
                browserPerformance: GetBrowserPerformanceConfig(),
                documentFullscreenElement: document.fullscreenElement ? (document.fullscreenElement.id || document.fullscreenElement.nodeName) : null,
                wrapperVisible: $('#emulatorwrapper').is(':visible'),
                wrapperDisplay: $('#emulatorwrapper').css('display'),
                wrapperVisibility: $('#emulatorwrapper').css('visibility'),
                wrapperOpacity: $('#emulatorwrapper').css('opacity')
            };

            _lastRenderDiagnosticReport = report;
            window.cesRetroArch1222Diagnostics = window.cesRetroArch1222Diagnostics || {};
            window.cesRetroArch1222Diagnostics.lastReport = report;
            window.cesNes1222Diagnostics = window.cesRetroArch1222Diagnostics;

            _Logging.Console(_extensionName, 'Render diagnostics [' + report.reason + ']: ' + SafeStringify(report));
            return report;
        };

        this.cesStartRenderDiagnostics = function(reason) {
            var module = this;

            if (_renderDiagnosticTimer) {
                clearTimeout(_renderDiagnosticTimer);
                _renderDiagnosticTimer = null;
            }

            _renderDiagnosticSamples = 0;

            var runSample = function() {
                _renderDiagnosticSamples++;
                module.cesReportRenderDiagnostics((reason || 'runtime') + ' sample ' + _renderDiagnosticSamples);

                if (_renderDiagnosticSamples < 12) {
                    _renderDiagnosticTimer = setTimeout(runSample, 500);
                } else {
                    _renderDiagnosticTimer = null;
                    _Logging.Console(_extensionName, 'Render diagnostics sampling complete; run window.cesRetroArch1222Diagnostics.report() for an on-demand report');
                }
            };

            _renderDiagnosticTimer = setTimeout(runSample, 250);
        };

        this.cesStartConfiguredFpsMeter = function(reason) {
            return StartConfiguredFpsMeter(reason || 'configured');
        };

        this.cesStopFpsMeter = function(reason) {
            return StopFpsMeter(reason || 'module stop');
        };

        this.cesHandleRetroArchLog = function(channel, text) {
            MirrorRetroArchLog(channel, text);
            ObserveRetroArchStateRedirectFromLog(channel, text);
            NotifyStartupStateLoadFromRetroArchLog(channel, text);
        };

        this.cesIsStartupReadyForCommands = function() {
            return !!(_mainStarted && _readyPublished);
        };

        this.cesGetStartupStateFileCandidates = function(context) {
            var candidates = [];
            var subdirectories = GetConfiguredStartupStateSubdirectories();

            context = context || {};

            if (context.defaultCandidates && context.defaultCandidates.length) {
                $.each(context.defaultCandidates, function(candidateIndex, candidate) {
                    var basename = GetPathBasename(candidate);

                    if (!basename) {
                        return;
                    }

                    $.each(subdirectories, function(directoryIndex, directory) {
                        AddUniquePath(candidates, '/' + directory + '/' + basename);
                    });
                });
            }

            if (candidates.length && candidates.join('|') !== _lastStartupStateCandidateLogKey) {
                _lastStartupStateCandidateLogKey = candidates.join('|');
                _Logging.Console(_extensionName, 'Adding 1.22.2 startup save-state candidate path(s): /states' + candidates.join(', /states'));
            }

            return candidates;
        };

        this.cesPrepareStartupStateAudioMute = function(reason) {
            _startupStateAudioMuteRequested = true;
            _startupStateAudioMuteReleased = false;
            _Logging.Console(_extensionName, 'Startup save-state audio pre-mute requested' + (reason ? ': ' + reason : ''));
            return ApplyStartupAudioMuteConfig(reason || 'startup save-state audio pre-mute');
        };

        this.cesReleaseStartupStateAudioMute = function(reason) {
            var released = false;
            var report;

            if (!_startupStateAudioMuteRequested && !_startupStateAudioMuteConfigApplied && !_startupStateAudioMuteQueuedBeforeMain) {
                report = BuildStartupAudioMuteReport({
                    released: false,
                    reason: 'startup audio mute was not active',
                    releaseReason: reason || null
                });
                return report;
            }

            if (_startupStateAudioMuteReleased) {
                report = BuildStartupAudioMuteReport({
                    released: true,
                    reason: 'startup audio mute was already released',
                    releaseReason: reason || null
                });
                return report;
            }

            released = SendQueuedCommand('MUTE', 'release startup audio mute', false);
            if (!released) {
                released = DispatchKeyboardEventToRetroArch(BuildSyntheticHotkeyEvent('mute'));
            }

            if (released) {
                _startupStateAudioMuteRequested = false;
                _startupStateAudioMuteConfigApplied = false;
                _startupStateAudioMuteQueuedBeforeMain = false;
                _startupStateAudioMuteReleased = true;
            }

            report = BuildStartupAudioMuteReport({
                released: !!released,
                method: released ? 'MUTE command' : 'none',
                releaseReason: reason || null
            });

            _Logging.Console(_extensionName, 'Startup save-state audio mute release result: ' + SafeStringify(report));
            return report;
        };

        this.cesGetStartupReadinessDiagnostics = function() {
            return {
                extension: _extensionName,
                readyPublished: _readyPublished,
                mainStarted: _mainStarted,
                inputHelperCompatibilityInstalled: _inputHelperCompatibilityInstalled,
                legacyHotkeyDomBridgeInstalled: _legacyHotkeyDomBridgeInstalled,
                fileSystemTrackingCompatibilityInstalled: _fileSystemTrackingCompatibilityInstalled,
                pauseResumeCompatibilityInstalled: _pauseResumeCompatibilityInstalled,
                canvasPresent: !!(this.canvas || document.getElementById('emulator')),
                commandQueueAvailable: !!(_module && typeof _module.EmscriptenSendCommand === 'function'),
                directLoadStateAvailable: !!(_module && typeof _module._cmd_load_state === 'function'),
                lastStartupStateCommandReport: _lastStartupStateCommandReport,
                lastStateLoadLogSignal: _lastStateLoadLogSignal,
                lastRetroArchStateRedirectPath: _lastRetroArchStateRedirectPath,
                startupStateAudioMute: _lastStartupStateAudioMuteReport
            };
        };

        this.cesPrepareCanvas = function(reason, ui) {
            var canvas = this.canvas || document.getElementById('emulator');

            PrepareWrapperForStartup(ui);

            if (!canvas) {
                _Logging.Console(_extensionName, 'Canvas preparation skipped; canvas element was not found');
                return;
            }

            var aspectRatioDetails = GetConfiguredAspectRatioDetails();
            var aspectRatio = aspectRatioDetails.value;
            var widthDetails = GetCanvasWidthDetails(canvas, ui);
            var width = Math.round(widthDetails.value);
            var height = Math.round(width / aspectRatio);

            if (!width || !height) {
                _Logging.Console(_extensionName, 'Canvas preparation skipped; invalid size width=' + width + ' height=' + height + ', widthSource=' + widthDetails.source + ', aspectSource=' + aspectRatioDetails.source);
                return;
            }

            var hasWebGlContext = HasWebGlContext(canvas);
            var resizedBackingStore = false;
            var skippedBackingStoreResize = false;

            canvas.style.setProperty('width', width + 'px', 'important');
            canvas.style.setProperty('height', height + 'px', 'important');
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('padding', '0px', 'important');
            canvas.style.setProperty('border', 'none', 'important');
            canvas.style.setProperty('background-color', '#000000', 'important');

            if (canvas.style.setProperty) {
                canvas.style.setProperty('aspect-ratio', aspectRatio + ' / 1');
            }

            // Once WebGL exists, changing canvas.width/height clears the drawing buffer and can
            // invalidate RetroArch's viewport/state. Restrict backing-store changes to pre-context
            // startup; after that, CES should only control CSS sizing around the embedded canvas.
            if (!hasWebGlContext) {
                if (canvas.width !== width) {
                    canvas.width = width;
                    resizedBackingStore = true;
                }
                if (canvas.height !== height) {
                    canvas.height = height;
                    resizedBackingStore = true;
                }
            } else if (canvas.width !== width || canvas.height !== height) {
                skippedBackingStoreResize = true;
            }

            LogViewportSizing(reason, {
                system: _gameKey.system,
                extension: aspectRatioDetails.extension,
                script: aspectRatioDetails.script,
                targetCssWidth: width,
                targetCssHeight: height,
                width: widthDetails,
                aspectRatio: aspectRatioDetails,
                resizedBackingStore: resizedBackingStore,
                skippedBackingStoreResize: skippedBackingStoreResize,
                hasWebGlContext: hasWebGlContext,
                canvas: GetCanvasMetrics(canvas),
                webgl: GetWebGlDiagnostics(canvas),
                metrics: GetViewportMetrics(ui, canvas)
            });
        };

        this.cesInstallPauseResumeCompatibility = function(reason) {
            InstallPauseResumeCompatibility(reason);
        };

        var GetConnectedBrowserGamepads = function() {
            var pads = null;
            var gamepads = [];
            var i;

            try {
                if (typeof navigator === 'undefined') {
                    return gamepads;
                }

                if (navigator.getGamepads) {
                    pads = navigator.getGamepads();
                } else if (navigator.webkitGetGamepads) {
                    pads = navigator.webkitGetGamepads();
                }
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to sample browser gamepads for RetroArch replay: ' + e);
                return gamepads;
            }

            if (!pads) {
                return gamepads;
            }

            for (i = 0; i < pads.length; i++) {
                if (pads[i] && pads[i].connected !== false) {
                    gamepads.push(pads[i]);
                }
            }

            return gamepads;
        };

        var MarkBrowserGamepadEventApprovedForRetroArch = function(event, reason) {
            if (!event) {
                return event;
            }

            try {
                Object.defineProperty(event, 'cesRuntimeGamepadApproved', {
                    value: true,
                    enumerable: false
                });
            } catch (ignoreApprovedDefine) {
                try { event.cesRuntimeGamepadApproved = true; } catch (ignoreApprovedAssign) {}
            }

            try {
                Object.defineProperty(event, 'cesRetroArchGamepadReplayReason', {
                    value: reason || 'retroarch gamepad replay',
                    enumerable: false
                });
            } catch (ignoreReasonDefine) {
                try { event.cesRetroArchGamepadReplayReason = reason || 'retroarch gamepad replay'; } catch (ignoreReasonAssign) {}
            }

            return event;
        };

        var CreateBrowserGamepadEventForRetroArch = function(type, gamepad, reason) {
            var event;

            try {
                if (typeof GamepadEvent === 'function') {
                    event = new GamepadEvent(type, {
                        gamepad: gamepad,
                        bubbles: true,
                        cancelable: true
                    });
                    return MarkBrowserGamepadEventApprovedForRetroArch(event, reason);
                }
            } catch (ignoreGamepadEventConstructor) {}

            try {
                if (typeof Event === 'function') {
                    event = new Event(type, {
                        bubbles: true,
                        cancelable: true
                    });
                } else {
                    event = document.createEvent('Event');
                    event.initEvent(type, true, true);
                }

                try {
                    Object.defineProperty(event, 'gamepad', {
                        value: gamepad,
                        enumerable: true
                    });
                } catch (defineError) {
                    event.gamepad = gamepad;
                }

                return MarkBrowserGamepadEventApprovedForRetroArch(event, reason);
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to create ' + type + ' event for RetroArch gamepad replay: ' + e);
                return null;
            }
        };

        var GetStrictRuntimeGamepadsForRetroArchReplay = function(reason) {
            if (_GamePad && typeof _GamePad.GetRuntimeVirtualGamepadsForRetroArch === 'function') {
                try {
                    return _GamePad.GetRuntimeVirtualGamepadsForRetroArch(_gameKey) || [];
                } catch (e) {
                    _Logging.Console(_extensionName, 'Unable to get strict runtime virtual gamepads for RetroArch replay: ' + e);
                    return [];
                }
            }

            return GetConnectedBrowserGamepads();
        };

        var ReplayConnectedBrowserGamepadsForRetroArch = function(reason) {
            var gamepads = GetStrictRuntimeGamepadsForRetroArchReplay(reason);
            var report = {
                reason: reason || 'unspecified',
                timestamp: Date.now(),
                discovered: gamepads.length,
                dispatched: 0,
                skipped: 0,
                pads: []
            };
            var i;

            if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
                report.skipped = gamepads.length;
                report.error = 'window.dispatchEvent unavailable';
                _lastBrowserGamepadReplayReport = report;
                _Logging.Console(_extensionName, 'RetroArch gamepad replay skipped: ' + report.error);
                return report;
            }

            for (i = 0; i < gamepads.length; i++) {
                var gamepad = gamepads[i];
                var event = CreateBrowserGamepadEventForRetroArch('gamepadconnected', gamepad, report.reason);
                var padReport = {
                    index: gamepad.index,
                    id: gamepad.id,
                    connected: gamepad.connected,
                    buttons: gamepad.buttons ? gamepad.buttons.length : 0,
                    axes: gamepad.axes ? gamepad.axes.length : 0,
                    mapping: gamepad.mapping
                };

                report.pads.push(padReport);

                if (!event) {
                    report.skipped++;
                    continue;
                }

                try {
                    window.dispatchEvent(event);
                    report.dispatched++;
                } catch (e) {
                    report.skipped++;
                    padReport.error = '' + e;
                    _Logging.Console(_extensionName, 'Failed to replay gamepadconnected for RetroArch rwebpad index=' + gamepad.index + ': ' + e);
                }
            }

            _lastBrowserGamepadReplayReport = report;

            if (report.dispatched) {
                _Logging.Console(_extensionName, 'Replayed ' + report.dispatched + ' browser gamepadconnected event(s) for RetroArch rwebpad (' + report.reason + ')');
            } else {
                _Logging.Console(_extensionName, 'No browser gamepadconnected events replayed for RetroArch rwebpad (' + report.reason + '); connected pads visible to navigator=' + report.discovered);
            }

            return report;
        };

        this.cesReplayConnectedBrowserGamepadsForRetroArch = function(reason) {
            return ReplayConnectedBrowserGamepadsForRetroArch(reason);
        };

        this.cesDispatchGamepadEventForRetroArch = function(type, gamepad, reason) {
            var event;

            if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
                return false;
            }

            event = CreateBrowserGamepadEventForRetroArch(type, gamepad, reason || 'runtime strict gamepad activation');
            if (!event) {
                return false;
            }

            try {
                window.dispatchEvent(event);
                _Logging.Console(_extensionName, 'Dispatched approved ' + type + ' event for RetroArch rwebpad index=' + (gamepad && gamepad.index) + ', id=' + (gamepad && gamepad.id) + ', reason=' + (reason || 'runtime strict gamepad activation'));
                return true;
            } catch (e) {
                _Logging.Console(_extensionName, 'Failed to dispatch approved ' + type + ' event for RetroArch rwebpad index=' + (gamepad && gamepad.index) + ': ' + e);
                return false;
            }
        };

        this.cesReapplyActiveShaderPreset = function(reason) {
            return ReapplyActiveShaderPreset(reason || 'manual request');
        };

        this.cesSchedulePostStartupShaderReapply = function(reason) {
            return SchedulePostStartupShaderReapply(reason || 'manual schedule');
        };

        this.cesBeforeEmulatorMain = function(ui) {
            this.cesInstallRenderDiagnostics('before callMain');
            this.cesInstallPauseResumeCompatibility('before callMain');
            InstallInputHelperKeypressCompatibility('before callMain');
            ApplyStartupAudioMuteConfig('before callMain');
            PrepareWrapperForStartup(ui);
            this.cesPrepareCanvas('before callMain', ui);
            this.cesReportRenderDiagnostics('before callMain');
        };

        this.cesAfterEmulatorMainStarted = function(ui) {
            var module = this;
            _mainStarted = true;

            InstallInputHelperKeypressCompatibility('after emulator main started');
            InstallFileSystemTrackingCompatibility('after emulator main started');
            InstallPauseResumeCompatibility('after emulator main started');

            window.cesRetroArch1222Controls = window.cesRetroArch1222Controls || {};
            window.cesRetroArch1222Controls.module = module;
            window.cesRetroArch1222Controls.report = function() { return module.cesReportControlsCompatibility(); };
            window.cesRetroArch1222Controls.screenshot = function() { return module.cesInvokeLegacyCommand('screenshot'); };
            window.cesRetroArch1222Controls.saveState = function() { return module.cesInvokeLegacyCommand('statesave'); };
            window.cesRetroArch1222Controls.loadState = function() { return module.cesInvokeLegacyCommand('loadstate'); };
            window.cesRetroArch1222Controls.startupLoadState = function() { return module.cesAttemptStartupStateLoadCommand({ manual: true, forceFallbacks: true }); };
            window.cesRetroArch1222Controls.reset = function() { return module.cesInvokeLegacyCommand('reset'); };
            window.cesRetroArch1222Controls.pause = function() { return module.cesInvokeLegacyCommand('pause'); };
            window.cesRetroArch1222Controls.resume = function() { return module.cesForceResumeFromCes('manual controls helper'); };
            window.cesRetroArch1222Controls.reapplyShader = function() { return module.cesReapplyActiveShaderPreset('manual controls helper'); };

            window.cesRetroArch1222Controls.replayGamepads = function() { return module.cesReplayConnectedBrowserGamepadsForRetroArch('manual controls helper'); };

            // Backward-compatible alias for the original NES 1.22.2 testing helper.
            window.cesNes1222Controls = window.cesRetroArch1222Controls;

            // RetroArch 1.22.x uses the browser rwebpad joypad driver. CES has already
            // touched the Gamepad API while showing the mapping dialog, so the original
            // browser gamepadconnected event can occur before RetroArch registers its
            // Emscripten callback. Replaying currently connected pads after callMain lets
            // rwebpad mark them live and then consume the input_player*_btn/_axis config
            // written to retroarch.cfg.
            ReplayConnectedBrowserGamepadsForRetroArch('after emulator main started');
            setTimeout(function() {
                ReplayConnectedBrowserGamepadsForRetroArch('after emulator main started delayed');
            }, 500);

            if (_canvasReadyTimer) {
                clearTimeout(_canvasReadyTimer);
            }

            _canvasReadyTimer = setTimeout(function() {
                module.cesPrepareCanvas('after callMain', ui);
                module.cesReportRenderDiagnostics('after callMain');

                if (ShouldRunStartupRenderDiagnostics()) {
                    module.cesStartRenderDiagnostics('post-start');
                } else {
                    _Logging.Console(_extensionName, 'Startup render diagnostics sampling disabled; run window.cesRetroArch1222Diagnostics.startRenderDiagnostics() when needed');
                }

                PublishReady('main loop started');
            }, 250);
        };

        this.cesRevealEmulatorWrapper = function(ui, duration, callback) {
            var wrapper = GetJQueryObject(ui && ui.wrapper, '#emulatorwrapper');
            var module = this;

            if (_fallbackRevealTimer) {
                clearTimeout(_fallbackRevealTimer);
                _fallbackRevealTimer = null;
            }

            _Logging.Console(_extensionName, 'Reveal requested by CES ReadyPlayerOne');
            module.cesPrepareCanvas('before reveal', ui);

            if (!wrapper || !wrapper.length) {
                module.cesStartConfiguredFpsMeter('wrapper unavailable during reveal');
                if (callback) {
                    callback();
                }
                return;
            }

            wrapper.stop(true, true).css({
                display: 'block',
                visibility: 'visible'
            });

            // Console-border shaders can initialize with their source pass black if
            // RetroArch applies them while the CES wrapper is still hidden. The
            // useful signal is the startup shim being released, not the end of the
            // one-second fade animation. Schedule the one-time shader reapply as
            // soon as the wrapper becomes visible, then wait for a real painted
            // canvas frame before issuing SET_SHADER.
            module.cesSchedulePostStartupShaderReapply('wrapper visibility released for reveal');

            wrapper.fadeTo(duration || 0, 1, function() {
                module.cesPrepareCanvas('after reveal', ui);
                module.cesReportRenderDiagnostics('after reveal');
                module.cesStartConfiguredFpsMeter('after reveal');
                if (callback) {
                    callback();
                }
            });
        };

        this.fullscreenEnter = function() {
            _Logging.Console(_extensionName, 'RetroArch requested fullscreen; suppressing native browser fullscreen for embedded CES canvas');
            this.cesPrepareCanvas('fullscreen request suppressed');
            return false;
        };

        this.fullscreenExit = function() {
            _Logging.Console(_extensionName, 'RetroArch requested fullscreen exit');
            this.cesPrepareCanvas('fullscreen exit');
            return true;
        };

        var _legacyOperationByKeyCode = {
            49: 'statesave',
            52: 'loadstate',
            77: 'mute',
            84: 'screenshot',
            80: 'pause',
            82: 'reverse',
            69: 'slowmotion',
            32: 'fastforward',
            72: 'reset',
            27: 'exit'
        };

        var _legacyCommandByOperation = {
            statesave: { type: 'direct', name: '_cmd_save_state', phase: 'keydown', fallbackKeyboard: true },
            loadstate: { type: 'direct', name: '_cmd_load_state', phase: 'keydown', fallbackKeyboard: true },
            screenshot: { type: 'direct', name: '_cmd_take_screenshot', phase: 'keydown', fallbackKeyboard: true },
            pause: { type: 'direct', name: '_cmd_toggle_pause', phase: 'keydown' },
            reset: { type: 'direct', name: '_cmd_reset', phase: 'keydown' },
            mute: { type: 'queued', name: 'MUTE', phase: 'keydown' },
            exit: { type: 'keyboard', phase: 'keydown' },
            reverse: { type: 'repeat', name: 'REWIND' },
            slowmotion: { type: 'repeat', name: 'SLOWMOTION_HOLD' },
            fastforward: { type: 'repeat', name: 'FAST_FORWARD_HOLD' }
        };

        var GetKeyCode = function(event) {
            if (!event) {
                return 0;
            }

            return event.keyCode || event.which || 0;
        };

        var GetLegacyOperationForEvent = function(event) {
            return _legacyOperationByKeyCode[GetKeyCode(event)] || null;
        };

        var IsEditableEventTarget = function(target) {
            var nodeName;

            if (!target) {
                return false;
            }

            if (target === _module.canvas || target.id === 'emulator') {
                return false;
            }

            nodeName = target.nodeName ? target.nodeName.toLowerCase() : '';

            return nodeName === 'input' ||
                nodeName === 'textarea' ||
                nodeName === 'select' ||
                target.isContentEditable;
        };

        var ShouldHandleLegacyHotkeyDomEvent = function(event) {
            var operation = GetLegacyOperationForEvent(event);
            var wrapper = $('#emulatorwrapper');

            if (!operation || !event || event.ces1222ForwardedToRetroArch) {
                return false;
            }

            if (!_mainStarted) {
                return false;
            }

            if (IsEditableEventTarget(event.target)) {
                return false;
            }

            if (wrapper && wrapper.length && !wrapper.is(':visible')) {
                return false;
            }

            return true;
        };

        var StopLegacyHotkeyDomEvent = function(event) {
            if (!event) {
                return;
            }

            try { event.preventDefault(); } catch (e) {}
            try { event.stopPropagation(); } catch (e) {}
            try { event.stopImmediatePropagation(); } catch (e) {}
        };

        var CloneKeyboardEventForRetroArch = function(event) {
            var clone;
            var keyCode = GetKeyCode(event);
            var eventInit = {
                bubbles: true,
                cancelable: true,
                key: event && event.key ? event.key : undefined,
                code: event && event.code ? event.code : undefined,
                location: event && event.location ? event.location : 0,
                ctrlKey: !!(event && event.ctrlKey),
                shiftKey: !!(event && event.shiftKey),
                altKey: !!(event && event.altKey),
                metaKey: !!(event && event.metaKey),
                repeat: !!(event && event.repeat)
            };

            try {
                clone = new KeyboardEvent(event.type, eventInit);
            } catch (e) {
                clone = document.createEvent('KeyboardEvent');
                if (clone.initKeyboardEvent) {
                    clone.initKeyboardEvent(event.type, true, true, document.defaultView, false, false, false, false, keyCode, keyCode);
                } else if (clone.initKeyEvent) {
                    clone.initKeyEvent(event.type, true, true, document.defaultView, false, false, false, false, keyCode, 0);
                }
            }

            try {
                Object.defineProperty(clone, 'keyCode', { get: function() { return keyCode; } });
                Object.defineProperty(clone, 'which', { get: function() { return keyCode; } });
            } catch (ignore) {}

            try { clone.ces1222ForwardedToRetroArch = true; } catch (ignore) {}

            return clone;
        };

        var BuildRetroArchKeyDispatchTargets = function() {
            var targets = [];
            var addTarget = function(target) {
                if (target && typeof target.dispatchEvent === 'function' && $.inArray(target, targets) === -1) {
                    targets.push(target);
                }
            };

            addTarget(_module.canvas);
            addTarget(document.getElementById('emulator'));
            addTarget(document);
            addTarget(window);
            addTarget(document.body);

            return targets;
        };

        var DispatchKeyboardEventToRetroArch = function(event) {
            var targets;
            var dispatched = false;
            var i;

            if (!event) {
                return false;
            }

            targets = BuildRetroArchKeyDispatchTargets();

            if (!targets.length) {
                _Logging.Console(_extensionName, 'Unable to forward key event to RetroArch: no dispatch targets available');
                return false;
            }

            for (i = 0; i < targets.length; i++) {
                try {
                    targets[i].dispatchEvent(CloneKeyboardEventForRetroArch(event));
                    dispatched = true;
                } catch (e) {
                    _Logging.Console(_extensionName, 'Unable to forward key event to RetroArch target ' + i + ': ' + e);
                }
            }

            return dispatched;
        };

        var InvokeDirectCommand = function(commandName, context) {
            if (!_module || typeof _module[commandName] !== 'function') {
                _Logging.Console(_extensionName, 'RetroArch command unavailable for ' + context + ': ' + commandName);
                return false;
            }

            try {
                _module[commandName]();
                _Logging.Console(_extensionName, 'Invoked RetroArch command for ' + context + ': ' + commandName);
                return true;
            } catch (e) {
                _Logging.Console(_extensionName, 'RetroArch command failed for ' + context + ' (' + commandName + '): ' + e);
                return false;
            }
        };

        var SendQueuedCommand = function(commandName, context, quiet) {
            if (!_module || typeof _module.EmscriptenSendCommand !== 'function') {
                if (!quiet) {
                    _Logging.Console(_extensionName, 'RetroArch queued command interface unavailable for ' + context + ': ' + commandName);
                }
                return false;
            }

            try {
                _module.EmscriptenSendCommand(commandName);
                if (!quiet) {
                    _Logging.Console(_extensionName, 'Queued RetroArch command for ' + context + ': ' + commandName);
                }
                return true;
            } catch (e) {
                _Logging.Console(_extensionName, 'RetroArch queued command failed for ' + context + ' (' + commandName + '): ' + e);
                return false;
            }
        };

        var GetActiveShaderPresetPath = function() {
            return _activeShaderPresetPath || (_module && _module.cesActiveShaderPresetPath) || null;
        };

        var GetCurrentSystemDetails = function() {
            if (!_config || !_config.systemdetails || !_gameKey || !_gameKey.system) {
                return {};
            }

            return _config.systemdetails[_gameKey.system] || {};
        };

        var GetSystemBrowserWorkaroundsConfig = function() {
            var systemDetails = GetCurrentSystemDetails();

            return systemDetails.browserWorkarounds || {};
        };

        var NormalizeRuntimeShaderPresetPath = function(shaderPath) {
            var normalizedPath;

            if (!shaderPath) {
                return '';
            }

            normalizedPath = String(shaderPath).replace(/\\/g, '/');
            normalizedPath = normalizedPath.replace(/[?#].*$/, '');
            normalizedPath = normalizedPath.replace(/^.*\/shaders_glsl\//i, '');
            normalizedPath = normalizedPath.replace(/^\/?shaders_glsl\//i, '');
            normalizedPath = normalizedPath.replace(/^\/?shaders\/shaders_glsl\//i, '');
            normalizedPath = normalizedPath.replace(/^\/?shaders\//i, '');

            while (normalizedPath.charAt(0) === '/') {
                normalizedPath = normalizedPath.substr(1);
            }

            return normalizedPath;
        };

        var GetPostStartupShaderReapplyConfig = function() {
            var workarounds = GetSystemBrowserWorkaroundsConfig();
            var config = workarounds ? workarounds.postStartupShaderReapply : null;

            if (config === true || config === 1 || typeof config === 'string') {
                return {
                    enabled: config
                };
            }

            if (config && typeof config === 'object') {
                return config;
            }

            return {};
        };

        var SplitConfiguredShaderPresetList = function(value) {
            var values = [];
            var parts;
            var i;

            if (!value) {
                return values;
            }

            if ($.isArray(value)) {
                parts = value;
            } else {
                parts = String(value).split(/[;,]/);
            }

            for (i = 0; i < parts.length; i++) {
                var normalizedPath = NormalizeRuntimeShaderPresetPath(parts[i]);

                if (normalizedPath) {
                    values.push(normalizedPath);
                }
            }

            return values;
        };

        var GetConfiguredPostStartupShaderReapplyPresets = function(config) {
            return SplitConfiguredShaderPresetList(config.presets || config.preset || config.paths || config.path);
        };

        var IsConfiguredPostStartupShaderReapplyMatch = function(shaderPath) {
            var config = GetPostStartupShaderReapplyConfig();
            var shaderPresetPath = NormalizeRuntimeShaderPresetPath(shaderPath);
            var presets;
            var i;

            if (!shaderPresetPath || !IsConfigFlagEnabled(config.enabled)) {
                return false;
            }

            presets = GetConfiguredPostStartupShaderReapplyPresets(config);

            if (!presets.length) {
                return true;
            }

            for (i = 0; i < presets.length; i++) {
                if (shaderPresetPath === presets[i]) {
                    return true;
                }
            }

            return false;
        };

        var GetConfiguredPostStartupShaderReapplyLabel = function(shaderPath) {
            var config = GetPostStartupShaderReapplyConfig();

            if (IsConfiguredPostStartupShaderReapplyMatch(shaderPath) && config.label) {
                return String(config.label);
            }

            return null;
        };

        var GetPostStartupShaderReapplyLabel = function(shaderPath) {
            var configuredLabel = GetConfiguredPostStartupShaderReapplyLabel(shaderPath);

            if (configuredLabel) {
                return configuredLabel;
            }

            if (shaderPath && String(shaderPath).match(/\/handheld\/console-border\//i)) {
                return 'console-border shader';
            }

            return 'shader';
        };

        var ShouldReapplyShaderPostStartup = function(shaderPath) {
            return !!(shaderPath && (IsConfiguredPostStartupShaderReapplyMatch(shaderPath) || String(shaderPath).match(/\/handheld\/console-border\//i)));
        };

        var RequestPostStartupShaderReapplyFrame = function(callback) {
            if (window.requestAnimationFrame) {
                return {
                    type: 'animationFrame',
                    id: window.requestAnimationFrame(callback)
                };
            }

            return {
                type: 'timeout',
                id: setTimeout(callback, 16)
            };
        };

        var CancelPostStartupShaderReapplyFrame = function(handle) {
            if (!handle) {
                return;
            }

            if (handle.type === 'animationFrame' && window.cancelAnimationFrame) {
                window.cancelAnimationFrame(handle.id);
                return;
            }

            clearTimeout(handle.id);
        };

        var ClearPostStartupShaderReapplyFrame = function() {
            if (_postStartupShaderReapplyFrameRequest) {
                CancelPostStartupShaderReapplyFrame(_postStartupShaderReapplyFrameRequest);
                _postStartupShaderReapplyFrameRequest = null;
            }
        };

        var GetPostStartupShaderReapplyReadiness = function() {
            var wrapper = $('#emulatorwrapper');
            var canvas = (_module && _module.canvas) || document.getElementById('emulator');
            var opacity;

            if (!_mainStarted) {
                return { ready: false, reason: 'main loop has not started' };
            }

            if (!_module || typeof _module.EmscriptenSendCommand !== 'function') {
                return { ready: false, reason: 'EmscriptenSendCommand is unavailable' };
            }

            if (!wrapper || !wrapper.length) {
                return { ready: false, reason: '#emulatorwrapper is missing' };
            }

            if (wrapper.css('display') === 'none') {
                return { ready: false, reason: '#emulatorwrapper display is none' };
            }

            if (wrapper.css('visibility') === 'hidden') {
                return { ready: false, reason: '#emulatorwrapper visibility is hidden' };
            }

            opacity = parseFloat(wrapper.css('opacity'));
            if (!isNaN(opacity) && opacity <= 0.01) {
                return { ready: false, reason: '#emulatorwrapper opacity is still ' + wrapper.css('opacity') };
            }

            if (!canvas) {
                return { ready: false, reason: '#emulator canvas is missing' };
            }

            if (!canvas.clientWidth || !canvas.clientHeight) {
                return { ready: false, reason: '#emulator canvas has no visible CSS size (' + canvas.clientWidth + 'x' + canvas.clientHeight + ')' };
            }

            if (!HasWebGlContext(canvas)) {
                return { ready: false, reason: 'WebGL context is not available on the emulator canvas yet' };
            }

            return {
                ready: true,
                reason: 'wrapper visible, canvas measurable, WebGL active',
                canvasWidth: canvas.clientWidth,
                canvasHeight: canvas.clientHeight,
                wrapperOpacity: wrapper.css('opacity')
            };
        };

        var ReapplyActiveShaderPreset = function(reason) {
            var shaderPath = GetActiveShaderPresetPath();
            var commandName;

            if (!shaderPath) {
                _Logging.Console(_extensionName, 'RetroArch runtime shader reapply skipped: no active shader preset path' + (reason ? ' (' + reason + ')' : ''));
                return false;
            }

            if (!_mainStarted) {
                _Logging.Console(_extensionName, 'RetroArch runtime shader reapply skipped before emulator main loop started: ' + shaderPath + (reason ? ' (' + reason + ')' : ''));
                return false;
            }

            if (!_module || typeof _module.EmscriptenSendCommand !== 'function') {
                _Logging.Console(_extensionName, 'RetroArch runtime shader reapply skipped because EmscriptenSendCommand is unavailable: ' + shaderPath + (reason ? ' (' + reason + ')' : ''));
                return false;
            }

            commandName = 'SET_SHADER ' + shaderPath;

            try {
                _module.EmscriptenSendCommand(commandName);
                _Logging.Console(_extensionName, 'Requested RetroArch runtime shader reapply via SET_SHADER: ' + shaderPath + (reason ? ' (' + reason + ')' : ''));
                if (IsConfiguredPostStartupShaderReapplyMatch(shaderPath)) {
                    _Logging.Console(_extensionName, GetPostStartupShaderReapplyLabel(shaderPath) + ' reapplied after emulator ready: ' + shaderPath);
                }
                return true;
            } catch (e) {
                _Logging.Console(_extensionName, 'RetroArch runtime shader reapply failed for ' + shaderPath + (reason ? ' (' + reason + ')' : '') + ': ' + e);
                return false;
            }
        };

        var RunPostStartupShaderReapplyWhenVisible = function(reason, readyPaintFrames) {
            var readiness;
            var shaderPath = GetActiveShaderPresetPath();
            var shaderLabel = GetPostStartupShaderReapplyLabel(shaderPath);

            _postStartupShaderReapplyFrameRequest = null;
            readiness = GetPostStartupShaderReapplyReadiness();

            if (!readiness.ready) {
                _postStartupShaderReapplyPolls++;

                if (_postStartupShaderReapplyPolls === 1 || _postStartupShaderReapplyPolls % 15 === 0) {
                    _Logging.Console(_extensionName, 'Waiting to reapply RetroArch ' + shaderLabel + ' until startup wrapper is visibly rendering: ' + readiness.reason + ' (poll ' + _postStartupShaderReapplyPolls + '/' + _postStartupShaderReapplyMaxPolls + ', reason=' + reason + ')');
                }

                if (_postStartupShaderReapplyPolls >= _postStartupShaderReapplyMaxPolls) {
                    _Logging.Console(_extensionName, 'Post-startup shader reapply abandoned because visible-canvas readiness was not reached: ' + readiness.reason + ' (reason=' + reason + ')');
                    return;
                }

                _postStartupShaderReapplyFrameRequest = RequestPostStartupShaderReapplyFrame(function() {
                    RunPostStartupShaderReapplyWhenVisible(reason, 0);
                });
                return;
            }

            if (readyPaintFrames < _postStartupShaderReapplyPaintFrames) {
                _postStartupShaderReapplyFrameRequest = RequestPostStartupShaderReapplyFrame(function() {
                    RunPostStartupShaderReapplyWhenVisible(reason, readyPaintFrames + 1);
                });
                return;
            }

            _Logging.Console(_extensionName, 'Visible startup frame detected for RetroArch ' + shaderLabel + ' reapply: ' + readiness.reason + ', canvas=' + readiness.canvasWidth + 'x' + readiness.canvasHeight + ', wrapperOpacity=' + readiness.wrapperOpacity + ', paintFrames=' + readyPaintFrames + ', reason=' + reason);
            ReapplyActiveShaderPreset('visible startup frame after wrapper reveal');
        };

        var SchedulePostStartupShaderReapply = function(reason) {
            var shaderPath = GetActiveShaderPresetPath();
            var shaderLabel;

            if (!shaderPath) {
                _Logging.Console(_extensionName, 'Post-startup shader reapply not scheduled: no active shader preset path' + (reason ? ' (' + reason + ')' : ''));
                return false;
            }

            shaderLabel = GetPostStartupShaderReapplyLabel(shaderPath);

            if (!ShouldReapplyShaderPostStartup(shaderPath)) {
                _Logging.Console(_extensionName, 'Post-startup shader reapply not scheduled for this shader: ' + shaderPath + (reason ? ' (' + reason + ')' : ''));
                return false;
            }

            if (IsConfiguredPostStartupShaderReapplyMatch(shaderPath)) {
                _Logging.Console(_extensionName, 'Post-startup shader reapply enabled by system config for ' + (_gameKey && _gameKey.system ? _gameKey.system : '(unknown system)') + ': ' + shaderLabel + ' -> ' + shaderPath);
            }

            if (_postStartupShaderReapplyAttempted) {
                _Logging.Console(_extensionName, 'Post-startup shader reapply already attempted; not scheduling again for ' + shaderPath + (reason ? ' (' + reason + ')' : ''));
                return false;
            }

            ClearPostStartupShaderReapplyFrame();
            _postStartupShaderReapplyAttempted = true;
            _postStartupShaderReapplyPolls = 0;

            _Logging.Console(_extensionName, 'Scheduling one-time RetroArch ' + shaderLabel + ' reapply on the first visible startup frame: ' + shaderPath + (reason ? ' (' + reason + ')' : ''));

            _postStartupShaderReapplyFrameRequest = RequestPostStartupShaderReapplyFrame(function() {
                RunPostStartupShaderReapplyWhenVisible(reason || 'scheduled', 0);
            });

            return true;
        };

        var IsScreenshotFilename = function(filename) {
            return !!(filename && String(filename).match(/\.(bmp|png|jpg|jpeg)$/i));
        };

        var BuildScreenshotFileKey = function(item) {
            return item.path + '|' + item.size + '|' + item.mtime;
        };

        var ToPlainUint8Array = function(contents) {
            if (!contents) {
                return null;
            }

            if (contents instanceof Uint8Array) {
                return new Uint8Array(contents);
            }

            if (contents.buffer && typeof contents.byteLength === 'number') {
                return new Uint8Array(contents.buffer.slice(contents.byteOffset || 0, (contents.byteOffset || 0) + contents.byteLength));
            }

            if (contents.length !== undefined) {
                return new Uint8Array(contents);
            }

            return null;
        };

        var GetScreenshotSearchDirectories = function() {
            return [
                '/screenshots',
                '/home/web_user/retroarch/userdata/screenshots',
                '/home/web_user/.config/retroarch/screenshots'
            ];
        };

        var ListScreenshotFilesInDirectory = function(FS, directory, depth, results) {
            var entries;
            var i;
            var entry;
            var path;
            var stat;

            if (!FS || !directory || depth > 4) {
                return;
            }

            try {
                entries = FS.readdir(directory);
            } catch (e) {
                return;
            }

            for (i = 0; i < entries.length; i++) {
                entry = entries[i];
                if (entry === '.' || entry === '..') {
                    continue;
                }

                path = directory === '/' ? '/' + entry : directory + '/' + entry;

                try {
                    stat = FS.stat(path);
                } catch (ignore) {
                    stat = null;
                }

                if (stat && FS.isDir && FS.isDir(stat.mode)) {
                    ListScreenshotFilesInDirectory(FS, path, depth + 1, results);
                    continue;
                }

                if (IsScreenshotFilename(entry)) {
                    results.push({
                        path: path,
                        name: entry,
                        size: stat && typeof stat.size === 'number' ? stat.size : 0,
                        mtime: stat && stat.mtime ? Number(stat.mtime) : 0
                    });
                }
            }
        };

        var ListScreenshotFiles = function() {
            var FS = _module.FS;
            var dirs = GetScreenshotSearchDirectories();
            var results = [];
            var i;

            if (!FS || typeof FS.readdir !== 'function') {
                return results;
            }

            for (i = 0; i < dirs.length; i++) {
                ListScreenshotFilesInDirectory(FS, dirs[i], 0, results);
            }

            return results;
        };

        var SnapshotScreenshotFiles = function() {
            var files = ListScreenshotFiles();
            var snapshot = {};
            var i;

            for (i = 0; i < files.length; i++) {
                snapshot[files[i].path] = BuildScreenshotFileKey(files[i]);
            }

            return snapshot;
        };

        var ReadScreenshotFile = function(item) {
            var FS = _module.FS;
            var bytes;

            if (!FS || !item || typeof FS.readFile !== 'function') {
                return null;
            }

            try {
                bytes = FS.readFile(item.path, { encoding: 'binary' });
                bytes = ToPlainUint8Array(bytes);
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to read screenshot file candidate ' + item.path + ': ' + e);
                return null;
            }

            if (!bytes || !bytes.length) {
                return null;
            }

            return bytes;
        };

        var FindNewScreenshotFile = function(request) {
            var files = ListScreenshotFiles();
            var best = null;
            var i;
            var key;

            for (i = 0; i < files.length; i++) {
                key = BuildScreenshotFileKey(files[i]);
                if (!request || !request.knownFiles || request.knownFiles[files[i].path] !== key) {
                    if (!best || files[i].mtime > best.mtime || (files[i].mtime === best.mtime && files[i].size > best.size)) {
                        best = files[i];
                    }
                }
            }

            return best;
        };

        var ClearScreenshotRequestTimers = function(request) {
            var i;

            if (!request || !request.timers) {
                return;
            }

            for (i = 0; i < request.timers.length; i++) {
                clearTimeout(request.timers[i]);
            }
            request.timers = [];
        };

        var CompleteScreenshotRequest = function(request, reason) {
            if (!request || request.fulfilled) {
                return;
            }

            request.fulfilled = true;
            request.fulfilledBy = reason;
            request.completedAt = Date.now();
            ClearScreenshotRequestTimers(request);

            _Logging.Console(_extensionName, 'Screenshot request #' + request.id + ' completed by ' + reason);
        };

        var DataUrlToUint8Array = function(dataUrl) {
            var commaIndex;
            var binary;
            var bytes;
            var i;

            if (!dataUrl || !String(dataUrl).match(/^data:image\/png;base64,/)) {
                return null;
            }

            commaIndex = dataUrl.indexOf(',');
            binary = atob(dataUrl.substr(commaIndex + 1));
            bytes = new Uint8Array(binary.length);

            for (i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            return bytes;
        };

        var CaptureCanvasScreenshotFallback = function() {
            var canvas = _module.canvas || document.getElementById('emulator');
            var gl;
            var width;
            var height;
            var pixels;
            var outCanvas;
            var ctx;
            var imageData;
            var rowSize;
            var y;
            var x;
            var srcOffset;
            var dstOffset;
            var alphaOffset;

            if (!canvas) {
                throw new Error('canvas not found');
            }

            gl = (_module.ctx && typeof _module.ctx.readPixels === 'function') ? _module.ctx : null;
            if (!gl && canvas.GLctxObject && canvas.GLctxObject.GLctx && typeof canvas.GLctxObject.GLctx.readPixels === 'function') {
                gl = canvas.GLctxObject.GLctx;
            }

            if (gl) {
                width = gl.drawingBufferWidth || canvas.width;
                height = gl.drawingBufferHeight || canvas.height;

                if (!width || !height) {
                    throw new Error('WebGL drawing buffer is empty');
                }

                pixels = new Uint8Array(width * height * 4);
                try { gl.finish(); } catch (ignore) {}
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                outCanvas = document.createElement('canvas');
                outCanvas.width = width;
                outCanvas.height = height;
                ctx = outCanvas.getContext('2d');
                imageData = ctx.createImageData(width, height);
                rowSize = width * 4;

                for (y = 0; y < height; y++) {
                    srcOffset = (height - y - 1) * rowSize;
                    dstOffset = y * rowSize;
                    imageData.data.set(pixels.subarray(srcOffset, srcOffset + rowSize), dstOffset);

                    // RetroArch/WebGL can leave alpha at 0 for otherwise visible pixels. CES expects
                    // a normal downloadable PNG, so force the captured frame opaque.
                    for (x = 0; x < width; x++) {
                        alphaOffset = dstOffset + (x * 4) + 3;
                        imageData.data[alphaOffset] = 255;
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                return DataUrlToUint8Array(outCanvas.toDataURL('image/png'));
            }

            if (typeof canvas.toDataURL === 'function') {
                return DataUrlToUint8Array(canvas.toDataURL('image/png'));
            }

            throw new Error('no supported screenshot capture path');
        };

        var Uint8ArrayToBase64 = function(bytes) {
            var binary = '';
            var chunkSize = 0x8000;
            var i;

            if (!(bytes instanceof Uint8Array)) {
                bytes = new Uint8Array(bytes);
            }

            for (i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
            }

            return btoa(binary);
        };

        var EnsureScreenshotGridHeight = function(grid) {
            var requiredHeight = 0;

            if (!grid || !grid.length) {
                return;
            }

            grid.children('.grid-item').each(function() {
                var item = $(this);
                var top = parseFloat(item.css('top'));

                if (isNaN(top)) {
                    top = item.position().top || 0;
                }

                requiredHeight = Math.max(requiredHeight, top + item.outerHeight(true));
            });

            if (requiredHeight > 20 && grid.height() < requiredHeight) {
                grid.css('min-height', Math.ceil(requiredHeight) + 'px');
            }
        };

        var LayoutScreenshotGrid = function(grid, reason) {
            if (!grid || !grid.length) {
                return;
            }

            try {
                if ($.fn && $.fn.isotope && grid.data('isotope')) {
                    grid.isotope('layout');
                }
            } catch (e) {
                _Logging.Console(_extensionName, 'Screenshot grid Isotope layout failed after ' + reason + ': ' + e);
            }

            EnsureScreenshotGridHeight(grid);
        };

        var ScheduleScreenshotGridLayout = function(grid, reason) {
            var delays = [0, 50, 150, 300, 650, 1100];
            var i;

            for (i = 0; i < delays.length; i++) {
                setTimeout(function() {
                    LayoutScreenshotGrid(grid, reason || 'screenshot grid update');
                }, delays[i]);
            }
        };

        var OpenScreenshotsSlider = function(reason) {
            var icon = $('#slidericons li.screenshots');
            var panel = $('#Screenshots-slider');

            if (icon && icon.length && !icon.hasClass('deactivated')) {
                icon.trigger('click');
                _Logging.Console(_extensionName, 'Requested Screenshots slider open after ' + reason);
                return;
            }

            // Fallback for cases where the slider click handler was not reachable but the DOM exists.
            if (panel && panel.length) {
                $('#sliderpanels .slidingpanel.opened').not(panel).removeClass('opened').addClass('closed').hide();
                $('#slidericons li.on').removeClass('on');
                icon.addClass('on');
                panel.removeClass('closed').addClass('opened').show();
                _Logging.Console(_extensionName, 'Opened Screenshots slider DOM fallback after ' + reason);
            }
        };

        var InsertScreenshotIntoCesUiFallback = function(filename, bytes, reason) {
            var panel = $('#Screenshots-slider');
            var grid = $('#screenshotsGrid');
            var base64String;
            var gridItem;
            var img;
            var cacheKey = filename + ':' + bytes.length;

            if (!panel.length || !grid.length) {
                _Logging.Console(_extensionName, 'Screenshot UI fallback skipped; screenshots panel/grid was not found');
                return false;
            }

            if (_screenshotUiFallbackCache[cacheKey]) {
                return false;
            }
            _screenshotUiFallbackCache[cacheKey] = Date.now();

            base64String = Uint8ArrayToBase64(bytes);
            gridItem = $('<div class="grid-item" />');
            gridItem.data('ts', Date.now());
            gridItem.attr('data-ces1222-screenshot', filename);

            img = $('<img />');
            img.on('load', function() {
                ScheduleScreenshotGridLayout(grid, reason || 'screenshot fallback image ready');
            });
            img.attr('src', 'data:image/png;base64,' + base64String);
            img.attr('alt', filename);
            img.on('click', function(e) {
                var link = document.createElement('a');
                link.setAttribute('href', e.currentTarget.src);
                link.setAttribute('download', filename);
                link.setAttribute('target', '_blank');
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            panel.find('.noscreens').hide();
            panel.find('.havescreens').show();
            gridItem.append(img);

            try {
                if ($.fn && $.fn.isotope && grid.data('isotope')) {
                    grid.isotope('insert', gridItem);
                    grid.isotope({
                        sortBy: 'ts',
                        sortAscending: false
                    });
                    LayoutScreenshotGrid(grid, reason || 'screenshot fallback insert');
                } else {
                    grid.prepend(gridItem);
                }
            } catch (e) {
                _Logging.Console(_extensionName, 'Isotope screenshot fallback insert failed; using plain prepend: ' + e);
                try {
                    grid.prepend(gridItem);
                } catch (ignore) {}
            }

            OpenScreenshotsSlider(reason || 'screenshot fallback insert');
            ScheduleScreenshotGridLayout(grid, reason || 'screenshot fallback insert');
            _Logging.Console(_extensionName, 'Inserted screenshot into Screenshots slider by compatibility fallback: ' + filename + ' (' + bytes.length + ' bytes)');
            return true;
        };

        var ScheduleScreenshotUiFallback = function(filename, bytes, reason, gridCountBefore, userVisibleRequest) {
            if (!filename || !bytes || !userVisibleRequest) {
                return;
            }

            setTimeout(function() {
                var currentCount = $('#screenshotsGrid .grid-item').length;

                if (currentCount > gridCountBefore) {
                    OpenScreenshotsSlider(reason || 'screenshotWritten publish');
                    ScheduleScreenshotGridLayout($('#screenshotsGrid'), reason || 'screenshotWritten publish');
                    return;
                }

                InsertScreenshotIntoCesUiFallback(filename, bytes, reason || 'screenshotWritten publish fallback');
            }, 350);
        };

        var PublishScreenshotToCes = function(filename, contents, reason) {
            var bytes = contents;
            var cacheKey;
            var gridCountBefore;
            var userVisibleRequest = !!(_activeScreenshotRequest && _activeScreenshotRequest.userVisible);

            if (!filename || !bytes) {
                _Logging.Console(_extensionName, 'Unable to publish screenshotWritten for ' + (reason || 'unknown reason') + '; missing filename or contents');
                return false;
            }

            if (!(bytes instanceof Uint8Array)) {
                try {
                    bytes = new Uint8Array(bytes);
                } catch (e) {
                    _Logging.Console(_extensionName, 'Unable to normalize screenshot bytes for ' + filename + ' (' + (reason || 'unknown reason') + '): ' + e);
                    return false;
                }
            }

            cacheKey = filename + ':' + bytes.length;
            if (_directScreenshotPublishCache[cacheKey] && Date.now() - _directScreenshotPublishCache[cacheKey] < 3000) {
                _Logging.Console(_extensionName, 'Suppressing duplicate screenshotWritten publish for ' + filename + ' from ' + (reason || 'unknown reason'));
                return false;
            }

            gridCountBefore = $('#screenshotsGrid .grid-item').length;
            _directScreenshotPublishCache[cacheKey] = Date.now();
            _Logging.Console(_extensionName, 'Publishing screenshotWritten compatibility event from ' + (reason || 'unknown reason') + ': ' + filename + ' (' + bytes.length + ' bytes), userVisible=' + userVisibleRequest);
            _PubSub.Publish('screenshotWritten', [filename, bytes, bytes, _gameKey.system, _gameKey.title]);
            ScheduleScreenshotUiFallback(filename, bytes, reason, gridCountBefore, userVisibleRequest);
            return true;
        };

        var PublishCanvasScreenshotFallback = function(request, reason) {
            var bytes;
            var filename;
            var stamp;

            if (!request || request.fulfilled) {
                return false;
            }

            try {
                bytes = CaptureCanvasScreenshotFallback();
            } catch (e) {
                _Logging.Console(_extensionName, 'Canvas screenshot fallback failed after ' + reason + ': ' + e);
                return false;
            }

            if (!bytes || !bytes.length) {
                _Logging.Console(_extensionName, 'Canvas screenshot fallback produced no bytes after ' + reason);
                return false;
            }

            stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
            filename = 'ces-1.22.2-' + stamp + '.png';
            _lastScreenshotFallbackAt = Date.now();
            CompleteScreenshotRequest(request, 'canvas fallback');

            _Logging.Console(_extensionName, 'Publishing canvas screenshot fallback (' + bytes.length + ' bytes) as ' + filename);
            return PublishScreenshotToCes(filename, bytes, 'canvas fallback');
        };

        var CheckScreenshotRequest = function(request, label, allowFallback) {
            var candidate;
            var bytes;

            if (!request || request !== _activeScreenshotRequest || request.fulfilled) {
                return;
            }

            candidate = FindNewScreenshotFile(request);
            if (candidate) {
                bytes = ReadScreenshotFile(candidate);
                if (bytes) {
                    CompleteScreenshotRequest(request, 'filesystem scan: ' + candidate.path);
                    _Logging.Console(_extensionName, 'Detected screenshot file by scan: ' + candidate.path + ' (' + bytes.length + ' bytes)');
                    _module.cesEmulatorFileWritten(candidate.name, bytes);
                    return;
                }
            }

            if (allowFallback) {
                PublishCanvasScreenshotFallback(request, label);
            }
        };

        var ScheduleScreenshotCheck = function(request, delay, label, allowFallback) {
            var timer;

            if (!request) {
                return;
            }

            timer = setTimeout(function() {
                CheckScreenshotRequest(request, label, allowFallback);
            }, delay);

            request.timers.push(timer);
        };

        var BeginScreenshotRequest = function(reason, options) {
            var request;

            options = options || {};

            if (_activeScreenshotRequest && !_activeScreenshotRequest.fulfilled) {
                CompleteScreenshotRequest(_activeScreenshotRequest, 'superseded by newer screenshot request');
            }

            request = {
                id: ++_screenshotRequestCounter,
                reason: reason,
                startedAt: Date.now(),
                knownFiles: SnapshotScreenshotFiles(),
                userVisible: options.userVisible !== false,
                timers: [],
                fulfilled: false,
                fulfilledBy: null
            };

            _activeScreenshotRequest = request;

            _Logging.Console(_extensionName, 'Started screenshot request #' + request.id + ' (' + reason + '), userVisible=' + request.userVisible + '; watching for filesystem output or canvas fallback');

            ScheduleScreenshotCheck(request, 300, 'early filesystem check', false);
            ScheduleScreenshotCheck(request, 900, 'late filesystem check', false);
            ScheduleScreenshotCheck(request, 1600, 'filesystem timeout', true);

            return request;
        };

        var MarkScreenshotFileWriteObserved = function(filename) {
            if (!_activeScreenshotRequest || _activeScreenshotRequest.fulfilled || !IsScreenshotFilename(filename)) {
                return;
            }

            CompleteScreenshotRequest(_activeScreenshotRequest, 'tracked filesystem write: ' + filename);
        };

        var ShouldSuppressLateScreenshotWrite = function(filename) {
            if (!IsScreenshotFilename(filename) || !_activeScreenshotRequest) {
                return false;
            }

            return _activeScreenshotRequest.fulfilled &&
                _activeScreenshotRequest.fulfilledBy === 'canvas fallback' &&
                Date.now() - (_activeScreenshotRequest.completedAt || 0) < 3000;
        };

        var StartRepeatingCommand = function(operation, commandName) {
            if (_legacyCommandRepeatTimers[operation]) {
                return true;
            }

            SendQueuedCommand(commandName, operation);

            _legacyCommandRepeatTimers[operation] = setInterval(function() {
                SendQueuedCommand(commandName, operation + ' hold', true);
            }, 50);

            _Logging.Console(_extensionName, 'Started repeating RetroArch command for ' + operation + ': ' + commandName);
            return true;
        };

        var StopRepeatingCommand = function(operation) {
            if (!_legacyCommandRepeatTimers[operation]) {
                return false;
            }

            clearInterval(_legacyCommandRepeatTimers[operation]);
            delete _legacyCommandRepeatTimers[operation];
            _Logging.Console(_extensionName, 'Stopped repeating RetroArch command for ' + operation);
            return true;
        };

        var ExecuteLegacyOperationCommand = function(operation, event) {
            var command = _legacyCommandByOperation[operation];
            var phase = event && event.type ? event.type : 'keydown';

            if (!operation || !command) {
                return false;
            }

            if (command.type === 'repeat') {
                if (phase === 'keydown') {
                    if (event && event.repeat) {
                        return true;
                    }
                    return StartRepeatingCommand(operation, command.name);
                }

                if (phase === 'keyup') {
                    return StopRepeatingCommand(operation);
                }

                return false;
            }

            if (phase !== command.phase) {
                return false;
            }

            if (event && event.repeat) {
                return true;
            }

            if (command.type === 'direct') {
                if (operation === 'screenshot') {
                    BeginScreenshotRequest('legacy screenshot command', {
                        // ces.emulator.base.js simulates T while building a save state. Those
                        // internal screenshots should feed the save pipeline, but they should not
                        // force-open the user Screenshots slider. Real DOM keypresses and the
                        // manual diagnostics helper remain user-visible.
                        userVisible: !(event && event.keyCodeVal)
                    });
                }
                if (InvokeDirectCommand(command.name, operation)) {
                    return true;
                }

                if (command.fallbackQueued && SendQueuedCommand(command.fallbackQueued, operation + ' fallback queued command')) {
                    _Logging.Console(_extensionName, 'Used queued command fallback for ' + operation + ': ' + command.fallbackQueued);
                    return true;
                }

                if (command.fallbackKeyboard && event) {
                    _Logging.Console(_extensionName, 'Falling back to forwarded keyboard event for direct command operation: ' + operation);
                    return DispatchKeyboardEventToRetroArch(event);
                }

                return false;
            }

            if (command.type === 'queued') {
                return SendQueuedCommand(command.name, operation);
            }

            if (command.type === 'keyboard') {
                _Logging.Console(_extensionName, 'Forwarding keyboard event for legacy command operation: ' + operation);
                return DispatchKeyboardEventToRetroArch(event);
            }

            return false;
        };

        var HandleLegacyBridgeOriginalEvent = function(event) {
            var operation = GetLegacyOperationForEvent(event);

            if (operation) {
                ExecuteLegacyOperationCommand(operation, event);

                // Keep a cloned browser event available for the hold-style commands. This gives
                // RetroArch's normal input driver a chance to see space/R/E if the queued
                // command interface behaves differently in a given browser build.
                if (_legacyCommandByOperation[operation] && _legacyCommandByOperation[operation].type === 'repeat') {
                    DispatchKeyboardEventToRetroArch(event);
                }

                return;
            }

            DispatchKeyboardEventToRetroArch(event);
        };

        var InstallLegacyHotkeyDomBridge = function(reason) {
            if (_legacyHotkeyDomBridgeInstalled || !_legacyInputBridge) {
                return;
            }

            var keydownListener = function(event) {
                if (!ShouldHandleLegacyHotkeyDomEvent(event)) {
                    return;
                }

                StopLegacyHotkeyDomEvent(event);

                if (_legacyInputBridge.keydown && typeof _legacyInputBridge.keydown.handlerFunc === 'function') {
                    _legacyInputBridge.keydown.handlerFunc(event);
                }
            };

            var keyupListener = function(event) {
                if (!ShouldHandleLegacyHotkeyDomEvent(event)) {
                    return;
                }

                StopLegacyHotkeyDomEvent(event);

                if (_legacyInputBridge.keyup && typeof _legacyInputBridge.keyup.handlerFunc === 'function') {
                    _legacyInputBridge.keyup.handlerFunc(event);
                }
            };

            window.addEventListener('keydown', keydownListener, true);
            window.addEventListener('keyup', keyupListener, true);

            _legacyInputBridge.domKeydownListener = keydownListener;
            _legacyInputBridge.domKeyupListener = keyupListener;
            _legacyHotkeyDomBridgeInstalled = true;

            _Logging.Console(_extensionName, 'Installed legacy CES hotkey DOM bridge' + (reason ? ' (' + reason + ')' : ''));
        };

        var GetNodeContentsForTracking = function(node) {
            var contents;
            var usedBytes;

            if (!node || !node.contents) {
                return null;
            }

            contents = node.contents;
            usedBytes = typeof node.usedBytes === 'number' ? node.usedBytes : contents.length;

            if (contents.subarray) {
                return contents.subarray(0, usedBytes);
            }

            if (contents.slice) {
                return contents.slice(0, usedBytes);
            }

            return contents;
        };

        var GetStreamTrackingName = function(stream) {
            if (!stream) {
                return null;
            }

            if (stream.node && stream.node.name) {
                return stream.node.name;
            }

            if (stream.path) {
                var match = String(stream.path).match(/[^\/]+$/);
                return match ? match[0] : stream.path;
            }

            return null;
        };

        var ShouldTrackWriteName = function(filename) {
            return !!(filename && String(filename).match(/\.state\d*$|\.bmp$|\.png$|\.jpg$|\.jpeg$|\.srm$|^retroarch\.cfg$|^retroarch-core-options\.cfg$/i));
        };

        var ShouldTrackReadName = function(filename) {
            return !!(filename && String(filename).match(/\.state\d*$/i));
        };

        var ShouldLogShaderReadName = function(filename) {
            return !!(filename && String(filename).match(/\.(glslp|glsl|params|png|jpg|jpeg|bmp|tga|lut|cube)$/i));
        };

        var InstallFileSystemTrackingCompatibility = function(reason) {
            var FS = _module.FS;

            if (_fileSystemTrackingCompatibilityInstalled || !FS) {
                return;
            }

            if (typeof FS.write === 'function' && !FS.ces1222OriginalWrite) {
                FS.ces1222OriginalWrite = FS.write;
                FS.write = function(stream, buffer, offset, length, position, canOwn) {
                    var result = FS.ces1222OriginalWrite.apply(FS, arguments);
                    var filename = GetStreamTrackingName(stream);
                    var contents;

                    if (_mainStarted && ShouldTrackWriteName(filename) && typeof _module.cesEmulatorFileWritten === 'function') {
                        contents = GetNodeContentsForTracking(stream && stream.node);
                        if (contents) {
                            _module.cesEmulatorFileWritten(filename, contents);
                        }
                    }

                    return result;
                };
            }

            if (typeof FS.read === 'function' && !FS.ces1222OriginalRead) {
                FS.ces1222OriginalRead = FS.read;
                FS.read = function(stream, buffer, offset, length, position) {
                    var result = FS.ces1222OriginalRead.apply(FS, arguments);
                    var filename = GetStreamTrackingName(stream);
                    var contents;

                    if (result > 0 && ShouldLogShaderReadName(filename)) {
                        _Logging.Console(_extensionName, 'Tracked RetroArch shader asset read through FS.read compatibility wrapper: ' + filename + ' (' + result + ' bytes)');
                    }

                    if (_mainStarted && result > 0 && ShouldTrackReadName(filename) && typeof _module.cesEmulatorFileRead === 'function') {
                        contents = GetNodeContentsForTracking(stream && stream.node);
                        if (contents) {
                            _module.cesEmulatorFileRead(filename, contents, null, null, position);
                        }
                    }

                    return result;
                };
            }

            if (typeof FS.readFile === 'function' && !FS.ces1222OriginalReadFile) {
                FS.ces1222OriginalReadFile = FS.readFile;
                FS.readFile = function(path, opts) {
                    var result = FS.ces1222OriginalReadFile.apply(FS, arguments);
                    var filename = null;
                    var match;
                    var contents;

                    if (path) {
                        match = String(path).match(/[^\/]+$/);
                        filename = match ? match[0] : String(path);
                    }

                    if (ShouldLogShaderReadName(filename)) {
                        contents = ToPlainUint8Array(result);
                        _Logging.Console(_extensionName, 'Tracked RetroArch shader asset read through FS.readFile compatibility wrapper: ' + String(path) + ' (' + (contents ? contents.length : 'unknown') + ' bytes)');
                    }

                    if (_mainStarted && ShouldTrackReadName(filename) && typeof _module.cesEmulatorFileRead === 'function') {
                        contents = ToPlainUint8Array(result);
                        if (contents) {
                            _Logging.Console(_extensionName, 'Tracked state file read through FS.readFile compatibility wrapper: ' + filename + ' (' + contents.length + ' bytes)');
                            _module.cesEmulatorFileRead(filename, contents, null, null, 0);
                        }
                    }

                    return result;
                };
            }

            _fileSystemTrackingCompatibilityInstalled = true;
            _Logging.Console(_extensionName, 'Installed FS read/write tracking compatibility' + (reason ? ' (' + reason + ')' : ''));
        };

        var GetOverlayVisibilityReport = function() {
            var overlay = $('#emulatorwrapperoverlay');

            if (!overlay || !overlay.length) {
                return { found: false };
            }

            return {
                found: true,
                visible: overlay.is(':visible'),
                display: overlay.css('display'),
                visibility: overlay.css('visibility'),
                opacity: overlay.css('opacity')
            };
        };

        var IsPauseOverlayVisible = function() {
            var overlay = $('#emulatorwrapperoverlay');
            return !!(overlay && overlay.length && overlay.is(':visible'));
        };

        var GetBrowserMainLoopState = function() {
            var mainLoop = _module && _module.Browser && _module.Browser.mainLoop;

            if (!mainLoop) {
                return { found: false };
            }

            return {
                found: true,
                scheduler: !!mainLoop.scheduler,
                currentlyRunningMainloop: !!mainLoop.currentlyRunningMainloop,
                currentFrameNumber: typeof mainLoop.currentFrameNumber === 'number' ? mainLoop.currentFrameNumber : null
            };
        };

        var SuppressAutoPauseFor = function(milliseconds, reason) {
            _suppressAutoPauseUntil = Math.max(_suppressAutoPauseUntil, Date.now() + milliseconds);
            _suppressAutoPauseReason = reason || 'unknown resume interaction';
        };

        var IsAutoPauseSuppressed = function() {
            return _runtimeGamepadConfigurationUiActive || _overlayResumeInProgress || Date.now() < _suppressAutoPauseUntil;
        };

        var BeginOverlayResumeTransaction = function(reason) {
            _overlayResumeInProgress = true;
            SuppressAutoPauseFor(900, reason || 'pause overlay resume');

            if (_overlayResumeTransactionTimer) {
                clearTimeout(_overlayResumeTransactionTimer);
            }

            _overlayResumeTransactionTimer = setTimeout(function() {
                _overlayResumeTransactionTimer = null;
                _overlayResumeInProgress = false;
                _suppressAutoPauseUntil = 0;
                _Logging.Console(_extensionName, 'Finished overlay resume transaction after bounded timeout');
            }, 900);
        };

        var FinishOverlayResumeTransaction = function(reason) {
            if (_overlayResumeTransactionTimer) {
                clearTimeout(_overlayResumeTransactionTimer);
                _overlayResumeTransactionTimer = null;
            }

            if (_overlayResumeInProgress || _suppressAutoPauseUntil) {
                _Logging.Console(_extensionName, 'Finished overlay resume transaction' + (reason ? ' (' + reason + ')' : ''));
            }

            _overlayResumeInProgress = false;
            _suppressAutoPauseUntil = 0;
        };

        var ShouldSuppressCanvasBlurAutoPause = function(event, source) {
            if (!IsAutoPauseSuppressed()) {
                return false;
            }

            _suppressedAutoPauseCount++;
            _lastSuppressedAutoPauseAt = Date.now();
            _Logging.Console(_extensionName, 'Suppressed CES canvas ' + (event && event.type ? event.type : 'blur') + ' auto-pause during overlay resume transaction (' + (_suppressAutoPauseReason || source || 'resume') + ')');
            return true;
        };

        var FocusCanvasForCesResume = function(reason, triggerJQueryFocus) {
            var canvas = _module.canvas || document.getElementById('emulator');

            if (!canvas) {
                return false;
            }

            try {
                canvas.focus();
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to focus canvas during overlay resume (' + reason + '): ' + e);
            }

            // The stock app resumes from the ReadyPlayerOne jQuery focus handler. Browser focus
            // can be unreliable when the click starts on the overlay, so trigger the same handler
            // as a fallback without blocking the original ces.main.js click path.
            if (triggerJQueryFocus) {
                try {
                    $(canvas).triggerHandler('focus');
                } catch (e) {
                    _Logging.Console(_extensionName, 'Unable to trigger CES canvas focus handler during overlay resume (' + reason + '): ' + e);
                }
            }

            return true;
        };

        var FocusCanvasSoon = function(reason, triggerJQueryFocus) {
            FocusCanvasForCesResume(reason || 'immediate focus', !!triggerJQueryFocus);
            setTimeout(function() { FocusCanvasForCesResume((reason || 'delayed focus') + ' +25ms', !!triggerJQueryFocus); }, 25);
            setTimeout(function() { FocusCanvasForCesResume((reason || 'delayed focus') + ' +150ms', false); }, 150);
        };

        var HidePauseOverlay = function() {
            try {
                $('#emulatorwrapperoverlay').stop(true, true).hide();
            } catch (ignore) {}
        };

        var BeginRuntimeGamepadConfigurationUiFence = function(reason) {
            _runtimeGamepadConfigurationUiActive = true;
            SuppressAutoPauseFor(15000, reason || 'runtime gamepad configuration');
            HidePauseOverlay();
            _Logging.Console(_extensionName, 'Runtime gamepad configuration focus fence enabled' + (reason ? ': ' + reason : ''));
            return {
                ok: true,
                active: true,
                reason: reason || 'runtime gamepad configuration focus fence'
            };
        };

        var EndRuntimeGamepadConfigurationUiFence = function(reason) {
            _runtimeGamepadConfigurationUiActive = false;
            if (!_overlayResumeInProgress) {
                _suppressAutoPauseUntil = 0;
                _suppressAutoPauseReason = '';
            }
            HidePauseOverlay();
            _Logging.Console(_extensionName, 'Runtime gamepad configuration focus fence disabled' + (reason ? ': ' + reason : ''));
            return {
                ok: true,
                active: false,
                reason: reason || 'runtime gamepad configuration focus fence ended'
            };
        };

        var InvokeRuntimeGamepadConfigurationPause = function(reason) {
            var ok = false;
            var via = null;

            reason = reason || 'runtime gamepad configuration pause';

            if (_runtimeGamepadConfigurationPauseActive) {
                HidePauseOverlay();
                return {
                    ok: true,
                    paused: true,
                    alreadyPaused: true,
                    via: 'already-paused',
                    simulatedKey: 'P',
                    keyCode: 80,
                    reason: reason
                };
            }

            _runtimeGamepadConfigurationPauseUsedToggle = false;

            if (typeof _module._cmd_pause === 'function') {
                ok = InvokeDirectCommand('_cmd_pause', reason + ' (P hotkey equivalent)');
                via = '_cmd_pause';
            }

            if (!ok && typeof _module._cmd_toggle_pause === 'function') {
                ok = InvokeDirectCommand('_cmd_toggle_pause', reason + ' fallback P toggle');
                via = '_cmd_toggle_pause';
                _runtimeGamepadConfigurationPauseUsedToggle = ok;
            }

            if (ok) {
                _runtimeGamepadConfigurationPauseActive = true;
                _lastRuntimeGamepadConfigurationPauseAt = Date.now();
                HidePauseOverlay();
                _Logging.Console(_extensionName, 'Paused RetroArch for runtime gamepad configuration via ' + via + ' (P key semantics, no CES overlay)');
                return {
                    ok: true,
                    paused: true,
                    via: via,
                    simulatedKey: 'P',
                    keyCode: 80,
                    reason: reason
                };
            }

            return {
                ok: false,
                paused: false,
                via: null,
                simulatedKey: 'P',
                keyCode: 80,
                reason: 'RetroArch pause command unavailable for runtime gamepad configuration'
            };
        };

        var InvokeRuntimeGamepadConfigurationResume = function(reason) {
            var ok = false;
            var via = null;

            reason = reason || 'runtime gamepad configuration resume';

            if (!_runtimeGamepadConfigurationPauseActive) {
                HidePauseOverlay();
                return {
                    ok: true,
                    paused: false,
                    alreadyResumed: true,
                    via: 'already-resumed',
                    simulatedKey: 'P',
                    keyCode: 80,
                    reason: reason
                };
            }

            if (typeof _module._cmd_unpause === 'function') {
                ok = InvokeDirectCommand('_cmd_unpause', reason + ' (P hotkey resume equivalent)');
                via = '_cmd_unpause';
            }

            if (!ok && typeof _module._cmd_toggle_pause === 'function') {
                ok = InvokeDirectCommand('_cmd_toggle_pause', reason + ' fallback P toggle');
                via = '_cmd_toggle_pause';
            }

            if (ok) {
                _runtimeGamepadConfigurationPauseActive = false;
                _runtimeGamepadConfigurationPauseUsedToggle = false;
                _lastRuntimeGamepadConfigurationResumeAt = Date.now();
                HidePauseOverlay();
                _Logging.Console(_extensionName, 'Resumed RetroArch after runtime gamepad configuration via ' + via + ' (P key semantics, no CES overlay)');
                return {
                    ok: true,
                    paused: false,
                    via: via,
                    simulatedKey: 'P',
                    keyCode: 80,
                    reason: reason
                };
            }

            return {
                ok: false,
                paused: true,
                via: null,
                simulatedKey: 'P',
                keyCode: 80,
                reason: 'RetroArch unpause command unavailable for runtime gamepad configuration'
            };
        };

        var InvokeRetroArchOverlayPause = function(reason) {
            var ok = false;

            _retroArchOverlayPauseUsedToggle = false;

            if (typeof _module._cmd_pause === 'function') {
                ok = InvokeDirectCommand('_cmd_pause', reason);
            }

            if (!ok && typeof _module._cmd_toggle_pause === 'function') {
                ok = InvokeDirectCommand('_cmd_toggle_pause', reason + ' fallback toggle');
                _retroArchOverlayPauseUsedToggle = ok;
            }

            if (ok) {
                _retroArchOverlayPauseCommandSent = true;
                _retroArchOverlayPauseActive = true;
                _lastRetroArchOverlayPauseAt = Date.now();
                _Logging.Console(_extensionName, 'CES overlay pause was translated to RetroArch pause command; Browser main loop left running');
            }

            return ok;
        };

        var InvokeRetroArchOverlayUnpause = function(reason) {
            var ok = false;

            if (typeof _module._cmd_unpause === 'function') {
                ok = InvokeDirectCommand('_cmd_unpause', reason);
            }

            if (!ok && _retroArchOverlayPauseUsedToggle && typeof _module._cmd_toggle_pause === 'function') {
                ok = InvokeDirectCommand('_cmd_toggle_pause', reason + ' fallback toggle');
            }

            if (ok) {
                _lastRetroArchOverlayResumeAt = Date.now();
                _Logging.Console(_extensionName, 'CES overlay resume was translated to RetroArch unpause command');
            }

            _retroArchOverlayPauseActive = false;
            _retroArchOverlayPauseCommandSent = false;
            _retroArchOverlayPauseUsedToggle = false;

            return ok;
        };

        var PauseForCesOverlay = function(reason, args) {
            var result;

            if (IsAutoPauseSuppressed()) {
                _suppressedAutoPauseCount++;
                _lastSuppressedAutoPauseAt = Date.now();
                _Logging.Console(_extensionName, 'Suppressed duplicate CES pauseMainLoop during overlay resume transaction (' + (_suppressAutoPauseReason || reason) + ')');
                return;
            }

            if (_cesMainLoopPausedByCes || _retroArchOverlayPauseActive) {
                _Logging.Console(_extensionName, 'pauseMainLoop requested while CES overlay pause is already active; ignoring duplicate pause');
                return;
            }

            _cesMainLoopPausedByCes = true;
            _browserMainLoopPausedByCes = false;
            _lastCesPauseMainLoopAt = Date.now();
            _Logging.Console(_extensionName, 'pauseMainLoop requested by CES overlay; using RetroArch pause semantics');

            if (InvokeRetroArchOverlayPause(reason || 'CES overlay pause')) {
                return;
            }

            // The 1.22.2 NES runtime is expected to expose _cmd_pause/_cmd_unpause. Keep the old
            // Emscripten scheduler pause only as a defensive fallback for an unexpected runtime.
            if (typeof _module.ces1222OriginalPauseMainLoop === 'function') {
                _browserMainLoopPausedByCes = true;
                _Logging.Console(_extensionName, 'RetroArch pause command unavailable; falling back to original Emscripten pauseMainLoop');
                result = _module.ces1222OriginalPauseMainLoop.apply(_module, args || []);
                return result;
            }

            _Logging.Console(_extensionName, 'No RetroArch pause command or original pauseMainLoop was available for CES overlay pause');
        };

        var ResumeForCesOverlay = function(reason, args) {
            var result;
            var browserWasPaused = _browserMainLoopPausedByCes;
            var retroArchPauseWasActive = _retroArchOverlayPauseActive || _retroArchOverlayPauseCommandSent || _cesMainLoopPausedByCes || IsPauseOverlayVisible();

            _cesMainLoopPausedByCes = false;
            _browserMainLoopPausedByCes = false;
            _lastCesResumeMainLoopAt = Date.now();

            BeginOverlayResumeTransaction(reason || 'CES overlay resume');
            _Logging.Console(_extensionName, 'resumeMainLoop requested by CES overlay; retroArchPauseActive=' + retroArchPauseWasActive + ', browserPaused=' + browserWasPaused + ', overlayVisible=' + IsPauseOverlayVisible());

            if (browserWasPaused && typeof _module.ces1222OriginalResumeMainLoop === 'function') {
                try {
                    result = _module.ces1222OriginalResumeMainLoop.apply(_module, args || []);
                    _Logging.Console(_extensionName, 'Resumed original Emscripten main loop fallback during CES overlay resume');
                } catch (e) {
                    _Logging.Console(_extensionName, 'Original resumeMainLoop fallback failed during CES overlay resume: ' + e);
                }
            }

            if (retroArchPauseWasActive) {
                InvokeRetroArchOverlayUnpause(reason || 'CES overlay resume');
            }

            HidePauseOverlay();
            FocusCanvasSoon((reason || 'CES overlay resume') + ' post-resume focus', false);
            ScheduleOverlayResumeVerification(reason || 'CES overlay resume');
            return result;
        };

        var ScheduleOverlayResumeVerification = function(reason) {
            var startState = GetBrowserMainLoopState();
            var startFrame = startState.currentFrameNumber;
            var checks = [50, 150, 300, 600];
            var i;

            for (i = 0; i < checks.length; i++) {
                (function(delay) {
                    setTimeout(function() {
                        var state = GetBrowserMainLoopState();
                        var advanced = typeof startFrame === 'number' && typeof state.currentFrameNumber === 'number' && state.currentFrameNumber > startFrame;

                        _Logging.Console(_extensionName, 'Overlay resume verification +' + delay + 'ms: frame=' + state.currentFrameNumber + ', advanced=' + advanced + ', scheduler=' + state.scheduler + ', running=' + state.currentlyRunningMainloop + ', overlayVisible=' + IsPauseOverlayVisible() + ', retroArchOverlayPauseActive=' + _retroArchOverlayPauseActive);

                        if (delay === 600) {
                            FinishOverlayResumeTransaction(reason + ' verification complete');
                        }
                    }, delay);
                })(checks[i]);
            }
        };

        var ResumeThroughCesBase = function(reason) {
            var usedBaseBridge = false;

            if (_basePauseResumeBridge && typeof _basePauseResumeBridge.resume === 'function') {
                try {
                    _basePauseResumeBridge.resume();
                    usedBaseBridge = true;
                    _Logging.Console(_extensionName, 'Requested overlay resume through CES base bridge (' + reason + ')');
                } catch (e) {
                    _Logging.Console(_extensionName, 'CES base bridge resume failed during overlay resume (' + reason + '): ' + e);
                }
            }

            if (!usedBaseBridge) {
                FocusCanvasForCesResume(reason + ' focus fallback', true);
            }

            if (_retroArchOverlayPauseActive || _retroArchOverlayPauseCommandSent || _cesMainLoopPausedByCes || _browserMainLoopPausedByCes) {
                ResumeForCesOverlay(reason + ' direct cleanup', []);
            }

            HidePauseOverlay();
            FocusCanvasSoon(reason + ' final focus', false);
            return true;
        };

        var ForceCesOverlayResume = function(reason) {
            _forcedOverlayResumeCount++;
            BeginOverlayResumeTransaction(reason || 'forced overlay resume');
            _Logging.Console(_extensionName, 'Running CES overlay resume fallback through RetroArch pause semantics (' + reason + ')');
            return ResumeThroughCesBase(reason || 'forced overlay resume');
        };

        this.cesForceResumeFromCes = function(reason) {
            return ForceCesOverlayResume(reason || 'manual request');
        };

        this.cesBeginRuntimeGamepadConfigurationUi = function(reason) {
            return BeginRuntimeGamepadConfigurationUiFence(reason || 'runtime gamepad configuration');
        };

        this.cesEndRuntimeGamepadConfigurationUi = function(reason) {
            return EndRuntimeGamepadConfigurationUiFence(reason || 'runtime gamepad configuration ended');
        };

        this.cesIsRuntimeGamepadConfigurationUiActive = function() {
            return !!_runtimeGamepadConfigurationUiActive;
        };

        this.cesPauseForRuntimeGamepadConfiguration = function(reason) {
            return InvokeRuntimeGamepadConfigurationPause(reason || 'runtime gamepad configuration pause');
        };

        this.cesResumeForRuntimeGamepadConfiguration = function(reason) {
            return InvokeRuntimeGamepadConfigurationResume(reason || 'runtime gamepad configuration resume');
        };

        this.cesBeforeCanvasBlurPause = function(event) {
            if (ShouldSuppressCanvasBlurAutoPause(event, 'cesBeforeCanvasBlurPause')) {
                HidePauseOverlay();
                return false;
            }

            return true;
        };

        this.cesAfterCanvasFocusResume = function(event) {
            if (_overlayResumeInProgress || _retroArchOverlayPauseActive || _retroArchOverlayPauseCommandSent) {
                ScheduleOverlayResumeVerification('canvas focus resume');
            }
        };

        this.cesRegisterBasePauseResumeBridge = function(bridge) {
            _basePauseResumeBridge = bridge || null;
            _Logging.Console(_extensionName, 'Registered CES base pause/resume bridge for overlay fallback');
        };

        var IsEventInsidePauseOverlay = function(event) {
            var overlay = document.getElementById('emulatorwrapperoverlay');

            if (!overlay || !event || !event.target) {
                return false;
            }

            return event.target === overlay || (overlay.contains && overlay.contains(event.target));
        };

        var ScheduleOverlayResumeFallback = function(reason, delay) {
            if (_overlayResumeFallbackTimer) {
                clearTimeout(_overlayResumeFallbackTimer);
            }

            _overlayResumeFallbackTimer = setTimeout(function() {
                _overlayResumeFallbackTimer = null;

                if (IsPauseOverlayVisible() || _cesMainLoopPausedByCes || _retroArchOverlayPauseActive || _retroArchOverlayPauseCommandSent) {
                    ForceCesOverlayResume(reason);
                } else {
                    _Logging.Console(_extensionName, 'Overlay resume fallback not needed after ' + reason);
                }
            }, typeof delay === 'number' ? delay : 80);
        };

        var InstallOverlayResumeCompatibility = function(reason) {
            var overlay = document.getElementById('emulatorwrapperoverlay');
            var handler;
            var i;

            if (_overlayResumeCompatibilityInstalled || !overlay) {
                return;
            }

            handler = function(event) {
                if (!IsEventInsidePauseOverlay(event)) {
                    return;
                }

                // Do not preventDefault/stopPropagation here. ces.main.js still owns the normal
                // overlay click -> #emulator.focus() path, which lets ces.emulator.base.js clear its
                // private _isPaused flag. This listener only opens a short transaction that prevents
                // the same click from creating a second blur-driven auto-pause after resume.
                BeginOverlayResumeTransaction('pause overlay ' + event.type);
                _Logging.Console(_extensionName, 'Observed pause overlay ' + event.type + '; preserving original focus handler and preparing RetroArch-style resume fallback');
                ScheduleOverlayResumeFallback('pause overlay ' + event.type, event.type === 'click' ? 0 : 250);
            };

            for (i = 0; i < _overlayResumeEventNames.length; i++) {
                overlay.addEventListener(_overlayResumeEventNames[i], handler, false);
            }

            overlay.ces1222OverlayResumeHandler = handler;
            _overlayResumeCompatibilityInstalled = true;
            _Logging.Console(_extensionName, 'Installed RetroArch-style overlay pause/resume compatibility' + (reason ? ' (' + reason + ')' : ''));
        };

        var InstallPauseResumeCompatibility = function(reason) {
            var pauseWrapperReady = false;
            var resumeWrapperReady = false;

            if (_pauseResumeCompatibilityInstalled) {
                return;
            }

            if (typeof _module.pauseMainLoop === 'function') {
                if (!_module.ces1222OriginalPauseMainLoop) {
                    _module.ces1222OriginalPauseMainLoop = _module.pauseMainLoop;
                    _module.pauseMainLoop = function() {
                        return PauseForCesOverlay('CES pauseMainLoop', arguments);
                    };
                }
                pauseWrapperReady = true;
            }

            if (typeof _module.resumeMainLoop === 'function') {
                if (!_module.ces1222OriginalResumeMainLoop) {
                    _module.ces1222OriginalResumeMainLoop = _module.resumeMainLoop;
                    _module.resumeMainLoop = function() {
                        return ResumeForCesOverlay('CES resumeMainLoop', arguments);
                    };
                }
                resumeWrapperReady = true;
            }

            InstallOverlayResumeCompatibility(reason);

            if (!pauseWrapperReady || !resumeWrapperReady) {
                _Logging.Console(_extensionName, 'Pause/resume compatibility waiting for runtime pauseMainLoop/resumeMainLoop functions' + (reason ? ' (' + reason + ')' : ''));
                return;
            }

            _pauseResumeCompatibilityInstalled = true;
            _Logging.Console(_extensionName, 'Installed pause/resume compatibility' + (reason ? ' (' + reason + ')' : '') + '; CES overlay pause now maps to RetroArch pause/unpause commands');
        };

        var ClearActiveScreenshotRequestTimers = function(reason) {
            var i;

            if (!_activeScreenshotRequest || !_activeScreenshotRequest.timers) {
                return;
            }

            for (i = 0; i < _activeScreenshotRequest.timers.length; i++) {
                clearTimeout(_activeScreenshotRequest.timers[i]);
            }

            _activeScreenshotRequest.timers = [];
            _Logging.Console(_extensionName, 'Cleared active screenshot timers during compatibility cleanup (' + reason + ')');
        };

        var StopAllLegacyCommandRepeatTimers = function(reason) {
            var operation;
            var stopped = 0;

            for (operation in _legacyCommandRepeatTimers) {
                if (_legacyCommandRepeatTimers.hasOwnProperty(operation)) {
                    clearInterval(_legacyCommandRepeatTimers[operation]);
                    stopped++;
                }
            }

            _legacyCommandRepeatTimers = {};

            if (stopped) {
                _Logging.Console(_extensionName, 'Stopped ' + stopped + ' active repeat command timer(s) during compatibility cleanup (' + reason + ')');
            }
        };

        var DisposeLegacyHotkeyDomBridge = function(reason) {
            var removed = false;

            if (_legacyInputBridge) {
                if (_legacyInputBridge.domKeydownListener) {
                    window.removeEventListener('keydown', _legacyInputBridge.domKeydownListener, true);
                    delete _legacyInputBridge.domKeydownListener;
                    removed = true;
                }

                if (_legacyInputBridge.domKeyupListener) {
                    window.removeEventListener('keyup', _legacyInputBridge.domKeyupListener, true);
                    delete _legacyInputBridge.domKeyupListener;
                    removed = true;
                }
            }

            _legacyHotkeyDomBridgeInstalled = false;
            _legacyInputBridge = null;

            if (removed) {
                _Logging.Console(_extensionName, 'Removed legacy CES hotkey DOM bridge during compatibility cleanup (' + reason + ')');
            }
        };

        var DisposeOverlayResumeCompatibility = function(reason) {
            var overlay = document.getElementById('emulatorwrapperoverlay');
            var handler;
            var i;

            if (!overlay) {
                _overlayResumeCompatibilityInstalled = false;
                return;
            }

            handler = overlay.ces1222OverlayResumeHandler;

            if (handler) {
                for (i = 0; i < _overlayResumeEventNames.length; i++) {
                    overlay.removeEventListener(_overlayResumeEventNames[i], handler, false);
                }
                overlay.ces1222OverlayResumeHandler = null;
                _Logging.Console(_extensionName, 'Removed overlay resume compatibility handlers during compatibility cleanup (' + reason + ')');
            }

            _overlayResumeCompatibilityInstalled = false;
        };

        var DisposeCompatibilityHandlers = function(reason) {
            reason = reason || 'cleanup';

            StopAllLegacyCommandRepeatTimers(reason);
            DisposeLegacyHotkeyDomBridge(reason);
            DisposeOverlayResumeCompatibility(reason);
            ClearActiveScreenshotRequestTimers(reason);

            if (_overlayResumeFallbackTimer) {
                clearTimeout(_overlayResumeFallbackTimer);
                _overlayResumeFallbackTimer = null;
            }

            if (_overlayResumeTransactionTimer) {
                clearTimeout(_overlayResumeTransactionTimer);
                _overlayResumeTransactionTimer = null;
            }

            if (_fallbackRevealTimer) {
                clearTimeout(_fallbackRevealTimer);
                _fallbackRevealTimer = null;
            }

            if (_canvasReadyTimer) {
                clearTimeout(_canvasReadyTimer);
                _canvasReadyTimer = null;
            }

            if (_renderDiagnosticTimer) {
                clearTimeout(_renderDiagnosticTimer);
                _renderDiagnosticTimer = null;
            }

            _inputHelperCompatibilityInstalled = false;
            _pauseResumeCompatibilityInstalled = false;
            _overlayResumeInProgress = false;
            _cesMainLoopPausedByCes = false;
            _browserMainLoopPausedByCes = false;
            _retroArchOverlayPauseActive = false;
            _retroArchOverlayPauseCommandSent = false;
            _retroArchOverlayPauseUsedToggle = false;
            _runtimeGamepadConfigurationUiActive = false;
            _runtimeGamepadConfigurationPauseActive = false;
            _runtimeGamepadConfigurationPauseUsedToggle = false;
            _suppressAutoPauseUntil = 0;
            _suppressAutoPauseReason = '';
            _basePauseResumeBridge = null;

            if (window.cesRetroArch1222Controls && window.cesRetroArch1222Controls.module === _module) {
                window.cesRetroArch1222Controls.module = null;
            }

            _Logging.Console(_extensionName, 'Disposed RetroArch 1.22.2 compatibility handlers (' + reason + ')');
        };

        this.cesBeforeCleanUp = function(reason) {
            StopFpsMeter(reason || 'cesBeforeCleanUp');
            DisposeCompatibilityHandlers(reason || 'cesBeforeCleanUp');
        };

        this.cesReportControlsCompatibility = function() {
            var gamepads = [];

            try {
                if (navigator.getGamepads) {
                    var pads = navigator.getGamepads();
                    for (var i = 0; i < pads.length; i++) {
                        if (pads[i]) {
                            gamepads.push({
                                index: pads[i].index,
                                id: pads[i].id,
                                connected: pads[i].connected,
                                buttons: pads[i].buttons ? pads[i].buttons.length : 0,
                                axes: pads[i].axes ? pads[i].axes.length : 0,
                                mapping: pads[i].mapping
                            });
                        }
                    }
                }
            } catch (e) {}

            var report = {
                hotkeyDomBridgeInstalled: _legacyHotkeyDomBridgeInstalled,
                inputHelperBridgeInstalled: _inputHelperCompatibilityInstalled,
                fsTrackingInstalled: _fileSystemTrackingCompatibilityInstalled,
                pauseResumeCompatibilityInstalled: _pauseResumeCompatibilityInstalled,
                overlayResumeCompatibilityInstalled: _overlayResumeCompatibilityInstalled,
                cesMainLoopPausedByCes: _cesMainLoopPausedByCes,
                browserMainLoopPausedByCes: _browserMainLoopPausedByCes,
                retroArchOverlayPauseActive: _retroArchOverlayPauseActive,
                retroArchOverlayPauseCommandSent: _retroArchOverlayPauseCommandSent,
                retroArchOverlayPauseUsedToggleFallback: _retroArchOverlayPauseUsedToggle,
                overlayResumeInProgress: _overlayResumeInProgress,
                basePauseResumeBridgeRegistered: !!_basePauseResumeBridge,
                lastRetroArchOverlayPauseAt: _lastRetroArchOverlayPauseAt,
                lastRetroArchOverlayResumeAt: _lastRetroArchOverlayResumeAt,
                browserMainLoopState: GetBrowserMainLoopState(),
                lastBrowserGamepadReplay: _lastBrowserGamepadReplayReport,
                autoPauseSuppressed: IsAutoPauseSuppressed(),
                suppressAutoPauseReason: _suppressAutoPauseReason,
                suppressAutoPauseRemainingMs: Math.max(0, _suppressAutoPauseUntil - Date.now()),
                suppressedAutoPauseCount: _suppressedAutoPauseCount,
                lastSuppressedAutoPauseAt: _lastSuppressedAutoPauseAt,
                lastCesPauseMainLoopAt: _lastCesPauseMainLoopAt,
                lastCesResumeMainLoopAt: _lastCesResumeMainLoopAt,
                forcedOverlayResumeCount: _forcedOverlayResumeCount,
                pauseOverlay: GetOverlayVisibilityReport(),
                runtimeGamepadConfiguration: {
                    uiActive: _runtimeGamepadConfigurationUiActive,
                    pauseActive: _runtimeGamepadConfigurationPauseActive,
                    pauseUsedToggle: _runtimeGamepadConfigurationPauseUsedToggle,
                    lastPauseAt: _lastRuntimeGamepadConfigurationPauseAt,
                    lastResumeAt: _lastRuntimeGamepadConfigurationResumeAt
                },
                activeRepeatCommands: Object.keys(_legacyCommandRepeatTimers),
                screenshotRequest: _activeScreenshotRequest ? {
                    id: _activeScreenshotRequest.id,
                    reason: _activeScreenshotRequest.reason,
                    startedAt: _activeScreenshotRequest.startedAt,
                    fulfilled: _activeScreenshotRequest.fulfilled,
                    fulfilledBy: _activeScreenshotRequest.fulfilledBy,
                    completedAt: _activeScreenshotRequest.completedAt || null,
                    userVisible: _activeScreenshotRequest.userVisible
                } : null,
                lastScreenshotFallbackAt: _lastScreenshotFallbackAt,
                lastStartupStateCommandReport: _lastStartupStateCommandReport,
                lastStateLoadLogSignal: _lastStateLoadLogSignal,
                startupStateAudioMute: _lastStartupStateAudioMuteReport,
                exportedCommands: {
                    saveState: typeof _module._cmd_save_state === 'function',
                    loadState: typeof _module._cmd_load_state === 'function',
                    screenshot: typeof _module._cmd_take_screenshot === 'function',
                    pause: typeof _module._cmd_pause === 'function',
                    unpause: typeof _module._cmd_unpause === 'function',
                    togglePause: typeof _module._cmd_toggle_pause === 'function',
                    reset: typeof _module._cmd_reset === 'function',
                    commandQueue: typeof _module.EmscriptenSendCommand === 'function'
                },
                gamepads: gamepads
            };

            _Logging.Console(_extensionName, 'Controls compatibility report: ' + SafeStringify(report));
            return report;
        };

        var BuildSyntheticHotkeyEvent = function(operation) {
            var keyMetaByOperation = {
                statesave: { keyCode: 49, key: '1', code: 'Digit1' },
                loadstate: { keyCode: 52, key: '4', code: 'Digit4' },
                screenshot: { keyCode: 84, key: 't', code: 'KeyT' },
                pause: { keyCode: 80, key: 'p', code: 'KeyP' },
                mute: { keyCode: 77, key: 'm', code: 'KeyM' },
                reset: { keyCode: 72, key: 'h', code: 'KeyH' },
                exit: { keyCode: 27, key: 'Escape', code: 'Escape' },
                fastforward: { keyCode: 32, key: ' ', code: 'Space' },
                slowmotion: { keyCode: 69, key: 'e', code: 'KeyE' },
                reverse: { keyCode: 82, key: 'r', code: 'KeyR' }
            };
            var meta = keyMetaByOperation[operation] || { keyCode: 0 };
            var keyCode = meta.keyCode || 0;

            return {
                type: 'keydown',
                keyCode: keyCode,
                which: keyCode,
                keyCodeVal: keyCode,
                key: meta.key,
                code: meta.code,
                ces1222SyntheticHotkey: true,
                target: _module.canvas || document.getElementById('emulator') || window
            };
        };

        this.cesInvokeLegacyCommand = function(operation) {
            return ExecuteLegacyOperationCommand(operation, BuildSyntheticHotkeyEvent(operation));
        };

        this.cesAttemptStartupStateLoadCommand = function(context) {
            var report;
            var forceFallbacks;
            var record = function(method, ok) {
                report.attempts.push({ method: method, ok: !!ok });
                return !!ok;
            };
            var ok = false;
            var keyEvent = BuildSyntheticHotkeyEvent('loadstate');

            context = context || {};
            forceFallbacks = !!context.forceFallbacks;
            report = {
                context: context,
                forceFallbacks: forceFallbacks,
                mainStarted: _mainStarted,
                commandQueueAvailable: !!(_module && typeof _module.EmscriptenSendCommand === 'function'),
                directLoadStateAvailable: !!(_module && typeof _module._cmd_load_state === 'function'),
                dispatchTargets: BuildRetroArchKeyDispatchTargets().length,
                attempts: []
            };

            if (record('_cmd_load_state', InvokeDirectCommand('_cmd_load_state', 'startup state load helper'))) {
                ok = true;
            }

            if ((forceFallbacks || !ok) && record('EmscriptenSendCommand LOAD_STATE', SendQueuedCommand('LOAD_STATE', 'startup state load helper queued command', false))) {
                ok = true;
            }

            if ((forceFallbacks || !ok) && record('forwarded keyboard keydown 52', DispatchKeyboardEventToRetroArch(keyEvent))) {
                ok = true;
            }

            report.ok = ok;
            _lastStartupStateCommandReport = report;
            _Logging.Console(_extensionName, 'Startup state-load command helper report: ' + SafeStringify(report));
            return report;
        };

        var InstallInputHelperKeypressCompatibility = function(reason) {
            if (_inputHelperCompatibilityInstalled) {
                InstallLegacyHotkeyDomBridge(reason);
                return;
            }

            if (!self || !self._InputHelper ||
                typeof self._InputHelper.OverrideEmulatorKeydownHandler !== 'function' ||
                typeof self._InputHelper.OverrideEmulatorKeyupHandler !== 'function') {
                return;
            }

            // RetroArch 1.22.2 registers keyboard events through newer Emscripten code that
            // no longer calls Module.cesEventHandlerRegistered. Build the old CES handler
            // cache explicitly, then wire real DOM hotkey events into it. The original
            // handler side of the bridge invokes the new RetroArch command exports/queue.
            try {
                _legacyInputBridge = _legacyInputBridge || {};

                _legacyInputBridge.keydown = self._InputHelper.OverrideEmulatorKeydownHandler({
                    target: window,
                    eventTypeString: 'keydown',
                    handlerFunc: HandleLegacyBridgeOriginalEvent
                });

                _legacyInputBridge.keyup = self._InputHelper.OverrideEmulatorKeyupHandler({
                    target: window,
                    eventTypeString: 'keyup',
                    handlerFunc: HandleLegacyBridgeOriginalEvent
                });

                _inputHelperCompatibilityInstalled = true;
                _Logging.Console(_extensionName, 'Installed input-helper startup keypress compatibility bridge' + (reason ? ' (' + reason + ')' : ''));
                InstallLegacyHotkeyDomBridge(reason);
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to install input-helper startup keypress compatibility bridge: ' + e);
            }
        };

        var BuildFsPath = function(FS, parent, name) {
            var parentPath = parent;
            var fileName = name;

            if (parentPath && typeof parentPath !== 'string' && FS && typeof FS.getPath === 'function') {
                parentPath = FS.getPath(parentPath);
            }

            if (!parentPath) {
                parentPath = '/';
            }

            if (!fileName) {
                return parentPath;
            }

            // Emscripten's old PATH.join2 normalized this case. Keep that behavior for save-state names.
            while (fileName.charAt(0) === '/') {
                fileName = fileName.substr(1);
            }

            if (parentPath.charAt(parentPath.length - 1) === '/') {
                return parentPath + fileName;
            }

            return parentPath + '/' + fileName;
        };

        var FindFsObject = function(FS, path) {
            try {
                if (FS && typeof FS.findObject === 'function') {
                    return FS.findObject(path);
                }
            } catch (e) {}

            try {
                if (FS && typeof FS.lookupPath === 'function') {
                    var lookup = FS.lookupPath(path, { follow: true });
                    return lookup ? lookup.node : null;
                }
            } catch (e) {}

            return null;
        };

        var FsPathExists = function(FS, path) {
            try {
                if (FS && typeof FS.analyzePath === 'function') {
                    var result = FS.analyzePath(path);
                    return !!(result && result.exists);
                }
            } catch (e) {}

            return !!FindFsObject(FS, path);
        };

        var GetFsParentDirectory = function(path) {
            var match;

            if (!path) {
                return null;
            }

            match = String(path).replace(/\\/g, '/').match(/^(.*)\/[^\/]+$/);
            return match ? (match[1] || '/') : '/';
        };

        var EnsureFsDirectoryPath = function(FS, path) {
            var parts;
            var current = '';
            var i;

            if (!FS || !path || path === '/') {
                return;
            }

            path = String(path).replace(/\\/g, '/');

            if (FsPathExists(FS, path)) {
                return;
            }

            if (typeof FS.mkdirTree === 'function') {
                FS.mkdirTree(path);
                return;
            }

            parts = path.split('/');
            for (i = 0; i < parts.length; i++) {
                if (!parts[i]) {
                    continue;
                }

                current += '/' + parts[i];
                if (!FsPathExists(FS, current)) {
                    FS.mkdir(current);
                }
            }
        };

        var EnsureFsParentDirectoryForFile = function(FS, filePath) {
            var parent = GetFsParentDirectory(filePath);

            if (parent && parent !== '/') {
                EnsureFsDirectoryPath(FS, parent);
            }
        };

        var WriteFsFileReplacingExisting = function(FS, path, contents) {
            var options = {};

            EnsureFsParentDirectoryForFile(FS, path);

            if (FsPathExists(FS, path)) {
                try {
                    FS.unlink(path);
                } catch (e) {}
            }

            if (typeof contents !== 'string') {
                options.encoding = 'binary';
            }

            if (typeof FS.writeFile === 'function') {
                FS.writeFile(path, contents, options);
                return FindFsObject(FS, path) || true;
            }

            return FS.createDataFile(GetFsParentDirectory(path), GetPathBasename(path), contents, true, true);
        };

        var GetContentLength = function(contents) {

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

        var EscapeRetroArchConfigString = function(value) {
            return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        };

        var SerializeRetroArchConfigValue = function(value) {
            if (value === null || typeof value === 'undefined') {
                return '""';
            }

            if (typeof value === 'boolean') {
                return value ? 'true' : 'false';
            }

            if (typeof value === 'number') {
                return String(value);
            }

            if (typeof value === 'string') {
                if (value === 'true' || value === 'false') {
                    return value;
                }

                return '"' + EscapeRetroArchConfigString(value) + '"';
            }

            return '"' + EscapeRetroArchConfigString(value) + '"';
        };

        var BuildRetroArchConfigString = function(retroArchConfig) {
            var configString = '';
            var configItem;

            for (configItem in retroArchConfig) {
                if (retroArchConfig.hasOwnProperty(configItem)) {
                    configString += configItem + ' = ' + SerializeRetroArchConfigValue(retroArchConfig[configItem]) + '\n';
                }
            }

            return configString;
        };

        var ReadFsFileAsBytes = function(FS, path) {
            var result;
            var readFile;

            if (!FS || !path || !FsPathExists(FS, path) || typeof FS.readFile !== 'function') {
                return null;
            }

            // Use the unwrapped Emscripten reader when available. This helper only mirrors
            // CES-restored startup state data and must not publish a false stateRead event.
            readFile = FS.ces1222OriginalReadFile || FS.readFile;
            result = readFile.call(FS, path, { encoding: 'binary' });
            return ToPlainUint8Array(result);
        };

        var GetStartupStateSourcePaths = function() {
            var paths = [];
            var diagnostics;
            var addFromCandidate = function(candidate) {
                if (!candidate) {
                    return;
                }

                AddUniquePath(paths, BuildFsPath(_module.FS, '/states', candidate));
            };

            if (!self || typeof self.GetStartupStateDiagnostics !== 'function') {
                return paths;
            }

            try {
                diagnostics = self.GetStartupStateDiagnostics();
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to inspect startup state diagnostics for redirected state mirror: ' + e);
                return paths;
            }

            if (diagnostics && diagnostics.lastWrite && diagnostics.lastWrite.successes) {
                $.each(diagnostics.lastWrite.successes, function(index, candidate) {
                    addFromCandidate(candidate);
                });
            }

            if (diagnostics && diagnostics.candidates) {
                $.each(diagnostics.candidates, function(index, candidate) {
                    addFromCandidate(candidate);
                });
            }

            return paths;
        };

        var MirrorStartupStateToRedirectPath = function(redirectPath) {
            var FS = _module.FS;
            var sources;
            var bytes = null;
            var sourceUsed = null;
            var existing;
            var i;

            if (!FS || !redirectPath) {
                return false;
            }

            redirectPath = String(redirectPath).replace(/\\/g, '/');

            existing = ReadFsFileAsBytes(FS, redirectPath);
            if (existing && existing.length) {
                _Logging.Console(_extensionName, 'Redirected startup state path already has data: ' + redirectPath + ' (' + existing.length + ' bytes)');
                return true;
            }

            sources = GetStartupStateSourcePaths();
            for (i = 0; i < sources.length; i++) {
                if (sources[i] === redirectPath) {
                    continue;
                }

                bytes = ReadFsFileAsBytes(FS, sources[i]);
                if (bytes && bytes.length) {
                    sourceUsed = sources[i];
                    break;
                }
            }

            if (!bytes || !bytes.length) {
                _Logging.Console(_extensionName, 'No restored startup state data was available to mirror to redirected path: ' + redirectPath);
                return false;
            }

            try {
                WriteFsFileReplacingExisting(FS, redirectPath, bytes);
                _Logging.Console(_extensionName, 'Mirrored restored startup save-state to RetroArch redirect path: ' + redirectPath + ' from ' + sourceUsed + ' (' + bytes.length + ' bytes)');
                return true;
            } catch (e) {
                _Logging.Console(_extensionName, 'Unable to mirror restored startup save-state to RetroArch redirect path ' + redirectPath + ': ' + e);
                return false;
            }
        };

        var ObserveRetroArchStateRedirectFromLog = function(channel, text) {
            var cleaned = String(text || '').replace(/^\[[^\]]+\]\s*/g, '').trim();
            var match;

            if (!cleaned || !cleaned.match(/Redirecting save state to/i)) {
                return;
            }

            match = cleaned.match(/Redirecting save state to\s+"([^"]+\.state\d*)"/i);
            if (!match) {
                return;
            }

            _lastRetroArchStateRedirectPath = match[1];
            _Logging.Console(_extensionName, 'Observed RetroArch save-state redirect path: ' + _lastRetroArchStateRedirectPath);
            MirrorStartupStateToRedirectPath(_lastRetroArchStateRedirectPath);
        };

        this.cesEnsureFileSystemCompatibility = function() {
            var FS = this.FS;

            if (!FS) {
                throw new Error('Emscripten FS is not available on Module yet');
            }

            if (typeof FS.createFolder !== 'function') {
                FS.createFolder = function(parent, name, canRead, canWrite) {
                    var path = BuildFsPath(FS, parent, name);

                    if (FsPathExists(FS, path)) {
                        return FindFsObject(FS, path);
                    }

                    try {
                        return FS.mkdir(path);
                    } catch (e) {
                        if (FsPathExists(FS, path)) {
                            return FindFsObject(FS, path);
                        }
                        throw e;
                    }
                };

                _Logging.Console(_extensionName, 'Installed FS.createFolder compatibility shim');
            }

            if (typeof FS.createPath !== 'function' && typeof FS.mkdirTree === 'function') {
                FS.createPath = function(parent, path, canRead, canWrite) {
                    var fullPath = BuildFsPath(FS, parent, path);
                    FS.mkdirTree(fullPath);
                    return FindFsObject(FS, fullPath);
                };

                _Logging.Console(_extensionName, 'Installed FS.createPath compatibility shim');
            }

            if (typeof FS.createDataFile !== 'function' && typeof FS.writeFile === 'function') {
                FS.createDataFile = function(parent, name, data, canRead, canWrite, canOwn) {
                    var path = BuildFsPath(FS, parent, name);
                    var options = { canOwn: canOwn };

                    if (typeof data !== 'string') {
                        options.encoding = 'binary';
                    }

                    FS.writeFile(path, data, options);
                    return FindFsObject(FS, path);
                };

                _Logging.Console(_extensionName, 'Installed FS.createDataFile compatibility shim');
            }

            // Some older CES code uses Module.FS_create* aliases. Add them when newer Emscripten omits them.
            this.FS_createFolder = this.FS_createFolder || FS.createFolder;
            this.FS_createPath = this.FS_createPath || FS.createPath;
            this.FS_createDataFile = this.FS_createDataFile || FS.createDataFile;
            this.FS_unlink = this.FS_unlink || FS.unlink;

            InstallFileSystemTrackingCompatibility('filesystem compatibility');

            return FS;
        };

        this.cesCreateFolder = function(parent, name, canRead, canWrite) {
            this.cesEnsureFileSystemCompatibility();
            return this.FS.createFolder(parent, name, canRead, canWrite);
        };

        this.cesCreateDataFile = function(parent, name, data, canRead, canWrite, canOwn) {
            this.cesEnsureFileSystemCompatibility();
            return this.FS.createDataFile(parent, name, data, canRead, canWrite, canOwn);
        };

        /**
         * A custom function I add to the Module prototype for shutting down the current running Module
         * @return {undef}
         */
        this.cesExit = function() {
            StopFpsMeter('cesExit');
            DisposeCompatibilityHandlers('cesExit');
            this["noExitRuntime"] = false; //ok, at this time, this is how you tell the running script you want exit during runtime
            this.exit('Force closed by ces');
        };


        /**
         * window and document event handling control
         * OK! So we want keyboard input going to the emulator when it is in progress and we don't want it to when the emulator is paused
         * to accomplish this, we have to keep references to all events attached to both window and document, remove them when
         * paused and reapply them when resumed.
         * @type {Boolean}
         */
        var eventHandlersAttached = true;
        
        var cachedEventHandlers = {
            window: {},
            document: {}
        };

        /**
         * See work.js for insertion code.
         * Whenever a new event handler is registered in the emaultor, call this function back with the handler
         * @param  {Object} eventHandler
         * @return {undef}              
         */
        this.cesEventHandlerRegistered = function (eventHandler) {

            //ensure the current format
            if (eventHandler.target && eventHandler.eventTypeString) {

                //a keydown handler will come through, lets handle it special like
                if (eventHandler.eventTypeString == 'keydown') {
                    eventHandler = self._InputHelper.OverrideEmulatorKeydownHandler(eventHandler);
                }

                if (eventHandler.eventTypeString == 'keyup') {
                    eventHandler = self._InputHelper.OverrideEmulatorKeyupHandler(eventHandler);
                }

                //these are the event targets and types we care to track
                if (eventHandler.target == window) {
                    cachedEventHandlers.window[eventHandler.eventTypeString] = eventHandler;
                }
                if (eventHandler.target == document) {
                    cachedEventHandlers.document[eventHandler.eventTypeString] = eventHandler;
                }
            }

            return eventHandler;
        };

        /**
         * Files are written a chunk at a time. To know when a file has been written, it is no longer growing
         * @param  {string} filename [description]
         * @param  {array} contents the existing file's contents with the added chunk
         * @param  {number} length   the amount added since the last write
         * @param  {[type]} pointer  [description]
         * @param  {[type]} offset   [description]
         * @return {[type]}          [description]
         */
        this.cesEmulatorFileWritten = function(filename, contents) {

            var size = contents.length; //the total length of the file contents as they are written

            if (ShouldSuppressLateScreenshotWrite(filename)) {
                _Logging.Console(_extensionName, 'Suppressing late duplicate screenshot file after canvas fallback: ' + filename);
                return;
            }

            if (IsScreenshotFilename(filename)) {
                MarkScreenshotFileWriteObserved(filename);
            }

            //still bring written, extend timer
            if (_fileWriteTimeout[filename]) {

                clearTimeout(_fileWriteTimeout[filename]);
            }
            
            //create a timer which when expires, indicates that no more file writing is taking place
            _fileWriteTimeout[filename] = setTimeout(function() {

                clearTimeout(_fileWriteTimeout[filename]);

                delete _fileWriteTimeout[filename];

                //bubble up
                if (IsScreenshotFilename(filename)) {
                    PublishScreenshotToCes(filename, contents, 'tracked filesystem write');
                    return;
                }

                if (self.OnEmulatorFileWrite) {
                    self.OnEmulatorFileWrite(filename, contents);
                }

            }, _fileTimerDelay);
        };

        this.cesEmulatorFileRead = function(filename, contents, iov, iovcnt, offset) {

            //still bring written, extend timer
            if (_fileReadTimeout[filename]) {

                clearTimeout(_fileReadTimeout[filename]);
            }

            //create a timer which when expires, indicates that no more file writing is taking place
            _fileReadTimeout[filename] = setTimeout(function() {

                clearTimeout(_fileReadTimeout[filename]);

                delete _fileReadTimeout[filename];

                //bubble up
                if (self.OnEmulatorFileRead) {
                    self.OnEmulatorFileRead(filename, contents);
                }

            }, _fileTimerDelay);
        };

        this.cesWriteFile = function(parent, filename, contents, callback) {

            var path;
            var result;

            this.cesEnsureFileSystemCompatibility();
            path = BuildFsPath(this.FS, parent, filename);
            result = WriteFsFileReplacingExisting(this.FS, path, contents);

            if (callback) {
                callback(result);
            }
        };

        /**
         * This function is called when input is resumed on the emulator or it is taken away
         * @param  {bool} giveEmulatorInput
         * @return {undef}
         */
        this.GiveEmulatorControlOfInput = function(allowInput) {

            if (allowInput) {

                //if giving back input, reassign all input handlers for both window and document
                if (this.JSEvents && this.JSEvents.registerOrRemoveHandler && !eventHandlersAttached) {

                    for (eventHandler in cachedEventHandlers.window) {
                        this.JSEvents.registerOrRemoveHandler(cachedEventHandlers.window[eventHandler]);
                    }
                    for (eventHandler in cachedEventHandlers.document) {
                        this.JSEvents.registerOrRemoveHandler(cachedEventHandlers.document[eventHandler]);
                    }
                }

            } else {

                //if removing event handlers, made call and inform Module they are not attached
                if (this.JSEvents && this.JSEvents.removeAllHandlersOnTarget) {

                    this.JSEvents.removeAllHandlersOnTarget(window);
                    this.JSEvents.removeAllHandlersOnTarget(document);
                    eventHandlersAttached = false;
                }

            }
        };

        /**
         * Once module has loaded with its own file system, populate ir with config and rom file
         * @param  {Object} module
         * @param  {string} system
         * @param  {string} file
         * @param  {string} data
         * @param  {Object} shader
         * @return {undef}
         */
        this.BuildLocalFileSystem = function(gameKey, compressedGameData, compressedSupprtData, compressedShaderData) {

            var i;
            var content;
            var retroArchConfigPath = '/home/web_user/retroarch/userdata/retroarch.cfg';
            var retroArchConfigWritten = false;

            this.cesEnsureFileSystemCompatibility();
            InstallInputHelperKeypressCompatibility('filesystem build');
            InstallPauseResumeCompatibility('filesystem build');
            this.cesPrepareCanvas('before filesystem build');
            _Logging.Console(_extensionName, 'Building local emulator filesystem for ' + gameKey.system);

            //emulator support, all files must go into system dir (BIOS files at least, what i'm using this for)
            this.cesCreateFolder('/', 'system', true, true);
            if (compressedSupprtData) {
                for (var supportFile in compressedSupprtData) {
                    var content = _Compression.Unzip.bytearray(compressedSupprtData[supportFile]);
                    var filename = _Compression.Unzip.string(supportFile);
                    try {
                        this.cesCreateDataFile('/system', filename, content, true, true);
                    } catch (e) {
                        //an error on file write.
                    }
                }
            }

            this.cesCreateFolder('/', 'games', true, true);

            var fileToLoad = _gameKey.file;

            //games are stored compressed in json. due to javascript string length limits, these can be broken up into several segments for larger files.
            //the compressedGameFiles object contains data for all files and their segments
            if (compressedGameData.hasOwnProperty('b')) {
                fileToLoad = _Compression.Unzip.string(compressedGameData.b);
            }
            
            //the f property are files
            if (compressedGameData.hasOwnProperty('f')) {
                for (var gameFile in compressedGameData.f) {

                    //end special case

                    var filename = _Compression.Unzip.string(gameFile);
                    var compressedGame = compressedGameData.f[gameFile];
                    var views = [];
                    var bufferLength = 0;

                    //begin by decopressing all compressed file segments
                    for (i = 0; i < compressedGame.length; ++i) {
                        var view = _Compression.Unzip.bytearray(compressedGame[i]);
                        bufferLength += view.length;
                        views[i] = view;
                    }

                    //let's combine all file segments now by writing a new uint8array
                    var gamedata = new Uint8Array(bufferLength);
                    var bufferPosition = 0;

                    for (i = 0; i < views.length; ++i) {
                        gamedata.set(new Uint8Array(views[i]), bufferPosition);
                        bufferPosition += views[i].length;
                    }

                    //write uncompressed game data to emu file system
                    this.cesCreateDataFile('/games', filename, gamedata, true, true);
                }
            }

            var gameContentPath = '/games/' + fileToLoad;

            if (self && typeof self.SetActiveContentFile === 'function') {
                self.SetActiveContentFile(fileToLoad, gameContentPath);
            }

            //shaders
            this.cesCreateFolder('/', 'shaders', true, true);
            var shaderPresetToLoad = null;
            var shaderPresetCommandLineArgument = null;
            var rawShaderWriteFailed = false;
            var rawShaderFilesWritten = 0;
            var rawShaderFile;
            var rawShaderWarningIndex;

            // Raw RetroArch GLSL shader packages are fetched by the browser application and
            // written into Emscripten's virtual filesystem before retroarch.cfg is consumed.
            if (compressedShaderData && compressedShaderData.type === 'retroarch-glslp') {

                _Logging.Console(_extensionName, 'Raw GLSL shader package received: selection=' + (compressedShaderData.selection || '(none)') + ', rawSelection=' + (compressedShaderData.rawSelection || '(none)') + ', preset=' + (compressedShaderData.presetRelativePath || '(none)') + ', valid=' + !!compressedShaderData.valid + ', files=' + ((compressedShaderData.files && compressedShaderData.files.length) || 0) + ', dependencies=' + ((compressedShaderData.dependencies && compressedShaderData.dependencies.length) || 0) + ', missing=' + ((compressedShaderData.missingDependencies && compressedShaderData.missingDependencies.length) || 0));

                if (compressedShaderData.warnings && compressedShaderData.warnings.length) {
                    for (rawShaderWarningIndex = 0; rawShaderWarningIndex < compressedShaderData.warnings.length; rawShaderWarningIndex++) {
                        _Logging.Console(_extensionName, 'Raw GLSL shader warning: ' + compressedShaderData.warnings[rawShaderWarningIndex]);
                    }
                }

                if (compressedShaderData.valid && compressedShaderData.files && compressedShaderData.files.length) {
                    for (i = 0; i < compressedShaderData.files.length; i++) {
                        rawShaderFile = compressedShaderData.files[i];

                        if (!rawShaderFile || !rawShaderFile.virtualPath || typeof rawShaderFile.content === 'undefined' || rawShaderFile.content === null) {
                            rawShaderWriteFailed = true;
                            _Logging.Console(_extensionName, 'Raw GLSL shader file missing virtualPath or content; disabling shader: index=' + i);
                            continue;
                        }

                        try {
                            WriteFsFileReplacingExisting(this.FS, rawShaderFile.virtualPath, rawShaderFile.content);
                            rawShaderFilesWritten++;
                            _Logging.Console(_extensionName, 'Raw GLSL shader FS write: role=' + (rawShaderFile.role || '(unknown)') + ', source=' + (rawShaderFile.relativePath || rawShaderFile.sourcePath || '(unknown)') + ', url=' + (rawShaderFile.url || '(unknown)') + ', virtualPath=' + rawShaderFile.virtualPath + ', bytes=' + GetContentLength(rawShaderFile.content));
                        } catch (e) {
                            rawShaderWriteFailed = true;
                            _Logging.Console(_extensionName, 'Raw GLSL shader FS write failed: virtualPath=' + rawShaderFile.virtualPath + ', error=' + e);
                        }
                    }

                    if (!rawShaderWriteFailed && compressedShaderData.presetVirtualPath) {
                        shaderPresetToLoad = compressedShaderData.presetVirtualPath;
                        shaderPresetCommandLineArgument = shaderPresetToLoad;
                        _Logging.Console(_extensionName, 'Raw GLSL shader preset ready for RetroArch config and --set-shader: ' + shaderPresetToLoad + ' (filesWritten=' + rawShaderFilesWritten + ')');
                    } else {
                        _Logging.Console(_extensionName, 'Raw GLSL shader disabled because one or more virtual filesystem writes failed.');
                    }
                } else {
                    _Logging.Console(_extensionName, 'Raw GLSL shader package invalid or empty; shaders will remain disabled.');
                }
            }
            // Legacy CES shader packages are retained for older selection data and fallback use.
            else if (compressedShaderData && compressedShaderData.hasOwnProperty('f')) {
                for (var shaderFile in compressedShaderData.f) {

                    var filename = _Compression.Unzip.string(shaderFile);
                    var content = _Compression.Unzip.bytearray(compressedShaderData.f[shaderFile]);
                    var legacyShaderPath = '/shaders/' + filename;

                    //write to emulator
                    try {
                        this.cesCreateDataFile('/shaders', filename, content, true, true);
                        _Logging.Console(_extensionName, 'Legacy CES shader FS write: virtualPath=' + legacyShaderPath + ', bytes=' + GetContentLength(content));
                    } catch (e) {
                        _Logging.Console(_extensionName, 'Legacy CES shader FS write failed: virtualPath=' + legacyShaderPath + ', error=' + e);
                    }

                    //is file a glslp shader preset? if so, save to define in config for auto load
                    if (filename.match(/\.glslp$/g)) {
                        shaderPresetToLoad = legacyShaderPath;
                        shaderPresetCommandLineArgument = shaderPresetToLoad;
                    }
                }
            }

            this.cesActiveShaderPresetPath = shaderPresetToLoad || null;
            _activeShaderPresetPath = shaderPresetToLoad || null;
            _postStartupShaderReapplyAttempted = false;
            _postStartupShaderReapplyPolls = 0;
            ClearPostStartupShaderReapplyFrame();
            if (_activeShaderPresetPath) {
                _Logging.Console(_extensionName, 'Active RetroArch shader preset recorded for runtime reapply: ' + _activeShaderPresetPath);
                if (IsConfiguredPostStartupShaderReapplyMatch(_activeShaderPresetPath)) {
                    _Logging.Console(_extensionName, 'Configured post-start shader reapply candidate selected for ' + (_gameKey && _gameKey.system ? _gameKey.system : '(unknown system)') + ': ' + GetPostStartupShaderReapplyLabel(_activeShaderPresetPath) + ' -> ' + _activeShaderPresetPath);
                }
            } else {
                _Logging.Console(_extensionName, 'No active RetroArch shader preset recorded for runtime reapply.');
            }

            //config, must be after shader
            //wrap folder creation in catch since error is thrown if exists
            try { this.cesCreateFolder('/', 'home', true, true); } catch (e) {}
            try { this.cesCreateFolder('/home', 'web_user', true, true); } catch (e) {}
            try { this.cesCreateFolder('/home/web_user/', 'retroarch', true, true); } catch (e) {}
            try { this.cesCreateFolder('/home/web_user/retroarch', 'userdata', true, true); } catch (e) {}

            var retroArchConfig = {};
            var configItem;
            var retroArchConfigSources = [];

            // Start from the known CES config so paths, save directories, and input defaults remain intact,
            // then layer 1.22.2-specific browser/video overrides on top.
            if (_config.retroarch['1.6.9-stable'] && _config.retroarch['1.6.9-stable'].config) {
                for (configItem in _config.retroarch['1.6.9-stable'].config) {
                    retroArchConfig[configItem] = _config.retroarch['1.6.9-stable'].config[configItem];
                }
                retroArchConfigSources.push('1.6.9-stable base');
            }

            if (_config.retroarch['1.22.2-stable'] && _config.retroarch['1.22.2-stable'].config) {
                for (configItem in _config.retroarch['1.22.2-stable'].config) {
                    retroArchConfig[configItem] = _config.retroarch['1.22.2-stable'].config[configItem];
                }
                retroArchConfigSources.push('1.22.2-stable overrides');
            }

            if (retroArchConfigSources.length) {

                _Logging.Console(_extensionName, 'Writing retroarch.cfg from ' + retroArchConfigSources.join(' + '));

                //system specific overrides
                if (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].retroarch) {
                    for (configItem in _config.systemdetails[_gameKey.system].retroarch) {
                        retroArchConfig[configItem] = _config.systemdetails[_gameKey.system].retroarch[configItem];
                    }
                }

                retroArchConfig.video_driver = 'gl';
                retroArchConfig.input_driver = 'rwebinput';
                retroArchConfig.input_joypad_driver = 'rwebpad';
                retroArchConfig.video_shader_dir = '/shaders';

                if (shaderPresetToLoad) {
                    retroArchConfig.video_shader_enable = true;
                    retroArchConfig.video_shader = shaderPresetToLoad;
                } else {
                    retroArchConfig.video_shader_enable = false;
                    delete retroArchConfig.video_shader;
                }

                var configString = BuildRetroArchConfigString(retroArchConfig);

                _Logging.Console(_extensionName, 'RetroArch video config: video_driver=' + retroArchConfig.video_driver + ', video_context_driver=' + retroArchConfig.video_context_driver + ', video_shader_enable=' + retroArchConfig.video_shader_enable + ', video_shader_dir=' + retroArchConfig.video_shader_dir + ', video_shader=' + (retroArchConfig.video_shader || '(none)') + ', video_fullscreen=' + retroArchConfig.video_fullscreen + ', video_windowed_fullscreen=' + retroArchConfig.video_windowed_fullscreen + ', video_force_aspect=' + retroArchConfig.video_force_aspect + ', video_aspect_ratio=' + (retroArchConfig.video_aspect_ratio || '(auto)'));
                _Logging.Console(_extensionName, 'RetroArch input drivers: input_driver=' + retroArchConfig.input_driver + ', input_joypad_driver=' + retroArchConfig.input_joypad_driver);
                _Logging.Console(_extensionName, 'RetroArch shader config written: video_shader_enable=' + retroArchConfig.video_shader_enable + ', video_shader_dir=' + retroArchConfig.video_shader_dir + ', video_shader=' + (retroArchConfig.video_shader || '(none)'));
                _Logging.Console(_extensionName, 'RetroArch shader config serialized lines: video_shader_enable = ' + SerializeRetroArchConfigValue(retroArchConfig.video_shader_enable) + ', video_shader_dir = ' + SerializeRetroArchConfigValue(retroArchConfig.video_shader_dir) + ', video_shader = ' + (retroArchConfig.video_shader ? SerializeRetroArchConfigValue(retroArchConfig.video_shader) : '(not written)'));
                _Logging.Console(_extensionName, 'RetroArch state config: savestate_directory=' + retroArchConfig.savestate_directory + ', sort_savestates_enable=' + retroArchConfig.sort_savestates_enable + ', sort_savestates_by_content_enable=' + retroArchConfig.sort_savestates_by_content_enable);

                //get input assignments
                _Logging.Console(_extensionName, 'Applying strict virtual browser Gamepad API joypad config before RetroArch startup. RetroArch will only see controllers that CES has validated against saved mappings for this system.');

                if (_GamePad && typeof _GamePad.PrepareRuntimeGamepadActivation === 'function') {
                    _GamePad.PrepareRuntimeGamepadActivation(gameKey, {
                        maxControllers: 2,
                        reason: 'RetroArch 1.22.2 filesystem build'
                    });
                }

                if (_GamePad && typeof _GamePad.BuildRuntimeVirtualGamepadInputConfiguration === 'function') {
                    configString += _GamePad.BuildRuntimeVirtualGamepadInputConfiguration(gameKey, {
                        maxControllers: 2,
                        logPrefix: _extensionName
                    });
                } else {
                    _Logging.Console(_extensionName, 'Strict virtual gamepad config helper unavailable; falling back to connected mapped gamepad config.');
                    configString += self._InputHelper.BuildInputConfiguration(gameKey, {
                        inputProfile: 'browser-gamepad',
                        includeJoypadIndex: true,
                        useBrowserGamepadIds: true,
                        normalizeAssignmentType: true,
                        applyLegacySdl2Conversion: false,
                        quoteAxisAssignments: true,
                        logPrefix: _extensionName
                    });
                }

                this.cesCreateDataFile('/home/web_user/retroarch/userdata', 'retroarch.cfg', configString, true, true);
                retroArchConfigWritten = true;
            }

            // Set the start arguments after the config file is available.
            // In modern RetroArch, -f means --fullscreen, not "file"; using it forces browser fullscreen.
            if (!_startToMenu) {
                this.arguments = ['-v'];
                if (retroArchConfigWritten) {
                    this.arguments.push('-c', retroArchConfigPath);
                }
                if (shaderPresetCommandLineArgument) {
                    this.arguments.push('--set-shader', shaderPresetCommandLineArgument);
                    _Logging.Console(_extensionName, 'RetroArch --set-shader argument written: ' + shaderPresetCommandLineArgument + ' (config video_shader=' + (shaderPresetToLoad || '(none)') + ')');
                } else {
                    _Logging.Console(_extensionName, 'RetroArch --set-shader argument not used because no valid shader preset is selected.');
                }
                this.arguments.push(gameContentPath);
            } else {
                this.arguments = ['-v', '--menu'];
            }
            _Logging.Console(_extensionName, 'RetroArch arguments: ' + this.arguments.join(' '));

            //screenshots
            this.cesCreateFolder('/', 'screenshots', true, true);

            //state save location
            this.cesCreateFolder('/', 'states', true, true);
            $.each(GetConfiguredStartupStateSubdirectories(), function(index, directory) {
                try {
                    _module.cesCreateFolder('/states', directory, true, true);
                    _Logging.Console(_extensionName, 'Prepared RetroArch 1.22.2 state subdirectory: /states/' + directory);
                } catch (e) {}
            });

            //save file location
            this.cesCreateFolder('/', 'saves', true, true);

            _Logging.Console(_extensionName, 'Local emulator filesystem built for ' + gameKey.system);
        };

        return this;
    });

    return this;
});
