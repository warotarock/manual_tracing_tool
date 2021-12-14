import { Strings } from "../logics/conversion"
import { DialogWindow, DialogWindowContext } from "./dialog"

export enum OpenFileDialogTargetID {

  none,
  openDocument = 1,
  saveDocument = 2,
  imageFileReferenceLayerFilePath = 3
}

export class OpenFileDialog implements DialogWindow {

  openFileDialogTargetID = OpenFileDialogTargetID.none

  open(targetID: OpenFileDialogTargetID, ctx: DialogWindowContext) {

    this.openFileDialogTargetID = targetID

    ctx.dialog.openDialog(ctx.ID.openFileDialogModal, null, this)
  }

  onClose(ctx: DialogWindowContext) {

    if (ctx.dialog.currentModalDialogResult != ctx.ID.openFileDialogModal_ok) {
      return
    }

    const filePath = ctx.dom.getInputElementFilePath(ctx.ID.openFileDialogModal_file)

    if (Strings.isNullOrEmpty(filePath)) {
      return
    }

    if (this.openFileDialogTargetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

      // TODO: 不要であることが確定した時点でこのクラスごと削除する
      // ctx.main.executeToolOnOpenFile(filePath)
    }

    this.openFileDialogTargetID = OpenFileDialogTargetID.none
  }
}
