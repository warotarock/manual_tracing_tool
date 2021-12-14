import { float } from '../logics/conversion'
import { RectangleLayoutArea } from '../logics/layout'
import { CanvasWindow } from '../render/render2d'
import { SubToolContext } from '../context/subtool_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'
import { PointerInputLogic, PointerInputWindow } from './pointer_input'
import { ViewPointerEventPointer } from './view_pointer_event'

export enum ViewOperationMode {

  none = 0,
  move = 1,
  rotate = 2,
  zoom = 3,
}

export class ViewOperation {

  pointerInput: PointerInputLogic = null

  homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0)
  lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0)
  isViewLocationMoved = false
  lastViewScale = 0.0
  lastViewRotation = 0.0

  viewOperationMode = ViewOperationMode.none
  clickedArea: RectangleLayoutArea = null
  moveBeforeViewLocation = vec3.create()
  moveBeforeViewRotation = 0.0
  moveBeforeViewScale = 0.0

  first_Pointer: ViewPointerEventPointer = null
  second_Pointer: ViewPointerEventPointer = null

  tempVec3 = vec3.create()
  direction = vec3.create()
  difference = vec3.create()

  link(pointerInput: PointerInputLogic) {

    this.pointerInput = pointerInput
  }

  startViewOperation(mode: ViewOperationMode, wnd: PointerInputWindow, area: RectangleLayoutArea, ctx: SubToolContext, scale = 1.0) {

    const e = wnd.pointerEvent

    if (e.activePointers.length == 0) {
      return
    }

    const pointer = e.activePointers[0]

    this.viewOperationMode = mode

    if (area != null) {

      this.clickedArea = area
      this.clickedArea.hover = true
    }

    this.copyBefoewViewState(wnd)

    if (mode != ViewOperationMode.move) {

      this.copyLastViewLocation(true, wnd)
    }

    this.first_Pointer = pointer

    this.first_Pointer.startDragging(scale)

    this.second_Pointer = null

    // TODO: 不要になる？
    this.pointerInput.startMouseDragging(e)

    ctx.setRedrawEditorWindow()
  }

  endViewOperation(wnd: PointerInputWindow, spaceKeyUp: boolean, ctx: SubToolContext): boolean {

    const e = wnd.pointerEvent

    if (this.first_Pointer == null) {
      return false
    }

    ctx.setRedrawEditorWindow()

    // 全てのポインターの終了、またはスペースキー解除
    if (this.first_Pointer.isFree() || spaceKeyUp) {

      this.viewOperationMode = ViewOperationMode.none

      if (this.clickedArea != null) {

        this.clickedArea.hover = false
      }
    }

    // 二つ目のポインターが終了し、一つ目のポインターが残っている場合
    if (this.first_Pointer.isActive()
      && this.second_Pointer != null
      && this.second_Pointer.isFree()) {

      this.copyBefoewViewState(wnd)

      this.second_Pointer = null

      return true
    }

    this.pointerInput.endMouseDragging(e)

    return this.first_Pointer.dragging.isMoved()
  }

  pointerDownAdditional(wnd: PointerInputWindow) {

    const e = wnd.pointerEvent

    if (e.activePointers.length < 2) {
      return
    }

    this.copyBefoewViewState(wnd)

    this.second_Pointer = e.activePointers[0]

    this.second_Pointer.startDragging(1.0)
  }

  isViewOperationRunning() {

    return (this.viewOperationMode != ViewOperationMode.none)
  }

  getActivePointer(): ViewPointerEventPointer {

    // if secont pointer is inputed and is pressed
    // isPressed condition is needed to ignore a mouse with no button pressed
    if (this.second_Pointer != null && this.second_Pointer.isPressed()) {

      return this.second_Pointer
    }
    else {

      return this.first_Pointer
    }
  }

  processViewOperation(wnd: CanvasWindow, e: ToolPointerEvent, ctx: SubToolContext): boolean {

    if (this.viewOperationMode == ViewOperationMode.none) {
      return false
    }

    const pointer = this.getActivePointer()

    if (pointer == null) {
      return false
    }

    pointer.dragging.move(pointer.offsetX, pointer.offsetY)

    switch (this.viewOperationMode) {

      case ViewOperationMode.move:
        this.processMove(wnd, e, ctx)
        break

      case ViewOperationMode.rotate:
        this.processRotate(wnd, e, ctx)
        break

      case ViewOperationMode.zoom:
        this.processScale(wnd, e, ctx)
        break
    }

    return (pointer.dragging.isMoved())
  }

  processMove(wnd: CanvasWindow, e: ToolPointerEvent, ctx: SubToolContext) {

    const pointer = this.getActivePointer()

    if (pointer == null) {
      return
    }

    vec3.add(wnd.viewLocation, this.moveBeforeViewLocation, pointer.dragging.mouseMovedVector)

    if (!this.isViewLocationMoved) {

      vec3.copy(this.homeViewLocation, wnd.viewLocation)
    }
    else {

      vec3.copy(this.lastViewLocation, wnd.viewLocation)
    }

    ctx.setRedrawMainWindowEditorWindow()
    ctx.setRedrawWebGLWindow()
  }

  processRotate(wnd: CanvasWindow, e: ToolPointerEvent, ctx: SubToolContext) {

    const pointer = this.getActivePointer()

    if (pointer == null) {
      return
    }

    vec3.subtract(this.direction, pointer.dragging.mouseDownLocation, wnd.viewLocation)
    const initialAngle = Math.atan2(this.direction[1], this.direction[0])

    vec3.subtract(this.direction, pointer.dragging.currentLocation, wnd.viewLocation)
    const currentAngle = Math.atan2(this.direction[1], this.direction[0])

    let movedAngle  = currentAngle - initialAngle

    if (movedAngle >= Math.PI) {
        movedAngle -= Math.PI * 2
    }

    if (movedAngle <= -Math.PI) {
        movedAngle += Math.PI * 2
    }

    wnd.viewRotation = this.moveBeforeViewRotation + movedAngle * 180 / Math.PI

    if (ctx.isCtrlKeyPressing()) {

      const flooring = 90.0 / 4
      wnd.viewRotation = Math.floor(wnd.viewRotation / flooring) * flooring
    }

    wnd.fixViewRotation()

    ctx.setRedrawMainWindowEditorWindow()
  }

  processScale(wnd: CanvasWindow, e: ToolPointerEvent, ctx: SubToolContext) {

    const pointer = this.getActivePointer()

    if (pointer == null) {
      return
    }

    if (pointer == this.first_Pointer) {

      const range = Math.min(wnd.width, wnd.height) / 2

      const scaling = (pointer.dragging.mouseMovedOffset[0] - pointer.dragging.mouseMovedOffset[1]) / range

      wnd.viewScale = this.moveBeforeViewScale * (1.0 - scaling)
    }
    else {

      vec3.subtract(this.difference, pointer.dragging.mouseDownLocation, wnd.viewLocation)
      const initialScale = vec3.length(this.difference)

      vec3.subtract(this.difference, pointer.dragging.currentLocation, wnd.viewLocation)
      const currentScale = vec3.length(this.difference)

      if (initialScale > 0.0) {

        wnd.viewScale = this.moveBeforeViewScale * (currentScale / initialScale)
      }
    }

    wnd.fixViewScale()

    ctx.setRedrawMainWindowEditorWindow()
  }

  addViewRotation(quantity: number, clockwise: boolean, wnd: CanvasWindow, ctx: SubToolContext) {

    let rot = quantity
    if (clockwise) {

      rot = -rot
    }

    if (wnd.mirrorX) {

      rot = -rot
    }

    wnd.viewRotation += rot

    wnd.fixViewRotation()

    ctx.setRedrawMainWindowEditorWindow()
  }

  addViewScale(quantity: float, wnd: CanvasWindow, ctx: SubToolContext) {

    this.copyLastViewLocation(true, wnd)

    wnd.addViewScale(quantity)

    ctx.setRedrawMainWindowEditorWindow()
  }

  reseTotHome(wnd: CanvasWindow, ctx: SubToolContext) {

    if (ctx.isShiftKeyPressing()) {

      wnd.viewLocation[0] = 0.0
      wnd.viewLocation[1] = 0.0
      vec3.copy(this.homeViewLocation, wnd.viewLocation)
      wnd.viewScale = ctx.document.defaultViewScale
      wnd.viewRotation = 0.0
      wnd.mirrorX = false
      wnd.mirrorY = false
      this.isViewLocationMoved = false
    }
    else if (this.isViewLocationMoved) {

      vec3.copy(wnd.viewLocation, this.homeViewLocation)
      wnd.viewScale = ctx.document.defaultViewScale
      wnd.viewRotation = 0.0
      this.isViewLocationMoved = false
    }
    else {

      vec3.copy(wnd.viewLocation, this.lastViewLocation)
      wnd.viewScale = this.lastViewScale
      wnd.viewRotation = this.lastViewRotation
      this.isViewLocationMoved = true
    }

    ctx.setRedrawMainWindowEditorWindow()
  }

  copyBefoewViewState(wnd: CanvasWindow) {

    vec3.copy(this.moveBeforeViewLocation, wnd.viewLocation)
    this.moveBeforeViewRotation = wnd.viewRotation
    this.moveBeforeViewScale = wnd.viewScale
  }

  copyLastViewLocation(setUpdate: boolean, wnd: CanvasWindow) {

    this.isViewLocationMoved = setUpdate
    vec3.copy(this.lastViewLocation, wnd.viewLocation)
    this.lastViewScale = wnd.viewScale
    this.lastViewRotation = wnd.viewRotation
  }
}
