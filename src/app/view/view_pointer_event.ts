import { float } from '../logics/conversion'
import { PointerInputWindow } from './pointer_input'

export class ViewPointerEventPointer {

  window: PointerInputWindow = null

  identifier = -1
  pressed = 0
  ageCount = 0
  offsetX = 0.0
  offsetY = 0.0
  currentLocation = vec3.fromValues(0.0, 0.0, 0.0)
  lastClickedPosition = vec3.fromValues(0.0, 0.0, 0.0)
  movedOffset = vec3.fromValues(0.0, 0.0, 0.0)
  force = 0.0

  dragging = new ViewPointerEventDragging()

  isActive() {

    return (this.identifier != -1)
  }

  isFree() {

    return (this.identifier == -1)
  }

  isPressed() {

    return (this.pressed != 0)
  }

  startDragging(scale: float) {

    this.dragging.start(this.window, this.offsetX, this.offsetY, scale)
  }
}

export class ViewPointerEventDragging {

  window: PointerInputWindow = null

  dragBeforeTransformMatrix = mat4.create()

  mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0)

  currentLocation = vec3.fromValues(0.0, 0.0, 0.0)

  mouseOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0)

  scale = 1.0

  tempVec3 = vec3.create()

  start(wnd: PointerInputWindow, offsetX: float, offsetY: float, scale: float) {

    this.window = wnd

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

    this.scale = scale
  }

  move(offsetX: float, offsetY: float) {

    // offset

    vec3.set(this.mouseOffset, offsetX, offsetY, 0.0)

    vec3.subtract(this.mouseMovedOffset, this.mouseOffset, this.mouseDownOffset)

    vec3.scale(this.mouseMovedOffset, this.mouseMovedOffset, this.scale)

    // transformed location

    vec3.transformMat4(this.currentLocation, this.mouseOffset, this.dragBeforeTransformMatrix)

    vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.currentLocation)

    vec3.scale(this.mouseMovedVector, this.mouseMovedVector, this.scale)
  }

  isMoved() {

    return (vec3.length(this.mouseMovedOffset) > 0.0)
  }
}

export class ViewPointerEvent {

  window: PointerInputWindow = null
  pointerID: number = -1

  button = 0
  buttons = 0
  offsetX = 0.0
  offsetY = 0.0
  wheelDelta = 0.0

  isMouseDragging = false
  location = vec3.fromValues(0.0, 0.0, 0.0)
  mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0)

  clickCount = 0
  lastClickedOffset = vec3.fromValues(0.0, 0.0, 0.0)

  mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0)
  mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0)

  pointers: ViewPointerEventPointer[] = [
    new ViewPointerEventPointer(),
    new ViewPointerEventPointer(),
    new ViewPointerEventPointer() // for second finger
  ]

  activePointers: ViewPointerEventPointer[] = []

  tempVec3 = vec3.fromValues(0.0, 0.0, 0.0)

  constructor(wnd: PointerInputWindow) {

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
