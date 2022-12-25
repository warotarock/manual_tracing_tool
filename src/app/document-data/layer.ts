import { float, int } from '../common-logics'

export enum LayerTypeID {

  none = 0,
  rootLayer = 1,
  vectorLayer = 2,
  groupLayer = 3,
  imageFileReferenceLayer = 4,
  posingLayer = 5,
  vectorLayerReferenceLayer = 6,
  autoFillLayer = 7,
  surroundingFillLayer = 8,
  pointBrushFillLayer = 9,
}

export class Layer_RuntimeProperty {

  needsPostUpdate = false
  needsLazyUpdate = false
  isHierarchicalVisible = true
  isHierarchicalListVisible = true
  parentLayer: Layer = null
}

export class Layer {

  type = LayerTypeID.none
  name: string = null
  isVisible = true
  isSelected = false
  isRenderTarget = true
  isMaskedByBelowLayer = false
  isListExpanded = true

  childLayers: Layer[] = []

  layerColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)

  // runtime
  runtime = new Layer_RuntimeProperty()

  // ID for React list
  static hashIDCount = 1

  static getHashID() {

    return Layer.hashIDCount++
  }

  hashID = Layer.getHashID()

  // file only
  ID: int

  static isRootLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.rootLayer
    )
  }

  static isEditTarget(layer: Layer): boolean {

    return (Layer.isSelected(layer) && Layer.isVisible(layer))
  }

  static isSelected(layer: Layer): boolean {

    return layer.isSelected
  }

  static isVisible(layer: Layer): boolean {

    return (
      layer != null
      && layer.isVisible
      && layer.runtime.isHierarchicalVisible)
  }

  static isListVisible(layer: Layer): boolean {

    return (
      layer != null
      && layer.isVisible
      && layer.runtime.isHierarchicalVisible)
  }

  static setLazyUpdateNeeded(layer: Layer) {

    layer.runtime.needsLazyUpdate = true
  }

  static setPostUpdateNeeded(layer: Layer) {

    layer.runtime.needsPostUpdate = true
  }
}
