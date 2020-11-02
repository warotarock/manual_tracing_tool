import * as React from 'react';
import { RibbonUIControlID } from '../app/view.class';

import { float, int } from '../base/conversion';
import { DrawLineToolSubToolID } from '../base/tool';

import { UI_MenuButtons, UI_MenuButtonsRef } from './menu_buttons';
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool_window';

export interface UI_RibbonUIRef {

  hide?: () => void;
  show?: () => void;
  update?(subToolIndex: int, brushWidthMax: float): void;

  button_Click?(subToolIndex: number): void;
  numberInput_Change?(id: RibbonUIControlID, value: float): void;

  subToolIndex?: int;
}

export interface UI_RibbonUIParam {

  uiRef: UI_RibbonUIRef;
  menuButtonsRef: UI_MenuButtonsRef;
  subToolWindowRef: UI_SubToolWindowRef;
}

export function UI_RibbonUI({ uiRef, menuButtonsRef, subToolWindowRef }: UI_RibbonUIParam ) {

  const [active_SubToolIndex, setActive_SubToolIndex] = React.useState(-1);
  const [brushWidth_Max, set_brushWidth_Max] = React.useState(1.0);
  const [brushWidth_Min, set_brushWidth_Min] = React.useState(1.0);
  const [eraserWidth_Max, set_eraserWidth_Max] = React.useState(1.0);
  const [eraserWidth_Min, set_eraserWidth_Min] = React.useState(1.0);

  React.useEffect(() => {

    uiRef.update = (subToolIndex: int, brushWidthMax: float) => {

      uiRef.subToolIndex = subToolIndex;

      setActive_SubToolIndex(subToolIndex);

      set_brushWidth_Max(brushWidthMax);
    };

    return function cleanup() {

      uiRef.update = null;
    };
  });

  function handle_brushWidth(value: float, id: RibbonUIControlID) {

    if (uiRef.numberInput_Change) {

      uiRef.numberInput_Change(id, value);
    }
  }

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
              <UI_RibbonUI_Button uiRef={uiRef}
                icon="./dist/res/icon_draw.svg" label="線を描く"
                subToolIndex={DrawLineToolSubToolID.drawLine}
              />
              <div className="draw-line-params">
                <UI_RibbonUI_NumberInput label="最大幅" value={brushWidth_Max}
                  onChange={(value) => {
                    set_brushWidth_Max(value);
                    handle_brushWidth(value, RibbonUIControlID.brushWidth_Max);
                  }}
                />
                <UI_RibbonUI_NumberInput label="最小幅" value={brushWidth_Min}
                  onChange={(value) => {
                    set_brushWidth_Min(value);
                    handle_brushWidth(value, RibbonUIControlID.brushWidth_Min)
                  }}
                />
              </div>
              <UI_RibbonUI_Separator />
              <UI_RibbonUI_Button uiRef={uiRef}
                icon="./dist/res/icon_eracer.svg" label="消しゴム"
                subToolIndex={DrawLineToolSubToolID.deletePointBrush}
              />
              <div className="draw-line-params">
                <UI_RibbonUI_NumberInput label="最大幅" value={eraserWidth_Max}
                  onChange={(value) => {
                    set_eraserWidth_Max(value);
                    handle_brushWidth(value, RibbonUIControlID.eraserWidth_Max);
                  }}
                />
                <UI_RibbonUI_NumberInput label="最小幅" value={eraserWidth_Min}
                  onChange={(value) => {
                    set_eraserWidth_Min(value);
                    handle_brushWidth(value, RibbonUIControlID.eraserWidth_Min);
                  }} />
              </div>
              <UI_RibbonUI_Separator />
            </div>
            <UI_SubToolWindow uiRef={subToolWindowRef}></UI_SubToolWindow>
          </div>

        </div>
      </div>
    </React.Fragment>
  );
}

function UI_RibbonUI_Separator() {

  return (
    <div className="separator">
    </div>
  );
}


interface UI_RibbonUI_ButtonParam {

  uiRef: UI_RibbonUIRef;
  icon: string;
  label: string;
  subToolIndex: number;
}

function UI_RibbonUI_Button({ uiRef, icon, label, subToolIndex }: UI_RibbonUI_ButtonParam ) {

  return (
    <div className={`tool-button selectable-item ${subToolIndex == uiRef.subToolIndex ? 'selected' : ''}`}
      onClick={() => uiRef.button_Click(subToolIndex)}
    >
      <div className="tool-button-inner selectable-item-inner">
        <div className="icon">
          <img src={icon} />
        </div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}

interface UI_RibbonUI_NumberInputParam {

  label: string;
  digit?: int;
  step?: float;
  min?: float;
  value: float;
  onChange?(value: float): void;
}

function UI_RibbonUI_NumberInput({ label, digit = 2, step = 0.05, min = 0.05, value, onChange }: UI_RibbonUI_NumberInputParam ) {

  let valueText = '';
  if (typeof(value) == 'number') {

    valueText = value.toFixed(digit);
  }

  function handleChange(event) {

    let inputValue = Number(event.target.value);

    if (isNaN(inputValue)) {

      inputValue = null;
    }
    else {

      if (inputValue < min) {

        inputValue = min;
      }

      if (onChange) {

        onChange(inputValue);
      }
    }
  }

  return (
    <div className="number-input">
      <div className="label">{label}</div>
      <input type="number" step={step.toString()} value={valueText} onChange={handleChange} />
    </div>
  );
}
