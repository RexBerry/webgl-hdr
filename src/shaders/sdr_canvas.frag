#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

const mat3 display_p3_to_xyz = mat3(
    vec3(0.48657, 0.22897, 0.0),
    vec3(0.26567, 0.69174, 0.04511),
    vec3(0.19822, 0.07929, 1.04394)
);

const mat3 xyz_to_srgb = inverse(mat3(
    vec3(0.41239, 0.21264, 0.01933),
    vec3(0.35758, 0.71517, 0.11919),
    vec3(0.18048, 0.07219, 0.95053)
));

const mat3 display_p3_to_srgb = xyz_to_srgb * display_p3_to_xyz;

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
    vec4 color = texture(u_texture, v_texcoord);
    color = linear_to_srgb(vec4(display_p3_to_srgb * color.rgb, color.a));
    color = clamp(color, vec4(0.0), vec4(1.0));

    out_color = color;
}
