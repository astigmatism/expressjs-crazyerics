/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {GameKey} _gameKey    see ces.compression for class definitions. members: system, title, file, gk
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulatorBase = (function(_Compression, _PubSub, _config, _Sync, _gameKey, _ui, _ClientCache) {

    // private members
    var self = this;
    var _isLoading = false;
    var _isPaused = false; //flag for the screen overlay pause
    var _isEmulatorPaused = false; //flag for emulator pause (with user input)
    var _isMuted = false;
    var _isSavingState = false;
    var _isLoadingState = false;
    var _hasStateToLoad = false; //flag for whether it is possible to load state
    var _gameBeganPlaying = false;
    var _cacheEmulatorScripts = true; //do we want to use _ClientCache to store emulator script responses (in raw form before globalEval)
    var _cacheName = _gameKey.system + '.script';
    var _loadPriority = 'emulator'; //emulator first, game first or null for simultanious

    var _displayDurationShow = 1000;
    var _displayDurationHide = 500;
    var _timeToWaitForScreenshot = 2000; //hopefully never take more than 2 sec
    var _timeToWaitForSaveState = 30000; //hopefully never more than 30 sec
    var _timeToWaitForEmulatorInstantiation = 500; //x2 once for global eval, again for instantiation

    //instances
    var _EmulatorInstance = null;
    var _Module = null;
    var _SavesManager = null;
    
    //protected instance
    this._InputHelper = null;

    //protected
    //this.loadedSaveData = null; //this is a space I use for indictaing a state file was written during load

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
                return callback(e);
            }
        }

        //pub subs
        _PubSub.Subscribe('saveready', self, OnNewSaveSubscription);
    };

    /**
     * Load all components necssary for game to run
     * @param {Object} module   from the emulator extention, this custom made module is extended to the emulators "module"
     * @param {string} shader   a shader selection or pre-defined
     * @param {Object} deffered when complete
     */
    this.Load = function(module, _ProgressBar, filesize, shader, shaderFileSize, supportFileSize, deffered) {

        var emulatorLoadComplete = $.Deferred();
        var supportLoadComplete = $.Deferred();
        var gameLoadComplete = $.Deferred();
        var shaderLoadComplete = $.Deferred();

        _isLoading = true;

        //setup progress bar
        var emulatorFileSize = _config.systemdetails[_gameKey.system].emusize;
        _ProgressBar.AddBucket('game', filesize);
        _ProgressBar.AddBucket('shader', shaderFileSize); //will be 0 if no shader to load, not effecting the progress bar
        _ProgressBar.AddBucket('support', supportFileSize); //will be 0 if no support
        //only create the bucket for the emaultor script if not in cache
        if (!_cacheEmulatorScripts || !_ClientCache.hasOwnProperty(_cacheName)) {
            _ProgressBar.AddBucket('emulator', emulatorFileSize);
        }

        //loading technique 1 -> emulator first

        LoadEmulatorScript(_ProgressBar, _gameKey.system, module, emulatorFileSize, emulatorLoadComplete);
        
        $.when(emulatorLoadComplete).done(function(a, b, c) {
            
            var emulator = [a,b,c]; //combine as it were

            LoadSupportFiles(_ProgressBar, _gameKey.system, supportFileSize, supportLoadComplete);
            LoadGame(_ProgressBar, filesize, gameLoadComplete);
            LoadShader(_ProgressBar, shader, shaderFileSize, shaderLoadComplete);

            $.when(emulatorLoadComplete, supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(emulator, support, game, shader) {
                
                _isLoading = false;
                OnAllLoadsComplete(emulator, support, game, shader);
                deffered.resolve(true);
            });
        });

        //loading technique 2 -> everything all at once

        // LoadEmulatorScript(_ProgressBar, _gameKey.system, module, emulatorFileSize, emulatorLoadComplete);
        // LoadSupportFiles(_ProgressBar, _gameKey.system, supportFileSize, supportLoadComplete);
        // LoadGame(_ProgressBar, filesize, gameLoadComplete);
        // LoadShader(_ProgressBar, shader, shaderFileSize, shaderLoadComplete);
        
        // $.when(emulatorLoadComplete, supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(emulator, support, game, shader) {

        //     _isLoading = false;
        //     OnAllLoadsComplete(emulator, support, game, shader);
        //     deffered.resolve(true);
        // });
    };

    this.WriteSaveData = function(timeStamp, callback) {

        //if null, we want to inform the loading process can continue with a load
        if (timeStamp) {

            _SavesManager.GetState(timeStamp, function(err, stateData) {
                if (err) {
                    callback(false);
                    return;
                }

                //determine state name
                var filenoextension = _gameKey.file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
                var statefilename = '/' + filenoextension + '.state';

                _Module.cesWriteFile('/states', statefilename, stateData, function() {

                    _hasStateToLoad = true;
                    callback(true); //true indicating there is a state to load now
                });
            });
        }
        else {
            callback(false); //false indicating there is not a save to load
            return;
        }
    };

    this.PauseGame = function() {
        if (_Module && !_isPaused) {
            
            self.GiveEmulatorControlOfInput(false);
            
            //if making a save during pause
            if (_isSavingState) {
                
                //mute these subscriptions
                _PubSub.Mute('screenshotWritten');
                _PubSub.Mute('stateWritten');
                
                //notification of save pause
                _PubSub.Publish('notification', ['Saving Paused', 1, true, false]);
            }

            //finally mute any notes
             _PubSub.Mute('notification');

            _Module.pauseMainLoop();
            _isPaused = true;
        }
    };

    this.ResumeGame = function() {
        if (_Module && _isPaused) {

            self.GiveEmulatorControlOfInput(true);
            _Module.resumeMainLoop();
            _isPaused = false;

            _PubSub.Unmute('notification');

            //if saving was in progress, unmute
            if (_isSavingState) {
                
                _PubSub.Unmute('screenshotWritten');
                _PubSub.Unmute('stateWritten');

                //again show saving note, 1 priority replaces "paused" doesnt matter if auto or not really
                _PubSub.Publish('notification', ['Saving Game Progress...', 1, true, true]); //1 priority intentional
            }
        }
    };

    this.Focus = function() {
        _ui.canvas.focus();
    };

    //emulator is revealed, control is given to player
    this.ReadyPlayerOne = function (duration, callback) {

        duration = duration || _displayDurationShow;

        self.Focus(); //give focus (also calls resume game, I took care of the oddities :P)

        $(_ui.wrapper).fadeIn(_displayDurationShow, function() {

            self.GiveEmulatorControlOfInput(true);

            //attach operation handlers
            AttachOperationHandlers();

            _gameBeganPlaying = Date.now();

            //subscribe to when user leaves, refreshes
            _PubSub.SubscribeOnce('onbeforeunload', function() {
                console.log('onbeforeunload, initiate graceful emulator exit');
            });

            //assign focus to emulator canvas
            _ui.canvas
                .blur(function(event) {
                    self.PauseGame();
                    $('#emulatorwrapperoverlay').fadeIn();
                })
                .focus(function() {
                    self.ResumeGame();
                    $('#emulatorwrapperoverlay').hide();
                });

            if (callback) {
                callback();
            }
        });
    };

    //moved to ExitGracefully
    // this.Hide = function (duration, callback) {

    //     duration = duration || _displayDurationHide;

    //     self.GiveEmulatorControlOfInput(false);
    //     $(_ui.wrapper).fadeOut(_displayDurationHide, function() {
            
    //         if (callback) {
    //             callback();
    //         }
    //     });
    // };

    //ok, to exit gracefully, the game is likely already paused because the user clicked elsewhere, triggering it to be paused
    this.ExitGracefully = function(duration, callback) {

        duration = duration || _displayDurationHide;

        //revoke input from player
        self.GiveEmulatorControlOfInput(false);

        //hide
        $(_ui.wrapper).fadeOut(_displayDurationHide, function() {
            
           //the emulator must be active to gracefully exit
            if (_isPaused) {
                self.ResumeGame();
            }
            _PubSub.Mute('notification');
            self._InputHelper.Keypress('mute', function() {

                //CRAZY! this is the key to successful emulator exit. We MUST get the final file write from a graceful exit to properly finish cleaning up
                //CHECK THIS WHEN UPGRADING EMAULTOR VERSIONS!
                _PubSub.SubscribeOnce('retroArchGracefulExit', self, function() {

                    return self.CleanUp(callback);
                });

                //EXIT!
                self._InputHelper.Keypress('exit', function() {

                    _PubSub.UnMute('notification');
                });
            }); 
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

        //important! tear down all topics subscribed in this class otherwise the handlers will remain and fire on the next instance of emulator
        _PubSub.Unsubscribe('saveready');
        _PubSub.Unsubscribe('screenshotWritten');
        _PubSub.Unsubscribe('stateWritten');

        //remove the saves manager component from sync
        _SavesManager = null;
        _Sync.DeregisterComponent('s');

        if (_Module) {

            //also unbinds events from document and window. this may have been done already through exit gracefully, but keep it as a sanity check
            self.GiveEmulatorControlOfInput(false);

            try {

                //calls exit on emulator ending loop (just to be safe)
                _Module.cesExit(); //see module class for implementation

            } catch (e) {

            }

            //we need to manually clear up the audio context
            if (_Module.RA && _Module.RA.context && _Module.RA.context.close) {
                 _Module.RA.context.close().then(function() {
                    //no need
                });
            }

            _Module = null;

            if (_EmulatorInstance) {
                _EmulatorInstance = null;
            }

            self._InputHelper = null;            
            
            $(_ui.canvas).remove(); //kill all events attached (keyboard, focus, etc)
        }

        callback();
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
     * @param  {string} filename the file name being saved by the emulator
     * @param  {UInt8Array} contents the contents of the file saved by the emulator
     * @return {undef}
     */
    this.OnEmulatorFileWrite = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)
        var screenshotmatch = filename.match(/\.bmp$|\.png$/);
        var srammatch = filename.match(/\.srm$/);

        // match will return an array when match was successful, our capture group with the slot value, its 1 index
        if (statematch) {

            _PubSub.Publish('stateWritten', [filename, contents]);
            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var screenDataUnzipped = new Uint8Array(contents);

            _PubSub.Publish('screenshotWritten', [filename, contents, screenDataUnzipped, _gameKey.system, _gameKey.title]);
            return;
        }

        if (srammatch) {

            console.log('emulator is outing save file!');
            return;
        }

        if (filename === 'retroarch.cfg') {
            _PubSub.Publish('retroArchConfigWritten', [contents]);
            return;
        }

        if (filename === 'retroarch-core-options.cfg') {
            _PubSub.Publish('retroArchGracefulExit', [contents]);
            return;
        }
    };

    this.OnEmulatorFileRead = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)

        if (statematch) {

            _PubSub.Publish('stateRead', [filename, contents]);
            OnStateLoaded();
            return;
        }
    };

    this.OnInputIdle = function() {

        //the keys are idle while the game runs! let's auto save
        MakeAutoSave();
    };

    /* exposed saves manager functionality */

    this.InitializeSavesManager = function(saveData, gameKey, callback) {

        _SavesManager = new cesSavesManager(_config, _Compression, _Sync, gameKey, saveData);
        _Sync.RegisterComponent('s', _SavesManager.Sync);
    };


    this.GetMostRecentSaves = function(count) { 

        return _SavesManager.GetMostRecentSaves(count);
    };

    this.MaximumSavesCheck = function() {

        return _SavesManager.MaximumSavesCheck();
    };

    //private methods

    var AttachOperationHandlers = function() {

        //save 

        self._InputHelper.RegisterKeydownOperationHandler('statesave', function(event, proceed, args) {

            if (_isSavingState || _isLoadingState) {
                proceed(false);
                return;
            }

            saveType = 'user';

            //the savetype can come in on args (auto)
            if (args && args.length && args[0]) {
                saveType = args[0];
            }

            CreateNewSave(saveType, proceed);
        });

        //screen

        self._InputHelper.RegisterKeydownOperationHandler('screenshot', function(event, proceed, args) {
            
            //dont show the screenshot note when making a save state=
            if (!_isSavingState) {
                _PubSub.Publish('notification', ['Saving Game Screenshot', 3, true, true, 'screenshotWritten']);
            }
            proceed(true);
        });

        //load

        self._InputHelper.RegisterKeydownOperationHandler('loadstate', function(event, proceed, args) {
            
            if (_isLoadingState || _isSavingState) {
                proceed(false);
                return;
            }

            //check if we've written a state file to load
            if (_hasStateToLoad) {
                _isLoadingState = true;
                _PubSub.Publish('notification', ['Loading Previous Saved Game Progress...', 3, true, true]);
                proceed(true);
            }
            else {
                _PubSub.Publish('notification', ['No Saved Game Progress to Load', 3, false, false]);
                proceed(false);
            }
        });

        //mute

        self._InputHelper.RegisterKeydownOperationHandler('mute', function(event, proceed, args) {
            _isMuted = !_isMuted;
            _PubSub.Publish('notification', [(_isMuted ? 'Game Audio Muted' : 'Game Audio Unmuted')]);
            proceed(true);
        });

        //pause

        self._InputHelper.RegisterKeydownOperationHandler('pause', function(event, proceed, args) {
            _isEmulatorPaused = !_isEmulatorPaused;
            if (_isEmulatorPaused) {
                self._InputHelper.CancelIdleTimeout();
                _PubSub.Publish('notification', ['Game Paused', 3, true, false, 'emulatorunpause']);
            }
            else {
                _PubSub.Publish('emulatorunpause');
            }
            proceed(true);
        });

        //reset

        self._InputHelper.RegisterKeydownOperationHandler('reset', function(event, proceed, args) {
            _PubSub.Publish('notification', ['Game Reset', 3, false, false]);
            proceed(true);
        });

        //condensing the simple keydown and keyup operations
        var DownUpHandlers = function(operation, message, topic) {

            self._InputHelper.RegisterKeydownOperationHandler(operation, function(event, proceed, args) {
                _PubSub.Publish('notification', [message, 3, true, true, topic]);
                _PubSub.Mute('notification'); //since the user is holding a key, prevent this note from showing again while down
                proceed(true);
            });

            self._InputHelper.RegisterKeyupOperationHandler(operation, function(event, proceed, args) {
                _PubSub.Unmute('notification');
                _PubSub.Publish(topic);
                proceed(true);
            });
        };

        //reverse
        DownUpHandlers('reverse', 'Rewinding', 'emulatorreverse');

        //slow motion
        DownUpHandlers('slowmotion', 'Slow Motion Active', 'emulatorslowmotion');

        //fast forward
        DownUpHandlers('fastforward', 'Fast Forwarding', 'emulatorfastforward');
    };

    var OnStateLoaded = function() {
        
        //sanity check
        if (_isLoadingState) {
        
            _PubSub.Publish('notification', ['Load Complete', 1, false, false]);
        
            _isLoadingState = false;
        }
    };

    var MakeAutoSave = function() {

        if (self._InputHelper) {
            self._InputHelper.Keypress('statesave', null, ['auto']);
        }
    };

    var CreateNewSave = function(saveType, proceedCallback) {

        //bail if already working
        if (_isSavingState) {
            proceedCallback(false);
            return;
        }

        _isSavingState = true;

        //show the notification
        if (saveType === 'user') {
            _PubSub.Publish('notification', ['Saving Game Progress...', 3, true, true]);
        }
        else if (saveType === 'auto') {
            _PubSub.Publish('notification', ['Auto Saving Game Progress...', 3, true, true]);
        }

        //before state save, perform a screen capture
        var removeScreenshotSubscription = _PubSub.SubscribeOnce('screenshotWritten', self, function(filename, contents, screenDataUnzipped, system, title) {

            clearTimeout(screenshotTimeout);

            if (screenDataUnzipped) {

                //it can take a while too, sucks
                var removeStateSubscription = _PubSub.SubscribeOnce('stateWritten', self, function(filename, stateDataUnzipped) {

                    clearTimeout(saveStateTimeout);

                    //ok, to publish a new save is ready, we require screen and state data
                    if (stateDataUnzipped && screenDataUnzipped) {

                        //will also close the notification
                        _PubSub.Publish('saveready', [saveType, screenDataUnzipped, stateDataUnzipped]);
                    }

                    _isSavingState = false;
                    _hasStateToLoad = true;

                }, true); //SubscribeOnce exclusive flag

                //just like with screenshots, create a timer to remove the subscription in case we never hear back
                var saveStateTimeout = setTimeout(function() {

                    removeStateSubscription();
                    _isSavingState = false;

                }, _timeToWaitForSaveState);

                
                proceedCallback(true); //allow original function to exe now that we have prepared our filesystem

            } else {

                proceedCallback(false);
            }
        }, true); //sub once, exclusive flag

        //if I never hear back about a new screenshot, then remove this sub
        var screenshotTimeout = setTimeout(function() {
            
            removeScreenshotSubscription();
            _isSavingState = false;

        }, _timeToWaitForScreenshot);

        //press key to begin screenshot capture
        self._InputHelper.Keypress('screenshot');

    };

    var OnNewSaveSubscription = function(saveType, screenDataUnzipped, stateDataUnzipped) {

        _SavesManager.AddSave(saveType, screenDataUnzipped, stateDataUnzipped, function() {

            _PubSub.Publish('notification', ['Save Complete', 1, false, false]);
        });
    };

    /**
     * A helper function to separate the post-response functionality from the LoadEmulator function
     * @param {Array} emulator
     * @param {Array} support
     * @param {Array} game
     * @param {Array} shader
     */
    var OnAllLoadsComplete = function(emulator, support, game, shader) {

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
    var LoadEmulatorScript = function(_ProgressBar, system, module, filesize, deffered) {

        //the path is made of three sections, 1) cdn or local 2) the extention name is the folder where they are stored 3) the file itself
        var scriptPath = _config.paths.emulators + '/' + _config.systemdetails[system].emuextention + '/' + _config.systemdetails[system].emuscript;

        var returnHelper = function(script) {

            //evaluate the response text and place it in the global scope
            $.globalEval(script);

            var emulatorScriptInstance = new cesRetroArchEmulator(module);
            
            console.log('emulator ready');

            //this timeout is important, it gives the previous steps (globalEval, instantiation) enough time
            //to sort themselves out. without this timeout, I get errors 
            setTimeout(function() {
                deffered.resolve(null, module, emulatorScriptInstance);
            }, _timeToWaitForEmulatorInstantiation);
        };

        //first check local cache
        if (_cacheEmulatorScripts && _ClientCache.hasOwnProperty(_cacheName)) {
            returnHelper(_ClientCache[_cacheName]);
            return;
        }

        LoadResource(scriptPath,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('emulator', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                
                _ProgressBar.Update('emulator', filesize);
                
                if (_cacheEmulatorScripts) {
                    _ClientCache[_cacheName] = response;
                }

                returnHelper(response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Emulator Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * Emulator support is any additional resources required by the emulator needed for play
     * This isnt included in the LoadEmulator call because sometimes support files are needed for an emulator
     * which can play 1several systems (Sega CD, support needed, Genesis, no support)
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadSupportFiles = function(_ProgressBar, system, supportFileSize, deffered) {

        //rely entirely on the filesize from the config to inform us if we are to seek support files
        if (supportFileSize === 0) {
            //system not handled, bail
            deffered.resolve();
            return;
        }

        //support location also includes a folder which must match the emulator version
        var location = _config.paths.supportfiles + '/' + _config.systemdetails[system].emuextention + '/' + system;

        LoadResource(location,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('support', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Support Files Parse Error:', e]);
                    return;
                }
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Support Files Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * load rom file from whatever is defined in the config "paths.roms" (CDN/crossdomain or local). will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
     * @param  {string} system
     * @param  {string} _gameKey.title
     * @param  {string} file
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadGame = function(_ProgressBar, filesize, deffered) {
        
        var filename = _Compression.Zip.string(_gameKey.title + _gameKey.file);
        var location = _config.paths.roms + '/' + _gameKey.system + '/' + _config.systemdetails[_gameKey.system].romcdnversion + '/';

        //encode twice: once for the trip, the second because the files are saved that way on the CDN
        location += encodeURIComponent(encodeURIComponent(filename));

        //converted from jsonp to straight up json. Seems to work. Going this route allows me to add
        //an event listener to progress for a download progress bar
        LoadResource(location,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('game', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                _ProgressBar.Update('game', filesize);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Game Parse Error:', e]);
                    return;
                }

                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Game Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * load a shader from whatever the imagepath is
     * @param  {string} name
     * @param  {Object} deffered
     * @return {undefined}
     */
    var LoadShader = function(_ProgressBar, name, shaderFileSize, deffered) {

        //if no shader selected or unknown filesize (shouls always be in the config), bail
        if (name === "" || shaderFileSize === 0) {
            deffered.resolve();
            return;
        }

        var location = _config.paths.shaders + '/' + name;

        LoadResource(location,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('shader', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Shader Parse Error:', e]);
                    return;
                }
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Shader Retrieval Error:', jqXHR.status]);
            }
        );
    };
    
    //a common function for retirving anything dynamically
    var LoadResource = function(location, onProgressUpdate, onSuccess, onFailure) {

        $.ajax({
            url: location,
            type: 'GET',
            crossDomain: true,
            dataType: 'text',
            cache: false,
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded);
                    }
                }, false);

                xhr.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded);
                    }
                }, false);

                return xhr;
            },
            success: onSuccess,
            error: onFailure
        });
    };

    return this;
});
