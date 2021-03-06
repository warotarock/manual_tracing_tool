﻿import { int, float, List } from '../base/conversion';
import {
  DocumentData,
  Layer, LayerTypeID, DrawLineTypeID, FillAreaTypeID,
  GroupLayer,
  VectorLayer, VectorGeometry, VectorStrokeGroup, VectorStroke, VectorPoint, VectorKeyframe, VectorLineModifyFlagID,
  ImageFileReferenceLayer,
  AutoFillLayer,
  PosingLayer, PosingData, PosingModel, InputSideID
} from '../base/data';
import { CommandHistory } from '../base/command';

import { CanvasWindow, CanvasRender } from '../renders/render2d';
import { Posing3DView, ImageResource } from '../posing3d/posing3d_view';
import { Posing3DLogic } from '../posing3d/posing3d_logic';
import { Platform } from "../platform/platform";

export enum MainToolID {

  none = 0,
  drawLine = 1,
  fill = 2,
  posing = 3,
  imageReferenceLayer = 4,
  misc = 5,
  edit = 6,
  draw3D = 7
}

export enum DrawLineToolSubToolID {

  drawLine = 0,
  deletePointBrush = 1,
  extrudeLine = 2,
  editLinePointWidth_BrushSelect = 3,
  scratchLine = 4,
  overWriteLineWidth = 5,
  scratchLineWidth = 6
}

export enum EditModeSubToolID {

  lineBrushSelect = 0,
  lineSegmentBrushSelect = 1,
  linePointBrushSelect = 2,
  editModeMain = 3,
  resampleSegment = 4,
}

export enum SettingsSubToolID {

  editDocumentFrame = 0,
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

  drawMouseCursor(radius: float);
  drawMouseCursorCircle(radius: float);
  drawEditorEditLineStroke(line: VectorStroke);
  drawEditorVectorLineStroke(line: VectorStroke, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean);
  drawEditorVectorLinePoints(line: VectorStroke, color: Vec4, useAdjustingLocation: boolean);
  drawEditorVectorLinePoint(point: VectorPoint, color: Vec4, useAdjustingLocation: boolean);
  drawEditorVectorLineSegment(line: VectorStroke, startIndex: int, endIndex: int, useAdjustingLocation: boolean);
}

export class InputableWindow extends CanvasWindow {

  toolMouseEvent = new ToolMouseEvent(this);
  view2DMatrix = mat4.create();
  invView2DMatrix = mat4.create();
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
  vectorLayerKeyframe: VectorKeyframe = null;

  hasKeyframe(): boolean {

    return (this.vectorLayerKeyframe != null);
  }

  static forEachGroup(viewKeyframeLayers: List<ViewKeyframeLayer>, loopBodyFunction: (group: VectorStrokeGroup, vectorLayer?: VectorLayer) => void) {

    for (let viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue;
      }

      for (let unit of viewKeyframeLayer.vectorLayerKeyframe.geometry.units) {

        for (let group of unit.groups) {

          loopBodyFunction(group, <VectorLayer>viewKeyframeLayer.layer);
        }
      }
    }
  }

  static forEachGeometry(viewKeyframeLayers: List<ViewKeyframeLayer>, loopBodyFunction: (geometry: VectorGeometry) => void) {

    for (let viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue;
      }

      loopBodyFunction(viewKeyframeLayer.vectorLayerKeyframe.geometry);
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

  drawPathModeID = DrawPathModeID.none;
  isModalToolRunning = false;
  currentLayerOnly = false;
  startIndex = 0;
  endIndex = 0;
  lastDrawPathIndex = -1;
  bufferStack = new List<CanvasWindow>();

  lazyProcess = new LazyProcess();

  clearDrawingStates() {

    this.lastDrawPathIndex = -1;

    if (this.bufferStack.length > 0) {

      this.bufferStack = new List<CanvasWindow>();
    }
  }

  isLastDrawExist(): boolean {

    return (this.lastDrawPathIndex != -1);
  }

  isFullRendering(): boolean {

    return (this.drawPathModeID == DrawPathModeID.editorPreview
      || this.drawPathModeID == DrawPathModeID.export);
  }

  getCurrentBuffer(): CanvasWindow {

    if (this.bufferStack.length == 0) {

      throw ('バッファスタックがありません。');
    }

    return this.bufferStack[this.bufferStack.length - 1];
  }
}

export class LazyProcess {

  needsStartingLazyDraw = false;

