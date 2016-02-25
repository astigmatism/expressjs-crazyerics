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
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
struct prev {
float _placeholder26;
};
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
COMPAT_VARYING     float _frame_rotation;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
};
struct prev {
float _placeholder33;
};
vec4 _ret_0;
float _TMP52;
float _TMP51;
float _TMP50;
vec3 _TMP56;
float _TMP49;
float _TMP48;
float _TMP47;
float _TMP24;
float _TMP23;
float _TMP22;
float _TMP31;
float _TMP21;
float _TMP20;
float _TMP18;
float _TMP17;
vec4 _TMP16;
vec4 _TMP55;
vec4 _TMP46;
vec4 _TMP45;
vec4 _TMP44;
vec4 _TMP43;
float _TMP10;
vec4 _TMP9;
vec4 _TMP8;
float _TMP42;
float _TMP41;
float _TMP40;
float _TMP39;
vec4 _TMP7;
float _TMP6;
vec4 _TMP5;
vec4 _TMP4;
vec4 _TMP3;
float _TMP38;
float _TMP37;
float _TMP53;
vec2 _TMP2;
float _TMP36;
float _TMP54;
float _TMP35;
float _TMP34;
vec2 _TMP33;
vec2 _TMP32;
float _TMP0;
uniform sampler2D Texture;
input_dummy _IN1;
prev _PASSPREV41;
float _x0065;
vec2 _co0067;
vec2 _co_weight0067;
vec2 _t0069;
vec2 _co0071;
vec2 _co_weight0071;
vec2 _t0073;
vec2 _co0075;
float _corner_weight0075;
vec2 _b0077;
float _x0087;
float _TMP88;
float _TMP104;
float _x_step0105;
float _curve0105;
float _a0109;
float _val0113;
float _a0113;
float _TMP116;
float _x_step0117;
float _curve0117;
float _a0121;
float _val0125;
float _a0125;
vec4 _TMP130;
vec4 _x0145;
vec4 _TMP158;
vec4 _x0173;
vec2 _co0185;
vec2 _c0187;
vec2 _c0191;
vec2 _c0193;
vec4 _sample_min0195;
vec4 _sample_max0195;
vec4 _r0197;
vec4 _TMP202;
vec2 _c0211;
vec2 _c0215;
vec2 _c0217;
vec4 _sample_min0219;
vec4 _sample_max0219;
vec4 _r0221;
vec4 _TMP226;
vec2 _co0233;
vec2 _c0235;
vec2 _c0239;
vec2 _c0241;
vec4 _sample_min0243;
vec4 _sample_max0243;
vec4 _r0245;
vec4 _TMP250;
vec2 _co0257;
vec2 _c0259;
vec2 _c0263;
vec2 _c0265;
vec4 _sample_min0267;
vec4 _sample_max0267;
vec4 _r0269;
vec4 _TMP274;
vec4 _sample_min0281;
vec4 _sample_max0281;
vec4 _r0283;
vec4 _TMP288;
float _TMP302;
vec2 _x0313;
float _x0321;
float _x0323;
float _x0327;
float _x0329;
float _x0331;
float _t0335;
float _t0337;
float _TMP342;
float _pos0351;
float _weight0351;
float _a0353;
float _x0355;
vec3 _x0357;
vec3 _TMP358;
float _weight0365;
float _a0367;
float _x0369;
vec3 _x0371;
vec3 _TMP372;
float _pos0379;
float _weight0379;
float _a0381;
float _x0383;
vec3 _x0385;
vec3 _TMP386;
COMPAT_VARYING vec4 TEX0;
 
