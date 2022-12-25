import { MainTool, MainToolID, MainToolCommonTabSet } from '../tool'
import { MainToolTab_AutoFill } from '../tools-main-tab'

export class MainTool_AutoFillLayer extends MainTool {

  mainToolID = MainToolID.autoFill // @override

  constructor(tabs: MainToolCommonTabSet) {
    super()

    this.mainToolTabs = [
      new MainToolTab_AutoFill(),
      tabs.edit_disabled,
      tabs.layer,
      tabs.document,
      tabs.view
    ]
  }
}
