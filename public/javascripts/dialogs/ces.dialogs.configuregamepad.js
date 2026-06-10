var cesDialogsConfigureGamepad = (function(_config, $el, $wrapper, args) {

    var self = this;
    var _Gamepad = args[0];
    var _Compression = args[1];
    var _delayBetweenInputDetection = 200;
    var _openCallback;
    var _bgImageName = 'configure_dialog_bg.png';

    //pulled from config, an object conbining the retroarch name with a friendly label
    var _inputAssignmentMap;
    var _inputAssingments = {};
    var _savedInputConfig = null;
    var _promptForSavedMapping = false;
    var _gamepad = null;
    var _gameKey = null;

    //arrays for iteration
    var _retroarchInputNames = [];
    var _inputLabels = [];

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(_config, gamepad, gameKey, options) {

        options = options || {};
        _gamepad = gamepad;
        _gameKey = gameKey;
        _savedInputConfig = options.savedInputConfig || null;
        _promptForSavedMapping = !!options.promptForSavedMapping;

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
        return callback();
    };

    var BindDefaultActions = function() {

        RemoveUseSavedButton();

        $('#startgamepadover')
            .addClass('button map first zoom noselect')
            .text('Start Over')
            .off()
            .on('mouseup', function() {
                StartOver();
                return;
            });

        $('#skipgamepadconfig')
            .addClass('button remove zoom noselect')
            .text('Skip Gamepad')
            .off()
            .on('mouseup', function() {
                _openCallback(); //bail
                return;
            });
    };

    var ShowSavedMapping = function() {

        $('#gamepadinputs').empty(); //clear list

        SetIntroText('saved');

        $('#startgamepadover')
            .addClass('button map first zoom noselect')
            .text('Map Buttons Again')
            .off()
            .on('mouseup', function() {
                StartOver();
                return;
            });

        $('#skipgamepadconfig')
            .addClass('button remove zoom noselect')
            .text('Skip Using This Gamepad')
            .off()
            .on('mouseup', function() {
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
    };

    var StartOver = function() {

        _inputAssingments = {};
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

        ListenForInput(listitems, 0, function() {

            //config array defined, return it
            _openCallback(_inputAssingments);
        });
    };

    var ListenForInput = function(listitems, index, callback) {

        var $li = $(listitems[index]);
        $li.find('.assignment').text('Press Anything');
        $li.addClass('pulse');

        _Gamepad.GetNextInput(function(value, label) {

            $li.find('.assignment').text(label);
            $li.removeClass('pulse');

            //record assignment
            _inputAssingments[_retroarchInputNames[index]] = value;

            index++;
            if (index >= _inputLabels.length) {
                callback();
            } else {

                //this timeout prevents last input from being read again instantly :p
                setTimeout(function() {
                    ListenForInput(listitems, index, callback);
                }, _delayBetweenInputDetection);
            }
        });
    };

    var EnsureUseSavedButton = function() {

        var $button = $('#usegamepadsavedconfig');
        if (!$button.length) {
            $button = $('<button id="usegamepadsavedconfig" type="button" class="button play zoom noselect">Use Saved Mapping</button>');
            $('#startgamepadover').after($button);
        }

        $button.addClass('button play zoom noselect').text('Use Saved Mapping').show();
        return $button;
    };

    var RemoveUseSavedButton = function() {
        $('#usegamepadsavedconfig').remove();
    };

    var SetIntroText = function(mode) {

        var systemName = (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].shortname) ? _config.systemdetails[_gameKey.system].shortname : _gameKey.system;
        var port = _gamepad.index + 1;
        var $paragraphs = $el.find('p');

        if (mode === 'saved') {
            $paragraphs.eq(0).text('A saved ' + systemName + ' mapping exists for "' + _gamepad.id + '" on port ' + port + '. Use it, remap the buttons, or skip this gamepad for keyboard-only play.');
        }
        else {
            $paragraphs.eq(0).text('Configure "' + _gamepad.id + '" for port ' + port + ' on this system.');
        }

        $paragraphs.eq(1).text('Press any key on the keyboard to skip the current assignment.');
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
