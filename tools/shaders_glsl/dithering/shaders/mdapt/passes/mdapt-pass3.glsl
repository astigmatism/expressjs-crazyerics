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
COMPAT_VARYING     vec2 VARt1;
COMPAT_VARYING     vec2 _texCoord1;
COMPAT_VARYING     vec4 _position1;
struct prev {
    vec2 _video_size1;
    vec2 _texture_size1;
float _placeholder24;
};
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec4 _position1;
    vec2 _texCoord1;
    vec2 VARt1;
};
out_vertex _ret_0;
input_dummy _IN1;
vec4 _r0006;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 TEX0;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    out_vertex _OUT;
    _r0006 = VertexCoord.x*MVPMatrix[0];
    _r0006 = _r0006 + VertexCoord.y*MVPMatrix[1];
    _r0006 = _r0006 + VertexCoord.z*MVPMatrix[2];
    _r0006 = _r0006 + VertexCoord.w*MVPMatrix[3];
    _OUT.VARt1 = 1.00000000E+00/TextureSize;
    _ret_0._position1 = _r0006;
    _ret_0._texCoord1 = TexCoord.xy;
    VARt1 = _OUT.VARt1;
    gl_Position = _r0006;
    TEX0.xy = TexCoord.xy;
    return;
    TEX0.xy = _ret_0._texCoord1;
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
COMPAT_VARYING     vec2 VARt1;
COMPAT_VARYING     vec2 _texCoord;
struct prev {
    vec2 _video_size;
    vec2 _texture_size;
float _placeholder26;
};
struct input_dummy {
    vec2 _video_size1;
    vec2 _texture_size1;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec2 _texCoord;
    vec2 VARt1;
};
float _TMP43;
float _TMP42;
float _TMP41;
float _TMP40;
float _TMP39;
float _TMP38;
float _TMP37;
vec2 _TMP36;
vec2 _TMP35;
vec4 _TMP16;
vec4 _TMP15;
vec4 _TMP14;
vec4 _TMP13;
vec4 _TMP12;
vec4 _TMP11;
vec4 _TMP10;
vec4 _TMP9;
vec4 _TMP8;
vec4 _TMP7;
vec4 _TMP6;
vec4 _TMP5;
vec4 _TMP4;
vec4 _TMP3;
vec4 _TMP2;
vec4 _TMP1;
vec4 _TMP0;
out_vertex _VAR1;
uniform sampler2D Texture;
prev _PASSPREV41;
vec2 _c0053;
vec2 _c0055;
vec2 _c0057;
vec2 _c0059;
vec2 _c0061;
vec2 _c0063;
vec2 _c0065;
vec2 _c0067;
vec2 _c0069;
vec2 _c0071;
vec2 _c0073;
vec2 _c0075;
vec2 _c0077;
vec2 _c0079;
vec2 _c0081;
vec2 _c0083;
vec2 _TMP84;
vec2 _TMP92;
vec2 _TMP96;
bool _TMP100;
bvec3 _a0103;
float _TMP104;
float _b0105;
bool _TMP108;
bvec3 _a0111;
float _TMP112;
float _b0113;
bool _TMP116;
bvec3 _a0119;
float _TMP120;
float _b0121;
bool _TMP124;
bvec3 _a0127;
float _TMP128;
float _b0129;
bool _TMP132;
bvec3 _a0135;
vec2 _TMP136;
vec2 _b0137;
bool _TMP140;
bvec3 _a0143;
vec2 _TMP144;
vec2 _b0145;
bool _TMP148;
bvec3 _a0151;
vec2 _TMP152;
vec2 _b0153;
bool _TMP156;
bvec3 _a0159;
vec2 _TMP160;
vec2 _b0161;
float _TMP164;
COMPAT_VARYING vec4 TEX0;
 
