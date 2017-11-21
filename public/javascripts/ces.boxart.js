var cesBoxArt = (function(_config, _Compression) {
    
    //private members
    var _self = this;
    var _nerfImages = false;

    this.Get$ = function(gameKey, size, opt_customErrorhandler) {
        
        var img = document.createElement('img');
        img.src = BuildUrl(gameKey, size);
    
        img.addEventListener('error', function() {
    
            //on error, set a new load listener and load the error image
            this.addEventListener('load', function() {    
                if (this.height) {
                    this.setAttribute('height', this.height + 'px');
                }
                if (opt_customErrorhandler) {
                    opt_customErrorhandler(this);
                }
            });
            this.src = BuildErrorUrl(gameKey, size);
        });
        return $(img);
    };

    this.Get = function(gameKey, size, onImageLoad) {
        var img = new Image();
        img.src = BuildUrl(gameKey, size);
        img.crossOrigin = 'anonymous'; //this is necessary when creating a new image from canvas
        if (onImageLoad) {
            img.onload = function() {
                onImageLoad(this);
            };
        }
        return img;
    };

    var BuildUrl = function(gameKey, size) {

        var title = gameKey.title;
        var system = gameKey.system;

        //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
        title = encodeURIComponent(encodeURIComponent(_Compression.Zip.string(title)));

        var src = _config.boxpath + '/' + system + '/' + _config.systemdetails[system].boxcdnversion + '/' + (title + (_nerfImages ? 'sofawnsay' : '')) + '/' + size + '.jpg?' + Date.now();
        return src;
    };

    var BuildErrorUrl = function(gameKey, size) {
        return _config.imagepath + '/blanks/' + gameKey.system + '_' + size + '.png';
    };
});