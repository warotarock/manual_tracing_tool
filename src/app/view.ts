import {
  int, float, List, Dictionary, DictionaryContainsKey,
  StringIsNullOrEmpty, StringLastIndexOf, StringSubstring
} from 'base/conversion';

import {
  DocumentData, Layer, LayerTypeID, FillAreaTypeID, VectorLayerKeyframe,
  VectorLayer,
  ImageFileReferenceLayer,
  DrawLineTypeID,
  AnimationSettingData,
  LocalSetting,
  InputSideID,
} from 'base/data';

import {
  ToolContext, ToolEnvironment, ToolDrawingEnvironment, ToolBase, ToolBaseWindow, ToolMouseEvent,
  MainTool, MainToolID, EditModeID,
  ViewLayerContext, ViewKeyframe, ViewKeyframeLayer,
  OpenFileDialogTargetID,
} from 'base/tool';

import { CanvasWindow } from 'renders/render2d';
import { ColorLogic } from 'logics/color';

import { Command_Animation_DeleteKeyframeAllLayer, Command_Animation_InsertKeyframeAllLayer } from 'commands/edit_animation';

import {
  HTMLElementID,
  RectangleLayoutArea,
  MainWindow,
  LayerWindow, LayerWindowItem, LayerWindowButtonID,
  TimeLineWindow,
  SubToolViewItem, SubToolViewItemOptionButton,
  OpenPaletteColorModalMode,
  PaletteSelectorWindow, PaletteSelectorWindowButtonID,
  ColorCanvasWindow,
} from 'app/view.class';

import { UI_SubToolWindowRef } from 'ui/subtool_window';
import { UI_MenuButtonsRef } from 'ui/menu_buttons';
import { UI_LayerWindowRef } from 'ui/layer_window';
import { UI_PaletteSelectorWindowRef } from 'ui/palette_selector_window';
import { UI_ColorMixerWindowRef } from 'ui/color_mixer_window';

declare var Custombox: any;

export class App_View {

  // HTML elements

  ID = new HTMLElementID();

  mainWindow = new MainWindow();
  editorWindow = new CanvasWindow();
  layerWindow = new LayerWindow();
  //subtoolWindow = new SubtoolWindow();
  timeLineWindow = new TimeLineWindow();
  paletteSelectorWindow = new PaletteSelectorWindow();
  colorMixerWindow_colorCanvas = new ColorCanvasWindow();
  paletteColorModal_colorCanvas = new ColorCanvasWindow();

  uiSubToolWindowRef: UI_SubToolWindowRef = {};
  uiMenuButtonsRef: UI_MenuButtonsRef = {};
  uiLayerwindowRef: UI_LayerWindowRef = {};
  uiPaletteSelectorWindowRef: UI_PaletteSelectorWindowRef = {};
  uiColorMixerWindowRef: UI_ColorMixerWindowRef = {};

  // Drawing variables

  foreLayerRenderWindow = new CanvasWindow();
  backLayerRenderWindow = new CanvasWindow();
  exportRenderWindow = new CanvasWindow();
  drawGPUWindow = new CanvasWindow();
  webglWindow = new CanvasWindow();
  //pickingWindow = new PickingWindow();

  activeCanvasWindow: CanvasWindow = null;

  layerTypeNameList: List<string> = [
    'none',
    'root',
    'ベクター レイヤー',
    'グループ レイヤー',
    '画像ファイル レイヤー',
    '３Dポーズ レイヤー',
    'ベクター参照 レイヤー',
    '自動塗りつぶし レイヤー'
  ];

  // UI states

  selectCurrentLayerAnimationLayer: Layer = null;
  selectCurrentLayerAnimationTime = 0.0;
  selectCurrentLayerAnimationTimeMax = 0.4;

  isViewLocationMoved = false;
  homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
  lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
  lastViewScale = 1.0;
  lastViewRotation = 0.0;

  // Integrated tool system

  toolContext: ToolContext = null;
  toolEnv: ToolEnvironment = null;
  toolDrawEnv: ToolDrawingEnvironment = null;
  viewLayerContext = new ViewLayerContext();

  // Work variable

  view2DMatrix = mat4.create();
  invView2DMatrix = mat4.create();
  tempVec3 = vec3.create();
  tempVec4 = vec4.create();
  tempColor4 = vec4.create();
  tempMat4 = mat4.create();
  fromLocation = vec3.create();
  toLocation = vec3.create();
  upVector = vec3.create();

  // Backward interface definitions

  protected getLocalSetting(): LocalSetting { // @virtual

    return null;
  }

  protected getCurrentMainTool(): MainTool { // @virtual

    return null;
  }

  protected getCurrentTool(): ToolBase { // @virtual

    return null;
  }

  protected isWhileLoading(): boolean { // @virtual

    return false;
  }

  protected isEventDisabled(): boolean { // @virtual

    return false;
  }

  // Initializing devices not depending media resoures

  protected initializeViewDevices() {

    this.resizeWindows();

    this.mainWindow.initializeContext();
    this.editorWindow.initializeContext();
    this.foreLayerRenderWindow.initializeContext();
    this.backLayerRenderWindow.initializeContext();

    // this.layerWindow.initializeContext();
    // this.subtoolWindow.initializeContext();

    // this.paletteSelectorWindow.initializeContext();
    this.colorMixerWindow_colorCanvas.initializeContext();

    this.timeLineWindow.initializeContext();

    this.exportRenderWindow.initializeContext();
    this.paletteColorModal_colorCanvas.initializeContext();

    this.layerWindow_Initialize();
    this.initializePaletteSelectorWindow();
  }

