/*
   Preview-only detail-preserving Smoothed thumbnail shader for expressjs-crazyerics.

   This is intentionally not the runtime XBRZ shader. It is a 300x300 preview
   shader whose job is to demonstrate the visual intent of XBRZ-style smoothing:
   stair-step cleanup, softer diagonal/corner transitions, and anti-aliased pixel
   art edges. It avoids whole-image blur, posterization, palette flattening, and
   color remapping so title-screen detail remains readable.
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

#pragma parameter SMOOTHED_PREVIEW_EXAGGERATION "Smoothed preview exaggeration" 0.70 0.00 1.00 0.01
#ifdef PARAMETER_UNIFORM
uniform COMPAT_PRECISION float SMOOTHED_PREVIEW_EXAGGERATION;
#else
#define SMOOTHED_PREVIEW_EXAGGERATION 0.70
#endif

float Saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

float Luma(vec3 color)
{
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float ColorDistance(vec3 a, vec3 b)
{
    vec3 diff = a - b;
    float y = dot(diff, vec3(0.299, 0.587, 0.114));
    float co = diff.r - y;
    float cg = diff.g - y;
    float cb = diff.b - y;

    // Luma gets a little more weight so high-contrast pixel-art edges are found,
    // while chroma still protects colored title-screen artwork from gray smears.
    return sqrt((y * y * 1.65) + (co * co * 0.55) + (cg * cg * 0.30) + (cb * cb * 0.55));
}

float SimilarAmount(vec3 a, vec3 b)
{
    return 1.0 - smoothstep(0.045, 0.235, ColorDistance(a, b));
}

float EdgeAmount(vec3 a, vec3 b, float threshold, float softness)
{
    return smoothstep(threshold, threshold + softness, ColorDistance(a, b));
}

vec3 CornerTarget(vec3 sideA, vec3 sideB, vec3 diagonal)
{
    vec3 sideAverage = 0.5 * (sideA + sideB);
    float diagonalFits = max(SimilarAmount(diagonal, sideA), SimilarAmount(diagonal, sideB));

    // Mostly use a true anti-aliased edge color, but borrow a matching diagonal
    // source color when it clearly belongs to the same shape.
    return mix(sideAverage, diagonal, 0.30 * diagonalFits);
}

void ConsiderCandidate(inout float bestMask, inout vec3 bestColor, float mask, vec3 color)
{
    if (mask > bestMask) {
        bestMask = mask;
        bestColor = color;
    }
}

vec3 SampleSource(vec2 uv)
{
    return COMPAT_TEXTURE(Source, uv).rgb;
}

void main()
{
    float amount = Saturate(SMOOTHED_PREVIEW_EXAGGERATION);

    // The preset renders directly to 300x300. Offsets therefore represent visible
    // preview pixels, not arbitrary source texture pixels. This is what makes the
    // effect readable in the dialog without resorting to broad blur.
    vec2 previewTexel = 1.0 / max(OutputSize.xy, vec2(1.0));
    vec2 uv = vTexCoord;

    vec3 C  = SampleSource(uv);
    vec3 L  = SampleSource(uv + vec2(-previewTexel.x, 0.0));
    vec3 R  = SampleSource(uv + vec2( previewTexel.x, 0.0));
    vec3 U  = SampleSource(uv + vec2(0.0, -previewTexel.y));
    vec3 D  = SampleSource(uv + vec2(0.0,  previewTexel.y));
    vec3 UL = SampleSource(uv + vec2(-previewTexel.x, -previewTexel.y));
    vec3 UR = SampleSource(uv + vec2( previewTexel.x, -previewTexel.y));
    vec3 DL = SampleSource(uv + vec2(-previewTexel.x,  previewTexel.y));
    vec3 DR = SampleSource(uv + vec2( previewTexel.x,  previewTexel.y));

    float threshold = mix(0.235, 0.095, amount);
    float softness = mix(0.170, 0.070, amount);
    float cornerStrength = mix(0.0, 0.52, amount);
    float rimStrength = mix(0.0, 0.25, amount);
    float tangentStrength = mix(0.0, 0.20, amount);
    float restoreStrength = mix(0.72, 0.45, amount);

    float eL = EdgeAmount(C, L, threshold, softness);
    float eR = EdgeAmount(C, R, threshold, softness);
    float eU = EdgeAmount(C, U, threshold, softness);
    float eD = EdgeAmount(C, D, threshold, softness);

    // Protect isolated one-pixel details, logo texture, and tiny lettering. These
    // can have hard differences on all four sides and should not be rounded away.
    float isolated = min(min(eL, eR), min(eU, eD));
    float isolatedGuard = 1.0 - (0.68 * smoothstep(0.62, 1.0, isolated));

    float bestCornerMask = 0.0;
    vec3 bestCornerColor = C;

    float cULShape = max(SimilarAmount(L, U), 0.85 * SimilarAmount(UL, 0.5 * (L + U)));
    float cURShape = max(SimilarAmount(R, U), 0.85 * SimilarAmount(UR, 0.5 * (R + U)));
    float cDLShape = max(SimilarAmount(L, D), 0.85 * SimilarAmount(DL, 0.5 * (L + D)));
    float cDRShape = max(SimilarAmount(R, D), 0.85 * SimilarAmount(DR, 0.5 * (R + D)));

    ConsiderCandidate(bestCornerMask, bestCornerColor, min(eL, eU) * cULShape * isolatedGuard, CornerTarget(L, U, UL));
    ConsiderCandidate(bestCornerMask, bestCornerColor, min(eR, eU) * cURShape * isolatedGuard, CornerTarget(R, U, UR));
    ConsiderCandidate(bestCornerMask, bestCornerColor, min(eL, eD) * cDLShape * isolatedGuard, CornerTarget(L, D, DL));
    ConsiderCandidate(bestCornerMask, bestCornerColor, min(eR, eD) * cDRShape * isolatedGuard, CornerTarget(R, D, DR));

    // Edge-rim AA: add a narrow neighbor-colored transition only when the center
    // pixel belongs to a solid run on the opposite side. This reads as cleaned-up
    // edges rather than full-frame blur.
    float bestRimMask = 0.0;
    vec3 bestRimColor = C;

    ConsiderCandidate(bestRimMask, bestRimColor, eL * max(SimilarAmount(C, R), 0.35 * SimilarAmount(U, D)), L);
    ConsiderCandidate(bestRimMask, bestRimColor, eR * max(SimilarAmount(C, L), 0.35 * SimilarAmount(U, D)), R);
    ConsiderCandidate(bestRimMask, bestRimColor, eU * max(SimilarAmount(C, D), 0.35 * SimilarAmount(L, R)), U);
    ConsiderCandidate(bestRimMask, bestRimColor, eD * max(SimilarAmount(C, U), 0.35 * SimilarAmount(L, R)), D);

    float lumUL = Luma(UL);
    float lumU = Luma(U);
    float lumUR = Luma(UR);
    float lumL = Luma(L);
    float lumR = Luma(R);
    float lumDL = Luma(DL);
    float lumD = Luma(D);
    float lumDR = Luma(DR);

    float gx = (lumUR + 2.0 * lumR + lumDR) - (lumUL + 2.0 * lumL + lumDL);
    float gy = (lumDL + 2.0 * lumD + lumDR) - (lumUL + 2.0 * lumU + lumUR);
    float gradient = sqrt(gx * gx + gy * gy);
    float edgeStrength = smoothstep(0.055, 0.42, gradient);
    vec2 tangent = normalize(vec2(-gy, gx) + vec2(0.00031, 0.00017));

    vec3 alongA = SampleSource(uv + tangent * previewTexel * 0.80);
    vec3 alongB = SampleSource(uv - tangent * previewTexel * 0.80);
    vec3 alongEdge = 0.5 * (alongA + alongB);
    float alongSafe = 1.0 - smoothstep(0.100, 0.360, ColorDistance(C, alongEdge));

    vec3 result = C;
    float cornerBlend = Saturate(bestCornerMask) * cornerStrength;
    float rimBlend = Saturate(bestRimMask) * rimStrength * (1.0 - 0.45 * cornerBlend);
    float tangentBlend = edgeStrength * alongSafe * tangentStrength * isolatedGuard;

    result = mix(result, alongEdge, tangentBlend);
    result = mix(result, bestCornerColor, cornerBlend);
    result = mix(result, bestRimColor, rimBlend);

    // Detail anchor: after visible edge cleanup, pull isolated/complex detail back
    // toward the source color. This is the anti-Vaseline step.
    float complexDetail = smoothstep(0.45, 1.0, isolated) * restoreStrength;
    result = mix(result, C, complexDetail);

    // Tiny edge-local sharpening restores perceived crispness without changing
    // flat interiors or turning the shader into a sharpen filter.
    vec3 average4 = 0.25 * (L + R + U + D);
    result += (C - average4) * (0.045 * amount * edgeStrength * (1.0 - complexDetail));

    FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
#endif
