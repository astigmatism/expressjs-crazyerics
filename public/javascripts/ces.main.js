var cesMain = (function() {

    // private members
    var self = this;
    var _config = {}; //the necessary server configuration data provided to the client
    var _tips = [
        'Hold R = Rewind',
        'Hold Space = Fast Forward',
        'F = Fullscreen',
        //'You can save your progress (or state) by pressing the 1 key, return to it anytime with the 4 key',
        //'We\'ll store all of your saves as long as you return within two weeks',
        'P = Pause',
        'Select a system from the dropdown to generate a new list of suggested games',
        'Select a system from the dropdown to search for foreign or obscure titles',
        'T = Take Screenshot',
        'H = Reset',
        '1 = Save Progress',
        'If you remain idle for 10 seconds, we auto-save your progress',
        '4 = Load last progress'
    ];
    var _bar = null;
    var _tipsCycleRate = 4000;
    var _preventLoadingGame = false;
    //var _preventGamePause = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
    var _minimumGameLoadingTime = 6000; //minimum amount of time to display the title loading. artificially longer for tips
    var _minimumSaveLoadingTime = 3000; //minimum amount of time to display the state loading screenshot
    var _delayToLoadStateAfterEmulatorStarts = 1000; //I was originally simulating keypresses before the emulator was running :P changed with 11-14 set
    var _defaultSuggestions = 60;
    var _suggestionsLoading = false;

    // instances/libraries
    var _Sync = null;
    var _Compression = null;
    var _PubSub = null;
    var _Preferences = null;
    var _Sliders = null;
    var _SavesManager = null;
    var _Emulator = null;
    var _Dialogs = null;
    var _BoxArt = null;
    var _Collections = null;
    var _Featured = null;
    var _Suggestions = null;
    var _SaveSelection = null;
    var _ProgressBar = null;
    var _Notifications = null;
    var _Tooltips= null;
    var _ClientCache = {}; //a consistant location to store items in client memory during a non-refresh session

    // public members
    
    this._macroToShaderMenu = [[112, 100], 40, 40, 40, 88, 88, 40, 40, 40, 37, 37, 37, 38, 88, 88, 90, 90, 38, 38, 38, 112]; //macro opens shader menu and clears all passes
    
    $(document).ready(function() {

        //load libraries
        
        _Compression = new cesCompression();

        _PubSub = new cesPubSub();
        
        //ui handles for the dialog class (add as needed, we want to only referece jquery in main if possible)
        _Dialogs = new cesDialogs($('#dialogs'), {
            'welcomefirst': $('#welcomemessage'),
            'welcomeback': $('#welcomeback'),
            'shaderselector': $('#systemshaderseletor'),
            'savedgameselector': $('#savedgameselector'),
            'gameloading': $('#gameloading'),
            'emulatorexception': $('#emulatorexception'),
            'saveloading': $('#saveloading'),
            'emulatorcleanup': $('#emulatorcleanup')
        });

        _Tooltips = new cesTooltips(_config, '.tooltip', '.tooltip-content');

        _ProgressBar = new cesProgressBar(loadingprogressbar);

        _Notifications = new cesNotifications(_config, _Compression, _PubSub, $('#notificationwrapper'));

        //unpack client data
        var clientdata = _Compression.Out.json(c20); //this name is only used for obfiscation

        _config = clientdata.config;

        _Sync = new cesSync(_config, _Compression);

        _BoxArt = new cesBoxArt(_config, _Compression);

        //auto capture trigger. comment out to avoid build
        //self._autoCaptureHarness('n64', _config.autocapture['n64'].shaders, 7000, 1, 10000);

        _Preferences = new cesPreferences(_Compression, _PubSub, clientdata.components.p);
        _Sync.RegisterComponent('p', _Preferences.Sync);

        _Collections = new cesCollections(_Compression, _Preferences, _BoxArt, _Sync, _Tooltips, PlayGame, $('#openCollectionGrid'), $('#collectionsGrid'), clientdata.components.c, _config.defaults.copyToFeatured, null);
        _Sync.RegisterComponent('c', _Collections.Sync);

        _Featured = new cesFeatured(_Compression, _Preferences, _BoxArt, _Sync, _Tooltips, PlayGame, _Collections, clientdata.components.f, null);

        //show welcome dialog
        if (_Collections.IsEmpty()) {
            _Dialogs.ShowDialog('welcomefirst', 150);
        } else {
            _Dialogs.ShowDialog('welcomeback', 150);
        }

        // TODO remove. for building icons
        // var gk = {
        //     "system": "snes",
        //     "title": "Super Mario World",
        //     "file": "Super Mario World (U) [!].smc",
        //     "gk": "eJyLVirOSy1W0lEKLi1ILVLwTSzKzFcIzy/KScEmpqARqqkQrRirV5ybrBQLAFxrE2Q="
        //   };
        // DisplayGameContext(gk, function() {
        // });

        //build console select for search (had to create a structure to sort by the short name :P)
        var shortnames = [];
        for (var system in _config.systemdetails) {
            _config.systemdetails[system].id = system;
            shortnames.push(_config.systemdetails[system]);
        }
        shortnames.sort(function(a, b) {
            if (a.shortname > b.shortname) {
                return 1;
            }
            if (a.shortname < b.shortname) {
                return -1;
            }
            return 0;
        });
        var shortnamesl = shortnames.length;
        for (var i = 0; i < shortnamesl; i++) {
            $('#search select').append('<option value="' + shortnames[i].id + '">' + shortnames[i].shortname + '</option>');
        }

        //loading dial
        $('.dial').knob();

        //console select
        $('#search select').selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                var system = $(this).val();

                if (system === 'all' || _config.systemdetails[system].cannedSuggestion) {
                    _Suggestions.Load(system, true, function() {
                        _Tooltips.Any();
                    }, true); //<-- load canned results
                }
                //default suggestions receipe for systems
                else {

                    var recipe = {
                        systems: {}
                    };
                    recipe.systems[system] = {
                        cache: 'above'
                    };

                    _Suggestions.Load(recipe, true, function() {
                        _Tooltips.Any();
                    });
                }

                 //show or hide the alpha bar in the suggestions panel
                if (system === 'all') {
                    $('#alphabar').hide();
                } else {
                    $('#alphabar').show();
                }
            }
        });

        //search field
        $('#search input').autoComplete({
            minChars: 3,
            cache: false,
            delay: 300,
            /**
             * trigger the run to the server with search term
             * @param  {string} term
             * @param  {Object} response
             * @return {undef}
             */
            source: function(term, response) {
                var system = $('#search select').val();
                $.getJSON('/search/' + system + '/' + term, function(data) {
                    response(_Compression.Out.json(data));
                });
            },
            /**
             * for each auto compelete suggestion, render output here
             * @param  {Array} item
             * @param  {string} search
             * @return {string}        html output
             */
            renderItem: function(item, search) {

                var gameKey = _Compression.Decompress.gamekey(item[0]);
                var $suggestion = $('<div class="autocomplete-suggestion" data-gk="' + gameKey.gk + '" data-searchscore="' + item[1] + '"></div>');
                var $box = _BoxArt.Get$(gameKey, 50);
                $suggestion.append($box);
                $suggestion.append('<div>' + gameKey.title + '</div>');
                return $('<div/>').append($suggestion).html(); //because .html only returns inner content
            },
            /**
             * on autocomplete select
             * @param  {Object} e    event
             * @param  {string} term search term used
             * @param  {Object} item dom element, with data
             * @return {undef}
             */
            onSelect: function(e, term, item) {
                var gameKey = _Compression.Decompress.gamekey(item.data('gk'));
                PlayGame(gameKey);
            }
        });

        //clicking on paused game overlay
        $('#emulatorwrapperoverlay')
            .on('click', function() {
                $('#emulator').focus();
            })
            .hover(
                function(event) {
                    event.stopPropagation();
                },
                function(event) {
                    event.stopPropagation();
                });

        //when user has scrolled to bottom of page, load more suggestions
        $(window).scroll(function() {
            if ($(window).scrollTop) {
                
                var x = $(window).scrollTop() + $(window).height();
                var y = $(document).height(); //- 100; //if you want "near bottom", sub from this amount

                if (x == y) {
                    if (_suggestionsLoading) {
                        return;
                    }
                    _suggestionsLoading = true;

                    _Suggestions.LoadMore(function() {
                        _suggestionsLoading = false;
                        _Tooltips.Any();
                    });
                }
            }
        });

        //stuff to do when at work mode is enabled
        //$('#titlebanner').hide();

        _Sliders = new cesSliders($('#slidericons'));

        _Suggestions = new cesSuggestions(_BoxArt, _Compression, _Tooltips, PlayGame, $('#suggestionsgrid'), $('#suggestionswrapper'));

        //begin by showing all console suggestions
        _Suggestions.Load('all', true, function() {
            _Tooltips.Any();
        }, true); //<-- canned

        //pubsub for any error
        _PubSub.Subscribe('error', self, function(message, error) {
            ShowErrorDialog(message, error);
        });

        //pubsub for notifications
        _PubSub.Subscribe('notification', self, function(message, priority, hold, icon, topic) {
            _Notifications.Enqueue(message, priority, hold, icon, topic);
        });

        //pubsub for when window is reloaded/closed
        $(window).unload(function() {
            //_PubSub.Publish('onbeforeunload');
            console.log('exiting');
        });

        //incoming params to open game now?
        // var openonload = _Preferences.Get('openonload') || {};
        // if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
        //     PlayGame(openonload.system, openonload.title, openonload.file);
        // }
    });

    /* public methods */

    /* private methods */

    //run this 
    var CloseEmulator = function(callback) {

        if (_Emulator) {

            //close game context, no callbacks needed
            HideGameContext();

            //emulator is running, exit gracefully to save sram
            _Emulator.ExitGracefully(null, function() {

                _Emulator = null;

                if (callback) {
                    callback();
                }
            });
        } 
        //no emulator, just callback
        else {
            if (callback) {
                callback();
            }
        }   
    };

    var ForceCloseEmulator = function() {
        if (_Emulator) {
            _Emulator.CleanUp(); //bypass the graceful exit routine and simply wipe it out
        } else {
            if (callback) {
                callback();
            }
        }   
    };

    /**
     * Prepare layout etc. for running a game! cleans up current too
     * @param  {GameKey} gameKey    required. see ces.compression for definition. members: system, title, file, gk
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var PlayGame = function (gameKey, slot, shader, callback) {

        //bail if attempted to load before current has finished
        if (_preventLoadingGame) {
            return;
        }

        _preventLoadingGame = true; //prevent loading any other games until this flag is lifted
        //_preventGamePause = false;

        window.scrollTo(0, 0); //will bring scroll to top of page (if case they clicked a suggestion, no need to scroll back up)

        //will clear up existing emulator if it exists
        CloseEmulator(function() {
            
            $('#emulatorcanvas').empty(); //ensure empty (there can be a canvas here if the user bailed during load)

            //close any dialogs
            _Dialogs.CloseDialog(null, function() {

                //close any sliders
                //_Sliders.Closeall();

                //close any notifications
                _Notifications.Reset();

                //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
                $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator" oncontextmenu="event.preventDefault()"></canvas>');

                //call bootstrap
                RetroArchBootstrap(gameKey, slot, shader, function() {

                    _preventLoadingGame = false;

                    if(callback) {
                        callback();
                    }
                });
            });
        });
    };

    /**
     * bootstrap function for loading a game with retroarch. setups animations, loading screens, and iframe for emulator. also destoryes currently running
     * @param  {GameKey} gameKey    required. see compression for class definition. Has members system, title, file, gk
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var RetroArchBootstrap = function(gameKey, slot, shader, callback) {

        //var box = cesGetBoxFront(_config, gameKey.system, gameKey.title, 170, true); //preload loading screen box
        _Collections.SetCurrentGameLoading(gameKey); //inform collections what the current game is so that they don't attempt to delete it during load

        //which emulator to load?
        EmulatorFactory(gameKey, function(err, emulator) {
            if (err) {
                //not sure how to handle this yet
                console.error(err);
                return;
            }

            _Emulator = emulator;

            // all deferres defined for separate network dependancies
            var emulatorLoadComplete = $.Deferred();
            var savePreferencesAndGetPlayerGameDetailsComplete = $.Deferred();

            _preventLoadingGame = false; //during shader select, allow other games to load

            //show shader selector. returns an object with shader details
            ShowShaderSelection(gameKey.system, shader, function(shaderselection) {

                _preventLoadingGame = true; //lock loading after shader select
                var gameLoadingStart = Date.now();

                _ProgressBar.Reset(); //before loading dialog, reset progress bar from previous

                //game load dialog show
                ShowGameLoading(gameKey, function(tipInterval) {

                    var optionsToSendToServer = {
                        shader: shaderselection.shader,  //name of shader file
                    };

                    //this call is a POST. Unlike the others, it is destined for the mongo instance (MY DOMAIN not a cdn). we send user preference data to the server in addition to getting game details.
                    SavePreferencesAndGetPlayerGameDetails(gameKey, optionsToSendToServer, savePreferencesAndGetPlayerGameDetailsComplete);

                    //run to my domain first to get details about the game before we retrieve it
                    $.when(savePreferencesAndGetPlayerGameDetailsComplete).done(function(gameDetails) {

                        var saves = gameDetails.saves;
                        var files = gameDetails.files;
                        var shaderFileSize = gameDetails.shaderFileSize; //will be 0 if no shader to load
                        var supportFileSize = _config.systemdetails[gameKey.system].supportfilesize; //will be 0 for systems without support
                        var info = {};
                        try {
                            info = JSON.parse(gameDetails.info);
                        } catch (e) {
                            //meh
                        }
                        var filesize = gameDetails.size;

                        //add this bail for when bulding featured collections
                        if (_config.defaults.copyToFeatured) {
                            _preventLoadingGame = false;
                            return;
                        }

                        //_ProgressBar.AddBucket('done', filesize * 0.05); //this represents the final work I need to do before the game starts (prevents bar from showing 1 until totally done)

                        //begin loading all content. I know it seems like some of these (game, emulator, etc) could load while the user
                        //is viewing the shader select, but I found that when treated as background tasks, it interfere with the performance
                        //of the shader selection ui. I think its best to wait until the loading animation is up to perform all of these
                        _Emulator.Load(_Emulator.createModule(), _ProgressBar, filesize, shaderselection.shader, shaderFileSize, supportFileSize, emulatorLoadComplete);

                        //when all deffered calls are ready
                        $.when(emulatorLoadComplete).done(function(emulatorLoaded) {

                            _Emulator.InitializeSavesManager(saves, gameKey);

                            //date copmany
                            if (info && info.Publisher && info.ReleaseDate) {
                                var year = info.ReleaseDate.match(/(\d{4})/);
                                $('#gametitlecaption').text(info.Publisher + ', ' +  year[0]);
                            }
                                
                            _preventLoadingGame = false; //during save select, allow other games to load

                            //are there saves to load? Let's show a dialog to chose from, if not - will go straight to start
                            _SaveSelection = new cesSaveSelection(_config, _Dialogs, _Emulator, gameKey.system, $('#savedgameselector'), function(err, selectedSaveTimeStamp, selectedSavescreenshot) {
                                
                                if (selectedSaveTimeStamp) {
                                    ShowSaveLoading(gameKey.system, selectedSavescreenshot);
                                }

                                _preventLoadingGame = true;

                                //calculate how long the loading screen has been up. Showing it too short looks dumb
                                var gameLoadingDialogUptime = Math.floor(Date.now() - gameLoadingStart);
                                var artificialDelayForLoadingScreen = gameLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - gameLoadingDialogUptime;

                                //set an artificial timeout based on the amount of time the loading screen was up
                                //lets ensure a minimum time has passed (see private vars)
                                setTimeout(function() {

                                    //_ProgressBar.Update('done', 1); //complete the progress bar here

                                    // load state? bails if not set
                                    _Emulator.WriteSaveData(selectedSaveTimeStamp, function(stateToLoad) { //if save not set, bails on null

                                        //begin game, callback is function which handles expections for any emulator error
                                        _Emulator.BeginGame(function(e) {
                                            clearInterval(tipInterval);
                                            _PubSub.Publish('error', ['There was an error with the emulator:', e]);
                                        });

                                        //this is a weird one I know.
                                        //The most reliable way I've found that the emulator is running and ready for input is when it
                                        //attempts to write to the window title. When that occurs for the first time,
                                        //we can begin to load a state (or not)
                                        _PubSub.SubscribeOnce('emulatorsetwindowtitle', self, function() {
                                            
                                            //load state? bails if null.. if valid, will show a new save loading dialog
                                            //and will load state. callback occurs after state has loaded
                                            LoadEmulatorState(gameKey.system, stateToLoad, function() {

                                                //close all dialogs (save loading or game loading), game begins!
                                                _Dialogs.CloseDialog(false, function() {

                                                    //stop rolling tips
                                                    $('#tips').stop().hide();
                                                    clearInterval(tipInterval);

                                                    //handle title and content fadein steps
                                                    DisplayGameContext(gameKey, function() {

                                                    });

                                                    //enlarge dialog area for emulator
                                                    _Dialogs.SetHeight($('#emulatorwrapper').outerHeight(), function() {
                                                        
                                                        //so I've found that tapping the fast forward key prevents the weird race condition on start.
                                                        //keep this until it seems disruptive
                                                        _PubSub.Mute('notification');
                                                        _Emulator._InputHelper.Keypress('fastforward', function() {
                                                            
                                                            _PubSub.Unmute('notification');
                                                            
                                                            //reveal emulator, control is game is given at this step
                                                            _Emulator.ReadyPlayerOne(function() {

                                                                window.scrollTo(0,0); //bring attention back up top
                                                            });
                                                            
                                                            //inform instances that game is starting (for those that care)
                                                            _Collections.RemoveCurrentGameLoading();
    
                                                            //with all operations complete, callback
                                                            if (callback) {
                                                                callback();
                                                            }
                                                        });
                                                    });
                                                });
                                            });
                                        }, true); //subscribe once, exclusive flag
                                    });
                                }, artificialDelayForLoadingScreen);
                            });
                        });
                    });
                });
            });
        });
    };

    var LoadEmulatorState = function(system, stateToLoad, callback) {

        if (!stateToLoad) {
            callback();
            return;
        }

        //build loading dialog with image
        var saveLoadingStart = Date.now();

        //create a subscription for when the state file will have finished loading, then resume
        _PubSub.SubscribeOnce('stateRead', self, function() {

            //keep in mind that this publish fires once the state has been loaded so the game is currently running
            // callback();
            // _Emulator._InputHelper.Keypress('mute');
            
            //just like game loading, show the save loading screen for a minimum time before pressing the load
            var saveLoadingDialogUptime = Math.floor(Date.now() - saveLoadingStart);
            var artificialDelayForLoadingScreen = saveLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - saveLoadingDialogUptime;

            //pause loaded state because we want to show the loading screen for a minimim amount of time
            _Emulator._InputHelper.Keypress('pause', function() {

                setTimeout(function() {
                    callback();

                    //unpause and unmute
                    _Emulator._InputHelper.Keypress('mute', function() {
                        _Emulator._InputHelper.Keypress('pause', function() {
                            _PubSub.Unmute('notification');
                        });
                    });

                }, _minimumSaveLoadingTime);
            });
        }, true); //sub once exclusive flag

        //start here
        _PubSub.Mute('notification'); //mute notifications during load
        _Emulator._InputHelper.Keypress('mute', function() {

            _Emulator._InputHelper.Keypress('loadstate');
        });
    };

    var ShowErrorDialog = function(message, e) {

        ForceCloseEmulator(function() {

            _preventLoadingGame = false; //in case it failed during start
            //_RecentlyPlayed.RemoveCurrentGameLoading();

            $('#emulatorexceptiondetails').text(message + '\r\n' + e);
            console.error(e);

            _Dialogs.ShowDialog('emulatorexception');
        });
    };

    var EmulatorFactory = function(gameKey, callback) {

        var emuExtention = _config.systemdetails[gameKey.system].emuextention;
        var emuExtentionFileName = 'ces.' + emuExtention + '.js';

        //get emulator extention file
        $.getScript(_config.paths.emulator_extensions + '/' + emuExtentionFileName).done(function(script, textStatus) {

                //ui handles for the emulator class (add as needed, we want to only referece jquery in main if possible)
                var ui = {
                    'wrapper': $('#emulatorwrapper'),
                    'canvas': $('#emulator')
                };

                //the class extention process: on the prototype of the ext, create using the base class.
                cesEmulator.prototype = new cesEmulatorBase(_Compression, _PubSub, _config, _Sync, gameKey, ui, _ClientCache);

                var emulator = new cesEmulator(_Compression, _PubSub, _config, _Sync, gameKey);

                //KEEP IN MIND: this pattern is imperfect. only the resulting structure (var emulator and later _Emulator)
                //will have access to data in both, cesEmulatorBase does not have knowledge of anything in cesEmulator
                
                callback(null, emulator);
            })
            .fail(function(jqxhr, settings, exception ) {
                callback(exception);
            }
        );
    };

    var OnEmulatorFileWrite = function(filename, contents, options) {
        
        if (type === 'screen') {

            var arrayBufferView = options.arrayBufferView;
            var system = options.system;
            var title = options.title;

            $('p.screenshothelper').remove(); //remove helper text

            var width = $('#screenshotsslider div.slidercontainer').width() / 3; //550px is the size of the panel, the second number is how many screens to want to show per line
            var img = BuildScreenshot(_config, system, arrayBufferView, width);

            $(img).addClass('close').load(function() {
                $(this).removeClass('close');
            });
            var a = $('<a class="screenshotthumb" href="' + img.src + '" download="' + title + '-' + filename + '"></a>'); //html 5 spec downloads image
            a.append(img).insertAfter('#screenshotsslider p');

            //kick open the screenshot slider
            //_Sliders.Open('screenshotsslider', true);
        }
    };

    /**
     * this functio handles showing the shader selection before a game is loaded
     * @param  {string}   system
     * @param  {string}   preselectedShader if a shader is predefined in the bootstap, it is passed along here
     * @param  {Function} callback
     * @return {undef}
     */
    var ShowShaderSelection = function(system, preselectedShader, callback) {

        $('#systemshaderseletor span').text(_config.systemdetails[system].shortname); //fix text on shader screen
        $('#shaderselectlist').empty(); //clear all previous content

        //bail early: check if shader already defined for this system (an override value passed in)
        if (typeof preselectedShader !== 'undefined') {
            callback({
                'shader': preselectedShader
            });
            return;
        }

        //bail early: check if user checked to use a shader for this system everytime
        //if they saved "No Processing" its an empty string
        var userpreference = _Preferences.Get('systems.' + system + '.shader');
        if (userpreference || userpreference == "") {
            callback({
                'shader': userpreference
            });
            return;
        }

        //get the recommended shaders list
        var recommended = _config.systemdetails[system].recommendedshaders;
        var shaderfamilies = _config.shaders;
        var i = 0;

        //suggest all (for debugging), remove when the ability to test all shaders is present
        // for (i; i < shaderfamilies.length; ++i) {
        //     $('#shaderselectlist').append($('<div style="display:block;padding:0px 5px;" data-shader="' + shaderfamilies[i] + '">' + shaderfamilies[i] + '</div>').on('click', function(e) {
        //         onFinish($(this).attr('data-shader'));
        //     }));
        // }

        $('#shaderselectlist').append($('<li class="zoom" data-shader=""><h3>No Processing</h3><img src="' + _config.paths.images + '/shaders/pixels.png" /></li>').on('click', function(e) {
            onFinish($(this).attr('data-shader'));
        }));

        for (i; i < recommended.length; ++i) {

            var key = recommended[i];

            $('#shaderselectlist').append($('<li class="zoom" data-shader="' + key.shader + '"><h3>' + key.title + '</h3><img src="' + _config.paths.images + '/shaders/' + key.shader + '.png" /></li>').on('click', function(e) {
                onFinish($(this).attr('data-shader'));
            }));
        }

        /**
         * when shader has been selected
         * @param  {string} shader
         * @return {undef}
         */
        var onFinish = function(shader) {
            $('#systemshaderseletorwrapper').addClass('close');
            
            var playerPreferencesToSave = {};
            var saveselection = false;

            //get result of checkbox
            if ($('#shaderselectcheckbox').is(':checked')) {
                saveselection = true;
                _Preferences.Set('systems.' + system + '.shader', shader); //we set a flag in pref when update to go out over the next request
            }

            setTimeout(function() {
                $('#systemshaderseletorwrapper').hide();
                callback({
                    'shader': shader
                });
            }, 250);
        };

        //show dialog
        _Dialogs.ShowDialog('shaderselector');
    };

    var ShowSaveLoading = function(system, screenshotData) {

        var $image = $(BuildScreenshot(_config, system, screenshotData, null, 200));
        $image.addClass('tada');
        $image.load(function() {
            $(this).fadeIn(200);
        });

        $('#saveloadingimage').empty().addClass('centered').append($image);

        _Dialogs.ShowDialog('saveloading');
    };

    var ShowGameLoading = function(gameKey, callback) {

        $('#tip').hide();
        $('#gameloadingname').show().text(gameKey.title);

        var box = _BoxArt.Get(gameKey, 200);
        var texture = _BoxArt.Get(gameKey, '256x256');
        var recipe = {};
        if (_config.loadingBoxRecipes[gameKey.system]) {
            recipe = _config.loadingBoxRecipes[gameKey.system];
        }
        
        var loadingWebGL = new cesLoadingWebGL(recipe, _Compression, _PubSub, _config.paths.textures, $('#webglloader'), box, texture, gameKey.system);

        //show tips on loading
        var randomizedTips = shuffle(_tips);
        var tipIndex = -1;
        var tipInterval = setInterval(function() {
            $('#gameloadingname').fadeOut(500);
            $('#tip').fadeOut(500, function() {
                
                ++tipIndex;
                if (tipIndex >= randomizedTips.length) {
                    tipIndex = 0;
                }

                var tip = randomizedTips[tipIndex];

                if (!$('#gameloading').is(':animated')) {
                    $('#tip').empty().append(tip).fadeIn(500);
                }

            });
        }, _tipsCycleRate); //show tip for this long

        _Dialogs.ShowDialog('gameloading', null, function() {
            callback(tipInterval);
        }); 
    };

    /**
     * build content area underneath emulator canvas
     * @param  {string}   system
     * @param  {string}   title
     * @param  {Function} callback
     * @return {undef}
     */
    var DisplayGameContext = function(gameKey, callback) {

        var box = _BoxArt.Get(gameKey, 170, function(loadedImage) {

            var img = $('<img src="' + loadedImage.src + '" />');

            $('#gamedetailsboxfront').empty().append(img);
            $('#gametitle').empty().hide().append(gameKey.title);

            // slide down background
            $('#gamedetailsboxfront img').addClass('close');
            $('#gamedetailsbackground').animate({
                height: 250
            }, 1000, function() {

                //fade in details
                $('#gamedetailswrapper').fadeIn(1000, function() {

                    $('#gamedetailsboxfront img').removeClass();

                    //load controls
                    $('#controlsslider').empty();
                    $.get('/layout/controls/' + gameKey.system, function(result) {
                        $('#controlsslider').append(result);
                    });

                    callback();
                });

                //needs to occur after fade in to understand dimensions
                $('#gametitle').bigText({
                    textAlign: 'left',
                    horizontalAlign: 'left'
                }); //auto size text to fit
            });

        });
    };

    var HideGameContext = function(callback) {

        //fade out game details
        $('#gamedetailsboxfront img').addClass('close');
        $('#gamedetailswrapper').fadeOut();
        $('#gamedetailsbackground').animate({
            height: 0
        }, 1000, function() {

            if (callback) {
                callback();
            }
        });
    };

    /**
     * Runs a series of keyboard instructions by keycode with optional delays between keystrokes
     * @param  {Object|Array}   instructions
     * @param  {Function} callback
     * @return {undef}
     */
    var runKeyboardMacro = function(instructions, callback) {


        //base case, either not an array or no more instructions are on queue
        if (!$.isArray(instructions) || instructions.length === 0) {
            if (callback) {
                callback();
            }
            return;
        }

        var keycode = instructions[0];
        var pause = 0;

        //if instruction contains code and pause length (in ms)
        if ($.isArray(keycode)) {
            keycode = keycode[0];
            if (keycode[1]) {
                pause = keycode[1];
            }
        }
        _Emulator._InputHelper.Keypress('', function() {
            runKeyboardMacro(instructions.slice(1), callback);
        });
    };

    /**
     * a trip to the server (same domain) to load an extra details about a game at load: states, rom files, ...
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {Object} all options to pass to server
     * @param  {Object} deffered
     * @return {undef}
     */
    var SavePreferencesAndGetPlayerGameDetails = function(gameKey, options, deffered) {

        //call returns not only states but misc game details. I tried to make this
        //part of the LoadGame call but the formatting for the compressed game got weird
        var url = '/games/load?gk=' + encodeURIComponent(gameKey.gk) + '&ts=' + new Date().getTime();

        _Sync.Post(url, options, function(data) {
            deffered.resolve(data);
        });
    };

    /**
     * generate a base64 encoded compressed string of the values necessary to load this game directly
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @return {string}
     */
    var GenerateLink = function(system, title, file) {
        return _Compression.In.string(encodeURI(system + '/' + title + '/' + file)); //prehaps slot for load state as query string?
    };

    /**
     * a quick function that downlaods all captured screens
     * @return {undef}
     */
    var DownloadAllScreens = function() {

        var delay = 500;
        var time = delay;

        $('.screenshotthumb').each(function(index) {


            setTimeout(function() {
                $(self)[0].click();
            }, delay);
            time += delay;
        });
    };

    return this;

})();