  processedIndex = -1;
  lastResetTime = 0;
  limitTime = 100;
  maxTime = 100000;
  waitTime = 500;
  buffer: CanvasWindow = null;
  isFirstDraw = true;
  isFinished = false;
  isRendered = false;

  resetLazyDrawProcess() {

    this.needsStartingLazyDraw = false;
    this.isFirstDraw = true;
    this.isFinished = false;
    this.isRendered = false;
  }

  setLazyDraw() {

    this.needsStartingLazyDraw = true;
    this.isFinished = false;
  }

  startLazyDrawProcess() {

    this.needsStartingLazyDraw = false;
    this.processedIndex = -1;
    this.lastResetTime = Platform.getCurrentTime();
    this.isFirstDraw = true;
    this.isFinished = false;
    this.isRendered = false;
  }

  finishLazyDrawProcess() {

    this.isFinished = true;
    this.isRendered = true;
  }

  isLazyDrawBigining(): boolean {

    return (this.processedIndex == -1);
  }

  isLazyDrawWaiting(): boolean {

    return (!this.isFinished
      && this.lastResetTime + this.waitTime > Platform.getCurrentTime());
  }
}

export class ToolClipboard {

  copy_VectorGroup: VectorStrokeGroup = null;
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
  drawCPUOnly = true;

  mainToolID = MainToolID.none;
  subToolIndex = 0;
  editMode = EditModeID.drawMode;
  drawMode_MainToolID = MainToolID.drawLine;
  editMode_MainToolID = MainToolID.edit;
  needsDrawOperatorCursor = false;

  operationUnitID = OperationUnitID.line;

  drawLineBaseWidth = 1.0;
  drawLineMinWidth = 0.1;
  eraserLineBaseWidth = 12.0;
  mouseCursorRadius = 12.0;

  resamplingUnitLength = 8.0

  operatorCursor = new OperatorCursor();

  currentLayer: Layer = null;

