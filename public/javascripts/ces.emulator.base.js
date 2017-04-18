/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} _system       gen, nes, gb, ...
 * @param  {string} _title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulatorBase = (function(_Compression, _PubSub, _config, _system, _title, _file, _key, _ui) {

    // private members
    var self = this;
    var _isLoading = false;
    var _isPaused = false;
    var _displayDurationShow = 1000;
    var _displayDurationHide = 500;
    var _creatingNewSave = false;
    var _timeToWaitForScreenshot = 2000; //hopefully never take more than 2 sec
    var _timeToWaitForSaveState = 30000; //hopefully never more than 30 sec

    //instances
    var _EmulatorInstance = null;
    var _Module = null;
    var _SavesManager = null;
    
    //protected instance
    this._InputHelper = null;

    //protected
    this.loadedSaveData = null; //this is a space I use for indictaing a state file was written during load

    //wait for document as this is an external script
    $(document).ready(function() {

        self._InputHelper = new cesInputHelper(self, _ui);
    });

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

        //attach operation handlers
        this._InputHelper.RegisterOperationHandler('statesave', function(event, proceed, args) {

            saveType = 'user';

            //the savetype can come in on args (auto)
            if (args && args.length && args[0]) {
                saveType = args[0];
            }

            CreateNewSave(saveType, proceed);
        });

        //pub subs
        _PubSub.Subscribe('saveready', self, OnNewSaveSubscription);
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

    this.WriteSaveData = function(saveData, callback) {

        //if null, we want to inform the loading process can continue with a load
        if ($.isEmptyObject(saveData)) {
            self.loadedSaveData = null;
            callback(false);
            return;
        }

        //write state file
        var filenoextension = _file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
        var statefilename = '/' + filenoextension + '.state';
        

        _Module.cesWriteFile('/states', statefilename, saveData.state, function() {

            self.loadedSaveData = saveData;
            callback(true);
        });
    };

    this.PauseGame = function() {
        if (_Module && !_isPaused) {
            self.GiveEmulatorControlOfInput(false);
            _Module.pauseMainLoop();
            _isPaused = true;
        }
    };

    this.ResumeGame = function() {
        if (_Module && _isPaused) {
            self.GiveEmulatorControlOfInput(true);
            _Module.resumeMainLoop();
            _isPaused = false;
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

    this.CleanUp = function(callback) {

        //since each Module attached an event to the parent document, we need to clean those up too:
        $(document).unbind('fullscreenchange');
        $(document).unbind('mozfullscreenchange');
        $(document).unbind('webkitfullscreenchange');
        $(document).unbind('MSFullscreenChange');

        $(document).unbind('pointerlockchange');
        $(document).unbind('mozpointerlockchange');
        $(document).unbind('webkitpointerlockchange');
        $(document).unbind('mspointerlockchange');

        if (_Module) {

            //also unbinds events from document and window
            self.GiveEmulatorControlOfInput(false);

            try {

                //calls exit on emulator ending loop (just to be safe)
                _Module.cesExit(); //see module class for implementation

            } catch (e) {

            }
            _Module = null;

            if (_EmulatorInstance) {
                _EmulatorInstance = null;
            }

            if (self._InputHelper) {
                self._InputHelper = null;
            }
            
            $(_ui.canvas).remove(); //kill all events attached (keyboard, focus, etc)

            if (callback) {
                callback();
            }
        }
    };

    this.GiveEmulatorControlOfInput = function(giveEmulatorInput) {

        self._InputHelper.GiveEmulatorControlOfInput(giveEmulatorInput);

        //also set emulator-specific event handlers on and off (see custom module def)
        if (_Module) {
            _Module.GiveEmulatorControlOfInput(giveEmulatorInput);
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

            _PubSub.Publish('stateWritten', [filename, contents, data]);
            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var arrayBufferView = new Uint8Array(contents);

            _PubSub.Publish('screenshotWritten', [filename, contents, arrayBufferView, _system, _title]);
            return;
        }

        if (filename === 'retroarch.cfg') {
            _PubSub.Publish('retroArchConfigWritten', [contents]);
            return;
        }
    };

    this.OnEmulatorFileRead = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)

        if (statematch) {

            _PubSub.Publish('stateRead', [filename, contents]);
            return;
        }
    };

    this.OnInputIdle = function() {

        //the keys are idle while the game runs! let's auto save
        MakeAutoSave();
    }

    this.InitializeSavesManager = function(saveData, callback) {

        _SavesManager = new cesSavesManager(_Compression, saveData);
    };


    this.GetMostRecentSaves = function(count) { 

        return _SavesManager.GetMostRecentSaves(count);
    };

    //private methods

    var MakeAutoSave = function() {

        if (self._InputHelper) {
            self._InputHelper.Keypress('statesave', null, ['auto']);
        }
    };

    var CreateNewSave = function(saveType, proceedCallback) {

        //bail if already working
        if (_creatingNewSave) {
            proceedCallback(false);
            return;
        }

        _creatingNewSave = true;

        //before state save, perform a screen capture
        var removeScreenshotSubscription = _PubSub.SubscribeOnce('screenshotWritten', self, function(filename, contents, arrayBufferView, system, title) {

            clearTimeout(screenshotTimeout);

            if (arrayBufferView) {

                //it can take a while too, sucks
                var removeStateSubscription = _PubSub.SubscribeOnce('stateWritten', self, function(filename, contents, stateData) {

                    clearTimeout(saveStateTimeout);

                    //ok, to publish a new save is ready, we require screen and state data
                    if (stateData && arrayBufferView) {

                        _PubSub.Publish('saveready', [saveType, _key, arrayBufferView, stateData]);
                    }

                    _creatingNewSave = false;
                });

                //just like with screenshots, create a timer to remove the subscription in case we never hear back
                var saveStateTimeout = setTimeout(function() {

                    removeStateSubscription();
                    _creatingNewSave = false;

                }, _timeToWaitForSaveState);

                
                proceedCallback(true); //allow original function to exe now that we have prepared our filesystem

            } else {

                proceedCallback(false);
            }
        });

        //if I never hear back about a new screenshot, then remove this sub
        var screenshotTimeout = setTimeout(function() {
            
            removeScreenshotSubscription();
            _creatingNewSave = false;

        }, _timeToWaitForScreenshot);

        //press key to begin screenshot capture
        self._InputHelper.Keypress('screenshot');

    };

    var OnNewSaveSubscription = function(saveType, key, screendata, statedata) {

        _SavesManager.AddSave(saveType, key, statedata, screendata, function() {

            //nothing yet
        });
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
        var compressedSupprtData = (support && support[1]) ? support[1] : null; //if not defined, no emulator support

        //LoadGame result
        var gameLoadError = game[0];
        var compressedGameData = game[1]; //compressed game data

        //Load Shader result
        //shader data is compressed from server, unpack later
        var compressedShaderData = (shader && shader[1]) ? shader[1] : null; //if not defined, not shader used

        _Module.BuildLocalFileSystem(compressedGameData, compressedSupprtData, compressedShaderData);
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
