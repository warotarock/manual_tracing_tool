import { FillDrawable, StrokeDrawable } from "."
import { float, int } from "../logics/conversion"
import { GPUVertexBuffer } from "../logics/gpu_line"
import { Layer, LayerTypeID } from "./layer"
import { PosingLayer } from "./posing_layer"

export enum LinePointModifyFlagID {

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
  modifyFlag = LinePointModifyFlagID.none
  tempLocation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0)
  adjustingLineWidth = 0.0
  adjustingLengthFrom = 1.0 // end position to draw segment of side of from-point (0.0 - 1.0)
  adjustingLengthTo = 0.0 // start position to draw segment of side of to-point (0.0 - 1.0)
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

  points: VectorPoint[] = []
  continuousFill = false
  isSelected = false

  // runtime
  modifyFlag = VectorLineModifyFlagID.none
  isCloseToMouse = false
  left = 999999.0
  top = 999999.0
  right = -999999.0
  bottom = -999999.0
  range = 0.0
  totalLength = 0.0
}

export enum VectorGroupModifyFlagID {

  none = 0,
  modifyLines = 1,
  deleteLines = 2,
  delete = 3,
  edit = 4,
}

export class VectorStrokeGroup {

  lines: VectorStroke[] = []
  isSelected = false

  // runtime
  modifyFlag = VectorGroupModifyFlagID.none
  linePointModifyFlag = VectorGroupModifyFlagID.none
  buffer = new GPUVertexBuffer()
  isUpdated = false

  static setUpdated(group: VectorStrokeGroup) {

    group.isUpdated = true
    group.buffer.isStored = false
  }

  static setGroupsUpdated(groups: VectorStrokeGroup[]) {

    for (const group of groups) {

      VectorStrokeGroup.setUpdated(group)
    }
  }
}

export class VectorDrawingUnit {

  groups: VectorStrokeGroup[] = []
}

export class VectorGeometry {

  units: VectorDrawingUnit[] = []
}

export class VectorKeyframe {

  frame = 0
  geometry: VectorGeometry = null
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

export class VectorLayer extends Layer implements FillDrawable, StrokeDrawable {

  type = LayerTypeID.vectorLayer

  keyframes: VectorKeyframe[] = []

  drawLineType = DrawLineTypeID.paletteColor

  line_PaletteColorIndex = 0

  fillAreaType = FillAreaTypeID.none
  fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
  fill_PaletteColorIndex = 1

  lineWidthBiasRate = 1.0

  eyesSymmetryEnabled = false
  eyesSymmetryInputSide = EyesSymmetryInputSideID.left
  posingLayer: PosingLayer = null

  // file only
  posingLayerID: int

  // runtime
  eyesSymmetryGeometry: VectorGeometry = null

  static isVectorLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
          || layer.type == LayerTypeID.vectorLayerReferenceLayer
      )
    )
  }

  static isVectorLayerWithOwnData(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.vectorLayer
      )
    )
  }

  static findLastKeyframeIndex(vectorLayer: VectorLayer, targetFrame: int): int {

    let keyframeIndex = -1
    for (let index = 0; index < vectorLayer.keyframes.length; index++) {

      const keyframe = vectorLayer.keyframes[index]

      if (keyframe.frame == targetFrame) {

        keyframeIndex = index
        break
      }

      if (keyframe.frame > targetFrame) {
        break
      }

      keyframeIndex = index
    }

    return keyframeIndex
  }

  constructor() {
    super()

    const key = new VectorKeyframe()
    key.frame = 0
    key.geometry = new VectorGeometry()
    this.keyframes.push(key)
  }
}
