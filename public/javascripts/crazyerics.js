var crazyerics = function() {
    
    var self = this;
    
    $(document).ready(function() {

        //console select
        $('#searchform select').selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            onChange: function() {
                self.state.search = $(this).val();
                self.replaceSuggestions(self.state.search);
            }
        });

        //search field
        $('#searchform input').autoComplete({
            minChars: 3,
            cache: false,
            delay: 300,
            source: function(term, response){
                $.getJSON('/search/' + self.state.search + '/' + term, function(data) { 
                    response(data);
                });
            },
            renderItem: function (item, search){
                
                var html = '<div class="autocomplete-suggestion" data-title="' + item[0] + '" data-file="' + item[1] + '" data-system="' + item[2] + '"><img class="' + item[2] + '" src="/images/' + item[2] + '/' + item[0] + '/50.jpg"><div>' + item[0] + '</div></div>';
                //self.googleimagesearch(item[2] + ' ' + item[0] + ' box', 'img[name="' + item[0] + '"]');
                return html;
            },
            onSelect: function(e, term, item){
                
                self.state.title = item.data('title');
                self.state.file = item.data('file');
                self.state.system = item.data('system');
                self._bootstrapnesboxflash(self.state.system, self.state.title, self.state.file);
            }
        });

        self.replaceSuggestions('all');

        $('#suggestionswrapper').on('click', 'img', function() {

            self.state.title = this.dataset.title;
            self.state.file = this.dataset.file;
            self.state.system = this.dataset.system;
            self._bootstrapnesboxflash(self.state.system, self.state.title, self.state.file);
        });

        $('.tooltip').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow'
        });

        // $('#jsnes').click(function() {
        //     if (self.state.emulator === 'jsnes') {
        //         return;
        //     }
        //     self.state.emulatorhandle.unload();
        //     self._bootstrapjsnes(self.state.system, self.state.title, self.state.file);
        // });

        // $('#nesboxflash').click(function() {
        //     if (self.state.emulator === 'nesboxflash') {
        //         return;
        //     }
        //     self.state.emulatorhandle.unload();
        //     self._bootstrapnesboxflash(self.state.system, self.state.title, self.state.file);
        // });

    });
};

crazyerics.prototype.state = {
    search: 'all',
    emulator: null,
    system: 'nes',
    title: '',
    file: '',
    emulatorhandle: null
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
            $(columns[i % columns.length]).append('<img class="tooltip" style="float:left" data-title="' + response[i].t + '" data-file="' + response[i].g + '" data-system="' + response[i].s + '" src="/images/' + response[i].s + '/' + response[i].t + '/114.jpg" title="' + response[i].t + '" />');
        }

        //when all images have loaded, show suggestions
        $('#suggestionswrapper').waitForImages(function() {
            $(this).slideDown();
            $('#loading').addClass('close');
        });

        //apply tooltips
        $('#suggestionswrapper .tooltip').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow'
        });

    });
};

crazyerics.prototype._bootstrapjsnes = function(system, title, file) {

    var self = this;
    var romPath = '/roms/nes/' + title + '/' + file;
    var jsnesReady = function() {

        $('#gametitlewrapper img').removeClass().addClass(system);
        $('#gametitlewrapper img').attr('src', '/images/' + system + '/' + title + '/150.jpg');
        $('#gametitlewrapper div').text(title);

        $('#emulator select>optgroup>option').prop('selected', true);
        $('#emulator select').change();
        $('#emulator').focus();

        self.state.emulator = 'jsnes';
    };

    if (self.state.emulator === 'jsnes') {
        $('#emulator select>optgroup>option').val(romPath);
        jsnesReady();
    } else {

        //load everything
        $.ajax({
            url: '/loademulator?emulator=jsnes'
        }).done(function(html) {
            
            $('#emulatorwrapper').empty().append(html);

            var scripts = [
                '/emulators/jsnes/build/jsnes.js',
                '/emulators/jsnes/lib/dynamicaudio-min.js'
            ];
            self._loadScripts(scripts).done(function() {
                
                self.state.emulatorhandle = new JSNES({
                    'ui': $('#emulator').JSNESUI({
                        'working': [['1', romPath]]
                    })
                });
                self.state.emulatorhandle.unload = function() {
                    self.state.emulatorhandle.stop();
                    self.state.emulatorhandle = null;
                    $('#emulatorwrapper').empty();
                };
                jsnesReady();
            });
        });
    }
};

crazyerics.prototype._bootstrapnesboxflash = function(system, title, file) {

    var self = this;
    var romPath = '/roms/' + system + '/' + title + '/' + file;

    var nesboxflashReady = function() {
        
        $('#gametitlewrapper img').removeClass().addClass(system);
        $('#gametitlewrapper img').attr('src', '/images/' + system + '/' + title + '/150.jpg');
        $('#gametitlewrapper div').text(title);

        $('#emulator').empty();
        var emulator = $('#emulator');
        
        if (emulator) {
            
            var w = 640;
            var h = 480;

            switch (system) {
                case 'nes':
                    w = 256 * 2;
                    h = 240 * 2;
                    break;
                case 'snes':
                    w = 256 * 2;
                    h = 224 * 2;
                    break;
                case 'gb':
                    w = 160 * 2;
                    h = 144 * 2;
                    break;
                case 'gen':
                    w = 320 * 2;
                    h = 224 * 2;
                    break;
                case 'gba':
                    w = 240 * 2;
                    h = 160 * 2;
            }

            if (system === 'gen') {
                system = 'sega';
            }

            var flashvars = {
                system : system,
                url : romPath
            };
            var params = {};
            var attributes = {};

            params.allowscriptaccess = 'sameDomain';
            params.allowFullScreen = 'true';
            params.allowFullScreenInteractive = 'true';

            swfobject.embedSWF('/emulators/nesboxflash/bin/Nesbox.swf', 'emulator', w, h, '11.2.0', 'flash/expressInstall.swf', flashvars, params, attributes);
        }

        self.state.emulator = 'nesboxflash';
    };

    if (self.state.emulator === 'nesboxflash') {
        nesboxflashReady();
    } else {

        $.ajax({
            url: '/loademulator?emulator=nesboxflash'
        }).done(function(html) {

            $('#emulatorwrapper').empty().append(html);

            var scripts = [
                '//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js'
            ];

            self._loadScripts(scripts).done(function() {
                nesboxflashReady();
            });

            self.state.emulatorhandle = {};
            self.state.emulatorhandle.unload = function() {
                self.state.emulatorhandle = null;
                $('#emulatorwrapper').empty();
            };
        });
    }
};

crazyerics.prototype._loadScripts = function (arr) {

    var self = this;
    var _arr = $.map(arr, function(script) {
        if (self.loadedscripts[script]) {
            return;
        }
        self.loadedscripts[script] = true;
        return $.getScript(script);
    });

    _arr.push($.Deferred(function( deferred ){
        $( deferred.resolve );
    }));

    return $.when.apply($, _arr);
};

var crazyerics = new crazyerics();