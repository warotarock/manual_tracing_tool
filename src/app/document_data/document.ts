﻿import { float, int } from '../logics/conversion'
import { ModelFile } from '../posing3d/posing3d_view'
import { Layer } from './layer'
import { PaletteColor } from './palette'
import { AnimationSettingData } from './animation'

export enum DocumentFileType {

  none = 0,
  json = 1,
  ora = 2,
}

export interface DocumentLayout {

  left: int
  top: int
  width: int
  height: int
}

export enum DocumentBackGroundTypeID {

  lastPaletteColor = 1,
  transparent = 2,
}

export class DocumentData {

  static maxPaletteColors = 50
  static versionString = '0.1.1'

  version = DocumentData.versionString

  rootLayer = new Layer()

  paletteColors: PaletteColor[] = []

  documentFrame = vec4.fromValues(-960.0, -540.0, 959.0, 539.0)
  documentFrame_HideOuterArea = false

  animationSettingData = new AnimationSettingData()

  defaultViewScale = 1.0
  lineWidthBiasRate = 1.0

  exportBackGroundType = DocumentBackGroundTypeID.lastPaletteColor
  exportingCount = 1

  loaded = false
  hasErrorOnLoading = false

  private static readonly defaultColors: Vec4[] = [
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
  ]

  constructor() {

    DocumentData.initializeDefaultPaletteColors(this)
  }

  static initializeDefaultPaletteColors(documentData: DocumentData) {

    documentData.paletteColors = []

    for (const color of DocumentData.defaultColors) {

      const paletteColor = new PaletteColor()
      vec4.copy(paletteColor.color, color)
      documentData.paletteColors.push(paletteColor)
    }

    while (documentData.paletteColors.length < DocumentData.maxPaletteColors) {

      const paletteColor = new PaletteColor()
      vec4.set(paletteColor.color, 1.0, 1.0, 1.0, 1.0)
      documentData.paletteColors.push(paletteColor)
    }
  }

  static getDocumentLayout(documentData: DocumentData, scale: float): DocumentLayout {

    const frameLeft = Math.floor(documentData.documentFrame[0])
    const frameTop = Math.floor(documentData.documentFrame[1])

    const frameWidth = Math.floor(documentData.documentFrame[2]) - frameLeft + 1
    const frameHeight = Math.floor(documentData.documentFrame[3]) - frameTop + 1

    const scaledWidth = Math.floor(frameWidth * scale)
    const scaledHeight = Math.floor(frameHeight * scale)

    return { left: frameLeft, top: frameTop, width: scaledWidth, height: scaledHeight }
  }
}

export class DocumentDataSerializingState {

  layers: Layer[] = []
  infileLayerID = 0

  layerDictionary = new Map<int, Layer>()

  modelFile: ModelFile = null

  addLayer(layer: Layer) {

    layer.ID = this.infileLayerID

    this.layers.push(layer)

    this.infileLayerID++
  }

  collectLayer(layer: Layer) {

    if (layer.ID == undefined) {

      return
    }

    this.layerDictionary.set(layer.ID, layer)

    delete layer.ID
  }
}
