import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import * as camera from "./camera"
import { Framebuffers } from "./framebuffers"

export function renderScene(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    sceneProgramInfo: twgl.ProgramInfo,
    bufferInfo: twgl.BufferInfo,
): void {
    twgl.bindFramebufferInfo(gl, framebuffers[0])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.useProgram(sceneProgramInfo.program)

    twgl.setBuffersAndAttributes(
        gl,
        sceneProgramInfo.attribSetters,
        bufferInfo,
    )

    const t = performance.now() / 1000
    const x = 3.5 * Math.sin(t)
    const z = -3.5 + 3.5 * Math.cos(t)

    twgl.setUniforms(sceneProgramInfo.uniformSetters, {
        u_transform: twgl.m4.multiply(
            camera.perspectiveMatrix(gl, 80),
            camera.viewMatrix([x, 0, z], [0, 0, -3.5]),
        ),
    })

    gl.drawElements(
        gl.TRIANGLES,
        bufferInfo.numElements,
        bufferInfo.elementType ??
            (() => {
                throw new Error("Rendering error")
            })(),
        0,
    )
}
