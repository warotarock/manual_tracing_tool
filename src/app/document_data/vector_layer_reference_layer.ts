import { VectorLayer } from '.'
import { int } from '../logics/conversion'
import { Layer, LayerTypeID } from './layer'

export class VectorLayerReferenceLayer extends VectorLayer {

  type = LayerTypeID.vectorLayerReferenceLayer

  referenceLayer: VectorLayer = null

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
