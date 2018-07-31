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
    this.Configure = function(gameKey, callback) {

        if ($.isEmptyObject(_gamepads)) {
            return callback();
        }

        ConfigureGamepad(0, gameKey, function() {
            //all gamepads configured and saved to prefs
            callback();
        });

    };

    var ConfigureGamepad = function(index, gameKey, callback) {

        var gamepad = _gamepads[index];
        
        //base case, bail
        if (!gamepad) {
            return callback();
        }
        
        //we expect a mappings in the config to allow this system to be configured with a gamepad
        if (_config.mappings[gameKey.system]) {


            var compressedName = _Compression.Compress.string(gamepad.id);
            var prefName = 'mappings.gamepad.' + gameKey.system + '.' + compressedName + '.' + index;
            var savedMappings = _Preferences.Get(prefName);

            //if we found preferences for the gamepad already, no need to configure, try next gamepad until no more
            if (savedMappings && !reconfigureEachTime) {
                
                //cache locally
                gamepad.inputconfig = _Compression.Decompress.json(savedMappings);

                return ConfigureGamepad(index+1, gameKey, callback); //configure next gamepad
            }

            _Dialogs.Open('ConfigureGamepad', [_config, gamepad, gameKey], false, function(inputconfig) {
                
                //if the dialog is returning a successful configuration, let's save it
                if (inputconfig) {

                    //cache locally
                    gamepad.inputconfig = inputconfig;

                    _Preferences.Set(prefName, _Compression.Compress.json(inputconfig));
                }
                
                return ConfigureGamepad(index+1, gameKey, callback); //configure next gamepad
            });
        }
        else {
            return callback();
        }
    };

    this.GetConfiguredGamepadInput = function(gameKey) {

        var mappings = [];
        for (var index in _gamepads) {

            var gamepad = _gamepads[index];
            var compressedName = _Compression.Compress.string(gamepad.id);
            var prefname = 'mappings.gamepad.' + gameKey.system + '.' + compressedName + '.' + index;
            var savedMappings = _Preferences.Get(prefname); //a unique name includes the port plugged into (for dulcaite gamepads on all ports)
            
            if (savedMappings) {
                var decompressedConfig = _Compression.Decompress.json(savedMappings);
                mappings.push(decompressedConfig);
            }
        }
        return mappings;
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

    this.GetGamePadDetails = function() {
        return _gamepads;
    }

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
