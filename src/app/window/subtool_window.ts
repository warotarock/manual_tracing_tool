import { InputSideID } from '../document_data'
import { RectangleLayoutArea } from '../logics/layout'
import { UI_SubToolWindowRef } from '../ui/subtool_window'
import { MainTool } from '../tool/main_tool'
import { SubToolID, SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'

export class SubToolViewItemOptionButton extends RectangleLayoutArea {
}

export class SubToolViewItem extends RectangleLayoutArea {

  subToolID = SubToolID.none
  isAvailable = false
  buttonStateID = InputSideID.front
  tool: SubTool = null
  buttons: SubToolViewItemOptionButton[] = []
}

export class SubToolWindow {

  subToolViewItems: SubToolViewItem[] = []
  uiSubToolWindowRef: UI_SubToolWindowRef = { items: []}

  subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0)
  subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5)

  collectViewItems(subTools: SubTool[], ctx: SubToolContext) {

    this.subToolViewItems = []

    for (const subtool of subTools) {

      const viewItem = new SubToolViewItem()
      viewItem.subToolID = subtool.subtoolID
      viewItem.tool = subtool

      for (let buttonIndex = 0; buttonIndex < subtool.inputOptionButtonCount; buttonIndex++) {

        const button = new SubToolViewItemOptionButton()
        button.index = buttonIndex

        viewItem.buttons.push(button)
      }

      this.updateItemState(viewItem, ctx)

      this.subToolViewItems.push(viewItem)
    }

    this.uiSubToolWindowRef.items = this.subToolViewItems
  }

  updateViewItemState(ctx: SubToolContext) {

    for (const viewItem of this.subToolViewItems) {

      this.updateItemState(viewItem, ctx)
    }
  }

  private updateItemState(viewItem: SubToolViewItem, ctx: SubToolContext) {

    viewItem.isAvailable = viewItem.tool.isAvailable(ctx)

    if (viewItem.buttons.length > 0) {

      viewItem.buttonStateID = viewItem.tool.getOptionButtonState(0, ctx)
    }
  }
}
