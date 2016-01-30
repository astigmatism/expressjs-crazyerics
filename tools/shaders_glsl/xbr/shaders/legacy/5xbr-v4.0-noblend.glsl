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
float _TMP60;
float _TMP59;
float _TMP58;
vec3 _TMP50;
vec3 _TMP52;
vec3 _TMP54;
vec3 _TMP56;
vec3 _TMP57;
vec3 _TMP55;
vec3 _TMP53;
vec3 _TMP51;
vec3 _TMP42;
vec3 _TMP44;
vec3 _TMP46;
vec3 _TMP48;
vec3 _TMP49;
vec3 _TMP47;
vec3 _TMP45;
vec3 _TMP43;
vec4 _TMP35;
vec4 _TMP34;
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
vec2 _x0081;
vec4 _r0125;
vec4 _r0135;
vec4 _r0145;
vec4 _r0155;
vec4 _r0165;
vec4 _r0175;
vec4 _TMP186;
vec4 _a0189;
vec4 _TMP192;
vec4 _a0195;
vec4 _TMP198;
vec4 _a0201;
vec4 _TMP204;
vec4 _a0207;
vec4 _TMP210;
vec4 _a0213;
vec4 _TMP216;
vec4 _a0219;
vec4 _TMP222;
vec4 _a0225;
vec4 _TMP228;
vec4 _a0231;
vec4 _TMP234;
vec4 _a0237;
vec4 _TMP240;
vec4 _a0243;
vec4 _TMP246;
vec4 _a0249;
vec4 _TMP252;
vec4 _a0255;
vec4 _TMP258;
vec4 _a0261;
vec4 _TMP264;
vec4 _a0267;
vec4 _TMP268;
vec4 _a0271;
vec4 _TMP272;
vec4 _a0275;
vec4 _TMP276;
vec4 _a0279;
vec4 _TMP280;
vec4 _a0283;
vec4 _TMP286;
vec4 _a0289;
vec4 _TMP290;
vec4 _a0293;
vec4 _TMP294;
vec4 _a0297;
vec4 _TMP298;
vec4 _a0301;
vec4 _TMP302;
vec4 _a0305;
vec4 _TMP306;
vec4 _a0309;
vec4 _TMP310;
vec4 _a0313;
vec4 _TMP314;
vec4 _a0317;
vec4 _TMP318;
vec4 _a0321;
vec4 _TMP322;
vec4 _a0325;
vec4 _TMP326;
vec4 _a0329;
vec3 _df0331;
vec3 _a0333;
vec3 _df0335;
vec3 _a0337;
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
    bvec4 _interp_restriction_lv3_left;
    bvec4 _interp_restriction_lv3_up;
    bvec4 _nc;
    bvec4 _fx;
    bvec4 _fx_left;
    bvec4 _fx_up;
    bvec4 _fx3_left;
    bvec4 _fx3_up;
    vec2 _fp;
    vec3 _res;
    _x0081 = TEX0.xy*TextureSize;
    _fp = fract(_x0081);
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
    _r0125.x = dot(_TMP4.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0125.y = dot(_TMP6.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0125.z = dot(_TMP10.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0125.w = dot(_TMP8.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0135.x = dot(_TMP5.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0135.y = dot(_TMP3.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0135.z = dot(_TMP9.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0135.w = dot(_TMP11.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0145.x = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0145.y = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0145.z = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0145.w = dot(_TMP7.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0155.x = dot(_TMP20.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0155.y = dot(_TMP2.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0155.z = dot(_TMP15.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0155.w = dot(_TMP12.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0165.x = dot(_TMP14.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0165.y = dot(_TMP18.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0165.z = dot(_TMP0.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0165.w = dot(_TMP17.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0175.x = dot(_TMP13.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0175.y = dot(_TMP19.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0175.z = dot(_TMP1.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _r0175.w = dot(_TMP16.xyz, vec3( 1.43519993E+01, 2.81760006E+01, 5.47200012E+00));
    _fx = bvec4((vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x).x > 1.50000000E+00, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x).y > 5.00000000E-01, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x).z > -5.00000000E-01, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x).w > 5.00000000E-01);
    _fx_left = bvec4((vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x).x > 1.00000000E+00, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x).y > 1.00000000E+00, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x).z > -5.00000000E-01, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x).w > 0.00000000E+00);
    _fx_up = bvec4((vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x).x > 2.00000000E+00, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x).y > 0.00000000E+00, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x).z > -1.00000000E+00, (vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x).w > 5.00000000E-01);
    _fx3_left = bvec4((vec4( 6.00000000E+00, -2.00000000E+00, -6.00000000E+00, 2.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 6.00000000E+00, -2.00000000E+00, -6.00000000E+00)*_fp.x).x > 5.00000000E+00, (vec4( 6.00000000E+00, -2.00000000E+00, -6.00000000E+00, 2.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 6.00000000E+00, -2.00000000E+00, -6.00000000E+00)*_fp.x).y > 3.00000000E+00, (vec4( 6.00000000E+00, -2.00000000E+00, -6.00000000E+00, 2.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 6.00000000E+00, -2.00000000E+00, -6.00000000E+00)*_fp.x).z > -3.00000000E+00, (vec4( 6.00000000E+00, -2.00000000E+00, -6.00000000E+00, 2.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 6.00000000E+00, -2.00000000E+00, -6.00000000E+00)*_fp.x).w > -1.00000000E+00);
    _fx3_up = bvec4((vec4( 2.00000000E+00, -6.00000000E+00, -2.00000000E+00, 6.00000000E+00)*_fp.y + vec4( 6.00000000E+00, 2.00000000E+00, -6.00000000E+00, -2.00000000E+00)*_fp.x).x > 5.00000000E+00, (vec4( 2.00000000E+00, -6.00000000E+00, -2.00000000E+00, 6.00000000E+00)*_fp.y + vec4( 6.00000000E+00, 2.00000000E+00, -6.00000000E+00, -2.00000000E+00)*_fp.x).y > -1.00000000E+00, (vec4( 2.00000000E+00, -6.00000000E+00, -2.00000000E+00, 6.00000000E+00)*_fp.y + vec4( 6.00000000E+00, 2.00000000E+00, -6.00000000E+00, -2.00000000E+00)*_fp.x).z > -3.00000000E+00, (vec4( 2.00000000E+00, -6.00000000E+00, -2.00000000E+00, 6.00000000E+00)*_fp.y + vec4( 6.00000000E+00, 2.00000000E+00, -6.00000000E+00, -2.00000000E+00)*_fp.x).w > 3.00000000E+00);
    _a0189 = _r0125.wxyz - _r0125;
    _TMP186 = abs(_a0189);
    _TMP21 = bvec4(_TMP186.x < 1.00000000E+01, _TMP186.y < 1.00000000E+01, _TMP186.z < 1.00000000E+01, _TMP186.w < 1.00000000E+01);
    _a0195 = _r0125.zwxy - _r0125.yzwx;
    _TMP192 = abs(_a0195);
    _TMP22 = bvec4(_TMP192.x < 1.00000000E+01, _TMP192.y < 1.00000000E+01, _TMP192.z < 1.00000000E+01, _TMP192.w < 1.00000000E+01);
    _a0201 = _r0145 - _r0135.wxyz;
    _TMP198 = abs(_a0201);
    _TMP23 = bvec4(_TMP198.x < 1.00000000E+01, _TMP198.y < 1.00000000E+01, _TMP198.z < 1.00000000E+01, _TMP198.w < 1.00000000E+01);
    _a0207 = _r0125.wxyz - _r0155;
    _TMP204 = abs(_a0207);
    _TMP24 = bvec4(_TMP204.x < 1.00000000E+01, _TMP204.y < 1.00000000E+01, _TMP204.z < 1.00000000E+01, _TMP204.w < 1.00000000E+01);
    _a0213 = _r0125.zwxy - _r0165;
    _TMP210 = abs(_a0213);
    _TMP25 = bvec4(_TMP210.x < 1.00000000E+01, _TMP210.y < 1.00000000E+01, _TMP210.z < 1.00000000E+01, _TMP210.w < 1.00000000E+01);
    _a0219 = _r0145 - _r0135.zwxy;
    _TMP216 = abs(_a0219);
    _TMP26 = bvec4(_TMP216.x < 1.00000000E+01, _TMP216.y < 1.00000000E+01, _TMP216.z < 1.00000000E+01, _TMP216.w < 1.00000000E+01);
    _a0225 = _r0145 - _r0135;
    _TMP222 = abs(_a0225);
    _TMP27 = bvec4(_TMP222.x < 1.00000000E+01, _TMP222.y < 1.00000000E+01, _TMP222.z < 1.00000000E+01, _TMP222.w < 1.00000000E+01);
    _a0231 = _r0125 - _r0155.yzwx;
    _TMP228 = abs(_a0231);
    _TMP28 = bvec4(_TMP228.x < 1.00000000E+01, _TMP228.y < 1.00000000E+01, _TMP228.z < 1.00000000E+01, _TMP228.w < 1.00000000E+01);
    _a0237 = _r0125.yzwx - _r0165.wxyz;
    _TMP234 = abs(_a0237);
    _TMP29 = bvec4(_TMP234.x < 1.00000000E+01, _TMP234.y < 1.00000000E+01, _TMP234.z < 1.00000000E+01, _TMP234.w < 1.00000000E+01);
    _interp_restriction_lv1 = bvec4(_r0145.x != _r0125.w && _r0145.x != _r0125.z && (!_TMP21.x && !_TMP22.x || _TMP23.x && !_TMP24.x && !_TMP25.x || _TMP26.x || _TMP27.x) && (_r0125.w != _r0175.y && _r0125.w != _r0135.w || _r0125.z != _r0175.x && _r0125.z != _r0135.w || _r0125.z != _r0135.z || _r0125.w != _r0135.x || _TMP28.x && _TMP29.x), _r0145.y != _r0125.x && _r0145.y != _r0125.w && (!_TMP21.y && !_TMP22.y || _TMP23.y && !_TMP24.y && !_TMP25.y || _TMP26.y || _TMP27.y) && (_r0125.x != _r0175.z && _r0125.x != _r0135.x || _r0125.w != _r0175.y && _r0125.w != _r0135.x || _r0125.w != _r0135.w || _r0125.x != _r0135.y || _TMP28.y && _TMP29.y), _r0145.z != _r0125.y && _r0145.z != _r0125.x && (!_TMP21.z && !_TMP22.z || _TMP23.z && !_TMP24.z && !_TMP25.z || _TMP26.z || _TMP27.z) && (_r0125.y != _r0175.w && _r0125.y != _r0135.y || _r0125.x != _r0175.z && _r0125.x != _r0135.y || _r0125.x != _r0135.x || _r0125.y != _r0135.z || _TMP28.z && _TMP29.z), _r0145.w != _r0125.z && _r0145.w != _r0125.y && (!_TMP21.w && !_TMP22.w || _TMP23.w && !_TMP24.w && !_TMP25.w || _TMP26.w || _TMP27.w) && (_r0125.z != _r0175.x && _r0125.z != _r0135.z || _r0125.y != _r0175.w && _r0125.y != _r0135.z || _r0125.y != _r0135.y || _r0125.z != _r0135.w || _TMP28.w && _TMP29.w));
    _interp_restriction_lv2_left = bvec4(_r0145.x != _r0135.z && _r0125.y != _r0135.z, _r0145.y != _r0135.w && _r0125.z != _r0135.w, _r0145.z != _r0135.x && _r0125.w != _r0135.x, _r0145.w != _r0135.y && _r0125.x != _r0135.y);
    _interp_restriction_lv2_up = bvec4(_r0145.x != _r0135.x && _r0125.x != _r0135.x, _r0145.y != _r0135.y && _r0125.y != _r0135.y, _r0145.z != _r0135.z && _r0125.z != _r0135.z, _r0145.w != _r0135.w && _r0125.w != _r0135.w);
    _a0243 = _r0135.zwxy - _r0165.wxyz;
    _TMP240 = abs(_a0243);
    _TMP30 = bvec4(_TMP240.x < 2.00000000E+00, _TMP240.y < 2.00000000E+00, _TMP240.z < 2.00000000E+00, _TMP240.w < 2.00000000E+00);
    _a0249 = _r0175.wxyz - _r0165.wxyz;
    _TMP246 = abs(_a0249);
    _TMP31 = bvec4(_TMP246.x < 2.00000000E+00, _TMP246.y < 2.00000000E+00, _TMP246.z < 2.00000000E+00, _TMP246.w < 2.00000000E+00);
    _interp_restriction_lv3_left = bvec4(_TMP30.x && !_TMP31.x, _TMP30.y && !_TMP31.y, _TMP30.z && !_TMP31.z, _TMP30.w && !_TMP31.w);
    _a0255 = _r0135 - _r0155.yzwx;
    _TMP252 = abs(_a0255);
    _TMP32 = bvec4(_TMP252.x < 2.00000000E+00, _TMP252.y < 2.00000000E+00, _TMP252.z < 2.00000000E+00, _TMP252.w < 2.00000000E+00);
    _a0261 = _r0175.zwxy - _r0155.yzwx;
    _TMP258 = abs(_a0261);
    _TMP33 = bvec4(_TMP258.x < 2.00000000E+00, _TMP258.y < 2.00000000E+00, _TMP258.z < 2.00000000E+00, _TMP258.w < 2.00000000E+00);
    _interp_restriction_lv3_up = bvec4(_TMP32.x && !_TMP33.x, _TMP32.y && !_TMP33.y, _TMP32.z && !_TMP33.z, _TMP32.w && !_TMP33.w);
    _a0267 = _r0145 - _r0135;
    _TMP264 = abs(_a0267);
    _a0271 = _r0145 - _r0135.zwxy;
    _TMP268 = abs(_a0271);
    _a0275 = _r0135.wxyz - _r0175;
    _TMP272 = abs(_a0275);
    _a0279 = _r0135.wxyz - _r0175.yzwx;
    _TMP276 = abs(_a0279);
    _a0283 = _r0125.zwxy - _r0125.wxyz;
    _TMP280 = abs(_a0283);
    _TMP34 = _TMP264 + _TMP268 + _TMP272 + _TMP276 + 4.00000000E+00*_TMP280;
    _a0289 = _r0125.zwxy - _r0125.yzwx;
    _TMP286 = abs(_a0289);
    _a0293 = _r0125.zwxy - _r0165;
    _TMP290 = abs(_a0293);
    _a0297 = _r0125.wxyz - _r0155;
    _TMP294 = abs(_a0297);
    _a0301 = _r0125.wxyz - _r0125;
    _TMP298 = abs(_a0301);
    _a0305 = _r0145 - _r0135.wxyz;
    _TMP302 = abs(_a0305);
    _TMP35 = _TMP286 + _TMP290 + _TMP294 + _TMP298 + 4.00000000E+00*_TMP302;
    _edr = bvec4(_TMP34.x < _TMP35.x && _interp_restriction_lv1.x, _TMP34.y < _TMP35.y && _interp_restriction_lv1.y, _TMP34.z < _TMP35.z && _interp_restriction_lv1.z, _TMP34.w < _TMP35.w && _interp_restriction_lv1.w);
    _a0309 = _r0125.wxyz - _r0135.zwxy;
    _TMP306 = abs(_a0309);
    _a0313 = _r0125.zwxy - _r0135;
    _TMP310 = abs(_a0313);
    _edr_left = bvec4((2.00000000E+00*_TMP306).x <= _TMP310.x && _interp_restriction_lv2_left.x, (2.00000000E+00*_TMP306).y <= _TMP310.y && _interp_restriction_lv2_left.y, (2.00000000E+00*_TMP306).z <= _TMP310.z && _interp_restriction_lv2_left.z, (2.00000000E+00*_TMP306).w <= _TMP310.w && _interp_restriction_lv2_left.w);
    _a0317 = _r0125.wxyz - _r0135.zwxy;
    _TMP314 = abs(_a0317);
    _a0321 = _r0125.zwxy - _r0135;
    _TMP318 = abs(_a0321);
    _edr_up = bvec4(_TMP314.x >= (2.00000000E+00*_TMP318).x && _interp_restriction_lv2_up.x, _TMP314.y >= (2.00000000E+00*_TMP318).y && _interp_restriction_lv2_up.y, _TMP314.z >= (2.00000000E+00*_TMP318).z && _interp_restriction_lv2_up.z, _TMP314.w >= (2.00000000E+00*_TMP318).w && _interp_restriction_lv2_up.w);
    _nc = bvec4(_edr.x && (_fx.x || _edr_left.x && (_fx_left.x || _interp_restriction_lv3_left.x && _fx3_left.x) || _edr_up.x && (_fx_up.x || _interp_restriction_lv3_up.x && _fx3_up.x)), _edr.y && (_fx.y || _edr_left.y && (_fx_left.y || _interp_restriction_lv3_left.y && _fx3_left.y) || _edr_up.y && (_fx_up.y || _interp_restriction_lv3_up.y && _fx3_up.y)), _edr.z && (_fx.z || _edr_left.z && (_fx_left.z || _interp_restriction_lv3_left.z && _fx3_left.z) || _edr_up.z && (_fx_up.z || _interp_restriction_lv3_up.z && _fx3_up.z)), _edr.w && (_fx.w || _edr_left.w && (_fx_left.w || _interp_restriction_lv3_left.w && _fx3_left.w) || _edr_up.w && (_fx_up.w || _interp_restriction_lv3_up.w && _fx3_up.w)));
    _a0325 = _r0145 - _r0125.wxyz;
    _TMP322 = abs(_a0325);
    _a0329 = _r0145 - _r0125.zwxy;
    _TMP326 = abs(_a0329);
    _px = bvec4(_TMP322.x <= _TMP326.x, _TMP322.y <= _TMP326.y, _TMP322.z <= _TMP326.z, _TMP322.w <= _TMP326.w);
    if (_nc.x) { 
        if (_px.x) { 
            _TMP43 = _TMP8.xyz;
        } else {
            _TMP43 = _TMP10.xyz;
        } 
        _TMP42 = _TMP43;
    } else {
        if (_nc.y) { 
            if (_px.y) { 
                _TMP45 = _TMP4.xyz;
            } else {
                _TMP45 = _TMP8.xyz;
            } 
            _TMP44 = _TMP45;
        } else {
            if (_nc.z) { 
                if (_px.z) { 
                    _TMP47 = _TMP6.xyz;
                } else {
                    _TMP47 = _TMP4.xyz;
                } 
                _TMP46 = _TMP47;
            } else {
                if (_nc.w) { 
                    if (_px.w) { 
                        _TMP49 = _TMP10.xyz;
                    } else {
                        _TMP49 = _TMP6.xyz;
                    } 
                    _TMP48 = _TMP49;
                } else {
                    _TMP48 = _TMP7.xyz;
                } 
                _TMP46 = _TMP48;
            } 
            _TMP44 = _TMP46;
        } 
        _TMP42 = _TMP44;
    } 
    if (_nc.w) { 
        if (_px.w) { 
            _TMP51 = _TMP10.xyz;
        } else {
            _TMP51 = _TMP6.xyz;
        } 
        _TMP50 = _TMP51;
    } else {
        if (_nc.z) { 
            if (_px.z) { 
                _TMP53 = _TMP6.xyz;
            } else {
                _TMP53 = _TMP4.xyz;
            } 
            _TMP52 = _TMP53;
        } else {
            if (_nc.y) { 
                if (_px.y) { 
                    _TMP55 = _TMP4.xyz;
                } else {
                    _TMP55 = _TMP8.xyz;
                } 
                _TMP54 = _TMP55;
            } else {
                if (_nc.x) { 
                    if (_px.x) { 
                        _TMP57 = _TMP8.xyz;
                    } else {
                        _TMP57 = _TMP10.xyz;
                    } 
                    _TMP56 = _TMP57;
                } else {
                    _TMP56 = _TMP7.xyz;
                } 
                _TMP54 = _TMP56;
            } 
            _TMP52 = _TMP54;
        } 
        _TMP50 = _TMP52;
    } 
    _a0333 = _TMP7.xyz - _TMP42;
    _df0331 = abs(_a0333);
    _TMP58 = _df0331.x + _df0331.y + _df0331.z;
    _a0337 = _TMP7.xyz - _TMP50;
    _df0335 = abs(_a0337);
    _TMP59 = _df0335.x + _df0335.y + _df0335.z;
    _TMP60 = float((_TMP59 >= _TMP58));
    _res = _TMP42 + _TMP60*(_TMP50 - _TMP42);
    _ret_0 = vec4(_res.x, _res.y, _res.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
