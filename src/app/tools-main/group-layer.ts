import { MainTool, MainToolID, MainToolCommonTabSet } from '../tool'
import { MainToolTab_Group } from '../tools-main-tab'

export class MainTool_GroupLayer extends MainTool {

  mainToolID = MainToolID.group // @override

  constructor(tabs: MainToolCommonTabSet) {
    super()

    this.mainToolTabs = [
      new MainToolTab_Group(),
      tabs.edit,
      tabs.layer,
      tabs.document,
      tabs.view
    ]
  }
}
