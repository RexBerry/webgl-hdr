#version 300 es

precision highp float;

in vec4 v_color;

out highp uvec4 out_color;

void main()
{
    out_color = uvec4(65535.0 * clamp(v_color, vec4(0.0), vec4(1.0)));
}
