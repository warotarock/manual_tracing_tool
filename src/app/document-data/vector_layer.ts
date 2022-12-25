import { float, int, RectangleArea } from "../common-logics"
import { GPUVertexBuffer } from "../document-rendering"
import { FillAreaTypeID, FillDrawable } from "./fill-drawable"
import { KeyframeDataObject, AnimatableDataObject } from "./key-frame"
import { Layer, LayerTypeID, Layer_RuntimeProperty } from "./layer"
import { PosingLayer } from "./posing-layer"
import { DrawLineTypeID, StrokeDrawable } from "./stroke-drawable"

export enum VectorPointModifyFlagID {

  none = 0,
  selectedToUnselected = 1,
  unselectedToSelected = 2,
  delete = 3,
  edit = 4,
}

export class VectorPoint {

  // runtime
  location = vec3.fromValues(0.0, 0.0, 0.0)
  lineWidth = 1.0
  isSelected = false
  modifyFlag = VectorPointModifyFlagID.none
  tempLocation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingLineWidth = 0.0
  adjustingLengthFrom = 1.0 // end position to draw segment of the side of this point (0.0 - 1.0)
  adjustingLengthTo = 0.0 // start position to draw segment of the side of the next point (0.0 - 1.0)
  totalLength = 0.0
  curvature = 0.0
  location3D = vec3.fromValues(0.0, 0.0, 0.0)

  // file only
  v: float[] // location
  w: float   // lineWidth
  s: int     // isSelected

  static clone(srcPoint: VectorPoint): VectorPoint {

    const point = new VectorPoint()

    vec3.copy(point.location, srcPoint.location)
    point.lineWidth = srcPoint.lineWidth

    vec3.copy(point.adjustingLocation, point.location)
    point.adjustingLineWidth = point.lineWidth

    return point
  }
}

export enum VectorStrokeModifyFlagID {

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

export class VectorStroke_RuntimeProperty {

  modifyFlag = VectorStrokeModifyFlagID.none
  isCloseToMouse = false
  area = new RectangleArea()
  innerArea = new RectangleArea()
  totalLength = 0.0
}

export class VectorStroke {

  points: VectorPoint[] = []
  isSelected = false

  // runtime
  runtime = new VectorStroke_RuntimeProperty()
}

export enum VectorStrokeConnectionPosition {

  none = 0,
  head = 1,
  tail = 2,
}

export class VectorStrokeConnectionInfo {

  from_Stroke: VectorStroke = null
  from_Position = VectorStrokeConnectionPosition.none
  to_Stroke: VectorStroke = null
  to_Position = VectorStrokeConnectionPosition.none
}

export enum VectorStrokeGroupModifyFlagID {

  none = 0,
  modifyLines = 1,
  deleteLines = 2,
  delete = 3,
  edit = 4,
}

export class VectorStrokeGroup_RuntimeProperty {

  modifyFlag = VectorStrokeGroupModifyFlagID.none
  linePointModifyFlag = VectorStrokeGroupModifyFlagID.none
  buffer = new GPUVertexBuffer()
  connectionInfos: VectorStrokeConnectionInfo[] = []
  needsPostUpdate = false
  needsLazyUpdate = false
  area = new RectangleArea()
}

export class VectorStrokeGroup {

  lines: VectorStroke[] = []
  isSelected = false

  // runtime
  runtime = new VectorStrokeGroup_RuntimeProperty()

  static setPostUpdateNeeded(group: VectorStrokeGroup) {

    group.runtime.needsPostUpdate = true
  }

  static setLazyUpdateNeeded(group: VectorStrokeGroup) {

    group.runtime.needsPostUpdate = true
    group.runtime.needsLazyUpdate = true
    group.runtime.buffer.isStored = false
  }
}

export enum VectorStrokeDrawingUnitModifyFlagID {

  none = 0,
  delete = 1,
  edit = 2,
}

export class VectorStrokeDrawingUnit {

  groups: VectorStrokeGroup[] = []

  // runtime
  modifyFlag = VectorStrokeDrawingUnitModifyFlagID.none
}

export enum VectorLayerGeometryModifyFlagID {

  none = 0,
  delete = 1,
  edit = 2,
}

export class VectorLayerGeometry_RuntimeProperty {

  modifyFlag = VectorLayerGeometryModifyFlagID.none
  needsPostUpdate = false
  area = new RectangleArea()
}

export enum VectorLayerGeometryTypeID {

  none = 0,
  strokes = 1,
  surroundingFill = 2,
  pointBrushFill = 3,
}

export class VectorLayerGeometry {

  type = VectorLayerGeometryTypeID.none
  units: VectorStrokeDrawingUnit[] = []

  constructor(type: VectorLayerGeometryTypeID) {

    this.type = type
  }

  // runtime
  runtime = new VectorLayerGeometry_RuntimeProperty()

  static initialize(geometry: VectorLayerGeometry) {

    const unit = new VectorStrokeDrawingUnit()

    unit.groups.push(new VectorStrokeGroup())

    geometry.units.push(unit)
  }

  static isStrokeDraw(geometry: VectorLayerGeometry) {

    return (geometry.type == VectorLayerGeometryTypeID.strokes)
  }

