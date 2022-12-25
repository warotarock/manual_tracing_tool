import { float } from "../common-logics"
import { PointerInputWindow, ViewCanvasWindow, ViewPointerEvent, ViewPointerEventPointer } from "./view-pointer_event"

export class ViewCoordinateLogic {

  static tempVec3 = vec3.create()

  private static calculateTransfomredLocation(result: Vec3, wnd: ViewCanvasWindow, x: float, y: float) {

    vec3.set(this.tempVec3, x, y, 0.0)
    vec3.transformMat4(result, this.tempVec3, wnd.invView2DMatrix)
  }

  static calculateTransfomredMouseParams(result: Vec3, e: ViewPointerEvent, wnd: PointerInputWindow) {

    this.calculateTransfomredLocation(
      e.location,
      wnd,
      e.offsetX,
      e.offsetY
    )

    vec3.copy(result, e.location)
  }

  static calculateTransfomredTouchParams(result: Vec3, e: ViewPointerEventPointer, wnd: ViewCanvasWindow) {

    this.calculateTransfomredLocation(
      result,
      wnd,
      e.currentLocation[0],
      e.currentLocation[1]
    )
  }
}