  // Initializing after loading resources

  protected initializeViewState() {

    this.mainWindow.centerLocationRate[0] = 0.5;
    this.mainWindow.centerLocationRate[1] = 0.5;

    this.setCanvasSizeFromStyle(this.colorMixerWindow_colorCanvas);

    this.setCanvasSizeFromStyle(this.paletteColorModal_colorCanvas);
  }

  // View management

  protected resizeWindows() {

    this.resizeCanvasToParent(this.mainWindow);
    this.fitCanvas(this.editorWindow, this.mainWindow, 1);
    this.fitCanvas(this.foreLayerRenderWindow, this.mainWindow, 1);
    this.fitCanvas(this.backLayerRenderWindow, this.mainWindow, 1);
    this.fitCanvas(this.webglWindow, this.mainWindow, 1);
    this.fitCanvas(this.drawGPUWindow, this.mainWindow, 2.0);

    // this.resizeCanvasToCurrent(this.layerWindow);
    // this.resizeCanvasToCurrent(this.subtoolWindow);
    // this.resizeCanvasToCurrent(this.paletteSelectorWindow);
    this.resizeCanvasToCurrent(this.timeLineWindow);
  }

  private resizeCanvasToParent(canvasWindow: CanvasWindow) {

    let rect = canvasWindow.canvas.parentElement.getBoundingClientRect();

    canvasWindow.width = rect.width - 2;
    canvasWindow.height = rect.height - 2;

    canvasWindow.canvas.width = canvasWindow.width;
    canvasWindow.canvas.height = canvasWindow.height;
  }

  private resizeCanvasToCurrent(canvasWindow: CanvasWindow) {

    canvasWindow.width = canvasWindow.canvas.clientWidth;
    canvasWindow.height = canvasWindow.canvas.clientHeight;

    canvasWindow.canvas.width = canvasWindow.width;
    canvasWindow.canvas.height = canvasWindow.height;
  }

  private fitCanvas(canvasWindow: CanvasWindow, fitToWindow: CanvasWindow, scale: int) {

    canvasWindow.width = fitToWindow.width * scale;
    canvasWindow.height = fitToWindow.height * scale;

    canvasWindow.canvas.width = canvasWindow.width;
    canvasWindow.canvas.height = canvasWindow.height;
  }

  private setCanvasSizeFromStyle(canvasWindow: CanvasWindow) {

    let style = window.getComputedStyle(canvasWindow.canvas);
    canvasWindow.width = Number(style.width.replace('px', ''));
    canvasWindow.height = Number(style.height.replace('px', ''));

    canvasWindow.canvas.width = canvasWindow.width;
    canvasWindow.canvas.height = canvasWindow.height;
  }

  protected processMouseEventInput(toolMouseEvent: ToolMouseEvent, e: MouseEvent, touchUp: boolean, canvasWindow: CanvasWindow) {

    this.activeCanvasWindow = canvasWindow;

    if (document.activeElement.nodeName == 'INPUT') {
      (<HTMLInputElement>document.activeElement).blur();
    }

    toolMouseEvent.button = e.button;
    toolMouseEvent.buttons = e.buttons;

    if (touchUp) {
      toolMouseEvent.button = -1;
      toolMouseEvent.buttons = 0;
    }

    // ____________| forefox | chrome        | opera         | firefox with pen
    // L down      | 0, 1    | 0, 1 and 0, 1 | 0, 1          | 0, 0
    // move with L | 0, 1    | 0, 1          | 0, 1          |
    // L up        | 0, 0    | 0, 0 and 0, 0 | 0, 0 and 0, 0 |
    // R down      | 2, 2    | 2, 2 and 2, 0 | 2, 2          | 2, 2
    // move with R | 2, 0    | 2, 0          | 2, 0          | 0, 2
    // R up        | 0, 0    | 2, 0 and 0, 0 | 0, 0          | 2, 0
    // M down      | 1, 4    | 1, 4 and 0, 4 | 1, 4          |
    // move with M | 0, 4    | 1, 0          | 0, 4          |
    // M up        | 1, 0    | 1, 0 and 0, 0 | 1, 0 and 0, 0 |
    //console.log(e.button + ', ' + e.buttons);

    toolMouseEvent.offsetX = e.offsetX;
    toolMouseEvent.offsetY = e.offsetY;
    this.calculateTransfomredMouseParams(toolMouseEvent, canvasWindow);

    toolMouseEvent.processMouseDragging();

    //console.log(e.offsetX.toFixed(2) + ',' + e.offsetY.toFixed(2) + '  ' + toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
  }

  protected getTouchInfo(toolMouseEvent: ToolMouseEvent, e: TouchEvent, touchDown: boolean, touchUp: boolean, canvasWindow: CanvasWindow) {

    this.activeCanvasWindow = canvasWindow;

    if (e.touches == undefined || e.touches.length == 0) {
      toolMouseEvent.button = 0;
      toolMouseEvent.buttons = 0;
      return;
    }

    //console.log(e.touches.length);

    var rect = canvasWindow.canvas.getBoundingClientRect();

    let touch: any = e.touches[0];

    if (!touchDown && touch.force < 0.1) {
      return;
    }

    if (touchDown) {
      toolMouseEvent.button = 0;
      toolMouseEvent.buttons = 1;
    }
    if (touchUp) {
      toolMouseEvent.button = 0;
      toolMouseEvent.buttons = 0;
    }
    toolMouseEvent.offsetX = touch.clientX - rect.left;
    toolMouseEvent.offsetY = touch.clientY - rect.top;

    this.calculateTransfomredMouseParams(toolMouseEvent, canvasWindow);

    //console.log(touch.clientX.toFixed(2) + ',' + touch.clientY.toFixed(2) + '(' + ')'  + '  ' + this.toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
  }

