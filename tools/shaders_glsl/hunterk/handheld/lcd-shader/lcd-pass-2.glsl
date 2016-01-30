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
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
float _placeholder22;
};
struct pass_1 {
float _placeholder26;
};
vec4 _oPosition1;
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
    vec2 _oTexCoord;
    _r0006 = VertexCoord.x*MVPMatrix[0];
    _r0006 = _r0006 + VertexCoord.y*MVPMatrix[1];
    _r0006 = _r0006 + VertexCoord.z*MVPMatrix[2];
    _r0006 = _r0006 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0006;
    _oTexCoord = TexCoord.xy;
    gl_Position = _r0006;
    TEX0.xy = TexCoord.xy;
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
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
float _placeholder27;
};
struct pass_1 {
float _placeholder31;
};
vec4 _ret_0;
float _TMP5;
float _TMP4;
float _TMP3;
vec3 _TMP6;
vec3 _TMP8;
vec3 _TMP7;
vec4 _TMP2;
vec4 _TMP1;
vec4 _TMP0;
pass_1 _PASS11;
input_dummy _IN1;
uniform sampler2D BACKGROUND;
vec3 _x0026;
vec3 _TMP27;
COMPAT_VARYING vec4 TEX0;
 
uniform sampler2D Texture;
uniform sampler2D Pass1Texture;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _lcd_color;
    vec4 _input_dummy_color;
    vec4 _bg_color;
    vec4 _out_color;
    vec3 _TMP12;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _lcd_color = vec4(float(_TMP0.x), float(_TMP0.y), float(_TMP0.z), float(_TMP0.w));
    _TMP1 = COMPAT_TEXTURE(Pass1Texture, TEX0.xy);
    _input_dummy_color = vec4(float(_TMP1.x), float(_TMP1.y), float(_TMP1.z), float(_TMP1.w));
    _TMP2 = COMPAT_TEXTURE(BACKGROUND, TEX0.xy);
    _bg_color = vec4(float(_TMP2.x), float(_TMP2.y), float(_TMP2.z), float(_TMP2.w));
    _TMP12 = _lcd_color.xyz*9.00390625E-01 + _input_dummy_color.xyz*9.96093750E-02;
    _out_color = vec4(_TMP12.x, _TMP12.y, _TMP12.z, _input_dummy_color.w);
    _TMP3 = -1.00000000E+00 + _bg_color.x*1.99902344E+00;
    _TMP4 = -1.00000000E+00 + _bg_color.y*1.99902344E+00;
    _TMP5 = -1.00000000E+00 + _bg_color.z*1.99902344E+00;
    _x0026 = vec3(_TMP3, _TMP4, _TMP5);
    _TMP7 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), vec3(float(_x0026.x), float(_x0026.y), float(_x0026.z)));
    _TMP6 = vec3(float(_TMP7.x), float(_TMP7.y), float(_TMP7.z));
    _TMP8 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), vec3(float(_TMP6.x), float(_TMP6.y), float(_TMP6.z)));
    _TMP27 = vec3(float(_TMP8.x), float(_TMP8.y), float(_TMP8.z));
    _out_color.xyz = _TMP27*float((_out_color.w == 0.00000000E+00)) + _out_color.xyz*float(!bool(float((_out_color.w == 0.00000000E+00))));
    _ret_0 = vec4(float(_out_color.x), float(_out_color.y), float(_out_color.z), float(_out_color.w));
    FragColor = _ret_0;
    return;
} 
#endif
