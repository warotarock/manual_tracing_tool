import { int, Strings } from "../logics/conversion"
import { DocumentBackGroundTypeID, DocumentData } from "../document_data"
import { DocumentDeserializingLogic } from "../document_logic"
import { DialogWindow, DialogWindowContext } from "./dialog"
import { LocalSetting } from "../preferences/local_setting"

export class ExportImageDialog implements DialogWindow {

  open(documentData: DocumentData, localSetting: LocalSetting, ctx: DialogWindowContext) {

    const exportFileName = ctx.dom.getInputElementText(ctx.ID.exportImageFileModal_fileName)

    if (Strings.isNullOrEmpty(exportFileName)) {

      const filePath = ctx.dom.getInputElementText(ctx.ID.fileName)
      const exportFileName = DocumentDeserializingLogic.getExportFileName(filePath, documentData)

      ctx.dom.setInputElementText(ctx.ID.exportImageFileModal_fileName, exportFileName)
    }

    ctx.dom.setInputElementText(ctx.ID.exportImageFileModal_directory, localSetting.exportPath)

    ctx.dom.setRadioElementIntValue(ctx.ID.exportImageFileModal_backGroundType, <int>documentData.exportBackGroundType)

    ctx.dialog.openDialog(ctx.ID.exportImageFileModal, ctx.ID.exportImageFileModal_ok, this)
  }

  onClose(ctx: DialogWindowContext) {

    if (ctx.dialog.currentModalDialogResult != ctx.ID.exportImageFileModal_ok) {
      return
    }

    const fileName = ctx.dom.getInputElementText(ctx.ID.exportImageFileModal_fileName)

    if (Strings.isNullOrEmpty(fileName)) {
      return
    }

    const exportPath =  ctx.dom.getInputElementText(ctx.ID.exportImageFileModal_directory)

    const backGroundType = <DocumentBackGroundTypeID>(ctx.dom.getRadioElementIntValue(ctx.ID.exportImageFileModal_backGroundType, 1))
    const scale = ctx.dom.getInputElementNumber(ctx.ID.exportImageFileModal_scale, 1.0)

    const imageType = ctx.dom.getRadioElementIntValue(ctx.ID.exportImageFileModal_imageFileType, 1)
    ctx.main.exportImageFile(fileName, exportPath, scale, imageType, backGroundType)
  }
}
