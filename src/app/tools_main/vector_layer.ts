import { SubToolContext } from '../context/subtool_context'
import { App_Tool } from '../tool'
import { AppTool_Interface, MainTool, MainToolID, MainToolTabSet } from '../tool/main_tool'

export class MainTool_VectorLayer extends MainTool {

  mainToolID = MainToolID.vectorLayer // @override

  constructor(tabs: MainToolTabSet) {
    super()

    this.mainToolTabs = [
      tabs.drawing,
      tabs.edit,
      tabs.document,
      tabs.layer,
      tabs.view
    ]
  }

  keydown(key: string, ctx: SubToolContext, appTool: AppTool_Interface): boolean { // @override

    return false
  }
}
