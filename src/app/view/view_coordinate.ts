import { float } from '../logics/conversion'
import { PointerInputWindow } from './pointer_input'
import { ViewPointerEvent, ViewPointerEventPointer } from './view_pointer_event'

export class ViewCoordinateLogic {

  tempVec3 = vec3.create()

  private calculateTransfomredLocation(result: Vec3, wnd: PointerInputWindow, x: float, y: float) {

    vec3.set(this.tempVec3, x, y, 0.0)
    vec3.transformMat4(result, this.tempVec3, wnd.invView2DMatrix)
  }

  calculateTransfomredMouseParams(result: Vec3, e: ViewPointerEvent, wnd: PointerInputWindow) {

    this.calculateTransfomredLocation(
      e.location,
      wnd,
      e.offsetX,
      e.offsetY
    )

    vec3.copy(result, e.location)
  }

  calculateTransfomredTouchParams(result: Vec3, e: ViewPointerEventPointer, wnd: PointerInputWindow) {

    this.calculateTransfomredLocation(
      result,
      wnd,
      e.currentLocation[0],
      e.currentLocation[1]
    )
  }
}
