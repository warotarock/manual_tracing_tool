import { int, float, List } from 'base/conversion';
import {
  DocumentData,
  Layer,
  PosingModel, VectorLine, LinePoint, VectorLayerKeyframe,
  VectorGroup, VectorLayerGeometry, VectorLayer, PosingLayer, PosingData,
  ImageFileReferenceLayer, VectorLineModifyFlagID,
  LayerTypeID, DrawLineTypeID, FillAreaTypeID,
  InputSideID
} from 'base/data';
import { CommandHistory } from 'base/command';

import { CanvasWindow, CanvasRender } from 'renders/render2d';
import { Posing3DView, ImageResource } from 'posing3d/posing3d_view';
import { Posing3DLogic } from 'posing3d/posing3d_logic';
import { Platform } from "platform/platform";

export enum MainToolID {

  none = 0,
  drawLine = 1,
  posing = 2,
  imageReferenceLayer = 3,
  misc = 4,
  edit = 5
}

export enum DrawLineToolSubToolID {

  drawLine = 0,
  extrudeLine = 1,
  deletePointBrush = 2,
  editLinePointWidth_BrushSelect = 3,
  scratchLine = 4,
  overWriteLineWidth = 5,
  scratchLineWidth = 6
}

export enum EditModeSubToolID {

  mainEditTool = 0,
}

export enum ModalToolID {

  none = 0,
  grabMove = 1,
  rotate = 2,
  scale = 3,
  latticeMove = 4,
  countOfID = 5,
}

export enum Posing3DSubToolID {

  locateHead = 0,
  rotateHead = 1,
  locateBody = 2,
  rotateBody = 3,
  locateLeftShoulder = 4,
  locateLeftArm1 = 5,
  locateLeftArm2 = 6,
  locateRightShoulder = 7,
  locateRightArm1 = 8,
  locateRightArm2 = 9,
  locateLeftLeg1 = 10,
  locateLeftLeg2 = 11,
  locateRightLeg1 = 12,
  locateRightLeg2 = 13,
  twistHead = 14,
}

export enum EditModeID {

  editMode = 1,
  drawMode = 2
}

export enum OperationUnitID {

  none = 0,
  linePoint = 1,
  lineSegment = 2,
  line = 3,
  layer = 4,
  countOfID = 5
}

export enum OpenFileDialogTargetID {

  none,
  openDocument = 1,
  saveDocument = 2,
  imageFileReferenceLayerFilePath = 3
}

export interface MainEditor {

  setCurrentOperationUnitID(operationUnitID: OperationUnitID);
  setCurrentLayer(layer: Layer);
  setCurrentFrame(frame: int);
  updateLayerStructure();

  collectEditTargetViewKeyframeLayers(): List<ViewKeyframeLayer>;

  startLoadingDocumentResourcesProcess(document: DocumentData);

  openFileDialog(targetID: OpenFileDialogTargetID);
  openDocumentSettingDialog();

  startModalTool(modalTool: ModalToolBase);
  endModalTool();
  cancelModalTool();
  isModalToolRunning(): boolean;

  getPosingModelByName(name: string): PosingModel;
}

export interface MainEditorDrawer {

  drawMouseCursor();
  drawMouseCursorCircle(radius: float);
  drawEditorEditLineStroke(line: VectorLine);
  drawEditorVectorLineStroke(line: VectorLine, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean);
  drawEditorVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean);
  drawEditorVectorLinePoint(point: LinePoint, color: Vec4, useAdjustingLocation: boolean);
  drawEditorVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean);
}

export class ToolBaseWindow extends CanvasWindow {

  toolMouseEvent = new ToolMouseEvent();
  dragBeforeViewLocation = vec3.create();

  startMouseDragging() {

    this.toolMouseEvent.startMouseDragging();
    vec3.copy(this.dragBeforeViewLocation, this.viewLocation);
  }

  endMouseDragging() {

    this.toolMouseEvent.endMouseDragging();
  }
}

export class PickingWindow extends CanvasWindow {

  maxDepth = 4.0;
}

export class OperatorCursor {

  location = vec3.fromValues(0.0, 0.0, 0.0);
  radius = 15.0;
}

export enum LatticePointEditTypeID {

  none, horizontalOnly, verticalOnly, allDirection
}

export class LatticePoint {

