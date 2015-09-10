var FS = null;

var crazyerics = function() {
    
    var self = this;
    
    $(document).ready(function() {

        self._db = $.indexedDB("crazyerics");

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
                    src = '/images/' + item[2] + '/' + item[0] + '/50.jpg';
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

        $('#suggestionswrapper').on('click', 'img', function() {

            self._bootstrap(this.dataset.system, this.dataset.title, this.dataset.file, this.dataset.rank);
            window.scrollTo(0,0);
        });

        $('.tooltip').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow'
        });

        $('#upload').change(function(event) {
            self._onupload(event.target.files);
        });

        $('#emulatorwrapperoverlay')
        .on('click', function() {
            $('#emulator').focus();
        })
        .on('mouseenter', function() {
            event.stopPropagation();
        })
        .on('mouseleave', function() {
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
    });
};

crazyerics.prototype.LSFS = null; //local storge file system

crazyerics.prototype._boxFrontThreshold = 83;
crazyerics.prototype._Module = null; //handle the emulator Module
crazyerics.prototype._ModuleLoading = false; //oldskool way to prevent double loading

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
            $(columns[i % columns.length]).append('<img class="tooltip" style="float:left" data-title="' + response[i].t + '" data-file="' + response[i].g + '" data-system="' + response[i].s + '" data-rank="' + response[i].r + '" src="/images/' + response[i].s + '/' + response[i].t + '/114.jpg" title="' + response[i].t + '" />');
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

crazyerics.prototype._buildGameTitle = function(system, title, rank) {

    var src = '/images/blanks/' + system + '_150.png';

    if (rank >= this._boxFrontThreshold) {
        src = '/images/' + system + '/' + title + '/150.jpg';
    }

    
    var img = $('<img class="close" src="' + src + '" />');
    img.load(function(){
        $(this).removeClass();
    });
    $('#gametitleimagewrapper').empty().append(img);
    
    $('#gametitlecontent')
        .text(title)
        .fadeIn(1000);
};

crazyerics.prototype._bootstrap = function(system, title, file, rank) {
    
    var self = this;

    if (self._ModuleLoading) return;
    self._ModuleLoading = true;

    $('#gameloadingname').text(title);
    $('#gametitleimagewrapper img').addClass('close');
    $('#gametitlecontent').fadeOut();

    //move welcome and emulator into view (first time only)
    $('#startmessage').slideUp(1000);
    $('#emulatorwrapper').slideDown(1000);

    //before fading in loading overlay
    
    //loading image
    $('#gameloadingoverlaycontentimage').empty();
    var src = '/images/blanks/' + system + '_150.png';
    if (rank >= this._boxFrontThreshold) {
        src = '/images/' + system + '/' + title + '/150.jpg';
    }
    var img = $('<img class="tada" src="' + src + '" />');
    img.load(function(){
        $(this).fadeIn(200);
    });
    $('#gameloadingoverlaycontentimage').append(img);

    //fade in overla
    $('#gameloadingoverlay').fadeIn(500, function() {

        $('#gameloadingoverlaycontent').removeClass();
        $('#emulatorcontrolswrapper').show(); //show controls initially to reveal their presence

        
        self._cleanupEmulator();

        //create new canvas
        $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator"></canvas>');

        //build all code in an iframe for separate context and returns emulator module
        self._loademulator(system, function(Module, fs, frame) {

            self.emulatorframe = frame; //handle to iframe
            self._Module = Module; //handle to Module
            FS = fs;

            self._loadGame(system, title, file, function(data) {

                self._buildFileSystem(Module, file, data);

                self._setupKeypressInterceptor(system, title, file);

                self._restoreStates(Module, file, function() {

                    //begin game
                    Module['callMain'](Module['arguments']);

                    $('#gametitlewrapper').slideDown(1000);
                
                    $('#gameloadingoverlaycontent').addClass('close');
                    $('#gameloadingoverlay').fadeOut(1000, function() {

                        //show controls initially to reveal their presence
                        setTimeout(function() { 
                            self._ModuleLoading = false;
                            //$('#emulatorcontrolswrapper').slideToggle({ direction: "down" }, 300);
                            $('#emulatorcontrolswrapper').addClass('closed');
                        }, 3000);
                        
                        self._buildGameTitle(system, title, rank);
                    });

                    $('#emulator')
                        .focusout(function() {
                            Module.pauseMainLoop();
                            $('#emulatorwrapperoverlay').fadeIn();
                        })
                        .focus(function() {
                            Module.resumeMainLoop();
                            $('#emulatorwrapperoverlay').hide();
                        })
                        .focus();
                });
            });
        });
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

crazyerics.prototype._loademulator = function(system, callback) {

    var frame  = $('<iframe/>', {
        src:'/emulator/' + system,
        style:'display:none',
        load: function(){

            //find module to run games
            var FS = this.contentWindow.FS;
            var Module = this.contentWindow.Module;
            callback(Module, FS, frame);
        }
    });
    $('body').append(frame);
};

crazyerics.prototype._loadGame = function(system, title, file, callback) {

    var self = this;

    //first, look for game in indexeddb
    var objectStore = self._db.objectStore(file, true);

    objectStore.get(file)
        .done(function(result, event) {
            
            if (result) {
                callback(result);
            
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

                    callback(data);
                });
            }
        })
        .fail(function(error, event) {

            console.log(error);

            self._loadGameFromSoruce(system, title, file, function(data) {
                callback(data);
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

crazyerics.prototype._buildFileSystem = function(Module, file, data) {

    var self = this;

    //game
    Module.FS_createDataFile('/', file, data, true, true);
    Module.arguments = ['-v', '/' + file];

    //config
    Module.FS_createFolder('/', 'etc', true, true);
    var config = 'input_player1_select = shift\n';
    var latency = 96; //parseInt(document.getElementById('latency').value, 10);
    config += 'audio_latency = ' + latency + '\n'
    config += 'video_vsync = false\n';
    Module.FS_createDataFile('/etc', 'retroarch.cfg', config, true, true);

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


var crazyerics = new crazyerics();