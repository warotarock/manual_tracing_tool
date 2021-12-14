import { CanvasWindow } from '../render/render2d'
import { DrawPathContext, DrawPathOperationTypeID } from './draw_path'

export class DrawingBuffer {

  canvasWindow: CanvasWindow = null
}

export class DrawPathBufferingLogic {

  prepareDrawingBuffer(buffer: DrawingBuffer, baseCanvasWindow: CanvasWindow) {

    if (!this.isBufferChanged(buffer, baseCanvasWindow)) {
      return
    }

    const canvasWindow = new CanvasWindow()
    canvasWindow.createCanvas()
    canvasWindow.setCanvasSize(baseCanvasWindow.width, baseCanvasWindow.height)
    canvasWindow.initializeContext()

    buffer.canvasWindow = canvasWindow
  }

  prepareDrawPathBuffers(drawPathContext: DrawPathContext, baseCanvasWindow: CanvasWindow, isExporting: boolean = false) {

    for (const drawPathStep of drawPathContext.steps) {

      if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

        const buffer = drawPathStep.getBuffer()

        this.prepareDrawingBuffer(buffer, baseCanvasWindow)
      }
    }
  }

  private isBufferChanged(buffer: DrawingBuffer, baseCanvasWindow: CanvasWindow) {

    return (
      buffer.canvasWindow == null
      || buffer.canvasWindow.width != baseCanvasWindow.width
      || buffer.canvasWindow.height != baseCanvasWindow.height)
  }
}
