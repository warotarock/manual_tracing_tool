import * as React from 'react'
import { PaletteColor } from '../document-data'
import { ColorLogic, int } from '../common-logics'
import { UI_CommandButtonItem, UI_CommandButtons, UI_CommandButtonsRef } from '../ui-common-controls'
import { PaletteSelectorWindowButtonID } from '../ui'

export interface UI_PaletteSelectorWindowRef {

  update?(items: PaletteColor[]): void

  setCommandButtonState?: (index: int, isSelected: boolean) => void

  commandButton_Click?: (item: UI_CommandButtonItem) => void
  item_Click?: (paletteColorIndex: int, item: PaletteColor) => void
}

export interface UI_PaletteSelectorWindowParam {

  uiRef: UI_PaletteSelectorWindowRef
}

export function UI_PaletteSelectorWindow({ uiRef }: UI_PaletteSelectorWindowParam) {

  const [items, setItems] = React.useState([] as PaletteColor[])

  const commandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: PaletteSelectorWindowButtonID.lineColor, icon: 'pencil', title: '線色' },
        { index: PaletteSelectorWindowButtonID.fillColor, icon: 'paint', title: '塗り色' },
        { index: PaletteSelectorWindowButtonID.adjustmentMode, icon: 'tune', title: '現在のレイヤーに関係なく調整' },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        uiRef.commandButton_Click(item)
      }
    }
  }, [])

  React.useEffect(() => {

    uiRef.update = (items: PaletteColor[]) => {

      setItems(items.slice())
    }

    uiRef.setCommandButtonState = (index: int, isSelected: boolean) => {

      commandButtonsRef.setCommandButtonState(index, isSelected)
    }

    return function cleanup() {

      uiRef.update = null
    }
  }, [])

  return (
    <div className="palette-selector-window">
      <div className='command-buttons-container'>
        <UI_CommandButtons uiRef={commandButtonsRef}/>
      </div>
      <div className='items-container'>
        <div className='items'>
          {
            items.map((item, index) => (
              <UI_PaletteSelectorItem key={index} item={item} index={index} uiRef={uiRef} />
            ))
          }
        </div>
      </div>
    </div>
  )
}

function UI_PaletteSelectorItem({ item, index, uiRef }: { item: PaletteColor, index: int, uiRef: UI_PaletteSelectorWindowRef }) {

  return (
    <div className='item-container'
      onMouseDown={(e) => { if (e.button == 0) { uiRef.item_Click(index, item) } }}
    >
      <div className={`item ${item.isSelected ? 'selected' : ''}`}>
        <div className="alpha alpha-checker-background-pallete">
          <div className="alpha-color" style={{backgroundColor:`rgba(${ColorLogic.rgbaToRgbaString(item.color)})`}}></div>
        </div>
        <div className="rgb" style={{backgroundColor:`#${ColorLogic.rgbToHex2String(item.color)}`}}></div>
      </div>
    </div>
  )
}
