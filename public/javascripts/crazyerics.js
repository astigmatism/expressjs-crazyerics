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
Crazyerics.prototype._fileWriteTimers = {};
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
    var key = self._compress.gamekey(system, title, file); //for anything that might need it

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

            if (!$('#gameloadingoverlay').is(':animated')) {
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
            Module.callMain(Module.arguments);

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

            // load state?
            // we need to handle mulitple keypresses asyncrounsly to ensure the emulator recieved input
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
        self._loadGameData(key, system, title, file, gameReady);
        self._loadGame(key, system, title, file, gameDetailsReady);
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
 * load rom file from whatever is defined in the config "rompath" (CDN or local). will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
 * @param  {string} system
 * @param  {string} title
 * @param  {string} file
 * @param  {Object} deffered
 * @return {undef}
 */
Crazyerics.prototype._loadGameData = function(key, system, title, file, deffered) {

    var self = this;
    var location = self._clientdata.rompath;
    var flattened = self._clientdata.flattenedromfiles;

    if (flattened) {

        key = self._compress.json({
            '0': title,
            '1': file
        });

        location += '/' + system + '/' + encodeURIComponent(encodeURIComponent(key));
    } else {
        location += '/' + system + '/' + title + '/' + file;
    }

    $.get(location, function(data) {
        var inflated;
        try {
            inflated = pako.inflate(data); //inflate compressed string to arraybuffer
        } catch (e) {
            deffered.resolve(e);
            return;
        }

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
Crazyerics.prototype._loadGame = function(key, system, title, file, deffered) {

    var self = this;
    //call returns not only states but misc game details. I tried to make this
    //part of the loadGame call but the formatting for the compressed game got weird
    $.get('/load/game?key=' + encodeURIComponent(key), function(data) {

        //add to play history
        self._addToPlayHistory(key, system, title, file);

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

    self._writeShaderFiles(Module);
    
    //screenshots
    Module.FS_createFolder('/', 'screenshots', true, true);

    //states
    for (var slot in states) {
        var statedata = self._decompress.bytearray(states[slot]);
        var filenoextension = file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
        var statefilename = '/' + filenoextension + '.state' + (slot == 0 ? '' : slot);
        Module.FS_createDataFile('/', statefilename, statedata, true, true);
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
Crazyerics.prototype._emulatorFileWritten = function(key, system, title, file, filename, contents) {

    var self = this;
    var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit
    var screenshotmatch = filename.match(/\.bmp$/);

    // match will return an array when match was successful, our capture group with the slot value, its 1 index
    if (statematch) {

        var slot = statematch[1] === '' ? 0 : statematch[1]; //the 0 state does not use a digit
        var data = self._compress.bytearray(contents);

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
                statedetails[slot] = Date.now();
                self._addToPlayHistory(key, system, title, file, null, statedetails);
            }
        });
    }

    if (screenshotmatch) {

        document.getElementById('tester').src = "data:image/bmp;base64," + self._compress.bytearray(contents);
        //download('data:image/bmp;base64,' + contents, filename, 'image/bmp' );
    }
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
    }, 1000);
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

/**
 * adding a state button for a game to the play history area
 * @param {Object} details       this function is called from the _addToPlayHistory function which passes a data blob of game details
 * @param {Object} stateswrapper dom element
 * @param {number} slot
 * @param {Date} date
 */
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

    var self = this;

    //have box title's been compressed (to obfiscate on cdn)
    if (self._clientdata.flattenedboxfiles) {
        //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
        title = encodeURIComponent(encodeURIComponent(self._compress.string(title)));
    }

    //incldes swap to blank cart onerror
    return $('<img onerror="this.src=\'' + self._clientdata.assetpath + '/images/blanks/' + system + '_' + size + '.png\'" src="' + self._clientdata.boxpath + '/' + system + '/' + title + '/' + size + '.jpg" />');
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

Crazyerics.prototype._writeShaderFiles = function(Module) {

    var self = this;

    //root shader folder and glslp files
    Module.FS_createFolder('/', 'shaders', true, true);
    Module.FS_createDataFile('/shaders', '2x2xscalehq.glslp', self._decompress.string('eJx1kb1ywjAQhHs/BeMeGzvpNGloSBvyAJpDPowY/RDpHPDbR7YMQWBc6Xa/0e7J/gANOr/4WORveebHaTVMRamlF6XU0OISmmPnSaOholVeXcEqgl6AwsNPWV++h9PnVwLVETpL09gzNuVRGlEvg+dO6CYy20tF6LiSBiHm70F5DM54Oaf+hPwyGt52TgQnGlGri9X45fd4P4P3D3gaXL0KrmaCq9fBM3j/gGcncKCRprcncC0Sb0FrYNoaSdZNk/0NjADDw3OJ8Af45VnqmQfqHJC0hglryIEnpjotDRiBbOdkeyC+szbIW7Zh6zy7j4zd3qduSX606sl6LjP4q9taz81S/7/moFc3/do5VW8LpPL9Nun12xTcpOM6Gf8AliTqjQ=='), true, true);
    
    //misc folder
    Module.FS_createFolder('/shaders', 'misc', true, true);
    Module.FS_createDataFile('/shaders/misc', 'image-adjustment.glsl', self._decompress.string('eJztVVtv2jAUfs+vsNQX2ChNAmxCqJM6mnVIpSCaVZumycqIoZZIjByHAtP++3xJHCeBlu1hD9PCA/E53/l8bjnn4gLc3N7fguQxCBEFQcrIEsWIBgyF4PsOzJfucpWs2utd2zrDCxCiBY5R2HjwZr73uWlJIYT8eD+a3EEI3l0Cp2NbZwoIhpPx9MqHD1ezL6O7G0BSVlVd+f5s9P6T7wEcV3X8Cv/TzAMMbVlKkXWGVgk6xr0J6A7HS3D8goAxir+nDNUwlYvca35VHOKFjI9DeZKgd1+1ms684UjEDSIU4jRaH3ZQw3LSiuPi2aB5F8A5WRHqDKxDiMWKBAzABQ0iBClhAcMk5lDxJIymc8YTuE4ZDNMo2oEflpXxugBucIgITPAeDUxxFm1dwcukmUxtyYc5SWN2SBFiiuaZd895/nNg+G5eaThvJkXhlZBMSYIFjyOFZuRwdCeECkdt235TJLToBal+QJTnYEgIDY9ihpPbyeyo1q+Z63bMjO0jKt5ytvQdWGmMF4RGIApYF4wfpuOA9+l2oOUqgR9E/q6L3B7QDlVJck2tTWV1JzLT97KqzyN91R+nQEex5twQHPJQcNzg4+GHjFDXkgxFMcu9ZlSgkCaPeMHKuA2iyTyIeT8osFKqCoNLs5bt7Sudxa/2t0EFmb28LpnsDBPnNJO9YeKeZvJkmHS0SdHM2k6rZMK4OG9DKZXZ4cJGr21nj3du284rXYbmRal4GVkphcLe1xnbgfOMt8l9LuW/KJFwr1YHAVmuYB5DNQTxCVT8F60vbjzE9hOIIWpsmg+zq5uxd+f/9q55eZ3wmaP6kn88y6wzT1kxWq3tRAL04U+Xiz7kIRcfGfw4uvlorfm3jxOR40e8fFyrLz93uVBmy6hQy8v+yu76v7rqq6uyuShi0Fb7qQOgP572+CG7h5+6pVOndHJLp2LJ8YNgzCd0EkTrFaLudT7Azdvc/un76B/ZOzzwJGCVzdMR1YlzYTboRCLlrDK/20bmTiufW81BARcTOySsIU25bt+S5A3gth231+dPR07mFnjbdnqumNRvtcCVZ1si3KamzZ3l1JJL3tMC5p+Y0cWdfHQfBWrWPNqcFVR2R+tFgbpUe3f+xzxmAl3uz5o8NbR/7W0LOG27L36O673mVia+U8PvnsV3a/j9cXw1R9JBlcmO+uua3D2Oi3i/qTw4RZSCtPWioNkqbiylpC94g23Ga1dpXhI0las9zSlHjoqpq2Lqiyxnbzv9tq+7mFEUi+6ymGBCwd9TGud7W26IXye+MDI='), true, true);

    //scalehq folder
    Module.FS_createFolder('/shaders', 'scalehq', true, true);
    Module.FS_createDataFile('/shaders/scalehq', '2xScaleHQ.glsl', self._decompress.string('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'), true, true);

    //windowed folder
    Module.FS_createFolder('/shaders', 'windowed', true, true);
    Module.FS_createDataFile('/shaders/windowed', 'jinc2-sharper.glsl', self._decompress.string('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'), true, true);

    // Module.FS_createDataFile('/shaders', '2x2xscalehq.glslp', self._decompress.string(''), true, true);
    // Module.FS_createDataFile('/shaders', '2x2xscalehq.glslp', self._decompress.string(''), true, true);
    // Module.FS_createDataFile('/shaders', '2x2xscalehq.glslp', self._decompress.string(''), true, true);
    // Module.FS_createDataFile('/shaders', '2x2xscalehq.glslp', self._decompress.string(''), true, true);
    // Module.FS_createDataFile('/shaders', '2x2xscalehq.glslp', self._decompress.string(''), true, true);


    Module.FS_createDataFile('/shaders', 'stock.glsl', self._decompress.string('eJzdVVtv2jAUfs+vsNQXuk000PYJMYlBSiNxUwho0zRZaeIES4kdOQ6DVv3vc26OCdDRPW3LEz7fufic8/nj5gaMJ8sJSDaOhxhwUk4DRBBzOPLA0x64QTcIk7Ad79vaFfaBh3xMkNdaG5ZtfL3WciOE4rg05zMIwec+6Nzq2lXhCIbz6WJgw/XA+mbOxoCmvAkNbNsyv6xsA2DSxEQJe2UZgKMdTxnSrlCYoHO5tw7bYxKA8wUczhl+Sjk68mkU6o5EKeJhP+9PuIohQWPZjFpYxtDM+gYR8nAaxacvKN2qpI2LZ58fUocD6DMnQpBR7nBMSU875bpF7h2ALg0p6wiP7Es4S12eTTdOOfTSKNqDF0074f3aU/wxOeXeBXCLPURhgp9RTzWX0zkG1MIqetCVS1PCTwEeZsgt+31rFsXdi4bogiY4s3cUI9N1/b4eWr34HF4jJhoYUsq8sz7D+WRunUXto3DJvTJYPwMJfun5RYGWEuxTFoHI4Xdgul5MHUHKXU/aMeHgIWt9VI/lCBsWs6zsR3zM1zLPt7LM1/G2p10s9hJXk8icW4o90QYmLaEDL3l3knB0mDHukCTK9At7sTDQV1fT3n2QQ/mu/+g1PMsfHw9C9kpI57KQZyWke1nITyXkVobURJRxEspnIMwVqwprlVAAtmx6X8JBCKuEzXwZvRrJMlqJ2KNMryBTIkWuH6zBeGrM7HcL9u81Wbz9YueCmEG59Ut0WsIyLmteHv5UoeWharkmMHw0x49aLF4VTrL5bnCwiQu1qa5cg6Wi13Be7G/7A3iX/v8X8l+pU+JEcYhYd1SJ1+XK+68r7MGa4Xxl14IqDu1i2blSqC+nVV7hU6Ua1+W86/fXVxOUKEMiiFSakrP3F3NlJdM='), true, true);
    Module.FS_createDataFile('/shaders', 'super-eagle.glsl', self._decompress.string('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'), true, true);
    Module.FS_createDataFile('/shaders', 'scanline.glsl', self._decompress.string('eJztVVtP20oQfvevWIkXJ02N7QQKiqhEgwuRCImCi85RVa3ceBNWiu3IXtOYqv+9s7ve9SUJh9OnqqofIDvfNzM7l505PkbXt/e3KHsMQpKiIGfJisQkDRgJ0dcCLVbuap2trU1hGUd0iUKypDEJzQdv7nv/dAwhxBiO9+PpHcbo/QVy+rZxJIloNJ3MLn38cDn/d3x3jZKctaFL35+PP3zyPUTjNgYu/E9zDzGyZXlKjCOyzsgh209BWtB4hQ47CBhL6deckR1Oy5F7Ba7ikC5FfECFJGHvvq01m3ujMY8bRSSkebTZf0FNU0ZbF+ffcp0EDOFlGkQEpwkLGE3iobGP+kQWLsJJRFYBEPiXsTRfMJSBT7xIkjRE3w1jl/pjWCPTeJMzHOZRVDTZTzQkCc7oMxnWxWVmdgEoqbZURxsRLZI8ZvuAkKZkUcb6Uh7k3cHjADzOkoxyuSOE9Ujw+I4LJS+1bfu0ymHVBwJ+ICnENOLpOsgZTW+n890qKMw+qOjvWG7oQrvZhyFXhIWMPKbLJI1QFLABmjzMJgG073ao5TJXH3mqrqo07kFHMvsK2eleUcipqOO9KODLTF+2wmuo41jbfEpoCKHQ2ISp8V1EKHuIV3SUrJO02VbgpRTU+lr+y4ZKXdYYXdSraW27Olmf7S/DFrP88aahUtRUnNepPNdU3NepfKup9LVK1c5aT0MiLyBWjSilkBqQ+TreQiEyO5Z88UDhqTTNvuUMnBOwa3tv4E+3qjSkqlZMa9s51gWztj10arln7jn/pGKdW3RKp6s1VgG078+fSOvyvPPhwnuvz1tfYs1A+PNHfLTW9s/H+eX1xLvz//cG+u8lAwNNtiW8nVXZmK9ZPBrWejw3+vCrK0cfVMjVG8M34+sbYwNPn2Y8/Y909biRD19duQLLFVXBwtnfjfY7bLSUMMwXQsn1JzNXbjFXHJwGNGic+nrdwYHbUAM5C6LNmqTulZrX2uIWnui5PgW27Zy8vIxeWGH1PfWH7KM+wtkiiNfQe9We4ckVo6z+ds3Sc0+NNTUTZYr5kJPybjnahpW1PqDQ3qakwuitYYMmVtQxR411YaQn+ZogiqkY6MSy5ffOe2vbbg851okUnHKB0+mq7lLWXdANE2ZKQ73SjqPsyAXSaws62r9KHJ/hPGUQ83PXPLcGYoucnQm3sBWFL60l2l/eemBqG3wDVYeifnjevUJpq5q9F9Wz4gD8ztNYrRIxtH4COvneug=='), true, true);

    return;
};

var crazyerics = new Crazyerics();
