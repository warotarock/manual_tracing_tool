import * as React from 'react'
import { SubToolViewItem } from '../window/subtool_window'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_ScrollView } from './scroll_view'

export interface UI_SubToolWindowRef {

  items: SubToolViewItem[]

  update?(items: SubToolViewItem[], subToolIndex: number): void

  item_Click?(item: SubToolViewItem): void
  itemButton_Click?(item: SubToolViewItem): void
}

export interface UI_SubToolWindowParam {

  ribbonUIRef: UI_RibbonUIRef
  uiRef: UI_SubToolWindowRef
}

const itemScale = 0.9

export function UI_SubToolWindow({ ribbonUIRef, uiRef }: UI_SubToolWindowParam) {

  const [items, setItems] = React.useState(uiRef.items)

  const [active_SubToolIndex, setActive_SubToolIndex] = React.useState(ribbonUIRef.docContext.subtoolID)

  React.useEffect(() => {

    uiRef.update = (items: SubToolViewItem[], subToolIndex: number) => {

      setItems(items)
      setActive_SubToolIndex(subToolIndex)
    }

    return function cleanup() {

      uiRef.update = null
    }
  })

  function item_Click(e: React.MouseEvent, item: SubToolViewItem) {

    if (e.button == 0) {

      uiRef.item_Click(item)
    }
  }

  function itemButton_Click(e: React.MouseEvent, item: SubToolViewItem) {

    if (e.button == 0) {

      uiRef.itemButton_Click(item)
    }
  }

  return (
    <div className="subtool-window">
        {
          items.map(item => (
            <div key={item.subToolID}
              className={`item selectable-item ${active_SubToolIndex == item.subToolID ? 'selected' : ''}`}
              onMouseDown={(e) => { item_Click(e, item) }}
            >
              <div
                className={`item-inner selectable-item-inner ${item.tool.toolBarImage.cssImageClassName}`}
                style={{ backgroundPosition: `0 -${item.tool.toolBarImageIndex * 64 * itemScale}px`, opacity: (item.isAvailable ? 1.0 : 0.5) }}
              >
                <div className='spacer'></div>
                {item.buttons.length > 0 ?
                  <div className='command-button image-splite-system'
                    style={{ backgroundPosition: `-${(item.buttonStateID - 1) * 64 * itemScale}px 0` }}
                    onMouseDown={(e) => { itemButton_Click(e, item) } }
                  ></div>
                  :
                  <div className='command-button'></div>
                }
              </div>
            </div>
          ))
          }
    </div>
  )
}
