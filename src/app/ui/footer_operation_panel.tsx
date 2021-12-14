import * as React from 'react';

import { UI_RibbonUITabs, UI_RibbonUITabsRef } from './ribbon_ui_tabs';
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool_window';

export enum UI_FooterOperationPanel_ID {

  undo,
  redo,
  copy,
  paste,
  cut,
}

export interface UI_FooterOperationPanelRef {

  button_Click?: (buttonID: UI_FooterOperationPanel_ID) => void;
}

export interface UI_FooterOperationPanelParam {

  uiRef: UI_FooterOperationPanelRef;
}

export function UI_FooterOperationPanel({ uiRef }: UI_FooterOperationPanelParam ) {

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
      <div className="footer-operation-panel-container">
        <div className="command-buttons">
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
      </div>
    </React.Fragment>
  );
}
