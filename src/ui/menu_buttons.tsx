import * as React from 'react';
import { Layer, PosingLayer, VectorLayer } from '../base/data';

import { MainToolID } from '../base/tool';

export interface UI_MenuButtonsRef {

  update?(new_mainToolID: MainToolID, new_currentLayer: Layer): void;
  item_Click?(mainToolID: MainToolID): void;
}

export interface UI_MenuButtonsParam {

  uiRef: UI_MenuButtonsRef;
}

export function UI_MenuButtons({ uiRef }: UI_MenuButtonsParam) {

  const [mainToolID, set_mainToolID] = React.useState(MainToolID.none);
  const [currentLayer, set_currentLayer] = React.useState(null as Layer);

  React.useEffect(() => {

    uiRef.update = (new_mainToolID: MainToolID, new_currentLayer: Layer) => {

      set_mainToolID(new_mainToolID);
      set_currentLayer(new_currentLayer);
    };

    return function cleanup() {

      uiRef.update = null;
    };
  });

  function handleClick(id: MainToolID) {

    if (uiRef.item_Click) {

      uiRef.item_Click(id);
    }
  }

  return (
    <div className="menu-buttons">
      {VectorLayer.isVectorLayer(currentLayer) ? <React.Fragment>
        <UI_MenuButton mainToolID={MainToolID.drawLine} label="線画" current_mainToolID={mainToolID} handleClick={handleClick} />
        <UI_MenuButton mainToolID={MainToolID.edit} label="編集" current_mainToolID={mainToolID} handleClick={handleClick} />
        {/* <UI_MenuButton mainToolID={MainToolID.draw3D} label="3D線画補助" current_mainToolID={mainToolID} handleClick={handleClick} /> */}
      </React.Fragment> : null}
      {PosingLayer.isPosingLayer(currentLayer) ? <React.Fragment>
        <UI_MenuButton mainToolID={MainToolID.posing} label="3Dポーズ" current_mainToolID={mainToolID} handleClick={handleClick} />
      </React.Fragment> : null}
      <UI_MenuButton mainToolID={MainToolID.misc} label="設定" current_mainToolID={mainToolID} handleClick={handleClick} />
    </div>
  );
}

interface UI_MenuButtonParam {

  mainToolID: MainToolID;
  label: string;
  current_mainToolID: MainToolID;
  handleClick(id: MainToolID);
}

export function UI_MenuButton({ mainToolID, label, current_mainToolID, handleClick }: UI_MenuButtonParam) {

  function getClassName() {

    if (current_mainToolID == mainToolID) {

      return 'button selected';
    }
    else {

      return 'button';
    }
  }

  return (
    <div className={getClassName()} onClick={() => handleClick(mainToolID)}>{label}</div>
  );
}
