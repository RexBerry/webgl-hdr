#version 300 es

precision highp float;

// Copyright (c) 2011 NVIDIA Corporation. All rights reserved.
//
// TO  THE MAXIMUM  EXTENT PERMITTED  BY APPLICABLE  LAW, THIS SOFTWARE  IS PROVIDED
// *AS IS*  AND NVIDIA AND  ITS SUPPLIERS DISCLAIM  ALL WARRANTIES,  EITHER  EXPRESS
// OR IMPLIED, INCLUDING, BUT NOT LIMITED  TO, NONINFRINGEMENT,IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.  IN NO EVENT SHALL  NVIDIA
// OR ITS SUPPLIERS BE  LIABLE  FOR  ANY  DIRECT, SPECIAL,  INCIDENTAL,  INDIRECT,  OR
// CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION,  DAMAGES FOR LOSS
// OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR ANY
// OTHER PECUNIARY LOSS) ARISING OUT OF THE  USE OF OR INABILITY  TO USE THIS SOFTWARE,
// EVEN IF NVIDIA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
//
// Please direct any bugs or questions to SDKFeedback@nvidia.com

// Requires "#version 130" or better
#define int2 ivec2
#define float2 vec2
#define float3 vec3
#define float4 vec4
#define FxaaBool3 bvec3
#define FxaaInt2 ivec2
#define FxaaFloat2 vec2
#define FxaaFloat3 vec3
#define FxaaFloat4 vec4
#define FxaaBool2Float(a) mix(0.0, 1.0, (a))
#define FxaaPow3(x, y) pow(x, y)
#define FxaaSel3(f, t, b) mix((f), (t), (b))
#define FxaaTex sampler2D

/*--------------------------------------------------------------------------*/
#define FxaaToFloat3(a) FxaaFloat3((a), (a), (a))
/*--------------------------------------------------------------------------*/
float4 FxaaTexLod0(FxaaTex tex, float2 pos) {
    return texture(tex, pos.xy);
}
/*--------------------------------------------------------------------------*/
float4 FxaaTexGrad(FxaaTex tex, float2 pos, float2 grad) {
    return textureGrad(tex, pos.xy, grad, grad);
}
/*--------------------------------------------------------------------------*/
float4 FxaaTexOff(FxaaTex tex, float2 pos, int2 off, float2 rcpFrame) {
    return texture(tex, pos.xy + float2(off.xy) * rcpFrame);
}

/*============================================================================
                                 SRGB KNOBS
------------------------------------------------------------------------------
FXAA_SRGB_ROP - Set to 1 when applying FXAA to an sRGB back buffer (DX10/11).
                This will do the sRGB to linear transform,
                as ROP will expect linear color from this shader,
                and this shader works in non-linear color.
============================================================================*/
// We are not applying this to an sRGB buffer
#define FXAA_SRGB_ROP 0

/*============================================================================
                                DEBUG KNOBS
------------------------------------------------------------------------------
All debug knobs draw FXAA-untouched pixels in FXAA computed luma (monochrome).

FXAA_DEBUG_PASSTHROUGH - Red for pixels which are filtered by FXAA with a
                         yellow tint on sub-pixel aliasing filtered by FXAA.
FXAA_DEBUG_HORZVERT    - Blue for horizontal edges, gold for vertical edges.
FXAA_DEBUG_PAIR        - Blue/green for the 2 pixel pair choice.
FXAA_DEBUG_NEGPOS      - Red/blue for which side of center of span.
FXAA_DEBUG_OFFSET      - Red/blue for -/+ x, gold/skyblue for -/+ y.
============================================================================*/
#ifndef     FXAA_DEBUG_PASSTHROUGH
    #define FXAA_DEBUG_PASSTHROUGH 0
#endif
#ifndef     FXAA_DEBUG_HORZVERT
    #define FXAA_DEBUG_HORZVERT    0
#endif
#ifndef     FXAA_DEBUG_PAIR
    #define FXAA_DEBUG_PAIR        0
#endif
#ifndef     FXAA_DEBUG_NEGPOS
    #define FXAA_DEBUG_NEGPOS      0
