import * as React from 'react';

import { int } from 'base/conversion';
import { RectangleLayoutArea } from 'app/view.class';

export interface UI_CommandButtonsItem {

  index: int;
  icon: string;
  isSelected?: boolean;
}

export interface UI_CommandButtonsRef {

  items: UI_CommandButtonsItem[];

  setCommandButtonState?: (index: int, isSelected: boolean) => void;

  commandButton_Click?: (item: UI_CommandButtonsItem) => void;
}

export interface UI_CommandButtonsParam {

  noBorder?: boolean;
  uiRef: UI_CommandButtonsRef;
}

export function UI_CommandButtons({ uiRef, noBorder }: UI_CommandButtonsParam) {

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
              className={`${item.isSelected ? 'selected' : ''} ${noBorder ? 'no-border' : ''}`}
              onMouseDown={(e) => {

                if (uiRef.commandButton_Click) {

                  uiRef.commandButton_Click(item);
                }

                  e.preventDefault();
              }}
            >
              <i className='material-icons'>{item.icon}</i>
            </button>
          </div>
        ))
      }
    </div>
  );
}
