var cesDialogsEmulatorCleanup = (function(_config, $el, $wrapper, args) {

    var _openCallback = null;
    var _artificalTimeout = 2000;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function() {
        setTimeout(function() {
            _openCallback();
        }, _artificalTimeout)
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});
