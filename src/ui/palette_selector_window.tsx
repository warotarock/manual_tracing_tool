import * as React from 'react';

import { int } from 'base/conversion';
import { PaletteColor } from 'base/data';
import { PaletteSelectorWindowButtonID } from 'app/view.class';

import { UI_CommandButtons, UI_CommandButtonsRef, UI_CommandButtonsItem } from 'ui/command_buttons';

export interface UI_PaletteSelectorWindowRef {

  update?(items: PaletteColor[]): void;

  setCommandButtonState?: (index: int, isSelected: boolean) => void;

  commandButton_Click?: (item: UI_CommandButtonsItem) => void;
  item_Click?: (paletteColorIndex: int, item: PaletteColor) => void;
}

export interface UI_PaletteSelectorWindowParam {

  uiRef: UI_PaletteSelectorWindowRef;
}

export function UI_PaletteSelectorWindow({ uiRef }: UI_PaletteSelectorWindowParam) {

  const [items, setItems] = React.useState([] as PaletteColor[]);

  const [commandButtonsRef, setCommandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: PaletteSelectorWindowButtonID.lineColor, iconIndex: 5 },
        { index: PaletteSelectorWindowButtonID.fillColor, iconIndex: 6 },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        uiRef.commandButton_Click(item);
      }
    } as UI_CommandButtonsRef
  });

  React.useEffect(() => {

    uiRef.update = (items: PaletteColor[]) => {

      setItems(items.slice());
    };

    uiRef.setCommandButtonState = (index: int, isSelected: boolean) => {

      commandButtonsRef.setCommandButtonState(index, isSelected);
    };

    return function cleanup() {

      uiRef.update = null;
    };
  });

  return (
    <React.Fragment>
      <UI_CommandButtons uiRef={commandButtonsRef} />
      <div className='palette-selector-window-items'>
        {
          items.map((item, index) => (
            <UI_PaletteSelectorItem key={index} item={item} index={index} uiRef={uiRef} />
          ))
        }
      </div>
    </React.Fragment>
  );
}

function UI_PaletteSelectorItem({ item, index, uiRef }: { item: PaletteColor, index: int, uiRef: UI_PaletteSelectorWindowRef }) {

  return (
    <div className='item-container'
    onMouseDown={(e) => { if (e.button == 0) { uiRef.item_Click(index, item); } }}
    >
      <div className={`item ${item.isSelected ? 'selected' : ''}`}
        style={{ backgroundColor: `rgb(${item.color[0] * 255}, ${item.color[1] * 255}, ${item.color[2] * 255})` }}
      >
      </div>
    </div>
  );
}
