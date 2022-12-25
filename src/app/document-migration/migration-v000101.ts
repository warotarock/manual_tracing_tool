import {
  AutoFillLayer, AutoFillLayerKeyframe, AutoFillPointGroup, DocumentData, DrawLineTypeID,
  EyesSymmetryInputSideID, FillAreaTypeID, ImageFileReferenceLayer, Layer, PaletteColor,
  PosingData, PosingLayer, VectorLayerGeometryTypeID, VectorLayer, VectorLayerKeyframe, VectorLayerReferenceLayer,
  VectorStroke, VectorStrokeDrawingUnit, VectorStrokeGroup
} from '../document-data'
import { DocumentDataSerializingState } from '../document-logic'

export class DocumentMigration_v00_01_01 {

  private static currentVersionString = '0.1.1'
  private static nextVersionString = '0.1.2'

  static matches(versionString: string): boolean {

    return (versionString == this.currentVersionString)
  }

  static migrateDocumentData(documentData: DocumentData): string {

    {
      if (documentData.paletteColors == undefined) {

        if (documentData['palletColors'] != undefined) {

          (documentData as any)['paletteColors'] = documentData['palletColors']
        }
        else {

          DocumentData.initializeDefaultPaletteColors(documentData)
        }
      }

      for (const paletteColor of documentData.paletteColors) {

        paletteColor.isSelected = false
      }

      while (documentData.paletteColors.length < DocumentData.maxPaletteColors) {

        documentData.paletteColors.push(new PaletteColor())
      }
    }

    if (documentData['exportingCount'] != undefined) {
      delete documentData['exportingCount']
    }

    if (documentData['exportBackGroundType'] != undefined) {
      delete documentData['exportBackGroundType']
    }

    return this.nextVersionString
  }

  static migrateLayer(layer: Layer): string {

    if (layer.isRenderTarget == undefined) {
      layer.isRenderTarget = true
    }

    if (layer.isMaskedByBelowLayer == undefined) {
      layer.isMaskedByBelowLayer = false
    }

    if (layer.isListExpanded == undefined) {
      layer.isListExpanded = true
    }

    return this.nextVersionString
  }

  static migrateVectorLayer(layer: Layer, state: DocumentDataSerializingState): string {

    const vectorLayer = <VectorLayer>layer
    vectorLayer['eyesSymmetryGeometry'] = null

    if (vectorLayer.drawLineType == undefined) {

      vectorLayer.drawLineType = DrawLineTypeID.layerColor
    }

    if (vectorLayer.fillAreaType == undefined) {

      vectorLayer.fillAreaType = FillAreaTypeID.none
    }

    if (vectorLayer.fillColor == undefined) {

      vectorLayer.fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
    }

    if (vectorLayer['enableEyesSymmetry'] != undefined) {

      vectorLayer.eyesSymmetryEnabled = vectorLayer['enableEyesSymmetry']
    }

    if (vectorLayer.eyesSymmetryEnabled == undefined) {

      vectorLayer.eyesSymmetryEnabled = false
      vectorLayer.eyesSymmetryInputSide = EyesSymmetryInputSideID.left
      vectorLayer['posingLayer'] = null
    }

    if (vectorLayer['posingLayer'] != undefined) {

      delete vectorLayer['posingLayer']
    }

    if (vectorLayer.line_PaletteColorIndex == undefined) {

      vectorLayer.line_PaletteColorIndex = vectorLayer['line_PalletColorIndex'] || 0
    }

    if (vectorLayer.fill_PaletteColorIndex == undefined) {

      vectorLayer.fill_PaletteColorIndex = vectorLayer['fill_PalletColorIndex'] || 0
    }

    if (vectorLayer.keyframes == undefined && vectorLayer['geometry'] != undefined) {

      vectorLayer.keyframes = []
      const keyframe = new VectorLayerKeyframe(VectorLayerGeometryTypeID.strokes)
      keyframe.frame = 0
      keyframe.geometry = vectorLayer['geometry']
      vectorLayer.keyframes.push(keyframe)
    }

    if (vectorLayer.lineWidthBiasRate == undefined) {

      vectorLayer.lineWidthBiasRate = 1.0
    }

    if (vectorLayer['geometry'] != undefined) {

      delete vectorLayer['geometry']
    }

    if (vectorLayer['groups'] != undefined) {

      delete vectorLayer['groups']
    }

    this.migrateStrokeGroups(vectorLayer)

    this.migrateGeometry(vectorLayer)

    return this.nextVersionString
  }