  currentVectorLayer: VectorLayer = null;
  currentVectorGeometry: VectorGeometry = null;
  currentVectorGroup: VectorStrokeGroup = null;
  currentVectorLine: VectorStroke = null;

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
  eraserRadius = 0.0;
  mouseCursorRadius = 0.0;
  mouseCursorViewRadius = 0.0;
  mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0);

  currentLayer: Layer = null;

  currentVectorLayer: VectorLayer = null;
  currentVectorGeometry: VectorGeometry = null;
  currentVectorGroup: VectorStrokeGroup = null;
  currentVectorLine: VectorStroke = null;

  currentPosingLayer: PosingLayer = null;
  currentPosingModel: PosingModel = null;
  currentPosingData: PosingData = null;

  currentImageFileReferenceLayer: ImageFileReferenceLayer = null;

  mainWindow: CanvasWindow = null;
  pickingWindow: PickingWindow = null;

  posing3DView: Posing3DView = null;
  posing3DLogic: Posing3DLogic = null;

  viewScale = 0.0;

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

    this.eraserRadius = this.getViewScaledLength(this.toolContext.eraserLineBaseWidth);
    this.mouseCursorRadius = this.toolContext.mouseCursorRadius;
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

    this.toolContext.lazy_DrawPathContext.lazyProcess.setLazyDraw();
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

    return VectorLayer.isVectorLayer(this.currentLayer);
  }

  isCurrentLayerFillLayer(): boolean {

    return AutoFillLayer.isAutoFillLayer(this.currentLayer);
  }

  isCurrentLayerPosingLayer(): boolean {

    return PosingLayer.isPosingLayer(this.currentLayer);
  }

  isCurrentLayerImageFileReferenceLayer(): boolean {

    return ImageFileReferenceLayer.isImageFileReferenceLayer(this.currentLayer);
  }

  isCurrentLayerContainerLayer(): boolean {

    return GroupLayer.isGroupLayer(this.currentLayer);
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

  setCurrentVectorLine(line: VectorStroke, group: VectorStrokeGroup) {

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

  windowBorderColor = vec4.fromValues(8 /16, 8 / 16, 8 / 16, 1.0);
  windowBackGroundColor = vec4.fromValues(0xf6 / 255, 0xf6 / 255, 0xf8 / 255, 1.0);

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
  posing3DHelperGrayColor1 = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
  posing3DHelperGrayColor2 = vec4.fromValues(0.5, 0.5, 0.5, 0.3);

  generalLinePointRadius = 2.0;
  selectedLinePointRadius = 3.0;
  viewZoomAdjustingSpeedRate = 0.2;

  eyesSymmetryGuideColor = vec4.fromValues(0.0, 0.5, 1.0, 0.3);
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

  beginPath(locationFrom?: Vec3) {

    this.render.beginPath();

    if (locationFrom) {

      this.render.moveTo(locationFrom[0], locationFrom[1]);
    }
  }

  stroke(strokeWidth: float, color: Vec4) {

    this.render.setStrokeColorV(color);
    this.render.setStrokeWidth(strokeWidth);
    this.render.stroke();
  }

  fill(color: Vec4) {

    this.render.setFillColorV(color);
    this.render.fill();
  }

  moveTo(location: Vec3) {

    this.render.moveTo(location[0], location[1]);
  }

  lineTo(location: Vec3) {

    this.render.lineTo(location[0], location[1]);
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

export class ToolEventPointer {

  window: InputableWindow = null;

  identifier = -1;
  pressed = 0;
  ageOrderDesc = 0;
  offsetX = 0.0;
  offsetY = 0.0;
  currentLocation = vec3.fromValues(0.0, 0.0, 0.0);
  lastClickedPosition = vec3.fromValues(0.0, 0.0, 0.0);
  movedOffset = vec3.fromValues(0.0, 0.0, 0.0);
  force = 0.0;

  dragging = new ToolMouseEventDragging();

  isActive() {

    return (this.identifier != -1);
  }

  isFree() {

    return (this.identifier == -1);
  }

  isPressed() {

    return (this.pressed != 0);
  }

  startDragging(scale: float) {

    this.dragging.start(this.window, this.offsetX, this.offsetY, scale);
  }
}

export class ToolMouseEventDragging {

  window: InputableWindow = null;

  dragBeforeTransformMatrix = mat4.create();

  mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0);
  mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0);

  currentLocation = vec3.fromValues(0.0, 0.0, 0.0);

  mouseOffset = vec3.fromValues(0.0, 0.0, 0.0);
  mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0);
  mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0);

  scale = 1.0;

  tempVec3 = vec3.create();

  start(wnd: InputableWindow, offsetX: float, offsetY: float, scale: float) {

    this.window = wnd;

    // offset

    vec3.set(this.mouseOffset, offsetX, offsetY, 0.0);
    vec3.copy(this.mouseDownOffset, this.mouseOffset);

    // transformed location

    mat4.copy(this.dragBeforeTransformMatrix, wnd.invView2DMatrix);

    vec3.set(this.tempVec3, offsetX, offsetY, 0.0);
    vec3.transformMat4(this.mouseDownLocation, this.tempVec3, this.dragBeforeTransformMatrix);

    // reset moved values

    vec3.set(this.mouseMovedOffset, 0.0, 0.0, 0.0);
    vec3.set(this.mouseMovedVector, 0.0, 0.0, 0.0);

    this.scale = scale;
  }

  move(offsetX: float, offsetY: float) {

    // offset

    vec3.set(this.mouseOffset, offsetX, offsetY, 0.0);

    vec3.subtract(this.mouseMovedOffset, this.mouseOffset, this.mouseDownOffset);

    vec3.scale(this.mouseMovedOffset, this.mouseMovedOffset, this.scale);

    // transformed location

    vec3.transformMat4(this.currentLocation, this.mouseOffset, this.dragBeforeTransformMatrix);

    vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.currentLocation);

    vec3.scale(this.mouseMovedVector, this.mouseMovedVector, this.scale);
  }

  isMoved() {

    return (vec3.length(this.mouseMovedOffset) > 0.0);
  }
}

export class ToolMouseEvent {

  window: InputableWindow = null;
  pointerID: number = -1;

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

  pointers: ToolEventPointer[] = [
    new ToolEventPointer(), // for mouse input
    new ToolEventPointer(), // for first finger
    new ToolEventPointer()  // for second finger
  ];

  activePointers: ToolEventPointer[] = [];

  tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);

  constructor(wnd: InputableWindow) {

    this.window = wnd;
  }

  isLeftButtonPressing(): boolean {

    return ((this.buttons & 0x1) != 0);
  }

  isRightButtonPressing(): boolean {

    return ((this.buttons & 0x2) != 0);
  }

  isCenterButtonPressing(): boolean {

    return ((this.buttons & 0x4) != 0);
  }

  isLeftButtonReleased(): boolean {

    return !this.isLeftButtonPressing();
  }

  isRightButtonReleased(): boolean {

    return !this.isRightButtonPressing();
  }

  isCenterButtonReleased(): boolean {

    return !this.isCenterButtonPressing();
  }

  handleDoubleClick(offsetX: float, offsetY: float): boolean {

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

export class Tool_None extends ToolBase {

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
