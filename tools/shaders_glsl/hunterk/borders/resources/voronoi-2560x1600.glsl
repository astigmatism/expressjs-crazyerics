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
vec4 _oPosition1;
input_dummy _IN1;
vec4 _r0008;
COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 COLOR;
COMPAT_VARYING vec4 COL0;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 TEX0;
COMPAT_ATTRIBUTE vec4 LUTTexCoord;
COMPAT_VARYING vec4 TEX1;
 
uniform mat4 MVPMatrix;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec4 _oColor;
    vec2 _oTex;
    vec2 _otex_border;
    vec2 _scale;
    vec2 _middle;
    vec2 _diff;
    vec2 _dist;
    _r0008 = VertexCoord.x*MVPMatrix[0];
    _r0008 = _r0008 + VertexCoord.y*MVPMatrix[1];
    _r0008 = _r0008 + VertexCoord.z*MVPMatrix[2];
    _r0008 = _r0008 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0008;
    _oColor = COLOR;
    _scale = (OutputSize/vec2( 3.20000000E+02, 2.40000000E+02))/6.00000000E+00;
    _middle = (5.00000000E-01*InputSize)/TextureSize;
    _diff = TexCoord.xy - _middle;
    _oTex = _middle + _diff*_scale;
    _dist = LUTTexCoord.xy - vec2( 4.99989986E-01, 4.99989986E-01);
    _otex_border = vec2( 4.99989986E-01, 4.99989986E-01) + (_dist*OutputSize)/vec2( 2.56000000E+03, 1.60000000E+03);
    gl_Position = _r0008;
    COL0 = COLOR;
    TEX0.xy = _oTex;
    TEX1.xy = _otex_border;
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
vec4 _ret_0;
vec4 _TMP12;
float _TMP11;
float _TMP10;
float _TMP28;
float _TMP9;
float _TMP8;
float _TMP6;
float _TMP5;
vec3 _TMP16;
float _TMP27;
float _TMP26;
float _TMP25;
float _TMP14;
float _TMP24;
vec2 _TMP13;
float _TMP23;
float _TMP22;
vec2 _TMP21;
float _TMP20;
float _TMP19;
float _TMP4;
uniform sampler2D Texture;
uniform sampler2D bg;
input_dummy _IN1;
float _a0041;
vec2 _n0043;
vec2 _x0043;
vec2 _f0043;
vec4 _m0043;
int _j10043;
int _i10043;
vec2 _g10043;
vec2 _o10043;
float _d10043;
vec3 _col10043;
float _h10043;
vec2 _TMP48;
vec2 _p0049;
vec2 _x0061;
vec2 _x0063;
vec2 _a0069;
vec2 _a0071;
float _TMP72;
float _x0077;
vec3 _x0079;
float _x0087;
float _TMP90;
float _TMP96;
vec3 _TMP100;
float _TMP108;
float _a0113;
float _x0117;
float _TMP118;
float _a0125;
float _x0129;
float _TMP130;
COMPAT_VARYING vec4 TEX0;
COMPAT_VARYING vec4 TEX1;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec2 _p1;
    float _k;
    vec3 _col;
    vec4 _hexscape;
    vec4 _frame;
    vec4 _background;
    _p1 = (5.00000000E+02*(TEX0.xy*(TextureSize.xy/InputSize.xy)))/TextureSize.yy;
    _a0041 = 4.71232496E-02*float(FrameCount);
    _TMP4 = cos(_a0041);
    _k = 5.00000000E-01 - 5.00000000E-01*_TMP4;
    _x0043 = 6.00000000E+00*_p1;
    _n0043 = floor(_x0043);
    _f0043 = fract(_x0043);
    _m0043 = vec4( 8.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00);
    _j10043 = -1;
    for (; _j10043 <= 1; _j10043 = _j10043 + 1) { 
        _i10043 = -1;
        for (; _i10043 <= 1; _i10043 = _i10043 + 1) { 
            _g10043 = vec2(float(_i10043), float(_j10043));
            _p0049 = _n0043 + _g10043;
            _TMP19 = dot(_p0049, vec2( 1.27099998E+02, 3.11700012E+02));
            _TMP20 = dot(_p0049, vec2( 2.69500000E+02, 1.83300003E+02));
            _p0049 = vec2(_TMP19, _TMP20);
            _TMP22 = sin(_p0049.x);
            _TMP23 = sin(_p0049.y);
            _TMP21 = vec2(_TMP22, _TMP23);
            _x0061 = _TMP21*4.37585469E+04;
            _TMP48 = fract(_x0061);
            _x0063 = 9.99999978E-03*float(FrameCount) + 6.28310013E+00*_TMP48;
            _TMP22 = sin(_x0063.x);
            _TMP23 = sin(_x0063.y);
            _TMP13 = vec2(_TMP22, _TMP23);
            _o10043 = 5.00000000E-01 + 5.00000000E-01*_TMP13;
            _a0069 = (_g10043 - _f0043) + _o10043;
            _d10043 = length(_a0069);
            _a0071 = _n0043 + _g10043;
            _TMP14 = dot(_a0071, vec2( 7.00000000E+00, 1.13000000E+02));
            _TMP24 = sin(_TMP14);
            _x0077 = _TMP24*4.37585469E+04;
            _TMP72 = fract(_x0077);
            _x0079 = (_TMP72*2.50000000E+00 + 3.50000000E+00) + vec3( 2.00000000E+00, 3.00000000E+00, 0.00000000E+00);
            _TMP25 = sin(_x0079.x);
            _TMP26 = sin(_x0079.y);
            _TMP27 = sin(_x0079.z);
            _TMP16 = vec3(_TMP25, _TMP26, _TMP27);
            _col10043 = 5.00000000E-01 + 5.00000000E-01*_TMP16;
            _x0087 = 5.00000000E-01 + (5.00000000E-01*(_m0043.x - _d10043))/_k;
            _TMP28 = min(1.00000000E+00, _x0087);
            _TMP90 = max(0.00000000E+00, _TMP28);
            _h10043 = _TMP90*_TMP90*(3.00000000E+00 - 2.00000000E+00*_TMP90);
            _TMP96 = _m0043.x + _h10043*(_d10043 - _m0043.x);
            _m0043.x = _TMP96 - (_h10043*(1.00000000E+00 - _h10043)*_k)/(1.00000000E+00 + 3.00000000E+00*_k);
            _TMP100 = _m0043.yzw + _h10043*(_col10043 - _m0043.yzw);
            _m0043.yzw = _TMP100 - (_h10043*(1.00000000E+00 - _h10043)*_k)/(1.00000000E+00 + 3.00000000E+00*_k);
        } 
    } 
    _TMP5 = float((3.30000013E-01 >= _p1.y));
    _col = _m0043.yzw*(1.00000000E+00 - 8.00000012E-01*_m0043.x*_TMP5);
    _TMP6 = float((6.60000026E-01 >= _p1.y));
    _TMP108 = _m0043.x + _TMP6*(1.00000000E+00 - _m0043.x);
    _col = _col*_TMP108;
    _a0113 = _p1.y - 3.30000013E-01;
    _TMP8 = abs(_a0113);
    _x0117 = (_TMP8 - 4.99999989E-03)/2.00000033E-03;
    _TMP28 = min(1.00000000E+00, _x0117);
    _TMP118 = max(0.00000000E+00, _TMP28);
    _TMP9 = _TMP118*_TMP118*(3.00000000E+00 - 2.00000000E+00*_TMP118);
    _col = _col*_TMP9;
    _a0125 = _p1.y - 6.60000026E-01;
    _TMP10 = abs(_a0125);
    _x0129 = (_TMP10 - 4.99999989E-03)/2.00000033E-03;
    _TMP28 = min(1.00000000E+00, _x0129);
    _TMP130 = max(0.00000000E+00, _TMP28);
    _TMP11 = _TMP130*_TMP130*(3.00000000E+00 - 2.00000000E+00*_TMP130);
    _col = _col*_TMP11;
    _hexscape = vec4(_col.x, _col.y, _col.z, 1.00000000E+00);
    _frame = COMPAT_TEXTURE(Texture, TEX0.xy);
    _TMP12 = COMPAT_TEXTURE(bg, TEX1.xy);
    _background = vec4(_TMP12.x, _TMP12.y, _TMP12.z, _TMP12.w);
    _ret_0 = _frame + _background.w*(_hexscape - _frame);
    FragColor = _ret_0;
    return;
} 
#endif
