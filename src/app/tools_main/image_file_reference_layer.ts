import { Command_LoadReferenceImageToLayer } from '../commands/image_reference_layer'
import { SubToolContext } from '../context/subtool_context'
import { OpenFileDialogTargetID } from '../dialog/open_file_dialog'
import { AppTool_Interface, MainTool, MainToolID, MainToolTabSet } from '../tool/main_tool'
import { SubToolID } from '../tool/sub_tool'
import { RibbonUIControlID } from '../window/constants'

export class MainTool_ImageFileReferenceLayer extends MainTool {

  mainToolID = MainToolID.imageFileReferenceLayer // @override

  constructor(tabs: MainToolTabSet) {
    super()

    this.mainToolTabs = [
      tabs.imageFileReference,
      tabs.edit_disabled,
      tabs.document,
      tabs.layer,
      tabs.view
    ]
  }

  keydown(key: string, ctx: SubToolContext, appTool: AppTool_Interface): boolean { // @override

    if (key == 'g') {

      appTool.setCurrentSubTool(SubToolID.image_GrabMove)
      appTool.startModalTool(SubToolID.image_GrabMove)

      return true
    }
    else if (key == 'b') {

      appTool.setCurrentSubTool(SubToolID.image_Rotate)
      appTool.startModalTool(SubToolID.image_Rotate)
      return true
    }
    else if (key == 'h') {

      appTool.setCurrentSubTool(SubToolID.image_Scale)
      appTool.startModalTool(SubToolID.image_Scale)
      return true
    }
    else if (key == 'o') {

      this.buttonClick(RibbonUIControlID.imageFileRef_openImageFile, ctx, appTool)
      return true
    }

    return false
  }

  buttonClick(id: RibbonUIControlID, ctx: SubToolContext, appTool: AppTool_Interface): boolean { // @override

    switch(id) {

      case RibbonUIControlID.imageFileRef_openImageFile:
        ctx.openFileDialog(OpenFileDialogTargetID.imageFileReferenceLayerFilePath)
        return true
    }

    return false
  }
}
