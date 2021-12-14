import * as React from 'react'
import { RibbonUIControlID } from '../window/constants'
import { float, int } from '../logics/conversion'
import { DocumentData, Layer, VectorLayer } from '../document_data'
import { UI_RibbonUITabs, UI_RibbonUITabsRef } from './ribbon_ui_tabs'
import { UI_SelectBoxOption } from './selectbox'
import { UI_SubToolWindow, UI_SubToolWindowRef } from './subtool_window'
import { UI_RibbonUI_Edit } from './ribbon_edit'
import { UI_RibbonUI_Document } from './ribbon_document'
import { UI_RibbonUI_Layer } from './ribbon_layer'
import { UI_RibbonUI_View } from './ribbon_view'
import { DocumentContext } from '../context/document_context'
import { UI_RibbonUI_Main_Drawing } from './ribbon_main_drawing'
import { UI_RibbonUI_Main_ImageFileReferlence } from './ribbon_main_image_file_ref'
import { MainToolTabID } from '../tool/main_tool'
import { SubToolID } from '../tool/sub_tool'
import { UI_ScrollView } from './scroll_view'
import { UI_RibbonUI_AutoFillLayer } from './ribbon_auto_fill_layer'

export interface UI_RibbonUIRef {

  update?(tabID: MainToolTabID): void

  updateHomeUI?(docContext: DocumentContext): void
  updateEditUI?(docContext: DocumentContext): void
  updateDocumentUI?(documentData: DocumentData): void
  updateLayerUI?(layer: Layer): void
  updateVecrotLayerUI?(vectorLayer: VectorLayer, layerOptions: UI_SelectBoxOption[]): void
  updateViewUI?(documentData: DocumentData): void

  button_Click?(id: RibbonUIControlID): void
  subtoolButton_Click?(subtoolID: SubToolID): void
  toggleButton_Click?(id: RibbonUIControlID, value: number): void
  textInput_Change?(id: RibbonUIControlID, value: string): void
  numberInput_Change?(id: RibbonUIControlID, value: float): void
  checkBox_Change?(id: RibbonUIControlID, checked: boolean, value: boolean | number | null): void
  selectBox_Change?(id: RibbonUIControlID, selected_Options: UI_SelectBoxOption[]): void
  documentFrame_Change?(left: float, top: float, width: float, height: float): void
  documentViewSettings_change?(defaultViewScale: float): void

  docContext?: DocumentContext
}

export interface UI_RibbonUIParam {

  uiRef: UI_RibbonUIRef
  menuButtonsRef: UI_RibbonUITabsRef
  subToolWindowRef: UI_SubToolWindowRef
}

export function UI_RibbonUI({ uiRef, menuButtonsRef, subToolWindowRef }: UI_RibbonUIParam ) {

  const [tabID, set_tabID] = React.useState(MainToolTabID.none)

  React.useEffect(() => {

    uiRef.update = (new_tabID: MainToolTabID) => {

      set_tabID(new_tabID)
    }

    return function cleanup() {

      uiRef.update = null
    }
  })

  return (
    <React.Fragment>
      <div className="tool-ribbon">
        <div className="tool-ribbon-rows">

          <div className="tabs-row">
            <UI_RibbonUITabs uiRef={menuButtonsRef} />
          </div>

          <div className="ribbon-ui-row">
          <UI_ScrollView wheelScrollY={32} direction='horizontal'>
            {
              tabID == MainToolTabID.none &&
                <div></div>
            }
            {
              tabID == MainToolTabID.drawing &&
                <UI_RibbonUI_Main_Drawing uiRef={uiRef} />
            }
            {
              tabID == MainToolTabID.autoFill &&
                <UI_RibbonUI_AutoFillLayer uiRef={uiRef} />
            }
            {
              tabID == MainToolTabID.imageFileReference &&
                <UI_RibbonUI_Main_ImageFileReferlence uiRef={uiRef} />
            }
            {
              (tabID == MainToolTabID.posing) &&
                <UI_SubToolWindow ribbonUIRef={uiRef} uiRef={subToolWindowRef} />
            }
            {
              tabID == MainToolTabID.edit &&
                <UI_RibbonUI_Edit uiRef={uiRef} />
            }
            {
              tabID == MainToolTabID.layer &&
                <UI_RibbonUI_Layer uiRef={uiRef} />
            }
            {
              tabID == MainToolTabID.document &&
                <UI_RibbonUI_Document uiRef={uiRef} />
            }
            {
              tabID == MainToolTabID.view &&
                <UI_RibbonUI_View uiRef={uiRef} />
            }
          </UI_ScrollView>
          </div>

        </div>
      </div>
    </React.Fragment>
  )
}
