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
};
vec4 _oPosition1;
out_vertex _ret_0;
vec4 _r0009;
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
    vec2 _tex;
    _r0009 = VertexCoord.x*MVPMatrix[0];
    _r0009 = _r0009 + VertexCoord.y*MVPMatrix[1];
    _r0009 = _r0009 + VertexCoord.z*MVPMatrix[2];
    _r0009 = _r0009 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0009;
    _tex = TexCoord.xy + vec2( 1.00000001E-07, 1.00000001E-07);
    _ret_0._texCoord = _tex;
    gl_Position = _r0009;
    TEX0.xy = _tex;
    return;
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
};
vec4 _ret_0;
float _TMP1;
vec4 _TMP0;
uniform sampler2D Texture;
vec3 _r0015;
vec3 _r0019;
COMPAT_VARYING vec4 TEX0;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec3 _c1;
    vec2 _TMP8;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _r0015 = _TMP0.x*vec3( 2.98999995E-01, 5.96000016E-01, 2.11999997E-01);
    _r0015 = _r0015 + _TMP0.y*vec3( 5.87000012E-01, -2.75000006E-01, -5.23000002E-01);
    _r0015 = _r0015 + _TMP0.z*vec3( 1.14000000E-01, -3.21000010E-01, 3.10999990E-01);
    _TMP1 = pow(_r0015.x, 1.20000005E+00);
    _TMP8 = _r0015.yz*vec2( 1.20000005E+00, 1.20000005E+00);
    _c1 = vec3(_TMP1, _TMP8.x, _TMP8.y);
    _r0019 = _c1.xxx + _c1.y*vec3( 9.55688059E-01, -2.71581799E-01, -1.10817730E+00);
    _r0019 = _r0019 + _c1.z*vec3( 6.19858086E-01, -6.46873832E-01, 1.70506454E+00);
    _ret_0 = vec4(_r0019.x, _r0019.y, _r0019.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
