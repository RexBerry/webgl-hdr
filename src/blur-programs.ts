import * as twgl from "twgl.js"

import { RenderSettings } from "./common"

import { createApproxBlurShaders } from "./blur-shader"
import { textureVs } from "./shaders"

export type BlurPrograms = {
    blurRadius: number
    programs: twgl.ProgramInfo[]
}

const INITIAL_PASSES = 2

export function createBlurPrograms(
    gl: WebGL2RenderingContext,
    blurRadius: number,
): BlurPrograms {
    const programs = []

    for (const blurShader of createApproxBlurShaders(
        INITIAL_PASSES,
        blurRadius,
    )) {
        programs.push(twgl.createProgramInfo(gl, [textureVs, blurShader]))
    }

    return {
        blurRadius,
        programs,
    }
}

export function updateBlurPrograms(
    blurPrograms: BlurPrograms,
    gl: WebGL2RenderingContext,
    blurRadius: number,
): void {
    if (blurRadius === blurPrograms.blurRadius) {
        return
    }

    for (const program of blurPrograms.programs) {
        gl.deleteProgram(program)
    }

    Object.assign(blurPrograms, createBlurPrograms(gl, blurRadius))
}

export function createBloomBlurPrograms(
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
): BlurPrograms {
    const blurRadius = calculateBloomBlurRadius(
        renderSettings,
        gl.canvas.height,
    )

    const programs = []

    for (const blurShader of createApproxBlurShaders(
        INITIAL_PASSES,
        blurRadius,
    )) {
        programs.push(twgl.createProgramInfo(gl, [textureVs, blurShader]))
    }

    return {
        blurRadius,
        programs,
    }
}

export function updateBloomBlurPrograms(
    blurPrograms: BlurPrograms,
    renderSettings: RenderSettings,
    gl: WebGL2RenderingContext,
): void {
    const blurRadius = calculateBloomBlurRadius(
        renderSettings,
        gl.canvas.height,
    )

    if (blurRadius === blurPrograms.blurRadius) {
        return
    }

    for (const program of blurPrograms.programs) {
        gl.deleteProgram(program.program)
    }

    Object.assign(blurPrograms, createBlurPrograms(gl, blurRadius))
}

export function calculateBloomBlurRadius(
    renderSettings: RenderSettings,
    canvasHeight: number,
): number {
    return (
        (renderSettings.bloomRadius / 100.0) *
        canvasHeight *
        (Math.sin(renderSettings.verticalFov / 2) / Math.sin(80 / 2))
    )
}
