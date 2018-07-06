var cesSliders = (function(_config, _Compression, $silderIcons) {

    var _self = this;
    var _sliders = {};
    var _currentOpen = null;
    var _currentGameKey = null;
    
    this.Open = function(name, callback) {

        //the name must exist and a gamekey must be registered for slider to show/work
        if (!_sliders.hasOwnProperty(name) || !_currentGameKey) {
            return;
        }

        var data = _sliders[name];

        //first close the open slider
        _self.Close(null, function(result) {

            data.module.OnOpen(function(result) {
                
                //if the module's OnOpen indictaes success, ok to open
                if (result) {
                    $(data.icon).addClass('on');

                    $(data.panel).removeClass('closed');
                    $(data.panel).addClass('opened');

                    _currentOpen = name;

                    if (callback) {
                        callback();
                    }
                }
            });
        });

    };

    this.Close = function(name, callback) {
        
        name = name || _currentOpen; //close by request or just close open

        if (!_sliders.hasOwnProperty(name) || _currentOpen == null) {
            return callback(false);
        }

        var data = _sliders[name];

        data.module.OnClose(function(result) {

            //if the module's onclose indicates true in result, its ok to move on
            if (result) {
                $(data.icon).removeClass('on');

                $(data.panel).removeClass('opened');
                $(data.panel).addClass('closed');

                _currentOpen = null;

                callback(); //finally callback when complete
            }
        });
    };

    this.RegisterGameKey = function(gameKey, info) {
        _currentGameKey = gameKey;

        for (var slider in _sliders) {
            if (_sliders[slider].module && _sliders[slider].module.Content) {
                _sliders[slider].module.Content(gameKey, info);
            }
        }
    };

    //self execute at end of script for availiblity of everything above
    var Constructor = (function() {

        $silderIcons.children().each(function(index, li) {

            var $li = $(li);
            var sliderId = $(this).data('slider');
            var $panel = $('#' + sliderId + '-slider');

            //if a data reference was found along with the dom element
            if (sliderId && $('#' + sliderId + '-slider')) {

                var module;

                if (window.hasOwnProperty('cesSliders' + sliderId)) {
                    module = new window['cesSliders' + sliderId](_config, $li, $panel);
                }

                _sliders[sliderId] = {
                    icon: $li,
                    panel: $panel,
                    module: module
                }

                $li.on('click', function() {
                    _self.Open(sliderId);
                });
            }
        });

    })();

    return this;
});