  latticePointEditType = LatticePointEditTypeID.none;
  baseLocation = vec3.fromValues(0.0, 0.0, 0.0);
  location = vec3.fromValues(0.0, 0.0, 0.0);
}

export class ViewKeyframeLayer {

  layer: Layer = null;
  vectorLayerKeyframe: VectorLayerKeyframe = null;

  hasKeyframe(): boolean {

    return (this.vectorLayerKeyframe != null);
  }

  static forEachGroup(viewKeyframeLayers: List<ViewKeyframeLayer>, loopBodyFunction: (group: VectorGroup) => void) {

    for (let viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue;
      }

      for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

        loopBodyFunction(group);
      }
    }
  }

  static forEachGeometry(viewKeyframeLayers: List<ViewKeyframeLayer>, loopBodyFunction: (geometry: VectorLayerGeometry) => void) {

    for (let viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue;
      }

      loopBodyFunction(viewKeyframeLayer.vectorLayerKeyframe.geometry);
    }
  }

  static forEachLayerAndGroup(viewKeyframeLayers: List<ViewKeyframeLayer>, loopBodyFunction: (layer: VectorLayer, group: VectorGroup) => void) {

    for (let viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue;
      }

      for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

        loopBodyFunction(<VectorLayer>viewKeyframeLayer.layer, group);
      }
    }
  }
}

export class ViewKeyframe {

  frame = 0;
  layers = new List<ViewKeyframeLayer>();

  static findViewKeyframe(viewKeyframes: List<ViewKeyframe>, frame: int): ViewKeyframe {

    let keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, frame);

    if (keyframeIndex != -1) {

      return viewKeyframes[keyframeIndex];
    }
    else {

      return null;
    }
  }

  static findViewKeyframeIndex(viewKeyframes: List<ViewKeyframe>, frame: int): int {

    let resultIndex = 0;

    for (let index = 0; index < viewKeyframes.length; index++) {

      if (viewKeyframes[index].frame > frame) {
        break;
      }

      resultIndex = index;
    }

    return resultIndex;
  }

  static findViewKeyframeLayerIndex(viewKeyFrame: ViewKeyframe, layer: Layer): int {

    for (let index = 0; index < viewKeyFrame.layers.length; index++) {

      if (viewKeyFrame.layers[index].layer == layer) {

        return index;
      }
    }

    return -1;
  }

  static findViewKeyframeLayer(viewKeyFrame: ViewKeyframe, layer: Layer): ViewKeyframeLayer {

    let index = this.findViewKeyframeLayerIndex(viewKeyFrame, layer);

    if (index != -1) {

      return viewKeyFrame.layers[index];
    }
    else {

      return null;
    }
  }
}

export class ViewLayerContext {

  keyframes: List<ViewKeyframe> = null;
}

export class DrawPassBuffer {

  canvas: HTMLCanvasElement = null;
  glTexture: WebGLTexture = null;

  width = 0;
  height = 0;
}

export enum TempVirtualLayerTypeID {

  none = 0,
  normal = 1,
  virtualGroup = 2,
}

export class TempVirtualLayer {

  type = TempVirtualLayerTypeID.none;
  layer: Layer = null;
  children = new List<TempVirtualLayer>();
}

export enum DrawPathOperationTypeID {

  none = 0,
  beginDrawing,
  endDrawing,
  drawForeground,
  drawBackground,
  prepareRendering,
  flushRendering,
  prepareBuffer,
  flushBuffer
}

export class DrawPathStep {

  _debugText = '';

  layer: Layer = null;
  viewKeyframeLayer: ViewKeyframeLayer = null;

  operationType = DrawPathOperationTypeID.none;
  compositeOperation: 'source-over' | 'source-atop' = 'source-over';

  setType(operationType: DrawPathOperationTypeID) {

    this.operationType = operationType;
    this._debugText = DrawPathOperationTypeID[operationType];
  }
}

export enum DrawPathModeID {

  none = 0,
  editor = 1,
  editorPreview = 2,
  export = 3
}

export class DrawPathContext {

  steps = new List<DrawPathStep>();

  activeDrawPathStartIndex = -1;
  activeDrawPathEndIndex = -1;

  lazyDraw_ProcessedIndex = -1;
  lazyDraw_LastResetTime = 0;
  lazyDraw_LimitTime = 100;
  lazyDraw_MaxTime = 100000;
  lazyDraw_WaitTime = 500;
  lazyDraw_Buffer: CanvasWindow = null;

