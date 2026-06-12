var cesSlidersControls = (function(_config, $li, $panel) {

    var _self = this;
    var _inputAssignmentMap = {};
    var _activeGamepadMappings = [];
    var _activeInputDisplayMode = 'keyboard';
    var _gamePad = null;
    var _gameKey = null;
    var _notAssignedLabel = 'Not assigned';
    var _manualCalloutLineObserver = null;
    var _manualCalloutLineVisibilityObserver = null;
    var _manualCalloutLineResizeObserver = null;
    var _manualCalloutLineRefreshTimer = null;
    var _manualCalloutLineRefreshSequenceTimers = [];
    var _gamepadConnectionStateUnsubscribe = null;
    var _manualInputBadgeSelector = '.controls-manual-input-badge';
    var _manualInputBadgeKeyboardClass = 'controls-manual-input-badge-keyboard';
    var _manualInputBadgeGamepadClass = 'controls-manual-input-badge-gamepad';

    var _retroarchInputNames = {
        up_axis: 'input_player1_up',
        down_axis: 'input_player1_down',
        left_axis: 'input_player1_left',
        right_axis: 'input_player1_right',
        a_btn: 'input_player1_a',
        b_btn: 'input_player1_b',
        x_btn: 'input_player1_x',
        y_btn: 'input_player1_y',
        start_btn: 'input_player1_start',
        select_btn: 'input_player1_select',
        l_btn: 'input_player1_l',
        r_btn: 'input_player1_r',
        l2_btn: 'input_player1_l2',
        r2_btn: 'input_player1_r2',
        l3_btn: 'input_player1_l3',
        r3_btn: 'input_player1_r3'
    };

    var _keyboardDefaults = {
        up_axis: 'up',
        down_axis: 'down',
        left_axis: 'left',
        right_axis: 'right',
        a_btn: 'x',
        b_btn: 'z',
        x_btn: 's',
        y_btn: 'a',
        start_btn: 'enter',
        select_btn: 'shift',
        l_btn: 'q',
        r_btn: 'w'
    };

    var _commandDefinitions = [
        {
            label: 'Rewind',
            retroarchKey: 'input_rewind',
            defaultKey: 'r',
            hold: true,
            always: true
        },
        {
            label: 'Save Progress',
            retroarchKey: 'input_save_state',
            defaultKey: 'num1',
            always: true
        },
        {
            label: 'Load Last Progress',
            retroarchKey: 'input_load_state',
            defaultKey: 'num4',
            always: true
        },
        {
            label: 'Fast Forward',
            retroarchKey: 'input_hold_fast_forward',
            defaultKey: 'space',
            hold: true,
            always: true
        },
        {
            label: 'Take Screenshot',
            retroarchKey: 'input_screenshot',
            defaultKey: 't',
            always: true
        },
        {
            label: 'Reset System',
            retroarchKey: 'input_reset',
            defaultKey: 'h',
            always: true
        },
        {
            label: 'Pause',
            retroarchKey: 'input_pause_toggle',
            defaultKey: 'p',
            always: true
        },
        {
            label: 'Mute Audio',
            retroarchKey: 'input_audio_mute'
        },
        {
            label: 'Exit Game',
            retroarchKey: 'input_exit_emulator'
        },
        {
            label: 'State Slot -',
            retroarchKey: 'input_state_slot_decrease'
        },
        {
            label: 'State Slot +',
            retroarchKey: 'input_state_slot_increase'
        },
        {
            label: 'Shader Previous',
            retroarchKey: 'input_shader_prev'
        },
        {
            label: 'Shader Next',
            retroarchKey: 'input_shader_next'
        },
        {
            label: 'RetroArch Menu',
            retroarchKey: 'input_menu_toggle'
        },
        {
            label: 'Fullscreen',
            retroarchKey: 'input_toggle_fullscreen'
        }
    ];

    this.Activate = function(gameKey, GamePad) {

        UnbindGamepadConnectionStateListener();
        DestroyManualInputBadgeTooltip();
        TeardownManualCalloutLines();

        _gameKey = gameKey || {};
        _gamePad = GamePad || null;
        _inputAssignmentMap = GetInputAssignmentMap(_gameKey.system);
        _activeGamepadMappings = GetActiveGamepadMappings();
        _activeInputDisplayMode = GetActiveInputDisplayMode();

        $panel.empty();

        var diagram = GetControllerDiagram(_gameKey.system);

        if (ShouldUseInstructionManual(diagram)) {
            RenderInstructionManual(diagram);
        }
        else {
            RenderGenericControls();
        }

        BindGamepadConnectionStateListener();
        UpdateManualInputBadge();
    };

    this.Deactivate = function() {
        UnbindGamepadConnectionStateListener();
        DestroyManualInputBadgeTooltip();
        TeardownManualCalloutLines();

        $panel.empty();
        _gamePad = null;
        _gameKey = null;
        _inputAssignmentMap = {};
        _activeGamepadMappings = [];
        _activeInputDisplayMode = 'keyboard';
    };

    this.OnOpen = function(callback) {

        callback(true);
        ScheduleManualCalloutLineRefreshPasses();
    };

    this.OnOpened = function() {

        ScheduleManualCalloutLineRefreshPasses();
    };

    this.OnClose = function(callback) {

        CloseManualInputBadgeTooltip();
        callback(true);
    };

    var GetControllerDiagram = function(system) {

        var systemDetails = GetSystemDetails(system);
        var diagram;
        var normalized;

        if (!systemDetails || !systemDetails.controllerDiagram) {
            return null;
        }

        diagram = systemDetails.controllerDiagram;
        normalized = NormalizeControllerDiagram(diagram);

        if (!normalized.callouts.length) {
            return null;
        }

        return normalized;
    };

    var ShouldUseInstructionManual = function(diagram) {
        return !!(diagram && diagram.callouts && diagram.callouts.length);
    };

    var NormalizeControllerDiagram = function(diagram) {

        var normalized = {};
        var callouts = diagram.callouts || [];
        var i;
        var callout;

        MergeObject(normalized, diagram);
        normalized.callouts = [];
        normalized.title = normalized.title || (GetSystemName() + ' Controls');
        normalized.subtitle = normalized.subtitle || 'Current keyboard and gamepad assignments';
        normalized.image = normalized.image || normalized.imagePath || BuildLegacyControllerImagePath(_gameKey.system);

        for (i = 0; i < callouts.length; i++) {
            callout = NormalizeCallout(callouts[i]);

            if (callout) {
                normalized.callouts.push(callout);
            }
        }

        return normalized;
    };

    var NormalizeCallout = function(callout) {

        var normalized;
        var inputs;
        var input;

        if (!callout) {
            return null;
        }

        inputs = NormalizeCalloutInputs(callout.inputs);
        input = callout.input || null;

        if (!input && !inputs.length) {
            return null;
        }

        normalized = {
            id: callout.id || input || BuildGroupedCalloutId(inputs, callout.label),
            input: input,
            label: callout.label || (input ? GetMappingLabel(input) : 'Grouped Controls'),
            x: ReadCoordinate(callout.x, callout.position && callout.position.x, 50),
            y: ReadCoordinate(callout.y, callout.position && callout.position.y, 50),
            lineX: ReadCoordinate(callout.lineX, callout.line && callout.line.x, callout.x, callout.position && callout.position.x, 50),
            lineY: ReadCoordinate(callout.lineY, callout.line && callout.line.y, callout.y, callout.position && callout.position.y, 50),
            targetX: ReadCoordinate(callout.targetX, callout.target && callout.target.x, 50),
            targetY: ReadCoordinate(callout.targetY, callout.target && callout.target.y, 50),
            detailsPlacement: callout.detailsPlacement || callout.placement || 'bottom',
            inputs: inputs
        };

        return normalized;
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

    var FormatCalloutCoordinate = function(value) {

        value = parseFloat(value);

        if (isNaN(value)) {
            return '50';
        }

        return String(Math.round(value * 1000) / 1000);
    };

    var ScheduleManualCalloutLineRefresh = function(delay) {

        delay = parseInt(delay, 10);

        if (isNaN(delay) || delay < 0) {
            delay = 0;
        }

        if (_manualCalloutLineRefreshTimer) {
            window.clearTimeout(_manualCalloutLineRefreshTimer);
        }

        _manualCalloutLineRefreshTimer = window.setTimeout(function() {
            _manualCalloutLineRefreshTimer = null;
            RefreshManualCalloutLines();
        }, delay);
    };

    var QueueManualCalloutLineRefresh = function(delay) {

        var timer;

        delay = parseInt(delay, 10);

        if (isNaN(delay) || delay < 0) {
            delay = 0;
        }

        timer = window.setTimeout(function() {
            var index = _manualCalloutLineRefreshSequenceTimers.indexOf(timer);

            if (index !== -1) {
                _manualCalloutLineRefreshSequenceTimers.splice(index, 1);
            }

            RefreshManualCalloutLines();
        }, delay);

        _manualCalloutLineRefreshSequenceTimers.push(timer);
    };

    var ClearManualCalloutLineRefreshPasses = function() {

        var timer;

        while (_manualCalloutLineRefreshSequenceTimers.length) {
            timer = _manualCalloutLineRefreshSequenceTimers.pop();
            window.clearTimeout(timer);
        }
    };

    var ScheduleManualCalloutLineRefreshPasses = function() {

        ClearManualCalloutLineRefreshPasses();

        QueueManualCalloutLineRefresh(0);
        QueueManualCalloutLineRefresh(60);
        QueueManualCalloutLineRefresh(160);
        QueueManualCalloutLineRefresh(320);
        QueueManualCalloutLineRefresh(650);
    };

    var BindManualCalloutLines = function($lineLayer) {

        var diagramNode;

        TeardownManualCalloutLines();

        if (!$lineLayer || !$lineLayer.length) {
            return;
        }

        diagramNode = $lineLayer.closest('.controls-manual-diagram')[0];

        if (window.MutationObserver) {
            _manualCalloutLineObserver = new window.MutationObserver(function(mutations) {

                var shouldRefresh = false;
                var i;

                for (i = 0; i < mutations.length; i++) {
                    if (mutations[i].type === 'attributes') {
                        shouldRefresh = true;
                        break;
                    }
                }

                if (shouldRefresh) {
                    ScheduleManualCalloutLineRefresh();
                }
            });

            _manualCalloutLineObserver.observe($lineLayer[0], {
                attributes: true,
                attributeFilter: [
                    'data-line-x',
                    'data-line-y',
                    'data-target-x',
                    'data-target-y'
                ],
                subtree: true
            });

            _manualCalloutLineVisibilityObserver = new window.MutationObserver(function() {
                ScheduleManualCalloutLineRefresh(80);
            });

            if ($panel && $panel.length) {
                _manualCalloutLineVisibilityObserver.observe($panel[0], {
                    attributes: true,
                    attributeFilter: [
                        'class',
                        'style'
                    ]
                });
            }

            if (diagramNode) {
                _manualCalloutLineVisibilityObserver.observe(diagramNode, {
                    attributes: true,
                    attributeFilter: [
                        'class',
                        'style'
                    ]
                });
            }
        }

        if (window.ResizeObserver) {
            _manualCalloutLineResizeObserver = new window.ResizeObserver(function() {
                ScheduleManualCalloutLineRefresh(40);
            });

            _manualCalloutLineResizeObserver.observe($lineLayer[0]);

            if (diagramNode) {
                _manualCalloutLineResizeObserver.observe(diagramNode);
            }

            if ($panel && $panel.length) {
                _manualCalloutLineResizeObserver.observe($panel[0]);
            }
        }

        $(window).off('resize.controlsManualCalloutLines');
        $(window).on('resize.controlsManualCalloutLines', function() {
            ScheduleManualCalloutLineRefresh(40);
        });

        window.cesRefreshControlsManualCalloutLines = function() {
            RefreshManualCalloutLines();
        };
    };

    var TeardownManualCalloutLines = function() {

        if (_manualCalloutLineObserver) {
            _manualCalloutLineObserver.disconnect();
            _manualCalloutLineObserver = null;
        }

        if (_manualCalloutLineVisibilityObserver) {
            _manualCalloutLineVisibilityObserver.disconnect();
            _manualCalloutLineVisibilityObserver = null;
        }

        if (_manualCalloutLineResizeObserver) {
            _manualCalloutLineResizeObserver.disconnect();
            _manualCalloutLineResizeObserver = null;
        }

        if (_manualCalloutLineRefreshTimer) {
            window.clearTimeout(_manualCalloutLineRefreshTimer);
            _manualCalloutLineRefreshTimer = null;
        }

        ClearManualCalloutLineRefreshPasses();

        $(window).off('resize.controlsManualCalloutLines');
    };

    var RenderInstructionManual = function(diagram) {

        var systemName = GetSystemName();
        var systemClass = GetSystemClassSuffix(_gameKey.system);
        var $layout = $('<div />').addClass('controls-manual controls-manual-' + systemClass);
        var $main = $('<div />').addClass('controls-manual-main controls-manual-main-' + systemClass);
        var $header = BuildHeader(diagram.title || (systemName + ' Controls'), diagram.subtitle, diagram.badge);
        var $diagram = $('<div />').addClass('controls-manual-diagram controls-manual-diagram-' + systemClass);
        var $lineLayer = $('<div />')
            .addClass('controls-callout-lines')
            .attr('aria-hidden', 'true');
        var $image = $('<img />')
            .addClass('controller controls-controller-photo controls-controller-photo-' + systemClass + ' close')
            .attr('src', diagram.image)
            .attr('alt', diagram.imageAlt || (systemName + ' controller'));

        $image.on('load', function() {
            $(this).removeClass('close');
            ScheduleManualCalloutLineRefresh(40);
        });

        $image.on('error', function() {
            var fallback = BuildLegacyControllerImagePath(_gameKey.system);
            if (fallback && $(this).attr('src') !== fallback) {
                $(this).attr('src', fallback);
            }
        });

        $diagram.append($lineLayer);
        $lineLayer.append(BuildManualCoordinateGuides());
        $diagram.append($image);

        for (var i = 0; i < diagram.callouts.length; i++) {
            var callout = diagram.callouts[i];
            $diagram.append(BuildCallout(callout));
            $lineLayer.append(BuildCalloutLine(callout));
        }

        $main.append($header);
        $main.append($diagram);

        $layout.append($main);
        $layout.append(BuildCommandPanel());

        $panel.append($layout);

        BindManualCalloutLines($lineLayer);
        ScheduleManualCalloutLineRefreshPasses();
    };

    var RenderGenericControls = function() {

        var systemName = GetSystemName();
        var systemClass = GetSystemClassSuffix(_gameKey.system);
        var $layout = $('<div />').addClass('controls-manual controls-manual-generic controls-manual-generic-' + systemClass);
        var $main = $('<div />').addClass('controls-manual-main controls-manual-main-' + systemClass);
        var $body = $('<div />').addClass('controls-generic-body controls-generic-body-' + systemClass);
        var $mappingCard = $('<div />').addClass('controls-generic-mappings-card controls-generic-mappings-card-' + systemClass);
        var $mappingTitle = $('<h4 />').text('Controller');
        var $mappings = $('<ul />').addClass('controls-generic-mappings controls-generic-mappings-' + systemClass);
        var $imageCard = $('<div />').addClass('controls-generic-image-card controls-generic-image-card-' + systemClass);
        var $image = $('<img />')
            .addClass('controller controls-generic-controller controls-generic-controller-' + systemClass + ' close')
            .attr('src', BuildLegacyControllerImagePath(_gameKey.system))
            .attr('alt', systemName + ' controller reference');

        $image.on('load', function() {
            $(this).removeClass('close');
        });

        $imageCard.append($image);
        $mappingCard.append($mappingTitle);

        for (var inputName in _inputAssignmentMap) {
            if (!_inputAssignmentMap.hasOwnProperty(inputName)) {
                continue;
            }

            $mappings.append(BuildGenericMapping(inputName, _inputAssignmentMap[inputName]));
        }

        if (!$mappings.children().length) {
            $mappings.append($('<li />').addClass('controls-generic-empty').text('No controller mapping is available for this system.'));
        }

        $mappingCard.append($mappings);
        $body.append($imageCard);
        $body.append($mappingCard);

        $main.append(BuildHeader(systemName + ' Controls', 'Current controller reference', null));
        $main.append($body);

        $layout.append($main);
        $layout.append(BuildCommandPanel());

        $panel.append($layout);
    };

    var BuildHeader = function(title, subtitle, badge) {

        var $header = $('<div />').addClass('controls-manual-header');
        var $titleGroup = $('<div />').addClass('controls-manual-titlegroup');
        var $title = $('<h3 />').text(title || 'Controls');
        var $subtitle = $('<p />').text(subtitle || 'Current keyboard and gamepad assignments');

        $titleGroup.append($title);
        // $titleGroup.append($subtitle);
        $header.append($titleGroup);

        var $badges = $('<div />').addClass('controls-manual-badges');

        $badges.append(BuildManualInputBadge());

        if (badge) {
            // $badges.append($('<div />').addClass('controls-manual-badge').text(badge));
        }

        $header.append($badges);

        return $header;
    };

    var BuildManualInputBadge = function() {

        var $badge = $('<div />')
            .addClass('controls-manual-input-badge ' + _manualInputBadgeKeyboardClass)
            .attr({
                'role': 'note',
                'aria-label': 'Warning: current input mode is keyboard. CrazyErics.com is best used with a gamepad.'
            });

        $badge.append($('<span />')
            .addClass('controls-manual-input-badge-text')
            .text('KEYBOARD INPUT ACTIVE'));

        InitializeManualInputBadgeTooltip($badge, {
            gamepadInputActive: false,
            gamepadConnected: false
        });

        return $badge;
    };

    var GetManualInputBadge = function() {

        if (!$panel || !$panel.length) {
            return $();
        }

        return $panel.find(_manualInputBadgeSelector).first();
    };

    var BuildManualInputBadgeTooltipContent = function(inputState) {

        var tooltipClass = 'controls-manual-input-tooltip-keyboard';
        var message = 'Crazyerics.com goes best with a gamepad. Connect a Bluetooth or USB gamepad, tap any button, and when the gamepad icon next to the search bar turns green, your gamepad will be ready to use.';

        if (inputState && inputState.gamepadConnected && !inputState.gamepadInputActive) {
            tooltipClass = 'controls-manual-input-tooltip-gamepad-connected';
            message = 'Gamepad connected and detected, but it is not active for this game. Configure your gamepad for this system to use it.';
        }

        return '<div class="controls-manual-input-tooltip ' + tooltipClass + '">' +
            '<p>' + message + '</p>' +
            '<div class="controls-manual-input-tooltip-media"></div>' +
            '</div>';
    };

    var InitializeManualInputBadgeTooltip = function($badge, inputState) {

        if (!$badge || !$badge.length || !$.fn.tooltipster) {
            return;
        }

        inputState = inputState || {};

        if (inputState.gamepadInputActive) {
            DestroyManualInputBadgeTooltip($badge);
            return;
        }

        if ($badge.hasClass('tooltipstered')) {
            $badge.tooltipster('content', BuildManualInputBadgeTooltipContent(inputState));
            return;
        }

        $badge.tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            trigger: 'hover',
            delay: [500, 200],
            animationDuration: [200, 300],
            interactive: true,
            contentAsHTML: true,
            content: BuildManualInputBadgeTooltipContent(inputState)
        });
    };

    var BindGamepadConnectionStateListener = function() {

        UnbindGamepadConnectionStateListener();

        if (!_gamePad || typeof _gamePad.SubscribeConnectionState !== 'function') {
            return;
        }

        _gamepadConnectionStateUnsubscribe = _gamePad.SubscribeConnectionState(_self, function(state) {
            UpdateManualInputBadge(state);
        });
    };

    var UnbindGamepadConnectionStateListener = function() {

        if (_gamepadConnectionStateUnsubscribe) {
            _gamepadConnectionStateUnsubscribe();
            _gamepadConnectionStateUnsubscribe = null;
        }
    };

    var UpdateManualInputBadge = function(state) {

        var $badge = GetManualInputBadge();
        var inputState = GetManualInputState(state);
        var label = inputState.gamepadInputActive ? 'GAMEPAD INPUT ACTIVE' : 'KEYBOARD INPUT ACTIVE';
        var ariaLabel = GetManualInputBadgeAriaLabel(inputState);

        if (!$badge.length) {
            return;
        }

        $badge
            .removeClass(_manualInputBadgeKeyboardClass + ' ' + _manualInputBadgeGamepadClass)
            .addClass(inputState.gamepadInputActive ? _manualInputBadgeGamepadClass : _manualInputBadgeKeyboardClass)
            .attr('aria-label', ariaLabel);

        $badge.find('.controls-manual-input-badge-text').text(label);
        InitializeManualInputBadgeTooltip($badge, inputState);
    };

    var GetManualInputState = function(state) {

        // A connected gamepad is only the active input for this launch when configured mappings were applied.
        var gamepadConnected = IsGamepadConnected(state);
        var hasConfiguredGamepadMappings = !!(_activeGamepadMappings && _activeGamepadMappings.length);

        return {
            gamepadConnected: gamepadConnected,
            hasConfiguredGamepadMappings: hasConfiguredGamepadMappings,
            gamepadInputActive: gamepadConnected && hasConfiguredGamepadMappings
        };
    };

    var GetManualInputBadgeAriaLabel = function(inputState) {

        if (inputState.gamepadInputActive) {
            return 'Current input mode: gamepad.';
        }

        if (inputState.gamepadConnected) {
            return 'Warning: current input mode is keyboard. A gamepad is connected, but it is not configured for this system.';
        }

        return 'Warning: current input mode is keyboard. Crazyerics.com goes best with a gamepad.';
    };

    var IsGamepadConnected = function(state) {

        var details;

        if (state && typeof state.connected !== 'undefined') {
            return !!state.connected;
        }

        if (!_gamePad) {
            return false;
        }

        if (typeof _gamePad.GetConnectionState === 'function') {
            try {
                return !!_gamePad.GetConnectionState().connected;
            }
            catch (ignoreConnectionStateError) {
            }
        }

        if (typeof _gamePad.HasConnectedGamepad === 'function') {
            try {
                return !!_gamePad.HasConnectedGamepad();
            }
            catch (ignoreHasConnectedGamepadError) {
            }
        }

        if (typeof _gamePad.GetGamePadDetails === 'function') {
            try {
                details = _gamePad.GetGamePadDetails();
                return !!(details && !$.isEmptyObject(details));
            }
            catch (ignoreGamepadDetailsError) {
            }
        }

        return false;
    };

    var CloseManualInputBadgeTooltip = function($badge) {

        $badge = $badge && $badge.length ? $badge : GetManualInputBadge();

        if (!$badge.length || !$.fn.tooltipster || !$badge.hasClass('tooltipstered')) {
            return;
        }

        try {
            $badge.tooltipster('close');
        }
        catch (ignoreTooltipCloseError) {
        }
    };

    var DestroyManualInputBadgeTooltip = function($badge) {

        $badge = $badge && $badge.length ? $badge : GetManualInputBadge();

        if (!$badge.length || !$.fn.tooltipster || !$badge.hasClass('tooltipstered')) {
            return;
        }

        CloseManualInputBadgeTooltip($badge);

        try {
            $badge.tooltipster('destroy');
        }
        catch (ignoreTooltipDestroyError) {
        }
    };

    var BuildCallout = function(callout) {

        var isGroup = IsGroupedCallout(callout);
        var calloutClass = GetCalloutClassName(callout);
        var assignment = isGroup ? null : GetInputAssignments(callout.input, _activeInputDisplayMode);
        var $callout = $('<div />')
            .addClass('controls-callout controls-callout-' + calloutClass)
            .css({
                left: callout.x + '%',
                top: callout.y + '%'
            });

        var $action = $('<div />').addClass('controls-callout-action').text(callout.label || GetMappingLabel(callout.input));
        var $assignment = $('<div />').addClass('controls-callout-assignment');

        if (isGroup) {
            $callout
                .addClass('controls-callout-group')
                .attr({
                    tabindex: '0',
                    role: 'group',
                    title: callout.label || 'Grouped controls',
                    'aria-label': BuildGroupedCalloutAriaLabel(callout)
                });

            AppendGroupedAssignmentSummary($assignment, callout);
        }
        else {
            AppendAssignmentChips($assignment, assignment);
        }

        $callout.append($action);
        $callout.append($assignment);

        if (isGroup) {
            $callout.append(BuildCalloutGroupDetails(callout));
        }

        return $callout;
    };

    var BuildCalloutGroupDetails = function(callout) {

        var placement = GetCalloutGroupDetailsPlacement(callout.detailsPlacement);
        var $details = $('<div />')
            .addClass('controls-callout-group-details controls-callout-group-details-' + placement)
            .attr('aria-hidden', 'true');

        $details.append($('<div />')
            .addClass('controls-callout-group-title')
            .text((callout.label || 'Grouped controls') + ' assignments'));

        for (var i = 0; i < callout.inputs.length; i++) {
            $details.append(BuildCalloutGroupDetailRow(callout.inputs[i]));
        }

        return $details;
    };

    var BuildCalloutGroupDetailRow = function(input) {

        var $row = $('<div />').addClass('controls-callout-group-item controls-callout-group-item-' + GetSystemClassSuffix(input.input));
        var $action = $('<span />').addClass('controls-callout-group-action').text(input.label || GetMappingLabel(input.input));
        var $assignment = $('<span />').addClass('controls-callout-group-assignment');

        AppendAssignmentChips($assignment, GetInputAssignments(input.input, _activeInputDisplayMode));

        $row.append($action);
        $row.append($assignment);

        return $row;
    };

    var AppendGroupedAssignmentSummary = function($assignment, callout) {

        var label = callout.inputs.length === 1 ? '1 key' : (callout.inputs.length + ' keys');

        $assignment
            .addClass('controls-callout-assignment-summary')
            .append(BuildAssignmentChip('Group', label, 'group-summary'));
    };

    var BuildGroupedCalloutAriaLabel = function(callout) {

        var parts = [callout.label || 'Grouped controls'];

        for (var i = 0; i < callout.inputs.length; i++) {
            parts.push((callout.inputs[i].label || GetMappingLabel(callout.inputs[i].input)) + ': ' + GetInputAssignmentText(callout.inputs[i].input));
        }

        return parts.join('. ');
    };

    var GetInputAssignmentText = function(inputName) {

        var assignment = GetInputAssignments(inputName, _activeInputDisplayMode);
        var labels = [];

        if (assignment.keyboard) {
            labels.push('Key ' + assignment.keyboard);
        }

        for (var i = 0; i < assignment.gamepads.length; i++) {
            labels.push('Pad ' + assignment.gamepads[i].player + ' ' + assignment.gamepads[i].label);
        }

        return labels.length ? labels.join(', ') : _notAssignedLabel;
    };

    var IsGroupedCallout = function(callout) {

        return !!(callout && callout.inputs && callout.inputs.length);
    };

    var GetCalloutClassName = function(callout) {

        return GetSystemClassSuffix(callout && (callout.input || callout.id || callout.label));
    };

    var GetCalloutGroupDetailsPlacement = function(placement) {

        placement = String(placement || 'bottom').toLowerCase();

        if (placement === 'top' || placement === 'left' || placement === 'right') {
            return placement;
        }

        return 'bottom';
    };

    var BuildCalloutLine = function(callout) {

        var startX = ReadCoordinate(callout.lineX, callout.x, callout.targetX);
        var startY = ReadCoordinate(callout.lineY, callout.y, callout.targetY);
        var targetX = ReadCoordinate(callout.targetX, callout.lineX, callout.x);
        var targetY = ReadCoordinate(callout.targetY, callout.lineY, callout.y);
        var inputClass = GetCalloutClassName(callout);
        var inputName = callout.input || callout.id || callout.label;
        var $connector = $('<div />')
            .addClass('controls-callout-connector controls-callout-connector-' + inputClass)
            .attr({
                'data-input': inputName,
                'data-label': callout.label || (callout.input ? GetMappingLabel(callout.input) : 'Grouped controls'),
                'data-line-x': FormatCalloutCoordinate(startX),
                'data-line-y': FormatCalloutCoordinate(startY),
                'data-target-x': FormatCalloutCoordinate(targetX),
                'data-target-y': FormatCalloutCoordinate(targetY)
            });

        $connector.append($('<div />').addClass('controls-manual-callout-line'));
        $connector.append($('<div />').addClass('controls-manual-callout-target'));

        return $connector;
    };

    var BuildManualCoordinateGuides = function() {
        var corners = [
            {
                className: 'top-left',
                x: 0,
                y: 0,
                label: '0,0'
            },
            {
                className: 'top-right',
                x: 100,
                y: 0,
                label: '100,0'
            },
            {
                className: 'bottom-left',
                x: 0,
                y: 100,
                label: '0,100'
            },
            {
                className: 'bottom-right',
                x: 100,
                y: 100,
                label: '100,100'
            }
        ];

        var $guides = $('<div />')
            .addClass('controls-manual-coordinate-guides')
            .attr('aria-hidden', 'true');

        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];

            var $guide = $('<div />')
                .addClass('controls-manual-coordinate-guide controls-manual-coordinate-guide-' + corner.className)
                .attr({
                    'data-guide-x': corner.x,
                    'data-guide-y': corner.y,
                    'data-guide-label': corner.label
                })
                .css({
                    left: corner.x + '%',
                    top: corner.y + '%'
                });

            $guide.append(
                $('<span />')
                    .addClass('controls-manual-coordinate-guide-label')
                    .text(corner.label)
            );

            $guides.append($guide);
        }

        return $guides;
    };

    var RefreshManualCalloutLines = function() {

        var refreshed = false;

        $panel.find('.controls-callout-connector').each(function() {
            if (RefreshManualCalloutLine($(this))) {
                refreshed = true;
            }
        });

        return refreshed;
    };

    var RefreshManualCalloutLine = function($connector) {

        var $layer = $connector.parent();
        var $line = $connector.find('.controls-manual-callout-line');
        var $target = $connector.find('.controls-manual-callout-target');
        var layerWidth = $layer.width();
        var layerHeight = $layer.height();
        var startX;
        var startY;
        var targetX;
        var targetY;
        var startLeft;
        var startTop;
        var targetLeft;
        var targetTop;
        var deltaX;
        var deltaY;
        var length;
        var angle;
        var transform;

        if (!layerWidth || !layerHeight) {
            $connector.removeClass('controls-callout-connector-ready');
            return false;
        }

        startX = ReadCoordinate($connector.attr('data-line-x'), 50);
        startY = ReadCoordinate($connector.attr('data-line-y'), 50);
        targetX = ReadCoordinate($connector.attr('data-target-x'), 50);
        targetY = ReadCoordinate($connector.attr('data-target-y'), 50);

        startLeft = (startX / 100) * layerWidth;
        startTop = (startY / 100) * layerHeight;
        targetLeft = (targetX / 100) * layerWidth;
        targetTop = (targetY / 100) * layerHeight;
        deltaX = targetLeft - startLeft;
        deltaY = targetTop - startTop;
        length = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
        angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        transform = 'translateY(-50%) rotate(' + angle + 'deg)';

        $line.css({
            left: startLeft + 'px',
            top: startTop + 'px',
            width: length + 'px',
            '-webkit-transform': transform,
            '-moz-transform': transform,
            '-o-transform': transform,
            '-ms-transform': transform,
            transform: transform
        });

        $target.css({
            left: targetLeft + 'px',
            top: targetTop + 'px'
        });

        $connector.addClass('controls-callout-connector-ready');

        return true;
    };

    var BuildGenericMapping = function(inputName, fallbackLabel) {

        var assignment = GetInputAssignments(inputName);
        var $item = $('<li />');
        var $label = $('<span />').addClass('controls-generic-action').text(fallbackLabel || GetMappingLabel(inputName));
        var $assignment = $('<span />').addClass('controls-generic-assignment');

        AppendAssignmentChips($assignment, assignment);

        $item.append($label);
        $item.append($assignment);

        return $item;
    };

    var BuildCommandPanel = function() {
        var visibleCommandLabels = [
            'Rewind',
            'Save Progress',
            'Load Last Progress',
            'Fast Forward',
            'Take Screenshot',
            'Reset System',
            'Pause',
            'Mute Audio',
            'Exit Game'
        ];

        var $panel = $('<aside />').addClass('controls-extra-panel');
        var $title = $('<h4 />').text('System Commands');
        var $intro = $('<p />').text('System shortcuts that are separate from the original controller.');
        var $list = $('<ul />');
        var commands = GetCommandAssignments();

        for (var i = 0; i < commands.length; i++) {
            var command = commands[i];

            if (visibleCommandLabels.indexOf(command.label) === -1) {
                continue;
            }

            var $item = $('<li />');
            var $name = $('<span />').addClass('controls-command-name').text(command.label);
            var $key = $('<span />').addClass('controls-command-key').text(command.assignment);

            $item.append($name);
            $item.append($key);
            $list.append($item);
        }

        $panel.append($title);
        // $panel.append($intro);
        $panel.append($list);

        return $panel;
    };

    var AppendAssignmentChips = function($container, assignment) {

        var hasAssignment = false;

        if (assignment.keyboard) {
            $container.append(BuildAssignmentChip('Key', assignment.keyboard, 'keyboard'));
            hasAssignment = true;
        }

        for (var i = 0; i < assignment.gamepads.length; i++) {
            var gamepad = assignment.gamepads[i];
            $container.append(BuildAssignmentChip('Pad ' + gamepad.player, gamepad.label, 'gamepad'));
            hasAssignment = true;
        }

        if (!hasAssignment) {
            $container.append($('<span />').addClass('controls-assignment-missing').text(_notAssignedLabel));
        }
    };

    var BuildAssignmentChip = function(source, value, type) {

        var $chip = $('<span />').addClass('controls-assignment-chip controls-assignment-' + type);
        var $source = $('<span />').addClass('controls-assignment-source').text(source);
        var $value = $('<strong />').text(value);

        $chip.append($source);
        $chip.append($value);

        return $chip;
    };

    var GetInputAssignments = function(inputName, displayMode) {

        displayMode = displayMode || 'all';

        if (displayMode === 'gamepad') {
            return {
                keyboard: null,
                gamepads: GetGamepadAssignments(inputName)
            };
        }

        if (displayMode === 'keyboard') {
            return {
                keyboard: GetKeyboardAssignment(inputName),
                gamepads: []
            };
        }

        return {
            keyboard: GetKeyboardAssignment(inputName),
            gamepads: GetGamepadAssignments(inputName)
        };
    };

    var GetActiveInputDisplayMode = function() {

        if (_activeGamepadMappings && _activeGamepadMappings.length) {
            return 'gamepad';
        }

        return 'keyboard';
    };

    var GetKeyboardAssignment = function(inputName) {

        var retroarchKey = _retroarchInputNames[inputName];
        var effectiveRetroArchConfig = BuildEffectiveRetroArchConfig();
        var rawAssignment = null;

        if (retroarchKey && effectiveRetroArchConfig.hasOwnProperty(retroarchKey)) {
            rawAssignment = effectiveRetroArchConfig[retroarchKey];
        }

        if (IsMissingAssignment(rawAssignment)) {
            rawAssignment = GetInputConfigAssignment(retroarchKey);
        }

        if (IsMissingAssignment(rawAssignment) && _keyboardDefaults.hasOwnProperty(inputName)) {
            rawAssignment = _keyboardDefaults[inputName];
        }

        return FormatKeyboardKey(rawAssignment);
    };

    var GetInputConfigAssignment = function(retroarchKey) {

        if (!retroarchKey || !_config.input || !_config.input['1']) {
            return null;
        }

        if (_config.input['1'].hasOwnProperty(retroarchKey)) {
            return _config.input['1'][retroarchKey];
        }

        return null;
    };

    var GetGamepadAssignments = function(inputName) {

        var assignments = [];
        var mappings = _activeGamepadMappings || [];

        for (var i = 0; i < mappings.length; i++) {
            var mappingRecord = mappings[i] || {};
            var mapping = mappingRecord.inputconfig || mappingRecord;
            var assignment = FindGamepadAssignment(mapping, inputName);
            var label = FormatGamepadAssignment(assignment);

            if (!label) {
                continue;
            }

            assignments.push({
                player: i + 1,
                label: label
            });
        }

        return assignments;
    };

    var GetActiveGamepadMappings = function() {

        if (!_gamePad || typeof _gamePad.GetConfiguredGamepadInput !== 'function') {
            return [];
        }

        try {
            return _gamePad.GetConfiguredGamepadInput(_gameKey, {
                includeMetadata: true
            }) || [];
        }
        catch (e) {
            return [];
        }
    };

    var FindGamepadAssignment = function(mapping, inputName) {

        var inputBaseName;
        var oppositeTypeName;

        if (!mapping || !inputName) {
            return null;
        }

        if (mapping.hasOwnProperty(inputName)) {
            return mapping[inputName];
        }

        inputBaseName = String(inputName).replace(/_(btn|axis)$/, '');
        oppositeTypeName = inputBaseName + (inputName.match(/_btn$/) ? '_axis' : '_btn');

        if (mapping.hasOwnProperty(oppositeTypeName)) {
            return mapping[oppositeTypeName];
        }

        return null;
    };

    var FormatGamepadAssignment = function(assignment) {

        if (assignment === null || typeof assignment === 'undefined' || assignment === '') {
            return null;
        }

        if (typeof assignment === 'number' || (typeof assignment === 'string' && /^\d+$/.test(assignment))) {
            return 'Button ' + assignment;
        }

        if (typeof assignment === 'string' && /^[+-]\d+$/.test(assignment)) {
            return 'Axis ' + assignment.substring(1) + assignment.charAt(0);
        }

        if (typeof assignment === 'string' && /^h\d+(up|down|left|right)$/i.test(assignment)) {
            return 'Hat ' + assignment.replace(/^h/i, '');
        }

        return String(assignment);
    };

    var GetCommandAssignments = function() {

        var commands = [];
        var effectiveRetroArchConfig = BuildEffectiveRetroArchConfig();

        for (var i = 0; i < _commandDefinitions.length; i++) {
            var definition = _commandDefinitions[i];
            var rawAssignment = null;
            var formatted;

            if (definition.retroarchKey && effectiveRetroArchConfig.hasOwnProperty(definition.retroarchKey)) {
                rawAssignment = effectiveRetroArchConfig[definition.retroarchKey];
            }

            if (IsMissingAssignment(rawAssignment)) {
                rawAssignment = definition.defaultKey || null;
            }

            formatted = FormatKeyboardKey(rawAssignment);

            if (!formatted) {
                if (definition.always) {
                    formatted = _notAssignedLabel;
                }
                else {
                    continue;
                }
            }

            if (definition.hold && formatted !== _notAssignedLabel) {
                formatted = 'Hold ' + formatted;
            }

            commands.push({
                label: definition.label,
                assignment: formatted
            });
        }

        return commands;
    };

    var BuildEffectiveRetroArchConfig = function() {

        var result = {};
        var systemDetails = GetSystemDetails(_gameKey.system) || {};
        var extension = systemDetails.emuextention || '1.6.9-stable';

        MergeRetroArchConfig(result, '1.6.9-stable');

        if (extension !== '1.6.9-stable') {
            MergeRetroArchConfig(result, extension);
        }

        if (systemDetails.retroarch) {
            MergeObject(result, systemDetails.retroarch);
        }

        return result;
    };

    var MergeRetroArchConfig = function(target, version) {

        if (_config.retroarch && _config.retroarch[version] && _config.retroarch[version].config) {
            MergeObject(target, _config.retroarch[version].config);
        }
    };

    var MergeObject = function(target, source) {

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };

    var FormatKeyboardKey = function(rawAssignment) {

        var value;
        var keyLabels = {
            space: 'Space',
            enter: 'Enter',
            return: 'Enter',
            escape: 'Esc',
            esc: 'Esc',
            shift: 'Shift',
            lshift: 'Left Shift',
            rshift: 'Right Shift',
            ctrl: 'Ctrl',
            lctrl: 'Left Ctrl',
            rctrl: 'Right Ctrl',
            alt: 'Alt',
            lalt: 'Left Alt',
            ralt: 'Right Alt',
            up: 'Up',
            down: 'Down',
            left: 'Left',
            right: 'Right',
            leftbracket: '[',
            rightbracket: ']',
            minus: '-',
            equals: '=',
            period: '.',
            comma: ',',
            slash: '/',
            semicolon: ';',
            quote: '\'',
            backslash: '\\',
            tilde: '~',
            backquote: '`',
            pageup: 'Page Up',
            pagedown: 'Page Down',
            print_screen: 'Print Screen'
        };

        if (IsMissingAssignment(rawAssignment)) {
            return null;
        }

        value = String(rawAssignment).replace(/^['\"]+|['\"]+$/g, '');

        if (IsMissingAssignment(value)) {
            return null;
        }

        if (keyLabels.hasOwnProperty(value.toLowerCase())) {
            return keyLabels[value.toLowerCase()];
        }

        if (/^num\d$/i.test(value)) {
            return value.replace(/^num/i, '');
        }

        if (/^f\d+$/i.test(value)) {
            return value.toUpperCase();
        }

        if (value.length === 1) {
            return value.toUpperCase();
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    var IsMissingAssignment = function(value) {

        if (value === null || typeof value === 'undefined') {
            return true;
        }

        value = String(value).replace(/^['\"]+|['\"]+$/g, '');
        value = $.trim(value);

        return value === '' || value.toLowerCase() === 'nul' || value.toLowerCase() === 'null';
    };

    var GetInputAssignmentMap = function(system) {

        if (_config.mappings && system && _config.mappings[system]) {
            return _config.mappings[system];
        }

        if (_config.mappings && _config.mappings.default) {
            return _config.mappings.default;
        }

        return {};
    };

    var GetMappingLabel = function(inputName) {

        if (_inputAssignmentMap && _inputAssignmentMap[inputName]) {
            return _inputAssignmentMap[inputName];
        }

        return inputName;
    };

    var GetSystemDetails = function(system) {

        if (_config.systemdetails && system && _config.systemdetails[system]) {
            return _config.systemdetails[system];
        }

        return null;
    };

    var GetSystemName = function() {

        var systemDetails = GetSystemDetails(_gameKey.system);

        if (systemDetails && systemDetails.shortname) {
            return systemDetails.shortname;
        }

        if (systemDetails && systemDetails.name) {
            return systemDetails.name;
        }

        return _gameKey.system || 'System';
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

    var Constructor = (function() {

    })();
});
