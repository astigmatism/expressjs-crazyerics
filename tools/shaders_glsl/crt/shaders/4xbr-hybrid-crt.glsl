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
vec4 _r0010;
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
    _r0010 = VertexCoord.x*MVPMatrix[0];
    _r0010 = _r0010 + VertexCoord.y*MVPMatrix[1];
    _r0010 = _r0010 + VertexCoord.z*MVPMatrix[2];
    _r0010 = _r0010 + VertexCoord.w*MVPMatrix[3];
    _ps = vec2(1.00000000E+00/TextureSize.x, 1.00000000E+00/TextureSize.y);
    _texCoord = TexCoord.xy + vec2( 1.00000001E-07, 1.00000001E-07);
    _OUT._t1 = _texCoord.xxxy + vec4(float(float(-_ps.x)), 0.00000000E+00, float(float(_ps.x)), float(float((-2.00000000E+00*_ps.y))));
    _OUT._t2 = _texCoord.xxxy + vec4(float(float(-_ps.x)), 0.00000000E+00, float(float(_ps.x)), float(float(-_ps.y)));
    _OUT._t3 = _texCoord.xxxy + vec4(float(float(-_ps.x)), 0.00000000E+00, float(float(_ps.x)), 0.00000000E+00);
    _OUT._t4 = _texCoord.xxxy + vec4(float(float(-_ps.x)), 0.00000000E+00, float(float(_ps.x)), float(float(_ps.y)));
    _OUT._t5 = _texCoord.xxxy + vec4(float(float(-_ps.x)), 0.00000000E+00, float(float(_ps.x)), float(float((2.00000000E+00*_ps.y))));
    _OUT._t6 = _texCoord.xyyy + vec4(float(float((-2.00000000E+00*_ps.x))), float(float(-_ps.y)), 0.00000000E+00, float(float(_ps.y)));
    _OUT._t7 = _texCoord.xyyy + vec4(float(float((2.00000000E+00*_ps.x))), float(float(-_ps.y)), 0.00000000E+00, float(float(_ps.y)));
    _ret_0._position1 = _r0010;
    _ret_0._color1 = COLOR;
    _ret_0._texCoord2 = _texCoord;
    _ret_0._t1 = _OUT._t1;
    _ret_0._t2 = _OUT._t2;
    _ret_0._t3 = _OUT._t3;
    _ret_0._t4 = _OUT._t4;
    _ret_0._t5 = _OUT._t5;
    _ret_0._t6 = _OUT._t6;
    _ret_0._t7 = _OUT._t7;
    gl_Position = vec4(float(_r0010.x), float(_r0010.y), float(_r0010.z), float(_r0010.w));
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
COMPAT_VARYING     vec4 _color1;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec4 _color1;
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
vec3 _TMP76;
vec3 _TMP92;
float _TMP91;
float _TMP90;
float _TMP89;
vec3 _TMP75;
float _TMP88;
float _TMP87;
float _TMP86;
float _TMP95;
float _TMP74;
float _TMP73;
float _TMP72;
vec3 _TMP94;
vec3 _TMP71;
vec3 _TMP70;
vec3 _TMP69;
vec3 _TMP68;
vec3 _TMP67;
vec3 _TMP66;
vec3 _TMP65;
vec3 _TMP64;
vec3 _TMP63;
vec3 _TMP62;
vec4 _TMP61;
float _TMP60;
float _TMP59;
float _TMP58;
vec3 _TMP85;
vec3 _TMP56;
vec3 _TMP55;
vec3 _TMP54;
vec3 _TMP53;
vec4 _TMP46;
vec4 _TMP45;
vec4 _TMP96;
bvec4 _TMP44;
bvec4 _TMP43;
bvec4 _TMP42;
bvec4 _TMP41;
bvec4 _TMP40;
bvec4 _TMP39;
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
float _TMP93;
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
vec2 _x0110;
vec4 _r0154;
vec4 _r0164;
vec4 _r0174;
vec4 _r0184;
vec4 _r0194;
vec4 _r0204;
vec4 _TMP215;
vec4 _a0218;
vec4 _TMP221;
vec4 _a0224;
vec4 _TMP227;
vec4 _a0230;
vec4 _TMP233;
vec4 _a0236;
vec4 _TMP239;
vec4 _a0242;
vec4 _TMP245;
vec4 _a0248;
vec4 _TMP251;
vec4 _a0254;
vec4 _TMP257;
vec4 _a0260;
vec4 _TMP263;
vec4 _a0266;
vec4 _TMP269;
vec4 _a0272;
vec4 _TMP275;
vec4 _a0278;
vec4 _TMP281;
vec4 _a0284;
vec4 _TMP287;
vec4 _a0290;
vec4 _TMP293;
vec4 _a0296;
vec4 _TMP299;
vec4 _a0302;
vec4 _TMP305;
vec4 _a0308;
vec4 _TMP311;
vec4 _a0314;
vec4 _TMP317;
vec4 _a0320;
vec4 _x0324;
vec4 _TMP325;
vec4 _x0334;
vec4 _TMP335;
vec4 _x0344;
vec4 _TMP345;
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
vec4 _TMP375;
vec4 _a0378;
vec4 _TMP379;
vec4 _a0382;
vec4 _TMP383;
vec4 _a0386;
vec4 _TMP387;
vec4 _a0390;
vec4 _TMP391;
vec4 _a0394;
vec4 _TMP395;
vec4 _a0398;
vec4 _TMP399;
vec4 _a0402;
vec4 _TMP403;
vec4 _a0406;
vec4 _TMP407;
vec4 _a0410;
vec4 _TMP411;
vec4 _a0414;
vec4 _TMP415;
vec4 _a0418;
vec3 _b0422;
vec3 _b0426;
vec3 _TMP427;
vec3 _a0428;
vec3 _b0436;
vec3 _b0440;
vec3 _TMP441;
vec3 _a0442;
vec4 _a0448;
vec4 _a0450;
vec4 _a0452;
vec3 _b0458;
vec3 _b0460;
vec3 _df0462;
vec3 _a0464;
vec3 _df0466;
vec3 _a0468;
vec3 _TMP497;
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
    vec3 _res1;
    vec3 _res2;
    vec3 _pix1;
    vec3 _pix2;
    float _blend1;
    float _blend2;
    vec2 _fp;
    vec3 _A11;
    vec3 _B11;
    vec3 _C1;
    vec3 _A3;
    vec3 _B3;
    vec3 _C;
    vec3 _D;
    vec3 _E;
    vec3 _F;
    vec3 _G;
    vec3 _H;
    vec3 _I;
    vec3 _G5;
    vec3 _H5;
    vec3 _I5;
    vec3 _A0;
    vec3 _D0;
    vec3 _G0;
    vec3 _C4;
    vec3 _F4;
    vec3 _I4;
    vec4 _b1;
    vec4 _c3;
    vec4 _e1;
    vec4 _i4;
    vec4 _i5;
    vec4 _h5;
    vec4 _fx45;
    vec4 _fx30;
    vec4 _fx60;
    vec3 _res;
    vec3 _n1;
    vec3 _n2;
    vec3 _n3;
    vec3 _n4;
    vec3 _s;
    vec3 _aa;
    vec3 _bb;
    vec3 _cc;
    vec3 _dd;
    vec3 _t;
    vec3 _m;
    vec3 _s1;
    vec3 _s0;
    vec4 _maximo;
    vec3 _color;
    float _ddy;
    float _v_weight_00;
    vec3 _coords10;
    vec3 _colorNB;
    float _v_weight_10;
    _x0110 = TEX0.xy*TextureSize;
    _fp = fract(_x0110);
    _TMP0 = COMPAT_TEXTURE(Texture, TEX1.xw);
    _A11 = vec3(float(_TMP0.x), float(_TMP0.y), float(_TMP0.z));
    _TMP1 = COMPAT_TEXTURE(Texture, TEX1.yw);
    _B11 = vec3(float(_TMP1.x), float(_TMP1.y), float(_TMP1.z));
    _TMP2 = COMPAT_TEXTURE(Texture, TEX1.zw);
    _C1 = vec3(float(_TMP2.x), float(_TMP2.y), float(_TMP2.z));
    _TMP3 = COMPAT_TEXTURE(Texture, TEX2.xw);
    _A3 = vec3(float(_TMP3.x), float(_TMP3.y), float(_TMP3.z));
    _TMP4 = COMPAT_TEXTURE(Texture, TEX2.yw);
    _B3 = vec3(float(_TMP4.x), float(_TMP4.y), float(_TMP4.z));
    _TMP5 = COMPAT_TEXTURE(Texture, TEX2.zw);
    _C = vec3(float(_TMP5.x), float(_TMP5.y), float(_TMP5.z));
    _TMP6 = COMPAT_TEXTURE(Texture, TEX3.xw);
    _D = vec3(float(_TMP6.x), float(_TMP6.y), float(_TMP6.z));
    _TMP7 = COMPAT_TEXTURE(Texture, TEX3.yw);
    _E = vec3(float(_TMP7.x), float(_TMP7.y), float(_TMP7.z));
    _TMP8 = COMPAT_TEXTURE(Texture, TEX3.zw);
    _F = vec3(float(_TMP8.x), float(_TMP8.y), float(_TMP8.z));
    _TMP9 = COMPAT_TEXTURE(Texture, TEX4.xw);
    _G = vec3(float(_TMP9.x), float(_TMP9.y), float(_TMP9.z));
    _TMP10 = COMPAT_TEXTURE(Texture, TEX4.yw);
    _H = vec3(float(_TMP10.x), float(_TMP10.y), float(_TMP10.z));
    _TMP11 = COMPAT_TEXTURE(Texture, TEX4.zw);
    _I = vec3(float(_TMP11.x), float(_TMP11.y), float(_TMP11.z));
    _TMP12 = COMPAT_TEXTURE(Texture, TEX5.xw);
    _G5 = vec3(float(_TMP12.x), float(_TMP12.y), float(_TMP12.z));
    _TMP13 = COMPAT_TEXTURE(Texture, TEX5.yw);
    _H5 = vec3(float(_TMP13.x), float(_TMP13.y), float(_TMP13.z));
    _TMP14 = COMPAT_TEXTURE(Texture, TEX5.zw);
    _I5 = vec3(float(_TMP14.x), float(_TMP14.y), float(_TMP14.z));
    _TMP15 = COMPAT_TEXTURE(Texture, TEX6.xy);
    _A0 = vec3(float(_TMP15.x), float(_TMP15.y), float(_TMP15.z));
    _TMP16 = COMPAT_TEXTURE(Texture, TEX6.xz);
    _D0 = vec3(float(_TMP16.x), float(_TMP16.y), float(_TMP16.z));
    _TMP17 = COMPAT_TEXTURE(Texture, TEX6.xw);
    _G0 = vec3(float(_TMP17.x), float(_TMP17.y), float(_TMP17.z));
    _TMP18 = COMPAT_TEXTURE(Texture, TEX7.xy);
    _C4 = vec3(float(_TMP18.x), float(_TMP18.y), float(_TMP18.z));
    _TMP19 = COMPAT_TEXTURE(Texture, TEX7.xz);
    _F4 = vec3(float(_TMP19.x), float(_TMP19.y), float(_TMP19.z));
    _TMP20 = COMPAT_TEXTURE(Texture, TEX7.xw);
    _I4 = vec3(float(_TMP20.x), float(_TMP20.y), float(_TMP20.z));
    _TMP93 = dot(vec3(float(_B3.x), float(_B3.y), float(_B3.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0154.x = float(_TMP93);
    _TMP93 = dot(vec3(float(_D.x), float(_D.y), float(_D.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0154.y = float(_TMP93);
    _TMP93 = dot(vec3(float(_H.x), float(_H.y), float(_H.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0154.z = float(_TMP93);
    _TMP93 = dot(vec3(float(_F.x), float(_F.y), float(_F.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0154.w = float(_TMP93);
    _b1 = vec4(float(_r0154.x), float(_r0154.y), float(_r0154.z), float(_r0154.w));
    _TMP93 = dot(vec3(float(_C.x), float(_C.y), float(_C.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0164.x = float(_TMP93);
    _TMP93 = dot(vec3(float(_A3.x), float(_A3.y), float(_A3.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0164.y = float(_TMP93);
    _TMP93 = dot(vec3(float(_G.x), float(_G.y), float(_G.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0164.z = float(_TMP93);
    _TMP93 = dot(vec3(float(_I.x), float(_I.y), float(_I.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0164.w = float(_TMP93);
    _c3 = vec4(float(_r0164.x), float(_r0164.y), float(_r0164.z), float(_r0164.w));
    _TMP93 = dot(vec3(float(_E.x), float(_E.y), float(_E.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0174.x = float(_TMP93);
    _TMP93 = dot(vec3(float(_E.x), float(_E.y), float(_E.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0174.y = float(_TMP93);
    _TMP93 = dot(vec3(float(_E.x), float(_E.y), float(_E.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0174.z = float(_TMP93);
    _TMP93 = dot(vec3(float(_E.x), float(_E.y), float(_E.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0174.w = float(_TMP93);
    _e1 = vec4(float(_r0174.x), float(_r0174.y), float(_r0174.z), float(_r0174.w));
    _TMP93 = dot(vec3(float(_I4.x), float(_I4.y), float(_I4.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0184.x = float(_TMP93);
    _TMP93 = dot(vec3(float(_C1.x), float(_C1.y), float(_C1.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0184.y = float(_TMP93);
    _TMP93 = dot(vec3(float(_A0.x), float(_A0.y), float(_A0.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0184.z = float(_TMP93);
    _TMP93 = dot(vec3(float(_G5.x), float(_G5.y), float(_G5.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0184.w = float(_TMP93);
    _i4 = vec4(float(_r0184.x), float(_r0184.y), float(_r0184.z), float(_r0184.w));
    _TMP93 = dot(vec3(float(_I5.x), float(_I5.y), float(_I5.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0194.x = float(_TMP93);
    _TMP93 = dot(vec3(float(_C4.x), float(_C4.y), float(_C4.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0194.y = float(_TMP93);
    _TMP93 = dot(vec3(float(_A11.x), float(_A11.y), float(_A11.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0194.z = float(_TMP93);
    _TMP93 = dot(vec3(float(_G0.x), float(_G0.y), float(_G0.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0194.w = float(_TMP93);
    _i5 = vec4(float(_r0194.x), float(_r0194.y), float(_r0194.z), float(_r0194.w));
    _TMP93 = dot(vec3(float(_H5.x), float(_H5.y), float(_H5.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0204.x = float(_TMP93);
    _TMP93 = dot(vec3(float(_F4.x), float(_F4.y), float(_F4.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0204.y = float(_TMP93);
    _TMP93 = dot(vec3(float(_B11.x), float(_B11.y), float(_B11.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0204.z = float(_TMP93);
    _TMP93 = dot(vec3(float(_D0.x), float(_D0.y), float(_D0.z)), vec3( 1.43593750E+01, 2.81718750E+01, 5.47265625E+00));
    _r0204.w = float(_TMP93);
    _h5 = vec4(float(_r0204.x), float(_r0204.y), float(_r0204.z), float(_r0204.w));
    _fx = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 1.00000000E+00, 1.00000000E+00, -1.00000000E+00, -1.00000000E+00)*_fp.x;
    _fx_left = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 5.00000000E-01, 2.00000000E+00, -5.00000000E-01, -2.00000000E+00)*_fp.x;
    _fx_up = vec4( 1.00000000E+00, -1.00000000E+00, -1.00000000E+00, 1.00000000E+00)*_fp.y + vec4( 2.00000000E+00, 5.00000000E-01, -2.00000000E+00, -5.00000000E-01)*_fp.x;
    _a0218 = _e1 - _b1;
    _TMP215 = abs(_a0218);
    _TMP27 = bvec4(_TMP215.x < 2.00000000E+00, _TMP215.y < 2.00000000E+00, _TMP215.z < 2.00000000E+00, _TMP215.w < 2.00000000E+00);
    _a0224 = _e1 - _b1.yzwx;
    _TMP221 = abs(_a0224);
    _TMP28 = bvec4(_TMP221.x < 2.00000000E+00, _TMP221.y < 2.00000000E+00, _TMP221.z < 2.00000000E+00, _TMP221.w < 2.00000000E+00);
    _a0230 = _e1 - _c3.yzwx;
    _TMP227 = abs(_a0230);
    _TMP29 = bvec4(_TMP227.x < 2.00000000E+00, _TMP227.y < 2.00000000E+00, _TMP227.z < 2.00000000E+00, _TMP227.w < 2.00000000E+00);
    _a0236 = _b1.wxyz - _h5.yzwx;
    _TMP233 = abs(_a0236);
    _TMP30 = bvec4(_TMP233.x < 2.00000000E+00, _TMP233.y < 2.00000000E+00, _TMP233.z < 2.00000000E+00, _TMP233.w < 2.00000000E+00);
    _a0242 = _b1.wxyz - _c3;
    _TMP239 = abs(_a0242);
    _TMP31 = bvec4(_TMP239.x < 2.00000000E+00, _TMP239.y < 2.00000000E+00, _TMP239.z < 2.00000000E+00, _TMP239.w < 2.00000000E+00);
    _a0248 = _b1.zwxy - _h5;
    _TMP245 = abs(_a0248);
    _TMP32 = bvec4(_TMP245.x < 2.00000000E+00, _TMP245.y < 2.00000000E+00, _TMP245.z < 2.00000000E+00, _TMP245.w < 2.00000000E+00);
    _a0254 = _b1.zwxy - _c3.zwxy;
    _TMP251 = abs(_a0254);
    _TMP33 = bvec4(_TMP251.x < 2.00000000E+00, _TMP251.y < 2.00000000E+00, _TMP251.z < 2.00000000E+00, _TMP251.w < 2.00000000E+00);
    _a0260 = _b1.wxyz - _b1;
    _TMP257 = abs(_a0260);
    _TMP34 = bvec4(_TMP257.x < 1.50000000E+01, _TMP257.y < 1.50000000E+01, _TMP257.z < 1.50000000E+01, _TMP257.w < 1.50000000E+01);
    _a0266 = _b1.wxyz - _c3;
    _TMP263 = abs(_a0266);
    _TMP35 = bvec4(_TMP263.x < 1.50000000E+01, _TMP263.y < 1.50000000E+01, _TMP263.z < 1.50000000E+01, _TMP263.w < 1.50000000E+01);
    _a0272 = _b1.zwxy - _b1.yzwx;
    _TMP269 = abs(_a0272);
    _TMP36 = bvec4(_TMP269.x < 1.50000000E+01, _TMP269.y < 1.50000000E+01, _TMP269.z < 1.50000000E+01, _TMP269.w < 1.50000000E+01);
    _a0278 = _b1.zwxy - _c3.zwxy;
    _TMP275 = abs(_a0278);
    _TMP37 = bvec4(_TMP275.x < 1.50000000E+01, _TMP275.y < 1.50000000E+01, _TMP275.z < 1.50000000E+01, _TMP275.w < 1.50000000E+01);
    _a0284 = _e1 - _c3.wxyz;
    _TMP281 = abs(_a0284);
    _TMP38 = bvec4(_TMP281.x < 1.50000000E+01, _TMP281.y < 1.50000000E+01, _TMP281.z < 1.50000000E+01, _TMP281.w < 1.50000000E+01);
    _a0290 = _b1.wxyz - _h5.yzwx;
    _TMP287 = abs(_a0290);
    _TMP39 = bvec4(_TMP287.x < 1.50000000E+01, _TMP287.y < 1.50000000E+01, _TMP287.z < 1.50000000E+01, _TMP287.w < 1.50000000E+01);
    _a0296 = _b1.wxyz - _i4;
    _TMP293 = abs(_a0296);
    _TMP40 = bvec4(_TMP293.x < 1.50000000E+01, _TMP293.y < 1.50000000E+01, _TMP293.z < 1.50000000E+01, _TMP293.w < 1.50000000E+01);
    _a0302 = _b1.zwxy - _h5;
    _TMP299 = abs(_a0302);
    _TMP41 = bvec4(_TMP299.x < 1.50000000E+01, _TMP299.y < 1.50000000E+01, _TMP299.z < 1.50000000E+01, _TMP299.w < 1.50000000E+01);
    _a0308 = _b1.zwxy - _i5;
    _TMP305 = abs(_a0308);
    _TMP42 = bvec4(_TMP305.x < 1.50000000E+01, _TMP305.y < 1.50000000E+01, _TMP305.z < 1.50000000E+01, _TMP305.w < 1.50000000E+01);
    _a0314 = _e1 - _c3.zwxy;
    _TMP311 = abs(_a0314);
    _TMP43 = bvec4(_TMP311.x < 1.50000000E+01, _TMP311.y < 1.50000000E+01, _TMP311.z < 1.50000000E+01, _TMP311.w < 1.50000000E+01);
    _a0320 = _e1 - _c3;
    _TMP317 = abs(_a0320);
    _TMP44 = bvec4(_TMP317.x < 1.50000000E+01, _TMP317.y < 1.50000000E+01, _TMP317.z < 1.50000000E+01, _TMP317.w < 1.50000000E+01);
    _interp_restriction_lv1 = bvec4(_e1.x != _b1.w && _e1.x != _b1.z && (_TMP27.x || _TMP28.x || !_TMP29.x) && (_TMP30.x || _TMP31.x || _TMP32.x || _TMP33.x) && (!_TMP34.x && !_TMP35.x || !_TMP36.x && !_TMP37.x || _TMP38.x && (!_TMP39.x && !_TMP40.x || !_TMP41.x && !_TMP42.x) || _TMP43.x || _TMP44.x), _e1.y != _b1.x && _e1.y != _b1.w && (_TMP27.y || _TMP28.y || !_TMP29.y) && (_TMP30.y || _TMP31.y || _TMP32.y || _TMP33.y) && (!_TMP34.y && !_TMP35.y || !_TMP36.y && !_TMP37.y || _TMP38.y && (!_TMP39.y && !_TMP40.y || !_TMP41.y && !_TMP42.y) || _TMP43.y || _TMP44.y), _e1.z != _b1.y && _e1.z != _b1.x && (_TMP27.z || _TMP28.z || !_TMP29.z) && (_TMP30.z || _TMP31.z || _TMP32.z || _TMP33.z) && (!_TMP34.z && !_TMP35.z || !_TMP36.z && !_TMP37.z || _TMP38.z && (!_TMP39.z && !_TMP40.z || !_TMP41.z && !_TMP42.z) || _TMP43.z || _TMP44.z), _e1.w != _b1.z && _e1.w != _b1.y && (_TMP27.w || _TMP28.w || !_TMP29.w) && (_TMP30.w || _TMP31.w || _TMP32.w || _TMP33.w) && (!_TMP34.w && !_TMP35.w || !_TMP36.w && !_TMP37.w || _TMP38.w && (!_TMP39.w && !_TMP40.w || !_TMP41.w && !_TMP42.w) || _TMP43.w || _TMP44.w));
    _interp_restriction_lv2_left = bvec4(_e1.x != _c3.z && _b1.y != _c3.z, _e1.y != _c3.w && _b1.z != _c3.w, _e1.z != _c3.x && _b1.w != _c3.x, _e1.w != _c3.y && _b1.x != _c3.y);
    _interp_restriction_lv2_up = bvec4(_e1.x != _c3.x && _b1.x != _c3.x, _e1.y != _c3.y && _b1.y != _c3.y, _e1.z != _c3.z && _b1.z != _c3.z, _e1.w != _c3.w && _b1.w != _c3.w);
    _x0324 = (_fx - vec4( 1.10000002E+00, 9.99999940E-02, -8.99999976E-01, 9.99999940E-02))/vec4( 7.99999952E-01, 7.99999952E-01, 7.99999952E-01, 7.99999952E-01);
    _TMP96 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0324);
    _TMP325 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP96);
    _fx45 = _TMP325*_TMP325*(3.00000000E+00 - 2.00000000E+00*_TMP325);
    _x0334 = (_fx_left - vec4( 6.00000024E-01, 6.00000024E-01, -8.99999976E-01, -4.00000006E-01))/vec4( 7.99999952E-01, 7.99999952E-01, 7.99999952E-01, 8.00000012E-01);
    _TMP96 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0334);
    _TMP335 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP96);
    _fx30 = _TMP335*_TMP335*(3.00000000E+00 - 2.00000000E+00*_TMP335);
    _x0344 = (_fx_up - vec4( 1.60000002E+00, -4.00000006E-01, -1.39999998E+00, 9.99999940E-02))/vec4( 8.00000072E-01, 8.00000012E-01, 7.99999952E-01, 7.99999952E-01);
    _TMP96 = min(vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0344);
    _TMP345 = max(vec4( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP96);
    _fx60 = _TMP345*_TMP345*(3.00000000E+00 - 2.00000000E+00*_TMP345);
    _a0356 = _e1 - _c3;
    _TMP353 = abs(_a0356);
    _a0360 = _e1 - _c3.zwxy;
    _TMP357 = abs(_a0360);
    _a0364 = _c3.wxyz - _h5;
    _TMP361 = abs(_a0364);
    _a0368 = _c3.wxyz - _h5.yzwx;
    _TMP365 = abs(_a0368);
    _a0372 = _b1.zwxy - _b1.wxyz;
    _TMP369 = abs(_a0372);
    _TMP45 = _TMP353 + _TMP357 + _TMP361 + _TMP365 + 4.00000000E+00*_TMP369;
    _a0378 = _b1.zwxy - _b1.yzwx;
    _TMP375 = abs(_a0378);
    _a0382 = _b1.zwxy - _i5;
    _TMP379 = abs(_a0382);
    _a0386 = _b1.wxyz - _i4;
    _TMP383 = abs(_a0386);
    _a0390 = _b1.wxyz - _b1;
    _TMP387 = abs(_a0390);
    _a0394 = _e1 - _c3.wxyz;
    _TMP391 = abs(_a0394);
    _TMP46 = _TMP375 + _TMP379 + _TMP383 + _TMP387 + 4.00000000E+00*_TMP391;
    _edr = bvec4((_TMP45 + 3.50000000E+00).x < _TMP46.x && _interp_restriction_lv1.x, (_TMP45 + 3.50000000E+00).y < _TMP46.y && _interp_restriction_lv1.y, (_TMP45 + 3.50000000E+00).z < _TMP46.z && _interp_restriction_lv1.z, (_TMP45 + 3.50000000E+00).w < _TMP46.w && _interp_restriction_lv1.w);
    _a0398 = _b1.wxyz - _c3.zwxy;
    _TMP395 = abs(_a0398);
    _a0402 = _b1.zwxy - _c3;
    _TMP399 = abs(_a0402);
    _edr_left = bvec4((2.00000000E+00*_TMP395).x <= _TMP399.x && _interp_restriction_lv2_left.x, (2.00000000E+00*_TMP395).y <= _TMP399.y && _interp_restriction_lv2_left.y, (2.00000000E+00*_TMP395).z <= _TMP399.z && _interp_restriction_lv2_left.z, (2.00000000E+00*_TMP395).w <= _TMP399.w && _interp_restriction_lv2_left.w);
    _a0406 = _b1.wxyz - _c3.zwxy;
    _TMP403 = abs(_a0406);
    _a0410 = _b1.zwxy - _c3;
    _TMP407 = abs(_a0410);
    _edr_up = bvec4(_TMP403.x >= (2.00000000E+00*_TMP407).x && _interp_restriction_lv2_up.x, _TMP403.y >= (2.00000000E+00*_TMP407).y && _interp_restriction_lv2_up.y, _TMP403.z >= (2.00000000E+00*_TMP407).z && _interp_restriction_lv2_up.z, _TMP403.w >= (2.00000000E+00*_TMP407).w && _interp_restriction_lv2_up.w);
    _nc45 = bvec4(_edr.x && bool(_fx45.x), _edr.y && bool(_fx45.y), _edr.z && bool(_fx45.z), _edr.w && bool(_fx45.w));
    _nc30 = bvec4(_edr.x && _edr_left.x && bool(_fx30.x), _edr.y && _edr_left.y && bool(_fx30.y), _edr.z && _edr_left.z && bool(_fx30.z), _edr.w && _edr_left.w && bool(_fx30.w));
    _nc60 = bvec4(_edr.x && _edr_up.x && bool(_fx60.x), _edr.y && _edr_up.y && bool(_fx60.y), _edr.z && _edr_up.z && bool(_fx60.z), _edr.w && _edr_up.w && bool(_fx60.w));
    _a0414 = _e1 - _b1.wxyz;
    _TMP411 = abs(_a0414);
    _a0418 = _e1 - _b1.zwxy;
    _TMP415 = abs(_a0418);
    _px = bvec4(_TMP411.x <= _TMP415.x, _TMP411.y <= _TMP415.y, _TMP411.z <= _TMP415.z, _TMP411.w <= _TMP415.w);
    _n1 = vec3(float(_B11.x), float(_B11.y), float(_B11.z));
    _n2 = vec3(float(_B3.x), float(_B3.y), float(_B3.z));
    _s = vec3(float(_E.x), float(_E.y), float(_E.z));
    _n3 = vec3(float(_H.x), float(_H.y), float(_H.z));
    _n4 = vec3(float(_H5.x), float(_H5.y), float(_H5.z));
    _aa = _n2 - _n1;
    _bb = _s - _n2;
    _cc = _n3 - _s;
    _dd = _n4 - _n3;
    _t = (7.00000000E+00*(_bb + _cc) - 3.00000000E+00*(_aa + _dd))/1.60000000E+01;
    _m = vec3(_s.x < 5.00000000E-01 ? (2.00000000E+00*_s).x : (2.00000000E+00*(1.00000000E+00 - _s)).x, _s.y < 5.00000000E-01 ? (2.00000000E+00*_s).y : (2.00000000E+00*(1.00000000E+00 - _s)).y, _s.z < 5.00000000E-01 ? (2.00000000E+00*_s).z : (2.00000000E+00*(1.00000000E+00 - _s)).z);
    _TMP53 = abs(_bb);
    _b0422 = 6.49999976E-01*_TMP53;
    _m = min(_m, _b0422);
    _TMP54 = abs(_cc);
    _b0426 = 6.49999976E-01*_TMP54;
    _m = min(_m, _b0426);
    _a0428 = -_m;
    _TMP85 = min(_m, _t);
    _TMP427 = max(_a0428, _TMP85);
    _s1 = (2.00000000E+00*_fp.y - 1.00000000E+00)*_TMP427 + _s;
    _n1 = vec3(float(_D0.x), float(_D0.y), float(_D0.z));
    _n2 = vec3(float(_D.x), float(_D.y), float(_D.z));
    _n3 = vec3(float(_F.x), float(_F.y), float(_F.z));
    _n4 = vec3(float(_F4.x), float(_F4.y), float(_F4.z));
    _aa = _n2 - _n1;
    _bb = _s1 - _n2;
    _cc = _n3 - _s1;
    _dd = _n4 - _n3;
    _t = (7.00000000E+00*(_bb + _cc) - 3.00000000E+00*(_aa + _dd))/1.60000000E+01;
    _m = vec3(_s1.x < 5.00000000E-01 ? (2.00000000E+00*_s1).x : (2.00000000E+00*(1.00000000E+00 - _s1)).x, _s1.y < 5.00000000E-01 ? (2.00000000E+00*_s1).y : (2.00000000E+00*(1.00000000E+00 - _s1)).y, _s1.z < 5.00000000E-01 ? (2.00000000E+00*_s1).z : (2.00000000E+00*(1.00000000E+00 - _s1)).z);
    _TMP55 = abs(_bb);
    _b0436 = 6.49999976E-01*_TMP55;
    _m = min(_m, _b0436);
    _TMP56 = abs(_cc);
    _b0440 = 6.49999976E-01*_TMP56;
    _m = min(_m, _b0440);
    _a0442 = -_m;
    _TMP85 = min(_m, _t);
    _TMP441 = max(_a0442, _TMP85);
    _s0 = (2.00000000E+00*_fp.x - 1.00000000E+00)*_TMP441 + _s1;
    _nc = bvec4(_nc30.x || _nc60.x || _nc45.x, _nc30.y || _nc60.y || _nc45.y, _nc30.z || _nc60.z || _nc45.z, _nc30.w || _nc60.w || _nc45.w);
    _blend2 = 0.00000000E+00;
    _blend1 = 0.00000000E+00;
    _a0448 = vec4(float(_nc45.x), float(_nc45.y), float(_nc45.z), float(_nc45.w));
    _TMP58 = dot(_a0448, _fx45);
    _a0450 = vec4(float(_nc30.x), float(_nc30.y), float(_nc30.z), float(_nc30.w));
    _TMP59 = dot(_a0450, _fx30);
    _a0452 = vec4(float(_nc60.x), float(_nc60.y), float(_nc60.z), float(_nc60.w));
    _TMP60 = dot(_a0452, _fx60);
    _TMP61 = max(vec4(_TMP59, _TMP59, _TMP59, _TMP59), vec4(_TMP60, _TMP60, _TMP60, _TMP60));
    _maximo = max(_TMP61, vec4(_TMP58, _TMP58, _TMP58, _TMP58));
    if (_nc.x) { 
        if (_px.x) { 
            _TMP62 = _F;
        } else {
            _TMP62 = _H;
        } 
        _pix1 = _TMP62;
        _blend1 = _maximo.x;
    } else {
        if (_nc.y) { 
            if (_px.y) { 
                _TMP63 = _B3;
            } else {
                _TMP63 = _F;
            } 
            _pix1 = _TMP63;
            _blend1 = _maximo.y;
        } else {
            if (_nc.z) { 
                if (_px.z) { 
                    _TMP64 = _D;
                } else {
                    _TMP64 = _B3;
                } 
                _pix1 = _TMP64;
                _blend1 = _maximo.z;
            } else {
                if (_nc.w) { 
                    if (_px.w) { 
                        _TMP65 = _H;
                    } else {
                        _TMP65 = _D;
                    } 
                    _pix1 = _TMP65;
                    _blend1 = _maximo.w;
                } 
            } 
        } 
    } 
    if (_nc.w) { 
        if (_px.w) { 
            _TMP66 = _H;
        } else {
            _TMP66 = _D;
        } 
        _pix2 = _TMP66;
        _blend2 = _maximo.w;
    } else {
        if (_nc.z) { 
            if (_px.z) { 
                _TMP67 = _D;
            } else {
                _TMP67 = _B3;
            } 
            _pix2 = _TMP67;
            _blend2 = _maximo.z;
        } else {
            if (_nc.y) { 
                if (_px.y) { 
                    _TMP68 = _B3;
                } else {
                    _TMP68 = _F;
                } 
                _pix2 = _TMP68;
                _blend2 = _maximo.y;
            } else {
                if (_nc.x) { 
                    if (_px.x) { 
                        _TMP69 = _F;
                    } else {
                        _TMP69 = _H;
                    } 
                    _pix2 = _TMP69;
                    _blend2 = _maximo.x;
                } 
            } 
        } 
    } 
    _b0458 = vec3(float(_pix1.x), float(_pix1.y), float(_pix1.z));
    _TMP70 = _s0 + _blend1*(_b0458 - _s0);
    _res1 = vec3(float(_TMP70.x), float(_TMP70.y), float(_TMP70.z));
    _b0460 = vec3(float(_pix2.x), float(_pix2.y), float(_pix2.z));
    _TMP71 = _s0 + _blend2*(_b0460 - _s0);
    _res2 = vec3(float(_TMP71.x), float(_TMP71.y), float(_TMP71.z));
    _a0464 = _E - _res1;
    _TMP94 = abs(vec3(float(_a0464.x), float(_a0464.y), float(_a0464.z)));
    _df0462 = vec3(float(_TMP94.x), float(_TMP94.y), float(_TMP94.z));
    _TMP72 = _df0462.x + _df0462.y + _df0462.z;
    _a0468 = _E - _res2;
    _TMP94 = abs(vec3(float(_a0468.x), float(_a0468.y), float(_a0468.z)));
    _df0466 = vec3(float(_TMP94.x), float(_TMP94.y), float(_TMP94.z));
    _TMP73 = _df0466.x + _df0466.y + _df0466.z;
    _TMP74 = float((_TMP73 >= _TMP72));
    _res = _res1 + _TMP74*(_res2 - _res1);
    _TMP95 = pow(float(_res.x), 2.40039062E+00);
    _TMP86 = float(_TMP95);
    _TMP95 = pow(float(_res.y), 2.40039062E+00);
    _TMP87 = float(_TMP95);
    _TMP95 = pow(float(_res.z), 2.40039062E+00);
    _TMP88 = float(_TMP95);
    _TMP75 = vec3(_TMP86, _TMP87, _TMP88);
    _color = vec3(float(_TMP75.x), float(_TMP75.y), float(_TMP75.z));
    _ddy = _fp.y - 5.00000000E-01;
    _v_weight_00 = _ddy/5.79999983E-01;
    if (_v_weight_00 > 1.00000000E+00) { 
        _v_weight_00 = 1.00000000E+00;
    } 
    _v_weight_00 = 1.00000000E+00 - _v_weight_00*_v_weight_00;
    _v_weight_00 = _v_weight_00*_v_weight_00;
    _color = _color*vec3(_v_weight_00, _v_weight_00, _v_weight_00);
    if (_ddy > 0.00000000E+00) { 
        _coords10 = vec3(float(_H.x), float(_H.y), float(_H.z));
        _ddy = 1.00000000E+00 - _ddy;
    } else {
        _coords10 = vec3(float(_B3.x), float(_B3.y), float(_B3.z));
        _ddy = 1.00000000E+00 + _ddy;
    } 
    _TMP89 = pow(_coords10.x, 2.40000010E+00);
    _TMP90 = pow(_coords10.y, 2.40000010E+00);
    _TMP91 = pow(_coords10.z, 2.40000010E+00);
    _colorNB = vec3(_TMP89, _TMP90, _TMP91);
    _v_weight_10 = _ddy/5.79999983E-01;
    if (_v_weight_10 > 1.00000000E+00) { 
        _v_weight_10 = 1.00000000E+00;
    } 
    _v_weight_10 = 1.00000000E+00 - _v_weight_10*_v_weight_10;
    _v_weight_10 = _v_weight_10*_v_weight_10;
    _color = _color + _colorNB*vec3(_v_weight_10, _v_weight_10, _v_weight_10);
    _color = _color*vec3( 1.45000005E+00, 1.45000005E+00, 1.45000005E+00);
    _TMP89 = pow(_color.x, 4.54545438E-01);
    _TMP90 = pow(_color.y, 4.54545438E-01);
    _TMP91 = pow(_color.z, 4.54545438E-01);
    _TMP76 = vec3(_TMP89, _TMP90, _TMP91);
    _TMP92 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _TMP76);
    _TMP497 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP92);
    _ret_0 = vec4(_TMP497.x, _TMP497.y, _TMP497.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