  drawPathModeID = DrawPathModeID.none;
  isModalToolRunning = false;
  currentLayerOnly = false;
  startIndex = 0;
  endIndex = 0;
  lastDrawPathIndex = -1;
  bufferStack = new List<CanvasWindow>();

  needsLazyRedraw = false;

  clearDrawingStates() {

    this.lastDrawPathIndex = -1;

    if (this.bufferStack.length > 0) {

      this.bufferStack = new List<CanvasWindow>();
    }
  }

  resetLazyDrawProcess() {

    this.lazyDraw_ProcessedIndex = -1;
    this.lazyDraw_LastResetTime = Platform.getCurrentTime();
  }

  getCurrentBuffer(): CanvasWindow {

    if (this.bufferStack.length == 0) {

      throw ('バッファスタックがありません。');
    }

    return this.bufferStack[this.bufferStack.length - 1];
  }

  isFullRendering(): boolean {

    return (this.drawPathModeID == DrawPathModeID.editorPreview
      || this.drawPathModeID == DrawPathModeID.export);
  }

  isLazyDrawBigining(): boolean {

    return (this.lazyDraw_ProcessedIndex == -1);
  }

  isLazyDrawFinished(): boolean {

    return (this.lazyDraw_ProcessedIndex >= this.steps.length - 1) && !this.needsLazyRedraw;
  }

  isLazyDrawWaiting(): boolean {

    return (!this.isLazyDrawFinished()
      && this.lazyDraw_LastResetTime + this.lazyDraw_WaitTime > Platform.getCurrentTime());
  }

  isLastDrawExist(): boolean {

    return (this.lastDrawPathIndex != -1);
  }
}

export class ToolClipboard {

  copy_VectorGroup: VectorGroup = null;
}

export class ToolContext {

  mainEditor: MainEditor = null;
  drawStyle: ToolDrawingStyle = null;
  commandHistory: CommandHistory = null;

  document: DocumentData = null;
  clipboard = new ToolClipboard();

  mainWindow: CanvasWindow = null;
  pickingWindow: PickingWindow = null;
  posing3DView: Posing3DView = null;
  posing3DLogic: Posing3DLogic = null;

  lazy_DrawPathContext: DrawPathContext = null;

  mainToolID = MainToolID.none;
  subToolIndex = 0;
  editMode = EditModeID.drawMode;
  drawMode_MainToolID = MainToolID.drawLine;
  editMode_MainToolID = MainToolID.edit;
  needsDrawOperatorCursor = false;

  operationUnitID = OperationUnitID.line;

  drawLineBaseWidth = 1.0;
  drawLineMinWidth = 0.1;
  drawCPUOnly = true;

  currentLayer: Layer = null;

  currentVectorLayer: VectorLayer = null;
  currentVectorGeometry: VectorLayerGeometry = null;
  currentVectorGroup: VectorGroup = null;
  currentVectorLine: VectorLine = null;

  currentPosingLayer: PosingLayer = null;
  currentPosingModel: PosingModel = null;
  currentPosingData: PosingData = null;

  currentImageFileReferenceLayer: ImageFileReferenceLayer = null;

  redrawMainWindow = false;
  redrawCurrentLayer = false;
  redrawEditorWindow = false;
  redrawLayerWindow = false;
  redrawSubtoolWindow = false;
  redrawTimeLineWindow = false;
  redrawWebGLWindow = false;
  redrawHeaderWindow = false;
  redrawFooterWindow = false;
  redrawPaletteSelectorWindow = false;
  redrawColorMixerWindow = false;

  mouseCursorRadius = 12.0;

  resamplingUnitLength = 8.0

  operatorCursor = new OperatorCursor();

  shiftKey: boolean = false;
  altKey: boolean = false;
  ctrlKey: boolean = false;

  animationPlaying = false;
  animationPlayingFPS = 24;
}

export class ToolEnvironment {

  private toolContext: ToolContext = null;
  drawStyle: ToolDrawingStyle = null;

  mainToolID = MainToolID.posing;
  subToolIndex = 0;
  editMode = EditModeID.drawMode;
  drawMode_MainToolID = MainToolID.drawLine;
  editMode_MainToolID = MainToolID.edit;

  operationUnitID = OperationUnitID.linePoint;

  commandHistory: CommandHistory = null;

  operatorCursor: OperatorCursor = null;

