#version 300 es

precision highp float;

#define LIGHT_COUNT 3

uniform vec3 u_camera_position;
uniform vec3 u_light_positions[LIGHT_COUNT];
uniform vec3 u_specular_lights[LIGHT_COUNT];
uniform vec3 u_diffuse_lights[LIGHT_COUNT];
uniform vec3 u_ambient_light;
uniform float u_specular_reflection;
uniform float u_diffuse_reflection;
uniform float u_ambient_reflection;
uniform float u_shininess;

in vec3 v_position;
in vec3 v_normal;
in vec4 v_color;

out vec4 out_color;

// Phong reflection model
// https://en.wikipedia.org/wiki/Phong_reflection_model

void main()
{
    vec3 normal = normalize(v_normal);
    vec3 camera_dir = normalize(u_camera_position - v_position);

    vec3 light = u_ambient_reflection * u_ambient_light;

    for (int i = 0; i < LIGHT_COUNT; ++i)
    {
        vec3 light_dir = normalize(u_light_positions[i] - v_position);
        vec3 reflection_dir
            = 2.0 * dot(light_dir, normal) * normal - light_dir;

        light
            += u_diffuse_reflection
                * max(dot(light_dir, normal), 0.0)
                * u_diffuse_lights[i]
            + u_specular_reflection
                * pow(max(dot(reflection_dir, camera_dir), 0.0), u_shininess)
                * u_specular_lights[i];
    }

    out_color = vec4(light * v_color.rgb, v_color.a);
}
