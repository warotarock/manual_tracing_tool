import { CommandHistory } from "../command"
import {
  AutoFillLayer, DocumentData, DrawLineTypeID, FillAreaTypeID, FillDrawable, ImageFileReferenceLayer, Layer,
  PosingData, PosingLayer, PosingModel, StrokeDrawable, VectorLayerGeometry, VectorLayer, VectorStroke, VectorStrokeGroup, VectorLayerKeyframe
} from '../document-data'
import { ToolDrawingStyle } from "../document-drawing"
import { DrawPathContext } from '../document-drawing/draw-path'
import { OperatorCursor } from '../editor'
import { Posing3DLogic, Posing3DView } from '../posing3d'
import { CanvasWindow } from '../render'
import {
  BrushParameter, EditModeID, MainToolID, MainToolTab, MainToolTabID, OperationOriginTypeID, OperationUnitID, PaintParameter, PointerParameter,
  SubToolID, SubToolParameter, ToolClipboard
} from '../tool'
import { ViewKeyframe, ViewLayerListItem } from '../view'

export class DocumentContext {

  drawStyle: ToolDrawingStyle = null
  commandHistory = new CommandHistory()

  documentData: DocumentData = null
  documentFilePath = ''
  clipboard = new ToolClipboard()

  mainWindow: CanvasWindow = null
  posing3DView: Posing3DView = null
  posing3DLogic: Posing3DLogic = null

  lazy_DrawPathContext: DrawPathContext = null
  drawCPUOnly = true

  editMode = EditModeID.drawMode
  mainToolID = MainToolID.none
  mainToolTabID = MainToolTabID.none
  mainToolTabs: MainToolTab[] = []
  subtoolID = SubToolID.none
  needsDrawOperatorCursor = false

  currentSubToolParameter: SubToolParameter = null
  currentBrushParameter: BrushParameter = null
  currentPointerParameter: PointerParameter = null
  currentPaintParameter: PaintParameter = { baseColor: vec4.fromValues(0.0, 0.0, 0.0, 1.0) }

  operationUnitID = OperationUnitID.stroke
  operatorCursor = new OperatorCursor()
  operationOriginTypeID = OperationOriginTypeID.medianCenter
  operationOriginLocation = vec3.fromValues(0.0, 0.0, 0.0)

  dragStartThresholdDistance = 5.0
  resamplingUnitLengthForSolidBrush = 10.0
  resamplingUnitLengthForSolidBrushMin = 0.001
  resamplingUnitMinLengthForPointBrush = 0.1
  resamplingUnitMinLengthForEdit = 7.0
  defaultTouchSize = 40.0

  mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0)

  currentLayer: Layer = null
  currentVectorLayer: VectorLayer = null
  currentVectorLayerKeyframe: VectorLayerKeyframe = null
  currentVectorLayerGeometry: VectorLayerGeometry = null
  currentPosingLayer: PosingLayer = null
  currentPosingModel: PosingModel = null
  currentPosingData: PosingData = null
  currentAutoFillLayer: AutoFillLayer = null
  currentImageFileReferenceLayer: ImageFileReferenceLayer = null

  currentStrokeDrawable: StrokeDrawable = null
  currentFillDrawable: FillDrawable = null

  activeVectorGeometry: VectorLayerGeometry = null
  activeVectorGroup: VectorStrokeGroup = null
  activeVectorLine: VectorStroke = null

  layerListItems: ViewLayerListItem[] = []
  keyframes: ViewKeyframe[] = null
  currentViewKeyframe: ViewKeyframe = null
  previousKeyframe: ViewKeyframe = null
  nextKeyframe: ViewKeyframe = null

  redrawMainWindow = false
  redrawCurrentLayer = false
  redrawEditorWindow = false
  redrawLayerWindow = false
  redrawRibbonUI = false
  redrawTimeLineWindow = false
  redrawWebGLWindow = false
  redrawHeaderWindow = false
  redrawFooterWindow = false
  redrawPaletteSelectorWindow = false
  redrawColorMixerWindow = false
  redrawColorMixerSample = false

  shiftKey = false
  altKey = false
  ctrlKey = false

  animationPlaying = false
  animationPlayingFPS = 24

  unsetCurrentLayer() {

    this.currentLayer = null
    this.currentVectorLayer = null
    this.currentVectorLayerKeyframe = null
    this.currentVectorLayerGeometry = null
    this.currentPosingLayer = null
    this.currentPosingModel = null
    this.currentPosingData = null
    this.currentAutoFillLayer = null
    this.currentImageFileReferenceLayer = null
    this.currentStrokeDrawable = null
    this.currentFillDrawable = null
    this.activeVectorGeometry = null
    this.activeVectorGroup = null
    this.activeVectorLine = null
  }

  getCurrentLayerLineColor(): Vec4 {

    let color: Vec4 = null

    if (this.currentStrokeDrawable != null) {

      if (this.currentStrokeDrawable.drawLineType == DrawLineTypeID.paletteColor) {

        color = this.documentData.paletteColors[this.currentStrokeDrawable.line_PaletteColorIndex].color
      }
      else {

        color = this.currentStrokeDrawable.layerColor
      }
    }

    return color
  }

  getCurrentLayerFillColor(): Vec4 {

    let color: Vec4 = null

    if (this.currentFillDrawable != null) {

      if (this.currentFillDrawable.fillAreaType == FillAreaTypeID.paletteColor) {

        color = this.documentData.paletteColors[this.currentFillDrawable.fill_PaletteColorIndex].color
      }
      else {

        color = this.currentFillDrawable.fillColor
      }
    }

    return color
  }

  getOperationOriginLocation(): Vec3 {

    if (this.operationOriginTypeID == OperationOriginTypeID.medianCenter) {

      return this.operationOriginLocation
    }
    else {

      return this.operatorCursor.location
    }
  }
}