uniform sampler2D PassPrev4Texture;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _C;
    _C = COMPAT_TEXTURE(Texture, TEX0.xy);
    _TMP0 = COMPAT_TEXTURE(PassPrev4Texture, TEX0.xy);
    _c0053 = TEX0.xy + vec2( -1.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP1 = COMPAT_TEXTURE(Texture, _c0053);
    _c0055 = TEX0.xy + vec2( -1.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP2 = COMPAT_TEXTURE(PassPrev4Texture, _c0055);
    _c0057 = TEX0.xy + vec2( 1.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP3 = COMPAT_TEXTURE(Texture, _c0057);
    _c0059 = TEX0.xy + vec2( 1.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP4 = COMPAT_TEXTURE(PassPrev4Texture, _c0059);
    _c0061 = TEX0.xy + vec2( 0.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP5 = COMPAT_TEXTURE(Texture, _c0061);
    _c0063 = TEX0.xy + vec2( 0.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP6 = COMPAT_TEXTURE(PassPrev4Texture, _c0063);
    _c0065 = TEX0.xy + vec2( 0.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP7 = COMPAT_TEXTURE(Texture, _c0065);
    _c0067 = TEX0.xy + vec2( 0.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP8 = COMPAT_TEXTURE(PassPrev4Texture, _c0067);
    _c0069 = TEX0.xy + -VARt1;
    _TMP9 = COMPAT_TEXTURE(Texture, _c0069);
    _c0071 = TEX0.xy + -VARt1;
    _TMP10 = COMPAT_TEXTURE(PassPrev4Texture, _c0071);
    _c0073 = TEX0.xy + vec2( 1.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP11 = COMPAT_TEXTURE(Texture, _c0073);
    _c0075 = TEX0.xy + vec2( 1.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP12 = COMPAT_TEXTURE(PassPrev4Texture, _c0075);
    _c0077 = TEX0.xy + vec2( -1.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP13 = COMPAT_TEXTURE(Texture, _c0077);
    _c0079 = TEX0.xy + vec2( -1.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP14 = COMPAT_TEXTURE(PassPrev4Texture, _c0079);
    _c0081 = TEX0.xy + VARt1;
    _TMP15 = COMPAT_TEXTURE(Texture, _c0081);
    _c0083 = TEX0.xy + VARt1;
    _TMP16 = COMPAT_TEXTURE(PassPrev4Texture, _c0083);
    _TMP35 = max(_TMP5.xy, _TMP7.xy);
    _TMP36 = max(_TMP3.xy, _TMP35);
    _TMP84 = max(_TMP1.xy, _TMP36);
    _TMP92 = min(_C.zw, _TMP84);
    _TMP96 = max(_C.xy, _TMP92);
    _C.xy = _TMP96;
    _a0103 = bvec3(_TMP0.x == _TMP6.x, _TMP0.y == _TMP6.y, _TMP0.z == _TMP6.z);
    _TMP100 = _a0103.x && _a0103.y && _a0103.z;
    _b0105 = float(_TMP100);
    _TMP104 = min(_TMP5.y, _b0105);
    _a0111 = bvec3(_TMP0.x == _TMP8.x, _TMP0.y == _TMP8.y, _TMP0.z == _TMP8.z);
    _TMP108 = _a0111.x && _a0111.y && _a0111.z;
    _b0113 = float(_TMP108);
    _TMP112 = min(_TMP7.y, _b0113);
    _a0119 = bvec3(_TMP0.x == _TMP2.x, _TMP0.y == _TMP2.y, _TMP0.z == _TMP2.z);
    _TMP116 = _a0119.x && _a0119.y && _a0119.z;
    _b0121 = float(_TMP116);
    _TMP120 = min(_TMP1.y, _b0121);
    _a0127 = bvec3(_TMP0.x == _TMP4.x, _TMP0.y == _TMP4.y, _TMP0.z == _TMP4.z);
    _TMP124 = _a0127.x && _a0127.y && _a0127.z;
    _b0129 = float(_TMP124);
    _TMP128 = min(_TMP3.y, _b0129);
    _a0135 = bvec3(_TMP0.x == _TMP10.x, _TMP0.y == _TMP10.y, _TMP0.z == _TMP10.z);
    _TMP132 = _a0135.x && _a0135.y && _a0135.z;
    _b0137 = vec2(float(_TMP132), float(_TMP132));
    _TMP136 = min(_TMP9.yy, _b0137);
    _a0143 = bvec3(_TMP0.x == _TMP12.x, _TMP0.y == _TMP12.y, _TMP0.z == _TMP12.z);
    _TMP140 = _a0143.x && _a0143.y && _a0143.z;
    _b0145 = vec2(float(_TMP140), float(_TMP140));
    _TMP144 = min(_TMP11.yy, _b0145);
    _a0151 = bvec3(_TMP0.x == _TMP14.x, _TMP0.y == _TMP14.y, _TMP0.z == _TMP14.z);
    _TMP148 = _a0151.x && _a0151.y && _a0151.z;
    _b0153 = vec2(float(_TMP148), float(_TMP148));
    _TMP152 = min(_TMP13.yy, _b0153);
    _a0159 = bvec3(_TMP0.x == _TMP16.x, _TMP0.y == _TMP16.y, _TMP0.z == _TMP16.z);
    _TMP156 = _a0159.x && _a0159.y && _a0159.z;
    _b0161 = vec2(float(_TMP156), float(_TMP156));
    _TMP160 = min(_TMP15.yy, _b0161);
    _TMP37 = max(_TMP152.x, _TMP160.x);
    _TMP38 = max(_TMP144.x, _TMP37);
    _TMP39 = max(_TMP136.x, _TMP38);
    _TMP40 = max(_TMP128, _TMP39);
    _TMP41 = max(_TMP120, _TMP40);
    _TMP42 = max(_TMP112, _TMP41);
    _TMP43 = max(_TMP104, _TMP42);
    _TMP164 = max(_TMP96.y, _TMP43);
    _C.y = _TMP164;
    FragColor = _C;
    return;
} 
#endif
