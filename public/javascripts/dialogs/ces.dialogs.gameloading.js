var cesDialogsGameLoading = (function(_config, $el, $wrapper, args) {

    var _Media = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _webgl = null;
    var $webgl = $('#dialogloadingbackground');
    var $mediawrapper = $('#gameloadingimage');

    var flipInXAnimationDuration = 2000;
    var bounceAnimationDuration = 3000;

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

        if (_config.loadingBoxRecipes[gameKey.system]) {
            recipe = _config.loadingBoxRecipes[gameKey.system];
        }
        
        _webgl = new cesWebGlParticleAnimation(_Compression, _PubSub, _config.paths.textures, $webgl, img);
        $webgl.fadeIn(1000);

        _PubSub.SubscribeOnce('emulatorloading', this, OnEmulatorBeginsLoading);
        _PubSub.SubscribeOnce('gameloading', this, OnGameBeginsLoading);

        /*
        _Media.Video($mediawrapper, 'sq', gameKey, function($video, videoLoadTime) {

            $mediawrapper.empty().append($video).fadeIn(500);
            $video.get(0).muted = true;
            $video.get(0).loop = true;
            $video.get(0).play(); //function of dom element

        }, 200, 200); //opt_width, opt_height
        */

        _openCallback();
    };

    var OnEmulatorBeginsLoading = function(gameKey) {
        
        var image = new Image();
        image.src = _config.paths.images + '/systems/' + gameKey.system + '/logo.png';
        
        var $image = $(image);
        $mediawrapper
            .empty()
            .append($image);

        $image
            .addClass('flipInX')
            .css({
                'animation-duration': (flipInXAnimationDuration / 1000) + 's',	
                '-webkit-animation-duration': (flipInXAnimationDuration / 1000) + 's'
            })
            .load(function() {
                
                $mediawrapper.removeClass('close');

                setTimeout(function() {

                    $image
                        .removeClass('flipInX')
                        .addClass('bounce')
                        .css({
                            'animation-duration': (bounceAnimationDuration / 1000) + 's',	
                            '-webkit-animation-duration': (bounceAnimationDuration / 1000) + 's'
                        });

                }, flipInXAnimationDuration);
        });
    };

    var OnGameBeginsLoading = function(gameKey) {
        
        //close emulator image
        //$mediawrapper.find('img').removeClass('sepia');
        $mediawrapper.addClass('close');

        //wait for emulator image to disappear
        setTimeout(function() {
        
            var $image = _Media.BoxFront(gameKey, 'd');
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
        }, 1000);
    };

    this.OnClose = function(callback) {

        $webgl.fadeOut(1000, function() {
            $webgl.empty();
            _webgl = null;
            $mediawrapper.empty(); //final clean up
        });

        $mediawrapper.addClass('close');

        return callback();
    };

    var Constructor = (function() {

    })();
});
