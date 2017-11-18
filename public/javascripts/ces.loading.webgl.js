var cesLoadingWebGL = (function(_config, _Compression, _PubSub, $wrapper, box) {
    
    //private members
    var _self = this;
    var _percOfImageToSample = 0.2;

    var GetDominantColor = function(src, callback) {
        
        var img = new Image();
        img.onload = function() {
            var colorThief = new ColorThief();
            var result = colorThief.getColor(img);
            callback(result);
        }
        img.src = src;
    };

    var CreateBoxEdgeCrossection = function(img, callback) {

        img.onload = function() {
            
            var w = this.width;
            var h = this.height;

            //ok, so we want to take four samples of each side and create a new image with the results

            var cropWidth = w > h ? h : w; //take the lessor of the two
            var cropHeight = (h > w ? w : h) * _percOfImageToSample;

            //the canvas needs to be the height of 4 samples (top, bottom, left, right)
            var canvas = document.createElement('canvas');
            canvas.width = cropWidth;
            canvas.height = cropHeight * 4;
            var ctx = canvas.getContext("2d");
            var sx, sy, swidth, sheight, x, y, width, height;
            
            //the left and right crops are drawn onto a rotated canvas to be merged with the original later
            var canvas2 = document.createElement('canvas');
            canvas2.width = cropWidth;
            canvas2.height = h; //cropHeight *2;
            var ctx2 = canvas2.getContext("2d");
            ctx2.rotate(-90 * Math.PI/180);

            //top
            sx = 0
            sy = 0
            swidth = cropWidth;
            sheight = cropHeight;
            x = 0;
            y = 0;
            width = cropWidth;
            height = cropHeight;

            ctx.drawImage(this, sx, sy, swidth, sheight, x, y, width, height);
            //var img = canvas.toDataURL("image/png");
            //document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');

            //bottom
            sx = w - cropWidth;
            sy = h - cropHeight;
            swidth = cropWidth;
            sheight = cropHeight;
            x = 0;
            y = cropHeight;
            width = cropWidth;
            height = cropHeight;

            ctx.drawImage(this, sx, sy, swidth, sheight, x, y, width, height);
            // var img = canvas.toDataURL("image/png");
            // document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');

            //left
            sx = 0
            sy = 0
            swidth = cropHeight;
            sheight = cropWidth;
            x = -cropHeight * 2;
            //x = 0;
            y = 0;
            width = cropHeight;
            height = cropWidth;

            ctx2.drawImage(this, sx, sy, swidth, sheight, x, y, width, height);
            //var img = canvas2.toDataURL("image/png");
            //document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');
            

            //right
            sx = w - cropHeight;
            sy = h - cropWidth;
            swidth = cropHeight;
            sheight = cropWidth;
            x = -cropHeight;
            //x = cropHeight; //use this value for testing without rotate
            y = 0;
            width = cropHeight;
            height = cropWidth;

            ctx2.drawImage(this, sx, sy, swidth, sheight, x, y, width, height);
            var leftandright = canvas2.toDataURL("image/png");
            document.write('<img src="' + leftandright + '" width="' + w + '" height="' + h + '"/>');
            return;

            //merge left and right with original
            x = 0;
            y = cropHeight * 2;
            width = cropWidth;
            height = cropHeight * 2;

            ctx.drawImage(canvas2, x, y, width, height);
            var img = canvas.toDataURL("image/png");
            //document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');

            callback(img);
        };
    };


    var Constructor = (function() {

        CreateBoxEdgeCrossection(box, function(img) {
            GetDominantColor(img, function(result) {
                console.log(result);
            });
        });

        return this;
    })();
});