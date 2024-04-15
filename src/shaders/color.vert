#version 300 es

precision highp float;

uniform mat4 u_transform;

in vec4 a_position;
in vec4 a_color;

out vec4 v_color;

void main()
{
    gl_Position = u_transform * a_position;
    v_color = a_color;
}
