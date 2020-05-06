import * as React from 'react';

import { LayerWindowItem } from 'app/view.class';

export interface UI_LayerWindowRef {

  update?(items: LayerWindowItem[]): void;

  item_Click?: (item: LayerWindowItem) => void;
  visibility_Click?: (item: LayerWindowItem) => void;
}

export interface UI_LayerWindowParam {

  uiRef: UI_LayerWindowRef;
}

export function UI_LayerWindow({ uiRef }: UI_LayerWindowParam) {

  const [items, setItems] = React.useState([] as LayerWindowItem[]);

  React.useEffect(() => {

      uiRef.update = (items: LayerWindowItem[]) => {

          setItems(items.slice());
      };

      return function cleanup() {

          uiRef.update = null;
      };
  });

  return (
    <div className='layer-window-items-container'>
      {
        items.map(item => (
          <UI_LayerWindowRow key={ item.index } item={ item } uiRef={ uiRef } />
        ))
      }
    </div>
  );
}

function UI_LayerWindowRow({ item, uiRef }: { item: LayerWindowItem, uiRef: UI_LayerWindowRef }) {

  const iconSize = 22;

  return (
    <div className={`row ${item.isCurrentLayer ? 'current' : ''} ${item.isSelected ? 'selected' : ''}`}>
      <div className='visibility-icon-container'>
        <div className='visibility-icon image-splite-system'
          style={{ backgroundPositionX: `-${(item.isVisible ? 0 : 1) * iconSize}px` }}
          onClick={() => { uiRef.visibility_Click(item); }}
        >
        </div>
      </div>
      <div className='layer-name'
        style={{ paddingLeft: `${5 + item.hierarchyDepth * 10}px` }}
        onMouseDown={() => { uiRef.item_Click(item); }}
      >
        { item.layer.name }
      </div>
    </div>
  );
}
