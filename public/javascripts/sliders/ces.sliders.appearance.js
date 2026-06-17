var cesSlidersAppearance = (function(_config, $li, $panel, Open) {

    var _gameKey = null;
    var _preferences = null;
    var _emulator = null;
    var _logging = null;
    var _media = null;
    var _sessionShader = null;
    var _message = null;
    var _busy = false;
    var _panelOpen = false;
    var _previewTimer = null;
    var _summaryPreviewTimer = null;
    var _summaryPreviewToken = null;
    var _titleScreenPreviewLookupId = 0;
    var _titleScreenPreviewCache = {};
    var _titleScreenPreviewSizes = ['z', 'a', 'c', 'b', 'd'];
    var _screenshotChangedEvent = 'ces:screenshotsChanged';
    var _visualStyleChangedEvent = 'ces:visualStyleChanged';

    this.Activate = function(gameKey, Preferences, Emulator, Logging, Media, selectedShader) {
        _gameKey = gameKey || null;
        _preferences = Preferences || null;
        _emulator = Emulator || null;
        _logging = Logging || null;
        _media = Media || null;
        _sessionShader = (typeof selectedShader === 'undefined' || selectedShader === null) ? null : String(selectedShader);
        _message = null;
        CancelTitleScreenPreviewLookup();
        Render();
    };

    this.Deactivate = function() {
        CancelPreview();
        CancelCurrentSummaryPreview();
        CancelTitleScreenPreviewLookup();
        _gameKey = null;
        _preferences = null;
        _emulator = null;
        _logging = null;
        _media = null;
        _sessionShader = null;
        _message = null;
        _busy = false;
        _panelOpen = false;
        PublishInactiveVisualStyle();
        RenderInactive();
    };

    this.OnOpen = function(callback) {
        _panelOpen = true;
        Render();
        callback(true);
        SchedulePreviewStart();
    };

    this.OnClose = function(callback) {
        _panelOpen = false;
        CancelPreview();
        CancelCurrentSummaryPreview();
        CancelTitleScreenPreviewLookup();
        callback(true);
    };

    var RenderInactive = function() {
        CancelCurrentSummaryPreview();
        GetRoot().empty().append(BuildEmptyState('Display Style', 'Start a game to choose a display style.'));
    };

    var Render = function() {
        var $root = GetRoot();
        var context = BuildContext();
        var $header;

        $root.empty();
        PublishCurrentVisualStyle(context);

        $header = $('<div class="slider-panel-header" />');
        $('<div class="slider-panel-titlegroup" />')
            .append($('<h3 />').text('Display Style'))
            .append($('<p />').text('Choose how your game appears on screen. Most display styles use shaders, so relaunch your game to apply changes'))
            .appendTo($header);
        // $('<div class="slider-panel-badge" />').text('Visual Style').appendTo($header);
        $root.append($header);

        $root.append(BuildCurrentLookSummary(context));
        if (_panelOpen) {
            ScheduleCurrentSummaryPreviewRender(context);
        }
        else {
            CancelCurrentSummaryPreview();
        }

        if (_message && _message.text) {
            $root.append($('<div />').addClass('appearance-status appearance-status-' + (_message.type || 'info')).text(_message.text));
        }

        $root.append(BuildCuratedLooks(context));

        if (_panelOpen) {
            SchedulePreviewStart();
        }
    };

    var GetRoot = function() {
        var $root = $panel.find('.appearance-slider-root');

        if (!$root.length) {
            $root = $('<div class="appearance-slider-root" />').appendTo($panel);
        }

        return $root;
    };

    var BuildCurrentLookSummary = function(context) {
        var $summary = $('<div class="appearance-current-summary" />');
        var $details = $('<div class="appearance-current-details" />');
        var $copy = $('<div class="appearance-current-copy" />').appendTo($details);

        $summary.append(BuildCurrentScreenshotPreview(context));

        // $('<div class="appearance-current-label" />').text('Current Active Display Style').appendTo($copy);
        $('<div class="appearance-current-value" />').text('Currently Active: ' + context.currentLookName).appendTo($copy);

        if (context.currentLookNote) {
            $('<div class="appearance-current-note" />').text(context.currentLookNote).appendTo($copy);
        }

        $copy.append(BuildSystemDefaultCheckbox(context));

        $summary.append($details);
        return $summary;
    };

    var BuildCurrentScreenshotPreview = function(context) {
        var previewSource = GetCurrentPreviewSource(context);
        var $column = $('<div class="appearance-current-preview-column" />');
        var $frame = $('<div class="appearance-current-preview screenshot-card-media" />');

        // $('<div class="appearance-current-preview-label" />').text('Current Active Display Style').appendTo($column);

        if (previewSource && previewSource.src) {
            CancelTitleScreenPreviewLookup();
            AppendCurrentPreviewImage($frame, previewSource, context);
        }
        else if (_panelOpen && CanRequestTitleScreenPreview()) {
            ShowCurrentPreviewMessage($frame, 'Loading preview...', null, 'appearance-current-preview-loading');
            RequestTitleScreenPreview(context, $frame);
        }
        else {
            ShowCurrentPreviewUnavailable($frame);
        }

        $column.append($frame);
        return $column;
    };

    var BuildSystemDefaultCheckbox = function(context) {
        var checkboxId = 'appearanceSystemDefaultCheckbox';
        var $label = $('<label class="appearance-current-default-toggle" />').attr('for', checkboxId);
        var $checkbox = $('<input type="checkbox" />')
            .attr('id', checkboxId)
            .prop('checked', context.isCurrentSystemDefault === true)
            .prop('disabled', !context.system || _busy === true);

        if (!context.system || _busy === true) {
            $label.addClass('disabled');
        }

        $checkbox.on('change', function() {
            var checked = $(this).prop('checked') === true;

            if (_busy) {
                Render();
                return;
            }

            if (checked) {
                SaveDefault(context.currentSelection, 'Saved ' + context.currentLookName + ' as the default display style for all ' + context.systemName + ' games.');
            }
            else {
                ClearDefault(context.currentSelection);
            }
        });

        $label.append($checkbox);
        $('<span class="appearance-current-default-toggle-text" />')
            .text(GetSystemDefaultCheckboxLabel(context))
            .appendTo($label);

        return $label;
    };

    var GetSystemDefaultCheckboxLabel = function(context) {
        if (!context.system) {
            return 'Use this display style as the system default.';
        }

        return 'Use this display style as the default for all ' + context.systemName + ' games.';
    };

    var GetCurrentPreviewSource = function(context) {
        var screenshot = GetLatestCapturedScreenshot();
        var cachedTitleScreen = GetCachedTitleScreenPreview();

        if (screenshot && screenshot.src) {
            return {
                type: 'screenshot',
                src: screenshot.src,
                title: screenshot.title || '',
                alt: 'Latest captured screenshot with ' + context.currentLookName
            };
        }

        if (cachedTitleScreen && cachedTitleScreen.src) {
            return cachedTitleScreen;
        }

        return null;
    };

    var AppendCurrentPreviewImage = function($frame, previewSource, context) {
        var alt = previewSource.alt;
        var sourceType = previewSource.type || 'image';
        var $img;

        if (!alt) {
            alt = sourceType == 'title-screen' ? (_gameKey && _gameKey.title ? _gameKey.title + ' title screen with ' + context.currentLookName : 'Title screen with ' + context.currentLookName) : 'Preview with ' + context.currentLookName;
        }

        $frame.empty()
            .removeClass('appearance-current-preview-empty appearance-current-preview-loading')
            .attr('data-preview-source', sourceType)
            .removeAttr('data-current-look-applied');

        $img = $('<img />')
            .attr('data-original-src', previewSource.src)
            .attr('alt', alt)
            .on('error.cesAppearancePreview', function() {
                if (sourceType == 'title-screen') {
                    delete _titleScreenPreviewCache[GetGameKeyId(_gameKey)];
                }

                ShowCurrentPreviewUnavailable($frame);
            })
            .attr('src', previewSource.src)
            .appendTo($frame);
    };

    var ShowCurrentPreviewUnavailable = function($frame) {
        ShowCurrentPreviewMessage($frame, 'No preview available.', null, null);
    };

    var ShowCurrentPreviewMessage = function($frame, title, text, extraClass) {
        $frame.empty()
            .removeAttr('data-preview-source data-current-look-applied')
            .addClass('appearance-current-preview-empty')
            .removeClass('appearance-current-preview-loading');

        if (extraClass) {
            $frame.addClass(extraClass);
        }

        $('<div class="appearance-current-preview-empty-title" />').text(title).appendTo($frame);

        if (text) {
            $('<p />').text(text).appendTo($frame);
        }
    };

    var CanRequestTitleScreenPreview = function() {
        return !!(_media && typeof _media.TitleScreenSource === 'function' && _gameKey && _gameKey.gk);
    };

    var RequestTitleScreenPreview = function(context, $frame) {
        var gameKey = _gameKey;
        var gameKeyId = GetGameKeyId(gameKey);
        var requestId;
        var $targetFrame = $frame && $frame.length ? $frame : $panel.find('.appearance-current-preview').first();

        if (!CanRequestTitleScreenPreview() || GetCachedTitleScreenPreview()) {
            return;
        }

        requestId = ++_titleScreenPreviewLookupId;

        _media.TitleScreenSource(gameKey, _titleScreenPreviewSizes, function(success, status, src, content, selectedTitleSize) {
            var previewSource;

            if (!IsTitleScreenPreviewRequestCurrent(requestId, gameKeyId)) {
                return;
            }

            if (GetLatestCapturedScreenshot()) {
                return;
            }

            if (!success || !src) {
                ShowCurrentPreviewUnavailable($targetFrame);
                return;
            }

            previewSource = {
                type: 'title-screen',
                src: src,
                title: gameKey.title || '',
                selectedTitleSize: selectedTitleSize || null,
                alt: (gameKey.title ? gameKey.title + ' title screen' : 'Title screen') + ' with ' + context.currentLookName
            };

            _titleScreenPreviewCache[gameKeyId] = previewSource;
            AppendCurrentPreviewImage($targetFrame, previewSource, context);
            ScheduleCurrentSummaryPreviewRender(context);
        });
    };

    var IsTitleScreenPreviewRequestCurrent = function(requestId, gameKeyId) {
        return requestId === _titleScreenPreviewLookupId && gameKeyId && gameKeyId === GetGameKeyId(_gameKey);
    };

    var CancelTitleScreenPreviewLookup = function() {
        _titleScreenPreviewLookupId++;
    };

    var GetCachedTitleScreenPreview = function() {
        var gameKeyId = GetGameKeyId(_gameKey);

        if (!gameKeyId || !_titleScreenPreviewCache[gameKeyId]) {
            return null;
        }

        return $.extend({}, _titleScreenPreviewCache[gameKeyId]);
    };

    var BuildCuratedLooks = function(context) {
        var $section = $('<div class="appearance-curated-section" />');
        var $header = $('<div class="appearance-curated-header" />').appendTo($section);
        var $grid = $('<div class="appearance-look-grid" />').appendTo($section);
        var i;

        $('<div class="appearance-curated-title" />').text('Available Display Styles').appendTo($header);
        // $('<p />').text('Pick a visual style for the next launch.').appendTo($header);

        if (!context.system) {
            $grid.append(BuildEmptyState('No game selected', 'Start a game before choosing a style.'));
            return $section;
        }

        if (!context.looks.length) {
            $grid.append(BuildEmptyState('No display styles available', 'Where the GLSL shaders go!'));
            return $section;
        }

        for (i = 0; i < context.looks.length; i++) {
            $grid.append(BuildLookCard(context.looks[i], context));
        }

        return $section;
    };

    var BuildLookCard = function(look, context) {
        var lookValue = ResolveLookValue(look, context.system);
        var fallbackSrc = GetPreviewFallbackSrc(look);
        var safeFallbackSrc = GetPreviewFallbackSrc({
            shader: '',
            glslp: null,
            isPixelPerfect: true
        });
        var isDefault = context.hasSystemDefault && SelectionsMatch(context.defaultSelection, lookValue);
        var canApply = !_busy && context.canApplyLookOnNextRestart;
        var $card = $('<div class="appearance-look-card" />')
            .attr('data-shader', look.shader || '')
            .attr('data-look-value', lookValue || '')
            .toggleClass('appearance-look-card-default', isDefault);
        var $preview = $('<div class="appearance-look-preview screenshot-card-media" />').appendTo($card);
        var $status = $('<div class="appearance-look-status" />');
        var $actions = $('<div class="appearance-look-actions" />');

        if (look.glslp) {
            $card.attr('data-glslp', look.glslp);
        }

        $('<img />')
            .attr('src', fallbackSrc)
            .attr('data-fallback-src', fallbackSrc)
            .attr('data-safe-fallback-src', safeFallbackSrc)
            .on('error.cesAppearanceLookPreview', function() {
                var $img = $(this);
                var safeSrc = $img.attr('data-safe-fallback-src') || '';

                if (safeSrc && $img.attr('src') !== safeSrc) {
                    $img.attr('src', safeSrc);
                }
            })
            .attr('width', 300)
            .attr('height', 300)
            .attr('alt', look.title + ' preview')
            .appendTo($preview);

        $('<h3 class="appearance-look-name" />').text(look.title).appendTo($card);

        if (isDefault) {
            // $('<span />').text('System default').appendTo($status);
        }

        if ($status.children().length) {
            $card.append($status);
        }

        $actions.append(BuildButton('Apply on Next Restart', canApply, function() {
            SaveDefault(lookValue, look.title + ' will apply the next time you start a ' + context.systemName + ' game.');
        }));
        $card.append($actions);

        return $card;
    };

    var BuildButton = function(label, enabled, handler) {
        var $button = $('<button type="button" class="slider-panel-button" />').text(label);

        if (!enabled) {
            $button.prop('disabled', true).addClass('disabled');
            return $button;
        }

        $button.on('click', function(e) {
            e.preventDefault();
            handler();
        });

        return $button;
    };

    var BuildEmptyState = function(title, text) {
        var $empty = $('<div class="slider-panel-empty appearance-browser-empty" />');
        $('<div class="slider-panel-empty-title" />').text(title).appendTo($empty);
        $('<p />').text(text || '').appendTo($empty);
        return $empty;
    };

    var SaveDefault = function(shaderValue, successMessage) {
        var system = GetCurrentSystem();

        if (!system) {
            SetMessage('Start a game before saving a system display style.', 'warning');
            Render();
            return;
        }

        SetBusy('Saving display style...', 'info');

        $.ajax({
            url: '/shaders/defaults/' + encodeURIComponent(system),
            type: 'POST',
            data: JSON.stringify({ shader: shaderValue || '' }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                var savedShader = response && response.default ? response.default.shader || '' : shaderValue || '';

                if (_preferences && typeof _preferences.Set === 'function') {
                    _preferences.Set('systems.' + system + '.shader', savedShader);
                }

                SetMessage(successMessage || 'Saved the system display style.', 'success');
            },
            error: function(xhr) {
                SetMessage(GetAjaxError(xhr, 'This display style could not be saved.'), 'error');
            },
            complete: function() {
                _busy = false;
                Render();
            }
        });
    };

    var ClearDefault = function(expectedSelection) {
        var system = GetCurrentSystem();
        var systemName = GetSystemName(system);
        var defaultInfo;

        if (!system) {
            SetMessage('Start a game before removing a system display style default.', 'warning');
            Render();
            return;
        }

        defaultInfo = GetSystemDefaultInfo(system);

        if (typeof expectedSelection !== 'undefined' && (!defaultInfo.exists || !SelectionsMatch(expectedSelection, defaultInfo.shader || ''))) {
            SetMessage('The current display style is not the saved default for ' + systemName + ' games.', 'info');
            Render();
            return;
        }

        SetBusy('Removing saved display style...', 'info');

        $.ajax({
            url: '/shaders/defaults/' + encodeURIComponent(system),
            type: 'DELETE',
            dataType: 'json',
            success: function() {
                if (_preferences && typeof _preferences.Remove === 'function') {
                    _preferences.Remove('systems.' + system + '.shader');
                }
                SetMessage('Removed the ' + systemName + ' default. The pre-game question can appear again.', 'success');
            },
            error: function(xhr) {
                SetMessage(GetAjaxError(xhr, 'The system display style default could not be removed.'), 'error');
            },
            complete: function() {
                _busy = false;
                Render();
            }
        });
    };

    var SetBusy = function(message, type) {
        _busy = true;
        _message = {
            text: message,
            type: type || 'info'
        };
        Render();
    };

    var SetMessage = function(message, type) {
        _message = {
            text: message,
            type: type || 'info'
        };
    };

    var BuildContext = function() {
        var system = GetCurrentSystem();
        var systemName = GetSystemName(system);
        var runtimeSelection = GetRuntimeSelection();
        var defaultInfo = GetSystemDefaultInfo(system);
        var currentSelection = ResolveCurrentSelection(runtimeSelection, defaultInfo);
        var currentLook = FindLookForSelection(system, currentSelection);
        var defaultLook = defaultInfo.exists ? FindLookForSelection(system, defaultInfo.shader || '') : null;
        var currentLookName = currentLook ? currentLook.title : GetDisplayNameForSelection(system, currentSelection);
        var defaultLookName = defaultLook ? defaultLook.title : GetDisplayNameForSelection(system, defaultInfo.shader || '');
        var isCurrentSystemDefault = !!(defaultInfo.exists && SelectionsMatch(currentSelection, defaultInfo.shader || ''));
        var currentLookNote;

        if (!system) {
            currentLookName = 'Pixel Perfect';
            currentLookNote = 'Start a game to choose a look.';
        }
        else if (isCurrentSystemDefault) {
            currentLookNote = 'Saved for future ' + systemName + ' games.';
        }
        else if (defaultInfo.exists) {
            currentLookNote = 'Saved for future ' + systemName + ' games: ' + defaultLookName + '.';
        }
        else {
            currentLookNote = 'No display style is saved for all ' + systemName + ' games.';
        }

        return {
            system: system,
            systemName: systemName,
            looks: GetCuratedLooks(system),
            currentSelection: currentSelection,
            currentLook: currentLook,
            currentLookName: currentLookName,
            currentLookNote: currentLookNote,
            hasSystemDefault: defaultInfo.exists,
            defaultSelection: defaultInfo.shader || '',
            isCurrentSystemDefault: isCurrentSystemDefault,
            canApplyLookOnNextRestart: !!system
        };
    };

    var ResolveCurrentSelection = function(runtimeSelection, defaultInfo) {

        if (_sessionShader !== null) {
            return _sessionShader;
        }

        if (runtimeSelection !== null) {
            return runtimeSelection;
        }

        if (defaultInfo && defaultInfo.exists) {
            return defaultInfo.shader || '';
        }

        return '';
    };

    var GetRuntimeSelection = function() {
        var runtimeState;
        var selection;

        if (!_emulator || typeof _emulator.GetShaderRuntimeState !== 'function') {
            return null;
        }

        try {
            runtimeState = _emulator.GetShaderRuntimeState() || null;
        } catch (e) {
            Log('Look state check failed: ' + e);
            runtimeState = null;
        }

        if (!runtimeState) {
            return null;
        }

        selection = runtimeState.activePresetRelativePath || runtimeState.activeSelection || runtimeState.activePresetPath || null;

        if (selection === null || typeof selection === 'undefined') {
            return null;
        }

        return String(selection);
    };

    var GetSystemDefaultInfo = function(system) {
        var result = {
            exists: false,
            shader: null
        };
        var prefs;

        if (!system || !_preferences || typeof _preferences.Get !== 'function') {
            return result;
        }

        prefs = _preferences.Get('systems.' + system);

        if (!prefs || typeof prefs !== 'object' || !Object.prototype.hasOwnProperty.call(prefs, 'shader')) {
            return result;
        }

        result.exists = true;
        result.shader = prefs.shader || '';
        return result;
    };

    var GetCuratedLooks = function(system) {
        if (window.cesVisualStyles && typeof window.cesVisualStyles.GetForDisplayStyleSlider === 'function') {
            return window.cesVisualStyles.GetForDisplayStyleSlider(_config, system);
        }

        if (window.cesVisualStyles && typeof window.cesVisualStyles.GetForSystem === 'function') {
            return window.cesVisualStyles.GetForSystem(_config, system);
        }

        return [{
            id: 'pixel-perfect',
            title: 'Pixel Perfect',
            name: 'Pixel Perfect',
            shader: '',
            glslp: null,
            isPixelPerfect: true
        }];
    };

    var ResolveLookValue = function(look, system) {
        if (window.cesVisualStyles && typeof window.cesVisualStyles.ResolveLaunchValueForSystem === 'function') {
            return window.cesVisualStyles.ResolveLaunchValueForSystem(_config, system, look);
        }

        if (!look || look.isPixelPerfect) {
            return '';
        }

        return look.glslp || look.shader || '';
    };

    var FindLookForSelection = function(system, selection) {
        if (window.cesVisualStyles && typeof window.cesVisualStyles.FindLookForSelection === 'function') {
            return window.cesVisualStyles.FindLookForSelection(_config, system, selection);
        }

        return !selection ? GetCuratedLooks(system)[0] : null;
    };

    var GetDisplayNameForSelection = function(system, selection) {
        if (window.cesVisualStyles && typeof window.cesVisualStyles.GetDisplayNameForSelection === 'function') {
            return window.cesVisualStyles.GetDisplayNameForSelection(_config, system, selection);
        }

        return selection ? String(selection) : 'Pixel Perfect';
    };

    var GetPreviewFallbackSrc = function(look) {
        if (window.cesVisualStyles && typeof window.cesVisualStyles.GetPreviewFallbackSrc === 'function') {
            return window.cesVisualStyles.GetPreviewFallbackSrc(_config, look);
        }

        return ((_config.paths && _config.paths.images) ? _config.paths.images : '') + '/shaders/pixels.png';
    };

    var GetCurrentLookShader = function(context) {

        if (context && context.currentLook && context.currentLook.shader) {
            return context.currentLook.shader;
        }

        return context ? context.currentSelection || '' : '';
    };

    var GetCurrentLookGlslp = function(context) {

        var normalized;

        if (context && context.currentLook && context.currentLook.glslp) {
            return context.currentLook.glslp;
        }

        normalized = context ? NormalizeShaderPath(context.currentSelection) : '';
        return normalized || '';
    };

    var IsPixelPerfectSelection = function(selection) {

        return selection === null || typeof selection === 'undefined' || String(selection) === '';
    };

    var GetGameKeyId = function(gameKey) {

        return gameKey && gameKey.gk ? String(gameKey.gk) : '';
    };

    var PublishCurrentVisualStyle = function(context) {

        var style = {
            gameGk: GetGameKeyId(_gameKey),
            gameKey: _gameKey,
            system: context.system,
            selection: context.currentSelection || '',
            shader: GetCurrentLookShader(context),
            glslp: GetCurrentLookGlslp(context),
            name: context.currentLookName,
            isPixelPerfect: IsPixelPerfectSelection(context.currentSelection)
        };

        window.cesCurrentVisualStyle = style;
        $(document).trigger(_visualStyleChangedEvent, [style]);
    };

    var PublishInactiveVisualStyle = function() {

        window.cesCurrentVisualStyle = null;
        $(document).trigger(_visualStyleChangedEvent, [null]);
    };

    var GetLatestCapturedScreenshot = function() {

        var screenshot;
        var gameKey = GetGameKeyId(_gameKey);
        var $latest = null;
        var latestTs = -1;

        if (window.cesCapturedScreenshots && typeof window.cesCapturedScreenshots.GetLatest === 'function') {
            screenshot = window.cesCapturedScreenshots.GetLatest(_gameKey);
            if (screenshot && screenshot.src) {
                return screenshot;
            }
        }

        $('#screenshotsGrid .screenshot-card').each(function() {
            var $card = $(this);
            var cardGameKey = $card.attr('data-game-gk') || '';
            var ts = parseInt($card.data('ts'), 10);

            if (gameKey && cardGameKey && cardGameKey !== gameKey) {
                return;
            }

            if (isNaN(ts)) {
                ts = 0;
            }

            if (!$latest || ts > latestTs) {
                $latest = $card;
                latestTs = ts;
            }
        });

        if ($latest && $latest.length) {
            var $img = $latest.find('img').first();
            var src = $img.attr('data-original-src') || $img.attr('src');

            if (src) {
                return {
                    src: src,
                    ts: latestTs,
                    title: $img.attr('alt') || ''
                };
            }
        }

        return null;
    };

    var ScheduleCurrentSummaryPreviewRender = function(context) {

        CancelCurrentSummaryPreview();

        if (_summaryPreviewTimer) {
            clearTimeout(_summaryPreviewTimer);
        }

        _summaryPreviewTimer = setTimeout(function() {
            _summaryPreviewTimer = null;
            RenderCurrentSummaryPreview(context);
        }, 30);
    };

    var RenderCurrentSummaryPreview = function(context) {

        var $preview = $panel.find('.appearance-current-preview').first();
        var $img = $preview.find('img').first();
        var originalSrc = $img.attr('data-original-src') || $img.attr('src');
        var glslp = GetCurrentLookGlslp(context);
        var token;

        if (!$img.length || !originalSrc) {
            return;
        }

        $img.attr('src', originalSrc).removeAttr('data-dynamic-preview data-dynamic-preview-internal-size');
        $preview.removeAttr('data-current-look-applied');

        if (IsPixelPerfectSelection(context.currentSelection)) {
            return;
        }

        if (!window.cesShaderPreviewBridge || typeof window.cesShaderPreviewBridge.ApplyToImage !== 'function' || !glslp) {
            $preview.attr('data-current-look-applied', 'unavailable');
            return;
        }

        $preview.attr('data-current-look-applied', 'pending');
        token = window.cesShaderPreviewBridge.ApplyToImage({
            sourceSrc: originalSrc,
            targetImage: $img.get(0),
            target: $preview.get(0),
            shader: GetCurrentLookShader(context),
            glslp: glslp,
            title: context.currentLookName || 'Current look',
            preserveImageAspect: true,
            onComplete: function(success) {
                if (token && token.active === false) {
                    return;
                }

                $preview.attr('data-current-look-applied', success ? 'true' : 'unavailable');
            }
        });

        _summaryPreviewToken = token;
    };

    var CancelCurrentSummaryPreview = function() {

        if (_summaryPreviewTimer) {
            clearTimeout(_summaryPreviewTimer);
            _summaryPreviewTimer = null;
        }

        if (_summaryPreviewToken) {
            _summaryPreviewToken.active = false;
            _summaryPreviewToken = null;
        }
    };

    var BindScreenshotUpdates = function() {

        $(document).off(_screenshotChangedEvent + '.cesSlidersAppearance').on(_screenshotChangedEvent + '.cesSlidersAppearance', function() {
            if (_gameKey) {
                Render();
            }
        });
    };

    var SelectionsMatch = function(left, right) {
        var leftValue = NormalizeSelection(left);
        var rightValue = NormalizeSelection(right);
        var leftPath;
        var rightPath;

        if (!leftValue && !rightValue) {
            return true;
        }

        if (leftValue === rightValue) {
            return true;
        }

        leftPath = NormalizeShaderPath(leftValue);
        rightPath = NormalizeShaderPath(rightValue);

        return !!(leftPath && rightPath && leftPath === rightPath);
    };

    var NormalizeSelection = function(selection) {
        if (selection === null || typeof selection === 'undefined') {
            return '';
        }

        return String(selection);
    };

    var NormalizeShaderPath = function(path) {
        if (window.cesVisualStyles && typeof window.cesVisualStyles.NormalizeShaderPath === 'function') {
            return window.cesVisualStyles.NormalizeShaderPath(path);
        }

        return '';
    };

    var GetCurrentSystem = function() {
        return _gameKey && _gameKey.system ? _gameKey.system : null;
    };

    var GetSystemName = function(system) {
        var systemDetails = (_config.systemdetails && system) ? _config.systemdetails[system] : null;

        if (!system) {
            return 'this system';
        }

        return (systemDetails && (systemDetails.name || systemDetails.shortname)) || system;
    };

    var SchedulePreviewStart = function() {
        if (_previewTimer) {
            clearTimeout(_previewTimer);
        }

        _previewTimer = setTimeout(function() {
            _previewTimer = null;
            StartPreviewGrid();
        }, 40);
    };

    var StartPreviewGrid = function() {
        var system = GetCurrentSystem();

        CancelPreview();

        if (!_panelOpen || !system || !_gameKey || !window.cesShaderPreviewBridge || typeof window.cesShaderPreviewBridge.Start !== 'function') {
            return;
        }

        window.cesShaderPreviewBridge.Start(system, _gameKey, '#Appearance-slider .appearance-look-card');
    };

    var CancelPreview = function() {
        if (_previewTimer) {
            clearTimeout(_previewTimer);
            _previewTimer = null;
        }

        if (window.cesShaderPreviewBridge && typeof window.cesShaderPreviewBridge.Cancel === 'function') {
            window.cesShaderPreviewBridge.Cancel();
        }
    };

    var GetAjaxError = function(xhr, fallback) {
        var response = xhr && xhr.responseJSON ? xhr.responseJSON : null;
        return (response && response.error) || fallback;
    };

    var Log = function(message) {
        if (_logging && typeof _logging.Console === 'function') {
            _logging.Console('ces.sliders.appearance', message);
        }
    };

    var Constructor = (function() {
        BindScreenshotUpdates();
        RenderInactive();
    })();
});
