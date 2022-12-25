import { LazyUpdateState } from '../deffered-process'
import { DocumentData } from '../document-data'
import { CanvasRender, CanvasWindow } from '../render'
import { DrawPathBufferStore, DrawPathCompositionBuffer } from './draw-path-buffer'
import { DrawPathRenderCacheStore } from './draw-path-render-cache'
import { DrawPathStep } from './draw-path-step'

export class DrawPathContext {

  drawPathModeID = DrawPathModeID.none
  steps: DrawPathStep[] = []
  onionSkinLevel = 0
  maxOnionSkinLevel = 0

  render: CanvasRender = null
  local_render: CanvasRender = null
  documentData: DocumentData = null
  drawCPUOnly = true
  isEditModeDraw = false
  redrawActiveLayerOnly = false
  currentLayerOnly = false
  isModalToolRunning = false
  activeDrawPathStartIndex = -1
  activeDrawPathEndIndex = -1
  startIndex = 0
  endIndex = 0
  lastDrawPathIndex = -1
  isNonActiveLayerBufferDrawingDone = false
  bufferStack: CanvasWindow[] = []

  bufferStore = new DrawPathBufferStore()
  renderCacheStore = new DrawPathRenderCacheStore()
  lazyDraw_compositionBuffer = new DrawPathCompositionBuffer()
  lazyUpdateState: LazyUpdateState = null

  clearDrawingStates() {

    this.lastDrawPathIndex = -1

    if (this.bufferStack.length > 0) {

      this.bufferStack = []
    }
  }

  existsDrawnStepsAtLastTime(): boolean {

    return (this.lastDrawPathIndex != -1)
  }

  isEditMode(): boolean {

    return (this.isEditModeDraw)
  }

  isFinished(): boolean {

    return (this.lazyUpdateState.processedIndex >= this.steps.length - 1)
  }

  isFullRendering(): boolean {

    return (this.drawPathModeID == DrawPathModeID.exportRendering)
  }

  isExporting(): boolean {

    return (this.drawPathModeID == DrawPathModeID.export
      || this.drawPathModeID == DrawPathModeID.exportRendering)
  }

  isLazyUpdate(): boolean {

    return (this.drawPathModeID == DrawPathModeID.lazyUpdate)
  }

  isOnionSkin(): boolean {

    return (
      this.drawPathModeID == DrawPathModeID.onionSkinBackward
      || this.drawPathModeID == DrawPathModeID.onionSkinForward
    )
  }

  getCurrentBuffer(): CanvasWindow {

    if (this.bufferStack.length == 0) {

      throw new Error('ERROR 0601:バッファスタックがありません。')
    }

    return this.bufferStack[this.bufferStack.length - 1]
  }

  log(tag: any) {

    console.log(tag, {startIndex: this.startIndex, endIndex: this.endIndex})
  }
}

export enum DrawPathOperationTypeID {

  none = 0,
  startDrawPaths,
  finishDrawPaths,
  drawForeground,
  drawBackground,
  prepareRenderingForeground,
  flushRenderingForeground,
  prepareBuffer,
  flushBuffer
}

export enum DrawPathModeID {

  none = 0,
  editor = 1,
  lazyUpdate = 2,
  export = 3,
  exportRendering = 4,
  onionSkinBackward = 5,
  onionSkinForward = 6
}
