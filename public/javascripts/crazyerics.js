var FS = null;

var crazyerics = function() {
    
    var self = this;
    
    $(document).ready(function() {

        self._db = $.indexedDB("crazyerics");

        //incoming params to open game now?
        if ('g' in openonload && 't' in openonload && 's' in openonload && 'r' in openonload) {
            self._bootstrap(openonload.s, openonload.t, openonload.g, openonload.r);
        }

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
                    search score,
                    game rank
                ]
                 */

                var src = '/images/blanks/' + item[2] + '_50.png';

                //have image, see config for "boxFrontThreshold"
                if (item[4] >= self._boxFrontThreshold) {
                    src = '/images/games/' + item[2] + '/' + item[0] + '/50.jpg';
                }

                var html = '<div class="autocomplete-suggestion" data-title="' + item[0] + '" data-file="' + item[1] + '" data-system="' + item[2] + '" data-searchscore="' + item[3] + '" data-rank="' + item[4] + '"><img src="' + src + '"><div>' + item[0] + '</div></div>';
                //self.googleimagesearch(item[2] + ' ' + item[0] + ' box', 'img[name="' + item[0] + '"]');
                return html;
            },
            onSelect: function(e, term, item){
                
                self._bootstrap(item.data('system'), item.data('title'), item.data('file'), item.data('rank'));
            }
        });

        self.replaceSuggestions('all');

        $('#suggestionswrapper')
        .on('mousedown', 'img', function() {
            self._pauseOverride = true; //prevent current game from pausng before fadeout
        })
        .on('mouseup', 'img', function() {

            self._bootstrap(this.dataset.system, this.dataset.title, this.dataset.file, this.dataset.rank);
            window.scrollTo(0,0);
        });

        $('.tooltip').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow'
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


        // $('#gamecontrolslist li.fullscreen').on('click', function() {
        //     self._Module.requestFullScreen(true, true);
        // });

        // $('#gamecontrolslist li.mute').on('click', function() {
        //     self._simulateEmulatorKeypress(120); //F9
        // });

        // $('#gamecontrolslist li.reset').on('click', function() {
        //     self._simulateEmulatorKeypress(72); //F6
        // });

        // $('#gamecontrolslist li.pause').on('click', function() {
        //     self._simulateEmulatorKeypress(80); //P
        // });

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

        // $('#gamecontrolslist li.states').on('click', function() {
        
        //     $("#statesslider").animate({width:'toggle', padding: 'toggle'}, 500);

        //     if($(this).attr('data-click-state') == 0) {
        //         $(this).attr('data-click-state', 1);
        //         $(this).find('img').animateRotate(0, -90, 500);
            
        //     } else {
        //         $(this).attr('data-click-state', 0);
        //         $(this).find('img').animateRotate(-90, 0, 500);
        //     }
        // });
    });
};

crazyerics.prototype.LSFS = null; //local storge file system

crazyerics.prototype._boxFrontThreshold = 63;
crazyerics.prototype._Module = null; //handle the emulator Module
crazyerics.prototype._ModuleLoading = false; //oldskool way to prevent double loading
crazyerics.prototype._pauseOverride = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus

crazyerics.prototype._activeFile = null;
crazyerics.prototype._activeSaveStateSlot = 0;

crazyerics.prototype.replaceSuggestions = function(system, items) {

    items = items || 100;

    //show loading icon
    $('#suggestionswrapper').hide();
    $('#loading').removeClass('close');

    $.getJSON('/suggest/' + system + '/' + items, function(response) {

        //remove all current images
        $('#suggestionswrapper img').remove();

        var columns = $('#suggestionswrapper .column');

        //use modulus to evenly disperse across all columns
        for (var i = 0; i < response.length; ++i) {
            $(columns[i % columns.length]).append('<img class="tooltip" style="float:left" data-title="' + response[i].t + '" data-file="' + response[i].g + '" data-system="' + response[i].s + '" data-rank="' + response[i].r + '" src="/images/games/' + response[i].s + '/' + response[i].t + '/114.jpg" title="' + response[i].t + '" />');
        }

        //when all images have loaded, show suggestions
        $('#suggestionswrapper').waitForImages().progress(function(loaded, count, success) {
            
            $('#loading .loadingtext').text(loaded + '%');

            if (loaded === (count - 1)) {
                $('#suggestionswrapper').slideDown();
                $('#loading').addClass('close');
            }
        });

        //apply tooltips
        $('#suggestionswrapper .tooltip').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100
        });

    });
};

crazyerics.prototype._bootstrap = function(system, title, file, rank) {
    
    var self = this;

    if (self._ModuleLoading) return;
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
    var src = '/images/blanks/' + system + '_150.png';
    if (rank >= this._boxFrontThreshold) {
        src = '/images/games/' + system + '/' + title + '/150.jpg';
    }
    var img = $('<img class="tada" src="' + src + '" />');
    img.load(function(){
        $(this).fadeIn(200);
    });
    $('#gameloadingoverlaycontentimage').append(img);

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

            self._restoreStates(Module, file, function() {

                //begin game
                Module['callMain'](Module['arguments']);

                //handle title and content fadein steps
                self._buildGameContent(system, title, rank, function() {

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

                //set last played
                var objectStore = self._db.objectStore('lastplayed', true);
                objectStore.delete();
            });

        });

        self._loademulator(system, emulatorReady);
        self._loadGame(system, title, file, gameReady);
    });
};

