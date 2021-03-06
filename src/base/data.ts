﻿import { int, float, List, Dictionary, DictionaryContainsKey, StringIsNullOrEmpty, StringLastIndexOf, StringSubstring } from '../base/conversion';
import { CanvasWindow } from '../renders/render2d';
import { GPUVertexBuffer } from '../logics/gpu_data';
import { ImageResource, ModelResource, ModelFile } from '../posing3d/posing3d_view';
import { Posing3DSubToolID } from './tool';

// Setting

export class LocalSetting {

  currentDirectoryPath: string = null;
  referenceDirectoryPath: string = '';
  exportPath: string = null;
  lastUsedFilePaths: List<string> = [];
  maxLastUsedFilePaths = 5;
  fileSections: LocalSettingFileSection[] = [];
}

export class LocalSettingFileSection {

  index: int = 0;
  name = '';
  path = '';
}

// Color

export class PaletteColor {

  color = vec4.fromValues(1.0, 1.0, 1.0, 1.0);

  // runtime
  isSelected = false;
}

// Base layer class

export enum LayerTypeID {

  none = 0,
  rootLayer = 1,
  vectorLayer = 2,
  groupLayer = 3,
  imageFileReferenceLayer = 4,
  posingLayer = 5,
  vectorLayerReferenceLayer = 6,
  autoFillLayer = 7,
}

export class Layer {

  type = LayerTypeID.none;
  name: string = null;
  isVisible = true;
  isSelected = false;
  isRenderTarget = true;
  isMaskedByBelowLayer = false;

  childLayers = new List<Layer>();

  layerColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

  // runtime
  isHierarchicalSelected = true;
  isHierarchicalVisible = true;
  bufferCanvasWindow: CanvasWindow = null;

  // when serializing only
  static hashIDCount = 1;

  static getHashID() {

    return Layer.hashIDCount++;
  }

  hashID = Layer.getHashID();

  // file only
  ID: int;

  static collectLayerRecursive(result: List<Layer>, parentLayer: Layer) {

    for (let layer of parentLayer.childLayers) {

      result.push(layer);

      if (layer.childLayers.length > 0) {

        Layer.collectLayerRecursive(result, layer);
      }
    }
  }

  static updateHierarchicalStatesRecursive(parentLayer: Layer) {

    for (let layer of parentLayer.childLayers) {

      layer.isHierarchicalSelected = layer.isSelected || Layer.isSelected(parentLayer);
      layer.isHierarchicalVisible = layer.isVisible && Layer.isVisible(parentLayer);

      if (layer.childLayers.length > 0) {

        Layer.updateHierarchicalStatesRecursive(layer);
      }
    }
  }

  static isEditTarget(layer: Layer): boolean {

    return (Layer.isSelected(layer) && Layer.isVisible(layer));
  }

  static isSelected(layer: Layer): boolean {

    return (layer.isSelected || layer.isHierarchicalSelected);
  }

  static isVisible(layer: Layer): boolean {

    return (layer.isVisible && layer.isHierarchicalVisible);
  }

  static isRootLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.rootLayer
    );
  }
}

// Vector layer

export enum LinePointModifyFlagID {

  none = 0,
  selectedToUnselected = 1,
  unselectedToSelected = 2,
  delete = 3,
  edit = 4,
}

export class VectorPoint {

  // runtime
  location = vec3.fromValues(0.0, 0.0, 0.0);
  lineWidth = 1.0;
  isSelected = false;
  modifyFlag = LinePointModifyFlagID.none;
  tempLocation = vec3.fromValues(0.0, 0.0, 0.0);
  adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
  adjustingLineWidth = 0.0;
  adjustingLengthFrom = 1.0; // end position to draw segment of side of from-point (0.0 - 1.0)
  adjustingLengthTo = 0.0; // start position to draw segment of side of to-point (0.0 - 1.0)
  totalLength = 0.0;
  curvature = 0.0;
  location3D = vec3.fromValues(0.0, 0.0, 0.0);

