import { int, float, List } from '../base/conversion';
import { AnimationSettingData, Layer, InputSideID } from '../base/data';
import { InputableWindow, ToolBase } from '../base/tool';
import { RectangleLayoutArea } from '../logics/layout';

export class MainWindow extends InputableWindow {
}

export class EditorWindow extends InputableWindow {
}

export class LayerWindow extends InputableWindow {

  layerItemButtonScale = 0.5;
  layerItemButtonWidth = 64.0;
  layerItemButtonHeight = 64.0;
  layerCommandButtonButtom = 0.0;

  layerItemHeight = 24.0;
  layerItemFontSize = 16.0;

  layerItemVisibilityIconWidth = 24.0;
  layerItemVisibilityIconRight = 24.0;

  layerItemsBottom = 0.0;

  layerWindowLayoutArea = new RectangleLayoutArea();

  layerWindowItems = new List<LayerWindowItem>();

  layerWindowCommandButtons: List<RectangleLayoutArea> = null;
}

export class SubtoolWindow extends InputableWindow {

  subToolItemScale = 0.5;
  subToolItemUnitWidth = 256;
  subToolItemUnitHeight = 128;

  subToolItemsBottom = 0.0;
}

export class ColorCanvasWindow extends InputableWindow {

  isDrawingDone = false;
}

export enum MainCommandButtonID {

  none = 0,
  open = 1,
  save = 2,
  export = 3,
  settings = 4,
  layerWindow = 5,
  paletteWindow = 6,
  timeLineWindow = 7,
}

export class TimeLineWindow extends InputableWindow {

  leftPanelWidth = 100.0;
  frameUnitWidth = 8.0;

  getFrameUnitWidth(aniSetting: AnimationSettingData): float {

    return this.frameUnitWidth * aniSetting.timeLineWindowScale;
  }

  getTimeLineLeft(): float {

    return this.leftPanelWidth;
  }

  getTimeLineRight(): float {

    return this.getTimeLineLeft() + this.width - 1;
  }

  getFrameByLocation(x: float, aniSetting: AnimationSettingData): int {

    let left = this.getTimeLineLeft();
    let right = this.getTimeLineRight();

    if (x < left) {
      return -1;
    }

    if (x > right) {
      return -1;
    }

    let frameUnitWidth = this.getFrameUnitWidth(aniSetting);

    let absoluteX = x - (left - aniSetting.timeLineWindowViewLocationX);

    let frame = Math.floor(absoluteX / frameUnitWidth);
    if (frame < 0) {
      frame = 0;
    }

    return frame;
  }

  getFrameLocation(frame: float, aniSetting: AnimationSettingData) {

    let left = this.getTimeLineLeft();
    let frameUnitWidth = this.getFrameUnitWidth(aniSetting);
    let x = left - aniSetting.timeLineWindowViewLocationX + frame * frameUnitWidth;

    return x;
  }
}

export enum PaletteSelectorWindowButtonID {

  none = 0,
  lineColor = 1,
  fillColor = 2,
}

export class PaletteSelectorWindow extends InputableWindow {

  leftMargin = 4.0;
  topMargin = 5.0;
  rightMargin = 5.0;

  buttonScale = 0.5;
  buttonWidth = 64.0;
  buttonHeight = 64.0;
  buttonRightMargin = 5.0;
  buttonBottomMargin = 5.0;

  commandButtonsBottom = 0.0;

  commandButtonAreas = new List<RectangleLayoutArea>();

  itemScale = 1.0;
  itemWidth = 34.0;
  itemHeight = 15.0;
  itemRightMargin = 5.0;
  itemBottomMargin = 5.0;

  itemAreas = new List<RectangleLayoutArea>();

  currentTargetID = PaletteSelectorWindowButtonID.lineColor;
}

export enum LayerWindowButtonID {

  none = 0,
  addLayer = 1,
  deleteLayer = 2,
  moveUp = 3,
  moveDown = 4,
}

export class LayerWindowItem extends RectangleLayoutArea {

  layer: Layer = null;
  parentLayer: Layer = null;
  previousItem: LayerWindowItem = null;
  nextItem: LayerWindowItem = null;
  previousSiblingItem: LayerWindowItem = null;
  nextSiblingItem: LayerWindowItem = null;
  hierarchyDepth = 0;

  margine = 0.0;
  visibilityIconWidth = 0.0;
  textLeft = 0.0;

  isVisible = false;
  isCurrentLayer = false;
  isSelected = false;
}

export class SubToolViewItem extends RectangleLayoutArea {

  subToolIndex = 0;
  isAvailable = false;
  buttonStateID = InputSideID.front;
  tool: ToolBase = null;
  buttons = new List<SubToolViewItemOptionButton>();
}

export class SubToolViewItemOptionButton extends RectangleLayoutArea {
}

export enum OpenPaletteColorModalMode {

  LineColor = 1,
  FillColor = 2
}

export enum NewLayerTypeID {

  none = 0,
  vectorLayer = 1,
  vectorLayer_Fill = 2,
  autoFill = 3,
  vectorLayerReferenceLayer = 4,
  imageFileReferenceLayer = 5,
  posingLayer = 6,
  groupLayer = 7,
}

export enum RibbonUIControlID {

  none = 0,
  brushWidth_Max,
  brushWidth_Min,
  eraserWidth_Max,
  eraserWidth_Min,
}

export class HTMLElementID {

  none = 'none';

  fileName = 'fileName';

  header = 'header-ui';
  ribbonUI = 'ribbon-ui';
  footerUI = 'footer-ui';
  footer = 'footer';

  subtoolWindow = "subtoolWindow";

