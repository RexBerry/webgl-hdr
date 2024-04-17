export function createApproxBlurShaders(
    initialPasses: number,
    blurRadius: number,
): string[] {
    const shaders = []
    let resolution = 1

    for (let i = 0; i < initialPasses; ++i) {
        shaders.push(createBlurShader(2 * resolution, resolution))
        resolution *= 2
    }

    shaders.push(createBlurShader(blurRadius, resolution))

    return shaders
}

export function createBlurShader(
    blurRadius: number,
    blurResolution: number,
): string {
    const blurSize = Math.ceil((1.0 * blurRadius) / blurResolution)

    const width = 2 * blurSize
    const halfWidth = blurSize

    const totalWeight = 2 ** width
    const weights = []

    for (let i = 0; i <= halfWidth; ++i) {
        weights.push(choose(width, i) / totalWeight)
    }

    weights.reverse()

    return `#version 300 es

precision highp float;

uniform vec2 u_pixel_size;
uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 out_color;

const float kernel[${halfWidth + 1}] = float[${halfWidth + 1}](
    ${weights.join(", ")}
);

void main()
{
    vec4 result = kernel[0] * texture(u_texture, v_texcoord);

    for (int i = 1; i < ${halfWidth + 1}; ++i) {
        vec2 offset = float(i) * (float(${blurResolution}) * u_pixel_size);
        result += kernel[i] * (
            texture(u_texture, v_texcoord + offset)
            + texture(u_texture, v_texcoord - offset)
        );
    }

    out_color = result;
}
`
}

function choose(n: number, k: number): number {
    if (n - k < k) {
        k = n - k
    }

    let result = 1

    for (let i = 1; i <= k; ++i) {
        result *= n - i + 1
        result = Math.floor(result / i)
    }

    return result
}
