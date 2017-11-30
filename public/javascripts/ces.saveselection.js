/**
 * Unlike the other "classes", save selection is more proceedural in operation. I basically wanted to remove this functionality from main
 */
var cesSaveSelection = (function(_config, _Dialogs, _Emulator, _system, $wrapper, callback) {

    //private members
    var self = this;
    var _grid = null;
    var $grid = $wrapper.find('.grid');

    //handle bail
    if ($.isEmptyObject(_Emulator.GetMostRecentSaves(1))) {
        callback('There are no recent saves to display');
        return;
    }

    $('#savesselectlist').empty(); //clear from last time

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
                
            callback(null, timestamp, saveData.save.screenshot);
        });

        var $ribbonInner = $('<div class="ribbon-' + ribbonColor + ' ribbon" />').text(ribbonText);
        var $ribbonOuter = $('<div class="ribbon-wrapper" />').append($ribbonInner);
        var $imageWrapper = $('<div class="rel" />').append($ribbonOuter).append($image);

        $li.append($imageWrapper);
        $('#savesselectlist').append($li);
	};

    $('#loadnosaves').off().on('mouseup', function() {
        callback('User chose not to load a save');
        _Dialogs.CloseDialog(); //close now
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

    //show dialog
    _Dialogs.ShowDialog('savedgameselector');

    return this;

});

/**
 * saved state selection dialog.
 * @param  {Object}   states   structure with states, screenshot and timestap. empty when no states exist
 * @param  {Function} callback
 * @return {undef}
 */
var ShowSaveSelection = function(system, title, file, callback) {

    if (!_Emulator) {
        callback();
        return;
    }

    //get saves from emaultor saves manager to show for selection
    //will return an array for each type, empty if none
    var saves = _Emulator.GetMostRecentSaves(3);

    //no states saved to chose from
    if ($.isEmptyObject(saves)) {
        callback();
        return;
    }

    $('#savesselectlist').empty(); //clear from last time

    //generic function for adding auto and user saves to list
    var addToSelectionList = function(timestamp, saveData, ribbonColor, ribbonText) {

        var $image = $(BuildScreenshot(system, saveData.screenshot, 200));

        var $li = $('<li class="zoom" data-shader=""><h3>' + saveData.time + '</h3></li>').on('click', function(e) {
                
            callback(timestamp);
            ShowSaveLoading(system, saveData.screenshot);
        });

        var $ribbonInner = $('<div class="ribbon-' + ribbonColor + ' ribbon" />').text(ribbonText);
        var $ribbonOuter = $('<div class="ribbon-wrapper" />').append($ribbonInner);
        var $imageWrapper = $('<div class="rel" />').append($ribbonOuter).append($image);

        $li.append($imageWrapper);
        $('#savesselectlist').append($li);
    };

    for (var timestamp in saves) {
        switch (saves[timestamp].type) {
            case 'user':
            addToSelectionList(timestamp, saves[timestamp], 'green', 'YOUR SAVE');
            break;
            case 'auto':
            addToSelectionList(timestamp, saves[timestamp], 'orange', 'AUTO-SAVED');
            break;
        }
    }

    $('#loadnosaves').off().on('mouseup', function() {
        callback(null);
        _Dialogs.CloseDialog(); //close now
    });

    //show dialog
    _Dialogs.ShowDialog('savedgameselector');
};