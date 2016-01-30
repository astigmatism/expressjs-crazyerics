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
vec4 _oPosition1;
vec4 _r0005;
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
    vec2 _oTex;
    _r0005 = VertexCoord.x*MVPMatrix[0];
    _r0005 = _r0005 + VertexCoord.y*MVPMatrix[1];
    _r0005 = _r0005 + VertexCoord.z*MVPMatrix[2];
    _r0005 = _r0005 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0005;
    _oTex = TexCoord.xy;
    gl_Position = _r0005;
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
vec4 _ret_0;
vec3 _TMP10;
float _TMP9;
float _TMP8;
float _TMP7;
float _TMP6;
vec4 _TMP0;
uniform sampler2D Texture;
vec3 _TMP32;
vec3 _x0053;
vec3 _TMP54;
COMPAT_VARYING vec4 TEX0;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec3 _res;
    vec4 _c;
    float _w;
    float _q;
    float _e;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _TMP6 = dot(_TMP0.xyz, vec3( 2.12599993E-01, 7.15200007E-01, 7.22000003E-02));
    _res = vec3(_TMP6, _TMP6, _TMP6) + (_TMP0.xyz - vec3(_TMP6, _TMP6, _TMP6));
    _TMP7 = pow(_res.x, 2.35294127E+00);
    _TMP8 = pow(_res.y, 2.35294127E+00);
    _TMP9 = pow(_res.z, 2.35294127E+00);
    _res = vec3(_TMP7, _TMP8, _TMP9);
    _TMP10 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _res);
    _TMP32 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP10);
    _c = vec4(_TMP32.x, _TMP32.y, _TMP32.z, 1.00000000E+00);
    _w = _c.x*7.13999987E-01 + _c.y*2.50999987E-01;
    _q = _c.x*7.10000023E-02 + _c.y*6.43000007E-01 + _c.z*2.16000006E-01;
    _e = _c.x*7.10000023E-02 + _c.y*2.16000006E-01 + _c.z*6.43000007E-01;
    _res = vec3(_w, _q, _e);
    _TMP6 = dot(_res, vec3( 2.12599993E-01, 7.15200007E-01, 7.22000003E-02));
    _res = vec3(_TMP6, _TMP6, _TMP6) + (_res - vec3(_TMP6, _TMP6, _TMP6));
    _TMP7 = pow(_res.x, 6.66666687E-01);
    _TMP8 = pow(_res.y, 6.66666687E-01);
    _TMP9 = pow(_res.z, 6.66666687E-01);
    _res = vec3(_TMP7, _TMP8, _TMP9);
    _x0053 = _res*1.00999999E+00;
    _TMP10 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0053);
    _TMP54 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP10);
    _ret_0 = vec4(_TMP54.x, _TMP54.y, _TMP54.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