  // file only
  v: float[]; // location
  w: float;   // lineWidth
  s: int;     // isSelected

  static clone(srcPoint: VectorPoint): VectorPoint {

    let point = new VectorPoint();

    vec3.copy(point.location, srcPoint.location);
    point.lineWidth = srcPoint.lineWidth;

    vec3.copy(point.adjustingLocation, point.location);
    point.adjustingLineWidth = point.lineWidth;

    return point;
  }
}

export enum VectorLineModifyFlagID {

  none = 0,
  selectedToUnselected = 1,
  unselectedToSelected = 2,
  delete = 3,
  deletePoints = 4,
  deleteLine = 5, // delete the line without operations per point
  edit = 6,
  transform = 7,
  resampling = 8
}

export class VectorStroke {

  points = new List<VectorPoint>();
  continuousFill = false;
  isSelected = false;

  // runtime
  modifyFlag = VectorLineModifyFlagID.none;

  isCloseToMouse = false;

  left = 999999.0;
  top = 999999.0;
  right = -999999.0;
  bottom = -999999.0;
  range = 0.0;

  totalLength = 0.0;
}

export enum VectorGroupModifyFlagID {

  none = 0,
  modifyLines = 1,
  deleteLines = 2,
  delete = 3,
  edit = 4,
}

export class VectorStrokeGroup {

  lines = new List<VectorStroke>();
  isSelected = false;

  // runtime
  modifyFlag = VectorGroupModifyFlagID.none;
  linePointModifyFlag = VectorGroupModifyFlagID.none;
  buffer = new GPUVertexBuffer();
  isUpdated = false;

  static setUpdated(group: VectorStrokeGroup) {

    group.isUpdated = true;
    group.buffer.isStored = false;
  }

  static setGroupsUpdated(groups: List<VectorStrokeGroup>) {

    for (let group of groups) {

      VectorStrokeGroup.setUpdated(group);
    }
  }
}

export class VectorDrawingUnit {

  groups: VectorStrokeGroup[] = [];
}

export class VectorGeometry {

  units: VectorDrawingUnit[] = [];
}

export class VectorKeyframe {

  frame = 0;
  geometry: VectorGeometry = null;
}

export enum DrawLineTypeID {

  none = 1,
  layerColor = 2,
  paletteColor = 3,
}

export enum FillAreaTypeID {

  none = 1,
  fillColor = 2,
  paletteColor = 3,
}

export enum EyesSymmetryInputSideID {

  none = 0,
  left = 1,
  right = 2,
}

export class VectorLayer extends Layer {

  type = LayerTypeID.vectorLayer;

  keyframes = new List<VectorKeyframe>();

  drawLineType = DrawLineTypeID.paletteColor;

  fillAreaType = FillAreaTypeID.none;
  fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);

  line_PaletteColorIndex = 0;
  fill_PaletteColorIndex = 1;

  eyesSymmetryEnabled = false;
  eyesSymmetryInputSide = EyesSymmetryInputSideID.left;
  posingLayer: PosingLayer = null;

  // file only
  posingLayerID: int;

  // runtime
  eyesSymmetryGeometry: VectorGeometry = null;

  static isVectorLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
          || layer.type == LayerTypeID.vectorLayerReferenceLayer
          || layer.type == LayerTypeID.autoFillLayer
      )
    );
  }

  static isVectorLayerWithOwnData(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
          || layer.type == LayerTypeID.autoFillLayer
      )
    );
  }

  static findLastKeyframeIndex(vectorLayer: VectorLayer, targetFrame: int): int {

    let keyframeIndex = -1;
    for (let index = 0; index < vectorLayer.keyframes.length; index++) {

      let keyframe = vectorLayer.keyframes[index];

      if (keyframe.frame == targetFrame) {

        keyframeIndex = index;
        break;
      }

      if (keyframe.frame > targetFrame) {
        break;
      }

      keyframeIndex = index;
    }

    return keyframeIndex;
  }

  constructor() {
    super();

    let key = new VectorKeyframe();
    key.frame = 0;
    key.geometry = new VectorGeometry();
    this.keyframes.push(key);
  }
}

