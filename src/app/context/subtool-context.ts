import {
  AutoFillLayer, DocumentData, GroupLayer, ImageFileReferenceLayer, Layer, PosingLayer,
  PosingModel, VectorStrokeGroupModifyFlagID, VectorLayer, VectorStrokeModifyFlagID, VectorStroke, VectorStrokeGroup, LayerTypeID, VectorLayerGeometry, VectorLayerGeometryTypeID
} from '../document-data'
import { HierarchicalLayerInfo, LayerLogic } from '../document-logic'
import { float, RectangleArea } from '../common-logics'
import { BrushParameterID, BrushTypeID, EditModeID, OperationUnitID, PointerParameterID, PointerTypeID, SubToolID } from '../tool'
import { OpenFileDialogTargetID } from "../ui"
import { ShortcutCommandID } from '../user-setting'
import { ViewKeyframeLayer } from '../view'
import { DocumentContext } from './document-context'

export interface SubToolContext_AppMain_Interface {

  updateLayerStructure(): void
  collectVectorViewKeyframeLayers(): ViewKeyframeLayer[]
  collectVectorViewKeyframeLayersForEdit(): ViewKeyframeLayer[]
  startLoadingDocumentResourcesProcess(document: DocumentData)
  setLazyUpdateNeeded(): void
  setPostUpdateNeeded(): void
  openFileDialog(targetID: OpenFileDialogTargetID): void
  getPosingModelByName(name: string): PosingModel
  setOperatorCursorLocationToMouse(): void
  setRedrawDrawPathForLayer(layer: Layer): void
}

export interface SubToolContext_AppDocument_Interface {

  getLayerBaseName(layerType: LayerTypeID): string
  getNewLayerName(layerType: LayerTypeID, isForDefaultDocument?: boolean): string
}

export interface SubToolContext_AppTool_Interface {

  setOperationUnit(operationUnitID: OperationUnitID): void
  updateOperationOriginByRectangleArea(rectangleArea: RectangleArea): void
  updateOperationOriginByPoints(points: { location: Vec3 }[]): void
  changeCurrentSubToolForSubtoolID(subtoolID: SubToolID): void
  selectLayer(layer: Layer, toggleSelection?: boolean, delsect?: boolean): void
  startModalTool(subtoolID: SubToolID): void
  endModalTool(): void
  cancelModalTool(): void
  isModalToolRunning(): boolean
  executeToggleSelection(): boolean
  executeClearSelection(): boolean
  visualHittestToStrokes(location: Vec3, minDistance: float): boolean
}

export interface SubToolContext_ShortcutKey_Interface {

  getCommandIDFromKeyInput(key: string, shiftKey: boolean, ctrlKey: boolean, altKey: boolean): ShortcutCommandID
}

export class SubToolContext {

