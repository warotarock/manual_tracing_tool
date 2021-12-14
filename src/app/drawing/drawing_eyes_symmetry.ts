import { VectorLayer } from '../document_data'
import { ToolDrawingStyle } from "./drawing_style"
import { CanvasRender } from '../render/render2d'
import { SubToolContext } from '../context/subtool_context'
import { ViewLayerListItem } from '../view/view_layer_list'
import { DrawingStrokeLogic } from './drawing_stroke'

export class DrawingEyesSymmetryLogic {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null
  private drawingStroke: DrawingStrokeLogic = null

  private location2D = vec3.create()
  private eyeLocation = vec3.create()
  private direction = vec3.create()
  private localLocation = vec3.create()
  private radiusLocation = vec3.create()
  private radiusLocationWorld = vec3.create()
  private radiusLocation2D = vec3.create()

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, drawingStroke: DrawingStrokeLogic) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.drawingStroke = drawingStroke
  }

  drawEyesSymmetries(layerWindowItems: ViewLayerListItem[], ctx: SubToolContext) {

    for (const item of layerWindowItems) {

      if (VectorLayer.isVectorLayerWithOwnData(item.layer)) {

        const vectorLayer = <VectorLayer>item.layer

        this.drawEyesSymmetry(vectorLayer, ctx)
      }
    }
  }

  drawEyesSymmetry(vectorLayer: VectorLayer, ctx: SubToolContext) {

    if (vectorLayer == null
      || vectorLayer.eyesSymmetryEnabled == false
      || vectorLayer.posingLayer == null
      || !vectorLayer.isVisible
      || !vectorLayer.isSelected
    ) {
      return
    }

    const posingData = vectorLayer.posingLayer.posingData

    if (!posingData.headLocationInputData.inputDone) {
      return
    }

    ctx.posing3DLogic.getEyeSphereLocation(this.eyeLocation, posingData, vectorLayer.eyesSymmetryInputSide)
    ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.eyeLocation, posingData)

    const eyeSize = ctx.posing3DLogic.getEyeSphereSize()
    vec3.transformMat4(this.localLocation, this.eyeLocation, ctx.posing3DView.viewMatrix)
    vec3.set(this.direction, eyeSize, 0.0, 0.0)
    vec3.add(this.radiusLocation, this.localLocation, this.direction)
    vec3.transformMat4(this.radiusLocationWorld, this.radiusLocation, ctx.posing3DView.cameraMatrix)
    ctx.posing3DView.calculate2DLocationFrom3DLocation(this.radiusLocation2D, this.radiusLocationWorld, posingData)
    const raduis2D = vec3.distance(this.location2D, this.radiusLocation2D)

    const strokeWidth = this.drawingStroke.getCurrentViewScaleLineWidth(1.0)

    this.canvasRender.setStrokeColorV(this.drawStyle.eyesSymmetryGuideColor)
    this.canvasRender.setStrokeWidth(strokeWidth)
    this.canvasRender.beginPath()
    this.canvasRender.circle(this.location2D[0], this.location2D[1], raduis2D)
    this.canvasRender.stroke()
  }
}
