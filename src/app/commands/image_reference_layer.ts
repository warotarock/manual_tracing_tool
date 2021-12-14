import { CommandBase } from "../command/command"
import { SubToolContext } from "../context/subtool_context"
import { ImageFileReferenceLayer } from "../document_data"
import { Strings } from "../logics/conversion"
import { ImageResource } from "../posing3d/posing3d_view"

export class Command_SetReferenceImageToLayer extends CommandBase {

  targetLayer: ImageFileReferenceLayer = null
  filePath: string = null
  image: HTMLImageElement = null

  private oldFilePath: string = null
  private oldImage: HTMLImageElement = null

  private newFilePath: string = null
  private newImage: HTMLImageElement = null

  execute(ctx: SubToolContext) { // @override

    this.oldFilePath = this.targetLayer.imageFilePath
    this.oldImage = this.targetLayer.imageResource.image.imageData

    this.newFilePath = Command_SetReferenceImageToLayer.getFileName(this.filePath)
    this.newImage = this.image

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.oldFilePath
    this.targetLayer.imageResource.image.imageData = this.oldImage

    Command_SetReferenceImageToLayer.setLoadedState(this.targetLayer.imageResource)

    ctx.setRedrawAllWindows()
  }

  redo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.newFilePath
    this.targetLayer.imageResource.image.imageData = this.newImage

    Command_SetReferenceImageToLayer.setLoadedState(this.targetLayer.imageResource)

    ctx.setRedrawAllWindows()
  }

  errorCheck() {

    if (this.targetLayer == null) {
      throw new Error('ERROR 0501:Command_LoadReferenceImageToLayer: layer is null!')
    }

    if (Strings.isNullOrEmpty(this.filePath)) {
      throw new Error('ERROR 0502:Command_LoadReferenceImageToLayer: new file path is empty!')
    }

    if (this.image == null) {
      throw new Error('ERROR 0503:Command_LoadReferenceImageToLayer: new image is null!')
    }
  }

  static getFileName(filePath: string): string {

    const lastIndex = Strings.lastIndexOf(filePath, '\\')
    if (lastIndex != -1) {

      const startIndex = lastIndex + 1
      return Strings.substring(filePath, startIndex, filePath.length - startIndex)
    }
    else {

      return filePath
    }
  }

  static setLoadedState(imageResource: ImageResource) {

    imageResource.loaded = (imageResource.image.imageData != null)
  }
}

export class Command_LoadReferenceImageToLayer extends CommandBase {

  targetLayer: ImageFileReferenceLayer = null
  filePath: string = null

  private oldFilePath: string = null

  private newFilePath: string = null

  execute(ctx: SubToolContext) { // @override

    this.errorCheck()

    this.newFilePath = Command_SetReferenceImageToLayer.getFileName(this.filePath)
    this.oldFilePath = this.targetLayer.imageFilePath

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.oldFilePath
    this.targetLayer.imageResource.loaded = false

    ctx.startLoadingCurrentDocumentResources()
  }

  redo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.newFilePath

    if (this.targetLayer.imageResource != null) {

      this.targetLayer.imageResource.loaded = false
    }
    else {

      this.targetLayer.imageFirstLoading = true
    }

    ctx.startLoadingCurrentDocumentResources()
  }

  errorCheck() {

    if (this.targetLayer == null) {
      throw new Error('ERROR 0504:Command_LoadReferenceImageToLayer: layer is null!')
    }

    if (Strings.isNullOrEmpty(this.filePath)) {
      throw new Error('ERROR 0505:Command_LoadReferenceImageToLayer: new file path is empty!')
    }
  }
}
