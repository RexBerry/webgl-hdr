#version 300 es

precision highp float;

uniform float u_brightness_mult;
uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

//=================================================================================================
//
//  Baking Lab
//  by MJP and David Neubelt
//  http://mynameismjp.wordpress.com/
//
//  All code licensed under the MIT license
//
//=================================================================================================

/*
MIT License

Copyright (c) 2016 MJP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// The code in this file was originally written by Stephen Hill (@self_shadow), who deserves all
// credit for coming up with this fit and implementing it. Buy him a beer next time you see him. :)

// Display P3 => sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
const mat3 ACESInputMat = mat3(
    vec3(0.715659, 0.0545842, 0.0127024),
    vec3(0.23137, 0.928216, 0.0671725),
    vec3(0.0529696, 0.0172004, 0.920124)
);

// ODT_SAT => XYZ => D60_2_D65 => => sRGB => Display P3
const mat3 ACESOutputMat = mat3(
    vec3(1.30173, -0.0454211, 0.0170521),
    vec3(-0.240064, 1.05372, 0.00492421),
    vec3(-0.0616627, -0.00829585, 0.978016)
);

vec3 RRTAndODTFit(vec3 v)
{
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
}

vec3 ACESFitted(vec3 color)
{
    color = ACESInputMat * color;

    // Apply RRT and ODT
    color = RRTAndODTFit(color);

    color = ACESOutputMat * color;

    // Clamp to [0, 1]
    color = clamp(color, vec3(0.0), vec3(1.0));

    return color;
}

vec3 srgb_to_linear(vec3 x)
{
    return mix(
        x / 12.92,
        pow((x + 0.055) / 1.055, vec3(2.4)),
        greaterThan(x, vec3(0.04045))
    );
}

float srgb_to_linear(float x)
{
    if (x <= 0.04045)
    {
        return x / 12.92;
    }
    else
    {
        return pow((x + 0.055) / 1.055, 2.4);
    }
}

vec3 linear_to_srgb(vec3 x)
{
    return mix(
        12.92 * x,
        1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055,
        greaterThan(x, vec3(0.0031308))
    );
}

float linear_to_srgb(float x)
{
    if (x <= 0.0031308)
    {
        return 12.92 * x;
    }
    else
    {
        return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
    }
}

float calc_luminance(vec3 x)
{
    // Y components (CIE XYZ) of Display P3 primaries
    return dot(
        vec3(0.228983, 0.691749, 0.079268),
        x
    );
}

float calc_luma(vec3 x)
{
    return calc_luminance(linear_to_srgb(x));
}

void main()
{
    vec3 tonemapped = ACESFitted(
        u_brightness_mult * texture(u_texture, v_texcoord).rgb
    );

    // FXAA shader requires luma in alpha channel
    float luma = calc_luma(tonemapped);
    out_color = vec4(tonemapped, luma);
}
