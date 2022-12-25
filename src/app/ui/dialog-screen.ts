import { ExportImageFileParam } from "../ui-modal-window"
import { UI_SelectBoxPopoverRef } from "../ui-popover"
import { Command_Layer_CommandBase } from "../commands"
import { DocumentData } from "../document-data"
import { DOMElementID, DOMValueLogic } from "../dom"
import { DOMLogic } from "../dom/dom"
import { Strings } from "../common-logics"
import { UI_Dialog_DocumentFilerRef, UI_Dialog_DocumentFiler_DialogType, UI_Dialog_ShortcutKeysRef } from "../ui-dialog-screen"
import { ShortcutKeyLogic, UserSettingFileLogic } from "../user-setting"

export interface DialogScreenRef {

  onDialogScreenOpened?: () => void
  onDialogScreenClosed?: () => void
}

// Custmbox dialogs
// TODO: replace to React
declare let Custombox: { modal }
export interface DialogWindow_Main_Interface {

  getDocumentData(): DocumentData
  updateForLayerProperty()
  exportImageFile(param: ExportImageFileParam)
  executeLayerCommand(layerCommand: Command_Layer_CommandBase)
}
export interface DialogWindowContext {

  readonly dialog: DialogScreenLogic
  readonly dom: DOMValueLogic
  readonly ID: DOMElementID
  readonly main: DialogWindow_Main_Interface
}
export interface DialogWindow {

  onClose(ctx: DialogWindowContext)
}

export class DialogScreenLogic {

  currentModalDialogResult: string = null

  uiDocumentFilerRef: UI_Dialog_DocumentFilerRef = {}
  uiShortcutKeysRef: UI_Dialog_ShortcutKeysRef = {}

  private _isOpened = false

  private currentModalDialogWindow: DialogWindow = null
  private currentModalDialogID: string = null
  private currentModalFocusElementID: string = null
  private modalOverlayOption = {
    speedIn: 0,
    speedOut: 100,
    opacity: 0.0
  }
  private modalLoaderOption = {
    active: false
  }
  private dialogWindowContext: DialogWindowContext = null

  constructor() {

    this.setCallbacks(this.uiDocumentFilerRef)
    this.setCallbacks(this.uiShortcutKeysRef)
  }

  private setCallbacks(ref: DialogScreenRef) {

    ref.onDialogScreenOpened = () => {

      this._isOpened = true
    }

    ref.onDialogScreenClosed = () => {

      this._isOpened = false
    }
  }

  isActive(): boolean {

    return this._isOpened
  }

  link(main: DialogWindow_Main_Interface, dom: DOMLogic, selectBoxRef: UI_SelectBoxPopoverRef) {

    this.dialogWindowContext = {
      dialog: this,
      dom: dom.value,
      ID: dom.ID,
      main: main
    }

    this.uiShortcutKeysRef.selectBoxPopoverRef = selectBoxRef
  }

  openDocumentFilerDialog(dialogType: UI_Dialog_DocumentFiler_DialogType, filePath: string, userSetting: UserSettingFileLogic) {

    this.uiDocumentFilerRef.show(
      dialogType,
      filePath,
      userSetting
    )
  }

  openShortcutKeysDialog(userSetting: UserSettingFileLogic, shortcutKey: ShortcutKeyLogic) {

    this.uiShortcutKeysRef.show(
      userSetting,
      shortcutKey
    )
  }

  // Custmbox dialogs
  // TODO: replace to React

  openDialogWindow(modalID: string, focusElementName: string, dialogWindow: DialogWindow = null) {

    if (this.isDialogWindowOpened()) {
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

  closeDialogWindow() {

    Custombox.modal.closeAll()
  }

  onDialogWindowClosed() {

    if (this.currentModalDialogWindow) {

      this.currentModalDialogWindow.onClose(this.dialogWindowContext)
    }

    this.currentModalDialogWindow = null
    this.currentModalDialogID = this.dialogWindowContext.ID.none
    this.currentModalDialogResult = this.dialogWindowContext.ID.none
  }

  isDialogWindowOpened(): boolean {

    return (!Strings.isNullOrEmpty(this.currentModalDialogID) && this.currentModalDialogID != this.dialogWindowContext.ID.none)
  }

  onDialogWindowShown() {

    if (!Strings.isNullOrEmpty(this.currentModalFocusElementID)) {

      const element = this.dialogWindowContext.dom.getElement(this.currentModalFocusElementID)
      element.focus()
    }
  }

  messageBox(text: string) {

    if (this.isDialogWindowOpened()) {
      return
    }

    this.dialogWindowContext.dom.setElementText(this.dialogWindowContext.ID.messageDialogModal_message, text)

    this.openDialogWindow(this.dialogWindowContext.ID.messageDialogModal, this.dialogWindowContext.ID.messageDialogModal_ok)
  }
}
