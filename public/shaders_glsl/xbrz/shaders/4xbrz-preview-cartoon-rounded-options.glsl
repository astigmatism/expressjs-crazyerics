/*
   Preview-only exaggerated Smoothed thumbnail shader for expressjs-crazyerics.

   The emulator still uses xbrz/4xbrz-linear.glslp. This shader is only used by
   the shader selection dialog preview presets.

   This is intentionally more graphic than real xBRZ so the Smoothed option reads
   clearly in a 300x300 thumbnail. It does not blur the whole image, zoom, crop,
   or downsample/upscale. Instead, it keeps flat source-pixel interiors crisp and
   performs exaggerated geometric edge/corner replacement on high-contrast pixel
   boundaries. The replacement colors are sampled from existing neighboring
   source pixels so the result stays palette-like and crisp, while the transition
   boundary is anti-aliased enough to communicate rounded cartoon edges.
*/

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

#define Source Texture
#define vTexCoord TEX0.xy
#define SourceSize vec4(TextureSize, 1.0 / TextureSize)

#pragma parameter SMOOTHED_PREVIEW_CARTOON_ROUNDING "Smoothed preview cartoon edge rounding" 3.00 0.00 4.00 0.01
#ifdef PARAMETER_UNIFORM
uniform float SMOOTHED_PREVIEW_CARTOON_ROUNDING;
#else
#define SMOOTHED_PREVIEW_CARTOON_ROUNDING 3.00
#endif

float Saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

float DistYCbCr(vec3 pixA, vec3 pixB)
{
    const vec3 w = vec3(0.2627, 0.6780, 0.0593);
    const float scaleB = 0.5 / (1.0 - w.b);
    const float scaleR = 0.5 / (1.0 - w.r);
    vec3 diff = pixA - pixB;
    float Y = dot(diff, w);
    float Cb = scaleB * (diff.b - Y);
    float Cr = scaleR * (diff.r - Y);

    return sqrt((Y * Y) + (Cb * Cb) + (Cr * Cr));
}

float EdgeAmount(vec3 center, vec3 neighbor, float threshold, float softness)
{
    return smoothstep(threshold, threshold + softness, DistYCbCr(center, neighbor));
}

float SimilarAmount(vec3 a, vec3 b)
{
    return 1.0 - smoothstep(0.055, 0.24, DistYCbCr(a, b));
}

float EdgeBand(float distanceFromEdge, float width, float aaWidth)
{
    return 1.0 - smoothstep(max(0.0, width - aaWidth), width + aaWidth, distanceFromEdge);
}

float CornerBand(vec2 cornerDistance, float radius, float aaWidth)
{
    float distanceFromCorner = length(cornerDistance);
    return 1.0 - smoothstep(max(0.0, radius - aaWidth), radius + aaWidth, distanceFromCorner);
}

float DiagonalBand(vec2 p, float bias, float aaWidth)
{
    // Used to turn square pixel stair-steps into a crisp diagonal/cartoon cut.
    // This is geometric coverage, not a blurred neighborhood average.
    return 1.0 - smoothstep(bias - aaWidth, bias + aaWidth, p.x + p.y);
}

vec3 PickCloserColor(vec3 reference, vec3 currentChoice, vec3 candidate)
{
    if (DistYCbCr(reference, candidate) < DistYCbCr(reference, currentChoice)) {
        return candidate;
    }

    return currentChoice;
}

vec3 PickClosestColor4(vec3 reference, vec3 a, vec3 b, vec3 c, vec3 d)
{
    vec3 chosen = a;

    chosen = PickCloserColor(reference, chosen, b);
    chosen = PickCloserColor(reference, chosen, c);
    chosen = PickCloserColor(reference, chosen, d);

    return chosen;
}

vec3 CornerTarget(vec3 center, vec3 sideA, vec3 sideB, vec3 diagonal)
{
    float sidesAgree = SimilarAmount(sideA, sideB);
    vec3 sideReference = (sideA + sideB) * 0.5;
    vec3 diagonalReference = mix((sideReference + diagonal) / 2.0, diagonal, 0.65);
    vec3 reference = mix(diagonalReference, sideReference, sidesAgree);

    // Snap to an actual sampled source color. This avoids the muddy look of
    // broad weighted averages while still choosing the color most likely to
    // represent the neighboring rounded object.
    return PickClosestColor4(reference, sideA, sideB, diagonal, center);
}