  static migrateGeometry(layer: VectorLayer) {

    for (const keyframe of layer.keyframes) {

      for (const unit of keyframe.geometry.units) {

        for (const group of unit.groups) {

          for (const stroke of group.lines) {

            for (const point of stroke.points) {

              if (point.lineWidth == undefined) {
                point.lineWidth = 1.0
              }

              if (point['adjustedLocation'] != undefined) {
                delete point['adjustedLocation']
              }
            }
          }
        }
      }
    }
  }

  static migrateStrokeGroups(layer: VectorLayer) {

    for (const keyframe of layer.keyframes) {

      if (keyframe.geometry['units'] == undefined && keyframe.geometry['groups'] != undefined) {

        const new_units: VectorStrokeDrawingUnit[] = []

        for (const group of keyframe.geometry['groups']) {

          const old_lines: VectorStroke[] = group['lines']

          let new_unit = new VectorStrokeDrawingUnit()
          let new_group = new VectorStrokeGroup()

          for (const line of old_lines) {

            if (line['strokeWidth'] != undefined) {

              delete line['strokeWidth']
            }

            new_group.lines.push(line)

            if (!line['continuousFill']) {

              new_unit.groups.push(new_group)
              new_units.push(new_unit)

              new_unit = new VectorStrokeDrawingUnit()
              new_group = new VectorStrokeGroup()
            }
          }
        }

        if (new_units.length == 0) {

          const new_unit = new VectorStrokeDrawingUnit()
          new_units.push(new_unit)

          const new_group = new VectorStrokeGroup()
          new_unit.groups.push(new_group)
        }

        keyframe.geometry.units = new_units

        delete keyframe.geometry['groups']
      }
    }
  }

  static migrateAutoFillLayer(layer: Layer): string {

    const autoFillLayer = <AutoFillLayer>layer

    if (autoFillLayer['fillPoints'] !== undefined) {

      const group = new AutoFillPointGroup()
      group.fillPoints = autoFillLayer['fillPoints']

      const keyframe = new AutoFillLayerKeyframe()
      keyframe.groups.push(group)
      keyframe.geometry = autoFillLayer['geometry']

      autoFillLayer.keyframes = [keyframe]
    }

    for (const keyframe of autoFillLayer.keyframes) {

      for (const groups of keyframe.groups) {

        for (const fillPoint of groups.fillPoints) {

          if (fillPoint.minDistanceRange == undefined) {

            fillPoint.minDistanceRange = 15.0
          }
        }
      }
    }

    return this.nextVersionString
  }

  static migrateImageFileReferenceLayer(layer: Layer, state: DocumentDataSerializingState): string {

    const ifrLayer = <ImageFileReferenceLayer>layer

    ifrLayer['adjustingLocation'] = vec3.fromValues(0.0, 0.0, 0.0)
    ifrLayer['adjustingRotation'] = vec3.fromValues(0.0, 0.0, 0.0)
    ifrLayer['adjustingScale'] = vec3.fromValues(1.0, 1.0, 1.0)

    if (ifrLayer.location == undefined) {

      ifrLayer.location = vec3.fromValues(0.0, 0.0, 0.0)
      ifrLayer.rotation = vec3.fromValues(0.0, 0.0, 0.0)
      ifrLayer.scale = vec3.fromValues(1.0, 1.0, 1.0)
    }

    vec3.copy(ifrLayer['adjustingLocation'], ifrLayer.location)
    vec3.copy(ifrLayer['adjustingRotation'], ifrLayer.rotation)
    vec3.copy(ifrLayer['adjustingScale'], ifrLayer.scale)

    return this.nextVersionString
  }

  static migratePosingLayer(layer: Layer, state: DocumentDataSerializingState): string {

    const posingLayer = <PosingLayer>layer

    posingLayer.posingData = { ...new PosingData(), ...posingLayer.posingData }

    let posingData = posingLayer.posingData

    if (posingData.real3DViewMeterPerPixel == undefined) {

      const posingModel = posingLayer.posingModel
      const radiusPx = posingData.headLocationInputData.radius
      const real2DViewWidth = posingData.real3DViewHalfWidth / posingModel.headSphereSize * radiusPx

      posingData.real3DViewMeterPerPixel = posingData.real3DViewHalfWidth * 2.0 / real2DViewWidth
    }

    posingLayer.posingModel = state.modelFile.posingModelDictionary.get('dummy_skin')

    return this.nextVersionString
  }
}
