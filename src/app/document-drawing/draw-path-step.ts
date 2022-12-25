import { Layer } from '../document-data'
import { CanvasRenderBlendMode } from '../render'
import { ViewKeyframeLayer } from '../view'
import { DrawPathOperationTypeID } from './draw-path'
import { DrawPathCompositionBuffer } from './draw-path-buffer'
import { DrawPathRenderCache } from './draw-path-render-cache'

export class DrawPathStep {

  operationType = DrawPathOperationTypeID.none
  compositeOperation = CanvasRenderBlendMode.default
  layer: Layer = null
  viewKeyframeLayer: ViewKeyframeLayer = null

  buffer: DrawPathCompositionBuffer = null
  renderCache = new DrawPathRenderCache()
  useCache = false
  needsUpdateCache = false
  needsRedraw = false

  _debugText = ''
  _debugText2 = ''

  isCacheEnabled() {

    return (this.useCache && this.renderCache.isInitialized())
  }
}
