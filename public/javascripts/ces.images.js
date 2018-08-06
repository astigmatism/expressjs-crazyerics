/**
 * Image loading helper class. Since we now have unique methods of obtaining images from the CDN,
 * this class specializes in understanding the correct methods for obtaining them 
 */
var cesImages = (function(_config, _Compression, _PubSub, _Tooltips, _Preferences, _Dialogs, $gamepad0, $gamepad1) {

    // private members
    var self = this;
    var clientImageCache = {}; //keyed by gameKey.gk along with width/height requirements
    
    //public

    /**
     * For obtaining title screens from the CDN and inserting (or not if error) them into the provided wrapper
     * @param {*} $wrapper jQuery 
     * @param {*} gameKey cesGameKey
     */
    this.TitleScreen = function($wrapper, gameKey, callback, opt_width, opt_height) {

        Get(_config.paths.titlescreens, gameKey, function(status, content) {
            
            if (content) {
                $wrapper.imagesLoaded()
                    .done(function() {
                        return callback(true, status);
                    });
            
                var $img = $('<img src="data:image/jpg;base64,' + content + '" />');
                $wrapper.empty().append($img); //empty the wrapper as a sanity check
            }
            else {
                return callback(false, status);
            }

        }, opt_width, opt_height)
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

    var Get = function(location, gameKey, callback, opt_width, opt_height, opt_base64) {

        //first check client cache for this image to prevent going over the network
        var cacheKey = location + gameKey.gk + opt_width + opt_height;

        if (cacheKey in clientImageCache) {
            return clientImageCache[cacheKey];
        }

        //build optional data
        var data = {};

        if (opt_width) {
            data.w = opt_width;
        }
        if (opt_height) {
            data.h = opt_height;
        }
        if (opt_base64) {
            data.b = 1;
        }

        //network request to CDN to obtain image
        $.ajax({
            url: location + '/' + encodeURIComponent(gameKey.gk),
            type: 'GET',
            data: data,
            crossDomain: true,
            cache: false,
            complete: function(response) {
            
                //the response code gives us the best impression of success and image source on the CDN
                if (response.responseText) {

                    clientImageCache[gameKey.gk + opt_width + opt_height] = response.responseText; //client cache response
                    return callback(response.status, response.responseText);
                }
                //if no valid image data was returned, simply return
                else {
                    return callback(response.status);
                }
            }
        });
    }

    return this;
});
