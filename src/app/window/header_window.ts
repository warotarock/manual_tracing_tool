import { UI_HeaderWindowRef } from '../ui/header_window'
import { DOMOperationLogic } from './dom'
import { DOMElementID } from './dom_element_id'

export class HeaderWindow {

  private dom: DOMOperationLogic = null
  private ID: DOMElementID = null

  uiHeaderWindowRef: UI_HeaderWindowRef = {}

  link(dom: DOMOperationLogic, id: DOMElementID) {

    this.dom = dom
    this.ID = id
  }

  setHeaderDocumentFileName(lastURL: string) {

    this.dom.setInputElementText(this.ID.fileName, lastURL)
  }
}
