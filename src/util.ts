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

class Queue<T> {
    _data: (T | null)[]
    _frontIdx: number
    _backIdx: number
    _size: number

    constructor() {
        this._data = []
        this._frontIdx = 0
        this._backIdx = 0
        this._size = 0
    }

    front(): T {
        return <T>this._data[this._frontIdx]
    }

    // queue must not be empty
    back(): T {
        const idx = this._backIdx === 0
            ? this._data.length - 1
            : this._backIdx - 1

        return <T>this._data[idx]
    }

    enqueue(value: T): void {
        if (this._data.length === 0) {
            this._data = Array(4).fill(null)
            this._frontIdx = 0
            this._backIdx = 0
        } else if (this._size === this._data.length) {
            this._data = this._data
                .slice(this._frontIdx)
                .concat(this._data.slice(0, this._backIdx))
                .concat(Array(this._data.length).fill(null))
            this._frontIdx = 0
            this._backIdx = this._size
        }

        this._data[this._backIdx++] = value

        if (this._backIdx === this._data.length) {
            this._backIdx = 0
        }

        ++this._size
    }

    // queue must not be empty
    dequeue(): T {
        const value = <T>this._data[this._frontIdx]
        this._data[this._frontIdx++] = null

        if (this._frontIdx === this._data.length) {
            this._frontIdx = 0
        }

        --this._size

        return value
    }

    get length(): number {
        return this._size
    }
}

const frameTimes: Queue<number> = new Queue()

export function updateFpsCounter() {
    frameTimes.enqueue(performance.now())

    if (frameTimes.back() === frameTimes.front()) {
        return
    }

    while (frameTimes.back() - frameTimes.front() > 2000) {
        frameTimes.dequeue()
    }

    const fpsCounter = getElement(ELEMENT_IDS.fpsCounter)

    const fps =
        (frameTimes.length - 1) /
        ((frameTimes.back() - frameTimes.front()) / 1000)

    const fpsCounterText = `Frames per second: ${Math.round(fps)}`

    if (fpsCounter.textContent !== fpsCounterText) {
        fpsCounter.textContent = fpsCounterText
    }
}
