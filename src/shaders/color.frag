#version 300 es

precision highp float;

#define LIGHT_COUNT 3

uniform vec3 u_camera_position;
uniform vec3 u_light_positions[LIGHT_COUNT];
uniform vec3 u_light_colors[LIGHT_COUNT];
uniform vec3 u_ambient_light;
uniform float u_specular_reflection;
uniform float u_diffuse_reflection;
uniform float u_shininess;

in vec3 v_position;
in vec3 v_normal;
in vec4 v_color;

out vec4 out_color;

// Blinn-Phong reflection model

// TODO:
// - make specular color separate
// - make diffuse and specular colors and shininess varyings
// - make vertex shader calculate diffuse and specular colors, multiplying
//       them by the material's reflection constants
// - use structs
// - add directional lights and spotlights
// - deferred rendering
// - add textures and normal maps

void main()
{
    vec3 normal = normalize(v_normal);
    vec3 camera_dir = normalize(u_camera_position - v_position);

    vec3 light = u_diffuse_reflection * u_ambient_light;

    for (int i = 0; i < LIGHT_COUNT; ++i)
    {
        vec3 light_dir = u_light_positions[i] - v_position;
        float reciprocal_dist = 1.0 / length(light_dir);
        light_dir *= reciprocal_dist;
        // Inverse square law
        float mult = min(reciprocal_dist * reciprocal_dist, 10.0);
        vec3 halfway_dir = normalize(light_dir + camera_dir);

        float diffuse
            = u_diffuse_reflection
                * max(dot(normal, light_dir), 0.0);
        float specular = diffuse > 0.0
            ? u_specular_reflection
                * pow(max(dot(normal, halfway_dir), 0.0), u_shininess)
            : 0.0;

        light += mult * u_light_colors[i] * (diffuse + specular);
    }

    out_color = vec4(light * v_color.rgb, v_color.a);
}
