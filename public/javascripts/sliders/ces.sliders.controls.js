var cesSlidersControls = (function(_config, $li, $panel) {

    var self = this;
    var _inputAssignmentMap;

    this.Activate = function(gameKey, _GamePad) {
        
        _inputAssignmentMap = _config.mappings[gameKey.system];

        //gamepad list
        var $tr = $panel.find('tr.controllers');

        var gamepads = _GamePad.GetGamePadDetails();
        if ($.isEmptyObject(gamepads)) {
            
        }
        else {

        }

        //controller image
        // var $controller = $panel.find('img.controller');

        // $controller.addClass('close');
        // $controller.imagesLoaded().done(function() {
        //     $controller.removeClass('close'); //remove close on parent to reveal image
        // });
        // $controller.attr('src', _config.paths.images + '/gamepads/' + gameKey.system + '/configure_dialog_bg.png');
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