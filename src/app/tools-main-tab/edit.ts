import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, MainToolTabSubToolCommand, MainToolTabTypeID, SubToolID } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_Edit extends MainToolTab {

  tabID = MainToolTabID.edit // @override
  type = MainToolTabTypeID.editingTool // @override
  default_SubToolID = SubToolID.brushSelect // @override

  subToolCommands: MainToolTabSubToolCommand[] = [
    { commandID: ShortcutCommandID.tool_subTool1, subToolID: SubToolID.brushSelect},
    { commandID: ShortcutCommandID.tool_subTool2, subToolID: SubToolID.locateOperatorCursor},
    { commandID: ShortcutCommandID.tool_subTool3, subToolID: SubToolID.editModeMain},
    { commandID: ShortcutCommandID.tool_subTool4, subToolID: SubToolID.resampleSegment},
  ]

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (ctx.isEditMode() && ctx.isCurrentLayerEditbaleLayer())
  }

  keydown(_key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (this.processSubToolKeyDown(this.subToolCommands, commandID, ctx)) {
      return true
    }

    let modalToolID = SubToolID.none

    if (commandID == ShortcutCommandID.edit_grabMove) {

      modalToolID = SubToolID.edit_GrabMove
    }

    if (commandID == ShortcutCommandID.edit_rotate) {

      modalToolID = SubToolID.edit_Rotate
    }

    if (commandID == ShortcutCommandID.edit_scale) {

      modalToolID = SubToolID.edit_Scale
    }

    if (modalToolID != SubToolID.none) {

      ctx.tool.startModalTool(modalToolID)
      return true
    }

    if (commandID == ShortcutCommandID.edit_selectAll) {

      ctx.tool.executeToggleSelection()
      return true
    }

    return false
  }
}
