var cesDialogsSaveLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _openCallback = null;
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(system, screenshotData) {

        var $image = $(BuildScreenshot(_config, system, screenshotData, null, 200));
        $image.addClass('tada');
        $image.load(function() {
            $(this).fadeIn(200);
        });

        $('#saveloadingimage').empty().addClass('centered').append($image);

        _webgl = new cesWebGlParticleAnimation(_Compression, _PubSub, _config.paths.textures, $webgl, $image);
        $webgl.fadeIn(1000);
    };

    this.OnClose = function(callback) {

        $webgl.fadeOut(1000, function() {
            _webgl = null;
            $webgl.empty();
        });

        return callback();
    };

    var Constructor = (function() {

    })();
});
