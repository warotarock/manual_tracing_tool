import { SubToolContext } from '../context/subtool_context'
import { AppTool_Interface, MainTool, MainToolID, MainToolTabSet } from '../tool/main_tool'

export class MainTool_AutoFillLayer extends MainTool {

  mainToolID = MainToolID.autoFillLayer // @override

  constructor(tabs: MainToolTabSet) {
    super()

    this.mainToolTabs = [
      tabs.autoFill,
      tabs.edit_disabled,
      tabs.document,
      tabs.layer,
      tabs.view
    ]
  }

  keydown(key: string, ctx: SubToolContext, appTool: AppTool_Interface): boolean { // @override

    return false
  }
}
