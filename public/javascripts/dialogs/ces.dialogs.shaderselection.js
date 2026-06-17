var cesDialogsShaderSelection = (function(_config, $el, $wrapper, args) {

    var _selectionCallback = null;
    var _preferences = args[0];     //ref to _Preferences
    var _Media = args[1] || null;
    var _Logging = args[2] || null;
    var selection = null;

    var appearAnimation = 'flipInX';
    var _appearDuration = 1000;
    var _appearDelay = 200;     //between items

    var disappearAnimation = 'flipOutX';
    var disappearDuration = 1000;
    var disappearDelay = 200; //wait time between icons disappearing

    var selectedAnimation = 'tada';
    var selectedAnimationDuration = 1500;

    var dynamicPreviewDisplaySize = 300;

    // CDN size code "z" means no resize/original media file.
    // Request it first so shader previews are generated from the best available source,
    // then fall back through smaller CDN variants if the original is unavailable.
    var dynamicPreviewTitleSizes = ['z', 'a', 'c', 'b', 'd'];

    var dynamicPreviewMaxPasses = 8;

    // The image is displayed at 300x300, but dynamic previews may render larger so zoom
    // can reveal detail. The renderer keeps shader previews bounded by downscaling the
    // thumbnail source for high-scale presets before they create oversized pass targets.
    var dynamicPreviewMaxIntermediateScale = 4;
    var dynamicPreviewMaxIntermediateSize = Math.max(800, dynamicPreviewDisplaySize * dynamicPreviewMaxIntermediateScale);

    // Preview-only Smoothed shader preset. The visible shader option, saved
    // preference, and emulator launch path still use xbrz/4xbrz-linear.glslp.
    // The exaggeration value lives in the preset as SMOOTHED_PREVIEW_EXAGGERATION
    // with range 0.00-1.00 and default 0.55.
    var smoothedPreviewCellShadePreset = 'cel/smoothed-preview-cell-shade.glslp';
    var smoothedPreviewCellShadeParameter = 'SMOOTHED_PREVIEW_EXAGGERATION';

    // Previous preview-only Smoothed behavior retained as a first fallback before
    // leaving the static CDN fallback image in place.
    var smoothedPreviewPreviousPreset = 'xbrz/4xbrz-preview-cartoon-rounded-4x.glslp';

    // Preview-only preset overrides. These do not change the shader value saved or
    // launched by the emulator; they only help small shader-selection thumbnails
    // communicate the intent of a shader more clearly.
    var dynamicPreviewPresetOverrides = {
        'xbrz/4xbrz-linear.glslp': smoothedPreviewCellShadePreset
    };

    var dynamicPreviewFallbackPresetOverrides = {
        'xbrz/4xbrz-linear.glslp': smoothedPreviewPreviousPreset
    };

    var dynamicPreviewSession = 0;
    var dynamicPreviewDetachedSession = 0;
    var dynamicPreviewPresetCache = {};
    var dynamicPreviewTextCache = {};
    var dynamicPreviewImageAssetCache = {};

    this.OnOpen = function(args, selectionCallback) {

        _selectionCallback = selectionCallback || null;
        Open.apply(this, args);
    };

    var Open = function(systemOrGameKey, preselectedShader) {

        var gameKey = ResolveGameKey(systemOrGameKey);
        var system = gameKey ? gameKey.system : systemOrGameKey;
        var systemDetails = (_config.systemdetails && _config.systemdetails[system]) ? _config.systemdetails[system] : {};
        var curatedLooks = GetCuratedLooks(system);
        var previewSession = BeginDynamicPreviewSession();
        var i = 0;

        $el.find('span').text(systemDetails.shortname || system || ''); //fix text on shader screen
        $('#shaderselectlist').empty(); //clear all previous content
        selection = null;

        //bail early: check if shader already defined for this system (an override value passed in).
        // Empty string is a meaningful saved Pixel Perfect default, so test explicitly.
        if (typeof preselectedShader !== 'undefined' && preselectedShader !== null) {
            OnPreselectedShader(system, preselectedShader);
            return;
        }

        //get the recommended shaders list
        // var shaderfamilies = _config.shaders;

        //suggest all (for debugging), remove when the ability to test all shaders is present
        // for (i; i < shaderfamilies.length; ++i) {
        //     $('#shaderselectlist').append($('<div style="display:block;padding:0px 5px;" data-shader="' + shaderfamilies[i] + '">' + shaderfamilies[i] + '</div>').on('click', function(e) {
        //         OnShaderSelected(system, $(this).attr('data-shader'));
        //     }));
        // }

        for (i; i < curatedLooks.length; ++i) {

            $('#shaderselectlist').append(BuildShaderListItem(system, curatedLooks[i].title, curatedLooks[i].shader, GetShaderPreviewFallbackSrc(curatedLooks[i].shader, curatedLooks[i]), curatedLooks[i].glslp));
        }

        StartDynamicShaderPreviews(previewSession, system, gameKey);
    };

    var BuildShaderListItem = function(system, title, shader, fallbackSrc, glslp) {

        var $li = $('<li />')
            .addClass('transparent zoom')
            .attr('data-shader', shader || '');

        if (glslp) {
            $li.attr('data-glslp', glslp);
        }

        var $previewFrame = $('<div />')
            .addClass('shader-preview-frame')
            .appendTo($li);

        $('<img />')
            .attr('src', fallbackSrc)
            .attr('data-fallback-src', fallbackSrc)
            .attr('width', dynamicPreviewDisplaySize)
            .attr('height', dynamicPreviewDisplaySize)
            .attr('alt', title + ' preview')
            .appendTo($previewFrame);

        $('<h3 />').text(title).appendTo($li);

        $li.on('click', function(e) {
            OnShaderSelected(system, $(this).attr('data-shader'), $(this).attr('data-glslp'));
        });

        return $li;
    };

    var GetCuratedLooks = function(system) {

        if (window.cesVisualStyles && typeof window.cesVisualStyles.GetForSystem === 'function') {
            return window.cesVisualStyles.GetForSystem(_config, system);
        }

        var systemDetails = (_config.systemdetails && _config.systemdetails[system]) ? _config.systemdetails[system] : {};
        var recommended = systemDetails.recommendedshaders || [];
        var looks = [{
            title: 'Pixel Perfect',
            shader: '',
            glslp: null,
            isPixelPerfect: true
        }];
        var i;

        for (i = 0; i < recommended.length; ++i) {
            var shaderDefinition = NormalizeShaderDefinition(recommended[i]);

            if (shaderDefinition) {
                looks.push(shaderDefinition);
            }
        }

        return looks;
    };

    var NormalizeShaderDefinition = function(shaderDefinition) {

        if (!shaderDefinition) {
            return null;
        }

        if (typeof shaderDefinition === 'string') {
            return {
                title: shaderDefinition,
                shader: shaderDefinition,
                glslp: null
            };
        }

        return {
            title: shaderDefinition.title || shaderDefinition.shader || shaderDefinition.glslp || 'Shader',
            shader: shaderDefinition.shader || shaderDefinition.glslp || shaderDefinition.preset || shaderDefinition.path || shaderDefinition.rawglsl || shaderDefinition.rawGlsl || shaderDefinition.raw_glsl || '',
            glslp: shaderDefinition.glslp || shaderDefinition.preset || shaderDefinition.path || shaderDefinition.rawglsl || shaderDefinition.rawGlsl || shaderDefinition.raw_glsl || null
        };
    };

    var GetShaderPreviewFallbackSrc = function(shader, look) {

        if (window.cesVisualStyles && typeof window.cesVisualStyles.GetPreviewFallbackSrc === 'function') {
            return window.cesVisualStyles.GetPreviewFallbackSrc(_config, look || { shader: shader || '' });
        }

        var imageRoot = (_config.paths && _config.paths.images) ? _config.paths.images : '';

        if (!shader) {
            return imageRoot + '/shaders/pixels.png';
        }

        return imageRoot + '/shaders/' + shader + '.png';
    };

    var ResolveGameKey = function(systemOrGameKey) {

        if (systemOrGameKey && typeof systemOrGameKey === 'object' && systemOrGameKey.system) {
            return systemOrGameKey;
        }

        return null;
    };

    var ResolveSelectableShaderValueForSystem = function(system, shader, glslp) {

        if (window.cesVisualStyles && typeof window.cesVisualStyles.ResolveLaunchValueForSystem === 'function') {
            return window.cesVisualStyles.ResolveLaunchValueForSystem(_config, system, {
                shader: shader || '',
                glslp: glslp || null,
                isPixelPerfect: !shader && !glslp
            });
        }

        if (IsRawGlslShaderCapableSystem(system) && glslp) {
            return glslp;
        }

        return shader || '';
    };

    var IsRawGlslShaderCapableSystem = function(system) {

        var systemDetails = (_config.systemdetails && _config.systemdetails[system]) ? _config.systemdetails[system] : {};
        return systemDetails.emuextention === '1.22.2-stable';
    };

    var OnPreselectedShader = function(system, preselectedShader) {

        if (selection !== null) {
            return;
        }

        CancelDynamicShaderPreviews();
        selection = preselectedShader || '';

        if (_selectionCallback) {
            setTimeout(function() {
                _selectionCallback({
                    'shader': selection
                });
            }, 0);
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

    var OnShaderSelected = function(system, shader, glslp) {

        var launchShader;

        //$('#systemshaderseletorwrapper').addClass('close');

        //bail if selection was already made on this dialog
        if (selection !== null) {
            return;
        }

        CancelDynamicShaderPreviews();
        shader = (typeof shader === 'undefined' || shader === null) ? '' : String(shader);
        glslp = (typeof glslp === 'undefined' || glslp === null) ? null : String(glslp);
        launchShader = ResolveSelectableShaderValueForSystem(system, shader, glslp);
        selection = launchShader;

        var playerPreferencesToSave = {};
        var saveselection = false;

        OutroAnimations(shader, function() {

            //get result of checkbox
            if ($('#shaderselectcheckbox').is(':checked')) {
                saveselection = true;
                _preferences.Set('systems.' + system + '.shader', launchShader); //we set a flag in pref when update to go out over the next request
            }

            $('#systemshaderseletorwrapper').hide();

            if (_selectionCallback) {

                _selectionCallback({
                    'shader': launchShader
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
        CancelDynamicShaderPreviews();
        return callback();
    };

    var StartDynamicShaderPreviews = function(previewSession, system, gameKey, options) {

        options = options || {};

        if (!gameKey || !gameKey.gk) {
            LogDynamicPreview('Dynamic shader previews skipped: no game title key was available for ' + (system || '(unknown system)') + '.');
            return;
        }

        if (!_Media || typeof _Media.TitleScreenSource !== 'function') {
            LogDynamicPreview('Dynamic shader previews skipped: title screen source helper is unavailable.');
            return;
        }

        if (!window.HTMLCanvasElement) {
            LogDynamicPreview('Dynamic shader previews skipped: canvas is unavailable.');
            return;
        }

        LogDynamicPreview('Dynamic shader previews enabled for ' + (gameKey.title || gameKey.gk) + '. Requesting title screen image variants: ' + dynamicPreviewTitleSizes.join(', ') + '.');

        _Media.TitleScreenSource(gameKey, dynamicPreviewTitleSizes, function(success, status, titleScreenSrc, titleScreenContent, selectedTitleSize) {

            if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                return;
            }

            if (!success || !titleScreenSrc) {
                LogDynamicPreview('Dynamic shader previews using CDN fallbacks: no title screen image was available. Status=' + status + '.');
                return;
            }

            LogDynamicPreview('Title screen image found for dynamic shader previews' + (selectedTitleSize ? ' using CDN size ' + selectedTitleSize : '') + '.');

            LoadDynamicPreviewImage(titleScreenSrc, function(err, titleImage) {

                var sourceCanvas;

                if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                    return;
                }

                if (err) {
                    LogDynamicPreview('Dynamic shader previews using CDN fallbacks: title screen image could not be loaded. ' + err);
                    return;
                }

                LogDynamicPreview('Title screen image loaded for dynamic shader previews: ' + GetImageDimensions(titleImage) + (selectedTitleSize ? ' from CDN size ' + selectedTitleSize : '') + '.');

                try {
                    sourceCanvas = BuildDynamicPreviewSourceCanvas(titleImage);
                } catch (e) {
                    LogDynamicPreview('Dynamic shader previews using CDN fallbacks: title screen image could not be prepared for canvas/WebGL. ' + GetErrorMessage(e));
                    return;
                }

                RenderDynamicPreviewQueue(previewSession, sourceCanvas, options);
            });
        });
    };

    var RenderDynamicPreviewQueue = function(previewSession, sourceCanvas, options) {

        options = options || {};

        var listItems = $(options.itemSelector || '#shaderselectlist li').toArray();
        var previewRenderer = null;
        var attemptedWebGlRenderer = false;
        var index = 0;

        var getPreviewRenderer = function() {

            if (attemptedWebGlRenderer) {
                return previewRenderer;
            }

            attemptedWebGlRenderer = true;

            try {
                previewRenderer = new DynamicShaderPreviewRenderer(sourceCanvas.width, sourceCanvas.height);
                LogDynamicPreview('WebGL renderer is available for dynamic shader previews.');
            } catch (e) {
                previewRenderer = null;
                LogDynamicPreview('Shader previews using CDN fallbacks for GLSL shaders: WebGL is unavailable or failed to initialize. ' + GetErrorMessage(e));
            }

            return previewRenderer;
        };

        var renderNext = function() {

            if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                DestroyPreviewRenderer(previewRenderer);
                return;
            }

            if (index >= listItems.length) {
                DestroyPreviewRenderer(previewRenderer);
                return;
            }

            var li = listItems[index];
            index++;

            setTimeout(function() {
                RenderDynamicPreviewForListItem(previewSession, sourceCanvas, li, getPreviewRenderer, renderNext, options);
            }, 20);
        };

        renderNext();
    };

    var RenderDynamicPreviewForListItem = function(previewSession, sourceCanvas, li, getPreviewRenderer, complete, options) {

        var $li = $(li);
        var shader = $li.attr('data-shader') || '';
        var glslp = $li.attr('data-glslp') || '';
        var previewGlslp = glslp;
        var title = $li.find('h3').first().text() || shader || 'Pixel Perfect';
        var $img = $li.find('img').first();

        if (!IsDynamicPreviewSessionActive(previewSession, options)) {
            return complete();
        }

        if (!shader) {
            TrySetDynamicPreviewImage(previewSession, $li, $img, RenderPixelPerfectPreview(sourceCanvas), 'Pixel Perfect', options);
            return complete();
        }

        if (!glslp) {
            LogDynamicPreview('Dynamic preview fallback for ' + title + ': no raw GLSL preset is configured.');
            return complete();
        }

        if (!getPreviewRenderer()) {
            LogDynamicPreview('Dynamic preview fallback for ' + title + ': WebGL renderer is unavailable.');
            return complete();
        }

        previewGlslp = ResolveDynamicPreviewPresetPath(glslp);

        if (previewGlslp !== glslp) {
            LogDynamicPreview('Dynamic preview for ' + title + ' uses preview-only preset ' + previewGlslp + '; emulator selection remains ' + glslp + '.');
        }

        RenderDynamicPreviewPreset(previewSession, sourceCanvas, $li, $img, title, previewGlslp, getPreviewRenderer, function(err) {

            var fallbackGlslp;

            if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                return complete();
            }

            if (!err) {
                return complete();
            }

            fallbackGlslp = ResolveDynamicPreviewFallbackPresetPath(glslp, previewGlslp);

            if (fallbackGlslp) {

                if (IsSmoothedPreviewCellShadePreset(previewGlslp)) {
                    LogDynamicPreview('Custom Smoothed preview shader failed; falling back to existing Smoothed preview. ' + err);
                } else {
                    LogDynamicPreview('Dynamic preview fallback for ' + title + ': ' + err + '; attempting fallback preset ' + fallbackGlslp + '.');
                }

                return RenderDynamicPreviewPreset(previewSession, sourceCanvas, $li, $img, title, fallbackGlslp, getPreviewRenderer, function(fallbackErr) {

                    if (fallbackErr && IsDynamicPreviewSessionActive(previewSession, options)) {
                        LogDynamicPreview('Dynamic preview fallback for ' + title + ': ' + fallbackErr);
                    }

                    return complete();
                }, options);
            }

            LogDynamicPreview('Dynamic preview fallback for ' + title + ': ' + err);
            return complete();
        }, options);
    };

    var ResolveDynamicPreviewPresetPath = function(glslp) {

        var presetPath = NormalizePreviewShaderAssetPath(glslp);

        if (presetPath && dynamicPreviewPresetOverrides[presetPath]) {
            return dynamicPreviewPresetOverrides[presetPath];
        }

        return glslp;
    };

    var ResolveDynamicPreviewFallbackPresetPath = function(glslp, previewGlslp) {

        var presetPath = NormalizePreviewShaderAssetPath(glslp);
        var fallbackPath = presetPath ? dynamicPreviewFallbackPresetOverrides[presetPath] : null;

        if (!fallbackPath) {
            return null;
        }

        if (NormalizePreviewShaderAssetPath(fallbackPath) === NormalizePreviewShaderAssetPath(previewGlslp)) {
            return null;
        }

        return fallbackPath;
    };

    var RenderDynamicPreviewPreset = function(previewSession, sourceCanvas, $li, $img, title, previewGlslp, getPreviewRenderer, callback, options) {

        var isCustomSmoothedPreview = IsSmoothedPreviewCellShadePreset(previewGlslp);

        if (isCustomSmoothedPreview) {
            LogDynamicPreview('Using custom Smoothed preview shader: ' + NormalizePreviewShaderAssetPath(previewGlslp));
        }

        LogDynamicPreview('Attempting dynamic preview for ' + title + ' using ' + previewGlslp + '.');

        LoadDynamicPreviewPreset(previewGlslp, function(err, preset) {

            var dataUrl;

            if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                return callback(null);
            }

            if (err) {
                return callback(err);
            }

            if (isCustomSmoothedPreview) {
                LogDynamicPreview('Smoothed preview exaggeration: ' + GetPreviewPresetParameterValue(preset, smoothedPreviewCellShadeParameter, '(missing)'));
            }

            if (preset.previewNotes && preset.previewNotes.length) {
                LogDynamicPreview('Dynamic preview using thumbnail simplification for ' + title + ': ' + preset.previewNotes.join('; ') + '.');
            }

            try {
                dataUrl = getPreviewRenderer().Render(sourceCanvas, preset);
            } catch (e) {
                return callback(GetErrorMessage(e));
            }

            if (dataUrl && dataUrl.renderPlan && dataUrl.renderPlan.wasCapped) {
                LogDynamicPreview('Dynamic preview using bounded thumbnail render size for ' + title + ': requested output ' + dataUrl.renderPlan.requestedOutputWidth + 'x' + dataUrl.renderPlan.requestedOutputHeight + ', capped to ' + dataUrl.renderPlan.outputWidth + 'x' + dataUrl.renderPlan.outputHeight + ' by rendering thumbnail source at ' + dataUrl.renderPlan.sourceWidth + 'x' + dataUrl.renderPlan.sourceHeight + '.');
            }

            if (!TrySetDynamicPreviewImage(previewSession, $li, $img, dataUrl, title, options)) {
                return callback('renderer did not return an image');
            }

            if (isCustomSmoothedPreview) {
                LogDynamicPreview('Custom Smoothed preview shader applied.');
            }

            return callback(null);
        });
    };

    var IsSmoothedPreviewCellShadePreset = function(glslp) {

        return NormalizePreviewShaderAssetPath(glslp) === NormalizePreviewShaderAssetPath(smoothedPreviewCellShadePreset);
    };

    var GetPreviewPresetParameterValue = function(preset, parameterName, fallback) {

        if (preset && preset.parameters && Object.prototype.hasOwnProperty.call(preset.parameters, parameterName)) {
            return preset.parameters[parameterName];
        }

        return fallback;
    };

    var TrySetDynamicPreviewImage = function(previewSession, $li, $img, dataUrl, title, options) {

        var renderWidth = null;
        var renderHeight = null;

        if (dataUrl && typeof dataUrl === 'object') {
            renderWidth = dataUrl.width || null;
            renderHeight = dataUrl.height || null;
            dataUrl = dataUrl.dataUrl || dataUrl.src || null;
        }

        if (!IsDynamicPreviewSessionActive(previewSession, options)) {
            return false;
        }

        if (!dataUrl) {
            LogDynamicPreview('Dynamic preview fallback for ' + title + ': renderer did not return an image.');
            return false;
        }

        $img.attr('src', dataUrl);
        $img.attr('data-dynamic-preview', 'true');

        if (renderWidth && renderHeight) {
            $img.attr('data-dynamic-preview-internal-size', renderWidth + 'x' + renderHeight);
        }

        $li.attr('data-dynamic-preview', 'true');
        LogDynamicPreview('Dynamic preview applied for ' + title + (renderWidth && renderHeight ? ' at ' + renderWidth + 'x' + renderHeight + ' internal resolution.' : '.'));
        return true;
    };

    var RenderPixelPerfectPreview = function(sourceCanvas) {

        try {
            return sourceCanvas.toDataURL('image/png');
        } catch (e) {
            LogDynamicPreview('Dynamic preview fallback for Pixel Perfect: canvas export failed. ' + GetErrorMessage(e));
            return null;
        }
    };

    var RenderDynamicPreviewForImage = function(previewSession, options) {

        options = options || {};

        var $img = $(options.targetImage || options.targetSelector).first();
        var $target = options.target ? $(options.target).first() : $img.closest('li, .appearance-current-preview, .screenshot-card').first();
        var sourceSrc = options.sourceSrc || $img.attr('data-original-src') || $img.attr('src') || '';
        var shader = options.shader || '';
        var glslp = options.glslp || '';
        var title = options.title || 'Image preview';

        if (!$target.length) {
            $target = $img;
        }

        var finish = function(success, message) {
            if (options.onComplete) {
                options.onComplete(success === true, message || null);
            }
        };

        if (!$img.length || !sourceSrc) {
            finish(false, 'missing image target or source');
            return;
        }

        if (!IsDynamicPreviewSessionActive(previewSession, options)) {
            finish(false, 'cancelled');
            return;
        }

        if (!shader && !glslp) {
            TrySetDynamicPreviewImage(previewSession, $target, $img, sourceSrc, title, options);
            finish(true);
            return;
        }

        LoadDynamicPreviewImage(sourceSrc, function(err, sourceImage) {

            var sourceCanvas;
            var previewRenderer = null;
            var attemptedWebGlRenderer = false;
            var previewGlslp = glslp;

            var getPreviewRenderer = function() {

                if (attemptedWebGlRenderer) {
                    return previewRenderer;
                }

                attemptedWebGlRenderer = true;

                try {
                    previewRenderer = new DynamicShaderPreviewRenderer(sourceCanvas.width, sourceCanvas.height);
                    LogDynamicPreview('WebGL renderer is available for ' + title + '.');
                } catch (e) {
                    previewRenderer = null;
                    LogDynamicPreview('Shader preview image fallback for ' + title + ': WebGL is unavailable or failed to initialize. ' + GetErrorMessage(e));
                }

                return previewRenderer;
            };

            var complete = function(success, message) {
                DestroyPreviewRenderer(previewRenderer);
                finish(success, message);
            };

            if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                complete(false, 'cancelled');
                return;
            }

            if (err) {
                complete(false, err);
                return;
            }

            try {
                sourceCanvas = BuildDynamicPreviewSourceCanvas(sourceImage, {
                    preserveImageAspect: options.preserveImageAspect === true
                });
            } catch (e) {
                complete(false, GetErrorMessage(e));
                return;
            }

            if (!glslp) {
                complete(false, 'no raw GLSL preset is configured');
                return;
            }

            if (!getPreviewRenderer()) {
                complete(false, 'WebGL renderer is unavailable');
                return;
            }

            previewGlslp = ResolveDynamicPreviewPresetPath(glslp);

            RenderDynamicPreviewPreset(previewSession, sourceCanvas, $target, $img, title, previewGlslp, getPreviewRenderer, function(renderErr) {

                var fallbackGlslp;

                if (!IsDynamicPreviewSessionActive(previewSession, options)) {
                    complete(false, 'cancelled');
                    return;
                }

                if (!renderErr) {
                    complete(true);
                    return;
                }

                fallbackGlslp = ResolveDynamicPreviewFallbackPresetPath(glslp, previewGlslp);

                if (fallbackGlslp) {
                    RenderDynamicPreviewPreset(previewSession, sourceCanvas, $target, $img, title, fallbackGlslp, getPreviewRenderer, function(fallbackErr) {
                        if (fallbackErr) {
                            complete(false, fallbackErr);
                            return;
                        }

                        complete(true);
                    }, options);
                    return;
                }

                complete(false, renderErr);
            }, options);
        });
    };

    var LoadDynamicPreviewImage = function(src, callback) {

        var img = new Image();
        var finished = false;

        var complete = function(err) {

            if (finished) {
                return;
            }

            finished = true;

            if (err) {
                return callback(err);
            }

            return callback(null, img);
        };

        img.onload = function() {
            complete();
        };

        img.onerror = function() {
            complete('image load error');
        };

        try {
            if (src && !String(src).match(/^data:/i)) {
                img.crossOrigin = 'anonymous';
            }

            img.src = src;

            if (img.complete && (img.naturalWidth || img.width)) {
                setTimeout(function() {
                    complete();
                }, 0);
            }
        } catch (e) {
            complete(GetErrorMessage(e));
        }
    };

    var BuildDynamicPreviewSourceCanvas = function(titleImage, options) {

        options = options || {};

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var sourceWidth = titleImage.naturalWidth || titleImage.width;
        var sourceHeight = titleImage.naturalHeight || titleImage.height;
        var targetSize;
        var scale;
        var drawWidth;
        var drawHeight;
        var drawX;
        var drawY;

        if (!context) {
            throw new Error('2D canvas context unavailable');
        }

        if (!sourceWidth || !sourceHeight) {
            throw new Error('title screen image had no measurable size');
        }

        if (options.preserveImageAspect) {
            targetSize = Math.min(dynamicPreviewMaxIntermediateSize, Math.max(sourceWidth, sourceHeight));
            scale = Math.min(1, targetSize / Math.max(sourceWidth, sourceHeight));
            drawWidth = Math.max(1, Math.round(sourceWidth * scale));
            drawHeight = Math.max(1, Math.round(sourceHeight * scale));

            canvas.width = drawWidth;
            canvas.height = drawHeight;

            context.fillStyle = '#000';
            context.fillRect(0, 0, canvas.width, canvas.height);
            SetImageSmoothing(context, scale < 1);
            context.drawImage(titleImage, 0, 0, drawWidth, drawHeight);
            context.getImageData(0, 0, 1, 1);

            return canvas;
        }

        // Preserve as much source detail as practical for zoomable shader previews.
        // The list still displays at dynamicPreviewDisplaySize, but the rendered dataUrl
        // can be larger. If the original CDN image is larger than our safety cap, scale
        // it down only as much as needed to fit inside the bounded render surface.
        targetSize = Math.max(dynamicPreviewDisplaySize, Math.min(dynamicPreviewMaxIntermediateSize, Math.max(sourceWidth, sourceHeight)));

        canvas.width = targetSize;
        canvas.height = targetSize;

        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        scale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
        SetImageSmoothing(context, ShouldSmoothDynamicPreviewSourceScale(scale));
        drawWidth = Math.max(1, Math.round(sourceWidth * scale));
        drawHeight = Math.max(1, Math.round(sourceHeight * scale));
        drawX = Math.floor((canvas.width - drawWidth) / 2);
        drawY = Math.floor((canvas.height - drawHeight) / 2);

        context.drawImage(titleImage, drawX, drawY, drawWidth, drawHeight);

        // Probe the canvas before WebGL uses it so CORS/tainting failures fall back cleanly.
        context.getImageData(0, 0, 1, 1);

        return canvas;
    };

    var ShouldSmoothDynamicPreviewSourceScale = function(scale) {

        var roundedScale = Math.round(scale);

        if (!scale || !isFinite(scale)) {
            return true;
        }

        return scale < 1 || Math.abs(scale - roundedScale) > 0.001;
    };

    var SetImageSmoothing = function(context, enabled) {

        context.imageSmoothingEnabled = enabled;
        context.mozImageSmoothingEnabled = enabled;
        context.webkitImageSmoothingEnabled = enabled;
        context.msImageSmoothingEnabled = enabled;

        if ('imageSmoothingQuality' in context) {
            context.imageSmoothingQuality = enabled ? 'high' : 'low';
        }
    };

    var GetImageDimensions = function(image) {

        var width = image ? (image.naturalWidth || image.width || 0) : 0;
        var height = image ? (image.naturalHeight || image.height || 0) : 0;

        if (!width || !height) {
            return 'unknown size';
        }

        return width + 'x' + height;
    };

    var LoadDynamicPreviewPreset = function(glslp, callback) {

        var presetPath = NormalizePreviewShaderAssetPath(glslp);

        if (!presetPath || !String(presetPath).match(/\.glslp$/i)) {
            return callback('invalid or unsafe GLSL preset path: ' + glslp);
        }

        if (dynamicPreviewPresetCache[presetPath]) {
            return callback(null, dynamicPreviewPresetCache[presetPath]);
        }

        LoadDynamicPreviewTextAsset(presetPath, function(err, presetText) {

            var preset;

            if (err) {
                return callback(err);
            }

            try {
                preset = ParseDynamicPreviewPreset(presetPath, presetText);
            } catch (e) {
                return callback(GetErrorMessage(e));
            }

            LoadDynamicPreviewPresetPassSources(preset, function(shaderErr) {

                if (shaderErr) {
                    return callback(shaderErr);
                }

                LoadDynamicPreviewTextureAssets(preset, function(textureErr) {

                    if (textureErr) {
                        return callback(textureErr);
                    }

                    dynamicPreviewPresetCache[presetPath] = preset;
                    return callback(null, preset);
                });
            });
        });
    };

    var LoadDynamicPreviewTextureAssets = function(preset, callback) {

        var resources = GetRequiredPreviewTextureResources(preset);
        var index = 0;

        var loadNext = function() {

            var resource;

            if (index >= resources.length) {
                return callback(null);
            }

            resource = resources[index];
            index++;

            LoadDynamicPreviewImageAsset(resource.path, function(err, image) {

                if (err) {
                    LogDynamicPreview('Dynamic preview will use a placeholder for texture ' + resource.alias + ': ' + err);
                    resource.image = null;
                    return loadNext();
                }

                resource.image = image;
                return loadNext();
            });
        };

        return loadNext();
    };

    var GetRequiredPreviewTextureResources = function(preset) {

        var resources = preset.textureResources || [];
        var byAlias = {};
        var required = {};
        var requiredResources = [];
        var i;
        var j;

        for (i = 0; i < resources.length; i++) {
            byAlias[resources[i].alias] = resources[i];
        }

        for (i = 0; i < preset.passes.length; i++) {
            var pass = preset.passes[i];

            if (pass.skipForPreview) {
                continue;
            }

            for (j = 0; j < pass.samplerUniforms.length; j++) {
                var samplerName = pass.samplerUniforms[j];
                var aliasName = samplerName.replace(/Texture$/, '');

                if (byAlias[samplerName]) {
                    required[samplerName] = true;
                }

                if (byAlias[aliasName]) {
                    required[aliasName] = true;
                }
            }
        }

        for (i = 0; i < resources.length; i++) {
            if (required[resources[i].alias]) {
                requiredResources.push(resources[i]);
            }
        }

        return requiredResources;
    };

    var LoadDynamicPreviewPresetPassSources = function(preset, callback) {

        var index = 0;

        var loadNext = function() {

            var pass;

            if (index >= preset.passes.length) {
                return callback(null);
            }

            pass = preset.passes[index];
            index++;

            LoadDynamicPreviewTextAsset(pass.shaderPath, function(shaderErr, shaderSource) {

                if (shaderErr) {
                    return callback(shaderErr);
                }

                pass.shaderSource = shaderSource;
                pass.samplerUniforms = GetSamplerUniformNames(shaderSource);
                pass.parameterValues = BuildPreviewPassParameterValues(shaderSource, preset.parameters);
                return loadNext();
            });
        };

        return loadNext();
    };

    var ParseDynamicPreviewPreset = function(presetPath, presetText) {

        var assignments = ParsePreviewPresetAssignments(presetText);
        var presetDirectory = GetPreviewPathDirectoryName(presetPath);
        var shaderCount = parseInt(assignments.shaders, 10);
        var textureAliases = SplitPreviewPresetList(assignments.textures);
        var passes = [];
        var skippedPassCount = 0;
        var parameters;
        var previewNotes = [];
        var i;

        if (!shaderCount || shaderCount < 1) {
            throw new Error('preset does not define a valid shader pass count; shaders=' + (assignments.shaders || '(missing)'));
        }

        if (shaderCount > dynamicPreviewMaxPasses) {
            throw new Error('preset has ' + shaderCount + ' passes; preview renderer supports up to ' + dynamicPreviewMaxPasses + ' simple passes');
        }

        for (i = 0; i < shaderCount; i++) {
            var pass = ParseDynamicPreviewPass(presetDirectory, assignments, i, textureAliases);

            if (pass.skipForPreview) {
                skippedPassCount++;
            }

            passes.push(pass);
        }

        parameters = ParsePreviewPresetParameters(assignments);

        if (skippedPassCount > 0) {
            previewNotes.push('border artwork pass skipped for thumbnail preview');

            if (parameters.video_scale !== undefined) {
                ApplyPreviewBorderVideoScale(passes, parameters.video_scale);
                previewNotes.push('border-only viewport scaling normalized for thumbnail preview');
            }
        }

        return {
            presetPath: presetPath,
            passes: passes,
            parameters: parameters,
            textureAliases: textureAliases,
            textureResources: ParsePreviewTextureResources(presetDirectory, assignments, textureAliases),
            previewOutputScale: ResolvePreviewPresetOutputScale(passes),
            forceFinalBlit: skippedPassCount > 0,
            previewNotes: previewNotes
        };
    };

    var ResolvePreviewPresetOutputScale = function(passes) {

        var scaleX = 1;
        var scaleY = 1;
        var maxScale = 1;
        var i;

        for (i = 0; i < passes.length; i++) {

            var pass = passes[i];

            if (pass.skipForPreview) {
                continue;
            }

            scaleX = ResolvePreviewOutputAxisScale(scaleX, pass.outputScale.x);
            scaleY = ResolvePreviewOutputAxisScale(scaleY, pass.outputScale.y);
            maxScale = Math.max(maxScale, scaleX, scaleY);
        }

        if (!maxScale || !isFinite(maxScale) || maxScale < 1) {
            return 1;
        }

        return Math.min(maxScale, dynamicPreviewMaxIntermediateScale);
    };

    var ResolvePreviewOutputAxisScale = function(currentScale, axisScale) {

        var type = axisScale.type;
        var scale = axisScale.scale;

        if (!type && (scale === null || scale === undefined)) {
            type = 'source';
            scale = 1;
        }

        if (!type) {
            type = 'source';
        }

        if (scale === null || scale === undefined) {
            scale = 1;
        }

        if (type === 'source') {
            return currentScale * scale;
        }

        if (type === 'viewport' || type === 'original') {
            return scale;
        }

        if (type === 'absolute' || type === 'abs') {
            return currentScale;
        }

        return currentScale;
    };

    var ApplyPreviewBorderVideoScale = function(passes, videoScale) {

        var i;

        for (i = 0; i < passes.length; i++) {
            if (passes[i].outputScale.x.type === 'viewport') {
                passes[i].outputScale.x.type = 'source';
                passes[i].outputScale.x.scale = videoScale;
            }

            if (passes[i].outputScale.y.type === 'viewport') {
                passes[i].outputScale.y.type = 'source';
                passes[i].outputScale.y.scale = videoScale;
            }
        }
    };

    var ParseDynamicPreviewPass = function(presetDirectory, assignments, index, textureAliases) {

        var shaderKey = 'shader' + index;
        var shaderPath;

        if (!assignments[shaderKey]) {
            throw new Error('preset does not define ' + shaderKey);
        }

        shaderPath = ResolvePreviewShaderDependencyPath(presetDirectory, assignments[shaderKey]);

        if (!shaderPath || !String(shaderPath).match(/\.glsl$/i)) {
            throw new Error(shaderKey + ' is not a safe .glsl asset path: ' + assignments[shaderKey]);
        }

        return {
            index: index,
            shaderPath: shaderPath,
            shaderSource: null,
            samplerUniforms: [],
            parameterValues: {},
            alias: TrimPreviewPresetValue(assignments['alias' + index] || ''),
            skipForPreview: IsPreviewBorderCompositionPass(shaderPath, textureAliases),
            filterLinear: ParsePreviewBoolean(assignments['filter_linear' + index]),
            outputScale: ParsePreviewPassOutputScale(assignments, index)
        };
    };

    var ParsePreviewPassOutputScale = function(assignments, index) {

        var scale = ParsePreviewFloat(assignments['scale' + index], null);
        var scaleX = ParsePreviewFloat(assignments['scale_x' + index], scale);
        var scaleY = ParsePreviewFloat(assignments['scale_y' + index], scale);
        var scaleType = NormalizePreviewScaleType(assignments['scale_type' + index]);
        var scaleTypeX = NormalizePreviewScaleType(assignments['scale_type_x' + index]) || scaleType;
        var scaleTypeY = NormalizePreviewScaleType(assignments['scale_type_y' + index]) || scaleType;

        return {
            x: {
                type: scaleTypeX,
                scale: scaleX
            },
            y: {
                type: scaleTypeY,
                scale: scaleY
            }
        };
    };

    var ParsePreviewBoolean = function(value) {

        return String(value || '').toLowerCase() === 'true';
    };

    var ParsePreviewFloat = function(value, fallback) {

        var parsed;

        if (value === undefined || value === null || value === '') {
            return fallback;
        }

        parsed = parseFloat(value);

        if (isNaN(parsed)) {
            return fallback;
        }

        return parsed;
    };

    var NormalizePreviewScaleType = function(value) {

        value = $.trim(String(value || '')).toLowerCase();

        if (!value) {
            return null;
        }

        return value;
    };

    var ParsePreviewPresetAssignments = function(presetText) {

        var lines = String(presetText || '').split(/\r?\n/);
        var assignments = {};
        var i;

        for (i = 0; i < lines.length; i++) {
            var assignment = ParsePreviewPresetAssignment(lines[i]);

            if (assignment) {
                assignments[assignment.key] = assignment.value;
            }
        }

        return assignments;
    };

    var ParsePreviewPresetAssignment = function(line) {

        var match;

        line = StripPreviewPresetComment(line);
        match = String(line || '').match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);

        if (!match) {
            return null;
        }

        return {
            key: $.trim(match[1]),
            value: TrimPreviewPresetValue(match[2])
        };
    };

    var StripPreviewPresetComment = function(line) {

        var text = String(line || '');
        var quote = null;
        var i;

        for (i = 0; i < text.length; i++) {
            var character = text.charAt(i);

            if ((character === '"' || character === "'") && (i === 0 || text.charAt(i - 1) !== '\\')) {
                quote = quote === character ? null : (quote || character);
            }

            if (!quote && character === '#') {
                return text.substr(0, i);
            }
        }

        return text;
    };

    var TrimPreviewPresetValue = function(value) {

        value = $.trim(String(value || ''));
        value = value.replace(/^["']+/, '').replace(/["']+$/, '');
        return $.trim(value);
    };

    var SplitPreviewPresetList = function(value) {

        var aliases = [];
        var parts = String(value || '').split(';');
        var i;

        for (i = 0; i < parts.length; i++) {
            var alias = TrimPreviewPresetValue(parts[i]);

            if (alias) {
                aliases.push(alias);
            }
        }

        return aliases;
    };

    var ParsePreviewPresetParameters = function(assignments) {

        var parameterNames = SplitPreviewPresetList(assignments.parameters);
        var parameters = {};
        var i;

        for (i = 0; i < parameterNames.length; i++) {
            var name = parameterNames[i];
            var value = ParsePreviewFloat(assignments[name], null);

            if (value !== null && value !== undefined) {
                parameters[name] = value;
            }
        }

        return parameters;
    };

    var ParsePreviewTextureResources = function(presetDirectory, assignments, textureAliases) {

        var resources = [];
        var i;

        for (i = 0; i < textureAliases.length; i++) {
            var alias = textureAliases[i];
            var path = assignments[alias] ? ResolvePreviewShaderDependencyPath(presetDirectory, assignments[alias]) : null;

            if (!path) {
                LogDynamicPreview('Dynamic preview texture alias has no usable local path and will use a placeholder: ' + alias);
                resources.push({
                    alias: alias,
                    path: null,
                    image: null,
                    filterLinear: ParsePreviewBoolean(assignments[alias + '_linear'])
                });
                continue;
            }

            resources.push({
                alias: alias,
                path: path,
                image: null,
                filterLinear: ParsePreviewBoolean(assignments[alias + '_linear'])
            });
        }

        return resources;
    };

    var IsPreviewBorderCompositionPass = function(shaderPath, textureAliases) {

        if (!shaderPath || !String(shaderPath).match(/(^|\/)handheld\/console-border\/shader-files\/gb-pass-5\.glsl$/i)) {
            return false;
        }

        return $.inArray('BORDER', textureAliases || []) !== -1;
    };

    var GetSamplerUniformNames = function(shaderSource) {

        var samplerRegex = /uniform\s+(?:lowp\s+|mediump\s+|highp\s+)?sampler2D\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/g;
        var names = [];
        var seen = {};
        var match;

        while ((match = samplerRegex.exec(shaderSource)) !== null) {
            if (!seen[match[1]]) {
                seen[match[1]] = true;
                names.push(match[1]);
            }
        }

        return names;
    };

    var BuildPreviewPassParameterValues = function(shaderSource, presetParameters) {

        var parameterDefaults = ParsePreviewShaderParameterDefaults(shaderSource);
        var values = {};
        var name;

        for (name in parameterDefaults) {
            if (Object.prototype.hasOwnProperty.call(parameterDefaults, name)) {
                values[name] = parameterDefaults[name];
            }
        }

        for (name in presetParameters) {
            if (Object.prototype.hasOwnProperty.call(presetParameters, name)) {
                values[name] = presetParameters[name];
            }
        }

        return values;
    };

    var ParsePreviewShaderParameterDefaults = function(shaderSource) {

        var defaults = {};
        var regex = /^\s*#pragma\s+parameter\s+([A-Za-z_][A-Za-z0-9_]*)\s+"(?:[^"\\]|\\.)*"\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)/gm;
        var match;

        while ((match = regex.exec(shaderSource || '')) !== null) {
            defaults[match[1]] = parseFloat(match[2]);
        }

        return defaults;
    };

    var LoadDynamicPreviewTextAsset = function(relativePath, callback) {

        var path = NormalizePreviewShaderAssetPath(relativePath);
        var url;

        if (!path) {
            return callback('invalid shader asset path: ' + relativePath);
        }

        if (dynamicPreviewTextCache[path]) {
            return callback(null, dynamicPreviewTextCache[path]);
        }

        url = BuildPreviewShaderAssetUrl(path);

        $.ajax({
            url: url,
            type: 'GET',
            crossDomain: true,
            dataType: 'text',
            cache: true,
            success: function(response) {
                dynamicPreviewTextCache[path] = response;
                return callback(null, response);
            },
            error: function(jqXHR, status, error) {
                return callback('missing shader asset: ' + path + ', status=' + (jqXHR ? jqXHR.status : '(unknown)') + ', error=' + (error || status || '(unknown)'));
            }
        });
    };

    var LoadDynamicPreviewImageAsset = function(relativePath, callback) {

        var path = NormalizePreviewShaderAssetPath(relativePath);
        var url;
        var img;

        if (!path) {
            return callback('invalid shader image asset path: ' + relativePath);
        }

        if (dynamicPreviewImageAssetCache[path]) {
            return callback(null, dynamicPreviewImageAssetCache[path]);
        }

        url = BuildPreviewShaderAssetUrl(path);
        img = new Image();

        img.onload = function() {
            dynamicPreviewImageAssetCache[path] = img;
            return callback(null, img);
        };

        img.onerror = function() {
            return callback('missing shader image asset: ' + path);
        };

        try {
            if (url && !String(url).match(/^data:/i)) {
                img.crossOrigin = 'anonymous';
            }

            img.src = url;
        } catch (e) {
            return callback(GetErrorMessage(e));
        }
    };

    var BuildPreviewShaderAssetUrl = function(relativePath) {

        var root = (_config.paths && _config.paths.shaders_glsl) ? _config.paths.shaders_glsl : '/shaders_glsl';

        return String(root).replace(/\/$/, '') + '/' + EncodePreviewPathSegments(relativePath);
    };

    var ResolvePreviewShaderDependencyPath = function(presetDirectory, dependencyPath) {

        dependencyPath = TrimPreviewPresetValue(dependencyPath).replace(/\\/g, '/');

        if (!dependencyPath || dependencyPath.match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return null;
        }

        if (dependencyPath.indexOf(':/') === 0) {
            return NormalizePreviewShaderRootPath(dependencyPath.substr(2));
        }

        if (dependencyPath.charAt(0) === '/') {
            return NormalizePreviewShaderRootPath(dependencyPath);
        }

        return NormalizePreviewRelativePath(presetDirectory, dependencyPath);
    };

    var NormalizePreviewShaderAssetPath = function(path) {

        path = TrimPreviewPresetValue(path).replace(/\\/g, '/');

        path = path.replace(/[?#].*$/, '');
        path = path.replace(/^\.\//, '');
        path = path.replace(/^public\/shaders_glsl\//i, '');
        path = path.replace(/^.*\/public\/shaders_glsl\//i, '');
        path = path.replace(/^\/?shaders_glsl\//i, '');
        path = path.replace(/^\/shaders\/shaders_glsl\//i, '');
        path = path.replace(/^shaders\/shaders_glsl\//i, '');
        path = path.replace(/^:\/shaders\/shaders_glsl\//i, '');
        path = path.replace(/^:\/shaders_glsl\//i, '');

        while (path.charAt(0) === '/') {
            path = path.substr(1);
        }

        return NormalizePreviewRelativePath('', path);
    };

    var NormalizePreviewShaderRootPath = function(path) {

        path = TrimPreviewPresetValue(path).replace(/\\/g, '/');

        while (path.charAt(0) === '/') {
            path = path.substr(1);
        }

        if (path.match(/^shaders\/shaders_glsl\//i)) {
            return NormalizePreviewRelativePath('', path.replace(/^shaders\/shaders_glsl\//i, ''));
        }

        if (path.match(/^shaders_glsl\//i)) {
            return NormalizePreviewRelativePath('', path.replace(/^shaders_glsl\//i, ''));
        }

        return null;
    };

    var NormalizePreviewRelativePath = function(baseDirectory, relativePath) {

        var combined = (baseDirectory ? baseDirectory + '/' : '') + String(relativePath || '');
        var parts = combined.replace(/\\/g, '/').split('/');
        var normalized = [];
        var i;

        for (i = 0; i < parts.length; i++) {
            var part = parts[i];

            if (!part || part === '.') {
                continue;
            }

            if (part === '..') {
                if (!normalized.length) {
                    return null;
                }

                normalized.pop();
                continue;
            }

            normalized.push(part);
        }

        return normalized.join('/');
    };

    var GetPreviewPathDirectoryName = function(path) {

        path = String(path || '').replace(/\\/g, '/');

        if (path.indexOf('/') === -1) {
            return '';
        }

        return path.substr(0, path.lastIndexOf('/'));
    };

    var EncodePreviewPathSegments = function(path) {

        var parts = String(path || '').replace(/\\/g, '/').split('/');
        var encoded = [];
        var i;

        for (i = 0; i < parts.length; i++) {
            encoded.push(encodeURIComponent(parts[i]));
        }

        return encoded.join('/');
    };

    var BeginDynamicPreviewSession = function() {

        dynamicPreviewSession++;
        return dynamicPreviewSession;
    };

    var CancelDynamicShaderPreviews = function() {

        dynamicPreviewSession++;
    };

    var IsDynamicPreviewSessionActive = function(previewSession, options) {

        options = options || {};

        if (options.detachedSession) {
            return !options.cancelToken || options.cancelToken.active !== false;
        }

        if (previewSession !== dynamicPreviewSession) {
            return false;
        }

        if (options.ignoreDialogSelection) {
            return true;
        }

        return selection === null;
    };

    var DestroyPreviewRenderer = function(previewRenderer) {

        if (previewRenderer && typeof previewRenderer.Destroy === 'function') {
            previewRenderer.Destroy();
        }
    };

    var LogDynamicPreview = function(message) {

        if (_Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('ces.dialogs.shaderselection', message);
            return;
        }

        if (window.console && window.console.log) {
            window.console.log('ces.dialogs.shaderselection: ' + message);
        }
    };

    var GetErrorMessage = function(error) {

        if (!error) {
            return '(unknown error)';
        }

        if (error.message) {
            return error.message;
        }

        return String(error);
    };

    var DynamicShaderPreviewRenderer = function(width, height) {

        var canvas = document.createElement('canvas');
        var gl = null;
        var positionBuffer = null;
        var texCoordBuffer = null;
        var programCache = {};
        var blitProgram = null;
        var destroyed = false;
        var maxTextureSize = 0;
        var maxRenderbufferSize = 0;
        var maxTextureImageUnits = 8;
        var identityMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        canvas.width = width;
        canvas.height = height;

        gl = canvas.getContext('webgl', {
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
            alpha: false
        }) || canvas.getContext('experimental-webgl', {
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
            alpha: false
        });

        if (!gl) {
            throw new Error('WebGL context unavailable');
        }

        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || dynamicPreviewMaxIntermediateSize;
        maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || maxTextureSize;
        maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || maxTextureImageUnits;

        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 0, 1,
            1, -1, 0, 1,
            -1, 1, 0, 1,
            -1, 1, 0, 1,
            1, -1, 0, 1,
            1, 1, 0, 1
        ]), gl.STATIC_DRAW);

        texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 0, 1,
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,
            1, 0, 0, 1,
            1, 1, 0, 1
        ]), gl.STATIC_DRAW);

        this.Render = function(sourceCanvas, preset) {

            var sourceTexture = null;
            var externalTextures = [];
            var renderTargets = [];
            var renderSourceCanvas = sourceCanvas;
            var renderPlan;
            var inputTexture = null;
            var inputWidth;
            var inputHeight;
            var passTexturesByIndex = {};
            var passTexturesByAlias = {};
            var renderablePasses = GetRenderablePreviewPasses(preset);
            var outputSize;
            var renderTarget;
            var renderToCanvas;
            var textureContext;
            var dataUrl;
            var i;

            if (!preset || !preset.passes || !preset.passes.length || !renderablePasses.length) {
                throw new Error('preset has no renderable shader passes');
            }

            try {
                renderPlan = BuildPreviewRenderPlan(sourceCanvas, preset);
                renderSourceCanvas = PreparePreviewRenderSourceCanvas(sourceCanvas, renderPlan);
                ResizeOutputCanvasForPreset(renderPlan);
                sourceTexture = CreateCanvasTexture(renderSourceCanvas);
                inputTexture = sourceTexture;
                inputWidth = renderSourceCanvas.width;
                inputHeight = renderSourceCanvas.height;
                externalTextures = CreateExternalTextureMap(GetRequiredPreviewTextureResources(preset));

                for (i = 0; i < renderablePasses.length; i++) {
                    renderToCanvas = i === renderablePasses.length - 1 && !preset.forceFinalBlit;
                    outputSize = ResolvePassOutputSize(renderablePasses[i], inputWidth, inputHeight, renderSourceCanvas.width, renderSourceCanvas.height, renderToCanvas);
                    renderTarget = null;

                    if (!renderToCanvas) {
                        renderTarget = CreateRenderTarget(outputSize.width, outputSize.height);
                        renderTargets.push(renderTarget);
                    }

                    textureContext = {
                        inputTexture: inputTexture,
                        sourceTexture: sourceTexture,
                        externalTextures: externalTextures,
                        passTexturesByIndex: passTexturesByIndex,
                        passTexturesByAlias: passTexturesByAlias
                    };

                    RenderPass(renderablePasses[i], textureContext, inputWidth, inputHeight, outputSize.width, outputSize.height, renderSourceCanvas.width, renderSourceCanvas.height, renderTarget ? renderTarget.framebuffer : null);

                    if (renderTarget) {
                        StoreRenderedPassTexture(renderablePasses[i], renderTarget, passTexturesByIndex, passTexturesByAlias);
                        inputTexture = renderTarget.texture;
                        inputWidth = outputSize.width;
                        inputHeight = outputSize.height;
                    }
                }

                if (preset.forceFinalBlit) {
                    RenderBlit(inputTexture, inputWidth, inputHeight, width, height, true);
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                dataUrl = canvas.toDataURL('image/png');
                return {
                    dataUrl: dataUrl,
                    width: canvas.width,
                    height: canvas.height,
                    renderPlan: renderPlan
                };
            } finally {
                if (sourceTexture) {
                    gl.deleteTexture(sourceTexture);
                }

                for (i = 0; i < renderTargets.length; i++) {
                    DestroyRenderTarget(renderTargets[i]);
                }

                DestroyExternalTextureMap(externalTextures);

                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        };

        this.Destroy = function() {

            var key;

            if (destroyed) {
                return;
            }

            destroyed = true;

            for (key in programCache) {
                if (Object.prototype.hasOwnProperty.call(programCache, key)) {
                    gl.deleteProgram(programCache[key]);
                }
            }
            programCache = {};

            if (blitProgram) {
                gl.deleteProgram(blitProgram);
                blitProgram = null;
            }

            if (positionBuffer) {
                gl.deleteBuffer(positionBuffer);
                positionBuffer = null;
            }

            if (texCoordBuffer) {
                gl.deleteBuffer(texCoordBuffer);
                texCoordBuffer = null;
            }
        };

        var BuildPreviewRenderPlan = function(sourceCanvas, preset) {

            var scale = preset && preset.previewOutputScale ? preset.previewOutputScale : 1;
            var maxOutputSize = Math.max(1, Math.min(dynamicPreviewMaxIntermediateSize, maxTextureSize, maxRenderbufferSize));
            var requestedOutputWidth;
            var requestedOutputHeight;
            var maxSourceWidth;
            var maxSourceHeight;
            var sourceWidth;
            var sourceHeight;
            var outputWidth;
            var outputHeight;

            if (!scale || !isFinite(scale) || scale < 1) {
                scale = 1;
            }

            requestedOutputWidth = Math.max(sourceCanvas.width, Math.round(sourceCanvas.width * scale));
            requestedOutputHeight = Math.max(sourceCanvas.height, Math.round(sourceCanvas.height * scale));
            maxSourceWidth = Math.max(1, Math.floor(maxOutputSize / scale));
            maxSourceHeight = Math.max(1, Math.floor(maxOutputSize / scale));
            sourceWidth = Math.min(sourceCanvas.width, maxSourceWidth);
            sourceHeight = Math.min(sourceCanvas.height, maxSourceHeight);
            outputWidth = Math.max(sourceWidth, Math.round(sourceWidth * scale));
            outputHeight = Math.max(sourceHeight, Math.round(sourceHeight * scale));

            return {
                sourceWidth: sourceWidth,
                sourceHeight: sourceHeight,
                outputWidth: outputWidth,
                outputHeight: outputHeight,
                requestedOutputWidth: requestedOutputWidth,
                requestedOutputHeight: requestedOutputHeight,
                maxOutputSize: maxOutputSize,
                scale: scale,
                wasCapped: sourceWidth !== sourceCanvas.width || sourceHeight !== sourceCanvas.height || outputWidth !== requestedOutputWidth || outputHeight !== requestedOutputHeight
            };
        };

        var PreparePreviewRenderSourceCanvas = function(sourceCanvas, renderPlan) {

            var scaledCanvas;
            var context;
            var scale;

            if (!renderPlan || !renderPlan.wasCapped) {
                return sourceCanvas;
            }

            scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = renderPlan.sourceWidth;
            scaledCanvas.height = renderPlan.sourceHeight;
            context = scaledCanvas.getContext('2d');

            if (!context) {
                throw new Error('2D canvas context unavailable for bounded shader preview source');
            }

            context.fillStyle = '#000';
            context.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
            scale = Math.min(scaledCanvas.width / sourceCanvas.width, scaledCanvas.height / sourceCanvas.height);
            SetImageSmoothing(context, ShouldSmoothDynamicPreviewSourceScale(scale));
            context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, scaledCanvas.width, scaledCanvas.height);

            return scaledCanvas;
        };

        var ResizeOutputCanvasForPreset = function(renderPlan) {

            var targetWidth = renderPlan.outputWidth;
            var targetHeight = renderPlan.outputHeight;

            if (targetWidth > dynamicPreviewMaxIntermediateSize || targetHeight > dynamicPreviewMaxIntermediateSize) {
                throw new Error('preview output size ' + targetWidth + 'x' + targetHeight + ' exceeds preview safety limit ' + dynamicPreviewMaxIntermediateSize + ' for display thumbnail size ' + dynamicPreviewDisplaySize + ' and max scale ' + dynamicPreviewMaxIntermediateScale);
            }

            if (targetWidth > maxTextureSize || targetHeight > maxTextureSize) {
                throw new Error('preview output size ' + targetWidth + 'x' + targetHeight + ' exceeds WebGL MAX_TEXTURE_SIZE ' + maxTextureSize);
            }

            if (targetWidth > maxRenderbufferSize || targetHeight > maxRenderbufferSize) {
                throw new Error('preview output size ' + targetWidth + 'x' + targetHeight + ' exceeds WebGL MAX_RENDERBUFFER_SIZE ' + maxRenderbufferSize);
            }

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
            }

            width = targetWidth;
            height = targetHeight;
        };

        var GetRenderablePreviewPasses = function(preset) {

            var renderable = [];
            var i;

            for (i = 0; i < preset.passes.length; i++) {
                if (!preset.passes[i].skipForPreview) {
                    renderable.push(preset.passes[i]);
                }
            }

            return renderable;
        };

        var StoreRenderedPassTexture = function(pass, renderTarget, passTexturesByIndex, passTexturesByAlias) {

            passTexturesByIndex[pass.index] = renderTarget.texture;

            if (pass.alias) {
                passTexturesByAlias[pass.alias] = renderTarget.texture;
            }
        };

        var RenderPass = function(pass, textureContext, inputWidth, inputHeight, outputWidth, outputHeight, originalWidth, originalHeight, framebuffer) {

            var program = GetProgram(pass.shaderPath, pass.shaderSource);
            var errorCode;

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.viewport(0, 0, outputWidth, outputHeight);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);
            BindAttribute(program, 'VertexCoord', positionBuffer, 4);
            BindAttribute(program, 'TexCoord', texCoordBuffer, 4);
            BindTextureCoordinateFallbackAttributes(program);
            BindColorAttribute(program);
            BindCommonUniforms(program, inputWidth, inputHeight, outputWidth, outputHeight, originalWidth, originalHeight);
            BindParameterUniforms(program, pass.parameterValues);
            BindSamplerUniforms(program, pass, textureContext);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.flush();

            errorCode = gl.getError();

            if (errorCode !== gl.NO_ERROR) {
                throw new Error('WebGL render error ' + errorCode + ' in pass ' + pass.index);
            }
        };

        var RenderBlit = function(inputTexture, inputWidth, inputHeight, outputWidth, outputHeight, filterLinear) {

            var program = GetBlitProgram();
            var errorCode;

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, outputWidth, outputHeight);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);
            BindAttribute(program, 'VertexCoord', positionBuffer, 4);
            BindAttribute(program, 'TexCoord', texCoordBuffer, 4);
            BindColorAttribute(program);
            BindCommonUniforms(program, inputWidth, inputHeight, outputWidth, outputHeight, inputWidth, inputHeight);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, inputTexture);
            SetTextureSampling(filterLinear);
            SetIntUniform(program, 'Texture', 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.flush();

            errorCode = gl.getError();

            if (errorCode !== gl.NO_ERROR) {
                throw new Error('WebGL render error ' + errorCode + ' in final thumbnail blit');
            }
        };

        var BindTextureCoordinateFallbackAttributes = function(program) {

            BindAttribute(program, 'PrevTexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'Prev1TexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'Prev2TexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'Prev3TexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'Prev4TexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'Prev5TexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'Prev6TexCoord', texCoordBuffer, 4);
            BindAttribute(program, 'LUTTexCoord', texCoordBuffer, 4);
        };

        var BindParameterUniforms = function(program, parameters) {

            var name;

            for (name in parameters) {
                if (Object.prototype.hasOwnProperty.call(parameters, name)) {
                    SetFloatUniform(program, name, parameters[name]);
                }
            }
        };

        var BindSamplerUniforms = function(program, pass, textureContext) {

            var samplers = pass.samplerUniforms || ['Texture'];
            var unit = 0;
            var boundTextures = [];
            var i;

            for (i = 0; i < samplers.length; i++) {
                var samplerName = samplers[i];
                var samplerTexture = ResolveSamplerTexture(samplerName, textureContext);
                var texture;
                var filterLinear;
                var existingUnit;

                if (!samplerTexture) {
                    samplerTexture = textureContext.sourceTexture || textureContext.inputTexture;
                }

                texture = samplerTexture.texture || samplerTexture;
                filterLinear = samplerTexture.filterLinear !== undefined ? samplerTexture.filterLinear : pass.filterLinear;
                existingUnit = FindBoundTextureUnit(boundTextures, texture, filterLinear);

                if (existingUnit < 0) {
                    if (unit >= maxTextureImageUnits) {
                        SetIntUniform(program, samplerName, 0);
                        continue;
                    }

                    existingUnit = unit;
                    gl.activeTexture(gl.TEXTURE0 + existingUnit);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    SetTextureSampling(filterLinear);
                    boundTextures.push({
                        texture: texture,
                        filterLinear: filterLinear,
                        unit: existingUnit
                    });
                    unit++;
                }

                SetIntUniform(program, samplerName, existingUnit);
            }
        };

        var FindBoundTextureUnit = function(boundTextures, texture, filterLinear) {

            var i;

            for (i = 0; i < boundTextures.length; i++) {
                if (boundTextures[i].texture === texture && boundTextures[i].filterLinear === filterLinear) {
                    return boundTextures[i].unit;
                }
            }

            return -1;
        };

        var ResolveSamplerTexture = function(samplerName, textureContext) {

            var passMatch;
            var aliasName;

            if (samplerName === 'Texture' || samplerName === 'Source') {
                return {
                    texture: textureContext.inputTexture
                };
            }

            if (samplerName === 'Original' || samplerName === 'OrigTexture') {
                return {
                    texture: textureContext.sourceTexture
                };
            }

            if (samplerName.match(/^Prev\d*Texture$/) || samplerName.match(/^PassPrev\d*Texture$/)) {
                return {
                    texture: textureContext.inputTexture
                };
            }

            passMatch = samplerName.match(/^Pass(\d+)Texture$/);

            if (passMatch && textureContext.passTexturesByIndex[parseInt(passMatch[1], 10)]) {
                return {
                    texture: textureContext.passTexturesByIndex[parseInt(passMatch[1], 10)]
                };
            }

            aliasName = samplerName.replace(/Texture$/, '');

            if (textureContext.passTexturesByAlias[aliasName]) {
                return {
                    texture: textureContext.passTexturesByAlias[aliasName]
                };
            }

            if (textureContext.externalTextures[samplerName]) {
                return textureContext.externalTextures[samplerName];
            }

            if (textureContext.externalTextures[aliasName]) {
                return textureContext.externalTextures[aliasName];
            }

            return {
                texture: textureContext.sourceTexture
            };
        };

        var CreateExternalTextureMap = function(resources) {

            var map = {
                _textures: []
            };
            var i;

            for (i = 0; i < resources.length; i++) {
                var resource = resources[i];
                var textureInfo = resource.image ? CreateImageTexture(resource.image, resource.filterLinear) : CreateSolidColorTexture(0, 0, 0, 0, resource.filterLinear);

                map[resource.alias] = textureInfo;
                map._textures.push(textureInfo.texture);
            }

            return map;
        };

        var DestroyExternalTextureMap = function(map) {

            var textures = map && map._textures ? map._textures : [];
            var i;

            for (i = 0; i < textures.length; i++) {
                gl.deleteTexture(textures[i]);
            }
        };

        var ResolvePassOutputSize = function(pass, inputWidth, inputHeight, originalWidth, originalHeight, finalPass) {

            if (finalPass) {
                return {
                    width: width,
                    height: height
                };
            }

            return {
                width: ResolvePassOutputAxis(pass, pass.outputScale.x, inputWidth, originalWidth, width, 'x'),
                height: ResolvePassOutputAxis(pass, pass.outputScale.y, inputHeight, originalHeight, height, 'y')
            };
        };

        var ResolvePassOutputAxis = function(pass, axisScale, inputSize, originalSize, viewportSize, axisName) {

            var type = axisScale.type;
            var scale = axisScale.scale;
            var outputSize;

            if (!type && (scale === null || scale === undefined)) {
                type = 'source';
                scale = 1;
            }

            if (!type) {
                type = 'source';
            }

            if (scale === null || scale === undefined) {
                scale = 1;
            }

            if (type === 'source') {
                outputSize = inputSize * scale;
            } else if (type === 'viewport') {
                outputSize = viewportSize * scale;
            } else if (type === 'original') {
                outputSize = originalSize * scale;
            } else if (type === 'absolute' || type === 'abs') {
                outputSize = scale;
            } else {
                throw new Error('unsupported scale_type_' + axisName + ' for pass ' + pass.index + ': ' + type);
            }

            outputSize = Math.max(1, Math.round(outputSize));

            if (outputSize > dynamicPreviewMaxIntermediateSize) {
                throw new Error('pass ' + pass.index + ' ' + axisName + ' output size ' + outputSize + ' exceeds preview safety limit ' + dynamicPreviewMaxIntermediateSize + ' for display thumbnail size ' + dynamicPreviewDisplaySize + ' and max scale ' + dynamicPreviewMaxIntermediateScale);
            }

            if (outputSize > maxTextureSize) {
                throw new Error('pass ' + pass.index + ' ' + axisName + ' output size ' + outputSize + ' exceeds WebGL MAX_TEXTURE_SIZE ' + maxTextureSize);
            }

            return outputSize;
        };

        var GetBlitProgram = function() {

            if (blitProgram) {
                return blitProgram;
            }

            blitProgram = CompileProgram([
                '#if defined(VERTEX)',
                '#ifdef GL_ES',
                'precision mediump float;',
                '#endif',
                'attribute vec4 VertexCoord;',
                'attribute vec4 TexCoord;',
                'varying vec2 TEX0;',
                'uniform mat4 MVPMatrix;',
                'void main() {',
                '    gl_Position = MVPMatrix * VertexCoord;',
                '    TEX0 = TexCoord.xy;',
                '}',
                '#elif defined(FRAGMENT)',
                '#ifdef GL_ES',
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                '#endif',
                'varying vec2 TEX0;',
                'uniform sampler2D Texture;',
                'void main() {',
                '    gl_FragColor = texture2D(Texture, TEX0);',
                '}',
                '#endif'
            ].join('\n'));

            return blitProgram;
        };

        var GetProgram = function(cacheKey, shaderSource) {

            if (programCache[cacheKey]) {
                return programCache[cacheKey];
            }

            programCache[cacheKey] = CompileProgram(shaderSource);
            return programCache[cacheKey];
        };

        var CompileProgram = function(shaderSource) {

            var vertexShader = CompileShader(gl.VERTEX_SHADER, BuildShaderStageSource(shaderSource, 'VERTEX'));
            var fragmentShader = CompileShader(gl.FRAGMENT_SHADER, BuildShaderStageSource(shaderSource, 'FRAGMENT'));
            var program = gl.createProgram();
            var linked;
            var linkLog;

            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            linked = gl.getProgramParameter(program, gl.LINK_STATUS);

            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            if (!linked) {
                linkLog = gl.getProgramInfoLog(program) || 'program link failed';
                gl.deleteProgram(program);
                throw new Error(ShortenShaderLog(linkLog));
            }

            return program;
        };

        var CompileShader = function(type, source) {

            var shader = gl.createShader(type);
            var compiled;
            var shaderLog;

            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

            if (!compiled) {
                shaderLog = gl.getShaderInfoLog(shader) || 'shader compile failed';
                gl.deleteShader(shader);
                throw new Error(ShortenShaderLog(shaderLog));
            }

            return shader;
        };

        var BuildShaderStageSource = function(shaderSource, stage) {

            var source = String(shaderSource || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

            source = source.replace(/^\s*#version[^\n]*(\n|$)/gm, '');
            source = source.replace(/^\s*#pragma[^\n]*(\n|$)/gm, '');

            return '#define ' + stage + ' 1\n#define PARAMETER_UNIFORM 1\n' + source;
        };

        var BindAttribute = function(program, name, buffer, size) {

            var location = gl.getAttribLocation(program, name);

            if (location < 0) {
                return;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        };

        var BindColorAttribute = function(program) {

            var location = gl.getAttribLocation(program, 'COLOR');

            if (location < 0) {
                return;
            }

            gl.disableVertexAttribArray(location);
            gl.vertexAttrib4f(location, 1, 1, 1, 1);
        };

        var BindCommonUniforms = function(program, inputWidth, inputHeight, outputWidth, outputHeight, originalWidth, originalHeight) {

            SetMatrixUniform(program, 'MVPMatrix', identityMatrix);
            SetIntUniform(program, 'FrameDirection', 1);
            SetIntUniform(program, 'FrameCount', 0);
            SetVec2Uniform(program, 'InputSize', inputWidth, inputHeight);
            SetVec2Uniform(program, 'TextureSize', inputWidth, inputHeight);
            SetVec2Uniform(program, 'OutputSize', outputWidth, outputHeight);
            SetVec2Uniform(program, 'OriginalSize', originalWidth, originalHeight);
            SetVec2Uniform(program, 'FinalViewportSize', width, height);
        };

        var SetMatrixUniform = function(program, name, value) {

            var location = gl.getUniformLocation(program, name);

            if (location) {
                gl.uniformMatrix4fv(location, false, value);
            }
        };

        var SetIntUniform = function(program, name, value) {

            var location = gl.getUniformLocation(program, name);

            if (location) {
                gl.uniform1i(location, value);
            }
        };

        var SetVec2Uniform = function(program, name, x, y) {

            var location = gl.getUniformLocation(program, name);

            if (location) {
                gl.uniform2f(location, x, y);
            }
        };

        var SetFloatUniform = function(program, name, value) {

            var location = gl.getUniformLocation(program, name);

            if (location) {
                gl.uniform1f(location, value);
            }
        };

        var CreateCanvasTexture = function(sourceCanvas) {

            var texture = gl.createTexture();

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            SetTextureDefaults();
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            return texture;
        };

        var CreateImageTexture = function(image, filterLinear) {

            var texture = gl.createTexture();

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            SetTextureDefaults();
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            SetTextureSampling(filterLinear);

            return {
                texture: texture,
                filterLinear: filterLinear
            };
        };

        var CreateSolidColorTexture = function(r, g, b, a, filterLinear) {

            var texture = gl.createTexture();
            var pixel = new Uint8Array([
                Math.max(0, Math.min(255, Math.round(r * 255))),
                Math.max(0, Math.min(255, Math.round(g * 255))),
                Math.max(0, Math.min(255, Math.round(b * 255))),
                Math.max(0, Math.min(255, Math.round(a * 255)))
            ]);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            SetTextureDefaults();
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            SetTextureSampling(filterLinear);

            return {
                texture: texture,
                filterLinear: filterLinear
            };
        };

        var CreateRenderTarget = function(targetWidth, targetHeight) {

            var texture = gl.createTexture();
            var framebuffer = gl.createFramebuffer();
            var status;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            SetTextureDefaults();
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, targetWidth, targetHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

            if (status !== gl.FRAMEBUFFER_COMPLETE) {
                gl.deleteFramebuffer(framebuffer);
                gl.deleteTexture(texture);
                throw new Error('WebGL framebuffer incomplete for preview pass target ' + targetWidth + 'x' + targetHeight + ': ' + status);
            }

            return {
                texture: texture,
                framebuffer: framebuffer,
                width: targetWidth,
                height: targetHeight
            };
        };

        var DestroyRenderTarget = function(renderTarget) {

            if (!renderTarget) {
                return;
            }

            if (renderTarget.framebuffer) {
                gl.deleteFramebuffer(renderTarget.framebuffer);
            }

            if (renderTarget.texture) {
                gl.deleteTexture(renderTarget.texture);
            }
        };

        var SetTextureDefaults = function() {

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        };

        var SetTextureSampling = function(filterLinear) {

            var filter = filterLinear ? gl.LINEAR : gl.NEAREST;

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        };

        var ShortenShaderLog = function(message) {

            message = String(message || 'shader error');

            if (message.length > 500) {
                return message.substr(0, 500) + '...';
            }

            return message;
        };
    };

    var Constructor = (function() {

        window.cesShaderPreviewBridge = {
            Start: function(system, gameKey, itemSelector) {
                var previewSession = BeginDynamicPreviewSession();

                StartDynamicShaderPreviews(previewSession, system, gameKey, {
                    itemSelector: itemSelector,
                    ignoreDialogSelection: true
                });

                return previewSession;
            },
            Cancel: function() {
                CancelDynamicShaderPreviews();
            },
            ApplyToImage: function(options) {
                var token = (options && options.cancelToken) || {
                    active: true,
                    id: ++dynamicPreviewDetachedSession
                };

                options = options || {};
                options.cancelToken = token;
                options.detachedSession = true;
                options.ignoreDialogSelection = true;

                RenderDynamicPreviewForImage(token.id, options);
                return token;
            }
        };

    })();
});
