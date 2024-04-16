export type RenderSettings = {
    isHdrEnabled: boolean
    dynamicRange: number
    whitePoint: number
    isAntialiasingEnabled: boolean
}

export type PixelDataArrayRef = { value: Uint8ClampedArray }

export const ELEMENT_IDS = Object.freeze({
    superwhite: "superwhite",
    colorCanvas: "color-canvas",
    brightnessCanvas: "brightness-canvas",
    hdrToggle: "enable-hdr",
    antialiasToggle: "enable-antialias",
    hdrWarning: "hdr-warning",
})
