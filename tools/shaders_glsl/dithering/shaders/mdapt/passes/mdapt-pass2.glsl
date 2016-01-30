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
COMPAT_VARYING     vec2 VARt1;
COMPAT_VARYING     vec2 _texCoord1;
COMPAT_VARYING     vec4 _position1;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec4 _position1;
    vec2 _texCoord1;
    vec2 VARt1;
};
out_vertex _ret_0;
input_dummy _IN1;
vec4 _r0006;
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
    out_vertex _OUT;
    _r0006 = VertexCoord.x*MVPMatrix[0];
    _r0006 = _r0006 + VertexCoord.y*MVPMatrix[1];
    _r0006 = _r0006 + VertexCoord.z*MVPMatrix[2];
    _r0006 = _r0006 + VertexCoord.w*MVPMatrix[3];
    _OUT.VARt1 = 1.00000000E+00/TextureSize;
    _ret_0._position1 = _r0006;
    _ret_0._texCoord1 = TexCoord.xy;
    VARt1 = _OUT.VARt1;
    gl_Position = _r0006;
    TEX0.xy = TexCoord.xy;
    return;
    TEX0.xy = _ret_0._texCoord1;
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
COMPAT_VARYING     vec2 VARt1;
COMPAT_VARYING     vec2 _texCoord;
struct input_dummy {
    vec2 _video_size;
    vec2 _texture_size;
    vec2 _output_dummy_size;
};
struct out_vertex {
    vec2 _texCoord;
    vec2 VARt1;
};
vec4 _ret_0;
vec2 _TMP46;
vec2 _TMP44;
vec2 _TMP43;
vec4 _TMP42;
vec2 _TMP41;
vec2 _TMP40;
vec4 _TMP39;
vec2 _TMP38;
vec2 _TMP37;
vec4 _TMP36;
vec2 _TMP35;
vec2 _TMP34;
vec4 _TMP33;
vec2 _TMP32;
vec4 _TMP31;
vec2 _TMP30;
vec4 _TMP29;
vec2 _TMP28;
vec4 _TMP27;
vec2 _TMP26;
vec4 _TMP25;
vec2 _TMP24;
vec4 _TMP23;
vec2 _TMP22;
vec4 _TMP21;
vec2 _TMP20;
vec4 _TMP19;
vec2 _TMP18;
vec4 _TMP17;
vec2 _TMP16;
vec4 _TMP15;
vec2 _TMP14;
vec4 _TMP13;
vec2 _TMP12;
vec4 _TMP11;
vec2 _TMP10;
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
out_vertex _VAR1;
uniform sampler2D Texture;
vec2 _c0055;
vec2 _c0057;
vec2 _c0059;
vec2 _c0061;
vec2 _c0063;
vec2 _c0067;
vec2 _c0071;
vec2 _c0075;
vec2 _c0079;
vec2 _c0085;
vec2 _c0091;
vec2 _c0097;
vec2 _c0103;
vec2 _c0109;
vec2 _c0115;
vec2 _c0121;
vec2 _c0127;
vec2 _c0133;
vec2 _c0139;
vec2 _c0145;
vec2 _c0151;
vec2 _c0157;
vec2 _c0163;
vec2 _c0169;
vec2 _TMP174;
vec2 _x0179;
vec2 _TMP180;
COMPAT_VARYING vec4 TEX0;
 
