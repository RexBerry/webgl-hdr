#version 300 es

precision highp float;

uniform float u_brightness_mult;
uniform float u_reciprocal_white_point_squared;
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
    // Y component of Display P3 to CIEXYZ
    return dot(
        vec3(0.22897, 0.69174, 0.07929),
        x
    );
}

float calc_luma(vec3 x)
{
    return calc_luminance(linear_to_srgb(x));
}

void main()
{
    // Extended Reinhard tone mapping using luminance
    // https://64.github.io/tonemapping/
    vec4 color = u_brightness_mult * texture(u_texture, v_texcoord);

    float luminance = calc_luminance(color.rgb);
    float ratio
        = (1.0 + u_reciprocal_white_point_squared * luminance)
        / (1.0 + luminance);

    vec3 tonemapped = color.rgb * ratio;
    tonemapped = clamp(tonemapped, vec3(0.0), vec3(1.0));

    // FXAA shader requires luma in alpha channel
    float luma = calc_luma(color.rgb);
    out_color = vec4(tonemapped.rgb, luma);
}
