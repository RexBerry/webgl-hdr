import * as twgl from "twgl.js"

export const FRAMEBUFFER_COUNT = 4
export type Framebuffers = twgl.FramebufferInfo[]

export function initFramebuffers(gl: WebGL2RenderingContext): Framebuffers {
    const result = []

    for (let i = 0; i < FRAMEBUFFER_COUNT; ++i) {
        result.push(
            twgl.createFramebufferInfo(
                gl,
                [
                    {
                        internalFormat: gl.RGBA16F,
                        format: gl.RGBA,
                        type: gl.HALF_FLOAT,
                    },
                    {
                        format: gl.DEPTH_STENCIL,
                        type: gl.DEPTH32F_STENCIL8,
                    },
                ],
                gl.canvas.width,
                gl.canvas.height,
            ),
        )
    }

    return result
}

export function resizeFramebuffers(
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
): void {
    for (const framebuffer of framebuffers) {
        twgl.resizeFramebufferInfo(
            gl,
            framebuffer,
            [
                {
                    internalFormat: gl.RGBA16F,
                    format: gl.RGBA,
                    type: gl.HALF_FLOAT,
                },
                {
                    format: gl.DEPTH_STENCIL,
                    type: gl.DEPTH32F_STENCIL8,
                },
            ],
            gl.canvas.width,
            gl.canvas.height,
        )
    }
}
