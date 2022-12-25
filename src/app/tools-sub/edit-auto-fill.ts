import { CommandBase } from '../command'
import { Lists } from '../common-logics'
import { SubToolContext, SubToolDrawingContext } from '../context'
import { AutoFillLayer, AutoFillPoint, AutoFillPointGroup, VectorStroke, VectorStrokeGroup } from '../document-data'
import { AutoFillLogic, EditAnimationFrameLogic } from '../document-logic'
import { SubTool, ToolPointerEvent } from '../tool'
import { ViewKeyframeLayer } from '../view'

class Tool_AutoFillPointBase extends SubTool {

  protected sibling_ViewKeyframeLayers: ViewKeyframeLayer[] = []
  private fromLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private toLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private offset = vec3.fromValues(0.0, 0.0, 0.0)

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      AutoFillLayer.isAutoFillLayer(ctx.currentLayer)
    )
  }

  onActivated(ctx: SubToolContext) { // @override

    // 同じ階層のレイヤーを取得
    this.sibling_ViewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayers()
      .filter(vkfl => vkfl.layer.runtime.parentLayer == ctx.currentLayer.runtime.parentLayer)
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    this.drawAutoFillPoints(ctx, drawing)
  }

  drawAutoFillPoints(ctx: SubToolContext, drawing: SubToolDrawingContext) {

    if (ctx.currentAutoFillLayer == null) {
      return
    }

    let pointScale = ctx.getViewScaledLength(10.0)
    pointScale = Math.min(pointScale, 10.0)

    const strokeWidth = ctx.getViewScaledLength(2.0)

    const keyframe = EditAnimationFrameLogic.findLastKeyframeData(ctx.currentAutoFillLayer.keyframes, ctx.currentTimeFrame)

    if (keyframe == null) {
      throw new Error('ERROR 0000:Could not get keyframe for AutoFillLayer')
    }

    AutoFillLayer.forEachFillPoint(keyframe, (_group, fillPoint) => {

      vec3.add(this.fromLocation, fillPoint.location, vec3.scale(this.offset, vec3.normalize(this.offset, fillPoint.lookDirection), pointScale * 1.0))
      vec3.add(this.toLocation, fillPoint.location, vec3.scale(this.offset, fillPoint.lookDirection, 1.0))

      drawing.drawCircle(fillPoint.location, pointScale, strokeWidth * 3.0, ctx.drawStyle.autoFillPointEdgeColor)
      drawing.drawLine(this.fromLocation, this.toLocation, strokeWidth * 3.0, ctx.drawStyle.autoFillPointEdgeColor)

      drawing.drawCircle(fillPoint.location, pointScale, strokeWidth, ctx.drawStyle.autoFillPointLineColor)
      drawing.drawLine(this.fromLocation, this.toLocation, strokeWidth, ctx.drawStyle.autoFillPointLineColor)
    })
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.setRedrawEditorWindow()
  }
}

export class Tool_AddAutoFillPoint extends Tool_AutoFillPointBase {

  helpText = 'クリックした場所に自動塗りつぶしの開始点を追加します。'

  minDistanceRange = 15.0

  lookDirection = vec3.fromValues(0.0, 0.0, 0.0)

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawPointerCursor(ctx.toolBaseViewRadius)

    drawing.setLineDash(2.0)
    drawing.editorDrawer.drawPointerCursor(this.minDistanceRange / 2)
    drawing.cancelLineDash()

    this.drawAutoFillPoints(ctx, drawing)
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing) {
      return
    }

    this.executeCommand(e.location, ctx)

    ctx.setRedrawMainWindow()
  }

  private executeCommand(start_Location: Vec3, ctx: SubToolContext) {

    const start_Stroke = AutoFillLogic.findStartStroke(
      start_Location,
      ctx.toolBaseViewRadius,
      this.sibling_ViewKeyframeLayers
    )

    if (start_Stroke == null) {
      return
    }

    const fill_Stroke = new VectorStroke()

    const isAvailable = AutoFillLogic.generate(
      fill_Stroke,
      this.lookDirection,
      start_Stroke,
      start_Location,
      this.minDistanceRange,
      this.sibling_ViewKeyframeLayers
    )

    if (!isAvailable) {
      return
    }

    const keyframe = EditAnimationFrameLogic.findLastKeyframeData(ctx.currentAutoFillLayer.keyframes, ctx.currentTimeFrame)

    const autoFillPoint = new AutoFillPoint()
    autoFillPoint.minDistanceRange = this.minDistanceRange
    vec3.copy(autoFillPoint.location, start_Location)
    vec3.copy(autoFillPoint.lookDirection, this.lookDirection)

    const command = new Command_AddAutoFillPoint()
    command.autoFillPointGroup = keyframe.groups[0]
    command.vectorStrokeGroup = keyframe.geometry.units[0].groups[0]
    command.autoFillPoint = autoFillPoint
    command.newStroke = fill_Stroke

    ctx.commandHistory.executeCommand(command, ctx)

    ctx.setRedrawMainWindowEditorWindow()
  }
}

