import { UI_RibbonUITabsRef } from '../ui/ribbon_ui_tabs'
import { DocumentContext } from '../context/document_context'
import { UI_RibbonUIRef } from '../ui/ribbon_ui'
import { UI_SelectBoxOption } from '../ui/selectbox'

export class RibbonUIWindow {

  uiRibbonUITabsRef: UI_RibbonUITabsRef = {}
  uiRibbonUIRef: UI_RibbonUIRef = {}

  private setContext(docContext: DocumentContext) {

    this.uiRibbonUIRef.docContext = docContext
  }

  updateTabAndRibbon(docContext: DocumentContext) {

    this.setContext(docContext)

    if (this.uiRibbonUITabsRef.update) {

      this.uiRibbonUITabsRef.update(docContext.mainToolTabID, docContext.mainToolTabs)
    }

    if (this.uiRibbonUIRef.update) {

      this.uiRibbonUIRef.update(docContext.mainToolTabID)
    }
  }

  updateHomeUI(docContext: DocumentContext) {

    this.setContext(docContext)

    if (this.uiRibbonUIRef.updateHomeUI) {

      this.uiRibbonUIRef.updateHomeUI(docContext)
    }
  }

  updateEditUI(docContext: DocumentContext) {

    this.setContext(docContext)

    if (this.uiRibbonUIRef.updateEditUI) {

      this.uiRibbonUIRef.updateEditUI(docContext)
    }
  }

  updateDocumentUI(docContext: DocumentContext) {

    this.setContext(docContext)

    if (this.uiRibbonUIRef.updateDocumentUI) {

      this.uiRibbonUIRef.updateDocumentUI(docContext.document)
    }
  }

  updateLayerUI(docContext: DocumentContext, posingLayerOptions: UI_SelectBoxOption[]) {

    this.setContext(docContext)

    if (this.uiRibbonUIRef.updateLayerUI) {

      this.uiRibbonUIRef.updateLayerUI(docContext.currentLayer)
    }

    if (docContext.currentVectorLayer) {

      if (this.uiRibbonUIRef.updateVecrotLayerUI) {

        this.uiRibbonUIRef.updateVecrotLayerUI(docContext.currentVectorLayer, posingLayerOptions)
      }
    }
  }
}
