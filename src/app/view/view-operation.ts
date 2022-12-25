import { SubToolContext } from '../context'
import { float, RectangleLayoutArea } from '../common-logics'
import { CanvasWindow } from '../render'
import { ToolPointerEvent } from '../tool'
import { PointerInputWindow, ViewPointerEventPointer } from './view-pointer_event'
import { PointerInputLogic } from './pointer-input'

export enum ViewOperationMode {

  none = 0,
  pan = 1,
  rotate = 2,
  zoom = 3,
}

export class ViewOperation {

  homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0)
  lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0)
  isViewLocationMoved = false
  lastViewScale = 0.0
  lastViewRotation = 0.0

  viewOperationMode = ViewOperationMode.none
  velocityScale = 1.0
  clickedArea: RectangleLayoutArea = null
  moveBeforeViewLocation = vec3.create()
  moveBeforeViewRotation = 0.0
  moveBeforeViewScale = 0.0

  first_Pointer: ViewPointerEventPointer = null
  second_Pointer: ViewPointerEventPointer = null

  tempVec3 = vec3.create()
  direction = vec3.create()
  difference = vec3.create()

  startViewOperation(mode: ViewOperationMode, wnd: PointerInputWindow, area: RectangleLayoutArea, ctx: SubToolContext, velocityScale = 1.0) {

    const e = wnd.pointerEvent

    // const usedPointersText = wnd.pointerEvent.pointers.map(p => p.isActive() ?  `${p.identifier}` : '' ).join(' ')
    // console.debug('  startViewOperation', 'actives:', wnd.pointerEvent.activePointers.length, 'used:', usedPointersText)

    const pointer = PointerInputLogic.getFirstActivePointer(e)

    if (pointer == null) {
      // console.debug('    canceled')
      return
    }

    this.viewOperationMode = mode
    this.velocityScale = velocityScale
    this.first_Pointer = pointer
    this.second_Pointer = null

    if (area != null) {

      this.clickedArea = area
      this.clickedArea.hover = true
    }

    this.copyBeforeViewState(wnd)

    if (mode != ViewOperationMode.pan) {

      this.copyLastViewLocation(true, wnd)
    }

    this.first_Pointer.startDragging(wnd, velocityScale)

    ctx.setRedrawEditorWindow()

    // console.debug('    started with pointer', pointer.identifier)
  }

  endViewOperation(wnd: PointerInputWindow, spaceKeyUp: boolean, ctx: SubToolContext): boolean {

    if (this.first_Pointer == null) {
      return false
    }

    ctx.setRedrawEditorWindow()

    // const usedPointersText = wnd.pointerEvent.pointers.map(p => p.isActive() ?  `${p.identifier}` : '' ).join(' ')
    // console.debug('  endViewOperation', 'actives:', wnd.pointerEvent.activePointers.length, 'used:', usedPointersText)

    // 二つ目のポインターが終了し、一つ目のポインターが残っている場合
    if (wnd.pointerEvent.activePointers.length == 1) {

      this.startViewOperation(
        this.viewOperationMode,
        wnd,
        this.clickedArea,
        ctx,
        this.velocityScale
      )

      return true
    }

    // 全てのポインターの終了、またはスペースキー解除
    if (wnd.pointerEvent.activePointers.length == 0 || spaceKeyUp) {

      PointerInputLogic.cancelAllPointers(wnd.pointerEvent)

      this.viewOperationMode = ViewOperationMode.none

      if (this.clickedArea != null) {

        this.clickedArea.hover = false
      }
    }

    PointerInputLogic.endMouseDragging(wnd.pointerEvent)

    return this.first_Pointer.dragging.isMoved()
  }

  pointerDownAdditional(wnd: PointerInputWindow) {

    const e = wnd.pointerEvent

    if (e.activePointers.length < 2) {
      return
    }

    this.copyBeforeViewState(wnd)

    this.second_Pointer = e.activePointers[0]

    this.second_Pointer.startDragging(wnd, 1.0)
  }

  isViewOperationRunning() {

    return (this.viewOperationMode != ViewOperationMode.none)
  }

  getActivePointer(): ViewPointerEventPointer {

    // if secont pointer is inputed and is pressed
    // isPressed condition is needed to ignore a mouse with no button pressed
    if (this.second_Pointer != null && this.second_Pointer.isPressed()) {

      // console.log(`second_Pointer`)
      return this.second_Pointer
    }
    else {

      // console.log(`first_Pointer`)
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

    // console.log(`processViewOperation offsetX:${pointer.offsetX.toFixed(2)} offsetY:${pointer.offsetY.toFixed(2)}`)

    pointer.dragging.move(pointer.offsetX, pointer.offsetY)

    switch (this.viewOperationMode) {

      case ViewOperationMode.pan:
        this.processPan(wnd, e, ctx)
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

  processPan(wnd: CanvasWindow, e: ToolPointerEvent, ctx: SubToolContext) {

    const pointer = this.getActivePointer()

    if (pointer == null) {
      return
    }

    vec3.add(wnd.viewLocation, this.moveBeforeViewLocation, pointer.dragging.mouseMovedVector)

    // console.log(`mouseMovedVector ${pointer.dragging.mouseMovedVector[0].toFixed(2)} ${pointer.dragging.mouseMovedVector[1].toFixed(2)} ${pointer.dragging.mouseMovedVector[2].toFixed(2)}`)
    // console.log(`currentLocation ${pointer.dragging.currentLocation[0].toFixed(2)} ${pointer.dragging.currentLocation[1].toFixed(2)} ${pointer.dragging.currentLocation[2].toFixed(2)}`)

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

  toggletHome(wnd: CanvasWindow, rest: boolean, ctx: SubToolContext) {

    if (rest) {

      this.setViewToDefaultState(wnd, ctx.documentData.defaultViewScale)
    }
    else if (this.isViewLocationMoved) {

      this.setViewToHomeLocation(wnd, ctx.documentData.defaultViewScale)
    }
    else {

      this.setViewToLastLocation(wnd)
    }

    ctx.setRedrawMainWindowEditorWindow()
  }

  setViewToDefaultState(wnd: CanvasWindow, defaultViewScale: float) {

    wnd.viewLocation[0] = 0.0
    wnd.viewLocation[1] = 0.0
    vec3.copy(this.homeViewLocation, wnd.viewLocation)
    wnd.viewScale = defaultViewScale
    wnd.viewRotation = 0.0
    wnd.mirrorX = false
    wnd.mirrorY = false
    this.isViewLocationMoved = false
  }

  setViewToHomeLocation(wnd: CanvasWindow, defaultViewScale: float) {

    vec3.copy(wnd.viewLocation, this.homeViewLocation)
    wnd.viewScale = defaultViewScale
    wnd.viewRotation = 0.0
    this.isViewLocationMoved = false
  }

  setViewToLastLocation(wnd: CanvasWindow) {

    vec3.copy(wnd.viewLocation, this.lastViewLocation)
    wnd.viewScale = this.lastViewScale
    wnd.viewRotation = this.lastViewRotation
    this.isViewLocationMoved = true
  }

  copyBeforeViewState(wnd: CanvasWindow) {

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
