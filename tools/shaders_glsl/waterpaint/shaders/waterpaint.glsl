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
COMPAT_VARYING     vec4 VARc21_22;
COMPAT_VARYING     vec4 VARc12_20;
COMPAT_VARYING     vec2 VARc11;
COMPAT_VARYING     vec4 VARc02_10;
COMPAT_VARYING     vec4 VARc00_01;
struct tex_coords {
    vec4 VARc00_01;
    vec4 VARc02_10;
    vec2 VARc11;
    vec4 VARc12_20;
    vec4 VARc21_22;
};
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
vec4 _oPosition1;
tex_coords _coords1;
input_dummy _IN1;
vec4 _r0015;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 COLOR;
COMPAT_VARYING vec4 COL0;
COMPAT_ATTRIBUTE vec4 TexCoord;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _oColor;
    vec2 _delta;
    vec2 _TMP3;
    vec2 _TMP4;
    vec2 _TMP5;
    vec2 _TMP6;
    vec2 _TMP7;
    vec2 _TMP8;
    vec2 _TMP9;
    vec2 _TMP10;
    tex_coords _TMP11;
    _r0015 = VertexCoord.x*MVPMatrix[0];
    _r0015 = _r0015 + VertexCoord.y*MVPMatrix[1];
    _r0015 = _r0015 + VertexCoord.z*MVPMatrix[2];
    _r0015 = _r0015 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0015;
    _oColor = COLOR;
    _delta = 5.00000000E-01/TextureSize;
    _TMP9 = TexCoord.xy + vec2(-_delta.x, -_delta.y);
    _TMP10 = TexCoord.xy + vec2(-_delta.x, 0.00000000E+00);
    _TMP11.VARc00_01 = vec4(_TMP9.x, _TMP9.y, _TMP10.x, _TMP10.y);
    _TMP7 = TexCoord.xy + vec2(-_delta.x, _delta.y);
    _TMP8 = TexCoord.xy + vec2(0.00000000E+00, -_delta.y);
    _TMP11.VARc02_10 = vec4(_TMP7.x, _TMP7.y, _TMP8.x, _TMP8.y);
    _TMP5 = TexCoord.xy + vec2(0.00000000E+00, _delta.y);
    _TMP6 = TexCoord.xy + vec2(_delta.x, -_delta.y);
    _TMP11.VARc12_20 = vec4(_TMP5.x, _TMP5.y, _TMP6.x, _TMP6.y);
    _TMP3 = TexCoord.xy + vec2(_delta.x, 0.00000000E+00);
    _TMP4 = TexCoord.xy + vec2(_delta.x, _delta.y);
    _TMP11.VARc21_22 = vec4(_TMP3.x, _TMP3.y, _TMP4.x, _TMP4.y);
    VARc00_01 = _TMP11.VARc00_01;
    VARc02_10 = _TMP11.VARc02_10;
    VARc11 = TexCoord.xy;
    VARc12_20 = _TMP11.VARc12_20;
    VARc21_22 = _TMP11.VARc21_22;
    gl_Position = _r0015;
    COL0 = COLOR;
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
COMPAT_VARYING     vec4 VARc21_22;
COMPAT_VARYING     vec4 VARc12_20;
COMPAT_VARYING     vec2 VARc11;
COMPAT_VARYING     vec4 VARc02_10;
COMPAT_VARYING     vec4 VARc00_01;
struct tex_coords {
    vec4 VARc00_01;
    vec4 VARc02_10;
    vec2 VARc11;
    vec4 VARc12_20;
    vec4 VARc21_22;
};
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
vec4 _ret_0;
vec3 _TMP18;
vec3 _TMP17;
vec3 _TMP15;
vec3 _TMP14;
float _TMP13;
float _TMP12;
float _TMP11;
float _TMP10;
float _TMP9;
vec4 _TMP8;
vec4 _TMP7;
vec4 _TMP6;
vec4 _TMP5;
vec4 _TMP3;
vec4 _TMP2;
vec4 _TMP1;
vec4 _TMP0;
tex_coords _co1;
input_dummy _IN1;
uniform sampler2D Texture;
float _x0042;
float _x0046;
float _x0050;
float _x0054;
float _x0058;
vec3 _a0064;
vec3 _diff0066;
vec3 _TMP67;
vec3 _x0074;
vec3 _TMP75;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec3 _first;
    vec3 _second;
    vec3 _mid_horiz;
    vec3 _mid_vert;
    vec3 _res;
    vec3 _final;
    _TMP0 = COMPAT_TEXTURE(Texture, VARc00_01.xy);
    _TMP1 = COMPAT_TEXTURE(Texture, VARc00_01.zw);
    _TMP2 = COMPAT_TEXTURE(Texture, VARc02_10.xy);
    _TMP3 = COMPAT_TEXTURE(Texture, VARc02_10.zw);
    _TMP5 = COMPAT_TEXTURE(Texture, VARc12_20.xy);
    _TMP6 = COMPAT_TEXTURE(Texture, VARc12_20.zw);
    _TMP7 = COMPAT_TEXTURE(Texture, VARc21_22.xy);
    _TMP8 = COMPAT_TEXTURE(Texture, VARc21_22.zw);
    _x0042 = VARc11.x*TextureSize.x + 5.00000000E-01;
    _TMP9 = fract(_x0042);
    _first = _TMP0.xyz + _TMP9*(_TMP6.xyz - _TMP0.xyz);
    _x0046 = VARc11.x*TextureSize.x + 5.00000000E-01;
    _TMP10 = fract(_x0046);
    _second = _TMP2.xyz + _TMP10*(_TMP8.xyz - _TMP2.xyz);
    _x0050 = VARc11.x*TextureSize.x + 5.00000000E-01;
    _TMP11 = fract(_x0050);
    _mid_horiz = _TMP1.xyz + _TMP11*(_TMP7.xyz - _TMP1.xyz);
    _x0054 = VARc11.y*TextureSize.y + 5.00000000E-01;
    _TMP12 = fract(_x0054);
    _mid_vert = _TMP3.xyz + _TMP12*(_TMP5.xyz - _TMP3.xyz);
    _x0058 = VARc11.y*TextureSize.y + 5.00000000E-01;
    _TMP13 = fract(_x0058);
    _res = _first + _TMP13*(_second - _first);
    _TMP14 = _mid_horiz + 5.00000000E-01*(_mid_vert - _mid_horiz);
    _a0064 = _res - _TMP14;
    _TMP15 = abs(_a0064);
    _final = 2.59999990E-01*(_res + _mid_horiz + _mid_vert) + 3.50000000E+00*_TMP15;
    _diff0066 = _final - vec3( 8.00000012E-01, 8.00000012E-01, 8.00000012E-01);
    _TMP17 = min(vec3( 1.00000000E+02, 1.00000000E+02, 1.00000000E+02), _diff0066);
    _TMP67 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP17);
    _x0074 = _final - _TMP67*8.00000012E-01;
    _TMP18 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0074);
    _TMP75 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP18);
    _ret_0 = vec4(_TMP75.x, _TMP75.y, _TMP75.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
