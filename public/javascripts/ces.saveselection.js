/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
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

    //prepare grid
    if ($grid.hasClass('isotope')) {
        $grid.empty().isotope('destroy');
    }

    _grid = $grid.addClass('isotope').isotope({
        itemSelector: '.grid-item'
    });

    var GetSaves = function(type) {

        var saves = _Emulator.GetMostRecentSaves(3, type);

        //this is just a way to center the grid with too few items to fill it
        switch(Object.keys(saves).length) {
            case 1:
            $wrapper.find('.grid').addClass('one-item');
            break;
            case 2:
            $wrapper.find('.grid').addClass('two-items');
            break;
            default:
            $wrapper.find('.grid').addClass('items');
            break;
        }

        for (timeStamp in saves) {

            switch (saves[timeStamp].type) {
                case 'user':
                AddToGrid(timeStamp, saves[timeStamp], 'green', 'YOUR SAVE');
                break;
                case 'auto':
                AddToGrid(timeStamp, saves[timeStamp], 'orange', 'AUTO-SAVED');
                break;
            }
        }
    };

    var AddToGrid = function(timeStamp, saveData, ribbonColor, ribbonText) {

        //create the grid item
        var $griditem = $('<div class="grid-item" />').on('click', function(e) {
                
            callback(null, timeStamp, saveData.screenshot);
        });

        var $item = $('<div class="zoom"><h3>' + saveData.time + '</h3></div>');
        var $image = $(BuildScreenshot(_config, _system, saveData.screenshot, 200));
        var $ribbonInner = $('<div class="ribbon-' + ribbonColor + ' ribbon" />').text(ribbonText);
        var $ribbonOuter = $('<div class="ribbon-wrapper" />').append($ribbonInner);
        var $imageWrapper = $('<div class="rel" />').append($ribbonOuter).append($image);

        $item.append($imageWrapper);
        $griditem.append($item);
        
        _grid.isotope( 'insert', $griditem[0]);
	};

    $('#loadnosaves').off().on('mouseup', function() {
        callback('User chose not to load a save');
        _Dialogs.CloseDialog(); //close now
    });

    //populate
    GetSaves();

    //show dialog
    _Dialogs.ShowDialog('savedgameselector');

    return this;

});