crazyerics.prototype._buildGameContent = function(system, title, rank, callback) {

    var src = '/images/blanks/' + system + '_150.png';
    if (rank >= this._boxFrontThreshold) {
        src = '/images/games/' + system + '/' + title + '/150.jpg';
    }
    
    //using old skool js load was the only way I could get back image dimensions! gotta love non-framework solutions!
    var img = document.createElement('img');
    img.addEventListener('load', function () { 

        $('#gamedetailsboxfront').empty().append(img);
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
                $.get('/controls/' + system, function(result) {
                    $('#controlsslider').append(result);
                });

                callback();
            });
        });

    }, true);
    img.setAttribute('src', src);
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
                            //give time for the emaultor to save the file
                            setTimeout(function() {
                                
                                var activefile = file.replace(new RegExp('\.[a-z]{1,3}$', 'gi'), '');
                                var filename = '/' + activefile + '.state' + (self._activeSaveStateSlot === 0 ? '' : self._activeSaveStateSlot);
                                try {
                                    var statecontent = FS.open(filename);
                                    if (statecontent && statecontent.node && statecontent.node.contents) {

                                        var objectStore = self._db.objectStore(file + '.states', true); //the key in the index is the file with ".states"
                                        
                                        //delete the previous value (if set)
                                        objectStore.delete(filename);
                                        
                                        //add the new item
                                        objectStore.add(statecontent.node.contents, filename)
                                            .done(function(result, event){
                                                console.log(result);
                                            })
                                            .fail(function(error, event){
                                                console.log(error);
                                            });
                                    }
                                } catch(e) {
                                    console.log('could not write local storage save state', e);
                                }
                            },500);
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
        src:'/emulator/' + system,
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

    //first, look for game in indexeddb
    var objectStore = self._db.objectStore('games', true);

    objectStore.get(file)
        .done(function(result, event) {
            
            if (result) {
                deffered.resolve(result);
            
            } else {

                self._loadGameFromSoruce(system, title, file, function(data) {

                    //delete the previous value (if set)
                    objectStore.delete(file);
                    
                    //add the new item
                    objectStore.add(data, file)
                        .done(function(result, event){
                            console.log(result);
                        })
                        .fail(function(error, event){
                            console.log(error);
                        });

                    deffered.resolve(data);
                });
            }
        })
        .fail(function(error, event) {

            console.log(error);

            self._loadGameFromSoruce(system, title, file, function(data) {
                deffered.resolve(data);
            });
        });
};

crazyerics.prototype._loadGameFromSoruce = function(system, title, file, callback) {

    var url = '/loadgame/' + system + '/' + title + '/' + file;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            
            //response comes back as arraybuffer. convery to uint8array
            var dataView = new Uint8Array(this.response);

            callback(dataView);
        }
    }
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    xhr.send();
};

crazyerics.prototype._setLastPlayed = function(system, title, file) {

    var self = this;

    var objectStore = self._db.objectStore('lastPlayed', true); //the key in the index is the file with ".states"
                                        
    //delete the previous value (if set)
    objectStore.delete(filename);
    
    //add the new item
    objectStore.add(statecontent.node.contents, filename)
        .done(function(result, event){
            console.log(result);
        })
        .fail(function(error, event){
            console.log(error);
        });
};

crazyerics.prototype._buildFileSystem = function(Module, system, file, data) {

    var self = this;

    //game
    Module.FS_createDataFile('/', file, data, true, true);
    Module.arguments = ['-v', '/' + file];
    //Module.arguments = ['-v', '--menu'];

    Module.FS_createFolder('/', 'etc', true, true);

    if (retroarchconfig && retroarchconfig[system]) {
        Module.FS_createDataFile('/etc', 'retroarch.cfg', retroarchconfig[system], true, true);
    }

};

crazyerics.prototype._restoreStates = function(Module, file, callback) {

    var self = this;

    //restore saved states
    var objectStore = self._db.objectStore(file + '.states', true);
    objectStore.count()
        .done(function(result, event) {

            console.log('save states for ' + file + ': ' + result);

            var loadGame = function(i, asyncCallback) {
                var activefile = file.replace(new RegExp('\.[a-z]{1,3}$', 'gi'), '');
                var filename = '/' + activefile + '.state' + (i === 0 ? '' : i);

                objectStore.get(filename)
                    .done(function(result, event) {
                        Module.FS_createDataFile('/', filename, result, true, true);
                        asyncCallback();
                    })
                    .fail(function(error, event) {
                        console.log(error);
                        asyncCallback();
                    });
            };

            self._asyncLoop(result, function(loop) {
                loadGame(loop.iteration(), function(result) {
                    loop.next();
                })},
                function(){

                    console.log('save states restored');
                    callback();   
                }
            );
        })
        .fail(function(error, event) {
            console.log(error);
            callback();
        });
};

crazyerics.prototype._asyncLoop = function (iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
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

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}

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