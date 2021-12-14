import { Layer, LayerTypeID } from './layer'
import { ImageResource } from '../posing3d/posing3d_view'

export class ImageFileReferenceLayer extends Layer {

  type = LayerTypeID.imageFileReferenceLayer

  imageFilePath: string = null

  location = vec3.fromValues(0.0, 0.0, 0.0)
  rotation = vec3.fromValues(0.0, 0.0, 0.0)
  scale = vec3.fromValues(1.0, 1.0, 1.0)

  // runtime

  imageResource: ImageResource = null
  imageFirstLoading = false

  adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingScale = vec3.fromValues(1.0, 1.0, 1.0)

  static isImageFileReferenceLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.imageFileReferenceLayer
    )
  }

  static isLoaded(layer: ImageFileReferenceLayer): boolean {

    return (layer.imageResource != null && layer.imageResource.loaded)
  }
}
