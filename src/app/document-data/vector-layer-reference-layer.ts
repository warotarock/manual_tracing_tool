import { VectorLayer, VectorLayer_RuntimeProperty } from './vector_layer'
import { int } from '../common-logics'
import { Layer, LayerTypeID } from './layer'

export class VectorLayerReferenceLayer_RuntimeProperty extends VectorLayer_RuntimeProperty {

  referenceLayer: VectorLayer = null
}

export class VectorLayerReferenceLayer extends VectorLayer {

  type = LayerTypeID.vectorLayerReferenceLayer

  // runtime
  runtime = new VectorLayerReferenceLayer_RuntimeProperty()

  // file only
  referenceLayerID: int

  static isVectorLayerReferenceLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayerReferenceLayer
      )
    )
  }
}
