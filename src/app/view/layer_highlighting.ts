import {  } from '../logics/conversion'
import { Layer } from '../document_data'
import { DocumentContext } from '../context/document_context'
import { SubToolContext } from '../context/subtool_context'
import { LayerWindow } from '../window/layer_window'
import { ViewLayerListItem, ViewLayerListLogic } from './view_layer_list'

export class LayerHighlightingLogic {

  private layerWindow: LayerWindow = null
  private viewLayerList: ViewLayerListLogic = null

  private selectCurrentLayerAnimationLayer: Layer = null
  private selectCurrentLayerAnimationTime = 0.0
  private selectCurrentLayerAnimationTimeMax = 0.4

  link(layerWindow: LayerWindow, viewLayerList: ViewLayerListLogic) {

    this.layerWindow = layerWindow
    this.viewLayerList = viewLayerList
  }

  startShowingLayerItem(item: ViewLayerListItem, ctx: SubToolContext) {

    if (item == null) {
      return
    }

    this.selectCurrentLayerAnimationLayer = item.layer
    this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax

    this.layerWindow.scrollToItem(item)

    ctx.setRedrawMainWindowEditorWindow()
    ctx.setRedrawWebGLWindow()
    ctx.setRedrawLayerWindow()
    ctx.setRedrawRibbonUI()
  }

  startShowingCurrentLayer(docContext: DocumentContext, ctx: SubToolContext) {

    const item = this.viewLayerList.findItemForLayer(docContext, docContext.currentLayer)

    this.startShowingLayerItem(item, ctx)
  }

  processHighlightingAnimation(elapsedTime, ctx: SubToolContext) {

    if (this.selectCurrentLayerAnimationTime > 0) {

      this.selectCurrentLayerAnimationTime -= elapsedTime / 1000.0

      if (this.selectCurrentLayerAnimationTime <= 0) {

        this.selectCurrentLayerAnimationTime = 0

        ctx.setRedrawMainWindow()
        ctx.setRedrawWebGLWindow()
      }
    }
  }

  isAnimatingLayer(layer: Layer): boolean {

    return (layer == this.selectCurrentLayerAnimationLayer)
  }

  isAnimating(): boolean {

    return (this.selectCurrentLayerAnimationTime > 0.0)
  }
}
