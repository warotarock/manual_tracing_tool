import * as React from 'react'
import { SVGFiles } from '../resource-files'
import { MainToolTabID, SubToolID } from '../tool'
import { UI_RibbonUI_SubToolButton } from './ribbon-controls'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_PointBrushFill_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_PointBrushFill({ ribbonUIRef, isVisible }: UI_RibbonUI_PointBrushFill_Param) {

  const [currentSubtoolID, set_currentSubtoolID] = React.useState(ribbonUIRef.docContext.subtoolID)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.pointBrushFill],
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
    <div className={`ribbon-ui-main-drawing${!isVisible ? ' hidden': ''}`}>
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.draw} label={["線を描く", "1"]}
        subtoolID={SubToolID.drawPointBrush} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.eracer} label={["消しゴム", "2/  E"]}
        subtoolID={SubToolID.deletePointBrush} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.scratchLine} label={["線の修正", "3"]}
        subtoolID={SubToolID.scratchLine} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.extrudeLine} label={["線の延長", "4"]}
        subtoolID={SubToolID.pointBrush_extrudeLine} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
    </div>
  )
}
