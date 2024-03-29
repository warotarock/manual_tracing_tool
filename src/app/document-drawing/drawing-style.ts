import { float } from "app/common-logics"

export class ToolDrawingStyle {

  windowBorderColor = vec4.fromValues(8 / 16, 8 / 16, 8 / 16, 1.0)
  windowBackgroundColor = vec4.fromValues(0xf6 / 255, 0xf6 / 255, 0xf8 / 255, 1.0)

  controlHoverColor = vec4.fromValues(0.91, 0.91, 0.91, 1.0) // = CSS $hoverBackground

  linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  sampledPointColor = vec4.fromValues(0.0, 0.5, 1.0, 0.7)
  extrutePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0)
  selectedVectorLineColor = vec4.fromValues(1.0, 0.5, 0.0, 0.8)
  selectedLineColorVisibilityAdjustThreshold1 = 0.07
  selectedLineColorVisibilityAdjustThreshold2 = 0.7
  selectedLineColorVisibilityAdjustHue = 0.1
  linePointVisualBrightnessAdjustRate = 0.4
  editModeOtherLayerAlphaAdjustRate = 0.3
  editorThinLineWidth = 1.5

  strokeConnectionInfoColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5)

  brushCursorCircleColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0)
  mouseCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0)
  operatorCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0)
  operatorCurosrLineDash = [2.0, 2.0]

  operationPanelButtonBorderColor = vec4.fromValues(14 / 16, 14 / 16, 14 / 16, 1.0)

  rulerHeight = 13.0
  rulerTextSize = 12.0
  rulerTextMargin = { x: 3.0, y: 2.0 }
  rulerLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0)
  rulerBackGroundColor = vec4.fromValues(0.8, 0.8, 0.8, 1.0)
  rulerDocumentAreaColor = vec4.fromValues(0.95, 0.95, 0.95, 1.0)

  documentFrameOutAreaColor = vec4.fromValues(0.0, 0.0, 0.0, 0.7)

  onionSkinForwardLineColor = vec4.fromValues(0.0, 0.5, 0.0, 0.6)
  onionSkinBackwardLineColor = vec4.fromValues(0.5, 0.0, 0.0, 0.6)

  modalToolSelectedAreaLineColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0)
  latticePointRadius = 4.0
  latticePointHitRadius = 10.0
  latticePointPadding = 8.0

  autoFillPointLineColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  autoFillPointEdgeColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0)

  paletteSelectorItemEdgeColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  paletteSelectorItemSelectedColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0)

  timeLineUnitFrameColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0)
  timeLineCurrentFrameColor = vec4.fromValues(0.2, 1.0, 0.2, 0.5)
  timeLineKeyFrameColor = vec4.fromValues(0.0, 0.0, 1.0, 0.1)
  timeLineLayerKeyFrameColor = vec4.fromValues(0.8, 0.8, 0.0, 1.0)
  timeLineOutOfLoopingColor = vec4.fromValues(0.0, 0.0, 0.0, 0.1)

  posing3DBoneGrayColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0)
  posing3DBoneHeadColor = vec4.fromValues(0.2, 0.2, 1.0, 1.0)
  posing3DBoneForwardColor = vec4.fromValues(0.2, 1.0, 0.2, 1.0)
  posing3DBoneInputCircleRadius = 15.0
  posing3DBoneInputCircleHitRadius = 1.8
  posing3DHelperGrayColor1 = vec4.fromValues(0.5, 0.5, 0.5, 1.0)
  posing3DHelperGrayColor2 = vec4.fromValues(0.5, 0.5, 0.5, 0.3)

  generalLinePointRadius = 2.0
  selectedLinePointRadius = 3.0
  viewZoomAdjustingSpeedRate = 0.2

  eyesSymmetryGuideColor = vec4.fromValues(0.0, 0.5, 1.0, 0.3)
}
