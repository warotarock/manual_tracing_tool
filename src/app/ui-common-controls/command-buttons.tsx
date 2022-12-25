import * as React from 'react'
import { int } from '../common-logics'
import { UI_CommandButton, UI_CommandButtonItem } from './command-button'

export interface UI_CommandButtonsRef {

  items: UI_CommandButtonItem[]
  setCommandButtonState?: (index: int, isSelected: boolean) => void

  commandButton_Clicked?: (item: UI_CommandButtonItem) => void
}

export interface UI_CommandButtonsParam {

  border?: boolean
  uiRef: UI_CommandButtonsRef
}

export function UI_CommandButtons({ uiRef, border = false }: UI_CommandButtonsParam) {

  React.useEffect(() => {

    uiRef.setCommandButtonState = (index: int, isSelected: boolean) => {

      uiRef.items[index].isSelected = isSelected
    }

    return function cleanup() {

      uiRef.setCommandButtonState = null
    }
  }, [])

  return (
    <div className='ui-command-buttons-container'>
      {
        uiRef.items.map(item => (
          item.isSeparator ? <div key={item.index} className='separator'></div>
          : <UI_CommandButton key={item.index} commandButtonItem={item} onClick={uiRef.commandButton_Clicked} border={border} />
        ))
      }
    </div>
  )
}
