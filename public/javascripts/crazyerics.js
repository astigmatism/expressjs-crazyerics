var FS = null;

/**
 * namespace for all crazyerics client functionality
 */
var Crazyerics = function() {

    var self = this;

    $(document).ready(function() {

        //decompress clientdata
        self._clientdata = self._decompress.json(clientdata);

        //incoming params to open game now?
        var openonload = self._clientdata.openonload || {};
        if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
            self._bootstrap(openonload.system, openonload.title, openonload.file);
        }

        self._buildWelcomeMessage();

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
            self._Module.requestFullScreen(true, true);
        });

        $('#emulatorcontrolswrapper li.savestate').click(function() {
            self._simulateEmulatorKeypress(113); //F2
        });

        $('#emulatorcontrolswrapper li.loadstate').click(function() {
            self._simulateEmulatorKeypress(115); //F4
        });

        $('#emulatorcontrolswrapper li.mute').click(function() {
            self._simulateEmulatorKeypress(120); //F9
        });

        $('#emulatorcontrolswrapper li.decrementslot').click(function() {
            self._simulateEmulatorKeypress(117); //F6
        });

        $('#emulatorcontrolswrapper li.incrementslot').click(function() {
            self._simulateEmulatorKeypress(118); //F6
        });

        $('#emulatorcontrolswrapper li.fastforward').click(function() {
            self._simulateEmulatorKeypress(70); //f
        });

        $('#emulatorcontrolswrapper li.pause').click(function() {
            self._simulateEmulatorKeypress(80); //P
        });

        $('#emulatorcontrolswrapper li.reset').click(function() {
            self._simulateEmulatorKeypress(72); //F6
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
                $(this).find('img').animateRotate(0, -90, 500);

            } else {
                $(this).attr('data-click-state', 0);
                $(this).find('img').animateRotate(-90, 0, 500);
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
            var gamelink = self._buildGameLink(response[i].system, response[i].title, response[i].file, 114);
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
Crazyerics.prototype._bootstrap = function(system, title, file, state) {

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

    var box = self._getBoxFront(system, title, 150);
    box.addClass('tada');
    box.load(function() {
        $(this).fadeIn(200);
    });
    $('#gameloadingoverlaycontentimage').append(box);

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

        $.when(emulatorReady, gameReady, gameContentReady).done(function(emulator, gamedata, gamecontent) {

            var Module = emulator[0];
            var fs = emulator[1];
            var frame = emulator[2];

            var err = gamedata[0];
            var gamedata = gamedata[1];

            var states = gamecontent.states;
            var files = gamecontent.files;

            self._Module = Module; //handle to Module
            FS = fs;
            self.emulatorframe = frame; //handle to iframe

            console.log(self._generateLink(system, title, file));

            self._setupKeypressInterceptor(system, title, file);

            // for some reason, leaving this in prevents the emulator from starting at a crazy speed, race condition?
            // this is also good because it leaves time for the loading animation to show even in best possible scenario (files loaded locally)
            setTimeout(function() {

                self._buildFileSystem(Module, system, file, gamedata, states);

                //begin game
                Module.callMain(Module.arguments);

                //load state?
                if (state) {
                    for (var i = 0; i < state; ++i) {
                        self._simulateEmulatorKeypress(118); //F6 increment state slot
                    }
                    self._simulateEmulatorKeypress(115); //F4 load state
                }

                //handle title and content fadein steps
                self._buildGameContent(system, title, function() {

                });

                $('#gameloadingoverlaycontent').addClass('close');
                $('#gameloadingoverlay').fadeOut(1000, function() {

                    //show controls initially to reveal their presence
                    setTimeout(function() {
                        self._ModuleLoading = false;
                        //$('#emulatorcontrolswrapper').slideToggle({ direction: "down" }, 300);
                        $('#emulatorcontrolswrapper').addClass('closed');
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

            }, 1000);

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

    var box = this._getBoxFront(system, title, 150);

    //using old skool img because it was the only way to get proper image height
    var img = document.createElement('img');
    img.addEventListener('load', function() {

        $('#gamedetailsboxfront').empty().append(box);
        $('#gametitle').empty().hide().append(title);

        // slide down background
        // first measure the area the box will use. is it greater? use that distance to slide
        var distance = this.height > 200 ? this.height : 200;
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
Crazyerics.prototype._simulateEmulatorKeypress = function(key) {

    var self = this;

    if (this._Module && this._Module.RI && this._Module.RI.eventHandler) {

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
        }, 10);
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
                        case 113: //save state. small delay necessary since this function call would fire before the emulator writes to the FS
                            setTimeout(function() {
                                self._saveState(system, title, file, self._activeSaveStateSlot, function() {
                                });
                            },100);
                        break;
                        case 117: //decrement state
                            self._activeSaveStateSlot = self._activeSaveStateSlot === 0 ? 0 : self._activeSaveStateSlot - 1;
                        break;
                        case 118: //incremenet state
                            self._activeSaveStateSlot++;
                        break;
                    }
                break;
            };

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
    $.get('/load/' + system + '/' + title + '/' + file, function(data) {
        try {
            var inflated = pako.inflate(data); //inflate compressed string to arraybuffer
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
Crazyerics.prototype._loadGameDetails = function(system, title, file, deffered) {

    var self = this;
    //call returns not only states but misc game details. I tried to make this
    //part of the loadGame call but the formatting for the compressed game got weird
    $.get('/states/' + system + '/' + title + '/' + file, function(data) {
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
    if (self._clientdata.retroarchconfig && self._clientdata.retroarchconfig[system]) {
        Module.FS_createDataFile('/etc', 'retroarch.cfg', self._clientdata.retroarchconfig[system], true, true);
    }

    //states
    for (slot in states) {
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
    var filename         = filenoextension + '.state' + (slot === 0 ? '' : slot);

    try {
        var statecontent = FS.open(filename);
    } catch (e) {
        console.log(e);
        return;
    }

    if (statecontent && statecontent.node && statecontent.node.contents) {

        var data = self._compress.bytearray(statecontent.node.contents);

        $.ajax({
            url: '/states/' + system + '/' + title + '/' + file + '/' + slot,
            data: data,
            processData: false,
            contentType: 'text/plain',
            type: 'POST',
            /**
             * up on successfully state save
             * @param  {Object} data
             * @return {undef}
             */
            success: function(data) {
            }
        });
    }
};

/**
 * function which comprises buliding the welcome message section of the site upon return
 * @return {undef}
 */
Crazyerics.prototype._buildWelcomeMessage = function() {

    var self = this;
    var playHistory = self._getPlayHistory(5);

    if (playHistory.length === 0) {
        $('#startfirst').animate({height: 'toggle', opacity: 'toggle'}, 200);
        return;
    }

    for (var i = 0; i < playHistory.length; ++i) {
        var gamelink = self._buildGameLink(playHistory[i].system, playHistory[i].title, playHistory[i].file, 114, true);

        //put this in a closure to keep values on click bind
        (function(system, title, file, gamelink) {
            gamelink.li.addClass('close');
            gamelink.img.load(function() {
                gamelink.li.removeClass('close');
            });
            gamelink.remove
                .addClass('tooltip')
                .attr('title', 'Remove this game and all saved states')
                .on('click', function() {
                    gamelink.li.addClass('close');
                    $.ajax({
                        url: '/states/' + system + '/' + title + '/' + file,
                        type: 'DELETE',
                        /**
                         * after successfully getting back states data
                         * @return {undef}
                         */
                        success: function() {
                        }
                    });
                });
        })(playHistory[i].system, playHistory[i].title, playHistory[i].file, gamelink);
        $('#startplayed ul').append(gamelink.li);
    }

    $('#startplayed').animate({height: 'toggle', opacity: 'toggle'}, 200);
    self._toolTips();
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
    box.attr('data-system', system);
    box.attr('data-title', title);
    box.attr('data-file', file);

    box.load(function() {
        $(this)
        .removeClass('close')
        .on('mousedown', function() {
            self._pauseOverride = true; //prevent current game from pausng before fadeout
        })
        .on('mouseup', function() {

            self._bootstrap(this.dataset.system, this.dataset.title, this.dataset.file);
            window.scrollTo(0,0);
        });
    });
    li.append(box);

    var remove = null;
    if (close) {
        remove = $('<div class="remove"></div>');
        li
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
    return $('<img onerror="this.src=\'/images/blanks/' + system + '_' + size + '.png\'" src="/images/games/' + system + '/' + title + '/' + size + '.jpg" />');
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
 * parses the play history from the returned clientdata on page load
 * @param  {number} maximum  the number of games in which to return, sorted by most recently played
 * @return {Array}           a sorted array of plat played games
 */
Crazyerics.prototype._getPlayHistory = function(maximum) {

    var self = this;
    var result = [];

    if (self._clientdata && self._clientdata.playhistory) {

        var playhistory = self._clientdata.playhistory;
        var keys = Object.keys(playhistory);

        maximum = maximum || keys.length;

        //sorted by most recent
        keys.sort(function(a, b) {
            return a < b;
        });

        for (var i = 0; i < keys.length && i < maximum; ++i) {
            playhistory[keys[i]].played = keys[i];
            result.push(playhistory[keys[i]]);
        }
    }

    return result;
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
        var deflated = pako.deflate(uint8array);
        return btoa(String.fromCharCode.apply(null, deflated));
    },
    /**
     * comrpess and base64 encode a json object
     * @param  {Object} json
     * @return {string}
     */
    json: function(json) {
        return btoa(pako.deflate(JSON.stringify(json), {to: 'string'}));
    },
    /**
     * compress and base64 encode a string
     * @param  {string} string
     * @return {string}
     */
    string: function(string) {
        return btoa(pako.deflate(string, {to: 'string'}));
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
        return JSON.parse(pako.inflate(atob(item), {to: 'string'}));
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

var crazyerics = new Crazyerics();
