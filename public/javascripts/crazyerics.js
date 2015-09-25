var FS = null;

/**
 * namespace for all crazyerics client functionality
 */
var Crazyerics = function() {

    var self = this;

    //self._socket = io.connect(window.location.hostname + ':3000');

    $(document).ready(function() {

        //decompress clientdata
        self._clientdata = self._decompress.json(clientdata);

        //incoming params to open game now?
        var openonload = self._clientdata.openonload || {};
        if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
            self._bootstrap(openonload.system, openonload.title, openonload.file);
        }

        self._buildRecentlyPlayed(self._clientdata.playhistory);

        //console select
        $('#searchform select').selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                self.replaceSuggestions($(this).val());
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

        $('#gamecontrolslist li.controls')
        .on('mousedown', function() {

            //override pausing emulator if it is active
            if ($('#emulator').is(':focus')) {
                self._pauseOverride = true;
            }
        })
        .on('mouseup', function(event) {

            //immediately give focus back if it had it
            if (self._pauseOverride) {
                $('#emulator').focus();
                self._pauseOverride = false;
            }

            $('#controlsslider').animate({width: 'toggle', padding: 'toggle'}, 500);

            if ($(this).attr('data-click-state') == 0) {
                $(this).attr('data-click-state', 1);
                $(this).find('img').animateRotate(0, 90, 500);

            } else {
                $(this).attr('data-click-state', 0);
                $(this).find('img').animateRotate(90, 0, 500);
            }
        });

        self.replaceSuggestions('all');

        self._toolTips();
    });
};

Crazyerics.prototype._clientdata = null;
Crazyerics.prototype._Module = null; //handle the emulator Module
Crazyerics.prototype._ModuleLoading = false; //oldskool way to prevent double loading
Crazyerics.prototype._pauseOverride = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
Crazyerics.prototype._activeFile = null;
Crazyerics.prototype._activeSaveStateSlot = 0;
Crazyerics.prototype._keypresslocked = false; //when we're sending a keyboard event to the emulator, we want to wait until that event is complete before any additinal keypresses are made (prevents spamming)
Crazyerics.prototype._tips = [
    'Back out of that mistake you made by holding the R key to rewind the game',
    'Press the Space key to fast forward through those boring story scenes',
    'If your browser supports it, you can go fullscreen by pressing the F key',
    'You can save your progress by pressing the 1 key, return to it anytime with the 4 key',
    'We\'ll store all of your save states as long as you return within two weeks',
    'Pause your game with the P key',
    'Select a system filter to generate a new list of suggested games',
    'To search for more obsurace or forgeign titles, select a system filter first'
];
Crazyerics.prototype._playhistory = {};
Crazyerics.prototype._socket = null; //socket.io

/**
 * function for handling the load and replacement of the suggestions content area
 * @param  {string} system
 * @param  {number} items  the number of items to load and show
 * @return {undef}
 */
