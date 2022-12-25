import { MainToolID, MainToolTab, MainToolTabID, MainToolTabTypeID, SubToolID } from '../tool'

export class MainToolTab_EditDisabled extends MainToolTab {

  tabID = MainToolTabID.edit_disabled // @override
  type = MainToolTabTypeID.editingTool // @override
  default_SubToolID = SubToolID.brushSelect // @override
  disabled: boolean = true // @override
}
