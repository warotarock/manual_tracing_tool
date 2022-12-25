import { ImageFileReferenceLayer } from '../document-data'
import { CanvasRender } from '../render'

export class DrawingImageFileReferenceLayerLogic {

  private canvasRender: CanvasRender = null

  private tempMat4 = mat4.create()

  link(canvasRender: CanvasRender) {

    this.canvasRender = canvasRender
  }

  drawImageFileReferenceLayer(layer: ImageFileReferenceLayer, isModalToolRunning: boolean) {

    if (layer.runtime.imageResource.image == null
      || layer.runtime.imageResource.image.imageData == null) {

      return
    }

    const image = layer.runtime.imageResource.image.imageData

    const location = (isModalToolRunning ? layer.runtime.adjustingLocation : layer.location)
    const rotation = (isModalToolRunning ? layer.runtime.adjustingRotation[0] : layer.rotation[0])
    const scale = (isModalToolRunning ? layer.runtime.adjustingScale : layer.scale)

    mat4.identity(this.tempMat4)
    mat4.translate(this.tempMat4, this.tempMat4, location)
    mat4.rotateZ(this.tempMat4, this.tempMat4, rotation)
    mat4.scale(this.tempMat4, this.tempMat4, scale)

    this.canvasRender.setLocalTransform(this.tempMat4)

    this.canvasRender.setGlobalAlpha(layer.layerColor[3])

    this.canvasRender.drawImage(image
      , 0.0, 0.0
      , image.width, image.height
      , 0.0, 0.0
      , image.width, image.height
    )

    this.canvasRender.cancelLocalTransform()
    this.canvasRender.setGlobalAlpha(1.0)
  }
}
