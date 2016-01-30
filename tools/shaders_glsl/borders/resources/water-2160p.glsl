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
COMPAT_VARYING     float _frame_rotation;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
vec4 _oPosition1;
input_dummy _IN1;
vec4 _r0013;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 COLOR;
COMPAT_VARYING vec4 COL0;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 TEX0;
COMPAT_ATTRIBUTE vec4 LUTTexCoord;
COMPAT_VARYING vec4 TEX1;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _oColor;
    vec2 _oTex;
    vec2 _otex_border;
    vec2 _scale;
    vec2 _middle;
    vec2 _diff;
    vec2 _dist;
    _r0013 = VertexCoord.x*MVPMatrix[0];
    _r0013 = _r0013 + VertexCoord.y*MVPMatrix[1];
    _r0013 = _r0013 + VertexCoord.z*MVPMatrix[2];
    _r0013 = _r0013 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0013;
    _oColor = COLOR;
    _scale = (OutputSize/vec2( 3.20000000E+02, 2.40000000E+02))/9.00000000E+00;
    _middle = (5.00000000E-01*InputSize)/TextureSize;
    _diff = TexCoord.xy - _middle;
    _oTex = _middle + _diff*_scale;
    _dist = LUTTexCoord.xy - vec2( 4.99989986E-01, 4.99989986E-01);
    _otex_border = vec2( 4.99989986E-01, 4.99989986E-01) + (_dist*OutputSize)/vec2( 3.84000000E+03, 2.16000000E+03);
    gl_Position = _r0013;
    COL0 = COLOR;
    TEX0.xy = _oTex;
    TEX1.xy = _otex_border;
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
COMPAT_VARYING     float _frame_rotation;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count1;
    float _frame_direction;
    float _frame_rotation;
};
vec4 _ret_0;
vec4 _TMP0;
float _TMP8;
float _TMP7;
float _TMP9;
uniform sampler2D Texture;
uniform sampler2D bg;
input_dummy _IN1;
float _res0026;
vec3 _TMP200026;
float _TMP27;
vec2 _diff0028;
float _dist0028;
float _TMP37;
vec2 _diff0038;
float _dist0038;
float _TMP47;
vec2 _diff0048;
float _dist0048;
float _TMP57;
vec2 _diff0058;
float _dist0058;
float _TMP67;
vec2 _diff0068;
float _dist0068;
float _TMP77;
vec2 _diff0078;
float _dist0078;
float _TMP87;
vec2 _diff0088;
float _dist0088;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _frame;
    vec2 _fragcoord;
    vec4 _background;
    _frame = COMPAT_TEXTURE(Texture, TEX0.xy);
    _fragcoord = TEX0.xy*(TextureSize.xy/InputSize.xy);
    _TMP0 = COMPAT_TEXTURE(bg, TEX1.xy);
    _diff0028 = TEX1.xy - vec2( 6.00000024E-01, 6.99999988E-01);
    _TMP7 = dot(_diff0028, _diff0028);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0028 = 3.00000000E+02*_TMP8;
    _dist0028 = _dist0028 - 1.50000006E-01*float(FrameCount);
    _TMP27 = sin(_dist0028);
    _diff0038 = TEX1.xy - vec2( 8.99999976E-01, 8.99999976E-01);
    _TMP7 = dot(_diff0038, _diff0038);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0038 = 3.00000000E+02*_TMP8;
    _dist0038 = _dist0038 - 1.50000006E-01*float(FrameCount);
    _TMP37 = sin(_dist0038);
    _res0026 = _TMP27 + _TMP37;
    _diff0048 = TEX1.xy - vec2( -6.00000024E-01, 3.00000012E-01);
    _TMP7 = dot(_diff0048, _diff0048);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0048 = 3.00000000E+02*_TMP8;
    _dist0048 = _dist0048 - 1.50000006E-01*float(FrameCount);
    _TMP47 = sin(_dist0048);
    _res0026 = _res0026 + _TMP47;
    _diff0058 = TEX1.xy - vec2( 1.00000001E-01, 4.00000006E-01);
    _TMP7 = dot(_diff0058, _diff0058);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0058 = 3.00000000E+02*_TMP8;
    _dist0058 = _dist0058 - 1.50000006E-01*float(FrameCount);
    _TMP57 = sin(_dist0058);
    _res0026 = _res0026 + _TMP57;
    _diff0068 = TEX1.xy - vec2( 1.00000001E-01, 4.00000006E-01);
    _TMP7 = dot(_diff0068, _diff0068);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0068 = 3.00000000E+02*_TMP8;
    _dist0068 = _dist0068 - 1.50000006E-01*float(FrameCount);
    _TMP67 = sin(_dist0068);
    _res0026 = _res0026 + _TMP67;
    _diff0078 = TEX1.xy - vec2( 5.00000000E-01, 5.00000000E-01);
    _TMP7 = dot(_diff0078, _diff0078);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0078 = 3.00000000E+02*_TMP8;
    _dist0078 = _dist0078 - 1.50000006E-01*float(FrameCount);
    _TMP77 = sin(_dist0078);
    _res0026 = _res0026 + _TMP77;
    _diff0088 = TEX1.xy - vec2( -1.00000000E+00, 1.00000000E+00);
    _TMP7 = dot(_diff0088, _diff0088);
    _TMP9 = inversesqrt(_TMP7);
    _TMP8 = 1.00000000E+00/_TMP9;
    _dist0088 = 3.00000000E+02*_TMP8;
    _dist0088 = _dist0088 - 1.50000006E-01*float(FrameCount);
    _TMP87 = sin(_dist0088);
    _res0026 = _res0026 + _TMP87;
    _TMP200026 = _TMP0.xyz*(6.99999988E-01 + 5.00000007E-02*_res0026);
    _background = vec4(_TMP200026.x, _TMP200026.y, _TMP200026.z, _TMP0.w);
    if (_fragcoord.x < 1.00000000E+00 && _fragcoord.x > 0.00000000E+00 && _fragcoord.y < 1.00000000E+00 && _fragcoord.y > 0.00000000E+00) { 
        _background.w = 0.00000000E+00;
    } 
    _ret_0 = _frame + _background.w*(_background - _frame);
    FragColor = _ret_0;
    return;
} 
#endif
