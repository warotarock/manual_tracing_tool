import * as React from 'react'
import { Layer, LayerTypeID, VectorLayer } from '../document-data'
import { ColorLogic } from '../common-logics'
import { MainToolTabID } from '../tool'
import { RibbonUIControlID } from '../ui/constants'
import { UI_CheckBox } from '../ui-common-controls'
import { UI_RibbonUI_InputLabel, UI_RibbonUI_RGBAColor, UI_RibbonUI_Separator, UI_RibbonUI_TextInput } from './ribbon-controls'
import { UI_RibbonUI_Layer_VectorLayer } from './ribbon-layer-vector-layer'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_Layer_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

interface ComponentState {

  currentLayer: Layer
  isVectorLayer: boolean
  layerName: string
  layerColor: string
  isRenderTarget: boolean
  isMaskedByBelowLayer: boolean
  fillColor: string
}

export function UI_RibbonUI_Layer({ ribbonUIRef, isVisible }: UI_RibbonUI_Layer_Param) {

  const [state, set_state] = React.useState<ComponentState>(() => {

    return createState(ribbonUIRef.docContext.currentLayer)
  })

  const layerTypeNames = React.useMemo(() => new Map<LayerTypeID, string>([
    [LayerTypeID.none, ''],
    [LayerTypeID.rootLayer, ''],
    [LayerTypeID.vectorLayer, '線画 レイヤー'],
    [LayerTypeID.groupLayer, 'グループ レイヤー'],
    [LayerTypeID.imageFileReferenceLayer, '画像ファイル レイヤー'],
    [LayerTypeID.posingLayer, '3Dポーズ レイヤー'],
    [LayerTypeID.vectorLayerReferenceLayer, '線画参照 レイヤー'],
    [LayerTypeID.autoFillLayer, '自動塗り レイヤー'],
    [LayerTypeID.surroundingFillLayer, '囲み塗り レイヤー']
  ]), [])

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.layer],
    update: (docContext) => {

      set_state(createState(docContext.currentLayer))
    }
  }), [])

  React.useEffect(() => {

    ribbonUIRef.registerTabFunctionInfo(tabFunctionInfo)

    return function cleanup() {

      ribbonUIRef.unregisterTabFunctionInfo(tabFunctionInfo)
    }
  }, [])

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

  function textInput_Changed(id: RibbonUIControlID, value: string, propName: keyof ComponentState) {

    updateState(state, value, propName)

    if (ribbonUIRef.textInput_Changed) {

      ribbonUIRef.textInput_Changed(id, value)
    }
  }

  function checkBox_Changed(id: RibbonUIControlID, checked: boolean, value: any, propName: keyof ComponentState) {

    updateState(state, value, propName)

    if (ribbonUIRef.checkBox_Changed) {

      ribbonUIRef.checkBox_Changed(id, checked, value)
    }
  }

  return (
    <div className={`ribbon-ui-layer${!isVisible ? ' hidden': ''}`}>
      <UI_RibbonUI_Separator />
      <div className="group-container">
        <div className="label">{layerTypeNames.has(state.currentLayer.type) ? layerTypeNames.get(state.currentLayer.type) : ''}</div>
        <div className="group-contents">
          <div className="vertical-layout layer-basic-params">
            <div className="param-row">
              <UI_RibbonUI_TextInput value={state.layerName} maxLength={40}
                onChange={(value) => {
                  textInput_Changed(RibbonUIControlID.layer_name, value, 'layerName')
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
                onClick={() => checkBox_Changed(RibbonUIControlID.layer_isMaskedByBelowLayer, !state.isMaskedByBelowLayer, !state.isMaskedByBelowLayer, 'isMaskedByBelowLayer')}
            >
              <UI_CheckBox value={state.isMaskedByBelowLayer} />
              <UI_RibbonUI_InputLabel label={'下のレイヤーでマスク'} />
            </div>
            <div className="param-column-inner"
                onClick={() => checkBox_Changed(RibbonUIControlID.layer_isRenderTarget, !state.isRenderTarget, !state.isRenderTarget, 'isRenderTarget')}
            >
              <UI_CheckBox value={state.isRenderTarget} />
              <UI_RibbonUI_InputLabel label={'エクスポート'} />
            </div>
          </div>
        </div>
      </div>
      { state.isVectorLayer && <React.Fragment>
        <UI_RibbonUI_Separator />
        <UI_RibbonUI_Layer_VectorLayer ribbonUIRef={ribbonUIRef} />
      </React.Fragment> }
      <UI_RibbonUI_Separator />
    </div>
  )
}

