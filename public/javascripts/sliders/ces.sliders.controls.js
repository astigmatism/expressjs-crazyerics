var cesSlidersControls = (function(_config, $li, $panel) {

    var self = this;

    this.Activate = function(gameKey) {
        
        var $controller = $panel.find('img.controller');

        $controller.addClass('close');
        $controller.imagesLoaded().done(function() {
            $controller.removeClass('close'); //remove close on parent to reveal image
        });
        $controller.attr('src',_config.paths.images + '/gamepads/' + gameKey.system + '/configure_dialog_bg.png');
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