import { float, int, Strings } from "../logics/conversion"
import { DocumentBackGroundTypeID, DocumentData, Layer } from "../document_data"
import { Command_Layer_CommandBase } from "../commands/edit_layer"
import { DOMOperationLogic } from "../window/dom"
import { DOMElementID } from "../window/dom_element_id"
import { DeleteKeyframeCommandDialog, DeleteKeyframeTypeID } from "./delete_keyframe_command_dialog"
import { ExportImageDialog } from "./export_image_dialog"
import { NewKeyframeCommandDialog, NewKeyframeTypeID } from "./new_keyframe_command_dialog"
import { NewLayerCommandDialog } from "./new_layer_command_dialog"
import { OpenFileDialogTargetID, OpenFileDialog } from "./open_file_dialog"
import { LocalSetting } from "../preferences/local_setting"

declare let Custombox: { modal }

export interface DialogWindow_Main_Interface {

  getLocalSetting(): LocalSetting
  getDocumentData(): DocumentData
  updateForLayerProperty()
  exportImageFile(fileName: string, exportPath: string, scale: float, imageType: int, backGroundType: DocumentBackGroundTypeID)
  executeLayerCommand(layerCommand: Command_Layer_CommandBase)
  executeNewKeyframe(typeID: NewKeyframeTypeID)
  executeDeleteKeyframe(typeID: DeleteKeyframeTypeID)
}

export interface DialogWindowContext {

  readonly dialog: DialogWindowLogic
  readonly dom: DOMOperationLogic
  readonly ID: DOMElementID
  readonly main: DialogWindow_Main_Interface
}

export interface DialogWindow {

  onClose(ctx: DialogWindowContext)
}

export class DialogWindowLogic {

  context: DialogWindowContext = null

  currentModalDialogWindow: DialogWindow = null
  currentModalDialogID: string = null
  currentModalFocusElementID: string = null
  currentModalDialogResult: string = null
  currentModalDialog_DocumentData: DocumentData = null

  modalOverlayOption = {
    speedIn: 0,
    speedOut: 100,
    opacity: 0.0
  }

  modalLoaderOption = {
    active: false
  }

  link(dialog: DialogWindowLogic, dom: DOMOperationLogic, id: DOMElementID, main: DialogWindow_Main_Interface) {

    this.context = {
      dialog: dialog,
      dom: dom,
      ID: id,
      main: main
    }
  }

  openDialog(modalID: string, focusElementName: string, dialogWindow: DialogWindow = null) {

    if (this.isDialogOpened()) {
      return
    }

    this.currentModalDialogID = modalID
    this.currentModalFocusElementID = focusElementName
    this.currentModalDialogWindow = dialogWindow

    const option = {
      content: {
        target: this.currentModalDialogID,
        close: true,
        speedIn: 0,
        delay: 0,
        positionX: 'center',
        positionY: 'center',
        speedOut: 100
      },
      overlay: this.modalOverlayOption,
      loader: this.modalLoaderOption
    }

    const modal = new Custombox.modal(option)

    modal.open()
  }

  closeDialog() {

    Custombox.modal.closeAll()
  }

  onDialogClosed() {

    if (this.currentModalDialogWindow) {

      this.currentModalDialogWindow.onClose(this.context)
    }

    this.currentModalDialogWindow = null
    this.currentModalDialogID = this.context.ID.none
    this.currentModalDialogResult = this.context.ID.none
  }

  isDialogOpened(): boolean {

    return (!Strings.isNullOrEmpty(this.currentModalDialogID) && this.currentModalDialogID != this.context.ID.none)
  }

  onDialogShown() {

    if (!Strings.isNullOrEmpty(this.currentModalFocusElementID)) {

      const element = this.context.dom.getElement(this.currentModalFocusElementID)
      element.focus()
    }
  }

  messageBox(text: string) {

    if (this.isDialogOpened()) {
      return
    }

    this.context.dom.setElementText(this.context.ID.messageDialogModal_message, text)

    this.openDialog(this.context.ID.messageDialogModal, this.context.ID.messageDialogModal_ok)
  }

  exportImageFileDialog() {

    const dialogWindow = new ExportImageDialog()
    dialogWindow.open(this.context.main.getDocumentData(), this.context.main.getLocalSetting(), this.context)
  }

  newLayerCommandOptionDialog() {

    const dialogWindow = new NewLayerCommandDialog()
    dialogWindow.open(this.context.main.getDocumentData(), this.context.main.getLocalSetting(), this.context)
  }

  openFileDialogModal(targetID: OpenFileDialogTargetID) {

    const dialogWindow = new OpenFileDialog()
    dialogWindow.open(targetID, this.context)
  }

  newKeyframeDialog() {

    const dialogWindow = new NewKeyframeCommandDialog()
    dialogWindow.open(this.context)
  }

  deleteKeyframeDialog() {

    const dialogWindow = new DeleteKeyframeCommandDialog()
    dialogWindow.open(this.context)
  }
}
