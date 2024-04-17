import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import { updateBloomBlurPrograms } from "./blur-programs"
import { drawToCanvasHdr, drawToCanvasSdr } from "./draw-to-canvas"
import { Framebuffers, resizeFramebuffers } from "./framebuffers"
import { GLPrograms } from "./gl-programs"
import { postProcess } from "./post-process"
import { renderScene } from "./render-scene"
import * as util from "./util"

export function renderAnimation(
    renderSettings: RenderSettings,
    superwhiteElem: HTMLElement,
    ctx: CanvasRenderingContext2D,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    programs: GLPrograms,
    bufferInfo: twgl.BufferInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): void {
    util.updateFpsCounter()

    render(
        renderSettings,
        superwhiteElem,
        ctx,
        gl,
        framebuffers,
        programs,
        bufferInfo,
        fillScreenBufferInfo,
    )

    window.requestAnimationFrame(() => {
        renderAnimation(
            renderSettings,
            superwhiteElem,
            ctx,
            gl,
            framebuffers,
            programs,
            bufferInfo,
            fillScreenBufferInfo,
        )
    })
}

export function render(
    renderSettings: RenderSettings,
    superwhiteElem: HTMLElement,
    ctx: CanvasRenderingContext2D,
    gl: WebGL2RenderingContext,
    framebuffers: Framebuffers,
    programs: GLPrograms,
    bufferInfo: twgl.BufferInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): void {
    util.updateSettings(
        renderSettings,
        superwhiteElem,
        ctx.canvas,
        <HTMLCanvasElement>gl.canvas,
    )

    const filter = ctx.filter
    if (util.resizeCanvas(ctx.canvas)) {
        ctx.filter = filter

        gl.canvas.width = ctx.canvas.width
        gl.canvas.height = ctx.canvas.height

        resizeFramebuffers(gl, framebuffers)
    }

    updateBloomBlurPrograms(programs.bloomBlurPrograms, renderSettings, gl)

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
        programs.bloomBlurPrograms,
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
