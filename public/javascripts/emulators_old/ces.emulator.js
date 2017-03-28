/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulator = (function(_Compression, config, system, title, file, key) {

    // private members
    var self = this;
    var FS = null;
    var isLoading = false;
    var compressedSupprtData = null;
    var compressedGameData = null;
    var compressedShaderData = null;
    var currentStateSlot = 0;
    var saveStateDeffers = {}; //since saving state to server requires both state and screenshot data, setup these deffers since tracking which comes back first is unknown
    var fileWriteDelay = 500; //in ms. The delay in which the client should respond to a file written by the emulator (sometimes is goes out over the network and we don't want to spam the call)
    var fileWriteTimers = {};

    // public/protected members (on prototytpe)
    self.module = null;
    self.iFrame = null;
    self.contentWindow = null;
    self.contentDocument = null;


    //constructor
    (function() {

        //no work yet

    })();


    // public methods
    
    this.BeginGame = function() {
        self.module.callMain(self.module.arguments);
    };

    this.Load = function(shader, deffered) {

        var emulatorLoadComplete = $.Deferred();
        var supportLoadComplete = $.Deferred();
        var gameLoadComplete = $.Deferred();
        var shaderLoadComplete = $.Deferred();

        isLoading = true;

        LoadEmulator(system, emulatorLoadComplete);
        LoadSupportFiles(system, supportLoadComplete);
        LoadGame(key, system, title, file, gameLoadComplete);
        LoadShader(shader, shaderLoadComplete);

        $.when(emulatorLoadComplete, supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(emulator, support, game, shader) {

            isLoading = false;

            OnEmulatorLoadComplete(emulator, support, game, shader);

            deffered.resolve(true);
        });
    };

    this.WriteStateData = function(slots) {

        //states
        self.module.FS_createFolder('/', 'states', true, true);

        i = slots.length;

        while (i--) {
            var filenoextension = file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
            var statefilename = '/' + filenoextension + '.state' + (slots[i] == 0 ? '' : slots[i]);
            var statedata = _StateManager.GetState(slots[i]);
            self.module.FS_createDataFile('/states', statefilename, statedata, true, true);
        }
    };

    this.LoadSavedState = function(slot, callback) {

        AsyncLoop(parseInt(slot, 10), function(loop) {

            //simulate increasing state slot (will also set self._activeStateSlot)
            SimulateEmulatorKeypress(51, 10, function() {
                loop.next();
            });

        }, function() {
            SimulateEmulatorKeypress(52); //4 load state
            if (callback) {
                callback();
            }
        });
    };

    this.PauseGame = function() {
        if (self.module) {
            self.module.pauseMainLoop();
        }
    };

    this.ResumeGame = function() {
        if (self.module) {
            self.module.resumeMainLoop();
        }
    };

    this.GetCanvasDimensions = function() {

        var result = {
            width: 0,
            height: 0
        };

        if (self.module && self.module.canvas) {
            result.width = self.module.canvas.width;
            result.height = self.module.canvas.height;
        }
        return result;
    };

    this.CleanUp = function() {

        //since each Module attached an event to the parent document, we need to clean those up too:
        $(document).unbind('fullscreenchange');
        $(document).unbind('mozfullscreenchange');
        $(document).unbind('webkitfullscreenchange');
        $(document).unbind('pointerlockchange');
        $(document).unbind('mozpointerlockchange');
        $(document).unbind('webkitpointerlockchange');

        if (FS) {
            FS = null;
        }

        if (self.module) {
            try {
                self.module.exit(); //calls exit on emulator ending loop (just to be safe)
            } catch (e) {

            }
            self.module = null;
        }
        if (self.iFrame) {
            self.iFrame.remove();
            self.iFrame = null;
        }
        $('#emulator').remove(); //kill all events attached (keyboard, focus, etc)
    };

    this.GetCurrentStateSlot = function() {
        return currentStateSlot;
    };

    //private methods

    /**
     * A helper function to separate the post-response functionality from the LoadEmulator function
     * @param {Array} emulator
     * @param {Array} support
     * @param {Array} game
     * @param {Array} shader
     */
    var OnEmulatorLoadComplete = function(emulator, support, game, shader) {

        //LoadEmulator result
        self.module = emulator[0];
        FS = emulator[1];
        self.contentWindow = emulator[2];
        self.contentDocument = emulator[3];
        self.iFrame = emulator[4];

        //LoadSupportFiles result
        compressedSupprtData = (support && support[1]) ? support[1] : null; //if not defined, no emulator support

        //LoadGame result
        var gameLoadError = game[0];
        compressedGameData = game[1]; //compressed game data

        //Load Shader result
        //shader data is compressed from server, unpack later
        compressedShaderData = (shader && shader[1]) ? shader[1] : null; //if not defined, not shader used

        BuildLocalFileSystem();

        /**
         * register a callback function when the emulator saves a file
         * @param  {string} filename
         * @param  {UInt8Array} contents
         * @return {undef}
         */
        self.module.emulatorFileWritten = function(filename, contents) {
            EmulatorFileWriteListener(filename, contents);
        };
    };

    /**
     * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadEmulator = function(system, deffered) {

        var frame  = $('<iframe/>', {
            src: '/load/emulator/' + system, //loads view code
            style: 'display:none',

            /**
             * on frame load
             * @return {undef}
             */
            load: function() {

                //find Module, FS and content window to return
                //they are uppercase as classes (and from retroarch), I convert them to members of the emulator class
                var fs = this.contentWindow.FS;
                var module = this.contentWindow.Module;
                var contentWindow = this.contentWindow;
                var contentDocument = this.contentDocument;

                /**
                 * override the monitorRunDependencies function for use with emulator loading
                 * @param  {number} left
                 * @return {undef}
                 */
                module.monitorRunDependencies = function(left) {
                    if (left === 0) {
                        deffered.resolve(module, fs, contentWindow, contentDocument, frame);
                    }
                };

                if (module.totalDependencies === 0) {
                    deffered.resolve(module, fs, contentWindow, contentDocument, frame);
                }
            }
        });
        $('body').append(frame);
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

        var location = config.assetpath + '/emulatorsupport/' + system + '.json';

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
     * @param  {string} title
     * @param  {string} file
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadGame = function(key, system, title, file, deffered) {

        var location = config.rompath + '/' + system + '/' + config.systemdetails[system].romcdnversion + '/';
        var flattened = config.flattenedromfiles;

        //if rom struture is flattened, this means that all rom files have been converted to single json files
        if (flattened) {

            var filename = _Compression.In.string(title + file);
            //location += '/' + system + '/a.json'; //encode twice: once for the trip, the second because the files are saved that way on the CDN
            location += encodeURIComponent(encodeURIComponent(filename)) + '.json'; //encode twice: once for the trip, the second because the files are saved that way on the CDN
        } else {
            location += title + '/' + file;
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
                var decompressed = _Compression.Out.string(response);
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

        var location = config.assetpath + '/shaders';

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
    //var BuildLocalFileSystem = function(module, system, file, gamedata, shaderData, compressedSupprtData) {
    var BuildLocalFileSystem = function() {

        var i;
        var content;

        self.module.FS_createFolder('/', 'games', true, true);

        //games are stored compressed in json. due to javascript string length limits, these can be broken up into several segments for larger files.
        //the compressedGameFiles object contains data for all files and their segments
        for (var gameFile in compressedGameData) {

            var filename = _Compression.Out.string(gameFile);
            var compressedGame = compressedGameData[gameFile];
            var views = [];
            var bufferLength = 0;

            //begin by decopressing all compressed file segments
            for (i = 0; i < compressedGame.length; ++i) {
                var decompressed = _Compression.Out.string(compressedGame[i]);
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
            self.module.FS_createDataFile('/games', filename, gamedata, true, true);
        }

        //set the start file
        self.module.arguments = ['-v', '-f', '/games/' + file];
        //self.module.arguments = ['-v', '--menu'];

        //emulator support, will be null if none
        if (compressedSupprtData) {
            var supportFiles = _Compression.Out.json(compressedSupprtData);
            if (supportFiles && self._FS) {
                for (var supportFile in supportFiles) {
                    content = _Compression.Out.bytearray(supportFiles[supportFile]);
                    try {
                        self._FS.createDataFile('/', supportFile, content, true, true);
                    } catch (e) {
                        //an error on file write.
                    }
                }
            }
        }

        //shaders
        self.module.FS_createFolder('/', 'shaders', true, true);
        var shaderPresetToLoad = null;

        //shader files, will be null if none used
        if (compressedShaderData) {
            var shaderFiles = _Compression.Out.json(compressedShaderData); //decompress shader files to json object of file names and data

            //if in coming shader parameter is an object, then it has shader files defined. self._FS is a handle to the
            //self.module's file system. Yes, the other operations here reference the file system through the module, you just don't have to anymore!
            if (shaderFiles && self._FS) {

                for (var shaderfile in shaderFiles) {
                    content = _Compression.Out.bytearray(shaderFiles[shaderfile]);
                    try {
                        self._FS.createDataFile('/shaders', shaderfile, content, true, true);
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
        try { self.module.FS_createFolder('/', 'etc', true, true); } catch (e) {}
        try { self.module.FS_createFolder('/', 'home', true, true); } catch (e) {}
        try { self.module.FS_createFolder('/home', 'web_user', true, true); } catch (e) {}
        try { self.module.FS_createFolder('/home/web_user/', 'retroarch', true, true); } catch (e) {}
        try { self.module.FS_createFolder('/home/web_user/retroarch', 'userdata', true, true); } catch (e) {}

        if (config.retroarch) {

            var retroArchConfig = config.retroarch; //in json
            var configItem;

            //system specific overrides
            if (config.systemdetails[system] && config.systemdetails[system].retroarch) {
                for (configItem in config.systemdetails[system].retroarch) {
                    retroArchConfig[configItem] = config.systemdetails[system].retroarch[configItem];
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
            self.module.FS_createDataFile('/home/web_user/retroarch/userdata', 'retroarch.cfg', configString, true, true);
            self.module.FS_createDataFile('/etc', 'retroarch.cfg', configString, true, true);
        }

        //screenshots
        self.module.FS_createFolder('/', 'screenshots', true, true);
    };

    /**
     * for screenshots, the emulator simply dumps the video buffer into a file 8 bytes at a time calling the write function
     * with each segment in the buffer. it doesn't seem to trigger a "file closed" or "finished writing file" notification.
     * To get around this, I'll use timers to understand when a file was essentially finished being written to.
     * @param  {string} key      unique game key, used to save state
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {string} filename the file name being saved by the emulator
     * @param  {UInt8Array} contents the contents of the file saved by the emulator
     * @return {undef}
     */
    var EmulatorFileWriteListener = function(filename, contents) {


        //clear timer if exists
        if (fileWriteTimers.hasOwnProperty(filename)) {
            clearTimeout(fileWriteTimers[filename]);
        }

        //write new timer
        fileWriteTimers[filename] = setTimeout(function() {

            //if timer runs out before being cleared again, delete it and call file written function
            delete fileWriteTimers[filename];
            EmulatorFileWritten(filename, contents);
        }, fileWriteDelay);
    };

    /**
     * listens to all events coming from emulator
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @return {undef}
     */
    var SetupEmulatorEventListener = function(system, title, file) {


        //emulator event handler for 1.0.0 emulators
        if (self.module && self.module.RI && self.module.RI.eventHandler) {

            var originalHandler = self.module.RI.eventHandler;
            
            /**
             * [eventHandler description]
             * @param  {Object} event
             * @return {undefined}
             */
            self.module.RI.eventHandler = function(event) {
                EmulatorEventListnener(event, 'keyup', originalHandler);
            };
        } 

        //emulator event handler for 2.0.0 emulators
        if (self.module && self.module.JSEvents) {
            
            /**
             * [crazyericsEventListener description]
             * @param  {Object} event
             * @return {undefined}
             */
            self.module.JSEvents.crazyericsEventListener = function(event) {
                EmulatorEventListnener(event, 'keydown');
            };
        }
    };

    /**
     * Function which handles events coming from emulator file.
     * @param  {event}   event      
     * @param  {string}   listenType 2.0.0 respond to keydown, 1.0.0 to keyup
     * @param  {Function} callback   optional
     * @return {undefined}              
     */
    var EmulatorEventListnener = function(event, listenType, callback) {


        switch (event.type) {
            case listenType:
                var key = event.keyCode;
                switch (key) {
                    case 70: // F - fullscreen
                        self.module.requestFullScreen(true, true);
                        $('#emulator').focus();
                    break;
                    case 49: //1 - save state
                        //setup deffered call to save state to server, need callbacks from state file and screenshot capture
                        saveStateDeffers.state = $.Deferred();
                        saveStateDeffers.screen = $.Deferred();

                        //use a timeout to clear deffers incase one of them never comes back, 1 sec is plenty. i see this return in about 50ms generally
                        var clearStateDeffers = setTimeout(function() {
                            saveStateDeffers = {};
                        }, 1000);

                        $.when(saveStateDeffers.state, saveStateDeffers.screen).done(function(statedetails, screendetails) {

                            clearTimeout(clearStateDeffers); //clear timeout from erasing deffers
                            saveStateDeffers = {}; //do the clear ourselves

                            _StateManager.SaveStateToServer(statedetails, screendetails);
                        });
                        _Emulator.SimulateEmulatorKeypress(84); //initiaze screenshot after its defer is in place.
                    break;
                    case 50: //2 - state slot decrease
                        self._activeStateSlot--;
                        if (self._activeStateSlot < 0) {
                            self._activeStateSlot = 0;
                        }
                    break;
                    case 51: //3 - state slot increase
                        self._activeStateSlot++;
                    break;
                }
            break;
        }
        if (callback) {
            callback(event);
        }
    };

    /**
     * this function is registered with the emulator when a file is written.
     * @param  {string} key      unique game key, used to save state
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {string} filename the file name being saved by the emulator
     * @param  {UInt8Array} contents the contents of the file saved by the emulator
     * @return {undef}
     */
    var EmulatorFileWritten = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit
        var screenshotmatch = filename.match(/\.bmp$|\.png$/);

        // match will return an array when match was successful, our capture group with the slot value, its 1 index
        if (statematch) {

            var slot = statematch[1] === '' ? 0 : statematch[1]; //the 0 state does not use a digit
            var data = _Compression.In.bytearray(contents);

            //if a deffered is setup for recieveing save state data, call it. otherwise, throw this state away (should never happen though!)
            if (saveStateDeffers.hasOwnProperty('state')) {
                saveStateDeffers.state.resolve(key, system, title, file, slot, data);
            }

            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var arrayBufferView = new Uint8Array(contents);

            //if a deffered from save state exists, use this screenshot for it and return
            if (saveStateDeffers.hasOwnProperty('screen')) {
                saveStateDeffers.screen.resolve(arrayBufferView);
                return;
            }

            $('p.screenshothelper').remove(); //remove helper text

            var width = $('#screenshotsslider div.slidercontainer').width() / 3; //550px is the size of the panel, the second number is how many screens to want to show per line
            var img = BuildScreenshot(system, arrayBufferView, width);

            $(img).addClass('close').load(function() {
                $(this).removeClass('close');
            });
            var a = $('<a class="screenshotthumb" href="' + img.src + '" download="' + title + '-' + filename + '"></a>'); //html 5 spec downloads image
            a.append(img).insertAfter('#screenshotsslider p');

            //kick open the screenshot slider
            _Sliders.Open('screenshotsslider', true);
        }
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
