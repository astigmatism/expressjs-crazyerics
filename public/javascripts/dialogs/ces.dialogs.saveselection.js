var cesDialogsSaveSelection = (function(_config, $el, $wrapper, args) {

    var self = this;
    var _grid = null;
    var $grid = $wrapper.find('.grid');
    
    var _Emulator = null;
    var _system = null;
    
    var _openCallback = null;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(Emulator, system) {

        _Emulator = Emulator;
        _system = system;
        
        $('#savesselectlist').empty(); //clear from last time

        $('#loadnosaves').off().on('mouseup', function() {
            _openCallback(['Player chose not to load a game']);
            return;
        });
    
        //populate
        GetSaves();
    
        switch (_Emulator.MaximumSavesCheck()) {
            case 'max':
                $wrapper.find('p.max').removeClass(); //shows at maximum message
                break;
            case 'near':
                $wrapper.find('p.near').removeClass(); //shows at near maximum message    
                break;
        }
    };

    var GetSaves = function(type) {

        var saves = _Emulator.GetMostRecentSaves(3, type);

        for (var timestamp in saves) {

            switch (saves[timestamp].save.type) {
                case 'user':
                AddToGrid(timestamp, saves[timestamp], 'green', 'YOUR SAVE');
                break;
                case 'auto':
                AddToGrid(timestamp, saves[timestamp], 'orange', 'AUTO-SAVED');
                break;
            }
        }
    };

    var AddToGrid = function(timestamp, saveData, ribbonColor, ribbonText) {

        var $image = $(BuildScreenshot(_config, _system, saveData.save.screenshot, 200));

        var $li = $('<li class="zoom" data-shader=""><h3>#' + (saveData.total - saveData.i) + ' of ' + saveData.total + ': ' + saveData.save.time + '</h3></li>').on('click', function(e) {
            
            _openCallback([null, timestamp, saveData.save.screenshot]);
        });

        var $ribbonInner = $('<div class="ribbon-' + ribbonColor + ' ribbon" />').text(ribbonText);
        var $ribbonOuter = $('<div class="ribbon-wrapper" />').append($ribbonInner);
        var $imageWrapper = $('<div class="rel" />').append($ribbonOuter).append($image);

        $li.append($imageWrapper);
        $('#savesselectlist').prepend($li); //prepend to add them in reverse order so that they can be read left to right
	};

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});
