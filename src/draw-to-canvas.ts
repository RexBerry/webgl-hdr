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
    pixelDataArray: Uint8ClampedArray,
): void {
    // Our framebuffer uses 16 bits per component, but the canvas element uses
    // only 8.
    // To increase precision, we will use one canvas for color and another for
    // brightness.

    // Extract color from framebuffer

    twgl.bindFramebufferInfo(gl, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.useProgram(colorCanvasProgramInfo.program)

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
    // WebGL contexts don't support Display P3, so we must do this instead

    gl.readPixels(
        0,
        0,
        gl.canvas.width,
        gl.canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixelDataArray,
    )

    const displayP3ImageData = new ImageData(
        pixelDataArray,
        gl.canvas.width,
        gl.canvas.height,
        { colorSpace: "display-p3" },
    )
    ctx.putImageData(displayP3ImageData, 0, 0)

    // Extract brightness from framebuffer and render to brightness canvas

    twgl.bindFramebufferInfo(gl, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.useProgram(brightnessCanvasProgramInfo.program)

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
    twgl.bindFramebufferInfo(gl, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DITHER)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.useProgram(sdrCanvasProgramInfo.program)

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
