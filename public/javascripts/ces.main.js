var Main = (function() {

    // private members

    var self = this;

    var _Compression = null;
    var libPlayerData = null;
    
    var config = {}; //the necessary server configuration data provided to the client
    var tips = [
        'Back out of that mistake you made by holding the R key to rewind the game',
        'Press the Space key to fast forward through those boring story scenes',
        'If your browser supports it, you can go fullscreen by pressing the F key',
        'You can save your progress by pressing the 1 key, return to it anytime with the 4 key',
        'We\'ll store all of your save states as long as you return within two weeks',
        'Pause your game with the P key',
        'Select a system filter to generate a new list of suggested games',
        'To search for more obsurace or forgeign titles, select a system filter first',
        'Take a screenshot with the T key. Missed that moment? Rewind with R and capture again!',
        'Screenshots are deleted when you leave or refresh the page. Download your favorites to keep them!'
    ];
    /**
     * globally defined jsonp deletegate. runs when jsonp is fetched. common scheme is to define a handler for calling jsonp
     * @param  {Object} response
     * @return {undef}
     */
    var jsonpDelegate;
    var b;
    var c;

    // public members

    this._Module = null; //handle the emulator Module
    this._FS = null; //handle to Module file system
    this._ModuleLoading = false; //oldskool way to prevent double loading
    this._pauseOverride = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
    this._activeFile = null;
    this._loadMoreSuggestionsOnBottom = null; //loads the url of suggestions to call should the list be extended when the user reachs the page bottom
    this._activeStateSlot = 0;
    this._saveStateDeffers = {}; //since saving state to server requires both state and screenshot data, setup these deffers since tracking which comes back first is unknown
    this._keypresslocked = false; //when we're sending a keyboard event to the emulator, we want to wait until that event is complete before any additinal keypresses are made (prevents spamming)
    this._fileWriteDelay = 500; //in ms. The delay in which the client should respond to a file written by the emulator (sometimes is goes out over the network and we don't want to spam the call)
    this._fileWriteTimers = {};
    this._playhistory = {};
    this._macroToShaderMenu = [[112, 100], 40, 40, 40, 88, 88, 40, 40, 40, 37, 37, 37, 38, 88, 88, 90, 90, 38, 38, 38, 112]; //macro opens shader menu and clears all passes

    
    $(document).ready(function() {

        //load libraries
        _Compression = new Compression();

        //unpack client data
        var clientdata = _Compression.Decompress.json(c20); //this name is only used for obfiscation

        config = clientdata.configdata;

        //auto capture trigger. comment out to avoid build
        //self._autoCaptureHarness('n64', config.autocapture['n64'].shaders, 7000, 1, 10000);

        //unpack playerdata
        libPlayerData = new PlayerData(clientdata.playerdata); //player data is user specific, can be dynmic

        //incoming params to open game now?
        var openonload = self.PlayerData.get('openonload') || {};
        if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
            retroArchBootstrap(openonload.system, openonload.title, openonload.file);
        }

        buildRecentlyPlayed(self.PlayerData.get('playhistory'));

        //build console select for search (had to create a structure to sort by the short name :P)
        var shortnames = [];
        for (var system in config.systemdetails) {
            config.systemdetails[system].id = system;
            shortnames.push(config.systemdetails[system]);
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
            $('#searchform select').append('<option value="' + shortnames[i].id + '">' + shortnames[i].shortname + '</option>');
        }

        //loading dial
        $('.dial').knob();

        //console select
        $('#searchform select').selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                var system = $(this).val();
                self.replaceSuggestions('/suggest/' + system + '/200', true, true);

                //show or hide the alpha bar in the suggestions panel
                if (system === 'all') {
                    $('#alphabar').hide();
                } else {
                    $('#alphabar').show();
                }
            }
        });

        //search field
        $('#searchform input').autoComplete({
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
                var system = $('#searchform select').val();
                $.getJSON('/search/' + system + '/' + term, function(data) {
                    response(_Compression.Decompress.json(data));
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
                suggestion.append(getBoxFront(item[2], item[0], 50));
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
                retroArchBootstrap(item.data('system'), item.data('title'), item.data('file'));
            }
        });

        //clicking on paused game overlay
        $('#emulatorwrapperoverlay')
            .on('click', function() {
                $('#emulator').focus();
                $('#emulatorcontrolswrapper').removeClass();
            })
            .hover(
                function(event) {
                    event.stopPropagation();
                },
                function(event) {
                    event.stopPropagation();
                });

        $('#emulatorcontrolswrapper').on('mousedown mouseup click', function(event) {
            event.preventDefault();
            $('#emulator').focus();
        });

        $('#emulatorwrapper').hover(
            function(event) {
                $('#emulatorcontrolswrapper').removeClass();
            },
            function(event) {
                $('#emulatorcontrolswrapper').addClass('closed');
            });

        $('#gamedetailswrapper').hover(
            function(event) {
                $('#gamecontrolslist').removeClass();
            },
            function(event) {
                $('#gamecontrolslist').addClass('closed');
            });

        $('#emulatorcontrolswrapper li.fullscreen').click(function() {
            simulateEmulatorKeypress(70); // F
        });

        $('#emulatorcontrolswrapper li.savestate').click(function() {
            simulateEmulatorKeypress(49); // 1
        });

        $('#emulatorcontrolswrapper li.loadstate').click(function() {
            simulateEmulatorKeypress(52); // 4
        });

        $('#emulatorcontrolswrapper li.mute').click(function() {
            simulateEmulatorKeypress(77); // M
        });

        $('#emulatorcontrolswrapper li.decrementslot').click(function() {
            simulateEmulatorKeypress(50); // 2
        });

        $('#emulatorcontrolswrapper li.incrementslot').click(function() {
            simulateEmulatorKeypress(51); // 3
        });

        $('#emulatorcontrolswrapper li.fastforward').click(function() {
            simulateEmulatorKeypress(32); // Space
        });

        $('#emulatorcontrolswrapper li.pause').click(function() {
            simulateEmulatorKeypress(80); // P
        });

        $('#emulatorcontrolswrapper li.reset').click(function() {
            simulateEmulatorKeypress(72); // H
        });

        $('#emulatorcontrolswrapper li.rewind').click(function() {
            simulateEmulatorKeypress(82, 5000); // R
        });

        //when user has scrolled to bottom of page, load more suggestions
        $(window).scroll(function() {
            if ($(window).scrollTop() + $(window).height() == $(document).height() && self._loadMoreSuggestionsOnBottom) {
                self.replaceSuggestions(self._loadMoreSuggestionsOnBottom, false, true);
            }
        });

        //for browsing, set up links
        $('#suggestionswrapper a').each(function(index, item) {
            $(item).on('click', function(e) {
                var system = $('#searchform select').val();
                var term = $(item).text();
                self.replaceSuggestions('/suggest/browse/' + system + '?term=' + term, true, false);
            });
        });

        self.Sliders.init();

        self.replaceSuggestions('/suggest/all/150', true, true); //begin by showing 150 all console suggestions

        toolTips();
    });

    /* public methods */

    /* private methods */
    
    /**
     * function for handling the load and replacement of the suggestions content area
     * @param  {string} system
     * @param  {number} items  the number of items to load and show
     * @return {undef}
     */
    var replaceSuggestions = function(url, remove, loadMore) {

        var self = this;

        self._loadMoreSuggestionsOnBottom = loadMore ? url : null;

        //reset dial
        $('.dial').val(0).trigger('change');

        //show loading icon
        
        //only hide current suggestions when resetting columns
        if (remove) {
            $('#suggestionswrapper').hide();
            $('#loading').removeClass('close');
        }

        $.getJSON(url, function(response) {

            response = _Compression.Decompress.json(response);

            //remove all current gamelinks
            if (remove) {
                $('#suggestionswrapper li').remove();
            }

            var columns = $('#suggestionswrapper ul');

            //use modulus to evenly disperse across all columns
            for (var i = 0; i < response.length; ++i) {
                var gamelink = buildGameLink(response[i].system, response[i].title, response[i].file, 120); //build dom elements
                $(columns[i % columns.length]).append(gamelink.li);
            }

            //when all images have loaded, show suggestions
            $('#suggestionswrapper').waitForImages().progress(function(loaded, count, success) {

                //perc loaded is the number loaded to the number included in the response * 100
                var perc = parseInt((loaded / response.length) * 100, 10);

                //set loading progress on dial
                $('.dial').val(perc).trigger('change');

                if (loaded === (count - 1)) {
                    $('#suggestionswrapper').slideDown();
                    $('#loading').addClass('close');
                }
            });

            toolTips();
        });
    };

    /**
     * bootstrap function for loading a game with retroarch. setups animations, loading screens, and iframe for emulator. also destoryes currently running
     * @param  {string} system      [snes, nes, gb, gba, gen ... ]
     * @param  {string} title       the rom game title (seen as the folder name in the file system)
     * @param  {string} file        the rom file which to load
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @param  {Function} onStart  optional. a function to call when emulation begins
     * @return {undef}
     */
    var retroArchBootstrap = function(system, title, file, slot, shader, onStart) {

        var self = this;
        var key = _Compression.Compress.gamekey(system, title, file); //for anything that might need it

        //bail if attempted to load before current has finished
        if (self._ModuleLoading) {
            return;
        }
        self._ModuleLoading = true;
        self._pauseOverride = false;

        //fade out content
        $('#gamedetailsboxfront img').addClass('close');
        $('#gamedetailswrapper').fadeOut();

        //move welcome and emulator out of view (first time only)
        $('#startmessage').slideUp(1000);

        //show pregame background and hide emulator (if showing, would if loading second game)
        $('#pregamebackground').show().animate({height: 600}); //600px is a magic number here!
        $('#emulatorwrapper').hide();

        //close content area (under emulator)
        $('#gamedetailsbackground').animate({height: 0});

        //cleanup any pregame details
        $('#systemshaderseletorwrapper').addClass('close');
        $('#savedstateseletorwrapper').addClass('close');

        //loading content image and title
        $('#gameloadingname').text(title);
        $('#gameloadingoverlaycontentimage').empty();

        //fade in loading overlay
        $('#gameloadingoverlay').fadeIn(1000);

        //this used to be a callback for the previous call but since its possible for the loading overlay to aready be faded in, we still want to preserve this delay
        setTimeout(function() {

            //cleanup previous play
            cleanupEmulator();

            //close any sliders
            self.Sliders.closeall();

            self._ModuleLoading = false; //during shader select, allow other games to load

            // all deferres defined for separate network dependancies
            var emulatorReady = $.Deferred();
            var emulatorSupportReady = $.Deferred();
            var gameReady = $.Deferred();
            var gameDetailsReady = $.Deferred();
            var shaderReady = $.Deferred();

            //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
            $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator" oncontextmenu="event.preventDefault()"></canvas>');

            //fix text on shader screen
            $('#systemshaderseletorwrapper span').text(config.systemdetails[system].shortname);

            //show shader selector. returns an object with shader details
            showShaderSelection(system, shader, function(shaderselection) {

                self._ModuleLoading = true; //lock loading after shader select

                //build loading box
                var box = getBoxFront(system, title, 170);
                box.addClass('tada');
                box.load(function() {
                    $(this).fadeIn(200);
                });
                $('#gameloadingoverlaycontentimage').append(box);

                $('#gameloadingoverlaycontent').show().removeClass(); //show loading

                //show tips on loading
                var tipInterval = setInterval(function() {
                    $('#tip').fadeOut(500, function() {
                        var tip = Crazyerics.prototype._tips[Math.floor(Math.random() * Crazyerics.prototype._tips.length)];

                        if (!$('#gameloadingoverlay').is(':animated')) {
                            $('#tip').empty().append('Tip: ' + tip).fadeIn(500);
                        }
                    });
                }, 5000); //show tip for this long

                //begin loading all content. I know it seems like some of these (game, emulator, etc) could load while the user
                //is viewing the shader select, but I found that when treated as background tasks, it interfere with the performance
                //of the shader selection ui. I think its best to wait until the loading animation is up to perform all of these:
                loademulator(system, emulatorReady);
                loadEmulatorSupport(system, emulatorSupportReady);
                loadGame(key, system, title, file, gameReady);
                loadShader(shaderselection.shader, shaderReady);

                //this call is a POST. Unlike the others, it is destined for the mongo instance. we send user preference data to the server in addition to getting game details.
                loadGameDetails(key, system, title, file, { 
                    'savePreference': shaderselection.savePreference, 
                    'shader': shaderselection.shader 
                }, gameDetailsReady);

                //when all deffered calls are ready
                $.when(emulatorReady, emulatorSupportReady, gameReady, gameDetailsReady, shaderReady).done(function(emulator, emulatorSupport, loadedgame, gamecontent, shaderResult) {

                    var Module = emulator[0];
                    var fs = emulator[1];
                    var frame = emulator[2];

                    //emulator support response
                    var supportData = (emulatorSupport && emulatorSupport[1]) ? emulatorSupport[1] : null; //if not defined, no emulator support

                    //loadGame response
                    var err = loadedgame[0];
                    var gamedata = loadedgame[1]; //compressed game data

                    //decompress game details here since we need state data for selection
                    gamecontent = _Compression.Decompress.json(gamecontent);
                    var states = gamecontent.states;
                    var files = gamecontent.files;
                    var info = gamecontent.info;

                    //initialize the game state manager
                    self.StateManager.init(gamecontent.states);
                    
                    //shader data is compressed from server, unpack later
                    var shaderData = (shaderResult && shaderResult[1]) ? shaderResult[1] : null; //if not defined, not shader used

                    self._Module = Module; //handle to Module
                    self._FS = fs;
                    self.emulatorframe = frame; //handle to iframe

                    //emulator always starts with state slot 0
                    self._activeStateSlot = 0;

                    $('#emulatorcontrolswrapper').show(); //show controls tool bar (still has closed class applied)

                    //date copmany
                    if (info) {
                        var year = info.ReleaseDate ? info.ReleaseDate.match(/(\d{4})/) : [];
                        $('#gametitlecaption').text((info.Publisher ? info.Publisher : '') + (year.length > 0 ? ', ' + year[0] : ''));
                    }

                    //all the file decompression takes place in this call, better here once all the defferes are complete. 
                    //I was seeing a freezing issue when decompression was taking place while the shader selection screen was up
                    BuildLocalFileSystem(Module, system, file, gamedata, shaderData, supportData); //write to emulator file system. this is synconous since the fs is emulated in js

                    /**
                     * register a callback function when the emulator saves a file
                     * @param  {string} filename
                     * @param  {UInt8Array} contents
                     * @return {undef}
                     */
                    Module.emulatorFileWritten = function(filename, contents) {
                        emulatorFileWriteListener(key, system, title, file, filename, contents);
                    };

                    setTimeout(function() {

                        //close loading screen and tips
                        $('#gameloadingoverlaycontent').addClass('close');
                        $('#tips').stop().hide();
                        clearInterval(tipInterval);

                        self._ModuleLoading = false; //during shader select, allow other games to load

                        //are there states to load? Let's show a dialog to chose from, if not - will go straight to start
                        showStateSelection(system, title, file, function(slot) {
                            
                            self._ModuleLoading = true;

                            //begin game
                            Module.callMain(Module.arguments);

                            if (onStart) {
                                onStart();
                            }

                            /**
                             * the action to perform once all keypresses for loading state have completed (or not if not necessary)
                             * @return {undef}
                             */
                            var removeVail = function() {
                                //handle title and content fadein steps
                                displayGameContext(system, title, function() {

                                });

                                //this estimate is made knowing 1) the canvas will scale the width of the main content area and have about 2px of padding
                                var canvasHeightEstimate = (($('#maincolumn').width() / Module.canvas.width) * Module.canvas.height) + 20;

                                //enlarge pregame background to hold emulator
                                $('#pregamebackground').animate({height: canvasHeightEstimate}, function() {

                                    //reveal emulator
                                    $('#emulatorwrapper').show();

                                    $('#gameloadingoverlay').fadeOut(1000, function() {

                                        $('#gameloadingoverlaycontent').addClass('close');

                                        //show controls initially to reveal their presence
                                        setTimeout(function() {
                                            self._ModuleLoading = false;
                                            $('#emulatorcontrolswrapper').addClass('closed');

                                            //to help new players, reveal controls after load
                                            self.Sliders.open('controlsslider');
                                        }, 1000);
                                    });

                                    //assign focus to emulator canvas
                                    $('#emulator')
                                        .blur(function(event) {
                                            if (!self._pauseOverride) {
                                                Module.pauseMainLoop();
                                                $('#emulatorwrapperoverlay').fadeIn();
                                            }
                                        })
                                        .focus(function() {
                                            Module.resumeMainLoop();
                                            $('#emulatorwrapperoverlay').hide();
                                        })
                                        .focus();

                                });
                            };

                            // load state?
                            // we need to handle mulitple keypresses asyncrounsly to ensure the emulator recieved input
                            if (slot) {

                                AsyncLoop(parseInt(slot, 10), function(loop) {

                                    //simulate increasing state slot (will also set self._activeStateSlot)
                                    simulateEmulatorKeypress(51, 10, function() {
                                        loop.next();
                                    });

                                }, function() {
                                    simulateEmulatorKeypress(52); //4 load state
                                    removeVail();
                                });
                            } else {
                                removeVail();
                            }

                        });
                    }, 3000); //after emu file setup and before state selector
                });
            });
        }, 1000);
    };

    /**
     * this functio handles showing the shader selection before a game is loaded
     * @param  {string}   system
     * @param  {string}   preselectedShader if a shader is predefined in the bootstap, it is passed along here
     * @param  {Function} callback
     * @return {undef}
     */
    var showShaderSelection = function(system, preselectedShader, callback) {

        var self = this;

        $('#shaderselectlist').empty(); //clear all previous content

        //bail early: check if shader already defined for this system (an override value passed in)
        if (typeof preselectedShader !== 'undefined') {
            $('#systemshaderseletorwrapper').hide().addClass('close');
            callback({
                'shader': preselectedShader,
                'savePreference': false
            });
            return;
        }

        //bail early: check if user checked to use a shader for this system everytime
        var userpreference = self.PlayerData.getShader(system);
        if (userpreference) {
            callback({
                'shader': userpreference,
                'savePreference': false
            });
            return;
        }

        //get the recommended shaders list
        var recommended = config.recommendedshaders[system];
        var shaderfamilies = config.shaders;
        var i = 0;

        //suggest all (for debugging), remove when the ability to test all shaders is present
        // for (i; i < shaderfamilies.length; ++i) {
        //     $('#shaderselectlist').append($('<div style="display:block;padding:0px 5px;" data-shader="' + shaderfamilies[i] + '">' + shaderfamilies[i] + '</div>').on('click', function(e) {
        //         onFinish($(this).attr('data-shader'));
        //     }));
        // }

        $('#shaderselectlist').append($('<li class="zoom" data-shader=""><h3>No Processing</h3><img class="tada" src="' + config.assetpath + '/images/shaders/' + system + '/pixels.png" /></li>').on('click', function(e) {
            onFinish($(this).attr('data-shader'));
        }));

        for (i; i < recommended.length; ++i) {

            var key = recommended[i];

            $('#shaderselectlist').append($('<li class="zoom" data-shader="' + key.shader + '"><h3>' + key.title + '</h3><img src="' + config.assetpath + '/images/shaders/' + system + '/' + i + '.png" /></li>').on('click', function(e) {
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
                self.PlayerData.setShader(system, shader); //set this is player data now (refresh pulls session data)
            }

            setTimeout(function() {
                $('#systemshaderseletorwrapper').hide();
                callback({
                    'shader': shader,
                    'savePreference': saveselection
                });
            }, 250);
        };

        $('#systemshaderseletorwrapper').show().removeClass();
    };

    /**
     * saved state selection dialog.
     * @param  {Object}   states   structure with states, screenshot and timestap. empty when no states exist
     * @param  {Function} callback
     * @return {undef}
     */
    var showStateSelection = function(system, title, file, callback) {

        var self = this;
        var slots = this.StateManager.getSavedSlots();

        //no states saved to chose from
        if (slots.length === 0) {
            callback();
            return;
        }

        $('#stateselectlist').empty(); //empty list from last load
        $('#savedstateselectorlistwrapper').scrollTop(0); //in case they scrolled down previously

        //bind no state load to h3
        $('#savedstateseletorwrapper h3').off().on('mouseup', function() {
            callback(null);
            $('#savedstateseletorwrapper').addClass('close');

        });

        //fast way of handling interation in js. look it up!
        var i = slots.length;
        while (i--) {

            //this is in a closure to preserve the callback parameter over iteration
            (function(slot) {
                var formatteddate = self.StateManager.getDate(slot);
                var image = self.StateManager.getScreenshot(system, slot);

                var li = $('<li class="zoom tooltip"></li>')
                .on('mouseup', function() {

                    //on selection, callback with slot
                    callback(slot);
                    $('#savedstateseletorwrapper').addClass('close');

                });

                if (formatteddate && (parseInt(slot, 10) > -1)) {
                    li.attr('title', 'Slot ' + slot + ': ' + formatteddate);
                }

                $(li).prepend(image);

                $('#stateselectlist').prepend(li);

            })(slots[i]);
        }

        toolTips();
        $('#savedstateseletorwrapper').show().removeClass();
    };

    /**
     * build content area underneath emulator canvas
     * @param  {string}   system
     * @param  {string}   title
     * @param  {Function} callback
     * @return {undef}
     */
    var displayGameContext = function(system, title, callback) {

        var box = getBoxFront(system, title, 170);

        //using old skool img because it was the only way to get proper image height
        var img = document.createElement('img');
        img.addEventListener('load', function() {

            $('#gamedetailsboxfront').empty().append(box);
            $('#gametitle').empty().hide().append(title);

            // slide down background
            $('#gamedetailsboxfront img').addClass('close');
            $('#gamedetailsbackground').animate({height: 250}, 1000, function() {

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

    /**
     * handle removing the emulator frame from view and all bound events
     * @return {undef}
     */
    var cleanupEmulator = function() {

        var self = this;

        //since each Module attached an event to the parent document, we need to clean those up too:
        $(document).unbind('fullscreenchange');
        $(document).unbind('mozfullscreenchange');
        $(document).unbind('webkitfullscreenchange');
        $(document).unbind('pointerlockchange');
        $(document).unbind('mozpointerlockchange');
        $(document).unbind('webkitpointerlockchange');

        if (self._FS) {
            self._FS = null;
        }

        if (self._Module) {
            try {
                self._Module.exit(); //calls exit on emulator ending loop (just to be safe)
            } catch (e) {

            }
            self._Module = null;
        }
        if (self.emulatorframe) {
            self.emulatorframe.remove();
            self.emulatorframe = null;
        }
        $('#emulator').remove(); //kill all events attached (keyboard, focus, etc)
    };

    /**
     * simulator keypress on emulator. used to allow interaction of dom elements
     * @param  {number} key ascii key code
     * @param {number} keyUpDelay the time delay (in ms) the key will be in the down position before lift
     * @return {undef}
     */
    var simulateEmulatorKeypress = function(key, keyUpDelay, callback) {

        var self = this;
        keyUpDelay = keyUpDelay || 10;

        //bail if in operation
        if (self._keypresslocked) {
            return;
        }

        /**
         * [eventHandler description]
         * @param  {Object} event
         * @return {undefined}
         */
        var eventHandler = function(event) {}; //noop for default, overridden 

        //events for emulator 1.0.0
        if (this._Module && this._Module.RI && this._Module.RI.eventHandler) {
            eventHandler = this._Module.RI.eventHandler;

            self._keypresslocked = true;
            var e;
            e = $.Event('keydown');
            e.keyCode = key;
            e.which = key;
            eventHandler(e); //dispatch keydown
            setTimeout(function() {
                e = $.Event('keyup');
                e.keyCode = key;
                e.which = key;
                eventHandler(e); //after wait, dispatch keyup
                setTimeout(function() {
                    self._keypresslocked = false;
                    if (callback) {
                        callback();
                    }
                }, 100);
            }, keyUpDelay);
        }
        
        //events for emulator 2.0.0
        else if (this._Module && this._Module.JSEvents && this._Module.JSEvents.crazyericsKeyEventHandler) {
            
            eventHandler = this._Module.JSEvents.crazyericsKeyEventHandler;

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
                    
                    /**
                     * [get description]
                     * @return {number}
                     */
                    get: function() {
                        return this.keyCodeVal;
                    }
                });
                Object.defineProperty(oEvent, 'which', {
                    
                    /**
                     * [get description]
                     * @return {number}
                     */
                    get: function() {
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
                    alert('keyCode mismatch ' + oEvent.keyCode + '(' + oEvent.which + ')');
                }
             
                eventHandler(oEvent);
                $('#emulator').focus();
            };

            kp(key, 'keydown');
            setTimeout(function() {
                kp(key, 'keyup');
            }, keyUpDelay);

        }

        $('#emulator').focus();
        
    };

    /**
     * Runs a series of keyboard instructions by keycode with optional delays between keystrokes
     * @param  {Object|Array}   instructions
     * @param  {Function} callback
     * @return {undef}
     */
    var runKeyboardMacro = function(instructions, callback) {

        var self = this;

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

        simulateEmulatorKeypress(keycode, 1, function() {
            runKeyboardMacro(instructions.slice(1), callback);
        });
    };

    /**
     * listens to all events coming from emulator
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @return {undef}
     */
    var setupEmulatorEventListener = function(system, title, file) {

        var self = this;

        //emulator event handler for 1.0.0 emulators
        if (this._Module && this._Module.RI && this._Module.RI.eventHandler) {

            var originalHandler = this._Module.RI.eventHandler;
            
            /**
             * [eventHandler description]
             * @param  {Object} event
             * @return {undefined}
             */
            this._Module.RI.eventHandler = function(event) {
                emulatorEventListnener(event, 'keyup', originalHandler);
            };
        } 

        //emulator event handler for 2.0.0 emulators
        if (this._Module && this._Module.JSEvents) {
            
            /**
             * [crazyericsEventListener description]
             * @param  {Object} event
             * @return {undefined}
             */
            this._Module.JSEvents.crazyericsEventListener = function(event) {
                emulatorEventListnener(event, 'keydown');
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
    var emulatorEventListnener = function(event, listenType, callback) {

        var self = this;

        switch (event.type) {
            case listenType:
                var key = event.keyCode;
                switch (key) {
                    case 70: // F - fullscreen
                        self._Module.requestFullScreen(true, true);
                        $('#emulator').focus();
                    break;
                    case 49: //1 - save state
                        //setup deffered call to save state to server, need callbacks from state file and screenshot capture
                        self._saveStateDeffers.state = $.Deferred();
                        self._saveStateDeffers.screen = $.Deferred();

                        //use a timeout to clear deffers incase one of them never comes back, 1 sec is plenty. i see this return in about 50ms generally
                        var clearStateDeffers = setTimeout(function() {
                            self._saveStateDeffers = {};
                        }, 1000);

                        $.when(self._saveStateDeffers.state, self._saveStateDeffers.screen).done(function(statedetails, screendetails) {

                            clearTimeout(clearStateDeffers); //clear timeout from erasing deffers
                            self._saveStateDeffers = {}; //do the clear ourselves

                            self.StateManager.saveStateToServer(statedetails, screendetails);
                        });
                        simulateEmulatorKeypress(84); //initiaze screenshot after its defer is in place.
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
     * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var loademulator = function(system, deffered) {

        var frame  = $('<iframe/>', {
            src: '/load/emulator/' + system, //loads view code
            style: 'display:none',

            /**
             * on frame load
             * @return {undef}
             */
            load: function() {

                //find module to run games
                var FS = this.contentWindow.FS;
                var Module = this.contentWindow.Module;

                /**
                 * override the monitorRunDependencies function for use with emulator loading
                 * @param  {number} left
                 * @return {undef}
                 */
                Module.monitorRunDependencies = function(left) {
                    if (left === 0) {
                        deffered.resolve(Module, FS, frame);
                    }
                };

                if (Module.totalDependencies === 0) {
                    deffered.resolve(Module, FS, frame);
                }
            }
        });
        $('body').append(frame);
    };

    /**
     * load rom file from whatever is defined in the config "rompath" (CDN/crossdomain or local). will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {Object} deffered
     * @return {undef}
     */
    var loadGame = function(key, system, title, file, deffered) {

        var self = this;
        var location = config.rompath + '/' + system + '/' + config.systemdetails[system].romcdnversion + '/';
        var flattened = config.flattenedromfiles;

        //if rom struture is flattened, this means that all rom files have been converted to single json files
        if (flattened) {

            var filename = _Compression.Compress.string(title + file);
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
                var decompressed = _Compression.Decompress.string(response);
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
    var loadShader = function(name, deffered) {

        var self = this;
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
     * Emulator support is any additional resources required by the emulator needed for play
     * This isnt included in the loadEmulator call because sometimes support files are needed for an emulator
     * which can play several systems (Sega CD, support needed, Genesis, no support)
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var loadEmulatorSupport = function(system, deffered) {

        var self = this;
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
     * a trip to the server (same domain) to load an extra details about a game at load: states, rom files, ...
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {Object} all options to pass to server
     * @param  {Object} deffered
     * @return {undef}
     */
    var loadGameDetails = function(key, system, title, file, options, deffered) {

        var self = this;

        //call returns not only states but misc game details. I tried to make this
        //part of the loadGame call but the formatting for the compressed game got weird
        $.post('/load/game', {
            'key': encodeURIComponent(key),
            'shader': options.shader,
            'savePreference': options.savePreference
        }, function(data) {

            //add to play history
            addToPlayHistory(key, system, title, file);

            deffered.resolve(data);
        });
    };

    /**
     * Once Module has loaded with its own file system, populate ir with config and rom file
     * @param  {Object} Module
     * @param  {string} system
     * @param  {string} file
     * @param  {string} data
     * @param  {Object} shader
     * @return {undef}
     */
    var BuildLocalFileSystem = function(Module, system, file, compressedGameFiles, shaderFiles, supportFiles) {

        var self = this;
        var i;
        var content;

        Module.FS_createFolder('/', 'games', true, true);

        //games are stored compressed in json. due to javascript string length limits, these can be broken up into several segments for larger files.
        //the compressedGameFiles object contains data for all files and their segments
        for (var gameFile in compressedGameFiles) {

            var filename = _Compression.Decompress.string(gameFile);
            var compressedGame = compressedGameFiles[gameFile];
            var views = [];
            var bufferLength = 0;

            //begin by decopressing all compressed file segments
            for (i = 0; i < compressedGame.length; ++i) {
                var decompressed = _Compression.Decompress.string(compressedGame[i]);
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
            Module.FS_createDataFile('/games', filename, gamedata, true, true);
        }

        //set the start file
        Module.arguments = ['-v', '-f', '/games/' + file];
        //Module.arguments = ['-v', '--menu'];

        //emulator support, will be null if none
        if (supportFiles) {
            supportFiles = _Compression.Decompress.json(supportFiles);
            if (supportFiles && self._FS) {
                for (var supportFile in supportFiles) {
                    content = _Compression.Decompress.bytearray(supportFiles[supportFile]);
                    try {
                        self._FS.createDataFile('/', supportFile, content, true, true);
                    } catch (e) {
                        //an error on file write.
                    }
                }
            }
        }

        //shaders
        Module.FS_createFolder('/', 'shaders', true, true);
        var shaderPresetToLoad = null;

        //shader files, will be null if none used
        if (shaderFiles) {
            shaderFiles = _Compression.Decompress.json(shaderFiles); //decompress shader files to json object of file names and data

            //if in coming shader parameter is an object, then it has shader files defined. self._FS is a handle to the
            //module's file system. Yes, the other operations here reference the file system through the Module, you just don't have to anymore!
            if (shaderFiles && self._FS) {

                for (var shaderfile in shaderFiles) {
                    content = _Compression.Decompress.bytearray(shaderFiles[shaderfile]);
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
        try { Module.FS_createFolder('/', 'etc', true, true); } catch (e) {}
        try { Module.FS_createFolder('/', 'home', true, true); } catch (e) {}
        try { Module.FS_createFolder('/home', 'web_user', true, true); } catch (e) {}
        try { Module.FS_createFolder('/home/web_user/', 'retroarch', true, true); } catch (e) {}
        try { Module.FS_createFolder('/home/web_user/retroarch', 'userdata', true, true); } catch (e) {}

        if (config.retroarch) {

            var configToLoad = config.retroarch; //in json
            var config;

            //system specific overrides
            if (config.systemdetails[system] && config.systemdetails[system].retroarch) {
                for (config in config.systemdetails[system].retroarch) {
                    configToLoad[config] = config.systemdetails[system].retroarch[config];
                }
            }

            if (shaderPresetToLoad) {
                configToLoad.video_shader = '/shaders/' + shaderPresetToLoad;
            }

            //convert json to string delimited list
            var configString = '';
            for (config in configToLoad) {
                configString +=  config + ' = ' + configToLoad[config] + '\n';
            }

            //write to both locations since we could be using older or newer emulators
            Module.FS_createDataFile('/home/web_user/retroarch/userdata', 'retroarch.cfg', configString, true, true);
            Module.FS_createDataFile('/etc', 'retroarch.cfg', configString, true, true);
        }

        //screenshots
        Module.FS_createFolder('/', 'screenshots', true, true);

        //states
        Module.FS_createFolder('/', 'states', true, true);
        
        var slots = this.StateManager.getSavedSlots();
        i = slots.length;

        while (i--) {
            var filenoextension = file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
            var statefilename = '/' + filenoextension + '.state' + (slots[i] == 0 ? '' : slots[i]);
            var statedata = this.StateManager.getState(slots[i]);
            Module.FS_createDataFile('/states', statefilename, statedata, true, true);
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
    emulatorFileWritten = function(key, system, title, file, filename, contents) {

        var self = this;
        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit
        var screenshotmatch = filename.match(/\.bmp$|\.png$/);

        // match will return an array when match was successful, our capture group with the slot value, its 1 index
        if (statematch) {

            var slot = statematch[1] === '' ? 0 : statematch[1]; //the 0 state does not use a digit
            var data = _Compression.Compress.bytearray(contents);

            //if a deffered is setup for recieveing save state data, call it. otherwise, throw this state away (should never happen though!)
            if (self._saveStateDeffers.hasOwnProperty('state')) {
                self._saveStateDeffers.state.resolve(key, system, title, file, slot, data);
            }

            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var arrayBufferView = new Uint8Array(contents);

            //if a deffered from save state exists, use this screenshot for it and return
            if (self._saveStateDeffers.hasOwnProperty('screen')) {
                self._saveStateDeffers.screen.resolve(arrayBufferView);
                return;
            }

            $('p.screenshothelper').remove(); //remove helper text

            var width = $('#screenshotsslider div.slidercontainer').width() / 3; //550px is the size of the panel, the second number is how many screens to want to show per line
            var img = buildScreenshot(system, arrayBufferView, width);

            $(img).addClass('close').load(function() {
                $(this).removeClass('close');
            });
            var a = $('<a class="screenshotthumb" href="' + img.src + '" download="' + title + '-' + filename + '"></a>'); //html 5 spec downloads image
            a.append(img).insertAfter('#screenshotsslider p');

            //kick open the screenshot slider
            self.Sliders.open('screenshotsslider', true);
        }
    };

    /**
     * common function to take arraybufferview of screenshot data and return a dom image. prodive width of image and we'll lookup aspect ration in config data
     * @param {string} system the system for which this screenshot belongs. used to look up aspect ratio
     * @param  {Array} arraybufferview
     * @param  {number} width
     * @return {Object}
     */
    var buildScreenshot = function(system, arraybufferview, width) {

        var self = this;

        var screenratio = 1;

        var blob = new Blob([arraybufferview], {
            type: 'image/bmp'
        });

        //get screen ratio from config
        if (config.retroarch && config.retroarch[system]) {
            screenratio = config.retroarch[system].match(/video_aspect_ratio = (\d+\.+\d+)/);
            if ($.isArray(screenratio) && screenratio.length > 1) {
                screenratio = parseFloat(screenratio[1]);
            }
        }

        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        var img = new Image(width, width / screenratio);        //create new image with correct ratio
        img.src = imageUrl;

        return img;
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
    var emulatorFileWriteListener = function(key, system, title, file, filename, contents) {

        var self = this;

        //clear timer if exists
        if (self._fileWriteTimers.hasOwnProperty(filename)) {
            clearTimeout(self._fileWriteTimers[filename]);
        }

        //write new timer
        self._fileWriteTimers[filename] = setTimeout(function() {

            //if timer runs out before being cleared again, delete it and call file written function
            delete self._fileWriteTimers[filename];
            emulatorFileWritten(key, system, title, file, filename, contents);
        }, self._fileWriteDelay);
    };

    /**
     * on page load, build the recently played content area from clientdata passed from server
     * @param  {Object} clientdata
     * @param  {number} maximum        //no used at the moment since we want to show the entire play history and let the user delete what they don't want to see
     * @return {undef}
     */
    var buildRecentlyPlayed = function(clientdata, maximum) {

        for (var game in clientdata) {
            addToPlayHistory(game, clientdata[game].system, clientdata[game].title, clientdata[game].file, clientdata[game].played, clientdata[game].slots);
        }

        if ($.isEmptyObject(clientdata)) {
            $('#startfirst').animate({height: 'toggle', opacity: 'toggle'}, 500);
        } else {
            $('#startplayed').animate({height: 'toggle', opacity: 'toggle'}, 500);
        }
    };

    /**
     * Add or update a game in the play history area
     * @param {Object} key    unique game key
     * @param {string} system
     * @param {string} title
     * @param {string} file
     * @param {Date} played     date game last played
     * @param {Object} slots    {slot: 3, date: date} //date state saved as property
     */
    var addToPlayHistory = function(key, system, title, file, played, slots) {

        var self = this;
        var slot;

        //handling dupes will be a common function, replace the date and handle the states slots
        if (key in self._playhistory) {
            self._playhistory[key].played = Date.now();
            toolTips();
            return;
        }

        //not a dupe, let's create a new play histry game

        var gamelink = buildGameLink(system, title, file, 120, true); //get a game link

        gamelink.li.addClass('close');

        gamelink.img.load(function() {
            gamelink.li.removeClass('close');
        });

        //the remove link will delete the game from play history and any saved states
        gamelink.remove
        .addClass('tooltip')
        .attr('title', 'Remove this game and all saved progress')
        .on('click', function() {
            gamelink.li.addClass('slideup');
            $.ajax({
                url: '/states/delete?key=' + encodeURIComponent(key),
                type: 'DELETE',
                /**
                 * on successful state deletion
                 * @return {undef}
                 */
                complete: function() {
                    setTimeout(function() {
                        gamelink.li.remove();
                    }, 500);
                }
            });
        });

        //create a local store to take this with handle to dom elements
        self._playhistory[key] = {
            system: system,
            title: title,
            file: file,
            played: played || Date.now(),
            slots: slots || {}
            //stateswrapper: stateswrapper
        };

        //append states, if any
        if (false && slots && Object.keys(slots).length > 0) {

            for (slot in slots) {
                self._addStateToPlayHistory(self._playhistory[key], stateswrapper, slot, slots[slot]);
            }

            gamelink.li.on('mouseover', function(e) {
                $(stateswrapper).slideDown(500);
                gamelink.li.addClass('selected');
            });

            $(stateswrapper).on('mouseout', function(e) {
                $(stateswrapper).slideUp(500);
                gamelink.li.removeClass('selected');
            });
        }

        //figure out where to insert this gamelink in the recently played area
        var columns = $('#recentplayedwrapper ul');
        var column = columns[0];
        var columndepth = 0;
        for (var i = 0; i < columns.length; ++i) {
            if ($(columns[i]).children().length < $(column).children().length) {
                column = columns[i];
                columndepth = i;
            }
        }
        $(column).append(gamelink.li); //append to recently played area

        //position statewrapper in correct region of screen

        //set state arrow to correct column
        //$(stateswrapper).css('left', columndepth + '5%');
        //$(stateswrapper).find('.triangle').css('left', ((columndepth * 15) + 5) + '%');

        $('#recentplayedwrapper').show(); //ensure it is showing (will be hidden first time)

        toolTips();
    };

    /**
     * a common function which returns an li of a game box which acts as a link to bootstrap load the game and emulator
     * @param  {string} system
     * @param  {string} title
     * @param  {number} size        the size of the box front image to load (114, 150)
     * @param  {boolean} close      if true, shows the close button at the corner, no event attached
     * @return {Object}             Contains reference to the li, img and close button
     */
    var buildGameLink = function(system, title, file, size, close) {
        var self = this;
        close = close || false;

        var li = $('<li class="gamelink"></li>');
        var box = getBoxFront(system, title, size);

        box.addClass('tooltip close');
        box.attr('title', title);

        //show box art when finished loading
        box.load(function() {
            $(this)
            .removeClass('close')
            .on('mousedown', function() {
                self._pauseOverride = true; //prevent current game from pausng before fadeout
            })
            .on('mouseup', function() {

                retroArchBootstrap(system, title, file);
                window.scrollTo(0, 0);
            });
        });

        var imagewrapper = $('<div class="box zoom"></div>');

        imagewrapper.append(box);

        //also when box load fails, in addition to showing the blank cartridge, let's create a fake label for it
        box.error(function(e) {
            $(this).parent().append('<div class="boxlabel boxlabel-' + system + '"><p>' + title + '</p></div>');
        });

        li.append(imagewrapper);

        var remove = null;
        if (close) {
            remove = $('<div class="remove"></div>');
            imagewrapper
                .append(remove)
                .on('mouseover', function() {
                    $(remove).show();
                })
                .on('mouseout', function() {
                    $(remove).hide();
                });
        }

        return {
            li: li,
            img: box,
            remove: remove
        };
    };

    /**
     * a common function to return to the jquery object of a box front image. includes onerror handler for loading generic art when box not found
     * @param  {string} system
     * @param  {string} title
     * @param  {number} size   size of the box art (114, 150...)
     * @return {Object}        jquery img
     */
    var getBoxFront = function(system, title, size) {

        var self = this;

        //have box title's been compressed (to obfiscate on cdn)
        if (config.flattenedboxfiles) {
            //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
            title = encodeURIComponent(encodeURIComponent(Compress.string(title)));
        }

        //incldes swap to blank cart onerror
        return $('<img onerror="this.src=\'' + config.assetpath + '/images/blanks/' + system + '_' + size + '.png\'" src="' + config.boxpath + '/' + system + '/' + config.systemdetails[system].boxcdnversion + '/' + title + '/' + size + '.jpg" />');
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
    var generateLink = function(system, title, file) {
        return _Compression.Compress.string(encodeURI(system + '/' + title + '/' + file)); //prehaps slot for load state as query string?
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

    /**
     * a quick function that downlaods all captured screens
     * @return {undef}
     */
    var DownloadAllScreens = function() {

        var delay = 500;
        var time = delay;

        $('.screenshotthumb').each(function(index) {

            var self = this;
            setTimeout(function() {
                $(self)[0].click();
            }, delay);
            time += delay;
        });
    };

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