export class VectorLayerReferenceLayer extends VectorLayer {

  type = LayerTypeID.vectorLayerReferenceLayer;

  referenceLayer: VectorLayer = null;

  // file only
  referenceLayerID: int;

  static isVectorLayerReferenceLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayerReferenceLayer
      )
    );
  }
}

export class AutoFillLayer extends VectorLayer {

  type = LayerTypeID.autoFillLayer;

  static isAutoFillLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.autoFillLayer
      )
    );
  }
}

// Group layer

export class GroupLayer extends Layer {

  type = LayerTypeID.groupLayer;

  static isGroupLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.groupLayer
      )
    );
  }
}

// Image file reference layer

export class ImageFileReferenceLayer extends Layer {

  type = LayerTypeID.imageFileReferenceLayer;

  imageFilePath: string = null;

  location = vec3.fromValues(0.0, 0.0, 0.0);
  rotation = vec3.fromValues(0.0, 0.0, 0.0);
  scale = vec3.fromValues(1.0, 1.0, 1.0);

  // runtime

  imageResource: ImageResource = null;
  imageLoading = false;

  adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
  adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0);
  adjustingScale = vec3.fromValues(1.0, 1.0, 1.0);

  static isImageFileReferenceLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.imageFileReferenceLayer
    );
  }

  static isLoaded(layer: ImageFileReferenceLayer): boolean {

    return (layer.imageResource != null && layer.imageResource.loaded);
  }
}

// Posing

export class PosingModel {

  // Head to body
  headSphereSize = 0.12; // 14cm
  headTwistSphereSize = 0.18; //
  headCenterLocation = vec3.fromValues(0.0, 0.0, 0.0);
  headTopLocation = vec3.fromValues(0.0, 0.0, 0.0);
  headTopToNeckVector = vec3.fromValues(0.0, 0.0, 0.0);

  bodySphereSize = 0.30; // 44cm
  bodySphereLocation = vec3.fromValues(0.0, -0.03, -0.19);
  neckSphereLocation = vec3.fromValues(0.0, -0.03, -0.17);

  shoulderSphereLocation = vec3.fromValues(0.0, -0.03, -0.17);

  bodyRotationSphereSize = 0.15; // 11cm
  bodyRotationSphereLocation = vec3.fromValues(0.0, 0.0, -0.31);

  hipsSphereSize = 0.30; // 44cm

  // Arms
  leftArm1Location = vec3.fromValues(-0.130, 0.0, -0.05);
  rightArm1Location = vec3.fromValues(+0.130, 0.0, -0.05);

  leftArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
  rightArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);

  leftArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
  rightArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);

  // Legs
  leftLeg1Location = vec3.fromValues(-0.11, 0.0, -0.46);
  rightLeg1Location = vec3.fromValues(+0.11, 0.0, -0.46);

  leftLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
  rightLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);

  leftLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
  rightLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);

  // runtime
  chestModelConvertMatrix = mat4.create();
  hipsModelConvertMatrix = mat4.create();
}

export class PosingModelBoneInputSetting {

  inputName = '';
  inputType = ''; //  baseSize, direction
  modelName = '';
  dependentInputName = '';
}

export enum InputSideID {
  none = 0,
  front = 1,
  back = 2
}

export class PosingInputData {

  inputDone = false;

  // runtime
  parentMatrix: Mat4 = null;
  hitTestSphereRadius: float = 0.0;
}

export class HeadLocationInputData extends PosingInputData {

