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
        _pubSub.Subscribe('screenshotWritten', self, OnNewScreenshot);
    };

    this.Deactivate = function() {

        _grid.isotope('remove', _grid.children()); //clear on deactivation
        _grid.css('min-height', '');
        _pubSub.Unsubscribe('screenshotWritten');
    };

    this.OnOpen = function(callback) {

        //TODO: show different messages
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
        var $griditem = $('<div class="grid-item" />');

        $griditem.data('ts', Date.now());

        var $img = $('<img class="close" />');
        var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(contents)));
        var revealAndLayout = function() {
            $img.removeClass('close');
            ScheduleGridLayout('new screenshot image ready');
        };

        $img.on('load', function() {
            revealAndLayout();
        });
        $img.attr('src', 'data:image/jpg;base64,' + base64String);
        $img.on('click', function(e) {
            ImageDownload(e, filename);
        });

        var $tooltipContent = $('<div class="screenshot-tooltip" />');
        $tooltipContent = $('<div class="tooltiptitle">Would you like to contribute back to Crazyerics? You can perform this step only once per screenshot.</div>');

        //title screen link
        $contributeTitleScreen = $('<div>Contribute as this game\'s title screen</div>');
        $contributeTitleScreen.on('click', function() {
            _tooltips.Destroy($griditem); //remove tooltip after they commit to contribution
            Contribute(true, base64String, function(status) {
                
            });
        });
        $tooltipContent.append($contributeTitleScreen);

        //screenshot link
        $contributeScreenshot = $('<div>Contribute as game screenshot</div>');
        $contributeScreenshot.on('click', function() {
            _tooltips.Destroy($griditem); //remove tooltip after they commit to contribution
            Contribute(false, base64String, function(status) {
                
            });
        });
        $tooltipContent.append($contributeScreenshot);

        _tooltips.SingleHTML($griditem, $tooltipContent);
        
        $griditem.append($img); //add all visual content from gamelink to grid
        
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

    var Contribute = function(isTitleScreen, contents, callback) {

        //compress data stream
        data = _compression.Compress.json({
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

        var img = e.currentTarget;

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