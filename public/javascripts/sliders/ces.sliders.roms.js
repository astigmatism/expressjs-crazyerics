var cesSlidersRoms = (function(_config, $li, $panel) {

    var self = this;

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

        for (file in files) {
            var selected = (file == gameKey.file) ? ' selected' : '';
            $select.append('<option value="' + files[file].gk + '"' + selected + '>' + file + '</option>');
        }

        //console select
        $select.selectOrDie({
            customID: 'romsselectordie',
            customClass: 'tooltip',
            size: 20,
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                var gk = $(this).val();
                var newGameKey = _Compression.Decompress.gamekey(gk);
                _PlayGameHandler(newGameKey);
            }
        });
    };

    this.Deactivate = function() {

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