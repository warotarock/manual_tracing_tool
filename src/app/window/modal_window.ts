import { UI_ModalsRef } from "../ui/modals"
import { ModalWindowParam_ImageFileReference } from "../ui/modal_image_file_ref"

export enum ModalWindowID {

  none = 0,
  openImageReferenceWindow = 1,
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

  uiRef: UI_ModalsRef = {
    emptyModalWindowParam: new EmptyModalWindowParam()
  }

  openImageReference = new ModalWindowParam_ImageFileReference()

  open(modalWindowParam: ModalWindowParam) {

    this.uiRef.open(modalWindowParam)
  }
}