  document: DocumentData = null;
  clipboard: ToolClipboard = null;

  drawLineBaseWidth = 1.0;
  drawLineMinWidth = 1.0;

  currentLayer: Layer = null;

  currentVectorLayer: VectorLayer = null;
  currentVectorGeometry: VectorLayerGeometry = null;
  currentVectorGroup: VectorGroup = null;
  currentVectorLine: VectorLine = null;

  currentPosingLayer: PosingLayer = null;
  currentPosingModel: PosingModel = null;
  currentPosingData: PosingData = null;

  currentImageFileReferenceLayer: ImageFileReferenceLayer = null;

  mainWindow: CanvasWindow = null;
  pickingWindow: PickingWindow = null;

  posing3DView: Posing3DView = null;
  posing3DLogic: Posing3DLogic = null;

  viewScale = 0.0;

  mouseCursorViewRadius = 0.0;
  mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0);

  constructor(toolContext: ToolContext) {

    this.toolContext = toolContext;
  }

  updateContext() {

    this.mainToolID = this.toolContext.mainToolID;
    this.subToolIndex = this.toolContext.subToolIndex;
    this.editMode = this.toolContext.editMode;
    this.drawMode_MainToolID = this.toolContext.drawMode_MainToolID;
    this.editMode_MainToolID = this.toolContext.editMode_MainToolID;

    this.operationUnitID = this.toolContext.operationUnitID;

    this.commandHistory = this.toolContext.commandHistory;

    this.operatorCursor = this.toolContext.operatorCursor;
    //this.latticePoints = this.toolContext.latticePoints;
    //this.rectangleArea = this.toolContext.rectangleArea;

    this.document = this.toolContext.document;
    this.clipboard = this.toolContext.clipboard;

    this.drawLineBaseWidth = this.toolContext.drawLineBaseWidth;
    this.drawLineMinWidth = this.toolContext.drawLineMinWidth;

    this.currentLayer = this.toolContext.currentLayer;
    //this.editableKeyframeLayers = this.toolContext.editableKeyframeLayers;

    this.currentVectorLayer = this.toolContext.currentVectorLayer;
    this.currentVectorGeometry = this.toolContext.currentVectorGeometry;
    this.currentVectorGroup = this.toolContext.currentVectorGroup;
    this.currentVectorLine = this.toolContext.currentVectorLine;

    if (this.toolContext.currentVectorLine != null) {

      if (this.toolContext.currentVectorLine.modifyFlag == VectorLineModifyFlagID.delete) {

        this.toolContext.currentVectorLine = null;
        this.currentVectorLine = null;
      }
    }

    this.currentPosingLayer = this.toolContext.currentPosingLayer;
    this.currentPosingModel = this.toolContext.currentPosingModel;
    this.currentPosingData = this.toolContext.currentPosingData;

    this.currentImageFileReferenceLayer = this.toolContext.currentImageFileReferenceLayer;

    this.mainWindow = this.toolContext.mainWindow;
    this.pickingWindow = this.toolContext.pickingWindow;
    this.posing3DView = this.toolContext.posing3DView;
    this.posing3DLogic = this.toolContext.posing3DLogic;

    this.viewScale = this.toolContext.mainWindow.viewScale;
    this.drawStyle = this.toolContext.drawStyle;

    this.mouseCursorViewRadius = this.getViewScaledLength(this.toolContext.mouseCursorRadius);
  }

  setRedrawHeaderWindow() {

    this.toolContext.redrawHeaderWindow = true;
  }

  setRedrawMainWindow() {

    this.toolContext.redrawMainWindow = true;
    this.toolContext.redrawCurrentLayer = false;
  }

  setRedrawCurrentLayer() {

    if (!this.toolContext.redrawMainWindow) {

      this.toolContext.redrawCurrentLayer = true;
    }

    this.toolContext.redrawMainWindow = true;
  }

  setRedrawEditorWindow() {

    this.toolContext.redrawEditorWindow = true;
  }

  setRedrawMainWindowEditorWindow() {

    this.setRedrawMainWindow();
    this.setRedrawEditorWindow();
    this.setRedrawWebGLWindow();
  }

  setRedrawLayerWindow() {

    this.toolContext.redrawLayerWindow = true;
    this.toolContext.redrawPaletteSelectorWindow = true;
    this.toolContext.redrawColorMixerWindow = true;
  }

  updateLayerStructure() {

    this.toolContext.mainEditor.updateLayerStructure();
    this.setRedrawLayerWindow();
    this.setRedrawTimeLineWindow();
    this.setRedrawMainWindowEditorWindow();
  }

  setRedrawSubtoolWindow() {

    this.toolContext.redrawSubtoolWindow = true;
  }

  setRedrawTimeLineWindow() {

    this.toolContext.redrawTimeLineWindow = true;
  }

  setRedrawColorSelectorWindow() {

    this.toolContext.redrawPaletteSelectorWindow = true;
  }

  setRedrawColorMixerWindow() {

    this.toolContext.redrawColorMixerWindow = true;
  }

  setRedrawWebGLWindow() {

    this.toolContext.redrawWebGLWindow = true;
  }

  setRedrawAllWindows() {

    this.setRedrawMainWindowEditorWindow();
    this.setRedrawSubtoolWindow();
    this.setRedrawLayerWindow();
    this.setRedrawTimeLineWindow();
    this.setRedrawColorSelectorWindow();
    this.setRedrawWebGLWindow();
  }

  setLazyRedraw() {

    this.toolContext.lazy_DrawPathContext.needsLazyRedraw = true;
  }

  isAnyModifierKeyPressing(): boolean {

    return (this.toolContext.shiftKey || this.toolContext.altKey || this.toolContext.ctrlKey);
  }

  isShiftKeyPressing(): boolean {

    return (this.toolContext.shiftKey);
  }

  isCtrlKeyPressing(): boolean {

    return (this.toolContext.ctrlKey);
  }

  isAltKeyPressing(): boolean {

    return (this.toolContext.altKey);
  }

  isDrawMode() {

    return (this.toolContext.editMode == EditModeID.drawMode);
  }

  isEditMode() {

    return (this.toolContext.editMode == EditModeID.editMode);
  }

  isCurrentLayerVectorLayer(): boolean {

    return (this.currentVectorLayer != null);
  }

  isCurrentLayerPosingLayer(): boolean {

    return (this.currentPosingLayer != null);
  }

  isCurrentLayerImageFileReferenceLayer(): boolean {

    return (this.currentImageFileReferenceLayer != null);
  }

  isCurrentLayerContainerLayer(): boolean {

    return (this.currentLayer.type == LayerTypeID.groupLayer);
  }

  needsDrawOperatorCursor(): boolean {

    return (this.isEditMode() || this.toolContext.needsDrawOperatorCursor);
  }

  setCurrentOperationUnitID(operationUnitID: OperationUnitID) {

    this.toolContext.mainEditor.setCurrentOperationUnitID(operationUnitID);
  }

  setCurrentLayer(layer: Layer) {

    this.toolContext.mainEditor.setCurrentLayer(layer);
  }

  setCurrentVectorLine(line: VectorLine, group: VectorGroup) {

    this.toolContext.currentVectorLine = line;
    this.currentVectorLine = line;

    this.toolContext.currentVectorGroup = group;
    this.currentVectorGroup = group;
  }

  getCurrentLayerLineColor(): Vec4 {

    let color: Vec4 = null;

    if (this.currentVectorLayer != null) {

      if (this.currentVectorLayer.drawLineType == DrawLineTypeID.paletteColor) {

        color = this.toolContext.document.paletteColors[this.currentVectorLayer.line_PaletteColorIndex].color;
      }
      else {

        color = this.currentVectorLayer.layerColor;
      }
    }

    return color;
  }

  getCurrentLayerFillColor(): Vec4 {

    let color: Vec4 = null;

    if (this.currentVectorLayer != null) {

      if (this.currentVectorLayer.fillAreaType == FillAreaTypeID.paletteColor) {

        color = this.toolContext.document.paletteColors[this.currentVectorLayer.fill_PaletteColorIndex].color;
      }
      else {

        color = this.currentVectorLayer.fillColor;
      }
    }

    return color;
  }

  startModalTool(modalTool: ModalToolBase) {

    this.toolContext.mainEditor.startModalTool(modalTool);
  }

  endModalTool() {

    this.toolContext.mainEditor.endModalTool();
  }

  cancelModalTool() {

    this.toolContext.mainEditor.cancelModalTool();
  }

  isModalToolRunning(): boolean {

    return this.toolContext.mainEditor.isModalToolRunning();
  }

  openFileDialog(targetID: OpenFileDialogTargetID) {

    this.toolContext.mainEditor.openFileDialog(targetID);
  }

  openDocumentSettingDialog() {

    this.toolContext.mainEditor.openDocumentSettingDialog();
  }

  startLoadingCurrentDocumentResources() {

    this.toolContext.mainEditor.startLoadingDocumentResourcesProcess(this.toolContext.document);
  }

  getViewScaledLength(length: float) {

    return length / this.viewScale;
  }

  getViewScaledDrawLineUnitLength() {

    let resamplingUnitLength = this.getViewScaledLength(this.toolContext.resamplingUnitLength);

    if (resamplingUnitLength > this.toolContext.resamplingUnitLength) {
      resamplingUnitLength = this.toolContext.resamplingUnitLength;
    }

    return resamplingUnitLength;
  }

  collectEditTargetViewKeyframeLayers(): List<ViewKeyframeLayer> {

    return this.toolContext.mainEditor.collectEditTargetViewKeyframeLayers();
  }

  getPosingModelByName(name: string): PosingModel {

    return this.toolContext.mainEditor.getPosingModelByName(name);
  }
}