#endif
#ifndef     FXAA_DEBUG_OFFSET
    #define FXAA_DEBUG_OFFSET      0
#endif
/*--------------------------------------------------------------------------*/
#if FXAA_DEBUG_PASSTHROUGH || FXAA_DEBUG_HORZVERT || FXAA_DEBUG_PAIR
    #define FXAA_DEBUG 1
#endif
#if FXAA_DEBUG_NEGPOS || FXAA_DEBUG_OFFSET
    #define FXAA_DEBUG 1
#endif
#ifndef FXAA_DEBUG
    #define FXAA_DEBUG 0
#endif

/*============================================================================
                              COMPILE-IN KNOBS
------------------------------------------------------------------------------
FXAA_PRESET - Choose compile-in knob preset 0-5.
------------------------------------------------------------------------------
FXAA_EDGE_THRESHOLD - The minimum amount of local contrast required
                      to apply algorithm.
                      1.0/3.0  - too little
                      1.0/4.0  - good start
                      1.0/8.0  - applies to more edges
                      1.0/16.0 - overkill
------------------------------------------------------------------------------
FXAA_EDGE_THRESHOLD_MIN - Trims the algorithm from processing darks.
                          Perf optimization.
                          1.0/32.0 - visible limit (smaller isn't visible)
                          1.0/16.0 - good compromise
                          1.0/12.0 - upper limit (seeing artifacts)
------------------------------------------------------------------------------
FXAA_SEARCH_STEPS - Maximum number of search steps for end of span.
------------------------------------------------------------------------------
FXAA_SEARCH_ACCELERATION - How much to accelerate search,
                           1 - no acceleration
                           2 - skip by 2 pixels
                           3 - skip by 3 pixels
                           4 - skip by 4 pixels
------------------------------------------------------------------------------
FXAA_SEARCH_THRESHOLD - Controls when to stop searching.
                        1.0/4.0 - seems to be the best quality wise
------------------------------------------------------------------------------
FXAA_SUBPIX_FASTER - Turn on lower quality but faster subpix path.
                     Not recomended, but used in preset 0.
------------------------------------------------------------------------------
FXAA_SUBPIX - Toggle subpix filtering.
              0 - turn off
              1 - turn on
              2 - turn on full (ignores FXAA_SUBPIX_TRIM and CAP)
------------------------------------------------------------------------------
FXAA_SUBPIX_TRIM - Controls sub-pixel aliasing removal.
                   1.0/2.0 - low removal
                   1.0/3.0 - medium removal
                   1.0/4.0 - default removal
                   1.0/8.0 - high removal
                   0.0 - complete removal
------------------------------------------------------------------------------
FXAA_SUBPIX_CAP - Insures fine detail is not completely removed.
                  This is important for the transition of sub-pixel detail,
                  like fences and wires.
                  3.0/4.0 - default (medium amount of filtering)
                  7.0/8.0 - high amount of filtering
                  1.0 - no capping of sub-pixel aliasing removal
============================================================================*/
#ifndef FXAA_PRESET
    #define FXAA_PRESET 6
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_PRESET == 0)
    #define FXAA_EDGE_THRESHOLD      (1.0/4.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/12.0)
    #define FXAA_SEARCH_STEPS        2
    #define FXAA_SEARCH_ACCELERATION 4
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       1
    #define FXAA_SUBPIX_CAP          (2.0/3.0)
    #define FXAA_SUBPIX_TRIM         (1.0/4.0)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_PRESET == 1)
    #define FXAA_EDGE_THRESHOLD      (1.0/8.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/16.0)
    #define FXAA_SEARCH_STEPS        4
    #define FXAA_SEARCH_ACCELERATION 3
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       0
    #define FXAA_SUBPIX_CAP          (3.0/4.0)
    #define FXAA_SUBPIX_TRIM         (1.0/4.0)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_PRESET == 2)
    #define FXAA_EDGE_THRESHOLD      (1.0/8.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/24.0)
    #define FXAA_SEARCH_STEPS        8
    #define FXAA_SEARCH_ACCELERATION 2
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       0
    #define FXAA_SUBPIX_CAP          (3.0/4.0)
    #define FXAA_SUBPIX_TRIM         (1.0/4.0)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_PRESET == 3)
    #define FXAA_EDGE_THRESHOLD      (1.0/8.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/24.0)
    #define FXAA_SEARCH_STEPS        16
    #define FXAA_SEARCH_ACCELERATION 1
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       0
    #define FXAA_SUBPIX_CAP          (3.0/4.0)
    #define FXAA_SUBPIX_TRIM         (1.0/4.0)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_PRESET == 4)
    #define FXAA_EDGE_THRESHOLD      (1.0/8.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/24.0)
    #define FXAA_SEARCH_STEPS        24
    #define FXAA_SEARCH_ACCELERATION 1
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       0
    #define FXAA_SUBPIX_CAP          (3.0/4.0)
    #define FXAA_SUBPIX_TRIM         (1.0/4.0)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_PRESET == 5)
    #define FXAA_EDGE_THRESHOLD      (1.0/8.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/24.0)
    #define FXAA_SEARCH_STEPS        32
    #define FXAA_SEARCH_ACCELERATION 1
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       0
    #define FXAA_SUBPIX_CAP          (3.0/4.0)
    #define FXAA_SUBPIX_TRIM         (1.0/4.0)
