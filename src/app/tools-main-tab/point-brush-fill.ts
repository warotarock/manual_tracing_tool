import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, MainToolTabSubToolCommand, SubToolID } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_PointBrushFill extends MainToolTab {

  tabID = MainToolTabID.pointBrushFill // @override
  default_SubToolID = SubToolID.drawPointBrush // @override

  subToolCommands: MainToolTabSubToolCommand[] = [
    { commandID: ShortcutCommandID.tool_subTool1, subToolID: SubToolID.drawPointBrush},
    { commandID: ShortcutCommandID.tool_subTool2, subToolID: SubToolID.deletePointBrush},
    { commandID: ShortcutCommandID.tool_subTool3, subToolID: SubToolID.scratchLine},
    { commandID: ShortcutCommandID.tool_subTool4, subToolID: SubToolID.extrudeLine},
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
      SubToolID.drawPointBrush,
      commandID,
      ctx)
    ) {
      return true
    }

    return false
  }
}
