var crazyerics = function() {
    
    var self = this;
    
    $(document).ready(function() {

        $('#searchform input').autoComplete({
            minChars: 2,
            source: function(term, response){
                try { xhr.abort(); } catch(e){}
                xhr = $.getJSON('/search/nes', { q: term }, function(data) { 
                    response(data);
                });
            },
            renderItem: function (item, search){
                var html = '<div class="autocomplete-suggestion" data-title="' + item[0] + '" data-file="' + item[1] + '"><img name="' + item[0] + '"><div>' + item[0] + '</div></div>';
                self.googleimagesearch('nes ' + item[0] + ' box', 'img[name="' + item[0] + '"]');
                return html;
            },
            onSelect: function(e, term, item){
                
                self.state.title = item.data('title');
                self.state.file = item.data('file');

                self._bootstrapnesboxflash(self.state.title, self.state.file);
            }
        });

        $('#jsnes').click(function() {
            if (self.state.emulator === 'jsnes') {
                return;
            }
            self.state.emulatorhandle.unload();
            self._bootstrapjsnes(self.state.title, self.state.file);
        });

        $('#nesboxflash').click(function() {
            if (self.state.emulator === 'nesboxflash') {
                return;
            }
            self.state.emulatorhandle.unload();
            self._bootstrapnesboxflash(self.state.title, self.state.file);
        });

    });
};

crazyerics.prototype.state = {
    emulator: null,
    system: 'nes',
    title: '',
    file: '',
    emulatorhandle: null
};
crazyerics.prototype.loadedscripts  = {};

crazyerics.prototype.googleimagesearch = function(searchterm, selector) {

    $.ajax({
        url: 'https://ajax.googleapis.com/ajax/services/search/images',
        dataType: "jsonp",
        data: {
            v: "1.0",
            rsz: 8,
            start: 0,
            q: searchterm
        },
        success: function(response) {
            if (response && response.responseData && response.responseData.results && response.responseData.results[0].tbUrl) {
                $(selector).attr('src', response.responseData.results[0].tbUrl);
            }
        }
    });
};

crazyerics.prototype._bootstrapjsnes = function(title, file) {

    var self = this;
    var romPath = '/roms/nes/' + title + '/' + file;
    var jsnesReady = function() {

        self.googleimagesearch('nes ' + title + ' box', '#gametitlewrapper img');
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
            
            $('#emulatorwrapper').append(html);

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

crazyerics.prototype._bootstrapnesboxflash = function(title, file) {

    var self = this;
    var romPath = '/roms/nes/' + title + '/' + file;

    var nesboxflashReady = function() {
        
        self.googleimagesearch('nes ' + title + ' box', '#gametitlewrapper img');
        $('#gametitlewrapper div').text(title);

        $('#emulator').empty();
        var emulator = $('#emulator');
        
        if (emulator) {
            
            var w = 516;
            var h = w * 0.9375;

            var flashvars = {
                system : 'nes',
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

            $('#emulatorwrapper').append(html);

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