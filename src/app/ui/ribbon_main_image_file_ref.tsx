import * as React from 'react'
import { UI_RibbonUIRef } from './ribbon_ui'
import { UI_RibbonUI_SubToolButton,  UI_RibbonUI_Separator, UI_RibbonUI_Button } from './ribbon_controls'
import { DocumentContext } from '../context/document_context'
import { SVGFiles } from '../resource_files/svg'
import { SubToolID } from '../tool/sub_tool'
import { RibbonUIControlID } from '../window/constants'

export function UI_RibbonUI_Main_ImageFileReferlence({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subtoolID] = React.useState(uiRef.docContext.subtoolID)

  React.useEffect(() => {

    uiRef.updateHomeUI = (docContext: DocumentContext) => {

      set_subtoolID(docContext.subtoolID)
    }

    return function cleanup() {

      uiRef.updateHomeUI = null
    }
  })

  return (
    <div className="ribbon-ui-home">
      <UI_RibbonUI_Button uiRef={uiRef}
        icon={SVGFiles.icons.openImage} label={["ファイルの選択", "O"]}
        id={RibbonUIControlID.imageFileRef_openImageFile}
      />
      <UI_RibbonUI_Separator />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.move} label={["移動", "G"]}
        subtoolID={SubToolID.image_GrabMove}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.rotate} label={["回転", "B"]}
        subtoolID={SubToolID.image_Rotate}
      />
      <UI_RibbonUI_SubToolButton uiRef={uiRef}
        icon={SVGFiles.icons.scale} label={["拡縮", "H"]}
        subtoolID={SubToolID.image_Scale}
      />
      <UI_RibbonUI_Separator />
    </div>
  )
}
