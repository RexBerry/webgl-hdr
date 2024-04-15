#version 300 es

precision highp float;

uniform float u_brightness_mult;
uniform float u_reciprocal_white_point_squared;
uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

float calc_luminance(vec3 x)
{
    // Y component of Display P3 to CIEXYZ
    return dot(
        vec3(0.22897, 0.69174, 0.07929),
        x
    );
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
    vec4 tonemapped = vec4(
        color.rgb * ratio, color.a
    );
    tonemapped = clamp(tonemapped, vec4(0.0), vec4(1.0));
    out_color = tonemapped;
}
