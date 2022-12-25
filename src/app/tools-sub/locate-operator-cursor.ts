import { SubToolContext } from '../context'
import { SubTool, ToolPointerEvent } from '../tool'

export class Tool_LocateOperatorCursor extends SubTool {

  usesOperatorCursor = true // @override

  isAvailable(ctx: SubToolContext): boolean { // @override

    return true
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (e.isLeftButtonPressing && !ctx.isAnyModifierKeyPressing()) {

      ctx.main.setOperatorCursorLocationToMouse()
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    this.mouseDown(e, ctx)
  }
}