void ConsiderCandidate(inout float bestMask, inout vec3 bestColor, float mask, vec3 color)
{
    if (mask > bestMask) {
        bestMask = mask;
        bestColor = color;
    }
}

float CrispCoverage(float mask, float snapAmount)
{
    float hardMask = smoothstep(0.48, 0.52, mask);
    return mix(mask, hardMask, snapAmount);
}

vec3 TinyAntialias(vec3 base, vec3 target, float coverage, float antialiasAmount)
{
    // At high exaggeration, most of the area becomes exact neighboring source
    // color. Only a very narrow boundary is allowed to blend, preserving a crisp
    // cartoon edge instead of a smeared surface.
    float hardCoverage = step(0.5, coverage);
    float aaCoverage = mix(coverage, hardCoverage, antialiasAmount);
    return mix(base, target, aaCoverage);
}

void main()
{
    float rounding = clamp(SMOOTHED_PREVIEW_CARTOON_ROUNDING, 0.0, 4.0);
    float amount = Saturate(rounding / 4.0);

    // Higher levels deliberately widen geometric rounded cuts and make edge
    // detection more eager. They do not increase any whole-image blur radius.
    float threshold = mix(0.18, 0.045, amount);
    float softness = mix(0.070, 0.018, amount);
    float edgeWidth = mix(0.080, 0.430, amount);
    float cornerRadius = mix(0.48, 1.02, amount);
    float diagonalBias = mix(0.58, 1.05, amount);
    float aaWidth = mix(0.060, 0.014, amount);
    float edgeBoost = mix(1.00, 1.65, amount);
    float cornerBoost = mix(1.10, 2.20, amount);
    float diagonalBoost = mix(0.85, 1.75, amount);
    float snapAmount = mix(0.55, 0.96, amount);
    float boundaryOnly = mix(0.45, 0.88, amount);

    vec2 texel = SourceSize.zw;
    vec2 pixelPosition = vTexCoord * SourceSize.xy;
    vec2 f = fract(pixelPosition);

    vec3 C  = COMPAT_TEXTURE(Source, vTexCoord).rgb;
    vec3 L  = COMPAT_TEXTURE(Source, vTexCoord + vec2(-texel.x, 0.0)).rgb;
    vec3 R  = COMPAT_TEXTURE(Source, vTexCoord + vec2( texel.x, 0.0)).rgb;
    vec3 U  = COMPAT_TEXTURE(Source, vTexCoord + vec2(0.0, -texel.y)).rgb;
    vec3 D  = COMPAT_TEXTURE(Source, vTexCoord + vec2(0.0,  texel.y)).rgb;
    vec3 UL = COMPAT_TEXTURE(Source, vTexCoord + vec2(-texel.x, -texel.y)).rgb;
    vec3 UR = COMPAT_TEXTURE(Source, vTexCoord + vec2( texel.x, -texel.y)).rgb;
    vec3 DL = COMPAT_TEXTURE(Source, vTexCoord + vec2(-texel.x,  texel.y)).rgb;
    vec3 DR = COMPAT_TEXTURE(Source, vTexCoord + vec2( texel.x,  texel.y)).rgb;

    float eL = EdgeAmount(C, L, threshold, softness);
    float eR = EdgeAmount(C, R, threshold, softness);
    float eU = EdgeAmount(C, U, threshold, softness);
    float eD = EdgeAmount(C, D, threshold, softness);
    float eUL = EdgeAmount(C, UL, threshold, softness);
    float eUR = EdgeAmount(C, UR, threshold, softness);
    float eDL = EdgeAmount(C, DL, threshold, softness);
    float eDR = EdgeAmount(C, DR, threshold, softness);

    float bestMask = 0.0;
    vec3 bestColor = C;

    // Crisp straight-edge widening. This gives high-contrast boundaries a clean
    // cartoon transition without averaging many unrelated neighboring pixels.
    ConsiderCandidate(bestMask, bestColor, Saturate(eL * EdgeBand(f.x, edgeWidth, aaWidth) * edgeBoost), L);
    ConsiderCandidate(bestMask, bestColor, Saturate(eR * EdgeBand(1.0 - f.x, edgeWidth, aaWidth) * edgeBoost), R);
    ConsiderCandidate(bestMask, bestColor, Saturate(eU * EdgeBand(f.y, edgeWidth, aaWidth) * edgeBoost), U);
    ConsiderCandidate(bestMask, bestColor, Saturate(eD * EdgeBand(1.0 - f.y, edgeWidth, aaWidth) * edgeBoost), D);

    // Large rounded corner cuts are the main thumbnail cue. These attack the
    // square corners produced by pixel art while staying crisp because the fill
    // color is snapped to one neighboring source color.
    float cULCoherence = max(SimilarAmount(L, U), 0.70 * eUL);
    float cURCoherence = max(SimilarAmount(R, U), 0.70 * eUR);
    float cDLCoherence = max(SimilarAmount(L, D), 0.70 * eDL);
    float cDRCoherence = max(SimilarAmount(R, D), 0.70 * eDR);

    float cUL = Saturate(min(eL, eU) * CornerBand(f, cornerRadius, aaWidth) * cornerBoost * max(0.62, cULCoherence));
    float cUR = Saturate(min(eR, eU) * CornerBand(vec2(1.0 - f.x, f.y), cornerRadius, aaWidth) * cornerBoost * max(0.62, cURCoherence));
    float cDL = Saturate(min(eL, eD) * CornerBand(vec2(f.x, 1.0 - f.y), cornerRadius, aaWidth) * cornerBoost * max(0.62, cDLCoherence));
    float cDR = Saturate(min(eR, eD) * CornerBand(vec2(1.0 - f.x, 1.0 - f.y), cornerRadius, aaWidth) * cornerBoost * max(0.62, cDRCoherence));

    ConsiderCandidate(bestMask, bestColor, cUL, CornerTarget(C, L, U, UL));
    ConsiderCandidate(bestMask, bestColor, cUR, CornerTarget(C, R, U, UR));
    ConsiderCandidate(bestMask, bestColor, cDL, CornerTarget(C, L, D, DL));
    ConsiderCandidate(bestMask, bestColor, cDR, CornerTarget(C, R, D, DR));

    // Extra stair-step cleanup for diagonal neighbor relationships. This is the
    // intentionally wilder part: at 3x/4x it converts obvious square stairsteps
    // into crisp diagonal/rounded joins, which is much more visible at 300x300.
    float dUL = Saturate(max(eUL, min(eL, eU)) * DiagonalBand(f, diagonalBias, aaWidth) * diagonalBoost * max(SimilarAmount(L, U), 0.45));
    float dUR = Saturate(max(eUR, min(eR, eU)) * DiagonalBand(vec2(1.0 - f.x, f.y), diagonalBias, aaWidth) * diagonalBoost * max(SimilarAmount(R, U), 0.45));
    float dDL = Saturate(max(eDL, min(eL, eD)) * DiagonalBand(vec2(f.x, 1.0 - f.y), diagonalBias, aaWidth) * diagonalBoost * max(SimilarAmount(L, D), 0.45));
    float dDR = Saturate(max(eDR, min(eR, eD)) * DiagonalBand(vec2(1.0 - f.x, 1.0 - f.y), diagonalBias, aaWidth) * diagonalBoost * max(SimilarAmount(R, D), 0.45));

    ConsiderCandidate(bestMask, bestColor, dUL, CornerTarget(C, L, U, UL));
    ConsiderCandidate(bestMask, bestColor, dUR, CornerTarget(C, R, U, UR));
    ConsiderCandidate(bestMask, bestColor, dDL, CornerTarget(C, L, D, DL));
    ConsiderCandidate(bestMask, bestColor, dDR, CornerTarget(C, R, D, DR));

    float coverage = CrispCoverage(Saturate(bestMask), snapAmount);
    vec3 result = TinyAntialias(C, bestColor, coverage, boundaryOnly);

    FragColor = vec4(result, 1.0);
}
#endif