  protected calculateTransfomredLocation(resultVec: Vec3, canvasWindow: CanvasWindow, x: float, y: float) {

    canvasWindow.caluclateViewMatrix(this.view2DMatrix);
    mat4.invert(this.invView2DMatrix, this.view2DMatrix);

    vec3.set(this.tempVec3, x, y, 0.0);
    vec3.transformMat4(resultVec, this.tempVec3, this.invView2DMatrix);
  }

  protected calculateTransfomredMouseParams(toolMouseEvent: ToolMouseEvent, canvasWindow: CanvasWindow) {

    this.calculateTransfomredLocation(toolMouseEvent.location, canvasWindow, toolMouseEvent.offsetX, toolMouseEvent.offsetY);

    vec3.copy(this.toolEnv.mouseCursorLocation, toolMouseEvent.location);
  }

  protected getWheelInfo(toolMouseEvent: ToolMouseEvent, e: MouseEvent) {

    let wheelDelta = 0.0;
    if ('wheelDelta' in e) {

      wheelDelta = e['wheelDelta'];
    }
    else if ('deltaY' in e) {

      wheelDelta = e['deltaY'];
    }
    else if ('wheelDeltaY' in e) {

      wheelDelta = e['wheelDeltaY'];
    }

    if (wheelDelta > 0) {

      wheelDelta = 1.0;
    }
    else if (wheelDelta < 0) {

      wheelDelta = -1.0;
    }

    toolMouseEvent.wheelDelta = wheelDelta;
  }

  protected startShowingLayerItem(item: LayerWindowItem) {

    if (item != null) {

      this.selectCurrentLayerAnimationLayer = item.layer;
      this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax;
      this.toolEnv.setRedrawMainWindow();

      this.layerWindow_SetViewLocationToItem(item);
    }
  }

  protected startShowingCurrentLayer() {

    let item = this.layerWindow_FindCurrentItem();

    this.startShowingLayerItem(item);
  }

  private copyLastViewLocation(setUpdate: boolean) {

    this.isViewLocationMoved = setUpdate;
    vec3.copy(this.lastViewLocation, this.mainWindow.viewLocation);
    this.lastViewScale = this.mainWindow.viewScale;
    this.lastViewRotation = this.mainWindow.viewRotation;
  }

  protected updateViewRotation() {

    var env = this.toolEnv;

    this.copyLastViewLocation(true);

    if (this.mainWindow.viewRotation >= 360.0) {
      this.mainWindow.viewRotation -= 360.0;
    }
    if (this.mainWindow.viewRotation <= 0.0) {
      this.mainWindow.viewRotation += 360.0;
    }

    env.setRedrawMainWindowEditorWindow();
  }

  protected addViewScale(addScale: float) {

    var env = this.toolEnv;

    this.copyLastViewLocation(true);

    this.mainWindow.addViewScale(addScale);

    env.setRedrawMainWindowEditorWindow();
  }

  // ViewKeyframe for timeline

  protected collectViewKeyframeContext() {

    let context = this.toolContext;

    // Collects layers

    let layers = new List<Layer>();
    Layer.collectLayerRecursive(layers, context.document.rootLayer);

    // Creates all view-keyframes.

    let viewKeyFrames = new List<ViewKeyframe>();
    this.collectViewKeyframeContext_CollectKeyframes(viewKeyFrames, layers);
    let sortedViewKeyFrames = viewKeyFrames.sort((a, b) => { return a.frame - b.frame });

    // Collects layers for each view-keyframes

    this.collectViewKeyframeContext_CollectKeyframeLayers(sortedViewKeyFrames, layers);

    this.viewLayerContext.keyframes = sortedViewKeyFrames;
  }

  private collectViewKeyframeContext_CollectKeyframes(result: List<ViewKeyframe>, layers: List<Layer>) {

    let keyframeDictionary = new Dictionary<boolean>();

    for (let layer of layers) {

      if (VectorLayer.isVectorLayer(layer)) {

        let vectorLayer = <VectorLayer>(layer);

        for (let keyframe of vectorLayer.keyframes) {

          let frameText = keyframe.frame.toString();

          if (!DictionaryContainsKey(keyframeDictionary, frameText)) {

            let viewKeyframe = new ViewKeyframe();
            viewKeyframe.frame = keyframe.frame;
            result.push(viewKeyframe);

            keyframeDictionary[frameText] = true;
          }
        }
      }
    }
  }

  private collectViewKeyframeContext_CollectKeyframeLayers(result: List<ViewKeyframe>, layers: List<Layer>) {

    // All view-keyframes contains view-layer info for all layer.

    for (let viewKeyframe of result) {

      for (let layer of layers) {

        let keyframeLayer = new ViewKeyframeLayer();
        keyframeLayer.layer = layer;

        if (VectorLayer.isVectorLayer(layer)) {

          let vectorLayer = <VectorLayer>layer;

          let max_KeyFrame: VectorLayerKeyframe = null;
          for (let keyframe of vectorLayer.keyframes) {

            if (keyframe.frame > viewKeyframe.frame) {
              break;
            }

            max_KeyFrame = keyframe;
          }

          if (max_KeyFrame == null) {

            throw ('The document contains a layer that has no keyframe!');
          }

          keyframeLayer.vectorLayerKeyframe = max_KeyFrame;
        }

        viewKeyframe.layers.push(keyframeLayer);
      }
    }
  }

