import { int } from 'app/common-logics'
import { DocumentContext, SubToolContext } from '../context'
import { Layer } from '../document-data'
import { LayerWindow } from '../ui'
import { ViewLayerListItem, ViewLayerListLogic } from './view-layer-list'

export class LayerHighlightingLogic {

  private viewLayerList: ViewLayerListLogic = null

  private selectCurrentLayerAnimationStarted = false
  private selectCurrentLayerAnimationLayer: Layer = null
  private selectCurrentLayerAnimationTime = 0.0
  private selectCurrentLayerAnimationTimeMax = 0.4

  link(viewLayerList: ViewLayerListLogic) {

    this.viewLayerList = viewLayerList
  }

  startShowingLayerItem(item: ViewLayerListItem, ctx: SubToolContext) {

    if (item == null) {
      return
    }

    this.selectCurrentLayerAnimationLayer = item.layer
    this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax
    this.selectCurrentLayerAnimationStarted = false

    ctx.setRedrawMainWindowEditorWindow()
    ctx.setRedrawWebGLWindow()
    ctx.setRedrawLayerWindow()
    ctx.setRedrawRibbonUI()
  }

  startShowingCurrentLayer(docContext: DocumentContext, ctx: SubToolContext) {

    const item = this.viewLayerList.findItemForLayer(docContext, docContext.currentLayer)

    this.startShowingLayerItem(item, ctx)
  }

  processHighlightingAnimation(elapsedTime: int, ctx: SubToolContext) {

    if (this.selectCurrentLayerAnimationTime == 0) {
      return
    }

    if (this.selectCurrentLayerAnimationStarted == false) {

      this.selectCurrentLayerAnimationStarted = true
      return
    }

    this.selectCurrentLayerAnimationTime -= elapsedTime / 1000.0

    if (this.selectCurrentLayerAnimationTime <= 0) {

      this.selectCurrentLayerAnimationTime = 0

      ctx.setRedrawMainWindow()
      ctx.setRedrawWebGLWindow()
    }
  }

  isAnimatingLayer(layer: Layer): boolean {

    return (layer == this.selectCurrentLayerAnimationLayer)
  }

  isAnimating(): boolean {

    return (this.selectCurrentLayerAnimationTime > 0.0)
  }
}
