import { DocumentData } from "../document_data"
import { Command_Layer_CommandBase, Command_Layer_AddVectorLayerToCurrentPosition, Command_Layer_AddAutoFillLayerToCurrentPosition,
  Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition, Command_Layer_AddGroupLayerToCurrentPosition,
  Command_Layer_AddPosingLayerToCurrentPosition, Command_Layer_AddImageFileReferenceLayerToCurrentPosition } from "../commands/edit_layer"
import { DialogWindow, DialogWindowContext } from "./dialog"
import { LocalSetting } from "../preferences/local_setting"

export enum NewLayerTypeID {

  none = 0,
  vectorLayer = 1,
  vectorLayer_Fill = 2,
  autoFill = 3,
  vectorLayerReferenceLayer = 4,
  imageFileReferenceLayer = 5,
  posingLayer = 6,
  groupLayer = 7,
}

export class NewLayerCommandDialog implements DialogWindow {

  documentData: DocumentData = null
  localSetting: LocalSetting = null

  open(documentData: DocumentData, localSetting: LocalSetting, ctx: DialogWindowContext) {

    ctx.dialog.openDialog(ctx.ID.newLayerCommandOptionModal, null, this)
  }

  onClose(ctx: DialogWindowContext) {

    if (ctx.dialog.currentModalDialogResult != ctx.ID.newLayerCommandOptionModal_ok) {

      return
    }

    const newLayerType = ctx.dom.getRadioElementIntValue(ctx.ID.newLayerCommandOptionModal_layerType, NewLayerTypeID.vectorLayer)

    let layerCommand: Command_Layer_CommandBase = null

    switch(newLayerType) {

      case NewLayerTypeID.vectorLayer:
        layerCommand = new Command_Layer_AddVectorLayerToCurrentPosition()
        break

      case NewLayerTypeID.vectorLayer_Fill: {
        const command = new Command_Layer_AddVectorLayerToCurrentPosition()
        command.createForFillColor = true
        layerCommand = command
        break
      }

      case NewLayerTypeID.autoFill:
        layerCommand = new Command_Layer_AddAutoFillLayerToCurrentPosition()
        break

      case NewLayerTypeID.vectorLayerReferenceLayer:
        layerCommand = new Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition()
        break

      case NewLayerTypeID.groupLayer:
        layerCommand = new Command_Layer_AddGroupLayerToCurrentPosition()
        break

      case NewLayerTypeID.posingLayer:
        layerCommand = new Command_Layer_AddPosingLayerToCurrentPosition()
        break

      case NewLayerTypeID.imageFileReferenceLayer:
        layerCommand = new Command_Layer_AddImageFileReferenceLayerToCurrentPosition()
        break
    }


    if (layerCommand == null) {

      return
    }

    ctx.main.executeLayerCommand(layerCommand)
  }
}