export class ToolDrawingStyle {

  selectedButtonColor = vec4.fromValues(0.90, 0.90, 1.0, 1.0);

  linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
  sampledPointColor = vec4.fromValues(0.0, 0.5, 1.0, 0.3);
  extrutePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
  selectedVectorLineColor = vec4.fromValues(1.0, 0.5, 0.0, 0.8);

  linePointVisualBrightnessAdjustRate = 0.3;
  editModeOtherLayerAlphaAdjustRate = 0.3;

  mouseCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
  operatorCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);

  modalToolSelectedAreaLineColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
  latticePointRadius = 4.0;
  latticePointHitRadius = 10.0;
  latticePointPadding = 8.0;

  layerWindowBackgroundColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
  layerWindowItemActiveLayerColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
  layerWindowItemSelectedColor = vec4.fromValues(0.95, 0.95, 1.0, 1.0);

  paletteSelectorItemEdgeColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  paletteSelectorItemSelectedColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);

  timeLineUnitFrameColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
  timeLineCurrentFrameColor = vec4.fromValues(0.2, 1.0, 0.2, 0.5);
  timeLineKeyFrameColor = vec4.fromValues(0.0, 0.0, 1.0, 0.1);
  timeLineLayerKeyFrameColor = vec4.fromValues(0.8, 0.8, 0.0, 1.0);
  timeLineOutOfLoopingColor = vec4.fromValues(0.0, 0.0, 0.0, 0.1);

  posing3DBoneGrayColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
  posing3DBoneHeadColor = vec4.fromValues(0.2, 0.2, 1.0, 1.0);
  posing3DBoneForwardColor = vec4.fromValues(0.2, 1.0, 0.2, 1.0);
  posing3DBoneInputCircleRadius = 15.0;
  posing3DBoneInputCircleHitRadius = 1.8;

  generalLinePointRadius = 2.0;
  selectedLinePointRadius = 3.0;
  viewZoomAdjustingSpeedRate = 0.2;
}

