import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, SubToolID } from '../tool'

export class MainToolTab_Layer extends MainToolTab {

  tabID = MainToolTabID.layer // @override
  default_SubToolID = SubToolID.noOperation // @override

  isAvailable(ctx: SubToolContext): boolean { // @override

    return true
  }
}
