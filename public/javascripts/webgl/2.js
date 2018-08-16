var cesLoadingWebGL = (function(_recipe, _Compression, _PubSub, _texturePath, $wrapper, box, texture, system) {
    
    var _width = $wrapper.parent().width();
    var _height = $wrapper.parent().height();

    //if ( !Detector.webgl ) Detector.addGetWebGLMessage();
	var container, stats;
	var camera, scene, renderer;
    var orientations, instanceBuffer;
    
	function init() {
		camera = new THREE.PerspectiveCamera( 50, _width / _height, 1, 1000 );
		//camera.position.z = 20;
		scene = new THREE.Scene();
		//scene.background = new THREE.Color( 0x101010 );
		renderer = new THREE.WebGLRenderer({alpha: true});
		// geometry
		var instances = 500;
		var geometry = new THREE.InstancedBufferGeometry();
		// per mesh data x,y,z,w,u,v,s,t for 4-element alignment
		// only use x,y,z and u,v; but x, y, z, nx, ny, nz, u, v would be a good layout
		var vertexBuffer = new THREE.InterleavedBuffer( new Float32Array( [
			// Front
			-1, 1, 1, 0, 0, 0, 0, 0,
			1, 1, 1, 0, 1, 0, 0, 0,
			-1, -1, 1, 0, 0, 1, 0, 0,
			1, -1, 1, 0, 1, 1, 0, 0,
			// Back
			1, 1, -1, 0, 1, 0, 0, 0,
			-1, 1, -1, 0, 0, 0, 0, 0,
			1, -1, -1, 0, 1, 1, 0, 0,
			-1, -1, -1, 0, 0, 1, 0, 0,
			// Left
			-1, 1, -1, 0, 1, 1, 0, 0,
			-1, 1, 1, 0, 1, 0, 0, 0,
			-1, -1, -1, 0, 0, 1, 0, 0,
			-1, -1, 1, 0, 0, 0, 0, 0,
			// Right
			1, 1, 1, 0, 1, 0, 0, 0,
			1, 1, -1, 0, 1, 1, 0, 0,
			1, -1, 1, 0, 0, 0, 0, 0,
			1, -1, -1, 0, 0, 1, 0, 0,
			// Top
			-1, 1, 1, 0, 0, 0, 0, 0,
			1, 1, 1, 0, 1, 0, 0, 0,
			-1, 1, -1, 0, 0, 1, 0, 0,
			1, 1, -1, 0, 1, 1, 0, 0,
			// Bottom
			1, -1, 1, 0, 1, 0, 0, 0,
			-1, -1, 1, 0, 0, 0, 0, 0,
			1, -1, -1, 0, 1, 1, 0, 0,
			-1, -1, -1, 0, 0, 1, 0, 0
		] ), 8 );
		// Use vertexBuffer, starting at offset 0, 3 items in position attribute
		var positions = new THREE.InterleavedBufferAttribute( vertexBuffer, 3, 0 );
		geometry.addAttribute( 'position', positions );
		// Use vertexBuffer, starting at offset 4, 2 items in uv attribute
		var uvs = new THREE.InterleavedBufferAttribute( vertexBuffer, 2, 4 );
		geometry.addAttribute( 'uv', uvs );
		var indices = new Uint16Array( [
			0, 1, 2,
			2, 1, 3,
			4, 5, 6,
			6, 5, 7,
			8, 9, 10,
			10, 9, 11,
			12, 13, 14,
			14, 13, 15,
			16, 17, 18,
			18, 17, 19,
			20, 21, 22,
			22, 21, 23
		] );
		geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		// per instance data
		instanceBuffer = new THREE.InstancedInterleavedBuffer( new Float32Array( instances * 8 ), 8, 1 ).setDynamic( true );
		var offsets = new THREE.InterleavedBufferAttribute( instanceBuffer, 3, 0 );
		var vector = new THREE.Vector4();
		for ( var i = 0, ul = offsets.count; i < ul; i++ ) {
			var x = Math.random() * 100 - 50;
			var y = Math.random() * 100 - 50;
			var z = Math.random() * 100 - 50;
			vector.set( x, y, z, 0 ).normalize();
			// move out at least 5 units from center in current direction
			offsets.setXYZ( i, x + vector.x * 5, y + vector.y * 5, z + vector.z * 5 );
		}
		geometry.addAttribute( 'offset', offsets ); // per mesh translation
		orientations = new THREE.InterleavedBufferAttribute( instanceBuffer, 4, 4 );
		for ( var i = 0, ul = orientations.count; i < ul; i++ ) {
			vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
			vector.normalize();
			orientations.setXYZW( i, vector.x, vector.y, vector.z, vector.w );
		}
		geometry.addAttribute( 'orientation', orientations ); // per mesh orientation
		// material
        var texture = new THREE.TextureLoader().load( box[0].src );
        
		texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
		var material = new THREE.RawShaderMaterial( {
			uniforms: {
				map: { value: texture }
			},
			vertexShader: vertex,
			fragmentShader: shader,
			side: THREE.DoubleSide,
			transparent: false
		} );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.frustumCulled = false;
		scene.add( mesh );
		if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === null ) {
			document.getElementById( "notSupported" ).style.display = "";
			return;
		}
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( _width, _height );
        
        $wrapper.append(renderer.domElement);

		//stats = new Stats();
        //$wrapper.append( stats.dom );
        
		window.addEventListener( 'resize', onWindowResize, false );
	}
	function onWindowResize( event ) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( _width, _height );
	}
	//
	function animate() {
		requestAnimationFrame( animate );
		render();
		//stats.update();
	}
	var lastTime = 0;
	var moveQ = ( new THREE.Quaternion( .5, .5, .5, 0.0 ) ).normalize();
	var tmpQ = new THREE.Quaternion();
	var currentQ = new THREE.Quaternion();
	function render() {
		var time = performance.now();
		var object = scene.children[0];
		object.rotation.x = time * -0.000005;
		renderer.render( scene, camera );
		var delta = ( time - lastTime ) / 5000;
		tmpQ.set( moveQ.x * delta, moveQ.y * delta, moveQ.z * delta, 1 ).normalize();
		for ( var i = 0, ul = orientations.count; i < ul; i++ ) {
			var index = i * instanceBuffer.stride + orientations.offset;
			currentQ.set( instanceBuffer.array[index], instanceBuffer.array[index + 1], instanceBuffer.array[index + 2], instanceBuffer.array[index + 3] );
			currentQ.multiply( tmpQ );
			orientations.setXYZW( i, currentQ.x, currentQ.y, currentQ.z, currentQ.w );
		}
		instanceBuffer.needsUpdate = true;
		lastTime = time;
    }
    
    var vertex = 'precision highp float;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;attribute vec3 position;attribute vec3 offset;attribute vec2 uv;attribute vec4 orientation;varying vec2 vUv;vec3 applyQuaternionToVector( vec4 q, vec3 v ){return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );}void main() {vec3 vPosition = applyQuaternionToVector( orientation, position );vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + vPosition, 1.0 );}';
    var shader = 'precision highp float;uniform sampler2D map;varying vec2 vUv;void main() {gl_FragColor = texture2D(map, vUv);}';


	init();
    animate();
});