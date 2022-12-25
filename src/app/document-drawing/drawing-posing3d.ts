import { Layer, PosingLayer } from '../document-data'
import { Posing3DView } from '../posing3d'
import { CanvasWindow, WebGLRender } from '../render'
import { MainToolID } from '../tool'
import { ViewLayerListItem } from '../view'
import { DocumentContext } from '../context'

export class DrawingPosing3DLogic {

  private posing3DViewRender = new WebGLRender()
  private posing3dView = new Posing3DView()

  link(posing3DViewRender: WebGLRender, posing3dView: Posing3DView) {

    this.posing3DViewRender = posing3DViewRender
    this.posing3dView = posing3dView
  }

  drawPosing3DView(webglWindow: CanvasWindow, layerWindowItems: ViewLayerListItem[], mainWindow: CanvasWindow, ctx: DocumentContext, redrawActiveLayerOnly: boolean) {

    this.posing3DViewRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height)
    this.posing3dView.clear()

    mainWindow.copyTransformTo(webglWindow)

    for (const item of layerWindowItems) {

      if (!PosingLayer.isPosingLayer(item.layer)) {
        continue
      }

      const posingLayer = <PosingLayer>item.layer
      this.posing3dView.prepareDrawingStructures(posingLayer)
    }

    if (ctx.currentPosingLayer != null
      && Layer.isVisible(ctx.currentPosingLayer)
      && ctx.mainToolID == MainToolID.posing3D
    ) {

      const posingLayer = ctx.currentPosingLayer
      this.posing3dView.drawManipulaters(posingLayer, ctx)
    }

    for (let index = layerWindowItems.length - 1; index >= 0; index--) {

      const item = layerWindowItems[index]

      if (!PosingLayer.isPosingLayer(item.layer)) {
        continue
      }

      if (redrawActiveLayerOnly) {

        if (!Layer.isSelected(item.layer)) {
          continue
        }
      }
      else {

        if (!Layer.isVisible(item.layer)) {
          continue
        }
      }

      const posingLayer = <PosingLayer>item.layer

      this.posing3dView.drawPosingModel(posingLayer, ctx)
    }
  }
}
