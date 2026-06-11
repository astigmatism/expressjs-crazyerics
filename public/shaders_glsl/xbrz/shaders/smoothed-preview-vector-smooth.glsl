/*
   Preview-only vector/shape smoothing thumbnail shader for expressjs-crazyerics.

   This shader is deliberately not the runtime emulator shader. The Smoothed
   gameplay path remains xbrz/4xbrz-linear.glslp. This shader exists to make the
   300x300 shader selection preview communicate the intent of xBRZ-style pixel
   smoothing: square pixel edges become rounded, diagonals become less jagged,
   and similar-color regions become a little softer.

   Unlike the more aggressive cell/cel-shaded preview experiments, this shader
   avoids posterization and intentional color remapping. It samples only the
   title-screen texture and preserves source colors by blending or snapping to
   nearby sampled colors.
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

#pragma parameter SMOOTHED_PREVIEW_EXAGGERATION "Smoothed preview exaggeration" 0.64 0.00 1.00 0.01
#ifdef PARAMETER_UNIFORM
uniform float SMOOTHED_PREVIEW_EXAGGERATION;
#else
#define SMOOTHED_PREVIEW_EXAGGERATION 0.64
#endif

float Saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

float DistYCbCr(vec3 pixA, vec3 pixB)
{
    // Same general color-distance family used by xBR/xBRZ-style shaders. It is
    // more useful for edge decisions than raw RGB distance because luma changes
    // matter most to perceived pixel-art edges.
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

float SimilarAmount(vec3 a, vec3 b, float nearDistance, float farDistance)
{
    return 1.0 - smoothstep(nearDistance, farDistance, DistYCbCr(a, b));
}

float EdgeBand(float distanceFromEdge, float width, float feather)
{
    return 1.0 - smoothstep(max(0.0, width - feather), width + feather, distanceFromEdge);
}

float CornerBand(vec2 cornerDistance, float radius, float feather)
{
    float distanceFromCorner = length(cornerDistance);
    return 1.0 - smoothstep(max(0.0, radius - feather), radius + feather, distanceFromCorner);
}

float DiagonalBand(vec2 cornerDistance, float bias, float feather)
{
    // Turns obvious square stair steps into a softer diagonal/rounded join.
    return 1.0 - smoothstep(bias - feather, bias + feather, cornerDistance.x + cornerDistance.y);
}

vec3 SampleCell(vec2 cell, vec2 virtualSize)
{
    vec2 safeCell = clamp(cell, vec2(0.0), max(virtualSize - vec2(1.0), vec2(0.0)));
    vec2 uv = (safeCell + vec2(0.5)) / virtualSize;
    return COMPAT_TEXTURE(Source, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
}

vec3 PickCloserColor(vec3 reference, vec3 currentChoice, vec3 candidate)
{
    if (DistYCbCr(reference, candidate) < DistYCbCr(reference, currentChoice)) {
        return candidate;
    }

    return currentChoice;
}

vec3 PickClosestColor5(vec3 reference, vec3 a, vec3 b, vec3 c, vec3 d, vec3 e)
{
    vec3 chosen = a;

    chosen = PickCloserColor(reference, chosen, b);
    chosen = PickCloserColor(reference, chosen, c);
    chosen = PickCloserColor(reference, chosen, d);
    chosen = PickCloserColor(reference, chosen, e);

    return chosen;
}

vec3 CornerTarget(vec3 center, vec3 sideA, vec3 sideB, vec3 diagonal, float palettePull)
{
    vec3 averageColor = (sideA + sideB + diagonal) / 3.0;
    vec3 reference = mix(averageColor, diagonal, 0.35);
    vec3 snappedColor = PickClosestColor5(reference, center, sideA, sideB, diagonal, averageColor);

    // Keep the color close to real neighboring samples. A little average color is
    // allowed so the transition reads as smoothing rather than hard replacement.
    return mix(averageColor, snappedColor, palettePull);
}

void AddShapeCandidate(inout vec3 sum, inout float weight, float mask, vec3 color)
{
    float m = Saturate(mask);
    sum += color * m;
    weight += m;
}

void AddBilateralCandidate(inout vec3 sum, inout float weight, vec3 center, vec3 sampleColor, float spatialWeight, float nearDistance, float farDistance)
{
    float similarity = SimilarAmount(center, sampleColor, nearDistance, farDistance);
    float candidateWeight = spatialWeight * similarity;

    sum += sampleColor * candidateWeight;
    weight += candidateWeight;
}

void main()
{
    vec4 originalSample = COMPAT_TEXTURE(Source, vTexCoord);
    vec3 original = originalSample.rgb;

    float amount = Saturate(SMOOTHED_PREVIEW_EXAGGERATION);

    // Treat the title image as a slightly coarser demonstration pixel grid.
    // This is the key preview-only step: real xBRZ/SABR can be too subtle on a
    // 300x300 title screen, so the preview gives the smoothing algorithm larger
    // visible pixel shapes to round and blend.
    float demoPixelSize = 1.0 + (2.75 * pow(amount, 0.85));
    vec2 virtualSize = max(vec2(1.0), floor(SourceSize.xy / demoPixelSize));
    vec2 virtualPosition = vTexCoord * virtualSize;
    vec2 cell = clamp(floor(virtualPosition), vec2(0.0), max(virtualSize - vec2(1.0), vec2(0.0)));
    vec2 f = fract(virtualPosition);

    vec3 C  = SampleCell(cell, virtualSize);
    vec3 L  = SampleCell(cell + vec2(-1.0,  0.0), virtualSize);
    vec3 R  = SampleCell(cell + vec2( 1.0,  0.0), virtualSize);
    vec3 U  = SampleCell(cell + vec2( 0.0, -1.0), virtualSize);
    vec3 D  = SampleCell(cell + vec2( 0.0,  1.0), virtualSize);
    vec3 UL = SampleCell(cell + vec2(-1.0, -1.0), virtualSize);
    vec3 UR = SampleCell(cell + vec2( 1.0, -1.0), virtualSize);
    vec3 DL = SampleCell(cell + vec2(-1.0,  1.0), virtualSize);
    vec3 DR = SampleCell(cell + vec2( 1.0,  1.0), virtualSize);

    float threshold = mix(0.22, 0.052, amount);
    float softness = mix(0.110, 0.030, amount);
    float similarNear = mix(0.035, 0.075, amount);
    float similarFar = mix(0.165, 0.360, amount);

    float eL = EdgeAmount(C, L, threshold, softness);
    float eR = EdgeAmount(C, R, threshold, softness);
    float eU = EdgeAmount(C, U, threshold, softness);
    float eD = EdgeAmount(C, D, threshold, softness);
    float eUL = EdgeAmount(C, UL, threshold, softness);
    float eUR = EdgeAmount(C, UR, threshold, softness);
    float eDL = EdgeAmount(C, DL, threshold, softness);
    float eDR = EdgeAmount(C, DR, threshold, softness);

    float edgeWidth = mix(0.030, 0.430, amount);
    float cornerRadius = mix(0.080, 0.940, amount);
    float diagonalBias = mix(0.540, 1.030, amount);
    float feather = mix(0.030, 0.155, amount);
    float edgeBoost = mix(0.55, 1.35, amount);
    float cornerBoost = mix(0.70, 1.85, amount);
    float diagonalBoost = mix(0.45, 1.55, amount);
    float palettePull = mix(0.82, 0.58, amount);

    vec3 shapeSum = C * 0.45;
    float shapeWeight = 0.45;

    // Straight boundary softening. This visibly reduces blocky vertical and
    // horizontal pixel edges without washing out the entire title image.
    AddShapeCandidate(shapeSum, shapeWeight, eL * EdgeBand(f.x, edgeWidth, feather) * edgeBoost, L);
    AddShapeCandidate(shapeSum, shapeWeight, eR * EdgeBand(1.0 - f.x, edgeWidth, feather) * edgeBoost, R);
    AddShapeCandidate(shapeSum, shapeWeight, eU * EdgeBand(f.y, edgeWidth, feather) * edgeBoost, U);
    AddShapeCandidate(shapeSum, shapeWeight, eD * EdgeBand(1.0 - f.y, edgeWidth, feather) * edgeBoost, D);

    // Rounded corner replacements are the main visible xBRZ-intent cue. They
    // make square pixel stair steps read as smoother curves in the thumbnail.
    float cULCoherence = max(SimilarAmount(L, U, similarNear, similarFar), 0.55 * eUL);
    float cURCoherence = max(SimilarAmount(R, U, similarNear, similarFar), 0.55 * eUR);
    float cDLCoherence = max(SimilarAmount(L, D, similarNear, similarFar), 0.55 * eDL);
    float cDRCoherence = max(SimilarAmount(R, D, similarNear, similarFar), 0.55 * eDR);

    float cUL = min(eL, eU) * CornerBand(f, cornerRadius, feather) * cornerBoost * max(0.45, cULCoherence);
    float cUR = min(eR, eU) * CornerBand(vec2(1.0 - f.x, f.y), cornerRadius, feather) * cornerBoost * max(0.45, cURCoherence);
    float cDL = min(eL, eD) * CornerBand(vec2(f.x, 1.0 - f.y), cornerRadius, feather) * cornerBoost * max(0.45, cDLCoherence);
    float cDR = min(eR, eD) * CornerBand(vec2(1.0 - f.x, 1.0 - f.y), cornerRadius, feather) * cornerBoost * max(0.45, cDRCoherence);

    AddShapeCandidate(shapeSum, shapeWeight, cUL, CornerTarget(C, L, U, UL, palettePull));
    AddShapeCandidate(shapeSum, shapeWeight, cUR, CornerTarget(C, R, U, UR, palettePull));
    AddShapeCandidate(shapeSum, shapeWeight, cDL, CornerTarget(C, L, D, DL, palettePull));
    AddShapeCandidate(shapeSum, shapeWeight, cDR, CornerTarget(C, R, D, DR, palettePull));

    // Extra diagonal stair-step cleanup. This remains color-preserving because
    // the chosen colors come from nearby title-screen samples.
    float dUL = max(eUL, min(eL, eU)) * DiagonalBand(f, diagonalBias, feather) * diagonalBoost * max(SimilarAmount(L, U, similarNear, similarFar), 0.32);
    float dUR = max(eUR, min(eR, eU)) * DiagonalBand(vec2(1.0 - f.x, f.y), diagonalBias, feather) * diagonalBoost * max(SimilarAmount(R, U, similarNear, similarFar), 0.32);
    float dDL = max(eDL, min(eL, eD)) * DiagonalBand(vec2(f.x, 1.0 - f.y), diagonalBias, feather) * diagonalBoost * max(SimilarAmount(L, D, similarNear, similarFar), 0.32);
    float dDR = max(eDR, min(eR, eD)) * DiagonalBand(vec2(1.0 - f.x, 1.0 - f.y), diagonalBias, feather) * diagonalBoost * max(SimilarAmount(R, D, similarNear, similarFar), 0.32);

    AddShapeCandidate(shapeSum, shapeWeight, dUL, CornerTarget(C, L, U, UL, palettePull));
    AddShapeCandidate(shapeSum, shapeWeight, dUR, CornerTarget(C, R, U, UR, palettePull));
    AddShapeCandidate(shapeSum, shapeWeight, dDL, CornerTarget(C, L, D, DL, palettePull));
    AddShapeCandidate(shapeSum, shapeWeight, dDR, CornerTarget(C, R, D, DR, palettePull));

    float shapeCoverage = Saturate((shapeWeight - 0.45) * mix(0.50, 0.92, amount));
    vec3 shapeColor = shapeSum / max(shapeWeight, 0.0001);
    vec3 rounded = mix(C, shapeColor, shapeCoverage);

    // Mild bilateral smoothing inside similar-color regions. This helps the
    // preview read as "smoothed" rather than merely "rounded corners", while the
    // similarity gate avoids mushy whole-image blur across hard pixel-art edges.
    vec3 smoothSum = C * 1.35;
    float smoothWeight = 1.35;

    AddBilateralCandidate(smoothSum, smoothWeight, C, L, 0.68, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, R, 0.68, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, U, 0.68, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, D, 0.68, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, UL, 0.35, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, UR, 0.35, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, DL, 0.35, similarNear, similarFar);
    AddBilateralCandidate(smoothSum, smoothWeight, C, DR, 0.35, similarNear, similarFar);

    vec3 regionSmooth = smoothSum / max(smoothWeight, 0.0001);
    float regionSmoothAmount = mix(0.00, 0.30, amount) * (1.0 - (shapeCoverage * 0.38));
    vec3 stylized = mix(rounded, regionSmooth, regionSmoothAmount);

    // Keep some direct source detail in the final preview. At zero, this makes
    // the shader essentially unchanged; at the default it is still bold enough
    // to differ clearly from Pixel Perfect in a 300x300 tile.
    float finalStrength = smoothstep(0.02, 0.88, amount);
    vec3 result = mix(original, stylized, finalStrength);

    FragColor = vec4(result, originalSample.a);
}
#endif
