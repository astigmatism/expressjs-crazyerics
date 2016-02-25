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
vec4 _ret_0;
vec3 _TMP1;
float _TMP11;
float _TMP10;
float _TMP9;
vec4 _TMP12;
vec3 _TMP14;
uniform sampler2D Texture;
vec3 _TMP21;
float _weight_sum_inv0024;
vec3 _sum0024;
float _TMP25;
float _TMP29;
float _TMP33;
vec4 _TMP37;
vec2 _tex_coords0038;
vec4 _TMP55;
vec2 _tex_coords0056;
vec4 _TMP73;
vec2 _tex_coords0074;
vec4 _TMP91;
vec4 _TMP109;
vec2 _tex_coords0110;
vec4 _TMP127;
vec2 _tex_coords0128;
vec4 _TMP145;
vec2 _tex_coords0146;
vec4 _color0164;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    _TMP25 = pow(2.71828198E+00, -2.69917697E-01);
    _TMP29 = pow(2.71828198E+00, -1.07967079E+00);
    _TMP33 = pow(2.71828198E+00, -2.42925930E+00);
    _weight_sum_inv0024 = 1.00000000E+00/(1.00000000E+00 + 2.00000000E+00*(_TMP25 + _TMP29 + _TMP33));
    _tex_coords0038 = TEX0.xy - 3.00000000E+00*TEX1.xy;
    _TMP12 = COMPAT_TEXTURE(Texture, _tex_coords0038);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP37 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _TMP33*_TMP37.xyz;
    _tex_coords0056 = TEX0.xy - 2.00000000E+00*TEX1.xy;
    _TMP12 = COMPAT_TEXTURE(Texture, _tex_coords0056);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP55 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _sum0024 + _TMP29*_TMP55.xyz;
    _tex_coords0074 = TEX0.xy - TEX1.xy;
    _TMP12 = COMPAT_TEXTURE(Texture, _tex_coords0074);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP73 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _sum0024 + _TMP25*_TMP73.xyz;
    _TMP12 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP91 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _sum0024 + _TMP91.xyz;
    _tex_coords0110 = TEX0.xy + TEX1.xy;
    _TMP12 = COMPAT_TEXTURE(Texture, _tex_coords0110);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP109 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _sum0024 + _TMP25*_TMP109.xyz;
    _tex_coords0128 = TEX0.xy + 2.00000000E+00*TEX1.xy;
    _TMP12 = COMPAT_TEXTURE(Texture, _tex_coords0128);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP127 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _sum0024 + _TMP29*_TMP127.xyz;
    _tex_coords0146 = TEX0.xy + 3.00000000E+00*TEX1.xy;
    _TMP12 = COMPAT_TEXTURE(Texture, _tex_coords0146);
    _TMP9 = pow(_TMP12.x, 2.20000005E+00);
    _TMP10 = pow(_TMP12.y, 2.20000005E+00);
    _TMP11 = pow(_TMP12.z, 2.20000005E+00);
    _TMP14 = vec3(_TMP9, _TMP10, _TMP11);
    _TMP145 = vec4(_TMP14.x, _TMP14.y, _TMP14.z, _TMP12.w);
    _sum0024 = _sum0024 + _TMP33*_TMP145.xyz;
    _TMP21 = _sum0024*_weight_sum_inv0024;
    _color0164 = vec4(_TMP21.x, _TMP21.y, _TMP21.z, 1.00000000E+00);
    _TMP9 = pow(_color0164.x, 4.54545438E-01);
    _TMP10 = pow(_color0164.y, 4.54545438E-01);
    _TMP11 = pow(_color0164.z, 4.54545438E-01);
    _TMP1 = vec3(_TMP9, _TMP10, _TMP11);
    _ret_0 = vec4(_TMP1.x, _TMP1.y, _TMP1.z, _color0164.w);
    FragColor = _ret_0;
    return;
} 
#endif
