import { Layer, LayerTypeID, Layer_RuntimeProperty } from './layer'
import { ImageResource } from '../posing3d'

export class ImageFileReferenceLayer extends Layer {

  type = LayerTypeID.imageFileReferenceLayer

  imageFilePath: string = ''
  location = vec3.fromValues(0.0, 0.0, 0.0)
  rotation = vec3.fromValues(0.0, 0.0, 0.0)
  scale = vec3.fromValues(1.0, 1.0, 1.0)
  imageFirstLoading = true

  // runtime
  runtime = new ImageFileReferenceLayer_RuntimeProperty()

  static isImageFileReferenceLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.imageFileReferenceLayer
    )
  }

  static isLoaded(layer: ImageFileReferenceLayer): boolean {

    return (layer.runtime.imageResource.loaded)
  }
}

export class ImageFileReferenceLayer_RuntimeProperty extends Layer_RuntimeProperty {

  imageResource = new ImageResource()

  adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingScale = vec3.fromValues(1.0, 1.0, 1.0)
}
