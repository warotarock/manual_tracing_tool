import * as React from 'react'
import { float, int } from '../logics/conversion'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_NumberInput, UI_RibbonUI_InputLabel, UI_RibbonUI_Separator, UI_RibbonUI_ToggleButton,
  UI_RibbonUI_ToggleButtonGroup, UI_RibbonUI_TextInput, UI_RibbonUI_RGBAColor } from './ribbon_controls'
import { DrawLineTypeID, EyesSymmetryInputSideID, FillAreaTypeID, VectorLayer } from '../document_data'
import { UI_CheckBox } from './checkbox'
import { UI_SelectBox, UI_SelectBoxOption } from './selectbox'
import { RibbonUIControlID } from '../window/constants'

let selectBox_Cancel = false

export function UI_RibbonUI_Layer_VectorLayer({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const currentVectorLayer = uiRef.docContext.currentVectorLayer
  const isVectorLayer = (currentVectorLayer != null)

  const [drawLineType, set_drawLineType] = React.useState(isVectorLayer ? currentVectorLayer.drawLineType : DrawLineTypeID.none)
  const [fillAreaType, set_fillAreaType] = React.useState(isVectorLayer ? currentVectorLayer.fillAreaType : FillAreaTypeID.none)
  const [lineWidthBiasRate, set_lineWidthBiasRate] = React.useState(isVectorLayer ? currentVectorLayer.lineWidthBiasRate : 1.0)

  const [eyesSymmetry_visible, set_eyesSymmetry_visible] = React.useState(isVectorLayer && VectorLayer.isVectorLayerWithOwnData(currentVectorLayer))
  const [eyesSymmetry_enabled, set_eyesSymmetry_enabled] = React.useState(isVectorLayer && currentVectorLayer.eyesSymmetryEnabled)
  const [eyesSymmetry_currentOption, set_eyesSymmetry_currentOption] = React.useState<UI_SelectBoxOption[]>([])
  const [eyesSymmetry_layerOptions, set_eyesSymmetry_layerOptions] = React.useState<UI_SelectBoxOption[]>([])
  const [eyesSymmetry_side, set_eyesSymmetry_side] = React.useState(EyesSymmetryInputSideID.left)

  React.useEffect(() => {

    uiRef.updateVecrotLayerUI = (vectorLayer: VectorLayer, new_layerOptions: UI_SelectBoxOption[]) => {

      set_drawLineType(vectorLayer.drawLineType)
      set_fillAreaType(vectorLayer.fillAreaType)
      set_lineWidthBiasRate(vectorLayer.lineWidthBiasRate)

      // TODO: リストを変更したときにイベントが発生しないＵＩに乗り換えるもしくは自作する
      selectBox_Cancel = true

      set_eyesSymmetry_visible(VectorLayer.isVectorLayerWithOwnData(vectorLayer))
      set_eyesSymmetry_enabled(vectorLayer.eyesSymmetryEnabled)
      set_eyesSymmetry_layerOptions(new_layerOptions)
      set_eyesSymmetry_side(vectorLayer.eyesSymmetryInputSide)

      const selected_LayerOption = new_layerOptions.find(option => option.data == vectorLayer.posingLayer)

      // console.log('updateDraw3D', vectorLayer.enableEyesSymmetry, vectorLayer.posingLayer, selected_LayerOption)

      if (selected_LayerOption) {

        set_eyesSymmetry_currentOption([selected_LayerOption])
      }
      else {

        set_eyesSymmetry_currentOption([])
      }

      // TODO: リストを変更したときにイベントが発生しないＵＩに乗り換える
      window.setTimeout(() => {
        selectBox_Cancel = false
      }, 100)
    }

    return function cleanup() {

      uiRef.updateVecrotLayerUI = null
    }
  })

  function numberInput_Change(id: RibbonUIControlID, value: float, setFunction: (value: float) => void) {

    setFunction(value)

    if (uiRef.numberInput_Change) {

      uiRef.numberInput_Change(id, value)
    }
  }

  function eyesSymmetry_enabled_Change(id: RibbonUIControlID, checked: boolean, value: boolean | number | null) {

    if (uiRef.checkBox_Change) {

      uiRef.checkBox_Change(id, checked, value)
    }
  }

  function eyesSymmetry_layerOptions_Change(id: RibbonUIControlID, value: UI_SelectBoxOption[]) {

    if (selectBox_Cancel) {
      return
    }

    if (uiRef.selectBox_Change) {

      uiRef.selectBox_Change(id, value)
    }
  }

  function tobbleButton_Click(id: RibbonUIControlID, value: number, setFunction: (value: int) => void) {

    setFunction(value)

    if (uiRef.toggleButton_Click) {

      uiRef.toggleButton_Click(id, value)
    }
  }

  return (
    <div className="ribbon-ui-layer">
      <div className="group-container">
        <div className="label">描画</div>
        <div className="group-contents layer-drawing-params">
          <div className="param-column"><div className="param-column-inner">
            <UI_RibbonUI_InputLabel label={'線色'} />
            <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_drawLineType} currentValue={drawLineType}
              onClick={ (id, value) => tobbleButton_Click(id, value, set_drawLineType) }
            >
              <UI_RibbonUI_ToggleButton label="なし" value={DrawLineTypeID.none} />
              <UI_RibbonUI_ToggleButton label="レイヤー色" value={DrawLineTypeID.layerColor} />
              <UI_RibbonUI_ToggleButton label="パレット" value={DrawLineTypeID.paletteColor} />
            </UI_RibbonUI_ToggleButtonGroup>

            <UI_RibbonUI_InputLabel label={'塗り色'} />
            <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_fillAreaType} currentValue={fillAreaType}
              onClick={ (id, value) => tobbleButton_Click(id, value, set_fillAreaType) }
            >
              <UI_RibbonUI_ToggleButton label="なし"  value={FillAreaTypeID.none} />
              <UI_RibbonUI_ToggleButton label="レイヤー色" value={FillAreaTypeID.fillColor} />
              <UI_RibbonUI_ToggleButton label="パレット" value={FillAreaTypeID.paletteColor} />
            </UI_RibbonUI_ToggleButtonGroup>
          </div></div>
          <div className="param-column"><div className="param-column-inner">
            <UI_RibbonUI_InputLabel label={'ベース線幅'} />
            <UI_RibbonUI_NumberInput value={lineWidthBiasRate} digit={2} step={0.1} min={0.01} max={10.0}
              onChange={(value) => numberInput_Change(RibbonUIControlID.vectorLayer_lineWidthBiasRate, value, set_lineWidthBiasRate) }
            />
          </div></div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
      { eyesSymmetry_visible && <React.Fragment>
        <div className="group-container">
            <div className="label">目の左右対称補助</div>
            <div className="group-contents">
              <div className="checkbox-item">
                <div className="label">有効</div>
                <div className="checkbox">
                  <UI_CheckBox value={eyesSymmetry_enabled}
                    onChange={(checked, value) => eyesSymmetry_enabled_Change(RibbonUIControlID.vectorLayer_enableEyesSymmetry, checked, value)}
                  />
                </div>
              </div>
              { eyesSymmetry_enabled && <React.Fragment>
                <div className="group-item">
                  <div className="label">描きこむ側</div>
                  <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_eyesSymmetryInputSide} currentValue={eyesSymmetry_side}
                    onClick={ (id, value) => tobbleButton_Click(id, value, set_eyesSymmetry_side) }
                  >
                    <UI_RibbonUI_ToggleButton label="左" value={EyesSymmetryInputSideID.left} />
                    <UI_RibbonUI_ToggleButton label="右" value={EyesSymmetryInputSideID.right} />
                  </UI_RibbonUI_ToggleButtonGroup>
                </div>
                <div className="select-item eyes-symmetry">
                  <div className="label">ポーズレイヤー</div>
                  <UI_SelectBox
                    options={eyesSymmetry_layerOptions}
                    values={eyesSymmetry_currentOption}
                    dropdownGap={0}
                    searchable={false}
                    onChange={(value) => eyesSymmetry_layerOptions_Change(RibbonUIControlID.vectorLayer_posingLayer, value)}
                  />
                </div>
              </React.Fragment> }
            </div>
        </div>
        <UI_RibbonUI_Separator />
      </React.Fragment> }
    </div>
  )
}

