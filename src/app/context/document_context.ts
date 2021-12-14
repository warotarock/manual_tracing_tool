import { CommandHistory } from "../command/command_history"
import { DocumentData, Layer, VectorLayer, VectorGeometry, VectorStrokeGroup, VectorStroke,
  PosingLayer, PosingModel, PosingData, ImageFileReferenceLayer, DrawLineTypeID, FillAreaTypeID, AutoFillLayer, StrokeDrawable, FillDrawable } from '../document_data'
import { EditModeID, OperationUnitID } from '../tool/constants'
import { ToolDrawingStyle } from "../drawing/drawing_style"
import { Posing3DLogic } from '../posing3d/posing3d_logic'
import { Posing3DView } from '../posing3d/posing3d_view'
import { CanvasWindow } from '../render/render2d'
import { DrawPathContext } from '../drawing/draw_path'
import { MainToolID, MainToolTab, MainToolTabID } from '../tool/main_tool'
import { ViewKeyframe } from '../view/view_keyframe'
import { ViewLayerListItem } from '../view/view_layer_list'
import { OperatorCursor } from '../editor/operator_cursor'
import { ToolClipboard } from '../tool/clip_board'
import { SubToolID } from "../tool/sub_tool"

export class DocumentContext {

  drawStyle: ToolDrawingStyle = null
  commandHistory = new CommandHistory()

  document: DocumentData = null
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

  operationUnitID = OperationUnitID.line

  drawLineBaseWidth = 1.0
  drawLineMinWidth = 0.1
  eraserLineBaseWidth = 12.0
  mouseCursorRadius = 12.0

  resamplingUnitLength = 8.0

  operatorCursor = new OperatorCursor()

  currentLayer: Layer = null

  currentVectorLayer: VectorLayer = null
  currentVectorGeometry: VectorGeometry = null
  currentVectorGroup: VectorStrokeGroup = null
  currentVectorLine: VectorStroke = null

  currentPosingLayer: PosingLayer = null
  currentPosingModel: PosingModel = null
  currentPosingData: PosingData = null

  currentAutoFillLayer: AutoFillLayer = null

  currentImageFileReferenceLayer: ImageFileReferenceLayer = null

  currentStrokeDrawable: StrokeDrawable = null
  currentFillDrawable: FillDrawable = null

  items: ViewLayerListItem[] = []
  keyframes: ViewKeyframe[] = null

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

  shiftKey = false
  altKey = false
  ctrlKey = false

  animationPlaying = false
  animationPlayingFPS = 24

  getCurrentLayerLineColor(): Vec4 {

    let color: Vec4 = null

    if (this.currentStrokeDrawable != null) {

      if (this.currentStrokeDrawable.drawLineType == DrawLineTypeID.paletteColor) {

        color = this.document.paletteColors[this.currentStrokeDrawable.line_PaletteColorIndex].color
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

        color = this.document.paletteColors[this.currentFillDrawable.fill_PaletteColorIndex].color
      }
      else {

        color = this.currentFillDrawable.fillColor
      }
    }

    return color
  }
}
