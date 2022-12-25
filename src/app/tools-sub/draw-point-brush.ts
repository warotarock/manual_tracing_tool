import { Command_AddStroke } from '../commands'
import { SubToolContext, SubToolDrawingContext } from '../context'
import { VectorLayer, VectorPoint, VectorStroke } from '../document-data'
import { HitTest_VectorStroke_PointToStroke_Nearest, VectorStrokeLogic } from '../document-logic'
import { BrushTypeID, ModalToolBase, ToolPointerEvent } from '../tool'

export class Tool_DrawPointBrush extends ModalToolBase {

  helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。' // @override

  strokeSingleHitTester = new HitTest_VectorStroke_PointToStroke_Nearest()

  editStroke: VectorStroke = null
  resampledLine: VectorStroke = null
  continuousFill = false
  continuousFillFromStrokeTail = true

  strokeSmoothLevel = 3

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerStrokeDrawableLayer()
    )
  }

  onActivated(ctx: SubToolContext) { // @override

    if (ctx.activeVectorLine == null) {

      this.continuousFill = false
      this.continuousFillFromStrokeTail = true
    }

    ctx.setRedrawEditorWindow()
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawaBrushCursor(ctx.brushBaseSize, ctx.currentVectorLayer.lineWidthBiasRate)

    if (this.resampledLine != null) {

      drawing.editorDrawer.drawOperatorPointBrushStroke(this.resampledLine, ctx.currentVectorLayer.layerColor, false)
    }
    else if (this.editStroke != null) {

      drawing.editorDrawer.drawOperatorPointBrushStroke(this.editStroke, ctx.currentVectorLayer.layerColor, false)
    }
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing) {
      return
    }

    this.resetState(true)

    this.addPointToEditLine(e, ctx)

    ctx.tool.startModalTool(this.subtoolID)
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.setRedrawEditorWindow()

    if (this.editStroke == null) {
      return
    }

    this.addPointToEditLine(e, ctx)
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    if (this.resampledLine == null || VectorStrokeLogic.isEmpty(this.resampledLine)) {
      this.resetState()
      return
    }

    this.executeCommand(ctx)

    this.resetState()

    ctx.setRedrawCurrentLayer()
    ctx.setRedrawEditorWindow()
  }

  private resetState(isForOperationStart = false) {

    this.editStroke = null
    this.resampledLine = null

    if (isForOperationStart) {

      this.editStroke = new VectorStroke()
    }
  }

  private addPointToEditLine(e: ToolPointerEvent, ctx: SubToolContext) {

    const point = new VectorPoint()
    vec3.copy(point.location, e.location)
    point.lineWidth = ctx.drawLineBaseWidth

    this.editStroke.points.push(point)

    VectorStrokeLogic.calculateParameters(this.editStroke)

    if (!VectorStrokeLogic.isEmptyStroke(this.editStroke)) {

      this.resampledLine = this.generateResampledLine(this.editStroke, ctx)
    }
  }

  private generateResampledLine(editorLine: VectorStroke, ctx: SubToolContext): VectorStroke { // @virtual

    const resamplingUnitLength = ctx.getViewScaledResamplingUnitLengthForBrush()

    const resampledLine = VectorStrokeLogic.createResampledLine(editorLine, resamplingUnitLength)

    VectorStrokeLogic.smooth(resampledLine, this.strokeSmoothLevel)

    return resampledLine
  }

  private executeCommand(ctx: SubToolContext) {

    const newStroke = this.resampledLine

    if (VectorLayer.isPointBrushFillLayer(ctx.currentLayer)) {

      const command = new Command_AddStroke()
      command.setTarget(ctx.currentVectorLayer, ctx.currentVectorLayerGeometry, null, ctx.activeVectorGroup, newStroke)

      ctx.commandHistory.executeCommand(command, ctx)
    }
  }
}