uniform sampler2D PassPrev4Texture;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec2 _tex_size;
    vec2 _midpoint;
    float _scan_offset;
    vec2 _co4;
    vec2 _xy;
    vec2 _dx1;
    vec2 _dy;
    vec2 _pix_co;
    vec2 _tex_co;
    vec2 _dist;
    vec3 _col1;
    vec3 _col2;
    vec4 _coeffs_x;
    vec4 _coeffs_y;
    float _rgb_max;
    float _sample_offset;
    float _scan_pos;
    float _scan_strength;
    float _mask_colors;
    float _mask_dither;
    vec2 _mod_fac;
    int _dot_no;
    int _dither;
    float _mask_mul;
    vec3 _mask_weight;
    _tex_size = TextureSize;
    _midpoint = vec2( 5.00000000E-01, 5.00000000E-01);
    _scan_offset = 0.00000000E+00;
    if (InputSize.y >= 4.00000000E+02) { 
        _tex_size.y = TextureSize.y*5.00000000E-01;
        _x0065 = float(FrameCount)/2.00000000E+00;
        _TMP31 = floor(_x0065);
        _TMP0 = float(FrameCount) - 2.00000000E+00*_TMP31;
        if (bool(_TMP0)) { 
            _midpoint.y = 7.50000000E-01;
            _scan_offset = 5.00000000E-01;
        } else {
            _midpoint.y = 2.50000000E-01;
        } 
    } 
    _co4 = (TEX0.xy*_tex_size)/InputSize;
    _co_weight0067 = vec2(_co4.y, _co4.x)*2.00000000E+00 - 1.00000000E+00;
    _t0069 = _co_weight0067*_co_weight0067;
    _co0067 = _co4 + _t0069*(_co4 - _co4);
    _co_weight0071 = vec2(_co4.y, _co4.x)*2.00000000E+00 - 1.00000000E+00;
    _t0073 = _co_weight0071*_co_weight0071;
    _co0071 = _co4 + _t0073*(_co4 - _co4);
    _b0077 = vec2( 1.00000000E+00, 1.00000000E+00) - _co0071;
    _TMP32 = min(_co0071, _b0077);
    _co0075 = _TMP32*vec2( 1.00000000E+00, 7.50000000E-01);
    _TMP33 = min(_co0075, vec2( 0.00000000E+00, 0.00000000E+00));
    _co0075 = vec2( 0.00000000E+00, 0.00000000E+00) - _TMP33;
    _TMP34 = dot(_co0075, _co0075);
    _TMP53 = inversesqrt(_TMP34);
    _TMP35 = 1.00000000E+00/_TMP53;
    _x0087 = (0.00000000E+00 - _TMP35)*1.50000000E+02;
    _TMP47 = min(1.00000000E+00, _x0087);
    _TMP88 = max(0.00000000E+00, _TMP47);
    _TMP54 = floor(-0.00000000E+00);
    _TMP36 = -_TMP54;
    _corner_weight0075 = 1.00000000E+00 + _TMP36*(_TMP88 - 1.00000000E+00);
    _xy = _co0067*(InputSize/_tex_size);
    _dx1 = vec2(1.00000000E+00/TextureSize.x, 0.00000000E+00);
    _dy = vec2(0.00000000E+00, 1.00000000E+00/_tex_size.y);
    _pix_co = _xy*_tex_size - _midpoint;
    _TMP2 = floor(_pix_co);
    _tex_co = (_TMP2 + _midpoint)/_tex_size;
    _dist = fract(_pix_co);
    _x_step0105 = float((_dist.x >= 5.00000000E-01));
    _a0109 = 2.50000000E-01 - (_dist.x - _x_step0105)*(_dist.x - _x_step0105);
    _TMP53 = inversesqrt(_a0109);
    _TMP37 = 1.00000000E+00/_TMP53;
    _a0113 = 5.00000000E-01 - _dist.x;
    _val0113 = float((_a0113 > 0.00000000E+00));
    _TMP38 = _val0113 - float((_a0113 < 0.00000000E+00));
    _curve0105 = 5.00000000E-01 - _TMP37*_TMP38;
    _TMP104 = _dist.x + 3.60000014E-01*(_curve0105 - _dist.x);
    _x_step0117 = float((_dist.y >= 5.00000000E-01));
    _a0121 = 2.50000000E-01 - (_dist.y - _x_step0117)*(_dist.y - _x_step0117);
    _TMP53 = inversesqrt(_a0121);
    _TMP37 = 1.00000000E+00/_TMP53;
    _a0125 = 5.00000000E-01 - _dist.y;
    _val0125 = float((_a0125 > 0.00000000E+00));
    _TMP38 = _val0125 - float((_a0125 < 0.00000000E+00));
    _curve0117 = 5.00000000E-01 - _TMP37*_TMP38;
    _TMP116 = _dist.y + (_curve0117 - _dist.y);
    _coeffs_x = 3.14159274E+00*vec4(1.00000000E+00 + _TMP104, _TMP104, 1.00000000E+00 - _TMP104, 2.00000000E+00 - _TMP104);
    _coeffs_y = 3.14159274E+00*vec4(1.00000000E+00 + _TMP116, _TMP116, 1.00000000E+00 - _TMP116, 2.00000000E+00 - _TMP116);
    _TMP3 = abs(_coeffs_x);
    _TMP130 = max(_TMP3, vec4( 9.99999975E-06, 9.99999975E-06, 9.99999975E-06, 9.99999975E-06));
    _TMP39 = sin(_TMP130.x);
    _TMP40 = sin(_TMP130.y);
    _TMP41 = sin(_TMP130.z);
    _TMP42 = sin(_TMP130.w);
    _TMP4 = vec4(_TMP39, _TMP40, _TMP41, _TMP42);
    _x0145 = _TMP130/2.00000000E+00;
    _TMP39 = sin(_x0145.x);
    _TMP40 = sin(_x0145.y);
    _TMP41 = sin(_x0145.z);
    _TMP42 = sin(_x0145.w);
    _TMP5 = vec4(_TMP39, _TMP40, _TMP41, _TMP42);
    _coeffs_x = ((2.00000000E+00*_TMP4)*_TMP5)/(_TMP130*_TMP130);
    _TMP6 = dot(_coeffs_x, vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _coeffs_x = _coeffs_x/_TMP6;
    _TMP7 = abs(_coeffs_y);
    _TMP158 = max(_TMP7, vec4( 9.99999975E-06, 9.99999975E-06, 9.99999975E-06, 9.99999975E-06));
    _TMP39 = sin(_TMP158.x);
    _TMP40 = sin(_TMP158.y);
    _TMP41 = sin(_TMP158.z);
    _TMP42 = sin(_TMP158.w);
    _TMP8 = vec4(_TMP39, _TMP40, _TMP41, _TMP42);
    _x0173 = _TMP158/2.00000000E+00;
    _TMP39 = sin(_x0173.x);
    _TMP40 = sin(_x0173.y);
    _TMP41 = sin(_x0173.z);
    _TMP42 = sin(_x0173.w);
    _TMP9 = vec4(_TMP39, _TMP40, _TMP41, _TMP42);
    _coeffs_y = ((2.00000000E+00*_TMP8)*_TMP9)/(_TMP158*_TMP158);
    _TMP10 = dot(_coeffs_y, vec4( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _coeffs_y = _coeffs_y/_TMP10;
    _co0185 = _tex_co - _dy;
    _c0187 = _co0185 - _dx1;
    _TMP43 = COMPAT_TEXTURE(PassPrev4Texture, _c0187);
    _TMP44 = COMPAT_TEXTURE(PassPrev4Texture, _co0185);
    _c0191 = _co0185 + _dx1;
    _TMP45 = COMPAT_TEXTURE(PassPrev4Texture, _c0191);
    _c0193 = _co0185 + 2.00000000E+00*_dx1;
    _TMP46 = COMPAT_TEXTURE(PassPrev4Texture, _c0193);
    _r0197 = _coeffs_x.x*_TMP43;
    _r0197 = _r0197 + _coeffs_x.y*_TMP44;
    _r0197 = _r0197 + _coeffs_x.z*_TMP45;
    _r0197 = _r0197 + _coeffs_x.w*_TMP46;
    _sample_min0195 = min(_TMP44, _TMP45);
    _sample_max0195 = max(_TMP44, _TMP45);
    _TMP55 = min(_sample_max0195, _r0197);
    _TMP202 = max(_sample_min0195, _TMP55);
    _c0211 = _tex_co - _dx1;
    _TMP43 = COMPAT_TEXTURE(PassPrev4Texture, _c0211);
    _TMP44 = COMPAT_TEXTURE(PassPrev4Texture, _tex_co);
    _c0215 = _tex_co + _dx1;
    _TMP45 = COMPAT_TEXTURE(PassPrev4Texture, _c0215);
    _c0217 = _tex_co + 2.00000000E+00*_dx1;
    _TMP46 = COMPAT_TEXTURE(PassPrev4Texture, _c0217);
    _r0221 = _coeffs_x.x*_TMP43;
    _r0221 = _r0221 + _coeffs_x.y*_TMP44;
    _r0221 = _r0221 + _coeffs_x.z*_TMP45;
    _r0221 = _r0221 + _coeffs_x.w*_TMP46;
    _sample_min0219 = min(_TMP44, _TMP45);
    _sample_max0219 = max(_TMP44, _TMP45);
    _TMP55 = min(_sample_max0219, _r0221);
    _TMP226 = max(_sample_min0219, _TMP55);
    _co0233 = _tex_co + _dy;
    _c0235 = _co0233 - _dx1;
    _TMP43 = COMPAT_TEXTURE(PassPrev4Texture, _c0235);
    _TMP44 = COMPAT_TEXTURE(PassPrev4Texture, _co0233);
    _c0239 = _co0233 + _dx1;
    _TMP45 = COMPAT_TEXTURE(PassPrev4Texture, _c0239);
    _c0241 = _co0233 + 2.00000000E+00*_dx1;
    _TMP46 = COMPAT_TEXTURE(PassPrev4Texture, _c0241);
    _r0245 = _coeffs_x.x*_TMP43;
    _r0245 = _r0245 + _coeffs_x.y*_TMP44;
    _r0245 = _r0245 + _coeffs_x.z*_TMP45;
    _r0245 = _r0245 + _coeffs_x.w*_TMP46;
    _sample_min0243 = min(_TMP44, _TMP45);
    _sample_max0243 = max(_TMP44, _TMP45);
    _TMP55 = min(_sample_max0243, _r0245);
    _TMP250 = max(_sample_min0243, _TMP55);
    _co0257 = _tex_co + 2.00000000E+00*_dy;
    _c0259 = _co0257 - _dx1;
    _TMP43 = COMPAT_TEXTURE(PassPrev4Texture, _c0259);
    _TMP44 = COMPAT_TEXTURE(PassPrev4Texture, _co0257);
    _c0263 = _co0257 + _dx1;
    _TMP45 = COMPAT_TEXTURE(PassPrev4Texture, _c0263);
    _c0265 = _co0257 + 2.00000000E+00*_dx1;
    _TMP46 = COMPAT_TEXTURE(PassPrev4Texture, _c0265);
    _r0269 = _coeffs_x.x*_TMP43;
    _r0269 = _r0269 + _coeffs_x.y*_TMP44;
    _r0269 = _r0269 + _coeffs_x.z*_TMP45;
    _r0269 = _r0269 + _coeffs_x.w*_TMP46;
    _sample_min0267 = min(_TMP44, _TMP45);
    _sample_max0267 = max(_TMP44, _TMP45);
    _TMP55 = min(_sample_max0267, _r0269);
    _TMP274 = max(_sample_min0267, _TMP55);
    _r0283 = _coeffs_y.x*_TMP202;
    _r0283 = _r0283 + _coeffs_y.y*_TMP226;
    _r0283 = _r0283 + _coeffs_y.z*_TMP250;
    _r0283 = _r0283 + _coeffs_y.w*_TMP274;
    _sample_min0281 = min(_TMP226, _TMP250);
    _sample_max0281 = max(_TMP226, _TMP250);
    _TMP55 = min(_sample_max0281, _r0283);
    _TMP288 = max(_sample_min0281, _TMP55);
    _TMP16 = COMPAT_TEXTURE(Texture, _xy);
    _TMP17 = max(_TMP288.y, _TMP288.z);
    _rgb_max = max(_TMP288.x, _TMP17);
    _sample_offset = (InputSize.y/OutputSize.y)*5.00000000E-01;
    _scan_pos = _xy.y*_tex_size.y + _scan_offset;
    _scan_strength = 4.00000006E-01 + _rgb_max*-2.00000003E-01;
    _TMP47 = min(1.00000000E+00, _rgb_max);
    _TMP302 = max(1.00000000E+00, _TMP47);
    _mask_colors = floor(3.09999990E+00);
    _TMP18 = fract(3.09999990E+00);
    _mask_dither = _TMP18*1.00000000E+01;
    _x0313 = (TEX0.xy*OutputSize*TextureSize)/InputSize;
    _mod_fac = floor(_x0313);
    _x0321 = _mod_fac.x/_mask_colors;
    _TMP31 = floor(_x0321);
    _TMP20 = _mod_fac.x - _mask_colors*_TMP31;
    _dot_no = int(_TMP20);
    _x0323 = _mod_fac.x/_mask_colors;
    _TMP21 = floor(_x0323);
    _x0327 = _TMP21/2.00000000E+00;
    _TMP31 = floor(_x0327);
    _TMP22 = _TMP21 - 2.00000000E+00*_TMP31;
    _x0329 = _mod_fac.y + _TMP22;
    _x0331 = _x0329/2.00000000E+00;
    _TMP31 = floor(_x0331);
    _TMP23 = _x0329 - 2.00000000E+00*_TMP31;
    _dither = int(_TMP23);
    if (_dot_no == 0) { 
        _t0335 = _mask_colors - 2.00000000E+00;
        _mask_weight = vec3( 1.39999998E+00, 1.39999998E+00, 1.39999998E+00) + _t0335*vec3( 0.00000000E+00, -5.99999964E-01, -5.99999964E-01);
    } else {
        if (_dot_no == 1) { 
            _t0337 = _mask_colors - 2.00000000E+00;
            _mask_weight = vec3( 8.00000012E-01, 8.00000012E-01, 8.00000012E-01) + _t0337*vec3( 0.00000000E+00, 5.99999964E-01, 0.00000000E+00);
        } else {
            _mask_weight = vec3( 8.00000012E-01, 8.00000012E-01, 1.39999998E+00);
        } 
    } 
    if (bool(_dither)) { 
        _mask_mul = 8.00000012E-01;
    } else {
        _mask_mul = 1.39999998E+00;
    } 
    _TMP24 = 1.00000000E+00 + _mask_dither*(_mask_mul - 1.00000000E+00);
    _mask_weight = _mask_weight*_TMP24;
    _TMP47 = min(1.00000000E+00, 4.00000000E+00);
    _TMP342 = max(0.00000000E+00, _TMP47);
    _mask_weight = vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00) + _TMP342*(_mask_weight - vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00));
    _col2 = _TMP288.xyz*_mask_weight;
    _pos0351 = _scan_pos - _sample_offset;
    _a0353 = _pos0351*2.00000000E+00*3.14159274E+00;
    _TMP48 = cos(_a0353);
    _x0355 = _TMP48*5.00000000E-01 + 5.00000000E-01;
    _TMP49 = pow(_x0355, _TMP302);
    _weight0351 = 1.00000000E+00 - _TMP49;
    _weight0351 = _weight0351*_scan_strength*2.00000000E+00 + (1.00000000E+00 - _scan_strength);
    _x0357 = _col2*_weight0351;
    _TMP56 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0357);
    _TMP358 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP56);
    _a0367 = _scan_pos*2.00000000E+00*3.14159274E+00;
    _TMP48 = cos(_a0367);
    _x0369 = _TMP48*5.00000000E-01 + 5.00000000E-01;
    _TMP49 = pow(_x0369, _TMP302);
    _weight0365 = 1.00000000E+00 - _TMP49;
    _weight0365 = _weight0365*_scan_strength*2.00000000E+00 + (1.00000000E+00 - _scan_strength);
    _x0371 = _col2*_weight0365;
    _TMP56 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0371);
    _TMP372 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP56);
    _col1 = _TMP358 + _TMP372;
    _pos0379 = _scan_pos + _sample_offset;
    _a0381 = _pos0379*2.00000000E+00*3.14159274E+00;
    _TMP48 = cos(_a0381);
    _x0383 = _TMP48*5.00000000E-01 + 5.00000000E-01;
    _TMP49 = pow(_x0383, _TMP302);
    _weight0379 = 1.00000000E+00 - _TMP49;
    _weight0379 = _weight0379*_scan_strength*2.00000000E+00 + (1.00000000E+00 - _scan_strength);
    _x0385 = _col2*_weight0379;
    _TMP56 = min(vec3( 1.00000000E+00, 1.00000000E+00, 1.00000000E+00), _x0385);
    _TMP386 = max(vec3( 0.00000000E+00, 0.00000000E+00, 0.00000000E+00), _TMP56);
    _col1 = _col1 + _TMP386;
    _col1 = _col1/3.00000000E+00;
    _col1 = _col1*vec3(_corner_weight0075, _corner_weight0075, _corner_weight0075);
    _col1 = _col1 + ((_TMP16.xyz*_mask_weight)*2.99999993E-02)*vec3(_corner_weight0075, _corner_weight0075, _corner_weight0075);
    _TMP50 = pow(_col1.x, 4.54545438E-01);
    _TMP51 = pow(_col1.y, 4.54545438E-01);
    _TMP52 = pow(_col1.z, 4.54545438E-01);
    _col1 = vec3(_TMP50, _TMP51, _TMP52);
    _ret_0 = vec4(_col1.x, _col1.y, _col1.z, 1.00000000E+00);
    FragColor = _ret_0;
    return;
} 
#endif
