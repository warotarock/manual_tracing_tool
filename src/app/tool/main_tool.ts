import { SubToolContext } from '../context/subtool_context'
import { RibbonUIControlID } from '../window/constants'
import { SubToolID, SubTool } from './sub_tool'

export enum MainToolID {

  none = 0,
  groupLayer,
  vectorLayer,
  fill,
  posing3DLayer,
  imageFileReferenceLayer,
  autoFillLayer,
}

export enum MainToolTabID {

  none = 0,
  drawing,
  imageFileReference,
  autoFill,
  posing,
  edit,
  edit_disabled,
  document,
  layer,
  view,
}

export enum MainToolTabTypeID {

  none = 0,
  manipulatingTool,
  editingTool,
}

export class MainToolTab {

  tabID: MainToolTabID
  type: MainToolTabTypeID
  disabled: boolean
  default_SubToolID = SubToolID.none
  current_SubTool: SubTool = null

  constructor(tabID: MainToolTabID, default_SubToolID: SubToolID, disabled: boolean) {

    this.tabID = tabID
    this.default_SubToolID = default_SubToolID
    this.disabled = disabled

    switch(tabID) {

      case MainToolTabID.edit:
      case MainToolTabID.edit_disabled:
        this.type = MainToolTabTypeID.editingTool
        break

      default:
        this.type = MainToolTabTypeID.manipulatingTool
        break
    }
  }
}

export class MainToolTabSet {

  drawing = new MainToolTab(MainToolTabID.drawing, SubToolID.drawLine, false)
  imageFileReference = new MainToolTab(MainToolTabID.imageFileReference, SubToolID.image_GrabMove, false)
  autoFill = new MainToolTab(MainToolTabID.autoFill, SubToolID.autoFill, false)
  posing3D = new MainToolTab(MainToolTabID.posing, SubToolID.p3d_locateHead, false)
  edit = new MainToolTab(MainToolTabID.edit, SubToolID.lineBrushSelect, false)
  edit_disabled = new MainToolTab(MainToolTabID.edit_disabled, SubToolID.lineBrushSelect, true)
  document = new MainToolTab(MainToolTabID.document, SubToolID.editDocumentFrame, false)
  layer = new MainToolTab(MainToolTabID.layer, SubToolID.drawLine, false)
  view = new MainToolTab(MainToolTabID.view, SubToolID.drawLine, false)
}

export interface AppTool_Interface {

  setCurrentSubTool(subtoolID: SubToolID)
  startModalTool(subtoolID: SubToolID)
}

export class MainTool {

  mainToolID = MainToolID.none // @virtual
  mainToolTabs: MainToolTab[] = []
  drawMode_MainToolTab: MainToolTab = null

  keydown(_key: string, _ctx: SubToolContext, _appTool: AppTool_Interface): boolean { // @virtual

    return false
  }

  buttonClick(_id: RibbonUIControlID, _ctx: SubToolContext, _appTool: AppTool_Interface): boolean { // @virtual

    return false
  }
}
