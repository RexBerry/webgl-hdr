import * as twgl from "twgl.js"

import { PixelDataArrayRef, RenderSettings } from "./common"

import { drawToCanvasHdr, drawToCanvasSdr } from "./draw-to-canvas"
import { Framebuffers, resizeFramebuffers } from "./framebuffers"
import { GLPrograms } from "./gl-programs"
import { postProcess } from "./post-process"
import { renderScene } from "./render-scene"
import * as util from "./util"

export function render(
    renderSettings: RenderSettings,
    superwhiteElem: HTMLElement,
    ctx: CanvasRenderingContext2D,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    programs: GLPrograms,
    bufferInfo: twgl.BufferInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
    pixelDataArrayRef: PixelDataArrayRef,
): void {
    util.updateSettings(
        renderSettings,
        superwhiteElem,
        ctx.canvas,
        <HTMLCanvasElement>gl.canvas,
    )

    if (util.resizeCanvas(ctx.canvas)) {
        gl.canvas.width = ctx.canvas.width
        gl.canvas.height = ctx.canvas.height

        resizeFramebuffers(gl, framebuffers)

        pixelDataArrayRef.value = new Uint8ClampedArray(
            4 * gl.canvas.width * gl.canvas.height,
        )
    }

    renderScene(
        renderSettings,
        gl,
        framebuffers,
        programs.sceneProgramInfo,
        bufferInfo,
    )

    postProcess(
        renderSettings,
        gl,
        framebuffers,
        programs.tonemapProgramInfo,
        programs.antialiasProgramInfo,
        fillScreenBufferInfo,
    )

    if (renderSettings.isHdrEnabled) {
        drawToCanvasHdr(
            renderSettings,
            ctx,
            gl,
            framebuffers[0],
            programs.colorCanvasProgramInfo,
            programs.brightnessCanvasProgramInfo,
            fillScreenBufferInfo,
            pixelDataArrayRef.value,
        )
    } else {
        drawToCanvasSdr(
            renderSettings,
            gl,
            framebuffers[0],
            programs.sdrCanvasProgramInfo,
            fillScreenBufferInfo,
        )
    }
}
