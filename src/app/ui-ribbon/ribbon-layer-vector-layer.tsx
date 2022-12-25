import * as React from 'react'
import { DrawLineTypeID, EyesSymmetryInputSideID, FillAreaTypeID, LayerTypeID, VectorLayer } from '../document-data'
import { float, int } from '../common-logics'
import { MainToolTabID } from '../tool'
import { RibbonUIControlID } from '../ui/constants'
import { UI_CheckBox, UI_NumberInput } from '../ui-common-controls'
import { UI_SelectBox, UI_SelectBoxOption } from '../ui-popover'
import {
  UI_RibbonUI_InputLabel, UI_RibbonUI_Separator, UI_RibbonUI_ToggleButton,
  UI_RibbonUI_ToggleButtonGroup
} from './ribbon-controls'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_Layer_VectorLayer_Param {

  ribbonUIRef: UI_RibbonUIRef
}

export function UI_RibbonUI_Layer_VectorLayer({ ribbonUIRef }: UI_RibbonUI_Layer_VectorLayer_Param) {

  const currentVectorLayer = ribbonUIRef.docContext.currentVectorLayer
  const isVectorLayer = (currentVectorLayer != null)

  const [drawLineType, set_drawLineType] = React.useState(isVectorLayer ? currentVectorLayer.drawLineType : DrawLineTypeID.none)
  const [fillAreaType, set_fillAreaType] = React.useState(isVectorLayer ? currentVectorLayer.fillAreaType : FillAreaTypeID.none)
  const [lineWidthBiasRate, set_lineWidthBiasRate] = React.useState(isVectorLayer ? currentVectorLayer.lineWidthBiasRate : 1.0)

  const [eyesSymmetry_visible, set_eyesSymmetry_visible] = React.useState(isVectorLayer && VectorLayer.isVectorStrokeLayer(currentVectorLayer))
  const [eyesSymmetry_enabled, set_eyesSymmetry_enabled] = React.useState(isVectorLayer && currentVectorLayer.eyesSymmetryEnabled)
  const [eyesSymmetry_side, set_eyesSymmetry_side] = React.useState(isVectorLayer && currentVectorLayer.eyesSymmetryInputSide)
  const [eyesSymmetry_layerOptions, set_eyesSymmetry_layerOptions] = React.useState<UI_SelectBoxOption[]>(ribbonUIRef.posingLayerOptions)
  const [eyesSymmetry_currentOption, set_eyesSymmetry_currentOption] = React.useState<UI_SelectBoxOption[]>(ribbonUIRef.posingLayerOptions_Selected)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.layer],
    filter: (layer) => { return VectorLayer.isVectorLayerWithOwnData(layer) },
    update: (docContext) => {

      const vectorLayer = docContext.currentVectorLayer

      set_drawLineType(vectorLayer.drawLineType)
      set_fillAreaType(vectorLayer.fillAreaType)
      set_lineWidthBiasRate(vectorLayer.lineWidthBiasRate)

      set_eyesSymmetry_visible(VectorLayer.isVectorStrokeLayer(vectorLayer))
      set_eyesSymmetry_enabled(vectorLayer.eyesSymmetryEnabled)
      set_eyesSymmetry_side(vectorLayer.eyesSymmetryInputSide)
      set_eyesSymmetry_layerOptions(ribbonUIRef.posingLayerOptions)
      set_eyesSymmetry_currentOption(ribbonUIRef.posingLayerOptions_Selected)
    }
  }), [])

  React.useEffect(() => {

    ribbonUIRef.registerTabFunctionInfo(tabFunctionInfo)

    return function cleanup() {

      ribbonUIRef.unregisterTabFunctionInfo(tabFunctionInfo)
    }
  }, [])

  function numberInput_Changed(id: RibbonUIControlID, value: float, setFunction: (value: float) => void) {

    setFunction(value)

    if (ribbonUIRef.numberInput_Changed) {

      ribbonUIRef.numberInput_Changed(id, value)
    }
  }

  function eyesSymmetry_enabled_Changed(id: RibbonUIControlID, checked: boolean, value: boolean | number | null) {

    if (ribbonUIRef.checkBox_Changed) {

      ribbonUIRef.checkBox_Changed(id, checked, value)
    }
  }

  function eyesSymmetry_layerOptions_Changed(id: RibbonUIControlID, item: UI_SelectBoxOption) {

    if (ribbonUIRef.selectBox_Changed) {

      ribbonUIRef.selectBox_Changed(id, item)
    }
  }

  function tobbleButton_Clickd(id: RibbonUIControlID, value: number, setFunction: (value: int) => void) {

    setFunction(value)

    if (ribbonUIRef.toggleButton_Clicked) {

      ribbonUIRef.toggleButton_Clicked(id, value)
    }
  }

  return (
    <div className="ribbon-ui-layer">
      <div className="group-container">
        <div className="label">描画</div>
        <div className="group-contents grouped-params">
          <div className="param-column">
            <div className="param-column-inner">
              <UI_RibbonUI_InputLabel label={'線色'} />
              <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_drawLineType} currentValue={drawLineType}
                onClick={ (id, value) => tobbleButton_Clickd(id, value, set_drawLineType) }
              >
                <UI_RibbonUI_ToggleButton label="なし" value={DrawLineTypeID.none} />
                <UI_RibbonUI_ToggleButton label="レイヤー色" value={DrawLineTypeID.layerColor} />
                <UI_RibbonUI_ToggleButton label="パレット" value={DrawLineTypeID.paletteColor} />
              </UI_RibbonUI_ToggleButtonGroup>

              <UI_RibbonUI_InputLabel label={'塗り色'} />
              <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_fillAreaType} currentValue={fillAreaType}
                onClick={ (id, value) => tobbleButton_Clickd(id, value, set_fillAreaType) }
              >
                <UI_RibbonUI_ToggleButton label="なし"  value={FillAreaTypeID.none} />
                <UI_RibbonUI_ToggleButton label="レイヤー色" value={FillAreaTypeID.fillColor} />
                <UI_RibbonUI_ToggleButton label="パレット" value={FillAreaTypeID.paletteColor} />
              </UI_RibbonUI_ToggleButtonGroup>
            </div>
          </div>
          <div className="param-column">
            <div className="param-column-inner">
              <UI_RibbonUI_InputLabel label={'ベース線幅'} />
              <UI_NumberInput value={lineWidthBiasRate} digit={2} step={0.1} min={0.01} max={10.0}
                onChange={(value) => numberInput_Changed(RibbonUIControlID.vectorLayer_lineWidthBiasRate, value, set_lineWidthBiasRate) }
              />
            </div>
          </div>
        </div>
      </div>
      { eyesSymmetry_visible && <React.Fragment>
        <UI_RibbonUI_Separator />
        <div className="group-container">
            <div className="label">目の左右対称補助</div>
            <div className="group-contents">
              <div className="checkbox-item">
                <div className="label">有効</div>
                <div className="checkbox">
                  <UI_CheckBox value={eyesSymmetry_enabled}
                    onChange={(checked, value) => eyesSymmetry_enabled_Changed(RibbonUIControlID.vectorLayer_enableEyesSymmetry, checked, value)}
                  />
                </div>
              </div>
              { eyesSymmetry_enabled && <React.Fragment>
                <div className="group-item">
                  <div className="label">描きこむ側</div>
                  <UI_RibbonUI_ToggleButtonGroup
                    id={RibbonUIControlID.vectorLayer_eyesSymmetryInputSide}
                    currentValue={eyesSymmetry_side}
                    onClick={ (id, value) => tobbleButton_Clickd(id, value, set_eyesSymmetry_side) }
                  >
                    <UI_RibbonUI_ToggleButton label="左" value={EyesSymmetryInputSideID.left} />
                    <UI_RibbonUI_ToggleButton label="右" value={EyesSymmetryInputSideID.right} />
                  </UI_RibbonUI_ToggleButtonGroup>
                </div>
                <div className="select-item eyes-symmetry">
                  <div className="label">ポーズレイヤー</div>
                  <div className="select-box">
                    <UI_SelectBox
                      selectBoxPopoverRef={ribbonUIRef.selectBoxPopoverRef}
                      border={true}
                      options={eyesSymmetry_layerOptions}
                      values={eyesSymmetry_currentOption}
                      onChange={(item) => eyesSymmetry_layerOptions_Changed(RibbonUIControlID.vectorLayer_posingLayer, item)}
                    />
                  </div>
                </div>
              </React.Fragment> }
            </div>
        </div>
      </React.Fragment> }
    </div>
  )
}