#endif
// My own preset
#if (FXAA_PRESET == 6)
    #define FXAA_EDGE_THRESHOLD      (1.0/8.0)
    #define FXAA_EDGE_THRESHOLD_MIN  (1.0/32.0)
    #define FXAA_SEARCH_STEPS        32
    #define FXAA_SEARCH_ACCELERATION 1
    #define FXAA_SEARCH_THRESHOLD    (1.0/4.0)
    #define FXAA_SUBPIX              1
    #define FXAA_SUBPIX_FASTER       0
    #define FXAA_SUBPIX_CAP          (3.0/4.0)
    #define FXAA_SUBPIX_TRIM         (1.0/6.0)
#endif
/*--------------------------------------------------------------------------*/
#define FXAA_SUBPIX_TRIM_SCALE (1.0/(1.0 - FXAA_SUBPIX_TRIM))

/*============================================================================
                                   HELPERS
============================================================================*/
// Return the luma, the estimation of luminance from rgb inputs.
// This approximates luma using one FMA instruction,
// skipping normalization and tossing out blue.
// FxaaLuma() will range 0.0 to 2.963210702.
float FxaaLuma(float3 rgb) {
    // Modified to work with display P3
    return dot(2.963210702 * float3(0.22897, 0.69174, 0.07929), rgb);
}
/*--------------------------------------------------------------------------*/
float3 FxaaLerp3(float3 a, float3 b, float amountOfA) {
    return (FxaaToFloat3(-amountOfA) * b) +
        ((a * FxaaToFloat3(amountOfA)) + b); }
/*--------------------------------------------------------------------------*/
// Support any extra filtering before returning color.
float3 FxaaFilterReturn(float3 rgb) {
    #if FXAA_SRGB_ROP
        // Do sRGB encoded value to linear conversion.
        return FxaaSel3(
            rgb * FxaaToFloat3(1.0/12.92),
            FxaaPow3(
                rgb * FxaaToFloat3(1.0/1.055) + FxaaToFloat3(0.055/1.055),
                FxaaToFloat3(2.4)),
            rgb > FxaaToFloat3(0.04045));
    #else
        return rgb;
    #endif
}

