import * as React from 'react';

import { MainCommandButtonID } from 'app/view.class';

import { UI_ScrollView } from 'ui/scroll_view';
import { UI_CommandButtonsItem, UI_CommandButtonsRef, UI_CommandButtons } from 'ui/command_buttons';

export interface UI_HeaderWindowRef {

  update?(): void;

  commandButton_Click?: (id: MainCommandButtonID) => void;
}

export interface UI_HeaderWindowParam {

  uiRef: UI_HeaderWindowRef;
}

export function UI_HeaderWindow({ uiRef }: UI_HeaderWindowParam) {

  const [file_CommandButtonsRef, setFile_CommandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: MainCommandButtonID.open, icon: 'folder' },
        { index: MainCommandButtonID.save, icon: 'save' },
        { index: MainCommandButtonID.export, icon: 'publish' },
        { index: MainCommandButtonID.settings, icon: 'settings' },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        uiRef.commandButton_Click(item.index);
      }
    } as UI_CommandButtonsRef
  });

  const [view_CommandButtonsRef, setView_CommandButtonsRef] = React.useState(() => {

    return {
      items: [
        { index: MainCommandButtonID.layerWindow, icon: 'layers' },
        { index: MainCommandButtonID.paletteWindow, icon: 'palette' },
        { index: MainCommandButtonID.timeLineWindow, icon: 'play_circle_outline' },
      ],

      commandButton_Click: (item: UI_CommandButtonsItem) => {

        uiRef.commandButton_Click(item.index);
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
