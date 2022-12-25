import * as React from 'react'
import { GroupLayer } from '../document-data'
import { MainCommandButtonID } from '../ui/constants'
import { UI_CommandButtonItem, UI_CommandButtons, UI_CommandButtonsRef, UI_Icon_MaterialIcon, UI_ScrollView } from '../ui-common-controls'
import { ViewLayerListItem } from '../view'

export interface UI_LayerWindowRef {

  update?(items: ViewLayerListItem[]): void
  scrollIntoView?(listItem: ViewLayerListItem): void

  commandButton_Clicked?: (item: UI_CommandButtonItem) => void
  item_Clicked?: (item: ViewLayerListItem) => void
  visibility_Clicked?: (item: ViewLayerListItem) => void
  expander_Clicked?: (item: ViewLayerListItem) => void
}

export interface UI_LayerWindowParam {

  uiRef: UI_LayerWindowRef
}

export function UI_LayerWindow({ uiRef }: UI_LayerWindowParam) {

  const [listItems, set_listItem] = React.useState<ViewLayerListItem[]>([])

  const commandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: MainCommandButtonID.layer_addLayer, icon: 'add', title: 'レイヤーを追加' },
        { index: MainCommandButtonID.layer_deleteLayer, icon: 'remove', title: 'レイヤーを削除' },
        { index: MainCommandButtonID.layer_moveUp, icon: 'arrowup', title: 'レイヤーを上に移動' },
        { index: MainCommandButtonID.layer_moveDown, icon: 'arrowdown', title: 'レイヤーを下に移動' },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        uiRef.commandButton_Clicked(item)
      }
    }
  }, [])

  React.useEffect(() => {

    uiRef.update = (items) => {

      set_listItem(items.slice())
    }

    return function cleanup() {

      uiRef.update = null
    }
  }, [])

  React.useEffect(() => {

    uiRef.scrollIntoView = (item) => {

      const target_rowItem = listItems.find(rowItem => rowItem == item)

      if (target_rowItem) {

        target_rowItem.scrollIntoView()
      }
    }

    return function cleanup() {

      uiRef.scrollIntoView = null
    }
  }, [listItems])

  return (
    <div className="layer-window">
      <div className='command-buttons-container'>
        <UI_CommandButtons uiRef={commandButtonsRef} />
      </div>
      <UI_ScrollView wheelScrollY={15}>
        <div className='layer-window-items'>
          {
            listItems.map(rowItem => (
              <LayerWindowRow key={rowItem.index} listItem={rowItem} uiRef={uiRef} />
            ))
          }
        </div>
      </UI_ScrollView>
    </div>
  )
}

interface LayerWindowRowParam {

  listItem: ViewLayerListItem
  uiRef: UI_LayerWindowRef
}

function LayerWindowRow({ listItem, uiRef }: LayerWindowRowParam) {

  const iconSize = 22

  const itemElementRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {

    listItem.scrollIntoView = () => {

      itemElementRef.current?.scrollIntoView({
        block: 'center'
      })
    }

    return function cleanup() {

      listItem.scrollIntoView = () => {}
    }
  }, [listItem])

  return (
    <div
      ref={itemElementRef}
      className={`item ${listItem.isCurrentLayer ? 'current' : ''} ${listItem.isSelected ? 'selected' : ''}`}
    >
      <div className='expander'
        style={{ paddingLeft: `${listItem.hierarchyDepth * 0.8}rem` }}
        onPointerDown={(e) => {
          // check button to prevent ScrollView scrolling when right mouse click
          if (e.button == 0) {
            if (GroupLayer.isGroupLayer(listItem.layer)) {
              uiRef.expander_Clicked(listItem)
            }
            else {
              uiRef.item_Clicked(listItem)
            }
          }
        }}
      >
        <div className='expander-icon'>
          {
            GroupLayer.isGroupLayer(listItem.layer)
              && <UI_Icon_MaterialIcon iconName={ listItem.layer.isListExpanded ? 'expandmore' : 'expandright'} />
          }
        </div>
      </div>
      <div className='layer-name'
        onPointerDown={(e) => {
          // check button to prevent ScrollView scrolling when right mouse click
          if (e.button == 0) {
            uiRef.item_Clicked(listItem)
          }
        }}
      >
        {listItem.layer.name}
      </div>
      <div className='layer-visibility'
        onPointerDown={(e) => {
          // check button to prevent ScrollView scrolling when right mouse click
          if (e.button == 0) {
            uiRef.visibility_Clicked(listItem)
          }
        }}
      >
        <div className='visibility-icon'>
          <UI_Icon_MaterialIcon iconName={ listItem.isVisible ? 'visible' : 'invisible'} />
        </div>
      </div>
    </div>
  )
}
