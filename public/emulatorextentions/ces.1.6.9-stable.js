/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulator = (function(_Compression, _PubSub, _config, _Sync, _GamePad, _Preferences, _gameKey, _Logging) {
    
        // private members
        var self = this;
        var _fileWriteTimeout = {};
        var _fileReadTimeout = {};
        var _fileTimerDelay = 100;       //the amount of time we allow to pass in which we assume a file is no longer being written
        
        
        //debugging
        var _startToMenu = false;
    
        // public/protected members (on prototytpe)
    
        // public/protected methods
        this.createModule = function() {
            return new module();
        };
    
        //module def
        var module = (function() {
    
            var _module = this;
    
            this.noInitialRun = true;
            this.preRun = [];
            this.postRun = [];
            this.canvas = document.getElementById('emulator');
            this.keydownHandler = null;
            
            //run now
            this.print = (function() {
                
                var element = document.getElementById('output');
                element.value = ''; // clear browser cache
    
                return function(text) {
                    text = Array.prototype.slice.call(arguments).join(' ');
                    element.value += text + "\n";
                };
            })();
    
            this.printErr = function(text) {
                var text = Array.prototype.slice.call(arguments).join(' ');
                var element = document.getElementById('output');
                element.value += text + "\n";
            };
    
            //an override to prevent
            this.setWindowTitle = function(title) {

                //I use this function to know the emulator is ready for input. watch this in the future!
                if (title) {
                    this.setWindowTitle = function(title) { return; }
                    _Logging.Console('ces.1.6.9-stable', 'Module wanted to rename title: ' + title + '. Disabling this function now');
                    _PubSub.Publish('emulatorseemsready');
                }
            };
    
            this.setStatus = function(text) {
                
                //for now
                _Logging.Console('ces.1.6.9-stable', 'setStatus -> ' + text);
                return;
    
                if (this.setStatus.interval) {
                    clearInterval(this.setStatus.interval);
                }
                var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
                var statusElement = document.getElementById('status');
                var progressElement = document.getElementById('progress');
                if (m) {
                    text = m[1];
                    progressElement.value = parseInt(m[2])*100;
                    progressElement.max = parseInt(m[4])*100;
                    progressElement.hidden = false;
                } else {
                    progressElement.value = null;
                    progressElement.max = null;
                    progressElement.hidden = true;
                }
                statusElement.innerHTML = text;
            };
            
            this.totalDependencies = 0;
            this.monitorRunDependencies = function(left) {
                this.totalDependencies = Math.max(this.totalDependencies, left);
                if (this) {
                    this.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
                }
            };
    
            /**
             * A custom function I add to the Module prototype for shutting down the current running Module
             * @return {undef}
             */
            this.cesExit = function() {
                this["noExitRuntime"] = false; //ok, at this time, this is how you tell the running script you want exit during runtime
                this.exit('Force closed by ces');
            };
    
    
            /**
             * window and document event handling control
             * OK! So we want keyboard input going to the emulator when it is in progress and we don't want it to when the emulator is paused
             * to accomplish this, we have to keep references to all events attached to both window and document, remove them when
             * paused and reapply them when resumed.
             * @type {Boolean}
             */
            var eventHandlersAttached = true;
            
            var cachedEventHandlers = {
                window: {},
                document: {}
            };
    
            /**
             * See work.js for insertion code.
             * Whenever a new event handler is registered in the emaultor, call this function back with the handler
             * @param  {Object} eventHandler
             * @return {undef}              
             */
            this.cesEventHandlerRegistered = function (eventHandler) {

                //ensure the current format
                if (eventHandler.target && eventHandler.eventTypeString) {
    
                    //a keydown handler will come through, lets handle it special like
                    if (eventHandler.eventTypeString == 'keydown') {
                        eventHandler = self._InputHelper.OverrideEmulatorKeydownHandler(eventHandler);
                    }
    
                    if (eventHandler.eventTypeString == 'keyup') {
                        eventHandler = self._InputHelper.OverrideEmulatorKeyupHandler(eventHandler);
                    }
    
                    //these are the event targets and types we care to track
                    if (eventHandler.target == window) {
                        cachedEventHandlers.window[eventHandler.eventTypeString] = eventHandler;
                    }
                    if (eventHandler.target == document) {
                        cachedEventHandlers.document[eventHandler.eventTypeString] = eventHandler;
                    }
                }
    
                return eventHandler;
            };
    
            /**
             * Files are written a chunk at a time. To know when a file has been written, it is no longer growing
             * @param  {string} filename [description]
             * @param  {array} contents the existing file's contents with the added chunk
             * @param  {number} length   the amount added since the last write
             * @param  {[type]} pointer  [description]
             * @param  {[type]} offset   [description]
             * @return {[type]}          [description]
             */
            this.cesEmulatorFileWritten = function(filename, contents) {
    
                var size = contents.length; //the total length of the file contents as they are written
    
                //still bring written, extend timer
                if (_fileWriteTimeout[filename]) {
    
                    clearTimeout(_fileWriteTimeout[filename]);
                }
                
                //create a timer which when expires, indicates that no more file writing is taking place
                _fileWriteTimeout[filename] = setTimeout(function() {
    
                    clearTimeout(_fileWriteTimeout[filename]);
    
                    delete _fileWriteTimeout[filename];
    
                    //bubble up
                    if (self.OnEmulatorFileWrite) {
                        self.OnEmulatorFileWrite(filename, contents);
                    }
    
                }, _fileTimerDelay);
            };
    
            this.cesEmulatorFileRead = function(filename, contents, iov, iovcnt, offset) {

                //still bring written, extend timer
                if (_fileReadTimeout[filename]) {
    
                    clearTimeout(_fileReadTimeout[filename]);
                }
    
                //create a timer which when expires, indicates that no more file writing is taking place
                _fileReadTimeout[filename] = setTimeout(function() {
    
                    clearTimeout(_fileReadTimeout[filename]);
    
                    delete _fileReadTimeout[filename];
    
                    //bubble up
                    if (self.OnEmulatorFileRead) {
                        self.OnEmulatorFileRead(filename, contents);
                    }
    
                }, _fileTimerDelay);
            };
    
            this.cesWriteFile = function(parent, filename, contents, callback) {

                var result = this.FS_createDataFile(parent, filename, contents, true, true);
    
                if (callback) {
                    callback(result);
                }
            };
    
            /**
             * This function is called when input is resumed on the emulator or it is taken away
             * @param  {bool} giveEmulatorInput
             * @return {undef}
             */
            this.GiveEmulatorControlOfInput = function(allowInput) {
    
                if (allowInput) {
    
                    //if giving back input, reassign all input handlers for both window and document
                    if (this.JSEvents && this.JSEvents.registerOrRemoveHandler && !eventHandlersAttached) {
    
                        for (eventHandler in cachedEventHandlers.window) {
                            this.JSEvents.registerOrRemoveHandler(cachedEventHandlers.window[eventHandler]);
                        }
                        for (eventHandler in cachedEventHandlers.document) {
                            this.JSEvents.registerOrRemoveHandler(cachedEventHandlers.document[eventHandler]);
                        }
                    }
    
                } else {
    
                    //if removing event handlers, made call and inform Module they are not attached
                    if (this.JSEvents && this.JSEvents.removeAllHandlersOnTarget) {
    
                        this.JSEvents.removeAllHandlersOnTarget(window);
                        this.JSEvents.removeAllHandlersOnTarget(document);
                        eventHandlersAttached = false;
                    }
    
                }
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
            this.BuildLocalFileSystem = function(gameKey, compressedGameData, compressedSupprtData, compressedShaderData) {
    
                var i;
                var content;

                //emulator support, all files must go into system dir (BIOS files at least, what i'm using this for)
                this.FS_createFolder('/', 'system', true, true);
                if (compressedSupprtData) {
                    for (var supportFile in compressedSupprtData) {
                        var content = _Compression.Unzip.bytearray(compressedSupprtData[supportFile]);
                        var filename = _Compression.Unzip.string(supportFile);
                        try {
                            this.FS_createDataFile('/system', filename, content, true, true);
                        } catch (e) {
                            //an error on file write.
                        }
                    }
                }
    
                this.FS_createFolder('/', 'games', true, true);
    
                var fileToLoad = _gameKey.file;
    
                //games are stored compressed in json. due to javascript string length limits, these can be broken up into several segments for larger files.
                //the compressedGameFiles object contains data for all files and their segments
                if (compressedGameData.hasOwnProperty('b')) {
                    fileToLoad = _Compression.Unzip.string(compressedGameData.b);
                }
                
                //the f property are files
                if (compressedGameData.hasOwnProperty('f')) {
                    for (var gameFile in compressedGameData.f) {
    
                        //end special case
    
                        var filename = _Compression.Unzip.string(gameFile);
                        var compressedGame = compressedGameData.f[gameFile];
                        var views = [];
                        var bufferLength = 0;
    
                        //begin by decopressing all compressed file segments
                        for (i = 0; i < compressedGame.length; ++i) {
                            var view = _Compression.Unzip.bytearray(compressedGame[i]);
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
                        this.FS_createDataFile('/games', filename, gamedata, true, true);
                    }
                }
    
                //set the start file
                if (!_startToMenu) {
                    this.arguments = ['-v', '-f', '/games/' + fileToLoad];
                } else {
                    this.arguments = ['-v', '--menu'];
                }
    
                //shaders
                this.FS_createFolder('/', 'shaders', true, true);
                var shaderPresetToLoad = null;
    
                //shader files, will be null if none used
                if (compressedShaderData && compressedShaderData.hasOwnProperty('f')) {
                    for (var shaderFile in compressedShaderData.f) {
    
                        var filename = _Compression.Unzip.string(shaderFile);
                        var content = _Compression.Unzip.bytearray(compressedShaderData.f[shaderFile]);
    
                        //write to emaultor
                        try {
                            this.FS_createDataFile('/shaders', filename, content, true, true);
                        } catch (e) {
                            //an error on file write.
                        }
    
                        //is file a glslp shader preset? if so, save to define in config for auto load
                        if (filename.match(/\.glslp$/g)) {
                            shaderPresetToLoad = filename;
                        }
                    }
                }
    
                //config, must be after shader
                //wrap folder creation in catch since error is thrown if exists
                try { this.FS_createFolder('/', 'home', true, true); } catch (e) {}
                try { this.FS_createFolder('/home', 'web_user', true, true); } catch (e) {}
                try { this.FS_createFolder('/home/web_user/', 'retroarch', true, true); } catch (e) {}
                try { this.FS_createFolder('/home/web_user/retroarch', 'userdata', true, true); } catch (e) {}
    
                if (_config.retroarch['1.6.9-stable']) {
    
                    var retroArchConfig = _config.retroarch['1.6.9-stable'].config //in json
                    var configItem;
    
                    //system specific overrides
                    if (_config.systemdetails[_gameKey.system] && _config.systemdetails[_gameKey.system].retroarch) {
                        for (configItem in _config.systemdetails[_gameKey.system].retroarch) {
                            retroArchConfig[configItem] = _config.systemdetails[_gameKey.system].retroarch[configItem];
                        }
                    }
    
                    if (shaderPresetToLoad) {
                        retroArchConfig.video_shader = '/shaders/' + shaderPresetToLoad;
                    }
    
                    var configString = '';
    
                    //convert json to string delimited list
                    for (configItem in retroArchConfig) {
                        configString +=  configItem + ' = ' + retroArchConfig[configItem] + '\n';
                    }

                    //get input assignments
                    configString += self._InputHelper.BuildInputConfiguration(gameKey);
    
                    this.FS_createDataFile('/home/web_user/retroarch/userdata', 'retroarch.cfg', configString, true, true);
                }
    
                //screenshots
                this.FS_createFolder('/', 'screenshots', true, true);
    
                //state save location
                this.FS_createFolder('/', 'states', true, true);
    
                //save file location
                this.FS_createFolder('/', 'saves', true, true);
            };
    
            return this;
        });
    
        return this;
    });
    