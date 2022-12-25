import { MainTool, MainToolID, MainToolCommonTabSet } from '../tool'
import { MainToolTab_Drawing } from '../tools-main-tab'

export class MainTool_VectorLayer extends MainTool {

  mainToolID = MainToolID.vector // @override

  constructor(tabs: MainToolCommonTabSet) {
    super()

    this.mainToolTabs = [
      new MainToolTab_Drawing(),
      tabs.edit,
      tabs.layer,
      tabs.document,
      tabs.view
    ]
  }
}
