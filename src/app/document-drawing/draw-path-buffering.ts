import { int } from '../common-logics'
import { Layer, VectorLayer } from '../document-data'
import { CanvasWindow } from '../render'
import { ViewKeyframe, ViewKeyframeLayer } from '../view'
import { DrawPathContext, DrawPathOperationTypeID } from './draw-path'
import { DrawPathCompositionBuffer } from './draw-path-buffer'
import { DrawPathRenderCacheRelatedData, DrawPathRenderMaskData, DrawPathRenderMaskImageData } from './draw-path-render-cache'
import { DrawPathStep } from './draw-path-step'

export class DrawPathBufferingLogic {

  prepareForLazyDrawComposition(drawPathContext: DrawPathContext, width: int, height: int, isExporting: boolean) {

    drawPathContext.lazyDraw_compositionBuffer = this.createOrUpdateCompositionCanvas(drawPathContext.lazyDraw_compositionBuffer, width, height, isExporting, drawPathContext)
  }

  prepareDrawPathBuffers(drawPathContext: DrawPathContext, drawTo_CanvasWindow: CanvasWindow, isExporting: boolean = false) {

    drawPathContext.bufferStore.clearBufferUsedFlags()

    for (const drawPathStep of drawPathContext.steps) {

      if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

        this.prepareForLayerComposition(drawPathStep, drawTo_CanvasWindow, isExporting, drawPathContext)
      }
    }

    drawPathContext.bufferStore.freeUnusedBuffers()
  }

  private prepareForLayerComposition(drawPathStep: DrawPathStep, drawTo_CanvasWindow: CanvasWindow, isExporting: boolean, drawPathContext: DrawPathContext) {

    drawPathStep.buffer = this.createOrUpdateCompositionCanvas(drawPathStep.buffer, drawTo_CanvasWindow.width, drawTo_CanvasWindow.height, isExporting, drawPathContext)
  }

  private createOrUpdateCompositionCanvas(buffer: DrawPathCompositionBuffer, width: int, height: int, isExporting: boolean, drawPathContext: DrawPathContext) {

    const needsUpdateBufferCanvas = (
      buffer == null
      || buffer.canvasWindow == null
      || buffer.width != width
      || buffer.height != height
    )

    if (!needsUpdateBufferCanvas) {
      return
    }

    if (isExporting) {

      buffer = new DrawPathCompositionBuffer()
    }
    else {

      buffer = drawPathContext.bufferStore.getBuffer(width, height)
    }

    const canvasWindow = new CanvasWindow()
    canvasWindow.createCanvas(width, height)

    buffer.canvasWindow = canvasWindow
    buffer.width = width
    buffer.height = height

    return buffer
  }

  setUpdateCacheToDrawPathSteps(layer: Layer, drawPathContext: DrawPathContext, needsRedraw: boolean) {

    for (const drawPathStep of drawPathContext.steps) {

      if (drawPathStep.layer == layer) {

        drawPathStep.needsUpdateCache = true
        drawPathStep.needsRedraw = drawPathStep.needsRedraw || needsRedraw
      }
    }
  }

  updateRenderCaches(drawPathContext: DrawPathContext, viewKeyframe: ViewKeyframe) {

    for (const drawPathStep of drawPathContext.steps) {

      if (!drawPathStep.needsUpdateCache) {
        continue
      }

      if (VectorLayer.isPointBrushFillLayer(drawPathStep.layer)) {

        const isCacheChanged = this.updateCacheForVectorLayer(drawPathStep, drawPathContext)

        if (isCacheChanged) {

          drawPathStep.needsRedraw = true
        }

        if (drawPathStep.renderCache.isInitialized()) {

          if (drawPathStep.renderCache.relatedData == null) {

            drawPathStep.renderCache.relatedData = new DrawPathRenderCacheRelatedData()
          }

          drawPathStep.renderCache.relatedData.geometries = []

          for (const vkfLayer of viewKeyframe.layers) {

            if (vkfLayer.layer == drawPathStep.layer
              || vkfLayer.layer.runtime.parentLayer != drawPathStep.layer.runtime.parentLayer) {
              continue
            }

            if (VectorLayer.isVectorStrokeLayer(vkfLayer.layer)) {

              drawPathStep.renderCache.relatedData.geometries.push(vkfLayer.vectorLayerKeyframe.geometry)

              const vectorLaye = <VectorLayer>vkfLayer.layer

              if (vectorLaye.eyesSymmetryEnabled && vectorLaye.runtime.eyesSymmetryGeometry != null) {

                drawPathStep.renderCache.relatedData.geometries.push(vectorLaye.runtime.eyesSymmetryGeometry)
              }
            }
          }
        }
      }
    }
  }

  private updateCacheForVectorLayer(drawPathStep: DrawPathStep, drawPathContext: DrawPathContext): boolean {

    const geometry = drawPathStep.viewKeyframeLayer.vectorLayerKeyframe.geometry

    if (!geometry.runtime.area.existsValidArea()) {

      if (drawPathStep.renderCache.isInitialized()) {

        drawPathStep.renderCache.free()
      }

      return false
    }

    const width = geometry.runtime.area.getBitmapWidth()
    const height = geometry.runtime.area.getBitmapHeight()

    const needsCacheReallocate = (
      drawPathStep.renderCache.canvasWindow == null
      || drawPathStep.renderCache.maskData == null
      || drawPathStep.renderCache.width != width
      || drawPathStep.renderCache.height != height
    )

    const needsUpdate = (
      needsCacheReallocate
      || drawPathStep.renderCache.location[0] != geometry.runtime.area.left
      || drawPathStep.renderCache.location[1] != geometry.runtime.area.top
    )

    if (!needsUpdate) {
      return false
    }

    if (needsCacheReallocate) {

      const new_renderCache = drawPathContext.renderCacheStore.getCache(drawPathStep.layer, drawPathStep.operationType)

      const canvasWindow = new CanvasWindow()
      canvasWindow.createCanvas(width, height)

      new_renderCache.canvasWindow = canvasWindow
      new_renderCache.width = width
      new_renderCache.height = height

      const maskData = new DrawPathRenderMaskData()
      maskData.createDataArray(width, height)

      new_renderCache.maskData = maskData

      new_renderCache.maskImageData = new DrawPathRenderMaskImageData()
      new_renderCache.maskImageData.canvasWindow.createCanvas(width, height)
      new_renderCache.maskImageData.imageData = canvasWindow.context.createImageData(width, height)
      new_renderCache.maskImageData.pixelBytes = 4
      new_renderCache.maskImageData.lineBytes = new_renderCache.maskImageData.pixelBytes * width

      drawPathStep.renderCache = new_renderCache
    }

    drawPathStep.renderCache.location[0] = geometry.runtime.area.left
    drawPathStep.renderCache.location[1] = geometry.runtime.area.top

    drawPathStep.renderCache.canvasWindow.viewLocation[0] = drawPathStep.renderCache.location[0]
    drawPathStep.renderCache.canvasWindow.viewLocation[1] = drawPathStep.renderCache.location[1]

    return true
  }

  updateAllRenderCaches(drawPathContext: DrawPathContext, viewKeyframe: ViewKeyframe) {

    drawPathContext.renderCacheStore.clearUsedFlags()

    for (const viewKeyframeLayer of viewKeyframe.layers) {

      this.setUpdateCacheToDrawPathSteps(viewKeyframeLayer.layer, drawPathContext, true)
    }

    this.updateRenderCaches(drawPathContext, viewKeyframe)

    drawPathContext.renderCacheStore.freeUnusedBuffers()
  }
}
