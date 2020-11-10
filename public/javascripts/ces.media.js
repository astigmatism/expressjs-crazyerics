/**
 * Image loading helper class. Since we now have unique methods of obtaining images from the CDN,
 * this class specializes in understanding the correct methods for obtaining them 
 */
var cesMedia = (function(_config, _Logging) {

    // private members
    var _self = this;
    var clientImageCache = {}; //keyed by gameKey.gk along with width/height requirements
    
    //public

    this.BoxFront = function(gameKey, cdnSizeModifier) {
        var img = new Image();

        img.src = _self.BoxFrontSrc(gameKey, cdnSizeModifier);
        img.crossOrigin = 'anonymous'; //this is necessary when creating a new image from canvas

        return $(img);
    };

    this.$BoxFront = function(gameKey, cdnSizeModifier) {
        return $(_self.BoxFront(gameKey, cdnSizeModifier));
    };

    this.BoxFrontSrc = function(gameKey, cdnSizeModifier) {
        return _config.paths.box + '/front/' + cdnSizeModifier + '/' + encodeURIComponent(gameKey.gk);
    };

    /**
     * For obtaining title screens from the CDN and inserting (or not if error) them into the provided wrapper
     * @param {*} $wrapper jQuery
     * @param {*} gameKey cesGameKey
     */
    this.TitleScreen = function($wrapper, gameKey, cdnSizeModifier, callback) {

        GetScreenshot('title', gameKey, cdnSizeModifier, function(status, content) {
            
            if (content) {
                
                var $img = $('<img src="data:image/jpg;base64,' + content + '" />');

                 //empty the wrapper as a sanity check
                $wrapper.empty().show().append($img).imagesLoaded()
                    .done(function() {
                        return callback(true, status, $img);
                    });
            }
            else {
                return callback(false, status);
            }

        });
    };

    this.Video = function($wrapper, type, gameKey, callback, opt_width, opt_height) {

        var videoLoadingStart = Date.now();
        var muted = false;

        var $video = $('<video />', {
            src: _config.paths.video + '/' + type + '/' + encodeURIComponent(gameKey.gk),
            type: 'video/mp4',
            controls: false,
            autoplay: false,
            width: opt_width || $wrapper.width(),
            height: opt_height || $wrapper.height()
        });

        //callback on loaded
        $video.on('loadeddata', function() {
            var videoLoadingDelay = Math.floor(Date.now() - videoLoadingStart);
            _Logging.Console('ces.media','video loading took: ' + videoLoadingDelay);
            return callback($video, videoLoadingDelay);
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

    var GetScreenshot = function(type, gameKey, cdnSizeModifier, callback) {

        //first check client cache for this image to prevent going over the network
        if (gameKey.gk in clientImageCache && cdnSizeModifier in clientImageCache[gameKey.gk]) {
            return callback(200, clientImageCache[gameKey.gk][cdnSizeModifier]);
        }

        //network request to CDN to obtain image
        $.ajax({
            url: _config.paths.screen + '/' + type + '/' + cdnSizeModifier + '/' + encodeURIComponent(gameKey.gk),
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
