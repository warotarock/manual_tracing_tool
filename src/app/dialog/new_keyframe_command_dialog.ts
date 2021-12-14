import { DialogWindow, DialogWindowContext } from "./dialog"

export enum NewKeyframeTypeID {

  none = 0,
  insertToCurrentFrameAllLayer = 1,
}

export class NewKeyframeCommandDialog implements DialogWindow {

  open(ctx: DialogWindowContext) {

    ctx.dialog.openDialog(ctx.ID.newKeyframeModal, null, this)
  }

  onClose(ctx: DialogWindowContext) {

    if (ctx.dialog.currentModalDialogResult != ctx.ID.newKeyframeModal_ok) {
      return
    }

    const typeID = <NewKeyframeTypeID>(ctx.dom.getRadioElementIntValue(ctx.ID.newKeyframeModal_InsertType, NewKeyframeTypeID.none))

    if (typeID != NewKeyframeTypeID.none) {

      ctx.main.executeNewKeyframe(typeID)
    }
  }
}
