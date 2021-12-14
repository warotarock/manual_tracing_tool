import { float, int, Lists } from '../logics/conversion'
import { Logic_Points } from '../logics/points'
import { HitTest_Line_PointToLineByDistanceNearest } from '../logics/hittest'
import { Logic_Stroke } from '../logics/stroke'
import { AutoFillLayer, AutoFillPoint, HierarchicalLayerInfo, Layer, VectorDrawingUnit, VectorGeometry, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { CommandBase } from '../command/command'
import { SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { SubToolDrawingContext } from '../context/subtool_drawing_context'
import { Logic_AutoFill } from '../logics/auto_fill'

export class Tool_AddAutoFillPoint extends SubTool {

  helpText = 'クリックした場所に自動塗りつぶしの開始点を追加します。'

  mouseCursorRangeRate = 4.0
  minDistanceRange = 15.0

  lookDirection = vec3.fromValues(0.0, 0.0, 0.0)

  fromLocation = vec3.fromValues(0.0, 0.0, 0.0)
  toLocation = vec3.fromValues(0.0, 0.0, 0.0)
  offset = vec3.fromValues(0.0, 0.0, 0.0)

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      AutoFillLayer.isAutoFillLayer(ctx.currentLayer)
    )
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawMouseCursorCircle(ctx.mouseCursorViewRadius * this.mouseCursorRangeRate)
    drawing.editorDrawer.drawMouseCursorCircle(ctx.getViewScaledLength(this.minDistanceRange))

    this.drawAutoFillPoints(ctx, drawing)
  }

  drawAutoFillPoints(ctx: SubToolContext, drawing: SubToolDrawingContext) {

    if (ctx.currentAutoFillLayer == null) {
      return
    }

    let pointScale = ctx.getViewScaledLength(10.0)
    pointScale = Math.min(pointScale, 10.0)

    const strokeWidth = ctx.getViewScaledLength(2.0)

    for (const point of ctx.currentAutoFillLayer.fillPoints) {

      vec3.add(this.fromLocation, point.location, vec3.scale(this.offset, vec3.normalize(this.offset, point.lookDirection), pointScale * 1.0))
      vec3.add(this.toLocation, point.location, vec3.scale(this.offset, point.lookDirection, 1.0))

      drawing.drawCircle(point.location, pointScale, strokeWidth * 3.0, ctx.drawStyle.autoFillPointEdgeColor)
      drawing.drawLine(this.fromLocation, this.toLocation, strokeWidth * 3.0, ctx.drawStyle.autoFillPointEdgeColor)

      drawing.drawCircle(point.location, pointScale, strokeWidth, ctx.drawStyle.autoFillPointLineColor)
      drawing.drawLine(this.fromLocation, this.toLocation, strokeWidth, ctx.drawStyle.autoFillPointLineColor)
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.setRedrawEditorWindow()
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing()) {
      return
    }

    if (ctx.isAnyModifierKeyPressing()) {
      return
    }

    this.executeCommand(e.location, ctx)

    ctx.setRedrawMainWindow()
  }

  private executeCommand(start_Location: Vec3, ctx: SubToolContext) {

    // 同じ階層のレイヤーを取得
    const sibling_ViewKeyframeLayers = ctx.collectVectorViewKeyframeLayers()
      .filter(vkfl => vkfl.layer.parentLayer == ctx.currentLayer.parentLayer)

    const stroke = new VectorStroke()

    const isAvailable = Logic_AutoFill.generate(
      stroke,
      this.lookDirection,
      start_Location,
      ctx.mouseCursorViewRadius * this.mouseCursorRangeRate,
      this.minDistanceRange,
      sibling_ViewKeyframeLayers
    )

    if (!isAvailable) {
      return
    }

    console.debug('result stroke', stroke.points.map(p => `(${p.location[0].toFixed(2)} ${p.location[1].toFixed(2)} ${p.location[2].toFixed(2)})`).join(' '))

    const autoFillPoint = new AutoFillPoint()
    vec3.copy(autoFillPoint.location, start_Location)
    vec3.copy(autoFillPoint.lookDirection, this.lookDirection)

    const geometry = new VectorGeometry()
    geometry.units.push(new VectorDrawingUnit())
    geometry.units[0].groups.push(new VectorStrokeGroup())
    geometry.units[0].groups[0].lines.push(stroke)

    const command = new Command_AddAutoFillPoint()
    command.layer = ctx.currentAutoFillLayer
    command.autoFillPoint = autoFillPoint
    command.newGeometry = geometry

    ctx.commandHistory.executeCommand(command, ctx)

    ctx.setRedrawMainWindowEditorWindow()
  }
}

export class Command_AddAutoFillPoint extends CommandBase {

  layer: AutoFillLayer = null
  autoFillPoint: AutoFillPoint = null
  newGeometry: VectorGeometry = null

  newAutoFillPoints: AutoFillPoint[] = null
  oldAutoFillPoints: AutoFillPoint[] = null
  oldGeometry: VectorGeometry = null

  execute(ctx: SubToolContext) { // @override

    this.oldAutoFillPoints = this.layer.fillPoints
    this.oldGeometry = this.layer.geometry

    this.newAutoFillPoints = [] //this.oldAutoFillPoints.slice()
    this.newAutoFillPoints.push(this.autoFillPoint)

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    this.layer.fillPoints = this.oldAutoFillPoints
    this.layer.geometry = this.oldGeometry
  }

  redo(_ctx: SubToolContext) { // @override

    this.layer.fillPoints = this.newAutoFillPoints
    this.layer.geometry = this.newGeometry
  }
}
