var cesSlidersScreenshots = (function(_config, $li, $panel, Open) {

    var self = this;
    var _grid;
    var _pubSub;
    var _tooltips;
    var _gameKey;
    var _compression;
    var _media;
    var _screenshots = [];
    var _screenshotChangedEvent = 'ces:screenshotsChanged';
    var _visualStyleChangedEvent = 'ces:visualStyleChanged';
    var _applyCurrentLookToScreenshots = false;

    this.Activate = function(gameKey, _PubSub, _Tooltips, _Compression, _Media) {
        
        CancelAllScreenshotLookRenders();
        _grid.isotope('remove', _grid.children()); //clear on activation (sanity)
        _grid.css('min-height', '');
        _screenshots = [];
        _pubSub = _PubSub;
        _tooltips = _Tooltips;
        _gameKey = gameKey;
        _compression = _Compression;
        _media = _Media;
        UpdateScreenshotKeyLabel();
        UpdateScreenshotLookToggle();
        PublishScreenshotCatalogChanged();
        _pubSub.Subscribe('screenshotWritten', self, OnNewScreenshot);
    };

    this.Deactivate = function() {

        CancelAllScreenshotLookRenders();
        _grid.isotope('remove', _grid.children()); //clear on deactivation
        _grid.css('min-height', '');
        _screenshots = [];

        if (_pubSub) {
            _pubSub.Unsubscribe('screenshotWritten');
        }

        _pubSub = null;
        _tooltips = null;
        _gameKey = null;
        _compression = null;
        _media = null;
        UpdateScreenshotLookToggle();
        PublishScreenshotCatalogChanged();
    };

    this.OnOpen = function(callback) {

        //TODO: show different messages
        UpdateScreenshotKeyLabel();
        UpdateScreenshotLookToggle();
        ApplyScreenshotLookMode();
        (_grid.children().length > 0) ? ToggleEmptyList(false) : ToggleEmptyList(true);
        callback(true);
        ScheduleGridLayout('screenshots slider open');
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    var ScheduleGridLayout = function(reason) {

        var delays = [0, 50, 150, 300, 650, 1100];
        var i;

        for (i = 0; i < delays.length; i++) {
            setTimeout(function() {
                LayoutGrid(reason);
            }, delays[i]);
        }
    };

    var LayoutGrid = function(reason) {

        if (!_grid || !_grid.length) {
            return;
        }

        try {
            if ($.fn && $.fn.isotope && _grid.data('isotope')) {
                _grid.isotope('layout');
            }
        }
        catch (e) {
        }

        EnsureGridHeight();
    };

    var EnsureGridHeight = function() {

        var requiredHeight = 0;

        if (!_grid || !_grid.length) {
            return;
        }

        _grid.children('.grid-item').each(function() {
            var $item = $(this);
            var top = parseFloat($item.css('top'));

            if (isNaN(top)) {
                top = $item.position().top || 0;
            }

            requiredHeight = Math.max(requiredHeight, top + $item.outerHeight(true));
        });

        if (requiredHeight > 20 && _grid.height() < requiredHeight) {
            _grid.css('min-height', Math.ceil(requiredHeight) + 'px');
        }
    };

    var OnNewScreenshot = function(filename, contents, screenDataUnzipped, system, title) {
        
        //create the grid item
        ToggleEmptyList(false);
        var $griditem = $('<div class="grid-item screenshot-card" />');
        var timestamp = Date.now();
        var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(contents)));
        var src = 'data:image/jpg;base64,' + base64String;
        var screenshot = {
            id: 'screenshot-' + timestamp + '-' + _screenshots.length,
            filename: filename,
            src: src,
            title: title || '',
            system: system || (_gameKey ? _gameKey.system : null),
            gameGk: GetGameKeyId(_gameKey),
            ts: timestamp
        };

        _screenshots.push(screenshot);
        $griditem.data('ts', timestamp).attr('data-screenshot-id', screenshot.id).attr('data-game-gk', screenshot.gameGk || '');

        var $img = $('<img class="close" />');
        var revealAndLayout = function() {
            $img.removeClass('close');
            ScheduleGridLayout('new screenshot image ready');
        };
        var $media = $('<div class="screenshot-card-media" />');
        var $actions = $('<div class="screenshot-card-actions" />');
        var $download = $('<button type="button" class="slider-panel-button screenshot-download">Download</button>');
        var $useScreenshot = BuildContributionButton('Use as Screenshot', false, $griditem, base64String);
        var $useTitleScreen = BuildContributionButton('Use as Title Screen', true, $griditem, base64String);
        var $status = $('<div class="screenshot-contribute-status" aria-live="polite" />');

        $img.on('load', function() {
            revealAndLayout();
        });
        $img.attr('src', src);
        $img.attr('data-original-src', src);
        $img.attr('alt', 'Captured screenshot' + (title ? ' for ' + title : ''));
        $img.on('click', function(e) {
            ImageDownload(e, filename);
        });

        $download.on('click', function() {
            DownloadImage($img.get(0), filename);
        });

        $actions.append($download);
        $actions.append($useScreenshot);
        $actions.append($useTitleScreen);
        $actions.append($status);

        $media.append($img);
        $griditem.append($media);
        $griditem.append($actions);
        
        if ($.fn && $.fn.imagesLoaded) {
            $img.imagesLoaded().progress(function(imgLoad, image) {
                revealAndLayout();
            });
        }

        if ($img[0] && $img[0].complete) {
            revealAndLayout();
        }

        _grid.isotope('insert', $griditem);

        _grid.isotope({
            sortBy: 'ts',
            sortAscending: false,
        });

        UpdateScreenshotLookToggle();
        ApplyScreenshotLookMode();
        PublishScreenshotCatalogChanged();

        //open myself
        Open();
        ScheduleGridLayout('new screenshot inserted');
    };

    var BuildContributionButton = function(label, isTitleScreen, $griditem, contents) {

        var $button = $('<button type="button" class="slider-panel-button screenshot-contribute" />').text(label);

        $button.on('click', function() {
            SetContributionState($griditem, 'Sending contribution...', true);
            Contribute(isTitleScreen, contents, function(status) {
                var success = status >= 200 && status < 400;
                var message = success ? 'Contribution sent. Thank you!' : 'Contribution submitted.';
                SetContributionState($griditem, message, true);
            });
        });

        return $button;
    };

    var SetContributionState = function($griditem, message, disabled) {

        $griditem.find('.screenshot-contribute').prop('disabled', disabled).toggleClass('disabled', disabled);
        $griditem.find('.screenshot-contribute-status').text(message || '');
        ScheduleGridLayout('screenshot contribution state updated');
    };

    var Contribute = function(isTitleScreen, contents, callback) {

        //compress data stream
        var data = _compression.Compress.json({
            contents: contents,
            gameKey: _gameKey
        });

        var url = isTitleScreen ? _config.paths.contributetitle : _config.paths.contributescreen;

        $.ajax({
            url: url,
            type: 'POST',
            data: {
                'cxhr': data 
            },
            complete: function(xhr, textStatus) {

                //delete the cached image to pull the just contributed one
                _media.ExpireImageCache(_gameKey);

                callback(xhr.status);
            }
        });
    };

    var ImageDownload = function(e, filename) {

        DownloadImage(e.currentTarget, filename);
    };

    var DownloadImage = function(img, filename) {

        var link = document.createElement('a');
        var src = $(img).attr('data-original-src') || img.src;
        link.setAttribute('href', src);
        link.setAttribute('download', filename);
        link.setAttribute('target', '_blank');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    var ToggleEmptyList = function(isEmpty) {
        if (isEmpty) {
            $panel.find('.havescreens').hide();
            $panel.find('.noscreens').show();
        }
        else {
            $panel.find('.havescreens').show();
            $panel.find('.noscreens').hide();
        }
    };

    var UpdateScreenshotKeyLabel = function() {

        $panel.find('.screenshot-key').text(GetScreenshotKeyLabel());
    };

    var GetScreenshotKeyLabel = function() {

        var effectiveRetroArchConfig = BuildEffectiveRetroArchConfig();
        var key = effectiveRetroArchConfig.input_screenshot || 't';

        return FormatKeyboardKey(key) || 'T';
    };

    var BuildEffectiveRetroArchConfig = function() {

        var result = {};
        var systemDetails = GetSystemDetails(_gameKey ? _gameKey.system : null) || {};
        var extension = systemDetails.emuextention || '1.6.9-stable';

        MergeRetroArchConfig(result, '1.6.9-stable');

        if (extension !== '1.6.9-stable') {
            MergeRetroArchConfig(result, extension);
        }

        if (systemDetails.retroarch) {
            MergeObject(result, systemDetails.retroarch);
        }

        return result;
    };

    var MergeRetroArchConfig = function(target, version) {

        if (_config.retroarch && _config.retroarch[version] && _config.retroarch[version].config) {
            MergeObject(target, _config.retroarch[version].config);
        }
    };

    var MergeObject = function(target, source) {

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };

    var FormatKeyboardKey = function(rawAssignment) {

        var value;
        var keyLabels = {
            space: 'Space',
            enter: 'Enter',
            return: 'Enter',
            escape: 'Esc',
            esc: 'Esc',
            shift: 'Shift',
            lshift: 'Left Shift',
            rshift: 'Right Shift',
            ctrl: 'Ctrl',
            lctrl: 'Left Ctrl',
            rctrl: 'Right Ctrl',
            alt: 'Alt',
            lalt: 'Left Alt',
            ralt: 'Right Alt',
            up: 'Up',
            down: 'Down',
            left: 'Left',
            right: 'Right',
            leftbracket: '[',
            rightbracket: ']',
            minus: '-',
            equals: '=',
            period: '.',
            comma: ',',
            slash: '/',
            semicolon: ';',
            quote: '\'',
            backslash: '\\',
            tilde: '~',
            backquote: '`',
            pageup: 'Page Up',
            pagedown: 'Page Down',
            print_screen: 'Print Screen'
        };

        if (IsMissingAssignment(rawAssignment)) {
            return null;
        }

        value = String(rawAssignment).replace(/^[\'\"]+|[\'\"]+$/g, '');

        if (IsMissingAssignment(value)) {
            return null;
        }

        if (keyLabels.hasOwnProperty(value.toLowerCase())) {
            return keyLabels[value.toLowerCase()];
        }

        if (/^num\d$/i.test(value)) {
            return value.replace(/^num/i, 'Num ');
        }

        if (/^f\d+$/i.test(value)) {
            return value.toUpperCase();
        }

        if (value.length === 1) {
            return value.toUpperCase();
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    var IsMissingAssignment = function(value) {

        if (value === null || typeof value === 'undefined') {
            return true;
        }

        value = String(value).replace(/^[\'\"]+|[\'\"]+$/g, '');
        value = $.trim(value);

        return value === '' || value.toLowerCase() === 'nul' || value.toLowerCase() === 'null';
    };

    var GetSystemDetails = function(system) {

        if (_config.systemdetails && system && _config.systemdetails[system]) {
            return _config.systemdetails[system];
        }

        return null;
    };
    
    var GetGameKeyId = function(gameKey) {

        return gameKey && gameKey.gk ? String(gameKey.gk) : '';
    };

    var GetScreenshotsForGame = function(gameKey) {

        var key = GetGameKeyId(gameKey || _gameKey);
        var results = [];
        var i;

        for (i = 0; i < _screenshots.length; i++) {
            if (!key || _screenshots[i].gameGk === key) {
                results.push($.extend({}, _screenshots[i]));
            }
        }

        return results;
    };

    var GetLatestScreenshot = function(gameKey) {

        var screenshots = GetScreenshotsForGame(gameKey);
        var latest = null;
        var i;

        for (i = 0; i < screenshots.length; i++) {
            if (!latest || screenshots[i].ts > latest.ts) {
                latest = screenshots[i];
            }
        }

        return latest;
    };

    var PublishScreenshotCatalogChanged = function() {

        $(document).trigger(_screenshotChangedEvent, [{
            gameKey: _gameKey,
            screenshots: GetScreenshotsForGame(_gameKey)
        }]);
    };

    var GetCurrentVisualStyle = function() {

        var style = window.cesCurrentVisualStyle || null;
        var key = GetGameKeyId(_gameKey);

        if (!key) {
            return null;
        }

        if (!style) {
            return null;
        }

        if (key && style.gameGk && style.gameGk !== key) {
            return null;
        }

        return style;
    };

    var IsPixelPerfectSelection = function(selection) {

        return selection === null || typeof selection === 'undefined' || String(selection) === '';
    };

    var HasCurrentVisualStyle = function(style) {

        return !!(style && !IsPixelPerfectSelection(style.selection));
    };

    var BuildVisualStyleKey = function(style) {

        if (!style) {
            return '';
        }

        return [style.selection || '', style.shader || '', style.glslp || '', style.name || ''].join('|');
    };

    var BindScreenshotLookToggle = function() {

        var $toggle = $panel.find('#screenshotsApplyLookToggle');

        if (!$toggle.length) {
            return;
        }

        $toggle.off('change.cesScreenshotsLook').on('change.cesScreenshotsLook', function() {
            _applyCurrentLookToScreenshots = $(this).prop('checked') === true;
            UpdateScreenshotLookToggle();
            ApplyScreenshotLookMode();
        });
    };

    var UpdateScreenshotLookToggle = function() {

        var $toggle = $panel.find('#screenshotsApplyLookToggle');
        var $control = $panel.find('.screenshots-look-toggle');
        var $status = $panel.find('.screenshots-look-toggle-status');
        var style = GetCurrentVisualStyle();
        var hasStyle = HasCurrentVisualStyle(style);

        if (!$toggle.length) {
            return;
        }

        if (!hasStyle) {
            _applyCurrentLookToScreenshots = false;
            $toggle.prop('checked', false).prop('disabled', true);
            $control.addClass('disabled');
            $status.text('Pixel Perfect: screenshots are shown as captured.');
            return;
        }

        $toggle.prop('disabled', false).prop('checked', _applyCurrentLookToScreenshots);
        $control.removeClass('disabled');

        if (_applyCurrentLookToScreenshots) {
            $status.text('Showing ' + (style.name || 'the current look') + ' on screenshots.');
        }
        else {
            $status.text('Screenshots are shown as captured.');
        }
    };

    var ApplyScreenshotLookMode = function() {

        var style = GetCurrentVisualStyle();
        var shouldApply = _applyCurrentLookToScreenshots && HasCurrentVisualStyle(style);

        if (!_grid || !_grid.length) {
            return;
        }

        _grid.children('.screenshot-card').each(function() {
            var $card = $(this);

            if (shouldApply) {
                ApplyLookToScreenshotCard($card, style);
            }
            else {
                RestoreScreenshotCard($card);
            }
        });

        ScheduleGridLayout('screenshot look mode updated');
    };

    var ApplyLookToScreenshotCard = function($card, style) {

        var $img = $card.find('img').first();
        var originalSrc = $img.attr('data-original-src') || $img.attr('src');
        var lookKey = BuildVisualStyleKey(style) + '|' + originalSrc;
        var token;

        if (!$img.length || !originalSrc) {
            return;
        }

        if (!$img.attr('data-original-src')) {
            $img.attr('data-original-src', originalSrc);
        }

        if ($card.data('screenshotLookKey') === lookKey && $img.attr('data-dynamic-preview') === 'true') {
            return;
        }

        CancelScreenshotLookRender($card);
        $card.data('screenshotLookKey', lookKey);

        if (!window.cesShaderPreviewBridge || typeof window.cesShaderPreviewBridge.ApplyToImage !== 'function' || !style.glslp) {
            $img.attr('src', originalSrc);
            $card.attr('data-current-look-applied', 'unavailable');
            return;
        }

        $card.addClass('screenshot-card-look-pending').attr('data-current-look-applied', 'pending');
        $img.attr('src', originalSrc).removeAttr('data-dynamic-preview data-dynamic-preview-internal-size');

        token = window.cesShaderPreviewBridge.ApplyToImage({
            sourceSrc: originalSrc,
            targetImage: $img.get(0),
            target: $card.get(0),
            shader: style.shader || style.selection || '',
            glslp: style.glslp || '',
            title: style.name || 'Current look',
            preserveImageAspect: true,
            onComplete: function(success) {
                if (token && token.active === false) {
                    return;
                }

                $card.removeClass('screenshot-card-look-pending').attr('data-current-look-applied', success ? 'true' : 'unavailable');
                ScheduleGridLayout('screenshot look render complete');
            }
        });

        $card.data('screenshotLookRenderToken', token);
    };

    var RestoreScreenshotCard = function($card) {

        var $img = $card.find('img').first();
        var originalSrc = $img.attr('data-original-src');

        CancelScreenshotLookRender($card);
        $card.removeClass('screenshot-card-look-pending').removeAttr('data-current-look-applied').removeData('screenshotLookKey');

        if (originalSrc && $img.attr('src') !== originalSrc) {
            $img.attr('src', originalSrc);
        }

        $img.removeAttr('data-dynamic-preview data-dynamic-preview-internal-size');
    };

    var CancelScreenshotLookRender = function($card) {

        var token = $card.data('screenshotLookRenderToken');

        if (token) {
            token.active = false;
        }

        $card.removeData('screenshotLookRenderToken');
    };

    var CancelAllScreenshotLookRenders = function() {

        if (!_grid || !_grid.length) {
            return;
        }

        _grid.children('.screenshot-card').each(function() {
            CancelScreenshotLookRender($(this));
        });
    };

    var ExposeCapturedScreenshots = function() {

        window.cesCapturedScreenshots = {
            GetAll: function(gameKey) {
                return GetScreenshotsForGame(gameKey);
            },
            GetLatest: function(gameKey) {
                return GetLatestScreenshot(gameKey);
            }
        };
    };

    var BindVisualStyleUpdates = function() {

        $(document).off(_visualStyleChangedEvent + '.cesSlidersScreenshots').on(_visualStyleChangedEvent + '.cesSlidersScreenshots', function() {
            UpdateScreenshotLookToggle();
            ApplyScreenshotLookMode();
        });
    };

    var Constructor = (function() {

        ExposeCapturedScreenshots();
        BindScreenshotLookToggle();
        BindVisualStyleUpdates();

        _grid = $('#screenshotsGrid').isotope({
            layoutMode: 'masonry',
            masonry: {
                horizontalOrder: true
            },
            itemSelector: '.grid-item',
            getSortData: {
                ts: function(item) {
                    return $(item).data('ts');
                }
            }
        });

    })();
});
