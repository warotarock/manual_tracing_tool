import { Layer } from '../document_data'
import { UI_LayerWindowRef } from '../ui/layer_window'
import { DocumentContext } from '../context/document_context'
import { ViewLayerListItem } from '../view/view_layer_list'

export enum LayerWindowButtonID {

  none = 0,
  addLayer = 1,
  deleteLayer = 2,
  moveUp = 3,
  moveDown = 4,
}

export class LayerWindow {

  uiRef: UI_LayerWindowRef = {}

  scrollToItem(_item: ViewLayerListItem) {

    // TODO: implement
  }

  update(docContext: DocumentContext, currentLayer: Layer) {

    for (const item of docContext.items) {

      this.updateItem(item, currentLayer)
    }
  }

  private updateItem(item: ViewLayerListItem, currentLayer: Layer) {

    item.isVisible = Layer.isVisible(item.layer)
    item.isCurrentLayer = (Layer.isSelected(item.layer) && item.layer == currentLayer)
    item.isSelected = (Layer.isSelected(item.layer) && !item.isCurrentLayer)
  }
}
