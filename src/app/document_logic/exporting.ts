import { float, int } from "../logics/conversion"
import { DocumentData, DocumentBackGroundTypeID } from "../document_data"
import { Platform } from "../../platform/platform"
import { CanvasRender, CanvasWindow } from "../render/render2d"
import { LocalSetting } from "../preferences/local_setting"

export class DocumentExportingLogic {

  canvasRender: CanvasRender = null

  exportRenderWindow = new CanvasWindow()

  createExportImage(documentData: DocumentData, scale: float, backGroundType: DocumentBackGroundTypeID): HTMLCanvasElement {

    const layout = DocumentData.getDocumentLayout(documentData, scale)

    if (layout.width <= 0 || layout.height <= 0) {

      return null
    }

    this.exportRenderWindow.createCanvas()
    this.exportRenderWindow.setCanvasSize(layout.width, layout.height)
    this.exportRenderWindow.initializeContext()

    this.exportRenderWindow.viewLocation[0] = layout.left
    this.exportRenderWindow.viewLocation[1] = layout.top
    this.exportRenderWindow.viewScale = scale
    this.exportRenderWindow.viewRotation = 0.0
    this.exportRenderWindow.centerLocationRate[0] = 0.0
    this.exportRenderWindow.centerLocationRate[1] = 0.0

    // TODO
    // this.clearWindow(this.exportRenderWindow)

    if (backGroundType == DocumentBackGroundTypeID.lastPaletteColor) {

      this.canvasRender.setContext(this.exportRenderWindow)
      this.canvasRender.resetTransform()
      this.canvasRender.setFillColorV(documentData.paletteColors[documentData.paletteColors.length - 1].color)
      this.canvasRender.fillRect(0, 0, layout.width, layout.height)
    }

    // TODO
    // this.drawExportImage(this.exportRenderWindow)

    const canvas = this.exportRenderWindow.releaseCanvas()

    return canvas
  }

  exportImageFile(fileName: string, documentData: DocumentData, scale: float, imageType: int, backGroundType: DocumentBackGroundTypeID, localSetting: LocalSetting) {

    const canvas = this.createExportImage(documentData, scale, backGroundType)

    if (canvas == null) {

      return
    }

    const exportPath = localSetting.exportPath

    let extText = '.png'
    if (imageType == 2) {
      extText = '.jpg'
    }

    const fileFullPath = exportPath + '/' + fileName + extText

    let imageTypeText = 'image/png'
    if (imageType == 2) {
      imageTypeText = 'image/jpeg'
    }

    const dataURL = canvas.toDataURL(imageTypeText, 0.9)

    Platform.fileSystem.writeFile(fileFullPath, dataURL, 'base64')

    // Free canvas memory
    canvas.width = 10
    canvas.height = 10
  }
}
