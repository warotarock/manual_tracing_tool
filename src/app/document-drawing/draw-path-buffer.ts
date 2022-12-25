import { int } from '../common-logics'
import { CanvasWindow } from '../render'

export class DrawPathCompositionBuffer {

  isUsed = false
  canvasWindow: CanvasWindow = null
  width = 0.0
  height = 0.0
}

export class DrawPathBufferStore {

  buffers: DrawPathCompositionBuffer[] = []

  clearBufferUsedFlags() {

    for (const buffer of this.buffers) {

      buffer.isUsed = false
    }
  }

  getBufferForCanvas(canvasWindow: CanvasWindow): DrawPathCompositionBuffer {

    return this.getBuffer(canvasWindow.width, canvasWindow.height)
  }

  getBuffer(width: int, height: int): DrawPathCompositionBuffer {

    let buffer = this.buffers.find(buffer =>
      buffer.isUsed == false
      && buffer.width == width
      && buffer.height == height
    ) ?? null

    if (buffer == null) {

      buffer = new DrawPathCompositionBuffer()
      this.buffers.push(buffer)
    }

    buffer.isUsed = true

    return buffer
  }

  freeUnusedBuffers() {

    this.buffers = this.buffers.filter(buffer => buffer.isUsed)
  }
}