/**
 * css rotation animation helper and jquery extension
 * @param  {number} startingangle
 * @param  {number} angle
 * @param  {number} duration
 * @param  {string} easing
 * @param  {Function} complete
 * @return {Object}
 */
$.fn.animateRotate = function(startingangle, angle, duration, easing, complete) {
    var args = $.speed(duration, easing, complete);
    var step = args.step;
    return this.each(function(i, e) {
        args.complete = $.proxy(args.complete, e);
        /**
         * dont know, not my code
         * @param  {Date} now
         * @return {Object}
         */
        args.step = function(now) {
            $.style(e, 'transform', 'rotate(' + now + 'deg)');
            if (step) {
                return step.apply(e, arguments);
            }
        };

        $({deg: startingangle}).animate({deg: angle}, args);
    });
};

/**
 * common function to take arraybufferview of screenshot data and return a dom image. prodive width of image and we'll lookup aspect ration in config data
 * @param {string} system the system for which this screenshot belongs. used to look up aspect ratio
 * @param  {Array} arraybufferview
 * @param  {number} width
 * @return {Object}
 */
var BuildScreenshot = function(config, system, arraybufferview, width, height) {

    var screenratio = 1;
    var img;

    var blob = new Blob([arraybufferview], {
        type: 'image/bmp'
    });

    //get screen ratio from config
    if (config.systemdetails[system] && config.systemdetails[system].screenshotaspectratio) {
        screenratio = parseFloat(config.systemdetails[system].screenshotaspectratio);
    }

    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    
    if (width) {
        img = new Image(width, width / screenratio);        //create new image with correct ratio
    }
    if (height) {
        img = new Image(height * screenratio, height);        //create new image with correct ratio   
    }

    
    img.src = imageUrl;

    return img;
};

var shuffle = function(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};