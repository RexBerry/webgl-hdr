#version 300 es

precision highp float;

uniform sampler2D u_scene_texture;
uniform sampler2D u_bloom_texture;

in vec2 v_texcoord;

out vec4 out_color;

void main()
{
    out_color = vec4(
        texture(u_scene_texture, v_texcoord).rgb
        + pow(texture(u_bloom_texture, v_texcoord).rgb, vec3(2.0)),
        1.0
    );
}