  static isSurroundingFill(geometry: VectorLayerGeometry) {

    return (geometry.type == VectorLayerGeometryTypeID.surroundingFill)
  }

  static isPointBrushFill(geometry: VectorLayerGeometry) {

    return (geometry.type == VectorLayerGeometryTypeID.pointBrushFill)
  }

  static getGeometryTypeForLayer(layer: Layer): VectorLayerGeometryTypeID {

    if (VectorLayer.isPointBrushFillLayer(layer)) {

      return VectorLayerGeometryTypeID.pointBrushFill
    }
    else if (VectorLayer.isSurroundingFillLayer(layer)) {

      return VectorLayerGeometryTypeID.surroundingFill
    }
    else {

      return VectorLayerGeometryTypeID.strokes
    }
  }

  static forEachGroup(geometry: VectorLayerGeometry, loopBodyFunction: (group: VectorStrokeGroup, unit?: VectorStrokeDrawingUnit) => void) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        loopBodyFunction(group, unit)
      }
    }
  }

  static forEachStroke(geometry: VectorLayerGeometry, loopBodyFunction: (stroke: VectorStroke, group?: VectorStrokeGroup, unit?: VectorStrokeDrawingUnit) => void) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const stroke of group.lines) {

          loopBodyFunction(stroke, group, unit)
        }
      }
    }
  }

  static forEachSegment(geometry: VectorLayerGeometry,
    loopBodyFunction: (from_point: VectorPoint, to_point: VectorPoint, stroke?: VectorStroke, group?: VectorStrokeGroup, unit?: VectorStrokeDrawingUnit) => void) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const stroke of group.lines) {

          for (let index = 0; index < stroke.points.length - 1; index++) {

            const from_point = stroke.points[index]
            const to_point = stroke.points[index + 1]

            loopBodyFunction(from_point, to_point,stroke, group, unit)
          }
        }
      }
    }
  }

  static forEachPoint(geometry: VectorLayerGeometry,
    loopBodyFunction: (point: VectorPoint, stroke?: VectorStroke, group?: VectorStrokeGroup, unit?: VectorStrokeDrawingUnit) => void) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const stroke of group.lines) {

          for (const point of stroke.points) {

            loopBodyFunction(point, stroke, group, unit)
          }
        }
      }
    }
  }

  static setPostUpdateNeeded(geometry: VectorLayerGeometry) {

    geometry.runtime.needsPostUpdate = true
  }
}

export class VectorLayerKeyframe implements KeyframeDataObject {

  frame = 0
  geometry: VectorLayerGeometry

  constructor(geometryType: VectorLayerGeometryTypeID) {

    this.geometry = new VectorLayerGeometry(geometryType)
  }

  static createWithDefaultGeometry(geometryType: VectorLayerGeometryTypeID): VectorLayerKeyframe {

    const keyframe = new VectorLayerKeyframe(geometryType)

    VectorLayerGeometry.initialize(keyframe.geometry)

    return keyframe
  }
}

export enum EyesSymmetryInputSideID {

  none = 0,
  left = 1,
  right = 2,
}

export class VectorLayer_RuntimeProperty extends Layer_RuntimeProperty {

  eyesSymmetryGeometry: VectorLayerGeometry = null
  posingLayer: PosingLayer = null
}

export class VectorLayer extends Layer implements FillDrawable, StrokeDrawable, AnimatableDataObject<VectorLayerKeyframe> {

  type = LayerTypeID.vectorLayer

  keyframes: VectorLayerKeyframe[] = []

  drawLineType = DrawLineTypeID.paletteColor
  line_PaletteColorIndex = 0
  lineWidthBiasRate = 1.0

  fillAreaType = FillAreaTypeID.none
  fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
  fill_PaletteColorIndex = 1

  eyesSymmetryEnabled = false
  eyesSymmetryInputSide = EyesSymmetryInputSideID.left

  // file only
  posingLayerID: int

  // runtime
  runtime = new VectorLayer_RuntimeProperty() // @override

  static isVectorLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
        || layer.type == LayerTypeID.vectorLayerReferenceLayer
        || layer.type == LayerTypeID.surroundingFillLayer
        || layer.type == LayerTypeID.pointBrushFillLayer
      )
    )
  }

  static isVectorLayerWithOwnData(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
        || layer.type == LayerTypeID.surroundingFillLayer
        || layer.type == LayerTypeID.pointBrushFillLayer
      )
    )
  }

  static isVectorStrokeLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
        || layer.type == LayerTypeID.vectorLayerReferenceLayer
      )
    )
  }

  static isSingleGroupVectorLayer(layer: Layer): boolean {

    return (
      this.isVectorLayerWithOwnData(layer)
      && (layer.type == LayerTypeID.vectorLayer
        || layer.type == LayerTypeID.pointBrushFillLayer
      )
    )
  }

  static isSurroundingFillLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.surroundingFillLayer
      )
    )
  }

  static isPointBrushFillLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.pointBrushFillLayer
      )
    )
  }
}

export class SurroundingFillLayer extends VectorLayer {

  type = LayerTypeID.surroundingFillLayer
}

export class PointBrushFillLayer extends VectorLayer {

  type = LayerTypeID.pointBrushFillLayer
}
