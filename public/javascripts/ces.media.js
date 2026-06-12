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
     * For obtaining a title screen data URI from the CDN without inserting it into the DOM.
     * The CDN endpoint returns base64 text, which keeps downstream canvas/WebGL reads same-origin safe.
     * @param {*} gameKey cesGameKey
     * @param {*} cdnSizeModifier CDN size variant or ordered variants, for example d, b, c, or ['d', 'b']
     * @param {*} callback function(success, status, src, content, selectedCdnSizeModifier)
     */
    this.TitleScreenSource = function(gameKey, cdnSizeModifier, callback) {

        var cdnSizeModifiers = NormalizeCdnSizeModifiers(cdnSizeModifier);
        var lastStatus = null;
        var index = 0;

        var tryNext = function() {

            var currentCdnSizeModifier = cdnSizeModifiers[index];
            index++;

            if (!currentCdnSizeModifier) {
                return callback(false, lastStatus);
            }

            GetScreenshot('title', gameKey, currentCdnSizeModifier, function(status, content) {

                lastStatus = status;

                if (content) {
                    return callback(true, status, 'data:image/jpg;base64,' + content, content, currentCdnSizeModifier);
                }

                return tryNext();
            });
        };

        tryNext();
    };

    /**
     * For obtaining title screens from the CDN and inserting (or not if error) them into the provided wrapper
     * @param {*} $wrapper jQuery
     * @param {*} gameKey cesGameKey
     */
    this.TitleScreen = function($wrapper, gameKey, cdnSizeModifier, callback) {

        _self.TitleScreenSource(gameKey, cdnSizeModifier, function(success, status, src) {

            if (success && src) {

                var $img = $('<img />').attr('src', src);

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

    this.Video = function($wrapper, type, gameKey, callback, opt_width, opt_height, opt_error) {

        var videoLoadingStart = Date.now();
        var finished = false;

        var $video = $('<video />', {
            src: _config.paths.video + '/' + type + '/' + encodeURIComponent(gameKey.gk),
            type: 'video/mp4',
            controls: false,
            autoplay: false,
            preload: 'auto',
            width: opt_width || $wrapper.width(),
            height: opt_height || $wrapper.height()
        });

        var fail = function(e) {

            if (finished) {
                return;
            }

            finished = true;
            _Logging.Console('ces.media', 'video failed to load for: ' + gameKey.gk);

            if (opt_error) {
                return opt_error(e);
            }
        };

        //callback on loaded
        $video.on('loadeddata', function() {

            if (finished) {
                return;
            }

            finished = true;
            var videoLoadingDelay = Math.floor(Date.now() - videoLoadingStart);
            _Logging.Console('ces.media','video loading took: ' + videoLoadingDelay);
            return callback($video, videoLoadingDelay);
        });

        $video.one('error abort', fail);

        try {
            $video.get(0).load();
        }
        catch (err) {
            fail(err);
        }
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

    var NormalizeCdnSizeModifiers = function(cdnSizeModifier) {

        var modifiers = [];
        var seen = {};
        var addModifier = function(modifier) {

            if (!modifier) {
                return;
            }

            modifier = String(modifier);

            if (!seen[modifier]) {
                seen[modifier] = true;
                modifiers.push(modifier);
            }
        };
        var i;

        if (Object.prototype.toString.call(cdnSizeModifier) === '[object Array]') {
            for (i = 0; i < cdnSizeModifier.length; i++) {
                addModifier(cdnSizeModifier[i]);
            }
        }
        else {
            addModifier(cdnSizeModifier);
        }

        if (!modifiers.length) {
            modifiers.push('c');
        }

        return modifiers;
    };

    var GetScreenshot = function(type, gameKey, cdnSizeModifier, callback) {

        var cacheKey = type + ':' + cdnSizeModifier;

        //first check client cache for this image to prevent going over the network
        if (gameKey.gk in clientImageCache && cacheKey in clientImageCache[gameKey.gk]) {
            return callback(200, clientImageCache[gameKey.gk][cacheKey]);
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
                    cacheObject[cacheKey] = response.responseText; //client cache response
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
