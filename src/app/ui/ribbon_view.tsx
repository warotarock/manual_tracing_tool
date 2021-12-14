import * as React from 'react'
import { float, int } from '../logics/conversion'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_NumberInput, UI_RibbonUI_InputLabel, UI_RibbonUI_Separator } from './ribbon_controls'
import { DocumentData } from '../document_data'
import { UI_CheckBox } from './checkbox'
import { RibbonUIControlID } from '../window/constants'

export function UI_RibbonUI_View({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [defaultViewScale, set_defaultViewScale] = React.useState(uiRef.docContext.document.defaultViewScale)
  const [hideOuterArea, set_hideOuterArea] = React.useState(uiRef.docContext.document.documentFrame_HideOuterArea)

  React.useEffect(() => {

    uiRef.updateViewUI = (documentData: DocumentData) => {

      set_defaultViewScale(documentData.defaultViewScale)
    }

    return function cleanup() {

      uiRef.updateViewUI = null
    }
  })

  function documentViewSettings_change(new_defaultViewScale: float) {

    const values = [new_defaultViewScale]
    if (values.find(value => !Number.isFinite(value))) {
      return
    }

    if (uiRef.documentViewSettings_change) {

      uiRef.documentViewSettings_change(new_defaultViewScale)
    }
  }

  function checkBox_Change(id: RibbonUIControlID, checked: boolean, value: any, setFunction: (value: boolean) => void) {

    setFunction(value)

    if (uiRef.checkBox_Change) {

      uiRef.checkBox_Change(id, checked, value)
    }
  }

  return (
    <div className="ribbon-ui-layer">
      <div className="group-container">
        <div className="label">ビュー</div>
        <div className="group-contents">
          <div className="vertical-layout view-params">
            <div className="param-row">
              <UI_RibbonUI_InputLabel label={'ベース拡大率'} />
              <UI_RibbonUI_NumberInput value={defaultViewScale} digit={2} step={0.1} min={0.01} max={10.0}
                onChange={(value) => {
                  set_defaultViewScale(value)
                  documentViewSettings_change(value)
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
            <div className="param-row" onClick={() => checkBox_Change(RibbonUIControlID.document_hideOuterArea, !hideOuterArea, !hideOuterArea, set_hideOuterArea)}>
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

