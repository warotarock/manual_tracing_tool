import { DocumentContext } from '../context'
import { MainToolTabID } from '../tool'
import { UI_BrushPropertyBoxRef, UI_MainMenuButtonRef, UI_SelectBoxOption, UI_SelectBoxPopoverRef } from '../ui-popover'
import { UI_RibbonUIRef } from '../ui-ribbon'

export class RibbonUIWindow {

  uiRibbonUIRef: UI_RibbonUIRef = {
    docContext: null,
    ribbonUITabsRef: {},
    mainMenuButtonRef: null,
    brushPropertyBoxRef: null,
    selectBoxPopoverRef: null,
    updateMainToolTabFunctionInfos: [],
    posingLayerOptions: [],
    posingLayerOptions_Selected: []
  }

  link(mainMenuButtonRef: UI_MainMenuButtonRef, brushPropertyBoxRef: UI_BrushPropertyBoxRef, selectBoxPopoverRef: UI_SelectBoxPopoverRef) {

    this.uiRibbonUIRef.mainMenuButtonRef = mainMenuButtonRef
    this.uiRibbonUIRef.brushPropertyBoxRef = brushPropertyBoxRef
    this.uiRibbonUIRef.selectBoxPopoverRef = selectBoxPopoverRef

    this.uiRibbonUIRef.registerTabFunctionInfo = (info) => {

      this.uiRibbonUIRef.updateMainToolTabFunctionInfos.push(info)
    }

    this.uiRibbonUIRef.unregisterTabFunctionInfo = (info) => {

      this.uiRibbonUIRef.updateMainToolTabFunctionInfos = this.uiRibbonUIRef.updateMainToolTabFunctionInfos.filter(i => i !== info)
    }
  }

  private setContext(docContext: DocumentContext) {

    this.uiRibbonUIRef.docContext = docContext
    this.uiRibbonUIRef.mainMenuButtonRef.docContext = docContext
    this.uiRibbonUIRef.brushPropertyBoxRef.docContext = docContext
  }

  switchTabAndRibbon(docContext: DocumentContext) {

    this.setContext(docContext)

    if (this.uiRibbonUIRef.ribbonUITabsRef.update) {

      this.uiRibbonUIRef.ribbonUITabsRef.update(docContext)
    }

    if (this.uiRibbonUIRef.setMainToolTab) {

      this.uiRibbonUIRef.setMainToolTab(docContext.mainToolTabID)
    }

    this.getFilteredTabFunctionInfos(docContext)
      .forEach(info => {

        if (info.onActivated) {
          info.onActivated(docContext)
        }
      })
  }

  updateMainToolRibbonUI(docContext: DocumentContext) {

    this.setContext(docContext)

    this.getFilteredTabFunctionInfos(docContext)
      .forEach(info => {
        info.update(docContext)
      })
  }

  private getFilteredTabFunctionInfos(docContext: DocumentContext) {

    return (
      this.uiRibbonUIRef.updateMainToolTabFunctionInfos
        .filter(info => info.tabID.findIndex(tabID => tabID == docContext.mainToolTabID) != -1)
        .filter(info => !info.filter || info.filter(docContext.currentLayer))
    )
  }

  updateLayerRibbonUI(docContext: DocumentContext, posingLayerOptions: UI_SelectBoxOption[]) {

    this.setContext(docContext)

    if (docContext.mainToolTabID == MainToolTabID.layer && docContext.currentVectorLayer != null) {

      this.uiRibbonUIRef.posingLayerOptions = posingLayerOptions
      this.uiRibbonUIRef.posingLayerOptions_Selected = posingLayerOptions.filter(option => option.data == docContext.currentVectorLayer.runtime.posingLayer)

      this.updateMainToolRibbonUI(docContext)
    }
  }
}
