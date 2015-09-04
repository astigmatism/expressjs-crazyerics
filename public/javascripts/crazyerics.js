var crazyerics = function() {
    
    var self = this;
    
    $(document).ready(function() {

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

                //have image, see sitescraper project for rank in which we downloaded an image
                if (item[4] >= 87) {
                    src = '/images/' + item[2] + '/' + item[0] + '/50.jpg';
                }

                var html = '<div class="autocomplete-suggestion" data-title="' + item[0] + '" data-file="' + item[1] + '" data-system="' + item[2] + '" data-searchscore="' + item[3] + '" data-rank="' + item[4] + '"><img class="' + item[2] + '" src="' + src + '"><div>' + item[0] + '</div></div>';
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

        $('#emulatorwrapperoverlay').click(function() {
            $('#emulator').focus();
        });

    });
};

crazyerics.prototype.loadedscripts  = {};

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

    if (rank >= 87) {
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

    $('#gameloadingname').text(title);
    $('#gametitleimagewrapper img').addClass('close');
    $('#gametitlecontent').fadeOut();

    //move welcome and emulator into view (first time only)
    $('#startmessage').slideUp(1000);
    $('#emulatorwrapper').slideDown(1000);

    //before fading in loading overlay
    var img = $('<img class="tada close" src="/images/' + system + '/' + title + '/150.jpg" />');
    img.load(function(){
        $(this).removeClass('close');
    });
    $('#gameloadingoverlaycontentimage').append(img);

    //fade in overla
    $('#gameloadingoverlay').fadeIn(500, function() {

        $('#gameloadingoverlaycontent').removeClass();

        //kill current emulator iframe
        if (self.emulatorframe) {
            self.emulatorframe.remove();
        }
        $('#emulator').unbind(); //kill all events attached (keyboard, focus, etc)

        //build all code in an iframe for separate context and returns emulator module
        self._loademulator(system, function(Module, frame) {

            self.emulatorframe = frame; //handle to iframe

            self._loadGame('/loadgame/' + system + '/' + title + '/' + file, function(data) {

                self._initGame(Module, file, data);
                
                $('#gametitlewrapper').slideDown(1000);
                
                $('#gameloadingoverlaycontent').addClass('close');
                $('#gameloadingoverlay').fadeOut(1000, function() {

                    self._buildGameTitle(system, title, rank);
                    $('#gameloadingoverlaycontentimage').empty();
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
};

crazyerics.prototype._loademulator = function(system, callback) {

    var frame  = $('<iframe/>', {
        src:'/emulator/' + system,
        style:'display:none',
        load: function(){

            //find module to run games
            var Module = this.contentWindow.Module;
            callback(Module, frame);
        }
    });
    $('body').append(frame);
};

/**
 * jQuery does not support the a response datatype of "arraybuffer" so we're going to use the old XHLHttpRequest object
 * see docs here: https://dvcs.w3.org/hg/xhr/raw-file/tip/Overview.html#the-response-attribute
 * its part of the "XHR2" solution and jQuery does not support it yet. you can google "jquery ajax arraybuffer" at some point to clean this up maybe
 * @param  {string}   url
 * @param  {Function} callback
 * @return {undef}
 */
crazyerics.prototype._loadGame = function(url, callback) {

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

crazyerics.prototype._onupload = function(files) {
    var self = this;
    var count = files.length;

    self._buildModule();

    this._loademulator('gba', function() {

        for (var i = 0; i < files.length; i++) {
            filereader = new FileReader();
            filereader.file_name = files[i].name;
            filereader.onload = function(){
                var dataView = new Uint8Array(this.result);
                self._initGame(this.file_name, dataView);
            };
            filereader.readAsArrayBuffer(files[i]);
        }
    });
};

crazyerics.prototype._initGame = function(Module, file, data) {

    Module.FS_createDataFile('/', file, data, true, true);
    Module.arguments = ['-v', '/' + file];

    Module.FS_createFolder('/', 'etc', true, true);
    var config = 'input_player1_select = shift\n';
    var latency = 96; //parseInt(document.getElementById('latency').value, 10);
    //if (isNaN(latency)) latency = 96;
    config += 'audio_latency = ' + latency + '\n'
    //if (document.getElementById('vsync').checked)
    //config += 'video_vsync = true\n';
    //else
    config += 'video_vsync = false\n';
    Module.FS_createDataFile('/etc', 'retroarch.cfg', config, true, true);
    // document.getElementById('canvas_div').style.display = 'block';
    // document.getElementById('vsync').disabled = true;
    // document.getElementById('vsync-label').style.color = 'gray';
    // document.getElementById('latency').disabled = true;
    // document.getElementById('latency-label').style.color = 'gray';
    
    Module['callMain'](Module['arguments']);
};


var crazyerics = new crazyerics();