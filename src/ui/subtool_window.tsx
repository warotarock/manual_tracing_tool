import * as React from 'react';

import { SubToolViewItem } from '../app/view.class';

import { UI_ScrollView } from '../ui/scroll_view';

export interface UI_SubToolWindowRef {

  update?(items: SubToolViewItem[], subToolIndex_: number): void;

  item_Click?(item: SubToolViewItem): void;
  itemButton_Click?(item: SubToolViewItem): void;
}

export interface UI_SubToolWindowParam {

  uiRef: UI_SubToolWindowRef;
}

const itemScale = 0.9;

export function UI_SubToolWindow({ uiRef }: UI_SubToolWindowParam) {

  const [items, setItems] = React.useState([] as SubToolViewItem[]);

  const [active_SubToolIndex, setActive_SubToolIndex] = React.useState(0);

  React.useEffect(() => {

    uiRef.update = (items: SubToolViewItem[], subToolIndex: number) => {

      setItems(items);
      setActive_SubToolIndex(subToolIndex);
    };

    return function cleanup() {

      uiRef.update = null;
    };
  });

  return (
    <div className="subtool-window">
      <UI_ScrollView wheelScrollY={32} direction='horizontal'>
        {
          items.map(item => (
            <div key={item.subToolIndex}
              className={`item ${active_SubToolIndex == item.subToolIndex ? 'selected' : ''}`}
              onMouseDown={(e) => { if (e.button == 0) { uiRef.item_Click(item); } }}
            >
              <div
                className={`item-inner ${item.tool.toolBarImage.cssImageClassName} ${active_SubToolIndex == item.subToolIndex ? 'selected' : ''}`}
                style={{ backgroundPosition: `0 -${item.tool.toolBarImageIndex * 64 * itemScale}px`, opacity: (item.isAvailable ? 1.0 : 0.5) }}
              >
                <div className='spacer'></div>
                {item.buttons.length > 0 ?
                  <div className='command-button'
                    style={{ backgroundPosition: `-${(item.buttonStateID - 1) * 64 * itemScale}px 0` }}
                    onMouseDown={(e) => { if (e.button == 0) { uiRef.itemButton_Click(item); } } }
                  ></div>
                  :
                  <div className='command-button'></div>
                }
              </div>
            </div>
          ))
          }
      </UI_ScrollView>
    </div>
  );
}
