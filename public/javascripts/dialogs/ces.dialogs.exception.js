var cesDialogsException= (function(_config, $el, $wrapper, args) {

    var _openCallback = null;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(message, e) {

        $('#emulatorexceptiondetails').text(message + '\r\n' + e);
        console.error(e);
        _openCallback();
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {
    })();
});
