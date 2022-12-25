import { DocumentContext } from '../context'
import { Layer, PosingLayer } from '../document-data'
import { int } from '../common-logics'
import { UI_SelectBoxOption } from '../ui-popover'

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
  scrollIntoView = () => {}
}

export class ViewLayerListLogic {

  collectItemsToContext(docContext: DocumentContext) {

    docContext.layerListItems = []
    this.collectItemsRecursive(docContext.layerListItems, docContext.documentData.rootLayer, 0)

    let previousItem: ViewLayerListItem = null
    for (const item of docContext.layerListItems) {

      item.index = item.layer.hashID

      item.previousItem = previousItem

      if (previousItem != null) {

        previousItem.nextItem = item
      }

      previousItem = item
    }

    for (const item of docContext.layerListItems) {

      let nextItem = item.nextItem
      while (nextItem != null) {

        if (nextItem.hierarchyDepth <= item.hierarchyDepth) {

          item.nextSiblingItem = nextItem
          break
        }

        nextItem = nextItem.nextItem
      }
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

      if (layer.isListExpanded && layer.childLayers.length > 0) {

        this.collectItemsRecursive(result, layer, currentDepth + 1)
      }

      siblingItem = item
    }
  }

  private findCurrentItemIndex(docContext: DocumentContext, currentLayer: Layer) {

    for (let index = 0; index < docContext.layerListItems.length; index++) {
      const item = docContext.layerListItems[index]

      if (item.layer == currentLayer) {

        return index
      }
    }

    return -1
  }

  findItemForLayer(docContext: DocumentContext, currentLayer: Layer): ViewLayerListItem {

    const index = this.findCurrentItemIndex(docContext, currentLayer)

    if (index != -1) {

      const item = docContext.layerListItems[index]

      return item
    }

    return null
  }

  collectPosingLayerOptions(docContext: DocumentContext): UI_SelectBoxOption[] {

    const options: UI_SelectBoxOption[] = []

    options.push({
      index: 0,
      label: '',
      data: null
    })

    for (const [index, layerWindowItem] of docContext.layerListItems.entries()) {

      if (PosingLayer.isPosingLayer(layerWindowItem.layer)) {

        options.push({
          index: index,
          label: layerWindowItem.layer.name,
          data: layerWindowItem.layer
        })
      }
    }

    return options
  }
}
