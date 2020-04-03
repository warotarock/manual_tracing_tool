import * as React from 'react';

import { SubToolViewItem } from 'app/view.class';

export interface UI_SubToolWindowRef {

    update?(items: SubToolViewItem[], subToolIndex_: number): void;

    item_Click?(item: SubToolViewItem): void;
    itemButton_Click?(item: SubToolViewItem): void;
}

export function UI_SubToolWindow({ ref }: { ref: UI_SubToolWindowRef }) {

    const [items, setItems] = React.useState([] as SubToolViewItem[]);

    const [active_SubToolIndex, setActive_SubToolIndex] = React.useState(0);

    React.useEffect(() => {

        ref.update = (items: SubToolViewItem[], subToolIndex: number) => {

            setItems(items);
            setActive_SubToolIndex(subToolIndex);
        };

        return function cleanup() {

            ref.update = null;
        };
    });

    return (
        <div>
            {
                items.map(item => (
                    <div key={item.subToolIndex}
                        className={`list-item ${item.tool.toolBarImage.cssImageClassName} ${active_SubToolIndex == item.subToolIndex ? 'active' : ''}`}
                        style={{ backgroundPosition: `0 -${item.tool.toolBarImageIndex * 64}px`, opacity: (item.isAvailable ? 1.0 : 0.5) }}
                        onClick={() => { ref.item_Click(item); }}
                    >
                        <div className='spacer'></div>
                        {item.buttons.length > 0 &&
                            <div className='command-button image-splite-system'
                                style={{ backgroundPosition: `-${(item.buttonStateID - 1) * 64}px 0` }}
                                onClick={() => { ref.itemButton_Click(item); }}
                            >
                            </div>
                        }
                    </div>
                ))
            }
        </div>
    );
}
