var cesMain = (function() {

    // private members
    var self = this;
    var _config = {}; //the necessary server configuration data provided to the client
    var _tips = [
        'Back out of that mistake you made by holding the R key to rewind the game',
        'Press the Space key to fast forward through those story scenes',
        'If your browser supports it, you can go fullscreen by pressing the F key',
        //'You can save your progress (or state) by pressing the 1 key, return to it anytime with the 4 key',
        'We\'ll store all of your saves as long as you return within two weeks',
        'Pause your game with the P key',
        'Select a system from the dropdown to generate a new list of suggested games',
        'To search for more obsurace or forgeign titles, select a system from the dropdown first',
        'Take a screenshot with the T key. Missed that moment? Rewind with R and capture again!',
        'Screenshots are deleted when you leave or refresh the page. Download your favorites to keep them'
    ];
    var _tipsCycleRate = 3000;
    var _preventLoadingGame = false;
    var _preventGamePause = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
    var _minimumGameLoadingTime = 6000; //have to consider tips (make longer) and transition times
    var _minimumSaveLoadingTime = 3000; //have to consider tips (make longer) and transition times
    var _defaultSuggestions = 60;
    var _suggestionsLoading = false;

    // instances/libraries
    var _Compression = null;
    var _PubSub = null;
    var _PlayerData = null;
    var _Sliders = null;
    var _SavesManager = null;
    var _Emulator = null;
    var _Dialogs = null;
    var _RecentlyPlayed = null;
    var _Suggestions = null;
    var _SaveSelection = null;

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

        //unpack client data
        var clientdata = _Compression.Out.json(c20); //this name is only used for obfiscation

        _config = clientdata.configdata;

        //auto capture trigger. comment out to avoid build
        //self._autoCaptureHarness('n64', _config.autocapture['n64'].shaders, 7000, 1, 10000);

        //setup const instances

        //unpack playerdata
        _PlayerData = new cesPlayerData(_Compression, clientdata.playerdata); //player data is user specific, can be dynmic

        _RecentlyPlayed = new cesRecentlyPlayed(_config, _Compression, PlayGame, $('#recentlyplayedgrid'), _PlayerData.GetPlayHistory(), _PlayerData.RemoveFromPlayHistory);

        //show welcome dialog
        if ($.isEmptyObject(_PlayerData.playHistory)) {
            _Dialogs.ShowDialog('welcomefirst', 200);
        } else {
            _Dialogs.ShowDialog('welcomeback', 200);
        }

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

                var recipe = {
                    systems: {},
                    count: 100
                };
                recipe.systems[system] = {
                    proportion: 100,
                    set: (system === 'all') ? 0 : 1
                };

                _Suggestions.Load(recipe, true, function() {
                    toolTips();
                });

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

                /*
                item: [
                    game name,
                    rom file name,
                    system,
                    search score
                ]
                 */
                var suggestion = $('<div class="autocomplete-suggestion" data-title="' + item[0] + '" data-file="' + item[1] + '" data-system="' + item[2] + '" data-searchscore="' + item[3] + '"></div>');
                suggestion.append(cesGetBoxFront(_config, item[2], item[0], 50));
                suggestion.append('<div>' + item[0] + '</div>');
                return $('<div/>').append(suggestion).html(); //because .html only returns inner content
            },
            /**
             * on autocomplete select
             * @param  {Object} e    event
             * @param  {string} term search term used
             * @param  {Object} item dom element, with data
             * @return {undef}
             */
            onSelect: function(e, term, item) {
                PlayGame(item.data('system'), item.data('title'), item.data('file'));
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
                        toolTips();
                    });
                }
            }
        });

        //for browsing with alpha characters
        $('#suggestionswrapper a').each(function(index, item) {
            $(item).on('click', function(e) {
                var system = $('#search select').val();
                var term = $(item).text();
                _Suggestions.Load('/suggest/browse/' + system + '?term=' + term, false, function() {
                    toolTips();
                });
            });
        });

        //stuff to do when at work mode is enabled
        //$('#titlebanner').hide();

        _Sliders = new cesSliders();

        _Suggestions = new cesSuggestions(_config, _Compression, PlayGame, $('#suggestionsgrid'));

        //begin by showing all console suggestions
        _Suggestions.Load({
            systems: {
                all: {
                    proportion: 100,
                    set: 0
                }
            },
            count: 100
        }, true, function() {
            toolTips();
        });

        

        //incoming params to open game now?
        var openonload = _PlayerData.Get('openonload') || {};
        if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
            PlayGame(openonload.system, openonload.title, openonload.file);
        }
    });

    /* public methods */

    /* private methods */

    var CleanUpEmulator = function(callback) {

        if (_Emulator) {

            //hide emulator, input is taken away
            _Emulator.Hide(null, function() {   

                //close game context, no callbacks needed
                HideGameContext();

                //clean up attempts to remove all events, frees memory (yeah I wish)
                _Emulator.CleanUp(function() {

                    _Emulator = null;

                    if (callback) {
                        callback();
                    }
                });
                
            });
        } 
        //no emulator, just callback
        else {
            if (callback) {
                callback();
            }
        }   
    };

    /**
     * Prepare layout etc. for running a game! cleans up current too
     * @param  {string} system      [snes, nes, gb, gba, gen ... ]
     * @param  {string} title       the rom game title (seen as the folder name in the file system)
     * @param  {string} file        the rom file which to load
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var PlayGame = function (system, title, file, slot, shader, callback) {

        //bail if attempted to load before current has finished
        if (_preventLoadingGame) {
            return;
        }

        _preventLoadingGame = true; //prevent loading any other games until this flag is lifted
        _preventGamePause = false;

        window.scrollTo(0, 0); //will bring scroll to top of page (if case they clicked a suggestion, no need to scroll back up)

        //will clear up existing emulator if it exists
        CleanUpEmulator(function() {
            
            $('#emulatorcanvas').empty(); //ensure empty (there can be a canvas here if the user bailed during load)

            //close any dialogs
            _Dialogs.CloseDialog(null, function() {

                //close any sliders
                _Sliders.Closeall();

                //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
                $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator" oncontextmenu="event.preventDefault()"></canvas>');

                //call bootstrap
                RetroArchBootstrap(system, title, file, slot, shader, function() {

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
     * @param  {string} system      [snes, nes, gb, gba, gen ... ]
     * @param  {string} title       the rom game title (seen as the folder name in the file system)
     * @param  {string} file        the rom file which to load
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var RetroArchBootstrap = function(system, title, file, slot, shader, callback) {

        var key = _Compression.In.gamekey(system, title, file); //create key for anything that might need it
        var box = cesGetBoxFront(_config, system, title, 170); //preload loading screen box
        _RecentlyPlayed.SetCurrentGameLoading(key); //inform recently played what the current game is so that they don't attempt to delete it during load

        //which emulator to load?
        EmulatorFactory(system, title, file, key, function(err, emulator) {
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
            ShowShaderSelection(system, shader, function(shaderselection) {

                _preventLoadingGame = true; //lock loading after shader select
                var gameLoadingStart = Date.now();


                //game load dialog show
                ShowGameLoading(system, title, box, function(tipInterval) {

                    //this call is a POST. Unlike the others, it is destined for the mongo instance (MY DOMAIN not a cdn). we send user preference data to the server in addition to getting game details.
                    SavePreferencesAndGetPlayerGameDetails(key, system, title, file, { 
                        'savePreference': shaderselection.savePreference, 
                        'shader': shaderselection.shader 
                    }, savePreferencesAndGetPlayerGameDetailsComplete);

                    //run to my domain first to get details about the game before we retrieve it
                    $.when(savePreferencesAndGetPlayerGameDetailsComplete).done(function(compressedGameDetails) {

                        //decompress game details here since we need state data for selection
                        var gameDetails = _Compression.Out.json(compressedGameDetails);
                        var saves = gameDetails.saves;
                        var files = gameDetails.files;
                        var info = gameDetails.info;
                        var filesize = gameDetails.size;

                        //begin loading all content. I know it seems like some of these (game, emulator, etc) could load while the user
                        //is viewing the shader select, but I found that when treated as background tasks, it interfere with the performance
                        //of the shader selection ui. I think its best to wait until the loading animation is up to perform all of these
                        _Emulator.Load(_Emulator.createModule(), filesize, shaderselection.shader, emulatorLoadComplete);

                        //when all deffered calls are ready
                        $.when(emulatorLoadComplete).done(function(emulatorLoaded) {

                            _Emulator.InitializeSavesManager(saves, key);

                            //date copmany
                            if (info && info.Publisher && info.ReleaseDate) {
                                var year = info.ReleaseDate.match(/(\d{4})/);
                                $('#gametitlecaption').text(info.Publisher + ', ' +  year[0]);
                            }
                                
                            _preventLoadingGame = false; //during save select, allow other games to load

                            //are there saves to load? Let's show a dialog to chose from, if not - will go straight to start
                            _SaveSelection = new cesSaveSelection(_config, _Dialogs, _Emulator, system, $('#savedgameselector'), function(err, selectedSaveTimeStamp, selectedSavescreenshot) {
                                
                                if (selectedSaveTimeStamp) {
                                    ShowSaveLoading(system, selectedSavescreenshot);
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
                                        _Emulator.BeginGame(OnEmulatorException);

                                        //before going any further, we can correctly assume that once the config
                                        //is written, the file system is ready for us to read from it
                                        _PubSub.SubscribeOnce('retroArchConfigWritten', self, function() {

                                            //load state? bails if null.. if valid, will show a new save loading dialog
                                            //and will load state. callback occurs after state has loaded
                                            LoadEmulatorState(system, stateToLoad, function() {

                                                //close all dialogs (save loading or game loading), game begins!
                                                _Dialogs.CloseDialog(false, function() {

                                                    //stop rolling tips
                                                    $('#tips').stop().hide();
                                                    clearInterval(tipInterval);

                                                    //handle title and content fadein steps
                                                    DisplayGameContext(system, title, function() {

                                                    });

                                                    //enlarge dialog area for emulator
                                                    _Dialogs.SetHeight($('#emulatorwrapper').outerHeight(), function() {

                                                        //assign focus to emulator canvas
                                                        $('#emulator')
                                                            .blur(function(event) {
                                                                if (!_preventGamePause) {

                                                                    _Emulator.PauseGame();
                                                                    $('#emulatorwrapperoverlay').fadeIn();
                                                                }
                                                            })
                                                            .focus(function() {
                                                                window.scrollTo(0, 0); //bring attention back up top
                                                                _Emulator.ResumeGame();
                                                                $('#emulatorwrapperoverlay').hide();
                                                            });

                                                        //reveal emulator
                                                        _Emulator.Show(); //also input is given to canvas in this step

                                                        $('#emulator').focus(); //give focus (also calls resume game, I took care of the oddities :P)

                                                        //inform instances that game is starting (for those that care)
                                                        _RecentlyPlayed.RemoveCurrentGameLoading();

                                                        //with all operations complete, callback
                                                        if (callback) {
                                                            callback();
                                                        }
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
                    _Emulator._InputHelper.Keypress('pause', function() {
                        _Emulator._InputHelper.Keypress('mute');
                    });

                }, _minimumSaveLoadingTime);
            });
        }, true); //sub once exclusive flag

        _Emulator._InputHelper.Keypress('mute', function() {

            _Emulator._InputHelper.Keypress('loadstate');
        });
    };

    var OnEmulatorException = function(e) {

        CleanUpEmulator(function() {

            _preventLoadingGame = false; //in case it failed during start

            $('#emulatorexceptiondetails').text(e);
            console.error(e);

            _Dialogs.ShowDialog('emulatorexception');
        });
    };

    var EmulatorFactory = function(system, title, file, key, callback) {

        var emuExtention = _config.systemdetails[system].emuextention;
        var emuExtentionFileName = 'ces.' + emuExtention + '.js';

        //get emulator extention file
        $.getScript(_config.emuextentionspath + '/' + emuExtentionFileName).done(function(script, textStatus) {

                //ui handles for the emulator class (add as needed, we want to only referece jquery in main if possible)
                var ui = {
                    'wrapper': $('#emulatorwrapper'),
                    'canvas': $('#emulator')
                }

                //the class extention process: on the prototype of the ext, create using the base class.
                cesEmulator.prototype = new cesEmulatorBase(_Compression, _PubSub, _config, system, title, file, key, ui);

                var emulator = new cesEmulator(_Compression, _PubSub, _config, system, title, file, key);

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
                'shader': preselectedShader,
                'savePreference': false
            });
            return;
        }

        //bail early: check if user checked to use a shader for this system everytime
        var userpreference = _PlayerData.GetShader(system);
        if (userpreference) {
            callback({
                'shader': userpreference,
                'savePreference': false
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

        $('#shaderselectlist').append($('<li class="zoom" data-shader=""><h3>No Processing</h3><img class="tada" src="' + _config.assetpath + '/images/shaders/' + system + '/pixels.png" /></li>').on('click', function(e) {
            onFinish($(this).attr('data-shader'));
        }));

        for (i; i < recommended.length; ++i) {

            var key = recommended[i];

            $('#shaderselectlist').append($('<li class="zoom" data-shader="' + key.shader + '"><h3>' + key.title + '</h3><img src="' + _config.assetpath + '/images/shaders/' + system + '/' + i + '.png" /></li>').on('click', function(e) {
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
            
            var saveselection = false;

            //get result of checkbox
            if ($('#systemshaderseletorwrapper input').prop('checked')) {
                saveselection = true;
                _PlayerData.SetShader(system, shader); //set this is player data now (refresh pulls session data)
            }

            setTimeout(function() {
                $('#systemshaderseletorwrapper').hide();
                callback({
                    'shader': shader,
                    'savePreference': saveselection
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

    var ShowGameLoading = function(system, title, box, callback) {

        $('#tip').hide();
        $('#gameloadingname').show().text(title);

        //build loading box
        var box = cesGetBoxFront(_config, system, title, 170) || box; //if it was preloaded!
        box.addClass('tada');
        box.load(function() {
            $(this).fadeIn(200);
        });

        $('#gameloadingimage').empty().addClass('centered').append(box);

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
                    $('#tip').empty().append('Tip: ' + tip).fadeIn(500);
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
    var DisplayGameContext = function(system, title, callback) {

        var box = cesGetBoxFront(_config, system, title, 170);

        //using old skool img because it was the only way to get proper image height
        var img = document.createElement('img');
        img.addEventListener('load', function() {

            $('#gamedetailsboxfront').empty().append(box);
            $('#gametitle').empty().hide().append(title);

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
                    $.get('/layout/controls/' + system, function(result) {
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
        }, true);

        //once the formal box loads, use the same src for our temp img to measure its height
        box.load(function() {
            img.setAttribute('src', box.attr('src'));
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
    var SavePreferencesAndGetPlayerGameDetails = function(key, system, title, file, options, deffered) {


        //call returns not only states but misc game details. I tried to make this
        //part of the LoadGame call but the formatting for the compressed game got weird
        $.post('/load/game', {
            'key': encodeURIComponent(key),
            'shader': options.shader,
            'savePreference': options.savePreference
        }, function(data) {

            //add to play history
            AddOrUpdatePlayHistory(key, system, title, file);

            deffered.resolve(data);
        });
    };

    /**
     * Add or update a game in the play history area
     * @param {Object} key    unique game key
     * @param {string} system
     * @param {string} title
     * @param {string} file
     * @param {Date} played     date game last played
     */
    var AddOrUpdatePlayHistory = function(key, system, title, file, lastPlayed, callback) {
        
        var response = _PlayerData.AddOrUpdatePlayHistory(key, system, title, file, lastPlayed); //will add or update an existing game

        _RecentlyPlayed.Add(key, response.data, response.isnew, _PlayerData.RemoveFromPlayHistory, function() {
            toolTips();
        });
    };

    /**
     * generates tooltips for all objects which might have been added that require it
     * @return {undef}
     */
    var toolTips = function() {
        //apply tooltips
        $('.tooltip').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100
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
 * a common function to return to the jquery object of a box front image. includes onerror handler for loading generic art when box not found
 * @param  {string} system
 * @param  {string} title
 * @param  {number} size   size of the box art (114, 150...)
 * @return {Object}        jquery img
 */
cesGetBoxFront = function(config, system, title, size) {

    var _Compression = new cesCompression();
    var _nerfImages = false;

    //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
    title = encodeURIComponent(encodeURIComponent(_Compression.Zip.string(title)));

    var errorsrc = config.assetpath + '/images/blanks/' + system + '_' + size + '.png';
    var src = config.boxpath + '/' + system + '/' + config.systemdetails[system].boxcdnversion + '/' + (title + (_nerfImages ? 'sofawnsay' : '')) + '/' + size + '.jpg';

    //a trick to preload the image
    var nothing = (new Image()).src = src;

    _Compression = null;

    //incldes swap to blank cart onerror
    return $('<img width="' + size + '" onerror="this.src=\'' + errorsrc + '\'" src="' + src + '" />');
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
        var img = new Image(width, width / screenratio);        //create new image with correct ratio
    }
    if (height) {
        var img = new Image(height * screenratio, height);        //create new image with correct ratio   
    }

    
    img.src = imageUrl;

    return img;
};

var shuffle = function(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};