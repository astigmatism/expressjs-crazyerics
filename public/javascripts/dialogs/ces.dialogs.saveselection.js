var cesDialogsSaveSelection = (function(_config, $el, $wrapper, args) {

    var self = this;
    var _grid = null;
    var $grid = $wrapper.find('.grid');
    
    var _Emulator = null;
    var _system = null;
    
    var _openCallback = null;

    var appearAnimation = 'flipInX';
    var _appearDuration = 1000;
    var _appearDelay = 200;     //between items

    var disappearAnimation = 'flipOutX';
    var disappearDuration = 1000;
    var disappearDelay = 200; //wait time between icons disappearing

    var selectedAnimation = 'tada';
    var selectedAnimationDuration = 1500;

    var selection = null;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(Emulator, system) {

        _Emulator = Emulator;
        _system = system;
        
        $('#savesselectlist').empty(); //clear from last time
        selection = null;

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
                AddToGrid(timestamp, saves[timestamp], 'YOUR SAVE');
                break;
                case 'auto':
                AddToGrid(timestamp, saves[timestamp], 'AUTO-SAVED');
                break;
            }
        }
    };

    var AddToGrid = function(timestamp, saveData, saveTypeText) {

        var savePreviewWidth = 300;
        var $image = $(BuildScreenshot(_config, _system, saveData.save.screenshot, savePreviewWidth))
            .attr('alt', saveTypeText + ' saved progress screenshot');

        var $li = $('<li class="zoom transparent" data-timestamp="' + timestamp + '"></li>').on('click', function(e) {
            
            OnSaveSelected(timestamp, saveData.save.screenshot);
        });

        //image
        var $imageWrapper = $('<div class="rel save-preview-frame" />').append($image);
        $li.append($imageWrapper);
        
        //caption
        var $caption = $('<div class="save-selection-caption" />');
        // $('<h3 />').text(saveTypeText).appendTo($caption);

        if (saveData.total > 1 && saveData.i == 0) {
            $('<p />').text('Newest').appendTo($caption);
        }

        $('<p />').text((saveData.total - saveData.i) + ' of ' + saveData.total).appendTo($caption);
        $('<p />').text($.format.prettyDate(saveData.save.timestamp)).appendTo($caption);
        $li.append($caption);

        $('#savesselectlist').prepend($li); //prepend to add them in reverse order so that they can be read left to right
    };

    var OnSaveSelected = function(timestamp, screenshot) {
        
        //bail if selection was already made on this dialog
        if (selection) {
            return;
        }
        selection = timestamp; //assign any value to boolean

        OutroAnimations(timestamp, function() {

            _openCallback([null, timestamp, screenshot]);
        });
    };
    
    this.OnIntroAnimationComplete = function() {

        //stagger in animations
        $('#savesselectlist li').each(function(index, item) {
            
            setTimeout(function() {
                $(item).removeClass('transparent').cssAnimation(appearAnimation, _appearDuration);
            }, _appearDelay * (index + 1)); //wait one full delay cycle before bringing first in
        });
    };

    var OutroAnimations = function(timestamp, animationsComplete) {

        var totalDisappearDuration = disappearDuration;

        //animate out others
        $('#savesselectlist li').each(function(index, li) {
            
            //the items not selected
            if ($(li).attr('data-timestamp') != timestamp) {

                var delay = disappearDelay * (index + 1);
                
                setTimeout(function() {
                    $(li).cssAnimation(disappearAnimation, disappearDuration, false, null, 'transparent');    
                }, delay);
                
                totalDisappearDuration += (disappearDelay);
            }
            //the item selected
            else {
                $(li).cssAnimation(selectedAnimation, selectedAnimationDuration);
            }
        });

        setTimeout(function() {
            animationsComplete();
        }, totalDisappearDuration);
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});
