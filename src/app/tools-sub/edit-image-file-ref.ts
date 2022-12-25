import { CommandBase } from '../command'
import { SubToolContext } from '../context'
import { ImageFileReferenceLayer } from '../document-data'
import { RenderImage } from '../render'
import { LatticePointEditTypeID, Tool_Transform_Lattice, TransformModifyType, TransformType } from './transform-lattice'

class Tool_Transform_ReferenceImage extends Tool_Transform_Lattice {

  allEdgeSelection = true // @overrde

  imageSize = vec3.create()
  pointLocation = vec3.create()
  transformMatrix = mat4.create()

  dLocation = vec3.create()

  isAvailable(ctx: SubToolContext): boolean { // @override

    return ctx.isCurrentLayerImageFileReferenceLayer()
  }

  protected checkTarget(ctx: SubToolContext): boolean { // @override

    return ctx.isCurrentLayerImageFileReferenceLayer()
  }

  protected prepareLatticePoints(ctx: SubToolContext): boolean { // @override

    if (!ImageFileReferenceLayer.isLoaded(ctx.currentImageFileReferenceLayer)) {
      return false
    }

    this.calculateImageLatticePoints(
      ctx.currentImageFileReferenceLayer.runtime.imageResource.image,
      ctx.currentImageFileReferenceLayer.location,
      ctx.currentImageFileReferenceLayer.rotation,
      ctx.currentImageFileReferenceLayer.scale
    )

    return this.existsLatticeRectangleArea()
  }

  protected calculateImageLatticePoints(image: RenderImage, location: Vec3, rotation: Vec3, scaling: Vec3) {

    // calculate matrix

    mat4.identity(this.transformMatrix)

    mat4.translate(this.transformMatrix, this.transformMatrix, location)

    const angle = rotation[0]
    mat4.rotateZ(this.transformMatrix, this.transformMatrix, angle)

    vec3.set(this.imageSize, image.width, image.height, 0.0)
    mat4.scale(this.transformMatrix, this.transformMatrix, this.imageSize)
    mat4.scale(this.transformMatrix, this.transformMatrix, scaling)

    // calculate lattice points

    vec3.set(this.pointLocation, 0.0, 0.0, 0.0)
    vec3.transformMat4(this.latticePoints[0].baseLocation, this.pointLocation, this.transformMatrix)

    vec3.set(this.pointLocation, 1.0, 0.0, 0.0)
    vec3.transformMat4(this.latticePoints[1].baseLocation, this.pointLocation, this.transformMatrix)

    vec3.set(this.pointLocation, 1.0, 1.0, 0.0)
    vec3.transformMat4(this.latticePoints[2].baseLocation, this.pointLocation, this.transformMatrix)

    vec3.set(this.pointLocation, 0.0, 1.0, 0.0)
    vec3.transformMat4(this.latticePoints[3].baseLocation, this.pointLocation, this.transformMatrix)
  }

  protected prepareEditData(_ctx: SubToolContext) { // @override

    for (const latticePoint of this.latticePoints) {

      latticePoint.latticePointEditType = LatticePointEditTypeID.allDirection
    }
  }

  protected existsEditData(): boolean { // @override

    return this.existsLatticeRectangleArea()
  }

