import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

export function drawToCanvasHdr(
    renderSettings: RenderSettings,
    ctx: CanvasRenderingContext2D,
    gl: WebGL2RenderingContext,
    framebufferInfo: twgl.FramebufferInfo,
    colorCanvasProgramInfo: twgl.ProgramInfo,
    brightnessCanvasProgramInfo: twgl.ProgramInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): void {
    // Our framebuffer uses 16 bits per component, but the canvas element uses
    // only 8.
    // To increase precision, we will use one canvas for color and another for
    // brightness.

    // Extract color from framebuffer

    gl.useProgram(colorCanvasProgramInfo.program)
    twgl.bindFramebufferInfo(gl, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

    twgl.setBuffersAndAttributes(
        gl,
        colorCanvasProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(colorCanvasProgramInfo.uniformSetters, {
        u_transform: twgl.m4.identity(),
        u_texture: framebufferInfo.attachments[0],
    })
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

    // Render color to color canvas
    // WebGL contexts don't support Display P3,
    // so we must use a Canvas 2D context.
    // The filter assigned to ctx ensures that the color is rendered
    // correctly (it might be slightly off due to slight differences in
    // the browser's color conversion math).

    ctx.drawImage(gl.canvas, 0, 0)

    // Extract brightness from framebuffer and render to brightness canvas

    gl.useProgram(brightnessCanvasProgramInfo.program)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

    twgl.setBuffersAndAttributes(
        gl,
        brightnessCanvasProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(
        brightnessCanvasProgramInfo.uniformSetters,
        {
            u_transform: twgl.m4.identity(),
            u_texture: framebufferInfo.attachments[0],
        },
    )
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)
}

export function drawToCanvasSdr(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebufferInfo: twgl.FramebufferInfo,
    sdrCanvasProgramInfo: twgl.ProgramInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): void {
    gl.useProgram(sdrCanvasProgramInfo.program)
    twgl.bindFramebufferInfo(gl, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

    twgl.setBuffersAndAttributes(
        gl,
        sdrCanvasProgramInfo.attribSetters,
        fillScreenBufferInfo,
    )
    twgl.setUniformsAndBindTextures(sdrCanvasProgramInfo.uniformSetters, {
        u_transform: twgl.m4.identity(),
        u_texture: framebufferInfo.attachments[0],
    })
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)
}
