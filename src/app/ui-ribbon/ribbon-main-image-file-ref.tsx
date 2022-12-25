import * as React from 'react'
import { SVGFiles } from '../resource-files'
import { MainToolTabID, SubToolID } from '../tool'
import { RibbonUIControlID } from '../ui'
import { UI_RibbonUI_Button, UI_RibbonUI_SubToolButton } from './ribbon-controls'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_Main_ImageFileReferlence_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_Main_ImageFileReferlence({ ribbonUIRef, isVisible }: UI_RibbonUI_Main_ImageFileReferlence_Param) {

  const [currentSubtoolID, set_currentSubtoolID] = React.useState(ribbonUIRef.docContext.subtoolID)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.imageFileReference],
    update: (docContext) => {

      set_currentSubtoolID(docContext.subtoolID)
    }
  }), [])

  React.useEffect(() => {

    ribbonUIRef.registerTabFunctionInfo(tabFunctionInfo)

    return function cleanup() {

      ribbonUIRef.unregisterTabFunctionInfo(tabFunctionInfo)
    }
  }, [])

  function subToolButton_Clicked(subtoolID: SubToolID) {

    if (ribbonUIRef.subtoolButton_Clicked) {

      set_currentSubtoolID(subtoolID)
      ribbonUIRef.subtoolButton_Clicked(subtoolID)
    }
  }

  return (
    <div className={`ribbon-ui-main-iamge-file-ref${!isVisible ? ' hidden': ''}`}>
      <UI_RibbonUI_Button ribbonUIRef={ribbonUIRef}
        icon={SVGFiles.icons.openImage} label={["ファイルの選択"]}
        id={RibbonUIControlID.imageFileRef_openImageFile}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.move} label={["移動", "1"]}
        subtoolID={SubToolID.image_GrabMove} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.rotate} label={["回転", "2"]}
        subtoolID={SubToolID.image_Rotate} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.scale} label={["拡縮", "3"]}
        subtoolID={SubToolID.image_Scale} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
    </div>
  )
}
