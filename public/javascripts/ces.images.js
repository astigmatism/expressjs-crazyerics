/**
 * Image loading helper class. Since we now have unique methods of obtaining images from the CDN,
 * this class specializes in understanding the correct methods for obtaining them 
 */
var cesImages = (function(_config, _Compression, _PubSub, _Tooltips, _Preferences, _Dialogs, $gamepad0, $gamepad1) {

    // private members
    var self = this;
    var titlescreenCache = {}; //keyed by gameKey.gk along with width/height requirements
    
    //public

    /**
     * For obtaining title screens from the CDN and inserting (or not if error) them into the provided wrapper
     * @param {*} $wrapper jQuery 
     * @param {*} gameKey cesGameKey
     */
    this.TitleScreen = function($wrapper, gameKey, callback, opt_width, opt_height) {

        //hide the wrapper until we know we have an image to show
        $wrapper.hide();

        //first check client cache for this image to prevent going over the network
        var cacheKey = gameKey.gk + opt_width + opt_height;
        if (cacheKey in titlescreenCache) {

            InjectBase64Image($wrapper, titlescreenCache[cacheKey], function() {
                $wrapper.show(); //show image wrapper with loaded image
                return callback(true);
            });
            return;
        }

        //network request to CDN to obtain image
        $.ajax({
            url: _config.paths.titlescreens + '/' + encodeURIComponent(gameKey.gk),
            type: 'GET',
            data: {
                w: opt_width,
                h: opt_height
            },
            dataType: 'json',
            crossDomain: true,
            cache: false,
            complete: function(response) {
            
                //the response code gives us the best impression of success
                if (response.status == 200 && response.responseJSON) {

                    InjectBase64Image($wrapper, response.responseJSON, function() {
                        $wrapper.show(); //show image wrapper with loaded image
                        titlescreenCache[gameKey.gk + opt_width + opt_height] = response.responseJSON; //client cache response
                        return callback(true);
                    });
                }
                //if no valid image data was returned, simply return
                else {
                    return callback(false);
                }
            }
        });
    };

    /**
     * 
     * @param {*} gameKey 
     * @param {Number} opt_width optional
     * @param {Number} opt_height optional
     */
    this.ExpireTitleScreen = function(gameKey, opt_width, opt_height) {

        var cacheKey = gameKey.gk + opt_width + opt_height;
        if (cacheKey in titlescreenCache) {
            delete titlescreenCache[cacheKey];
        }
    };

    var InjectBase64Image = function($wrapper, src, callback) {

        $wrapper.imagesLoaded()
            .done(function() {
                return callback();
            });
        
        var $img = $('<img src="data:image/jpg;base64,' + src + '" />');
        $wrapper.empty().append($img); //empty the wrapper as a sanity check
    };

    return this;
});
