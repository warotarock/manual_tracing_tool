import { Layer, LayerTypeID } from "./layer"

export class GroupLayer extends Layer {

  type = LayerTypeID.groupLayer

  static isGroupLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.groupLayer
      )
    )
  }
}
