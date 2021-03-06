import * as React from 'react';

import { MainCommandButtonID } from '../app/view.class';
import { UI_CommandButtonsItem, UI_CommandButtonsRef, UI_CommandButtons } from './command_buttons';

export interface UI_HeaderWindowRef {

  update?(): void;

  commandButton_Click?: (id: MainCommandButtonID) => void;
}

export interface UI_HeaderWindowParam {

  uiRef: UI_HeaderWindowRef;
}

export function UI_HeaderWindow({ uiRef }: UI_HeaderWindowParam) {

  const [file_CommandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: MainCommandButtonID.open, icon: 'folder', title: 'ファイルを開く' },
        { index: MainCommandButtonID.save, icon: 'save', title: '保存' },
        { index: MainCommandButtonID.export, icon: 'publish', title: 'エクスポート' },
        { index: MainCommandButtonID.undo, icon: 'undo', title: '元に戻す' },
        { index: MainCommandButtonID.redo, icon: 'redo', title: 'やり直し' },
        { index: MainCommandButtonID.settings, icon: 'settings', title: 'ドキュメントの設定' },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        if (uiRef.commandButton_Click) {

          uiRef.commandButton_Click(item.index);
        }
      }
    } as UI_CommandButtonsRef
  });

  const [view_CommandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: MainCommandButtonID.layerWindow, icon: 'layers' },
        { index: MainCommandButtonID.paletteWindow, icon: 'palette' },
        { index: MainCommandButtonID.colorMixerWindow, icon: 'colorize' },
        { index: MainCommandButtonID.timeLineWindow, icon: 'play_circle_outline' },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        if (uiRef.commandButton_Click) {

          uiRef.commandButton_Click(item.index);
        }
      }
    } as UI_CommandButtonsRef
  });

  React.useEffect(() => {

      uiRef.update = () => {

      };

      return function cleanup() {

          uiRef.update = null;
      };
  });

  return (
    <React.Fragment>

        <div className='file-commands'>
          <UI_CommandButtons uiRef={file_CommandButtonsRef} noBorder={true} />
        </div>
        <div className='file-name'>
          <input type="text" id="fileName" />
        </div>
        <div className='view-commands'>
          <UI_CommandButtons uiRef={view_CommandButtonsRef} />
        </div>

    </React.Fragment>
  );
}
