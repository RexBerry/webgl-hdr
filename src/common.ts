export type RenderSettings = {
    isHdrEnabled: boolean
    dynamicRange: number
    whitePoint: number
    isAntialiasingEnabled: boolean
}

export const ELEMENT_IDS = Object.freeze({
    superwhite: "superwhite",
    colorCanvas: "color-canvas",
    brightnessCanvas: "brightness-canvas",
    hdrToggle: "enable-hdr",
    antialiasToggle: "enable-antialias",
    hdrWarning: "hdr-warning",
    displayP3ToSrgbFilter: "display-p3-to-srgb",
})
