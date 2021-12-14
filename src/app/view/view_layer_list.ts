import { int } from '../logics/conversion'
import { DocumentData, Layer, PosingLayer } from '../document_data'
import { UI_SelectBoxOption } from '../ui/selectbox'
import { DocumentContext } from '../context/document_context'

export class ViewLayerListItem {

  index = -1
  layer: Layer = null
  parentLayer: Layer = null
  previousItem: ViewLayerListItem = null
  nextItem: ViewLayerListItem = null
  previousSiblingItem: ViewLayerListItem = null
  nextSiblingItem: ViewLayerListItem = null
  hierarchyDepth = 0
  isVisible = false
  isCurrentLayer = false
  isSelected = false
}

export class ViewLayerListLogic {

  collectItems(docContext: DocumentContext, document: DocumentData) {

    docContext.items = []
    this.collectItemsRecursive(docContext.items, document.rootLayer, 0)

    let previousItem: ViewLayerListItem = null
    for (const item of docContext.items) {

      item.index = item.layer.hashID

      item.previousItem = previousItem

      if (previousItem != null) {

        previousItem.nextItem = item
      }

      previousItem = item
    }
  }

  private collectItemsRecursive(result: ViewLayerListItem[], parentLayer: Layer, currentDepth: int) {

    let siblingItem = null

    for (const layer of parentLayer.childLayers) {

      const item = new ViewLayerListItem()
      item.layer = layer
      item.parentLayer = parentLayer
      item.hierarchyDepth = currentDepth
      item.previousSiblingItem = siblingItem

      if (siblingItem != null) {

        siblingItem.nextSiblingItem = item
      }

      result.push(item)

      if (layer.childLayers.length > 0) {

        this.collectItemsRecursive(result, layer, currentDepth + 1)
      }

      siblingItem = item
    }
  }

  private findCurrentItemIndex(docContext: DocumentContext, currentLayer: Layer) {

    for (let index = 0; index < docContext.items.length; index++) {
      const item = docContext.items[index]

      if (item.layer == currentLayer) {

        return index
      }
    }

    return -1
  }

  findItemForLayer(docContext: DocumentContext, currentLayer: Layer): ViewLayerListItem {

    const index = this.findCurrentItemIndex(docContext, currentLayer)

    if (index != -1) {

      const item = docContext.items[index]

      return item
    }

    return null
  }

  collectPosingLayerOptions(docContext: DocumentContext): UI_SelectBoxOption[] {

    const options: UI_SelectBoxOption[] = []

    options.push({
      value: '-1',
      label: '--',
      data: null
    })

    for (const [index, layerWindowItem] of docContext.items.entries()) {

      if (PosingLayer.isPosingLayer(layerWindowItem.layer)) {

        options.push({
          value: index.toString(),
          label: layerWindowItem.layer.name,
          data: layerWindowItem.layer
        })
      }
    }

    return options
  }
}