  center = vec3.fromValues(0.0, 0.0, 0.0);
  radius = 0.0;
  editLine: VectorStroke = null;

  matrix = mat4.create();

  headMatrix = mat4.create();
  bodyRootMatrix = mat4.create();
}

export class DirectionInputData extends PosingInputData {

  inputSideID = InputSideID.front;
  inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
  inputLocation2D = vec3.fromValues(0.0, 0.0, 0.0);

  directionInputDone = false;
  rollInputDone = false;
  rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
  rollInputAngle = 0.0;

  matrix = mat4.create();
}

export class HeadRotationInputData extends DirectionInputData {

  neckSphereMatrix = mat4.create();
}

export class HeadTwistInputData extends DirectionInputData {

  tempInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
}

export class BodyLocationInputData extends DirectionInputData {

  bodyMatrix = mat4.create();

  rotationCenterMatrix = mat4.create();

  leftArm1RootMatrix = mat4.create();
  rightArm1RootMatrix = mat4.create();
  leftLeg1RootMatrix = mat4.create();
  rightLeg1RootMatrix = mat4.create();
}

export class BodyRotationInputData extends DirectionInputData {

  inputSideID = InputSideID.front;
  inputLocation = vec3.fromValues(0.0, 0.0, 0.0);

  matrix = mat4.create();
}

export class JointPartInputData extends DirectionInputData {

  childJointRootMatrix = mat4.create();
}

export class PosingData {

  real3DViewHalfWidth = 1.0;
  real3DViewMeterPerPixel = 1.0;
  real3DModelDistance = 2.0;

  rootMatrix = mat4.create();

  headMatrix = mat4.create();
  headTopMatrix = mat4.create();
  neckSphereMatrix = mat4.create();

  chestRootMatrix = mat4.create();
  chestMatrix = mat4.create();

  shoulderRootMatrix = mat4.create();

  hipsRootMatrix = mat4.create();
  hipsMatrix = mat4.create();

  bodyRotationCenterMatrix = mat4.create();

  leftArm1RootMatrix = mat4.create();
  rightArm1RootMatrix = mat4.create();
  leftLeg1RootMatrix = mat4.create();
  rightLeg1RootMatrix = mat4.create();

  headLocationInputData = new HeadLocationInputData();
  headRotationInputData = new JointPartInputData();
  headTwistInputData = new HeadTwistInputData();

  bodyLocationInputData = new JointPartInputData();
  bodyRotationInputData = new BodyRotationInputData();

  hipsLocationInputData = new JointPartInputData();

  leftShoulderLocationInputData = new JointPartInputData();
  rightShoulderLocationInputData = new JointPartInputData();

  leftArm1LocationInputData = new JointPartInputData();
  leftArm2LocationInputData = new JointPartInputData();

  rightArm1LocationInputData = new JointPartInputData();
  rightArm2LocationInputData = new JointPartInputData();

  leftLeg1LocationInputData = new JointPartInputData();
  leftLeg2LocationInputData = new JointPartInputData();

  rightLeg1LocationInputData = new JointPartInputData();
  rightLeg2LocationInputData = new JointPartInputData();
}

export class JointPartDrawingUnit {

  name = "";

  targetData: DirectionInputData = null;

  dependentInputData: PosingInputData = null;

  subToolID: Posing3DSubToolID;

  drawModel = true;
  modelResource: ModelResource = null;
  modelConvertMatrix: Mat4 = null;
  visualModelAlpha = 1.0;
  hitTestSphereAlpha = 0.5;
}

export class PosingLayer extends Layer {

  type = LayerTypeID.posingLayer;

  posingModel = new PosingModel();
  posingData = new PosingData();

  // runtime
  drawingUnits: List<JointPartDrawingUnit> = null;

  static isPosingLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.posingLayer
    );
  }
}

// Animation

export class AnimationSettingData {

  animationFrameParSecond = 24;
  loopStartFrame = 0;
  loopEndFrame = 24;
  maxFrame = 24;

