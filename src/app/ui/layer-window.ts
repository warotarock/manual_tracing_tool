import { Layer } from '../document-data'
import { DocumentContext } from '../context'
import { ViewLayerListItem } from '../view'
import { UI_LayerWindowRef } from '../ui-sidebar'

export class LayerWindow {

  uiRef: UI_LayerWindowRef = {}

  scrollToItem(_item: ViewLayerListItem) {

    // TODO: implement
  }

  update(docContext: DocumentContext, currentLayer: Layer) {

    for (const item of docContext.layerListItems) {

      item.isVisible = Layer.isVisible(item.layer)
      item.isCurrentLayer = (Layer.isSelected(item.layer) && item.layer == currentLayer)
      item.isSelected = (Layer.isSelected(item.layer) && !item.isCurrentLayer)
    }
  }

  scrollToLayer(layer: Layer, docContext: DocumentContext) {

    const listItem = docContext.layerListItems.find(item => item.layer == layer)

    if (listItem) {

      this.uiRef.scrollIntoView(listItem)
    }
  }
}
