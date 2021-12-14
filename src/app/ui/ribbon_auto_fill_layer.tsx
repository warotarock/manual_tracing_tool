import * as React from 'react'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_Separator, UI_RibbonUI_SubToolButton } from './ribbon_controls'
import { DocumentContext } from '../context/document_context'
import { SVGFiles } from '../resource_files/svg'
import { SubToolID } from '../tool/sub_tool'

export function UI_RibbonUI_AutoFillLayer({ uiRef }: { uiRef: UI_RibbonUIRef }) {

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
        icon={SVGFiles.icons.selectLine} label={["領域追加", "G"]}
        subtoolID={SubToolID.autoFill}
      />
      <UI_RibbonUI_Separator />
    </div>
  )
}

