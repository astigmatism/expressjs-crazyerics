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
COMPAT_VARYING     vec2 _upper_bound;
COMPAT_VARYING     vec2 _lower_bound;
COMPAT_VARYING     vec2 _tex_coord_4;
COMPAT_VARYING     vec2 _tex_coord_3;
COMPAT_VARYING     vec2 _tex_coord_2;
COMPAT_VARYING     vec2 _tex_coord_1;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
float _placeholder33;
};
struct blur_coords {
    vec2 _tex_coord_1;
    vec2 _tex_coord_2;
    vec2 _tex_coord_3;
    vec2 _tex_coord_4;
    vec2 _lower_bound;
    vec2 _upper_bound;
};
vec4 _oPosition1;
blur_coords _oBlurCoords1;
input_dummy _IN1;
vec4 _r0007;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
COMPAT_VARYING vec4 TEX2;
COMPAT_VARYING vec4 TEX3;
COMPAT_VARYING vec4 TEX4;
COMPAT_VARYING vec4 TEX5;
COMPAT_VARYING vec4 TEX6;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec2 _oTexCoord;
    vec2 _texel;
    blur_coords _TMP3;
    _r0007 = VertexCoord.x*MVPMatrix[0];
    _r0007 = _r0007 + VertexCoord.y*MVPMatrix[1];
    _r0007 = _r0007 + VertexCoord.z*MVPMatrix[2];
    _r0007 = _r0007 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0007;
    _oTexCoord = TexCoord.xy;
    _texel = vec2(float((1.00000000E+00/TextureSize).x), float((1.00000000E+00/TextureSize).y));
    _TMP3._tex_coord_1 = vec2(float((TexCoord.xy + vec2(0.00000000E+00, float(_texel.y))).x), float((TexCoord.xy + vec2(0.00000000E+00, float(_texel.y))).y));
    _TMP3._tex_coord_2 = vec2(float((TexCoord.xy + vec2(0.00000000E+00, float(-_texel.y))).x), float((TexCoord.xy + vec2(0.00000000E+00, float(-_texel.y))).y));
    _TMP3._tex_coord_3 = vec2(float((TexCoord.xy + vec2(float(_texel.x), 0.00000000E+00)).x), float((TexCoord.xy + vec2(float(_texel.x), 0.00000000E+00)).y));
    _TMP3._tex_coord_4 = vec2(float((TexCoord.xy + vec2(float(-_texel.x), 0.00000000E+00)).x), float((TexCoord.xy + vec2(float(-_texel.x), 0.00000000E+00)).y));
    _TMP3._upper_bound = vec2(float((vec2(float(_texel.x), float(_texel.y))*(OutputSize - 2.00000000E+00)).x), float((vec2(float(_texel.x), float(_texel.y))*(OutputSize - 2.00000000E+00)).y));
    _oBlurCoords1._tex_coord_1 = _TMP3._tex_coord_1;
    _oBlurCoords1._tex_coord_2 = _TMP3._tex_coord_2;
    _oBlurCoords1._tex_coord_3 = _TMP3._tex_coord_3;
    _oBlurCoords1._tex_coord_4 = _TMP3._tex_coord_4;
    _oBlurCoords1._lower_bound = vec2( 0.00000000E+00, 0.00000000E+00);
    _oBlurCoords1._upper_bound = _TMP3._upper_bound;
    gl_Position = _r0007;
    TEX0.xy = TexCoord.xy;
    TEX1.xy = _TMP3._tex_coord_1;
    TEX2.xy = _TMP3._tex_coord_2;
    TEX3.xy = _TMP3._tex_coord_3;
    TEX4.xy = _TMP3._tex_coord_4;
    TEX5.xy = vec2( 0.00000000E+00, 0.00000000E+00);
    TEX6.xy = _TMP3._upper_bound;
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
COMPAT_VARYING     vec2 _upper_bound;
COMPAT_VARYING     vec2 _lower_bound;
COMPAT_VARYING     vec2 _tex_coord_4;
COMPAT_VARYING     vec2 _tex_coord_3;
COMPAT_VARYING     vec2 _tex_coord_2;
COMPAT_VARYING     vec2 _tex_coord_1;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
float _placeholder29;
};
struct blur_coords {
    vec2 _tex_coord_1;
    vec2 _tex_coord_2;
    vec2 _tex_coord_3;
    vec2 _tex_coord_4;
    vec2 _lower_bound;
    vec2 _upper_bound;
};
vec4 _ret_0;
float _TMP9;
float _TMP11;
float _TMP10;
vec4 _TMP4;
vec4 _TMP3;
vec4 _TMP2;
vec4 _TMP1;
vec2 _TMP6;
vec2 _TMP8;
vec2 _TMP7;
vec4 _TMP0;
input_dummy _IN2;
vec4 _adjacent_texel_10017;
vec4 _adjacent_texel_20017;
vec4 _adjacent_texel_30017;
vec4 _adjacent_texel_40017;
vec4 _COLOR0017;
vec2 _TMP18;
vec2 _TMP24;
vec2 _TMP30;
vec2 _TMP36;
vec2 _c0043;
vec2 _c0045;
vec2 _c0047;
vec2 _c0049;
float _x0051;
float _TMP52;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
COMPAT_VARYING vec4 TEX2;
COMPAT_VARYING vec4 TEX3;
COMPAT_VARYING vec4 TEX4;
COMPAT_VARYING vec4 TEX5;
COMPAT_VARYING vec4 TEX6;
 
