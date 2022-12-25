import { float, int } from '../common-logics';
import { FillAreaTypeID, FillDrawable } from './fill-drawable';
import { KeyframeDataObject, AnimatableDataObject } from './key-frame';
import { Layer, LayerTypeID } from './layer';
import { VectorLayerGeometryTypeID, VectorLayerGeometry, VectorStroke } from './vector_layer';

export class AutoFillPoint {

  location = vec3.fromValues(0.0, 0.0, 0.0)
  lookDirection = vec3.fromValues(0.0, 0.0, 0.0)
  positionInStartStroke: float = 0.0;
  minDistanceRange = 15.0
}

export class AutoFillPointGroup {

  fillPoints: AutoFillPoint[] = []
}

export class AutoFillLayerKeyframe implements KeyframeDataObject {

  frame = 0
  groups: AutoFillPointGroup[] = []
  geometry = new VectorLayerGeometry(VectorLayerGeometryTypeID.surroundingFill)

  constructor() {

    const group = new AutoFillPointGroup()
    this.groups.push(group)

    VectorLayerGeometry.initialize(this.geometry)
  }
}

export class AutoFillLayer extends Layer implements FillDrawable, AnimatableDataObject<AutoFillLayerKeyframe> {

  type = LayerTypeID.autoFillLayer

  keyframes: AutoFillLayerKeyframe[] = []

  fillAreaType = FillAreaTypeID.paletteColor
  fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
  fill_PaletteColorIndex = 1

  // fillPoints: AutoFillPoint[] = []
  // geometry = new VectorLayerGeometry()

  constructor() {
    super()

    const keyframe = new AutoFillLayerKeyframe()
    this.keyframes.push(keyframe)
  }

  static isAutoFillLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.autoFillLayer
      )
    )
  }

  static forEachFillPoint(
    keyframe: AutoFillLayerKeyframe,
    loopBodyFunction: (group: AutoFillPointGroup, fillPoint: AutoFillPoint, looping?: { break: boolean }) => void
  ) {

    const looping = { break: false }

    for (const group of keyframe.groups) {

      for (const fillPoint of group.fillPoints) {

        loopBodyFunction(group, fillPoint, looping)

        if (looping.break) {
          break
        }
      }

      if (looping.break) {
        break
      }
    }
  }
}
