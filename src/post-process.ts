import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import { Framebuffers } from "./framebuffers"

export function postProcess(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    tonemapProgramInfo: twgl.ProgramInfo,
    antialiasProgramInfo: twgl.ProgramInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): void {
    twgl.bindFramebufferInfo(gl, framebuffers[1])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.useProgram(tonemapProgramInfo.program)

    twgl.setBuffersAndAttributes(
        gl,
        tonemapProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(tonemapProgramInfo.uniformSetters, {
        u_transform: twgl.m4.identity(),
        u_brightness_mult: 1 / renderSettings.dynamicRange,
        u_texture: framebuffers[0].attachments[0],
    })
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

    if (!renderSettings.isAntialiasingEnabled) {
        [framebuffers[0], framebuffers[1]] = [framebuffers[1], framebuffers[0]]
        return
    }

    twgl.bindFramebufferInfo(gl, framebuffers[0])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.useProgram(antialiasProgramInfo.program)

    twgl.setBuffersAndAttributes(
        gl,
        antialiasProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(antialiasProgramInfo.uniformSetters, {
        u_transform: twgl.m4.identity(),
        u_reciprocal_resolution: [1 / gl.canvas.width, 1 / gl.canvas.height],
        u_texture: framebuffers[1].attachments[0],
    })
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)
}
