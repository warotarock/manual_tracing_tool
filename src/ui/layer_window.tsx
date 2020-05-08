import * as React from 'react';

import { LayerWindowItem, LayerWindowButtonID } from 'app/view.class';

import { UI_ScrollView } from 'ui/scroll_view';
import { UI_CommandButtonsItem, UI_CommandButtonsRef, UI_CommandButtons } from 'ui/command_buttons';

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
        { index: LayerWindowButtonID.addLayer, iconIndex: 1 },
        { index: LayerWindowButtonID.deleteLayer, iconIndex: 2 },
        { index: LayerWindowButtonID.moveUp, iconIndex: 3 },
        { index: LayerWindowButtonID.moveDown, iconIndex: 4 },
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
    <React.Fragment>
      <UI_CommandButtons uiRef={commandButtonsRef} />
      <UI_ScrollView wheelScrollY={15}>
      <div className='layer-window-items'>
        {
          items.map(item => (
            <UI_LayerWindowRow key={ item.index } item={ item } uiRef={ uiRef } />
          ))
        }
      </div>
      </UI_ScrollView>
    </React.Fragment>
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
