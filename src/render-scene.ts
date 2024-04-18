import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import * as camera from "./camera"
import { Framebuffers } from "./framebuffers"

let currRadius: number = 5
let currAngle: number = 0

let beginRadius: number = 0
let beginAngle: number = 0

let beginPointerX: number = 0
let beginPointerY: number = 0

let pointerDown: boolean = false

window.addEventListener("pointerdown", (e) => {
    beginPointerX = e.screenX
    beginPointerY = e.screenY
    beginRadius = currRadius
    beginAngle = currAngle
    pointerDown = true
})

window.addEventListener("pointerup", (e) => {
    pointerDown = false
})

window.addEventListener("pointermove", (e) => {
    if (!pointerDown) {
        return
    }

    currRadius = Math.max(
        1,
        Math.min(
            10,
            beginRadius + 10 * -(e.screenY - beginPointerY) / screen.height
        )
    )
    currAngle = (
        beginAngle - 2 * Math.PI * (e.screenX - beginPointerX) / screen.width
    ) % (2 * Math.PI)
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

    const x = currRadius * Math.sin(currAngle)
    const y = 0.5
    const z = -5 + currRadius * Math.cos(currAngle)

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
            1250, 0, 0,
            0, 0, 15,
            0, 250, 0,
        ],
        u_ambient_light: [0.25, 0.25, 0.25],
        u_specular_reflection: 5.0,
        u_diffuse_reflection: 0.5,
        u_shininess: 50.0,
    })

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        bufferInfo.numElements,
    )
}
