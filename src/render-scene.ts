import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import * as camera from "./camera"
import { Framebuffers } from "./framebuffers"

let mouseX: number = 0
let mouseY: number = 0

window.addEventListener("mousemove", (e) => {
    mouseX = e.screenX / window.screen.width
    mouseY = e.screenY / window.screen.height
    console.log(mouseX, mouseY)
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
        u_camera_position: [x, z, z],
        u_light_positions: [
            2, -0.5, 2,
            -6, -2, -7,
            4, 0, -8,
        ],
        u_specular_lights: [
            20, 0, 0,
            0, 0, 30,
            0, 10, 0,
        ],
        u_diffuse_lights: [
            1.0, 0, 0,
            0, 0, 1.5,
            0, 0.5, 0,
        ],
        u_ambient_light: [0.25, 0.25, 0.25],
        u_specular_reflection: 0.95,
        u_diffuse_reflection: 0.75,
        u_ambient_reflection: 0.75,
        u_shininess: 20.0,
    })

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        bufferInfo.numElements,
    )
}
