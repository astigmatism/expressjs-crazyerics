var cesDialogsGameLoading = (function(_config, $el, $wrapper, args) {

    var _BoxArt = args[0];
    var _Compression = args[1];
    var _PubSub = args[2];

    var _tipsCycleRate = 4000;
    var _tips = [
        'Hold R = Rewind',
        'Hold Space = Fast Forward',
        'F = Fullscreen',
        //'You can save your progress (or state) by pressing the 1 key, return to it anytime with the 4 key',
        //'We\'ll store all of your saves as long as you return within two weeks',
        'P = Pause',
        'Select a system from the dropdown to generate a new list of suggested games',
        'Select a system from the dropdown to search for foreign or obscure titles',
        'T = Take Screenshot',
        'H = Reset',
        '1 = Save Progress',
        'If you remain idle for 10 seconds, we auto-save your progress',
        '4 = Load last progress'
    ];
    var _openCallback = null;

    this.OnOpen = function(args, callback) {
        _openCallback = callback;
        Open.apply(this, args);
    };

    var Open = function(gameKey) {

        $('#tip').hide();
        //$('#gameloadingname').show().text(gameKey.title);

        var box = _BoxArt.Get(gameKey, 200);
        var texture = _BoxArt.Get(gameKey, '256x256');
        var recipe = {};
        if (_config.loadingBoxRecipes[gameKey.system]) {
            recipe = _config.loadingBoxRecipes[gameKey.system];
        }
        
        var loadingWebGL = new cesLoadingWebGL(recipe, _Compression, _PubSub, _config.paths.textures, $('#webglloader'), box, texture, gameKey.system);

        //show tips on loading
        var randomizedTips = shuffle(_tips);
        var tipIndex = -1;
        var tipInterval = setInterval(function() {
            $('#gameloadingname').fadeOut(500);
            $('#tip').fadeOut(500, function() {
                
                ++tipIndex;
                if (tipIndex >= randomizedTips.length) {
                    tipIndex = 0;
                }

                var tip = randomizedTips[tipIndex];

                if (!$('#gameloading').is(':animated')) {
                   // $('#tip').empty().append(tip).fadeIn(500);
                }

            });
        }, _tipsCycleRate); //show tip for this long

        _openCallback(tipInterval);
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});

// var ShowGameLoading = function(gameKey, callback) {

//     $('#tip').hide();
//     $('#gameloadingname').show().text(gameKey.title);

//     var box = _BoxArt.Get(gameKey, 200);
//     var texture = _BoxArt.Get(gameKey, '256x256');
//     var recipe = {};
//     if (_config.loadingBoxRecipes[gameKey.system]) {
//         recipe = _config.loadingBoxRecipes[gameKey.system];
//     }
    
//     var loadingWebGL = new cesLoadingWebGL(recipe, _Compression, _PubSub, _config.paths.textures, $('#webglloader'), box, texture, gameKey.system);

//     //show tips on loading
//     var randomizedTips = shuffle(_tips);
//     var tipIndex = -1;
//     var tipInterval = setInterval(function() {
//         $('#gameloadingname').fadeOut(500);
//         $('#tip').fadeOut(500, function() {
            
//             ++tipIndex;
//             if (tipIndex >= randomizedTips.length) {
//                 tipIndex = 0;
//             }

//             var tip = randomizedTips[tipIndex];

//             if (!$('#gameloading').is(':animated')) {
//                 $('#tip').empty().append(tip).fadeIn(500);
//             }

//         });
//     }, _tipsCycleRate); //show tip for this long

//     _Dialogs.ShowDialog('gameloading', null, function() {
//         callback(tipInterval);
//     }); 
// };