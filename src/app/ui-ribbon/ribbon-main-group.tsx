import * as React from 'react'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'
import { UI_RibbonUI_SubToolButton } from './ribbon-controls'
import { SVGFiles } from '../resource-files'
import { MainToolTabID, SubToolID } from '../tool'

export interface UI_RibbonUI_Main_GroupLayer_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_Main_GroupLayer({ ribbonUIRef, isVisible }: UI_RibbonUI_Main_GroupLayer_Param) {

  const [currentSubtoolID, set_currentSubtoolID] = React.useState(ribbonUIRef.docContext.subtoolID)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.group],
    update: (docContext) => {

      set_currentSubtoolID(docContext.subtoolID)
    }
  }), [])

  React.useEffect(() => {

    ribbonUIRef.registerTabFunctionInfo(tabFunctionInfo)

    return function cleanup() {
    }
  }, [])

  function subToolButton_Clicked(subtoolID: SubToolID) {

    if (ribbonUIRef.subtoolButton_Clicked) {

      ribbonUIRef.subtoolButton_Clicked(subtoolID)
    }
  }

  return (
    <div className={`ribbon-ui-edit${!isVisible ? ' hidden': ''}`}>
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.scratchLine} label={["線の修正", "1"]}
        subtoolID={SubToolID.scratchLine} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.eracer} label={["消しゴム", "2/  E"]}
        subtoolID={SubToolID.deletePointBrush} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.dummy} label={["太さの設定", "3"]}
        subtoolID={SubToolID.overWriteLineWidth} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.divideLineSegment} label={["再分割", "4"]}
        subtoolID={SubToolID.resampleSegment} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
    </div>
  )
}

