import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, MainToolTabSubToolCommand, SubToolID } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_Drawing extends MainToolTab {

  tabID = MainToolTabID.drawing // @override
  default_SubToolID = SubToolID.drawLine // @override

  subToolCommands: MainToolTabSubToolCommand[] = [
    { commandID: ShortcutCommandID.tool_subTool1, subToolID: SubToolID.drawLine},
    { commandID: ShortcutCommandID.tool_subTool2, subToolID: SubToolID.deletePointBrush},
    { commandID: ShortcutCommandID.tool_subTool3, subToolID: SubToolID.scratchLine},
    { commandID: ShortcutCommandID.tool_subTool4, subToolID: SubToolID.extrudeLine},
    { commandID: ShortcutCommandID.tool_subTool5, subToolID: SubToolID.scratchLineWidth},
    { commandID: ShortcutCommandID.tool_subTool6, subToolID: SubToolID.overWriteLineWidth},
  ]

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (ctx.isDrawMode() && ctx.isCurrentLayerStrokeDrawableLayer())
  }

  keydown(key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (this.processSubToolKeyDown(this.subToolCommands, commandID, ctx)) {
      return true
    }

    if (this.processToggleSubTool(
      ShortcutCommandID.tool_togglePenEraser,
      SubToolID.deletePointBrush,
      SubToolID.drawLine,
      commandID,
      ctx)
    ) {
      return true
    }

    return false
  }
}
