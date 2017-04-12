/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulator = (function(_Compression, _PubSub, _config, _system, _title, _file, _key) {

    // private members
    var self = this;
    var _fileWriteTimeout = {};
    var _fileTimerDelay = 100;       //the amount of time we allow to pass in which we assume a file is no longer being written
    var _startToMenu = false;

    var _writeWriteCompleteHandlers = {};

    // public/protected members (on prototytpe)

    // public/protected methods
    this.createModule = function() {
        return new module();
    };

    //module def
    var module = (function() {

        this.noInitialRun = true;
        this.preRun = [];
        this.postRun = [];
        this.canvas = document.getElementById('emulator');
        
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
            console.log('Module wanted to rename title: ' + title);
        };

        this.setStatus = function(text) {
            
            //for now
            console.log(text);
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
        this.eventHandlersAttached = true;
        
        this.cachedEventHandlers = {
            window: {},
            document: {},
            keydown: {}
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
                
                //these are the event targets and types we care to track
                if (eventHandler.target == window) {
                    this.cachedEventHandlers.window[eventHandler.eventTypeString] = eventHandler;
                }
                if (eventHandler.target == document) {
                    this.cachedEventHandlers.document[eventHandler.eventTypeString] = eventHandler;
                }

                //in the case of keypress handlers
                if (eventHandler.eventTypeString == 'keydown') {
                    
                    var originalWork = eventHandler.handlerFunc;
                    
                    eventHandler.handlerFunc = function(event) {

                        //sometimes I want to influence behaviors before I begin
                        self.OnEmulatorKeydown(event, function(proceed) {

                            //perform original handler function
                            if (proceed) {
                                originalWork(event);
                            }
                        });
                    };

                    this.cachedEventHandlers.keydown[eventHandler.eventTypeString] = eventHandler;
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

                //local handlers
                if (_writeWriteCompleteHandlers[filename]) {

                    _writeWriteCompleteHandlers[filename](contents);
                    _writeWriteCompleteHandlers[filename] = null;
                    delete _writeWriteCompleteHandlers[filename];
                }

                //bubble up
                if (self.OnEmulatorFileWrite) {
                    self.OnEmulatorFileWrite(filename, contents);
                }

            }, _fileTimerDelay);
        };

        this.cesEmulatorFileRead = function(filename, contents) {

            //nothing yet
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
        this.giveEmulatorControlOfInput = function(giveEmulatorInput) {

            if (giveEmulatorInput) {

                //if giving back input, reassign all input handlers for both window and document
                if (this.JSEvents && this.JSEvents.registerOrRemoveHandler && !this.eventHandlersAttached) {
                        
                    for (eventHandler in this.cachedEventHandlers.window) {
                        this.JSEvents.registerOrRemoveHandler(this.cachedEventHandlers.window[eventHandler]);
                    }
                    for (eventHandler in this.cachedEventHandlers.document) {
                        this.JSEvents.registerOrRemoveHandler(this.cachedEventHandlers.document[eventHandler]);
                    }
                }

            } else {

                //if removing event handlers, made call and inform Module they are not attached
                if (this.JSEvents && this.JSEvents.removeAllHandlersOnTarget) {

                    this.JSEvents.removeAllHandlersOnTarget(window);
                    this.JSEvents.removeAllHandlersOnTarget(document);
                    this.eventHandlersAttached = false;
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
        this.BuildLocalFileSystem = function(compressedGameData, compressedSupprtData, compressedShaderData) {

            var i;
            var content;

            this.FS_createFolder('/', 'games', true, true);

            //games are stored compressed in json. due to javascript string length limits, these can be broken up into several segments for larger files.
            //the compressedGameFiles object contains data for all files and their segments
            for (var gameFile in compressedGameData) {

                var filename = _Compression.Unzip.string(gameFile);
                var compressedGame = compressedGameData[gameFile];
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
                this.FS_createDataFile('/games', filename, gamedata, true, true);
            }

            //set the start file
            if (!_startToMenu) {
                this.arguments = ['-v', '-f', '/games/' + _file];
            } else {
                this.arguments = ['-v', '--menu'];
            }

            //emulator support, will be null if none
            if (compressedSupprtData) {
                var supportFiles = _Compression.Unzip.json(compressedSupprtData);
                if (supportFiles) {
                    for (var supportFile in supportFiles) {
                        content = _Compression.Unzip.bytearray(supportFiles[supportFile]);
                        try {
                            this.FS_createDataFile('/', supportFile, content, true, true);
                        } catch (e) {
                            //an error on file write.
                        }
                    }
                }
            }

            //shaders
            this.FS_createFolder('/', 'shaders', true, true);
            var shaderPresetToLoad = null;

            //shader files, will be null if none used
            if (compressedShaderData) {
                var shaderFiles = _Compression.Unzip.json(compressedShaderData); //decompress shader files to json object of file names and data

                //if in coming shader parameter is an object, then it has shader files defined.
                if (shaderFiles) {

                    for (var shaderfile in shaderFiles) {
                        content = _Compression.Unzip.bytearray(shaderFiles[shaderfile]);
                        try {
                            this.FS_createDataFile('/shaders', shaderfile, content, true, true);
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
            try { this.FS_createFolder('/', 'home', true, true); } catch (e) {}
            try { this.FS_createFolder('/home', 'web_user', true, true); } catch (e) {}
            try { this.FS_createFolder('/home/web_user/', 'retroarch', true, true); } catch (e) {}
            try { this.FS_createFolder('/home/web_user/retroarch', 'userdata', true, true); } catch (e) {}

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
