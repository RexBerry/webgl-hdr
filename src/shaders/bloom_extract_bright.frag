#version 300 es

precision highp float;

uniform float u_bloom_threshold;
uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

void main()
{
    vec4 color = texture(u_texture, v_texcoord);
    color.rgb = sqrt(max(color.rgb - vec3(u_bloom_threshold), vec3(0.0)));

    out_color = color;
}