export class Command_AddAutoFillPoint extends CommandBase {

  autoFillPoint: AutoFillPoint = null
  autoFillPointGroup: AutoFillPointGroup = null
  vectorStrokeGroup: VectorStrokeGroup = null
  newStroke: VectorStroke = null

  private newAutoFillPoints: AutoFillPoint[] = null
  private oldAutoFillPoints: AutoFillPoint[] = null
  private newStrokes: VectorStroke[] = null
  private oldStrokes: VectorStroke[] = null

  execute(ctx: SubToolContext) { // @override

    this.oldAutoFillPoints = this.autoFillPointGroup.fillPoints
    this.oldStrokes = this.vectorStrokeGroup.lines

    this.newAutoFillPoints = Lists.clone(this.oldAutoFillPoints)
    this.newAutoFillPoints.push(this.autoFillPoint)

    this.newStrokes = Lists.clone(this.vectorStrokeGroup.lines)
    this.newStrokes.push(this.newStroke)

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    this.autoFillPointGroup.fillPoints = this.oldAutoFillPoints
    this.vectorStrokeGroup.lines = this.oldStrokes
  }

  redo(_ctx: SubToolContext) { // @override

    this.autoFillPointGroup.fillPoints = this.newAutoFillPoints
    this.vectorStrokeGroup.lines = this.newStrokes
  }
}

export class Tool_DeleteAutoFillPoint extends Tool_AutoFillPointBase {

  helpText = 'クリックした場所の自動塗りつぶしの開始点を削除します。'

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawPointerCursor(ctx.toolBaseViewRadius)

    this.drawAutoFillPoints(ctx, drawing)
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing) {
      return
    }

    this.executeCommand(e.location, ctx)

    ctx.setRedrawMainWindow()
  }

  private executeCommand(location: Vec3, ctx: SubToolContext) {

    const keyframe = EditAnimationFrameLogic.findLastKeyframeData(ctx.currentAutoFillLayer.keyframes, ctx.currentTimeFrame)

    const minDistance = ctx.toolBaseViewRadius

    let delete_FillPoint: AutoFillPoint = null
    AutoFillLayer.forEachFillPoint(keyframe, (_group, fillPoint, looping) => {

      if (vec3.distance(fillPoint.location, location) < minDistance) {

        delete_FillPoint = fillPoint
        looping.break = true
      }
    })

    const command = new Command_DeleteAutoFillPoint()
    command.autoFillPointGroup = keyframe.groups[0]
    command.delete_AutoFillPoint = delete_FillPoint
    command.defferedProcess.addLayer(ctx.currentAutoFillLayer)

    ctx.commandHistory.executeCommand(command, ctx)

    ctx.setRedrawMainWindowEditorWindow()
  }
}

export class Command_DeleteAutoFillPoint extends CommandBase {

  autoFillPointGroup: AutoFillPointGroup = null
  delete_AutoFillPoint: AutoFillPoint = null

  newAutoFillPoints: AutoFillPoint[] = null
  oldAutoFillPoints: AutoFillPoint[] = null

  execute(ctx: SubToolContext) { // @override

    this.oldAutoFillPoints = this.autoFillPointGroup.fillPoints

    this.newAutoFillPoints = this.oldAutoFillPoints.filter(point => point != this.delete_AutoFillPoint)

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    this.autoFillPointGroup.fillPoints = this.oldAutoFillPoints
  }

  redo(_ctx: SubToolContext) { // @override

    this.autoFillPointGroup.fillPoints = this.newAutoFillPoints
  }
}
