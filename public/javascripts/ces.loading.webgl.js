var cesLoadingWebGL = (function(_recipe, _Compression, _PubSub, _texturePath, $wrapper, box, texture, system) {
    
    //private members
    var _self = this;
    var _percOfImageToSample = 0.05;
    var _percOfImageForAction = 0.5;
    var _camera;
    var _mesh;
    var _scene;
    var _renderer;
    var _width = $wrapper.parent().width();
    var _height = $wrapper.parent().height();

    var BuildMaterials = function(actionShot, texture, rgbDominant, callback) {

        var map = {};
        var rgb;

        if (rgbDominant && rgbDominant.length) {
            rgb = 'rgb(' + rgbDominant[0] + ', ' + rgbDominant[1] + ', ' + rgbDominant[2] + ')';
        }

        //first, create the default texture. it is always the dominant color or black if no color data passed
        if (rgb) {
            map.default = new THREE.MeshBasicMaterial( { color: rgb } );
        }
        else {
            map.default = new THREE.MeshBasicMaterial( { color: 'rgb(0,0,0)' } );
        }

        //front texture is not configurable, is always box art
        map.front = new THREE.MeshBasicMaterial({ 
            map: new THREE.TextureLoader().load(texture.src)
        });

        var promises = [];
        
        for (var face in _recipe.faces) {
            
            promises.push((function(face) {
                
                var d = $.Deferred();
                var defaultTexture = _texturePath + '/' + system + '/' + face + '.png';

                //default texture
                if (_recipe.faces[face] === "texture") {
                    map[face] = new THREE.MeshBasicMaterial({ 
                        map: new THREE.TextureLoader().load(defaultTexture)
                    });
                    return d.resolve();
                }

                //custom texture
                if (_recipe.faces[face].texture) {
                    map[face] = new THREE.MeshBasicMaterial({ 
                        map: new THREE.TextureLoader().load(_texturePath + _recipe.faces[face].texture)
                    });
                    return d.resolve();
                }
    
                if (_recipe.faces[face].color) {
                    map[face] = new THREE.MeshBasicMaterial( { color: _recipe.faces[face].color } );
                    return d.resolve();
                }
                
                //action shot uses default texture merged with action shot
                if (_recipe.faces[face] === "action") {

                    //generate new image with color and texture
                    MergeImage(actionShot, defaultTexture, function(combineSrc) {
                        map[face] = new THREE.MeshBasicMaterial({ 
                            map: new THREE.TextureLoader().load(combineSrc)
                        });
                        return d.resolve();
                    });
                }

                //use default texture and color
                if (_recipe.faces[face] === "combine") {

                    //generate new image with color and texture
                    MergeColor(defaultTexture, rgb, function(combineSrc) {
                        map[face] = new THREE.MeshBasicMaterial({ 
                            map: new THREE.TextureLoader().load(combineSrc)
                        });
                        return d.resolve();
                    });
                }

                if (_recipe.faces[face].combine) {
    
                    var combineColor = rgb;
                    var textureSrc = defaultTexture;
                    
                    //does combine have a color value?
                    if (_recipe.faces[face].combine.color) {
                        combineColor = _recipe.faces[face].combine.color;
                    }
                    
                    //does combine have a texture value
                    if (_recipe.faces[face].combine.texture) {
                        var textureSrc = _texturePath + _recipe.faces[face].combine.texture;
                    }
    
                    //generate new image with color and texture
                    MergeColor(textureSrc, combineColor, function(combineSrc) {
                        map[face] = new THREE.MeshBasicMaterial({ 
                            map: new THREE.TextureLoader().load(combineSrc)
                        });
                        return d.resolve();
                    });
                }
                return d.promise();

            })(face));
        }
        
        $.when.apply(null, promises).done(function(a){
            callback(map);
        });

    };

    var BuildLayout = function(width, height, materialMap, colors) {
        
        var materials = [
            materialMap.left || materialMap.default,        // Left side
            materialMap.right || materialMap.default,       // Right side
            materialMap.top || materialMap.default,         // Top side
            materialMap.bottom || materialMap.default,      // Bottom side
            materialMap.front,       // Front side
            materialMap.back || materialMap.default         // Back side
        ];
        
        var geometry = new THREE.BoxBufferGeometry( width, height, width * 0.2);

        _scene = new THREE.Scene();
        _mesh = new THREE.Mesh( geometry, materials);
        _camera = new THREE.PerspectiveCamera( 70, _width / _height, 1, 1000 ); //fov, aspect, near, far
        _camera.position.z = 700;

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
        };
        img.src = src;
    };

    var MergeColor = function(imageSrc, rgbColor, callback) {
        
        var image = new Image();
        image.src = imageSrc;
        image.crossOrigin = 'anonymous';
        image.onload = function() {
            
            var w = image.width;
            var h = image.height;
            var c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            var ctx = c.getContext("2d");
            ctx.fillStyle = rgbColor;
            ctx.fillRect(0, 0, image.width, image.height);
        
            ctx.drawImage(image, 0, 0, w, h);
            //imageObj2.src = '/images/boxes/front.jpg';
            //imageObj2.onload = function() {
            //ctx.drawImage(imageObj2, 15, 85, 300, 300);
            var img = c.toDataURL("image/png");
            //document.write('<img src="' + img + '" width="' + image.width + '" height="' + image.height + '"/>');
            callback(img);
            //}
        };
    };

    var MergeImage = function(imageSrc, imageSrc2, callback) {
        
        var image = new Image();
        image.src = imageSrc;
        image.crossOrigin = 'anonymous';
        image.onload = function() {
            
            var w = image.width;
            var h = image.height;
            var c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            var ctx = c.getContext("2d");
            ctx.fillRect(0, 0, image.width, image.height);
        
            ctx.drawImage(image, 0, 0, w, h);
            
            var image2 = new Image();
            image2.src = imageSrc2;
            image2.crossOrigin = 'anonymous';
            image2.onload = function() {

                ctx.drawImage(image2, 0, 0, w, h);

                var img = c.toDataURL("image/png");
                //document.write('<img src="' + img + '" width="' + w + '" height="' + h + '"/>');
                callback(img);
            };
        };
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
        sx = 0;
        sy = 0;
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
        sx = 0;
        sy = 0;
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
        // var img = new Image();
        // img.crossOrigin = 'anonymous';
        img = canvas.toDataURL("image/png");
        
        // var testImage = new Image();
        // testImage.onload = function() {
        //     document.write('<img src="' + img + '" width="' + this.width + '" height="' + this.height + '"/>');
        // };
        // testImage.src = img;
        
        canvas = null;
        canvas2 = null;

        return img;
    };

    var CreateActionShot = function(loadedImage, callback) {

        var w = loadedImage.width;
        var h = loadedImage.height;

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        var sx, sy, swidth, sheight, x, y, width, height;

        sx = w * (_percOfImageForAction / 2);
        sy = h * (_percOfImageForAction / 2);
        swidth = w * _percOfImageForAction;
        sheight = h * _percOfImageForAction;
        x = 0;
        y = 0;
        width = w;
        height = h;

        ctx.drawImage(loadedImage, sx, sy, swidth, sheight, x, y, width, height);
        var img = canvas.toDataURL("image/png");

        // var testImage = new Image();
        // testImage.onload = function() {
        //     document.write('<img src="' + img + '" width="' + this.width + '" height="' + this.height + '"/>');
        // };
        // testImage.src = img;

        return img;
    };

    var Animate = function() {
        requestAnimationFrame( Animate );
        //_mesh.rotation.x -= 0.09;
        _mesh.rotation.y += 0.09;
        _renderer.render( _scene, _camera );
    };

    var Constructor = (function() {

        $wrapper.empty();

        box.onload = function() {
            
            var loadedBox = this;
            var crossSectionSrc = CreateBoxEdgeCrossection(loadedBox);
            var actionShot = CreateActionShot(loadedBox);

            GetDominantColor(crossSectionSrc, function(dominantColors) {
                BuildMaterials(actionShot, texture, dominantColors, function(materialMap) {

                    BuildLayout(loadedBox.width, loadedBox.height, materialMap, function() {
                    
                    });
                
                    Animate();
                });
            });
        };

        return this;
    })();
});