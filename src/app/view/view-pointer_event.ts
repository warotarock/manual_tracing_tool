import { float } from '../common-logics'
import { CanvasWindow } from '../render'

export interface ViewCanvasWindow {

  view2DMatrix: Mat4
  invView2DMatrix: Mat4
}

export enum ViewPointerPressedState {
  released = 0,
  pressed = 1
}

export class ViewPointerEventPointer {

  identifier = -1
  ageCount = 0
  pressed = ViewPointerPressedState.released
  offsetX = 0.0
  offsetY = 0.0
  currentLocation = vec3.fromValues(0.0, 0.0, 0.0)
  pressure = 0.0

  dragging = new ViewPointerEventDragging()

  isSamePointer(e: PointerEvent): boolean {

    return (this.identifier == e.pointerId)
  }

  isFree(): boolean {

    return !this.isActive()
  }

  isActive(): boolean {

    return (this.identifier != -1)
  }

  isPressed(): boolean {

    return (this.pressed != ViewPointerPressedState.released)
  }

  isActivePressed(): boolean {

    return (this.isActive() && this.isPressed())
  }

  setActive(e: PointerEvent) {

    this.identifier = e.pointerId
    this.pressed = ViewPointerPressedState.released
    this.ageCount = 0
  }

  setFree() {

    this.identifier = -1
    this.pressed = ViewPointerPressedState.released
    this.ageCount = 0

    // console.log(`setFree id:${this.identifier}`)
  }

  startDragging(wnd: ViewCanvasWindow, velocityScale: float) {

    this.dragging.start(wnd, this.offsetX, this.offsetY, velocityScale)
  }
}

export class ViewPointerEventDragging {

  dragBeforeTransformMatrix = mat4.create()

  mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0)

  currentLocation = vec3.fromValues(0.0, 0.0, 0.0)

  mouseOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0)

  velocityScale = 1.0

  tempVec3 = vec3.create()

  start(wnd: ViewCanvasWindow, offsetX: float, offsetY: float, velocityScale: float) {

    // offset

    vec3.set(this.mouseOffset, offsetX, offsetY, 0.0)
    vec3.copy(this.mouseDownOffset, this.mouseOffset)

    // transformed location

    mat4.copy(this.dragBeforeTransformMatrix, wnd.invView2DMatrix)

    vec3.set(this.tempVec3, offsetX, offsetY, 0.0)
    vec3.transformMat4(this.mouseDownLocation, this.tempVec3, this.dragBeforeTransformMatrix)

    // reset moved values

    vec3.set(this.mouseMovedOffset, 0.0, 0.0, 0.0)
    vec3.set(this.mouseMovedVector, 0.0, 0.0, 0.0)

    this.velocityScale = velocityScale
  }

  move(offsetX: float, offsetY: float) {

    // offset

    vec3.set(this.mouseOffset, offsetX, offsetY, 0.0)

    vec3.subtract(this.mouseMovedOffset, this.mouseOffset, this.mouseDownOffset)

    vec3.scale(this.mouseMovedOffset, this.mouseMovedOffset, this.velocityScale)

    // transformed location

    vec3.transformMat4(this.currentLocation, this.mouseOffset, this.dragBeforeTransformMatrix)

    vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.currentLocation)

    vec3.scale(this.mouseMovedVector, this.mouseMovedVector, this.velocityScale)
  }

  isMoved() {

    return (vec3.length(this.mouseMovedOffset) > 0.0)
  }
}

export class ViewPointerEvent {

  window: CanvasWindow = null

  location = vec3.fromValues(0.0, 0.0, 0.0)
  offsetX = 0.0
  offsetY = 0.0

  button = 0
  buttons = 0
  wheelDelta = 0.0

  isPointerMoved = false
  isMouseDragging = false
  mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0)

  clickCount = 0
  lastClickedOffset = vec3.fromValues(0.0, 0.0, 0.0)

  mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0)

  pointers: ViewPointerEventPointer[] = [
    new ViewPointerEventPointer(), // for first finger
    new ViewPointerEventPointer(), // for second finger
    new ViewPointerEventPointer(), // for leaving and entering more than two times
  ]

  activePointers: ViewPointerEventPointer[] = []

  tempVec3 = vec3.fromValues(0.0, 0.0, 0.0)

  constructor(wnd: CanvasWindow) {

    this.window = wnd
  }

  isLeftButtonPressing(): boolean {

    return ((this.buttons & 0x1) != 0)
  }

  isRightButtonPressing(): boolean {

    return ((this.buttons & 0x2) != 0)
  }

  isCenterButtonPressing(): boolean {

    return ((this.buttons & 0x4) != 0)
  }

  isLeftButtonReleased(): boolean {

    return !this.isLeftButtonPressing()
  }

  isRightButtonReleased(): boolean {

    return !this.isRightButtonPressing()
  }

  isCenterButtonReleased(): boolean {

    return !this.isCenterButtonPressing()
  }
}

export class PointerInputWindow extends CanvasWindow implements ViewCanvasWindow {

  pointerEvent = new ViewPointerEvent(this)
  view2DMatrix = mat4.create()
  invView2DMatrix = mat4.create()
}
