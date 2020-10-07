import * as React from 'react';

import { UI_MenuButtons, UI_MenuButtonsRef } from './menu_buttons';
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool_window';

export enum UI_FooterOperationPanel_ID {

  undo,
  redo,
  copy,
  paste,
  cut,
}

export interface UI_FooterOperationPanelRef {

  hide?: () => void;
  show?: () => void;

  button_Click?: (buttonID: UI_FooterOperationPanel_ID) => void;
}

export function UI_FooterOperationPanel(
  { uiRef, menuButtonsRef, subToolWindowRef }
  : { uiRef: UI_FooterOperationPanelRef, menuButtonsRef: UI_MenuButtonsRef, subToolWindowRef: UI_SubToolWindowRef } ) {

  React.useEffect(() => {

    return function cleanup() {
    };
  });

  function button_Click(id: UI_FooterOperationPanel_ID) {

    if (uiRef.button_Click) {

      uiRef.button_Click(id);
    }
  }

  return (
    <React.Fragment>
      <div className="tool-ribbon">
        <div className="sub-command-buttons">
          <button className="button" onClick={() => { button_Click(UI_FooterOperationPanel_ID.copy) }}>
            <i className='material-icons'>content_copy</i>
          </button>
          <button className="button" onClick={() => { button_Click(UI_FooterOperationPanel_ID.paste) }}>
            <i className='material-icons'>content_paste</i>
          </button>
          <button className="button" onClick={() => { button_Click(UI_FooterOperationPanel_ID.cut) }}>
            <i className='material-icons'>content_cut</i>
          </button>
          <button className="button" onClick={() => { button_Click(UI_FooterOperationPanel_ID.undo) }}>
            <i className='material-icons'>undo</i>
          </button>
          <button className="button" onClick={() => { button_Click(UI_FooterOperationPanel_ID.redo) }}>
            <i className='material-icons'>redo</i>
          </button>
        </div>
        <div className="tool-buttons">
          <div className="main-tool-buttons">
            <UI_MenuButtons uiRef={menuButtonsRef}></UI_MenuButtons>
            <div className="headerCommandButton" id="menu_btnOperationOption">
              <img className="mainMenuButtonImage" src="./dist/res/icons8-settings-100.png" />
            </div>
          </div>
          <div className="subtool-window">
            <UI_SubToolWindow uiRef={subToolWindowRef}></UI_SubToolWindow>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

/*
      <div className="main-operations">
        <div className="inner-container">

          <div className="border-container">
            <div className="top-part"></div>
            <div className="bottom-part"></div>
          </div>

          <div className="controls">
            <button><i className='material-icons'>zoom_in</i></button>
            <button><i className='material-icons'>rotate_right</i></button>
            <button><i className='material-icons'>open_with</i></button>
            <div style={{ gridColumn: '2/3', gridRow: '1/4'}}></div>
            <button><i className='material-icons'>brush</i></button>
            <button><i className='material-icons'>flip</i></button>
          </div>

        </div>
      </div>

*/
