import { CommandBase } from '../command'
import { float, Lists } from '../common-logics'
import { SubToolContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import { VectorPoint, VectorStroke, VectorStrokeGroup } from '../document-data'
import { VectorStrokeLogic } from '../document-logic'
import { SubTool, ToolPointerEvent } from '../tool'

export class Tool_AddPoint extends SubTool {

  edit_Line: VectorStroke = null

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerStrokeDrawableLayer()
    )
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing) {
      return
    }

    if (ctx.isAnyModifierKeyPressing()) {
      return
    }

    let addLine = false

    if (this.edit_Line == null) {
      this.edit_Line = new VectorStroke()
      addLine = true
    }

    VectorStrokeLogic.smooth(this.edit_Line)

    this.executeCommand(e.location[0], e.location[1], addLine, ctx)

    ctx.setRedrawMainWindow()
  }

  mouseMove(_e: ToolPointerEvent, _ctx: SubToolContext) { // @override
  }

  mouseUp(_e: ToolPointerEvent, _ctx: SubToolContext) { // @override
  }

  private executeCommand(x: float, y: float, addLine: boolean, ctx: SubToolContext) {

    const command = new Command_AddPoint()
    command.group = ctx.activeVectorGroup
    command.line = this.edit_Line
    command.point = new VectorPoint()
    command.addLine = addLine
    vec3.set(command.point.location, x, y, 0.0)

    command.defferedProcess.addGroup(ctx.currentLayer, command.group, PostUpdateSituationTypeID.changesObjectShapes)

    ctx.commandHistory.executeCommand(command, ctx)
  }
}

export class Command_AddPoint extends CommandBase {

  group: VectorStrokeGroup = null
  line: VectorStroke = null
  point: VectorPoint = null
  addLine = false

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    Lists.removeAt(this.line.points, this.line.points.length - 1)

    if (this.addLine) {

      Lists.removeAt(this.group.lines, this.group.lines.length - 1)
    }
  }

  redo(_ctx: SubToolContext) { // @override

    if (this.addLine) {

      this.group.lines.push(this.line)
    }

    this.line.points.push(this.point)
  }
}
