import * as React from 'react';

import { LayerWindowItem, LayerWindowButtonID } from '../app/view.class';

import { UI_ScrollView } from './scroll_view';
import { UI_CommandButtonsItem, UI_CommandButtonsRef, UI_CommandButtons } from './command_buttons';

export interface UI_LayerWindowRef {

  update?(items: LayerWindowItem[]): void;

  commandButton_Click?: (item: UI_CommandButtonsItem) => void;
  item_Click?: (item: LayerWindowItem) => void;
  visibility_Click?: (item: LayerWindowItem) => void;
}

export interface UI_LayerWindowParam {

  uiRef: UI_LayerWindowRef;
}

export function UI_LayerWindow({ uiRef }: UI_LayerWindowParam) {

  const [items, setItems] = React.useState([] as LayerWindowItem[]);

  const [commandButtonsRef, setCommandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: LayerWindowButtonID.addLayer, icon: 'add' },
        { index: LayerWindowButtonID.deleteLayer, icon: 'close' },
        { index: LayerWindowButtonID.moveUp, icon: 'arrow_upward' },
        { index: LayerWindowButtonID.moveDown, icon: 'arrow_downward' },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        uiRef.commandButton_Click(item);
      }
    } as UI_CommandButtonsRef
  });

  React.useEffect(() => {

      uiRef.update = (items: LayerWindowItem[]) => {

          setItems(items.slice());
      };

      return function cleanup() {

          uiRef.update = null;
      };
  });

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
  );
}

function UI_LayerWindowRow({ item, uiRef }: { item: LayerWindowItem, uiRef: UI_LayerWindowRef }) {

  const iconSize = 22;

  return (
    <div className={`item ${item.isCurrentLayer ? 'current' : ''} ${item.isSelected ? 'selected' : ''}`}>
      <div className='visibility-icon-container'>
        <div className='visibility-icon image-splite-system'
          style={{ backgroundPositionX: `-${(item.isVisible ? 0 : 1) * iconSize}px` }}
          onMouseDown={(e) => { if (e.button == 0) { uiRef.visibility_Click(item); } }}
        >
        </div>
      </div>
      <div className='layer-name'
        style={{ paddingLeft: `${5 + item.hierarchyDepth * 10}px` }}
        onMouseDown={(e) => { if (e.button == 0) { uiRef.item_Click(item); } }}
      >
        { item.layer.name }
      </div>
    </div>
  );
}
