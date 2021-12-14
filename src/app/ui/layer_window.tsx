import * as React from 'react'
import { ViewLayerListItem } from '../view/view_layer_list'
import { LayerWindowButtonID } from '../window/layer_window'
import { UI_CommandButtons, UI_CommandButtonsItem, UI_CommandButtonsRef } from './command_buttons'
import { UI_ScrollView } from './scroll_view'

export interface UI_LayerWindowRef {

  update?(items: ViewLayerListItem[]): void

  commandButton_Click?: (item: UI_CommandButtonsItem) => void
  item_Click?: (item: ViewLayerListItem) => void
  visibility_Click?: (item: ViewLayerListItem) => void
}

export interface UI_LayerWindowParam {

  uiRef: UI_LayerWindowRef
}

export function UI_LayerWindow({ uiRef }: UI_LayerWindowParam) {

  const [items, setItems] = React.useState([] as ViewLayerListItem[])

  const [commandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: LayerWindowButtonID.addLayer, icon: 'add' },
        { index: LayerWindowButtonID.deleteLayer, icon: 'close' },
        { index: LayerWindowButtonID.moveUp, icon: 'arrow_upward' },
        { index: LayerWindowButtonID.moveDown, icon: 'arrow_downward' },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        uiRef.commandButton_Click(item)
      }
    } as UI_CommandButtonsRef
  })

  React.useEffect(() => {

      uiRef.update = (items: ViewLayerListItem[]) => {

          setItems(items.slice())
      }

      return function cleanup() {

          uiRef.update = null
      }
  })

  return (
    <div className="layer-window">
      <UI_CommandButtons uiRef={commandButtonsRef} noBorder={true}/>
      <UI_ScrollView wheelScrollY={15}>
      <div className='layer-window-items'>
        {
          items.map(item => (
            <UI_LayerWindowRow key={ item.index } item={ item } uiRef={ uiRef } />
          ))
        }
      </div>
      </UI_ScrollView>
    </div>
  )
}

function UI_LayerWindowRow({ item, uiRef }: { item: ViewLayerListItem, uiRef: UI_LayerWindowRef }) {

  const iconSize = 22

  return (
    <div className={`item ${item.isCurrentLayer ? 'current' : ''} ${item.isSelected ? 'selected' : ''}`}>
      <div className='visibility-icon-container'>
        <div className='visibility-icon image-splite-system'
          style={{ backgroundPositionX: `-${(item.isVisible ? 0 : 1) * iconSize}px` }}
          onMouseDown={(e) => { if (e.button == 0) { uiRef.visibility_Click(item) } }}
        >
        </div>
      </div>
      <div className='layer-name'
        style={{ paddingLeft: `${5 + item.hierarchyDepth * 10}px` }}
        onMouseDown={(e) => { if (e.button == 0) { uiRef.item_Click(item) } }}
      >
        { item.layer.name }
      </div>
    </div>
  )
}
