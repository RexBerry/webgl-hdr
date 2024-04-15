import "./style.css"

import * as twgl from "twgl.js"

import * as shaders from "./shaders.ts"

type RenderSettings = {
    isHdrEnabled: boolean
    dynamicRange: number
    whitePoint: number
    isAntialiasingEnabled: boolean
}

type FramebufferInfoRef = { value: twgl.FramebufferInfo }
type PixelDataArrayRef = { value: Uint8ClampedArray }

function main(): void {
    const superwhiteElem: HTMLElement =
        document.querySelector("#superwhite") ??
        (() => {
            throw new Error("could not get #superwhite")
        })()

    const ctxOptions = {
        alpha: false,
        colorSpace: "display-p3",
        desynchronized: false,
        willReadFrequently: false,
    }

    const canvas: HTMLCanvasElement =
        document.querySelector("#color-canvas") ??
        (() => {
            throw new Error("could not get #color-canvas")
        })()
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

    const glCanvas: HTMLCanvasElement =
        document.querySelector("#brightness-canvas") ??
        (() => {
            throw new Error("could not get #brightness-canvas")
        })()
    const gl: WebGL2RenderingContext =
        <WebGL2RenderingContext>glCanvas.getContext("webgl2", glOptions) ??
        (() => {
            throw new Error("cannot get WebGL2RenderingContext")
        })()

    if (!gl.getExtension("EXT_color_buffer_float")) {
        throw new Error("could not get EXT_color_buffer_float")
    }

    const programInfo = twgl.createProgramInfo(gl, [
        shaders.colorVs,
        shaders.colorFs,
    ])
    const tonemapProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.tonemapFs,
    ])
    const antialiasProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.fxaaFs,
    ])
    const colorCanvasProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.colorCanvasFs,
    ])
    const brightnessCanvasProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.brightnessCanvasFs,
    ])
    const sdrCanvasProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.sdrCanvasFs,
    ])

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

    const framebufferInfoRef1: FramebufferInfoRef = {
        value: createFramebufferInfo(gl),
    }
    const framebufferInfoRef2: FramebufferInfoRef = {
        value: createFramebufferInfo(gl),
    }

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
        framebufferInfoRef1,
        framebufferInfoRef2,
        programInfo,
        tonemapProgramInfo,
        antialiasProgramInfo,
        colorCanvasProgramInfo,
        brightnessCanvasProgramInfo,
        sdrCanvasProgramInfo,
        bufferInfo,
        fillScreenBufferInfo,
        pixelDataArrayRef,
    )
}

function render(
    renderSettings: RenderSettings,
    superwhiteElem: HTMLElement,
    ctx: CanvasRenderingContext2D,
    gl: WebGL2RenderingContext,
    framebufferInfoRef1: FramebufferInfoRef,
    framebufferInfoRef2: FramebufferInfoRef,
    programInfo: twgl.ProgramInfo,
    tonemapProgramInfo: twgl.ProgramInfo,
    antialiasProgramInfo: twgl.ProgramInfo,
    colorCanvasProgramInfo: twgl.ProgramInfo,
    brightnessCanvasProgramInfo: twgl.ProgramInfo,
    sdrCanvasProgramInfo: twgl.ProgramInfo,
    bufferInfo: twgl.BufferInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
    pixelDataArrayRef: PixelDataArrayRef,
): void {
    updateSettings(
        renderSettings,
        superwhiteElem,
        ctx.canvas,
        <HTMLCanvasElement>gl.canvas,
    )

    if (resizeCanvas(ctx.canvas)) {
        gl.canvas.width = ctx.canvas.width
        gl.canvas.height = ctx.canvas.height

        gl.deleteFramebuffer(framebufferInfoRef1.value.framebuffer)
        gl.deleteFramebuffer(framebufferInfoRef2.value.framebuffer)

        framebufferInfoRef1.value = createFramebufferInfo(gl)
        framebufferInfoRef2.value = createFramebufferInfo(gl)

        pixelDataArrayRef.value = new Uint8ClampedArray(
            4 * gl.canvas.width * gl.canvas.height,
        )
    }

    let toFramebufferInfo: twgl.FramebufferInfo
    let fromFramebufferInfo: twgl.FramebufferInfo
    ;[toFramebufferInfo, fromFramebufferInfo] = renderIntoFramebuffer(
        renderSettings,
        gl,
        framebufferInfoRef1.value,
        framebufferInfoRef2.value,
        programInfo,
        bufferInfo,
    )
    ;[toFramebufferInfo, fromFramebufferInfo] = postProcess(
        renderSettings,
        gl,
        toFramebufferInfo,
        fromFramebufferInfo,
        tonemapProgramInfo,
        antialiasProgramInfo,
        fillScreenBufferInfo,
    )

    if (renderSettings.isHdrEnabled) {
        drawToCanvasHdr(
            renderSettings,
            ctx,
            gl,
            fromFramebufferInfo,
            colorCanvasProgramInfo,
            brightnessCanvasProgramInfo,
            fillScreenBufferInfo,
            pixelDataArrayRef.value,
        )
    } else {
        drawToCanvasSdr(
            renderSettings,
            gl,
            fromFramebufferInfo,
            sdrCanvasProgramInfo,
            fillScreenBufferInfo,
        )
    }
}

