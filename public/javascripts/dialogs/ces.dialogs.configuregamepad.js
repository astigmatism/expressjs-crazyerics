var cesDialogsConfigureGamepad = (function(_config, $el, $wrapper, args) {

    var self = this;
    var _Gamepad = args[0];
    var _Compression = args[1];
    var _delayBetweenInputDetection = 200;
    var _openCallback;

    //this represents an essential set for quick play
    var _inputAssignmentOrder = [
        'Up',
        'Down',
        'Left',
        'Right',
        'A',
        'B',
        'X',
        'Y',
        'Start',
        'Select',
        'L',
        'R'
    ];

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(gamepad) {

        $el.find('span').text(gamepad.id);

        $('#startgamepadover').off().on('mouseup', function() {
            StartOver();
            return;
        });

        $('#skipgamepadconfig').off().on('mouseup', function() {
            _openCallback(); //bail
            return;
        });

        StartOver();
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var StartOver = function() {

        $('#gamepadinputs').empty(); //clear list

        for (var i = 0; i < _inputAssignmentOrder.length; ++i) {
            //add label to list
            var html = $('<li><div class="title">' + _inputAssignmentOrder[i] + ':</div><div class="assignment">Not Assigned</div></li>');
            $('#gamepadinputs').append(html);
        }
        
        var listitems = $('#gamepadinputs').find('li');

        ListenForInput(listitems, 0, [], function(config) {
            
            //config array defined, return it
            _openCallback(_Compression.Compress.json(config));
        });
    };

    var ListenForInput = function(listitems, index, config, callback) {

        var $li = $(listitems[index]);
        $li.find('.assignment').text('Press Anything');
        $li.addClass('pulse');

        _Gamepad.GetNextInput(function(value, label) {
            
            $li.find('.assignment').text(label);
            config.push(value);
            $li.removeClass('pulse');
            
            index++;
            if (index >= _inputAssignmentOrder.length) {
                callback(config);
            } else {

                //this timeout prevents last input from being read again instantly :p 
                setTimeout(function() {
                    ListenForInput(listitems, index, config, callback);
                }, _delayBetweenInputDetection);
            }
        });
    };

    var Constructor = (function() {

    })();
});
