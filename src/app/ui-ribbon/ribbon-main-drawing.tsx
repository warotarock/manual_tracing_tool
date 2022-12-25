import * as React from 'react'
import { SVGFiles } from '../resource-files'
import { MainToolTabID, SubToolID } from '../tool'
import { UI_BrushPropertyBox } from '../ui-popover/brush-property-box'
import { UI_RibbonUI_SubToolButton } from './ribbon-controls'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_Main_Drawing_NonScroll_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_Main_Drawing_NonScroll({ ribbonUIRef, isVisible }: UI_RibbonUI_Main_Drawing_NonScroll_Param) {

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.drawing, MainToolTabID.group, MainToolTabID.pointBrushFill],
    onActivated: () => {

      ribbonUIRef.brushPropertyBoxRef.resize()
    },
    update: () => {

      ribbonUIRef.brushPropertyBoxRef.updateBox()

      ribbonUIRef.brushPropertyBoxRef.updatePopover()
    }
  }), [])

  React.useEffect(() => {

    ribbonUIRef.brushPropertyBoxRef.numberInput_Changed = (id, value) => {

      if (ribbonUIRef.numberInput_Changed) {

        ribbonUIRef.numberInput_Changed(id, value, true)
      }
    }

    ribbonUIRef.registerTabFunctionInfo(tabFunctionInfo)

    return function cleanup() {

      ribbonUIRef.brushPropertyBoxRef.numberInput_Changed = null

      ribbonUIRef.unregisterTabFunctionInfo(tabFunctionInfo)
    }
  }, [])

  return (
    <div className={`${!isVisible ? ' hidden': ''}`}>
      <UI_BrushPropertyBox
        uiRef={ribbonUIRef.brushPropertyBoxRef}
      />
    </div>
  )
}

export interface UI_RibbonUI_Main_Drawing_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_Main_Drawing({ ribbonUIRef, isVisible }: UI_RibbonUI_Main_Drawing_Param) {

  const [currentSubtoolID, set_currentSubtoolID] = React.useState(ribbonUIRef.docContext.subtoolID)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.drawing],
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
        subtoolID={SubToolID.drawLine} currentSubtoolID={currentSubtoolID}
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
        subtoolID={SubToolID.extrudeLine} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.drawStrokeWidth} label={["太くする", "5"]}
        subtoolID={SubToolID.scratchLineWidth} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.dummy} label={["太さの設定", "6"]}
        subtoolID={SubToolID.overWriteLineWidth} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
    </div>
  )
}
