import { int } from '../common-logics'
import { Layer, VectorLayerGeometry } from '../document-data'
import { CanvasWindow } from '../render'
import { ViewKeyframeLayer } from '../view'
import { DrawPathOperationTypeID } from './draw-path'

export class DrawPathRenderMaskData {

  data: Uint8Array = null
  width = 0.0
  height = 0.0
  lineBytes = 0
  pixelBytes = 0

  createDataArray(width: int, height: int) {

    this.data = new Uint8Array(width * height)
    this.width = width
    this.height = height
    this.pixelBytes = 1
    this.lineBytes = this.pixelBytes * width
  }

  clear() {

    this.data.fill(0)
  }
}

export class DrawPathRenderMaskImageData {

  canvasWindow = new CanvasWindow()
  imageData: ImageData = null
  width = 0.0
  height = 0.0
  lineBytes = 0
  pixelBytes = 0

  clear() {

    this.imageData.data.fill(0)
  }
}

export class DrawPathRenderCacheRelatedData {

  geometries: VectorLayerGeometry[] = null
}

export class DrawPathRenderCache {

  isUsed = false
  layer: Layer = null
  drawPathOperationType = DrawPathOperationTypeID.none
  canvasWindow: CanvasWindow = null
  maskData: DrawPathRenderMaskData = null
  maskImageData: DrawPathRenderMaskImageData = null
  relatedData: DrawPathRenderCacheRelatedData = null
  width: int = 0
  height: int = 0
  location = vec2.fromValues(0.0 , 0.0)

  isInitialized() {

    return (this.canvasWindow != null)
  }

  free() {

    this.isUsed = false
    this.canvasWindow = null
    this.maskData = null
    this.maskImageData = null
    this.relatedData = null
    this.width = 0
    this.height = 0
    vec2.set(this.location, 0.0, 0.0)
  }

  clearMaskData() {

    this.maskData.clear()
  }
}

export class DrawPathRenderCacheStore {

  caches: DrawPathRenderCache[] = []

  clearUsedFlags() {

    for (const cache of this.caches) {

      cache.isUsed = false
    }
  }

  getCache(layer: Layer, drawPathOperationType: DrawPathOperationTypeID): DrawPathRenderCache {

    let cache = this.caches.find(cache =>
      cache.isUsed == false
      && cache.layer == layer
      && cache.drawPathOperationType == drawPathOperationType
    ) ?? null

    if (cache == null) {

      cache = new DrawPathRenderCache()
      cache.layer = layer
      cache.drawPathOperationType = drawPathOperationType
      this.caches.push(cache)
    }

    cache.isUsed = true

    return cache
  }

  freeUnusedBuffers() {

    this.caches = this.caches.filter(buffer => buffer.isUsed)
  }
}
