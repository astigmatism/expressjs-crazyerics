var cesDialogsConfigureGamepad = (function(_config, $el, $wrapper, args) {

    var self = this;
    var _Gamepad = args[0];
    var _Compression = args[1];
    var _delayBetweenInputDetection = 200;
    var _openCallback;
    var _dialogBreathingRoom = 20;
    var _viewportBottomBreathingRoom = 20;
    var _minimumDialogHeight = 320;

    //pulled from config, an object conbining the retroarch name with a friendly label
    var _inputAssignmentMap;
    var _inputAssingments = {};
    var _savedInputConfig = null;
    var _promptForSavedMapping = false;
    var _runtimeConfiguration = false;
    var _dialogContext = 'preLaunchMapping';
    var _savedMappingActionLabel = 'Save and Continue';
    var _useKeyboardActionLabel = 'Use Keyboard for this System';
    var _cancelChangesActionLabel = 'Cancel Any Changes';
    var _startAssignmentOverActionLabel = 'Start Assignment Over';
    var _configureGamepadActionProperty = 'cesConfigureGamepadAction';
    var _useKeyboardAction = 'useKeyboardForInputInstead';
    var _cancelChangesAction = 'cancelAnyChanges';
    var _useKeyboardActionCopy = 'This will remove this gamepad mapping for the current system and use keyboard controls instead.';
    var _preLaunchUseKeyboardActionCopy = 'This will use keyboard controls for this launch and keep this gamepad unmapped for this system.';
    var _captureCanceled = false;
    var _pendingCaptureTimer = null;
    var _gamepad = null;
    var _gameKey = null;
    var _controllerDiagram = null;
    var _diagramCalloutsByInput = {};
    var _missingDiagramTargetNotices = {};
    var _activeDiagramCallout = null;
    var _diagramTargetRefreshTimer = null;
    var _targetTuner = null;
    var _keyboardIsolationActive = false;
    var _keyboardIsolationHandler = null;
    var _keyboardIsolationTargets = [];
    var _keyboardIsolationEventTypes = ['keydown', 'keypress', 'keyup'];
    var _inputCaptureActive = false;
    var _keyboardSkipWaitingForRelease = false;
    var _dialogHadTabIndex = false;
    var _dialogPreviousTabIndex = null;

    //arrays for iteration
    var _retroarchInputNames = [];
    var _inputLabels = [];

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    this.GetHeight = function(defaultHeight) {
        return UpdateDialogSizing(defaultHeight);
    };

    var Open = function(_config, gamepad, gameKey, options) {

        options = options || {};
        _gamepad = gamepad;
        _gameKey = gameKey;
        _savedInputConfig = options.savedInputConfig || null;
        _promptForSavedMapping = !!options.promptForSavedMapping;
        _runtimeConfiguration = !!options.runtimeConfiguration;
        _dialogContext = ResolveDialogContext(options);
        _savedMappingActionLabel = GetSavedMappingActionLabel(options);
        _captureCanceled = false;
        _inputCaptureActive = false;
        _keyboardSkipWaitingForRelease = false;
        _controllerDiagram = null;
        _diagramCalloutsByInput = {};
        _missingDiagramTargetNotices = {};
        _activeDiagramCallout = null;
        CloseTargetTuner();
        ClearPendingCaptureTimer();
        ClearDiagramTargetRefreshTimer();

        $el
            .toggleClass('runtimeconfiguration', _runtimeConfiguration)
            .removeClass('viewportconstrained');

        //reset if used previously
        _retroarchInputNames = [];
        _inputLabels = [];
        _inputAssingments = {};

        $el.find('span.gamepadsystem').text(_config.systemdetails[gameKey.system].shortname); //title
        $el.find('span.gamepadid').text(gamepad.id); //game pad id
        $el.find('span.gamepadport').text(gamepad.index + 1); //game pad port (+1 as its 0 based)

        $('#gamepadwrapper').css('background-image', 'none');

        $(window)
            .off('resize.cesConfigureGamepadDiagram')
            .on('resize.cesConfigureGamepadDiagram', function() {
                ScheduleDiagramTargetRefresh();
            });

        StartKeyboardIsolation();
        BindDefaultActions();

        //this was a prereq for coming here
        _inputAssignmentMap = _config.mappings[gameKey.system];
        _controllerDiagram = GetControllerDiagram(gameKey.system);

        //convert map to indexable arrays. This preserves the existing assignment order.
        var index = 0;
        for (var retroarchInputName in _inputAssignmentMap) {
            _retroarchInputNames[index] = retroarchInputName;
            _inputLabels[index] = _inputAssignmentMap[retroarchInputName];
            ++index;
        }

        if (_savedInputConfig && _promptForSavedMapping) {
            ShowSavedMapping();
        }
        else {
            StartOver(); //clear field
        }
    };

    this.OnIntroAnimationComplete = function() {

    };

    this.OnClose = function(callback) {
        CancelActiveCapture();
        StopKeyboardIsolation();
        CloseTargetTuner();
        ClearDiagramTargetRefreshTimer();
        RemoveUseSavedButton();
        HideCancelButton();
        $(window).off('resize.cesConfigureGamepadDiagram');
        $el.removeClass('runtimeconfiguration viewportconstrained').css('max-height', '');
        return callback();
    };

    window.cesConfigureGamepadTargetTuner = function(action) {
        return HandleTargetTunerConsoleRequest(action);
    };


    var UpdateDialogSizing = function(defaultHeight) {

        if (_runtimeConfiguration) {
            return UpdateRuntimeDialogSizing(defaultHeight);
        }

        var wrapperOffset = $wrapper.offset();
        var wrapperTop = wrapperOffset ? wrapperOffset.top : 0;
        var wrapperTopInViewport = Math.max(0, wrapperTop - $(window).scrollTop());
        var availableHeight = $(window).height() - wrapperTopInViewport - _viewportBottomBreathingRoom;

        if (!availableHeight || availableHeight < _minimumDialogHeight) {
            availableHeight = _minimumDialogHeight;
        }

        $el
            .removeClass('viewportconstrained')
            .css('max-height', '');

        var naturalDialogHeight = Math.ceil($el.outerHeight(true));
        if (!naturalDialogHeight && defaultHeight) {
            naturalDialogHeight = defaultHeight - (_dialogBreathingRoom * 2);
        }

        var targetHeight = Math.min(naturalDialogHeight + (_dialogBreathingRoom * 2), availableHeight);
        targetHeight = Math.max(Math.min(_minimumDialogHeight, availableHeight), targetHeight);

        var dialogMaxHeight = Math.max(0, targetHeight - (_dialogBreathingRoom * 2));
        $el.css('max-height', dialogMaxHeight + 'px');

        if (naturalDialogHeight > dialogMaxHeight) {
            $el.addClass('viewportconstrained');
        }

        return targetHeight;
    };

    var UpdateRuntimeDialogSizing = function(defaultHeight) {

        var $dialogs = $('#dialogs');
        var $emulatorWrapper = $('#emulatorwrapper');
        var wrapperOffset = $wrapper.offset();
        var wrapperTop = wrapperOffset ? wrapperOffset.top : 0;
        var wrapperTopInViewport = Math.max(0, wrapperTop - $(window).scrollTop());
        var availableHeight = $(window).height() - wrapperTopInViewport - _viewportBottomBreathingRoom;
        var baseHeight = parseInt($dialogs.data('ces-runtime-gamepad-configure-base-height'), 10);
        var measuredSpaceHeight = Math.max(
            isNaN(baseHeight) ? 0 : baseHeight,
            $wrapper.length ? Math.ceil($wrapper.outerHeight()) : 0,
            $emulatorWrapper.length ? Math.ceil($emulatorWrapper.outerHeight()) : 0
        );
        var currentSpaceHeight = measuredSpaceHeight > 0 ? Math.max(measuredSpaceHeight, _minimumDialogHeight) : Math.max(defaultHeight || 0, _minimumDialogHeight);

        if (!availableHeight || availableHeight < _minimumDialogHeight) {
            availableHeight = _minimumDialogHeight;
        }

        $el
            .removeClass('viewportconstrained')
            .css('max-height', '');

        var naturalDialogHeight = Math.ceil($el.outerHeight(true));
        if (!naturalDialogHeight && defaultHeight) {
            naturalDialogHeight = defaultHeight - (_dialogBreathingRoom * 2);
        }

        var naturalTargetHeight = Math.max(_minimumDialogHeight, naturalDialogHeight + (_dialogBreathingRoom * 2));
        var targetHeight = currentSpaceHeight;

        if (naturalTargetHeight > currentSpaceHeight) {
            targetHeight = Math.max(currentSpaceHeight, Math.min(naturalTargetHeight, availableHeight));
        }

        if ($emulatorWrapper.length) {
            $emulatorWrapper.css('min-height', targetHeight + 'px');
        }

        var dialogMaxHeight = Math.max(0, targetHeight - (_dialogBreathingRoom * 2));
        $el.css('max-height', dialogMaxHeight + 'px');

        if (naturalDialogHeight > dialogMaxHeight) {
            $el.addClass('viewportconstrained');
        }

        return targetHeight;
    };

    var RequestDialogResize = function() {
        if ($wrapper && $wrapper.length) {
            $wrapper.trigger('ces-dialog-resize-requested');
        }
    };

    var BindDefaultActions = function() {

        $('#gamepadconfigactions')
            .removeClass('savedmappingactions')
            .addClass('captureactions');
        RemoveUseSavedButton();
        ConfigureCancelButton(_runtimeConfiguration);

        $('#startgamepadover')
            .removeClass('map remove play')
            .addClass('button first zoom noselect')
            .text(_startAssignmentOverActionLabel)
            .off()
            .on('mouseup', function() {
                StartOver();
                return;
            });

        $('#skipgamepadconfig')
            .removeClass('map play remove first')
            .addClass('button zoom noselect')
            .attr({
                title: GetUseKeyboardActionCopy(),
                'aria-label': _useKeyboardActionLabel + '. ' + GetUseKeyboardActionCopy()
            })
            .text(_useKeyboardActionLabel)
            .off()
            .on('mouseup', function() {
                UseKeyboardForInputInstead();
                return;
            });
    };

    var ShowSavedMapping = function() {

        var $list = ResetGamepadWrapper('savedmapping');

        SetIntroText('saved');
        UpdateSavedMappingVisual();
        $('#gamepadconfigactions')
            .removeClass('captureactions')
            .addClass('savedmappingactions');

        $('#startgamepadover')
            .removeClass('map remove play')
            .addClass('button zoom noselect')
            .text(_startAssignmentOverActionLabel)
            .off()
            .on('mouseup', function() {
                StartOver();
                return;
            });

        $('#skipgamepadconfig')
            .removeClass('map play remove first')
            .addClass('button zoom noselect')
            .attr({
                title: GetUseKeyboardActionCopy(),
                'aria-label': _useKeyboardActionLabel + '. ' + GetUseKeyboardActionCopy()
            })
            .text(_useKeyboardActionLabel)
            .off()
            .on('mouseup', function() {
                UseKeyboardForInputInstead();
                return;
            });

        ConfigureCancelButton(_runtimeConfiguration);

        EnsureUseSavedButton()
            .off()
            .on('mouseup', function() {
                _openCallback(_savedInputConfig);
                return;
            });

        for (var i = 0; i < _inputLabels.length; ++i) {
            var retroarchInputName = _retroarchInputNames[i];
            var assignment = _savedInputConfig[retroarchInputName];
            var html = $('<li><div class="title"></div><div class="assignment"></div></li>');
            html.find('.title').text(_inputLabels[i] + ':');
            html.find('.assignment').text(GetAssignmentLabel(assignment));
            $list.append(html);
        }

        RequestDialogResize();
    };

    var StartOver = function() {

        _inputAssingments = {};
        _captureCanceled = false;
        _inputCaptureActive = false;
        _keyboardSkipWaitingForRelease = false;
        ClearPendingCaptureTimer();
        RemoveUseSavedButton();
        BindDefaultActions();
        SetIntroText('capture');

        var $list = ResetGamepadWrapper('capture');

        for (var i = 0; i < _inputLabels.length; ++i) {
            var html = $('<li><div class="title"></div><div class="assignment">Not Assigned</div></li>');
            html.find('.title').text(_inputLabels[i] + ':');
            $list.append(html);
        }

        var listitems = $list.find('li');

        RequestDialogResize();

        ListenForInput(listitems, 0, function() {

            //config array defined, return it
            _openCallback(_inputAssingments);
        });
    };

    var ListenForInput = function(listitems, index, callback) {

        if (_captureCanceled) {
            return;
        }

        var $li = $(listitems[index]);
        UpdateCurrentAssignmentVisual(index);
        _inputCaptureActive = true;
        $li.find('.assignment').text('Press button');
        $li.addClass('pulse current');

        _Gamepad.GetNextInput(function(value, label) {

            if (_captureCanceled) {
                return;
            }

            _inputCaptureActive = false;
            $li.find('.assignment').text(label);
            $li.removeClass('pulse current').addClass(value === '' ? 'skipped' : 'assigned');

            //record assignment
            _inputAssingments[_retroarchInputNames[index]] = value;

            index++;
            if (index >= _inputLabels.length) {
                UpdateCompleteVisual();
                callback();
            } else {

                //this timeout prevents last input from being read again instantly :p
                ClearPendingCaptureTimer();
                _pendingCaptureTimer = setTimeout(function() {
                    _pendingCaptureTimer = null;
                    ListenForInput(listitems, index, callback);
                }, _delayBetweenInputDetection);
            }
        }, {
            gamepadIndex: _gamepad.index
        });
    };

    var CancelActiveCapture = function() {
        _captureCanceled = true;
        _inputCaptureActive = false;
        ClearPendingCaptureTimer();

        if (_Gamepad && typeof _Gamepad.CancelInputCapture === 'function') {
            _Gamepad.CancelInputCapture(_runtimeConfiguration ? 'runtime ConfigureGamepad canceled' : 'ConfigureGamepad canceled');
        }

        HideDiagramTarget();
    };

    var ClearPendingCaptureTimer = function() {
        if (_pendingCaptureTimer) {
            clearTimeout(_pendingCaptureTimer);
            _pendingCaptureTimer = null;
        }
    };

    var ClearDiagramTargetRefreshTimer = function() {
        if (_diagramTargetRefreshTimer) {
            clearTimeout(_diagramTargetRefreshTimer);
            _diagramTargetRefreshTimer = null;
        }
    };

    var ScheduleDiagramTargetRefresh = function() {
        ClearDiagramTargetRefreshTimer();

        _diagramTargetRefreshTimer = setTimeout(function() {
            _diagramTargetRefreshTimer = null;
            RefreshDiagramTargetLayout();
        }, 40);
    };

    var RefreshDiagramTargetLayout = function() {
        if (_activeDiagramCallout) {
            PositionDiagramTarget(_activeDiagramCallout);
        }

        RefreshTargetTunerLayout();
    };

    var EnsureUseSavedButton = function() {

        var $button = $('#usegamepadsavedconfig');
        if (!$button.length) {
            $button = $('<button id="usegamepadsavedconfig" type="button" class="button play zoom noselect"></button>');
        }

        $('#gamepadconfigactions').append($button);
        $button.removeClass('map remove first').addClass('button play zoom noselect').text(_savedMappingActionLabel).show();
        return $button;
    };

    var RemoveUseSavedButton = function() {
        $('#usegamepadsavedconfig').remove();
    };

    var EnsureCancelButton = function() {

        var $button = $('#cancelgamepadconfig');
        if (!$button.length) {
            $button = $('<button id="cancelgamepadconfig" type="button" class="button remove zoom noselect"></button>');
        }

        $('#gamepadconfigactions').append($button);
        return $button;
    };

    var ConfigureCancelButton = function(show) {

        var $button = EnsureCancelButton();

        if (!show) {
            HideCancelButton();
            return $button;
        }

        $button
            .removeClass('map play first')
            .addClass('button remove zoom noselect')
            .text(_cancelChangesActionLabel)
            .show()
            .off()
            .on('mouseup', function() {
                CancelAnyChanges();
                return;
            });

        return $button;
    };

    var HideCancelButton = function() {

        $('#cancelgamepadconfig')
            .off()
            .hide();
    };

    var CreateActionResult = function(action, inputconfig) {

        var result = {};
        result[_configureGamepadActionProperty] = action;
        if (inputconfig) {
            result.inputconfig = inputconfig;
        }
        return result;
    };

    var UseKeyboardForInputInstead = function() {

        CancelActiveCapture();
        _openCallback(CreateActionResult(_useKeyboardAction));
    };

    var CancelAnyChanges = function() {

        CancelActiveCapture();
        _openCallback(CreateActionResult(_cancelChangesAction));
    };

    var GetUseKeyboardActionCopy = function() {

        if (_dialogContext === 'preLaunchMapping' && !_savedInputConfig) {
            return _preLaunchUseKeyboardActionCopy;
        }

        return _useKeyboardActionCopy;
    };

    var GetSavedMappingActionLabel = function(options) {
        options = options || {};

        if (options.savedMappingActionLabel) {
            return options.savedMappingActionLabel;
        }

        return 'Save and Continue';
    };

    var ResolveDialogContext = function(options) {
        options = options || {};

        if (options.dialogContext === 'preLaunchMapping' || options.dialogContext === 'inGameConfiguration' || options.dialogContext === 'remappingExistingController') {
            return options.dialogContext;
        }

        if (options.runtimeConfiguration) {
            return 'inGameConfiguration';
        }

        if (options.promptForSavedMapping || options.savedInputConfig) {
            return 'remappingExistingController';
        }

        return 'preLaunchMapping';
    };

    var GetIntroSubtitle = function(mode) {

        if (mode === 'capture') {
            if (_dialogContext === 'inGameConfiguration' || _runtimeConfiguration) {
                return 'Your current game is paused. Press a gamepad button to assign the highlighted control, or press any keyboard key to skip it. Skipped controls stay unassigned';
            }

            return 'Press a gamepad button to assign the highlighted control, or press any keyboard key to skip it. Skipped controls stay unassigned';
        }

        if (_dialogContext === 'inGameConfiguration' || _runtimeConfiguration) {
            return 'Your current game is paused while you configure this gamepad';
        }

        if (mode === 'saved' || _dialogContext === 'remappingExistingController') {
            return 'Review or update this gamepad mapping. Using keyboard removes this mapping for this system';
        }

        if (_dialogContext === 'preLaunchMapping') {
            return 'Configure your connected gamepad for this system';
        }

        return 'Configure your connected gamepad for this system';
    };

    var GetSubtitleElement = function() {
        var $subtitle = $el.find('.gamepadconfigsubtitle').first();

        if ($subtitle.length) {
            return $subtitle;
        }

        return $el.find('p').eq(0);
    };

    var GetSavedMappingActionCopy = function() {
        return _runtimeConfiguration ?
            'Save and continue with the saved mapping, start assignment over, use keyboard input instead, or cancel any changes.' :
            'Save and continue with the saved mapping, start assignment over, or use keyboard input instead.';
    };

    var SetIntroText = function(mode) {

        GetSubtitleElement().text(GetIntroSubtitle(mode));
    };

    var ResetGamepadWrapper = function(mode) {

        var $gamepadWrapper = $('#gamepadwrapper');
        var $list = $('<ul />')
            .attr('id', 'gamepadinputs')
            .addClass('gamepad-input-list');

        CloseTargetTuner();

        $gamepadWrapper
            .removeClass('capture savedmapping hasdiagram nodiagram notarget')
            .addClass(mode || 'capture')
            .empty();

        $gamepadWrapper.append(BuildAssignmentVisual());
        $gamepadWrapper.append($list);

        return $list;
    };

    var BuildAssignmentVisual = function() {

        var systemName = GetSystemName();
        var systemClass = GetSystemClassSuffix(_gameKey && _gameKey.system);
        var hasDiagram = !!(_controllerDiagram && _controllerDiagram.image);
        var $visual = $('<div />')
            .attr({
                id: 'gamepadassignmentvisual',
                'aria-live': 'polite'
            })
            .addClass('gamepad-assignment-visual ' + (hasDiagram ? 'has-diagram' : 'no-diagram'));
        var $diagram = $('<div />').addClass('gamepad-assignment-diagram');
        var $stage = $('<div />').addClass('gamepad-assignment-diagram-stage' + (hasDiagram ? (' controls-manual-diagram controls-manual-diagram-' + systemClass) : ''));
        var $device = $('<div />').addClass('gamepad-assignment-device').text(GetControllerDeviceLabel());

        if (hasDiagram) {
            var $image = $('<img />')
                .addClass('gamepad-assignment-controller-image controller controls-controller-photo controls-controller-photo-' + systemClass + ' close')
                .attr({
                    src: _controllerDiagram.image,
                    alt: _controllerDiagram.imageAlt || (systemName + ' controller')
                })
                .data('fallback-src', BuildLegacyControllerImagePath(_gameKey.system));

            $image.on('load', function() {
                $(this).removeClass('close');
                ScheduleDiagramTargetRefresh();
                RequestDialogResize();
            });

            $image.on('error', function() {
                var $img = $(this);
                var fallback = $img.data('fallback-src');

                if (fallback && $img.attr('src') !== fallback) {
                    $img.attr('src', fallback);
                    return;
                }

                $visual.addClass('imagefailed');
                SetStageFallback('Controller diagram unavailable', 'Use the highlighted input list to finish assigning this controller.');
                RequestDialogResize();
            });

            $stage.append($image);
            $stage.append($('<div />').addClass('gamepad-assignment-target-ring'));
            $stage.append($('<div />').addClass('gamepad-assignment-no-diagram-title').text(systemName));
            $stage.append($('<div />').addClass('gamepad-assignment-no-diagram-copy').text('Use the highlighted input list to continue. Gamepad buttons assign controls; keyboard keys skip them.'));
        }
        else {
            $stage.append($('<div />').addClass('gamepad-assignment-no-diagram-title').text(systemName));
            $stage.append($('<div />').addClass('gamepad-assignment-no-diagram-copy').text('No controller diagram is configured for this system. Gamepad buttons assign controls; keyboard keys skip them.'));
        }

        $stage.append($device);
        $diagram.append($stage);
        $visual.append($diagram);

        return $visual;
    };

    var UpdateSavedMappingVisual = function() {

        var $visual = $('#gamepadassignmentvisual');

        $visual.removeClass('notarget complete').addClass('saved');
        $visual.find('.gamepad-assignment-device').text(GetControllerDeviceLabel());
        if ($visual.hasClass('no-diagram') || $visual.hasClass('imagefailed')) {
            SetStageFallback('Saved mapping', GetSavedMappingActionCopy());
        }
        HideDiagramTarget();
        RefreshTargetTunerState();
    };

    var UpdateCurrentAssignmentVisual = function(index) {

        var inputName = _retroarchInputNames[index];
        var label = _inputLabels[index];
        var $visual = $('#gamepadassignmentvisual');
        var callout = GetDiagramCalloutForInput(inputName);

        $visual.removeClass('saved complete notarget');
        $visual.find('.gamepad-assignment-device').text(GetControllerDeviceLabel());

        if (!callout || !HasUsableTarget(callout)) {
            HideDiagramTarget();
            $visual.addClass('notarget');
            SetStageFallback(label, 'No diagram target is configured for this input. Press a gamepad button to assign it, or press any keyboard key to skip it.');
            NoteMissingDiagramTarget(inputName, label);
            RefreshTargetTunerState();
            return;
        }

        ShowDiagramTarget(callout);
        RefreshTargetTunerState();
    };

    var UpdateCompleteVisual = function() {

        var $visual = $('#gamepadassignmentvisual');

        $visual.removeClass('saved notarget').addClass('complete');
        $visual.find('.gamepad-assignment-device').text(GetControllerDeviceLabel());
        if ($visual.hasClass('no-diagram') || $visual.hasClass('imagefailed')) {
            SetStageFallback('Mapping complete', 'Saving this controller mapping.');
        }
        HideDiagramTarget();
        RefreshTargetTunerState();
    };

    var SetStageFallback = function(title, copy) {

        var $visual = $('#gamepadassignmentvisual');

        $visual.find('.gamepad-assignment-no-diagram-title').text(title || 'Controller diagram unavailable');
        $visual.find('.gamepad-assignment-no-diagram-copy').text(copy || 'Use the highlighted input list to continue.');
    };

    var GetControllerDeviceLabel = function() {

        var controllerLabel = 'Controller ' + (_gamepad.index + 1);

        if (_gamepad && _gamepad.id) {
            return controllerLabel + ' - ' + _gamepad.id;
        }

        return controllerLabel;
    };

    var ShowDiagramTarget = function(callout) {

        var $visual = $('#gamepadassignmentvisual');

        _activeDiagramCallout = callout;
        $visual.removeClass('notarget');

        PositionDiagramTarget(callout);
        ScheduleDiagramTargetRefresh();
    };

    var PositionDiagramTarget = function(callout) {

        var targetX = ReadCoordinate(callout.targetX, callout.lineX, callout.x, 50);
        var targetY = ReadCoordinate(callout.targetY, callout.lineY, callout.y, 50);
        var geometry = GetDiagramCoordinateGeometry();
        var target;
        var $visual = $('#gamepadassignmentvisual');

        if (!geometry) {
            return;
        }

        target = TranslateDiagramCoordinate(targetX, targetY, geometry);
        $visual.find('.gamepad-assignment-target-ring').css({
            left: target.left + 'px',
            top: target.top + 'px'
        });
    };

    var GetDiagramCoordinateGeometry = function() {

        var $visual = $('#gamepadassignmentvisual');
        var $stage = $visual.find('.gamepad-assignment-diagram-stage');
        var stageNode = $stage[0];
        var helper = GetDiagramCoordinateHelper();
        var geometry;
        var stageRect;
        var stageWidth;
        var stageHeight;

        if (!stageNode || $visual.hasClass('imagefailed')) {
            return null;
        }

        if (helper && typeof helper.getElementGeometry === 'function') {
            geometry = helper.getElementGeometry(stageNode);

            if (geometry) {
                geometry.stageWidth = geometry.width;
                geometry.stageHeight = geometry.height;
                return geometry;
            }
        }

        stageRect = stageNode.getBoundingClientRect();
        stageWidth = stageRect.width || $stage.innerWidth();
        stageHeight = stageRect.height || $stage.innerHeight();

        if (!stageWidth || !stageHeight) {
            return null;
        }

        return {
            width: stageWidth,
            height: stageHeight,
            stageWidth: stageWidth,
            stageHeight: stageHeight
        };
    };

    var TranslateDiagramCoordinate = function(x, y, geometry) {

        var helper = GetDiagramCoordinateHelper();

        if (helper && typeof helper.translateCoordinate === 'function') {
            return helper.translateCoordinate(x, y, geometry);
        }

        return {
            left: (ReadCoordinate(x, 50) / 100) * geometry.stageWidth,
            top: (ReadCoordinate(y, 50) / 100) * geometry.stageHeight
        };
    };

    var HideDiagramTarget = function() {

        var $visual = $('#gamepadassignmentvisual');

        _activeDiagramCallout = null;
        ClearDiagramTargetRefreshTimer();

        $visual.find('.gamepad-assignment-target-ring').css({
            left: '-999px',
            top: '-999px'
        });

        RefreshTargetTunerState();
    };

    var HandleTargetTunerConsoleRequest = function(action) {

        action = (typeof action === 'string') ? action.toLowerCase() : action;

        if (action === false || action === 'close' || action === 'hide' || action === 'off') {
            CloseTargetTuner();
            return null;
        }

        if (action === 'dump' || action === 'export') {
            return BuildTargetTunerExport();
        }

        if (action === 'copy') {
            CopyTargetTunerCallouts();
            return BuildTargetTunerApi();
        }

        if (action === 'refresh') {
            RefreshTargetTuner();
            return BuildTargetTunerApi();
        }

        if (action === 'next') {
            if (!_targetTuner) {
                OpenTargetTuner();
            }
            CycleTargetTunerSelection(1);
            return BuildTargetTunerApi();
        }

        if (action === 'previous' || action === 'prev') {
            if (!_targetTuner) {
                OpenTargetTuner();
            }
            CycleTargetTunerSelection(-1);
            return BuildTargetTunerApi();
        }

        return OpenTargetTuner();
    };

    var OpenTargetTuner = function() {

        var $visual = $('#gamepadassignmentvisual');
        var $stage = $visual.find('.gamepad-assignment-diagram-stage');
        var $overlay;

        if (!IsConfigureGamepadDialogActive()) {
            LogTargetTunerMessage('Open Configure Gamepad before starting the target tuner.');
            return null;
        }

        if (!$visual.length || !$stage.length || !$visual.hasClass('has-diagram') || $visual.hasClass('imagefailed') || !_controllerDiagram) {
            LogTargetTunerMessage('The current Configure Gamepad view does not have a controller diagram to tune.');
            return null;
        }

        if (_targetTuner) {
            RefreshTargetTuner();
            return BuildTargetTunerApi();
        }

        $overlay = $('<div />').addClass('gamepad-target-tuner-overlay');

        _targetTuner = {
            $overlay: $overlay,
            $markers: $('<div />').addClass('gamepad-target-tuner-markers'),
            $panel: BuildTargetTunerPanel(),
            selectedIndex: GetInitialTargetTunerSelectionIndex(),
            nudgeStep: 0.01,
            dragging: null
        };

        $overlay.append(_targetTuner.$markers);
        $overlay.append(_targetTuner.$panel);
        $stage.append($overlay);

        RenderTargetTunerMarkers();
        RefreshTargetTunerState();
        RefreshTargetTunerOutput();

        LogTargetTunerMessage('Target tuner opened. Drag markers to update targetX/targetY, then copy the callouts JSON.');
        return BuildTargetTunerApi();
    };

    var CloseTargetTuner = function() {

        $(document).off('.cesConfigureGamepadTargetTuner');

        if (!_targetTuner) {
            return;
        }

        _targetTuner.$overlay.remove();
        _targetTuner = null;
    };

    var RefreshTargetTuner = function() {

        if (!_targetTuner) {
            return;
        }

        RenderTargetTunerMarkers();
        RefreshTargetTunerLayout();
        RefreshTargetTunerState();
        RefreshTargetTunerOutput();
    };

    var RefreshTargetTunerLayout = function() {

        var callouts;

        if (!_targetTuner) {
            return;
        }

        callouts = GetTunableCallouts();

        _targetTuner.$markers.find('.gamepad-target-tuner-marker').each(function() {
            var $marker = $(this);
            var index = parseInt($marker.attr('data-callout-index'), 10);

            if (!isNaN(index) && callouts[index]) {
                PositionTargetTunerMarker($marker, callouts[index]);
            }
        });
    };

    var RefreshTargetTunerState = function() {

        var callouts;

        if (!_targetTuner) {
            return;
        }

        callouts = GetTunableCallouts();

        _targetTuner.$markers.find('.gamepad-target-tuner-marker').each(function() {
            var $marker = $(this);
            var index = parseInt($marker.attr('data-callout-index'), 10);
            var callout = (!isNaN(index)) ? callouts[index] : null;

            $marker.toggleClass('active-assignment-target', !!(callout && CalloutsReferToSameTarget(callout, _activeDiagramCallout)));
            $marker.toggleClass('selected', index === _targetTuner.selectedIndex);
        });

        RefreshTargetTunerSelectionSummary();
    };

    var BuildTargetTunerPanel = function() {

        var $panel = $('<div />').addClass('gamepad-target-tuner-panel');
        var $header = $('<div />').addClass('gamepad-target-tuner-header');
        var $navigation = $('<div />').addClass('gamepad-target-tuner-navigation');
        var $actions = $('<div />').addClass('gamepad-target-tuner-actions');
        var $nudge = $('<div />').addClass('gamepad-target-tuner-nudge');
        var $current = $('<div />').addClass('gamepad-target-tuner-current');
        var $step = BuildTargetTunerStepSelector();
        var $textarea = $('<textarea />')
            .addClass('gamepad-target-tuner-output')
            .attr({
                readonly: 'readonly',
                spellcheck: 'false'
            });

        $header.append($('<strong />').text('Target tuner'));
        $header.append($('<button type="button" />')
            .addClass('gamepad-target-tuner-close')
            .attr('title', 'Close target tuner')
            .text('x')
            .on('click', function() {
                CloseTargetTuner();
            }));

        $current.append($('<span />').addClass('gamepad-target-tuner-current-kicker').text('Tuning control'));
        $current.append($('<strong />').addClass('gamepad-target-tuner-current-label').text('Select or drag a marker'));
        $current.append($('<span />').addClass('gamepad-target-tuner-current-meta').text(''));

        $navigation.append($('<button type="button" />')
            .addClass('gamepad-target-tuner-prev')
            .attr('title', 'Select previous control target')
            .text('Previous control')
            .on('click', function() {
                CycleTargetTunerSelection(-1);
            }));

        $navigation.append($('<button type="button" />')
            .addClass('gamepad-target-tuner-next')
            .attr('title', 'Select next control target')
            .text('Next control')
            .on('click', function() {
                CycleTargetTunerSelection(1);
            }));

        $actions.append($('<button type="button" />')
            .addClass('gamepad-target-tuner-copy-selected')
            .text('Copy selected')
            .on('click', function() {
                CopyTargetTunerSelectedCoordinate();
            }));

        $actions.append($('<button type="button" />')
            .addClass('gamepad-target-tuner-copy-all')
            .text('Copy callouts')
            .on('click', function() {
                CopyTargetTunerCallouts();
            }));

        $actions.append($('<button type="button" />')
            .addClass('gamepad-target-tuner-refresh')
            .text('Refresh')
            .on('click', function() {
                RefreshTargetTuner();
            }));

        $nudge.append($('<span />').text('Nudge'));
        $nudge.append($step);
        $nudge.append(BuildTargetTunerNudgeButton('left', -1, 0, 'Nudge left'));
        $nudge.append(BuildTargetTunerNudgeButton('up', 0, -1, 'Nudge up'));
        $nudge.append(BuildTargetTunerNudgeButton('down', 0, 1, 'Nudge down'));
        $nudge.append(BuildTargetTunerNudgeButton('right', 1, 0, 'Nudge right'));

        $panel.append($header);
        $panel.append($('<div />').addClass('gamepad-target-tuner-help').text('Drag a white dot or step through targets below. Marker labels are pinned here so they do not block the diagram.'));
        $panel.append($current);
        $panel.append($navigation);
        $panel.append($nudge);
        $panel.append($actions);
        $panel.append($textarea);

        return $panel;
    };

    var BuildTargetTunerStepSelector = function() {

        var steps = [0.01, 0.05, 0.1, 0.5, 1];
        var $select = $('<select />')
            .addClass('gamepad-target-tuner-step')
            .attr('title', 'Nudge step size')
            .on('change', function() {
                if (_targetTuner) {
                    _targetTuner.nudgeStep = GetTargetTunerNudgeStep();
                }
            });
        var i;

        for (i = 0; i < steps.length; i++) {
            $select.append($('<option />')
                .attr('value', steps[i])
                .prop('selected', steps[i] === 0.01)
                .text(FormatTargetTunerCoordinate(steps[i])));
        }

        return $select;
    };

    var BuildTargetTunerNudgeButton = function(direction, xDirection, yDirection, title) {

        return $('<button type="button" />')
            .addClass('gamepad-target-tuner-nudge-' + direction)
            .attr('title', title)
            .text(direction.substring(0, 1).toUpperCase())
            .on('click', function() {
                NudgeTargetTunerSelection(xDirection, yDirection);
            });
    };

    var RenderTargetTunerMarkers = function() {

        var callouts;
        var i;

        if (!_targetTuner) {
            return;
        }

        callouts = GetTunableCallouts();
        _targetTuner.$markers.empty();

        for (i = 0; i < callouts.length; i++) {
            _targetTuner.$markers.append(BuildTargetTunerMarker(callouts[i], i));
        }

        if (_targetTuner.selectedIndex >= callouts.length) {
            _targetTuner.selectedIndex = callouts.length ? 0 : -1;
        }
    };

    var BuildTargetTunerMarker = function(callout, index) {

        var label = GetTargetTunerCalloutLabel(callout);
        var $marker = $('<button type="button" />')
            .addClass('gamepad-target-tuner-marker')
            .attr({
                'data-callout-index': index,
                'aria-label': label + ' target'
            });

        $marker.append($('<span />').addClass('gamepad-target-tuner-marker-dot'));

        $marker.on('click', function(e) {
            e.preventDefault();
            SelectTargetTunerMarker(index);
        });

        $marker.on('mousedown touchstart', function(e) {
            StartTargetTunerDrag(e, index, $(this));
        });

        PositionTargetTunerMarker($marker, callout);
        return $marker;
    };

    var SelectTargetTunerMarker = function(index) {

        var callouts;

        if (!_targetTuner) {
            return;
        }

        callouts = GetTunableCallouts();

        if (!callouts.length) {
            _targetTuner.selectedIndex = -1;
            RefreshTargetTunerState();
            RefreshTargetTunerOutput();
            return;
        }

        index = parseInt(index, 10);

        if (isNaN(index)) {
            index = 0;
        }

        _targetTuner.selectedIndex = Math.max(0, Math.min(callouts.length - 1, index));
        RefreshTargetTunerState();
        RefreshTargetTunerOutput();
    };

    var CycleTargetTunerSelection = function(direction) {

        var callouts;
        var selectedIndex;

        if (!_targetTuner) {
            return;
        }

        callouts = GetTunableCallouts();

        if (!callouts.length) {
            SelectTargetTunerMarker(-1);
            return;
        }

        direction = direction < 0 ? -1 : 1;
        selectedIndex = _targetTuner.selectedIndex;

        if (selectedIndex < 0 || selectedIndex >= callouts.length) {
            selectedIndex = GetActiveTargetTunerIndex();
        }

        if (selectedIndex < 0) {
            selectedIndex = direction > 0 ? -1 : 0;
        }

        SelectTargetTunerMarker((selectedIndex + direction + callouts.length) % callouts.length);
    };

    var StartTargetTunerDrag = function(e, index, $marker) {

        var callouts = GetTunableCallouts();
        var callout = callouts[index];

        if (!_targetTuner || !callout) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        SelectTargetTunerMarker(index);

        _targetTuner.dragging = {
            index: index,
            callout: callout,
            $marker: $marker
        };

        _targetTuner.$overlay.addClass('dragging');

        $(document)
            .off('.cesConfigureGamepadTargetTuner')
            .on('mousemove.cesConfigureGamepadTargetTuner touchmove.cesConfigureGamepadTargetTuner', function(moveEvent) {
                MoveTargetTunerDrag(moveEvent);
            })
            .on('mouseup.cesConfigureGamepadTargetTuner touchend.cesConfigureGamepadTargetTuner touchcancel.cesConfigureGamepadTargetTuner', function(upEvent) {
                EndTargetTunerDrag(upEvent);
            });

        MoveTargetTunerDrag(e);
    };

    var MoveTargetTunerDrag = function(e) {

        var coordinate;

        if (!_targetTuner || !_targetTuner.dragging) {
            return;
        }

        coordinate = ReadTargetTunerPointerCoordinate(e);

        if (!coordinate) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        ApplyTargetTunerCoordinate(_targetTuner.dragging.callout, coordinate.x, coordinate.y);
        PositionTargetTunerMarker(_targetTuner.dragging.$marker, _targetTuner.dragging.callout);
        RefreshTargetTunerState();
        RefreshTargetTunerOutput();
    };

    var EndTargetTunerDrag = function(e) {

        if (!_targetTuner) {
            return;
        }

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        $(document).off('.cesConfigureGamepadTargetTuner');
        _targetTuner.$overlay.removeClass('dragging');
        _targetTuner.dragging = null;
        RefreshTargetTunerOutput();
    };

    var NudgeTargetTunerSelection = function(xDirection, yDirection) {

        var callouts;
        var callout;
        var coordinate;
        var step;

        if (!_targetTuner || _targetTuner.selectedIndex < 0) {
            return;
        }

        callouts = GetTunableCallouts();
        callout = callouts[_targetTuner.selectedIndex];

        if (!callout) {
            return;
        }

        step = GetTargetTunerNudgeStep();
        coordinate = GetTargetTunerCalloutCoordinate(callout);
        ApplyTargetTunerCoordinate(callout, coordinate.x + (xDirection * step), coordinate.y + (yDirection * step));
        RefreshTargetTunerLayout();
        RefreshTargetTunerState();
        RefreshTargetTunerOutput();
    };

    var GetTargetTunerNudgeStep = function() {

        var step = _targetTuner ? parseFloat(_targetTuner.$panel.find('.gamepad-target-tuner-step').val()) : 0.01;

        if (isNaN(step) || step <= 0) {
            step = 0.01;
        }

        return step;
    };

    var PositionTargetTunerMarker = function($marker, callout) {

        var coordinate = GetTargetTunerCalloutCoordinate(callout);
        var geometry = GetDiagramCoordinateGeometry();
        var target;

        if (!geometry) {
            return;
        }

        target = TranslateDiagramCoordinate(coordinate.x, coordinate.y, geometry);

        $marker.css({
            left: target.left + 'px',
            top: target.top + 'px'
        });
    };

    var ApplyTargetTunerCoordinate = function(callout, x, y) {

        var targetX = RoundTargetTunerCoordinate(ClampCoordinate(x));
        var targetY = RoundTargetTunerCoordinate(ClampCoordinate(y));
        var inputName;
        var mapped;

        callout.targetX = targetX;
        callout.targetY = targetY;

        for (inputName in _diagramCalloutsByInput) {
            if (_diagramCalloutsByInput.hasOwnProperty(inputName)) {
                mapped = _diagramCalloutsByInput[inputName];

                if (CalloutsReferToSameTarget(callout, mapped)) {
                    mapped.targetX = targetX;
                    mapped.targetY = targetY;
                }
            }
        }

        if (_activeDiagramCallout && CalloutsReferToSameTarget(callout, _activeDiagramCallout)) {
            _activeDiagramCallout.targetX = targetX;
            _activeDiagramCallout.targetY = targetY;
            PositionDiagramTarget(_activeDiagramCallout);
        }
    };

    var ReadTargetTunerPointerCoordinate = function(e) {

        var $stage = $('#gamepadassignmentvisual').find('.gamepad-assignment-diagram-stage');
        var stageNode = $stage[0];
        var helper = GetDiagramCoordinateHelper();
        var coordinate;
        var rect;
        var pointer;

        if (!stageNode) {
            return null;
        }

        if (helper && typeof helper.readPointerCoordinate === 'function') {
            coordinate = helper.readPointerCoordinate(e, stageNode);

            if (coordinate) {
                return coordinate;
            }
        }

        pointer = GetTargetTunerPointer(e);

        if (!pointer) {
            return null;
        }

        rect = stageNode.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return null;
        }

        return {
            x: ClampCoordinate(((pointer.clientX - rect.left) / rect.width) * 100),
            y: ClampCoordinate(((pointer.clientY - rect.top) / rect.height) * 100)
        };
    };

    var GetTargetTunerPointer = function(e) {

        var original = e.originalEvent || e;

        if (original.touches && original.touches.length) {
            return original.touches[0];
        }

        if (original.changedTouches && original.changedTouches.length) {
            return original.changedTouches[0];
        }

        if (typeof original.clientX !== 'undefined' && typeof original.clientY !== 'undefined') {
            return original;
        }

        return null;
    };

    var GetTargetTunerCalloutCoordinate = function(callout) {

        return {
            x: ReadCoordinate(callout.targetX, callout.lineX, callout.x, 50),
            y: ReadCoordinate(callout.targetY, callout.lineY, callout.y, 50)
        };
    };

    var GetTunableCallouts = function() {

        if (!_controllerDiagram || !_controllerDiagram.callouts) {
            return [];
        }

        return _controllerDiagram.callouts;
    };

    var GetInitialTargetTunerSelectionIndex = function() {

        var activeIndex = GetActiveTargetTunerIndex();
        var callouts = GetTunableCallouts();

        if (activeIndex >= 0) {
            return activeIndex;
        }

        return callouts.length ? 0 : -1;
    };

    var GetActiveTargetTunerIndex = function() {

        var callouts = GetTunableCallouts();
        var i;

        if (!_activeDiagramCallout) {
            return -1;
        }

        for (i = 0; i < callouts.length; i++) {
            if (CalloutsReferToSameTarget(callouts[i], _activeDiagramCallout)) {
                return i;
            }
        }

        return -1;
    };

    var RefreshTargetTunerOutput = function() {

        if (!_targetTuner) {
            return;
        }

        _targetTuner.$panel.find('.gamepad-target-tuner-output').val(BuildTargetTunerExportText());
        RefreshTargetTunerSelectionSummary();
    };

    var RefreshTargetTunerSelectionSummary = function() {

        var callouts;
        var callout;
        var coordinate;
        var label = 'Select or drag a marker';
        var meta = '';
        var activeLabel;
        var activeIndex;

        if (!_targetTuner) {
            return;
        }

        callouts = GetTunableCallouts();
        activeIndex = GetActiveTargetTunerIndex();

        if (_targetTuner.selectedIndex >= 0 && callouts[_targetTuner.selectedIndex]) {
            callout = callouts[_targetTuner.selectedIndex];
            coordinate = GetTargetTunerCalloutCoordinate(callout);
            label = GetTargetTunerCalloutLabel(callout);
            meta = 'Control ' + (_targetTuner.selectedIndex + 1) + ' of ' + callouts.length + ' | targetX ' + FormatTargetTunerCoordinate(coordinate.x) + ', targetY ' + FormatTargetTunerCoordinate(coordinate.y);

            if (activeIndex === _targetTuner.selectedIndex) {
                meta += ' | active assignment target';
            }
            else if (activeIndex >= 0 && callouts[activeIndex]) {
                activeLabel = GetTargetTunerCalloutLabel(callouts[activeIndex]);
                meta += ' | assignment is on ' + activeLabel;
            }
        }
        else if (_activeDiagramCallout) {
            coordinate = GetTargetTunerCalloutCoordinate(_activeDiagramCallout);
            label = GetTargetTunerCalloutLabel(_activeDiagramCallout);
            meta = 'Active assignment target | targetX ' + FormatTargetTunerCoordinate(coordinate.x) + ', targetY ' + FormatTargetTunerCoordinate(coordinate.y);
        }

        _targetTuner.$panel.find('.gamepad-target-tuner-current-label').text(label);
        _targetTuner.$panel.find('.gamepad-target-tuner-current-meta').text(meta);
        _targetTuner.$panel.find('.gamepad-target-tuner-prev, .gamepad-target-tuner-next').prop('disabled', callouts.length < 2);
        _targetTuner.$panel.find('.gamepad-target-tuner-copy-selected').prop('disabled', !(_targetTuner.selectedIndex >= 0 && callouts[_targetTuner.selectedIndex]));
    };

    var BuildTargetTunerApi = function() {

        return {
            system: _gameKey ? _gameKey.system : null,
            callouts: BuildTargetTunerExport(),
            copyCallouts: function() {
                CopyTargetTunerCallouts();
            },
            copySelected: function() {
                CopyTargetTunerSelectedCoordinate();
            },
            refresh: function() {
                RefreshTargetTuner();
            },
            next: function() {
                CycleTargetTunerSelection(1);
            },
            previous: function() {
                CycleTargetTunerSelection(-1);
            },
            close: function() {
                CloseTargetTuner();
            }
        };
    };

    var BuildTargetTunerExportText = function() {

        return JSON.stringify(BuildTargetTunerExport(), null, 2);
    };

    var BuildTargetTunerExport = function() {

        var exportCallouts = [];
        var callouts = GetTunableCallouts();
        var i;

        for (i = 0; i < callouts.length; i++) {
            exportCallouts.push(BuildTargetTunerCalloutExport(callouts[i]));
        }

        return exportCallouts;
    };

    var BuildTargetTunerCalloutExport = function(callout) {

        var exported = {};
        var coordinate = GetTargetTunerCalloutCoordinate(callout);

        CopyCalloutExportProperty(exported, callout, 'id');
        CopyCalloutExportProperty(exported, callout, 'input');
        CopyCalloutExportProperty(exported, callout, 'label');
        CopyCoordinateExportProperty(exported, callout, 'x');
        CopyCoordinateExportProperty(exported, callout, 'y');
        CopyCoordinateExportProperty(exported, callout, 'lineX');
        CopyCoordinateExportProperty(exported, callout, 'lineY');
        exported.targetX = RoundTargetTunerCoordinate(coordinate.x);
        exported.targetY = RoundTargetTunerCoordinate(coordinate.y);

        if (callout.inputs && callout.inputs.length) {
            exported.inputs = BuildTargetTunerInputsExport(callout.inputs);
        }

        return exported;
    };

    var BuildTargetTunerInputsExport = function(inputs) {

        var exported = [];
        var i;
        var input;

        for (i = 0; i < inputs.length; i++) {
            input = {};
            CopyCalloutExportProperty(input, inputs[i], 'input');
            CopyCalloutExportProperty(input, inputs[i], 'label');
            exported.push(input);
        }

        return exported;
    };

    var CopyCalloutExportProperty = function(target, source, property) {

        if (source[property] !== null && typeof source[property] !== 'undefined' && source[property] !== '') {
            target[property] = source[property];
        }
    };

    var CopyCoordinateExportProperty = function(target, source, property) {

        if (IsCoordinate(source[property])) {
            target[property] = RoundTargetTunerCoordinate(source[property]);
        }
    };

    var CopyTargetTunerCallouts = function() {

        CopyTextToClipboard(BuildTargetTunerExportText(), 'Copied target tuner callouts JSON.');
    };

    var CopyTargetTunerSelectedCoordinate = function() {

        var callouts;
        var callout;
        var coordinate;
        var output;

        if (!_targetTuner || _targetTuner.selectedIndex < 0) {
            LogTargetTunerMessage('Select a target marker first.');
            return;
        }

        callouts = GetTunableCallouts();
        callout = callouts[_targetTuner.selectedIndex];

        if (!callout) {
            LogTargetTunerMessage('Select a target marker first.');
            return;
        }

        coordinate = GetTargetTunerCalloutCoordinate(callout);
        output = JSON.stringify({
            input: callout.input || null,
            label: GetTargetTunerCalloutLabel(callout),
            targetX: RoundTargetTunerCoordinate(coordinate.x),
            targetY: RoundTargetTunerCoordinate(coordinate.y)
        }, null, 2);

        CopyTextToClipboard(output, 'Copied selected target coordinate.');
    };

    var CopyTextToClipboard = function(text, successMessage) {

        var $textarea;
        var copied = false;

        if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
            window.navigator.clipboard.writeText(text).then(function() {
                LogTargetTunerMessage(successMessage);
            }, function() {
                CopyTextToClipboardFallback(text, successMessage);
            });
            return;
        }

        copied = CopyTextToClipboardFallback(text, successMessage);

        if (!copied && _targetTuner) {
            $textarea = _targetTuner.$panel.find('.gamepad-target-tuner-output');
            $textarea.focus().select();
            LogTargetTunerMessage('Clipboard copy was blocked. The output text has been selected instead.');
        }
    };

    var CopyTextToClipboardFallback = function(text, successMessage) {

        var textarea = document.createElement('textarea');
        var copied = false;

        textarea.value = text;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            copied = document.execCommand('copy');
        }
        catch (err) {
            copied = false;
        }

        document.body.removeChild(textarea);

        if (copied) {
            LogTargetTunerMessage(successMessage);
        }

        return copied;
    };

    var StartKeyboardIsolation = function() {
        StopKeyboardIsolation();

        _keyboardIsolationActive = true;
        _keyboardIsolationHandler = function(event) {
            return HandleKeyboardIsolationEvent(event);
        };

        AddKeyboardIsolationTarget(window);
        AddKeyboardIsolationTarget(document);
        FocusConfigureGamepadDialog();
    };

    var StopKeyboardIsolation = function() {
        var i;
        var j;
        var target;

        _keyboardIsolationActive = false;
        _inputCaptureActive = false;
        _keyboardSkipWaitingForRelease = false;

        if (_keyboardIsolationHandler) {
            for (i = 0; i < _keyboardIsolationTargets.length; i++) {
                target = _keyboardIsolationTargets[i];

                for (j = 0; j < _keyboardIsolationEventTypes.length; j++) {
                    try {
                        target.removeEventListener(_keyboardIsolationEventTypes[j], _keyboardIsolationHandler, true);
                    } catch (e) {}
                }
            }
        }

        _keyboardIsolationTargets = [];
        _keyboardIsolationHandler = null;
        RestoreConfigureGamepadDialogFocusState();
    };

    var AddKeyboardIsolationTarget = function(target) {
        var i;

        if (!target || !target.addEventListener) {
            return;
        }

        _keyboardIsolationTargets.push(target);

        for (i = 0; i < _keyboardIsolationEventTypes.length; i++) {
            target.addEventListener(_keyboardIsolationEventTypes[i], _keyboardIsolationHandler, true);
        }
    };

    var HandleKeyboardIsolationEvent = function(event) {
        if (!_keyboardIsolationActive) {
            return true;
        }

        ConsumeKeyboardEvent(event);

        if (event && event.type === 'keyup') {
            _keyboardSkipWaitingForRelease = false;
            return false;
        }

        if (ShouldKeyboardEventSkipCurrentAssignment(event)) {
            SkipCurrentAssignmentFromKeyboard(event);
        }

        return false;
    };

    var ShouldKeyboardEventSkipCurrentAssignment = function(event) {
        return !!(
            event &&
            !_captureCanceled &&
            _inputCaptureActive &&
            (event.type === 'keydown' || event.type === 'keypress')
        );
    };

    var SkipCurrentAssignmentFromKeyboard = function(event) {
        var skipped;

        if (_keyboardSkipWaitingForRelease) {
            return false;
        }

        if (!_Gamepad || typeof _Gamepad.SkipInputCapture !== 'function') {
            return false;
        }

        skipped = _Gamepad.SkipInputCapture('ConfigureGamepad keyboard skip' + GetKeyboardEventDescription(event));

        if (skipped) {
            _keyboardSkipWaitingForRelease = true;
        }

        return skipped;
    };

    var GetKeyboardEventDescription = function(event) {
        if (!event) {
            return '';
        }

        if (event.key) {
            return ': ' + event.key;
        }

        if (event.code) {
            return ': ' + event.code;
        }

        if (event.keyCode || event.which) {
            return ': keyCode ' + (event.keyCode || event.which);
        }

        return '';
    };

    var ConsumeKeyboardEvent = function(event) {
        if (!event) {
            return;
        }

        try { event.preventDefault(); } catch (e) {}
        try { event.stopPropagation(); } catch (e) {}
        try { event.stopImmediatePropagation(); } catch (e) {}
    };

    var FocusConfigureGamepadDialog = function() {
        if (!$el || !$el.length) {
            return;
        }

        _dialogHadTabIndex = typeof $el.attr('tabindex') !== 'undefined';
        _dialogPreviousTabIndex = $el.attr('tabindex');
        $el.attr('tabindex', '-1');

        setTimeout(function() {
            if (!_keyboardIsolationActive || !$el || !$el.length || !$el[0] || typeof $el[0].focus !== 'function') {
                return;
            }

            try {
                $el[0].focus();
            } catch (e) {}
        }, 0);
    };

    var RestoreConfigureGamepadDialogFocusState = function() {
        if (!$el || !$el.length) {
            return;
        }

        if (_dialogHadTabIndex) {
            $el.attr('tabindex', _dialogPreviousTabIndex);
        }
        else {
            $el.removeAttr('tabindex');
        }

        _dialogHadTabIndex = false;
        _dialogPreviousTabIndex = null;
    };

    var IsConfigureGamepadDialogActive = function() {

        return !!($el && $el.length && !$el.hasClass('hide') && !$el.hasClass('close'));
    };

    var CalloutsReferToSameTarget = function(first, second) {

        if (!first || !second) {
            return false;
        }

        if (first === second) {
            return true;
        }

        if (first.id && second.id && first.id === second.id) {
            return true;
        }

        if (first.input && second.input && first.input === second.input) {
            return true;
        }

        return false;
    };

    var GetTargetTunerCalloutLabel = function(callout) {

        if (!callout) {
            return 'Target';
        }

        return callout.label || (callout.input ? GetMappingLabel(callout.input) : callout.id) || 'Target';
    };

    var ClampCoordinate = function(value) {

        var helper = GetDiagramCoordinateHelper();

        if (helper && typeof helper.clampCoordinate === 'function') {
            return helper.clampCoordinate(value);
        }

        value = parseFloat(value);

        if (isNaN(value)) {
            return 50;
        }

        return Math.max(0, Math.min(100, value));
    };

    var RoundTargetTunerCoordinate = function(value) {

        value = parseFloat(value);

        if (isNaN(value)) {
            value = 50;
        }

        return Math.round(value * 100) / 100;
    };

    var FormatTargetTunerCoordinate = function(value) {

        return RoundTargetTunerCoordinate(value).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + '%';
    };

    var LogTargetTunerMessage = function(message) {

        if (window.console && window.console.info) {
            window.console.info('ConfigureGamepad target tuner: ' + message);
        }
    };

    var GetDiagramCoordinateHelper = function() {

        return window.cesControllerDiagramCoordinates || null;
    };

    var GetControllerDiagram = function(system) {

        var systemDetails = GetSystemDetails(system);
        var diagram;
        var normalized;

        if (!systemDetails || !systemDetails.controllerDiagram) {
            return null;
        }

        diagram = systemDetails.controllerDiagram;
        normalized = NormalizeControllerDiagram(diagram, system);

        if (!normalized.callouts.length) {
            return null;
        }

        return normalized;
    };

    var NormalizeControllerDiagram = function(diagram, system) {

        var normalized = {};
        var callouts = diagram.callouts || [];
        var i;
        var callout;

        MergeObject(normalized, diagram);
        normalized.callouts = [];
        normalized.image = normalized.image || normalized.imagePath || BuildLegacyControllerImagePath(system);
        normalized.imageAlt = normalized.imageAlt || GetSystemName() + ' controller';

        for (i = 0; i < callouts.length; i++) {
            callout = NormalizeCallout(callouts[i]);

            if (callout) {
                normalized.callouts.push(callout);
                RegisterDiagramCallout(callout);
            }
        }

        return normalized;
    };

    var NormalizeCallout = function(callout) {

        var input;
        var inputs;

        if (!callout) {
            return null;
        }

        input = callout.input || null;
        inputs = NormalizeCalloutInputs(callout.inputs);

        if (!input && !inputs.length) {
            return null;
        }

        return {
            id: callout.id || input || BuildGroupedCalloutId(inputs, callout.label),
            input: input,
            label: callout.label || (input ? GetMappingLabel(input) : 'Grouped Controls'),
            x: ReadOptionalCoordinate(callout.x, callout.position && callout.position.x),
            y: ReadOptionalCoordinate(callout.y, callout.position && callout.position.y),
            lineX: ReadOptionalCoordinate(callout.lineX, callout.line && callout.line.x, callout.x, callout.position && callout.position.x),
            lineY: ReadOptionalCoordinate(callout.lineY, callout.line && callout.line.y, callout.y, callout.position && callout.position.y),
            targetX: ReadOptionalCoordinate(callout.targetX, callout.target && callout.target.x),
            targetY: ReadOptionalCoordinate(callout.targetY, callout.target && callout.target.y),
            inputs: inputs
        };
    };

    var NormalizeCalloutInputs = function(inputs) {

        var normalized = [];
        var input;

        if (!$.isArray(inputs)) {
            return normalized;
        }

        for (var i = 0; i < inputs.length; i++) {
            input = NormalizeCalloutInput(inputs[i]);

            if (input) {
                normalized.push(input);
            }
        }

        return normalized;
    };

    var NormalizeCalloutInput = function(input) {

        var inputName;
        var label;

        if (!input) {
            return null;
        }

        if (typeof input === 'string') {
            inputName = input;
            label = GetMappingLabel(inputName);
        }
        else {
            inputName = input.input || null;
            label = input.label || (inputName ? GetMappingLabel(inputName) : null);
        }

        if (!inputName) {
            return null;
        }

        return {
            input: inputName,
            label: label || GetMappingLabel(inputName)
        };
    };

    var RegisterDiagramCallout = function(callout) {

        var i;
        var groupedCallout;

        if (callout.input) {
            _diagramCalloutsByInput[callout.input] = callout;
        }

        for (i = 0; i < callout.inputs.length; i++) {
            groupedCallout = CloneCalloutForInput(callout, callout.inputs[i]);
            _diagramCalloutsByInput[groupedCallout.input] = groupedCallout;
        }
    };

    var CloneCalloutForInput = function(callout, input) {

        return {
            id: callout.id,
            input: input.input,
            label: input.label || callout.label,
            x: callout.x,
            y: callout.y,
            lineX: callout.lineX,
            lineY: callout.lineY,
            targetX: callout.targetX,
            targetY: callout.targetY,
            inputs: []
        };
    };

    var BuildGroupedCalloutId = function(inputs, label) {

        var parts = [];

        if (label) {
            parts.push(label);
        }

        for (var i = 0; i < inputs.length; i++) {
            parts.push(inputs[i].input);
        }

        return parts.length ? ('group_' + parts.join('_')) : 'grouped_callout';
    };

    var GetDiagramCalloutForInput = function(inputName) {

        if (!_controllerDiagram || !_diagramCalloutsByInput) {
            return null;
        }

        return _diagramCalloutsByInput[inputName] || null;
    };

    var HasUsableTarget = function(callout) {

        return !!(callout && IsCoordinate(callout.targetX) && IsCoordinate(callout.targetY));
    };

    var IsCoordinate = function(value) {

        return value !== null && typeof value !== 'undefined' && !isNaN(parseFloat(value));
    };

    var ReadOptionalCoordinate = function() {

        var i;
        var value;

        for (i = 0; i < arguments.length; i++) {
            value = arguments[i];

            if (value === null || typeof value === 'undefined' || value === '') {
                continue;
            }

            value = parseFloat(String(value).replace('%', ''));

            if (!isNaN(value)) {
                return value;
            }
        }

        return null;
    };

    var ReadCoordinate = function() {

        var i;
        var value;

        for (i = 0; i < arguments.length; i++) {
            value = arguments[i];

            if (value === null || typeof value === 'undefined' || value === '') {
                continue;
            }

            value = parseFloat(String(value).replace('%', ''));

            if (!isNaN(value)) {
                return value;
            }
        }

        return 50;
    };

    var NoteMissingDiagramTarget = function(inputName, label) {

        var key = (_gameKey ? _gameKey.system : 'system') + ':' + inputName;

        if (_missingDiagramTargetNotices[key]) {
            return;
        }

        _missingDiagramTargetNotices[key] = true;

        if (window.console && window.console.debug) {
            window.console.debug('ConfigureGamepad: no controller diagram target for ' + key + ' (' + label + '). Falling back to text prompt.');
        }
    };

    var MergeObject = function(target, source) {

        if (!source) {
            return;
        }

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };

    var GetSystemDetails = function(system) {

        if (_config.systemdetails && system && _config.systemdetails[system]) {
            return _config.systemdetails[system];
        }

        return null;
    };

    var GetSystemName = function() {

        var systemDetails = GetSystemDetails(_gameKey && _gameKey.system);

        if (systemDetails && systemDetails.shortname) {
            return systemDetails.shortname;
        }

        if (systemDetails && systemDetails.name) {
            return systemDetails.name;
        }

        return (_gameKey && _gameKey.system) || 'System';
    };

    var GetMappingLabel = function(inputName) {

        if (_inputAssignmentMap && _inputAssignmentMap[inputName]) {
            return _inputAssignmentMap[inputName];
        }

        return inputName;
    };

    var GetSystemClassSuffix = function(system) {

        return String(system || 'system').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    };

    var BuildLegacyControllerImagePath = function(system) {

        if (!_config.paths || !_config.paths.images || !system) {
            return '';
        }

        return _config.paths.images + '/gamepads/' + system + '/controls-slider-bg.png';
    };

    var GetAssignmentLabel = function(assignment) {

        if (assignment === null || typeof assignment === 'undefined' || assignment === '') {
            return 'Not Assigned';
        }

        if (typeof assignment === 'number' || (typeof assignment === 'string' && /^\d+$/.test(assignment))) {
            return 'Button ' + assignment;
        }

        if (typeof assignment === 'string' && /^[+-]\d+$/.test(assignment)) {
            var sign = assignment.charAt(0);
            return 'Axis ' + assignment.substring(1) + sign;
        }

        return assignment;
    };

    var Constructor = (function() {

    })();
});
