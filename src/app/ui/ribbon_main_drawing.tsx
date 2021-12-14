import * as React from 'react'
import { RibbonUIControlID } from '../window/constants'
import { float, int } from '../logics/conversion'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_SubToolButton,  UI_RibbonUI_Separator, UI_RibbonUI_LabelledNumberInput } from './ribbon_controls'
import { DocumentContext } from '../context/document_context'
import { SVGFiles } from '../resource_files/svg'
import { SubToolID } from '../tool/sub_tool'

export function UI_RibbonUI_Main_Drawing({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subtoolID] = React.useState(uiRef.docContext.subtoolID)

  const [brushWidth_Max, set_brushWidth_Max] = React.useState(uiRef.docContext.drawLineBaseWidth)
  const [brushWidth_Min, set_brushWidth_Min] = React.useState(uiRef.docContext.drawLineMinWidth)
  const [eraserWidth_Max, set_eraserWidth_Max] = React.useState(uiRef.docContext.eraserLineBaseWidth)

  React.useEffect(() => {

    uiRef.updateHomeUI = (docContext: DocumentContext) => {

      set_subtoolID(docContext.subtoolID)
      set_brushWidth_Max(docContext.drawLineBaseWidth)
      set_brushWidth_Min(docContext.drawLineMinWidth)
      set_eraserWidth_Max(docContext.eraserLineBaseWidth)
    }

    return function cleanup() {

      uiRef.updateHomeUI = null
    }
  })

  function numberInput_Change(id: RibbonUIControlID, value: float, setFunction: (value: float) => void) {

    setFunction(value)

    if (uiRef.numberInput_Change) {

      uiRef.numberInput_Change(id, value)
    }
  }

  return (
    <div className="ribbon-ui-home">
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.extrudeLine} label={["線を描く", "G"]}
        subtoolID={SubToolID.drawLine}
      />
      <div className="vertical-layout draw-line-params">
        <UI_RibbonUI_LabelledNumberInput label="基本幅" value={brushWidth_Max}
          onChange={(value) => {
            numberInput_Change(RibbonUIControlID.brushWidth_Max, value, set_brushWidth_Max)
          }}
        />
        <UI_RibbonUI_LabelledNumberInput label="最小幅" value={brushWidth_Min}
          onChange={(value) => {
            numberInput_Change(RibbonUIControlID.brushWidth_Min, value, set_brushWidth_Min)
          }}
        />
      </div>
      <UI_RibbonUI_Separator />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.eracer} label={["消しゴム", "E"]}
        subtoolID={SubToolID.deletePointBrush}
      />
      <div className="vertical-layout draw-line-params">
        <UI_RibbonUI_LabelledNumberInput label="サイズ" value={eraserWidth_Max} step={1.0}
          onChange={(value) => {
            numberInput_Change(RibbonUIControlID.eraserWidth_Max, value, set_eraserWidth_Max)
          }}
        />
      </div>
      <UI_RibbonUI_Separator />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.scratchLine} label={["線の修正", "B"]}
        subtoolID={SubToolID.scratchLine}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.extrudeLine} label={["線の延長", "H"]}
        subtoolID={SubToolID.extrudeLine}
      />
      {/* <UI_RibbonUI_Button uiRef={uiRef}
        icon={SVGFiles.icons.dummy} label={["太さの", "上書き"]}
        subtoolID={DrawLineToolSubToolID.editLinePointWidth_BrushSelect}
      /> */}
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.drawStrokeWidth} label={["太くする", "N"]}
        subtoolID={SubToolID.scratchLineWidth}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.dummy} label={["太さの設定", "J"]}
        subtoolID={SubToolID.overWriteLineWidth}
      />
      <UI_RibbonUI_Separator />
    </div>
  )
}