  protected processTransform(ctx: SubToolContext) { // @override

    const ifrLayer = ctx.currentImageFileReferenceLayer
    const image = ifrLayer.runtime.imageResource.image

    if (this.transformModifyType == TransformModifyType.one) {

      if (this.transformType == TransformType.grabMove) {

        ifrLayer.runtime.adjustingLocation[0] = -ifrLayer.runtime.imageResource.image.width / 2
        ifrLayer.runtime.adjustingLocation[1] = -ifrLayer.runtime.imageResource.image.height / 2
      }
      else if (this.transformType == TransformType.rotate) {

        ifrLayer.runtime.adjustingRotation[0] = 0.0
      }
      else if (this.transformType == TransformType.scale) {

        vec3.set(ifrLayer.runtime.adjustingScale, 1.0, 1.0, 1.0)
      }


      this.calculateImageLatticePoints(
        ctx.currentImageFileReferenceLayer.runtime.imageResource.image,
        ctx.currentImageFileReferenceLayer.runtime.adjustingLocation,
        ctx.currentImageFileReferenceLayer.runtime.adjustingRotation,
        ctx.currentImageFileReferenceLayer.runtime.adjustingScale
      )

      this.resetLatticePointLocationToBaseLocation()

      this.transformModifyType = TransformModifyType.none

      return
    }

    // location
    vec3.copy(ifrLayer.runtime.adjustingLocation, this.latticePoints[0].location)

    // scale
    const scaleX = this.calculateLatticeRectangleWidth(this.dLocation) / image.width
    const scaleY = this.calculateLatticeRectangleHeight(this.dLocation) / image.height

    vec3.set(ifrLayer.runtime.adjustingScale, scaleX, scaleY, 0.0)

    // angle
    const angle = this.calculateLatticeRectangleAngle(this.dLocation)

    ifrLayer.runtime.adjustingRotation[0] = angle
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const ifrLayer = ctx.currentImageFileReferenceLayer

    // Execute the command
    const command = new Command_Transform_ReferenceImage()
    command.targetLayer = ifrLayer

    vec3.copy(command.newLocation, command.targetLayer.runtime.adjustingLocation)
    vec3.copy(command.newRotation, command.targetLayer.runtime.adjustingRotation)
    vec3.copy(command.newScale, command.targetLayer.runtime.adjustingScale)

    ctx.commandHistory.executeCommand(command, ctx)
  }

  cancelModal(ctx: SubToolContext) { // @override

    const ifrLayer = ctx.currentImageFileReferenceLayer

    vec3.copy(ifrLayer.runtime.adjustingLocation, ifrLayer.location)
    vec3.copy(ifrLayer.runtime.adjustingRotation, ifrLayer.rotation)
    vec3.copy(ifrLayer.runtime.adjustingScale, ifrLayer.scale)

    ctx.setRedrawMainWindowEditorWindow()
  }
}

class Command_Transform_ReferenceImage extends CommandBase {

  targetLayer: ImageFileReferenceLayer = null

  newLocation = vec3.fromValues(0.0, 0.0, 0.0)
  newRotation = vec3.fromValues(0.0, 0.0, 0.0)
  newScale = vec3.fromValues(1.0, 1.0, 1.0)

  oldLocation = vec3.fromValues(0.0, 0.0, 0.0)
  oldRotation = vec3.fromValues(0.0, 0.0, 0.0)
  oldScale = vec3.fromValues(1.0, 1.0, 1.0)

  execute(ctx: SubToolContext) { // @override

    this.errorCheck()

    vec3.copy(this.oldLocation, this.targetLayer.location)
    vec3.copy(this.oldRotation, this.targetLayer.rotation)
    vec3.copy(this.oldScale, this.targetLayer.scale)

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    vec3.copy(this.targetLayer.location, this.oldLocation)
    vec3.copy(this.targetLayer.rotation, this.oldRotation)
    vec3.copy(this.targetLayer.scale, this.oldScale)
  }

  redo(_ctx: SubToolContext) { // @override

    vec3.copy(this.targetLayer.location, this.newLocation)
    vec3.copy(this.targetLayer.rotation, this.newRotation)
    vec3.copy(this.targetLayer.scale, this.newScale)
  }

  errorCheck() {

    if (this.targetLayer == null) {

      throw new Error('ERROR 0901:Command_LoadReferenceImageToLayer: layer is null!')
    }
  }
}

export class Tool_Transform_ReferenceImage_GrabMove extends Tool_Transform_ReferenceImage {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.grabMove, ctx)
  }
}

export class Tool_Transform_ReferenceImage_Rotate extends Tool_Transform_ReferenceImage {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.rotate, ctx)
  }
}

export class Tool_Transform_ReferenceImage_Scale extends Tool_Transform_ReferenceImage {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.scale, ctx)
  }
}
