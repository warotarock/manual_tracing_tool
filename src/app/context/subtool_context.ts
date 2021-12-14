import { CommandHistory } from "../command/command_history"
import { float } from '../logics/conversion'
import { DocumentData, Layer, VectorLayer, VectorGeometry, VectorStrokeGroup, VectorStroke,
  PosingLayer, PosingModel, PosingData, ImageFileReferenceLayer, VectorLineModifyFlagID,
  AutoFillLayer, GroupLayer, HierarchicalLayerInfo } from '../document_data'
import { EditModeID, OperationUnitID } from '../tool/constants'
import { ToolDrawingStyle } from "../drawing/drawing_style"
import { Posing3DLogic } from '../posing3d/posing3d_logic'
import { Posing3DView } from '../posing3d/posing3d_view'
import { CanvasWindow } from '../render/render2d'
import { OpenFileDialogTargetID } from '../dialog/open_file_dialog'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { DocumentContext } from './document_context'
import { ModalToolBase, SubToolID } from '../tool/sub_tool'
import { OperatorCursor } from '../editor/operator_cursor'
import { ToolClipboard } from '../tool/clip_board'

export interface SubToolContext_Main_Interface {

  setCurrentOperationUnitID(operationUnitID: OperationUnitID)
  setCurrentLayer(layer: Layer)
  updateLayerStructure()
  collectVectorViewKeyframeLayers(): ViewKeyframeLayer[]
  collectVectorViewKeyframeLayersForEdit(): ViewKeyframeLayer[]
  startLoadingDocumentResourcesProcess(document: DocumentData)
  openFileDialog(targetID: OpenFileDialogTargetID)
  startModalTool(subtoolID: SubToolID)
  endModalTool()
  cancelModalTool()
  isModalToolRunning(): boolean
  getPosingModelByName(name: string): PosingModel
}

export class SubToolContext {

  private main: SubToolContext_Main_Interface = null
  private docContext: DocumentContext = null

  drawStyle: ToolDrawingStyle = null

  editMode = EditModeID.drawMode

  operationUnitID = OperationUnitID.linePoint

  commandHistory: CommandHistory = null

  operatorCursor: OperatorCursor = null

  document: DocumentData = null
  clipboard: ToolClipboard = null

  get drawLineBaseWidth() { return this.docContext.drawLineBaseWidth }
  get drawLineMinWidth() { return this.docContext.drawLineMinWidth }
  get eraserRadius() { return this.getViewScaledLength(this.docContext.eraserLineBaseWidth) }
  get mouseCursorRadius() { return this.docContext.mouseCursorRadius }
  get mouseCursorViewRadius() { return this.getViewScaledLength(this.docContext.mouseCursorRadius) }

  mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0)

  get currentLayer() { return this.docContext.currentLayer }
  get currentVectorLayer() { return this.docContext.currentVectorLayer }
  get currentVectorGeometry() { return this.docContext.currentVectorGeometry }
  get currentVectorGroup() { return this.docContext.currentVectorGroup }

  get currentVectorLine() {

    if (this.docContext.currentVectorLine != null
      && this.docContext.currentVectorLine.modifyFlag == VectorLineModifyFlagID.delete) {

      return null
    }

    return this.docContext.currentVectorLine
  }

  get currentAutoFillLayer() { return this.docContext.currentAutoFillLayer }

  get currentPosingLayer() { return this.docContext.currentPosingLayer }
  get currentPosingModel() { return this.docContext.currentPosingModel }
  get currentPosingData() { return this.docContext.currentPosingData }

  currentImageFileReferenceLayer: ImageFileReferenceLayer = null

  mainWindow: CanvasWindow = null

  posing3DView: Posing3DView = null
  posing3DLogic: Posing3DLogic = null

  viewScale = 0.0

  constructor(main: SubToolContext_Main_Interface, docContext: DocumentContext) {

    this.main = main
    this.docContext = docContext
  }

  updateContext() {

    this.editMode = this.docContext.editMode

    this.operationUnitID = this.docContext.operationUnitID

    this.commandHistory = this.docContext.commandHistory

    this.operatorCursor = this.docContext.operatorCursor

    this.document = this.docContext.document
    this.clipboard = this.docContext.clipboard

    this.currentImageFileReferenceLayer = this.docContext.currentImageFileReferenceLayer

    this.mainWindow = this.docContext.mainWindow
    this.posing3DView = this.docContext.posing3DView
    this.posing3DLogic = this.docContext.posing3DLogic

    this.viewScale = this.docContext.mainWindow.viewScale
    this.drawStyle = this.docContext.drawStyle
  }

  setRedrawHeaderWindow() {

    this.docContext.redrawHeaderWindow = true
  }

  setRedrawMainWindow() {

    this.docContext.redrawMainWindow = true
    this.docContext.redrawCurrentLayer = false
  }

  setRedrawCurrentLayer() {

    if (!this.docContext.redrawMainWindow) {

      this.docContext.redrawCurrentLayer = true
    }

    this.docContext.redrawMainWindow = true
  }

  setRedrawEditorWindow() {

    this.docContext.redrawEditorWindow = true
  }

  setRedrawMainWindowEditorWindow() {

    this.setRedrawMainWindow()
    this.setRedrawEditorWindow()
    this.setRedrawWebGLWindow()
  }

  setRedrawLayerWindow() {

    this.docContext.redrawLayerWindow = true
    this.docContext.redrawPaletteSelectorWindow = true
    this.docContext.redrawColorMixerWindow = true
  }

  setRedrawPaletteWindow() {

    this.docContext.redrawPaletteSelectorWindow = true
    this.docContext.redrawColorMixerWindow = true
  }

  updateLayerStructure() {

    this.main.updateLayerStructure()
    this.setRedrawLayerWindow()
    this.setRedrawTimeLineWindow()
    this.setRedrawMainWindowEditorWindow()
  }

  setRedrawRibbonUI() {

    this.docContext.redrawRibbonUI = true
  }

  setRedrawTimeLineWindow() {

    this.docContext.redrawTimeLineWindow = true
  }

  setRedrawPalleteSelectorWindow() {

    this.docContext.redrawPaletteSelectorWindow = true
  }

  setRedrawColorMixerWindow() {

    this.docContext.redrawColorMixerWindow = true
  }

  setRedrawWebGLWindow() {

    this.docContext.redrawWebGLWindow = true
  }

  setRedrawAllWindows() {

    this.setRedrawMainWindowEditorWindow()
    this.setRedrawRibbonUI()
    this.setRedrawLayerWindow()
    this.setRedrawTimeLineWindow()
    this.setRedrawPalleteSelectorWindow()
    this.setRedrawWebGLWindow()
  }

  setLazyRedraw() {

    this.docContext.lazy_DrawPathContext.lazyProcess.setLazyProcess()
  }

  isAnyModifierKeyPressing(): boolean {

    return (this.docContext.shiftKey || this.docContext.altKey || this.docContext.ctrlKey)
  }

  isShiftKeyPressing(): boolean {

    return (this.docContext.shiftKey)
  }

  isCtrlKeyPressing(): boolean {

    return (this.docContext.ctrlKey)
  }

  isAltKeyPressing(): boolean {

    return (this.docContext.altKey)
  }

  isDrawMode() {

    return (this.docContext.editMode == EditModeID.drawMode)
  }

  isEditMode() {

    return (this.docContext.editMode == EditModeID.editMode)
  }

  isCurrentLayerVectorLayer(): boolean {

    return VectorLayer.isVectorLayer(this.currentLayer) && Layer.isVisible(this.currentLayer)
  }

  isCurrentLayerAutoFillLayer(): boolean {

    return AutoFillLayer.isAutoFillLayer(this.currentLayer) && Layer.isVisible(this.currentLayer)
  }

  isCurrentLayerPosingLayer(): boolean {

    return PosingLayer.isPosingLayer(this.currentLayer) && Layer.isVisible(this.currentLayer)
  }

  isCurrentLayerImageFileReferenceLayer(): boolean {

    return ImageFileReferenceLayer.isImageFileReferenceLayer(this.currentLayer) && Layer.isVisible(this.currentLayer)
  }

  isCurrentLayerGroupLayer(): boolean {

    return GroupLayer.isGroupLayer(this.currentLayer) && Layer.isVisible(this.currentLayer)
  }

  needsDrawOperatorCursor(): boolean {

    return (this.isEditMode() || this.docContext.needsDrawOperatorCursor)
  }

  setCurrentOperationUnitID(operationUnitID: OperationUnitID) {

    this.main.setCurrentOperationUnitID(operationUnitID)
  }

  setCurrentLayer(layer: Layer) {

    this.main.setCurrentLayer(layer)
  }

  setCurrentVectorLine(line: VectorStroke, group: VectorStrokeGroup) {

    this.docContext.currentVectorLine = line
    this.docContext.currentVectorGroup = group
  }

  startModalTool(subtoolID: SubToolID) {

    this.main.startModalTool(subtoolID)
  }

  endModalTool() {

    this.main.endModalTool()
  }

  cancelModalTool() {

    this.main.cancelModalTool()
  }

  isModalToolRunning(): boolean {

    return this.main.isModalToolRunning()
  }

  openFileDialog(targetID: OpenFileDialogTargetID) {

    this.main.openFileDialog(targetID)
  }

  startLoadingCurrentDocumentResources() {

    this.main.startLoadingDocumentResourcesProcess(this.docContext.document)
  }

  getViewScaledLength(length: float) {

    return length / this.viewScale
  }

  getViewScaledDrawLineUnitLength() {

    let resamplingUnitLength = this.getViewScaledLength(this.docContext.resamplingUnitLength)

    if (resamplingUnitLength > this.docContext.resamplingUnitLength) {
      resamplingUnitLength = this.docContext.resamplingUnitLength
    }

    return resamplingUnitLength
  }

  collectVectorViewKeyframeLayers(): ViewKeyframeLayer[] {

    return this.main.collectVectorViewKeyframeLayers()
  }

  collectVectorViewKeyframeLayersForEdit(): ViewKeyframeLayer[] {

    return this.main.collectVectorViewKeyframeLayersForEdit()
  }

  collectHierarchicalLayerInfos(): HierarchicalLayerInfo[] {

    const layerInfos: HierarchicalLayerInfo[] = []
    Layer.collectHierarchicalLayerInfoRecursive(layerInfos, this.document.rootLayer)

    return layerInfos
  }

  getPosingModelByName(name: string): PosingModel {

    return this.main.getPosingModelByName(name)
  }
}
