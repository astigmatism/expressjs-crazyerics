var cesDialogsSaveLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _openCallback = null;
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');
    var $mediawrapper = $('#saveloadingwrapper');
    var _webglDataKey = 'cesWebGlLoadingBackground';
    var _webglFadeDataKey = 'cesWebGlLoadingBackgroundFade';
    var _webglGenerationDataKey = 'cesWebGlLoadingBackgroundGeneration';

    var introAnimation = {
        name: 'flipInX',
        duration: 1000
    };
    var stayAnimation = {
        name: 'bounce',
        duration: 3000
    };

    var GetWebGlBackgroundGeneration = function() {

        return $webgl.data(_webglGenerationDataKey) || 0;
    };

    var NextWebGlBackgroundGeneration = function() {

        var generation = GetWebGlBackgroundGeneration() + 1;

        $webgl.data(_webglGenerationDataKey, generation);

        return generation;
    };

    var DisposeWebGlBackground = function(webgl) {

        if (webgl && typeof webgl.Dispose === 'function') {
            webgl.Dispose();
        }
    };

    var DisposeExistingWebGlBackground = function() {

        var activeWebgl = $webgl.data(_webglDataKey);
        var fadingWebgl = $webgl.data(_webglFadeDataKey);

        if (_webgl && _webgl !== activeWebgl && _webgl !== fadingWebgl) {
            DisposeWebGlBackground(_webgl);
        }

        DisposeWebGlBackground(activeWebgl);

        if (fadingWebgl !== activeWebgl) {
            DisposeWebGlBackground(fadingWebgl);
        }

        _webgl = null;

        $webgl
            .removeData(_webglDataKey)
            .removeData(_webglFadeDataKey);
    };

    var StartWebGlBackground = function(image) {

        NextWebGlBackgroundGeneration();
        DisposeExistingWebGlBackground();

        $webgl
            .stop(true, true)
            .hide()
            .empty();

        _webgl = new cesWebGlParticleAnimation(_Compression, _PubSub, _config.paths.textures, $webgl, image);
        $webgl.data(_webglDataKey, _webgl);
        $webgl.fadeIn(1000);
    };

    var StopWebGlBackground = function() {

        var webgl = _webgl || $webgl.data(_webglDataKey);
        var fadingWebgl = $webgl.data(_webglFadeDataKey);
        var generation = NextWebGlBackgroundGeneration();

        if (fadingWebgl && fadingWebgl !== webgl) {
            DisposeWebGlBackground(fadingWebgl);
            $webgl.removeData(_webglFadeDataKey);
        }

        _webgl = null;

        if ($webgl.data(_webglDataKey) === webgl) {
            $webgl.removeData(_webglDataKey);
        }

        if (webgl) {
            $webgl.data(_webglFadeDataKey, webgl);
        }

        $webgl
            .stop(true, false)
            .fadeOut(1000, function() {

                DisposeWebGlBackground(webgl);

                if ($webgl.data(_webglFadeDataKey) === webgl) {
                    $webgl.removeData(_webglFadeDataKey);
                }

                if (generation === GetWebGlBackgroundGeneration()) {
                    $webgl.empty();
                }
            });
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

        StartWebGlBackground($image);
    };

    this.OnIntroAnimationComplete = function() {

    };

    this.OnClose = function(callback) {

        StopWebGlBackground();

        return callback();
    };

    var Constructor = (function() {

    })();
});
