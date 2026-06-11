var cesSlidersScreenshots = (function(_config, $li, $panel, Open) {

    var self = this;
    var _grid;
    var _pubSub;
    var _tooltips;
    var _gameKey;
    var _compression;
    var _media;

    this.Activate = function(gameKey, _PubSub, _Tooltips, _Compression, _Media) {
        
        _grid.isotope('remove', _grid.children()); //clear on activation (sanity)
        _grid.css('min-height', '');
        _pubSub = _PubSub;
        _tooltips = _Tooltips;
        _gameKey = gameKey;
        _compression = _Compression;
        _media = _Media;
        UpdateScreenshotKeyLabel();
        _pubSub.Subscribe('screenshotWritten', self, OnNewScreenshot);
    };

    this.Deactivate = function() {

        _grid.isotope('remove', _grid.children()); //clear on deactivation
        _grid.css('min-height', '');

        if (_pubSub) {
            _pubSub.Unsubscribe('screenshotWritten');
        }

        _pubSub = null;
        _tooltips = null;
        _gameKey = null;
        _compression = null;
        _media = null;
    };

    this.OnOpen = function(callback) {

        //TODO: show different messages
        UpdateScreenshotKeyLabel();
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

        $griditem.data('ts', Date.now());

        var $img = $('<img class="close" />');
        var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(contents)));
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
        $img.attr('src', 'data:image/jpg;base64,' + base64String);
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
        link.setAttribute('href', img.src);
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
    
    var Constructor = (function() {

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
