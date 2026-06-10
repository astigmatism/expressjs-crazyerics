var cesDialogsEmulatorCleanup = (function(_config, $el, $wrapper, args) {

    var _openCallback = null;
    var _artificalTimeout = 2000;
    var _openTimer = null;
    var _openGeneration = 0;
    var _callbackFired = false;

    this.OnOpen = function(args, callback) {
        _openGeneration++;
        _openCallback = callback;
        _callbackFired = false;

        if (_openTimer) {
            clearTimeout(_openTimer);
            _openTimer = null;
        }

        Open.apply(this, args || []);
    };

    var Open = function() {
        var generation = _openGeneration;
        var callback = _openCallback;

        _openTimer = setTimeout(function() {
            if (generation !== _openGeneration || _callbackFired) {
                return;
            }

            _openTimer = null;
            _callbackFired = true;

            if (callback) {
                callback();
            }
        }, _artificalTimeout);
    };

    this.OnIntroAnimationComplete = function() {

    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});
