import * as React from 'react';
import { RibbonUIControlID } from '../app/view.class';

import { float, int } from '../base/conversion';
import { MainToolID, DrawLineToolSubToolID, EditModeSubToolID, SettingsSubToolID} from '../base/tool';

import { UI_SelectBox, UI_SelectBoxOption } from './selectbox';
import { UI_CheckBox } from './checkbox';
import { UI_MenuButtons, UI_MenuButtonsRef } from './menu_buttons';
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool_window';
import { EyesSymmetryInputSideID, PosingLayer, VectorLayer } from '../base/data';

export interface UI_RibbonUIRef {

  hide?: () => void;
  show?: () => void;
  updateMainTool?(mainToolID: MainToolID): void;
  updateHome?(subToolIndex: int, brushWidthMax: float, brushWidthMin: float, eraserWidthMax: float): void;
  updateDraw3D?(vectorLayer: VectorLayer, new_layerOptions: UI_SelectBoxOption[]): void;

  subtoolButton_Click?(subToolIndex: int): void;
  toggleButton_Click?(id: RibbonUIControlID, value: number): void;
  numberInput_Change?(id: RibbonUIControlID, value: float): void;
  checkBox_Change?(id: RibbonUIControlID, checked: boolean, value: boolean | number | null): void;
  selectBox_Change?(id: RibbonUIControlID, selected_Options: UI_SelectBoxOption[]): void;

  subToolIndex?: int;
}

export interface UI_RibbonUIParam {

  uiRef: UI_RibbonUIRef;
  menuButtonsRef: UI_MenuButtonsRef;
  subToolWindowRef: UI_SubToolWindowRef;
}

