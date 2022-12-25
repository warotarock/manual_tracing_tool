import * as React from 'react'
import { float } from '../common-logics'
import { MainToolTabID } from '../tool'
import { RibbonUIControlID } from '../ui/constants'
import { UI_CheckBox, UI_NumberInput } from '../ui-common-controls'
import { UI_RibbonUI_InputLabel, UI_RibbonUI_Separator } from './ribbon-controls'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_View_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_View({ ribbonUIRef, isVisible }: UI_RibbonUI_View_Param) {

  const [defaultViewScale, set_defaultViewScale] = React.useState(ribbonUIRef.docContext.documentData.defaultViewScale)
  const [hideOuterArea, set_hideOuterArea] = React.useState(ribbonUIRef.docContext.documentData.documentFrame_HideOuterArea)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.view],
    update: (docContext) => {

      set_defaultViewScale(docContext.documentData.defaultViewScale)
      set_hideOuterArea(docContext.documentData.documentFrame_HideOuterArea)
    }
  }), [])

  React.useEffect(() => {

    ribbonUIRef.registerTabFunctionInfo(tabFunctionInfo)

    return function cleanup() {

      ribbonUIRef.unregisterTabFunctionInfo(tabFunctionInfo)
    }
  }, [])

  function documentViewSettings_Changed(new_defaultViewScale: float) {

    const values = [new_defaultViewScale]
    if (values.find(value => !Number.isFinite(value))) {
      return
    }

    if (ribbonUIRef.documentViewSettings_Changed) {

      ribbonUIRef.documentViewSettings_Changed(new_defaultViewScale)
    }
  }

  function checkBox_Changed(id: RibbonUIControlID, checked: boolean, value: any, setFunction: (value: boolean) => void) {

    setFunction(value)

    if (ribbonUIRef.checkBox_Changed) {

      ribbonUIRef.checkBox_Changed(id, checked, value)
    }
  }

  return (
    <div className={`ribbon-ui-view${!isVisible ? ' hidden': ''}`}>
      <UI_RibbonUI_Separator />
      <div className="group-container">
        <div className="label">ビュー</div>
        <div className="group-contents">
          <div className="vertical-layout view-params">
            <div className="param-row">
              <UI_RibbonUI_InputLabel label={'ベース拡大率'} />
              <UI_NumberInput value={defaultViewScale} digit={2} step={0.1} min={0.01} max={10.0}
                onChange={(value) => {
                  set_defaultViewScale(value)
                  documentViewSettings_Changed(value)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
      <div className="group-container">
        <div className="label">キャンバス</div>
        <div className="group-contents">
          <div className="vertical-layout view-params">
            <div className="param-row" onClick={() => checkBox_Changed(RibbonUIControlID.document_hideOuterArea, !hideOuterArea, !hideOuterArea, set_hideOuterArea)}>
              <UI_CheckBox value={hideOuterArea}/>
              <UI_RibbonUI_InputLabel label={'外側を隠す'} />
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
    </div>
  )
}

