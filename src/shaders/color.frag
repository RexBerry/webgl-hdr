#version 300 es

precision highp float;

#define MAX_LIGHT_COUNT 16

struct Light
{
    vec3 position;
    vec3 color;
    vec3 spotlight_direction;
    float spotlight_narrowness;
    bool is_directional_light;
};

uniform vec3 u_camera_position;
uniform int u_light_count;
uniform Light u_lights[MAX_LIGHT_COUNT];
uniform vec3 u_ambient_light;

in vec3 v_position;
in vec3 v_normal;
in vec4 v_diffuse_color;
in vec4 v_specular_color;
in float v_shininess;

out vec4 out_color;

// Blinn-Phong reflection model

// TODO:
// - implement directional lights and spotlights
// - deferred rendering
// - add textures and normal maps

void main()
{
    vec3 normal = normalize(v_normal);
    vec3 camera_dir = normalize(u_camera_position - v_position);

    vec3 diffuse = u_ambient_light;
    vec3 specular = vec3(0.0);

    for (int i = 0; i < u_light_count; ++i)
    {
        vec3 light_dir = u_lights[i].position - v_position;
        vec3 light_color = u_lights[i].color;

        float reciprocal_dist = 1.0 / length(light_dir);
        light_dir *= reciprocal_dist;

        // Inverse square law
        float mult = min(reciprocal_dist * reciprocal_dist, 10.0);
        light_color *= mult;

        vec3 halfway_dir = normalize(light_dir + camera_dir);

        vec3 diffuse_light = max(dot(normal, light_dir), 0.0) * light_color;
        diffuse += diffuse_light;

        specular += dot(diffuse_light, vec3(1.0)) > 0.0
            ? pow(max(dot(normal, halfway_dir), 0.0), v_shininess)
                * light_color
            : vec3(0.0);
    }

    out_color
        = vec4(diffuse, 1.0) * v_diffuse_color
        + vec4(specular, 1.0) * v_specular_color;
}
