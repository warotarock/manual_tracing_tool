import * as React from 'react'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_InputLabel, UI_RibbonUI_Separator, UI_RibbonUI_TextInput, UI_RibbonUI_RGBAColor } from './ribbon_controls'
import { Layer, VectorLayer } from '../document_data'
import { UI_CheckBox } from './checkbox'
import { RibbonUIControlID } from '../window/constants'
import { UI_RibbonUI_Layer_VectorLayer } from './ribbon_layer_vector_layer'
import { ColorLogic } from '../logics/color'

interface ComponentState {

  currentLayer: Layer
  isVectorLayer: boolean
  layerName: string
  layerColor: string
  isRenderTarget: boolean
  isMaskedByBelowLayer: boolean
  fillColor: string
}

export function UI_RibbonUI_Layer({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [state, set_state] = React.useState<ComponentState>(() => {

    return createState(uiRef.docContext.currentLayer)
  })

  const [layerTypeNames, ] = React.useState([
    '',
    '',
    'ベクター レイヤー',
    'グループ レイヤー',
    '画像ファイル レイヤー',
    '３Dポーズ レイヤー',
    'ベクター参照 レイヤー',
    '自動塗りつぶし レイヤー'
  ])

  React.useEffect(() => {

    uiRef.updateLayerUI = (new_layer: Layer) => {

      set_state(createState(new_layer))
    }

    return function cleanup() {

      uiRef.updateLayerUI = null
    }
  })

  function createState(layer: Layer): ComponentState {

    const isVectorLayer = VectorLayer.isVectorLayer(layer)
    const vectorLayer = (isVectorLayer ? layer : null) as VectorLayer

    return {
      currentLayer: layer,
      isVectorLayer: isVectorLayer,
      layerName: layer.name,
      layerColor: ColorLogic.rgbaToRgbaString(layer.layerColor),
      isRenderTarget: layer.isRenderTarget,
      isMaskedByBelowLayer: layer.isMaskedByBelowLayer,
      fillColor: isVectorLayer ? ColorLogic.rgbaToRgbaString(vectorLayer.fillColor) : ''
    }
  }

  function updateState(old_state: ComponentState, value: any, propName: keyof ComponentState): ComponentState {

    const new_state = createState(old_state.currentLayer)
    new_state[String(propName)] = value

    set_state(new_state)

    return new_state
  }

  function textInput_Change(id: RibbonUIControlID, value: string, propName: keyof ComponentState) {

    updateState(state, value, propName)

    if (uiRef.textInput_Change) {

      uiRef.textInput_Change(id, value)
    }
  }

  function checkBox_Change(id: RibbonUIControlID, checked: boolean, value: any, propName: keyof ComponentState) {

    updateState(state, value, propName)

    if (uiRef.checkBox_Change) {

      uiRef.checkBox_Change(id, checked, value)
    }
  }

  return (
    <div className="ribbon-ui-layer">
      <div className="group-container">
        <div className="label">{layerTypeNames[state.currentLayer.type]}</div>
        <div className="group-contents">
          <div className="vertical-layout layer-basic-params">
            <div className="param-row">
              <UI_RibbonUI_TextInput value={state.layerName} maxLength={40}
                onChange={(value) => {
                  textInput_Change(RibbonUIControlID.layer_name, value, 'layerName')
                }}
              />
            </div>
            <div className="param-row">
              <div className="layer-colors">
                <UI_RibbonUI_RGBAColor value={state.currentLayer.layerColor} />
                { state.isVectorLayer &&
                  <UI_RibbonUI_RGBAColor value={(state.currentLayer as VectorLayer).fillColor} />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
      <div className="group-container">
        <div className="label">処理対象</div>
        <div className="group-contents layer-additional-params">
          <div className="param-column">
            <div className="param-column-inner"
                onClick={() => checkBox_Change(RibbonUIControlID.layer_isMaskedByBelowLayer, !state.isMaskedByBelowLayer, !state.isMaskedByBelowLayer, 'isMaskedByBelowLayer')}
            >
              <UI_CheckBox value={state.isMaskedByBelowLayer} />
              <UI_RibbonUI_InputLabel label={'下のレイヤーでマスク'} />
            </div>
            <div className="param-column-inner"
                onClick={() => checkBox_Change(RibbonUIControlID.layer_isRenderTarget, !state.isRenderTarget, !state.isRenderTarget, 'isRenderTarget')}
            >
              <UI_CheckBox value={state.isRenderTarget} />
              <UI_RibbonUI_InputLabel label={'エクスポート'} />
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
      { state.isVectorLayer && <UI_RibbonUI_Layer_VectorLayer uiRef={uiRef} /> }
    </div>
  )
}