uniform sampler2D Texture;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _out_color;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _out_color = vec4(float(_TMP0.x), float(_TMP0.y), float(_TMP0.z), float(_TMP0.w));
    _TMP7 = min(vec2(float(TEX6.x), float(TEX6.y)), vec2(float(TEX1.x), float(TEX1.y)));
    _TMP6 = vec2(float(_TMP7.x), float(_TMP7.y));
    _TMP8 = max(vec2(float(TEX5.x), float(TEX5.y)), vec2(float(_TMP6.x), float(_TMP6.y)));
    _TMP18 = vec2(float(_TMP8.x), float(_TMP8.y));
    _TMP7 = min(vec2(float(TEX6.x), float(TEX6.y)), vec2(float(TEX2.x), float(TEX2.y)));
    _TMP6 = vec2(float(_TMP7.x), float(_TMP7.y));
    _TMP8 = max(vec2(float(TEX5.x), float(TEX5.y)), vec2(float(_TMP6.x), float(_TMP6.y)));
    _TMP24 = vec2(float(_TMP8.x), float(_TMP8.y));
    _TMP7 = min(vec2(float(TEX6.x), float(TEX6.y)), vec2(float(TEX3.x), float(TEX3.y)));
    _TMP6 = vec2(float(_TMP7.x), float(_TMP7.y));
    _TMP8 = max(vec2(float(TEX5.x), float(TEX5.y)), vec2(float(_TMP6.x), float(_TMP6.y)));
    _TMP30 = vec2(float(_TMP8.x), float(_TMP8.y));
    _TMP7 = min(vec2(float(TEX6.x), float(TEX6.y)), vec2(float(TEX4.x), float(TEX4.y)));
    _TMP6 = vec2(float(_TMP7.x), float(_TMP7.y));
    _TMP8 = max(vec2(float(TEX5.x), float(TEX5.y)), vec2(float(_TMP6.x), float(_TMP6.y)));
    _TMP36 = vec2(float(_TMP8.x), float(_TMP8.y));
    _c0043 = vec2(float(_TMP18.x), float(_TMP18.y));
    _TMP1 = COMPAT_TEXTURE(Texture, _c0043);
    _adjacent_texel_10017 = vec4(float(_TMP1.x), float(_TMP1.y), float(_TMP1.z), float(_TMP1.w));
    _c0045 = vec2(float(_TMP24.x), float(_TMP24.y));
    _TMP2 = COMPAT_TEXTURE(Texture, _c0045);
    _adjacent_texel_20017 = vec4(float(_TMP2.x), float(_TMP2.y), float(_TMP2.z), float(_TMP2.w));
    _c0047 = vec2(float(_TMP30.x), float(_TMP30.y));
    _TMP3 = COMPAT_TEXTURE(Texture, _c0047);
    _adjacent_texel_30017 = vec4(float(_TMP3.x), float(_TMP3.y), float(_TMP3.z), float(_TMP3.w));
    _c0049 = vec2(float(_TMP36.x), float(_TMP36.y));
    _TMP4 = COMPAT_TEXTURE(Texture, _c0049);
    _adjacent_texel_40017 = vec4(float(_TMP4.x), float(_TMP4.y), float(_TMP4.z), float(_TMP4.w));
    _x0051 = float((_out_color.w == 0.00000000E+00));
    _TMP10 = min(1.00000000E+00, float(_x0051));
    _TMP9 = float(_TMP10);
    _TMP11 = max(0.00000000E+00, float(_TMP9));
    _TMP52 = float(_TMP11);
    _COLOR0017.w = _out_color.w - ((_out_color.w - _adjacent_texel_10017.w) + (_out_color.w - _adjacent_texel_20017.w) + (_out_color.w - _adjacent_texel_30017.w) + (_out_color.w - _adjacent_texel_40017.w))*3.79882812E-01*_TMP52;
    _ret_0 = vec4(float(_out_color.x), float(_out_color.y), float(_out_color.z), float(_COLOR0017.w));
    FragColor = _ret_0;
    return;
} 
#endif