  protected findNextViewKeyframeIndex(startFrame: int, searchDirection: int): int {


    let viewKeyframes = this.viewLayerContext.keyframes;

    let startKeyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, startFrame);

    if (startKeyframeIndex == -1) {
      return -1;
    }

    let resultIndex = startKeyframeIndex + searchDirection;

    if (resultIndex < 0) {

      return 0;
    }

    if (resultIndex >= viewKeyframes.length) {

      return viewKeyframes.length - 1;
    }

    return resultIndex;
  }

  protected findNextViewKeyframeFrame(startFrame: int, searchDirection: int): int {


    let keyframeIndex = this.findNextViewKeyframeIndex(startFrame, searchDirection);

    if (keyframeIndex == -1) {

      return -2;
    }
    else {

      return this.viewLayerContext.keyframes[keyframeIndex].frame;
    }
  }

  // Laye window

  private layerWindow_Initialize() {

    let wnd = this.layerWindow;

    wnd.layerWindowCommandButtons = new List<RectangleLayoutArea>();
    wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.addLayer).setIcon(1));
    wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.deleteLayer).setIcon(2));
    wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.moveUp).setIcon(3));
    wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.moveDown).setIcon(4));
  }

  protected layerWindow_CollectItems(document: DocumentData) {

    let wnd = this.layerWindow;

    wnd.layerWindowItems = new List<LayerWindowItem>();
    this.layerWindow_CollectItemsRecursive(wnd.layerWindowItems, document.rootLayer, 0);

    let previousItem: LayerWindowItem = null;
    for (let item of wnd.layerWindowItems) {

      item.index = item.layer.hashID;

      item.previousItem = previousItem;

      if (previousItem != null) {

        previousItem.nextItem = item;
      }

      previousItem = item;
    }
  }

  private layerWindow_CollectItemsRecursive(result: List<LayerWindowItem>, parentLayer: Layer, currentDepth: int) {

    let siblingItem = null;

    for (let layer of parentLayer.childLayers) {

      let item = new LayerWindowItem();
      item.layer = layer;
      item.parentLayer = parentLayer;
      item.hierarchyDepth = currentDepth;
      item.previousSiblingItem = siblingItem;

      if (siblingItem != null) {

        siblingItem.nextSiblingItem = item;
      }

      result.push(item);

      if (layer.childLayers.length > 0) {

        this.layerWindow_CollectItemsRecursive(result, layer, currentDepth + 1);
      }

      siblingItem = item;
    }
  }

  protected layerWindow_FindCurrentItemIndex() {

    let wnd = this.layerWindow;

    for (let index = 0; index < wnd.layerWindowItems.length; index++) {
      let item = wnd.layerWindowItems[index];

      if (item.layer == this.toolContext.currentLayer) {

        return index;
      }
    }

    return -1;
  }

  protected layerWindow_FindCurrentItem(): LayerWindowItem {

    let wnd = this.layerWindow;

    let index = this.layerWindow_FindCurrentItemIndex();

    if (index != -1) {

      let item = wnd.layerWindowItems[index];

      return item;
    }

    return null;
  }

  protected layerWindow_SetViewLocationToItem(item: LayerWindowItem) {

    let layerWindow = this.layerWindow;

    let viewTop = layerWindow.viewLocation[1];

    if (item.top < viewTop + layerWindow.layerCommandButtonButtom) {

      layerWindow.viewLocation[1] = item.top - layerWindow.layerCommandButtonButtom;
    }
    else if (item.top > viewTop + layerWindow.height - layerWindow.layerItemHeight * 2.0) {

      layerWindow.viewLocation[1] = item.top - layerWindow.height + layerWindow.layerItemHeight * 2.0;
    }
  }

  // Palette selector window

  protected initializePaletteSelectorWindow() {

    this.paletteSelectorWindow.commandButtonAreas = new List<RectangleLayoutArea>();

    this.paletteSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.lineColor).setIcon(5));
    this.paletteSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.fillColor).setIcon(6));
  }

  protected paletteSelector_SetCurrentModeForCurrentLayer() {

    if (VectorLayer.isVectorLayer(this.toolContext.currentLayer)) {

      let vectorLayer = <VectorLayer>(this.toolContext.currentLayer);

      if (vectorLayer.fillAreaType != FillAreaTypeID.none) {

        this.paletteSelectorWindow.currentTargetID = PaletteSelectorWindowButtonID.fillColor;
      }
      else if (vectorLayer.drawLineType != DrawLineTypeID.none) {

        this.paletteSelectorWindow.currentTargetID = PaletteSelectorWindowButtonID.lineColor;
      }
    }
  }

  // Subtool window

  subToolViewItems = new List<SubToolViewItem>();

  protected subtoolWindow_CollectViewItems() {

    this.subToolViewItems = new List<SubToolViewItem>();

    let currentMainTool = this.getCurrentMainTool();

    for (let i = 0; i < currentMainTool.subTools.length; i++) {

      let tool = currentMainTool.subTools[i];

      let viewItem = new SubToolViewItem();
      viewItem.subToolIndex = i;
      viewItem.tool = tool;

      for (let buttonIndex = 0; buttonIndex < tool.inputOptionButtonCount; buttonIndex++) {

        let button = new SubToolViewItemOptionButton();
        button.index = buttonIndex;

        viewItem.buttons.push(button);
      }

      // TODO: 再描画時と同じ処理をしているため共通化する
      viewItem.isAvailable = tool.isAvailable(this.toolEnv);
      if (viewItem.buttons.length > 0) {

        // TODO: 複数ボタンが必要か検討
        viewItem.buttonStateID = tool.getOptionButtonState(0, this.toolEnv);
      }

      this.subToolViewItems.push(viewItem);
    }
  }

  //protected subtoolWindow_CaluculateLayout(subtoolWindow: SubtoolWindow) {

  //    let scale = subtoolWindow.subToolItemScale;
  //    let fullWidth = subtoolWindow.width - 1;
  //    let unitHeight = subtoolWindow.subToolItemUnitHeight * scale - 1;

  //    let currentY = 0;

  //    for (let viewItem of this.subToolViewItems) {

  //        viewItem.left = 0.0;
  //        viewItem.top = currentY;
  //        viewItem.right = fullWidth;
  //        viewItem.bottom = currentY + unitHeight - 1;

  //        currentY += unitHeight;
  //    }

  //    subtoolWindow.subToolItemsBottom = currentY;
  //}

  // Color mixer window

  protected getPaletteSelectorWindow_SelectedColor(): Vec4 {

    let wnd = this.paletteSelectorWindow;
    let env = this.toolEnv;

    if (wnd.currentTargetID == PaletteSelectorWindowButtonID.lineColor) {

      return env.currentVectorLayer.layerColor;
    }
    else {

      return env.currentVectorLayer.fillColor;
    }
  }

  protected getPaletteSelectorWindow_CurrentColor(): Vec4 {

    let wnd = this.paletteSelectorWindow;
    let env = this.toolEnv;

    if (wnd.currentTargetID == PaletteSelectorWindowButtonID.lineColor) {

      return env.getCurrentLayerLineColor();
    }
    else {

      return env.getCurrentLayerFillColor();
    }
  }

  protected setColorMixerValue(id: string, colorValue: float) {

    this.setInputElementNumber2Decimal(id + this.ID.colorMixer_id_number, colorValue);
    this.setInputElementRangeValue(id + this.ID.colorMixer_id_range, colorValue, 1.0);
  }

  // Dialogs

  currentModalDialogID: string = null;
  currentModalFocusElementID: string = null;
  currentModalDialogResult: string = null;
  currentModalDialog_DocumentData: DocumentData = null;
  layerPropertyWindow_EditLayer: Layer = null;
  paletteColorWindow_EditLayer: VectorLayer = null;
  paletteColorWindow_Mode = OpenPaletteColorModalMode.LineColor;
  openFileDialogTargetID = OpenFileDialogTargetID.none;
  modalOverlayOption = {
    speedIn: 0,
    speedOut: 100,
    opacity: 0.0
  };
  modalLoaderOption = {
    active: false
  };

  private createModalOptionObject(targetElementId: string): any {

    return {
      content: {
        target: targetElementId,
        close: true,
        speedIn: 0,
        delay: 0,
        positionX: 'center',
        positionY: 'center',
        speedOut: 100
      },
      overlay: this.modalOverlayOption,
      loader: this.modalLoaderOption
    };
  }

  protected isModalShown(): boolean {

    return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
  }

  protected closeModal() {

    Custombox.modal.closeAll();
  }

  protected openModal(modalID: string, focusElementName: string) {

    this.currentModalDialogID = modalID;
    this.currentModalFocusElementID = focusElementName;

    var modal: any = new Custombox.modal(
      this.createModalOptionObject(this.currentModalDialogID)
    );

    modal.open();
  }

  protected showMessageBox(text: string) {

    if (this.isModalShown()) {
      return;
    }

    this.setElementText(this.ID.messageDialogModal_message, text);

    this.openModal(this.ID.messageDialogModal, this.ID.messageDialogModal_ok);
  }

  protected openLayerPropertyModal(layer: Layer) {

    if (this.isModalShown()) {
      return;
    }

    // common layer properties

    let layerTypeName = this.layerTypeNameList[<int>layer.type];
    this.setElementText(this.ID.layerPropertyModal_layerTypeName, layerTypeName);

    this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);

    this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);

    this.setInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, layer.layerColor[3], 1.0);

    this.setInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget, layer.isRenderTarget);
    this.setInputElementBoolean(this.ID.layerPropertyModal_isMaskedBelowLayer, layer.isMaskedByBelowLayer);

    // for each layer type properties

    if (VectorLayer.isVectorLayer(layer)) {

      let vectorLayer = <VectorLayer>layer;

      this.setInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);

      this.setInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, vectorLayer.fillColor[3], 1.0);

      this.setRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, vectorLayer.drawLineType);

      this.setRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, vectorLayer.fillAreaType);
    }

    this.layerPropertyWindow_EditLayer = layer;

    this.openModal(this.ID.layerPropertyModal, this.ID.layerPropertyModal_layerName);
  }

  protected onClosedLayerPropertyModal() {

    let layer = this.layerPropertyWindow_EditLayer;

    // common layer properties

    let layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);

    if (!StringIsNullOrEmpty(layerName)) {

      layer.name = layerName;
    }

    this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
    layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 1.0, 1.0);

    layer.isRenderTarget = this.getInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget);
    layer.isMaskedByBelowLayer = this.getInputElementBoolean(this.ID.layerPropertyModal_isMaskedBelowLayer);

    if (VectorLayer.isVectorLayer(layer)) {

      let vectorLayer = <VectorLayer>layer;

      this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
      vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 1.0, 1.0);

      vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, DrawLineTypeID.layerColor);

      vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, FillAreaTypeID.fillColor);
    }

    this.layerPropertyWindow_EditLayer = null;
  }

  protected openPaletteColorModal(mode: OpenPaletteColorModalMode, documentData: DocumentData, layer: Layer) {

    if (this.isModalShown()) {
      return;
    }

    if (layer == null || !VectorLayer.isVectorLayer(layer)) {
      return;
    }

    let vectorLayer = <VectorLayer>layer;

    let targetName: string;
    let paletteColorIndex: int;
    if (mode == OpenPaletteColorModalMode.LineColor) {

      targetName = '線色';
      paletteColorIndex = vectorLayer.line_PaletteColorIndex;
    }
    else {

      targetName = '塗りつぶし色';
      paletteColorIndex = vectorLayer.fill_PaletteColorIndex;
    }

    this.setElementText(this.ID.paletteColorModal_targetName, targetName);
    this.setRadioElementIntValue(this.ID.paletteColorModal_colorIndex, paletteColorIndex);

    this.paletteColorWindow_Mode = mode;
    this.currentModalDialog_DocumentData = documentData;
    this.paletteColorWindow_EditLayer = vectorLayer;

    this.displayPaletteColorModalColors(documentData, vectorLayer);

    this.openModal(this.ID.paletteColorModal, null);
  }

  protected displayPaletteColorModalColors(documentData: DocumentData, vectorLayer: VectorLayer) {

    {
      let paletteColorIndex: int;
      if (this.paletteColorWindow_Mode == OpenPaletteColorModalMode.LineColor) {

        paletteColorIndex = vectorLayer.line_PaletteColorIndex;
      }
      else {

        paletteColorIndex = vectorLayer.fill_PaletteColorIndex;
      }

      let paletteColor = documentData.paletteColors[paletteColorIndex];
      this.setInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
      this.setInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, paletteColor.color[3], 1.0);
    }

    for (let paletteColorIndex = 0; paletteColorIndex < documentData.paletteColors.length; paletteColorIndex++) {

      let paletteColor = documentData.paletteColors[paletteColorIndex];

      this.setColorPaletteElementValue(paletteColorIndex, paletteColor.color);
    }
  }

  protected setColorPaletteElementValue(paletteColorIndex: int, color: Vec4) {

    let id = this.ID.paletteColorModal_colorValue + paletteColorIndex;
    this.setInputElementColor(id, color);
  }

  protected onClosedPaletteColorModal() {

    let documentData = this.currentModalDialog_DocumentData;
    let vectorLayer = this.paletteColorWindow_EditLayer;

    let paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);;

    if (this.paletteColorWindow_Mode == OpenPaletteColorModalMode.LineColor) {

      vectorLayer.line_PaletteColorIndex = paletteColorIndex;
    }
    else {

      vectorLayer.fill_PaletteColorIndex = paletteColorIndex;
    }

    let updateOnClose = false;
    if (updateOnClose) {

      {
        let paletteColor = documentData.paletteColors[paletteColorIndex];
        this.getInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
        paletteColor.color[3] = this.getInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, 1.0, 1.0);
      }

      for (let i = 0; i < documentData.paletteColors.length; i++) {

        let paletteColor = documentData.paletteColors[i];

        let id = this.ID.paletteColorModal_colorValue + i;
        this.getInputElementColor(id, paletteColor.color);
      }
    }

    this.currentModalDialog_DocumentData = null;
    this.paletteColorWindow_EditLayer = null;
  }

  protected openOperationOptionModal() {

    if (this.isModalShown()) {
      return;
    }

    this.setInputElementNumber(this.ID.operationOptionModal_LineWidth, this.toolContext.drawLineBaseWidth);
    this.setInputElementNumber(this.ID.operationOptionModal_LineMinWidth, this.toolContext.drawLineMinWidth);

    this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);

    this.openModal(this.ID.operationOptionModal, null);
  }

  protected openNewLayerCommandOptionModal() {

    if (this.isModalShown()) {
      return;
    }

    this.openModal(this.ID.newLayerCommandOptionModal, null);
  }

  protected openFileDialogModal(targetID: OpenFileDialogTargetID) {

    if (this.isModalShown()) {
      return;
    }

    this.openFileDialogTargetID = targetID;

    this.openModal(this.ID.openFileDialogModal, null);
  }

  protected onClosedFileDialogModal() {

    this.toolEnv.updateContext();

    let filePath = this.getInputElementFilePath(this.ID.openFileDialogModal_file);

    let targetID = this.openFileDialogTargetID;
    this.openFileDialogTargetID = OpenFileDialogTargetID.none;

    if (this.currentModalDialogResult != this.ID.openFileDialogModal_ok) {

      return;
    }

    if (targetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

      let currentTool = this.getCurrentTool();
      if (currentTool != null) {

        if (!StringIsNullOrEmpty(filePath)) {

          currentTool.onOpenFile(filePath, this.toolEnv);
        }
      }
    }
    else if (targetID == OpenFileDialogTargetID.openDocument) {

    }
    else if (targetID == OpenFileDialogTargetID.saveDocument) {

    }
  }

  protected openDocumentSettingModal() {

    if (this.isModalShown()) {
      return;
    }

    let documentData = this.toolContext.document;

    this.setInputElementNumber(this.ID.documentSettingModal_ViewScale, documentData.defaultViewScale);
    this.setInputElementNumber(this.ID.documentSettingModal_LineWidth, documentData.lineWidthBiasRate);
    this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, documentData.documentFrame[0]);
    this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, documentData.documentFrame[1]);
    this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, documentData.documentFrame[2]);
    this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, documentData.documentFrame[3]);

    this.openModal(this.ID.documentSettingModal, null);
  }

  protected onClosedDocumentSettingModal() {

    let documentData = this.toolContext.document;

    documentData.defaultViewScale = this.getInputElementNumber(this.ID.documentSettingModal_ViewScale, 1.0);
    if (documentData.defaultViewScale < this.mainWindow.minViewScale) {

      documentData.defaultViewScale = this.mainWindow.minViewScale;
    }
    documentData.lineWidthBiasRate = this.getInputElementNumber(this.ID.documentSettingModal_LineWidth, 1.0);
    documentData.documentFrame[0] = this.getInputElementNumber(this.ID.documentSettingModal_FrameLeft, -512);
    documentData.documentFrame[1] = this.getInputElementNumber(this.ID.documentSettingModal_FrameTop, -512);
    documentData.documentFrame[2] = this.getInputElementNumber(this.ID.documentSettingModal_FrameRight, 512);
    documentData.documentFrame[3] = this.getInputElementNumber(this.ID.documentSettingModal_FrameBottom, 512);
  }

  protected openExportImageFileModal() {

    if (this.isModalShown()) {
      return;
    }

    let exportFileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);

    if (StringIsNullOrEmpty(exportFileName)) {

      this.setExportImageFileNameFromFileName();
    }

    this.setRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, <int>this.toolContext.document.exportBackGroundType);

    this.openModal(this.ID.exportImageFileModal, this.ID.exportImageFileModal_ok);
  }

  protected setExportImageFileNameFromFileName() {

    let documentData = this.toolEnv.document;

    let fileName = this.getInputElementText(this.ID.fileName);
    let lastSeperatorIndex = StringLastIndexOf(fileName, '\\');
    if (lastSeperatorIndex == -1) {
      lastSeperatorIndex = StringLastIndexOf(fileName, '/');
    }
    let separatorDotIndex = StringLastIndexOf(fileName, '.');
    if (lastSeperatorIndex != -1 && separatorDotIndex != -1 && separatorDotIndex - lastSeperatorIndex > 0) {

      fileName = StringSubstring(fileName, lastSeperatorIndex + 1, separatorDotIndex - lastSeperatorIndex - 1);
    }

    fileName += '_' + ('00' + documentData.exportingCount).slice(-2);

    this.setInputElementText(this.ID.exportImageFileModal_fileName, fileName);

    documentData.exportingCount++;
  }

  protected openNewKeyframeModal() {

    this.openModal(this.ID.newKeyframeModal, null);
  }

  protected onClosedNewKeyframeModal() {

    if (this.currentModalDialogResult != this.ID.newKeyframeModal_ok) {
      return;
    }

    let env = this.toolEnv;

    let insertType = <int>(this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));

    if (insertType == 1) {

      let command = new Command_Animation_InsertKeyframeAllLayer();
      command.frame = env.document.animationSettingData.currentTimeFrame;
      command.prepareEditData(env);

      if (command.isAvailable(env)) {

        command.executeCommand(env);
        env.commandHistory.addCommand(command);
      }
    }
  }

  protected openDeleteKeyframeModal() {

    this.openModal(this.ID.deleteKeyframeModal, null);
  }

  protected onClosedDeleteKeyframeModal() {

    if (this.currentModalDialogResult != this.ID.deleteKeyframeModal_ok) {
      return;
    }

    let env = this.toolEnv;

    let insertType = <int>(this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));

    if (insertType == 1) {

      let command = new Command_Animation_DeleteKeyframeAllLayer();
      command.frame = env.document.animationSettingData.currentTimeFrame;
      command.prepareEditData(env);

      if (command.isAvailable(env)) {

        command.executeCommand(env);
        env.commandHistory.addCommand(command);
      }
    }
  }

  protected onModalWindowShown() {

    if (!StringIsNullOrEmpty(this.currentModalFocusElementID)) {

      let element = this.getElement(this.currentModalFocusElementID);
      element.focus();
    }
  }

  public openFileDialog(targetID: OpenFileDialogTargetID) {

    if (targetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

      if (ImageFileReferenceLayer.isImageFileReferenceLayer(this.toolContext.currentLayer)) {

        let ifrLayer = <ImageFileReferenceLayer>(this.toolContext.currentLayer);
        let filePath = ifrLayer.imageFilePath;

        this.openFileDialogModal(targetID);
      }

    }
    else if (targetID == OpenFileDialogTargetID.openDocument) {

    }
    else if (targetID == OpenFileDialogTargetID.saveDocument) {

    }
  }

  // Header window

  protected updateHeaderButtons() {

    let activeElementID = '';

    if (this.toolContext.editMode == EditModeID.drawMode
      && (this.toolContext.mainToolID == MainToolID.drawLine
        || this.toolContext.mainToolID == MainToolID.posing
        || this.toolContext.mainToolID == MainToolID.imageReferenceLayer)) {

      activeElementID = this.ID.menu_btnDrawTool;
    }
    else if (this.toolContext.editMode == EditModeID.editMode) {

      activeElementID = this.ID.menu_btnEditTool;
    }
    else {

      activeElementID = this.ID.menu_btnMiscTool;
    }

    this.uiMenuButtonsRef.update(activeElementID);
  }

  //private setHeaderButtonVisual(elementID: string, isSelected: boolean) {

  //    var element = this.getElement(elementID);

  //    if (isSelected) {

  //        element.classList.remove(this.ID.unselectedMainButton);
  //        element.classList.add(this.ID.selectedMainButton);
  //    }
  //    else {

  //        element.classList.remove(this.ID.selectedMainButton);
  //        element.classList.add(this.ID.unselectedMainButton);
  //    }
  //}

  protected setHeaderDocumentFileName(lastURL: string) {

    this.setInputElementText(this.ID.fileName, lastURL);
  }

  // Footer window

  protected footerText: string = '';
  protected footerTextBefore: string = '';

  protected updateFooterText() {

    if (this.footerText != this.footerTextBefore) {

      this.getElement(this.ID.footer).innerHTML = this.footerText;
      this.footerTextBefore = this.footerText;
    }
  }

  // Hit test

  protected hitTestLayout(areas: List<RectangleLayoutArea>, x: float, y: float): RectangleLayoutArea {

    for (let area of areas) {

      if (this.hitTestLayoutRectangle(area, x, y)) {

        return area;
      }
    }

    return null;
  }

  protected hitTestLayoutRectangle(area: RectangleLayoutArea, x: float, y: float): boolean {

    if (x >= area.left
      && x <= area.right
      && y >= area.top
      && y <= area.bottom) {

      return true;
    }
    else {

      return false;
    }
  }

  // HTML helper

  getElement(id: string): HTMLElement {

    let element = document.getElementById(id);

    if (element == null) {
      throw ('Could not find element "' + id + '"');
    }

    return element;
  }

  setElementText(id: string, text: string): HTMLElement {

    let element = <HTMLInputElement>(document.getElementById(id));

    element.innerText = text;

    return element;
  }

  setInputElementText(id: string, text: string): HTMLElement {

    let element = <HTMLInputElement>(document.getElementById(id));

    element.value = text;

    return element;
  }

  getInputElementText(id: string): string {

    let element = <HTMLInputElement>(document.getElementById(id));

    return element.value;
  }

  setInputElementNumber(id: string, value: float): HTMLElement {

    let element = <HTMLInputElement>(document.getElementById(id));

    element.value = value.toString();

    return element;
  }

  setInputElementNumber2Decimal(id: string, value: float): HTMLElement {

    let element = <HTMLInputElement>(document.getElementById(id));

    element.value = value.toFixed(2);

    return element;
  }

  getInputElementNumber(id: string, defaultValue: float): float {

    let element = <HTMLInputElement>(document.getElementById(id));

    if (element.value == '') {

      return defaultValue;
    }

    return Number(element.value);
  }

  setInputElementRangeValue(id: string, value: float, max: float): HTMLElement {

    let element = <HTMLInputElement>(document.getElementById(id));

    element.value = (value / max * Number(element.max)).toString();

    return element;
  }

  getInputElementRangeValue(id: string, max: int, defaultValue: float): float {

    let element = <HTMLInputElement>(document.getElementById(id));

    if (StringIsNullOrEmpty(element.value)) {

      return defaultValue;
    }

    let value = Number(element.value) / Number(element.max) * max;

    return value;
  }

  setRadioElementIntValue(elementName: string, value: int) {

    let valueText = value.toString();

    let elements = document.getElementsByName(elementName);

    for (var i = 0; i < elements.length; i++) {
      let radio = <HTMLInputElement>elements[i];

      radio.checked = (radio.value == valueText);
    }
  }

  getRadioElementIntValue<T>(elementName: string, defaultValue: T): T {

    let value = defaultValue;

    let elements = document.getElementsByName(elementName);

    for (var i = 0; i < elements.length; i++) {
      let radio = <HTMLInputElement>elements[i];

      if (radio.checked) {

        value = <any>(Number(radio.value));
      }
    }

    return value;
  }

  setInputElementBoolean(id: string, checked: boolean) {

    let element = <HTMLInputElement>(document.getElementById(id));

    element.checked = checked;
  }

  getInputElementBoolean(id: string): boolean {

    let element = <HTMLInputElement>(document.getElementById(id));

    return element.checked;
  }

  setInputElementColor(id: string, color: Vec4): Vec4 {

    let colorText = '#' + ColorLogic.rgbToHex2String(color);

    let element = <HTMLInputElement>(document.getElementById(id));

    element.value = colorText;

    return color;
  }

  getInputElementColor(id: string, result: Vec4): Vec4 {

    let element = <HTMLInputElement>(document.getElementById(id));

    let colorText = element.value;

    ColorLogic.hex2StringToRGB(result, colorText);

    return result;
  }

  getInputElementFilePath(id: string): string {

    let element = <HTMLInputElement>(document.getElementById(id));

    if (element.files.length == 0) {

      return null;
    }

    let file: any = element.files[0];

    return file.path;
  }
}
