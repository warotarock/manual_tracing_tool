import { CommandBase } from "../command"
import { Strings } from "../common-logics"
import { SubToolContext } from "../context"
import { ImageFileReferenceLayer } from "../document-data"
import { DocumentFileNameLogic } from "../document-logic"
import { ImageResource } from "../posing3d"

export class Command_SetReferenceImageToLayer extends CommandBase {

  targetLayer: ImageFileReferenceLayer = null
  filePath: string = null
  image: HTMLImageElement = null

  private oldFilePath: string = null
  private oldAbsoluteFilePath: string = null
  private oldImage: HTMLImageElement = null
  private oldLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private oldScale = vec3.fromValues(1.0, 1.0, 1.0)
  private oldRotation = vec3.fromValues(0.0, 0.0, 0.0)

  private newFilePath: string = null
  private newAbsoluteFilePath: string = null
  private newImage: HTMLImageElement = null
  private newLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private newScale = vec3.fromValues(1.0, 1.0, 1.0)
  private newRotation = vec3.fromValues(0.0, 0.0, 0.0)

  execute(ctx: SubToolContext) { // @override

    this.oldFilePath = this.targetLayer.imageFilePath
    this.oldAbsoluteFilePath = this.targetLayer.runtime.imageResource.filePath
    this.oldImage = this.targetLayer.runtime.imageResource.image.imageData

    vec3.copy(this.oldLocation, this.targetLayer.location)
    vec3.copy(this.oldScale, this.targetLayer.scale)
    vec3.copy(this.oldRotation, this.targetLayer.rotation)

    this.newFilePath = DocumentFileNameLogic.getDocumentRelativeFilePath(ctx.documentFilePath, this.filePath)
    this.newAbsoluteFilePath = this.filePath

    this.newImage = this.image
    vec3.set(this.newLocation, -this.newImage.width / 2, -this.newImage.height / 2, 0.0)
    vec3.copy(this.oldLocation, this.targetLayer.location)

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.oldFilePath
    this.targetLayer.runtime.imageResource.filePath = this.oldAbsoluteFilePath
    this.targetLayer.runtime.imageResource.image.imageData = this.oldImage

    vec3.copy(this.targetLayer.location, this.oldLocation)
    vec3.copy(this.targetLayer.scale, this.oldScale)
    vec3.copy(this.targetLayer.rotation, this.oldRotation)

    Command_SetReferenceImageToLayer.setLoadedState(this.targetLayer.runtime.imageResource)

    ctx.setRedrawAllWindows()
  }

  redo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.newFilePath
    this.targetLayer.runtime.imageResource.filePath = this.newAbsoluteFilePath
    this.targetLayer.runtime.imageResource.image.imageData = this.newImage

    vec3.copy(this.targetLayer.location, this.newLocation)
    vec3.copy(this.targetLayer.scale, this.newScale)
    vec3.copy(this.targetLayer.rotation, this.newRotation)

    Command_SetReferenceImageToLayer.setLoadedState(this.targetLayer.runtime.imageResource)

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

  static setLoadedState(imageResource: ImageResource) {

    imageResource.loaded = (imageResource.image.imageData != null)
    imageResource.error = false
  }
}

export class Command_LoadReferenceImageToLayer extends CommandBase {

  targetLayer: ImageFileReferenceLayer = null
  filePath: string = null

  private oldFilePath: string = null
  private newFilePath: string = null

  execute(ctx: SubToolContext) { // @override

    this.errorCheck()

    this.newFilePath = this.filePath
    this.oldFilePath = this.targetLayer.imageFilePath

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.oldFilePath
    this.targetLayer.runtime.imageResource.loaded = false

    ctx.main.startLoadingDocumentResourcesProcess(ctx.documentData)
  }

  redo(ctx: SubToolContext) { // @override

    this.targetLayer.imageFilePath = this.newFilePath
    this.targetLayer.runtime.imageResource.loaded = false
    this.targetLayer.imageFirstLoading = true

    ctx.main.startLoadingDocumentResourcesProcess(ctx.documentData)
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
