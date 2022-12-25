import { DOMElementID } from "./dom-element-id"
import { DOMResizingLogic } from "./dom-resizing"
import { DOMValueLogic } from "./dom-value"

export class DOMLogic {

  ID = new DOMElementID()
  value = new DOMValueLogic()
  resizing = new DOMResizingLogic()

  getElement<T>(id: string): T {

    const element = document.getElementById(id)

    if (element == null) {
      throw new Error('ERROR 0051:Could not find element "' + id + '"')
    }

    return element as unknown as T
  }
}