function renderIntoFramebuffer(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebufferInfo1: twgl.FramebufferInfo,
    framebufferInfo2: twgl.FramebufferInfo,
    programInfo: twgl.ProgramInfo,
    bufferInfo: twgl.BufferInfo,
): [twgl.FramebufferInfo, twgl.FramebufferInfo] {
    twgl.bindFramebufferInfo(gl, framebufferInfo1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DITHER)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.useProgram(programInfo.program)

    twgl.setBuffersAndAttributes(gl, programInfo.attribSetters, bufferInfo)
    twgl.setUniforms(programInfo.uniformSetters, {
        u_transform: twgl.m4.multiply(
            perspectiveMatrix(gl, 80),
            viewMatrix([1, 0, -1], [0, 0, -4]),
        ),
    })

    gl.drawElements(
        gl.TRIANGLES,
        bufferInfo.numElements,
        bufferInfo.elementType ??
            (() => {
                throw new Error("Rendering error")
            })(),
        0,
    )

    return [framebufferInfo2, framebufferInfo1]
}

function postProcess(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
    framebufferInfo1: twgl.FramebufferInfo,
    framebufferInfo2: twgl.FramebufferInfo,
    tonemapProgramInfo: twgl.ProgramInfo,
    antialiasProgramInfo: twgl.ProgramInfo,
    fillScreenBufferInfo: twgl.BufferInfo,
): [twgl.FramebufferInfo, twgl.FramebufferInfo] {
    twgl.bindFramebufferInfo(gl, framebufferInfo1)
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
        u_reciprocal_white_point_squared: 1 / renderSettings.whitePoint ** 2,
        u_texture: framebufferInfo2.attachments[0],
    })
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

    if (!renderSettings.isAntialiasingEnabled) {
        return [framebufferInfo2, framebufferInfo1]
    }

    twgl.bindFramebufferInfo(gl, framebufferInfo2)
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
        u_texture: framebufferInfo1.attachments[0],
    })
    gl.drawArrays(gl.TRIANGLES, 0, fillScreenBufferInfo.numElements)

    return [framebufferInfo1, framebufferInfo2]
}

function drawToCanvasHdr(
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

function drawToCanvasSdr(
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

function resizeCanvas(canvas: HTMLCanvasElement): boolean {
    const rect = canvas.getBoundingClientRect()

    const width =
        Math.round(rect.right * devicePixelRatio) -
        Math.round(rect.left * devicePixelRatio)
    const height =
        Math.round(rect.bottom * devicePixelRatio) -
        Math.round(rect.top * devicePixelRatio)

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        return true
    } else {
        return false
    }
}

function createFramebufferInfo(
    gl: WebGL2RenderingContext,
): twgl.FramebufferInfo {
    return twgl.createFramebufferInfo(
        gl,
        [
            {
                internalFormat: gl.RGBA16F,
                format: gl.RGBA,
                type: gl.HALF_FLOAT,
                min: gl.NEAREST,
                mag: gl.NEAREST,
            },
            {
                format: gl.DEPTH_STENCIL,
                type: gl.DEPTH32F_STENCIL8,
            },
        ],
        gl.canvas.width,
        gl.canvas.height,
    )
}

function viewMatrix(camera: twgl.v3.Vec3, target: twgl.v3.Vec3): twgl.m4.Mat4 {
    return twgl.m4.inverse(twgl.m4.lookAt(camera, target, [0, 1, 0]))
}

function perspectiveMatrix(
    gl: WebGL2RenderingContext,
    verticalFovDeg: number,
): twgl.m4.Mat4 {
    return twgl.m4.perspective(
        verticalFovDeg * (Math.PI / 180),
        gl.canvas.width / gl.canvas.height,
        1,
        100,
    )
}

function updateSettings(
    renderSettings: RenderSettings,
    superwhiteElem: HTMLElement,
    colorCanvas: HTMLCanvasElement,
    brightnessCanvas: HTMLCanvasElement,
): void {
    renderSettings.isHdrEnabled = (<HTMLInputElement>(document.querySelector(
        "#enable-hdr",
    ) ??
        (() => {
            throw new Error("could not get #enable-hdr")
        })())).checked

    renderSettings.isAntialiasingEnabled = (<HTMLInputElement>(
        (document.querySelector("#enable-antialias") ??
            (() => {
                throw new Error("could not get #enable-antialias")
            })())
    )).checked

    const hdrWarning =
        document.querySelector("#hdr-warning") ??
        (() => {
            throw new Error("could not get #hdr-warning")
        })()
    if (window.matchMedia("(dynamic-range: high)").matches) {
        hdrWarning.textContent = ""
    } else {
        hdrWarning.textContent = "Your device or browser does not support HDR."
        renderSettings.isHdrEnabled = false
    }

    if (renderSettings.isHdrEnabled) {
        if (
            superwhiteElem.style.visibility !== "visible" ||
            colorCanvas.style.visibility !== "visible" ||
            brightnessCanvas.style["mix-blend-mode"] !== "multiply"
        ) {
            superwhiteElem.style.visibility = "visible"
            colorCanvas.style.visibility = "visible"
            brightnessCanvas.style["mix-blend-mode"] = "multiply"
        }
    } else {
        if (
            superwhiteElem.style.visibility !== "hidden" ||
            colorCanvas.style.visibility !== "hidden" ||
            brightnessCanvas.style["mix-blend-mode"] !== "normal"
        ) {
            superwhiteElem.style.visibility = "hidden"
            colorCanvas.style.visibility = "hidden"
            brightnessCanvas.style["mix-blend-mode"] = "normal"
        }
    }

    renderSettings.dynamicRange = renderSettings.isHdrEnabled ? 5.0 : 1.0
}

window.onload = main
