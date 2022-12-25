import * as React from 'react'
import { int } from '../common-logics'
import { RadioSelectionOption, UI_RadioButtons } from '../ui-common-controls'
import { ModalWindowID, ModalWindowRef } from '../ui'
import { UI_ModalWindowContainer, UI_ModalWindowContainerRef } from './modal-window-container'

export interface UI_Modal_RadioSelectionRef extends ModalWindowRef {

  show?(windowTitle: string, options: RadioSelectionOption[], selectedIndex: int): void
  hide?(): void

  selection_Fixed?: (selectedOption: RadioSelectionOption) => void
  selection_Cancled?: () => void
}

export interface UI_Modal_RadioSelectionParam {

  uiRef: UI_Modal_RadioSelectionRef
}

export class ModalWindowParam_RadioSelection {

  modalWindowID = ModalWindowID.openImageReferenceWindow
  modalWindowTitle = ''
  uiRef: UI_Modal_RadioSelectionRef = {}
}

export function UI_Modal_RadioSelection({ uiRef }: UI_Modal_RadioSelectionParam) {

  const [windowTitle, set_windowTitle] = React.useState('')
  const [options, set_options] = React.useState<RadioSelectionOption[]>([])
  const [selectedIndex, set_selectedIndex] = React.useState(0)
  const modalWindowContainerRef = React.useMemo<UI_ModalWindowContainerRef>(() => ({}), [])

  React.useEffect(() => {

    uiRef.show = (new_WindowTitle, new_Options, new_selectedIndex) => {

      set_windowTitle(new_WindowTitle)
      set_options(new_Options)

      if (new_Options.find(option => option.index == new_selectedIndex)) {

        set_selectedIndex(new_selectedIndex)
      }
      else {

        throw new Error('ERROR 2001:Invalid default selected index')
      }

      modalWindowContainerRef.show(uiRef)
    }

    uiRef.hide = () => {

      modalWindowContainerRef.hide(uiRef)
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.hide = null
    }
  }, [])

  function option_Clicked(option: RadioSelectionOption) {

    set_selectedIndex(option.index)
  }

  function ok_Clicked() {

    if (uiRef.selection_Fixed) {

      const option = options.find(opt => opt.index == selectedIndex)

      uiRef.selection_Fixed(option)
    }

    uiRef.hide()
  }

  function cancel_Clicked() {

    uiRef.hide()

    if (uiRef.selection_Cancled) {

      uiRef.selection_Cancled()
    }
  }

  function modal_Escaped() {

    uiRef.hide()
  }

  return (
    <UI_ModalWindowContainer
      modalWindowTitle={windowTitle}
      uiRef={modalWindowContainerRef}
      onEscape={modal_Escaped}
    >
      <div className='modal-radio-selection'>
        <div className='options'>
          <UI_RadioButtons
            options={options}
            selectedIndex={selectedIndex}
            onClick={option_Clicked}
          />
        </div>
        <div className='ok-cancel-buttons'>
          <button className={`app-button-primary`} onClick={ok_Clicked}>確定</button>
          <button className='app-button-cancel' onClick={cancel_Clicked}>キャンセル</button>
        </div>
      </div>
    </UI_ModalWindowContainer>
  )
}
