import { MainTool, MainToolID, MainToolCommonTabSet } from '../tool'
import { MainToolTab_Poing3D } from '../tools-main-tab'

export class MainTool_Poing3DLayer extends MainTool {

  mainToolID = MainToolID.posing3D // @override

  constructor(tabs: MainToolCommonTabSet) {
    super()

    this.mainToolTabs = [
      new MainToolTab_Poing3D(),
      tabs.edit_disabled,
      tabs.layer,
      tabs.document,
      tabs.view
    ]
  }
}
