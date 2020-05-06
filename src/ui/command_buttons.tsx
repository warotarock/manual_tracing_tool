import * as React from 'react';

import { int } from 'base/conversion';
import { RectangleLayoutArea } from 'app/view.class';

export interface UI_CommandButtonsItem {

  index: int;
  iconIndex: int;
  isSelected?: boolean;
}

export interface UI_CommandButtonsRef {

  items: UI_CommandButtonsItem[];

  setCommandButtonState?: (index: int, isSelected: boolean) => void;

  commandButton_Click?: (item: UI_CommandButtonsItem) => void;
}

export interface UI_CommandButtonsParam {

  uiRef: UI_CommandButtonsRef;
}

export function UI_CommandButtons({ uiRef }: UI_CommandButtonsParam) {

  React.useEffect(() => {

    uiRef.setCommandButtonState = (index: int, isSelected: boolean) => {

      uiRef.items[index].isSelected = isSelected;
    };

    return function cleanup() {

      uiRef.setCommandButtonState = null;
    };
  });

  return (
    <div className='command-buttons-container'>
      {
        uiRef.items.map(item => (
          <div key={item.index}>
            <button
              className={`image-splite-layerbar ${item.isSelected ? 'selected' : ''}`}
              onMouseDown={() => { uiRef.commandButton_Click && uiRef.commandButton_Click(item) }}
              style={{ backgroundPosition: `0 -${(item.iconIndex - 1) * 32}px` }}
            />
          </div>
        ))
      }
    </div>
  );
}
