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
vec3 _TMP56;
vec3 _TMP69;
float _TMP68;
float _TMP67;
float _TMP66;
vec3 _TMP55;
vec3 _TMP54;
vec3 _TMP53;
vec3 _TMP52;
vec4 _TMP51;
vec3 _TMP65;
vec3 _TMP50;
vec3 _TMP49;
vec3 _TMP48;
vec3 _TMP47;
vec4 _TMP40;
vec4 _TMP39;
vec4 _TMP70;
bvec4 _TMP38;
bvec4 _TMP37;
bvec4 _TMP36;
bvec4 _TMP35;
bvec4 _TMP34;
bvec4 _TMP33;
bvec4 _TMP32;
bvec4 _TMP31;
bvec4 _TMP30;
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
vec2 _x0084;
vec4 _r0128;
vec4 _r0138;
vec4 _r0148;
vec4 _r0158;
vec4 _r0168;
vec4 _r0178;
vec4 _TMP189;
vec4 _a0192;
vec4 _TMP195;
vec4 _a0198;
vec4 _TMP201;
vec4 _a0204;
vec4 _TMP207;
vec4 _a0210;
vec4 _TMP213;
vec4 _a0216;
vec4 _TMP219;
vec4 _a0222;
vec4 _TMP225;
vec4 _a0228;
vec4 _TMP231;
vec4 _a0234;
vec4 _TMP237;
vec4 _a0240;
vec4 _TMP243;
vec4 _a0246;
vec4 _TMP249;
vec4 _a0252;
vec4 _TMP255;
vec4 _a0258;
vec4 _TMP261;
vec4 _a0264;
vec4 _TMP267;
vec4 _a0270;
vec4 _TMP273;
vec4 _a0276;
vec4 _TMP279;
vec4 _a0282;
vec4 _TMP285;
vec4 _a0288;
vec4 _TMP291;
vec4 _a0294;
vec4 _x0298;
vec4 _TMP299;
vec4 _x0308;
vec4 _TMP309;
vec4 _x0318;
vec4 _TMP319;
vec4 _TMP327;
vec4 _a0330;
vec4 _TMP331;
vec4 _a0334;
vec4 _TMP335;
vec4 _a0338;
vec4 _TMP339;
vec4 _a0342;
vec4 _TMP343;
vec4 _a0346;
vec4 _TMP349;
vec4 _a0352;
vec4 _TMP353;
vec4 _a0356;
vec4 _TMP357;
vec4 _a0360;
vec4 _TMP361;
vec4 _a0364;
vec4 _TMP365;
vec4 _a0368;
vec4 _TMP369;
vec4 _a0372;
vec4 _TMP373;
vec4 _a0376;
vec4 _TMP377;
vec4 _a0380;
vec4 _TMP381;
vec4 _a0384;
vec4 _TMP385;
vec4 _a0388;
vec4 _TMP389;
vec4 _a0392;
vec3 _b0396;
vec3 _b0400;
vec3 _TMP401;
vec3 _a0402;
vec3 _b0410;
vec3 _b0414;
vec3 _TMP415;
vec3 _a0416;
vec3 _TMP451;
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
    bvec4 _nc;
    bvec4 _nc30;
    bvec4 _nc60;
    bvec4 _nc45;
    vec4 _fx;
    vec4 _fx_left;
    vec4 _fx_up;
    vec2 _fp;
    vec4 _fx45;
    vec4 _fx30;
    vec4 _fx60;
    vec3 _res;
    vec3 _aa;
    vec3 _bb;
    vec3 _cc;
    vec3 _dd;
    vec3 _t;
    vec3 _m;
    vec3 _s1;
    vec3 _s0;
    float _blend;
    vec3 _pix;
    vec4 _final45;
    vec4 _final30;
    vec4 _final60;
    vec4 _maximo;
    _x0084 = TEX0.xy*TextureSize;
    _fp = fract(_x0084);
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
    _r0128.x = dot(_TMP4.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0128.y = dot(_TMP6.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0128.z = dot(_TMP10.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0128.w = dot(_TMP8.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0138.x = dot(_TMP5.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0138.y = dot(_TMP3.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0138.z = dot(_TMP9.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0138.w = dot(_TMP11.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0148.x = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0148.y = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0148.z = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0148.w = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0158.x = dot(_TMP20.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0158.y = dot(_TMP2.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0158.z = dot(_TMP15.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0158.w = dot(_TMP12.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0168.x = dot(_TMP14.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0168.y = dot(_TMP18.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0168.z = dot(_TMP0.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0168.w = dot(_TMP17.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0178.x = dot(_TMP13.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0178.y = dot(_TMP19.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0178.z = dot(_TMP1.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0178.w = dot(_TMP16.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _fx = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x;
    _fx_left = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x;
    _fx_up = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x;
    _a0192 = _r0148 - _r0128;
    _TMP189 = abs(_a0192);
    _TMP21 = bvec4(_TMP189.x < 2.00000000E+00, _TMP189.y < 2.00000000E+00, _TMP189.z < 2.00000000E+00, _TMP189.w < 2.00000000E+00);
    _a0198 = _r0148 - _r0128.yzwx;
    _TMP195 = abs(_a0198);
    _TMP22 = bvec4(_TMP195.x < 2.00000000E+00, _TMP195.y < 2.00000000E+00, _TMP195.z < 2.00000000E+00, _TMP195.w < 2.00000000E+00);
    _a0204 = _r0148 - _r0138.yzwx;
    _TMP201 = abs(_a0204);
    _TMP23 = bvec4(_TMP201.x < 2.00000000E+00, _TMP201.y < 2.00000000E+00, _TMP201.z < 2.00000000E+00, _TMP201.w < 2.00000000E+00);
    _a0210 = _r0128.wxyz - _r0178.yzwx;
    _TMP207 = abs(_a0210);
    _TMP24 = bvec4(_TMP207.x < 2.00000000E+00, _TMP207.y < 2.00000000E+00, _TMP207.z < 2.00000000E+00, _TMP207.w < 2.00000000E+00);
    _a0216 = _r0128.wxyz - _r0138;
    _TMP213 = abs(_a0216);
    _TMP25 = bvec4(_TMP213.x < 2.00000000E+00, _TMP213.y < 2.00000000E+00, _TMP213.z < 2.00000000E+00, _TMP213.w < 2.00000000E+00);
    _a0222 = _r0128.zwxy - _r0178;
    _TMP219 = abs(_a0222);
    _TMP26 = bvec4(_TMP219.x < 2.00000000E+00, _TMP219.y < 2.00000000E+00, _TMP219.z < 2.00000000E+00, _TMP219.w < 2.00000000E+00);
    _a0228 = _r0128.zwxy - _r0138.zwxy;
    _TMP225 = abs(_a0228);
    _TMP27 = bvec4(_TMP225.x < 2.00000000E+00, _TMP225.y < 2.00000000E+00, _TMP225.z < 2.00000000E+00, _TMP225.w < 2.00000000E+00);
    _a0234 = _r0128.wxyz - _r0128;
    _TMP231 = abs(_a0234);
    _TMP28 = bvec4(_TMP231.x < 1.50000000E+01, _TMP231.y < 1.50000000E+01, _TMP231.z < 1.50000000E+01, _TMP231.w < 1.50000000E+01);
    _a0240 = _r0128.wxyz - _r0138;
    _TMP237 = abs(_a0240);
    _TMP29 = bvec4(_TMP237.x < 1.50000000E+01, _TMP237.y < 1.50000000E+01, _TMP237.z < 1.50000000E+01, _TMP237.w < 1.50000000E+01);
    _a0246 = _r0128.zwxy - _r0128.yzwx;
    _TMP243 = abs(_a0246);
    _TMP30 = bvec4(_TMP243.x < 1.50000000E+01, _TMP243.y < 1.50000000E+01, _TMP243.z < 1.50000000E+01, _TMP243.w < 1.50000000E+01);
    _a0252 = _r0128.zwxy - _r0138.zwxy;
    _TMP249 = abs(_a0252);
    _TMP31 = bvec4(_TMP249.x < 1.50000000E+01, _TMP249.y < 1.50000000E+01, _TMP249.z < 1.50000000E+01, _TMP249.w < 1.50000000E+01);
    _a0258 = _r0148 - _r0138.wxyz;
    _TMP255 = abs(_a0258);
    _TMP32 = bvec4(_TMP255.x < 1.50000000E+01, _TMP255.y < 1.50000000E+01, _TMP255.z < 1.50000000E+01, _TMP255.w < 1.50000000E+01);
    _a0264 = _r0128.wxyz - _r0178.yzwx;
    _TMP261 = abs(_a0264);
    _TMP33 = bvec4(_TMP261.x < 1.50000000E+01, _TMP261.y < 1.50000000E+01, _TMP261.z < 1.50000000E+01, _TMP261.w < 1.50000000E+01);
    _a0270 = _r0128.wxyz - _r0158;
    _TMP267 = abs(_a0270);
    _TMP34 = bvec4(_TMP267.x < 1.50000000E+01, _TMP267.y < 1.50000000E+01, _TMP267.z < 1.50000000E+01, _TMP267.w < 1.50000000E+01);
    _a0276 = _r0128.zwxy - _r0178;
    _TMP273 = abs(_a0276);
    _TMP35 = bvec4(_TMP273.x < 1.50000000E+01, _TMP273.y < 1.50000000E+01, _TMP273.z < 1.50000000E+01, _TMP273.w < 1.50000000E+01);
    _a0282 = _r0128.zwxy - _r0168;
    _TMP279 = abs(_a0282);
    _TMP36 = bvec4(_TMP279.x < 1.50000000E+01, _TMP279.y < 1.50000000E+01, _TMP279.z < 1.50000000E+01, _TMP279.w < 1.50000000E+01);
    _a0288 = _r0148 - _r0138.zwxy;
    _TMP285 = abs(_a0288);
    _TMP37 = bvec4(_TMP285.x < 1.50000000E+01, _TMP285.y < 1.50000000E+01, _TMP285.z < 1.50000000E+01, _TMP285.w < 1.50000000E+01);
    _a0294 = _r0148 - _r0138;
    _TMP291 = abs(_a0294);
    _TMP38 = bvec4(_TMP291.x < 1.50000000E+01, _TMP291.y < 1.50000000E+01, _TMP291.z < 1.50000000E+01, _TMP291.w < 1.50000000E+01);
    _interp_restriction_lv1 = bvec4(_r0148.x != _r0128.w && _r0148.x != _r0128.z && (_TMP21.x || _TMP22.x || !_TMP23.x) && (_TMP24.x || _TMP25.x || _TMP26.x || _TMP27.x) && (!_TMP28.x && !_TMP29.x || !_TMP30.x && !_TMP31.x || _TMP32.x && (!_TMP33.x && !_TMP34.x || !_TMP35.x && !_TMP36.x) || _TMP37.x || _TMP38.x), _r0148.y != _r0128.x && _r0148.y != _r0128.w && (_TMP21.y || _TMP22.y || !_TMP23.y) && (_TMP24.y || _TMP25.y || _TMP26.y || _TMP27.y) && (!_TMP28.y && !_TMP29.y || !_TMP30.y && !_TMP31.y || _TMP32.y && (!_TMP33.y && !_TMP34.y || !_TMP35.y && !_TMP36.y) || _TMP37.y || _TMP38.y), _r0148.z != _r0128.y && _r0148.z != _r0128.x && (_TMP21.z || _TMP22.z || !_TMP23.z) && (_TMP24.z || _TMP25.z || _TMP26.z || _TMP27.z) && (!_TMP28.z && !_TMP29.z || !_TMP30.z && !_TMP31.z || _TMP32.z && (!_TMP33.z && !_TMP34.z || !_TMP35.z && !_TMP36.z) || _TMP37.z || _TMP38.z), _r0148.w != _r0128.z && _r0148.w != _r0128.y && (_TMP21.w || _TMP22.w || !_TMP23.w) && (_TMP24.w || _TMP25.w || _TMP26.w || _TMP27.w) && (!_TMP28.w && !_TMP29.w || !_TMP30.w && !_TMP31.w || _TMP32.w && (!_TMP33.w && !_TMP34.w || !_TMP35.w && !_TMP36.w) || _TMP37.w || _TMP38.w));
    _interp_restriction_lv2_left = bvec4(_r0148.x != _r0138.z && _r0128.y != _r0138.z, _r0148.y != _r0138.w && _r0128.z != _r0138.w, _r0148.z != _r0138.x && _r0128.w != _r0138.x, _r0148.w != _r0138.y && _r0128.x != _r0138.y);
    _interp_restriction_lv2_up = bvec4(_r0148.x != _r0138.x && _r0128.x != _r0138.x, _r0148.y != _r0138.y && _r0128.y != _r0138.y, _r0148.z != _r0138.z && _r0128.z != _r0138.z, _r0148.w != _r0138.w && _r0128.w != _r0138.w);
    _x0298 = _fx - vec4( 1.00000000E+00, 0.00000000E+00, -1.00000000E+00, 0.00000000E+00);
    _TMP70 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0298);
    _TMP299 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP70);
    _fx45 = _TMP299*_TMP299*(3.00000000E+00 - 2.00000000E+00*_TMP299);
    _x0308 = _fx_left - vec4( 5.00000000E-01, 5.00000000E-01, -1.00000000E+00, -5.00000000E-01);
    _TMP70 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0308);
    _TMP309 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP70);
    _fx30 = _TMP309*_TMP309*(3.00000000E+00 - 2.00000000E+00*_TMP309);
    _x0318 = _fx_up - vec4( 1.50000000E+00, -5.00000000E-01, -1.50000000E+00, 0.00000000E+00);
    _TMP70 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0318);
    _TMP319 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP70);
    _fx60 = _TMP319*_TMP319*(3.00000000E+00 - 2.00000000E+00*_TMP319);
    _a0330 = _r0148 - _r0138;
    _TMP327 = abs(_a0330);
    _a0334 = _r0148 - _r0138.zwxy;
    _TMP331 = abs(_a0334);
    _a0338 = _r0138.wxyz - _r0178;
    _TMP335 = abs(_a0338);
    _a0342 = _r0138.wxyz - _r0178.yzwx;
    _TMP339 = abs(_a0342);
    _a0346 = _r0128.zwxy - _r0128.wxyz;
    _TMP343 = abs(_a0346);
    _TMP39 = _TMP327 + _TMP331 + _TMP335 + _TMP339 + 4.00000000E+00*_TMP343;
    _a0352 = _r0128.zwxy - _r0128.yzwx;
    _TMP349 = abs(_a0352);
    _a0356 = _r0128.zwxy - _r0168;
    _TMP353 = abs(_a0356);
    _a0360 = _r0128.wxyz - _r0158;
    _TMP357 = abs(_a0360);
    _a0364 = _r0128.wxyz - _r0128;
    _TMP361 = abs(_a0364);
    _a0368 = _r0148 - _r0138.wxyz;
    _TMP365 = abs(_a0368);
    _TMP40 = _TMP349 + _TMP353 + _TMP357 + _TMP361 + 4.00000000E+00*_TMP365;
    _edr = bvec4((_TMP39 + 3.50000000E+00).x < _TMP40.x && _interp_restriction_lv1.x, (_TMP39 + 3.50000000E+00).y < _TMP40.y && _interp_restriction_lv1.y, (_TMP39 + 3.50000000E+00).z < _TMP40.z && _interp_restriction_lv1.z, (_TMP39 + 3.50000000E+00).w < _TMP40.w && _interp_restriction_lv1.w);
    _a0372 = _r0128.wxyz - _r0138.zwxy;
    _TMP369 = abs(_a0372);
    _a0376 = _r0128.zwxy - _r0138;
    _TMP373 = abs(_a0376);
    _edr_left = bvec4((2.00000000E+00*_TMP369).x <= _TMP373.x && _interp_restriction_lv2_left.x, (2.00000000E+00*_TMP369).y <= _TMP373.y && _interp_restriction_lv2_left.y, (2.00000000E+00*_TMP369).z <= _TMP373.z && _interp_restriction_lv2_left.z, (2.00000000E+00*_TMP369).w <= _TMP373.w && _interp_restriction_lv2_left.w);
    _a0380 = _r0128.wxyz - _r0138.zwxy;
    _TMP377 = abs(_a0380);
    _a0384 = _r0128.zwxy - _r0138;
    _TMP381 = abs(_a0384);
    _edr_up = bvec4(_TMP377.x >= (2.00000000E+00*_TMP381).x && _interp_restriction_lv2_up.x, _TMP377.y >= (2.00000000E+00*_TMP381).y && _interp_restriction_lv2_up.y, _TMP377.z >= (2.00000000E+00*_TMP381).z && _interp_restriction_lv2_up.z, _TMP377.w >= (2.00000000E+00*_TMP381).w && _interp_restriction_lv2_up.w);
    _nc45 = bvec4(_edr.x && bool(_fx45.x), _edr.y && bool(_fx45.y), _edr.z && bool(_fx45.z), _edr.w && bool(_fx45.w));
    _nc30 = bvec4(_edr.x && _edr_left.x && bool(_fx30.x), _edr.y && _edr_left.y && bool(_fx30.y), _edr.z && _edr_left.z && bool(_fx30.z), _edr.w && _edr_left.w && bool(_fx30.w));
    _nc60 = bvec4(_edr.x && _edr_up.x && bool(_fx60.x), _edr.y && _edr_up.y && bool(_fx60.y), _edr.z && _edr_up.z && bool(_fx60.z), _edr.w && _edr_up.w && bool(_fx60.w));
    _a0388 = _r0148 - _r0128.wxyz;
    _TMP385 = abs(_a0388);
    _a0392 = _r0148 - _r0128.zwxy;
    _TMP389 = abs(_a0392);
    _px = bvec4(_TMP385.x <= _TMP389.x, _TMP385.y <= _TMP389.y, _TMP385.z <= _TMP389.z, _TMP385.w <= _TMP389.w);
    _aa = _TMP4.xyz - _TMP1.xyz;
    _bb = _TMP7.xyz - _TMP4.xyz;
    _cc = _TMP10.xyz - _TMP7.xyz;
    _dd = _TMP13.xyz - _TMP10.xyz;
    _t = (7.00000000E+00*(_bb + _cc) - 3.00000000E+00*(_aa + _dd))/1.60000000E+01;
    _m = vec3(_TMP7.x < 5.00000000E-01 ? (2.00000000E+00*_TMP7.xyz).x : (2.00000000E+00*(1.00000000E+00 - _TMP7.xyz)).x, _TMP7.y < 5.00000000E-01 ? (2.00000000E+00*_TMP7.xyz).y : (2.00000000E+00*(1.00000000E+00 - _TMP7.xyz)).y, _TMP7.z < 5.00000000E-01 ? (2.00000000E+00*_TMP7.xyz).z : (2.00000000E+00*(1.00000000E+00 - _TMP7.xyz)).z);
    _TMP47 = abs(_bb);
    _b0396 = 2.00000000E+00*_TMP47;
    _m = min(_m, _b0396);
    _TMP48 = abs(_cc);
    _b0400 = 2.00000000E+00*_TMP48;
    _m = min(_m, _b0400);
    _a0402 = -_m;
    _TMP65 = min(_m, _t);
    _TMP401 = max(_a0402, _TMP65);
    _s1 = (2.00000000E+00*_fp.y - 1.00000000E+00)*_TMP401 + _TMP7.xyz;
    _aa = _TMP6.xyz - _TMP16.xyz;
    _bb = _s1 - _TMP6.xyz;
    _cc = _TMP8.xyz - _s1;
    _dd = _TMP19.xyz - _TMP8.xyz;
    _t = (7.00000000E+00*(_bb + _cc) - 3.00000000E+00*(_aa + _dd))/1.60000000E+01;
    _m = vec3(_s1.x < 5.00000000E-01 ? (2.00000000E+00*_s1).x : (2.00000000E+00*(1.00000000E+00 - _s1)).x, _s1.y < 5.00000000E-01 ? (2.00000000E+00*_s1).y : (2.00000000E+00*(1.00000000E+00 - _s1)).y, _s1.z < 5.00000000E-01 ? (2.00000000E+00*_s1).z : (2.00000000E+00*(1.00000000E+00 - _s1)).z);
    _TMP49 = abs(_bb);
    _b0410 = 2.00000000E+00*_TMP49;
    _m = min(_m, _b0410);
    _TMP50 = abs(_cc);
    _b0414 = 2.00000000E+00*_TMP50;
    _m = min(_m, _b0414);
    _a0416 = -_m;
    _TMP65 = min(_m, _t);
    _TMP415 = max(_a0416, _TMP65);
    _s0 = (2.00000000E+00*_fp.x - 1.00000000E+00)*_TMP415 + _s1;
    _nc = bvec4(_nc30.x || _nc60.x || _nc45.x, _nc30.y || _nc60.y || _nc45.y, _nc30.z || _nc60.z || _nc45.z, _nc30.w || _nc60.w || _nc45.w);
    _blend = 0.00000000E+00;
    _pix = _s0;
    _final45 = vec4(float(_nc45.x), float(_nc45.y), float(_nc45.z), float(_nc45.w))*_fx45;
    _final30 = vec4(float(_nc30.x), float(_nc30.y), float(_nc30.z), float(_nc30.w))*_fx30;
    _final60 = vec4(float(_nc60.x), float(_nc60.y), float(_nc60.z), float(_nc60.w))*_fx60;
    _TMP51 = max(_final30, _final60);
    _maximo = max(_TMP51, _final45);
    if (_nc.x) { 
        if (_px.x) { 
            _TMP52 = _TMP8.xyz;
        } else {
            _TMP52 = _TMP10.xyz;
        } 
        _pix = _TMP52;
        _blend = _maximo.x;
    } else {
        if (_nc.y) { 
            if (_px.y) { 
                _TMP53 = _TMP4.xyz;
            } else {
                _TMP53 = _TMP8.xyz;
            } 
            _pix = _TMP53;
            _blend = _maximo.y;
        } else {
            if (_nc.z) { 
                if (_px.z) { 
                    _TMP54 = _TMP6.xyz;
                } else {
                    _TMP54 = _TMP4.xyz;
                } 
                _pix = _TMP54;
                _blend = _maximo.z;
            } else {
                if (_nc.w) { 
                    if (_px.w) { 
                        _TMP55 = _TMP10.xyz;
                    } else {
                        _TMP55 = _TMP6.xyz;
                    } 
                    _pix = _TMP55;
                    _blend = _maximo.w;
                } 
            } 
        } 
    } 
    _TMP66 = pow(_s0.x, 2.40000010E+00);
    _TMP67 = pow(_s0.y, 2.40000010E+00);
    _TMP68 = pow(_s0.z, 2.40000010E+00);
    _res = vec3(_TMP66, _TMP67, _TMP68);
    _TMP66 = pow(_pix.x, 2.40000010E+00);
    _TMP67 = pow(_pix.y, 2.40000010E+00);
    _TMP68 = pow(_pix.z, 2.40000010E+00);
    _pix = vec3(_TMP66, _TMP67, _TMP68);
    _res = _res + _blend*(_pix - _res);
    _TMP66 = pow(_res.x, 4.54545438E-01);
    _TMP67 = pow(_res.y, 4.54545438E-01);
    _TMP68 = pow(_res.z, 4.54545438E-01);
    _TMP56 = vec3(_TMP66, _TMP67, _TMP68);
    _TMP69 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP56);
    _TMP451 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP69);
    _ret_0 = vec4(_TMP451.x, _TMP451.y, _TMP451.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
