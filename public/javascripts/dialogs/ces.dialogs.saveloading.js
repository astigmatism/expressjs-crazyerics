var cesDialogsSaveLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _openCallback = null;
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');
    var $mediawrapper = $('#saveloadingimage');

    var flipInXAnimationDuration = 2000;
    var bounceAnimationDuration = 3000;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(system, screenshotData) {

        var $image = $(BuildScreenshot(_config, system, screenshotData, null, 200));
        
        $image
            .addClass('flipInX')
            .css({
                'animation-duration': (flipInXAnimationDuration / 1000) + 's',	
                '-webkit-animation-duration': (flipInXAnimationDuration / 1000) + 's'
            })
            .load(function() {
                
                $mediawrapper.removeClass('close');

                $image
                    .removeClass('flipInX')
                    .addClass('bounce')
                    .css({
                        'animation-duration': (bounceAnimationDuration / 1000) + 's',	
                        '-webkit-animation-duration': (bounceAnimationDuration / 1000) + 's'
                    });
        });

        $mediawrapper.empty().append($image);

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
