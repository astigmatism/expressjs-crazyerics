/**
 * Image loading helper class. Since we now have unique methods of obtaining images from the CDN,
 * this class specializes in understanding the correct methods for obtaining them 
 */
var cesImages = (function(_config) {

    // private members
    var _self = this;
    var clientImageCache = {}; //keyed by gameKey.gk along with width/height requirements
    
    //public

    this.BoxFront = function(gameKey, cdnSizeModifier) {
        var img = new Image();

        img.src = _config.paths.boxfront + '/' + cdnSizeModifier + '/' + encodeURIComponent(gameKey.gk);
        img.crossOrigin = 'anonymous'; //this is necessary when creating a new image from canvas

        return $(img);
    };

    this.$BoxFront = function(gameKey, cdnSizeModifier) {
        return $(_self.BoxFront(gameKey, cdnSizeModifier));
    };

    /**
     * For obtaining title screens from the CDN and inserting (or not if error) them into the provided wrapper
     * @param {*} $wrapper jQuery 
     * @param {*} gameKey cesGameKey
     */
    this.TitleScreen = function($wrapper, gameKey, cdnSizeModifier, callback) {

        Get(_config.paths.title, gameKey, cdnSizeModifier, function(status, content) {
            
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

        });
    };

    /**
     * 
     * @param {*} gameKey 
     * @param {Number} opt_width optional
     * @param {Number} opt_height optional
     */
    this.ExpireImageCache = function(gameKey) {

        /*
        //cache actually appears as such:
        {
            '[some gamekey]': {
                [cdnlocation]: 'response text'
            }
        }
        //this will delete all cached image sizes
        */
        if (gameKey.gk in clientImageCache) {
            delete clientImageCache[gameKey.gk];
        }
    };

    var Get = function(location, gameKey, cdnSizeModifier, callback) {

        //first check client cache for this image to prevent going over the network
        if (gameKey.gk in clientImageCache && cdnSizeModifier in clientImageCache[gameKey.gk]) {
            return callback(200, clientImageCache[gameKey.gk[cdnSizeModifier]]);
        }

        //network request to CDN to obtain image
        $.ajax({
            url: location + '/' + cdnSizeModifier + '/' + encodeURIComponent(gameKey.gk),
            type: 'GET',
            crossDomain: true,
            cache: false,
            complete: function(response) {
            
                //the response code gives us the best impression of success and image source on the CDN
                if (response.status == 200 || response.status == 201) {

                    var cacheObject = clientImageCache[gameKey.gk] || {};
                    cacheObject[cdnSizeModifier] = response.responseText; //client cache response
                    clientImageCache[gameKey.gk] =  cacheObject;
                    return callback(response.status, response.responseText);
                }
                //if no valid image data was returned, simply return
                else {
                    return callback(response.status);
                }
            }
        });
    };

    return this;
});