/*============================================================================

                                PIXEL SHADER

============================================================================*/
float3 FxaaPixelShader(
// Output of FxaaVertexShader interpolated across screen.
//  xy -> actual texture position {0.0 to 1.0}
float2 pos,
// Input texture.
FxaaTex tex,
// RCPFRAME SHOULD PIXEL SHADER CONSTANTS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// {1.0/frameWidth, 1.0/frameHeight}
float2 rcpFrame) {

/*----------------------------------------------------------------------------
            EARLY EXIT IF LOCAL CONTRAST BELOW EDGE DETECT LIMIT
----------------------------------------------------------------------------*/
    float3 rgbN = FxaaTexOff(tex, pos.xy, FxaaInt2( 0,-1), rcpFrame).xyz;
    float3 rgbW = FxaaTexOff(tex, pos.xy, FxaaInt2(-1, 0), rcpFrame).xyz;
    float3 rgbM = FxaaTexOff(tex, pos.xy, FxaaInt2( 0, 0), rcpFrame).xyz;
    float3 rgbE = FxaaTexOff(tex, pos.xy, FxaaInt2( 1, 0), rcpFrame).xyz;
    float3 rgbS = FxaaTexOff(tex, pos.xy, FxaaInt2( 0, 1), rcpFrame).xyz;
    float lumaN = FxaaLuma(rgbN);
    float lumaW = FxaaLuma(rgbW);
    float lumaM = FxaaLuma(rgbM);
    float lumaE = FxaaLuma(rgbE);
    float lumaS = FxaaLuma(rgbS);
    float rangeMin = min(lumaM, min(min(lumaN, lumaW), min(lumaS, lumaE)));
    float rangeMax = max(lumaM, max(max(lumaN, lumaW), max(lumaS, lumaE)));
    float range = rangeMax - rangeMin;
    #if FXAA_DEBUG
        float lumaO = lumaM / (1.0 + (0.587/0.299));
    #endif
    if(range < max(FXAA_EDGE_THRESHOLD_MIN, rangeMax * FXAA_EDGE_THRESHOLD)) {
        #if FXAA_DEBUG
            return FxaaFilterReturn(FxaaToFloat3(lumaO));
        #endif
        return FxaaFilterReturn(rgbM); }
    #if FXAA_SUBPIX > 0
        #if FXAA_SUBPIX_FASTER
            float3 rgbL = (rgbN + rgbW + rgbE + rgbS + rgbM) *
                FxaaToFloat3(1.0/5.0);
        #else
            float3 rgbL = rgbN + rgbW + rgbM + rgbE + rgbS;
        #endif
    #endif

/*----------------------------------------------------------------------------
                               COMPUTE LOWPASS
----------------------------------------------------------------------------*/
    #if FXAA_SUBPIX != 0
        float lumaL = (lumaN + lumaW + lumaE + lumaS) * 0.25;
        float rangeL = abs(lumaL - lumaM);
    #endif
    #if FXAA_SUBPIX == 1
        float blendL = max(0.0,
            (rangeL / range) - FXAA_SUBPIX_TRIM) * FXAA_SUBPIX_TRIM_SCALE;
        blendL = min(FXAA_SUBPIX_CAP, blendL);
    #endif
    #if FXAA_SUBPIX == 2
        float blendL = rangeL / range;
    #endif
    #if FXAA_DEBUG_PASSTHROUGH
        #if FXAA_SUBPIX == 0
            float blendL = 0.0;
        #endif
        return FxaaFilterReturn(
            FxaaFloat3(1.0, blendL/FXAA_SUBPIX_CAP, 0.0));
    #endif

/*----------------------------------------------------------------------------
                    CHOOSE VERTICAL OR HORIZONTAL SEARCH
----------------------------------------------------------------------------*/
    float3 rgbNW = FxaaTexOff(tex, pos.xy, FxaaInt2(-1,-1), rcpFrame).xyz;
    float3 rgbNE = FxaaTexOff(tex, pos.xy, FxaaInt2( 1,-1), rcpFrame).xyz;
    float3 rgbSW = FxaaTexOff(tex, pos.xy, FxaaInt2(-1, 1), rcpFrame).xyz;
    float3 rgbSE = FxaaTexOff(tex, pos.xy, FxaaInt2( 1, 1), rcpFrame).xyz;
    #if (FXAA_SUBPIX_FASTER == 0) && (FXAA_SUBPIX > 0)
        rgbL += (rgbNW + rgbNE + rgbSW + rgbSE);
        rgbL *= FxaaToFloat3(1.0/9.0);
    #endif
    float lumaNW = FxaaLuma(rgbNW);
    float lumaNE = FxaaLuma(rgbNE);
    float lumaSW = FxaaLuma(rgbSW);
    float lumaSE = FxaaLuma(rgbSE);
    float edgeVert =
        abs((0.25 * lumaNW) + (-0.5 * lumaN) + (0.25 * lumaNE)) +
        abs((0.50 * lumaW ) + (-1.0 * lumaM) + (0.50 * lumaE )) +
        abs((0.25 * lumaSW) + (-0.5 * lumaS) + (0.25 * lumaSE));
    float edgeHorz =
        abs((0.25 * lumaNW) + (-0.5 * lumaW) + (0.25 * lumaSW)) +
        abs((0.50 * lumaN ) + (-1.0 * lumaM) + (0.50 * lumaS )) +
        abs((0.25 * lumaNE) + (-0.5 * lumaE) + (0.25 * lumaSE));
    bool horzSpan = edgeHorz >= edgeVert;
    #if FXAA_DEBUG_HORZVERT
        if(horzSpan) return FxaaFilterReturn(FxaaFloat3(1.0, 0.75, 0.0));
        else         return FxaaFilterReturn(FxaaFloat3(0.0, 0.50, 1.0));
    #endif
    float lengthSign = horzSpan ? -rcpFrame.y : -rcpFrame.x;
    if(!horzSpan) lumaN = lumaW;
    if(!horzSpan) lumaS = lumaE;
    float gradientN = abs(lumaN - lumaM);
    float gradientS = abs(lumaS - lumaM);
    lumaN = (lumaN + lumaM) * 0.5;
    lumaS = (lumaS + lumaM) * 0.5;

/*----------------------------------------------------------------------------
                CHOOSE SIDE OF PIXEL WHERE GRADIENT IS HIGHEST
----------------------------------------------------------------------------*/
    bool pairN = gradientN >= gradientS;
    #if FXAA_DEBUG_PAIR
        if(pairN) return FxaaFilterReturn(FxaaFloat3(0.0, 0.0, 1.0));
        else      return FxaaFilterReturn(FxaaFloat3(0.0, 1.0, 0.0));
    #endif
    if(!pairN) lumaN = lumaS;
    if(!pairN) gradientN = gradientS;
    if(!pairN) lengthSign *= -1.0;
    float2 posN;
    posN.x = pos.x + (horzSpan ? 0.0 : lengthSign * 0.5);
    posN.y = pos.y + (horzSpan ? lengthSign * 0.5 : 0.0);

/*----------------------------------------------------------------------------
                         CHOOSE SEARCH LIMITING VALUES
----------------------------------------------------------------------------*/
    gradientN *= FXAA_SEARCH_THRESHOLD;

/*----------------------------------------------------------------------------
    SEARCH IN BOTH DIRECTIONS UNTIL FIND LUMA PAIR AVERAGE IS OUT OF RANGE
----------------------------------------------------------------------------*/
    float2 posP = posN;
    float2 offNP = horzSpan ?
        FxaaFloat2(rcpFrame.x, 0.0) :
        FxaaFloat2(0.0f, rcpFrame.y);
    float lumaEndN = lumaN;
    float lumaEndP = lumaN;
    bool doneN = false;
    bool doneP = false;
    #if FXAA_SEARCH_ACCELERATION == 1
        posN += offNP * FxaaFloat2(-1.0, -1.0);
        posP += offNP * FxaaFloat2( 1.0,  1.0);
    #endif
    #if FXAA_SEARCH_ACCELERATION == 2
        posN += offNP * FxaaFloat2(-1.5, -1.5);
        posP += offNP * FxaaFloat2( 1.5,  1.5);
        offNP *= FxaaFloat2(2.0, 2.0);
    #endif
    #if FXAA_SEARCH_ACCELERATION == 3
        posN += offNP * FxaaFloat2(-2.0, -2.0);
        posP += offNP * FxaaFloat2( 2.0,  2.0);
        offNP *= FxaaFloat2(3.0, 3.0);
    #endif
    #if FXAA_SEARCH_ACCELERATION == 4
        posN += offNP * FxaaFloat2(-2.5, -2.5);
        posP += offNP * FxaaFloat2( 2.5,  2.5);
        offNP *= FxaaFloat2(4.0, 4.0);
    #endif
    for(int i = 0; i < FXAA_SEARCH_STEPS; i++) {
        #if FXAA_SEARCH_ACCELERATION == 1
            if(!doneN) lumaEndN =
                FxaaLuma(FxaaTexLod0(tex, posN.xy).xyz);
            if(!doneP) lumaEndP =
                FxaaLuma(FxaaTexLod0(tex, posP.xy).xyz);
        #else
            if(!doneN) lumaEndN =
                FxaaLuma(FxaaTexGrad(tex, posN.xy, offNP).xyz);
            if(!doneP) lumaEndP =
                FxaaLuma(FxaaTexGrad(tex, posP.xy, offNP).xyz);
        #endif
        doneN = doneN || (abs(lumaEndN - lumaN) >= gradientN);
        doneP = doneP || (abs(lumaEndP - lumaN) >= gradientN);
        if(doneN && doneP) break;
        if(!doneN) posN -= offNP;
        if(!doneP) posP += offNP; }

/*----------------------------------------------------------------------------
               HANDLE IF CENTER IS ON POSITIVE OR NEGATIVE SIDE
----------------------------------------------------------------------------*/
    float dstN = horzSpan ? pos.x - posN.x : pos.y - posN.y;
    float dstP = horzSpan ? posP.x - pos.x : posP.y - pos.y;
    bool directionN = dstN < dstP;
    #if FXAA_DEBUG_NEGPOS
        if(directionN) return FxaaFilterReturn(FxaaFloat3(1.0, 0.0, 0.0));
        else           return FxaaFilterReturn(FxaaFloat3(0.0, 0.0, 1.0));
    #endif
    lumaEndN = directionN ? lumaEndN : lumaEndP;

/*----------------------------------------------------------------------------
         CHECK IF PIXEL IS IN SECTION OF SPAN WHICH GETS NO FILTERING
----------------------------------------------------------------------------*/
    if(((lumaM - lumaN) < 0.0) == ((lumaEndN - lumaN) < 0.0))
        lengthSign = 0.0;

/*----------------------------------------------------------------------------
                COMPUTE SUB-PIXEL OFFSET AND FILTER SPAN
----------------------------------------------------------------------------*/
    float spanLength = (dstP + dstN);
    dstN = directionN ? dstN : dstP;
    float subPixelOffset = (0.5 + (dstN * (-1.0/spanLength))) * lengthSign;
    #if FXAA_DEBUG_OFFSET
        float ox = horzSpan ? 0.0 : subPixelOffset*2.0/rcpFrame.x;
        float oy = horzSpan ? subPixelOffset*2.0/rcpFrame.y : 0.0;
        if(ox < 0.0) return FxaaFilterReturn(
            FxaaLerp3(FxaaToFloat3(lumaO),
                      FxaaFloat3(1.0, 0.0, 0.0), -ox));
        if(ox > 0.0) return FxaaFilterReturn(
            FxaaLerp3(FxaaToFloat3(lumaO),
                      FxaaFloat3(0.0, 0.0, 1.0),  ox));
        if(oy < 0.0) return FxaaFilterReturn(
            FxaaLerp3(FxaaToFloat3(lumaO),
                      FxaaFloat3(1.0, 0.6, 0.2), -oy));
        if(oy > 0.0) return FxaaFilterReturn(
            FxaaLerp3(FxaaToFloat3(lumaO),
                      FxaaFloat3(0.2, 0.6, 1.0),  oy));
        return FxaaFilterReturn(FxaaFloat3(lumaO, lumaO, lumaO));
    #endif
    float3 rgbF = FxaaTexLod0(tex, FxaaFloat2(
        pos.x + (horzSpan ? 0.0 : subPixelOffset),
        pos.y + (horzSpan ? subPixelOffset : 0.0))).xyz;
    #if FXAA_SUBPIX == 0
        return FxaaFilterReturn(rgbF);
    #else
        return FxaaFilterReturn(FxaaLerp3(rgbL, rgbF, blendL));
    #endif
}

uniform vec2 u_reciprocal_resolution;
uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

void main()
{
    out_color = vec4(
        FxaaPixelShader(v_texcoord, u_texture, u_reciprocal_resolution), 1.0
    );
}
