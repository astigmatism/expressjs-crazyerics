var cesWebGlParticleAnimation = (function(_Compression, _PubSub, _texturePath, $wrapper, box) {
    
    //private members
    var _self = this;
    var _width = 1;
    var _height = 1;
    var _instances;
    var _animationFrameId = null;
    var _disposed = false;
    var _texture = null;
    var $sizeContainer = $wrapper.parent();

    var container, stats;
    var camera, scene, renderer;

    function getContainerSize() {
        var width = 0;
        var height = 0;
        var wrapperEl = $wrapper[0];
        var sizeEl = $sizeContainer[0];
        var rect;

        // #dialogloadingbackground is hidden before fadeIn starts, so fall back to
        // its parent (#dialogs), which owns the intended loading-background bounds.
        if (wrapperEl && window.getComputedStyle(wrapperEl).display !== 'none') {
            rect = wrapperEl.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }

        if ((!width || !height) && sizeEl) {
            rect = sizeEl.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }

        if (!width || !height) {
            width = $sizeContainer.innerWidth() || $sizeContainer.width() || $wrapper.innerWidth() || $wrapper.width();
            height = $sizeContainer.innerHeight() || $sizeContainer.height() || $wrapper.innerHeight() || $wrapper.height();
        }

        return {
            width: Math.max(1, Math.floor(width || 1)),
            height: Math.max(1, Math.floor(height || 1))
        };
    }

    function setRendererSize(force) {
        var size;

        if (!renderer || !camera) {
            return;
        }

        size = getContainerSize();

        if (!force && size.width === _width && size.height === _height) {
            return;
        }

        _width = size.width;
        _height = size.height;

        camera.aspect = _width / _height;
        camera.updateProjectionMatrix();
        renderer.setSize(_width, _height, false);
    }
    
    function init() {
        //container = document.getElementById( 'container' );
        var initialSize = getContainerSize();

        _width = initialSize.width;
        _height = initialSize.height;

        camera = new THREE.PerspectiveCamera( 50, _width / _height, 1, 10 );
        camera.position.z = 2;
        scene = new THREE.Scene();
        // geometry
        var vector = new THREE.Vector4();
        var triangles = 1;
        _instances = 500;
        var positions = [];
        var offsets = [];
        var colors = [];
        var orientationsStart = [];
        var orientationsEnd = [];
        positions.push( 0.025, -0.025, 0 );
        positions.push( -0.025, 0.025, 0 );
        positions.push( 0, 0, 0.025 );
        // instanced attributes
        for ( var i = 0; i < _instances; i ++ ) {
            // offsets
            offsets.push( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
            // colors
            colors.push( Math.random(), Math.random(), Math.random(), Math.random() );
            // orientation start
            vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
            vector.normalize();
            orientationsStart.push( vector.x, vector.y, vector.z, vector.w );
            // orientation end
            vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
            vector.normalize();
            orientationsEnd.push( vector.x, vector.y, vector.z, vector.w );
        }
        var geometry = new THREE.InstancedBufferGeometry();
        geometry.maxInstancedCount = _instances; // set so its initalized for dat.GUI, will be set in first draw otherwise
        geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
        geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );
        geometry.addAttribute( 'orientationStart', new THREE.InstancedBufferAttribute( new Float32Array( orientationsStart ), 4 ) );
        geometry.addAttribute( 'orientationEnd', new THREE.InstancedBufferAttribute( new Float32Array( orientationsEnd ), 4 ) );
        
        _texture = new THREE.TextureLoader().load( box[0].src );
        
        // material
        var material = new THREE.RawShaderMaterial( {
            uniforms: {
                time: { value: 1.0 },
                sineTime: { value: 1.0 },
                //map: { value: texture }
            },
            vertexShader: vertex,
            fragmentShader: shader,
            side: THREE.DoubleSide,
            transparent: true
        } );
        //
        var mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
        //
        renderer = new THREE.WebGLRenderer({alpha: true});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.domElement.className = 'dialog-loading-background-canvas';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.pointerEvents = 'none';
        setRendererSize(true);
        
        $wrapper.empty();
        $wrapper.append(renderer.domElement);
        //container.appendChild( renderer.domElement );

        if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === null ) {
            document.getElementById( 'notSupported' ).style.display = '';
            return;
        }
        //
        //var gui = new dat.GUI( { width: 350 } );
        //gui.add( geometry, 'maxInstancedCount', 0, instances );
        //
        //stats = new Stats();
        //container.appendChild( stats.dom );
        //
        window.addEventListener( 'resize', onWindowResize, false );
    }
    function onWindowResize( event ) {
        setRendererSize(true);
    }
    //
    function animate() {
        if (_disposed) {
            return;
        }

        _animationFrameId = requestAnimationFrame( animate );
        render();
       // stats.update();
    }
    function render() {
        var time = performance.now();

        if (_disposed || !renderer || !scene || !camera || !scene.children.length) {
            return;
        }

        setRendererSize(false);

        var object = scene.children[ 0 ];
        object.rotation.y = time * 0.0005;
        object.material.uniforms.time.value = time * 0.005;
        object.material.uniforms.sineTime.value = Math.sin( object.material.uniforms.time.value * 0.05 );
        renderer.render( scene, camera );
    }

    function disposeMaterial(material) {
        if (!material) {
            return;
        }

        if (material.map && material.map.dispose) {
            material.map.dispose();
        }

        if (material.dispose) {
            material.dispose();
        }
    }

    this.Dispose = function() {
        var i;
        var object;

        if (_disposed) {
            return;
        }

        _disposed = true;

        if (_animationFrameId !== null) {
            cancelAnimationFrame(_animationFrameId);
            _animationFrameId = null;
        }

        window.removeEventListener( 'resize', onWindowResize, false );

        if (scene) {
            for (i = scene.children.length - 1; i >= 0; i--) {
                object = scene.children[i];

                if (object.geometry && object.geometry.dispose) {
                    object.geometry.dispose();
                }

                if ($.isArray(object.material)) {
                    $.each(object.material, function(index, material) {
                        disposeMaterial(material);
                    });
                }
                else {
                    disposeMaterial(object.material);
                }

                scene.remove(object);
            }
        }

        if (_texture && _texture.dispose) {
            _texture.dispose();
        }

        if (renderer) {
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }

            if (renderer.dispose) {
                renderer.dispose();
            }

            if (renderer.forceContextLoss) {
                renderer.forceContextLoss();
            }
        }

        camera = null;
        scene = null;
        renderer = null;
        _texture = null;
    };

    var vertex = 'precision highp float;uniform float sineTime;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;attribute vec3 position;attribute vec3 offset;attribute vec4 color;attribute vec4 orientationStart;attribute vec4 orientationEnd;varying vec3 vPosition;varying vec4 vColor;void main(){vPosition = offset * max( abs( sineTime * 2.0 + 1.0 ), 0.5 ) + position;vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );vec3 vcV = cross( orientation.xyz, vPosition );vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );vColor = color;gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );}';
    var shader = 'precision highp float;uniform float time;varying vec3 vPosition;varying vec4 vColor;void main() {vec4 color = vec4( vColor );color.r += sin( vPosition.x * 10.0 + time ) * 0.5;gl_FragColor = color;}';
        
    init();
    animate();

    return this;
});
