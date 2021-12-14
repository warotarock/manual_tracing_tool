import * as React from 'react'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_Separator, UI_RibbonUI_SubToolButton } from './ribbon_controls'
import { DocumentContext } from '../context/document_context'
import { SVGFiles } from '../resource_files/svg'
import { SubToolID } from '../tool/sub_tool'

export function UI_RibbonUI_Edit({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subToolIndex] = React.useState(uiRef.docContext.subtoolID)

  React.useEffect(() => {

    uiRef.updateEditUI = (docContext: DocumentContext) => {

      set_subToolIndex(docContext.subtoolID)
    }

    return function cleanup() {

      uiRef.updateEditUI = null
    }
  })

  return (
    <div className="ribbon-ui-edit">
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.selectLine} label={["線の選択"]}
        subtoolID={SubToolID.lineBrushSelect}
      />
      {/* <UI_RibbonUI_Button uiRef={uiRef}
        icon={SVGFiles.icons.dummy} label={["線分の選択"]}
        subToolIndex={SubToolID.lineSegmentBrushSelect}
      /> */}
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.selectPoint} label={["点の選択"]}
        subtoolID={SubToolID.linePointBrushSelect}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.editTransform} label={["移動/変形"]}
        subtoolID={SubToolID.editModeMain}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.divideLineSegment} label={["再分割"]}
        subtoolID={SubToolID.resampleSegment}
      />
      <UI_RibbonUI_Separator />
    </div>
  )
}

