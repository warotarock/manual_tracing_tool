import * as React from 'react'
import { float, int } from '../logics/conversion'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_NumberInput, UI_RibbonUI_InputLabel, UI_RibbonUI_Separator } from './ribbon_controls'
import { DocumentData } from '../document_data'
import { RibbonUIControlID } from '../window/constants'

export function UI_RibbonUI_Document({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const layout = DocumentData.getDocumentLayout(uiRef.docContext.document, 1.0)
  const [documentFrame_left, set_documentFrame_left] = React.useState(layout.left)
  const [documentFrame_top, set_documentFrame_top] = React.useState(layout.top)
  const [documentFrame_width, set_documentFrame_width] = React.useState(layout.width)
  const [documentFrame_height, set_documentFrame_height] = React.useState(layout.height)

  const [lineWidthBiasRate, set_lineWidthBiasRate] = React.useState(uiRef.docContext.document.lineWidthBiasRate)

  React.useEffect(() => {

    uiRef.updateDocumentUI = (documentData: DocumentData) => {

      const layout = DocumentData.getDocumentLayout(documentData, 1.0)
      set_documentFrame_left(layout.left)
      set_documentFrame_top(layout.top)
      set_documentFrame_width(layout.width)
      set_documentFrame_height(layout.height)

      set_lineWidthBiasRate(documentData.lineWidthBiasRate)
    }

    return function cleanup() {

      uiRef.updateDocumentUI = null
    }
  })

  function documentFrame_change(left: float, top: float, width: float, height: float) {

    const values = [left, top, width, height]
    if (values.find(value => !Number.isSafeInteger(value))) {
      return
    }

    if (uiRef.documentFrame_Change) {

      uiRef.documentFrame_Change(left, top, width, height)
    }
  }

  function numberInput_Change(id: RibbonUIControlID, value: float, setFunction: (value: float) => void) {

    setFunction(value)

    if (uiRef.numberInput_Change) {

      uiRef.numberInput_Change(id, value)
    }
  }

  const positionStepValue = 1
  const minPositionValue = -100000
  const maxPositionValue = 100000

  return (
    <div className="ribbon-ui-document">
      <div className="group-container">
        <div className="label">キャンバス範囲</div>
        <div className="group-contents">
          <div className="vertical-layout document-size-params">
            <div className="param-row">
              <UI_RibbonUI_InputLabel label={'横位置'} />
              <UI_RibbonUI_NumberInput value={documentFrame_left} digit={0} step={positionStepValue} min={minPositionValue} max={maxPositionValue}
                onChange={(value) => {
                  set_documentFrame_left(value)
                  documentFrame_change(value, documentFrame_top, documentFrame_width, documentFrame_height)
                }}
              />
              <UI_RibbonUI_InputLabel label={'縦位置'} />
              <UI_RibbonUI_NumberInput value={documentFrame_top} digit={0} step={positionStepValue} min={minPositionValue} max={maxPositionValue}
                onChange={(value) => {
                  set_documentFrame_top(value)
                  documentFrame_change(documentFrame_top, value, documentFrame_width, documentFrame_height)
                }}
              />
            </div>
            <div className="param-row">
              <UI_RibbonUI_InputLabel label={'サイズ'} />
              <UI_RibbonUI_NumberInput value={documentFrame_width} digit={0} step={positionStepValue} min={1} max={maxPositionValue}
                onChange={(value) => {
                  set_documentFrame_width(value)
                  documentFrame_change(documentFrame_left, documentFrame_top, value, documentFrame_height)
                }}
              />
              <UI_RibbonUI_InputLabel label={'×'} />
              <UI_RibbonUI_NumberInput value={documentFrame_height} digit={0} step={positionStepValue} min={1} max={maxPositionValue}
                onChange={(value) => {
                  set_documentFrame_height(value)
                  documentFrame_change(documentFrame_left, documentFrame_top, documentFrame_width, value)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
      <div className="group-container">
        <div className="label">描画</div>
        <div className="group-contents">
          <div className="vertical-layout document-size-params">
            <div className="param-row">
              <UI_RibbonUI_InputLabel label={'ベース線幅'} />
              <UI_RibbonUI_NumberInput value={lineWidthBiasRate} digit={2} step={0.1} min={0.01} max={10.0}
                onChange={(value) => {
                  set_lineWidthBiasRate(value)
                  numberInput_Change(RibbonUIControlID.document_lineWidthBiasRate, value, set_lineWidthBiasRate)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_Separator />
    </div>
  )
}

