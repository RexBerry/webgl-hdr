import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import * as camera from "./camera"
import { Framebuffers } from "./framebuffers"

let mouseX: number = 0
let mouseY: number = 0

window.addEventListener("mousemove", (e) => {
    mouseX = e.screenX / window.screen.width
    mouseY = e.screenY / window.screen.height
})

export function renderScene(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    sceneProgramInfo: twgl.ProgramInfo,
    bufferInfo: twgl.BufferInfo,
): void {
    gl.useProgram(sceneProgramInfo.program)
    twgl.bindFramebufferInfo(gl, framebuffers[0])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    twgl.setBuffersAndAttributes(
        gl,
        sceneProgramInfo.attribSetters,
        bufferInfo,
    )

    const radius = 10 * (1 - mouseY)
    const angle = 2 * Math.PI * (mouseX - 0.5)
    const x = radius * Math.sin(angle)
    const y = 0.5
    const z = -5 + radius * Math.cos(angle)

    twgl.setUniforms(sceneProgramInfo.uniformSetters, {
        u_transform: twgl.m4.multiply(
            camera.perspectiveMatrix(gl, renderSettings.verticalFov),
            camera.viewMatrix([x, y, z], [0, -2, -5]),
        ),
        u_camera_position: [x, y, z],
        u_light_positions: [
            3, -2, 0,
            -4, -2, -10,
            4, 0, -8,
        ],
        u_light_colors: [
            2500, 0, 0,
            0, 0, 30,
            0, 500, 0,
        ],
        u_ambient_light: [0.25, 0.25, 0.25],
        u_specular_reflection: 2.5,
        u_diffuse_reflection: 0.5,
        u_shininess: 50.0,
    })

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        bufferInfo.numElements,
    )
}
