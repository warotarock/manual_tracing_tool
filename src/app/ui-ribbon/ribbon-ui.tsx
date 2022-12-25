import * as React from 'react'
import { DocumentContext } from '../context'
import { Layer, LayerTypeID } from '../document-data'
import { float } from '../common-logics'
import { MainToolTabID, SubToolID } from '../tool'
import { RibbonUIControlID } from '../ui/constants'
import { UI_ScrollView } from '../ui-common-controls'
import { UI_BrushPropertyBoxRef, UI_MainMenuButton, UI_MainMenuButtonRef, UI_SelectBoxOption, UI_SelectBoxPopoverRef } from '../ui-popover'
import { UI_RibbonUI_AutoFillLayer } from './ribbon-auto-fill-layer'
import { UI_RibbonUI_Document } from './ribbon-document'
import { UI_RibbonUI_Edit } from './ribbon-edit'
import { UI_RibbonUI_Home } from './ribbon-home'
import { UI_RibbonUI_Layer } from './ribbon-layer'
import { UI_RibbonUI_Main_Drawing, UI_RibbonUI_Main_Drawing_NonScroll } from './ribbon-main-drawing'
import { UI_RibbonUI_Main_GroupLayer } from './ribbon-main-group'
import { UI_RibbonUI_Main_ImageFileReferlence } from './ribbon-main-image-file-ref'
import { UI_RibbonUITabs, UI_RibbonUITabsRef } from './ribbon-ui-tabs'
import { UI_RibbonUI_View } from './ribbon-view'
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool-window'
import { UI_RibbonUI_PointBrushFill } from './ribbon-point-brush-fill'

export interface MainToolTabUpdateFunctionInfo {

  tabID: MainToolTabID[]
  filter?: (layer: Layer) => boolean
  update: (docContext: DocumentContext) => void
  onActivated?: (docContext: DocumentContext) => void
}

export interface UI_RibbonUIRef {

  ribbonUITabsRef: UI_RibbonUITabsRef
  mainMenuButtonRef: UI_MainMenuButtonRef
  brushPropertyBoxRef: UI_BrushPropertyBoxRef
  selectBoxPopoverRef: UI_SelectBoxPopoverRef

  setMainToolTab?(tabID: MainToolTabID): void

  updateMainToolTabFunctionInfos: MainToolTabUpdateFunctionInfo[]
  registerTabFunctionInfo?(info: MainToolTabUpdateFunctionInfo): void
  unregisterTabFunctionInfo?(info: MainToolTabUpdateFunctionInfo): void

  button_Clicked?(id: RibbonUIControlID): void
  subtoolButton_Clicked?(subtoolID: SubToolID): void
  toggleButton_Clicked?(id: RibbonUIControlID, value: number): void
  textInput_Changed?(id: RibbonUIControlID, value: string): void
  numberInput_Changed?(id: RibbonUIControlID, value: float, isModal?: boolean): void
  checkBox_Changed?(id: RibbonUIControlID, checked: boolean, value: boolean | number | null): void
  selectBox_Changed?(id: RibbonUIControlID, selected_Option: UI_SelectBoxOption): void
  documentFrame_Changed?(left: float, top: float, width: float, height: float): void
  documentViewSettings_Changed?(defaultViewScale: float): void

  docContext: DocumentContext
  posingLayerOptions: UI_SelectBoxOption[]
  posingLayerOptions_Selected: UI_SelectBoxOption[]
}

export interface UI_RibbonUIParam {

  uiRef: UI_RibbonUIRef
  subToolWindowRef: UI_SubToolWindowRef
}

export function UI_RibbonUI({ uiRef, subToolWindowRef }: UI_RibbonUIParam ) {

  const [tabID, set_tabID] = React.useState(MainToolTabID.none)

  React.useEffect(() => {

    uiRef.setMainToolTab = (new_tabID: MainToolTabID) => {

      set_tabID(new_tabID)
    }

    return function cleanup() {

      uiRef.setMainToolTab = null
    }
  }, [])

  return (
    <React.Fragment>
      <div className="tool-ribbon">
        { uiRef.docContext != null && <div className="tool-ribbon-rows">

          <div className="tabs-row">
            <UI_MainMenuButton uiRef={uiRef.mainMenuButtonRef}/>
            <div className="centering-spacer"></div>
            <UI_ScrollView wheelScrollY={32} direction='horizontal' alignment='center'>
              <UI_RibbonUITabs uiRef={uiRef.ribbonUITabsRef} />
            </UI_ScrollView>
            <div className="centering-spacer"></div>
            <div className="right-menu-button-spacer"></div>
          </div>

          <div className="ribbon-ui-row">
            <div className="centering-spacer"></div>
            <div className="nonscroll-part">
              <UI_RibbonUI_Main_Drawing_NonScroll ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.group || tabID == MainToolTabID.drawing || tabID == MainToolTabID.pointBrushFill} />
            </div>
            <UI_ScrollView wheelScrollY={32} direction='horizontal' alignment='center'>
              <UI_RibbonUI_Home ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.none} />
              <UI_RibbonUI_Main_Drawing ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.drawing} />
              <UI_RibbonUI_Main_GroupLayer ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.group} />
              <UI_RibbonUI_AutoFillLayer ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.autoFill} />
              <UI_RibbonUI_PointBrushFill ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.pointBrushFill} />
              <UI_RibbonUI_Main_ImageFileReferlence ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.imageFileReference} />
              <UI_SubToolWindow ribbonUIRef={uiRef} subToolWindowUIRef={subToolWindowRef} isVisible={tabID == MainToolTabID.posing} />
              <UI_RibbonUI_Edit ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.edit} />
              <UI_RibbonUI_Layer ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.layer} />
              <UI_RibbonUI_Document ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.document} />
              <UI_RibbonUI_View ribbonUIRef={uiRef} isVisible={tabID == MainToolTabID.view} />
            </UI_ScrollView>
            <div className="centering-spacer"></div>
          </div>

        </div> }
      </div>

    </React.Fragment>
  )
}
