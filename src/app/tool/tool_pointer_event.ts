import { float } from '../logics/conversion'

export interface ToolPointerEvent {

  readonly location: Vec3
  readonly offsetX: float
  readonly offsetY: float

  isLeftButtonPressing(): boolean
  isRightButtonPressing(): boolean
  isCenterButtonPressing(): boolean
  isLeftButtonReleased(): boolean
  isRightButtonReleased(): boolean
  isCenterButtonReleased(): boolean
}
