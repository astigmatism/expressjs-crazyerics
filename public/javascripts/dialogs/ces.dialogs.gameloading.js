var cesDialogsGameLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');
    var $mediawrapper = $('#gameloadingwrapper');
    var $currentImage = null;
    var _openCallback = null;
    var _currentGameKey = null;
    var _emulatorLoadingStartedAt = null;
    var _emulatorLoadingTransitionTimer = null;
    var _gameLoadingQueued = false;
    var _gameLoadingStarted = false;
    var _emulatorLoadingStarted = false;
    var _minimumEmulatorLoadingDisplayTime = 3000;
    var _webglDataKey = 'cesWebGlLoadingBackground';
    var _webglFadeDataKey = 'cesWebGlLoadingBackgroundFade';
    var _webglGenerationDataKey = 'cesWebGlLoadingBackgroundGeneration';

    var emulatorAppearAnimation = {
        name: 'flipInX',
        duration: 1000
    };
    var emulatorStayAnimation = {
        name: 'bounce',
        duration: 3000
    };
    var emulatorDisappearAnimation = {
        name: 'flipOutX',
        duration: 750
    };
    var gameAppearAnimation = {
        name: 'flipInX',
        duration: 1000
    };
    var gameStayAnimation = {
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

    // var _tipsCycleRate = 4000;
    // var _tips = [
    //     'Hold R = Rewind',
    //     'Hold Space = Fast Forward',
    //     'F = Fullscreen',
    //     //'You can save your progress (or state) by pressing the 1 key, return to it anytime with the 4 key',
    //     //'We\'ll store all of your saves as long as you return within two weeks',
    //     'P = Pause',
    //     'Select a system from the dropdown to generate a new list of suggested games',
    //     'Select a system from the dropdown to search for foreign or obscure titles',
    //     'T = Take Screenshot',
    //     'H = Reset',
    //     '1 = Save Progress',
    //     'If you remain idle for 10 seconds, we auto-save your progress',
    //     '4 = Load last progress'
    // ];

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var ResetLoadingState = function() {

        if (_emulatorLoadingTransitionTimer) {
            clearTimeout(_emulatorLoadingTransitionTimer);
            _emulatorLoadingTransitionTimer = null;
        }

        _currentGameKey = null;
        _emulatorLoadingStartedAt = null;
        _gameLoadingQueued = false;
        _gameLoadingStarted = false;
        _emulatorLoadingStarted = false;
    };

    var Open = function(gameKey) {

        ResetLoadingState();

        _currentGameKey = gameKey;

        $('#tip').hide();

        var img = _Media.BoxFront(gameKey, 'd');
        
        StartWebGlBackground(img);

        _PubSub.SubscribeOnce('emulatorloading', this, OnEmulatorBeginsLoading);
        _PubSub.SubscribeOnce('gameloading', this, OnGameBeginsLoading);

        // Show the emulator/system loading state immediately when this dialog opens.
        // The emulatorloading event is only published when the emulator script is fetched;
        // if the script is already cached in client memory, gameloading can fire almost
        // immediately and the system-logo loading message is skipped or flashes too fast.
        // Starting the emulator phase here guarantees visible feedback for every game load.
        OnEmulatorBeginsLoading(gameKey);

        _openCallback();
    };

    var OnEmulatorBeginsLoading = function(gameKey) {
        
        if (_emulatorLoadingStarted) {
            return;
        }

        _emulatorLoadingStarted = true;
        _emulatorLoadingStartedAt = Date.now();

        var image = new Image();
        image.src = _config.paths.images + '/systems/' + gameKey.system + '/logo.png';
        
        $currentImage = $(image);

        $currentImage.load(function() {

            $currentImage.removeClass('transparent').cssAnimation(emulatorAppearAnimation.name, emulatorAppearAnimation.duration, false, function() {
                $currentImage.cssAnimation(emulatorStayAnimation.name, emulatorStayAnimation.duration, true);
            });
        });
        
        $mediawrapper
            .empty()
            .append($currentImage.addClass('transparent'));
    };

    var OnGameBeginsLoading = function(gameKey) {

        var elapsed;
        var remaining;

        if (_gameLoadingStarted) {
            return;
        }

        if (!_emulatorLoadingStarted) {
            OnEmulatorBeginsLoading(gameKey);
        }

        elapsed = _emulatorLoadingStartedAt ? Date.now() - _emulatorLoadingStartedAt : 0;
        remaining = _minimumEmulatorLoadingDisplayTime - elapsed;

        if (remaining > 0) {
            _gameLoadingQueued = true;

            if (_emulatorLoadingTransitionTimer) {
                clearTimeout(_emulatorLoadingTransitionTimer);
            }

            _emulatorLoadingTransitionTimer = setTimeout(function() {
                _emulatorLoadingTransitionTimer = null;

                if (_gameLoadingQueued) {
                    StartGameLoadingVisual(gameKey);
                }
            }, remaining);

            return;
        }

        StartGameLoadingVisual(gameKey);
    };

    var StartGameLoadingVisual = function(gameKey) {

        _gameLoadingQueued = false;
        _gameLoadingStarted = true;

        if (!$currentImage || !$currentImage.length) {
            ShowGameImage(gameKey);
            return;
        }

        //close emulator image
        $currentImage.cssAnimation(emulatorDisappearAnimation.name, emulatorDisappearAnimation.duration, false, function() {

            ShowGameImage(gameKey);

        }, 'transparent');
    };

    var ShowGameImage = function(gameKey) {

        $currentImage = _Media.BoxFront(gameKey, 'd');

        $currentImage.load(function() {

            $currentImage.removeClass('transparent').cssAnimation(gameAppearAnimation.name, gameAppearAnimation.duration, false, function() {
                $currentImage.cssAnimation(gameStayAnimation.name, gameStayAnimation.duration, true);
            });
        });

        $mediawrapper
            .empty()
            .append($currentImage.addClass('transparent'));
    };

    this.OnIntroAnimationComplete = function() {

    };

    this.OnClose = function(callback) {

        ResetLoadingState();

        StopWebGlBackground();
        $mediawrapper.empty(); //final clean up

        return callback();
    };

    var Constructor = (function() {

    })();
});
