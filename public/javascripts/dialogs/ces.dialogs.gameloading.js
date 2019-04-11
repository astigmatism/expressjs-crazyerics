var cesDialogsGameLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');
    var $mediawrapper = $('#gameloadingwrapper');
    var $currentImage = null;

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
    var _openCallback = null;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(gameKey) {

        $('#tip').hide();

        var img = _Media.BoxFront(gameKey, 'd');
        
        _webgl = new cesWebGlParticleAnimation(_Compression, _PubSub, _config.paths.textures, $webgl, img);
        $webgl.fadeIn(1000);

        _PubSub.SubscribeOnce('emulatorloading', this, OnEmulatorBeginsLoading);
        _PubSub.SubscribeOnce('gameloading', this, OnGameBeginsLoading);

        _openCallback();
    };

    var OnEmulatorBeginsLoading = function(gameKey) {
        
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

        //close emulator image
        $currentImage.cssAnimation(emulatorDisappearAnimation.name, emulatorDisappearAnimation.duration, false, function() {

            $currentImage = _Media.BoxFront(gameKey, 'd');

            $currentImage.load(function() {

                $currentImage.removeClass('transparent').cssAnimation(gameAppearAnimation.name, gameAppearAnimation.duration, false, function() {
                    $currentImage.cssAnimation(gameStayAnimation.name, gameStayAnimation.duration, true);
                });
            });

            $mediawrapper
                .empty()
                .append($currentImage.addClass('transparent'));

        }, 'transparent');
    };

    this.OnIntroAnimationComplete = function() {

    };

    this.OnClose = function(callback) {

        $webgl.fadeOut(1000, function() {
            $webgl.empty();
            _webgl = null;
            $mediawrapper.empty(); //final clean up
        });

        return callback();
    };

    var Constructor = (function() {

    })();
});
