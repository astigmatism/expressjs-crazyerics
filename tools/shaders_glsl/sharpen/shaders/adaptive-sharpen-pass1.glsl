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
COMPAT_VARYING     vec2 _texCoord;
COMPAT_VARYING     vec4 _color1;
COMPAT_VARYING     vec4 _position1;
COMPAT_VARYING     float _frame_rotation;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
struct out_vertex {
    vec4 _position1;
    vec4 _color1;
    vec2 _texCoord;
};
out_vertex _ret_0;
vec4 _r0008;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 COLOR;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 COL0;
COMPAT_VARYING vec4 TEX0;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    _r0008 = VertexCoord.x*MVPMatrix[0];
    _r0008 = _r0008 + VertexCoord.y*MVPMatrix[1];
    _r0008 = _r0008 + VertexCoord.z*MVPMatrix[2];
    _r0008 = _r0008 + VertexCoord.w*MVPMatrix[3];
    _ret_0._position1 = _r0008;
    _ret_0._color1 = COLOR;
    _ret_0._texCoord = TexCoord.xy;
    gl_Position = _r0008;
    COL0 = COLOR;
    TEX0.xy = TexCoord.xy;
    return;
    COL0 = _ret_0._color1;
    TEX0.xy = _ret_0._texCoord;
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
COMPAT_VARYING     vec2 _texCoord;
COMPAT_VARYING     vec4 _color;
COMPAT_VARYING     float _frame_rotation;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
struct out_vertex {
    vec4 _color;
    vec2 _texCoord;
};
vec4 _ret_0;
vec4 _TMP64;
vec3 _TMP63;
vec3 _TMP62;
vec3 _TMP61;
vec3 _TMP60;
vec3 _TMP59;
vec3 _TMP58;
vec3 _TMP57;
vec3 _TMP56;
vec3 _TMP55;
vec3 _TMP54;
vec3 _TMP53;
vec3 _TMP52;
vec3 _TMP51;
float _TMP50;
float _TMP66;
vec3 _TMP65;
vec4 _TMP24;
vec4 _TMP22;
vec4 _TMP20;
vec4 _TMP18;
vec4 _TMP16;
vec4 _TMP14;
vec4 _TMP12;
vec4 _TMP10;
vec4 _TMP8;
vec4 _TMP6;
vec4 _TMP4;
vec4 _TMP2;
vec4 _TMP0;
uniform sampler2D Texture;
input_dummy _IN1;
vec3 _TMP76;
vec2 _c0083;
vec3 _TMP86;
vec2 _c0093;
vec3 _TMP96;
vec2 _c0103;
vec3 _TMP106;
vec2 _c0113;
vec3 _TMP116;
vec2 _c0123;
vec3 _TMP126;
vec2 _c0133;
vec3 _TMP136;
vec2 _c0143;
vec3 _TMP146;
vec2 _c0153;
vec3 _TMP156;
vec2 _c0163;
vec3 _TMP166;
vec2 _c0173;
vec3 _TMP176;
vec2 _c0183;
vec3 _TMP186;
vec2 _c0193;
vec3 _TMP196;
float _y0323;
float _x0325;
float _TMP326;
vec3 _a0333;
vec3 _a0335;
vec3 _a0337;
vec3 _a0339;
vec3 _a0341;
vec3 _a0343;
vec3 _a0345;
vec3 _a0347;
vec3 _a0349;
vec3 _a0351;
vec3 _a0353;
vec3 _a0355;
vec3 _a0357;
vec3 _a0359;
COMPAT_VARYING vec4 TEX0;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    float _px;
    float _py;
    vec3 _blur;
    float _blur_Y;
    float _edge;
    _px = 1.00000000E+00/TextureSize.x;
    _py = 1.00000000E+00/TextureSize.y;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP0.xyz);
    _TMP76 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0083 = TEX0.xy + vec2(-_px, -_py);
    _TMP2 = COMPAT_TEXTURE(Texture, _c0083);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP2.xyz);
    _TMP86 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0093 = TEX0.xy + vec2(0.00000000E+00, -_py);
    _TMP4 = COMPAT_TEXTURE(Texture, _c0093);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP4.xyz);
    _TMP96 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0103 = TEX0.xy + vec2(_px, -_py);
    _TMP6 = COMPAT_TEXTURE(Texture, _c0103);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP6.xyz);
    _TMP106 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0113 = TEX0.xy + vec2(-_px, 0.00000000E+00);
    _TMP8 = COMPAT_TEXTURE(Texture, _c0113);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP8.xyz);
    _TMP116 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0123 = TEX0.xy + vec2(_px, 0.00000000E+00);
    _TMP10 = COMPAT_TEXTURE(Texture, _c0123);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP10.xyz);
    _TMP126 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0133 = TEX0.xy + vec2(-_px, _py);
    _TMP12 = COMPAT_TEXTURE(Texture, _c0133);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP12.xyz);
    _TMP136 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0143 = TEX0.xy + vec2(0.00000000E+00, _py);
    _TMP14 = COMPAT_TEXTURE(Texture, _c0143);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP14.xyz);
    _TMP146 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0153 = TEX0.xy + vec2(_px, _py);
    _TMP16 = COMPAT_TEXTURE(Texture, _c0153);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP16.xyz);
    _TMP156 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0163 = TEX0.xy + vec2(0.00000000E+00, -2.00000000E+00*_py);
    _TMP18 = COMPAT_TEXTURE(Texture, _c0163);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP18.xyz);
    _TMP166 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0173 = TEX0.xy + vec2(-2.00000000E+00*_px, 0.00000000E+00);
    _TMP20 = COMPAT_TEXTURE(Texture, _c0173);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP20.xyz);
    _TMP176 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0183 = TEX0.xy + vec2(2.00000000E+00*_px, 0.00000000E+00);
    _TMP22 = COMPAT_TEXTURE(Texture, _c0183);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP22.xyz);
    _TMP186 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _c0193 = TEX0.xy + vec2(0.00000000E+00, 2.00000000E+00*_py);
    _TMP24 = COMPAT_TEXTURE(Texture, _c0193);
    _TMP65 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP24.xyz);
    _TMP196 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP65);
    _blur = (2.00000000E+00*(_TMP96 + _TMP116 + _TMP126 + _TMP146) + _TMP86 + _TMP106 + _TMP136 + _TMP156 + 4.00000000E+00*_TMP76)/1.60000000E+01;
    _blur_Y = _blur.x/3.00000000E+00 + _blur.y/3.00000000E+00 + _blur.z/3.00000000E+00;
    _y0323 = -7.40000010E+00*_blur_Y;
    _TMP50 = pow(2.00000000E+00, _y0323);
    _x0325 = 2.66666681E-01 + 8.99999976E-01*_TMP50;
    _TMP66 = min(1.00000000E+00, _x0325);
    _TMP326 = max(0.00000000E+00, _TMP66);
    _a0333 = _blur - _TMP76;
    _TMP51 = abs(_a0333);
    _a0335 = _blur - _TMP86;
    _TMP52 = abs(_a0335);
    _a0337 = _blur - _TMP96;
    _TMP53 = abs(_a0337);
    _a0339 = _blur - _TMP106;
    _TMP54 = abs(_a0339);
    _a0341 = _blur - _TMP116;
    _TMP55 = abs(_a0341);
    _a0343 = _blur - _TMP126;
    _TMP56 = abs(_a0343);
    _a0345 = _blur - _TMP136;
    _TMP57 = abs(_a0345);
    _a0347 = _blur - _TMP146;
    _TMP58 = abs(_a0347);
    _a0349 = _blur - _TMP156;
    _TMP59 = abs(_a0349);
    _a0351 = _blur - _TMP166;
    _TMP60 = abs(_a0351);
    _a0353 = _blur - _TMP176;
    _TMP61 = abs(_a0353);
    _a0355 = _blur - _TMP186;
    _TMP62 = abs(_a0355);
    _a0357 = _blur - _TMP196;
    _TMP63 = abs(_a0357);
    _a0359 = _TMP51 + _TMP52 + _TMP53 + _TMP54 + _TMP55 + _TMP56 + _TMP57 + _TMP58 + _TMP59 + 2.50000000E-01*(_TMP60 + _TMP61 + _TMP62 + _TMP63);
    _edge = length(_a0359);
    _TMP64 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _ret_0 = vec4(_TMP64.x, _TMP64.y, _TMP64.z, _edge*_TMP326);
    FragColor = _ret_0;
    return;
} 
#endif