  private _docContext: DocumentContext = null
  private _appMain: SubToolContext_AppMain_Interface = null
  private _appDocument: SubToolContext_AppDocument_Interface = null
  private _appTool: SubToolContext_AppTool_Interface = null
  private _mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0)

  get main() { return this._appMain }
  get tool() { return this._appTool }
  get document() { return this._appDocument }

  get documentData() { return this._docContext.documentData }
  get documentFilePath() { return this._docContext.documentFilePath }
  get mainWindow() { return this._docContext.mainWindow }
  get drawStyle() { return this._docContext.drawStyle }
  get commandHistory() { return this._docContext.commandHistory }
  get operatorCursor() { return this._docContext.operatorCursor }
  get clipboard() { return this._docContext.clipboard }
  get posing3DView() { return this._docContext.posing3DView }
  get posing3DLogic() { return this._docContext.posing3DLogic }

  get operationUnitID() { return this._docContext.operationUnitID }
  get currentSubtoolID() { return this._docContext.subtoolID }
  get drawLineBaseWidth() { return this._docContext.currentBrushParameter.baseSize }
  get drawLineMinWidth() { return this._docContext.currentBrushParameter.minSize }

  get toolBaseViewRadius() {

    if (this._docContext.currentPointerParameter.parameterID != PointerParameterID.none) {

      return this.getViewScaledLength(this._docContext.currentPointerParameter.baseSize)
    }
    else {

      return 0.0
    }
  }

  get brushBaseSize() {

    if (this._docContext.currentBrushParameter.parameterID != BrushParameterID.none) {

      return this._docContext.currentBrushParameter.baseSize
    }
    else {

      return 0.0
    }
  }

  get touchViewRadius() {
    return this.getViewScaledLength(this._docContext.defaultTouchSize)
  }

  get currentLayer() { return this._docContext.currentLayer }
  get currentVectorLayer() { return this._docContext.currentVectorLayer }
  get currentAutoFillLayer() { return this._docContext.currentAutoFillLayer }
  get currentPosingLayer() { return this._docContext.currentPosingLayer }
  get currentPosingModel() { return this._docContext.currentPosingModel }
  get currentPosingData() { return this._docContext.currentPosingData }
  get currentImageFileReferenceLayer() { return this._docContext.currentImageFileReferenceLayer }

  get currentVectorLayerKeyframe() { return this._docContext.currentVectorLayerKeyframe }
  get currentVectorLayerGeometry() { return this._docContext.currentVectorLayerGeometry }

  get currentTimeFrame() { return this._docContext.documentData.animationSettingData.currentTimeFrame }

  get activeVectorGroup(): VectorStrokeGroup | null {

    if (this._docContext.activeVectorGroup != null
      && this._docContext.activeVectorGroup.runtime.modifyFlag != VectorStrokeGroupModifyFlagID.delete) {

        return this._docContext.activeVectorGroup
    }
    else {

      return null
    }
  }

  get activeVectorLine(): VectorStroke | null {

    if (this._docContext.activeVectorLine != null
      && this._docContext.activeVectorLine.runtime.modifyFlag != VectorStrokeModifyFlagID.delete) {

      return this._docContext.activeVectorLine
    }
    else {

      return null
    }
  }

  get mouseCursorLocation() { return this._mouseCursorLocation }

  constructor(
    docContext: DocumentContext,
    appMain: SubToolContext_AppMain_Interface,
    appDocument: SubToolContext_AppDocument_Interface,
    appTool: SubToolContext_AppTool_Interface
  ) {

    this._docContext = docContext
    this._appMain = appMain
    this._appDocument = appDocument
    this._appTool = appTool
  }

  updateContext() {

    vec3.copy(this.mouseCursorLocation, this._docContext.mouseCursorLocation)
  }

  setRedrawHeaderWindow() {

    this._docContext.redrawHeaderWindow = true
  }

  setRedrawMainWindow() {

    this._docContext.redrawMainWindow = true
    this._docContext.redrawCurrentLayer = false
  }

  setRedrawCurrentLayer() {

    if (!this._docContext.redrawMainWindow) {

      this._docContext.redrawCurrentLayer = true
    }

    this._docContext.redrawMainWindow = true
  }

  setRedrawEditorWindow() {

    this._docContext.redrawEditorWindow = true
  }

  setRedrawMainWindowEditorWindow() {

    this.setRedrawMainWindow()
    this.setRedrawEditorWindow()
    this.setRedrawWebGLWindow()
  }

  setRedrawLayerWindow() {

    this._docContext.redrawLayerWindow = true
    this._docContext.redrawPaletteSelectorWindow = true
    this._docContext.redrawColorMixerWindow = true
  }

  setRedrawPaletteWindow() {

    this._docContext.redrawPaletteSelectorWindow = true
    this._docContext.redrawColorMixerWindow = true
  }

  updateLayerStructure() {

    this._appMain.updateLayerStructure()
    this.setRedrawLayerWindow()
    this.setRedrawTimeLineWindow()
    this.setRedrawMainWindowEditorWindow()
  }

  setRedrawRibbonUI() {

    this._docContext.redrawRibbonUI = true
  }

  setRedrawTimeLineWindow() {

    this._docContext.redrawTimeLineWindow = true
  }

  setRedrawPalleteSelectorWindow() {

    this._docContext.redrawPaletteSelectorWindow = true
  }

  setRedrawColorMixerWindow() {

    this._docContext.redrawColorMixerWindow = true
  }

  setRedrawWebGLWindow() {

    this._docContext.redrawWebGLWindow = true
  }

  setRedrawAllWindows() {

    this.setRedrawMainWindowEditorWindow()
    this.setRedrawRibbonUI()
    this.setRedrawLayerWindow()
    this.setRedrawTimeLineWindow()
    this.setRedrawPalleteSelectorWindow()
    this.setRedrawWebGLWindow()
  }

  setRedrawWindowsForCurrentToolChanging() {

    this.setRedrawHeaderWindow()
    this.setRedrawMainWindowEditorWindow()
    this.setRedrawRibbonUI()
}

  setRedrawWindowsForCurrentLayerChanging() {

    this.setRedrawRibbonUI()
    this.setRedrawLayerWindow()
    this.setRedrawTimeLineWindow()
  }

  setRedrawWindowsForLayerPropertyChanging() {

    this.setRedrawMainWindowEditorWindow()
    this.setRedrawRibbonUI()
  }

  setRedrawWindowsForLayerColorChanging() {

    this.setRedrawMainWindowEditorWindow()
    this.setRedrawRibbonUI()
    this.setRedrawPalleteSelectorWindow()
    this.setRedrawColorMixerWindow()
    this.setRedrawLayerWindow()
  }

  isAnyModifierKeyPressing(): boolean {

    return (this._docContext.shiftKey || this._docContext.altKey || this._docContext.ctrlKey)
  }

  isShiftKeyPressing(): boolean {

    return (this._docContext.shiftKey)
  }

  isCtrlKeyPressing(): boolean {

    return (this._docContext.ctrlKey)
  }

  isAltKeyPressing(): boolean {

    return (this._docContext.altKey)
  }

  isDrawMode() {

    return (this._docContext.editMode == EditModeID.drawMode)
  }

  isEditMode() {

    return (this._docContext.editMode == EditModeID.editMode)
  }

  isCurrentLayerStrokeDrawableLayer(): boolean {

    return (
      VectorLayer.isVectorLayer(this.currentLayer)
      && Layer.isVisible(this.currentLayer)
    )
  }

  isCurrentLayerEditbaleLayer(): boolean {

    return Layer.isEditTarget(this.currentLayer) && (
      VectorLayer.isVectorLayer(this.currentLayer)
      || GroupLayer.isGroupLayer(this.currentLayer)
    )
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

    return this._docContext.needsDrawOperatorCursor
  }

  unsetCurrentLayer() {

    this._docContext.unsetCurrentLayer()
  }

  setActiveVectorStroke(line: VectorStroke, group: VectorStrokeGroup, geometry: VectorLayerGeometry) {

    if (!group) {
      throw new Error('ERROR 0020:Needs group value. If to reset active line, use unsetAcrtiveVectorLine.')
    }

    this._docContext.activeVectorLine = line
    this._docContext.activeVectorGroup = group
    this._docContext.activeVectorGeometry = geometry
  }

  unsetAcrtiveVectorStrokeAndGroup() {

    this._docContext.activeVectorGeometry = null
    this._docContext.activeVectorGroup = null
    this._docContext.activeVectorLine = null
  }

  getOperationOriginLocation(): Vec3 {

    return this._docContext.getOperationOriginLocation()
  }

  getViewScaledLength(length: float) {

    return this._docContext.mainWindow.getViewScaledLength(length)
  }

  getViewScaledResamplingUnitLengthForBrush() {

    let target_brushType: BrushTypeID = BrushTypeID.none

    if (this._docContext.activeVectorGeometry != null) {

      if (VectorLayerGeometry.isStrokeDraw(this._docContext.activeVectorGeometry)) {

        target_brushType = BrushTypeID.solidBrushStroke
      }
      else {

        target_brushType = BrushTypeID.radialBrush
      }
    }
    else {

      target_brushType = this._docContext.currentBrushParameter.brushType
    }

    let resamplingUnitLength = 0.0

    switch (target_brushType) {

      case BrushTypeID.solidBrushStroke:

          resamplingUnitLength = this.getViewScaledLength(this._docContext.resamplingUnitLengthForSolidBrush)

          if (resamplingUnitLength < this._docContext.resamplingUnitLengthForSolidBrushMin) {
            resamplingUnitLength = this._docContext.resamplingUnitLengthForSolidBrushMin
          }
        break

      case BrushTypeID.radialBrush:
      case BrushTypeID.bitmapBrush:
      case BrushTypeID.none:
        {
          resamplingUnitLength += this.drawLineBaseWidth * this._docContext.currentBrushParameter.stepRate

          if (resamplingUnitLength < this._docContext.resamplingUnitMinLengthForPointBrush) {
            resamplingUnitLength = this._docContext.resamplingUnitMinLengthForPointBrush
          }
        }
        break
    }

    return resamplingUnitLength
  }

  getViewScaledResamplingUnitLengthForEdit() {

    const recomendedSize = this._docContext.resamplingUnitMinLengthForEdit

    let resamplingUnitLength = this.getViewScaledLength(recomendedSize)

    if (resamplingUnitLength < recomendedSize) {
      resamplingUnitLength = recomendedSize
    }

    return resamplingUnitLength
  }

  collectHierarchicalLayerInfos(): HierarchicalLayerInfo[] {

    const layerInfos: HierarchicalLayerInfo[] = []
    LayerLogic.collectHierarchicalLayerInfoRecursive(layerInfos, this.documentData.rootLayer)

    return layerInfos
  }
}
