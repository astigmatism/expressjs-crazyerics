/**
 * namespace for all crazyerics client functionality
 */
var Crazyerics = function() {

    var self = this;

    $(document).ready(function() {

        //unpack client data
        var clientdata = Crazyerics.prototype._decompress.json(c20); //this name is only used for obfiscation

        self._config = clientdata.configdata;

        //auto capture trigger. comment out to avoid build
        //self._autoCaptureHarness('n64', self._config.autocapture['n64'].shaders, 7000, 1, 10000);

        //unpack playerdata
        self.PlayerData.init(clientdata.playerdata); //player data is user specific, can be dynmic

        //incoming params to open game now?
        var openonload = self.PlayerData.get('openonload') || {};
        if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
            self._bootstrap(openonload.system, openonload.title, openonload.file);
        }

        self._buildRecentlyPlayed(self.PlayerData.get('playhistory'));

        //build console select for search
        for (system in self._config.systemdetails) {
            $('#searchform select').append('<option value="' + system + '">' + self._config.systemdetails[system].shortname + '</option>')
        }

        //loading dial
        $('.dial').knob({
            'change' : function (v) { console.log(v); }
        });

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
                self.replaceSuggestions('/suggest/' + system + '/200');

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
                    response(self._decompress.json(data));
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
                suggestion.append(self._getBoxFront(item[2], item[0], 50));
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
                self._bootstrap(item.data('system'), item.data('title'), item.data('file'));
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
            self._simulateEmulatorKeypress(70); // F
        });

        $('#emulatorcontrolswrapper li.savestate').click(function() {
            self._simulateEmulatorKeypress(49); // 1
        });

        $('#emulatorcontrolswrapper li.loadstate').click(function() {
            self._simulateEmulatorKeypress(52); // 4
        });

        $('#emulatorcontrolswrapper li.mute').click(function() {
            self._simulateEmulatorKeypress(77); // M
        });

        $('#emulatorcontrolswrapper li.decrementslot').click(function() {
            self._simulateEmulatorKeypress(50); // 2
        });

        $('#emulatorcontrolswrapper li.incrementslot').click(function() {
            self._simulateEmulatorKeypress(51); // 3
        });

        $('#emulatorcontrolswrapper li.fastforward').click(function() {
            self._simulateEmulatorKeypress(32); // Space
        });

        $('#emulatorcontrolswrapper li.pause').click(function() {
            self._simulateEmulatorKeypress(80); // P
        });

        $('#emulatorcontrolswrapper li.reset').click(function() {
            self._simulateEmulatorKeypress(72); // H
        });

        $('#emulatorcontrolswrapper li.rewind').click(function() {
            self._simulateEmulatorKeypress(82, 5000); // R
        });

        //for browsing, set up links
        $('#suggestionswrapper a').each(function(index, item) {
            $(item).on('click', function(e) {
                var system = $('#searchform select').val();
                var term = $(item).text();
                self.replaceSuggestions('/suggest/browse/' + system + '?term=' + term);
            });
        });

        self.Sliders.init();

        self.replaceSuggestions('/suggest/all/150'); //begin by showing 150 all console suggestions

        self._toolTips();
    });
};

