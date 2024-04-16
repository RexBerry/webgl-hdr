import * as twgl from "twgl.js"

import * as shaders from "./shaders"

export type GLPrograms = {
    sceneProgramInfo: twgl.ProgramInfo,
    tonemapProgramInfo: twgl.ProgramInfo,
    antialiasProgramInfo: twgl.ProgramInfo,
    colorCanvasProgramInfo: twgl.ProgramInfo,
    brightnessCanvasProgramInfo: twgl.ProgramInfo,
    sdrCanvasProgramInfo: twgl.ProgramInfo,
}

export function initGlPrograms(gl: WebGL2RenderingContext): GLPrograms {
    const sceneProgramInfo = twgl.createProgramInfo(gl, [
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

    return {
        sceneProgramInfo,
        tonemapProgramInfo,
        antialiasProgramInfo,
        colorCanvasProgramInfo,
        brightnessCanvasProgramInfo,
        sdrCanvasProgramInfo,
    }
}
