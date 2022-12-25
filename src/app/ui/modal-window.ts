import { DocumentContext } from "../context"
import { int } from "../common-logics"
import { RadioSelectionOption } from "../ui-common-controls"
import { UI_Modal_ExportImageRef, UI_Modal_ImageFileReferenceRef, UI_Modal_RadioSelectionRef } from "../ui-modal-window"
import { LocalSetting } from "../user-setting"

export enum ModalWindowID {

  none = 0,
  openImageReferenceWindow = 1,
}

export interface ModalWindowRef {

  onModalWindowOpened?: () => void
  onModalWindowClosed?: () => void
}

export interface ModalWindowParam {

  modalWindowID: ModalWindowID
  modalWindowTitle: string
  uiRef: any
}

export class EmptyModalWindowParam {

  modalWindowID = ModalWindowID.none
  modalWindowTitle = ''
  uiRef: any = null
}

export class ModalWindowLogic {

  uiRadioSelectionRef: UI_Modal_RadioSelectionRef = {}
  uiImageFileReferenceRef: UI_Modal_ImageFileReferenceRef = {}
  uiExportImageRef: UI_Modal_ExportImageRef = {}

  private _isOpened = false

  constructor() {

    this.setCallbacks(this.uiRadioSelectionRef)
    this.setCallbacks(this.uiImageFileReferenceRef)
    this.setCallbacks(this.uiExportImageRef)
  }

  private setCallbacks(ref: ModalWindowRef) {

    ref.onModalWindowOpened = () => {

      this._isOpened = true
    }

    ref.onModalWindowClosed = () => {

      this._isOpened = false
    }
  }

  isActive(): boolean {

    return this._isOpened
  }

  showRadioSelectionModal(
    windowTitle: string,
    options: RadioSelectionOption[],
    selectedIndex: int,
    callback: (option: RadioSelectionOption) => void
  ) {

    this.uiRadioSelectionRef.selection_Fixed = callback

    this.uiRadioSelectionRef.show(
      windowTitle,
      options,
      selectedIndex
    )
  }

  openImageFileReferenceModal() {

    this.uiImageFileReferenceRef.show()
  }

  openExportImageModal(docContext: DocumentContext, localSetting: LocalSetting) {

    this.uiExportImageRef.show(
      docContext,
      localSetting
    )
  }
}
