import { DOMLogic } from '../dom/dom'
import { UI_FooterOperationPanelRef } from '../ui-panel'

export class FooterWindow {

  private dom: DOMLogic = null

  private footerText: string = ''
  private footerTextBefore: string = ''

  uiFooterOperationpanelRef: UI_FooterOperationPanelRef = { isForMobile: false }

  link(dom: DOMLogic) {

    this.dom = dom
  }

  setFooterText(text: string) {

    this.footerText = text
  }

  updateFooterText() {

    if (this.footerText != this.footerTextBefore) {

      this.dom.getElement<HTMLDivElement>(this.dom.ID.footer).innerHTML = this.footerText
      this.footerTextBefore = this.footerText
    }
  }
}
