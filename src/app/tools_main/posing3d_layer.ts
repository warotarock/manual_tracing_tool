import { SubToolContext } from '../context/subtool_context'
import { App_Tool } from '../tool'
import { AppTool_Interface, MainTool, MainToolID, MainToolTabSet } from '../tool/main_tool'

export class MainTool_Poing3DLayer extends MainTool {

  mainToolID = MainToolID.posing3DLayer // @override

  constructor(tabs: MainToolTabSet) {
    super()

    this.mainToolTabs = [
      tabs.posing3D,
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
