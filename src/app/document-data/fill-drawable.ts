import { int } from '../common-logics'
import { Layer } from './layer'

export enum FillAreaTypeID {

  none = 1,
  fillColor = 2,
  paletteColor = 3,
}

export interface FillDrawable {

  fillAreaType: FillAreaTypeID
  fillColor: Vec4
  fill_PaletteColorIndex: int
}

export class FillDrawableLayer extends Layer implements FillDrawable {

  fillAreaType: FillAreaTypeID
  fillColor: Vec4
  fill_PaletteColorIndex: int
}
