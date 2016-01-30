#pragma parameter GRID_STRENGTH "LCD Grid Strength" 0.05 0.00 1.00 0.01
#ifdef PARAMETER_UNIFORM
uniform float GRID_STRENGTH;
#else
#define GRID_STRENGTH 0.05
#endif

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
COMPAT_VARYING     vec4 _col;
COMPAT_VARYING     float _frame_rotation;
COMPAT_VARYING     vec2 _texCoord_size;
struct input_dummy {
    vec2 _video_size;
    vec2 _texCoord_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
    vec2 _texture_size;
float _placeholder24;
};
struct output_dummy {
    vec4 _col;
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
    vec2 _otexCoord;
    _r0005 = VertexCoord.x*MVPMatrix[0];
    _r0005 = _r0005 + VertexCoord.y*MVPMatrix[1];
    _r0005 = _r0005 + VertexCoord.z*MVPMatrix[2];
    _r0005 = _r0005 + VertexCoord.w*MVPMatrix[3];
    _oPosition1 = _r0005;
    _otexCoord = TexCoord.xy;
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
COMPAT_VARYING     vec4 _col;
COMPAT_VARYING     float _frame_rotation;
COMPAT_VARYING     vec2 _texCoord_size;
struct input_dummy {
    vec2 _video_size;
    vec2 _texCoord_size;
    vec2 _output_dummy_size;
    float _frame_count;
    float _frame_direction;
    float _frame_rotation;
    vec2 _texture_size;
float _placeholder30;
};
struct output_dummy {
    vec4 _col;
};
float _TMP24;
float _TMP23;
float _TMP22;
float _TMP21;
vec2 _TMP25;
vec4 _TMP17;
vec4 _TMP16;
vec2 _TMP15;
vec4 _TMP14;
vec4 _TMP13;
vec2 _TMP12;
vec4 _TMP11;
vec4 _TMP10;
vec2 _TMP9;
vec4 _TMP8;
vec4 _TMP7;
vec2 _TMP6;
float _TMP5;
float _TMP4;
float _TMP3;
float _TMP20;
float _TMP19;
float _TMP26;
float _TMP2;
float _TMP1;
float _TMP0;
float _TMP18;
input_dummy _IN1;
float _x0030;
float _x0032;
float _x0034;
float _TMP35;
float _x0036;
float _TMP41;
float _x0042;
float _z20048;
float _z40048;
float _z80048;
float _z20050;
float _z40050;
float _z80050;
float _TMP53;
float _x0054;
float _TMP59;
float _x0060;
float _z20066;
float _z40066;
float _z80066;
float _z20068;
float _z40068;
float _z80068;
float _x0070;
float _TMP71;
float _x0072;
float _TMP77;
float _x0078;
float _z20084;
float _z40084;
float _z80084;
float _z20086;
float _z40086;
float _z80086;
float _x0088;
float _TMP89;
float _x0090;
float _TMP95;
float _x0096;
float _z20102;
float _z40102;
float _z80102;
float _z20104;
float _z40104;
float _z80104;
float _x0106;
float _TMP107;
float _x0108;
float _TMP113;
float _x0114;
float _z20120;
float _z40120;
float _z80120;
float _z20122;
float _z40122;
float _z80122;
float _x0124;
float _TMP125;
float _x0126;
float _TMP131;
float _x0132;
float _z20138;
float _z40138;
float _z80138;
float _z20140;
float _z40140;
float _z80140;
vec2 _x0142;
vec2 _c0144;
vec2 _x0156;
vec2 _c0158;
vec2 _x0170;
vec2 _c0172;
vec2 _x0184;
vec2 _c0186;
vec2 _x0198;
vec2 _TMP199;
vec2 _b0200;
vec2 _x0200;
vec2 _a0200;
vec2 _TMP205;
vec2 _b0206;
vec2 _x0206;
vec2 _a0206;
COMPAT_VARYING vec4 TEX0;
 
uniform sampler2D Texture;
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec2 _texelSize;
    vec2 _subtexelSize;
    vec2 _range;
    float _left;
    float _top;
    float _right;
    float _bottom;
    vec4 _lcol;
    vec4 _rcol;
    float _subpix;
    float _rsubpix;
    vec4 _topLeftColor;
    vec4 _bottomRightColor;
    vec4 _bottomLeftColor;
    vec4 _topRightColor;
    vec2 _border;
    float _totalArea;
    vec4 _averageColor;
    output_dummy _OUT;
    _texelSize = 1.00000000E+00/TextureSize;
    _subtexelSize = _texelSize/vec2( 3.00000000E+00, 1.00000000E+00);
    _range = InputSize/(OutputSize*TextureSize);
    _left = TEX0.x - _texelSize.x*5.00000000E-01;
    _top = TEX0.y + _range.y;
    _right = TEX0.x + _texelSize.x*5.00000000E-01;
    _bottom = TEX0.y - _range.y;
    _x0030 = TEX0.x/_subtexelSize.x + 1.50000000E+00;
    _x0032 = _x0030/3.00000000E+00;
    _TMP18 = floor(_x0032);
    _subpix = _x0030 - 3.00000000E+00*_TMP18;
    _rsubpix = _range.x/_subtexelSize.x;
    _x0034 = _subpix + 1.00000000E+00;
    _x0036 = (_x0034 - _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0036);
    _TMP35 = max(-1.00000000E+00, _TMP26);
    _x0042 = (_x0034 + _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0042);
    _TMP41 = max(-1.00000000E+00, _TMP26);
    _z20048 = _TMP41*_TMP41;
    _z40048 = _z20048*_z20048;
    _z80048 = _z40048*_z40048;
    _TMP19 = (((((_TMP41 - 6.66666687E-01*_TMP41*_z20048) - 2.00000003E-01*_TMP41*_z40048) + 5.71428597E-01*_TMP41*_z20048*_z40048) - 1.11111112E-01*_TMP41*_z80048) - 1.81818187E-01*_TMP41*_z20048*_z80048) + 7.69230798E-02*_TMP41*_z40048*_z80048;
    _z20050 = _TMP35*_TMP35;
    _z40050 = _z20050*_z20050;
    _z80050 = _z40050*_z40050;
    _TMP20 = (((((_TMP35 - 6.66666687E-01*_TMP35*_z20050) - 2.00000003E-01*_TMP35*_z40050) + 5.71428597E-01*_TMP35*_z20050*_z40050) - 1.11111112E-01*_TMP35*_z80050) - 1.81818187E-01*_TMP35*_z20050*_z80050) + 7.69230798E-02*_TMP35*_z40050*_z80050;
    _TMP0 = (1.50000000E+00*(_TMP19 - _TMP20))/(2.00000000E+00*_rsubpix);
    _x0054 = (_subpix - _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0054);
    _TMP53 = max(-1.00000000E+00, _TMP26);
    _x0060 = (_subpix + _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0060);
    _TMP59 = max(-1.00000000E+00, _TMP26);
    _z20066 = _TMP59*_TMP59;
    _z40066 = _z20066*_z20066;
    _z80066 = _z40066*_z40066;
    _TMP19 = (((((_TMP59 - 6.66666687E-01*_TMP59*_z20066) - 2.00000003E-01*_TMP59*_z40066) + 5.71428597E-01*_TMP59*_z20066*_z40066) - 1.11111112E-01*_TMP59*_z80066) - 1.81818187E-01*_TMP59*_z20066*_z80066) + 7.69230798E-02*_TMP59*_z40066*_z80066;
    _z20068 = _TMP53*_TMP53;
    _z40068 = _z20068*_z20068;
    _z80068 = _z40068*_z40068;
    _TMP20 = (((((_TMP53 - 6.66666687E-01*_TMP53*_z20068) - 2.00000003E-01*_TMP53*_z40068) + 5.71428597E-01*_TMP53*_z20068*_z40068) - 1.11111112E-01*_TMP53*_z80068) - 1.81818187E-01*_TMP53*_z20068*_z80068) + 7.69230798E-02*_TMP53*_z40068*_z80068;
    _TMP1 = (1.50000000E+00*(_TMP19 - _TMP20))/(2.00000000E+00*_rsubpix);
    _x0070 = _subpix - 1.00000000E+00;
    _x0072 = (_x0070 - _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0072);
    _TMP71 = max(-1.00000000E+00, _TMP26);
    _x0078 = (_x0070 + _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0078);
    _TMP77 = max(-1.00000000E+00, _TMP26);
    _z20084 = _TMP77*_TMP77;
    _z40084 = _z20084*_z20084;
    _z80084 = _z40084*_z40084;
    _TMP19 = (((((_TMP77 - 6.66666687E-01*_TMP77*_z20084) - 2.00000003E-01*_TMP77*_z40084) + 5.71428597E-01*_TMP77*_z20084*_z40084) - 1.11111112E-01*_TMP77*_z80084) - 1.81818187E-01*_TMP77*_z20084*_z80084) + 7.69230798E-02*_TMP77*_z40084*_z80084;
    _z20086 = _TMP71*_TMP71;
    _z40086 = _z20086*_z20086;
    _z80086 = _z40086*_z40086;
    _TMP20 = (((((_TMP71 - 6.66666687E-01*_TMP71*_z20086) - 2.00000003E-01*_TMP71*_z40086) + 5.71428597E-01*_TMP71*_z20086*_z40086) - 1.11111112E-01*_TMP71*_z80086) - 1.81818187E-01*_TMP71*_z20086*_z80086) + 7.69230798E-02*_TMP71*_z40086*_z80086;
    _TMP2 = (1.50000000E+00*(_TMP19 - _TMP20))/(2.00000000E+00*_rsubpix);
    _lcol = vec4(_TMP0, _TMP1, _TMP2, 0.00000000E+00);
    _x0088 = _subpix - 2.00000000E+00;
    _x0090 = (_x0088 - _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0090);
    _TMP89 = max(-1.00000000E+00, _TMP26);
    _x0096 = (_x0088 + _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0096);
    _TMP95 = max(-1.00000000E+00, _TMP26);
    _z20102 = _TMP95*_TMP95;
    _z40102 = _z20102*_z20102;
    _z80102 = _z40102*_z40102;
    _TMP19 = (((((_TMP95 - 6.66666687E-01*_TMP95*_z20102) - 2.00000003E-01*_TMP95*_z40102) + 5.71428597E-01*_TMP95*_z20102*_z40102) - 1.11111112E-01*_TMP95*_z80102) - 1.81818187E-01*_TMP95*_z20102*_z80102) + 7.69230798E-02*_TMP95*_z40102*_z80102;
    _z20104 = _TMP89*_TMP89;
    _z40104 = _z20104*_z20104;
    _z80104 = _z40104*_z40104;
    _TMP20 = (((((_TMP89 - 6.66666687E-01*_TMP89*_z20104) - 2.00000003E-01*_TMP89*_z40104) + 5.71428597E-01*_TMP89*_z20104*_z40104) - 1.11111112E-01*_TMP89*_z80104) - 1.81818187E-01*_TMP89*_z20104*_z80104) + 7.69230798E-02*_TMP89*_z40104*_z80104;
    _TMP3 = (1.50000000E+00*(_TMP19 - _TMP20))/(2.00000000E+00*_rsubpix);
    _x0106 = _subpix - 3.00000000E+00;
    _x0108 = (_x0106 - _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0108);
    _TMP107 = max(-1.00000000E+00, _TMP26);
    _x0114 = (_x0106 + _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0114);
    _TMP113 = max(-1.00000000E+00, _TMP26);
    _z20120 = _TMP113*_TMP113;
    _z40120 = _z20120*_z20120;
    _z80120 = _z40120*_z40120;
    _TMP19 = (((((_TMP113 - 6.66666687E-01*_TMP113*_z20120) - 2.00000003E-01*_TMP113*_z40120) + 5.71428597E-01*_TMP113*_z20120*_z40120) - 1.11111112E-01*_TMP113*_z80120) - 1.81818187E-01*_TMP113*_z20120*_z80120) + 7.69230798E-02*_TMP113*_z40120*_z80120;
    _z20122 = _TMP107*_TMP107;
    _z40122 = _z20122*_z20122;
    _z80122 = _z40122*_z40122;
    _TMP20 = (((((_TMP107 - 6.66666687E-01*_TMP107*_z20122) - 2.00000003E-01*_TMP107*_z40122) + 5.71428597E-01*_TMP107*_z20122*_z40122) - 1.11111112E-01*_TMP107*_z80122) - 1.81818187E-01*_TMP107*_z20122*_z80122) + 7.69230798E-02*_TMP107*_z40122*_z80122;
    _TMP4 = (1.50000000E+00*(_TMP19 - _TMP20))/(2.00000000E+00*_rsubpix);
    _x0124 = _subpix - 4.00000000E+00;
    _x0126 = (_x0124 - _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0126);
    _TMP125 = max(-1.00000000E+00, _TMP26);
    _x0132 = (_x0124 + _rsubpix)/1.50000000E+00;
    _TMP26 = min(1.00000000E+00, _x0132);
    _TMP131 = max(-1.00000000E+00, _TMP26);
    _z20138 = _TMP131*_TMP131;
    _z40138 = _z20138*_z20138;
    _z80138 = _z40138*_z40138;
    _TMP19 = (((((_TMP131 - 6.66666687E-01*_TMP131*_z20138) - 2.00000003E-01*_TMP131*_z40138) + 5.71428597E-01*_TMP131*_z20138*_z40138) - 1.11111112E-01*_TMP131*_z80138) - 1.81818187E-01*_TMP131*_z20138*_z80138) + 7.69230798E-02*_TMP131*_z40138*_z80138;
    _z20140 = _TMP125*_TMP125;
    _z40140 = _z20140*_z20140;
    _z80140 = _z40140*_z40140;
    _TMP20 = (((((_TMP125 - 6.66666687E-01*_TMP125*_z20140) - 2.00000003E-01*_TMP125*_z40140) + 5.71428597E-01*_TMP125*_z20140*_z40140) - 1.11111112E-01*_TMP125*_z80140) - 1.81818187E-01*_TMP125*_z20140*_z80140) + 7.69230798E-02*_TMP125*_z40140*_z80140;
    _TMP5 = (1.50000000E+00*(_TMP19 - _TMP20))/(2.00000000E+00*_rsubpix);
    _rcol = vec4(_TMP3, _TMP4, _TMP5, 0.00000000E+00);
    _x0142 = vec2(_left, _top)/_texelSize;
    _TMP6 = floor(_x0142);
    _c0144 = (_TMP6 + 5.00000000E-01)*_texelSize;
    _TMP7 = COMPAT_TEXTURE(Texture, _c0144);
    _TMP21 = pow(_TMP7.x, 2.20000005E+00);
    _TMP22 = pow(_TMP7.y, 2.20000005E+00);
    _TMP23 = pow(_TMP7.z, 2.20000005E+00);
    _TMP24 = pow(_TMP7.w, 2.20000005E+00);
    _TMP8 = vec4(_TMP21, _TMP22, _TMP23, _TMP24);
    _topLeftColor = _TMP8*_lcol;
    _x0156 = vec2(_right, _bottom)/_texelSize;
    _TMP9 = floor(_x0156);
    _c0158 = (_TMP9 + 5.00000000E-01)*_texelSize;
    _TMP10 = COMPAT_TEXTURE(Texture, _c0158);
    _TMP21 = pow(_TMP10.x, 2.20000005E+00);
    _TMP22 = pow(_TMP10.y, 2.20000005E+00);
    _TMP23 = pow(_TMP10.z, 2.20000005E+00);
    _TMP24 = pow(_TMP10.w, 2.20000005E+00);
    _TMP11 = vec4(_TMP21, _TMP22, _TMP23, _TMP24);
    _bottomRightColor = _TMP11*_rcol;
    _x0170 = vec2(_left, _bottom)/_texelSize;
    _TMP12 = floor(_x0170);
    _c0172 = (_TMP12 + 5.00000000E-01)*_texelSize;
    _TMP13 = COMPAT_TEXTURE(Texture, _c0172);
    _TMP21 = pow(_TMP13.x, 2.20000005E+00);
    _TMP22 = pow(_TMP13.y, 2.20000005E+00);
    _TMP23 = pow(_TMP13.z, 2.20000005E+00);
    _TMP24 = pow(_TMP13.w, 2.20000005E+00);
    _TMP14 = vec4(_TMP21, _TMP22, _TMP23, _TMP24);
    _bottomLeftColor = _TMP14*_lcol;
    _x0184 = vec2(_right, _top)/_texelSize;
    _TMP15 = floor(_x0184);
    _c0186 = (_TMP15 + 5.00000000E-01)*_texelSize;
    _TMP16 = COMPAT_TEXTURE(Texture, _c0186);
    _TMP21 = pow(_TMP16.x, 2.20000005E+00);
    _TMP22 = pow(_TMP16.y, 2.20000005E+00);
    _TMP23 = pow(_TMP16.z, 2.20000005E+00);
    _TMP24 = pow(_TMP16.w, 2.20000005E+00);
    _TMP17 = vec4(_TMP21, _TMP22, _TMP23, _TMP24);
    _topRightColor = _TMP17*_rcol;
    _x0198 = TEX0.xy/_subtexelSize + 5.00000000E-01;
    _border = floor(_x0198);
    _x0200 = (_border + vec2( 0.00000000E+00, GRID_STRENGTH))*_subtexelSize;
    _a0200 = vec2(_left, _bottom);
    _b0200 = vec2(_right, _top);
    _TMP25 = min(_b0200, _x0200);
    _TMP199 = max(_a0200, _TMP25);
    _x0206 = (_border + vec2( 0.00000000E+00, -GRID_STRENGTH))*_subtexelSize;
    _a0206 = vec2(_left, _bottom);
    _b0206 = vec2(_right, _top);
    _TMP25 = min(_b0206, _x0206);
    _TMP205 = max(_a0206, _TMP25);
    _totalArea = 2.00000000E+00*_range.y;
    _averageColor = ((_top - _TMP199.y)/_totalArea)*_topLeftColor;
    _averageColor = _averageColor + ((_TMP205.y - _bottom)/_totalArea)*_bottomRightColor;
    _averageColor = _averageColor + ((_TMP205.y - _bottom)/_totalArea)*_bottomLeftColor;
    _averageColor = _averageColor + ((_top - _TMP199.y)/_totalArea)*_topRightColor;
    _TMP21 = pow(_averageColor.x, 4.54545438E-01);
    _TMP22 = pow(_averageColor.y, 4.54545438E-01);
    _TMP23 = pow(_averageColor.z, 4.54545438E-01);
    _TMP24 = pow(_averageColor.w, 4.54545438E-01);
    _OUT._col = vec4(_TMP21, _TMP22, _TMP23, _TMP24);
    FragColor = _OUT._col;
    return;
} 
#endif
