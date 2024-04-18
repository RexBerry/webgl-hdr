#version 300 es

precision highp float;

uniform mat4 u_transform;

in vec4 a_position;
in vec3 a_normal;
in vec4 a_diffuse_color;
in vec4 a_specular_color;
in vec3 a_reflection_info;

out vec3 v_position;
out vec3 v_normal;
out vec4 v_diffuse_color;
out vec4 v_specular_color;
out float v_shininess;

// Blinn-Phong reflection model

void main()
{
    float diffuse_reflection = a_reflection_info.x;
    float specular_reflection = a_reflection_info.y;
    float shininess = a_reflection_info.z;

    vec4 position = u_transform * a_position;
    gl_Position = position;

    v_position = a_position.xyz;
    v_normal = a_normal;
    v_diffuse_color = vec4(
        diffuse_reflection * a_diffuse_color.rgb,
        a_diffuse_color.a
    );
    v_specular_color = vec4(
        specular_reflection * a_specular_color.rgb,
        a_specular_color.a
    );
    v_shininess = shininess;
}
