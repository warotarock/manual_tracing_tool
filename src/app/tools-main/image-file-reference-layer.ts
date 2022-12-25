import { MainTool, MainToolID, MainToolCommonTabSet } from '../tool'
import { MainToolTab_ImageFileReference } from '../tools-main-tab/image-file-reference'

export class MainTool_ImageFileReferenceLayer extends MainTool {

  mainToolID = MainToolID.imageFileReference // @override

  constructor(tabs: MainToolCommonTabSet) {
    super()

    this.mainToolTabs = [
      new MainToolTab_ImageFileReference(),
      tabs.edit_disabled,
      tabs.layer,
      tabs.document,
      tabs.view
    ]
  }
}
