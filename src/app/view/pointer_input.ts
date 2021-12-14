import { float } from '../logics/conversion'
import { CanvasWindow } from '../render/render2d'
import { SubToolContext } from '../context/subtool_context'
import { ViewPointerEvent, ViewPointerEventPointer } from './view_pointer_event'
import { ViewCoordinateLogic } from './view_coordinate'

export class PointerInputWindow extends CanvasWindow {

  pointerEvent = new ViewPointerEvent(this)
  view2DMatrix = mat4.create()
  invView2DMatrix = mat4.create()
}

export class PointerInputLogic {

  private tempVec3 = vec3.create()

  processPointerEvent(
    wnd: PointerInputWindow,
    e: PointerEvent,
    ctx: SubToolContext,
    viewCoordinate: ViewCoordinateLogic,
    buttonDown: boolean,
    buttonhUp: boolean,
    pointerMove: boolean
  ) {

    const pointerEvent = wnd.pointerEvent

    if (document.activeElement.nodeName == 'INPUT') {
      (<HTMLInputElement>document.activeElement).blur()
    }

    // Main pointer

    pointerEvent.button = e.button
    pointerEvent.buttons = e.buttons

    if (buttonDown) {

      this.processMouseDragging(pointerEvent)
    }

    if (buttonhUp) {

      pointerEvent.button = -1
      pointerEvent.buttons = 0
    }

    pointerEvent.offsetX = e.offsetX
    pointerEvent.offsetY = e.offsetY

    viewCoordinate.calculateTransfomredMouseParams(ctx.mouseCursorLocation, pointerEvent, wnd)

    // console.debug(`processPointerEvent (${pointerEvent.location[0]} ${pointerEvent.location[1]})`)

    // Multi pointer

    let isPointerChanged = false
    let lastUsed_Pointer: ViewPointerEventPointer | null = null
    let free_Pointer: ViewPointerEventPointer | null = null

    // Search a free pointer
    for (const pointer of pointerEvent.pointers) {

      if (pointer.identifier == e.pointerId) {

        lastUsed_Pointer = pointer
        break
      }

      if (free_Pointer == null && pointer.isFree()) {

        free_Pointer = pointer
      }
    }

    // Determine target pointer for this time input
    let target_Pointer: ViewPointerEventPointer | null = null
    if (buttonDown || pointerMove) {

      if (lastUsed_Pointer != null) {

        target_Pointer = lastUsed_Pointer
      }
      else {

        if (free_Pointer != null) {

          // Use the free pointer found if there is no last used pointer
          target_Pointer = free_Pointer

          target_Pointer.identifier = e.pointerId
          target_Pointer.ageCount = 0

          isPointerChanged = true
        }
        else {

          // Use the oldest one if there is no free pointer or last used pointer only when button down
          if (buttonDown && pointerEvent.activePointers.length > 0) {

            target_Pointer = pointerEvent.activePointers[pointerEvent.activePointers.length - 1]
            target_Pointer.identifier = e.pointerId
            target_Pointer.ageCount = 0

            isPointerChanged = true
          }
        }
      }
    }
    else if (buttonhUp) {

      // Cancel last used pointer for button up
      if (lastUsed_Pointer != null) {

        target_Pointer = lastUsed_Pointer

        target_Pointer.identifier = -1

        isPointerChanged = true
      }
    }

    // Update target pointer
    if (target_Pointer != null) {

      target_Pointer.window = wnd
      target_Pointer.offsetX = e.offsetX
      target_Pointer.offsetY = e.offsetY
      target_Pointer.currentLocation[0] = e.offsetX
      target_Pointer.currentLocation[1] = e.offsetX
      target_Pointer.force = e.pressure

      if (buttonDown) {

        target_Pointer.pressed = 1
      }
      else if (buttonhUp) {

        target_Pointer.pressed = 0
      }

      viewCoordinate.calculateTransfomredTouchParams(target_Pointer.currentLocation, target_Pointer, wnd)
    }

    // Update priority
    if (isPointerChanged) {

      pointerEvent.activePointers = pointerEvent.pointers
        .filter(pointer => pointer.isActive())
        .sort((a, b) => {

          if (a.pressed != b.pressed) {

            return b.pressed - a.pressed
          }

          return a.ageCount - b.ageCount
        })

        for (const pointer of pointerEvent.activePointers) {

          pointer.ageCount++
        }

      // console.debug(pointerEvent.activePointers)
    }

    //console.debug(e.offsetX.toFixed(2) + ',' + e.offsetY.toFixed(2) + '  ' + pointerEvent.offsetX.toFixed(2) + ',' + this.pointerEvent.offsetY.toFixed(2))

    // let text = ''
    // for (let pointer of pointerEvent.activePointers) {
    //   text += `(${pointer.identifier} ${pointer.offsetX} ${pointer.offsetY} ${pointer.pressed} ${pointer.force} ${pointer.ageOrderAsc})`
    // }
    // console.debug(text)
  }

  getWheelInfo(pointerEvent: ViewPointerEvent, e: MouseEvent) {

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

    pointerEvent.wheelDelta = wheelDelta
  }

  handleDoubleClick(pointerEvent: ViewPointerEvent, offsetX: float, offsetY: float): boolean {

    if (pointerEvent.clickCount == 0) {

      pointerEvent.clickCount++
      pointerEvent.lastClickedOffset[0] = offsetX
      pointerEvent.lastClickedOffset[1] = offsetY

      setTimeout(() => {
        pointerEvent.clickCount = 0
      }, 350)

      return false
    }
    else {

      pointerEvent.clickCount = 0

      if (Math.pow(offsetX - pointerEvent.lastClickedOffset[0], 2)
        + Math.pow(offsetY - pointerEvent.lastClickedOffset[1], 2) < 9.0) {

        return true
      }
      else {

        return false
      }
    }
  }

  startMouseDragging(pointerEvent: ViewPointerEvent) {

    pointerEvent.isMouseDragging = true

    vec3.copy(pointerEvent.mouseDownLocation, pointerEvent.location)
    vec3.set(pointerEvent.mouseMovedVector, 0.0, 0.0, 0.0)

    vec3.set(pointerEvent.mouseDownOffset, pointerEvent.offsetX, pointerEvent.offsetY, 0.0)
    vec3.set(pointerEvent.mouseMovedOffset, 0.0, 0.0, 0.0)
  }

  processMouseDragging(pointerEvent: ViewPointerEvent) {

    if (!pointerEvent.isMouseDragging) {

      return
    }

    vec3.subtract(pointerEvent.mouseMovedVector, pointerEvent.mouseDownLocation, pointerEvent.location)

    vec3.set(this.tempVec3, pointerEvent.offsetX, pointerEvent.offsetY, 0.0)
    vec3.subtract(pointerEvent.mouseMovedOffset, pointerEvent.mouseDownOffset, this.tempVec3)
  }

  endMouseDragging(pointerEvent: ViewPointerEvent) {

    // console.debug(`endMouseDragging`)

    pointerEvent.isMouseDragging = false
  }
}