  currentTimeFrame = 10.0;

  timeLineWindowScale = 1.0;
  timeLineWindowScaleMax = 10.0;
  timeLineWindowViewLocationX = 0.0;
}

// Document

let defaultColors: List<Vec4> = [

  vec4.fromValues(0.0, 0.0, 0.0, 1.0),
  vec4.fromValues(1.0, 1.0, 1.0, 1.0),
  vec4.fromValues(0.5, 0.0, 0.0, 1.0),
  vec4.fromValues(0.0, 0.5, 0.0, 1.0),
  vec4.fromValues(0.3, 0.3, 0.8, 1.0),

  // Anime skin standard
  vec4.fromValues(250 / 255.0, 221 / 255.0, 189 / 255.0, 1.0),
  vec4.fromValues(220 / 255.0, 167 / 255.0, 125 / 255.0, 1.0),

  // Anime skin cool
  vec4.fromValues(249 / 255.0, 239 / 255.0, 229 / 255.0, 1.0),
  vec4.fromValues(216 / 255.0, 177 / 255.0, 170 / 255.0, 1.0),
  vec4.fromValues(198 / 255.0, 155 / 255.0, 148 / 255.0, 1.0),
];

export interface DocumentLayout {

  left: int;
  top: int;
  width: int;
  height: int;
}

export enum DocumentFileType {

  none = 0,
  json = 1,
  ora = 2,
}

export class DocumentData {

  static maxPaletteColors = 50;
  static versionString = '0.1.1';

  version = DocumentData.versionString;

  rootLayer = new Layer();

  paletteColors = new List<PaletteColor>();

  documentFrame = vec4.fromValues(-960.0, -540.0, 959.0, 539.0);

  animationSettingData = new AnimationSettingData();

  defaultViewScale = 1.0;
  lineWidthBiasRate = 1.0;

  exportBackGroundType = DocumentBackGroundTypeID.lastPaletteColor;
  exportingCount = 1;

  loaded = false;
  hasErrorOnLoading = false;

  // This class must be created by this function for JSON.parse
  constructor() {

    DocumentData.initializeDefaultPaletteColors(this);
  }

  static initializeDefaultPaletteColors(documentData: DocumentData) {

    documentData.paletteColors = new List<PaletteColor>();

    for (let color of defaultColors) {

      let paletteColor = new PaletteColor();
      vec4.copy(paletteColor.color, color);
      documentData.paletteColors.push(paletteColor);
    }

    while (documentData.paletteColors.length < DocumentData.maxPaletteColors) {

      let paletteColor = new PaletteColor();
      vec4.set(paletteColor.color, 1.0, 1.0, 1.0, 1.0);
      documentData.paletteColors.push(paletteColor);
    }
  }

  static getDocumentLayout(documentData: DocumentData): DocumentLayout {

    let frameLeft = Math.floor(documentData.documentFrame[0]);
    let frameTop = Math.floor(documentData.documentFrame[1]);
    let documentWidth = Math.floor(documentData.documentFrame[2]) - frameLeft + 1;
    let documentHeight = Math.floor(documentData.documentFrame[3]) - frameTop + 1;

    return { left: frameLeft, top: frameTop, width: documentWidth, height: documentHeight };
  }
}

export class DocumentDataSaveInfo {

  layers = new List<Layer>();
  layerID = 0;

  layerDictionary = new Dictionary<Layer>();

  modelFile: ModelFile = null;

  addLayer(layer: Layer) {

    layer.ID = this.layerID;

    this.layers.push(layer);

    this.layerID++;
  }

  collectLayer(layer: Layer) {

    if (layer.ID == undefined) {

      return;
    }

    this.layerDictionary[layer.ID] = layer;

    delete layer.ID;
  }
}

export enum DocumentBackGroundTypeID {

  lastPaletteColor = 1,
  transparent = 2,
}
