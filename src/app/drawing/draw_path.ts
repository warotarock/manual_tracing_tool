import { DocumentData, Layer } from '../document_data'
import { LazyProcess } from '../logics/lazy_process'
import { CanvasWindow } from '../render/render2d'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { DrawingBuffer } from './draw_path_buffering'

export enum TempVirtualLayerTypeID {

  none = 0,
  normal = 1,
  virtualGroup = 2,
}

export class TempVirtualLayer {

  type = TempVirtualLayerTypeID.none
  layer: Layer = null
  children: TempVirtualLayer[] = []
}

export enum DrawPathOperationTypeID {

  none = 0,
  beginDrawing,
  endDrawing,
  drawForeground,
  drawBackground,
  prepareRendering,
  flushRendering,
  prepareBuffer,
  flushBuffer
}

export enum DrawPathModeID {

  none = 0,
  editor = 1,
  editorPreview = 2,
  export = 3,
  exportRendering = 4
}

export class DrawPathContext {

  documentData: DocumentData = null

  steps: DrawPathStep[] = []

  activeDrawPathStartIndex = -1
  activeDrawPathEndIndex = -1

  drawPathModeID = DrawPathModeID.none
  drawCPUOnly = true
  isEditModeDraw = false
  redrawActiveLayerOnly = false
  currentLayerOnly = false
  isModalToolRunning = false
  startIndex = 0
  endIndex = 0
  lastDrawPathIndex = -1
  bufferStack: CanvasWindow[] = []

  buffer = new DrawingBuffer()
  lazyProcess = new LazyProcess()

  clearDrawingStates() {

    this.lastDrawPathIndex = -1

    if (this.bufferStack.length > 0) {

      this.bufferStack = []
    }
  }

  isLastDrawExist(): boolean {

    return (this.lastDrawPathIndex != -1)
  }

  isFinished(): boolean {

    return (this.lazyProcess.processedIndex >= this.steps.length - 1)
  }

  isFullRendering(): boolean {

    return (this.drawPathModeID == DrawPathModeID.editorPreview
      || this.drawPathModeID == DrawPathModeID.exportRendering)
  }

  isEditMode(): boolean {

    return (this.isEditModeDraw)
  }

  isExporting(): boolean {

    return (this.drawPathModeID == DrawPathModeID.export
      || this.drawPathModeID == DrawPathModeID.exportRendering)
  }

  isIncremental(): boolean {

    return (this.drawPathModeID == DrawPathModeID.editorPreview)
  }

  getCurrentBuffer(): CanvasWindow {

    if (this.bufferStack.length == 0) {

      throw new Error('ERROR 0601:バッファスタックがありません。')
    }

    return this.bufferStack[this.bufferStack.length - 1]
  }
}

export class DrawPathStep {

  _debugText = ''

  layer: Layer = null
  viewKeyframeLayer: ViewKeyframeLayer = null
  buffer = new DrawingBuffer()

  operationType = DrawPathOperationTypeID.none
  compositeOperation: 'source-over' | 'source-atop' = 'source-over'

  setType(operationType: DrawPathOperationTypeID) {

    this.operationType = operationType
    this._debugText = DrawPathOperationTypeID[operationType]
  }

  getBuffer() {

    return this.buffer
  }
}
