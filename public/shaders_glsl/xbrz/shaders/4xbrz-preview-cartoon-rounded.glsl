/*
   Preview-only exaggerated Smoothed thumbnail shader for expressjs-crazyerics.

   The emulator still uses xbrz/4xbrz-linear.glslp. This shader is only used by
   the shader selection dialog preview.

   The previous preview exaggeration used broad weighted neighbor averaging. That
   made the option more distinct, but it could look smeared. This version keeps
   the same source framing while making a sharper, more graphic demonstration of
   the xBRZ idea: flat interiors stay untouched, high-contrast straight edges get
   a thin clean anti-aliased replacement, and high-contrast pixel corners get a
   larger rounded cut from nearby source colors. The output is intentionally more
   cartoony than the real runtime shader so the effect reads in a 300x300 tile.
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

#pragma parameter SMOOTHED_PREVIEW_CARTOON_ROUNDING "Smoothed preview cartoon edge rounding" 1.35 0.00 2.00 0.01
#ifdef PARAMETER_UNIFORM
uniform float SMOOTHED_PREVIEW_CARTOON_ROUNDING;
#else
#define SMOOTHED_PREVIEW_CARTOON_ROUNDING 1.35
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
    return 1.0 - smoothstep(0.08, 0.30, DistYCbCr(a, b));
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

vec3 PickClosestColor(vec3 reference, vec3 a, vec3 b, vec3 c)
{
    vec3 chosen = a;
    float best = DistYCbCr(reference, a);
    float current = DistYCbCr(reference, b);

    if (current < best) {
        chosen = b;
        best = current;
    }

    current = DistYCbCr(reference, c);

    if (current < best) {
        chosen = c;
    }

    return chosen;
}

vec3 CornerTarget(vec3 sideA, vec3 sideB, vec3 diagonal)
{
    vec3 reference = (sideA + sideB + diagonal) / 3.0;

    // Use an actual sampled color, not the average itself. This keeps the result
    // crisp and palette-like instead of muddy.
    return PickClosestColor(reference, sideA, sideB, diagonal);
}

void ConsiderCandidate(inout float bestMask, inout vec3 bestColor, float mask, vec3 color)
{
    if (mask > bestMask) {
        bestMask = mask;
        bestColor = color;
    }
}

float SharpenCoverage(float mask, float snapAmount)
{
    float hardMask = smoothstep(0.44, 0.56, mask);
    return mix(mask, hardMask, snapAmount);
}

void main()
{
    float rounding = clamp(SMOOTHED_PREVIEW_CARTOON_ROUNDING, 0.0, 2.0);
    float amount = Saturate(rounding / 1.50);

    // Stronger rounding now means wider geometric corner cuts and more binary
    // color selection, not a wider blur. The threshold stays conservative enough
    // to avoid washing low-contrast art and gradients.
    float threshold = mix(0.20, 0.085, amount);
    float softness = mix(0.085, 0.040, amount);
    float edgeWidth = mix(0.08, 0.285, amount);
    float cornerRadius = mix(0.42, 0.70, amount);
    float aaWidth = mix(0.060, 0.020, amount);
    float edgeBoost = mix(0.95, 1.25, amount);
    float cornerBoost = mix(1.05, 1.55, amount);
    float snapAmount = mix(0.45, 0.86, amount);

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

    float bestMask = 0.0;
    vec3 bestColor = C;

    // Thin straight-edge replacements. These keep edges clean instead of
    // averaging large bands of surrounding pixels.
    ConsiderCandidate(bestMask, bestColor, Saturate(eL * EdgeBand(f.x, edgeWidth, aaWidth) * edgeBoost), L);
    ConsiderCandidate(bestMask, bestColor, Saturate(eR * EdgeBand(1.0 - f.x, edgeWidth, aaWidth) * edgeBoost), R);
    ConsiderCandidate(bestMask, bestColor, Saturate(eU * EdgeBand(f.y, edgeWidth, aaWidth) * edgeBoost), U);
    ConsiderCandidate(bestMask, bestColor, Saturate(eD * EdgeBand(1.0 - f.y, edgeWidth, aaWidth) * edgeBoost), D);

    // Larger corner cuts are the main exaggerated preview cue. They are only
    // considered where the center pixel disagrees with both neighboring sides.
    // The target is snapped to an existing neighbor/diagonal color to avoid the
    // smeared multi-color look of broad weighted averages.
    float cULCoherence = max(SimilarAmount(L, U), 0.65 * EdgeAmount(C, UL, threshold, softness));
    float cURCoherence = max(SimilarAmount(R, U), 0.65 * EdgeAmount(C, UR, threshold, softness));
    float cDLCoherence = max(SimilarAmount(L, D), 0.65 * EdgeAmount(C, DL, threshold, softness));
    float cDRCoherence = max(SimilarAmount(R, D), 0.65 * EdgeAmount(C, DR, threshold, softness));

    float cUL = Saturate(min(eL, eU) * CornerBand(f, cornerRadius, aaWidth) * cornerBoost * max(0.58, cULCoherence));
    float cUR = Saturate(min(eR, eU) * CornerBand(vec2(1.0 - f.x, f.y), cornerRadius, aaWidth) * cornerBoost * max(0.58, cURCoherence));
    float cDL = Saturate(min(eL, eD) * CornerBand(vec2(f.x, 1.0 - f.y), cornerRadius, aaWidth) * cornerBoost * max(0.58, cDLCoherence));
    float cDR = Saturate(min(eR, eD) * CornerBand(vec2(1.0 - f.x, 1.0 - f.y), cornerRadius, aaWidth) * cornerBoost * max(0.58, cDRCoherence));

    ConsiderCandidate(bestMask, bestColor, cUL, CornerTarget(L, U, UL));
    ConsiderCandidate(bestMask, bestColor, cUR, CornerTarget(R, U, UR));
    ConsiderCandidate(bestMask, bestColor, cDL, CornerTarget(L, D, DL));
    ConsiderCandidate(bestMask, bestColor, cDR, CornerTarget(R, D, DR));

    float coverage = SharpenCoverage(Saturate(bestMask), snapAmount);
    vec3 res = mix(C, bestColor, coverage);

    FragColor = vec4(res, 1.0);
}
#endif
