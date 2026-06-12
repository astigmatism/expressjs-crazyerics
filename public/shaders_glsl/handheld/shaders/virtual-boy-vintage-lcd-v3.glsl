/*
    Virtual Boy Vintage LCD v3

    A resource-free LCD/dot-matrix shader tuned for Nintendo Virtual Boy's
    red-on-black image. This pass intentionally keeps the v4 visual idea:
    source pixels are sampled at their centers and then darkened around the
    pixel aperture, giving the image a dimmer separated-pixel LCD texture.

    The preset applies this shader at a fixed source-relative scale and then
    uses RetroArch's stock pass to scale to the final viewport. That follows
    the same stable pattern used by working handheld presets in this shader
    library: do the LCD effect in a source-sized intermediate pass, then let a
    simple final pass handle browser fullscreen/windowed scaling.

    The fullscreen smear in the previous single-pass version came from sampling
    beyond RetroArch's active input rectangle when TextureSize was larger than
    InputSize. This shader blacks out coordinates outside InputSize/TextureSize
    before any edge-clamped texel can be repeated across the screen.
*/

#pragma parameter VB_LCD_GRID_STRENGTH "VB LCD Grid Strength" 0.34 0.0 0.8 0.01
#pragma parameter VB_LCD_EDGE_WIDTH "VB LCD Edge Width" 0.30 0.05 0.50 0.01
#pragma parameter VB_LCD_DOT_STRENGTH "VB LCD Dot Strength" 0.10 0.0 0.5 0.01
#pragma parameter VB_LCD_SCANLINE_STRENGTH "VB LCD Scanline Strength" 0.10 0.0 0.5 0.01
#pragma parameter VB_LCD_RED_GAIN "VB LCD Red Gain" 0.04 0.0 0.3 0.01

#if defined(VERTEX)

#if __VERSION__ >= 130
#define COMPAT_VARYING out
#define COMPAT_ATTRIBUTE in
#else
#define COMPAT_VARYING varying
#define COMPAT_ATTRIBUTE attribute
#endif

#ifdef GL_ES
#define COMPAT_PRECISION highp
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
    TEX0 = TexCoord;
}

#elif defined(FRAGMENT)

#if __VERSION__ >= 130
#define COMPAT_VARYING in
#define COMPAT_TEXTURE texture
out vec4 FragColor;
#else
#define COMPAT_VARYING varying
#define COMPAT_TEXTURE texture2D
#define FragColor gl_FragColor
#endif

#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define COMPAT_PRECISION highp
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
uniform COMPAT_PRECISION float VB_LCD_GRID_STRENGTH;
uniform COMPAT_PRECISION float VB_LCD_EDGE_WIDTH;
uniform COMPAT_PRECISION float VB_LCD_DOT_STRENGTH;
uniform COMPAT_PRECISION float VB_LCD_SCANLINE_STRENGTH;
uniform COMPAT_PRECISION float VB_LCD_RED_GAIN;
#else
#define VB_LCD_GRID_STRENGTH 0.34
#define VB_LCD_EDGE_WIDTH 0.30
#define VB_LCD_DOT_STRENGTH 0.10
#define VB_LCD_SCANLINE_STRENGTH 0.10
#define VB_LCD_RED_GAIN 0.04
#endif

void main()
{
    COMPAT_PRECISION vec2 textureSize = max(TextureSize.xy, vec2(1.0));
    COMPAT_PRECISION vec2 inputSize = max(InputSize.xy, vec2(1.0));
    COMPAT_PRECISION vec2 pixelCoord = TEX0.xy * textureSize;
    COMPAT_PRECISION vec2 activeCoord = pixelCoord / inputSize;

    COMPAT_PRECISION float inActiveInput = step(0.0, activeCoord.x) *
        step(0.0, activeCoord.y) *
        step(activeCoord.x, 1.0) *
        step(activeCoord.y, 1.0);

    if (inActiveInput < 0.5)
    {
        FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    COMPAT_PRECISION vec2 pixelCenter = floor(pixelCoord) + vec2(0.5);
    COMPAT_PRECISION vec2 maxPixelCenter = max(inputSize - vec2(0.5), vec2(0.5));
    pixelCenter = clamp(pixelCenter, vec2(0.5), maxPixelCenter);

    COMPAT_PRECISION vec4 source = COMPAT_TEXTURE(Texture, pixelCenter / textureSize);
    COMPAT_PRECISION vec2 cell = fract(pixelCoord);
    COMPAT_PRECISION float edgeWidth = clamp(VB_LCD_EDGE_WIDTH, 0.01, 0.50);

    COMPAT_PRECISION float horizontalAperture = smoothstep(0.0, edgeWidth, cell.x) * smoothstep(0.0, edgeWidth, 1.0 - cell.x);
    COMPAT_PRECISION float verticalAperture = smoothstep(0.0, edgeWidth, cell.y) * smoothstep(0.0, edgeWidth, 1.0 - cell.y);
    COMPAT_PRECISION float aperture = min(horizontalAperture, verticalAperture);

    COMPAT_PRECISION float gridMask = mix(1.0 - clamp(VB_LCD_GRID_STRENGTH, 0.0, 1.0), 1.0, aperture);

    COMPAT_PRECISION vec2 centeredCell = (cell - vec2(0.5)) * 2.0;
    COMPAT_PRECISION float dotDistance = dot(centeredCell, centeredCell);
    COMPAT_PRECISION float dotMask = 1.0 - clamp(VB_LCD_DOT_STRENGTH, 0.0, 1.0) * smoothstep(0.45, 1.30, dotDistance);

    COMPAT_PRECISION float rowCenter = smoothstep(0.05, 0.50, cell.y) * smoothstep(0.05, 0.50, 1.0 - cell.y);
    COMPAT_PRECISION float scanlineMask = mix(1.0 - clamp(VB_LCD_SCANLINE_STRENGTH, 0.0, 1.0), 1.0, rowCenter);

    COMPAT_PRECISION vec3 color = source.rgb * gridMask * dotMask * scanlineMask;
    COMPAT_PRECISION float visibleIntensity = max(max(source.r, source.g), source.b);
    color.r = min(1.0, color.r * (1.0 + clamp(VB_LCD_RED_GAIN, 0.0, 1.0) * visibleIntensity));

    FragColor = vec4(color, 1.0);
}
#endif
