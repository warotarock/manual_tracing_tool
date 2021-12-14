import { DialogWindow, DialogWindowContext } from "./dialog"

export enum DeleteKeyframeTypeID {

  none = 0,
  deleteToCurrentFrameAllLayer = 1,
}

export class DeleteKeyframeCommandDialog implements DialogWindow {

  open(ctx: DialogWindowContext) {

    ctx.dialog.openDialog(ctx.ID.deleteKeyframeModal, null, this)
  }

  onClose(ctx: DialogWindowContext) {

    if (ctx.dialog.currentModalDialogResult != ctx.ID.deleteKeyframeModal_ok) {
      return
    }

    const typeID = <DeleteKeyframeTypeID>(ctx.dom.getRadioElementIntValue(ctx.ID.newKeyframeModal_InsertType, DeleteKeyframeTypeID.none))

    if (typeID != DeleteKeyframeTypeID.none) {

      ctx.main.executeDeleteKeyframe(typeID)
    }
  }
}