export class ToolDrawingEnvironment {

  canvasWindow: CanvasWindow = null;
  editorDrawer: MainEditorDrawer = null;
  render: CanvasRender = null;
  style: ToolDrawingStyle = null;

  setEnvironment(editorDrawer: MainEditorDrawer, render: CanvasRender, style: ToolDrawingStyle) {

    this.editorDrawer = editorDrawer;
    this.render = render;
    this.style = style;
  }

  setVariables(canvasWindow: CanvasWindow) {

    this.canvasWindow = canvasWindow;
  }

  drawLine(locationFrom: Vec3, locationTo: Vec3, strokeWidth: float, color: Vec4) {

    this.render.setStrokeColorV(color);
    this.render.setStrokeWidth(strokeWidth);
    this.render.beginPath();
    this.render.moveTo(locationFrom[0], locationFrom[1]);
    this.render.lineTo(locationTo[0], locationTo[1]);
    this.render.stroke();
  }

  drawCircle(center: Vec3, raduis: float, strokeWidth: float, color: Vec4) {

    this.render.setStrokeColorV(color);
    this.render.setStrokeWidth(strokeWidth);
    this.render.beginPath();
    this.render.circle(center[0], center[1], raduis);
    this.render.stroke();
  }
}

export class ToolMouseEvent {

