var cesSliders = (function(_config, _Compression, $silderIcons) {

    var _self = this;
    var _sliders = {};
    var _currentOpen = null;
    
    this.Open = function(name, callback) {

        //the name must exist
        if (!_sliders.hasOwnProperty(name)) {
            return;
        }

        //if currently, bail
        if (name == _currentOpen) {
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
                    
                    $(data.panel).slideDown(function() {
                        $(data.panel).addClass('opened');
                    });

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
                

                $(data.panel).slideUp(function() {
                    $(data.panel).addClass('closed');
                });

                _currentOpen = null;

                callback(); //finally callback when complete
            }
        });
    };

    //called on emaultion exit
    this.DeactivateAll = function(args) {

        for (var slider in _sliders) {
            _sliders[slider].activated = false;
            _sliders[slider].icon.addClass('deactivated');
            _sliders[slider].module.Deactivate.apply(null, args);
        }
    };

    this.Activate = function(name, args) {

        if (_sliders[name] && _sliders[name].module && _sliders[name].module.Activate) {
            _sliders[name].activated = true;
            _sliders[name].icon.removeClass('deactivated');  //reveal icon for clicking
            _sliders[name].module.Activate.apply(null, args);
        }
    };

    //self execute at end of script for availiblity of everything above
    var Constructor = (function() {

        $silderIcons.children().each(function(index, li) {

            var $li = $(li);
            var sliderId = $(this).data('slider');
            var $panel = $('#' + sliderId + '-slider');

            $li.addClass('deactivated');

            //if a data reference was found along with the dom element
            if (sliderId && $('#' + sliderId + '-slider')) {

                var module;

                if (window.hasOwnProperty('cesSliders' + sliderId)) {
                    module = new window['cesSliders' + sliderId](_config, $li, $panel, function() {
                        _self.Open(sliderId); //give each module the ability to open themselves (because some are subscribing to topics)
                    });
                }

                _sliders[sliderId] = {
                    icon: $li,
                    panel: $panel,
                    module: module,
                    activated: false
                };

                $li.on('click', function() {
                    _self.Open(sliderId);
                });
            }
        });

    })();

    return this;
});