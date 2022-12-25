import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, MainToolTabSubToolCommand, SubToolID } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_Group extends MainToolTab {

  tabID = MainToolTabID.group // @override
  default_SubToolID = SubToolID.deletePointBrush // @override

  subToolCommands: MainToolTabSubToolCommand[] = [
    { commandID: ShortcutCommandID.tool_subTool1, subToolID: SubToolID.scratchLine},
    { commandID: ShortcutCommandID.tool_subTool2, subToolID: SubToolID.deletePointBrush},
    { commandID: ShortcutCommandID.tool_subTool3, subToolID: SubToolID.overWriteLineWidth},
    { commandID: ShortcutCommandID.tool_subTool4, subToolID: SubToolID.resampleSegment},
  ]

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (ctx.isCurrentLayerGroupLayer())
  }

  keydown(key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (this.processSubToolKeyDown(this.subToolCommands, commandID, ctx)) {
      return true
    }

    if (this.processToggleSubTool(
      ShortcutCommandID.tool_togglePenEraser,
      SubToolID.scratchLine,
      SubToolID.deletePointBrush,
      commandID,
      ctx)
    ) {
      return true
    }

    return false
  }
}