export function UI_RibbonUI({ uiRef, menuButtonsRef, subToolWindowRef }: UI_RibbonUIParam ) {

  const [new_mainToolID, set_new_mainToolID] = React.useState(MainToolID.none);

  React.useEffect(() => {

    uiRef.updateMainTool = (new_mainToolID: MainToolID) => {

      set_new_mainToolID(new_mainToolID);
    };

    return function cleanup() {

      uiRef.updateMainTool = null;
    };
  });

  return (
    <React.Fragment>
      <div className="tool-ribbon">
        <div className="tool-ribbon-rows">

          <div className="menu-buttons-row">
            <UI_MenuButtons uiRef={menuButtonsRef} />
            <div className="headerCommandButton" id="menu_btnOperationOption">
              <img src="./dist/res/icons8-settings-100.png" />
            </div>
          </div>

          <div className="ribbon-ui-row">
            {
              new_mainToolID == MainToolID.drawLine &&
                <UI_RibbonUI_Home uiRef={uiRef} />
            }
            {
              new_mainToolID == MainToolID.edit &&
                <UI_RibbonUI_Edit uiRef={uiRef} />
            }
            {
              new_mainToolID == MainToolID.misc &&
                <UI_RibbonUI_Settings uiRef={uiRef} />
            }
            {
              (new_mainToolID == MainToolID.posing || new_mainToolID == MainToolID.imageReferenceLayer) &&
                <UI_SubToolWindow uiRef={subToolWindowRef} />
            }
            {
              // new_mainToolID == MainToolID.draw3D &&
              //   <UI_RibbonUI_Draw3D uiRef={uiRef} />
            }
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

interface UI_RibbonUI_SubToolButtonParam {

  uiRef: UI_RibbonUIRef;
  icon: string;
  label: string[];
  subToolIndex: number;
}

function UI_RibbonUI_SubToolButton({ uiRef, icon, label, subToolIndex }: UI_RibbonUI_SubToolButtonParam ) {

  return (
    <div className={`tool-button selectable-item ${subToolIndex == uiRef.subToolIndex ? 'selected' : ''}`}
      onClick={() => uiRef.subtoolButton_Click(subToolIndex)}
    >
      <div className="tool-button-inner selectable-item-inner">
        <div className="icon">
          <img src={icon} />
        </div>
        <div className="label">{
          label.map((labelText, index) => (
            <React.Fragment key={index}>
              <span>{labelText}</span>{index != label.length - 1 && <br/>}
            </React.Fragment>
          ))
        }</div>
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

function UI_RibbonUI_NumberInput({ label, digit = 2, step = 0.05, min = 0.05, value, onChange }: UI_RibbonUI_NumberInputParam) {

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

interface UI_RibbonUI_ToggleButtonParam {

  label: string;
  value: number;
  currentValue: number;
  onClick?(value: number): void;
}

function UI_RibbonUI_ToggleButton({ label, value, currentValue, onClick }: UI_RibbonUI_ToggleButtonParam) {

  function handleClick() {

    if (onClick) {

      onClick(value);
    }
  }

  return (
    <div className={`button selectable-item ${currentValue==value ? 'selected' : ''}`} onClick={handleClick}>
      <div className="selectable-item-inner-sq">{label}</div>
    </div>
  );
}

function UI_RibbonUI_Home({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subToolIndex] = React.useState(-1);
  const [brushWidth_Max, set_brushWidth_Max] = React.useState(1.0);
  const [brushWidth_Min, set_brushWidth_Min] = React.useState(1.0);
  const [eraserWidth_Max, set_eraserWidth_Max] = React.useState(1.0);

  const [eyesSymmetry_enabled, set_eyesSymmetry_enabled] = React.useState(false);
  const [eyesSymmetry_currentOption, set_eyesSymmetry_currenOption] = React.useState<UI_SelectBoxOption[]>([]);
  const [eyesSymmetry_layerOptions, set_eyesSymmetry_layerOptions] = React.useState<UI_SelectBoxOption[]>([]);
  const [eyesSymmetry_side, set_eyesSymmetry_side] = React.useState(EyesSymmetryInputSideID.left);

  React.useEffect(() => {

    uiRef.updateHome = (subToolIndex: int, brushWidthMax: float, brushWidthMin: float, eraserWidthMax: float) => {

      set_subToolIndex(subToolIndex);

      set_brushWidth_Max(brushWidthMax);
      set_brushWidth_Min(brushWidthMin);
      set_eraserWidth_Max(eraserWidthMax);
    };

    uiRef.updateDraw3D = (vectorLayer: VectorLayer, new_layerOptions: UI_SelectBoxOption[]) => {

      // TODO: リストを変更したときにイベントが発生しないＵＩに乗り換えるもしくは自作する
      selectBox_Cancel = true;

      set_eyesSymmetry_enabled(vectorLayer.eyesSymmetryEnabled);
      set_eyesSymmetry_layerOptions(new_layerOptions);
      set_eyesSymmetry_side(vectorLayer.eyesSymmetryInputSide);

      const selected_LayerOption = new_layerOptions.find(option => option.data == vectorLayer.posingLayer);

      // console.log('updateDraw3D', vectorLayer.enableEyesSymmetry, vectorLayer.posingLayer, selected_LayerOption);

      if (selected_LayerOption) {

        set_eyesSymmetry_currenOption([selected_LayerOption]);
      }
      else {

        set_eyesSymmetry_currenOption([]);
      }

      // TODO: リストを変更したときにイベントが発生しないＵＩに乗り換える
      window.setTimeout(() => {
        selectBox_Cancel = false;
      }, 100);
    };

    return function cleanup() {

      uiRef.updateHome = null;
      uiRef.updateDraw3D = null;
    };
  });

  function handle_numberInput_Change(id: RibbonUIControlID, value: float) {

    if (uiRef.numberInput_Change) {

      uiRef.numberInput_Change(id, value);
    }
  }

  function handle_checkBox_Change(id: RibbonUIControlID, checked: boolean, value: boolean | number | null) {

    if (uiRef.checkBox_Change) {

      uiRef.checkBox_Change(id, checked, value);
    }
  }

  function handle_selectBox_Change(id: RibbonUIControlID, value: UI_SelectBoxOption[]) {

    if (selectBox_Cancel) {
      return;
    }

    if (uiRef.selectBox_Change) {

      uiRef.selectBox_Change(id, value);
    }
  }

  function handle_button_Click(value: number) {

    switch(value) {

      case 1:
        set_eyesSymmetry_side(1);
        break;

      case 2:
        set_eyesSymmetry_side(2);
        break;
    }

    if (uiRef.toggleButton_Click) {

      uiRef.toggleButton_Click(RibbonUIControlID.vectorLayer_eyesSymmetryInputSide, value);
    }
  }

  return (
    <div className="ribbon-ui-home">
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_draw.svg" label={["線を描く", "B"]}
        subToolIndex={DrawLineToolSubToolID.drawLine}
      />
      <div className="draw-line-params">
        <UI_RibbonUI_NumberInput label="基本幅" value={brushWidth_Max}
          onChange={(value) => {
            set_brushWidth_Max(value);
            handle_numberInput_Change(RibbonUIControlID.brushWidth_Max, value);
          }}
        />
        <UI_RibbonUI_NumberInput label="最小幅" value={brushWidth_Min}
          onChange={(value) => {
            set_brushWidth_Min(value);
            handle_numberInput_Change(RibbonUIControlID.brushWidth_Min, value)
          }}
        />
      </div>
      <UI_RibbonUI_Separator />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_eracer.svg" label={["消しゴム", "E"]}
        subToolIndex={DrawLineToolSubToolID.deletePointBrush}
      />
      <div className="draw-line-params">
        <UI_RibbonUI_NumberInput label="サイズ" value={eraserWidth_Max} step={1.0}
          onChange={(value) => {
            set_eraserWidth_Max(value);
            handle_numberInput_Change(RibbonUIControlID.eraserWidth_Max, value);
          }}
        />
      </div>
      <UI_RibbonUI_Separator />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_extrude_line.svg" label={["線の延長", "H"]}
        subToolIndex={DrawLineToolSubToolID.extrudeLine}
      />
      {/* <UI_RibbonUI_Button uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["太さの", "上書き"]}
        subToolIndex={DrawLineToolSubToolID.editLinePointWidth_BrushSelect}
      />
      <UI_RibbonUI_Button uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["太さを", "足す"]}
        subToolIndex={DrawLineToolSubToolID.overWriteLineWidth}
      />
      <UI_RibbonUI_Separator /> */}
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_scratch_line.svg" label={["線の修正", "G"]}
        subToolIndex={DrawLineToolSubToolID.scratchLine}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["太さの修正"]}
        subToolIndex={DrawLineToolSubToolID.scratchLineWidth}
      />
      <UI_RibbonUI_Separator />
      <div className="group-container ">
        <div className="label">目の左右対称補助</div>
        <div className="contents">
          <div className="checkbox-item">
            <div className="label">有効</div>
            <div className="checkbox">
              <UI_CheckBox value={eyesSymmetry_enabled} onChange={(checked, value) => handle_checkBox_Change(RibbonUIControlID.vectorLayer_enableEyesSymmetry, checked, value)}/>
            </div>
          </div>
          {
            eyesSymmetry_enabled &&
            <React.Fragment>
              <div className="item">
                <div className="label">描きこむ側</div>
                <div className="toggle">
                  <UI_RibbonUI_ToggleButton label="左" value={EyesSymmetryInputSideID.left} currentValue={eyesSymmetry_side} onClick={handle_button_Click} />
                  <UI_RibbonUI_ToggleButton label="右" value={EyesSymmetryInputSideID.right} currentValue={eyesSymmetry_side} onClick={handle_button_Click} />
                </div>
              </div>
              <div className="select-item eyes-symmetry">
                <div className="label">ポーズレイヤー</div>
                <UI_SelectBox
                  options={eyesSymmetry_layerOptions}
                  values={eyesSymmetry_currentOption}
                  dropdownGap={0}
                  searchable={false}
                  onChange={(value) => handle_selectBox_Change(RibbonUIControlID.vectorLayer_posingLayer, value)}
                />
              </div>
            </React.Fragment>
          }

        </div>
      </div>
      <UI_RibbonUI_Separator />
    </div>
  );
}

let selectBox_Cancel = false;

function UI_RibbonUI_Edit({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subToolIndex] = React.useState(-1);

  React.useEffect(() => {

    uiRef.updateHome = (subToolIndex: int) => {

      set_subToolIndex(subToolIndex);
    };

    return function cleanup() {

      uiRef.updateHome = null;
    };
  });

  return (
    <div className="ribbon-ui-edit">
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["線の選択"]}
        subToolIndex={EditModeSubToolID.lineBrushSelect}
      />
      {/* <UI_RibbonUI_Button uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["線分の選択"]}
        subToolIndex={EditModeSubToolID.lineSegmentBrushSelect}
      /> */}
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["点の選択"]}
        subToolIndex={EditModeSubToolID.linePointBrushSelect}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["移動/変形"]}
        subToolIndex={EditModeSubToolID.editModeMain}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["再分割"]}
        subToolIndex={EditModeSubToolID.resampleSegment}
      />
    </div>
  );
}

function UI_RibbonUI_Settings({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subToolIndex] = React.useState(-1);

  React.useEffect(() => {

    uiRef.updateHome = (subToolIndex: int) => {

      set_subToolIndex(subToolIndex);
    };

    return function cleanup() {

      uiRef.updateHome = null;
    };
  });

  return (
    <div className="ribbon-ui-edit">
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon="./dist/res/icon_dummy.svg" label={["エクスポート", "範囲の設定"]}
        subToolIndex={SettingsSubToolID.editDocumentFrame}
      />
    </div>
  );
}

/*
function UI_RibbonUI_Draw3D({ uiRef }: { uiRef: UI_RibbonUIRef }) {
  React.useEffect(() => {
    return function cleanup() {
    };
  });
  return (
    <div className="ribbon-ui-draw3d">
    </div>
  );
}
*/
