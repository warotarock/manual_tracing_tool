import { SubToolContext } from '../context'
import { RibbonUIControlID } from '../ui'
import { ShortcutCommandID } from '../user-setting'
import { SubTool, SubToolID } from './sub-tool'

export enum MainToolID {

  none = 0,
  group,
  vector,
  posing3D,
  imageFileReference,
  autoFill,
  pointBrushFill,
}

export enum MainToolTabID {

  none = 0,
  group,
  drawing,
  imageFileReference,
  autoFill,
  pointBrushFill,
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

export interface MainToolTabSubToolCommand {

  commandID: ShortcutCommandID
  subToolID: SubToolID
}

export class MainToolTab { // @virtual

  tabID: MainToolTabID // @virtual
  type = MainToolTabTypeID.manipulatingTool // @virtual
  default_SubToolID = SubToolID.none // @virtual
  disabled: boolean = false // @virtual

  current_SubTool: SubTool = null

  isAvailable(_ctx: SubToolContext): boolean { // @virtual
    return false
  }

  keydown(_key: string, _commandID: ShortcutCommandID, _ctx: SubToolContext): boolean { // @virtual
    return false
  }

  buttonClick(_id: RibbonUIControlID, _ctx: SubToolContext): boolean { // @virtual
    return false
  }

  processSubToolKeyDown(commands: MainToolTabSubToolCommand[], commandID: ShortcutCommandID, ctx: SubToolContext) {

    for (const command of commands) {

      if (commandID == command.commandID) {

        ctx.tool.changeCurrentSubToolForSubtoolID(command.subToolID)

        return true
      }
    }

    return false
  }

  processToggleSubTool(targetCommandID: ShortcutCommandID, changeTo_SubToolID: SubToolID, returnTo_SubToolID: SubToolID, commandID: ShortcutCommandID, ctx: SubToolContext) {

    if (commandID == targetCommandID) {

      if (ctx.currentSubtoolID != changeTo_SubToolID) {

        ctx.tool.changeCurrentSubToolForSubtoolID(changeTo_SubToolID)
      }
      else {

        ctx.tool.changeCurrentSubToolForSubtoolID(returnTo_SubToolID)
      }

      return true
    }

    return false
  }
}

export class MainToolCommonTabSet {

  edit: MainToolTab
  edit_disabled: MainToolTab
  document: MainToolTab
  layer: MainToolTab
  view: MainToolTab
}

export class MainTool { // @virtual

  mainToolID = MainToolID.none // @virtual
  mainToolTabs: MainToolTab[] = []
  drawMode_MainToolTab: MainToolTab = null
}
