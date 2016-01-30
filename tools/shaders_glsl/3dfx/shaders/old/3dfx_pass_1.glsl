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
COMPAT_VARYING     vec4 _color1;
struct output_dummy {
    vec4 _color1;
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
vec4 _r0005;
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
    vec4 _oColor;
    vec2 _otexCoord;
    _r0005 = VertexCoord.x*MVPMatrix[0];
    _r0005 = _r0005 + VertexCoord.y*MVPMatrix[1];
    _r0005 = _r0005 + VertexCoord.z*MVPMatrix[2];
    _r0005 = _r0005 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0005;
    _oColor = COLOR;
    _otexCoord = TexCoord.xy;
    gl_Position = _r0005;
    COL0 = COLOR;
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
COMPAT_VARYING     float _frame_rotation;
COMPAT_VARYING     vec4 _color;
struct output_dummy {
    vec4 _color;
};
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
float _TMP0;
uniform sampler2D Texture;
input_dummy _IN1;
float _x0008;
float _y0010;
float _y0012;
float _y0014;
COMPAT_VARYING vec4 TEX0;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    output_dummy _OUT;
    float _leifx_linegamma;
    vec2 _dithet;
    float _horzline1;
    float _leifx_gamma;
    _OUT._color = COMPAT_TEXTURE(Texture, TEX0.xy);
    _leifx_linegamma = 1.50000006E-01;
    _dithet.y = TEX0.y*TextureSize.y;
    _x0008 = _dithet.y/2.00000000E+00;
    _TMP0 = floor(_x0008);
    _horzline1 = _dithet.y - 2.00000000E+00*_TMP0;
    if (_horzline1 < 1.00000000E+00) { 
        _leifx_linegamma = 0.00000000E+00;
    } 
    _leifx_gamma = 1.14999998E+00 + _leifx_linegamma;
    _y0010 = 1.00000000E+00/_leifx_gamma;
    _OUT._color.x = pow(_OUT._color.x, _y0010);
    _y0012 = 1.00000000E+00/_leifx_gamma;
    _OUT._color.y = pow(_OUT._color.y, _y0012);
    _y0014 = 1.00000000E+00/_leifx_gamma;
    _OUT._color.z = pow(_OUT._color.z, _y0014);
    FragColor = _OUT._color;
    return;
} 
#endif