  button = 0;
  buttons = 0;
  offsetX = 0.0;
  offsetY = 0.0;
  wheelDelta = 0.0;

  isMouseDragging = false;
  location = vec3.fromValues(0.0, 0.0, 0.0);
  mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0);
  mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0);

  clickCount = 0;
  lastClickedOffset = vec3.fromValues(0.0, 0.0, 0.0);

  mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0);
  mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0);

  tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);

  isLeftButtonPressing(): boolean {

    return (this.button == 0 && this.buttons != 0);
  }

  isRightButtonPressing(): boolean {

    return (this.button == 2 && this.buttons != 0);
  }

  isCenterButtonPressing(): boolean {

    return (this.button == 1 && this.buttons != 0);
  }

  isLeftButtonReleased(): boolean {

    return (this.buttons == 0);
  }

  isRightButtonReleased(): boolean {

    return (this.buttons == 0);
  }

  isCenterButtonReleased(): boolean {

    return (this.buttons == 0);
  }

  hundleDoubleClick(offsetX: float, offsetY: float): boolean {

    if (this.clickCount == 0) {

      this.clickCount++;
      this.lastClickedOffset[0] = offsetX;
      this.lastClickedOffset[1] = offsetY;

      setTimeout(() => {
        this.clickCount = 0;
      }, 350);

      return false;
    }
    else {

      this.clickCount = 0;

      if (Math.pow(offsetX - this.lastClickedOffset[0], 2)
        + Math.pow(offsetY - this.lastClickedOffset[1], 2) < 9.0) {

        return true;
      }
      else {

        return false;
      }
    }
  }

  startMouseDragging() {

    this.isMouseDragging = true;

    vec3.copy(this.mouseDownLocation, this.location);
    vec3.set(this.mouseMovedVector, 0.0, 0.0, 0.0);

    vec3.set(this.mouseDownOffset, this.offsetX, this.offsetY, 0.0);
    vec3.set(this.mouseMovedOffset, 0.0, 0.0, 0.0);
  }

  processMouseDragging() {

    if (!this.isMouseDragging) {

      return;
    }

    vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.location);

    vec3.set(this.tempVec3, this.offsetX, this.offsetY, 0.0);
    vec3.subtract(this.mouseMovedOffset, this.mouseDownOffset, this.tempVec3);
  }

  endMouseDragging() {

    this.isMouseDragging = false;
  }
}

export class ToolBase {

  helpText = ''; // @virtual
  isEditTool = false; // @virtual

  toolBarImage: ImageResource = null;
  toolBarImageIndex = 0;

  inputOptionButtonCount = 0;

  isAvailable(env: ToolEnvironment): boolean { // @virtual

    return true;
  }

  getOptionButtonState(buttonIndex: int, env: ToolEnvironment): InputSideID { // @virtual

    return InputSideID.none;
  }

  optionButton_Click(buttonIndex: int, env: ToolEnvironment): boolean { // @virtual

    return false;
  }

  mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
  }

  mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
  }

  mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
  }

  keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @virtual
    return false;
  }

  onActivated(env: ToolEnvironment) { // @virtual
  }

  onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @virtual
  }

  toolWindowItemClick(env: ToolEnvironment) { // @virtual
  }

  toolWindowItemDoubleClick(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
  }

  onOpenFile(filePath: string, env: ToolEnvironment) { // @virtual
  }
}

export class ModalToolBase extends ToolBase {

  prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @virtual

    return true;
  }

  startModal(env: ToolEnvironment) { // @virtual

    env.setRedrawEditorWindow();
  }

  endModal(env: ToolEnvironment) { // @virtual

    env.setRedrawEditorWindow();
  }

  cancelModal(env: ToolEnvironment) { // @virtual

    env.setRedrawMainWindowEditorWindow();
  }
}

export class MainTool {

  mainToolID = MainToolID.none;
  subTools = new List<ToolBase>();
  currentSubToolIndex = 0;

  id(mainToolID: MainToolID): MainTool {

    this.mainToolID = mainToolID;
    return this;
  }

  subTool(tool: ToolBase, toolBarImage: ImageResource, toolBarImageIndex: int): MainTool {

    tool.toolBarImage = toolBarImage;
    tool.toolBarImageIndex = toolBarImageIndex;

    this.subTools.push(tool);
    return this;
  }
}
