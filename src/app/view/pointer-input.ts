import { float, int } from '../common-logics'
import { DocumentContext } from '../context'
import { ViewCoordinateLogic } from './view-coordinate'
import { PointerInputWindow, ViewPointerEvent, ViewPointerEventPointer, ViewPointerPressedState } from './view-pointer_event'

export class PointerInputLogic {

  private static tempVec3 = vec3.create()

  static processSinglePointerEvent(
    wnd: PointerInputWindow,
    e: PointerEvent,
    ctx: DocumentContext,
    buttonDown: boolean,
    buttonUp: boolean
  ) {

    const viewPointerEvent = wnd.pointerEvent

    if (document.activeElement.nodeName == 'INPUT') {
      (<HTMLInputElement>document.activeElement).blur()
    }

    viewPointerEvent.button = e.button
    viewPointerEvent.buttons = e.buttons

    if (buttonUp) {

      viewPointerEvent.button = -1
      viewPointerEvent.buttons = 0
    }

    viewPointerEvent.offsetX = e.offsetX * wnd.devicePixelRatio
    viewPointerEvent.offsetY = e.offsetY * wnd.devicePixelRatio

    ViewCoordinateLogic.calculateTransfomredMouseParams(viewPointerEvent.location, viewPointerEvent, wnd)
    vec3.copy(ctx.mouseCursorLocation, viewPointerEvent.location)

    if (buttonDown) {

      viewPointerEvent.isPointerMoved = false
    }

    if (buttonDown) {

      vec3.copy(viewPointerEvent.mouseDownLocation, viewPointerEvent.location)
    }

    if (!buttonDown && !buttonUp && !viewPointerEvent.isPointerMoved) {

      const distance = vec3.distance(viewPointerEvent.location, viewPointerEvent.mouseDownLocation)
      const threshold = wnd.getViewScaledLength(ctx.dragStartThresholdDistance)

      if (distance >= threshold) {

        viewPointerEvent.isPointerMoved = true
      }
    }
  }

  static processMultiPointerEvent(
    wnd: PointerInputWindow,
    e: PointerEvent,
    buttonDown: boolean,
    buttonUp: boolean
  ) {

    // if (buttonDown || buttonUp) {
    //   console.debug(`processPointerEvent ${e.pointerId} ${buttonDown ? 'button down' : ''}${buttonUp ? 'button up' : ''}${!buttonDown && !buttonUp ? 'move' : ''}`)
    // }
    // console.debug(`processPointerEvent (${pointerEvent.location[0]} ${pointerEvent.location[1]})`)

    let isPointerChanged = false
    let lastUsed_Pointer: ViewPointerEventPointer | null = null

    // Search a free pointer or last used pointer
    for (const pointer of wnd.pointerEvent.pointers) {

      if (pointer.isSamePointer(e)) {

        lastUsed_Pointer = pointer
        break
      }
    }

    if (buttonUp) {

      if (lastUsed_Pointer != null) {

        // Cancel last used pointer for button up
        lastUsed_Pointer.setFree()
        isPointerChanged = true
      }
    }
    else {

      // Determine target pointer for this time input
      let target_Pointer = lastUsed_Pointer

      if (target_Pointer == null) {

        let free_Pointer = wnd.pointerEvent.pointers.find(pointer => pointer.isFree())

        if (!free_Pointer) {
          free_Pointer = wnd.pointerEvent.pointers.at(-1)
        }

        if (free_Pointer) {

          // console.log(`free_Pointer != null id:${e.pointerId}`)

          // Use the free pointer found if there is no last used pointer
          target_Pointer = free_Pointer
          target_Pointer.setActive(e)
          isPointerChanged = true
        }
      }

      // Update target pointer
      if (target_Pointer != null) {

        target_Pointer.offsetX = wnd.pointerEvent.offsetX
        target_Pointer.offsetY = wnd.pointerEvent.offsetY

        vec3.copy(target_Pointer.currentLocation, wnd.pointerEvent.location)

        target_Pointer.pressure = e.pressure

        const pressedBefore = target_Pointer.pressed
        if (buttonDown) {

          target_Pointer.pressed = ViewPointerPressedState.pressed
        }
        else if (buttonUp) {

          target_Pointer.pressed = ViewPointerPressedState.released
        }

        if (pressedBefore != target_Pointer.pressed) {

          isPointerChanged = true
        }
      }
    }

    // Update priority
    if (isPointerChanged) {

      this.updatePointerStates(wnd.pointerEvent)
    }

    //console.debug(e.offsetX.toFixed(2) + ',' + e.offsetY.toFixed(2) + '  ' + pointerEvent.offsetX.toFixed(2) + ',' + this.pointerEvent.offsetY.toFixed(2))

    // const texts: string[] = []
    // for (let pointer of wnd.pointerEvent.activePointers) {
    //   texts.push(`(${pointer.identifier} ${pointer.offsetX} ${pointer.offsetY} ${pointer.pressed} ${pointer.pressure} ${pointer.ageCount})`)
    // }
    // console.debug(`activePointers(${texts.length}) ${texts.join()}`)
  }

