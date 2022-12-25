import { SubToolContext, SubToolDrawingContext } from '../context'
import { InputSideID } from '../document-data'
import { float, int } from '../common-logics'
import { ImageResource } from '../posing3d'
import { ShortcutCommandID } from '../user-setting'
import { ToolPointerEvent } from './tool-pointer-event'

export enum SubToolID {

  none = 0,

  noOperation,

  drawLine,
  scratchLine,
  extrudeLine,
  overWriteLineWidth,
  scratchLineWidth,
  deletePointBrush,
  editLinePointWidth_BrushSelect,

  drawPointBrush,
  pointBrush_extrudeLine,

  editModeMain,
  locateOperatorCursor,
  brushSelect,
  resampleSegment,

  edit_GrabMove,
  edit_Rotate,
  edit_Scale,

  editDocumentFrame,

  addAutoFillPoint,
  deleteAutoFillPoint,

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

export enum PointerTypeID {

  none = 0,
  brush = 1,
  circularRange = 2,
  brushWithCircularRange = 3,
}

export enum PointerParameterID {

  none = 0,
  extrudeLine = 1,
  eracer = 2,
  scratchLine = 3,
  setLineWidth = 4,
  scratchLineWidth = 5,
  brushSelect = 6,
}

export interface PointerParameter {

  parameterID: PointerParameterID
  baseSize: float
  minSize: float
}

export enum BrushParameterID {

  none = 0,
  solidStroke = 1,
  pointBrush = 2,
}

export enum BrushTypeID {

  none = 0,
  solidBrushStroke = 1,
  radialBrush = 2,
  bitmapBrush = 3,
}

export interface BrushParameter {

  parameterID: BrushParameterID
  brushType: BrushTypeID
  baseSize: float
  minSize: float
  stepRate: float
}

export interface PaintParameter {

  baseColor: Vec4
}

export enum SubToolParameterID {

  none = 0,
  drawLine = 1,
  extrudeLine = 2,
  eracer = 3,
  scratchLine = 4,
  setLineWidth = 5,
  scratchLineWidth = 6,
  brushSelect = 7,
  drawPointBrush = 8,
  pointBrush_extrudeLine = 9,
}

export interface SubToolParameter {

  parameterID: SubToolParameterID
  pointerType: PointerTypeID
  pointerParameterID: PointerParameterID
  brushParameterID?: BrushParameterID
  pointer?: PointerParameter
  brush?: BrushParameter
}

export class SubTool {

  isEditTool = false // @virtual
  usesOperatorCursor = false // @virtual
  usesHitTestToSelect = false // @virtual
  helpText = '' // @virtual

  subtoolID = SubToolID.none
  subToolParameterID = SubToolParameterID.none
  subToolParameter: SubToolParameter = null
  toolBarImage: ImageResource = null
  toolBarImageIndex = 0
  inputOptionButtonCount = 0

  isAvailable(_ctx: SubToolContext): boolean { // @virtual

    return true
  }

  onActivated(_ctx: SubToolContext) { // @virtual
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

  keydown(_key: string, _commandID: ShortcutCommandID, _ctx: SubToolContext): boolean { // @virtual

    return false
  }

  onDrawEditor(_ctx: SubToolContext, _drawing: SubToolDrawingContext) { // @virtual
  }

  toolWindowItemClick(_ctx: SubToolContext) { // @virtual
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
