import { FillAreaTypeID, FillDrawable, VectorGeometry, VectorStroke } from '.';
import { float } from '../logics/conversion';
import { Layer, LayerTypeID } from './layer'

export class AutoFillPoint {

  location = vec3.fromValues(0.0, 0.0, 0.0)
  lookDirection = vec3.fromValues(0.0, 0.0, 0.0)
  positionInStartStroke: float = 0.0;

  // runtime
  startStroke: VectorStroke = null;
}

export class AutoFillLayer extends Layer implements FillDrawable {

  type = LayerTypeID.autoFillLayer

  fillAreaType = FillAreaTypeID.paletteColor
  fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
  fill_PaletteColorIndex = 1

  fillPoints: AutoFillPoint[] = []
  geometry = new VectorGeometry()

  static isAutoFillLayer(layer: Layer): boolean {

    return (
      layer != null
      && (layer.type == LayerTypeID.autoFillLayer
      )
    )
  }
}
