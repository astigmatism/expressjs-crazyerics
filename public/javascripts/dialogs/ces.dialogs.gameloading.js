var cesDialogsGameLoading = (function(_config, $el, $wrapper, args) {

    var _Images = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];
    var _test;
    var $webgl = $('#webglloader');

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
        //$('#gameloadingname').show().text(gameKey.title);

        var img = _Images.BoxFront(gameKey, 'd');
        var texture = null; //_Images.BoxFront(gameKey, 'e'); //256x256 texture
        var recipe = {};

        if (_config.loadingBoxRecipes[gameKey.system]) {
            recipe = _config.loadingBoxRecipes[gameKey.system];
        }
        
        var webgl = new cesWebGlParticleAnimation(recipe, _Compression, _PubSub, _config.paths.textures, $webgl, img, texture, gameKey.system);

        _openCallback();
    };

    this.OnClose = function(callback) {

        $('#webglloader').empty();
        clearInterval(_test);

        return callback();
    };

    var Constructor = (function() {

    })();
});
