import * as React from 'react';

export interface UI_MenuButtonsRef {

    update?(activeElementID: string): void;
}

export interface UI_MenuButtonsParam {

    uiRef: UI_MenuButtonsRef;
}

export function UI_MenuButtons({ uiRef }: UI_MenuButtonsParam) {

    const [activeElementID, setActiveElementID] = React.useState('');

    React.useEffect(() => {

        uiRef.update = (activeElementID: string) => {

            setActiveElementID(activeElementID);
        };

        return function cleanup() {

            uiRef.update = null;
        };
    });

    const getClassName = (id: string) => {

        if (activeElementID == id) {

            return 'selectedMainButton';
        }
        else {

            return 'unselectedMainButton';
        }
    }

    return (
        <React.Fragment>
            <div id="menu_btnDrawTool" className={getClassName('menu_btnDrawTool')}>Draw</div>
            <div id="menu_btnEditTool" className={getClassName('menu_btnEditTool')}>Edit</div>
            <div id="menu_btnMiscTool" className={getClassName('menu_btnMiscTool')}>Setting</div>
        </React.Fragment>
    );
}
