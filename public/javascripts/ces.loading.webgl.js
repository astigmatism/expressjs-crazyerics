var cesLoadingWebGL = (function(_config, _Compression, _PubSub, $wrapper, box) {
    
    //private members
    var _self = this;
    var _percOfImageToSample = 0.1;
    var _camera;
    var _mesh;
    var _scene;
    var _renderer;
    var _width = $wrapper.parent().width();
    var _height = $wrapper.parent().height();

    var BuildLayout = function(loadedImage, colors) {

        //fov, aspect, near, far
        _camera = new THREE.PerspectiveCamera( 70, _width / _height, 1, 1000 );
        _camera.position.z = 600;

        if (colors && colors.length) {
            var rgb = 'rgb(' + colors[0] + ', ' + colors[1] + ', ' + colors[2] + ')';
        }

        var frontTexture = new THREE.TextureLoader().load(loadedImage.src);
        var backTexture = new THREE.TextureLoader().load( '/images/boxes/back.png' );

        var frontMaterial = new THREE.MeshBasicMaterial( { map: frontTexture } );
        var backMaterial = new THREE.MeshBasicMaterial({ 
            map: backTexture
        });
        var color = new THREE.MeshBasicMaterial( { color: rgb } );
        
        var materials = [
            color,        // Left side
            color,       // Right side
            color,         // Top side
            color,      // Bottom side
            frontMaterial,       // Front side
            backMaterial         // Back side
        ];

        var geometry = new THREE.BoxBufferGeometry( 170, 170 * 1.372, 170 * 0.186 );

        _scene = new THREE.Scene();
        _mesh = new THREE.Mesh( geometry, materials);

        _scene.add( _mesh );
        _renderer = new THREE.WebGLRenderer({ alpha: true });
        //renderer.setPixelRatio( window.devicePixelRatio );
        _renderer.setSize(_width, _height);
        $wrapper.append(_renderer.domElement);
        //
        //window.addEventListener( 'resize', onWindowResize, false );
    };

    var GetDominantColor = function(src, callback) {
        
        var img = new Image();
        img.onload = function() {
            var colorThief = new ColorThief();
            var result = colorThief.getColor(img);
            callback(result);
        }
        img.src = src;
    };

    var CreateBoxEdgeCrossection = function(loadedImage, callback) {
        
        var w = loadedImage.width;
        var h = loadedImage.height;

        //ok, so we want to take four samples of each side and create a new image with the results

        var min = w > h ? h : w; //take the lessor of the two
        var slice = min * _percOfImageToSample;

        //the canvas needs to be the height of 4 samples (top, bottom, left, right)
        var canvas = document.createElement('canvas');
        canvas.width = min;
        canvas.height = slice * 4;
        var ctx = canvas.getContext("2d");
        var sx, sy, swidth, sheight, x, y, width, height;
        
        //the left and right crops are drawn onto a rotated canvas to be merged with the original later
        var canvas2 = document.createElement('canvas');
        canvas2.width = min;
        canvas2.height = slice * 2;
        var ctx2 = canvas2.getContext("2d");
        ctx2.rotate(-90 * Math.PI/180);

        //top
        sx = 0
        sy = 0
        swidth = min;
        sheight = slice;
        x = 0;
        y = 0;
        width = min;
        height = slice;

        ctx.drawImage(loadedImage, sx, sy, swidth, sheight, x, y, width, height);
        //var img = canvas.toDataURL("image/png");
        //document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');
        
        //bottom
        sx = w - min;
        sy = h - slice;
        swidth = min;
        sheight = slice;
        x = 0;
        y = slice;
        width = min;
        height = slice;

        ctx.drawImage(loadedImage, sx, sy, swidth, sheight, x, y, width, height);
        //var img = canvas.toDataURL("image/png");
        //document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');
        //return;

        //left
        sx = 0
        sy = 0
        swidth = slice;
        sheight = min;
        x = -slice * 2;
        //x = 0;
        y = 0;
        width = slice;
        height = min;

        ctx2.drawImage(loadedImage, sx, sy, swidth, sheight, x, y, width, height);
        // var img = canvas2.toDataURL("image/png");
        // document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');
        // return;

        //right
        sx = w - slice;
        sy = h - min;
        swidth = slice;
        sheight = min;
        x = -slice;
        //x = cropHeight; //use this value for testing without rotate
        y = 0;
        width = slice;
        height = min;

        ctx2.drawImage(loadedImage, sx, sy, swidth, sheight, x, y, width, height);
        // var leftandright = canvas2.toDataURL("image/png");
        // document.write('<img src="' + leftandright + '" width="' + min + '" height="' + slice * 2 + '"/>');
        // return;

        //merge left and right with original
        x = 0;
        y = slice * 2;
        width = min;
        height = slice * 2;

        ctx.drawImage(canvas2, x, y, width, height);
        var img = canvas.toDataURL("image/png");
        //document.write('<img src="' + img + '" width="' + img.width + '" height="' + img.height + '"/>');

        callback(img);
    };

    var Animate = function() {
        requestAnimationFrame( Animate );
        //mesh.rotation.x += 0.005;
        _mesh.rotation.y += 0.01;
        _renderer.render( _scene, _camera );
    };

    var Constructor = (function() {

        box.onload = function() {
            var loadedImage = this;
            CreateBoxEdgeCrossection(loadedImage, function(crossSectionSrc) {
                GetDominantColor(crossSectionSrc, function(dominantColors) {
                    BuildLayout(loadedImage, dominantColors, function() {
                        
                    });
                    Animate();
                });
            });
        };

        return this;
    })();
});