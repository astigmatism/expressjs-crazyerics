var cesMain = (function() {

    // private members
    var self = this;
    var _config = {}; //the necessary server configuration data provided to the client
    var _bar = null;
    var _preventLoadingGame = false;
    //var _preventGamePause = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
    var _minimumGameLoadingTime = 6000; //minimum amount of time to display the title loading. artificially longer for tips
    var _minimumSaveLoadingTime = 3000; //minimum amount of time to display the state loading screenshot
    var _emulatorStartupReadyTimeout = 10000; //maximum wait for an emulator readiness signal before recovering the UI
    var _stateReadTimeout = 7000; //maximum wait for RetroArch to read a requested startup save-state file
    var _stateReadRetryDelay = 1200; //short delay before retrying startup state load on newer RetroArch builds
    var _stateLoadPostReadyDelay = 450; //small settle time after newer RetroArch reports ready before sending loadstate
    var _emulatorKeypressCallbackTimeout = 1200; //fallback for simulated keypress callbacks that never return
    var _toolbars = {}; //handles to elements in the toolbar ui (select, search, etc)

    // instances/libraries
    var _Sync = null;
    var _Logging = null;
    var _Compression = null;
    var _PubSub = null;
    var _Preferences = null;
    var _Sliders = null;
    var _SavesManager = null;
    var _Emulator = null;
    var _Dialogs = null;
    var _Collections = null;
    var _Featured = null;
    var _Suggestions = null;
    var _SaveSelection = null;
    var _Notifications = null;
    var _Tooltips= null;
    var _Gamepad = null;
    var _Media = null;
    var _ClientCache = {}; //a consistant location to store items in client memory during a non-refresh session
    var _currentGameKey = null;
    var _fullscreenResizeTimer = null;
    var _fullscreenMouseIdleTimer = null;
    var _fullscreenMouseIdleActiveMode = 'none';
    var _suppressCssFullscreenEscapeUntilKeyup = false;
    var _isEmulatorCssFullscreen = false;
    var _activeEmulatorFullscreenMode = 'none';
    var _nativeFullscreenRequestPending = false;
    var _lastFullscreenLayout = { active: false, mode: null, width: null, height: null };
    var _dispatchingEmulatorResizeEvent = false;
    var _activeEmulatorCleanup = null;
    var _emulatorCleanupSequence = 0;
    var _launchQueuedDuringEmulatorCleanup = false;

    // public members
    
    this._macroToShaderMenu = [[112, 100], 40, 40, 40, 88, 88, 40, 40, 40, 37, 37, 37, 38, 88, 88, 90, 90, 38, 38, 38, 112]; //macro opens shader menu and clears all passes
    
    $(document).ready(function() {

        //load libraries
        
        _Compression = new cesCompression();

        //unpack client data
        var clientdata = _Compression.Out.json(c20); //this name is only used for obfiscation

        _config = clientdata.config;

        _Logging = new cesLogging(_config);

        _PubSub = new cesPubSub(_Logging);

        _Media = new cesMedia(_config, _Logging);

        _Dialogs = new cesDialogs(_config, $('#dialogs'));

        _Tooltips = new cesTooltips(_config, _Media, _Logging, '.tooltip', '.tooltip-content');

        _Notifications = new cesNotifications(_config, _Compression, _PubSub, $('#notificationwrapper'));

        _Sync = new cesSync(_config, _Compression);

        _Preferences = new cesPreferences(_Compression, _PubSub, clientdata.components.p);
        _Sync.RegisterComponent('p', _Preferences.Sync);

        _Gamepad = new cesGamePad(_config, _Compression, _PubSub, _Tooltips, _Preferences, _Dialogs, $('#gameid0'), $('#gameid1'));

        _Collections = new cesCollections(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, PlayGame, _Logging, $('#openCollectionGrid'), $('#collectionsGrid'), clientdata.components.c, _config.defaults.copyToFeatured, null);
        _Sync.RegisterComponent('c', _Collections.Sync);

        _Featured = new cesFeatured(_config, _Compression, _Preferences, _Media, _Sync, _Tooltips, PlayGame, _Collections, clientdata.components.f, null);

        //register dialogs after setting up components
        var welcomeBack =  _Collections.IsEmpty() ? false : true;
        _Dialogs.Register('Welcome', 200, [], !welcomeBack);
        _Dialogs.Register('WelcomeBack', 200, [], welcomeBack);
        _Dialogs.Register('ConfigureGamepad', 700, [_Gamepad, _Compression]);
        _Dialogs.Register('ShaderSelection', 600, [_Preferences, _Media, _Logging]);
        _Dialogs.Register('GameLoading', 500, [_Media, _Compression, _PubSub]);
        _Dialogs.Register('SaveSelection', 600);
        _Dialogs.Register('SaveLoading', 500, [_Media, _Compression, _PubSub]);
        _Dialogs.Register('Exception', 500);
        _Dialogs.Register('EmulatorCleanup', 300);
        _Dialogs.Register('PlayAgain', 200);

        _toolbars.system = $('#toolbar .systemfilter select');
        _toolbars.search = $('#toolbar .search input');

        

        // TODO remove. for building icons
        // var gk = {
        //     "system": "snes",
        //     "title": "Super Mario World",
        //     "file": "Super Mario World (U) [!].smc",
        //     "gk": "eJyLVirOSy1W0lEKLi1ILVLwTSzKzFcIzy/KScEmpqARqqkQrRirV5ybrBQLAFxrE2Q="
        //   };
        // DisplayGameContext(gk, function() {
        // });

        //build console select for search (had to create a structure to sort by the short name :P)
        var shortnames = [];
        for (var system in _config.systemdetails) {
            _config.systemdetails[system].id = system;
            shortnames.push(_config.systemdetails[system]);
        }
        shortnames.sort(function(a, b) {
            if (a.shortname > b.shortname) {
                return 1;
            }
            if (a.shortname < b.shortname) {
                return -1;
            }
            return 0;
        });
        var shortnamesl = shortnames.length;
        for (var i = 0; i < shortnamesl; i++) {
            _toolbars.system.append('<option value="' + shortnames[i].id + '">' + shortnames[i].shortname + '</option>');
        }

        //loading dial
        $('.dial').knob();

        //console select
        _toolbars.system.selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                var system = $(this).val();

                //clear the search field
                _toolbars.search.val('');

                if (system === 'all' || _config.systemdetails[system].cannedSuggestion) {
                    _Suggestions.Load(system, function() {
                        _Tooltips.Any();
                    }, true); //<-- load canned results
                }
                //default suggestions receipe for systems
                else {

                    var recipe = {
                        systems: {}
                    };
                    recipe.systems[system] = {
                        cache: 'above'
                    };

                    _Suggestions.Load(recipe, function() {
                        _Tooltips.Any();
                    });
                }

                 //show or hide the alpha bar in the suggestions panel
                if (system === 'all') {
                    $('#suggestionsfilters').hide();
                } else {
                    $('#suggestionsfilters').show();
                }
            }
        });

        //search field
        _toolbars.search.autoComplete({
            minChars: 3,
            cache: false,
            delay: 300,
            /**
             * trigger the run to the server with search term
             * @param  {string} term
             * @param  {Object} response
             * @return {undef}
             */
            source: function(term, response) {
                var system = _toolbars.system.val();
                $.getJSON('/search/' + system + '/' + term, function(data) {
                    response(_Compression.Out.json(data));
                });
            },
            /**
             * for each auto compelete suggestion, render output here
             * @param  {Array} item
             * @param  {string} search
             * @return {string}        html output
             */
            renderItem: function(item, search) {

                var gameKey = _Compression.Decompress.gamekey(item[0]);
                var $suggestion = $('<div class="autocomplete-suggestion" data-gk="' + gameKey.gk + '" data-searchscore="' + item[1] + '"></div>');
                var $img = _Media.$BoxFront(gameKey, 'b');
                $suggestion.append($img);
                $suggestion.append('<div>' + gameKey.title + '</div>');
                
                return $('<div/>').append($suggestion).html(); //because .html only returns inner content
            },
            /**
             * on autocomplete select
             * @param  {Object} e    event
             * @param  {string} term search term used
             * @param  {Object} item dom element, with data
             * @return {undef}
             */
            onSelect: function(e, term, item) {
                var gameKey = _Compression.Decompress.gamekey(item.data('gk'));
                PlayGame(gameKey);
                e.stopPropagation();
            }
        });

        //clicking on paused game overlay
        $('#emulatorwrapperoverlay')
            .on('click', function(event) {
                if ($('#emulatorwrapper').hasClass('ces-runtime-gamepad-configure-active') || $(this).hasClass('ces-runtime-gamepad-configure-shim')) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }

                $('#emulator').focus();
            })
            .hover(
                function(event) {
                    event.stopPropagation();
                },
                function(event) {
                    event.stopPropagation();
                });

        InitializeEmulatorFullscreenButton();

        //stuff to do when at work mode is enabled
        //$('#titlebanner').hide();

        _Sliders = new cesSliders(_config, _Compression, $('#slidericons'));

        _Suggestions = new cesSuggestions(_config, _Media, _Compression, _Tooltips, _Collections, PlayGame, $('#suggestionsgrid'), $('#suggestionswrapper'));

        //begin by showing all console suggestions
        _Suggestions.Load('all', function() {
            _Tooltips.Any();
        }, true); //<-- canned

        //pubsub for any error
        _PubSub.Subscribe('error', self, function(message, error) {
            _Dialogs.Open("Exception", [message, error]);
            ForceCloseEmulator(function() {
                _preventLoadingGame = false; //in case it failed during start
            });
        });

        //pubsub for notifications
        _PubSub.Subscribe('notification', self, function(message, priority, hold, icon, topic, options) {
            _Notifications.Enqueue(message, priority, hold, icon, topic, options);
        });

        //pubsub for when window is reloaded/closed
        // $(window).unload(function() {
        //     //_PubSub.Publish('onbeforeunload');
        //     console.log('exiting');
        // });
        $(window).bind('beforeunload', function() {
            TryBestEffortPageExitSave('main beforeunload');
        });

        //title banner background image selected by the server from the cached filename list
        if (_config.titlebanner && _config.titlebanner.backgroundImageUrl) {
            $('#titlebanner').css('background-image', 'url("' + _config.titlebanner.backgroundImageUrl + '")');
        }
    });

    /* public methods */

    /* private methods */

    var LogFullscreen = function(message) {

        if (_Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('ces.main.fullscreen', message);
        }
    };

    var EMULATOR_FULLSCREEN_MODE_NONE = 'none';
    var EMULATOR_FULLSCREEN_MODE_NATIVE = 'native';
    var EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL = 'css-window-fill';
    var FULLSCREEN_TRANSITION_BLUR_SUPPRESS_MS = 1800;
    var FULLSCREEN_MOUSE_IDLE_HIDE_MS = 2400;

    var GetPrimaryEmulatorFullscreenMode = function() {

        return EMULATOR_FULLSCREEN_MODE_NATIVE;
    };

    var GetSecondaryEmulatorFullscreenMode = function() {

        return EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
    };

    var GetRequestFullscreenFunction = function(element) {

        if (!element) {
            return null;
        }

        return element.requestFullscreen ||
            element.webkitRequestFullscreen ||
            element.webkitRequestFullScreen ||
            element.mozRequestFullScreen ||
            element.msRequestFullscreen ||
            null;
    };

    var GetExitFullscreenFunction = function() {

        return document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.webkitCancelFullScreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen ||
            null;
    };

    var GetBrowserFullscreenElement = function() {

        return document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.webkitCurrentFullScreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            null;
    };

    var IsNativeFullscreenSupported = function() {

        return !!GetRequestFullscreenFunction(document.documentElement);
    };

    var DescribeElement = function(element) {

        if (!element) {
            return '(none)';
        }

        if (element.id) {
            return '#' + element.id;
        }

        return element.nodeName ? element.nodeName.toLowerCase() : String(element);
    };

    var PublishFullscreenNotice = function(message) {

        if (_PubSub && typeof _PubSub.Publish === 'function') {
            _PubSub.Publish('notification', [message, 2, false, false, 'emulatorFullscreen']);
        }
    };

    var GetEmulatorFullscreenTarget = function() {

        var wrapper = document.getElementById('emulatorwrapper');
        var canvas = document.getElementById('emulator');

        if (!wrapper || !canvas || !$.contains(wrapper, canvas)) {
            return null;
        }

        return wrapper;
    };

    var GetEmulatorAspectRatio = function() {

        var canvas = document.getElementById('emulator');
        var details = _currentGameKey && _config.systemdetails ? _config.systemdetails[_currentGameKey.system] : null;
        var ratio = 0;
        var rect;

        if (details && details.retroarch && typeof details.retroarch.video_aspect_ratio !== 'undefined') {
            ratio = parseFloat(details.retroarch.video_aspect_ratio);
        }

        if ((!ratio || isNaN(ratio) || ratio <= 0) && details && details.screenshotaspectratio) {
            ratio = parseFloat(details.screenshotaspectratio);
        }

        if ((!ratio || isNaN(ratio) || ratio <= 0) && canvas && canvas.width && canvas.height) {
            ratio = canvas.width / canvas.height;
        }

        if ((!ratio || isNaN(ratio) || ratio <= 0) && canvas) {
            rect = canvas.getBoundingClientRect();

            if (rect && rect.width && rect.height) {
                ratio = rect.width / rect.height;
            }
        }

        if (!ratio || isNaN(ratio) || ratio <= 0) {
            ratio = 4 / 3;
        }

        return ratio;
    };

    var GetViewportSize = function() {

        return {
            width: window.innerWidth || document.documentElement.clientWidth || screen.width || 800,
            height: window.innerHeight || document.documentElement.clientHeight || screen.height || 600
        };
    };

    var GetEmulatorFullscreenLayoutSize = function() {

        var viewport = GetViewportSize();
        var aspectRatio = GetEmulatorAspectRatio();
        var width = viewport.width;
        var height = Math.round(width / aspectRatio);

        if (height > viewport.height) {
            height = viewport.height;
            width = Math.round(height * aspectRatio);
        }

        return {
            width: Math.max(1, Math.round(width)),
            height: Math.max(1, Math.round(height))
        };
    };

    var SetCssFullscreenDocumentState = function(isActive) {

        $('html, body').toggleClass('ces-emulator-css-fullscreen-active', !!isActive);
    };

    var ResetFullscreenLayoutState = function() {

        _lastFullscreenLayout = { active: false, mode: null, width: null, height: null };
    };

    var ApplyEmulatorFullscreenLayout = function(isFullscreen, mode, force) {

        var $wrapper = $('#emulatorwrapper');
        var $helper = $('#emulatorpositionhelper');
        var normalizedMode = mode === EMULATOR_FULLSCREEN_MODE_NATIVE ? EMULATOR_FULLSCREEN_MODE_NATIVE : EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
        var size;
        var changed;

        if (!$wrapper.length || !$helper.length) {
            return false;
        }

        if (!isFullscreen) {
            changed = force || _lastFullscreenLayout.active || $wrapper.hasClass('ces-emulator-fullscreen-layout') || !!$helper[0].style.width || !!$helper[0].style.height;

            $wrapper.removeClass('ces-emulator-fullscreen-layout ces-emulator-css-fullscreen ces-emulator-native-fullscreen');
            $helper.css({
                width: '',
                height: ''
            });
            ResetFullscreenLayoutState();
            return changed;
        }

        size = GetEmulatorFullscreenLayoutSize();
        changed = force ||
            !_lastFullscreenLayout.active ||
            _lastFullscreenLayout.mode !== normalizedMode ||
            _lastFullscreenLayout.width !== size.width ||
            _lastFullscreenLayout.height !== size.height ||
            !$wrapper.hasClass('ces-emulator-fullscreen-layout');

        if (!changed) {
            return false;
        }

        $wrapper
            .removeClass('ces-emulator-css-fullscreen ces-emulator-native-fullscreen')
            .addClass('ces-emulator-fullscreen-layout')
            .addClass(normalizedMode === EMULATOR_FULLSCREEN_MODE_NATIVE ? 'ces-emulator-native-fullscreen' : 'ces-emulator-css-fullscreen');

        $helper.css({
            width: size.width + 'px',
            height: size.height + 'px'
        });

        _lastFullscreenLayout = {
            active: true,
            mode: normalizedMode,
            width: size.width,
            height: size.height
        };

        return true;
    };

    var DispatchWindowResize = function() {

        var event;

        try {
            if (typeof Event === 'function') {
                event = new Event('resize');
            } else {
                event = document.createEvent('UIEvents');
                event.initUIEvent('resize', true, false, window, 0);
            }

            _dispatchingEmulatorResizeEvent = true;
            window.dispatchEvent(event);
        } catch (e) {}
        finally {
            _dispatchingEmulatorResizeEvent = false;
        }
    };

    var RefreshEmulatorPlayArea = function(reason) {

        var canvas = document.getElementById('emulator');

        if (_Emulator && typeof _Emulator.RefreshPlayArea === 'function') {
            _Emulator.RefreshPlayArea(reason);
        } else if (_Emulator && typeof _Emulator.AdjustPlayArea === 'function') {
            _Emulator.AdjustPlayArea();
        }

        DispatchWindowResize();

        if (canvas && typeof canvas.focus === 'function') {
            try {
                canvas.focus();
            } catch (e) {}
        }
    };

    var ScheduleEmulatorPlayAreaRefresh = function(reason, delay) {

        if (_fullscreenResizeTimer) {
            clearTimeout(_fullscreenResizeTimer);
        }

        _fullscreenResizeTimer = setTimeout(function() {
            _fullscreenResizeTimer = null;
            RefreshEmulatorPlayArea(reason);
        }, typeof delay === 'number' ? delay : 100);
    };

    var IsEmulatorTargetNativeFullscreen = function() {

        var fullscreenElement = GetBrowserFullscreenElement();
        var wrapper = document.getElementById('emulatorwrapper');

        return !!(fullscreenElement && wrapper && fullscreenElement === wrapper);
    };

    var GetActiveEmulatorFullscreenMode = function() {

        if (_nativeFullscreenRequestPending || IsEmulatorTargetNativeFullscreen() || $('#emulatorwrapper').hasClass('ces-emulator-native-fullscreen')) {
            return EMULATOR_FULLSCREEN_MODE_NATIVE;
        }

        if (_isEmulatorCssFullscreen) {
            return EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
        }

        return EMULATOR_FULLSCREEN_MODE_NONE;
    };

    var IsPresentationFullscreenMode = function(mode) {

        return mode === EMULATOR_FULLSCREEN_MODE_NATIVE || mode === EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
    };

    var GetMouseIdleFullscreenMode = function() {

        var $wrapper = $('#emulatorwrapper');

        if (IsEmulatorTargetNativeFullscreen() || $wrapper.hasClass('ces-emulator-native-fullscreen')) {
            return EMULATOR_FULLSCREEN_MODE_NATIVE;
        }

        if (_isEmulatorCssFullscreen && $wrapper.hasClass('ces-emulator-css-fullscreen')) {
            return EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
        }

        return EMULATOR_FULLSCREEN_MODE_NONE;
    };

    var ClearFullscreenMouseIdleTimer = function() {

        if (_fullscreenMouseIdleTimer) {
            clearTimeout(_fullscreenMouseIdleTimer);
            _fullscreenMouseIdleTimer = null;
        }
    };

    var SetFullscreenMouseIdleVisualState = function(isIdle) {

        var mode = GetMouseIdleFullscreenMode();
        var isActive = IsPresentationFullscreenMode(mode);

        $('body')
            .toggleClass('ces-emulator-fullscreen-ui-active', isActive)
            .toggleClass('ces-emulator-fullscreen-ui-idle', isActive && !!isIdle)
            .toggleClass('ces-emulator-fullscreen-ui-visible', isActive && !isIdle);

        $('#emulatorwrapper')
            .toggleClass('ces-emulator-fullscreen-mouse-idle', isActive && !!isIdle)
            .toggleClass('ces-emulator-fullscreen-mouse-active', isActive && !isIdle);
    };

    var ResetFullscreenMouseIdleVisualState = function() {

        ClearFullscreenMouseIdleTimer();
        _fullscreenMouseIdleActiveMode = EMULATOR_FULLSCREEN_MODE_NONE;

        $('body').removeClass('ces-emulator-fullscreen-ui-active ces-emulator-fullscreen-ui-idle ces-emulator-fullscreen-ui-visible');
        $('#emulatorwrapper').removeClass('ces-emulator-fullscreen-mouse-idle ces-emulator-fullscreen-mouse-active');
    };

    var HideFullscreenControlsForMouseIdle = function() {

        if (!IsPresentationFullscreenMode(GetMouseIdleFullscreenMode())) {
            ResetFullscreenMouseIdleVisualState();
            return;
        }

        _fullscreenMouseIdleTimer = null;
        SetFullscreenMouseIdleVisualState(true);
    };

    var ShowFullscreenControlsForMouseActivity = function() {

        if (!IsPresentationFullscreenMode(GetMouseIdleFullscreenMode())) {
            ResetFullscreenMouseIdleVisualState();
            return;
        }

        ClearFullscreenMouseIdleTimer();
        SetFullscreenMouseIdleVisualState(false);

        _fullscreenMouseIdleTimer = setTimeout(HideFullscreenControlsForMouseIdle, FULLSCREEN_MOUSE_IDLE_HIDE_MS);
    };

    var SyncFullscreenMouseIdleBehavior = function(forceShow) {

        var mode = GetMouseIdleFullscreenMode();

        if (!IsPresentationFullscreenMode(mode)) {
            ResetFullscreenMouseIdleVisualState();
            return;
        }

        if (forceShow || _fullscreenMouseIdleActiveMode !== mode) {
            _fullscreenMouseIdleActiveMode = mode;
            ShowFullscreenControlsForMouseActivity();
            return;
        }

        SetFullscreenMouseIdleVisualState($('body').hasClass('ces-emulator-fullscreen-ui-idle'));
    };

    var HandleFullscreenMouseMovement = function() {

        if (!IsPresentationFullscreenMode(GetMouseIdleFullscreenMode())) {
            return;
        }

        ShowFullscreenControlsForMouseActivity();
    };

    var GetInactiveModeButtonText = function(mode) {

        if (mode === EMULATOR_FULLSCREEN_MODE_NATIVE) {
            return 'Enter Full Screen';
        }

        return 'Fill Window';
    };

    var GetInactiveModeButtonTitle = function(mode) {

        if (mode === EMULATOR_FULLSCREEN_MODE_NATIVE) {
            return 'Enter browser fullscreen';
        }

        return 'Fill the browser window without using browser fullscreen';
    };

    var GetActiveModeExitTitle = function(mode) {

        if (mode === EMULATOR_FULLSCREEN_MODE_NATIVE) {
            return 'Exit browser fullscreen';
        }

        return 'Exit Fill Window mode';
    };

    var SetEmulatorFullscreenButtonState = function() {

        var $primaryButton = $('#emulatorfullscreenbutton');
        var $overlayButton = $('#emulatorfullscreenoverlaybutton');
        var $secondaryButton = $('#emulatorwindowfillbutton');
        var activeMode = GetActiveEmulatorFullscreenMode();
        var primaryMode = GetPrimaryEmulatorFullscreenMode();
        var secondaryMode = GetSecondaryEmulatorFullscreenMode();
        var isNativeActive = activeMode === EMULATOR_FULLSCREEN_MODE_NATIVE;
        var isCssWindowFillActive = activeMode === EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
        var isNativeSupported = IsNativeFullscreenSupported();
        var isNativeUnavailable = !isNativeSupported && !isNativeActive && !_nativeFullscreenRequestPending;
        var primaryTitle;
        var secondaryTitle;

        if ($primaryButton.length) {
            if (isCssWindowFillActive) {
                primaryTitle = 'Exit Fill Window mode before entering browser fullscreen';

                $primaryButton
                    .hide()
                    .removeClass('active disabled')
                    .prop('disabled', true)
                    .text(GetInactiveModeButtonText(primaryMode))
                    .attr('title', primaryTitle)
                    .attr('aria-label', primaryTitle);
            } else {
                if (isNativeUnavailable) {
                    primaryTitle = 'Browser fullscreen is not available in this browser';
                } else if (isNativeActive) {
                    primaryTitle = GetActiveModeExitTitle(primaryMode);
                } else {
                    primaryTitle = GetInactiveModeButtonTitle(primaryMode);
                }

                $primaryButton
                    .show()
                    .toggleClass('active', isNativeActive)
                    .toggleClass('disabled', isNativeUnavailable || !!_nativeFullscreenRequestPending)
                    .prop('disabled', isNativeUnavailable || !!_nativeFullscreenRequestPending)
                    .text(_nativeFullscreenRequestPending ? 'Entering Full Screen' : (isNativeActive ? 'Exit Full Screen' : GetInactiveModeButtonText(primaryMode)))
                    .attr('title', primaryTitle)
                    .attr('aria-label', primaryTitle);
            }
        }

        if ($overlayButton.length) {
            $overlayButton
                .toggleClass('active', isNativeActive)
                .prop('disabled', !!_nativeFullscreenRequestPending)
                .text(_nativeFullscreenRequestPending ? 'Entering Full Screen' : 'Exit Full Screen')
                .attr('title', GetActiveModeExitTitle(primaryMode))
                .attr('aria-label', GetActiveModeExitTitle(primaryMode));
        }

        if ($secondaryButton.length) {
            secondaryTitle = isCssWindowFillActive ? GetActiveModeExitTitle(secondaryMode) : GetInactiveModeButtonTitle(secondaryMode);

            $secondaryButton
                .show()
                .toggleClass('active', isCssWindowFillActive)
                .toggleClass('disabled', !!_nativeFullscreenRequestPending || isNativeActive)
                .prop('disabled', !!_nativeFullscreenRequestPending || isNativeActive)
                .text(isCssWindowFillActive ? 'Exit Fill Window' : GetInactiveModeButtonText(secondaryMode))
                .attr('title', isNativeActive ? 'Exit browser fullscreen before using Fill Window mode' : secondaryTitle)
                .attr('aria-label', isNativeActive ? 'Exit browser fullscreen before using Fill Window mode' : secondaryTitle);
        }

        SyncFullscreenMouseIdleBehavior(false);
    };

    var SuppressEmulatorPauseOnBlurForFullscreenTransition = function(reason, durationMs) {

        if (_Emulator && typeof _Emulator.SuppressPauseOnBlurForFullscreenTransition === 'function') {
            try {
                _Emulator.SuppressPauseOnBlurForFullscreenTransition(reason || 'fullscreen transition', durationMs || FULLSCREEN_TRANSITION_BLUR_SUPPRESS_MS);
            } catch (e) {
                LogFullscreen('Unable to suppress fullscreen-transition blur pause: ' + e);
            }
        }
    };

    var ResumeEmulatorAudioAfterFullscreenTransition = function(reason) {

        var resume = function(delayReason) {
            if (_Emulator && typeof _Emulator.ResumeAudioForFullscreenTransition === 'function') {
                try {
                    _Emulator.ResumeAudioForFullscreenTransition(delayReason || reason || 'fullscreen transition');
                } catch (e) {
                    LogFullscreen('Unable to resume suspended fullscreen-transition audio context: ' + e);
                }
            }
        };

        setTimeout(function() { resume((reason || 'fullscreen transition') + ' audio check +80ms'); }, 80);
        setTimeout(function() { resume((reason || 'fullscreen transition') + ' audio check +350ms'); }, 350);
    };

    var HandleEmulatorFullscreenChange = function() {

        var isFullscreen = IsEmulatorTargetNativeFullscreen();
        var wasNative = _nativeFullscreenRequestPending || _activeEmulatorFullscreenMode === EMULATOR_FULLSCREEN_MODE_NATIVE || $('#emulatorwrapper').hasClass('ces-emulator-native-fullscreen');

        if (isFullscreen) {
            _nativeFullscreenRequestPending = false;
            _activeEmulatorFullscreenMode = EMULATOR_FULLSCREEN_MODE_NATIVE;

            if (_isEmulatorCssFullscreen) {
                _isEmulatorCssFullscreen = false;
                SetCssFullscreenDocumentState(false);
            }

            SuppressEmulatorPauseOnBlurForFullscreenTransition('browser fullscreen enter settled');
            ApplyEmulatorFullscreenLayout(true, EMULATOR_FULLSCREEN_MODE_NATIVE);
            SetEmulatorFullscreenButtonState();
            ScheduleEmulatorPlayAreaRefresh('browser fullscreen enter');
            ResumeEmulatorAudioAfterFullscreenTransition('browser fullscreen enter');
            return;
        }

        if (wasNative) {
            _nativeFullscreenRequestPending = false;
            _activeEmulatorFullscreenMode = EMULATOR_FULLSCREEN_MODE_NONE;
            SuppressEmulatorPauseOnBlurForFullscreenTransition('browser fullscreen exit settled');
            ApplyEmulatorFullscreenLayout(false);
            SetEmulatorFullscreenButtonState();
            ScheduleEmulatorPlayAreaRefresh('browser fullscreen exit');
            ResumeEmulatorAudioAfterFullscreenTransition('browser fullscreen exit');
            return;
        }

        SetEmulatorFullscreenButtonState();
    };

    var ExitNativeBrowserFullscreen = function() {

        var exitFullscreen = GetExitFullscreenFunction();
        var result;

        if (!IsEmulatorTargetNativeFullscreen()) {
            _nativeFullscreenRequestPending = false;
            SetEmulatorFullscreenButtonState();
            LogFullscreen('Browser fullscreen exit ignored because the emulator wrapper is not the fullscreen element');
            return false;
        }

        if (!exitFullscreen) {
            LogFullscreen('Browser fullscreen exit requested but the browser exit API is unavailable');
            return false;
        }

        SuppressEmulatorPauseOnBlurForFullscreenTransition('browser fullscreen exit requested');

        try {
            result = exitFullscreen.call(document);
        } catch (e) {
            LogFullscreen('Browser fullscreen exit failed: ' + e);
            return false;
        }

        if (result && typeof result.then === 'function') {
            result.then(function() {
                LogFullscreen('Browser fullscreen exit completed');
                setTimeout(HandleEmulatorFullscreenChange, 0);
            }, function(error) {
                LogFullscreen('Browser fullscreen exit rejected: ' + error);
            });
        }

        return true;
    };

    var EnterEmulatorCssFullscreen = function(reason) {

        var target = GetEmulatorFullscreenTarget();
        var fullscreenElement = GetBrowserFullscreenElement();

        if (!target) {
            LogFullscreen('Window-fill fullscreen requested but the emulator wrapper/canvas was not available');
            return false;
        }

        if (_nativeFullscreenRequestPending || IsEmulatorTargetNativeFullscreen()) {
            LogFullscreen('Window-fill fullscreen requested while browser fullscreen is active or pending; request ignored');
            return false;
        }

        if (fullscreenElement) {
            LogFullscreen('Window-fill fullscreen requested but another element is already in browser fullscreen: ' + DescribeElement(fullscreenElement));
            return false;
        }

        SuppressEmulatorPauseOnBlurForFullscreenTransition(reason || 'window-fill fullscreen enter');
        _isEmulatorCssFullscreen = true;
        _activeEmulatorFullscreenMode = EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL;
        SetCssFullscreenDocumentState(true);
        ApplyEmulatorFullscreenLayout(true, EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL);
        SetEmulatorFullscreenButtonState();
        LogFullscreen((reason || 'Window-fill button clicked') + '; using window-fill fullscreen for ' + DescribeElement(target));
        ScheduleEmulatorPlayAreaRefresh('window-fill fullscreen enter');
        ResumeEmulatorAudioAfterFullscreenTransition('window-fill fullscreen enter');
        return true;
    };

    var ExitEmulatorCssFullscreen = function(reason, options) {

        if (!_isEmulatorCssFullscreen) {
            return false;
        }

        SuppressEmulatorPauseOnBlurForFullscreenTransition(reason || 'window-fill fullscreen exit');
        _isEmulatorCssFullscreen = false;
        _activeEmulatorFullscreenMode = EMULATOR_FULLSCREEN_MODE_NONE;
        SetCssFullscreenDocumentState(false);
        ApplyEmulatorFullscreenLayout(false);
        SetEmulatorFullscreenButtonState();
        LogFullscreen((reason || 'Window-fill button clicked') + '; exited window-fill fullscreen');

        if (!options || !options.skipRefresh) {
            ScheduleEmulatorPlayAreaRefresh('window-fill fullscreen exit');
        }

        ResumeEmulatorAudioAfterFullscreenTransition('window-fill fullscreen exit');
        return true;
    };

    var ExitEmulatorFullscreenForCleanup = function(reason) {

        _nativeFullscreenRequestPending = false;
        _suppressCssFullscreenEscapeUntilKeyup = false;
        ExitEmulatorCssFullscreen(reason || 'emulator cleanup', { skipRefresh: true });

        if (IsEmulatorTargetNativeFullscreen()) {
            ExitNativeBrowserFullscreen();
        } else if ($('#emulatorwrapper').hasClass('ces-emulator-native-fullscreen')) {
            _activeEmulatorFullscreenMode = EMULATOR_FULLSCREEN_MODE_NONE;
            ApplyEmulatorFullscreenLayout(false);
            SetEmulatorFullscreenButtonState();
        }
    };

    var RequestNativeEmulatorFullscreen = function(target, reason) {

        var requestFullscreen = GetRequestFullscreenFunction(target);
        var result;

        if (_nativeFullscreenRequestPending) {
            LogFullscreen('Browser fullscreen request ignored because a request is already pending');
            return false;
        }

        if (!target) {
            LogFullscreen('Browser fullscreen request failed because the emulator wrapper/canvas was not available');
            return false;
        }

        if (!requestFullscreen) {
            LogFullscreen('Browser fullscreen request unavailable for target ' + DescribeElement(target));
            PublishFullscreenNotice('Browser fullscreen is not available in this browser. Use Fill Window for browser-window-only fullscreen.');
            return false;
        }

        if (GetBrowserFullscreenElement()) {
            LogFullscreen('Browser fullscreen request ignored because another element is already fullscreen: ' + DescribeElement(GetBrowserFullscreenElement()));
            return false;
        }

        if (_isEmulatorCssFullscreen) {
            ExitEmulatorCssFullscreen('browser fullscreen request replacing window-fill fullscreen', { skipRefresh: true });
        }

        _nativeFullscreenRequestPending = true;
        SuppressEmulatorPauseOnBlurForFullscreenTransition(reason || 'browser fullscreen request');
        SetEmulatorFullscreenButtonState();
        LogFullscreen((reason || 'Fullscreen button clicked') + '; requesting browser fullscreen for ' + DescribeElement(target));

        try {
            result = requestFullscreen.call(target);
        } catch (e) {
            _nativeFullscreenRequestPending = false;
            LogFullscreen('Browser fullscreen request failed: ' + e);
            SetEmulatorFullscreenButtonState();
            PublishFullscreenNotice('Browser fullscreen was blocked. Use Fill Window for browser-window-only fullscreen.');
            return false;
        }

        if (result && typeof result.then === 'function') {
            result.then(function() {
                LogFullscreen('Browser fullscreen request accepted for ' + DescribeElement(target));
                setTimeout(HandleEmulatorFullscreenChange, 0);
                setTimeout(HandleEmulatorFullscreenChange, 250);
            }, function(error) {
                _nativeFullscreenRequestPending = false;
                LogFullscreen('Browser fullscreen request rejected: ' + error);
                ApplyEmulatorFullscreenLayout(false);
                SetEmulatorFullscreenButtonState();
                PublishFullscreenNotice('Browser fullscreen was blocked. Use Fill Window for browser-window-only fullscreen.');
                ResumeEmulatorAudioAfterFullscreenTransition('browser fullscreen request rejected');
            });
        } else {
            setTimeout(HandleEmulatorFullscreenChange, 0);
        }

        return true;
    };

    var ToggleEmulatorFullscreenMode = function(mode, reason) {

        var target;
        var activeMode = GetActiveEmulatorFullscreenMode();

        if (mode === EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL) {
            if (activeMode === EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL) {
                ExitEmulatorCssFullscreen(reason || 'window-fill button toggle');
                return;
            }

            if (activeMode === EMULATOR_FULLSCREEN_MODE_NATIVE || _nativeFullscreenRequestPending) {
                LogFullscreen('Window-fill fullscreen request ignored while browser fullscreen is active or pending');
                return;
            }

            EnterEmulatorCssFullscreen(reason || 'window-fill button clicked');
            return;
        }

        if (mode !== EMULATOR_FULLSCREEN_MODE_NATIVE) {
            LogFullscreen('Fullscreen request ignored because no presentation mode was selected');
            return;
        }

        if (activeMode === EMULATOR_FULLSCREEN_MODE_NATIVE) {
            ExitNativeBrowserFullscreen();
            return;
        }

        target = GetEmulatorFullscreenTarget();

        if (!target) {
            LogFullscreen('Browser fullscreen requested but the emulator wrapper/canvas was not available');
            return;
        }

        if (!IsNativeFullscreenSupported()) {
            LogFullscreen('Browser fullscreen is unsupported here; use Fill Window for browser-window-only fullscreen');
            PublishFullscreenNotice('Browser fullscreen is not available in this browser. Use Fill Window for browser-window-only fullscreen.');
            SetEmulatorFullscreenButtonState();
            return;
        }

        RequestNativeEmulatorFullscreen(target, reason || 'fullscreen button clicked');
    };

    var IsEscapeKeyEvent = function(event) {

        var key;

        if (!event) {
            return false;
        }

        key = event.key || event.keyCode || event.which;

        return key === 'Escape' || key === 'Esc' || key === 27;
    };

    var StopFullscreenEscapeEvent = function(event) {

        if (!event) {
            return;
        }

        if (event.preventDefault) {
            event.preventDefault();
        }

        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else if (event.stopPropagation) {
            event.stopPropagation();
        }

        event.cancelBubble = true;
        event.returnValue = false;
    };

    var HandleEmulatorFullscreenEscapeKey = function(event) {

        event = event || window.event;

        if (!IsEscapeKeyEvent(event)) {
            return;
        }

        if (event.type === 'keyup' && _suppressCssFullscreenEscapeUntilKeyup) {
            StopFullscreenEscapeEvent(event);
            _suppressCssFullscreenEscapeUntilKeyup = false;
            return false;
        }

        if (event.type !== 'keydown') {
            return;
        }

        if (_suppressCssFullscreenEscapeUntilKeyup) {
            StopFullscreenEscapeEvent(event);
            return false;
        }

        if (!_isEmulatorCssFullscreen) {
            return;
        }

        StopFullscreenEscapeEvent(event);
        _suppressCssFullscreenEscapeUntilKeyup = true;
        ExitEmulatorCssFullscreen('escape key');
        return false;
    };

    var AttachFullscreenButtonMouseGuard = function($buttons) {

        $buttons.on('mousedown', function(event) {
            if (!event || event.which === 1) {
                event.preventDefault();
            }
        });
    };

    var InitializeEmulatorFullscreenButton = function() {

        var $primaryButton = $('#emulatorfullscreenbutton');
        var $overlayButton = $('#emulatorfullscreenoverlaybutton');
        var $secondaryButton = $('#emulatorwindowfillbutton');
        var $buttons = $primaryButton.add($overlayButton).add($secondaryButton);

        if (!$buttons.length) {
            return;
        }

        AttachFullscreenButtonMouseGuard($buttons);

        $primaryButton.on('click', function(event) {
            event.preventDefault();
            ToggleEmulatorFullscreenMode(GetPrimaryEmulatorFullscreenMode(), 'primary fullscreen button clicked');
        });

        $overlayButton.on('click', function(event) {
            event.preventDefault();
            ToggleEmulatorFullscreenMode(EMULATOR_FULLSCREEN_MODE_NATIVE, 'browser fullscreen overlay button clicked');
        });

        $secondaryButton.on('click', function(event) {
            event.preventDefault();
            ToggleEmulatorFullscreenMode(GetSecondaryEmulatorFullscreenMode(), 'secondary fullscreen button clicked');
        });

        document.addEventListener('fullscreenchange', HandleEmulatorFullscreenChange, false);
        document.addEventListener('webkitfullscreenchange', HandleEmulatorFullscreenChange, false);
        document.addEventListener('mozfullscreenchange', HandleEmulatorFullscreenChange, false);
        document.addEventListener('MSFullscreenChange', HandleEmulatorFullscreenChange, false);
        window.addEventListener('keydown', HandleEmulatorFullscreenEscapeKey, true);
        window.addEventListener('keyup', HandleEmulatorFullscreenEscapeKey, true);
        document.addEventListener('keydown', HandleEmulatorFullscreenEscapeKey, true);
        document.addEventListener('keyup', HandleEmulatorFullscreenEscapeKey, true);
        document.addEventListener('mousemove', HandleFullscreenMouseMovement, true);

        $(window).on('resize', function() {
            if (_dispatchingEmulatorResizeEvent) {
                return;
            }

            if (_isEmulatorCssFullscreen) {
                ApplyEmulatorFullscreenLayout(true, EMULATOR_FULLSCREEN_MODE_CSS_WINDOW_FILL);
                ScheduleEmulatorPlayAreaRefresh('window-fill fullscreen resize');
                return;
            }

            if (IsEmulatorTargetNativeFullscreen()) {
                ApplyEmulatorFullscreenLayout(true, EMULATOR_FULLSCREEN_MODE_NATIVE);
                ScheduleEmulatorPlayAreaRefresh('browser fullscreen resize');
            }
        });

        SetEmulatorFullscreenButtonState();
    };
    
    var LogLifecycle = function(message) {

        if (_Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('ces.main.lifecycle', message);
        }
    };

    var TryBestEffortPageExitSave = function(reason) {

        if (_Emulator && typeof _Emulator.FlushNormalSaveFilesBestEffort === 'function') {
            LogLifecycle('Page lifecycle save attempt forwarded to emulator; reason=' + (reason || 'page exit'));
            try {
                _Emulator.FlushNormalSaveFilesBestEffort(reason || 'page exit');
            } catch (e) {
                LogLifecycle('Page lifecycle save attempt failed to start: ' + e);
            }
        }
    };

    var CopyGameKeyForLifecycle = function(gameKey) {

        if (!gameKey) {
            return null;
        }

        return {
            system: gameKey.system,
            title: gameKey.title,
            file: gameKey.file,
            gk: gameKey.gk
        };
    };

    var DescribeGameKeyForLifecycle = function(gameKey) {

        var system = gameKey && gameKey.system ? gameKey.system : 'unknown';
        var extension = 'unknown';
        var script = 'unknown';
        var title = gameKey && gameKey.title ? gameKey.title : null;
        var file = gameKey && gameKey.file ? gameKey.file : null;

        if (_config.systemdetails && _config.systemdetails[system]) {
            extension = _config.systemdetails[system].emuextention || extension;
            script = _config.systemdetails[system].emuscript || script;
        }

        return 'system=' + system + ', extension=' + extension + ', script=' + script +
            (title ? ', title=' + title : '') +
            (file ? ', file=' + file : '');
    };

    var DescribeEmulatorForLifecycle = function(emulator, fallbackGameKey) {

        var diagnostics = null;
        var gameKey = fallbackGameKey || _currentGameKey;
        var system;
        var extension;
        var script;
        var title;
        var file;

        if (emulator && typeof emulator.GetLifecycleDiagnostics === 'function') {
            try {
                diagnostics = emulator.GetLifecycleDiagnostics();
            } catch (e) {
                diagnostics = null;
            }
        }

        system = (diagnostics && diagnostics.system) || (gameKey && gameKey.system) || 'unknown';
        extension = (diagnostics && diagnostics.extension) || 'unknown';
        script = (diagnostics && diagnostics.script) || 'unknown';
        title = (diagnostics && diagnostics.title) || (gameKey && gameKey.title) || null;
        file = (diagnostics && diagnostics.file) || (gameKey && gameKey.file) || null;

        if (_config.systemdetails && _config.systemdetails[system]) {
            extension = extension === 'unknown' ? (_config.systemdetails[system].emuextention || extension) : extension;
            script = script === 'unknown' ? (_config.systemdetails[system].emuscript || script) : script;
        }

        return 'system=' + system + ', extension=' + extension + ', script=' + script +
            (title ? ', title=' + title : '') +
            (file ? ', file=' + file : '');
    };

    var RunEmulatorCleanupCallbacks = function(cleanup, reason) {

        var callbacks = cleanup.waiters || [];
        var i;

        cleanup.waiters = [];

        LogLifecycle('Cleanup #' + cleanup.id + ' releasing ' + callbacks.length + ' queued callback(s); reason=' + reason + '. New game launch is allowed to proceed.');

        for (i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i]();
            } catch (e) {
                LogLifecycle('Cleanup #' + cleanup.id + ' queued callback failed: ' + e);
            }
        }
    };

    var CompleteEmulatorCleanup = function(cleanup, reason) {

        if (!cleanup) {
            return;
        }

        if (cleanup.completed) {
            LogLifecycle('Cleanup #' + cleanup.id + ' completion skipped because it was already completed; reason=' + reason);
            return;
        }

        cleanup.completed = true;
        cleanup.completedAt = Date.now();

        LogLifecycle('Cleanup #' + cleanup.id + ' disposing captured emulator complete; currentGlobalMatchesCaptured=' + (_Emulator === cleanup.emulator) + ', reason=' + reason);

        if (_Emulator === cleanup.emulator) {
            LogLifecycle('Cleanup #' + cleanup.id + ' nulling global emulator state for captured instance: ' + cleanup.description);
            _Emulator = null;
        }
        else {
            LogLifecycle('Cleanup #' + cleanup.id + ' not nulling global emulator because it no longer points at the captured instance. Current=' + DescribeEmulatorForLifecycle(_Emulator, _currentGameKey) + '; captured=' + cleanup.description);
        }

        if (_activeEmulatorCleanup === cleanup) {
            _activeEmulatorCleanup = null;
        }

        RunEmulatorCleanupCallbacks(cleanup, reason);
    };

    var QueueEmulatorCleanupCallback = function(cleanup, callback, reason) {

        if (!cleanup) {
            if (callback) {
                callback();
            }
            return;
        }

        if (callback) {
            cleanup.waiters.push(callback);
        }

        LogLifecycle('CloseEmulator request joined cleanup #' + cleanup.id + ' already in progress; queuedCallbacks=' + cleanup.waiters.length + ', currentGlobalMatchesCaptured=' + (_Emulator === cleanup.emulator) + ', reason=' + reason);
    };

    var CloseEmulator = function(callback) {

        var emulatorToClose;
        var cleanup;
        var closeCallback = callback || function() {};

        if (_activeEmulatorCleanup && !_activeEmulatorCleanup.completed) {
            QueueEmulatorCleanupCallback(_activeEmulatorCleanup, closeCallback, 'CloseEmulator called while cleanup is active');
            return;
        }

        emulatorToClose = _Emulator;

        ExitEmulatorFullscreenForCleanup('CloseEmulator cleanup');

        //no emulator, just callback
        if (!emulatorToClose) {
            LogLifecycle('CloseEmulator requested with no active emulator; cleanup skipped because it was already completed or no game was running.');
            return closeCallback();
        }

        cleanup = {
            id: ++_emulatorCleanupSequence,
            emulator: emulatorToClose,
            gameKey: CopyGameKeyForLifecycle(_currentGameKey),
            description: DescribeEmulatorForLifecycle(emulatorToClose, _currentGameKey),
            waiters: [closeCallback],
            completed: false,
            startedAt: Date.now()
        };

        _activeEmulatorCleanup = cleanup;

        LogLifecycle('Cleanup #' + cleanup.id + ' starting for ' + cleanup.description + '; ExitGracefully exists=' + (typeof emulatorToClose.ExitGracefully === 'function') + ', currentGlobalMatchesCaptured=' + (_Emulator === emulatorToClose));

        emulatorToClose.Hide(null, function() {

            if (cleanup.completed) {
                LogLifecycle('Cleanup #' + cleanup.id + ' hide callback ignored because cleanup already completed.');
                return;
            }

            HideGameContext(); //sliders, title, etc
            LogLifecycle('Cleanup #' + cleanup.id + ' opening EmulatorCleanup dialog for captured emulator: ' + cleanup.description);

            _Dialogs.Open("EmulatorCleanup", [cleanup.id, cleanup.description], false, function() {

                if (cleanup.completed) {
                    LogLifecycle('Cleanup #' + cleanup.id + ' stale EmulatorCleanup dialog callback skipped because cleanup already completed.');
                    return;
                }

                LogLifecycle('Cleanup #' + cleanup.id + ' EmulatorCleanup dialog callback fired; using captured instance=' + (cleanup.emulator === emulatorToClose) + ', currentGlobalMatchesCaptured=' + (_Emulator === emulatorToClose) + ', ExitGracefully exists=' + (typeof emulatorToClose.ExitGracefully === 'function'));

                //emulator is running, exit gracefully to save sram
                if (typeof emulatorToClose.ExitGracefully === 'function') {
                    emulatorToClose.ExitGracefully(function() {
                        CompleteEmulatorCleanup(cleanup, 'ExitGracefully callback');
                    });
                    return;
                }

                LogLifecycle('Cleanup #' + cleanup.id + ' captured emulator does not expose ExitGracefully; falling back to CleanUp for captured instance.');

                if (typeof emulatorToClose.CleanUp === 'function') {
                    emulatorToClose.CleanUp(function() {
                        CompleteEmulatorCleanup(cleanup, 'CleanUp fallback after missing ExitGracefully');
                    });
                    return;
                }

                CompleteEmulatorCleanup(cleanup, 'no ExitGracefully or CleanUp available on captured emulator');
            });
        });
    };

    var ForceCloseEmulator = function(callback) {
        
        var emulatorToClose;
        var closeCallback = callback || function() {};

        //as forced closed generally occurrs during a loading error, also inform collections that the loaded game is no longer loading
        _Collections.RemoveCurrentGameLoading();

        if (_activeEmulatorCleanup && !_activeEmulatorCleanup.completed) {
            QueueEmulatorCleanupCallback(_activeEmulatorCleanup, closeCallback, 'ForceCloseEmulator called while cleanup is active');
            return;
        }

        emulatorToClose = _Emulator;

        ExitEmulatorFullscreenForCleanup('ForceCloseEmulator cleanup');

        if (!emulatorToClose) {
            LogLifecycle('ForceCloseEmulator requested with no active emulator; cleanup skipped.');
            return closeCallback();
        }

        LogLifecycle('ForceCloseEmulator starting forced cleanup for ' + DescribeEmulatorForLifecycle(emulatorToClose, _currentGameKey));

        emulatorToClose.Hide(null, function() {

            HideGameContext(); //sliders, title, etc

            //bypass the graceful exit routine and simply wipe it out
            if (typeof emulatorToClose.CleanUp === 'function') {
                emulatorToClose.CleanUp(function() {
                    if (_Emulator === emulatorToClose) {
                        LogLifecycle('ForceCloseEmulator nulling global emulator state for captured instance.');
                        _Emulator = null;
                    }
                    else {
                        LogLifecycle('ForceCloseEmulator left global emulator state unchanged because it no longer points at the captured instance.');
                    }
                    return closeCallback();
                });
                return;
            }

            if (_Emulator === emulatorToClose) {
                _Emulator = null;
            }
            return closeCallback();
        });
    };

    /**
     * Prepare layout etc. for running a game! cleans up current too
     * @param  {GameKey} gameKey    required. see ces.compression for definition. members: system, title, file, gk
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var PlayGame = function (gameKey, shader, callback) {

        var launchDescription = DescribeGameKeyForLifecycle(gameKey);

        //bail if attempted to load before current has finished
        if (_preventLoadingGame) {
            LogLifecycle('PlayGame ignored because another launch is locked: ' + launchDescription);
            return;
        }

        if (_activeEmulatorCleanup && !_activeEmulatorCleanup.completed) {
            _launchQueuedDuringEmulatorCleanup = true;
            LogLifecycle('Game launch requested while cleanup #' + _activeEmulatorCleanup.id + ' is in progress; launch will wait for cleanup to complete: ' + launchDescription);
        }

        _preventLoadingGame = true; //prevent loading any other games until this flag is lifted

        window.scrollTo(0, 0); //will bring scroll to top of page (if case they clicked a suggestion, no need to scroll back up)

        //will clear up existing emulator if it exists
        CloseEmulator(function() {

            _launchQueuedDuringEmulatorCleanup = false;
            LogLifecycle('New game launch proceeding after emulator cleanup gate: ' + launchDescription);
            
            $('#emulatorpositionhelper').empty(); //ensure empty (there can be a canvas here if the user bailed during load)

            //close any dialogs
            //_Dialogs.Close();

            //close any sliders
            //_Sliders.Closeall();

            //close any notifications
            _Notifications.Reset();

            //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
            $('#emulatorpositionhelper').append('<canvas tabindex="0" id="emulator" oncontextmenu="event.preventDefault()"></canvas>');

            //call bootstrap
            RetroArchBootstrap(gameKey, shader, function() {

                _preventLoadingGame = false;

                if(callback) {
                    callback();
                }
            });
        });
    };

    /**
     * bootstrap function for loading a game with retroarch. setups animations, loading screens, and iframe for emulator. also destoryes currently running
     * @param  {GameKey} gameKey    required. see compression for class definition. Has members system, title, file, gk
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var RetroArchBootstrap = function(gameKey, shader, callback) {

        //var box = cesGetBoxFront(_config, gameKey.system, gameKey.title, 170, true); //preload loading screen box
        _Collections.SetCurrentGameLoading(gameKey); //inform collections what the current game is so that they don't attempt to delete it during load

        $('#loadingprogressbar').empty(); //didn't have a more convienent place for this!
        $('#loadingstatus').text('Preparing Content');

        //which emulator to load?
        EmulatorFactory(gameKey, function(err, emulator) {
            if (err) {
                //not sure how to handle this yet
                console.error(err);
                return;
            }

            _Emulator = emulator;

            // all deferres defined for separate network dependancies
            var emulatorLoadComplete = $.Deferred();
            var savePreferencesAndGetPlayerGameDetailsComplete = $.Deferred();

            _preventLoadingGame = false; //during shader select, allow other games to load

            shader = ResolveShaderSelectionFromPreferences(gameKey, shader);

            //show shader selector. returns an object with shader details
            _Dialogs.Open('ShaderSelection', [gameKey, shader], true, function(shaderSelection) {

                //configure controllers if not done so already
                _Gamepad.Configure(gameKey, function() {

                    _preventLoadingGame = true; //lock loading after shader select
                    var gameLoadingStart = Date.now();

                    //game load dialog show
                    _Dialogs.Open('GameLoading', [gameKey], false, function() {


                        var optionsToSendToServer = {
                        };

                        //this call is a POST. Unlike the others, it is destined for the mongo instance (MY DOMAIN not a cdn). we send user preference data to the server in addition to getting game details.
                        SavePreferencesAndGetPlayerGameDetails(gameKey, optionsToSendToServer, savePreferencesAndGetPlayerGameDetailsComplete);

                        //run to my domain first to get details about the game before we retrieve it
                        $.when(savePreferencesAndGetPlayerGameDetailsComplete).done(function(gameDetails) {

                            var saves = gameDetails.saves;
                            var saveFiles = gameDetails.saveFiles || [];
                            var saveFileContext = gameDetails.saveFileContext || {};
                            var files = gameDetails.files;
                            var loadSupportFiles = _config.systemdetails[gameKey.system].supportfiles; //will be 0 for systems without support
                            var info = {};
                            try {
                                info = gameDetails.info;
                            } catch (e) {
                                //meh
                            }

                            //add this bail for when bulding featured collections
                            if (_config.defaults.copyToFeatured) {
                                _preventLoadingGame = false;
                                return;
                            }

                            if (_Emulator && typeof _Emulator.InitializeSaveFilesManager === 'function') {
                                _Emulator.InitializeSaveFilesManager(saveFiles, saveFileContext, gameKey);
                            }

                            if (gameDetails.saveFileError) {
                                _Logging.Console('ces.main', gameDetails.saveFileError);
                            }

                            //begin loading all content. I know it seems like some of these (game, emulator, etc) could load while the user
                            //is viewing the shader select, but I found that when treated as background tasks, it interfere with the performance
                            //of the shader selection ui. I think its best to wait until the loading animation is up to perform all of these
                            _Emulator.Load(_Emulator.createModule(), shaderSelection.shader, loadSupportFiles, emulatorLoadComplete);

                            //when all deffered calls are ready
                            $.when(emulatorLoadComplete).done(function(emulatorLoaded) {

                                _Emulator.InitializeSavesManager(saves, gameKey);

                                _preventLoadingGame = false; //during save select, allow other games to load

                                // Keep the GameLoading dialog visible before advancing to SaveSelection.
                                // The previous minimum-load wait happened after SaveSelection returned, which meant
                                // SaveSelection could close the GameLoading dialog immediately on fast/cached loads.
                                WaitForMinimumGameLoadingDisplay(gameLoadingStart, gameKey, 'before save selection', function() {

                                    //are there saves to load? Let's show a dialog to chose from, if not - will go straight to start
                                    ShowGameLoading(_Emulator, gameKey, function(err, selectedSaveTimeStamp, selectedSavescreenshot) {

                                        if (selectedSaveTimeStamp) {
                                            _Dialogs.Open('SaveLoading', [gameKey.system, selectedSavescreenshot]);
                                        }

                                        _preventLoadingGame = true;

                                        //calculate how long the loading screen has been up. Showing it too short looks dumb
                                        var gameLoadingDialogUptime = Math.floor(Date.now() - gameLoadingStart);
                                        var artificialDelayForLoadingScreen = gameLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - gameLoadingDialogUptime;

                                        //set an artificial timeout based on the amount of time the loading screen was up
                                        //lets ensure a minimum time has passed (see private vars)
                                        setTimeout(function() {

                                            // load state? bails if not set
                                            _Emulator.WriteSaveData(selectedSaveTimeStamp, function(stateToLoad) { //if save not set, bails on null

                                                _Logging.Console('ces.main', 'Startup save-state write callback for ' + gameKey.system + ': stateToLoad=' + (!!stateToLoad));
                                                LogStartupStateDiagnostics('Startup state diagnostics after WriteSaveData for ' + gameKey.system);

                                                var startupAudioMute = PrepareStartupStateAudioMute(gameKey.system, stateToLoad);

                                                var startupReadyWaiter = CreateEmulatorStartupReadyWaiter(gameKey, function(readyResult) {

                                                    _Logging.Console('ces.main', 'Startup readiness complete for ' + gameKey.system + ' (' + GetEmulatorExtension(gameKey.system) + '), reason=' + readyResult.reason + ', timedOut=' + readyResult.timedOut);

                                                    //load state? bails if null.. if valid, will show a new save loading dialog
                                                    //and will load state. callback occurs after state has loaded or safely times out
                                                    LoadEmulatorState(gameKey.system, stateToLoad, function(stateLoadResult) {

                                                        stateLoadResult = stateLoadResult || {};
                                                        _Logging.Console('ces.main', 'Startup state-load sequence complete for ' + gameKey.system + ': loaded=' + (!!stateLoadResult.loaded) + ', timedOut=' + (!!stateLoadResult.timedOut) + ', attempts=' + (stateLoadResult.attempts || 0));
                                                        _Logging.Console('ces.main', 'Closing loading dialogs and revealing emulator for ' + gameKey.system);

                                                        //close all dialogs (save loading or game loading), game begins!
                                                        _Dialogs.Close(function() {

                                                            _Logging.Console('ces.main', 'Loading dialogs closed for ' + gameKey.system + '; starting final startup input tap');

                                                            //so I've found that tapping the fast forward key prevents the weird race condition on start.
                                                            //keep this until it seems disruptive
                                                            _PubSub.Mute('notification');
                                                            SafeEmulatorKeypress('fastforward', function() {
                                                                
                                                                _PubSub.Unmute('notification');

                                                                _Logging.Console('ces.main', 'Starting emulator reveal height animation for ' + gameKey.system);

                                                                //enlarge dialog area for emulator
                                                                _Dialogs.SetHeight($('#emulatorwrapper').outerHeight(), function() {

                                                                    _Logging.Console('ces.main', 'Emulator reveal height animation complete for ' + gameKey.system);

                                                                    //activate certain sliders
                                                                    _Sliders.Activate('Controls', [gameKey, _Gamepad]);
                                                                    _Sliders.Activate('Appearance', [gameKey, _Preferences, _Emulator, _Logging, _Media, shaderSelection && shaderSelection.shader]);
                                                                    _Sliders.Activate('Screenshots', [gameKey, _PubSub, _Tooltips, _Compression, _Media]);
                                                                    _Sliders.Activate('Roms', [gameKey, files, _Compression, PlayGame]);
                                                                    
                                                                    //reqiure gamedb data to have info slider
                                                                    if (!$.isEmptyObject(info)) {
                                                                        _Sliders.Activate('Info', [gameKey, info, _Media]);
                                                                    }

                                                                    //handle title and content fadein steps
                                                                    //wait until height change before they appear
                                                                    DisplayGameContext(gameKey, info, function() {

                                                                        //show controls slider by default (because it is always activated)
                                                                        _Sliders.Open('Controls');
                                                                    });  
                                                                            
                                                                    //reveal emulator, control is game is given at this step
                                                                    _Emulator.ReadyPlayerOne(function() {

                                                                        window.scrollTo(0,0); //bring attention back up top
                                                                    });

                                                                    //pubsub for closing emulator from the top-level
                                                                    _PubSub.SubscribeOnce('closeEmulator', self, function() {
                                                                        CloseEmulator(function() {

                                                                            if (_launchQueuedDuringEmulatorCleanup) {
                                                                                LogLifecycle('Skipping PlayAgain dialog because a new game launch was queued during emulator cleanup.');
                                                                                return;
                                                                            }

                                                                            _Dialogs.Open("PlayAgain");
                                                                        });
                                                                    }, true); //exclusive meaning this is the only subscriber
                                                                    
                                                                    //inform instances that game is starting (for those that care)
                                                                    _Collections.RemoveCurrentGameLoading();

                                                                    //with all operations complete, callback
                                                                    if (callback) {
                                                                        callback();
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    }, {
                                                        startupAudioMute: startupAudioMute
                                                    });
                                                });

                                                //begin game, callback is function which handles expections for any emulator error
                                                startupReadyWaiter.Begin();
                                                _Emulator.StartEmulator(function(e) {
                                                    startupReadyWaiter.Cancel();
                                                    _PubSub.Publish('error', ['There was an error with the emulator:', e]);
                                                });
                                            });
                                        }, artificialDelayForLoadingScreen);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    var WaitForMinimumGameLoadingDisplay = function(gameLoadingStart, gameKey, reason, callback) {

        var gameLoadingDialogUptime = Math.floor(Date.now() - gameLoadingStart);
        var artificialDelayForLoadingScreen = gameLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - gameLoadingDialogUptime;

        if (artificialDelayForLoadingScreen > 0) {
            _Logging.Console('ces.main', 'Keeping GameLoading dialog visible for ' + gameKey.system + ' before ' + reason + '; uptime=' + gameLoadingDialogUptime + 'ms, remaining=' + artificialDelayForLoadingScreen + 'ms');
        }

        setTimeout(function() {
            callback();
        }, artificialDelayForLoadingScreen);
    };

    var ShowGameLoading = function(_Emulator, gameKey, callback) {

        //bail state
        if ($.isEmptyObject(_Emulator.GetMostRecentSaves(1))) {
            _Logging.Console('ces.main', 'No recent saves available for startup selection: ' + gameKey.system + '/' + gameKey.title);
            callback('There are no recent saves to display');
            return;
        }

        _Logging.Console('ces.main', 'Opening startup save-selection dialog for ' + gameKey.system + '/' + gameKey.title);
        _Dialogs.Open('SaveSelection',[_Emulator, gameKey.system], true, function(err, selectedSaveTimeStamp, selectedSavescreenshot) {
            _Logging.Console('ces.main', 'Startup save-selection complete for ' + gameKey.system + ': selected=' + (!!selectedSaveTimeStamp) + (err ? ', reason=' + err : ''));
            callback(err, selectedSaveTimeStamp, selectedSavescreenshot);
        });
    };

    var GetEmulatorExtension = function(system) {

        if (_config.systemdetails[system] && _config.systemdetails[system].emuextention) {
            return _config.systemdetails[system].emuextention;
        }
        return 'unknown';
    };

    var ResolveShaderSelectionFromPreferences = function(gameKey, shader) {

        var savedShaderPreference;

        if (typeof shader !== 'undefined' && shader !== null) {
            return shader;
        }

        savedShaderPreference = GetSavedSystemShaderPreference(gameKey && gameKey.system);

        if (savedShaderPreference.exists) {
            return savedShaderPreference.shader || '';
        }

        return shader;
    };

    var GetSavedSystemShaderPreference = function(system) {

        var result = {
            exists: false,
            shader: null
        };
        var systemPreferences;

        if (!system || !_Preferences || typeof _Preferences.Get !== 'function') {
            return result;
        }

        systemPreferences = _Preferences.Get('systems.' + system);

        if (systemPreferences && typeof systemPreferences === 'object' && Object.prototype.hasOwnProperty.call(systemPreferences, 'shader')) {
            result.exists = true;
            result.shader = systemPreferences.shader || '';
        }

        return result;
    };

    var IsRetroArch1222StartupPath = function(system) {

        return GetEmulatorExtension(system) === '1.22.2-stable';
    };

    var SafeStringify = function(value) {

        try {
            return JSON.stringify(value);
        } catch (e) {
            return String(value);
        }
    };

    var LogStartupStateDiagnostics = function(prefix) {

        if (_Emulator && typeof _Emulator.GetStartupStateDiagnostics === 'function') {
            _Logging.Console('ces.main', prefix + ': ' + SafeStringify(_Emulator.GetStartupStateDiagnostics()));
        }
    };

    var LogStartupReadinessDiagnostics = function(prefix) {

        var diagnostics = null;

        if (_Emulator && typeof _Emulator.GetStartupReadinessDiagnostics === 'function') {
            diagnostics = _Emulator.GetStartupReadinessDiagnostics();
        }

        if (diagnostics) {
            _Logging.Console('ces.main', prefix + ': ' + SafeStringify(diagnostics));
        }
    };

    var PrepareStartupStateAudioMute = function(system, stateToLoad) {

        var result = {
            prepared: false,
            reason: stateToLoad ? 'startup audio mute helper unavailable' : 'no startup save-state selected'
        };

        if (!stateToLoad) {
            return result;
        }

        if (!_Emulator || typeof _Emulator.PrepareStartupStateAudioMute !== 'function') {
            _Logging.Console('ces.main', 'Startup pre-mute helper unavailable for ' + system + '; using post-ready mute fallback');
            return result;
        }

        try {
            result = _Emulator.PrepareStartupStateAudioMute('startup save-state selected for ' + system) || result;
        } catch (e) {
            result = {
                prepared: false,
                reason: 'startup audio mute helper failed: ' + e
            };
        }

        _Logging.Console('ces.main', 'Startup state-load audio pre-mute request for ' + system + ': ' + SafeStringify(result));

        if (!result.prepared) {
            _Logging.Console('ces.main', 'Startup audio will be muted after readiness for ' + system + ' because pre-mute was not available');
        }

        return result;
    };

    var CreateEmulatorStartupReadyWaiter = function(gameKey, callback) {

        var started = false;
        var completed = false;
        var timeout = null;
        var readinessProbeTimer = null;
        var unsubscribe = null;
        var startTime = null;
        var extension = GetEmulatorExtension(gameKey.system);

        var Cleanup = function() {

            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            if (readinessProbeTimer) {
                clearInterval(readinessProbeTimer);
                readinessProbeTimer = null;
            }
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }
        };

        var Complete = function(reason, timedOut) {

            if (completed) {
                return;
            }

            completed = true;
            Cleanup();

            callback({
                reason: reason,
                timedOut: !!timedOut,
                elapsed: startTime ? Date.now() - startTime : null
            });
        };

        var CheckCommandReadiness = function(reason) {

            var ready = false;

            if (!_Emulator || typeof _Emulator.IsStartupReadyForCommands !== 'function') {
                return false;
            }

            try {
                ready = _Emulator.IsStartupReadyForCommands();
            } catch (e) {
                _Logging.Console('ces.main', 'Startup readiness helper threw for ' + gameKey.system + ' (' + extension + '): ' + e);
                return false;
            }

            if (!ready) {
                return false;
            }

            _Logging.Console('ces.main', 'Observed emulator startup command readiness via helper for ' + gameKey.system + ' (' + extension + '), reason=' + reason);
            LogStartupReadinessDiagnostics('Startup readiness diagnostics at helper readiness for ' + gameKey.system);
            Complete('startup command readiness helper: ' + reason, false);
            return true;
        };

        unsubscribe = _PubSub.Subscribe('emulatorseemsready', self, function(reason, publishedExtension) {

            if (!started) {
                _Logging.Console('ces.main', 'Ignored pre-start/stale emulatorseemsready while preparing ' + gameKey.system + ' (' + extension + ')');
                return;
            }

            _Logging.Console('ces.main', 'Observed emulatorseemsready for ' + gameKey.system + ' (' + extension + '), reason=' + (reason || '(none)') + ', publisher=' + (publishedExtension || '(unknown)'));
            LogStartupReadinessDiagnostics('Startup readiness diagnostics at emulatorseemsready for ' + gameKey.system);
            Complete('emulatorseemsready', false);
        });

        return {
            Begin: function() {

                started = true;
                startTime = Date.now();

                _Logging.Console('ces.main', 'Waiting for emulator startup readiness for ' + gameKey.system + ' (' + extension + ')');
                LogStartupReadinessDiagnostics('Startup readiness diagnostics at wait begin for ' + gameKey.system);

                if (CheckCommandReadiness('begin')) {
                    return;
                }

                readinessProbeTimer = setInterval(function() {
                    CheckCommandReadiness('poll');
                }, 100);

                timeout = setTimeout(function() {

                    _Logging.Console('ces.main', 'Timed out waiting for emulatorseemsready for ' + gameKey.system + ' (' + extension + '); continuing startup recovery path');
                    LogStartupReadinessDiagnostics('Startup readiness diagnostics at readiness timeout for ' + gameKey.system);
                    Complete('timeout waiting for emulatorseemsready', true);
                }, _emulatorStartupReadyTimeout);
            },
            Cancel: function() {

                completed = true;
                Cleanup();
            }
        };
    };

    var SafeEmulatorKeypress = function(operation, callback, args) {

        var finished = false;
        var timeout = null;
        var done = function(reason) {

            if (finished) {
                return;
            }

            finished = true;
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            if (reason && reason !== 'callback') {
                _Logging.Console('ces.main', 'Simulated keypress for ' + operation + ' completed by fallback: ' + reason);
            }

            if (callback) {
                callback(reason || 'callback');
            }
        };

        timeout = setTimeout(function() {

            done('callback timeout');
        }, _emulatorKeypressCallbackTimeout);

        try {
            if (!_Emulator || !_Emulator._InputHelper || typeof _Emulator._InputHelper.Keypress !== 'function') {
                done('input helper unavailable');
                return;
            }

            _Logging.Console('ces.main', 'Attempting simulated keypress for startup operation: ' + operation);
            var keypressStarted = _Emulator._InputHelper.Keypress(operation, function(result) {
                done(result || 'callback');
            }, args);

            if (keypressStarted === false) {
                done('input helper skipped operation');
            }
        } catch (e) {
            _Logging.Console('ces.main', 'Simulated keypress failed for ' + operation + ': ' + e);
            done('exception');
        }
    };

    var IsEmulatorAudioMuted = function() {

        if (_Emulator && typeof _Emulator.IsAudioMuted === 'function') {
            return _Emulator.IsAudioMuted();
        }

        return true; //older emulator base builds did not expose the flag; preserve the old startup toggle behavior
    };

    var IsEmulatorPaused = function() {

        if (_Emulator && typeof _Emulator.IsEmulatorPaused === 'function') {
            return _Emulator.IsEmulatorPaused();
        }

        return true; //older emulator base builds did not expose the flag; preserve the old startup toggle behavior
    };

    var UnmuteStartupAudioIfNeeded = function(callback) {

        if (!IsEmulatorAudioMuted()) {
            if (callback) {
                callback('already unmuted');
            }
            return;
        }

        _Logging.Console('ces.main', 'Unmuting emulator audio after startup state-load sequence');
        SafeEmulatorKeypress('mute', callback);
    };

    var UnpauseStartupEmulatorIfNeeded = function(callback) {

        if (!IsEmulatorPaused()) {
            if (callback) {
                callback('already unpaused');
            }
            return;
        }

        _Logging.Console('ces.main', 'Unpausing emulator after startup state-load sequence');
        SafeEmulatorKeypress('pause', callback);
    };

    var LoadEmulatorState = function(system, stateToLoad, callback, options) {

        var extension = GetEmulatorExtension(system);
        var isRetroArch1222 = IsRetroArch1222StartupPath(system);
        var maxLoadAttempts = isRetroArch1222 ? 3 : 1;
        var postReadyDelay = isRetroArch1222 ? _stateLoadPostReadyDelay : 0;
        var startupAudioMute = (options && options.startupAudioMute) ? options.startupAudioMute : {};
        var startupAudioPreMuted = !!startupAudioMute.prepared;
        var saveLoadingStart = Date.now();
        var completed = false;
        var attempts = 0;
        var stateReadTimer = null;
        var retryTimer = null;
        var unsubscribeStateRead = null;
        var unsubscribeStateLoadFailed = null;
        var notificationsMutedForStartup = false;
        var startupMuteAttempted = startupAudioPreMuted;
        var startupPauseAttempted = false;

        var Cleanup = function() {

            if (stateReadTimer) {
                clearTimeout(stateReadTimer);
                stateReadTimer = null;
            }
            if (retryTimer) {
                clearTimeout(retryTimer);
                retryTimer = null;
            }
            if (unsubscribeStateRead) {
                unsubscribeStateRead();
                unsubscribeStateRead = null;
            }
            if (unsubscribeStateLoadFailed) {
                unsubscribeStateLoadFailed();
                unsubscribeStateLoadFailed = null;
            }
        };

        var RestoreNotifications = function() {

            if (notificationsMutedForStartup) {
                _PubSub.Unmute('notification');
                notificationsMutedForStartup = false;
            }
        };

        var DidStartupKeypressSkip = function(result) {

            return result === 'input helper unavailable' ||
                result === 'input helper skipped operation' ||
                result === 'unknown operation' ||
                result === 'keypress locked' ||
                result === 'emulator keydown handlers unavailable' ||
                result === 'modified emulator handlers unavailable' ||
                result === 'exception';
        };

        var TryEmulatorSpecificStartupLoadCommand = function(forceFallbacks, reason) {

            var result = null;

            if (!isRetroArch1222) {
                return null;
            }

            if (!_Emulator || typeof _Emulator.AttemptStartupStateLoadCommand !== 'function') {
                _Logging.Console('ces.main', 'RetroArch 1.22.2 startup load helper unavailable during ' + reason);
                return null;
            }

            try {
                result = _Emulator.AttemptStartupStateLoadCommand({
                    system: system,
                    extension: extension,
                    attempt: attempts,
                    forceFallbacks: !!forceFallbacks,
                    reason: reason
                });
                _Logging.Console('ces.main', 'RetroArch 1.22.2 startup load helper result during ' + reason + ': ' + SafeStringify(result));
            } catch (e) {
                _Logging.Console('ces.main', 'RetroArch 1.22.2 startup load helper failed during ' + reason + ': ' + e);
            }

            return result;
        };

        var BalanceStartupToggles = function(reason, callback) {

            var complete = function() {
                RestoreNotifications();
                if (callback) {
                    callback();
                }
            };

            var releasePreparedStartupMute = function(releaseCallback) {

                var releaseResult = null;

                if (!startupAudioPreMuted || !_Emulator || typeof _Emulator.ReleaseStartupStateAudioMute !== 'function') {
                    releaseCallback(false);
                    return;
                }

                _Logging.Console('ces.main', 'Releasing pre-start startup audio mute after ' + reason + ' for ' + system);

                try {
                    releaseResult = _Emulator.ReleaseStartupStateAudioMute(reason);
                } catch (e) {
                    releaseResult = {
                        released: false,
                        reason: 'release helper threw: ' + e
                    };
                }

                _Logging.Console('ces.main', 'Startup pre-muted audio release result for ' + system + ': ' + SafeStringify(releaseResult));

                if (releaseResult && releaseResult.released) {
                    releaseCallback(true);
                    return;
                }

                releaseCallback(false);
            };

            var balanceMute = function() {
                if (!startupMuteAttempted) {
                    complete();
                    return;
                }

                releasePreparedStartupMute(function(releasedPreparedMute) {

                    if (releasedPreparedMute) {
                        complete();
                        return;
                    }

                    _Logging.Console('ces.main', 'Balancing startup mute toggle after ' + reason + ' for ' + system);
                    SafeEmulatorKeypress('mute', function(result) {
                        _Logging.Console('ces.main', 'Startup mute balance completed with result=' + result);
                        complete();
                    });
                });
            };

            if (startupPauseAttempted) {
                _Logging.Console('ces.main', 'Balancing startup pause toggle after ' + reason + ' for ' + system);
                SafeEmulatorKeypress('pause', function(result) {
                    _Logging.Console('ces.main', 'Startup pause balance completed with result=' + result);
                    balanceMute();
                });
                return;
            }

            balanceMute();
        };

        var CompleteWithoutState = function() {

            callback({
                loaded: false,
                timedOut: false,
                skipped: true,
                attempts: 0
            });
        };

        var RecoverAfterStateLoadFailure = function(reason) {

            if (completed) {
                return;
            }

            completed = true;
            Cleanup();

            _Logging.Console('ces.main', 'Startup state-load fallback for ' + system + ' (' + extension + '): ' + reason + '. Unmuting and revealing emulator.');
            LogStartupStateDiagnostics('Startup state diagnostics at fallback for ' + system);

            if (_Emulator && typeof _Emulator.RecoverStartupStateLoadFailure === 'function') {
                _Emulator.RecoverStartupStateLoadFailure(reason);
            }

            BalanceStartupToggles(reason, function() {
                callback({
                    loaded: false,
                    timedOut: true,
                    skipped: false,
                    attempts: attempts,
                    reason: reason
                });
            });
        };

        var CompleteAfterStateRead = function(filename) {

            var saveLoadingDialogUptime;
            var artificialDelayForLoadingScreen;

            if (completed) {
                return;
            }

            completed = true;
            Cleanup();

            _Logging.Console('ces.main', 'Observed stateRead for startup save load: ' + filename);

            //keep in mind that this publish fires once the state has been loaded so the game is currently running
            //just like game loading, show the save loading screen for a minimum time before pressing the load
            saveLoadingDialogUptime = Math.floor(Date.now() - saveLoadingStart);
            artificialDelayForLoadingScreen = saveLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - saveLoadingDialogUptime;

            _Logging.Console('ces.main', 'Pausing after startup stateRead; saveLoadingDialogUptime=' + saveLoadingDialogUptime + 'ms, remainingGameLoadingDelay=' + artificialDelayForLoadingScreen + 'ms');

            //pause loaded state because we want to show the loading screen for a minimim amount of time
            startupPauseAttempted = true;
            SafeEmulatorKeypress('pause', function(result) {

                if (DidStartupKeypressSkip(result)) {
                    startupPauseAttempted = false;
                    _Logging.Console('ces.main', 'Startup pause after stateRead was skipped; no pause balance will be attempted. result=' + result);
                }

                setTimeout(function() {

                    _Logging.Console('ces.main', 'Unmuting and unpausing after successful startup state load for ' + system);
                    BalanceStartupToggles('successful startup state load', function() {
                        callback({
                            loaded: true,
                            timedOut: false,
                            skipped: false,
                            attempts: attempts,
                            filename: filename
                        });
                    });

                }, _minimumSaveLoadingTime);
            });
        };

        var StartStateReadTimer = function() {

            if (stateReadTimer) {
                clearTimeout(stateReadTimer);
            }

            stateReadTimer = setTimeout(function() {

                stateReadTimer = null;

                if (completed) {
                    return;
                }

                LogStartupStateDiagnostics('Startup state diagnostics after missing stateRead attempt ' + attempts + ' for ' + system);

                if (attempts < maxLoadAttempts) {
                    _Logging.Console('ces.main', 'No stateRead observed for ' + system + ' (' + extension + ') after loadstate attempt ' + attempts + '; retrying');
                    TryEmulatorSpecificStartupLoadCommand(true, 'stateRead timeout before retry ' + attempts);
                    retryTimer = setTimeout(function() {
                        retryTimer = null;
                        AttemptLoadState();
                    }, _stateReadRetryDelay);
                    return;
                }

                RecoverAfterStateLoadFailure('stateRead timeout after ' + attempts + ' loadstate attempt(s)');
            }, _stateReadTimeout);
        };

        var AttemptLoadState = function() {

            attempts++;
            _Logging.Console('ces.main', 'Attempting startup loadstate for ' + system + ' (' + extension + '), attempt ' + attempts + '/' + maxLoadAttempts);
            LogStartupStateDiagnostics('Startup state diagnostics before loadstate attempt ' + attempts + ' for ' + system);
            StartStateReadTimer();
            SafeEmulatorKeypress('loadstate', function(result) {
                _Logging.Console('ces.main', 'loadstate keypress sequence finished for startup attempt ' + attempts + ' with result=' + result);

                if (DidStartupKeypressSkip(result)) {
                    TryEmulatorSpecificStartupLoadCommand(true, 'keypress skipped on attempt ' + attempts);
                }
            }, attempts > 1 ? ['startup-state-load-retry'] : ['startup-state-load']);

            if (isRetroArch1222) {
                setTimeout(function() {
                    if (!completed) {
                        TryEmulatorSpecificStartupLoadCommand(true, 'post-keypress helper on attempt ' + attempts);
                    }
                }, 175);
            }
        };

        var BeginStateLoadAfterAudioMute = function() {

            if (completed) {
                return;
            }

            if (postReadyDelay) {
                retryTimer = setTimeout(function() {
                    retryTimer = null;
                    AttemptLoadState();
                }, postReadyDelay);
                return;
            }

            AttemptLoadState();
        };

        if (!stateToLoad) {
            _Logging.Console('ces.main', 'No startup save-state selected for ' + system + '; skipping state load');
            CompleteWithoutState();
            return;
        }

        _Logging.Console('ces.main', 'Preparing startup state load for ' + system + ' (' + extension + '), maxAttempts=' + maxLoadAttempts + ', postReadyDelay=' + postReadyDelay + 'ms');
        LogStartupStateDiagnostics('Startup state diagnostics at LoadEmulatorState entry for ' + system);

        //create a subscription for when the state file will have finished loading, then resume
        unsubscribeStateRead = _PubSub.SubscribeOnce('stateRead', self, function(filename) {
            CompleteAfterStateRead(filename);
        }, true); //sub once exclusive flag

        unsubscribeStateLoadFailed = _PubSub.SubscribeOnce('stateLoadFailed', self, function(source, detail) {

            _Logging.Console('ces.main', 'Observed stateLoadFailed for startup save load: source=' + (source || '(unknown)') + ', detail=' + SafeStringify(detail || null));
            RecoverAfterStateLoadFailure('emulator reported state-load failure from ' + (source || 'unknown'));
        }, true); //sub once exclusive flag

        //start here
        _PubSub.Mute('notification'); //mute notifications during load
        notificationsMutedForStartup = true;

        if (startupAudioPreMuted) {
            _Logging.Console('ces.main', 'Emulator audio was muted before start for startup state load on ' + system + '; skipping post-ready mute toggle before loadstate');
            BeginStateLoadAfterAudioMute();
            return;
        }

        _Logging.Console('ces.main', 'Muting emulator audio before startup state load for ' + system);
        startupMuteAttempted = true;
        SafeEmulatorKeypress('mute', function(result) {

            if (DidStartupKeypressSkip(result)) {
                startupMuteAttempted = false;
                _Logging.Console('ces.main', 'Startup mute was skipped; no mute balance will be attempted. result=' + result);
            }

            BeginStateLoadAfterAudioMute();
        });
    };

    var EmulatorFactory = function(gameKey, callback) {

        var emuExtention = _config.systemdetails[gameKey.system].emuextention;
        var emuExtentionFileName = 'ces.' + emuExtention + '.js';
        var emuExtentionPath = _config.paths.emulator_extensions + '/' + emuExtentionFileName;

        _Logging.Console('ces.main', 'Loading emulator extension for ' + gameKey.system + ': ' + emuExtentionPath);

        //get emulator extention file
        $.getScript(emuExtentionPath).done(function(script, textStatus) {

                _Logging.Console('ces.main', 'Loaded emulator extension: ' + emuExtentionFileName);

                //ui handles for the emulator class (add as needed, we want to only referece jquery in main if possible)
                var ui = {
                    'wrapper': $('#emulatorwrapper'),
                    'canvas': $('#emulator'),
                    'helper': $('#emulatorpositionhelper'),
                    'status': $('#loadingstatus')
                };

                //the class extention process: on the prototype of the ext, create using the base class.
                cesEmulator.prototype = new cesEmulatorBase(_Compression, _PubSub, _config, _Sync, _Gamepad, _Preferences, gameKey, ui, _Media, _ClientCache, _Logging);

                var emulator = new cesEmulator(_Compression, _PubSub, _config, _Sync, _Gamepad, _Preferences, gameKey, _Logging);

                //KEEP IN MIND: this pattern is imperfect. only the resulting structure (var emulator and later _Emulator)
                //will have access to data in both, cesEmulatorBase does not have knowledge of anything in cesEmulator
                
                callback(null, emulator);
            })
            .fail(function(jqxhr, settings, exception ) {
                _Logging.Console('ces.main', 'Failed to load emulator extension: ' + emuExtentionPath + ' status=' + jqxhr.status + ' error=' + exception);
                callback(exception);
            }
        );
    };

    var OnEmulatorFileWrite = function(filename, contents, options) {
        
        if (type === 'screen') {

            var arrayBufferView = options.arrayBufferView;
            var system = options.system;
            var title = options.title;

            $('p.screenshothelper').remove(); //remove helper text

            var width = $('#screenshotsslider div.slidercontainer').width() / 3; //550px is the size of the panel, the second number is how many screens to want to show per line
            var img = BuildScreenshot(_config, system, arrayBufferView, width);

            $(img).addClass('close').load(function() {
                $(this).removeClass('close');
            });
            var a = $('<a class="screenshotthumb" href="' + img.src + '" download="' + title + '-' + filename + '"></a>'); //html 5 spec downloads image
            a.append(img).insertAfter('#screenshotsslider p');

            //kick open the screenshot slider
            //_Sliders.Open('screenshotsslider', true);
        }
    };

    var CleanBoxFrontFactValue = function(value) {

        if (value === null || typeof value === 'undefined') {
            return '';
        }

        if (typeof value == 'string') {
            return $.trim(value);
        }

        if (typeof value == 'number') {
            return value.toString();
        }

        return '';
    };

    var FormatBoxFrontGenres = function(genres) {

        if (typeof genres != 'string') {
            return '';
        }

        var genreArray = genres.split(';');
        var displayGenres = [];

        for (var i = 0; i < genreArray.length; i++) {
            var genre = $.trim(genreArray[i]);

            if (genre) {
                displayGenres.push(genre);
            }
        }

        return displayGenres.join(', ');
    };

    var FormatBoxFrontReleaseDate = function(info) {

        if (!info) {
            return '';
        }

        var monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        var releaseDate = CleanBoxFrontFactValue(info.ReleaseDate);
        var releaseYear = CleanBoxFrontFactValue(info.ReleaseYear || info.Year);

        if (releaseDate) {
            var compactDateMatch = releaseDate.match(/^\s*(\d{4})(?:[-\/](\d{1,2})(?:[-\/]\d{1,2})?)?(?:[T\s].*)?\s*$/);

            if (compactDateMatch) {
                var year = compactDateMatch[1];
                var month = compactDateMatch[2] ? parseInt(compactDateMatch[2], 10) : null;

                if (month && month >= 1 && month <= 12) {
                    return monthNames[month - 1] + ' ' + year;
                }

                return year;
            }

            var parsedDate = new Date(releaseDate);

            if (!isNaN(parsedDate.getTime())) {
                return monthNames[parsedDate.getMonth()] + ' ' + parsedDate.getFullYear();
            }

            if (releaseYear) {
                return releaseYear;
            }

            return releaseDate;
        }

        return releaseYear;
    };

    var AddBoxFrontFact = function($facts, label, value) {

        value = CleanBoxFrontFactValue(value);

        if (!value) {
            return;
        }

        $('<dt />').text(label).appendTo($facts);
        $('<dd />').text(value).appendTo($facts);
    };

    var ClearBoxFrontDetails = function() {

        $('#gamedetailsboxfronttitle').empty();
        $('#gamedetailsboxfrontfacts').empty().hide();
        $('#gamedetailsboxfrontmetadata').hide();
    };

    var UpdateBoxFrontDetails = function(gameKey, info) {

        var $metadata = $('#gamedetailsboxfrontmetadata');
        var $title = $('#gamedetailsboxfronttitle');
        var $facts = $('#gamedetailsboxfrontfacts');

        // $title.empty().text(gameKey.title);
        $facts.empty();

        if (info) {
            AddBoxFrontFact($facts, 'Genre', FormatBoxFrontGenres(info.Genres));
            AddBoxFrontFact($facts, 'Released', FormatBoxFrontReleaseDate(info));
            AddBoxFrontFact($facts, 'Publisher', info.Publisher || info.Manufacturer);
            AddBoxFrontFact($facts, 'Developer', info.Developer);
        }

        if ($facts.children().length > 0) {
            $facts.show();
        } else {
            $facts.hide();
        }

        $metadata.show();
    };

    /**
     * build content area underneath emulator canvas
     * @param  {Object}   gameKey
     * @param  {Object}   info
     * @param  {Function} callback
     * @return {undef}
     */
    var DisplayGameContext = function(gameKey, info, callback) {

        var $img = _Media.BoxFront(gameKey, 'c');

        _currentGameKey = gameKey;
        $('#gamedetailsbackground').addClass('has-game-details');

        $('#gamedetailsboxfrontimage').empty().append($img);
        UpdateBoxFrontDetails(gameKey, info);

        // slide down background
        $('#gamedetailsboxfrontimage img').addClass('close');
        // $('#gamedetailsbackground').animate({
        //     height: 250
        // }, 1000, function() {

        //fade in details
        $('#gamedetailswrapper').fadeIn(1000, function() {

            $('#gamedetailsboxfrontimage img').removeClass();
            $('#controlsslider').empty();

            callback();
        });
    };

    var HideGameContext = function(callback) {

        //fade out game details
        _currentGameKey = null;
        $('#gamedetailsboxfrontimage img').addClass('close');
        $('#gamedetailswrapper').fadeOut(function() {
            if (!_currentGameKey) {
                $('#gamedetailsbackground').removeClass('has-game-details');
            }
        });
        ClearBoxFrontDetails();

        _Sliders.DeactivateAll();

        // $('#gamedetailsbackground').animate({
        //     height: 0
        // }, 1000, function() {

            if (callback) {
                callback();
            }
        //});
    };

    /**
     * Runs a series of keyboard instructions by keycode with optional delays between keystrokes
     * @param  {Object|Array}   instructions
     * @param  {Function} callback
     * @return {undef}
     */
    var runKeyboardMacro = function(instructions, callback) {


        //base case, either not an array or no more instructions are on queue
        if (!$.isArray(instructions) || instructions.length === 0) {
            if (callback) {
                callback();
            }
            return;
        }

        var keycode = instructions[0];
        var pause = 0;

        //if instruction contains code and pause length (in ms)
        if ($.isArray(keycode)) {
            keycode = keycode[0];
            if (keycode[1]) {
                pause = keycode[1];
            }
        }
        _Emulator._InputHelper.Keypress('', function() {
            runKeyboardMacro(instructions.slice(1), callback);
        });
    };

    /**
     * a trip to the server (same domain) to load an extra details about a game at load: states, rom files, ...
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {Object} all options to pass to server
     * @param  {Object} deffered
     * @return {undef}
     */
    var SavePreferencesAndGetPlayerGameDetails = function(gameKey, options, deffered) {

        //call returns not only states but misc game details. I tried to make this
        //part of the LoadGame call but the formatting for the compressed game got weird
        var url = '/games/load?gk=' + encodeURIComponent(gameKey.gk) + '&ts=' + new Date().getTime();

        _Sync.Post(url, options, function(data) {
            deffered.resolve(data);
        });
    };

    /**
     * generate a base64 encoded compressed string of the values necessary to load this game directly
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @return {string}
     */
    var GenerateLink = function(system, title, file) {
        return _Compression.In.string(encodeURI(system + '/' + title + '/' + file)); //prehaps slot for load state as query string?
    };

    /**
     * a quick function that downlaods all captured screens
     * @return {undef}
     */
    var DownloadAllScreens = function() {

        var delay = 500;
        var time = delay;

        $('.screenshotthumb').each(function(index) {

            setTimeout(function() {
                $(self)[0].click();
            }, delay);
            time += delay;
        });
    };

    return this;

})();

