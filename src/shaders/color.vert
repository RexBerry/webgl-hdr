#version 300 es

precision highp float;

uniform mat4 u_transform;

in vec4 a_position;
in vec3 a_normal;
in vec4 a_color;

out vec3 v_position;
out vec3 v_normal;
out vec4 v_color;

// Blinn-Phong reflection model

void main()
{
    vec4 position = u_transform * a_position;
    gl_Position = position;

    v_position = a_position.xyz;
    v_normal = a_normal;
    v_color = a_color;
}
