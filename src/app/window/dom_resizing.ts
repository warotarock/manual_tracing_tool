import { int } from "../logics/conversion"
import { CanvasWindow } from "../render/render2d"

export class DOMResizingLogic {

  resizeCanvasToParent(canvasWindow: CanvasWindow) {

    const rect = canvasWindow.canvas.parentElement.getBoundingClientRect()

    canvasWindow.width = rect.width
    canvasWindow.height = rect.height

    canvasWindow.canvas.width = canvasWindow.width
    canvasWindow.canvas.height = canvasWindow.height
  }

  resizeCanvasToClientSize(canvasWindow: CanvasWindow) {

    canvasWindow.width = canvasWindow.canvas.clientWidth
    canvasWindow.height = canvasWindow.canvas.clientHeight

    canvasWindow.canvas.width = canvasWindow.width
    canvasWindow.canvas.height = canvasWindow.height
  }

  fitCanvas(canvasWindow: CanvasWindow, fitToWindow: CanvasWindow, scale: int) {

    canvasWindow.width = fitToWindow.width * scale
    canvasWindow.height = fitToWindow.height * scale

    canvasWindow.canvas.width = canvasWindow.width
    canvasWindow.canvas.height = canvasWindow.height
  }

  setCanvasSizeFromStyle(canvasWindow: CanvasWindow) {

    const rect = canvasWindow.canvas.getBoundingClientRect()

    canvasWindow.width = rect.width
    canvasWindow.height = rect.height
  }

  resizeByStyle(canvasWindow: CanvasWindow) {

    this.setCanvasSizeFromStyle(canvasWindow)

    canvasWindow.canvas.width = canvasWindow.width
    canvasWindow.canvas.height = canvasWindow.height
  }
}
