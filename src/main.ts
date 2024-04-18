import "./style.css"

import * as twgl from "twgl.js"

import { ELEMENT_IDS, RenderSettings } from "./common"

import { initFramebuffers } from "./framebuffers"
import { initGlPrograms } from "./gl-programs"
import { renderAnimation } from "./render"
import * as util from "./util"

function main(): void {
    const renderSettings: RenderSettings = {
        isHdrEnabled: true,
        dynamicRange: 5.0,
        isAntialiasingEnabled: false,
        verticalFov: 80.0,
        bloomThresholdRatio: 2.0,
        bloomRadius: 3.0,
    }

    const superwhiteElem: HTMLElement = util.getElement(ELEMENT_IDS.superwhite)

    const ctxOptions = {
        alpha: false,
        colorSpace: "display-p3",
        desynchronized: false,
        willReadFrequently: false,
    }

    const canvas: HTMLCanvasElement = <HTMLCanvasElement>(
        util.getElement(ELEMENT_IDS.colorCanvas)
    )
    const ctx: CanvasRenderingContext2D =
        <CanvasRenderingContext2D>canvas.getContext("2d", ctxOptions) ??
        (() => {
            throw new Error("could not get CanvasRenderingContext2D")
        })()

    ctx.filter = `url(#${ELEMENT_IDS.displayP3ToSrgbFilter})`

    const glOptions = {
        alpha: false,
        depth: false,
        stencil: false,
        desynchronized: false,
        antialias: false,
        failIfMajorPerformanceCaveat: true,
        powerPreference: "default",
        preserveDrawingBuffer: false,
    }

    const glCanvas: HTMLCanvasElement = <HTMLCanvasElement>(
        util.getElement(ELEMENT_IDS.brightnessCanvas)
    )
    const gl: WebGL2RenderingContext =
        <WebGL2RenderingContext>glCanvas.getContext("webgl2", glOptions) ??
        (() => {
            throw new Error("cannot get WebGL2RenderingContext")
        })()

    if (!gl.getExtension("EXT_color_buffer_float")) {
        throw new Error("could not get EXT_color_buffer_float")
    }

    const programs = initGlPrograms(renderSettings, gl)

    const arrays = {
        a_position: {
            numComponents: 4,
            data: [
                -1, -3, -4, 1,
                1, -3, -4, 1,
                -1, -1, -4, 1,
                1, -1, -4, 1,
                -1, -1, -4, 1,
                1, -3, -4, 1,
                1, -3, -4, 1,
                1, -3, -6, 1,
                1, -1, -4, 1,
                1, -1, -6, 1,
                1, -1, -4, 1,
                1, -3, -6, 1,
                1, -3, -6, 1,
                -1, -3, -6, 1,
                1, -1, -6, 1,
                -1, -1, -6, 1,
                1, -1, -6, 1,
                -1, -3, -6, 1,
                -1, -3, -6, 1,
                -1, -3, -4, 1,
                -1, -1, -6, 1,
                -1, -1, -4, 1,
                -1, -1, -6, 1,
                -1, -3, -4, 1,
                -1, -1, -4, 1,
                1, -1, -4, 1,
                -1, -1, -6, 1,
                1, -1, -6, 1,
                -1, -1, -6, 1,
                1, -1, -4, 1,
            ],
        },
        a_normal: {
            numComponents: 3,
            data: [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
            ]
        },
        a_color: {
            numComponents: 4,
            data: [
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
                0.25, 0.25, 1, 1,
            ],
        },
    }

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)

    const fillScreenArrays = {
        a_position: {
            numComponents: 4,
            data: [-1, -1, 0, 1, 3, -1, 0, 1, -1, 3, 0, 1],
        },
        a_texcoord: {
            numComponents: 2,
            data: [0, 0, 2, 0, 0, 2],
        },
    }

    const fillScreenBufferInfo = twgl.createBufferInfoFromArrays(
        gl,
        fillScreenArrays,
    )

    const framebuffers = initFramebuffers(gl)

    window.requestAnimationFrame(
        () => {
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
        }
    )
}

window.onload = main
