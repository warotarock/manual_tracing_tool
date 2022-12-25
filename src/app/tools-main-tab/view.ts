import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, SubToolID } from '../tool'

export class MainToolTab_View extends MainToolTab {

  tabID = MainToolTabID.view // @override
  default_SubToolID = SubToolID.noOperation // @override

  isAvailable(ctx: SubToolContext): boolean { // @override

    return true
  }
}
