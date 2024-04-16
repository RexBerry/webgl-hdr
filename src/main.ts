import "./style.css"

import * as twgl from "twgl.js"

import { ELEMENT_IDS, PixelDataArrayRef, RenderSettings } from "./common"

import { initFramebuffers } from "./framebuffers"
import { initGlPrograms } from "./gl-programs"
import { render } from "./render"
import * as util from "./util"

function main(): void {
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

    const programs = initGlPrograms(gl)

    const arrays = {
        a_position: {
            numComponents: 4,
            data: [-1, -1, -3, 1, 1, -1, -3, 1, 1, 1, -4, 1, -1, 1, -4, 1],
        },
        a_color: {
            numComponents: 4,
            data: [0, 0, 0, 1, 0, 0, 20, 1, 0, 20, 0, 1, 20, 0, 0, 1],
        },
        indices: {
            data: [0, 1, 3, 2, 3, 1],
            type: gl.UNSIGNED_SHORT,
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

    const pixelDataArrayRef: PixelDataArrayRef = {
        value: new Uint8ClampedArray(4 * gl.canvas.width * gl.canvas.height),
    }

    const renderSettings: RenderSettings = {
        isHdrEnabled: true,
        dynamicRange: 5.0,
        whitePoint: 20.0,
        isAntialiasingEnabled: false,
    }

    setInterval(
        render,
        100,
        renderSettings,
        superwhiteElem,
        ctx,
        gl,
        framebuffers,
        programs,
        bufferInfo,
        fillScreenBufferInfo,
        pixelDataArrayRef,
    )
}

window.onload = main
