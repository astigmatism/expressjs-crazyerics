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
COMPAT_VARYING     vec2 _blur_dxdy;
COMPAT_VARYING     vec2 _tex_uv1;
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
    vec2 _tex_uv1;
    vec2 _blur_dxdy;
};
out_vertex _ret_0;
input_dummy _IN1;
vec4 _r0006;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    out_vertex _OUT;
    vec2 _dxdy_scale;
    vec2 _dxdy;
    _r0006 = VertexCoord.x*MVPMatrix[0];
    _r0006 = _r0006 + VertexCoord.y*MVPMatrix[1];
    _r0006 = _r0006 + VertexCoord.z*MVPMatrix[2];
    _r0006 = _r0006 + VertexCoord.w*MVPMatrix[3];
    _dxdy_scale = InputSize/OutputSize;
    _dxdy = _dxdy_scale/TextureSize;
    _OUT._blur_dxdy = vec2(_dxdy.x, 0.00000000E+00);
    _ret_0._position1 = _r0006;
    _ret_0._tex_uv1 = TexCoord.xy;
    _ret_0._blur_dxdy = _OUT._blur_dxdy;
    gl_Position = _r0006;
    TEX0.xy = TexCoord.xy;
    TEX1.xy = _OUT._blur_dxdy;
    return;
    TEX0.xy = _ret_0._tex_uv1;
    TEX1.xy = _ret_0._blur_dxdy;
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
COMPAT_VARYING     vec2 _blur_dxdy;
COMPAT_VARYING     vec2 _tex_uv1;
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
    vec2 _tex_uv1;
    vec2 _blur_dxdy;
};
vec4 _TMP7;
uniform sampler2D Texture;
vec3 _TMP12;
float _weight_sum_inv0015;
vec3 _sum0015;
float _TMP16;
float _TMP20;
float _TMP24;
vec2 _tex_coords0029;
vec2 _tex_coords0035;
vec2 _tex_coords0041;
vec2 _tex_coords0053;
vec2 _tex_coords0059;
vec2 _tex_coords0065;
vec4 _color0071;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    _TMP16 = pow(2.71828198E+00, -2.69917697E-01);
    _TMP20 = pow(2.71828198E+00, -1.07967079E+00);
    _TMP24 = pow(2.71828198E+00, -2.42925930E+00);
    _weight_sum_inv0015 = 1.00000000E+00/(1.00000000E+00 + 2.00000000E+00*(_TMP16 + _TMP20 + _TMP24));
    _tex_coords0029 = TEX0.xy - 3.00000000E+00*TEX1.xy;
    _TMP7 = COMPAT_TEXTURE(Texture, _tex_coords0029);
    _sum0015 = _TMP24*_TMP7.xyz;
    _tex_coords0035 = TEX0.xy - 2.00000000E+00*TEX1.xy;
    _TMP7 = COMPAT_TEXTURE(Texture, _tex_coords0035);
    _sum0015 = _sum0015 + _TMP20*_TMP7.xyz;
    _tex_coords0041 = TEX0.xy - TEX1.xy;
    _TMP7 = COMPAT_TEXTURE(Texture, _tex_coords0041);
    _sum0015 = _sum0015 + _TMP16*_TMP7.xyz;
    _TMP7 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _sum0015 = _sum0015 + _TMP7.xyz;
    _tex_coords0053 = TEX0.xy + TEX1.xy;
    _TMP7 = COMPAT_TEXTURE(Texture, _tex_coords0053);
    _sum0015 = _sum0015 + _TMP16*_TMP7.xyz;
    _tex_coords0059 = TEX0.xy + 2.00000000E+00*TEX1.xy;
    _TMP7 = COMPAT_TEXTURE(Texture, _tex_coords0059);
    _sum0015 = _sum0015 + _TMP20*_TMP7.xyz;
    _tex_coords0065 = TEX0.xy + 3.00000000E+00*TEX1.xy;
    _TMP7 = COMPAT_TEXTURE(Texture, _tex_coords0065);
    _sum0015 = _sum0015 + _TMP24*_TMP7.xyz;
    _TMP12 = _sum0015*_weight_sum_inv0015;
    _color0071 = vec4(_TMP12.x, _TMP12.y, _TMP12.z, 1.00000000E+00);
    FragColor = _color0071;
    return;
} 
#endif
