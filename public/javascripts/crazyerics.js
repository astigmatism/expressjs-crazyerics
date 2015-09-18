var FS = null;

var crazyerics = function() {
    
    var self = this;
    
    $(document).ready(function() {

        //decompress clientdata
        self._clientdata = self._decompress.json(clientdata);

        //incoming params to open game now?
        var openonload = self._clientdata.openonload || {};
        if ('g' in openonload && 't' in openonload && 's' in openonload && 'r' in openonload) {
            self._bootstrap(openonload.s, openonload.t, openonload.g);
        }

        self._buildWelcomeMessage();

        //console select
        $('#searchform select').selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            onChange: function() {
                self.replaceSuggestions($(this).val());
            }
        });

        //search field
        $('#searchform input').autoComplete({
            minChars: 3,
            cache: false,
            delay: 300,
            source: function(term, response){
                var system = $('#searchform select').val();
                $.getJSON('/search/' + system + '/' + term, function(data) { 
                    response(data);
                });
            },
            renderItem: function (item, search){
                
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
                return $("<div/>").append(suggestion).html(); //because .html only returns inner content
            },
            onSelect: function(e, term, item){
                
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
            self._simulateEmulatorKeypress(32); //F6
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
            if ($('#emulator').is(":focus")) {
                self._pauseOverride = true;  
            }
        })
        .on('mouseup', function(event) {            

            //immediately give focus back if it had it
            if (self._pauseOverride) {
                $('#emulator').focus();
                self._pauseOverride = false;
            }

            $("#controlsslider").animate({width:'toggle', padding: 'toggle'}, 500);

            if($(this).attr('data-click-state') == 0) {
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

crazyerics.prototype._clientdata = null;
crazyerics.prototype._Module = null; //handle the emulator Module
crazyerics.prototype._ModuleLoading = false; //oldskool way to prevent double loading
crazyerics.prototype._pauseOverride = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus

crazyerics.prototype._activeFile = null;
crazyerics.prototype._activeSaveStateSlot = 0;

crazyerics.prototype.replaceSuggestions = function(system, items) {

    var self = this;
    items = items || 100;

    //show loading icon
    $('#suggestionswrapper').hide();
    $('#loading').removeClass('close');

    $.getJSON('/suggest/' + system + '/' + items, function(response) {

        //remove all current gamelinks
        $('#suggestionswrapper li').remove();

        var columns = $('#suggestionswrapper ul');

        //use modulus to evenly disperse across all columns
        for (var i = 0; i < response.length; ++i) {
            var gamelink = self._buildGameLink(response[i].s, response[i].t, response[i].g, 114);
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

crazyerics.prototype._bootstrap = function(system, title, file, state) {
    
    var self = this;

    if (self._ModuleLoading) return;
    self._ModuleLoading = true;
    self._pauseOverride = false;

    $('#gameloadingname').text(title);
    
    //fade out content
    $('#gamedetailsboxfront img').addClass('close');
    $('#gamedetailswrapper').fadeOut();


    //move welcome and emulator into view (first time only)
    $('#startmessage').animate({height: 'toggle'}, 1000);
    $('#emulatorwrapper').slideDown(1000);
    
    //loading image
    $('#gameloadingoverlaycontentimage').empty();
    
    var box = self._getBoxFront(system, title, 150);
    box.addClass('tada');
    box.load(function(){
        $(this).fadeIn(200);
    });
    $('#gameloadingoverlaycontentimage').append(box);

    //fade in overlay
    $('#gameloadingoverlay').fadeIn(500, function() {

        //close any sliders
        $('#gamecontrolslist li').each(function() {
            if($(this).attr('data-click-state') == 1) {
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


        $.when(emulatorReady, gameReady).done(function (emulator, data) {

            var Module = emulator[0];
            var fs = emulator[1];
            var frame = emulator[2];

            self._Module = Module; //handle to Module
            FS = fs;
            self.emulatorframe = frame; //handle to iframe

            self._buildFileSystem(Module, system, file, data);

            self._setupKeypressInterceptor(system, title, file);

            self._restoreStates(Module, system, title, file, function() {

                //begin game
                Module['callMain'](Module['arguments']);

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
            });

        });

        self._loademulator(system, emulatorReady);
        self._loadGame(system, title, file, gameReady);
    });
};

crazyerics.prototype._buildGameContent = function(system, title, callback) {

    var box = this._getBoxFront(system, title, 150);
    
    //using old skool img because it was the only way to get proper image height
    var img = document.createElement('img');
    img.addEventListener('load', function () { 

        $('#gamedetailsboxfront').empty().append(box);
        $('#gametitle').empty().hide().append(title);

        // slide down background
        // first measure the area the box will use. is it greater? use that distance to slide
        var distance = this.height > 200 ? this.height : 200;
        $('#gamedetailsboxfront img').addClass('close');
        $("#gamedetailsbackground").animate({
            height : distance
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

crazyerics.prototype._cleanupEmulator = function() {

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
        } catch(e) {

        }
        self._Module = null;
    }
    if (self.emulatorframe) {
        self.emulatorframe.remove();
        self.emulatorframe = null;
    }
    $('#emulator').remove(); //kill all events attached (keyboard, focus, etc)
};

crazyerics.prototype._simulateEmulatorKeypress = function(key) {

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

crazyerics.prototype._setupKeypressInterceptor = function(system, title, file) {
    
    var self = this;

    if (this._Module && this._Module.RI && this._Module.RI.eventHandler) {

        var callback = this._Module.RI.eventHandler;

        this._Module.RI.eventHandler = function(event) {


            switch (event.type) {
                case 'keyup':
                    var key = event.keyCode;
                    switch(key) {
                        case 113: //save state
                            self._saveState(system, title, file, self._activeSaveStateSlot, function() {

                            });
                            break;
                        case 117: //decrement state
                            self._activeSaveStateSlot = self._activeSaveStateSlot === 0 ? 0 : self._activeSaveStateSlot -1;
                            break;
                        case 118: //incremenet state
                            self._activeSaveStateSlot++;
                            break;
                    }
                break;
            };

            callback(event);
        }

    }
};

crazyerics.prototype._loademulator = function(system, deffered) {

    var frame  = $('<iframe/>', {
        src:'/load/emulator/' + system,
        style:'display:none',
        load: function(){

            //find module to run games
            var FS = this.contentWindow.FS;
            var Module = this.contentWindow.Module;
            deffered.resolve(Module, FS, frame);
        }
    });
    $('body').append(frame);
};

crazyerics.prototype._loadGame = function(system, title, file, deffered) {

    var self = this;
    var url = '/load/' + system + '/' + title + '/' + file;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            
            //response comes back as arraybuffer. convery to uint8array
            var dataView = new Uint8Array(this.response);

            deffered.resolve(dataView);
        }
    }
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    xhr.send();
};

crazyerics.prototype._buildFileSystem = function(Module, system, file, data) {

    var self = this;

    //game
    Module.FS_createDataFile('/', file, data, true, true);
    Module.arguments = ['-v', '/' + file];
    //Module.arguments = ['-v', '--menu'];

    Module.FS_createFolder('/', 'etc', true, true);

    if (self._clientdata.retroarchconfig && self._clientdata.retroarchconfig[system]) {
        Module.FS_createDataFile('/etc', 'retroarch.cfg', self._clientdata.retroarchconfig[system], true, true);
    }

};

crazyerics.prototype._saveState = function(system, title, file, slot, callback) {

    var self = this;
    var filenoextension  = file.replace(new RegExp('\.[a-z]{1,3}$', 'gi'), '');
    var filename         = filenoextension + '.state' + (slot === 0 ? '' : slot);

    try {
        var statecontent = FS.open(filename);
    } catch(e) {
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
            success: function(data){
                
            }
        });
    }   
};

crazyerics.prototype._restoreStates = function(Module, system, title, file, callback) {

    var self = this;

    $.get('/states/' + system + '/' + title + '/' + file, function(states) {
        for (slot in states) {
            var statedata = self._decompress.bytearray(states[slot]);
            var filenoextension = file.replace(new RegExp('\.[a-z]{1,3}$', 'gi'), '');
            var statefilename = '/' + filenoextension + '.state' + (slot == 0 ? '' : slot);
            Module.FS_createDataFile('/', statefilename, statedata, true, true);
        }
        callback();
    });
};

crazyerics.prototype._buildWelcomeMessage = function() {

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
            gamelink.remove
                .addClass('tooltip')
                .attr('title', 'Remove this game and all saved states')
                .on('click', function() {
                    gamelink.li.addClass('close');
                    $.ajax({
                        url: '/' + system + '/' + title + '/' + file,
                        type: 'DELETE',
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

crazyerics.prototype._getSavedStates = function(file, callback) {

    var self = this;
    var states = {};
    var objectStore = self._db.objectStore(file + '.states', true); //the key in the index is the file with ".states"
    var promise = objectStore.each(function(item) {
        
        var slot = 0;
        var slotmatch = item.key.match(/\.state(\d*)$/); //match the .stateX value out of the 
        
        if (slotmatch && slotmatch[1]) {
            slot = slotmatch[1];
        }

        states[slot] = item.value;

    });
    promise.done(function(result) {
        callback(states);
    });
};

crazyerics.prototype._buildGameLink = function(system, title, file, size, close) {
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
}

crazyerics.prototype._getBoxFront = function(system, title, size) {

    var img = $('<img src="/images/games/' + system + '/' + title + '/' + size + '.jpg" />')
        .error(function(event) {
            this.src = '/images/blanks/' + system + '_' + size + '.png';
        });
    return img;
};

crazyerics.prototype._toolTips = function() {
    //apply tooltips
    $('.tooltip').tooltipster({
        theme: 'tooltipster-shadow',
        animation: 'grow',
        delay: 100
    });
};

crazyerics.prototype.clearHistory = function() {
    var self = this;
    if (confirm('This means deleting recently played games and all saved states. Are you sure?')) {
        window.location = '/?clear';
    }
};

crazyerics.prototype._getPlayHistory = function(maximum) {

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

crazyerics.prototype._compress = {
    bytearray: function(uint8array) {
        var deflated = pako.deflate(uint8array);
        return btoa(String.fromCharCode.apply(null, deflated));
    },
    json: function(json) {
        return btoa(pako.deflate(JSON.stringify(json), { to: 'string' }));
    },
};

crazyerics.prototype._decompress = {
    bytearray: function(item) {
        var decoded = new Uint8Array(atob(item).split('').map(function(c){return c.charCodeAt(0);}));
        return pako.inflate(decoded);
    },
    json: function(item) {
        return JSON.parse(pako.inflate(atob(item), { to: 'string' }));
    }
}

/**
 * css rotation animation helper and jquery extension
 * @param  {number} startingangle
 * @param  {number} angle
 * @param  {number} duration
 * @param  {string} easing
 * @param  {Function} complete
 * @return {}
 */
$.fn.animateRotate = function(startingangle, angle, duration, easing, complete) {
  var args = $.speed(duration, easing, complete);
  var step = args.step;
  return this.each(function(i, e) {
    args.complete = $.proxy(args.complete, e);
    args.step = function(now) {
      $.style(e, 'transform', 'rotate(' + now + 'deg)');
      if (step) return step.apply(e, arguments);
    };

    $({deg: startingangle}).animate({deg: angle}, args);
  });
};

var crazyerics = new crazyerics();