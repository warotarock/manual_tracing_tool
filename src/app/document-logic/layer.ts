import { Layer } from '../document-data'

export class HierarchicalLayerInfo {

  layer: Layer = null
  children: Layer[] = null
  parent: Layer = null
}

export class LayerLogic {

  static collectLayers(parentLayer: Layer): Layer[] {

    return this.collectLayersRecursive([], parentLayer)
  }

  private static collectLayersRecursive(result: Layer[], parentLayer: Layer): Layer[] {

    for (const layer of parentLayer.childLayers) {

      result.push(layer)

      if (layer.childLayers.length > 0) {

        this.collectLayersRecursive(result, layer)
      }
    }

    return result
  }

  static collectHierarchicalLayerInfoRecursive(result: HierarchicalLayerInfo[], parentLayer: Layer) {

    for (const layer of parentLayer.childLayers) {

      const info = new HierarchicalLayerInfo()
      info.layer = layer
      info.parent = parentLayer
      info.children = layer.childLayers
      result.push(info)

      if (layer.childLayers.length > 0) {

        this.collectHierarchicalLayerInfoRecursive(result, layer)
      }
    }
  }

  static updateHierarchicalSelectRecursive(parentLayer: Layer) {

    for (const layer of parentLayer.childLayers) {

      layer.isSelected = Layer.isSelected(parentLayer)

      if (layer.childLayers.length > 0) {

        this.updateHierarchicalSelectRecursive(layer)
      }
    }
  }

  static updateHierarchicalStatesRecursive(parentLayer: Layer) {

    for (const layer of parentLayer.childLayers) {

      layer.runtime.isHierarchicalVisible = layer.isVisible && Layer.isVisible(parentLayer)
      layer.runtime.isHierarchicalListVisible = parentLayer.isListExpanded || parentLayer.runtime.isHierarchicalListVisible

      if (layer.childLayers.length > 0) {

        this.updateHierarchicalStatesRecursive(layer)
      }
    }
  }
}
