import { DOMLogic } from '../dom/dom'
import { UI_HeaderWindowRef } from '../ui-panel'

export class HeaderWindow {

  private dom: DOMLogic = null

  uiHeaderWindowRef: UI_HeaderWindowRef = {}

  link(dom: DOMLogic) {

    this.dom = dom
  }

  setHeaderDocumentFileName(lastURL: string) {

    this.dom.value.setInputElementText(this.dom.ID.fileName, lastURL)
  }
}
