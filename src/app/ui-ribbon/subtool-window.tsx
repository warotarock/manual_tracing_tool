import * as React from 'react'
import { SubToolViewItem } from '../ui'
import { UI_RibbonUIRef } from './ribbon-ui'

export interface UI_SubToolWindowRef {

  items: SubToolViewItem[]

  update?(items: SubToolViewItem[], subToolIndex: number): void

  item_Click?(item: SubToolViewItem): void
  itemButton_Click?(item: SubToolViewItem): void
}

export interface UI_SubToolWindowParam {

  ribbonUIRef: UI_RibbonUIRef
  subToolWindowUIRef: UI_SubToolWindowRef
  isVisible: boolean
}

const itemScale = 0.9

export function UI_SubToolWindow({ ribbonUIRef, subToolWindowUIRef, isVisible }: UI_SubToolWindowParam) {

  const [items, setItems] = React.useState(subToolWindowUIRef.items)

  const [active_SubToolIndex, setActive_SubToolIndex] = React.useState(ribbonUIRef.docContext.subtoolID)

  React.useEffect(() => {

    subToolWindowUIRef.update = (items: SubToolViewItem[], subToolIndex: number) => {

      setItems(items)
      setActive_SubToolIndex(subToolIndex)
    }

    return function cleanup() {

      subToolWindowUIRef.update = null
    }
  }, [])

  function item_Clicked(e: React.MouseEvent, item: SubToolViewItem) {

    if (e.button == 0) {

      subToolWindowUIRef.item_Click(item)
    }
  }

  function itemButton_Clicked(e: React.MouseEvent, item: SubToolViewItem) {

    if (e.button == 0) {

      subToolWindowUIRef.itemButton_Click(item)
    }
  }

  return (
    <div className={`subtool-window${!isVisible ? ' hidden': ''}`}>
        {
          items.map(item => (
            <div key={item.subToolID}
              className={`item selectable-item ${active_SubToolIndex == item.subToolID ? 'selected' : ''}`}
              onMouseDown={(e) => { item_Clicked(e, item) }}
            >
              <div
                className={`item-inner selectable-item-inner ${item.tool.toolBarImage.cssImageClassName}`}
                style={{ backgroundPosition: `0 -${item.tool.toolBarImageIndex * 64 * itemScale}px`, opacity: (item.isAvailable ? 1.0 : 0.5) }}
              >
                <div className='spacer'></div>
                {item.buttons.length > 0 ?
                  <div className='command-button image-splite-system'
                    style={{ backgroundPosition: `-${(item.buttonStateID - 1) * 64 * itemScale}px 0` }}
                    onMouseDown={(e) => { itemButton_Clicked(e, item) } }
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
