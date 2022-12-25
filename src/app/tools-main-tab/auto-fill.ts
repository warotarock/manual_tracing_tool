import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, MainToolTabSubToolCommand, SubToolID } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_AutoFill extends MainToolTab {

  tabID = MainToolTabID.autoFill // @override
  default_SubToolID = SubToolID.addAutoFillPoint // @override

  subToolCommands: MainToolTabSubToolCommand[] = [
    { commandID: ShortcutCommandID.tool_subTool1, subToolID: SubToolID.addAutoFillPoint},
    { commandID: ShortcutCommandID.tool_subTool2, subToolID: SubToolID.deleteAutoFillPoint},
  ]

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (ctx.isDrawMode() && ctx.isCurrentLayerAutoFillLayer())
  }

  keydown(_key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (this.processSubToolKeyDown(this.subToolCommands, commandID, ctx)) {
      return true
    }

    if (this.processToggleSubTool(
      ShortcutCommandID.tool_togglePenEraser,
      SubToolID.deleteAutoFillPoint,
      SubToolID.addAutoFillPoint,
      commandID,
      ctx)
    ) {
      return true
    }

    return false
  }
}
