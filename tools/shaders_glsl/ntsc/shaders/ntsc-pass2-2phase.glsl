// GLSL shader autogenerated by cg2glsl.py.
#if defined(VERTEX)

#if __VERSION__ >= 130
#define COMPAT_VARYING out
#define COMPAT_ATTRIBUTE in
#define COMPAT_TEXTURE texture
#else
#define COMPAT_VARYING varying
#define COMPAT_ATTRIBUTE attribute
#define COMPAT_TEXTURE texture2D
#endif

#ifdef GL_ES
#define COMPAT_PRECISION mediump
#else
#define COMPAT_PRECISION
#endif
COMPAT_VARYING     vec2 VARtex;
struct data {
    vec2 VARtex;
};
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
};
vec4 _oPosition1;
data _oData1;
input_dummy _IN1;
vec4 _r0010;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 TexCoord;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    _r0010 = VertexCoord.x*MVPMatrix[0];
    _r0010 = _r0010 + VertexCoord.y*MVPMatrix[1];
    _r0010 = _r0010 + VertexCoord.z*MVPMatrix[2];
    _r0010 = _r0010 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0010;
    VARtex = TexCoord.xy - vec2(5.00000000E-01/TextureSize.x, 0.00000000E+00);
    gl_Position = _r0010;
} 
#elif defined(FRAGMENT)

#if __VERSION__ >= 130
#define COMPAT_VARYING in
#define COMPAT_TEXTURE texture
out vec4 FragColor;
#else
#define COMPAT_VARYING varying
#define FragColor gl_FragColor
#define COMPAT_TEXTURE texture2D
#endif

