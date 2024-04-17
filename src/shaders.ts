import colorVs from "./shaders/color.vert?raw"
import textureVs from "./shaders/texture.vert?raw"
import colorFs from "./shaders/color.frag?raw"
import bloomExtractBrightFs from "./shaders/bloom_extract_bright.frag?raw"
import bloomCompositeFs from "./shaders/bloom_composite.frag?raw"
import tonemapFs from "./shaders/tonemap.frag?raw"
import fxaaFs from "./shaders/fxaa.frag?raw"
import colorCanvasFs from "./shaders/color_canvas.frag?raw"
import brightnessCanvasFs from "./shaders/brightness_canvas.frag?raw"
import sdrCanvasFs from "./shaders/sdr_canvas.frag?raw"

export {
    colorVs,
    textureVs,
    colorFs,
    bloomExtractBrightFs,
    bloomCompositeFs,
    tonemapFs,
    fxaaFs,
    colorCanvasFs,
    brightnessCanvasFs,
    sdrCanvasFs,
}
