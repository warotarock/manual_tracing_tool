import { int } from '../common-logics'
import { Layer } from './layer'

export interface KeyframeDataObject {

  frame: int
}

export interface AnimatableDataObject<T extends KeyframeDataObject> {

  keyframes: T[]
}

export class AnimatableLayer extends Layer implements AnimatableDataObject<{frame: int}> {

  keyframes: {frame: int}[]
}
