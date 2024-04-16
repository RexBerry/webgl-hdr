import { ELEMENT_IDS, RenderSettings } from "./common"

export function getElement(id: string): HTMLElement {
    return (
        document.querySelector(`#${id}`) ??
        (() => {
            throw new Error(`could not get #${id}`)
        })()
    )
}

export function resizeCanvas(canvas: HTMLCanvasElement): boolean {
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

export function updateSettings(
    renderSettings: RenderSettings,
    superwhiteElem: HTMLElement,
    colorCanvas: HTMLCanvasElement,
    brightnessCanvas: HTMLCanvasElement,
): void {
    renderSettings.isHdrEnabled = (<HTMLInputElement>(
        getElement(ELEMENT_IDS.hdrToggle)
    )).checked

    renderSettings.isAntialiasingEnabled = (<HTMLInputElement>(
        getElement(ELEMENT_IDS.antialiasToggle)
    )).checked

    const hdrWarning = getElement(ELEMENT_IDS.hdrWarning)
    let hdrWarningText: string

    if (window.matchMedia("(dynamic-range: high)").matches) {
        hdrWarningText = ""
    } else {
        hdrWarningText = "Your device or browser does not support HDR."
        renderSettings.isHdrEnabled = false
    }

    if (hdrWarning.textContent !== hdrWarningText) {
        hdrWarning.textContent = hdrWarningText
    }

    if (renderSettings.isHdrEnabled) {
        if (
            superwhiteElem.style.visibility !== "visible" ||
            colorCanvas.style.visibility !== "visible" ||
            // @ts-ignore
            brightnessCanvas.style["mix-blend-mode"] !== "multiply"
        ) {
            superwhiteElem.style.visibility = "visible"
            colorCanvas.style.visibility = "visible"
            // @ts-ignore
            brightnessCanvas.style["mix-blend-mode"] = "multiply"
        }
    } else {
        if (
            superwhiteElem.style.visibility !== "hidden" ||
            colorCanvas.style.visibility !== "hidden" ||
            // @ts-ignore
            brightnessCanvas.style["mix-blend-mode"] !== "normal"
        ) {
            superwhiteElem.style.visibility = "hidden"
            colorCanvas.style.visibility = "hidden"
            // @ts-ignore
            brightnessCanvas.style["mix-blend-mode"] = "normal"
        }
    }

    renderSettings.dynamicRange = renderSettings.isHdrEnabled ? 5.0 : 1.0
}
