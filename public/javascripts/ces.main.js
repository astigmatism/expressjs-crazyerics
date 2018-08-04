var cesMain = (function() {

    // private members
    var self = this;
    var _config = {}; //the necessary server configuration data provided to the client
    var _bar = null;
    var _maxNumberOfBanners = 8;
    var _preventLoadingGame = false;
    //var _preventGamePause = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
    var _minimumGameLoadingTime = 6000; //minimum amount of time to display the title loading. artificially longer for tips
    var _minimumSaveLoadingTime = 3000; //minimum amount of time to display the state loading screenshot
    var _delayToLoadStateAfterEmulatorStarts = 1000; //I was originally simulating keypresses before the emulator was running :P changed with 11-14 set
    var _suggestionsLoading = false;
    var _toolbars = {}; //handles to elements in the toolbar ui (select, search, etc)

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
    var _Gamepad = null;
    var _Images = null;
    var _ClientCache = {}; //a consistant location to store items in client memory during a non-refresh session

    // public members
    
    this._macroToShaderMenu = [[112, 100], 40, 40, 40, 88, 88, 40, 40, 40, 37, 37, 37, 38, 88, 88, 90, 90, 38, 38, 38, 112]; //macro opens shader menu and clears all passes
    
    $(document).ready(function() {

        //load libraries
        
        _Compression = new cesCompression();

        //unpack client data
        var clientdata = _Compression.Out.json(c20); //this name is only used for obfiscation

        _config = clientdata.config;

        _PubSub = new cesPubSub();

        _Images = new cesImages(_config);

        _Dialogs = new cesDialogs(_config, $('#dialogs'));

        _Tooltips = new cesTooltips(_config, _Images, '.tooltip', '.tooltip-content');

        _ProgressBar = new cesProgressBar(loadingprogressbar);

        _Notifications = new cesNotifications(_config, _Compression, _PubSub, $('#notificationwrapper'));

        _Sync = new cesSync(_config, _Compression);

        _BoxArt = new cesBoxArt(_config, _Compression);

        _Preferences = new cesPreferences(_Compression, _PubSub, clientdata.components.p);
        _Sync.RegisterComponent('p', _Preferences.Sync);

        _Gamepad = new cesGamePad(_config, _Compression, _PubSub, _Tooltips, _Preferences, _Dialogs, $('#gameid0'), $('#gameid1'));

        _Collections = new cesCollections(_config, _Compression, _Preferences, _Images, _Sync, _Tooltips, PlayGame, $('#openCollectionGrid'), $('#collectionsGrid'), clientdata.components.c, _config.defaults.copyToFeatured, null);
        _Sync.RegisterComponent('c', _Collections.Sync);

        _Featured = new cesFeatured(_config, _Compression, _Preferences, _Images, _Sync, _Tooltips, PlayGame, _Collections, clientdata.components.f, null);

        //register dialogs after setting up components
        var welcomeBack =  _Collections.IsEmpty() ? false : true;
        _Dialogs.Register('Welcome', 150, [], !welcomeBack);
        _Dialogs.Register('WelcomeBack', 150, [], welcomeBack);
        _Dialogs.Register('ConfigureGamepad', 700, [_Gamepad, _Compression]);
        _Dialogs.Register('ShaderSelection', 500, [_Preferences]);
        _Dialogs.Register('GameLoading', 500, [_BoxArt, _Compression, _PubSub]);
        _Dialogs.Register('SaveSelection', 500);
        _Dialogs.Register('SaveLoading', 500);
        _Dialogs.Register('Exception', 500);
        _Dialogs.Register('EmulatorCleanup', 300);
        _Dialogs.Register('PlayAgain', 150);

        _toolbars.select = $('#toolbar .systemfilter select');
        _toolbars.search = $('#toolbar .search input');

        

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
            _toolbars.select.append('<option value="' + shortnames[i].id + '">' + shortnames[i].shortname + '</option>');
        }

        //loading dial
        $('.dial').knob();

        //console select
        _toolbars.select.selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                var system = $(this).val();

                //clear the search field
                _toolbars.search.val('');

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
        _toolbars.search.autoComplete({
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
                var system = _toolbars.select.val();
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
                var img = document.createElement('img');
                $suggestion.append($(img));
                $suggestion.append('<div>' + gameKey.title + '</div>');

                _Images.BoxFront($(img), gameKey, function(status, success, content) {
                    
                    setTimeout(function() {
                        img.src = "data:image/jpg;base64,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"
                    }, 2000);

                }, 50);

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
                e.stopPropagation();
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

        _Sliders = new cesSliders(_config, _Compression, $('#slidericons'));

        _Suggestions = new cesSuggestions(_config, _Images, _Compression, _Tooltips, PlayGame, $('#suggestionsgrid'), $('#suggestionswrapper'));

        //begin by showing all console suggestions
        _Suggestions.Load('all', true, function() {
            _Tooltips.Any();
        }, true); //<-- canned

        //pubsub for any error
        _PubSub.Subscribe('error', self, function(message, error) {
            _Dialogs.Open("Exception", [message, error]);
            ForceCloseEmulator(function() {
                _preventLoadingGame = false; //in case it failed during start
            });
        });

        //pubsub for notifications
        _PubSub.Subscribe('notification', self, function(message, priority, hold, icon, topic) {
            _Notifications.Enqueue(message, priority, hold, icon, topic);
        });

        //pubsub for when window is reloaded/closed
        // $(window).unload(function() {
        //     //_PubSub.Publish('onbeforeunload');
        //     console.log('exiting');
        // });
        $(window).bind('beforeunload', function() {
            CloseEmulator(function() {
                return true;
            });
        });

        //title banner rotation easter egg
        var _currentBanner = Math.floor((Math.random() * _maxNumberOfBanners) + 1);
        $('#titlebanner').on('click', function() {
            _currentBanner = _currentBanner >= _maxNumberOfBanners ? 1 : _currentBanner + 1;
            $(this).css('background-image','url("' + _config.paths.images + '/titlebanners/' + _currentBanner + '.png")');
        });
        $('#titlebanner').trigger('click');
    });

    /* public methods */

    /* private methods */
    
    var CloseEmulator = function(callback) {

        if (_Emulator) {

            _Emulator.Hide(null, function() {

                HideGameContext(); //sliders, title, etc

                _Dialogs.Open("EmulatorCleanup", [], false, function() {

                    //emulator is running, exit gracefully to save sram
                    _Emulator.ExitGracefully(function() {

                        _Emulator = null;
                        return callback();
                    });
                });
            });
        } 
        //no emulator, just callback
        else {
            return callback();
        }   
    };

    var ForceCloseEmulator = function(callback) {
        
        if (_Emulator) {

            _Emulator.Hide(null, function() {

                HideGameContext(); //sliders, title, etc

                //bypass the graceful exit routine and simply wipe it out
                _Emulator.CleanUp(function() { 

                    _Emulator = null;
                    return callback();
                });
            });
        }
        return callback();
    };

    /**
     * Prepare layout etc. for running a game! cleans up current too
     * @param  {GameKey} gameKey    required. see ces.compression for definition. members: system, title, file, gk
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var PlayGame = function (gameKey, shader, callback) {

        //bail if attempted to load before current has finished
        if (_preventLoadingGame) {
            return;
        }

        _preventLoadingGame = true; //prevent loading any other games until this flag is lifted

        window.scrollTo(0, 0); //will bring scroll to top of page (if case they clicked a suggestion, no need to scroll back up)

        //will clear up existing emulator if it exists
        CloseEmulator(function() {
            
            $('#emulatorpositionhelper').empty(); //ensure empty (there can be a canvas here if the user bailed during load)

            //close any dialogs
            //_Dialogs.Close();

            //close any sliders
            //_Sliders.Closeall();

            //close any notifications
            _Notifications.Reset();

            //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
            $('#emulatorpositionhelper').append('<canvas tabindex="0" id="emulator" oncontextmenu="event.preventDefault()"></canvas>');

            //call bootstrap
            RetroArchBootstrap(gameKey, shader, function() {

                _preventLoadingGame = false;

                if(callback) {
                    callback();
                }
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
    var RetroArchBootstrap = function(gameKey, shader, callback) {

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
            _Dialogs.Open('ShaderSelection', [gameKey.system, shader], true, function(shaderSelection) {

                //configure controllers if not done so already
                _Gamepad.Configure(gameKey, function() {

                    _preventLoadingGame = true; //lock loading after shader select
                    var gameLoadingStart = Date.now();

                    _ProgressBar.Reset(); //before loading dialog, reset progress bar from previous

                    //game load dialog show
                    _Dialogs.Open('GameLoading', [gameKey], false, function(tipInterval) {

                        var optionsToSendToServer = {
                            shader: shaderSelection.shader,  //name of shader file
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
                            _Emulator.Load(_Emulator.createModule(), _ProgressBar, filesize, shaderSelection.shader, shaderFileSize, supportFileSize, emulatorLoadComplete);

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
                                ShowGameLoading(_Emulator, gameKey, function(err, selectedSaveTimeStamp, selectedSavescreenshot) {

                                    if (selectedSaveTimeStamp) {
                                        _Dialogs.Open('SaveLoading', [gameKey.system, selectedSavescreenshot]);
                                    }

                                    _preventLoadingGame = true;

                                    //calculate how long the loading screen has been up. Showing it too short looks dumb
                                    var gameLoadingDialogUptime = Math.floor(Date.now() - gameLoadingStart);
                                    var artificialDelayForLoadingScreen = gameLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - gameLoadingDialogUptime;

                                    //set an artificial timeout based on the amount of time the loading screen was up
                                    //lets ensure a minimum time has passed (see private vars)
                                    setTimeout(function() {

                                        // load state? bails if not set
                                        _Emulator.WriteSaveData(selectedSaveTimeStamp, function(stateToLoad) { //if save not set, bails on null

                                            //begin game, callback is function which handles expections for any emulator error
                                            _Emulator.StartEmulator(function(e) {
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
                                                    _Dialogs.Close(function() {

                                                        //stop rolling tips
                                                        $('#tips').stop().hide();
                                                        clearInterval(tipInterval);

                                                        //so I've found that tapping the fast forward key prevents the weird race condition on start.
                                                        //keep this until it seems disruptive
                                                        _PubSub.Mute('notification');
                                                        _Emulator._InputHelper.Keypress('fastforward', function() {
                                                            
                                                            _PubSub.Unmute('notification');

                                                            //enlarge dialog area for emulator
                                                            _Dialogs.SetHeight($('#emulatorwrapper').outerHeight(), function() {

                                                                //activate certain sliders
                                                                _Sliders.Activate('Controls', [gameKey, _Gamepad]);
                                                                _Sliders.Activate('Screenshots', [gameKey, _PubSub, _Tooltips, _Compression]);
                                                                _Sliders.Activate('Roms', [gameKey, files, _Compression, PlayGame]);
                                                                
                                                                //reqiure gamedb data to have info slider
                                                                if (!$.isEmptyObject(info)) {
                                                                    _Sliders.Activate('Info', [gameKey, info, _Images]);
                                                                }

                                                                //handle title and content fadein steps
                                                                //wait until height change before they appear
                                                                DisplayGameContext(gameKey, function() {

                                                                    //show controls slider by default (because it is always activated)
                                                                    _Sliders.Open('Controls');
                                                                });  
                                                                        
                                                                //reveal emulator, control is game is given at this step
                                                                _Emulator.ReadyPlayerOne(function() {

                                                                    window.scrollTo(0,0); //bring attention back up top
                                                                });

                                                                //pubsub for closing emulator from the top-level
                                                                _PubSub.SubscribeOnce('closeEmulator', self, function() {
                                                                    CloseEmulator(function() {

                                                                        _Dialogs.Open("PlayAgain");
                                                                    });
                                                                }, true); //exclusive meaning this is the only subscriber
                                                                
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
        });
    };

    var ShowGameLoading = function(_Emulator, gameKey, callback) {

        //bail state
        if ($.isEmptyObject(_Emulator.GetMostRecentSaves(1))) {
            callback('There are no recent saves to display');
            return;
        }

        _Dialogs.Open('SaveSelection',[_Emulator, gameKey.system], true, function(err, selectedSaveTimeStamp, selectedSavescreenshot) {
            callback(err, selectedSaveTimeStamp, selectedSavescreenshot);
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

    var EmulatorFactory = function(gameKey, callback) {

        var emuExtention = _config.systemdetails[gameKey.system].emuextention;
        var emuExtentionFileName = 'ces.' + emuExtention + '.js';

        //get emulator extention file
        $.getScript(_config.paths.emulator_extensions + '/' + emuExtentionFileName).done(function(script, textStatus) {

                //ui handles for the emulator class (add as needed, we want to only referece jquery in main if possible)
                var ui = {
                    'wrapper': $('#emulatorwrapper'),
                    'canvas': $('#emulator'),
                    'helper': $('#emulatorpositionhelper')
                };

                //the class extention process: on the prototype of the ext, create using the base class.
                cesEmulator.prototype = new cesEmulatorBase(_Compression, _PubSub, _config, _Sync, _Gamepad, _Preferences, gameKey, ui, _ClientCache);

                var emulator = new cesEmulator(_Compression, _PubSub, _config, _Sync, _Gamepad, _Preferences, gameKey);

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
     * build content area underneath emulator canvas
     * @param  {string}   system
     * @param  {string}   title
     * @param  {Function} callback
     * @return {undef}
     */
    var DisplayGameContext = function(gameKey, callback) {

        return;

        var box = _BoxArt.Get(gameKey, 170, function(loadedImage) {

            var img = $('<img src="' + loadedImage.src + '" />');

            $('#gamedetailsboxfront').empty().append(img);
            $('#gametitle').empty().hide().append(gameKey.title);

            // slide down background
            $('#gamedetailsboxfront img').addClass('close');
            // $('#gamedetailsbackground').animate({
            //     height: 250
            // }, 1000, function() {

                //fade in details
                $('#gamedetailswrapper').fadeIn(1000, function() {

                    $('#gamedetailsboxfront img').removeClass();
                    $('#controlsslider').empty();

                    callback();
                });

                //needs to occur after fade in to understand dimensions
                $('#gametitle').bigText({
                    textAlign: 'left',
                    horizontalAlign: 'left'
                }); //auto size text to fit
            //});
        });
    };

    var HideGameContext = function(callback) {

        //fade out game details
        $('#gamedetailsboxfront img').addClass('close');
        $('#gamedetailswrapper').fadeOut();
        $('#gametitlecaption').empty();

        _Sliders.DeactivateAll();

        // $('#gamedetailsbackground').animate({
        //     height: 0
        // }, 1000, function() {

            if (callback) {
                callback();
            }
        //});
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