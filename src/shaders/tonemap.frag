#version 300 es

precision highp float;

uniform float u_brightness_mult; // Should be 1.5x the actual value
uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

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
    vec3 color = texture(u_texture, v_texcoord).rgb;

    float input_luminance = calc_luminance(color);
    float input_luminance_squared = input_luminance * input_luminance;

    float output_luminance = 0.9 * (
        input_luminance_squared * input_luminance
    ) / (1.0 + input_luminance_squared) + 0.1 * input_luminance;

    output_luminance *= u_brightness_mult;

    output_luminance = output_luminance / (1.0 + output_luminance);

    float ratio = output_luminance / input_luminance;

    vec3 tonemapped = ratio * color;

    // FXAA shader requires luma in alpha channel
    float luma = calc_luma(tonemapped);
    out_color = vec4(tonemapped, luma);
}
