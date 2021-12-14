import { CommandBase } from '../command/command'
import { Lists } from '../logics/conversion'
import { Layer, VectorLayer, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { Logic_Edit_Line, Logic_Edit_Points } from '../logics/edit_vector_layer'
import { SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { SubToolDrawingContext } from '../context/subtool_drawing_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'

export class Tool_DrawLine extends SubTool {

  helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。'

  editLine: VectorStroke = null
  continuousFill = false

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerVectorLayer()
    )
  }

  onDrawEditor(_ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    if (this.editLine != null) {

      drawing.editorDrawer.drawEditorEditLineStroke(this.editLine)
    }
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing()) {
      return
    }

    this.continuousFill = ctx.isShiftKeyPressing()

    this.editLine = new VectorStroke()

    this.addPointToEditLine(e, ctx)
  }

  private addPointToEditLine(e: ToolPointerEvent, ctx: SubToolContext) {

    const point = new VectorPoint()
    vec3.copy(point.location, e.location)
    point.lineWidth = ctx.drawLineBaseWidth

    this.editLine.points.push(point)
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (this.editLine == null) {
      return
    }

    this.addPointToEditLine(e, ctx)

    ctx.setRedrawEditorWindow()
  }

  mouseUp(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (this.editLine == null) {
      return
    }

    if (ctx.currentVectorGroup == null) {

      this.editLine = null
      ctx.setRedrawEditorWindow()
      return
    }

    this.continuousFill = (this.continuousFill || ctx.isShiftKeyPressing())

    this.executeCommand(ctx)

    ctx.setRedrawCurrentLayer()
    ctx.setRedrawEditorWindow()

    this.editLine = null
  }

  private executeCommand(ctx: SubToolContext) {

    const targetGroup = ctx.currentVectorGroup
    const editLine = this.editLine

    // Crete new line
    Logic_Edit_Line.smooth(editLine)

    const resamplingUnitLength = ctx.getViewScaledDrawLineUnitLength()
    const divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(editLine.totalLength, resamplingUnitLength)

    const resampledLine = Logic_Edit_Line.createResampledLine(editLine, divisionCount)

    if (resampledLine.points.length < 2) {

      return
    }

    // Collect continuous filling info
    let previousConnectedLine: VectorStroke = null
    let previousConnectedLine_continuousFill = false

    if (this.continuousFill && targetGroup.lines.length >= 1) {

      const connectLine = targetGroup.lines[targetGroup.lines.length - 1]

      if (connectLine.points.length >= 2) {

        const lastPoint = connectLine.points[connectLine.points.length - 1]

        const point1 = resampledLine.points[0]
        const point2 = resampledLine.points[resampledLine.points.length - 1]

        const distance1 = vec3.squaredDistance(lastPoint.location, point1.location)
        const distance2 = vec3.squaredDistance(lastPoint.location, point2.location)

        if (distance2 < distance1) {

          const revercedList: VectorPoint[] = []
          for (let i = resampledLine.points.length - 1; i >= 0; i--) {

            revercedList.push(resampledLine.points[i])
          }

          resampledLine.points = revercedList
        }

        previousConnectedLine = targetGroup.lines[targetGroup.lines.length - 1]
        previousConnectedLine_continuousFill = previousConnectedLine.continuousFill
      }
    }

    const command = new Command_AddLine()
    command.prepareEditTargets(ctx.currentVectorGroup, resampledLine)
    command.setContiuousStates(this.continuousFill, previousConnectedLine, previousConnectedLine_continuousFill)

    command.useGroup(ctx.currentVectorGroup)

    ctx.commandHistory.executeCommand(command, ctx)

    this.editLine = null
  }
}

export class Command_AddLine extends CommandBase {

  protected group: VectorStrokeGroup = null
  protected line: VectorStroke = null
  protected continuousFill = false

  previousConnectedLine: VectorStroke = null
  previousConnectedLine_continuousFill = false

  prepareEditTargets(group: VectorStrokeGroup, line: VectorStroke) {

    this.group = group
    this.line = line

    this.useGroup(group)
  }

  setContiuousStates(continuousFill: boolean, previousConnectedLine: VectorStroke, previousConnectedLine_continuousFill: boolean) {

    this.continuousFill = continuousFill
    this.previousConnectedLine = previousConnectedLine
    this.previousConnectedLine_continuousFill = previousConnectedLine_continuousFill
  }

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    Lists.removeAt(this.group.lines, this.group.lines.length - 1)

    if (this.previousConnectedLine != null) {

      this.previousConnectedLine.continuousFill = this.previousConnectedLine_continuousFill
    }
  }

  redo(ctx: SubToolContext) { // @override

    this.group.lines.push(this.line)

    if (this.previousConnectedLine != null) {

      this.previousConnectedLine.continuousFill = true
    }

    ctx.setCurrentVectorLine(this.line, this.group)
  }
}
