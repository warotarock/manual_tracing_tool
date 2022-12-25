import * as React from 'react'
import { int } from '../common-logics'
import { SVGFiles } from '../resource-files'
import { MainToolTabID, OperationOriginTypeID, OperationUnitID, SubToolID } from '../tool'
import { RibbonUIControlID } from '../ui/constants'
import { UI_RibbonUI_InputLabel, UI_RibbonUI_SubToolButton, UI_RibbonUI_ToggleButton, UI_RibbonUI_ToggleButtonGroup } from './ribbon-controls'
import { MainToolTabUpdateFunctionInfo, UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_Edit_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_Edit({ ribbonUIRef, isVisible }: UI_RibbonUI_Edit_Param) {

  const [currentSubtoolID, set_currentSubtoolID] = React.useState(ribbonUIRef.docContext.subtoolID)
  const [operationUnitID, set_operationUnitID] = React.useState(ribbonUIRef.docContext.operationUnitID)
  const [operationOriginTypeID, set_operationOriginTypeID] = React.useState(ribbonUIRef.docContext.operationOriginTypeID)

  const tabFunctionInfo = React.useMemo<MainToolTabUpdateFunctionInfo>(() => ({
    tabID: [MainToolTabID.edit],
    update: (docContext) => {

      set_currentSubtoolID(docContext.subtoolID)
      set_operationUnitID(docContext.operationUnitID)
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

      ribbonUIRef.subtoolButton_Clicked(subtoolID)
    }
  }

  function tobbleButton_Clickd(id: RibbonUIControlID, value: number, setFunction: (value: int) => void) {

    setFunction(value)

    if (ribbonUIRef.toggleButton_Clicked) {

      ribbonUIRef.toggleButton_Clicked(id, value)
    }
  }

  return (
    <div className={`ribbon-ui-edit${!isVisible ? ' hidden': ''}`}>
      <div className="group-container">
        <div className="label">編集ツール</div>
        <div className="group-contents grouped-params">
          <div className="param-column">
            <div className="param-column-inner">
              <UI_RibbonUI_InputLabel label={'編集単位'} />
              <UI_RibbonUI_ToggleButtonGroup
                id={RibbonUIControlID.edit_operationUnit}
                currentValue={operationUnitID}
                onClick={ (id, value) => tobbleButton_Clickd(id, value, set_operationUnitID) }
              >
                <UI_RibbonUI_ToggleButton label="線" value={OperationUnitID.stroke} />
                <UI_RibbonUI_ToggleButton label="線分" value={OperationUnitID.strokeSegment} />
                <UI_RibbonUI_ToggleButton label="点" value={OperationUnitID.strokePoint} />
              </UI_RibbonUI_ToggleButtonGroup>
              <UI_RibbonUI_InputLabel label={'原点'} />
              <UI_RibbonUI_ToggleButtonGroup
                id={RibbonUIControlID.edit_operationOrigin}
                currentValue={operationOriginTypeID}
                onClick={ (id, value) => tobbleButton_Clickd(id, value, set_operationOriginTypeID) }
              >
                <UI_RibbonUI_ToggleButton label="中心" value={OperationOriginTypeID.medianCenter} />
                <UI_RibbonUI_ToggleButton label="カーソル" value={OperationOriginTypeID.pivot} />
              </UI_RibbonUI_ToggleButtonGroup>
            </div>
          </div>
        </div>
      </div>
      <UI_RibbonUI_SubToolButton
        icon={operationUnitID == OperationUnitID.stroke ? SVGFiles.icons.selectLine
          : (operationUnitID == OperationUnitID.strokeSegment ? SVGFiles.icons.selectSegment
              : SVGFiles.icons.selectPoint)
        }
        label={["選択", "1"]}
        subtoolID={SubToolID.brushSelect} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.editTransform} label={["カーソル", "2"]}
        subtoolID={SubToolID.locateOperatorCursor} currentSubtoolID={currentSubtoolID}
        onClick={subToolButton_Clicked}
      />
      <UI_RibbonUI_SubToolButton
        icon={SVGFiles.icons.editTransform} label={["移動/変形", "3"]}
        subtoolID={SubToolID.editModeMain} currentSubtoolID={currentSubtoolID}
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

