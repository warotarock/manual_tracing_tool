import { float, int } from '../logics/conversion'
import { DrawingBuffer } from '../drawing/draw_path_buffering'
import { DrawLineTypeID, FillAreaTypeID } from '.'

export enum LayerTypeID {

  none = 0,
  rootLayer = 1,
  vectorLayer = 2,
  groupLayer = 3,
  imageFileReferenceLayer = 4,
  posingLayer = 5,
  vectorLayerReferenceLayer = 6,
  autoFillLayer = 7,
}

export class Layer {

  type = LayerTypeID.none
  name: string = null
  isVisible = true
  isSelected = false
  isRenderTarget = true
  isMaskedByBelowLayer = false

  childLayers: Layer[] = []

  layerColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)

  // runtime
  isHierarchicalSelected = true
  isHierarchicalVisible = true
  parentLayer: Layer = null

  // ID for React list
  static hashIDCount = 1

  static getHashID() {

    return Layer.hashIDCount++
  }

  hashID = Layer.getHashID()

  // file only
  ID: int

  static collectLayerRecursive(result: Layer[], parentLayer: Layer) {

    for (const layer of parentLayer.childLayers) {

      result.push(layer)

      if (layer.childLayers.length > 0) {

        Layer.collectLayerRecursive(result, layer)
      }
    }
  }

  static collectHierarchicalLayerInfoRecursive(result: HierarchicalLayerInfo[], parentLayer: Layer) {

    for (const layer of parentLayer.childLayers) {

      const info = new HierarchicalLayerInfo()
      info.layer = layer
      info.parent = parentLayer
      info.children = layer.childLayers
      result.push(info)

      if (layer.childLayers.length > 0) {

        Layer.collectHierarchicalLayerInfoRecursive(result, layer)
      }
    }
  }

  static updateHierarchicalStatesRecursive(parentLayer: Layer) {

    for (const layer of parentLayer.childLayers) {

      layer.isHierarchicalSelected = layer.isSelected || Layer.isSelected(parentLayer)
      layer.isHierarchicalVisible = layer.isVisible && Layer.isVisible(parentLayer)

      if (layer.childLayers.length > 0) {

        Layer.updateHierarchicalStatesRecursive(layer)
      }
    }
  }

  static isEditTarget(layer: Layer): boolean {

    return (Layer.isSelected(layer) && Layer.isVisible(layer))
  }

  static isSelected(layer: Layer): boolean {

    return (layer.isSelected || layer.isHierarchicalSelected)
  }

  static isVisible(layer: Layer): boolean {

    return (
      layer != null
      && layer.isVisible
      && layer.isHierarchicalVisible)
  }

  static isRootLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.rootLayer
    )
  }
}

export interface StrokeDrawable {

  drawLineType: DrawLineTypeID
  layerColor: Vec4
  line_PaletteColorIndex: int
  lineWidthBiasRate: float
}

export interface FillDrawable {

  fillAreaType: FillAreaTypeID
  fillColor: Vec4
  fill_PaletteColorIndex: int
}

export class HierarchicalLayerInfo {

  layer: Layer = null
  children: Layer[] = null
  parent: Layer = null
}
