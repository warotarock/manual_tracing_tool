import { float } from '../common-logics'
import { PointerInputWindow, ViewPointerEvent } from '../view'

export class ToolPointerEventProvider {

  event: ViewPointerEvent = null

  attach(wnd: PointerInputWindow): ToolPointerEventProvider {

    this.event = wnd.pointerEvent

    return this
  }

  get location(): Vec3 {
    return this.event.location
  }

  get offsetX(): float {
    return this.event.offsetX
  }

  get offsetY(): float {
    return this.event.offsetY
  }

  get isLeftButtonPressing(): boolean {
    return this.event.isLeftButtonPressing()
  }

  get isRightButtonPressing(): boolean {
    return this.event.isRightButtonPressing()
  }

  get isCenterButtonPressing(): boolean {
    return this.event.isCenterButtonPressing()
  }

  get isLeftButtonReleased(): boolean {
    return this.event.isLeftButtonReleased()
  }

  get isRightButtonReleased(): boolean {
    return this.event.isRightButtonReleased()
  }

  get isCenterButtonReleased(): boolean {
    return this.event.isCenterButtonReleased()
  }

  get isPointerMoved(): boolean {
    return this.event.isPointerMoved
  }
}

export interface ToolPointerEvent {

  readonly location: Vec3
  readonly offsetX: float
  readonly offsetY: float
  readonly isLeftButtonPressing: boolean
  readonly isRightButtonPressing: boolean
  readonly isCenterButtonPressing: boolean
  readonly isLeftButtonReleased: boolean
  readonly isRightButtonReleased: boolean
  readonly isCenterButtonReleased: boolean
  readonly isPointerMoved: boolean
}

