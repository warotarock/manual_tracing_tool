import { int } from '../logics/conversion'
import { InputSideID } from '../document_data'
import { ImageResource } from '../posing3d/posing3d_view'
import { SubToolContext } from '../context/subtool_context'
import { SubToolDrawingContext } from '../context/subtool_drawing_context'
import { ToolPointerEvent } from './tool_pointer_event'
import { ToolKeyboardEvent } from './tool_keyboard_event'

export enum SubToolID {

  none = 0,

  drawLine,
  scratchLine,
  extrudeLine,
  overWriteLineWidth,
  scratchLineWidth,
  deletePointBrush,
  editLinePointWidth_BrushSelect,

  editModeMain,
  lineBrushSelect,
  lineSegmentBrushSelect,
  linePointBrushSelect,
  resampleSegment,

  edit_GrabMove,
  edit_Rotate,
  edit_Scale,

  editDocumentFrame,

  autoFill,

  image_GrabMove,
  image_Rotate,
  image_Scale,

  p3d_locateHead,
  p3d_rotateHead,
  p3d_locateBody,
  p3d_locateHips,
  p3d_locateLeftShoulder,
  p3d_locateLeftArm1,
  p3d_locateLeftArm2,
  p3d_locateRightShoulder,
  p3d_locateRightArm1,
  p3d_locateRightArm2,
  p3d_locateLeftLeg1,
  p3d_locateLeftLeg2,
  p3d_locateRightLeg1,
  p3d_locateRightLeg2,
  p3d_twistHead,
}

export class SubTool {

  helpText = '' // @virtual
  isEditTool = false // @virtual

  subtoolID: SubToolID
  toolBarImage: ImageResource = null
  toolBarImageIndex = 0

  inputOptionButtonCount = 0

  isAvailable(_ctx: SubToolContext): boolean { // @virtual

    return true
  }

  getOptionButtonState(_buttonIndex: int, _ctx: SubToolContext): InputSideID { // @virtual

    return InputSideID.none
  }

  optionButton_Click(_buttonIndex: int, _ctx: SubToolContext): boolean { // @virtual

    return false
  }

  mouseDown(_e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual
  }

  mouseMove(_e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual
  }

  mouseUp(_e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual
  }

  keydown(_e: ToolKeyboardEvent, _ctx: SubToolContext): boolean { // @virtual

    return false
  }

  onActivated(_ctx: SubToolContext) { // @virtual
  }

  onDrawEditor(_ctx: SubToolContext, _drawing: SubToolDrawingContext) { // @virtual
  }

  toolWindowItemClick(_ctx: SubToolContext) { // @virtual
  }

  toolWindowItemDoubleClick(_e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual
  }
}

export class Tool_None extends SubTool {

}

export class ModalToolBase extends SubTool {

  prepareModal(_e: ToolPointerEvent, _ctx: SubToolContext): boolean { // @virtual

    return true
  }

  startModal(ctx: SubToolContext) { // @virtual

    ctx.setRedrawEditorWindow()
  }

  endModal(ctx: SubToolContext) { // @virtual

    ctx.setRedrawEditorWindow()
  }

  cancelModal(ctx: SubToolContext) { // @virtual

    ctx.setRedrawMainWindowEditorWindow()
  }
}
