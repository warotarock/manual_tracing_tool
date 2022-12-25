import { UI_MainMenuButtonRef, UI_BrushPropertyBoxRef, UI_SelectBoxPopoverRef, PopoverRef } from "../ui-popover"

export class PopoverLogic {

  mainMenuUIRef = new UI_MainMenuButtonRef()
  brushPropertyBoxRef = new UI_BrushPropertyBoxRef()
  selectBoxPopoverRef = new UI_SelectBoxPopoverRef()

  private _isOpened = false

  constructor() {

    this.setCallbacks(this.mainMenuUIRef)
    this.setCallbacks(this.brushPropertyBoxRef)
    this.setCallbacks(this.selectBoxPopoverRef)
  }

  private setCallbacks(ref: PopoverRef) {

    ref.onPopoverOpened = () => {

      this._isOpened = true
    }

    ref.onPopoverClosed = () => {

      this._isOpened = false
    }
  }

  isActive(): boolean {

    return this._isOpened
  }
}
