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

    //arrays for iteration
    var _retroarchInputNames = [];
    var _inputLabels = [];

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(_config, gamepad, gameKey) {

        //reset if used previously
        _retroarchInputNames = [];
        _inputLabels = [];
        _inputAssingments = {};

        $el.find('span.gamepadsystem').text(_config.systemdetails[gameKey.system].shortname); //title
        $el.find('span.gamepadid').text(gamepad.id); //game pad id
        $el.find('span.gamepadport').text(gamepad.index + 1); //game pad port (+1 as its 0 based)

        $('#gamepadwrapper').css('background-image','url("' + _config.paths.images + '/gamepads/' + gameKey.system + '/' + _bgImageName + '")');
        
        $('#startgamepadover').off().on('mouseup', function() {
            StartOver();
            return;
        });

        $('#skipgamepadconfig').off().on('mouseup', function() {
            _openCallback(); //bail
            return;
        });

        //this was a prereq for coming here
        _inputAssignmentMap = _config.mappings[gameKey.system];

        //convert map to indexable arrays
        var index = 0;
        for (var retroarchInputName in _inputAssignmentMap) {
            _retroarchInputNames[index] = retroarchInputName;
            _inputLabels[index] = _inputAssignmentMap[retroarchInputName];
            ++index;
        }

        StartOver(); //clear field
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var StartOver = function() {

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

    var Constructor = (function() {

    })();
});
