var cesSlidersScreenshots = (function(_config, $li, $panel, Open) {

    var self = this;
    var _grid;
    var _parent;
    var _pubSub;

    this.Activate = function(gameKey, _PubSub) {
        
        _grid.isotope('remove', _grid.children()); //clear on activation (sanity)
        _pubSub = _PubSub
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
        $img.attr('src', 'data:image/png;base64,' + base64String);
        
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