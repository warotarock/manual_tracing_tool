import * as React from 'react';

import { int } from 'base/conversion';
import { RectangleLayoutArea } from 'app/view.class';

export interface UI_CommandButtonsItem {

  index: int;
  iconIndex: int;
}

export interface UI_CommandButtonsRef {

  items: UI_CommandButtonsItem[];

  onClick?: (item: UI_CommandButtonsItem) => void;
}

export interface UI_CommandButtonsParam {

  uiRef: UI_CommandButtonsRef;
}

export function UI_CommandButtons({ uiRef }: UI_CommandButtonsParam) {

  return (
    <div className='command-buttons-container'>
      {
        uiRef.items.map(item => (
          <div key={item.index}>
            <button
              className='image-splite-layerbar'
              onClick={() => { uiRef.onClick && uiRef.onClick(item) }}
              style={{ backgroundPosition: `0 -${(item.iconIndex - 1) * 32}px` }}
            >
            </button>
          </div>
        ))
      }
    </div>
  );
}