//assigns css animations at runtime.
//see https://daneden.github.io/animate.css/ for animation demos
//see animations.css for structure
$.fn.cssAnimation = function(name, ms, loop, onComplete, restoreClass) {

    var _self = this;
    
    //clear animation values
    var classList = _self.attr('class') ? _self.attr('class').split(/\s+/) : [];
    $.each(classList, function(index, item) {
        if (/^anim-/.test(item)) {
            _self.removeClass(item); //removes all classes that begin with anim
        }
    });
    
    //clear duration values
    _self.css({
        '-webkit-animation-duration': '', 
        'animation-duration': '',
        '-webkit-animation-iteration-count': '1',
        'animation-iteration-count': '1'
    });

    if (name) {
        _self.addClass('anim-' + name); //prefix

        if (loop) {
            _self.css({
                '-webkit-animation-iteration-count': 'infinite',
                'animation-iteration-count': 'infinite'
            });
        }

        if (ms) {

            _self.css({
                '-webkit-animation-duration': ms + 'ms', 
                'animation-duration': ms + 'ms'
            });

            //on animation completion
            setTimeout(function() {
                
                if (restoreClass) {
                    _self.removeClass().addClass(restoreClass);
                }

                if (onComplete) {
                    onComplete(_self);
                }
            }, ms);
        }
    }
    return this;
};


