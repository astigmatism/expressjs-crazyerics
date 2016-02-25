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
COMPAT_VARYING     vec4 _t4;
COMPAT_VARYING     vec4 _t3;
COMPAT_VARYING     vec4 _t2;
COMPAT_VARYING     vec4 _t1;
COMPAT_VARYING     vec2 _texCoord;
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
    vec2 _texCoord;
    vec4 _t1;
    vec4 _t2;
    vec4 _t3;
    vec4 _t4;
};
out_vertex _ret_0;
input_dummy _IN1;
vec4 _r0021;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
COMPAT_VARYING vec4 TEX2;
COMPAT_VARYING vec4 TEX3;
COMPAT_VARYING vec4 TEX4;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    float _x;
    float _y;
    vec2 _dg1;
    vec2 _dg2;
    vec2 _dx;
    vec2 _dy;
    vec2 _TMP9;
    vec2 _TMP10;
    vec2 _TMP11;
    vec2 _TMP12;
    vec2 _TMP13;
    vec2 _TMP14;
    vec2 _TMP15;
    vec2 _TMP16;
    out_vertex _TMP17;
    _x = 5.00000000E-01*(1.00000000E+00/TextureSize.x);
    _y = 5.00000000E-01*(1.00000000E+00/TextureSize.y);
    _dg1 = vec2(_x, _y);
    _dg2 = vec2(-_x, _y);
    _dx = vec2(_x, 0.00000000E+00);
    _dy = vec2(0.00000000E+00, _y);
    _r0021 = VertexCoord.x*MVPMatrix[0];
    _r0021 = _r0021 + VertexCoord.y*MVPMatrix[1];
    _r0021 = _r0021 + VertexCoord.z*MVPMatrix[2];
    _r0021 = _r0021 + VertexCoord.w*MVPMatrix[3];
    _TMP15 = TexCoord.xy - _dg1;
    _TMP16 = TexCoord.xy - _dy;
    _TMP17._t1 = vec4(_TMP15.x, _TMP15.y, _TMP16.x, _TMP16.y);
    _TMP13 = TexCoord.xy - _dg2;
    _TMP14 = TexCoord.xy + _dx;
    _TMP17._t2 = vec4(_TMP13.x, _TMP13.y, _TMP14.x, _TMP14.y);
    _TMP11 = TexCoord.xy + _dg1;
    _TMP12 = TexCoord.xy + _dy;
    _TMP17._t3 = vec4(_TMP11.x, _TMP11.y, _TMP12.x, _TMP12.y);
    _TMP9 = TexCoord.xy + _dg2;
    _TMP10 = TexCoord.xy - _dx;
    _TMP17._t4 = vec4(_TMP9.x, _TMP9.y, _TMP10.x, _TMP10.y);
    _ret_0._position1 = _r0021;
    _ret_0._texCoord = TexCoord.xy;
    _ret_0._t1 = _TMP17._t1;
    _ret_0._t2 = _TMP17._t2;
    _ret_0._t3 = _TMP17._t3;
    _ret_0._t4 = _TMP17._t4;
    gl_Position = _r0021;
    TEX0.xy = TexCoord.xy;
    TEX1 = _TMP17._t1;
    TEX2 = _TMP17._t2;
    TEX3 = _TMP17._t3;
    TEX4 = _TMP17._t4;
    return;
    TEX0.xy = _ret_0._texCoord;
    TEX1 = _ret_0._t1;
    TEX2 = _ret_0._t2;
    TEX3 = _ret_0._t3;
    TEX4 = _ret_0._t4;
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
COMPAT_VARYING     vec4 _t4;
COMPAT_VARYING     vec4 _t3;
COMPAT_VARYING     vec4 _t21;
COMPAT_VARYING     vec4 _t11;
COMPAT_VARYING     vec2 _texCoord;
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
    vec2 _texCoord;
    vec4 _t11;
    vec4 _t21;
    vec4 _t3;
    vec4 _t4;
};
vec4 _ret_0;
float _TMP29;
float _TMP30;
vec3 _TMP28;
float _TMP27;
vec3 _TMP26;
float _TMP25;
vec3 _TMP24;
float _TMP23;
vec3 _TMP22;
float _TMP21;
float _TMP20;
float _TMP19;
float _TMP18;
vec3 _TMP17;
float _TMP16;
vec3 _TMP15;
float _TMP14;
vec3 _TMP13;
float _TMP12;
vec3 _TMP11;
vec3 _TMP10;
vec3 _TMP9;
vec4 _TMP8;
vec4 _TMP7;
vec4 _TMP6;
vec4 _TMP5;
vec4 _TMP4;
vec4 _TMP3;
vec4 _TMP2;
vec4 _TMP1;
vec4 _TMP0;
uniform sampler2D Texture;
vec3 _a0059;
vec3 _a0063;
vec3 _a0067;
vec3 _a0071;
vec3 _a0075;
vec3 _a0079;
vec3 _a0085;
vec3 _a0087;
vec3 _a0089;
float _TMP92;
float _x0093;
vec3 _a0099;
float _TMP102;
float _x0103;
vec3 _a0109;
float _TMP112;
float _x0113;
vec3 _a0119;
float _TMP122;
float _x0123;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
COMPAT_VARYING vec4 TEX2;
COMPAT_VARYING vec4 TEX3;
COMPAT_VARYING vec4 TEX4;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec3 _c11;
    float _md1;
    float _md2;
    float _w1;
    float _w2;
    float _w3;
    float _w4;
    float _t1;
    float _t2;
    float _ww;
    float _lc1;
    float _lc2;
    vec3 _TMP39;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX1.xy);
    _TMP1 = COMPAT_TEXTURE(Texture, TEX1.zw);
    _TMP2 = COMPAT_TEXTURE(Texture, TEX2.xy);
    _TMP3 = COMPAT_TEXTURE(Texture, TEX4.zw);
    _TMP4 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _TMP5 = COMPAT_TEXTURE(Texture, TEX2.zw);
    _TMP6 = COMPAT_TEXTURE(Texture, TEX4.xy);
    _TMP7 = COMPAT_TEXTURE(Texture, TEX3.zw);
    _TMP8 = COMPAT_TEXTURE(Texture, TEX3.xy);
    _a0059 = _TMP0.xyz - _TMP8.xyz;
    _TMP9 = abs(_a0059);
    _md1 = dot(_TMP9, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _a0063 = _TMP6.xyz - _TMP2.xyz;
    _TMP10 = abs(_a0063);
    _md2 = dot(_TMP10, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _a0067 = _TMP8.xyz - _TMP4.xyz;
    _TMP11 = abs(_a0067);
    _TMP12 = dot(_TMP11, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _w1 = _TMP12*_md2;
    _a0071 = _TMP6.xyz - _TMP4.xyz;
    _TMP13 = abs(_a0071);
    _TMP14 = dot(_TMP13, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _w2 = _TMP14*_md1;
    _a0075 = _TMP0.xyz - _TMP4.xyz;
    _TMP15 = abs(_a0075);
    _TMP16 = dot(_TMP15, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _w3 = _TMP16*_md2;
    _a0079 = _TMP2.xyz - _TMP4.xyz;
    _TMP17 = abs(_a0079);
    _TMP18 = dot(_TMP17, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _w4 = _TMP18*_md1;
    _t1 = _w1 + _w3;
    _t2 = _w2 + _w4;
    _TMP19 = max(_t1, _t2);
    _ww = _TMP19 + 9.99999975E-05;
    _c11 = (_w1*_TMP0.xyz + _w2*_TMP2.xyz + _w3*_TMP8.xyz + _w4*_TMP6.xyz + _ww*_TMP4.xyz)/(_t1 + _t2 + _ww);
    _a0085 = _TMP1.xyz + _TMP7.xyz + _c11;
    _TMP20 = dot(_a0085, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _lc1 = -2.50000000E-01/(1.19999997E-01*_TMP20 + 2.50000000E-01);
    _a0087 = _TMP3.xyz + _TMP5.xyz + _c11;
    _TMP21 = dot(_a0087, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _lc2 = -2.50000000E-01/(1.19999997E-01*_TMP21 + 2.50000000E-01);
    _a0089 = _c11 - _TMP1.xyz;
    _TMP22 = abs(_a0089);
    _TMP23 = dot(_TMP22, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _x0093 = _lc1*_TMP23 + 3.24999988E-01;
    _TMP30 = min(2.50000000E-01, _x0093);
    _TMP92 = max(-5.00000007E-02, _TMP30);
    _a0099 = _c11 - _TMP5.xyz;
    _TMP24 = abs(_a0099);
    _TMP25 = dot(_TMP24, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _x0103 = _lc2*_TMP25 + 3.24999988E-01;
    _TMP30 = min(2.50000000E-01, _x0103);
    _TMP102 = max(-5.00000007E-02, _TMP30);
    _a0109 = _c11 - _TMP7.xyz;
    _TMP26 = abs(_a0109);
    _TMP27 = dot(_TMP26, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _x0113 = _lc1*_TMP27 + 3.24999988E-01;
    _TMP30 = min(2.50000000E-01, _x0113);
    _TMP112 = max(-5.00000007E-02, _TMP30);
    _a0119 = _c11 - _TMP3.xyz;
    _TMP28 = abs(_a0119);
    _TMP29 = dot(_TMP28, vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _x0123 = _lc2*_TMP29 + 3.24999988E-01;
    _TMP30 = min(2.50000000E-01, _x0123);
    _TMP122 = max(-5.00000007E-02, _TMP30);
    _TMP39 = _TMP92*_TMP1.xyz + _TMP102*_TMP5.xyz + _TMP112*_TMP7.xyz + _TMP122*_TMP3.xyz + ((((1.00000000E+00 - _TMP92) - _TMP102) - _TMP112) - _TMP122)*_c11;
    _ret_0 = vec4(_TMP39.x, _TMP39.y, _TMP39.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
