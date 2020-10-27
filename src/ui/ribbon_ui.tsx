import * as React from 'react';

import { UI_MenuButtons, UI_MenuButtonsRef } from './menu_buttons';
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool_window';

export interface UI_RibbonUIRef {

  hide?: () => void;
  show?: () => void;
}

export interface UI_RibbonUIParam {

  uiRef: UI_RibbonUIRef;
  menuButtonsRef: UI_MenuButtonsRef;
  subToolWindowRef: UI_SubToolWindowRef;
}

export function UI_RibbonUI({ uiRef, menuButtonsRef, subToolWindowRef }: UI_RibbonUIParam ) {

  React.useEffect(() => {

    return function cleanup() {
    };
  });

  return (
    <React.Fragment>
      <div className="tool-ribbon">
        <div className="tool-ribbon-rows">

          <div className="menu-buttons-row">
            <UI_MenuButtons uiRef={menuButtonsRef}></UI_MenuButtons>
            <div className="headerCommandButton" id="menu_btnOperationOption">
              <img src="./dist/res/icons8-settings-100.png" />
            </div>
          </div>

          <div className="ribbon-ui-row">
            <div className="ribbon-home-ui">
              <div className="tool-button">
                <div className="icon">
                  <img src="./dist/res/icon_draw.svg" />
                </div>
                <div className="label">線を描く</div>
              </div>
              <div className="tool-button">
                <div className="icon">
                  <img src="./dist/res/icon_eracer.svg" />
                </div>
                <div className="label">消しゴム</div>
              </div>
            </div>
            <UI_SubToolWindow uiRef={subToolWindowRef}></UI_SubToolWindow>
          </div>

        </div>
      </div>
    </React.Fragment>
  );
}
