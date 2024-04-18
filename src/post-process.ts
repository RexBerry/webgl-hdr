import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import { BlurPrograms } from "./blur-programs"
import { Framebuffers } from "./framebuffers"

export function postProcess(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    bloomExtractBrightProgramInfo: twgl.ProgramInfo,
    bloomBlurPrograms: BlurPrograms,
    bloomCompositeProgramInfo: twgl.ProgramInfo,
    tonemapProgramInfo: twgl.ProgramInfo,
    antialiasProgramInfo: twgl.ProgramInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): void {
    ;[framebuffers[0], framebuffers[3]] = [framebuffers[3], framebuffers[0]]

    gl.useProgram(bloomExtractBrightProgramInfo.program)
    twgl.bindFramebufferInfo(gl, framebuffers[1])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

    const bloomThreshold =
        renderSettings.bloomThresholdRatio * renderSettings.dynamicRange

    twgl.setBuffersAndAttributes(
        gl,
        bloomExtractBrightProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(
        bloomExtractBrightProgramInfo.uniformSetters,
        {
            u_transform: twgl.m4.identity(),
            u_bloom_threshold: bloomThreshold,
            u_texture: framebuffers[3].attachments[0],
        },
    )
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

    for (const blurProgramInfo of bloomBlurPrograms.programs) {
        gl.useProgram(blurProgramInfo.program)

        twgl.bindFramebufferInfo(gl, framebuffers[2])
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.disable(gl.DITHER)
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)

        twgl.setBuffersAndAttributes(
            gl,
            blurProgramInfo.attribSetters,
            fillScreenBufferInfo,
        )
        twgl.setUniformsAndBindTextures(blurProgramInfo.uniformSetters, {
            u_transform: twgl.m4.identity(),
            u_pixel_size: [1 / gl.canvas.width, 0],
            u_texture: framebuffers[1].attachments[0],
        })
        gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

        twgl.bindFramebufferInfo(gl, framebuffers[1])
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.disable(gl.DITHER)
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)

        twgl.setBuffersAndAttributes(
            gl,
            blurProgramInfo.attribSetters,
            fillScreenBufferInfo,
        )
        twgl.setUniformsAndBindTextures(blurProgramInfo.uniformSetters, {
            u_transform: twgl.m4.identity(),
            u_pixel_size: [0, 1 / gl.canvas.height],
            u_texture: framebuffers[2].attachments[0],
        })
        gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)
    }

    gl.useProgram(bloomCompositeProgramInfo.program)
    twgl.bindFramebufferInfo(gl, framebuffers[0])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

    twgl.setBuffersAndAttributes(
        gl,
        bloomCompositeProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(
        bloomCompositeProgramInfo.uniformSetters,
        {
            u_transform: twgl.m4.identity(),
            u_bloom_threshold: bloomThreshold,
            u_scene_texture: framebuffers[3].attachments[0],
            u_bloom_texture: framebuffers[1].attachments[0],
        },
    )
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

    gl.useProgram(tonemapProgramInfo.program)
    twgl.bindFramebufferInfo(gl, framebuffers[1])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

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
        ;[framebuffers[0], framebuffers[1]] = [
            framebuffers[1],
            framebuffers[0],
        ]
        return
    }

    gl.useProgram(antialiasProgramInfo.program)
    twgl.bindFramebufferInfo(gl, framebuffers[0])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

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
