var cesDialogsTemplate = (function(_config, $el, $wrapper, args) {

    var _openCallback = null;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function() {

    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});
