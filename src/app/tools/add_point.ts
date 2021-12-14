import { float, Lists } from '../logics/conversion'
import { Layer, VectorLayer, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { CommandBase } from '../command/command'
import { Logic_Edit_Line } from '../logics/edit_vector_layer'
import { SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'

export class Tool_AddPoint extends SubTool {

  edit_Line: VectorStroke = null

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerVectorLayer()
    )
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!e.isLeftButtonPressing()) {
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

    Logic_Edit_Line.smooth(this.edit_Line)

    this.executeCommand(e.location[0], e.location[1], addLine, ctx)

    ctx.setRedrawMainWindow()
  }

  mouseMove(_e: ToolPointerEvent, _ctx: SubToolContext) { // @override
  }

  mouseUp(_e: ToolPointerEvent, _ctx: SubToolContext) { // @override
  }

  private executeCommand(x: float, y: float, addLine: boolean, ctx: SubToolContext) {

    const command = new Command_AddPoint()
    command.group = ctx.currentVectorGroup
    command.line = this.edit_Line
    command.point = new VectorPoint()
    command.addLine = addLine
    vec3.set(command.point.location, x, y, 0.0)

    command.useGroup(command.group)

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
