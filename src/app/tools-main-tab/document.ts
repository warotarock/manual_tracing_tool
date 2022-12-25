import { SubToolContext } from '../context'
import { MainToolTab, MainToolTabID, SubToolID } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export class MainToolTab_Document extends MainToolTab {

  tabID = MainToolTabID.document // @override
  default_SubToolID = SubToolID.editDocumentFrame // @override

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (ctx.isEditMode() && ctx.isCurrentLayerEditbaleLayer())
  }
}
