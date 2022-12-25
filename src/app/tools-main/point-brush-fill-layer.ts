import { MainTool, MainToolID, MainToolCommonTabSet } from '../tool'
import { MainToolTab_PointBrushFill } from '../tools-main-tab'

export class MainTool_PointBrushFillLayer extends MainTool {

  mainToolID = MainToolID.pointBrushFill // @override

  constructor(tabs: MainToolCommonTabSet) {
    super()

    this.mainToolTabs = [
      new MainToolTab_PointBrushFill(),
      tabs.edit,
      tabs.layer,
      tabs.document,
      tabs.view
    ]
  }
}
