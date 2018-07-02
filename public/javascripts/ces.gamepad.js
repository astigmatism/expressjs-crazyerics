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

    //debug
    var reconfigureEachTime = false; //when true will avoid checking preferences for saved configuration

    //these values are specific to retroarch config

    $(document).ready(function() {

        _haveEvents = 'ongamepadconnected' in window;

        if (!_haveEvents) {
            setInterval(ScanForGamepads, 17); //17 is 60fps
        }

        window.addEventListener('gamepadconnected', function(e) {
            AddGamepad(e.gamepad);
        });
        window.addEventListener("gamepaddisconnected", function(e) {
            RemoveGamepad(e.gamepad);
        });
    });

    // public methods

    //determine if controllers need configuration, if so, use dialog
    this.Configure = function(callback) {

        if ($.isEmptyObject(_gamepads)) {
            return callback();
        }

        ConfigureGamepad(0, function() {
            //all gamepads configured and saved to prefs
            callback();
        });

    };

    this.GetConfiguredGamepadInput = function() {

        var mappings = [];
        for (var index in _gamepads) {

            var gamepad = _gamepads[index];
            var compressedName = _Compression.Compress.string(gamepad.id);
            var savedMappings = _Preferences.Get('mappings.gamepad.' + index + '.' + compressedName); //a unique name includes the port plugged into (for dulcaite gamepads on all ports)
            if (savedMappings) {
                var decompressedConfig = _Compression.Decompress.json(savedMappings);
                mappings.push(decompressedConfig);
            }
        }
        return mappings;
    };

    var ConfigureGamepad = function(index, callback) {

        var gamepad = _gamepads[index];

        //base case, bail
        if (!gamepad) {
            return callback();
        }

        var compressedName = _Compression.Compress.string(gamepad.id);
        var savedMappings = _Preferences.Get('mappings.gamepad.' + index + '.' + compressedName);

        //if we found preferences for the gamepad already, no need to configure, try next gamepad until no more
        if (savedMappings && !reconfigureEachTime) {
            return ConfigureGamepad(index+1, callback); //configure next gamepad
        }

        _Dialogs.Open('ConfigureGamepad', [gamepad], false, function(compressedInputConfig) {
            
            //if the dialog is returning a successful configuration, let's save it
            if (compressedInputConfig) {
                _Preferences.Set('mappings.gamepad.' + index + '.' + compressedName, compressedInputConfig);
            }
            
            return ConfigureGamepad(index+1, callback); //configure next gamepad
        });
    };

    this.GetNextInput = function(callback) {

        _captureInputCallback = function(value, label) {

            cancelAnimationFrame(_gameLoop); //stop loop
            _captureInputCallback = null;
            $(document).off('keypress');
            return callback(value, label);
        };

        //any keyboard event during the capture will not assign current assignment
        $(document).on('keypress', function() {
            $(document).off('keypress');
            return callback('', 'Not Assigned');
        });

        _gameLoop = requestAnimationFrame(Update); //loop start
    };

    // private methods

    var AddGamepad = function(gamepad) {
        
        //if gamepad already assigned
        if (_gamepads[gamepad.index]) {
            return;
        }

        _gamepads[gamepad.index] = gamepad;
        
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gamepad.index, gamepad.id, gamepad.buttons.length, gamepad.axes.length);

        var $gamepad = _$gamepads[gamepad.index];
        $gamepad.addClass('connected');
        _Tooltips.SingleHTML($gamepad, 'Gamepad Connected: ' + gamepad.id); //reapply tooltips

        //after all the work I did, I found the web retroarch worked with gamepads out of the box. lol
        //requestAnimationFrame(Update); //loop start
    };

    var RemoveGamepad = function(gamepad) {

        var $gamepad = _$gamepads[gamepad.index];

        console.log("Gamepad disconnected from index %d: %s", gamepad.index, gamepad.id);

        $gamepad.removeClass('connected');
        _Tooltips.SingleHTML($gamepad, 'Gamepad Disconnected'); //reapply tooltips

        delete _gamepads[gamepad.index];
    };

    var Update = function() {
        if (!_haveEvents) {
            ScanForGamepads();
        }

        //for each controller
        for (var j in _gamepads) {
            var gamepad = _gamepads[j];

            //buttons
            for (i = 0; i < gamepad.buttons.length; i++) {
                var button = gamepad.buttons[i];
                if (button.pressed) {
                    if (_captureInputCallback) {
                        _captureInputCallback(i, 'Button ' + i);
                    }
                }
            }
            //axes
            for (i = 0; i < gamepad.axes.length; i++) {
                var val = gamepad.axes[i];
                val.toFixed(0);
                if (val.toFixed(0) > 1 || val.toFixed(0) == 0) {
                    //not pressed
                }
                else {
                    if (_captureInputCallback) {

                        var sign = (val == -1 ? '-' : '+');
                        var retroarchconfigvalue = sign + i; //eg -0, +0, -1
                        _captureInputCallback(retroarchconfigvalue, 'Axis ' + i + sign); //eg Axis 0-
                    }
                }
            }
        }

        _gameLoop = requestAnimationFrame(Update); //loop
    };

    //this function is called in leu of the window "ongamepadconnected" for different browsers
    var ScanForGamepads = function() {
    
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                if (gamepads[i].index in _gamepads) {
                    _gamepads[gamepads[i].index] = gamepads[i];
                } else {
                    AddGamepad(gamepads[i]);
                }
            }
        }
    };
    

    return this;
});
