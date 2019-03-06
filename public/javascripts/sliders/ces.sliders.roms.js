var cesSlidersRoms = (function(_config, $li, $panel) {

    var self = this;
    var heightOfSelect = '500px'; //a css definition. needs to include px

    this.Activate = function(gameKey, files, _Compression, _PlayGameHandler) {
        
        /*
        files: {
            title1: {
                gk: xyz,
                rank: 400
            },
            title2...
        }
        */

        var $title = $('#romsSliderCurrent');
        $title.text(gameKey.file);

        var $select = $panel.find('select');
        $select.empty();

        for (var file in files) {
            var selected = (file == gameKey.file) ? ' selected' : '';
            $select.append('<option value="' + files[file].gk + '"' + selected + '>' + file + '</option>');
        }

        //romfile select
        $select.selectOrDie({
            customID: 'romsselectordie',
            size: 20,
            onChange: function() {
                var gk = $(this).val();
                var newGameKey = _Compression.Decompress.gamekey(gk);
                _PlayGameHandler(newGameKey);
            }
        });

        //selectordie fails to calculate outerHeight() when the display is set to none. this is a correction
        $panel.find('.sod_list').css('max-height', heightOfSelect);
    };

    this.Deactivate = function() {

        var $select = $panel.find('select');
        $select.selectOrDie('destroy');
        $select.empty();
    };

    this.OnOpen = function(callback) {

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    var Constructor = (function() {

    })();
});