uniform float FrameDirection;
uniform float FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
void main()
{
    vec2 _hits;
    vec2 _L2;
    vec2 _R2;
    vec2 _U2;
    vec2 _D2;
    vec2 _UL;
    vec2 _UR;
    vec2 _DL;
    vec2 _DR;
    vec2 _ULL;
    vec2 _URR;
    vec2 _DRR;
    vec2 _DLL;
    vec2 _UUL;
    vec2 _UUR;
    vec2 _DDR;
    vec2 _DDL;
    vec2 _TMP50;
    _TMP0 = COMPAT_TEXTURE(Texture, TEX0.xy);
    _c0055 = TEX0.xy + vec2( -1.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP1 = COMPAT_TEXTURE(Texture, _c0055);
    _c0057 = TEX0.xy + vec2( 1.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP2 = COMPAT_TEXTURE(Texture, _c0057);
    _c0059 = TEX0.xy + vec2( 0.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP3 = COMPAT_TEXTURE(Texture, _c0059);
    _c0061 = TEX0.xy + vec2( 0.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP4 = COMPAT_TEXTURE(Texture, _c0061);
    _c0063 = TEX0.xy + vec2( -2.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP5 = COMPAT_TEXTURE(Texture, _c0063);
    _L2 = min(_TMP5.xy, _TMP1.xy);
    _c0067 = TEX0.xy + vec2( 2.00000000E+00, 0.00000000E+00)*VARt1;
    _TMP6 = COMPAT_TEXTURE(Texture, _c0067);
    _R2 = min(_TMP6.xy, _TMP2.xy);
    _c0071 = TEX0.xy + vec2( 0.00000000E+00, -2.00000000E+00)*VARt1;
    _TMP7 = COMPAT_TEXTURE(Texture, _c0071);
    _U2 = min(_TMP7.xy, _TMP3.xy);
    _c0075 = TEX0.xy + vec2( 0.00000000E+00, 2.00000000E+00)*VARt1;
    _TMP8 = COMPAT_TEXTURE(Texture, _c0075);
    _D2 = min(_TMP8.xy, _TMP4.xy);
    _c0079 = TEX0.xy + -VARt1;
    _TMP9 = COMPAT_TEXTURE(Texture, _c0079);
    _TMP10 = max(_TMP1.xy, _TMP3.xy);
    _UL = min(_TMP9.xy, _TMP10);
    _c0085 = TEX0.xy + vec2( 1.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP11 = COMPAT_TEXTURE(Texture, _c0085);
    _TMP12 = max(_TMP2.xy, _TMP3.xy);
    _UR = min(_TMP11.xy, _TMP12);
    _c0091 = TEX0.xy + vec2( -1.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP13 = COMPAT_TEXTURE(Texture, _c0091);
    _TMP14 = max(_TMP1.xy, _TMP4.xy);
    _DL = min(_TMP13.xy, _TMP14);
    _c0097 = TEX0.xy + VARt1;
    _TMP15 = COMPAT_TEXTURE(Texture, _c0097);
    _TMP16 = max(_TMP2.xy, _TMP4.xy);
    _DR = min(_TMP15.xy, _TMP16);
    _c0103 = TEX0.xy + vec2( -2.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP17 = COMPAT_TEXTURE(Texture, _c0103);
    _TMP18 = max(_L2, _UL);
    _ULL = min(_TMP17.xy, _TMP18);
    _c0109 = TEX0.xy + vec2( 2.00000000E+00, -1.00000000E+00)*VARt1;
    _TMP19 = COMPAT_TEXTURE(Texture, _c0109);
    _TMP20 = max(_R2, _UR);
    _URR = min(_TMP19.xy, _TMP20);
    _c0115 = TEX0.xy + vec2( 2.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP21 = COMPAT_TEXTURE(Texture, _c0115);
    _TMP22 = max(_R2, _DR);
    _DRR = min(_TMP21.xy, _TMP22);
    _c0121 = TEX0.xy + vec2( -2.00000000E+00, 1.00000000E+00)*VARt1;
    _TMP23 = COMPAT_TEXTURE(Texture, _c0121);
    _TMP24 = max(_L2, _DL);
    _DLL = min(_TMP23.xy, _TMP24);
    _c0127 = TEX0.xy + vec2( -1.00000000E+00, -2.00000000E+00)*VARt1;
    _TMP25 = COMPAT_TEXTURE(Texture, _c0127);
    _TMP26 = max(_U2, _UL);
    _UUL = min(_TMP25.xy, _TMP26);
    _c0133 = TEX0.xy + vec2( 1.00000000E+00, -2.00000000E+00)*VARt1;
    _TMP27 = COMPAT_TEXTURE(Texture, _c0133);
    _TMP28 = max(_U2, _UR);
    _UUR = min(_TMP27.xy, _TMP28);
    _c0139 = TEX0.xy + vec2( 1.00000000E+00, 2.00000000E+00)*VARt1;
    _TMP29 = COMPAT_TEXTURE(Texture, _c0139);
    _TMP30 = max(_D2, _DR);
    _DDR = min(_TMP29.xy, _TMP30);
    _c0145 = TEX0.xy + vec2( -1.00000000E+00, 2.00000000E+00)*VARt1;
    _TMP31 = COMPAT_TEXTURE(Texture, _c0145);
    _TMP32 = max(_D2, _DL);
    _DDL = min(_TMP31.xy, _TMP32);
    _c0151 = TEX0.xy + vec2( -2.00000000E+00, -2.00000000E+00)*VARt1;
    _TMP33 = COMPAT_TEXTURE(Texture, _c0151);
    _TMP34 = max(_UUL, _ULL);
    _TMP35 = min(_TMP33.xy, _TMP34);
    _c0157 = TEX0.xy + vec2( 2.00000000E+00, -2.00000000E+00)*VARt1;
    _TMP36 = COMPAT_TEXTURE(Texture, _c0157);
    _TMP37 = max(_UUR, _URR);
    _TMP38 = min(_TMP36.xy, _TMP37);
    _hits = _TMP35 + _TMP38;
    _c0163 = TEX0.xy + vec2( -2.00000000E+00, 2.00000000E+00)*VARt1;
    _TMP39 = COMPAT_TEXTURE(Texture, _c0163);
    _TMP40 = max(_DDL, _DLL);
    _TMP41 = min(_TMP39.xy, _TMP40);
    _hits = _hits + _TMP41;
    _c0169 = TEX0.xy + vec2( 2.00000000E+00, 2.00000000E+00)*VARt1;
    _TMP42 = COMPAT_TEXTURE(Texture, _c0169);
    _TMP43 = max(_DDR, _DRR);
    _TMP44 = min(_TMP42.xy, _TMP43);
    _hits = _hits + _TMP44;
    _hits = _hits + _ULL + _URR + _DRR + _DLL + _L2 + _R2 + vec2( 0.00000000E+00, 1.00000000E+00)*(_TMP0.xy + _TMP3.xy + _U2 + _TMP4.xy + _D2 + _TMP1.xy + _TMP2.xy + _UL + _UR + _DL + _DR + _UUL + _UUR + _DDR + _DDL);
    _x0179 = (_hits - vec2( 1.25000000E+00, 5.25000000E+00))/vec2( 5.00000000E-01, 5.00000000E-01);
    _TMP46 = min(vec2( 1.00000000E+00, 1.00000000E+00), _x0179);
    _TMP180 = max(vec2( 0.00000000E+00, 0.00000000E+00), _TMP46);
    _TMP174 = _TMP180*_TMP180*(3.00000000E+00 - 2.00000000E+00*_TMP180);
    _TMP50 = _TMP0.xy*_TMP174;
    _ret_0 = vec4(_TMP50.x, _TMP50.y, _TMP0.x, _TMP0.y);
    FragColor = _ret_0;
    return;
} 
#endif
