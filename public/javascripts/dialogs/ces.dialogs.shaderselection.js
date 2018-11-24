var cesDialogsShaderSelection = (function(_config, $el, $wrapper, args) {

    var _selectionCallback = null;
    var _preferences = args[0];     //ref to _Preferences
    var selection = null;

    var appearAnimation = 'flipInX';
    var _appearDuration = 1000;
    var _appearDelay = 200;     //between items

    var disappearAnimation = 'flipOutX';
    var disappearDuration = 1000;
    var disappearDelay = 200; //wait time between icons disappearing

    var selectedAnimation = 'tada';
    var selectedAnimationDuration = 1500;
    
    this.OnOpen = function(args, selectionCallback) {

        _selectionCallback = selectionCallback || null;
        Open.apply(this, args);
    };

    var Open = function(system, preselectedShader) {

        $el.find('span').text(_config.systemdetails[system].shortname); //fix text on shader screen
        $('#shaderselectlist').empty(); //clear all previous content
        selection = null;

        //bail early: check if shader already defined for this system (an override value passed in)
        if (preselectedShader) {
            OnShaderSelected(system, preselectedShader);
            return;
        }

        //get the recommended shaders list
        var recommended = _config.systemdetails[system].recommendedshaders;
        var shaderfamilies = _config.shaders;
        var i = 0;

        //suggest all (for debugging), remove when the ability to test all shaders is present
        // for (i; i < shaderfamilies.length; ++i) {
        //     $('#shaderselectlist').append($('<div style="display:block;padding:0px 5px;" data-shader="' + shaderfamilies[i] + '">' + shaderfamilies[i] + '</div>').on('click', function(e) {
        //         OnShaderSelected(system, $(this).attr('data-shader'));
        //     }));
        // }

        $('#shaderselectlist').append($('<li class="zoom transparent" data-shader=""><h3>Pixel Perfect</h3><img src="' + _config.paths.images + '/shaders/pixels.png" /></li>').on('click', function(e) {
            OnShaderSelected(system, $(this).attr('data-shader'));
        }));

        for (i; i < recommended.length; ++i) {

            var key = recommended[i];

            $('#shaderselectlist').append($('<li class="transparent zoom" data-shader="' + key.shader + '"><h3>' + key.title + '</h3><img src="' + _config.paths.images + '/shaders/' + key.shader + '.png" /></li>').on('click', function(e) {
                OnShaderSelected(system, $(this).attr('data-shader'));
            }));
        }
    };

    this.OnIntroAnimationComplete = function() {

        //stagger in animations
        $('#shaderselectlist li').each(function(index, item) {
            
            setTimeout(function() {
                $(item).removeClass('transparent').cssAnimation(appearAnimation, _appearDuration);
            }, _appearDelay * (index + 1)); //wait one full delay cycle before bringing first in
        });
    };

    var OnShaderSelected = function(system, shader) {

        //$('#systemshaderseletorwrapper').addClass('close');
        
        //bail if selection was already made on this dialog
        if (selection) {
            return;
        }
        selection = shader;

        var playerPreferencesToSave = {};
        var saveselection = false;

        OutroAnimations(shader, function() {

            //get result of checkbox
            if ($('#shaderselectcheckbox').is(':checked')) {
                saveselection = true;
                _preferences.Set('systems.' + system + '.shader', shader); //we set a flag in pref when update to go out over the next request
            }

            $('#systemshaderseletorwrapper').hide();
            
            if (_selectionCallback) {

                _selectionCallback({
                    'shader': shader
                });
            }
        });
    };

    var OutroAnimations = function(shader, animationsComplete) {

        var totalDisappearDuration = disappearDuration;

        //animate out others
        $('#shaderselectlist li').each(function(index, li) {
            
            //the items not selected
            if ($(li).attr('data-shader') != shader) {

                var delay = disappearDelay * (index + 1);
                
                setTimeout(function() {
                    $(li).cssAnimation(disappearAnimation, disappearDuration, false, null, 'transparent');    
                }, delay);

                totalDisappearDuration += (disappearDelay);
            }
            //the item selected
            else {
                $(li).cssAnimation(selectedAnimation, selectedAnimationDuration);
            }
        });

        setTimeout(function() {
            animationsComplete();
        }, totalDisappearDuration);
    };

    this.OnClose = function(callback) {
        return callback();
    };

    var Constructor = (function() {

    })();
});