Crazyerics.prototype._config = {}; //the necessary server configuration data provided to the client
Crazyerics.prototype._Module = null; //handle the emulator Module
Crazyerics.prototype._FS = null; //handle to Module file system
Crazyerics.prototype._ModuleLoading = false; //oldskool way to prevent double loading
Crazyerics.prototype._pauseOverride = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
Crazyerics.prototype._activeFile = null;
Crazyerics.prototype._activeStateSlot = 0;
Crazyerics.prototype._saveStateDeffers = {}; //since saving state to server requires both state and screenshot data, setup these deffers since tracking which comes back first is unknown
Crazyerics.prototype._keypresslocked = false; //when we're sending a keyboard event to the emulator, we want to wait until that event is complete before any additinal keypresses are made (prevents spamming)
Crazyerics.prototype._fileWriteDelay = 500; //in ms. The delay in which the client should respond to a file written by the emulator (sometimes is goes out over the network and we don't want to spam the call)
Crazyerics.prototype._tips = [
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
Crazyerics.prototype._jsonpHandler = null;
Crazyerics.prototype._fileWriteTimers = {};
Crazyerics.prototype._playhistory = {};
Crazyerics.prototype._macroToShaderMenu = [[112, 100], 40, 40, 40, 88, 88, 40, 40, 40, 37, 37, 37, 38, 88, 88, 90, 90, 38, 38, 38, 112]; //macro opens shader menu and clears all passes

/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
Crazyerics.prototype.PlayerData = {

    _data: {},
    /**
     * init data
     * @param  {Object} data
     * @return {undef}
     */
    init: function(data) {
        this._data = data;
    },
    /**
     * get player preference property
     * @param  {string} key
     * @return {string}
     */
    get: function(key) {
        if (this._data.hasOwnProperty(key)) {
            return this._data[key];
        }
        return null;
    },
    /**
     * returns player's shader preference for the system specified
     * @param  {string} system
     * @return {string}
     */
    getShader: function(system) {
        if (this._data.shaders && this._data.shaders.hasOwnProperty(system)) {
            return this._data.shaders[system];
        }
        return null;
    },
    /**
     * set's a player's shader preference for the system specified.
     * @param {string} system
     * @param {string} value
     */
    setShader: function(system, value) {
        if (this._data.shaders) {
            this._data.shaders[system] = value;
        }
        return;
    }
};

Crazyerics.prototype.Sliders = {

    _animating: false, //old skool way to prevent action while animating
    _animationRate: 250, //in ms

    /**
     * initialize this object
     * @return {undef}
     */
    init: function() {
        this._bind();
    },
    /**
     * bind events to dom elements
     * @return {undef}
     */
    _bind: function() {

        var self = this;

        $('#gamecontrolslist li')
        .on('mousedown mouseup click', function(event) {
            event.preventDefault();
            $('#emulator').focus();
        })
        .on('mouseup', function(event) {

            self.open($(this).attr('class'));
        });
    },
    /**
     * go through list of silder controls and seek the correct one to open. if open, then close.
     * @param  {string} key
     * @return {undef}
     */
    open: function(key, stayopen) {

        if (this._animating) {
            return;
        }

        var self = this;
        stayopen = stayopen || false; //if true and open, stay open. if false, will close if open
        this._animating = true;

        $('#gamecontrolslist li').each(function(index, item) {

            var slider = $('#' + $(this).attr('class'));

            //if match found
            if ($(item).hasClass(key)) {

                /**
                 * a quick anon function to toggle the slider intended
                 * @return {undef}
                 */
                var selfToggle = function() {
                    setTimeout(function() {
                        self._toggle(item, slider, function() {
                            self._animating = false;
                        });
                    }, self._animationRate);
                };

                //if closed, open
                if ($(slider).hasClass('closed')) {
                    $(slider).removeClass('closed');
                    selfToggle();
                } else {
                    //already open
                    //should I stay open?
                    if (!stayopen) {
                        $(slider).addClass('closed');
                        selfToggle();
                    } else {
                        //stay open
                        self._animating = false;
                    }
                }
            } else {
                //others in list
                //if does not have class closed, its open, close it. else case is has closed
                if (!$(slider).hasClass('closed')) {
                    $(slider).addClass('closed');
                    self._toggle(item, slider);
                }
            }

        });
    },
    /**
     * closes all sliders by asking to open one that does not exist
     * @return {undef}
     */
    closeall: function() {
        var self = this;
        this.open('');

        //since nothing is opening, we need to turn off the animation flag when all are closed
        setTimeout(function() {
            self._animating = false;
        }, self._animationRate);
    },
    /**
     * toggle simply changes the state of the slider, if open then close, if closed, then open. controled only by this class
     * @param  {Object} li     list dom element, or button
     * @param  {Object} slider div dom element which is the sliding panel
     * @return {undef}
     */
    _toggle: function(li, slider, callback) {

        var self = this;
        callback = callback || null;

        //toggle dom with id of this class name (which is the sliding element)
        $(slider).animate({width: 'toggle', padding: 'toggle'}, self._animationRate, function() {
            if (callback) {
                callback();
            }
        });

        if ($(li).attr('data-click-state') == 0) {
            $(li).attr('data-click-state', 1);
            $(li).find('img').animateRotate(0, 90, self._animationRate);

        } else {
            $(li).attr('data-click-state', 0);
            $(li).find('img').animateRotate(90, 0, self._animationRate);
        }
    }
};
/**
 * function for handling the load and replacement of the suggestions content area
 * @param  {string} system
 * @param  {number} items  the number of items to load and show
 * @return {undef}
 */
Crazyerics.prototype.replaceSuggestions = function(url) {

    var self = this;

    //reset dial
    $('.dial').val(0).trigger('change');

    //show loading icon
    $('#suggestionswrapper').hide();
    $('#loading').removeClass('close');

    $.getJSON(url, function(response) {

        response = self._decompress.json(response);

        //remove all current gamelinks
        $('#suggestionswrapper li').remove();

        var columns = $('#suggestionswrapper ul');

        //use modulus to evenly disperse across all columns
        for (var i = 0; i < response.length; ++i) {
            var gamelink = self._buildGameLink(response[i].system, response[i].title, response[i].file, 120); //build dom elements
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

        self._toolTips();
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
Crazyerics.prototype._bootstrap = function(system, title, file, slot, shader, onStart) {

    var self = this;
    var key = self._compress.gamekey(system, title, file); //for anything that might need it

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
    $('#emulatorwrapper').slideDown(1000);

    //close content area (under emulator)
    $('#gamedetailsbackground').animate({height: 0}, 500);

    //cleanup any pregame details
    $('#gameloadfailure').hide().addClass('close'); //hide load failure element (if previously showing)
    $('#systemshaderseletorwrapper').addClass('close');

    //loading content image and title
    $('#gameloadingname').text(title);
    $('#gameloadingoverlaycontentimage').empty();

    //fade in loading overlay
    $('#gameloadingoverlay').fadeIn(1000);

    //this used to be a callback for the previous call but since its possible for the loading overlay to aready be faded in, we still want to preserve this delay
    setTimeout(function() {

        //cleanup previous play
        self._cleanupEmulator();

        //close any sliders
        self.Sliders.closeall();

        self._ModuleLoading = false; //during shader select, allow other games to load

        //deffered for emulator and game to load them concurrently
        var emulatorReady = $.Deferred();
        var gameReady = $.Deferred();
        var gameDetailsReady = $.Deferred();

        //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
        $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator"></canvas>');

        //begin game and emulator from cdn while the user is looking at the shader dialog
        self._loademulator(system, emulatorReady);
        self._loadGame(key, system, title, file, gameReady);

        //fix text on shader screen
        $('#systemshaderseletorwrapper span').text(self._config.systemdetails[system].shortname);

        //show shader selector
        self._showShaderSelect(system, shader, function(shaderselection) {

            self._ModuleLoading = true; //lock loading after shader select

            //the final deffered call goes to our own server to get states, shaders, etc
            self._loadGameDetails(key, system, title, file, shaderselection, gameDetailsReady);

            //build loading box
            var box = self._getBoxFront(system, title, 170);
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

            //when all deffered calls are ready
            $.when(emulatorReady, gameReady, gameDetailsReady).done(function(emulator, loadedgame, gamecontent) {

                var Module = emulator[0];
                var fs = emulator[1];
                var frame = emulator[2];

                var err = loadedgame[0];
                var gamedata = loadedgame[1];

                var states = gamecontent.states;
                var files = gamecontent.files;
                var shader = null;

                if (gamecontent.hasOwnProperty('shader')) {
                    shader = gamecontent.shader;
                }

                self._Module = Module; //handle to Module
                self._FS = fs;
                self.emulatorframe = frame; //handle to iframe

                //emulator always starts with state slot 0
                self._activeStateSlot = 0;

                $('#emulatorcontrolswrapper').show(); //show controls tool bar (still has closed class applied)

                //console.log(self._generateLink(system, title, file));

                self._setupKeypressInterceptor(system, title, file);

                self._buildFileSystem(Module, system, file, gamedata, states, shader); //write to emulator file system. this is synconous since the fs is emulated in js

                /**
                 * register a callback function when the emulator saves a file
                 * @param  {string} filename
                 * @param  {UInt8Array} contents
                 * @return {undef}
                 */
                Module.emulatorFileWritten = function(filename, contents) {
                    self._emulatorFileWriteListener(key, system, title, file, filename, contents);
                };

                //begin game
                setTimeout(function() {
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
                        self._buildGameContent(system, title, function() {

                        });

                        $('#gameloadingoverlaycontent').addClass('close');
                        $('#gameloadingoverlay').fadeOut(1000, function() {

                            //hide tips
                            $('#tips').stop().hide();
                            clearInterval(tipInterval);

                            //show controls initially to reveal their presence
                            setTimeout(function() {
                                self._ModuleLoading = false;
                                $('#emulatorcontrolswrapper').addClass('closed');

                                //to help new players, reveal controls after load
                                self.Sliders.open('controlsslider');
                            }, 1000);
                        });

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
                    };

                    // load state?
                    // we need to handle mulitple keypresses asyncrounsly to ensure the emulator recieved input
                    if (slot) {
                        self._asyncLoop(parseInt(slot, 10), function(loop) {

                            //simulate increasing state slot (will also set self._activeStateSlot)
                            self._simulateEmulatorKeypress(51, 10, function() {
                                loop.next();
                            });

                        }, function() {
                            self._simulateEmulatorKeypress(52); //4 load state
                            removeVail();
                        });
                    } else {
                        removeVail();
                    }
                }, 3000); //testing fixing raced start
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
Crazyerics.prototype._showShaderSelect = function(system, preselectedShader, callback) {

    var self = this;

    $('#shaderselectlist').empty(); //clear all previous content

    //check if shader already defined for this system
    if (typeof preselectedShader !== 'undefined') {
        $('#systemshaderseletorwrapper').hide().addClass('close');
        callback({
            'shader': preselectedShader,
            'save': false
        });
        return;
    }

    //check if user checked to use a shader for this system everytime
    var userpreference = self.PlayerData.getShader(system);
    if (userpreference) {
        callback({
            'shader': userpreference,
            'save': false
        });
        return;
    }

    //get the recommended shaders list
    var recommended = self._config.recommendedshaders[system];
    var shaderfamilies = self._config.shaders;
    var i = 0;

    //suggest all (for debugging), remove when the ability to test all shaders is present
    // for (shaderfamily in shaderfamilies) {
    //     for (shader in shaderfamilies[shaderfamily]) {
    //         $('#shaderselectlist').append($('<div style="display:inline-block;padding:0px 5px;" data-shader="' + shader + '">' + shader + '</div>').on('click', function(e) {
    //             onFinish($(this).attr('data-shader'));
    //         }));
    //     }
    // }

    $('#shaderselectlist').append($('<li class="zoom" data-shader=""><h3>Pixels</h3><img src="' + self._config.assetpath + '/images/shaders/' + system + '/pixels.png" /><p>No Picture Processing</p></li>').on('click', function(e) {
        onFinish($(this).attr('data-shader'));
    }));

    for (i; i < recommended.length; ++i) {

        var key = recommended[i];

        $('#shaderselectlist').append($('<li class="zoom" data-shader="' + key.shader + '"><h3>' + key.title + '</h3><img src="' + self._config.assetpath + '/images/shaders/' + system + '/' + i + '.png" /><p>Filter: ' + key.shader + '</p></li>').on('click', function(e) {
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
                'save': saveselection
            });
        }, 250);
    };

    $('#systemshaderseletorwrapper').show().removeClass();
};

/**
 * build content area underneath emulator canvas
 * @param  {string}   system
 * @param  {string}   title
 * @param  {Function} callback
 * @return {undef}
 */
Crazyerics.prototype._buildGameContent = function(system, title, callback) {

    var box = this._getBoxFront(system, title, 170);

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
Crazyerics.prototype._cleanupEmulator = function() {

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
Crazyerics.prototype._simulateEmulatorKeypress = function(key, keyUpDelay, callback) {

    var self = this;
    keyUpDelay = keyUpDelay || 10;

    if (this._Module && this._Module.RI && this._Module.RI.eventHandler) {

        if (self._keypresslocked) {
            return;
        }

        self._keypresslocked = true;
        var e;
        e = $.Event('keydown');
        e.keyCode = key;
        e.which = key;
        this._Module.RI.eventHandler(e); //dispatch keydown
        setTimeout(function() {
            e = $.Event('keyup');
            e.keyCode = key;
            e.which = key;
            self._Module.RI.eventHandler(e); //after wait, dispatch keyup
            setTimeout(function() {
                self._keypresslocked = false;
                if (callback) {
                    callback();
                }
            }, 100);
        }, keyUpDelay);
        $('#emulator').focus();
    }
};

/**
 * Runs a series of keyboard instructions by keycode with optional delays between keystrokes
 * @param  {Object|Array}   instructions
 * @param  {Function} callback
 * @return {undef}
 */
Crazyerics.prototype._runKeyboardMacro = function(instructions, callback) {

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

    self._simulateEmulatorKeypress(keycode, 1, function() {
        self._runKeyboardMacro(instructions.slice(1), callback);
    });
};

/**
 * intercepts all key presses heading to emulator. allows for additional application actions
 * @param  {string} system
 * @param  {string} title
 * @param  {string} file
 * @return {undef}
 */
Crazyerics.prototype._setupKeypressInterceptor = function(system, title, file) {

    var self = this;

    if (this._Module && this._Module.RI && this._Module.RI.eventHandler) {

        var callback = this._Module.RI.eventHandler;

        /**
         * event handling function from Module
         * @param  {Object} event
         * @return {undef}
         */
        this._Module.RI.eventHandler = function(event) {

            switch (event.type) {
                case 'keyup':
                    var key = event.keyCode;
                    switch (key) {
                        case 70: // F - fullscreen
                            self._Module.requestFullScreen(true, true);
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

                                self._saveStateToServer(statedetails, screendetails);
                            });
                            self._simulateEmulatorKeypress(84); //initiaze screenshot after its defer is in place.
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
            callback(event);
        };
    }
};

/**
 * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
 * @param  {string} system
 * @param  {Object} deffered
 * @return {undef}
 */
Crazyerics.prototype._loademulator = function(system, deffered) {

    var frame  = $('<iframe/>', {
        src: '/load/emulator/' + system,
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
Crazyerics.prototype._loadGame = function(key, system, title, file, deffered) {

    var self = this;
    var location = self._config.rompath;
    var flattened = self._config.flattenedromfiles;

    //if rom struture is flattened, this means that all rom files have been converted to single json files
    if (flattened) {

        var filename = self._compress.string(title + file);
        //location += '/' + system + '/a.json'; //encode twice: once for the trip, the second because the files are saved that way on the CDN
        location += '/' + system + '/' + encodeURIComponent(encodeURIComponent(filename)) + '.json'; //encode twice: once for the trip, the second because the files are saved that way on the CDN
    } else {
        location += '/' + system + '/' + title + '/' + file;
    }

    /**
     * loading game jsonp handler is called upon response from CDN
     * @param  {string} response compressed game data
     * @return {undefined}
     */
    self._jsonpHandler = function(response) {

        var inflated;
        try {
            var decompressed = self._decompress.string(response);
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
 * a trip to the server (same domain) to load an extra details about a game at load: states, rom files, ...
 * @param  {string} system
 * @param  {string} title
 * @param  {string} file
 * @param  {Object} shaderdetails
 * @param  {Object} deffered
 * @return {undef}
 */
Crazyerics.prototype._loadGameDetails = function(key, system, title, file, shaderdetails, deffered) {

    var self = this;
    var qs = {
        'key': encodeURIComponent(key),
        'shader': shaderdetails.shader,
        'save': shaderdetails.save
    }

    //call returns not only states but misc game details. I tried to make this
    //part of the loadGame call but the formatting for the compressed game got weird
    $.get('/load/game?' + $.param(qs), function(data) {

        //add to play history
        self._addToPlayHistory(key, system, title, file);

        deffered.resolve(self._decompress.json(data));
    });
};

/**
 * Once Module has loaded with its own file system, populate ir with config and rom file
 * @param  {Object} Module
 * @param  {string} system
 * @param  {string} file
 * @param  {string} data
 * @param  {Object} states
 * @param  {Object} shader
 * @return {undef}
 */
Crazyerics.prototype._buildFileSystem = function(Module, system, file, data, states, shader) {

    var self = this;

    //game
    Module.FS_createDataFile('/', file, data, true, true);
    Module.arguments = ['-v', '/' + file];
    //Module.arguments = ['-v', '--menu'];

    //shaders
    Module.FS_createFolder('/', 'shaders', true, true);

    //if in coming shader parameter is an object, then it has shader files defined. self._FS is a handle to the
    //module's file system. Yes, the other operations here reference the file system through the Module, you just don't have to anymore!
    var shaderPresetToLoad = null;
    if (shader && self._FS) {

        for (var shaderfile in shader) {
            var content = self._decompress.bytearray(shader[shaderfile]);
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

    //config, must be after shader
    Module.FS_createFolder('/', 'etc', true, true);
    if (self._config.retroarch && self._config.retroarch[system]) {

        var configToLoad = self._config.retroarch[system];

        if (shaderPresetToLoad) {
            configToLoad = 'video_shader =\"/shaders/' + shaderPresetToLoad + '\"\n' + configToLoad;
        }
        Module.FS_createDataFile('/etc', 'retroarch.cfg', configToLoad, true, true);
    }

    //screenshots
    Module.FS_createFolder('/', 'screenshots', true, true);

    //states
    for (var slot in states) {
        var statedata = self._decompress.bytearray(states[slot].state);
        var filenoextension = file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
        var statefilename = '/' + filenoextension + '.state' + (slot == 0 ? '' : slot);
        Module.FS_createDataFile('/', statefilename, statedata, true, true);
    }
};

Crazyerics.prototype._saveStateToServer = function(statedetails, screendetails) {

    var self = this;

    //state details is a resolve on a deferred. all return data in array
    var key = statedetails[0];
    var system = statedetails[1];
    var title = statedetails[2];
    var file = statedetails[3];
    var slot = statedetails[4];
    var statedata = statedetails[5];

    var screenshot = self._compress.bytearray(screendetails);

    //compress payload for server
    var data = self._compress.json({
        'state': statedata,
        'screenshot': screenshot
    });

    $.ajax({
        url: '/states/save?key=' + encodeURIComponent(key) + '&slot=' + slot,
        data: data,
        processData: false,
        contentType: 'text/plain',
        type: 'POST',
        /**
         * on completion of state save
         * @param  {string} data
         * @return {undef}
         */
        complete: function(data) {

            //when complete, we have something to load. show in recently played
            var statedetails = {};
            statedetails[slot] = {
                time: Date.now(),
                screenshot: screenshot
            };
            self._addToPlayHistory(key, system, title, file, null, statedetails);
        }
    });
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
Crazyerics.prototype._emulatorFileWritten = function(key, system, title, file, filename, contents) {

    var self = this;
    var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit
    var screenshotmatch = filename.match(/\.bmp$/);

    // match will return an array when match was successful, our capture group with the slot value, its 1 index
    if (statematch) {

        var slot = statematch[1] === '' ? 0 : statematch[1]; //the 0 state does not use a digit
        var data = self._compress.bytearray(contents);

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
        var img = self._buildScreenshot(system, arrayBufferView, width);

        $(img).addClass('close').load(function() {
            $(this).removeClass('close');
        });
        var a = $('<a class="screenshotthumb" href="' + imageUrl + '" download="' + title + '-' + filename + '"></a>'); //html 5 spec downloads image
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
Crazyerics.prototype._buildScreenshot = function(system, arraybufferview, width) {

    var self = this;

    var screenratio = 1;

    var blob = new Blob([arraybufferview], {
        type: 'image/bmp'
    });

    //get screen ratio from config
    if (self._config.retroarch && self._config.retroarch[system]) {
        screenratio = self._config.retroarch[system].match(/video_aspect_ratio = (\d+\.+\d+)/);
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
Crazyerics.prototype._emulatorFileWriteListener = function(key, system, title, file, filename, contents) {

    var self = this;

    //clear timer if exists
    if (self._fileWriteTimers.hasOwnProperty(filename)) {
        clearTimeout(self._fileWriteTimers[filename]);
    }

    //write new timer
    self._fileWriteTimers[filename] = setTimeout(function() {

        //if timer runs out before being cleared again, delete it and call file written function
        delete self._fileWriteTimers[filename];
        self._emulatorFileWritten(key, system, title, file, filename, contents);
    }, self._fileWriteDelay);
};

/**
 * on page load, build the recently played content area from clientdata passed from server
 * @param  {Object} clientdata
 * @param  {number} maximum        //no used at the moment since we want to show the entire play history and let the user delete what they don't want to see
 * @return {undef}
 */
Crazyerics.prototype._buildRecentlyPlayed = function(clientdata, maximum) {

    for (var game in clientdata) {
        this._addToPlayHistory(game, clientdata[game].system, clientdata[game].title, clientdata[game].file, clientdata[game].played, clientdata[game].slots);
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
Crazyerics.prototype._addToPlayHistory = function(key, system, title, file, played, slots) {

    var self = this;
    var slot;

    //handling dupes will be a common function, replace the date and handle the states slots
    if (key in self._playhistory) {
        self._playhistory[key].played = Date.now();

        //update any states saved:
        // if (slots) {
        //     for (slot in slots) {
        //         self._addStateToPlayHistory(self._playhistory[key], self._playhistory[key].stateswrapper, slot, slots[slot]);
        //     }
        // }
        self._toolTips();
        return;
    }

    //not a dupe, let's create a new play histry game

    var gamelink = self._buildGameLink(system, title, file, 120, true); //get a game link

    gamelink.li.addClass('close');

    gamelink.img.load(function() {
        gamelink.li.removeClass('close');
    });

    //the remove link will delete the game from play history and any saved states
    gamelink.remove
    .addClass('tooltip')
    .attr('title', 'Remove this game and all saved states')
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

    //create the saved state area and add states to it
    //var stateswrapper = $('#statewrappersource').clone();
    //stateswrapper.attr('id', '').data('key', key);
    
    //var stateswrapper = $('<ul class="statewrappertest"></ul>');

    //$(gamelink.li).append(stateswrapper);

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
        })
    }

    //figure out where to insert this gamelink in the recently played area
    var columns = $('#recentplayedwrapper ul.column');
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

    self._toolTips();
};

/**
 * adding a state button for a game to the play history area
 * @param {Object} details       this function is called from the _addToPlayHistory function which passes a data blob of game details
 * @param {Object} stateswrapper dom element
 * @param {number} slot
 * @param {Object} slot time and sceenshot of state saved
 */
// Crazyerics.prototype._addStateToPlayHistory = function(details, stateswrapper, slot, statedetails) {

//     var self = this;

//     var date = new Date(statedetails.time);
//     var screenshot = self._decompress.bytearray(statedetails.screenshot);

//     var image = self._buildScreenshot(details.system, screenshot, 100); //build dom image of screenshot

//     var formatteddate = $.format.date(date, 'E MM/dd/yyyy h:mm:ss a'); //using the jquery dateFormat plugin

//     var li = $('<li class="zoom tooltip" title="' + formatteddate + '"></li>')
//     .on('mousedown', function() {
//         self._pauseOverride = true; //prevent current game from pausng before fadeout
//     })
//     .on('mouseup', function() {

//         self._bootstrap(details.system, details.title, details.file, slot);
//         window.scrollTo(0,0);
//     });

//     li.append(image);

//     li.append('<div class="caption">' + slot + '</div>');

//     $(stateswrapper).append(li);


//     return;

//     var loadstate = $('<div data-slot="' + slot + '" class="statebutton zoom tooltip" title="Load State Saved ' + formatteddate + '">' + slot + '</div>')
//     .on('mousedown', function() {
//         self._pauseOverride = true; //prevent current game from pausng before fadeout
//     })
//     .on('mouseup', function() {

//         self._bootstrap(details.system, details.title, details.file, slot);
//         window.scrollTo(0,0);
//     });

//     loadstate.append(image);

//     //two conditions here - the same state is being saved (replace) or a new state is saved and we need to insert it correctly
//     var gotinserted = false;
//     stateswrapper.children().each(function() {

//         //convert both to numbers for comparison (they are strings because they are used as properties in an object)
//         var currentslot = parseInt($(this).attr('data-slot'), 10);
//         slot = parseInt(slot, 10);

//         if (currentslot === slot) {
//             loadstate.insertBefore(this);
//             $(this).remove();
//             gotinserted = true;
//             return false;
//         } else if (currentslot > slot) {
//             loadstate.insertBefore(this);
//             gotinserted = true;
//             return false;
//         }
//     });

//     //if it didn't get insert its either the first state saved or the greatest
//     if (!gotinserted) {
//         stateswrapper.append(loadstate);
//     }
// };

/**
 * a common function which returns an li of a game box which acts as a link to bootstrap load the game and emulator
 * @param  {string} system
 * @param  {string} title
 * @param  {number} size        the size of the box front image to load (114, 150)
 * @param  {boolean} close      if true, shows the close button at the corner, no event attached
 * @return {Object}             Contains reference to the li, img and close button
 */
Crazyerics.prototype._buildGameLink = function(system, title, file, size, close) {
    var self = this;
    close = close || false;

    var li = $('<li class="gamelink"></li>');
    var box = self._getBoxFront(system, title, size);

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

            self._bootstrap(system, title, file);
            window.scrollTo(0,0);
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
Crazyerics.prototype._getBoxFront = function(system, title, size) {

    var self = this;

    //have box title's been compressed (to obfiscate on cdn)
    if (self._config.flattenedboxfiles) {
        //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
        title = encodeURIComponent(encodeURIComponent(self._compress.string(title)));
    }

    //incldes swap to blank cart onerror
    return $('<img onerror="this.src=\'' + self._config.assetpath + '/images/blanks/' + system + '_' + size + '.png\'" src="' + self._config.boxpath + '/' + system + '/' + title + '/' + size + '.jpg" />');
};

/**
 * generates tooltips for all objects which might have been added that require it
 * @return {undef}
 */
Crazyerics.prototype._toolTips = function() {
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
Crazyerics.prototype._generateLink = function(system, title, file) {
    return this._compress.string(encodeURI(system + '/' + title + '/' + file)); //prehaps slot for load state as query string?
};

Crazyerics.prototype._compress = {
    /**
     * compress and base64 encode a uint8array
     * @param  {UInt8Array} uint8array
     * @return {string}
     */
    bytearray: function(uint8array) {
        var deflated = pako.deflate(uint8array, {to: 'string'});
        return btoa(deflated);
    },
    /**
     * comrpess and base64 encode a json object
     * @param  {Object} json
     * @return {string}
     */
    json: function(json) {
        var string = JSON.stringify(json);
        var deflate = pako.deflate(string, {to: 'string'});
        var base64 = btoa(deflate);
        return base64;
    },
    /**
     * compress and base64 encode a string
     * @param  {string} string
     * @return {string}
     */
    string: function(string) {
        var deflate = pako.deflate(string, {to: 'string'});
        var base64 = btoa(deflate);
        return base64;
    },
    /**
     * a "gamekey" is an identifer on the server-end for system, title, file. we use it for a bunch of stuff from loading/saving states to loading games
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @return {string}
     */
    gamekey: function(system, title, file) {
        return this.json({
            system: system,
            title: title,
            file: file
        });
    }
};

Crazyerics.prototype._decompress = {
    /**
     * decompress and base64 decode a string to uint8array
     * @param  {string} item
     * @return {UInt8Array}
     */
    bytearray: function(item) {
        var decoded = new Uint8Array(atob(item).split('').map(function(c) {return c.charCodeAt(0);}));
        return pako.inflate(decoded);
    },
    /**
     * decompress and base64 decode a string to json
     * @param  {string} item
     * @return {Object}
     */
    json: function(item) {
        var base64 = atob(item);
        var inflate = pako.inflate(base64, {to: 'string'});
        var json = JSON.parse(inflate);
        return json;
    },
    /**
     * decompress a string
     * @param  {string} item
     * @return {string}
     */
    string: function(item) {
        var base64 = atob(item);
        var inflate = pako.inflate(base64, {to: 'string'});
        return inflate;
    }
};

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
 * asychonous iteration helper
 * @param  {number}   iterations
 * @param  {Function}   func
 * @param  {Function} callback
 * @return {Object}
 */
Crazyerics.prototype._asyncLoop = function(iterations, func, callback) {
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
 * function to manage the capturing of screenshots automatically
 * this function is commented out when not in use to avoid getting built
 * @param  {string} system          game system
 * @param  {Array} shaderqueue      array of shaders to capture
 * @param  {number} capturedelta    the amount of time in ms to wait before the next capture
 * @param  {number} numberofshots   maximum number of shots to take per shader
 * @return {undef}
 */
// Crazyerics.prototype._autoCaptureHarness = function(system, shaderqueue, capturedelta, numberofshots, delay) {

//     var self = this;

//     if (shaderqueue.length === 0) {
//         self._simulateEmulatorKeypress(112); //press f1 on finish to pause
//         self.downloadAllScreens();
//         return;
//     }

//     var remaining = numberofshots;

//     //get capture details
//     var data = self._config.autocapture[system];

//     setTimeout(function() {

//         self._bootstrap(system, data.title, data.file, null, shaderqueue[0], function() {

//             /**
//              * capture function takes in a macro of key presses to accomplish a click.
//              * since this changes from the first shot to the subsequent
//              * @param  {Array} marco
//              * @return {undef}
//              */
//             var capture = function(marco) {

//                 //wait to capture, let the game run
//                 setTimeout(function() {

//                     //press F1 to pause the game
//                     self._simulateEmulatorKeypress(112, null, function() {

//                         //run marco to capture a screenshot
//                         self._runKeyboardMacro(marco, function() {

//                             console.log(shaderqueue[0] + ' shot: ' + remaining);

//                             //press F1 again to continue playing game
//                             self._simulateEmulatorKeypress(112, null, function() {

//                                 remaining--;

//                                 //if remaining shots need to be taken, run the capture function again, otherwise move to next shader
//                                 if (remaining === 0) {
//                                     //next in queue
//                                     shaderqueue.shift();
//                                     self._autoCaptureHarness(system, shaderqueue, capturedelta, numberofshots);
//                                     return;
//                                 } else {
//                                     capture([88]); //continue capturing
//                                 }
//                             });
//                         });
//                     });
//                 }, capturedelta);
//             };
//             capture([40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 88]);
//         });

//     }, delay);
// };

/**
 * a quick function that downlaods all captured screens
 * @return {undef}
 */
Crazyerics.prototype.downloadAllScreens = function() {

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

var crazyerics = new Crazyerics();

/**
 * globally defined jsonp deletegate. runs when jsonp is fetched. common scheme is to define a handler for calling jsonp
 * @param  {Object} response
 * @return {undef}
 */
var jsonpDelegate = function(response) {
    crazyerics._jsonpHandler(response);
};
