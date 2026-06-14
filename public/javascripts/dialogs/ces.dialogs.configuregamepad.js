var cesDialogsConfigureGamepad = (function(_config, $el, $wrapper, args) {

    var self = this;
    var _Gamepad = args[0];
    var _Compression = args[1];
    var _delayBetweenInputDetection = 200;
    var _openCallback;
    var _bgImageName = 'configure_dialog_bg.png';
    var _dialogBreathingRoom = 20;
    var _viewportBottomBreathingRoom = 20;
    var _minimumDialogHeight = 320;

    //pulled from config, an object conbining the retroarch name with a friendly label
    var _inputAssignmentMap;
    var _inputAssingments = {};
    var _savedInputConfig = null;
    var _promptForSavedMapping = false;
    var _runtimeConfiguration = false;
    var _captureCanceled = false;
    var _pendingCaptureTimer = null;
    var _gamepad = null;
    var _gameKey = null;

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
        _captureCanceled = false;
        ClearPendingCaptureTimer();

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

        $('#gamepadwrapper').css('background-image','url("' + _config.paths.images + '/gamepads/' + gameKey.system + '/' + _bgImageName + '")');

        BindDefaultActions();

        //this was a prereq for coming here
        _inputAssignmentMap = _config.mappings[gameKey.system];

        //convert map to indexable arrays
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
        RemoveUseSavedButton();
        $el.removeClass('runtimeconfiguration viewportconstrained').css('max-height', '');
        return callback();
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

        $('#gamepadconfigactions').removeClass('savedmappingactions');
        RemoveUseSavedButton();

        $('#startgamepadover')
            .removeClass('map remove play')
            .addClass('button first zoom noselect')
            .text(_runtimeConfiguration ? 'Start Mapping' : 'Start Over')
            .off()
            .on('mouseup', function() {
                StartOver();
                return;
            });

        $('#skipgamepadconfig')
            .removeClass('map remove play first')
            .addClass(_runtimeConfiguration ? 'button remove zoom noselect' : 'button zoom noselect')
            .text(_runtimeConfiguration ? 'Cancel' : 'Skip Gamepad')
            .off()
            .on('mouseup', function() {
                CancelActiveCapture();
                _openCallback(); //bail
                return;
            });
    };

    var ShowSavedMapping = function() {

        $('#gamepadinputs').empty(); //clear list

        SetIntroText('saved');
        $('#gamepadconfigactions').addClass('savedmappingactions');

        $('#startgamepadover')
            .removeClass('map remove play')
            .addClass('button first zoom noselect')
            .text('Map Buttons Again')
            .off()
            .on('mouseup', function() {
                StartOver();
                return;
            });

        $('#skipgamepadconfig')
            .removeClass('map remove play first')
            .addClass(_runtimeConfiguration ? 'button remove zoom noselect' : 'button zoom noselect')
            .text(_runtimeConfiguration ? 'Cancel' : 'Skip Using This Gamepad')
            .off()
            .on('mouseup', function() {
                CancelActiveCapture();
                _openCallback(); //bail for keyboard-only play this launch
                return;
            });

        EnsureUseSavedButton()
            .off()
            .on('mouseup', function() {
                _openCallback(_savedInputConfig);
                return;
            });

        for (var i = 0; i < _inputLabels.length; ++i) {
            var retroarchInputName = _retroarchInputNames[i];
            var assignment = _savedInputConfig[retroarchInputName];
            var html = $('<li><div class="title">' + _inputLabels[i] + ':</div><div class="assignment">' + GetAssignmentLabel(assignment) + '</div></li>');
            $('#gamepadinputs').append(html);
        }

        RequestDialogResize();
    };

    var StartOver = function() {

        _inputAssingments = {};
        _captureCanceled = false;
        ClearPendingCaptureTimer();
        RemoveUseSavedButton();
        BindDefaultActions();
        SetIntroText('capture');

        $('#gamepadinputs').empty(); //clear list

        for (var i = 0; i < _inputLabels.length; ++i) {
            var html = $('<li><div class="title">' + _inputLabels[i] + ':</div><div class="assignment">Not Assigned</div></li>');
            $('#gamepadinputs').append(html);
        }

        //make the image area the same height
        //$('#gamepadwrapper').height($('#gamepadinputs').height());

        var listitems = $('#gamepadinputs').find('li');

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
        $li.find('.assignment').text('Press Anything');
        $li.addClass('pulse');

        _Gamepad.GetNextInput(function(value, label) {

            if (_captureCanceled) {
                return;
            }

            $li.find('.assignment').text(label);
            $li.removeClass('pulse');

            //record assignment
            _inputAssingments[_retroarchInputNames[index]] = value;

            index++;
            if (index >= _inputLabels.length) {
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
        ClearPendingCaptureTimer();

        if (_Gamepad && typeof _Gamepad.CancelInputCapture === 'function') {
            _Gamepad.CancelInputCapture(_runtimeConfiguration ? 'runtime ConfigureGamepad canceled' : 'ConfigureGamepad canceled');
        }
    };

    var ClearPendingCaptureTimer = function() {
        if (_pendingCaptureTimer) {
            clearTimeout(_pendingCaptureTimer);
            _pendingCaptureTimer = null;
        }
    };

    var EnsureUseSavedButton = function() {

        var $button = $('#usegamepadsavedconfig');
        if (!$button.length) {
            $button = $('<button id="usegamepadsavedconfig" type="button" class="button play zoom noselect">Use Saved Mapping</button>');
            $('#skipgamepadconfig').after($button);
        }

        $button.removeClass('map remove').addClass('button play zoom noselect').text('Use Saved Mapping').show();
        return $button;
    };

    var RemoveUseSavedButton = function() {
        $('#usegamepadsavedconfig').remove();
    };

    var SetIntroText = function(mode) {

        var systemName = (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].shortname) ? _config.systemdetails[_gameKey.system].shortname : _gameKey.system;
        var port = _gamepad.index + 1;
        var $paragraphs = $el.find('p');

        if (_runtimeConfiguration && mode === 'saved') {
            $paragraphs.eq(0).text('Your current game is paused. A saved ' + systemName + ' mapping exists for "' + _gamepad.id + '" on port ' + port + '. Use it, map the buttons again, or cancel to keep playing with the current settings.');
        }
        else if (_runtimeConfiguration) {
            $paragraphs.eq(0).text('Your current game is paused while you configure "' + _gamepad.id + '" for port ' + port + ' on this system.');
        }
        else if (mode === 'saved') {
            $paragraphs.eq(0).text('A saved ' + systemName + ' mapping exists for "' + _gamepad.id + '" on port ' + port + '. Use it, remap the buttons, or skip this gamepad for keyboard-only play.');
        }
        else {
            $paragraphs.eq(0).text('Configure "' + _gamepad.id + '" for port ' + port + ' on this system.');
        }

        $paragraphs.eq(1).text('Press any key on the keyboard to skip only the current assignment.');
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
