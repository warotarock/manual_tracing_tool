import { UI_FooterOperationPanelRef } from '../ui/footer_operation_panel'
import { DOMOperationLogic } from './dom'
import { DOMElementID } from './dom_element_id'

export class FooterWindow {

  private dom: DOMOperationLogic = null
  private ID: DOMElementID = null

  private footerText: string = ''
  private footerTextBefore: string = ''

  uiFooterOperationpanelRef: UI_FooterOperationPanelRef = {}

  link(dom: DOMOperationLogic, id: DOMElementID) {

    this.dom = dom
    this.ID = id
  }

  setFooterText(text: string) {

    this.footerText = text
  }

  updateFooterText() {

    if (this.footerText != this.footerTextBefore) {

      this.dom.getElement(this.ID.footer).innerHTML = this.footerText
      this.footerTextBefore = this.footerText
    }
  }
}
