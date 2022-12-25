import { float, int } from '../common-logics'
import { Layer } from './layer'

export enum DrawLineTypeID {

  none = 1,
  layerColor = 2,
  paletteColor = 3,
}

export interface StrokeDrawable {

  drawLineType: DrawLineTypeID
  layerColor: Vec4
  line_PaletteColorIndex: int
  lineWidthBiasRate: float
}

export class StrokeDrawableLayer extends Layer implements StrokeDrawable {

  drawLineType: DrawLineTypeID
  layerColor: Vec4
  line_PaletteColorIndex: int
  lineWidthBiasRate: float
}
