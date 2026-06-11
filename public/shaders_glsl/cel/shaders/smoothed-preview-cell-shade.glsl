/*
   Preview-only cell-shaded Smoothed thumbnail shader for expressjs-crazyerics.

   This shader is tuned for the 300x300 shader selection preview tile. The real
   Smoothed gameplay preset remains the configured emulator shader unless the
   application explicitly selects another gameplay preset.

   The effect combines small-radius edge-aware smoothing, posterized color bands,
   mild saturation/contrast shaping, and outline-style edge darkening. It is a
   deliberately stylized thumbnail effect rather than a full-resolution gameplay
   scaler.
*/

#pragma parameter SMOOTHED_PREVIEW_EXAGGERATION "Smoothed preview cell-shaded exaggeration" 0.55 0.00 1.00 0.01

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

COMPAT_ATTRIBUTE vec4 VertexCoord;
COMPAT_ATTRIBUTE vec4 COLOR;
COMPAT_ATTRIBUTE vec4 TexCoord;
COMPAT_VARYING vec4 COL0;
COMPAT_VARYING vec4 TEX0;

uniform mat4 MVPMatrix;
uniform COMPAT_PRECISION int FrameDirection;
uniform COMPAT_PRECISION int FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;

void main()
{
    gl_Position = MVPMatrix * VertexCoord;
    COL0 = COLOR;
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

uniform COMPAT_PRECISION int FrameDirection;
uniform COMPAT_PRECISION int FrameCount;
uniform COMPAT_PRECISION vec2 OutputSize;
uniform COMPAT_PRECISION vec2 TextureSize;
uniform COMPAT_PRECISION vec2 InputSize;
uniform sampler2D Texture;
COMPAT_VARYING vec4 TEX0;

#ifdef PARAMETER_UNIFORM
uniform float SMOOTHED_PREVIEW_EXAGGERATION;
#else
#define SMOOTHED_PREVIEW_EXAGGERATION 0.55
#endif

#define Source Texture
#define vTexCoord TEX0.xy
#define SourceSize vec4(TextureSize, 1.0 / TextureSize)

float Saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

vec3 Saturate(vec3 value)
{
    return clamp(value, vec3(0.0), vec3(1.0));
}

float Luma(vec3 color)
{
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float ColorDistance(vec3 a, vec3 b)
{
    vec3 diff = a - b;
    float y = dot(diff, vec3(0.299, 0.587, 0.114));
    vec2 chroma = vec2(diff.r - y, diff.b - y);
    return sqrt((y * y * 1.35) + dot(chroma, chroma));
}

float BilateralWeight(vec3 center, vec3 sampleColor, float amount, float spatialWeight)
{
    float colorWindow = mix(0.10, 0.42, amount);
    float colorWeight = 1.0 - smoothstep(colorWindow, colorWindow * 2.20, ColorDistance(center, sampleColor));

    // High exaggeration is intentionally more willing to smooth through small
    // color changes; the outline pass then redraws the important boundaries.
    colorWeight = mix(colorWeight, sqrt(max(colorWeight, 0.0)), amount * 0.45);

    return spatialWeight * max(colorWeight, 0.001);
}

vec3 Posterize(vec3 color, float levels)
{
    levels = max(levels, 2.0);
    return floor(Saturate(color) * levels + 0.5) / levels;
}

vec3 AdjustSaturation(vec3 color, float saturation)
{
    float gray = Luma(color);
    return mix(vec3(gray), color, saturation);
}

vec3 AdjustContrast(vec3 color, float contrast)
{
    return (color - 0.5) * contrast + 0.5;
}

vec3 CellShade(vec3 color, float amount)
{
    float luma = max(Luma(color), 0.001);
    float shadeLevels = mix(32.0, 4.0, pow(amount, 0.82));
    float bandedLuma = floor(luma * shadeLevels + 0.5) / shadeLevels;
    vec3 shaded = color * (bandedLuma / luma);
    float channelLevels = mix(36.0, 5.0, pow(amount, 0.92));

    shaded = Posterize(shaded, channelLevels);
    shaded = AdjustSaturation(shaded, mix(1.0, 1.32, amount));
    shaded = AdjustContrast(shaded, mix(1.0, 1.16, amount));

    return Saturate(shaded);
}

void main()
{
    float amount = Saturate(SMOOTHED_PREVIEW_EXAGGERATION);
    vec2 texel = SourceSize.zw;
    float radius = mix(0.85, 2.35, amount);
    vec2 stepTexel = texel * radius;

    vec3 c  = COMPAT_TEXTURE(Source, vTexCoord).rgb;
    vec3 l  = COMPAT_TEXTURE(Source, vTexCoord + vec2(-stepTexel.x, 0.0)).rgb;
    vec3 r  = COMPAT_TEXTURE(Source, vTexCoord + vec2( stepTexel.x, 0.0)).rgb;
    vec3 u  = COMPAT_TEXTURE(Source, vTexCoord + vec2(0.0, -stepTexel.y)).rgb;
    vec3 d  = COMPAT_TEXTURE(Source, vTexCoord + vec2(0.0,  stepTexel.y)).rgb;
    vec3 ul = COMPAT_TEXTURE(Source, vTexCoord + vec2(-stepTexel.x, -stepTexel.y)).rgb;
    vec3 ur = COMPAT_TEXTURE(Source, vTexCoord + vec2( stepTexel.x, -stepTexel.y)).rgb;
    vec3 dl = COMPAT_TEXTURE(Source, vTexCoord + vec2(-stepTexel.x,  stepTexel.y)).rgb;
    vec3 dr = COMPAT_TEXTURE(Source, vTexCoord + vec2( stepTexel.x,  stepTexel.y)).rgb;

    float centerWeight = mix(1.20, 0.36, amount);
    float wl = BilateralWeight(c, l, amount, 0.68);
    float wr = BilateralWeight(c, r, amount, 0.68);
    float wu = BilateralWeight(c, u, amount, 0.68);
    float wd = BilateralWeight(c, d, amount, 0.68);
    float wul = BilateralWeight(c, ul, amount, 0.38);
    float wur = BilateralWeight(c, ur, amount, 0.38);
    float wdl = BilateralWeight(c, dl, amount, 0.38);
    float wdr = BilateralWeight(c, dr, amount, 0.38);
    float weightSum = centerWeight + wl + wr + wu + wd + wul + wur + wdl + wdr;

    vec3 smoothed = (c * centerWeight + l * wl + r * wr + u * wu + d * wd + ul * wul + ur * wur + dl * wdl + dr * wdr) / weightSum;
    vec3 softColor = mix(c, smoothed, amount * mix(0.58, 0.92, amount));
    vec3 cellColor = CellShade(softColor, amount);
    vec3 result = mix(softColor, cellColor, amount * mix(0.68, 0.96, amount));

    float edgeHorizontal = ColorDistance(l, r);
    float edgeVertical = ColorDistance(u, d);
    float edgeDiagonalA = ColorDistance(ul, dr);
    float edgeDiagonalB = ColorDistance(ur, dl);
    float centerEdge = max(max(ColorDistance(c, l), ColorDistance(c, r)), max(ColorDistance(c, u), ColorDistance(c, d)));
    float edgeStrength = max(max(edgeHorizontal, edgeVertical), max(edgeDiagonalA, edgeDiagonalB));
    edgeStrength = max(edgeStrength, centerEdge * 0.92);

    float edgeThreshold = mix(0.32, 0.050, amount);
    float edgeSoftness = mix(0.18, 0.052, amount);
    float edgeMask = smoothstep(edgeThreshold, edgeThreshold + edgeSoftness, edgeStrength);
    float outlineStrength = amount * mix(0.16, 0.62, amount);

    // Darken edges after flattening so the thumbnail reads as cell-shaded rather
    // than merely blurred. At amount 0.0 this term is exactly disabled.
    result *= 1.0 - edgeMask * outlineStrength;

    // A tiny high-exaggeration ink tint keeps black outlines from looking gray.
    result = mix(result, result * result, edgeMask * amount * 0.22);

    FragColor = vec4(Saturate(result), 1.0);
}
#endif