#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define COMPAT_PRECISION mediump
#else
#define COMPAT_PRECISION
#endif
COMPAT_VARYING     vec2 VARtex;
struct data {
    vec2 VARtex;
};
struct input_dummy {
    vec2 _video_size;
    vec2 VARtexture_size;
    vec2 _output_dummy_size;
    float _frame_count;
};
vec4 _ret_0;
vec4 _TMP3;
vec4 _TMP2;
vec4 _TMP1;
input_dummy _IN1;
data _vertex1;
uniform sampler2D Texture;
vec2 _c0013;
vec2 _c0015;
vec3 _r0021;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    float _one_x;
    vec3 _signal;
    vec3 _sums1;
    _one_x = 1.00000000E+00/TextureSize.x;
    _c0013 = VARtex + vec2(-3.20000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(3.20000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _sums1*vec3( -1.74843997E-04, 1.38476200E-03, 1.38476200E-03);
    _c0013 = VARtex + vec2(-3.10000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(3.10000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -2.05844000E-04, 1.67831196E-03, 1.67831196E-03);
    _c0013 = VARtex + vec2(-3.00000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(3.00000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -1.49453001E-04, 2.02171504E-03, 2.02171504E-03);
    _c0013 = VARtex + vec2(-2.90000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.90000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -5.16930013E-05, 2.42056209E-03, 2.42056209E-03);
    _c0013 = VARtex + vec2(-2.80000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.80000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 0.00000000E+00, 2.88045988E-03, 2.88045988E-03);
    _c0013 = VARtex + vec2(-2.70000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.70000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -6.61710001E-05, 3.40687903E-03, 3.40687903E-03);
    _c0013 = VARtex + vec2(-2.60000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.60000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -2.45058007E-04, 4.00498509E-03, 4.00498509E-03);
    _c0013 = VARtex + vec2(-2.50000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.50000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -4.32928005E-04, 4.67944518E-03, 4.67944518E-03);
    _c0013 = VARtex + vec2(-2.40000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.40000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -4.72643995E-04, 5.43421786E-03, 5.43421786E-03);
    _c0013 = VARtex + vec2(-2.30000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.30000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -2.52236001E-04, 6.27233181E-03, 6.27233181E-03);
    _c0013 = VARtex + vec2(-2.20000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.20000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 1.98929003E-04, 7.19565386E-03, 7.19565386E-03);
    _c0013 = VARtex + vec2(-2.10000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.10000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 6.87058026E-04, 8.20466504E-03, 8.20466504E-03);
    _c0013 = VARtex + vec2(-2.00000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.00000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 9.44112020E-04, 9.29823797E-03, 9.29823797E-03);
    _c0013 = VARtex + vec2(-1.90000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.90000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 8.03467003E-04, 1.04734497E-02, 1.04734497E-02);
    _c0013 = VARtex + vec2(-1.80000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.80000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 3.63199011E-04, 1.17254127E-02, 1.17254127E-02);
    _c0013 = VARtex + vec2(-1.70000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.70000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 1.34219999E-05, 1.30471550E-02, 1.30471550E-02);
    _c0013 = VARtex + vec2(-1.60000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.60000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 2.53401988E-04, 1.44295478E-02, 1.44295478E-02);
    _c0013 = VARtex + vec2(-1.50000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.50000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 1.33946096E-03, 1.58613063E-02, 1.58613063E-02);
    _c0013 = VARtex + vec2(-1.40000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.40000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 2.93297204E-03, 1.73290372E-02, 1.73290372E-02);
    _c0013 = VARtex + vec2(-1.30000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.30000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 3.98348505E-03, 1.88173819E-02, 1.88173819E-02);
    _c0013 = VARtex + vec2(-1.20000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.20000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 3.02668312E-03, 2.03092191E-02, 2.03092191E-02);
    _c0013 = VARtex + vec2(-1.10000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.10000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -1.10205601E-03, 2.17859522E-02, 2.17859522E-02);
    _c0013 = VARtex + vec2(-1.00000000E+01*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(1.00000000E+01*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -8.37302580E-03, 2.32278574E-02, 2.32278574E-02);
    _c0013 = VARtex + vec2(-9.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(9.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -1.68977007E-02, 2.46144999E-02, 2.46144999E-02);
    _c0013 = VARtex + vec2(-8.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(8.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -2.29144804E-02, 2.59252023E-02, 2.59252023E-02);
    _c0013 = VARtex + vec2(-7.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(7.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -2.16423478E-02, 2.71395463E-02, 2.71395463E-02);
    _c0013 = VARtex + vec2(-6.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(6.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( -8.86327308E-03, 2.82378923E-02, 2.82378923E-02);
    _c0013 = VARtex + vec2(-5.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(5.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 1.72719564E-02, 2.92019099E-02, 2.92019099E-02);
    _c0013 = VARtex + vec2(-4.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(4.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 5.49219213E-02, 3.00150812E-02, 3.00150812E-02);
    _c0013 = VARtex + vec2(-3.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(3.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 9.83425826E-02, 3.06631699E-02, 3.06631699E-02);
    _c0013 = VARtex + vec2(-2.00000000E+00*_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(2.00000000E+00*_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 1.39044285E-01, 3.11346408E-02, 3.11346408E-02);
    _c0013 = VARtex + vec2(-_one_x, 0.00000000E+00);
    _TMP1 = COMPAT_TEXTURE(Texture, _c0013);
    _c0015 = VARtex + vec2(_one_x, 0.00000000E+00);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0015);
    _sums1 = _TMP1.xyz + _TMP2.xyz;
    _signal = _signal + _sums1*vec3( 1.68055832E-01, 3.14209945E-02, 3.14209945E-02);
    _TMP3 = COMPAT_TEXTURE(Texture, VARtex);
    _signal = _signal + _TMP3.xyz*vec3( 1.78571433E-01, 3.15170325E-02, 3.15170325E-02);
    _r0021.x = dot(vec3( 1.00000000E+00, 9.55999970E-01, 6.20999992E-01), _signal);
    _r0021.y = dot(vec3( 1.00000000E+00, -2.72000015E-01, -6.47400022E-01), _signal);
    _r0021.z = dot(vec3( 1.00000000E+00, -1.10599995E+00, 1.70459998E+00), _signal);
    _ret_0 = vec4(_r0021.x, _r0021.y, _r0021.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
