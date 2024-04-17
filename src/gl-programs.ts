import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import { BlurPrograms, createBloomBlurPrograms } from "./blur-programs"
import * as shaders from "./shaders"

export type GLPrograms = {
    sceneProgramInfo: twgl.ProgramInfo
    bloomExtractBrightProgramInfo: twgl.ProgramInfo
    bloomBlurPrograms: BlurPrograms
    bloomCompositeProgramInfo: twgl.ProgramInfo
    tonemapProgramInfo: twgl.ProgramInfo
    antialiasProgramInfo: twgl.ProgramInfo
    colorCanvasProgramInfo: twgl.ProgramInfo
    brightnessCanvasProgramInfo: twgl.ProgramInfo
    sdrCanvasProgramInfo: twgl.ProgramInfo
}

export function initGlPrograms(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
): GLPrograms {
    const sceneProgramInfo = twgl.createProgramInfo(gl, [
        shaders.colorVs,
        shaders.colorFs,
    ])
    const bloomExtractBrightProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.bloomExtractBrightFs,
    ])
    const bloomBlurPrograms = createBloomBlurPrograms(renderSettings, gl)
    const bloomCompositeProgramInfo = twgl.createProgramInfo(gl, [
        shaders.textureVs,
        shaders.bloomCompositeFs,
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
        bloomExtractBrightProgramInfo,
        bloomBlurPrograms,
        bloomCompositeProgramInfo,
        tonemapProgramInfo,
        antialiasProgramInfo,
        colorCanvasProgramInfo,
        brightnessCanvasProgramInfo,
        sdrCanvasProgramInfo,
    }
}
