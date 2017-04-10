/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} _system       gen, nes, gb, ...
 * @param  {string} _title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulatorBase = (function(_Compression, _config, _system, _title, _file, _key, _ui, _OnEmulatorKeydownHandler, _OnEmulatorFileWriteHandler, _OnStateSavedHandler) {

    // private members
    var self = this;
    var FS = null;
    var _isLoading = false;
    var _compressedSupprtData = null;
    var _compressedGameData = null;
    var _compressedShaderData = null;
    var _saveStateDeffers = {}; //since saving state to server requires both state and screenshot data, setup these deffers since tracking which comes back first is unknown
    var _fileWriteDelay = 750; //in ms. The delay in which the client should respond to a file written by the emulator (sometimes is goes out over the network and we don't want to spam the call)
    var _fileWriteTimers = {};
    var _keypresslocked = false; //if we are simulating a keypress (down and up) this boolean prevents another keypress until the current one is complete
    var _browserFunctionKeysWeWantToStop = {
        9: "tab",
        13: "enter",
        16: "shift",
        18: "alt",
        27: "esc",
        33: "rePag",
        34: "avPag",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12"
    };
    var _displayDurationShow = 1000;
    var _displayDurationHide = 500;

    //instances
    var _EmulatorInstance = null;
    var _Module = null;

    //protected

    // public methods
        
    /**
     * Calls the start function of the emulator script
     * @param {Function} callback the function to handle exceptions thrown by the emulator script
     */
    this.BeginGame = function(callback) {

        try {
            _Module.callMain(_Module.arguments);
        
        } catch (e) {
            if (callback) {
                callback(e);
            }
        }
    };

    /**
     * Load all components necssary for game to run
     * @param {Object} module   from the emulator extention, this custom made module is extended to the emulators "module"
     * @param {string} shader   a shader selection or pre-defined
     * @param {Object} deffered when complete
     */
    this.Load = function(module, shader, deffered) {

        var emulatorLoadComplete = $.Deferred();
        var supportLoadComplete = $.Deferred();
        var gameLoadComplete = $.Deferred();
        var shaderLoadComplete = $.Deferred();

        _isLoading = true;

        LoadEmulatorScript(_system, module, emulatorLoadComplete);
        LoadSupportFiles(_system, supportLoadComplete);
        LoadGame(gameLoadComplete);
        LoadShader(shader, shaderLoadComplete);

        $.when(emulatorLoadComplete, supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(emulator, support, game, shader) {

            _isLoading = false;

            OnEmulatorLoadComplete(emulator, support, game, shader);

            deffered.resolve(true);
        });
    };

    this.LoadSave = function(saveData, callback) {

        //if null, we want to inform the loading process can continue with a load
        if (!saveData) {
            if (callback) {
                callback();
            }
            return;
        }

        //ensure states folder exists
        _Module.FS_createFolder('/', 'states', true, true);

        //write state file
        var filenoextension = _file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
        var statefilename = '/' + filenoextension + '.state';
        

        _Module.cesWriteFile('/states', statefilename, saveData.state, function() {

            //file written
        
            callback();
        });
    };

    this.PauseGame = function() {
        if (_Module) {
            self.GiveEmulatorControlOfInput(false);
            _Module.pauseMainLoop();
        }
    };

    this.ResumeGame = function() {
        if (_Module) {
            self.GiveEmulatorControlOfInput(true);
            _Module.resumeMainLoop();
        }
    };

    this.Show = function (duration, callback) {

        duration = duration || _displayDurationShow;

        $(_ui.wrapper).fadeIn(_displayDurationShow, function() {

            self.GiveEmulatorControlOfInput(true);

            if (callback) {
                callback();
            }
        });
    };

    this.Hide = function (duration, callback) {

        duration = duration || _displayDurationHide;

        self.GiveEmulatorControlOfInput(false);
        $(_ui.wrapper).fadeOut(_displayDurationHide, function() {
            
            if (callback) {
                callback();
            }
        });
    };

    this.CleanUp = function() {

        //since each Module attached an event to the parent document, we need to clean those up too:
        $(document).unbind('fullscreenchange');
        $(document).unbind('mozfullscreenchange');
        $(document).unbind('webkitfullscreenchange');
        $(document).unbind('MSFullscreenChange');

        $(document).unbind('pointerlockchange');
        $(document).unbind('mozpointerlockchange');
        $(document).unbind('webkitpointerlockchange');
        $(document).unbind('mspointerlockchange');

        self.GiveEmulatorControlOfInput(false); //also unbinds events from document and window

        if (FS) {
            FS = null;
        }

        if (_Module) {
            try {

                //calls exit on emulator ending loop (just to be safe)
                _Module.cesExit(); //see module class for implementation

            } catch (e) {

            }
            _Module = null;
        }

        if (_EmulatorInstance) {
            _EmulatorInstance = null;
        }
        
        $(_ui.canvas).remove(); //kill all events attached (keyboard, focus, etc)
    };

    /**
     * simulator keypress on emulator. used to allow interaction of dom elements
     * @param  {number} key ascii key code
     * @param {number} keyUpDelay the time delay (in ms) the key will be in the down position before lift
     * @return {undef}
     */
    this.SimulateEmulatorKeypress = function(key, keyUpDelay, callback) {

        var keyUpDelay = keyUpDelay || 10;

        //bail if in operation
        if (_keypresslocked) {
            return;
        }

        /**
         * [kp description]
         * @param  {number} k
         * @param  {Object} event
         * @return {undefined}
         */
        kp = function(k, event) {
            var oEvent = document.createEvent('KeyboardEvent');

            // Chromium Hack
            Object.defineProperty(oEvent, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
            });
            Object.defineProperty(oEvent, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
            });

            if (oEvent.initKeyboardEvent) {
                oEvent.initKeyboardEvent(event, true, true, document.defaultView, false, false, false, false, k, k);
            } else {
                oEvent.initKeyEvent(event, true, true, document.defaultView, false, false, false, false, k, 0);
            }

            oEvent.keyCodeVal = k;

            if (oEvent.keyCode !== k) {
                alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
            }

            document.dispatchEvent(oEvent);
            $(_ui.canvas).focus();
        };

        _keypresslocked = true;
        kp(key, 'keydown');

        setTimeout(function() {

            kp(key, 'keyup');
            _keypresslocked = false;
            if (callback) {
                callback();
            }

        }, keyUpDelay);

        $(_ui.canvas).focus();
        
    };

    this.GiveEmulatorControlOfInput = function(giveEmulatorInput) {
        
        if (giveEmulatorInput) {

            //common listener definition
            var keyboardListener = function (e) {
                if (_browserFunctionKeysWeWantToStop[e.which]) {
                    e.preventDefault();
                }
            }

            $(window).on('keydown', keyboardListener); //using jQuerys on and off here worked :P

        } else {
            $(window).off('keydown');
        }

        //also set emulator-specific event handlers on and off (see custom module def)
        if (_Module) {
            _Module.giveEmulatorControlOfInput(giveEmulatorInput);
        }
    };

    /**
     * this function is registered with the emulator when a file is written.
     * @param  {string} key      unique game key, used to save state
     * @param  {string} system
     * @param  {string} _title
     * @param  {string} file
     * @param  {string} filename the file name being saved by the emulator
     * @param  {UInt8Array} contents the contents of the file saved by the emulator
     * @return {undef}
     */
    this.OnEmulatorFileWrite = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)
        var screenshotmatch = filename.match(/\.bmp$|\.png$/);

        // match will return an array when match was successful, our capture group with the slot value, its 1 index
        if (statematch) {

            var data = _Compression.Zip.bytearray(contents);

            //if a deffered is setup for recieveing save state data, call it.
            if (_saveStateDeffers.hasOwnProperty('state')) {
                _saveStateDeffers.state.resolve(data);
            }

            //if a handler is defined, call it
            if (_OnEmulatorFileWriteHandler) {
                _OnEmulatorFileWriteHandler('state', filename, contents);
            }
            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var arrayBufferView = new Uint8Array(contents);

            //if a deffered from save state exists, use this screenshot for it and return
            if (_saveStateDeffers.hasOwnProperty('screen')) {
                _saveStateDeffers.screen.resolve(arrayBufferView);
            }

            if (_OnEmulatorFileWriteHandler) {
                _OnEmulatorFileWriteHandler('screen', filename, contents, {
                    arrayBufferView: arrayBufferView,
                    system: _system,
                    title: _title
                });
            }
            return;
        }

        if (filename === 'retroarch.cfg') {
            if (_OnEmulatorFileWriteHandler) {
                _OnEmulatorFileWriteHandler('retroarchconfig', filename, contents);
            }
            return;
        }
    };

    this.OnEmulatorKeydown = function(event) {

        var key = event.keyCode;
        switch (key) {
            case 49: //1 - save state
                GetStateAndScreenshot();
            break;
        }

        //pass to ces.main
        if (_OnEmulatorKeydownHandler) {
            _OnEmulatorKeydownHandler(event);
        }
    };

    //private methods

    var GetStateAndScreenshot = function() {

        //bail if already in progress
        if (!$.isEmptyObject(_saveStateDeffers)) {
            return;
        }

        //we've using deferred because the resolve is on a file write, something that is async
        _saveStateDeffers.state = $.Deferred();
        _saveStateDeffers.screen = $.Deferred();

        //use a timeout to clear deffers in case one of them never comes back, 3 sec is plenty. i see this return in about 50ms generally however
        var clearStateDeffers = setTimeout(function() {
            _saveStateDeffers = {};
        }, 3000);

        $.when(_saveStateDeffers.state, _saveStateDeffers.screen).done(function(stateData, screenData) {

            clearTimeout(clearStateDeffers); //clear timeout from erasing deffers
            _saveStateDeffers = {}; //do the clear ourselves

            //callback to ces.main, pass the other privates just in case
            if (_OnStateSavedHandler) {
                _OnStateSavedHandler(_key, _system, _title, _file, stateData, screenData);
            }
            
        });
        setTimeout(function() {
            self.SimulateEmulatorKeypress(84); //take screen
        }, 500);
    };

    /**
     * A helper function to separate the post-response functionality from the LoadEmulator function
     * @param {Array} emulator
     * @param {Array} support
     * @param {Array} game
     * @param {Array} shader
     */
    var OnEmulatorLoadComplete = function(emulator, support, game, shader) {

        //LoadEmulator result
        if (emulator[0]) {
            console.error(emulator[0]);
            return;
        }
        _Module = emulator[1];
        _EmulatorInstance = emulator[2];

        //LoadSupportFiles result
        _compressedSupprtData = (support && support[1]) ? support[1] : null; //if not defined, no emulator support

        //LoadGame result
        var gameLoadError = game[0];
        _compressedGameData = game[1]; //compressed game data

        //Load Shader result
        //shader data is compressed from server, unpack later
        _compressedShaderData = (shader && shader[1]) ? shader[1] : null; //if not defined, not shader used

        BuildLocalFileSystem();
    };

    /**
     * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadEmulatorScript = function(system, module, deffered) {

        //the path is made of three sections, 1) cdn or local 2) the extention name is the folder where they are stored 3) the file itself
        var scriptPath = _config.emupath + '/' + _config.systemdetails[system].emuextention + '/' + _config.systemdetails[system].emuscript;

        $.getScript(scriptPath)
            .done(function(script, textStatus) {

                //I have all the retroarch emulators in a closure to help separate the globals they use from other
                //emulators instances. The module class is passed in for its own extention
                var emulatorScriptInstance = new cesRetroArchEmulator(module);

                deffered.resolve(null, module, emulatorScriptInstance);
            })
            .fail(function(jqxhr, settings, exception ) {
                deffered.resolve(exception);
        });
    };

    /**
     * Emulator support is any additional resources required by the emulator needed for play
     * This isnt included in the LoadEmulator call because sometimes support files are needed for an emulator
     * which can play several systems (Sega CD, support needed, Genesis, no support)
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadSupportFiles = function(system, deffered) {

        var location = _config.assetpath + '/emulatorsupport/' + system + '.json';

        //i know this is a weird construct, but it defaults on systems without support
        switch (system) {
            case 'segacd':
            break;
            default:
                //system not handled, bail
                deffered.resolve();
                return;
        }

        /**
         * This jsonp response handler is specific for returning compressed emulator support files
         * @param  {strin} response compressed string
         * @return {undef}
         */
        c = function(response) {
            deffered.resolve(null, response);
        };

        //very important that this is a jsonp call - works around xdomain call to google drive
        $.ajax({
            url: location,
            type: 'GET',
            dataType: 'jsonp'
        });
    };

    /**
     * load rom file from whatever is defined in the config "rompath" (CDN/crossdomain or local). will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
     * @param  {string} system
     * @param  {string} _title
     * @param  {string} file
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadGame = function(deffered) {

        var location = _config.rompath + '/' + _system + '/' + _config.systemdetails[_system].romcdnversion + '/';
        var flattened = _config.flattenedromfiles;

        //if rom struture is flattened, this means that all rom files have been converted to single json files
        if (flattened) {

            var filename = _Compression.Zip.string(_title + _file);
            //location += '/' + system + '/a.json'; //encode twice: once for the trip, the second because the files are saved that way on the CDN
            location += encodeURIComponent(encodeURIComponent(filename)) + '.json'; //encode twice: once for the trip, the second because the files are saved that way on the CDN
        } else {
            location += _title + '/' + _file;
        }

        /**
         * This jsonp response handling is specific for return gamedata, we'll decompress it later
         * @param  {Array} response  compressed file segments
         * @return {undef}
         */
        a = function(response) {
            deffered.resolve(null, response);
        };

        /**
         * set the global jsonpDelegate
         * @param  {string} response
         * @return {undefined}
         */
        jsonpDelegate = function(response) {

            var inflated;
            try {
                var decompressed = _Compression.Unzip.string(response);
                inflated = pako.inflate(decompressed); //inflate compressed file contents (pako deflated to string in file on CDN)
            } catch (e) {
                deffered.resolve(e);
                return;
            }
            deffered.resolve(null, inflated);
        };

        //very important that this is a jsonp call - works around xdomain call to google drive
        $.ajax({
            url: location,
            type: 'GET',
            dataType: 'jsonp'
        });
    };

    /**
     * load a shader from whatever the assetpath is
     * @param  {string} name
     * @param  {Object} deffered
     * @return {undefined}
     */
    var LoadShader = function(name, deffered) {

        var location = _config.assetpath + '/shaders';

        if (name) {
            location += '/' + name + '.json';
        } else {
            //no shader to load, resolve deffered
            deffered.resolve();
            return;
        }

        /**
         * This jsonp handler is specific for shader details
         * @param  {string} response
         * @return {undef}
         */
        b = function(response) {
            deffered.resolve(null, response);
        };

        //very important that this is a jsonp call - works around xdomain call to google drive
        $.ajax({
            url: location,
            type: 'GET',
            dataType: 'jsonp'
        });
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
    //var BuildLocalFileSystem = function(module, system, file, gamedata, shaderData, _compressedSupprtData) {
    var BuildLocalFileSystem = function() {

        var i;
        var content;

        _Module.FS_createFolder('/', 'games', true, true);

        //games are stored compressed in json. due to javascript string length limits, these can be broken up into several segments for larger files.
        //the compressedGameFiles object contains data for all files and their segments
        for (var gameFile in _compressedGameData) {

            var filename = _Compression.Unzip.string(gameFile);
            var compressedGame = _compressedGameData[gameFile];
            var views = [];
            var bufferLength = 0;

            //begin by decopressing all compressed file segments
            for (i = 0; i < compressedGame.length; ++i) {
                var decompressed = _Compression.Unzip.string(compressedGame[i]);
                var view = pako.inflate(decompressed); //inflate compressed file contents (Uint8Array)
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
            _Module.FS_createDataFile('/games', filename, gamedata, true, true);
        }

        //set the start file
        _Module.arguments = ['-v', '-f', '/games/' + _file];
        //_Module.arguments = ['-v', '--menu'];

        //emulator support, will be null if none
        if (_compressedSupprtData) {
            var supportFiles = _Compression.Unzip.json(_compressedSupprtData);
            if (supportFiles) {
                for (var supportFile in supportFiles) {
                    content = _Compression.Unzip.bytearray(supportFiles[supportFile]);
                    try {
                        _Module.FS_createDataFile('/', supportFile, content, true, true);
                    } catch (e) {
                        //an error on file write.
                    }
                }
            }
        }

        //shaders
        _Module.FS_createFolder('/', 'shaders', true, true);
        var shaderPresetToLoad = null;

        //shader files, will be null if none used
        if (_compressedShaderData) {
            var shaderFiles = _Compression.Unzip.json(_compressedShaderData); //decompress shader files to json object of file names and data

            //if in coming shader parameter is an object, then it has shader files defined.
            if (shaderFiles) {

                for (var shaderfile in shaderFiles) {
                    content = _Compression.Unzip.bytearray(shaderFiles[shaderfile]);
                    try {
                        _Module.FS_createDataFile('/shaders', shaderfile, content, true, true);
                    } catch (e) {
                        //an error on file write.
                    }

                    //is file preset? if so, save to define in config for auto load
                    if (shaderfile.match(/\.glslp$/g)) {
                        shaderPresetToLoad = shaderfile;
                    }
                }
            }
        }

        //config, must be after shader
        //wrap folder creation in catch since error is thrown if exists
        try { _Module.FS_createFolder('/', 'etc', true, true); } catch (e) {}
        try { _Module.FS_createFolder('/', 'home', true, true); } catch (e) {}
        try { _Module.FS_createFolder('/home', 'web_user', true, true); } catch (e) {}
        try { _Module.FS_createFolder('/home/web_user/', 'retroarch', true, true); } catch (e) {}
        try { _Module.FS_createFolder('/home/web_user/retroarch', 'userdata', true, true); } catch (e) {}

        if (_config.retroarch) {

            var retroArchConfig = _config.retroarch; //in json
            var configItem;

            //system specific overrides
            if (_config.systemdetails[_system] && _config.systemdetails[_system].retroarch) {
                for (configItem in _config.systemdetails[_system].retroarch) {
                    retroArchConfig[configItem] = _config.systemdetails[_system].retroarch[configItem];
                }
            }

            if (shaderPresetToLoad) {
                retroArchConfig.video_shader = '/shaders/' + shaderPresetToLoad;
            }

            //convert json to string delimited list
            var configString = '';
            for (configItem in retroArchConfig) {
                configString +=  configItem + ' = ' + retroArchConfig[configItem] + '\n';
            }

            //write to both locations since we could be using older or newer emulators
            _Module.FS_createDataFile('/home/web_user/retroarch/userdata', 'retroarch.cfg', configString, true, true);
            _Module.FS_createDataFile('/etc', 'retroarch.cfg', configString, true, true);
        }

        //screenshots
        _Module.FS_createFolder('/', 'screenshots', true, true);
    };

    /**
     * asychonous iteration helper
     * @param  {number}   iterations
     * @param  {Function}   func
     * @param  {Function} callback
     * @return {Object}
     */
    var AsyncLoop = function(iterations, func, callback) {
        var index = 0;
        var done = false;
        var loop = {
            /**
             * [next description]
             * @return {Function} [description]
             */
            next: function() {
                if (done) {
                    return;
                }

                if (index < iterations) {
                    index++;
                    func(loop);

                } else {
                    done = true;
                    callback();
                }
            },
            /**
             * [iteration description]
             * @return {number}
             */
            iteration: function() {
                return index - 1;
            },
            /**
             * [break description]
             * @return {undef}
             */
            break: function() {
                done = true;
                callback();
            }
        };
        loop.next();
        return loop;
    };

    return this;
});

/**
 * globally defined jsonp deletegate. runs when jsonp is fetched. common scheme is to define a handler for calling jsonp
 * @param  {Object} response
 * @return {undef}
 */
var jsonpDelegate;
var a;
var b;
var c;