  static processMultiPointerLeaveEvent(
    wnd: PointerInputWindow,
    e: PointerEvent
  ) {

    const target_Pointer = wnd.pointerEvent.pointers.find(pointer => pointer.isSamePointer(e))

    if (!target_Pointer) {
      return
    }

    target_Pointer.setFree()

    this.updatePointerStates(wnd.pointerEvent)
  }

  static cancelAllPointers(viewPointerEvent: ViewPointerEvent) {

    viewPointerEvent.pointers.forEach(pointer => pointer.setFree())

    this.updatePointerStates(viewPointerEvent)
  }

  static hasActivePointer(pointerId: int, viewPointerEvent: ViewPointerEvent) {

    return (viewPointerEvent.activePointers.findIndex(
      pointer => pointer.identifier == pointerId
        // && pointer.pressed == ViewPointerPressedState.pressed
      ) != -1)
  }

  private static updatePointerStates(viewPointerEvent: ViewPointerEvent) {

    for (const pointer of viewPointerEvent.pointers) {
      pointer.ageCount++
    }

    viewPointerEvent.pointers = viewPointerEvent.pointers
      .sort((a, b) => { return a.ageCount - b.ageCount })

    viewPointerEvent.activePointers = viewPointerEvent.pointers
      .filter(pointer => pointer.isActivePressed())

    // console.debug(pointerEvent.activePointers)
  }

  static getFirstActivePointer(viewPointerEvent: ViewPointerEvent): ViewPointerEventPointer | null {

    let foundPointer: ViewPointerEventPointer | null = null

    if (viewPointerEvent.activePointers.length > 0) {

      foundPointer = viewPointerEvent.activePointers[0]
    }
    else {

      foundPointer = viewPointerEvent.pointers.find(ptr => ptr.isActive()) ?? null
    }

    return foundPointer
  }

  static getWheelInfo(viewPointerEvent: ViewPointerEvent, e: MouseEvent) {

    let wheelDelta = 0.0
    if ('wheelDelta' in e) {

      wheelDelta = e['wheelDelta']
    }
    else if ('deltaY' in e) {

      wheelDelta = e['deltaY']
    }
    else if ('wheelDeltaY' in e) {

      wheelDelta = e['wheelDeltaY']
    }

    if (wheelDelta > 0) {

      wheelDelta = 1.0
    }
    else if (wheelDelta < 0) {

      wheelDelta = -1.0
    }

    viewPointerEvent.wheelDelta = wheelDelta
  }

  static handleDoubleClick(viewPointerEvent: ViewPointerEvent, offsetX: float, offsetY: float): boolean {

    if (viewPointerEvent.clickCount == 0) {

      viewPointerEvent.clickCount++
      viewPointerEvent.lastClickedOffset[0] = offsetX
      viewPointerEvent.lastClickedOffset[1] = offsetY

      setTimeout(() => {
        viewPointerEvent.clickCount = 0
      }, 350)

      return false
    }
    else {

      viewPointerEvent.clickCount = 0

      if (Math.pow(offsetX - viewPointerEvent.lastClickedOffset[0], 2)
        + Math.pow(offsetY - viewPointerEvent.lastClickedOffset[1], 2) < 9.0) {

        return true
      }
      else {

        return false
      }
    }
  }

  static startMouseDragging(viewPointerEvent: ViewPointerEvent) {

    viewPointerEvent.isMouseDragging = true

    vec3.copy(viewPointerEvent.mouseDownLocation, viewPointerEvent.location)
    vec3.set(viewPointerEvent.mouseMovedVector, 0.0, 0.0, 0.0)

    vec3.set(viewPointerEvent.mouseDownOffset, viewPointerEvent.offsetX, viewPointerEvent.offsetY, 0.0)
    vec3.set(viewPointerEvent.mouseMovedOffset, 0.0, 0.0, 0.0)
  }

  static processMouseDragging(viewPointerEvent: ViewPointerEvent) {

    if (!viewPointerEvent.isMouseDragging) {

      return
    }

    vec3.subtract(viewPointerEvent.mouseMovedVector, viewPointerEvent.mouseDownLocation, viewPointerEvent.location)

    vec3.set(this.tempVec3, viewPointerEvent.offsetX, viewPointerEvent.offsetY, 0.0)
    vec3.subtract(viewPointerEvent.mouseMovedOffset, viewPointerEvent.mouseDownOffset, this.tempVec3)
  }

  static endMouseDragging(viewPointerEvent: ViewPointerEvent) {

    // console.debug(`endMouseDragging`)

    viewPointerEvent.isMouseDragging = false
  }

  static isPointerMovedOnDevice(viewPointerEvent: ViewPointerEvent, e: PointerEvent): boolean {

    return (viewPointerEvent.offsetX != e.offsetX * viewPointerEvent.window.devicePixelRatio
      || viewPointerEvent.offsetY != e.offsetY * viewPointerEvent.window.devicePixelRatio)
  }
}