Crazyerics.prototype.replaceSuggestions = function(system, items) {

    var self = this;
    items = items || 100;

    //show loading icon
    $('#suggestionswrapper').hide();
    $('#loading').removeClass('close');

    $.getJSON('/suggest/' + system + '/' + items, function(response) {

        response = self._decompress.json(response);

        //remove all current gamelinks
        $('#suggestionswrapper li').remove();

        var columns = $('#suggestionswrapper ul');

        //use modulus to evenly disperse across all columns
        for (var i = 0; i < response.length; ++i) {
            var gamelink = self._buildGameLink(response[i].system, response[i].title, response[i].file, 120);
            $(columns[i % columns.length]).append(gamelink.li);
        }

        //when all images have loaded, show suggestions
        $('#suggestionswrapper').waitForImages().progress(function(loaded, count, success) {

            $('#loading .loadingtext').text(loaded + '%');

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
 * @return {undef}
 */
Crazyerics.prototype._bootstrap = function(system, title, file, slot) {

    var self = this;

    if (self._ModuleLoading) {
        return;
    }
    self._ModuleLoading = true;
    self._pauseOverride = false;

    $('#gameloadingname').text(title);

    //fade out content
    $('#gamedetailsboxfront img').addClass('close');
    $('#gamedetailswrapper').fadeOut();

    //move welcome and emulator into view (first time only)
    $('#startmessage').slideUp(1000);
    $('#emulatorwrapper').slideDown(1000);

    //loading image
    $('#gameloadingoverlaycontentimage').empty();

    var box = self._getBoxFront(system, title, 170);
    box.addClass('tada');
    box.load(function() {
        $(this).fadeIn(200);
    });
    $('#gameloadingoverlaycontentimage').append(box);

    var tipInterval = setInterval(function() {
        $('#tip').fadeOut(500, function() {
            var tip = Crazyerics.prototype._tips[Math.floor(Math.random() * Crazyerics.prototype._tips.length)];
            
            if(!$('#gameloadingoverlay').is(':animated')) {
                $('#tip').empty().append('Tip: ' + tip).fadeIn(500);
            }
        });
    }, 5000); //show tip for this long


    //fade in overlay
    $('#gameloadingoverlay').fadeIn(500, function() {

        //close any sliders
        $('#gamecontrolslist li').each(function() {
            if ($(this).attr('data-click-state') == 1) {
                $(this).mouseup();
            }
        });

        $('#gameloadingoverlaycontent').removeClass();
        $('#emulatorcontrolswrapper').show(); //show controls initially to reveal their presence

        self._cleanupEmulator();

        //create new canvas
        $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator"></canvas>');

        //deffered for emulator and game to load them concurrently
        var emulatorReady = $.Deferred();
        var gameReady = $.Deferred();
        var gameDetailsReady = $.Deferred();

        // self._socket.emit('start', 'test', function (data) {
        //     console.log(data); // data will be 'woot'
        // });

        $.when(emulatorReady, gameReady, gameDetailsReady).done(function(emulator, loadedgame, gamecontent) {

            var Module = emulator[0];
            var fs = emulator[1];
            var frame = emulator[2];

            var err = loadedgame[0];
            var gamedata = loadedgame[1];

            var states = gamecontent.states;
            var files = gamecontent.files;

            self._Module = Module; //handle to Module
            FS = fs;
            self.emulatorframe = frame; //handle to iframe

            //console.log(self._generateLink(system, title, file));

            self._setupKeypressInterceptor(system, title, file);

            self._buildFileSystem(Module, system, file, gamedata, states);

            //begin game
            Module.callMain(Module.arguments);


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
                        //$('#emulatorcontrolswrapper').slideToggle({ direction: "down" }, 300);
                        $('#emulatorcontrolswrapper').addClass('closed');

                        //becuse I have nothing else to show, reveal controls
                        $('#gamecontrolslist li').each(function() {
                            if ($(this).attr('data-click-state') == 0) {
                                $(this).mouseup();
                            }
                        });
                        
                    }, 3000);

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


            //load state?
            if (slot) {
                self._asyncLoop(parseInt(slot, 10), function(loop) {
                    
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
        });

        self._loademulator(system, emulatorReady);
        self._loadGame(system, title, file, gameReady);
        self._loadGameDetails(system, title, file, gameDetailsReady);
    });
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
        // first measure the area the box will use. is it greater? use that distance to slide
        var distance = this.height > 232 ? this.height : 232;
        $('#gamedetailsboxfront img').addClass('close');
        $('#gamedetailsbackground').animate({
            height: distance
        }, 1000, function() {

            //fade in details
            $('#gamedetailswrapper').fadeIn(1000, function() {

                $('#gametitle').bigText({
                    textAlign: 'left',
                    horizontalAlign: 'left'
                }); //auto size text to fit
                $('#gametitle').fadeIn(500);
                $('#gamedetailsboxfront img').removeClass();

                //load controls
                $('#controlsslider').empty();
                $.get('/layout/controls/' + system, function(result) {
                    $('#controlsslider').append(result);
                });

                callback();
            });
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

    self._activeSaveStateSlot = 0;

    if (FS) {
        FS = null;
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
                        case 70: // F
                            self._Module.requestFullScreen(true, true);
                        break;
                        case 49: //save state. small delay necessary since this function call would fire before the emulator writes to the FS
                            setTimeout(function() {
                                self._saveState(system, title, file, self._activeSaveStateSlot, function() {
                                });
                            },100);
                        break;
                        case 50: //decrement state
                            self._activeSaveStateSlot = self._activeSaveStateSlot === 0 ? 0 : self._activeSaveStateSlot - 1;
                        break;
                        case 51: //incremenet state
                            self._activeSaveStateSlot++;
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
            deffered.resolve(Module, FS, frame);
        }
    });
    $('body').append(frame);
};

/**
 * load rom file from server. will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
 * @param  {string} system
 * @param  {string} title
 * @param  {string} file
 * @param  {Object} deffered
 * @return {undef}
 */
Crazyerics.prototype._loadGame = function(system, title, file, deffered) {

    var self = this;

    $.get('/load/game?key=' + encodeURIComponent(self._compress.gamekey(system, title, file)), function(data) {
        var inflated;
        try {
            inflated = pako.inflate(data); //inflate compressed string to arraybuffer
        } catch (e) {
            deffered.resolve(e);
            return;
        }

        //add to play history
        self._addToPlayHistory(self._compress.gamekey(system, title, file), system, title, file);

        deffered.resolve(null, inflated);
    });
};

/**
 * a trip to the server to load an extra details about a game at load: states, rom files, ...
 * @param  {string} system
 * @param  {string} title
 * @param  {string} file
 * @param  {Object} deffered
 * @return {undef}
 */
Crazyerics.prototype._loadGameDetails = function(system, title, file, deffered) {

    var self = this;
    //call returns not only states but misc game details. I tried to make this
    //part of the loadGame call but the formatting for the compressed game got weird
    $.get('/states/load?key=' + encodeURIComponent(self._compress.gamekey(system, title, file)), function(data) {
        deffered.resolve({
            states: data.states,
            files: self._decompress.json(data.files)
        });
    });
};

/**
 * Once Module has loaded with its own file system, populate ir with config and rom file
 * @param  {Object} Module
 * @param  {string} system
 * @param  {string} file
 * @param  {string} data
 * @return {undef}
 */
Crazyerics.prototype._buildFileSystem = function(Module, system, file, data, states) {

    var self = this;

    //game
    Module.FS_createDataFile('/', file, data, true, true);
    Module.arguments = ['-v', '/' + file];
    //Module.arguments = ['-v', '--menu'];

    //config
    Module.FS_createFolder('/', 'etc', true, true);
    if (self._clientdata.retroarch && self._clientdata.retroarch[system]) {
        Module.FS_createDataFile('/etc', 'retroarch.cfg', self._clientdata.retroarch[system], true, true);
    }

    //states
    for (var slot in states) {
        var statedata = self._decompress.bytearray(states[slot]);
        var filenoextension = file.replace(new RegExp('\.[a-z]{1,3}$', 'gi'), '');
        var statefilename = '/' + filenoextension + '.state' + (slot == 0 ? '' : slot);
        Module.FS_createDataFile('/', statefilename, statedata, true, true);
    }
};

/**
 * function for handling a save state
 * @param  {string}   system
 * @param  {string}   title
 * @param  {string}   file
 * @param  {number}   slot
 * @param  {Function} callback
 * @return {undef}
 */
Crazyerics.prototype._saveState = function(system, title, file, slot, callback) {

    var self = this;
    var filenoextension  = file.replace(new RegExp('\.[a-z]{1,3}$', 'gi'), '');
    var filename         = filenoextension + '.state' + (slot == 0 ? '' : slot);
    var statecontent;
    var gamekey = self._compress.gamekey(system, title, file);

    try {
        statecontent = FS.open(filename);
    } catch (e) {
        console.log(e);
        return;
    }

    if (statecontent && statecontent.node && statecontent.node.contents) {

        var data = self._compress.bytearray(statecontent.node.contents);

        $.ajax({
            url: '/states/save?key=' + encodeURIComponent(gamekey) + '&slot=' + slot,
            data: data,
            processData: false,
            contentType: 'text/plain',
            type: 'POST',
            /**
             * up on successfully state save
             * @param  {Object} data
             * @return {undef}
             */
            complete: function(data) {
            
                //when complete, we have something to load. show in recently played
                var statedetails = new Object();
                statedetails[slot] = Date.now();
                self._addToPlayHistory(gamekey, system, title, file, null, statedetails);
            }
        });
    }
};

Crazyerics.prototype._buildRecentlyPlayed = function(clientdata, maximum) {
  
    for (game in clientdata) {
        this._addToPlayHistory(game, clientdata[game].system, clientdata[game].title, clientdata[game].file, clientdata[game].played, clientdata[game].slots);
    }

    if ($.isEmptyObject(clientdata)) {
        $('#startfirst').animate({height: 'toggle', opacity: 'toggle'}, 500);
    } else {
        $('#startplayed').animate({height: 'toggle', opacity: 'toggle'}, 500);
    }
};

Crazyerics.prototype._addToPlayHistory = function(key, system, title, file, played, slots) {

    var self = this;

    //handling dupes will be a common function, replace the date and handle the states slots 
    if (key in self._playhistory) {
        self._playhistory[key].played = Date.now();

        //update any states saved:
        if (slots) {
            for (slot in slots) {
                self._addStateToPlayHistory(self._playhistory[key], self._playhistory[key].stateswrapper, slot, slots[slot]);
            }
        }
        self._toolTips();
        return;
    }   

    //not a dupe, let's create a new play histry game

    var gamelink = self._buildGameLink(system, title, file, 120, true, slots); //get a game link 

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
            complete: function() {
                setTimeout(function() {
                    gamelink.li.remove();
                }, 500);
            }
        });
    });

    //create the saved state area and add states to it
    var stateswrapper = $('<div class="statewrapper"></div>');
    gamelink.li.append(stateswrapper);

    //create a local store to take this with handle to dom elements
    self._playhistory[key] = {
        system: system,
        title: title,
        file: file,
        played: played || Date.now(),
        slots: slots || {},
        stateswrapper: stateswrapper
    };

    //append states, if any
    if (slots) {
        for (slot in slots) {
            self._addStateToPlayHistory(self._playhistory[key], stateswrapper, slot, slots[slot]);
        }
    }

    //figure out where to insert this gamelink in the recently played area
    var columns = $('#recentplayedwrapper ul');
    var column = columns[0];
    for (var i = 0; i < columns.length; ++i) {
        column = ($(columns[i]).children().length < $(column).children().length) ? columns[i] : column;
    }
    $(column).append(gamelink.li); //append to recently played area

    $('#recentplayedwrapper').show(); //ensure it is showing (will be hidden first time)

    self._toolTips();
};

Crazyerics.prototype._addStateToPlayHistory = function(details, stateswrapper, slot, date) {

    var self = this;
    date = new Date(date);
    var formatteddate = $.format.date(date, 'E MM/dd/yyyy h:mm:ss a'); //using the jquery dateFormat plugin

    var loadstate = $('<div data-slot="' + slot + '" class="statebutton zoom tooltip" title="Load State Saved ' + formatteddate + '">' + slot + '</div>')
    .on('mousedown', function() {
        self._pauseOverride = true; //prevent current game from pausng before fadeout
    })
    .on('mouseup', function() {

        self._bootstrap(details.system, details.title, details.file, slot);
        window.scrollTo(0,0);
    });

    //two conditions here - the same state is being saved (replace) or a new state is saved and we need to insert it correctly
    var gotinserted = false;
    stateswrapper.children().each(function() {

        //convert both to numbers for comparison (they are strings because they are used as properties in an object)
        var currentslot = parseInt($(this).attr('data-slot'), 10);
        slot = parseInt(slot, 10);

        if (currentslot === slot) {
            loadstate.insertBefore(this);
            $(this).remove();
            gotinserted = true;
            return false;
        } else if (currentslot > slot) {
            loadstate.insertBefore(this);
            gotinserted = true;
            return false;
        }
    });

    //if it didn't get insert its either the first state saved or the greatest 
    if (!gotinserted) {
        stateswrapper.append(loadstate);
    }
};

/**
 * a common function which returns an li of a game box which acts as a link to bootstrap load the game and emulator
 * @param  {string} system
 * @param  {string} title
 * @param  {string} file
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

    //incldes swap to blank cart onerror
    return $('<img onerror="this.src=\'/images/blanks/' + system + '_' + size + '.png\'" src="/images/boxes/' + system + '/' + title + '/' + size + '.jpg" />');
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
 * @param  {[type]}   iterations [description]
 * @param  {[type]}   func       [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
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
         * @return {[type]} [description]
         */
        iteration: function() {
            return index - 1;
        },
        /**
         * [break description]
         * @return {[type]} [description]
         */
        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
};

var crazyerics = new Crazyerics();
