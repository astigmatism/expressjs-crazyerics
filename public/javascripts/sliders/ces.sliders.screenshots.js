var cesSlidersScreenshots = (function(_config, $li, $panel, Open) {

    var self = this;
    var _grid;
    var _parent;
    var _pubSub;
    var _tooltips;
    var _gameKey;
    var _compression;

    this.Activate = function(gameKey, _PubSub, _Tooltips, _Compression) {
        
        _grid.isotope('remove', _grid.children()); //clear on activation (sanity)
        _pubSub = _PubSub
        _tooltips = _Tooltips;
        _gameKey = gameKey;
        _compression = _Compression;
        _pubSub.Subscribe('screenshotWritten', self, OnNewScreenshot);
    };

    this.Deactivate = function() {

        _grid.isotope('remove', _grid.children()); //clear on deactivation
        _pubSub.Unsubscribe('screenshotWritten');
    };

    this.OnOpen = function(callback) {

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    var OnNewScreenshot = function(filename, contents, screenDataUnzipped, system, title) {
        
        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        $griditem.data('ts', Date.now());

        

        var $img = $('<img class="close" />');
        var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(contents)));
        $img.attr('src', 'data:image/jpg;base64,' + base64String);
        $img.on('click', function(e) {
            ImageDownload(e, filename);
        });

        var $tooltipContent = $('<div class="screenshot-tooltip" />');
        $tooltipContent = $('<div class="tooltiptitle">Select an Option (This can only be done once):</div>');

        //title screen link
        $contributeTitleScreen = $('<div class="clickable">Contribute as Title Screen</div>');
        $contributeTitleScreen.on('click', function() {
            _tooltips.Destroy($griditem); //remove tooltip after they commit to contribution
            Contribute(true, base64String, function() {
                
            });
        });
        $tooltipContent.append($contributeTitleScreen);

        //screenshot link
        $contributeScreenshot = $('<div class="clickable">Contribute as Screenshot</div>');
        $contributeScreenshot.on('click', function() {
            _tooltips.Destroy($griditem); //remove tooltip after they commit to contribution
            Contribute(false, base64String, function() {
                
            });
        });
        $tooltipContent.append($contributeScreenshot);

        _tooltips.SingleHTML($griditem, $tooltipContent);
        
        $griditem.append($img); //add all visual content from gamelink to grid
        
        $img.imagesLoaded().progress(function(imgLoad, image) {
            $img.removeClass('close'); //remove close on parent to reveal image
            _grid.isotope('layout');
        });

        _grid.isotope('insert', $griditem);

        _grid.isotope({
            sortBy: 'ts',
            sortAscending: false,
        });

        //open myself
        Open();
    };

    var Contribute = function(isTitleScreen, contents, callback) {

        //compress data stream
        data = _compression.Compress.json({
            ts: isTitleScreen,
            contents: contents,
            gameKey: _gameKey
        });

        $.ajax({
            url: _config.paths.screenupload,
            type: 'POST',
            data: {
                'cxhr': data 
            },
            complete: function(xhr, textStatus) {
                if (xhr.status != 200) {
                    
                }
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