  mainCanvas = 'mainCanvas';
  editorCanvas = 'editorCanvas';
  webglCanvas = 'webglCanvas';
  layerCanvas = 'layerCanvas';
  //subtoolCanvas = 'subtoolCanvas';
  timeLineCanvas = 'timeLineCanvas';
  paletteSelectorCanvas = 'paletteSelectorCanvas';
  colorMixerWindow_colorCanvas = 'colorMixer_colorCanvas';

  mainToolButtons = "mainToolButtons";
  menu_btnDrawTool = 'menu_btnDrawTool';
  menu_btnMiscTool = 'menu_btnMiscTool';
  menu_btnEditTool = 'menu_btnEditTool';
  menu_btnOperationOption = 'menu_btnOperationOption';
  menu_btnPalette1 = 'menu_btnPalette1';
  menu_btnPalette2 = 'menu_btnPalette2';

  unselectedMainButton = 'unselectedMainButton';
  selectedMainButton = 'selectedMainButton';

  colorMixer_id_number = '_number';
  colorMixer_id_range = '_range';
  colorMixer_alpha = 'colorMixer_alpha';
  colorMixer_red = 'colorMixer_red';
  colorMixer_green = 'colorMixer_green';
  colorMixer_blue = 'colorMixer_blue';
  colorMixer_hue = 'colorMixer_hue';
  colorMixer_sat = 'colorMixer_sat';
  colorMixer_val = 'colorMixer_val';

  messageDialogModal = '#messageDialogModal';
  messageDialogModal_message = 'messageDialogModal_message';
  messageDialogModal_ok = 'messageDialogModal_ok';

  openFileDialogModal = '#openFileDialogModal';
  openFileDialogModal_file = 'openFileDialogModal_file';
  openFileDialogModal_ok = 'openFileDialogModal_ok';
  openFileDialogModal_cancel = 'openFileDialogModal_cancel';

  layerPropertyModal = '#layerPropertyModal';
  layerPropertyModal_layerTypeName = 'layerPropertyModal_layerTypeName';
  layerPropertyModal_layerName = 'layerPropertyModal_layerName';
  layerPropertyModal_layerColor = 'layerPropertyModal_layerColor';
  layerPropertyModal_layerAlpha = 'layerPropertyModal_layerAlpha';
  layerPropertyModal_drawLineType = 'layerPropertyModal_drawLineType';
  layerPropertyModal_fillColor = 'layerPropertyModal_fillColor';
  layerPropertyModal_fillColorAlpha = 'layerPropertyModal_fillColorAlpha';
  layerPropertyModal_fillAreaType = 'layerPropertyModal_fillAreaType';
  layerPropertyModal_isRenderTarget = 'layerPropertyModal_isRenderTarget';
  layerPropertyModal_isMaskedBelowLayer = 'layerPropertyModal_isMaskedBelowLayer';

  paletteColorModal = '#paletteColorModal';
  paletteColorModal_targetName = 'paletteColorModal_targetName';
  paletteColorModal_currentColor = 'paletteColorModal_currentColor';
  paletteColorModal_currentAlpha = 'paletteColorModal_currentAlpha';
  paletteColorModal_colors = 'paletteColorModal_colors';
  paletteColorModal_colorItemStyle = 'colorItem';
  paletteColorModal_colorIndex = 'paletteColorModal_colorIndex';
  paletteColorModal_colorValue = 'paletteColorModal_colorValue';
  paletteColorModal_colorCanvas = 'paletteColorModal_colorCanvas';

  operationOptionModal = '#operationOptionModal';
  operationOptionModal_LineWidth = 'operationOptionModal_LineWidth'
  operationOptionModal_LineMinWidth = 'operationOptionModal_LineMinWidth'
  operationOptionModal_operationUnit = 'operationOptionModal_operationUnit'

  newLayerCommandOptionModal = '#newLayerCommandOptionModal';
  newLayerCommandOptionModal_layerType = 'newLayerCommandOptionModal_layerType';
  newLayerCommandOptionModal_ok = 'newLayerCommandOptionModal_ok';
  newLayerCommandOptionModal_cancel = 'newLayerCommandOptionModal_cancel';

  documentSettingModal = '#documentSettingModal';
  documentSettingModal_ViewScale = 'documentSettingModal_ViewScale';
  documentSettingModal_LineWidth = 'documentSettingModal_LineWidth';
  documentSettingModal_FrameLeft = 'documentSettingModal_FrameLeft';
  documentSettingModal_FrameTop = 'documentSettingModal_FrameTop';
  documentSettingModal_FrameRight = 'documentSettingModal_FrameRight';
  documentSettingModal_FrameBottom = 'documentSettingModal_FrameBottom';

  exportImageFileModal = '#exportImageFileModal';
  exportImageFileModal_fileName = 'exportImageFileModal_fileName';
  exportImageFileModal_imageFileType = 'exportImageFileModal_imageFileType';
  exportImageFileModal_backGroundType = 'exportImageFileModal_backGroundType';
  exportImageFileModal_scale = 'exportImageFileModal_scale';
  exportImageFileModal_ok = 'exportImageFileModal_ok';
  exportImageFileModal_cancel = 'exportImageFileModal_cancel';

  newKeyframeModal = '#newKeyframeModal';
  newKeyframeModal_InsertType = 'newKeyframeModal_InsertType';
  newKeyframeModal_ok = 'newKeyframeModal_ok';
  newKeyframeModal_cancel = 'newKeyframeModal_cancel';

  deleteKeyframeModal = '#deleteKeyframeModal';
  deleteKeyframeModal_InsertType = 'deleteKeyframeModal_InsertType';
  deleteKeyframeModal_ok = 'deleteKeyframeModal_ok';
  deleteKeyframeModal_cancel = 'deleteKeyframeModal_cancel';
}
