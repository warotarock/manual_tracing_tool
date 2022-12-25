import { int } from "../common-logics"
import { CanvasWindow } from "../render"
import { DOMValueLogic } from "./dom-value"

export class DOMResizingLogic {

  dom = new DOMValueLogic()

  resizeCanvasToParent(canvasWindow: CanvasWindow, withStyle = true) {

    const rect = canvasWindow.canvas.parentElement.getBoundingClientRect()

    // console.log(`resizeCanvasToParent width:${rect.width} height:${rect.height}`)

    this.setCanvasElementSize(canvasWindow, rect.width, rect.height)

    if (withStyle) {

      this.setCanvasElementStyle(canvasWindow, rect.width, rect.height)
    }
  }

  resizeCanvasToBoundingClientRect(canvasWindow: CanvasWindow, withStyle = true) {

    const rect = canvasWindow.canvas.getBoundingClientRect()

    // console.log(`resizeByStyle width:${rect.width} height:${rect.height}`)

    this.setCanvasElementSize(canvasWindow, rect.width, rect.height)

    if (withStyle) {

      this.setCanvasElementStyle(canvasWindow, rect.width, rect.height)
    }
  }

  resizeCanvasToCanvasWindow(canvasWindow: CanvasWindow, fitToWindow: CanvasWindow, scale: int) {

    canvasWindow.width = fitToWindow.width * scale
    canvasWindow.height = fitToWindow.height * scale

    canvasWindow.canvas.width = canvasWindow.width
    canvasWindow.canvas.height = canvasWindow.height

    canvasWindow.canvas.style.width = fitToWindow.canvas.style.width
    canvasWindow.canvas.style.height = fitToWindow.canvas.style.height
  }

  private setCanvasElementSize(canvasWindow: CanvasWindow, width: int, height: int) {

    // console.log(`setCanvasElementSize devicePixelRatio:${window.devicePixelRatio} width:${width} height:${height}`)

    canvasWindow.width = Math.floor(width * canvasWindow.devicePixelRatio)
    canvasWindow.height = Math.floor(height *  canvasWindow.devicePixelRatio)

    if (canvasWindow.canvas.width != canvasWindow.width
      || canvasWindow.canvas.height != canvasWindow.height) {

      canvasWindow.canvas.width = canvasWindow.width
      canvasWindow.canvas.height = canvasWindow.height
    }
  }

  private setCanvasElementStyle(canvasWindow: CanvasWindow, width: int, height: int) {

    canvasWindow.canvas.style.width = `${width}px`
    canvasWindow.canvas.style.height = `${height}px`
  }

  fitFixedPositionToBoundingClientRect(target_ID: string, destination_ID: string, withWidth = true, withHeight = true) {

    const target = this.dom.getElement(target_ID)
    const destination = this.dom.getElement(destination_ID)
    const rect = destination.getBoundingClientRect()

    target.style.top = `${rect.top}px`
    target.style.left = `${rect.left}px`

    if (withWidth) {
      target.style.width = `${rect.width}px`
    }

    if (withHeight) {
      target.style.height = `${rect.height}px`
    }
  }
}
