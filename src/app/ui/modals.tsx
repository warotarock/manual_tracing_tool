import * as React from 'react'
import { ModalWindowParam, ModalWindowID } from '../window/modal_window'
import { UI_Modal_ImageFileReference } from './modal_image_file_ref'
import { UI_OverlayContainer, UI_OverlayContainerRef, UI_OverlayContainerTypeID } from './overlay_conatiner'

export interface UI_ModalsRef {

  emptyModalWindowParam: ModalWindowParam

  open?(ref: ModalWindowParam)
  close?()
}

export interface UI_ModalsParam {

  uiRef: UI_ModalsRef
}

export interface ModalsState {

  modalWindowID: ModalWindowID
  modalWindowParam: ModalWindowParam
}

export function UI_Modals({ uiRef }: UI_ModalsParam) {

  const overlayContainerRef = React.useRef<UI_OverlayContainerRef>(null)

  const [modalWindowParam, set_modalWindowParam] = React.useState<ModalWindowParam>(uiRef.emptyModalWindowParam)

  React.useEffect(() => {

    uiRef.open = (param: ModalWindowParam) => {

      overlayContainerRef.current.show()

      set_modalWindowParam(param)
    }

    uiRef.close = () => {

      overlayContainerRef.current.hide()

      set_modalWindowParam(uiRef.emptyModalWindowParam)
    }

    overlayContainerRef.current.onEscape = (_e: React.KeyboardEvent) => {

      uiRef.close()
    }

    return function cleanup() {

      uiRef.open = null
      uiRef.close = null
    }
  })

  return (
    <UI_OverlayContainer
      type={UI_OverlayContainerTypeID.modalWindow}
      overlayContainerRef={overlayContainerRef}
    >
      <div className="modal-window-container">
        <div className="modal-window-header">
          {modalWindowParam.modalWindowTitle}
        </div>
        <div className="modal-window-content">
          {modalWindowParam.modalWindowID == ModalWindowID.openImageReferenceWindow &&
            <UI_Modal_ImageFileReference modalsRef={uiRef} uiRef={modalWindowParam.uiRef} ></UI_Modal_ImageFileReference>}
        </div>
      </div>
    </UI_OverlayContainer>
  )
}
