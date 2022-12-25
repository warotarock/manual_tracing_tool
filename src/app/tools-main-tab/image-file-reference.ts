import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, MainToolTabSubToolCommand, SubToolID } from '../tool'
import { OpenFileDialogTargetID, RibbonUIControlID } from '../ui'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_ImageFileReference extends MainToolTab {

  tabID = MainToolTabID.imageFileReference // @override
  default_SubToolID = SubToolID.image_GrabMove // @override

  subToolCommands: MainToolTabSubToolCommand[] = [
    { commandID: ShortcutCommandID.tool_subTool1, subToolID: SubToolID.image_GrabMove},
    { commandID: ShortcutCommandID.tool_subTool2, subToolID: SubToolID.image_Rotate},
    { commandID: ShortcutCommandID.tool_subTool3, subToolID: SubToolID.image_Scale},
    { commandID: ShortcutCommandID.tool_subTool4, subToolID: SubToolID.resampleSegment},
  ]

  isAvailable(ctx: SubToolContext): boolean { // @override

    return ctx.isCurrentLayerImageFileReferenceLayer()
  }

  keydown(key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (this.processSubToolKeyDown(this.subToolCommands, commandID, ctx)) {
      return true
    }

    if (commandID == ShortcutCommandID.edit_grabMove) {

      ctx.tool.changeCurrentSubToolForSubtoolID(SubToolID.image_GrabMove)
      ctx.tool.startModalTool(SubToolID.image_GrabMove)

      return true
    }

    if (commandID == ShortcutCommandID.edit_rotate) {

      ctx.tool.changeCurrentSubToolForSubtoolID(SubToolID.image_Rotate)
      ctx.tool.startModalTool(SubToolID.image_Rotate)
      return true
    }

    if (commandID == ShortcutCommandID.edit_scale) {

      ctx.tool.changeCurrentSubToolForSubtoolID(SubToolID.image_Scale)
      ctx.tool.startModalTool(SubToolID.image_Scale)
      return true
    }

    return false
  }

  buttonClick(id: RibbonUIControlID, ctx: SubToolContext): boolean { // @override

    switch(id) {

      case RibbonUIControlID.imageFileRef_openImageFile:
        ctx.main.openFileDialog(OpenFileDialogTargetID.imageFileReferenceLayerFilePath)
        return true
    }

    return false
  }
}
