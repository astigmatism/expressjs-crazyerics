var cesDialogsSaveLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _openCallback = null;
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');
    var $mediawrapper = $('#saveloadingwrapper');

    var introAnimation = {
        name: 'flipInX',
        duration: 1000
    };
    var stayAnimation = {
        name: 'bounce',
        duration: 3000
    };

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(system, screenshotData) {

        var $image = $(BuildScreenshot(_config, system, screenshotData, null, 200)).addClass('transparent');

        $mediawrapper
            .empty()
            .append($image);

        $image.load(function() {

            $image.removeClass('transparent').cssAnimation(introAnimation.name, introAnimation.duration, false, function() {

                $image.cssAnimation(stayAnimation.name, stayAnimation.duration, true);
            });
        });

        _webgl = new cesWebGlParticleAnimation(_Compression, _PubSub, _config.paths.textures, $webgl, $image);
        $webgl.fadeIn(1000);
    };

    this.OnIntroAnimationComplete = function() {

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
