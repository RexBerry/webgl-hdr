#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

const mat3 display_p3_to_srgb = mat3(
    vec3(1.22494, -0.0420584, -0.019644),
    vec3(-0.224935, 1.04206, -0.0786588),
    vec3(-3.26731e-6, 1.35536e-6, 1.0983)
);

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

void main()
{
    vec3 color = texture(u_texture, v_texcoord).rgb;
    color = linear_to_srgb(display_p3_to_srgb * color);
    color = clamp(color, vec3(0.0), vec3(1.0));

    out_color = vec4(color, 1.0);
}
