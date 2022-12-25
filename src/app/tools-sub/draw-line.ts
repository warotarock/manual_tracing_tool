import { Command_AddStroke } from '../commands'
import { Lists, Logic_Points } from '../common-logics'
import { SubToolContext, SubToolDrawingContext } from '../context'
import { VectorLayer, VectorLayerGeometry, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document-data'
import { HitTest_VectorStroke_PointToStroke_Nearest, VectorStrokeLogic } from '../document-logic'
import { ModalToolBase, ToolPointerEvent } from '../tool'
import { ViewKeyframeLayer } from '../view'

export class Tool_DrawLine extends ModalToolBase {

  helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。' // @override

  strokeSingleHitTester = new HitTest_VectorStroke_PointToStroke_Nearest()

  editStroke: VectorStroke = null
  resampledLine: VectorStroke = null
  continuousFill = false
  continuousFillFromStrokeTail = true
  lastMouseLocation = vec3.create()

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

      drawing.editorDrawer.drawOperatorSolidStroke(this.resampledLine, ctx.currentVectorLayer.lineWidthBiasRate)
    }

    if (VectorLayer.isSurroundingFillLayer(ctx.currentLayer)) {

      if (this.continuousFill && ctx.activeVectorGroup != null && ctx.activeVectorLine != null) {

        const targetPoint = this.continuousFillFromStrokeTail ? ctx.activeVectorLine.points.at(-1) : ctx.activeVectorLine.points.at(0)

        drawing.render.setStrokeColorV(ctx.drawStyle.sampledPointColor)

        drawing.editorDrawer.drawStrokeConnectionInfoLine(targetPoint.location, this.lastMouseLocation)
      }
    }
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing) {
      return
    }

    this.resetState(true)

    this.addPointToEditLine(e, ctx)

    vec3.copy(this.lastMouseLocation, ctx.mouseCursorLocation)

    ctx.tool.startModalTool(this.subtoolID)
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.setRedrawEditorWindow()

    if (VectorLayer.isSurroundingFillLayer(ctx.currentLayer)) {

      if (ctx.activeVectorLine != null) {

        ctx.setRedrawEditorWindow()
      }
    }

    if (this.isEditing()) {

      this.addPointToEditLine(e, ctx)
    }
    else {

      this.updateLastMouseLocation(ctx)
    }
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    // line selecting with single click
    if (VectorLayer.isSurroundingFillLayer(ctx.currentLayer)) {

      if (!e.isPointerMoved) {

        this.selectGroup(e.location, ctx)
        this.resetState()
        ctx.setRedrawEditorWindow()
        return
      }

      if (ctx.activeVectorLine != null) {

        ctx.setRedrawEditorWindow()
      }

      this.updateLastMouseLocation(ctx)
    }

    if (this.resampledLine == null || VectorStrokeLogic.isEmptyStroke(this.resampledLine)) {
      this.resetState()
      return
    }

    this.executeCommand(ctx)

    this.resetState()

    ctx.setRedrawCurrentLayer()
    ctx.setRedrawEditorWindow()
  }

  private isEditing(): boolean {

    return (this.editStroke != null)
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

  private updateLastMouseLocation(ctx: SubToolContext) {

    vec3.copy(this.lastMouseLocation, ctx.mouseCursorLocation)
  }

  private selectGroup(location: Vec3, ctx: SubToolContext) {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    let hitedGeometry: VectorLayerGeometry = null
    let hitedGroup: VectorStrokeGroup = null
    let hitedStroke: VectorStroke = null
    let isTailHited = true

    ViewKeyframeLayer.forEachVectorGeometry(viewKeyframeLayers, (geometry, layer) => {

      if (hitedStroke != null) {
        return
      }

      this.strokeSingleHitTester.startProcess()
      this.strokeSingleHitTester.processGeometry(layer, geometry, location, ctx.touchViewRadius)

      if (this.strokeSingleHitTester.hitedStoke != null) {

        // Seelcts first stroke or last stroke in the group

        const headStroke = this.strokeSingleHitTester.hitedGroup.lines.at(0)
        const headPoint = headStroke.points.at(0)
        const distanceToHead = Logic_Points.pointToPoint_DistanceSQ(headPoint.location, location)

        const tailStroke = this.strokeSingleHitTester.hitedGroup.lines.at(-1)
        const tailPoint = tailStroke.points.at(-1)
        const distanceTotail = Logic_Points.pointToPoint_DistanceSQ(tailPoint.location, location)

        isTailHited = (distanceToHead > distanceTotail)
        hitedGeometry = this.strokeSingleHitTester.hitedGeometry
        hitedGroup = this.strokeSingleHitTester.hitedGroup
        hitedStroke = (isTailHited ? tailStroke : headStroke)
      }
    })

    if (hitedStroke == null || VectorStrokeLogic.isEmptyStroke(hitedStroke)) {

      ctx.unsetAcrtiveVectorStrokeAndGroup()
      return
    }

    ctx.setActiveVectorStroke(hitedStroke, hitedGroup, hitedGeometry)

    this.continuousFill = true
    this.continuousFillFromStrokeTail = isTailHited
  }

  private generateResampledLine(editorLine: VectorStroke, ctx: SubToolContext): VectorStroke { // @virtual

    const resamplingUnitLength = ctx.getViewScaledResamplingUnitLengthForBrush()

    const resampledLine = VectorStrokeLogic.createResampledLine(editorLine, resamplingUnitLength)

    VectorStrokeLogic.smooth(resampledLine, this.strokeSmoothLevel)

    return resampledLine
  }

  private executeCommand(ctx: SubToolContext) {

    const newStroke = this.resampledLine

    // Execute a command
    if (VectorLayer.isVectorStrokeLayer(ctx.currentLayer)) {

      const command = new Command_AddStroke()
      command.setTarget(ctx.currentVectorLayer, ctx.currentVectorLayerGeometry, null, ctx.activeVectorGroup, newStroke)

      ctx.commandHistory.executeCommand(command, ctx)
    }
    else if (VectorLayer.isSurroundingFillLayer(ctx.currentLayer)) {

      // Collect continuous filling info
      let connectTo_stroke: VectorStroke | null = null

      if (this.continuousFill && ctx.activeVectorLine != null && ctx.activeVectorGroup != null) {

        const targetPoint = this.continuousFillFromStrokeTail ? ctx.activeVectorLine.points.at(-1) :  ctx.activeVectorLine.points.at(0)

        const headPoint = newStroke.points.at(0)
        const tailPoint = newStroke.points.at(-1)

        const distanceFromHead = Logic_Points.pointToPoint_DistanceSQ(targetPoint.location, headPoint.location)
        const distanceFromTail = Logic_Points.pointToPoint_DistanceSQ(targetPoint.location, tailPoint.location)

        if ((this.continuousFillFromStrokeTail && distanceFromTail < distanceFromHead)
        || (!this.continuousFillFromStrokeTail && distanceFromTail > distanceFromHead)) {

          Lists.reverse(newStroke.points)
        }

        if (this.continuousFillFromStrokeTail) {

          connectTo_stroke = ctx.activeVectorLine
        }
      }
      else {

        this.continuousFillFromStrokeTail = true
      }

      const command = new Command_AddStroke()
      command.setTarget(ctx.currentVectorLayer, ctx.currentVectorLayerGeometry, null, ctx.activeVectorGroup, newStroke)
      command.addToTop = !this.continuousFillFromStrokeTail

      ctx.commandHistory.executeCommand(command, ctx)

      ctx.setActiveVectorStroke(newStroke, command.group, command.geometry)

      this.continuousFill = true
    }
  }
}
