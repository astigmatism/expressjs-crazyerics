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
COMPAT_VARYING     vec4 _t7;
COMPAT_VARYING     vec4 _t6;
COMPAT_VARYING     vec4 _t5;
COMPAT_VARYING     vec4 _t4;
COMPAT_VARYING     vec4 _t3;
COMPAT_VARYING     vec4 _t2;
COMPAT_VARYING     vec4 _t1;
COMPAT_VARYING     vec2 _texCoord2;
COMPAT_VARYING     vec4 _color1;
COMPAT_VARYING     vec4 _position1;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec4 _position1;
    vec4 _color1;
    vec2 _texCoord2;
    vec4 _t1;
    vec4 _t2;
    vec4 _t3;
    vec4 _t4;
    vec4 _t5;
    vec4 _t6;
    vec4 _t7;
};
out_vertex _ret_0;
input_dummy _IN1;
vec4 _r0008;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 COLOR;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 COL0;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
COMPAT_VARYING vec4 TEX2;
COMPAT_VARYING vec4 TEX3;
COMPAT_VARYING vec4 TEX4;
COMPAT_VARYING vec4 TEX5;
COMPAT_VARYING vec4 TEX6;
COMPAT_VARYING vec4 TEX7;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    out_vertex _OUT;
    vec2 _ps;
    vec2 _texCoord;
    _r0008 = VertexCoord.x*MVPMatrix[0];
    _r0008 = _r0008 + VertexCoord.y*MVPMatrix[1];
    _r0008 = _r0008 + VertexCoord.z*MVPMatrix[2];
    _r0008 = _r0008 + VertexCoord.w*MVPMatrix[3];
    _ps = vec2(1.00000000E+00/TextureSize.x, 1.00000000E+00/TextureSize.y);
    _texCoord = TexCoord.xy + vec2( 1.00000001E-07, 1.00000001E-07);
    _OUT._t1 = _texCoord.xxxy + vec4(-_ps.x, 0.00000000E+00, _ps.x, -2.00000000E+00*_ps.y);
    _OUT._t2 = _texCoord.xxxy + vec4(-_ps.x, 0.00000000E+00, _ps.x, -_ps.y);
    _OUT._t3 = _texCoord.xxxy + vec4(-_ps.x, 0.00000000E+00, _ps.x, 0.00000000E+00);
    _OUT._t4 = _texCoord.xxxy + vec4(-_ps.x, 0.00000000E+00, _ps.x, _ps.y);
    _OUT._t5 = _texCoord.xxxy + vec4(-_ps.x, 0.00000000E+00, _ps.x, 2.00000000E+00*_ps.y);
    _OUT._t6 = _texCoord.xyyy + vec4(-2.00000000E+00*_ps.x, -_ps.y, 0.00000000E+00, _ps.y);
    _OUT._t7 = _texCoord.xyyy + vec4(2.00000000E+00*_ps.x, -_ps.y, 0.00000000E+00, _ps.y);
    _ret_0._position1 = _r0008;
    _ret_0._color1 = COLOR;
    _ret_0._texCoord2 = _texCoord;
    _ret_0._t1 = _OUT._t1;
    _ret_0._t2 = _OUT._t2;
    _ret_0._t3 = _OUT._t3;
    _ret_0._t4 = _OUT._t4;
    _ret_0._t5 = _OUT._t5;
    _ret_0._t6 = _OUT._t6;
    _ret_0._t7 = _OUT._t7;
    gl_Position = _r0008;
    COL0 = COLOR;
    TEX0.xy = _texCoord;
    TEX1 = _OUT._t1;
    TEX2 = _OUT._t2;
    TEX3 = _OUT._t3;
    TEX4 = _OUT._t4;
    TEX5 = _OUT._t5;
    TEX6 = _OUT._t6;
    TEX7 = _OUT._t7;
    return;
    COL0 = _ret_0._color1;
    TEX0.xy = _ret_0._texCoord2;
    TEX1 = _ret_0._t1;
    TEX2 = _ret_0._t2;
    TEX3 = _ret_0._t3;
    TEX4 = _ret_0._t4;
    TEX5 = _ret_0._t5;
    TEX6 = _ret_0._t6;
    TEX7 = _ret_0._t7;
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
COMPAT_VARYING     vec4 _t7;
COMPAT_VARYING     vec4 _t6;
COMPAT_VARYING     vec4 _t5;
COMPAT_VARYING     vec4 _t4;
COMPAT_VARYING     vec4 _t3;
COMPAT_VARYING     vec4 _t2;
COMPAT_VARYING     vec4 _t1;
COMPAT_VARYING     vec2 _texCoord;
COMPAT_VARYING     vec4 _color;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec4 _color;
    vec2 _texCoord;
    vec4 _t1;
    vec4 _t2;
    vec4 _t3;
    vec4 _t4;
    vec4 _t5;
    vec4 _t6;
    vec4 _t7;
};
vec4 _ret_0;
vec3 _TMP46;
vec3 _TMP44;
vec3 _TMP42;
vec3 _TMP40;
vec3 _TMP45;
vec3 _TMP43;
vec3 _TMP41;
vec3 _TMP39;
vec4 _TMP38;
vec4 _TMP31;
vec4 _TMP30;
vec4 _TMP53;
bvec4 _TMP29;
bvec4 _TMP28;
bvec4 _TMP27;
bvec4 _TMP26;
bvec4 _TMP25;
bvec4 _TMP24;
bvec4 _TMP23;
bvec4 _TMP22;
bvec4 _TMP21;
vec4 _TMP20;
vec4 _TMP19;
vec4 _TMP18;
vec4 _TMP17;
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
uniform sampler2D Texture;
input_dummy _IN1;
vec2 _x0068;
vec4 _r0112;
vec4 _r0122;
vec4 _r0132;
vec4 _r0142;
vec4 _r0152;
vec4 _r0162;
vec4 _TMP173;
vec4 _a0176;
vec4 _TMP179;
vec4 _a0182;
vec4 _TMP185;
vec4 _a0188;
vec4 _TMP191;
vec4 _a0194;
vec4 _TMP197;
vec4 _a0200;
vec4 _TMP203;
vec4 _a0206;
vec4 _TMP209;
vec4 _a0212;
vec4 _TMP215;
vec4 _a0218;
vec4 _TMP221;
vec4 _a0224;
vec4 _x0226;
vec4 _TMP227;
vec4 _x0234;
vec4 _TMP235;
vec4 _x0242;
vec4 _TMP243;
vec4 _TMP251;
vec4 _a0254;
vec4 _TMP255;
vec4 _a0258;
vec4 _TMP259;
vec4 _a0262;
vec4 _TMP263;
vec4 _a0266;
vec4 _TMP267;
vec4 _a0270;
vec4 _TMP273;
vec4 _a0276;
vec4 _TMP277;
vec4 _a0280;
vec4 _TMP281;
vec4 _a0284;
vec4 _TMP285;
vec4 _a0288;
vec4 _TMP289;
vec4 _a0292;
vec4 _TMP293;
vec4 _a0296;
vec4 _TMP297;
vec4 _a0300;
vec4 _TMP301;
vec4 _a0304;
vec4 _TMP305;
vec4 _a0308;
vec4 _TMP309;
vec4 _a0312;
vec4 _TMP313;
vec4 _a0316;
float _t0322;
float _t0326;
float _t0330;
float _t0334;
vec4 _r0338;
vec4 _TMP347;
vec4 _a0350;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
COMPAT_VARYING vec4 TEX2;
COMPAT_VARYING vec4 TEX3;
COMPAT_VARYING vec4 TEX4;
COMPAT_VARYING vec4 TEX5;
COMPAT_VARYING vec4 TEX6;
COMPAT_VARYING vec4 TEX7;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    bvec4 _edr;
    bvec4 _edr_left;
    bvec4 _edr_up;
    bvec4 _px;
    bvec4 _interp_restriction_lv1;
    bvec4 _interp_restriction_lv2_left;
    bvec4 _interp_restriction_lv2_up;
    vec4 _fx;
    vec4 _fx_left;
    vec4 _fx_up;
    vec2 _fp;
    vec4 _fx45;
    vec4 _fx30;
    vec4 _fx60;
    vec4 _maximo;
    vec3 _res;
    float _mx;
    _x0068 = TEX0.xy*TextureSize;
    _fp = fract(_x0068);
    _TMP0 = COMPAT_TEXTURE(Texture, TEX1.xw);
    _TMP1 = COMPAT_TEXTURE(Texture, TEX1.yw);
    _TMP2 = COMPAT_TEXTURE(Texture, TEX1.zw);
    _TMP3 = COMPAT_TEXTURE(Texture, TEX2.xw);
    _TMP4 = COMPAT_TEXTURE(Texture, TEX2.yw);
    _TMP5 = COMPAT_TEXTURE(Texture, TEX2.zw);
    _TMP6 = COMPAT_TEXTURE(Texture, TEX3.xw);
    _TMP7 = COMPAT_TEXTURE(Texture, TEX3.yw);
    _TMP8 = COMPAT_TEXTURE(Texture, TEX3.zw);
    _TMP9 = COMPAT_TEXTURE(Texture, TEX4.xw);
    _TMP10 = COMPAT_TEXTURE(Texture, TEX4.yw);
    _TMP11 = COMPAT_TEXTURE(Texture, TEX4.zw);
    _TMP12 = COMPAT_TEXTURE(Texture, TEX5.xw);
    _TMP13 = COMPAT_TEXTURE(Texture, TEX5.yw);
    _TMP14 = COMPAT_TEXTURE(Texture, TEX5.zw);
    _TMP15 = COMPAT_TEXTURE(Texture, TEX6.xy);
    _TMP16 = COMPAT_TEXTURE(Texture, TEX6.xz);
    _TMP17 = COMPAT_TEXTURE(Texture, TEX6.xw);
    _TMP18 = COMPAT_TEXTURE(Texture, TEX7.xy);
    _TMP19 = COMPAT_TEXTURE(Texture, TEX7.xz);
    _TMP20 = COMPAT_TEXTURE(Texture, TEX7.xw);
    _r0112.x = dot(_TMP4.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0112.y = dot(_TMP6.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0112.z = dot(_TMP10.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0112.w = dot(_TMP8.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0122.x = dot(_TMP5.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0122.y = dot(_TMP3.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0122.z = dot(_TMP9.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0122.w = dot(_TMP11.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0132.x = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0132.y = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0132.z = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0132.w = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0142.x = dot(_TMP20.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0142.y = dot(_TMP2.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0142.z = dot(_TMP15.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0142.w = dot(_TMP12.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0152.x = dot(_TMP14.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0152.y = dot(_TMP18.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0152.z = dot(_TMP0.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0152.w = dot(_TMP17.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0162.x = dot(_TMP13.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0162.y = dot(_TMP19.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0162.z = dot(_TMP1.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0162.w = dot(_TMP16.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _fx = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x;
    _fx_left = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x;
    _fx_up = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x;
    _a0176 = _r0112.wxyz - _r0112;
    _TMP173 = abs(_a0176);
    _TMP21 = bvec4(_TMP173.x < 1.50000000E+01, _TMP173.y < 1.50000000E+01, _TMP173.z < 1.50000000E+01, _TMP173.w < 1.50000000E+01);
    _a0182 = _r0112.zwxy - _r0112.yzwx;
    _TMP179 = abs(_a0182);
    _TMP22 = bvec4(_TMP179.x < 1.50000000E+01, _TMP179.y < 1.50000000E+01, _TMP179.z < 1.50000000E+01, _TMP179.w < 1.50000000E+01);
    _a0188 = _r0132 - _r0122.wxyz;
    _TMP185 = abs(_a0188);
    _TMP23 = bvec4(_TMP185.x < 1.50000000E+01, _TMP185.y < 1.50000000E+01, _TMP185.z < 1.50000000E+01, _TMP185.w < 1.50000000E+01);
    _a0194 = _r0112.wxyz - _r0142;
    _TMP191 = abs(_a0194);
    _TMP24 = bvec4(_TMP191.x < 1.50000000E+01, _TMP191.y < 1.50000000E+01, _TMP191.z < 1.50000000E+01, _TMP191.w < 1.50000000E+01);
    _a0200 = _r0112.zwxy - _r0152;
    _TMP197 = abs(_a0200);
    _TMP25 = bvec4(_TMP197.x < 1.50000000E+01, _TMP197.y < 1.50000000E+01, _TMP197.z < 1.50000000E+01, _TMP197.w < 1.50000000E+01);
    _a0206 = _r0132 - _r0122.zwxy;
    _TMP203 = abs(_a0206);
    _TMP26 = bvec4(_TMP203.x < 1.50000000E+01, _TMP203.y < 1.50000000E+01, _TMP203.z < 1.50000000E+01, _TMP203.w < 1.50000000E+01);
    _a0212 = _r0132 - _r0122;
    _TMP209 = abs(_a0212);
    _TMP27 = bvec4(_TMP209.x < 1.50000000E+01, _TMP209.y < 1.50000000E+01, _TMP209.z < 1.50000000E+01, _TMP209.w < 1.50000000E+01);
    _a0218 = _r0112 - _r0142.yzwx;
    _TMP215 = abs(_a0218);
    _TMP28 = bvec4(_TMP215.x < 1.50000000E+01, _TMP215.y < 1.50000000E+01, _TMP215.z < 1.50000000E+01, _TMP215.w < 1.50000000E+01);
    _a0224 = _r0112.yzwx - _r0152.wxyz;
    _TMP221 = abs(_a0224);
    _TMP29 = bvec4(_TMP221.x < 1.50000000E+01, _TMP221.y < 1.50000000E+01, _TMP221.z < 1.50000000E+01, _TMP221.w < 1.50000000E+01);
    _interp_restriction_lv1 = bvec4(_r0132.x != _r0112.w && _r0132.x != _r0112.z && (!_TMP21.x && !_TMP22.x || _TMP23.x && !_TMP24.x && !_TMP25.x || _TMP26.x || _TMP27.x) && (_r0112.w != _r0162.y && _r0112.w != _r0122.w || _r0112.z != _r0162.x && _r0112.z != _r0122.w || _r0112.z != _r0122.z || _r0112.w != _r0122.x || _TMP28.x && _TMP29.x), _r0132.y != _r0112.x && _r0132.y != _r0112.w && (!_TMP21.y && !_TMP22.y || _TMP23.y && !_TMP24.y && !_TMP25.y || _TMP26.y || _TMP27.y) && (_r0112.x != _r0162.z && _r0112.x != _r0122.x || _r0112.w != _r0162.y && _r0112.w != _r0122.x || _r0112.w != _r0122.w || _r0112.x != _r0122.y || _TMP28.y && _TMP29.y), _r0132.z != _r0112.y && _r0132.z != _r0112.x && (!_TMP21.z && !_TMP22.z || _TMP23.z && !_TMP24.z && !_TMP25.z || _TMP26.z || _TMP27.z) && (_r0112.y != _r0162.w && _r0112.y != _r0122.y || _r0112.x != _r0162.z && _r0112.x != _r0122.y || _r0112.x != _r0122.x || _r0112.y != _r0122.z || _TMP28.z && _TMP29.z), _r0132.w != _r0112.z && _r0132.w != _r0112.y && (!_TMP21.w && !_TMP22.w || _TMP23.w && !_TMP24.w && !_TMP25.w || _TMP26.w || _TMP27.w) && (_r0112.z != _r0162.x && _r0112.z != _r0122.z || _r0112.y != _r0162.w && _r0112.y != _r0122.z || _r0112.y != _r0122.y || _r0112.z != _r0122.w || _TMP28.w && _TMP29.w));
    _interp_restriction_lv2_left = bvec4(_r0132.x != _r0122.z && _r0112.y != _r0122.z, _r0132.y != _r0122.w && _r0112.z != _r0122.w, _r0132.z != _r0122.x && _r0112.w != _r0122.x, _r0132.w != _r0122.y && _r0112.x != _r0122.y);
    _interp_restriction_lv2_up = bvec4(_r0132.x != _r0122.x && _r0112.x != _r0122.x, _r0132.y != _r0122.y && _r0112.y != _r0122.y, _r0132.z != _r0122.z && _r0112.z != _r0122.z, _r0132.w != _r0122.w && _r0112.w != _r0122.w);
    _x0226 = (_fx + vec4( 5.00000000E-01, 5.00000000E-01, 5.00000000E-01, 5.00000000E-01)) - vec4( 1.50000000E+00, 5.00000000E-01, -5.00000000E-01, 5.00000000E-01);
    _TMP53 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0226);
    _TMP227 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP53);
    _x0234 = ((_fx_left + vec4( 2.50000000E-01, 5.00000000E-01, 2.50000000E-01, 5.00000000E-01)) - vec4( 1.00000000E+00, 1.00000000E+00, -5.00000000E-01, 0.00000000E+00))/vec4( 5.00000000E-01, 1.00000000E+00, 5.00000000E-01, 1.00000000E+00);
    _TMP53 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0234);
    _TMP235 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP53);
    _x0242 = ((_fx_up + vec4( 5.00000000E-01, 2.50000000E-01, 5.00000000E-01, 2.50000000E-01)) - vec4( 2.00000000E+00, 0.00000000E+00, -1.00000000E+00, 5.00000000E-01))/vec4( 1.00000000E+00, 5.00000000E-01, 1.00000000E+00, 5.00000000E-01);
    _TMP53 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0242);
    _TMP243 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP53);
    _a0254 = _r0132 - _r0122;
    _TMP251 = abs(_a0254);
    _a0258 = _r0132 - _r0122.zwxy;
    _TMP255 = abs(_a0258);
    _a0262 = _r0122.wxyz - _r0162;
    _TMP259 = abs(_a0262);
    _a0266 = _r0122.wxyz - _r0162.yzwx;
    _TMP263 = abs(_a0266);
    _a0270 = _r0112.zwxy - _r0112.wxyz;
    _TMP267 = abs(_a0270);
    _TMP30 = _TMP251 + _TMP255 + _TMP259 + _TMP263 + 4.00000000E+00*_TMP267;
    _a0276 = _r0112.zwxy - _r0112.yzwx;
    _TMP273 = abs(_a0276);
    _a0280 = _r0112.zwxy - _r0152;
    _TMP277 = abs(_a0280);
    _a0284 = _r0112.wxyz - _r0142;
    _TMP281 = abs(_a0284);
    _a0288 = _r0112.wxyz - _r0112;
    _TMP285 = abs(_a0288);
    _a0292 = _r0132 - _r0122.wxyz;
    _TMP289 = abs(_a0292);
    _TMP31 = _TMP273 + _TMP277 + _TMP281 + _TMP285 + 4.00000000E+00*_TMP289;
    _edr = bvec4(_TMP30.x < _TMP31.x && _interp_restriction_lv1.x, _TMP30.y < _TMP31.y && _interp_restriction_lv1.y, _TMP30.z < _TMP31.z && _interp_restriction_lv1.z, _TMP30.w < _TMP31.w && _interp_restriction_lv1.w);
    _a0296 = _r0112.wxyz - _r0122.zwxy;
    _TMP293 = abs(_a0296);
    _a0300 = _r0112.zwxy - _r0122;
    _TMP297 = abs(_a0300);
    _edr_left = bvec4((2.00000000E+00*_TMP293).x <= _TMP297.x && _interp_restriction_lv2_left.x && _edr.x, (2.00000000E+00*_TMP293).y <= _TMP297.y && _interp_restriction_lv2_left.y && _edr.y, (2.00000000E+00*_TMP293).z <= _TMP297.z && _interp_restriction_lv2_left.z && _edr.z, (2.00000000E+00*_TMP293).w <= _TMP297.w && _interp_restriction_lv2_left.w && _edr.w);
    _a0304 = _r0112.wxyz - _r0122.zwxy;
    _TMP301 = abs(_a0304);
    _a0308 = _r0112.zwxy - _r0122;
    _TMP305 = abs(_a0308);
    _edr_up = bvec4(_TMP301.x >= (2.00000000E+00*_TMP305).x && _interp_restriction_lv2_up.x && _edr.x, _TMP301.y >= (2.00000000E+00*_TMP305).y && _interp_restriction_lv2_up.y && _edr.y, _TMP301.z >= (2.00000000E+00*_TMP305).z && _interp_restriction_lv2_up.z && _edr.z, _TMP301.w >= (2.00000000E+00*_TMP305).w && _interp_restriction_lv2_up.w && _edr.w);
    _fx45 = vec4(float(_edr.x), float(_edr.y), float(_edr.z), float(_edr.w))*_TMP227;
    _fx30 = vec4(float(_edr_left.x), float(_edr_left.y), float(_edr_left.z), float(_edr_left.w))*_TMP235;
    _fx60 = vec4(float(_edr_up.x), float(_edr_up.y), float(_edr_up.z), float(_edr_up.w))*_TMP243;
    _a0312 = _r0132 - _r0112.wxyz;
    _TMP309 = abs(_a0312);
    _a0316 = _r0132 - _r0112.zwxy;
    _TMP313 = abs(_a0316);
    _px = bvec4(_TMP309.x <= _TMP313.x, _TMP309.y <= _TMP313.y, _TMP309.z <= _TMP313.z, _TMP309.w <= _TMP313.w);
    _TMP38 = max(_fx30, _fx60);
    _maximo = max(_TMP38, _fx45);
    _t0322 = float(_px.x);
    _TMP39 = _TMP10.xyz + _t0322*(_TMP8.xyz - _TMP10.xyz);
    _TMP40 = _TMP7.xyz + _maximo.x*(_TMP39 - _TMP7.xyz);
    _t0326 = float(_px.y);
    _TMP41 = _TMP8.xyz + _t0326*(_TMP4.xyz - _TMP8.xyz);
    _TMP42 = _TMP7.xyz + _maximo.y*(_TMP41 - _TMP7.xyz);
    _t0330 = float(_px.z);
    _TMP43 = _TMP4.xyz + _t0330*(_TMP6.xyz - _TMP4.xyz);
    _TMP44 = _TMP7.xyz + _maximo.z*(_TMP43 - _TMP7.xyz);
    _t0334 = float(_px.w);
    _TMP45 = _TMP6.xyz + _t0334*(_TMP10.xyz - _TMP6.xyz);
    _TMP46 = _TMP7.xyz + _maximo.w*(_TMP45 - _TMP7.xyz);
    _r0338.x = dot(_TMP40, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0338.y = dot(_TMP42, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0338.z = dot(_TMP44, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0338.w = dot(_TMP46, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _a0350 = _r0338 - _r0132;
    _TMP347 = abs(_a0350);
    _res = _TMP40;
    _mx = _TMP347.x;
    if (_TMP347.y > _TMP347.x) { 
        _res = _TMP42;
        _mx = _TMP347.y;
    } 
    if (_TMP347.z > _mx) { 
        _res = _TMP44;
        _mx = _TMP347.z;
    } 
    if (_TMP347.w > _mx) { 
        _res = _TMP46;
    } 
    _ret_0 = vec4(_res.x, _res.y, _res.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