/**
 * css rotation animation helper and jquery extension
 * @param  {number} startingangle
 * @param  {number} angle
 * @param  {number} duration
 * @param  {string} easing
 * @param  {Function} complete
 * @return {Object}
 */
$.fn.animateRotate = function(startingangle, angle, duration, easing, complete) {
    var args = $.speed(duration, easing, complete);
    var step = args.step;
    return this.each(function(i, e) {
        args.complete = $.proxy(args.complete, e);
        /**
         * dont know, not my code
         * @param  {Date} now
         * @return {Object}
         */
        args.step = function(now) {
            $.style(e, 'transform', 'rotate(' + now + 'deg)');
            if (step) {
                return step.apply(e, arguments);
            }
        };

        $({deg: startingangle}).animate({deg: angle}, args);
    });
};

/**
 * common function to take arraybufferview of screenshot data and return a dom image. prodive width of image and we'll lookup aspect ration in config data
 * @param {string} system the system for which this screenshot belongs. used to look up aspect ratio
 * @param  {Array} arraybufferview
 * @param  {number} width
 * @return {Object}
 */
var BuildScreenshot = function(config, system, arraybufferview, width, height) {

    var screenratio = 1;
    var img;

    var blob = new Blob([arraybufferview], {
        type: 'image/bmp'
    });

    //get screen ratio from config
    if (config.systemdetails[system] && config.systemdetails[system].screenshotaspectratio) {
        screenratio = parseFloat(config.systemdetails[system].screenshotaspectratio);
    }

    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    
    if (width) {
        img = new Image(width, width / screenratio);        //create new image with correct ratio
    }
    if (height) {
        img = new Image(height * screenratio, height);        //create new image with correct ratio   
    }

    
    img.src = imageUrl;

    return img;
};

var shuffle = function(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
