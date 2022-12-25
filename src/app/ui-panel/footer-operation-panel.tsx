import * as React from 'react';
import { MainCommandButtonID } from '../ui/constants';
import { UI_CommandButtonItem, UI_CommandButtons, UI_CommandButtonsRef } from '../ui-common-controls';

export interface UI_FooterOperationPanelRef {

  isForMobile: boolean

  button_Click?: (buttonID: MainCommandButtonID) => void;
}

export interface UI_FooterOperationPanelParam {

  uiRef: UI_FooterOperationPanelRef;
}

export function UI_FooterOperationPanel({ uiRef }: UI_FooterOperationPanelParam ) {

  const edit_CommandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: MainCommandButtonID.undo, icon: 'undo', title: 'もどに戻す' },
        { index: MainCommandButtonID.redo, icon: 'redo', title: 'やりなおし' },
        { index: 9001, icon: '', isSeparator: true },
        { index: MainCommandButtonID.saveFile, icon: 'save', title: '保存' },
        { index: 9002, icon: '', isSeparator: true },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        if (uiRef.button_Click) {

          uiRef.button_Click(item.index);
        }
      }
    }
  }, [])

  const view_CommandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: MainCommandButtonID.touchOperationPanel, icon: 'touchoperationpanel', title: 'タッチ操作パネルの表示' },
        { index: MainCommandButtonID.layerWindow, icon: 'layers', title: 'レイヤーパネルの表示' },
        { index: MainCommandButtonID.paletteWindow, icon: 'palette', title: 'パレットパネルの表示' },
        { index: MainCommandButtonID.colorMixerWindow, icon: 'colorize', title: 'カラーミキサーパネルの表示' },
        { index: MainCommandButtonID.timeLineWindow, icon: 'playcircle', title: 'タイムラインパネルの表示' },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        if (uiRef.button_Click) {

          uiRef.button_Click(item.index);
        }
      }
    }
  }, [])

  return (
    <React.Fragment>
      <div className={`footer-ui-container-left ${uiRef.isForMobile ? 'mobile-screen' : ''}`}>
        <UI_CommandButtons uiRef={edit_CommandButtonsRef}/>
      </div>
      <div className={`footer-ui-container-right ${uiRef.isForMobile ? 'mobile-screen' : ''}`}>
        <UI_CommandButtons uiRef={view_CommandButtonsRef}/>
      </div>
    </React.Fragment>
    );
}
