#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

vec4 srgb_to_linear(vec4 x)
{
    return vec4(
        mix(
            x.rgb / 12.92,
            pow((x.rgb + 0.055) / 1.055, vec3(2.4)),
            greaterThan(x.rgb, vec3(0.04045))
        ),
        x.a
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

vec4 linear_to_srgb(vec4 x)
{
    return vec4(
        mix(
            12.92 * x.rgb,
            1.055 * pow(x.rgb, vec3(1.0 / 2.4)) - 0.055,
            greaterThan(x.rgb, vec3(0.0031308))
        ),
        x.a
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

void main()
{
    vec4 color = linear_to_srgb(texture(u_texture, v_texcoord));
    color = clamp(color, vec4(0.0), vec4(1.0));

    vec3 srgb = ceil(255.0 * color.rgb);
    float max_component = max(max(srgb.r, srgb.g), max(srgb.b, 1.0)) / 255.0;

    out_color = vec4(color.rgb / max_component, color.a);
}
