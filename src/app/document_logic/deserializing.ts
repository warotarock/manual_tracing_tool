import { Strings } from '../logics/conversion'
import {
  AnimationSettingData, AutoFillLayer, DocumentBackGroundTypeID, DocumentData, DocumentDataSerializingState,
  DrawLineTypeID, EyesSymmetryInputSideID, FillAreaTypeID, ImageFileReferenceLayer, Layer,
  LinePointModifyFlagID, PaletteColor, PosingData, PosingLayer, VectorDrawingUnit, VectorKeyframe,
  VectorLayer, VectorLayerReferenceLayer, VectorLineModifyFlagID, VectorStroke, VectorStrokeGroup
} from '../document_data'
import { Logic_Edit_Line } from '../logics/edit_vector_layer'
import { GPUVertexBuffer } from '../logics/gpu_line'
import { LocalSetting } from '../preferences/local_setting'

export class DocumentDeserializingLogic {

  private static fileNameCount = 1

  fixLoadedDocumentData(documentData: DocumentData, state: DocumentDataSerializingState) {

    this.collectLayers_Recursive(documentData.rootLayer, state)

    // palette
    {
      if (documentData.paletteColors == undefined) {

        if ('palletColors' in documentData) {

          documentData['paletteColors'] = documentData['palletColors']
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

    if (documentData.exportingCount == undefined) {

      documentData.exportingCount = 1
    }

    if (documentData.animationSettingData == undefined) {

      documentData.animationSettingData = new AnimationSettingData()
    }

    if (documentData.defaultViewScale == undefined) {

      documentData.defaultViewScale = 1.0
    }

    if (documentData.lineWidthBiasRate == undefined) {

      documentData.lineWidthBiasRate = 1.0
    }

    if (documentData.documentFrame_HideOuterArea == undefined) {

      documentData.documentFrame_HideOuterArea = false
    }

    if (documentData.exportBackGroundType == undefined) {

      documentData.exportBackGroundType = DocumentBackGroundTypeID.lastPaletteColor
    }

    this.fixLayer_Recursive(documentData.rootLayer, state)

    // version
    if (documentData.version == undefined) {

      documentData.version = DocumentData.versionString
    }
  }

  private collectLayers_Recursive(layer: Layer, state: DocumentDataSerializingState) {

    state.collectLayer(layer)

    for (const childLayer of layer.childLayers) {

      this.collectLayers_Recursive(childLayer, state)
    }
  }

  private fixLayer_Recursive(layer: Layer, state: DocumentDataSerializingState) {

    layer.hashID = Layer.getHashID()

    if (layer.isRenderTarget == undefined) {
      layer.isRenderTarget = true
    }

    layer.isHierarchicalVisible = layer.isVisible
    layer.isHierarchicalSelected = layer.isSelected

    if (layer.isMaskedByBelowLayer == undefined) {
      layer.isMaskedByBelowLayer = false
    }

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer
      vectorLayer.eyesSymmetryGeometry = null

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
        vectorLayer.posingLayer = null
      }

      if (vectorLayer.posingLayerID) {

        vectorLayer.posingLayer = <PosingLayer>state.layerDictionary.get(vectorLayer.posingLayerID)
        delete vectorLayer.posingLayerID
      }
      else {

        vectorLayer.posingLayer = null
      }

      if (vectorLayer.line_PaletteColorIndex == undefined) {

        vectorLayer.line_PaletteColorIndex = vectorLayer['line_PalletColorIndex'] || 0
      }

      if (vectorLayer.fill_PaletteColorIndex == undefined) {

        vectorLayer.fill_PaletteColorIndex = vectorLayer['fill_PalletColorIndex'] || 0
      }

      if (vectorLayer.keyframes == undefined && vectorLayer['geometry'] != undefined) {

        vectorLayer.keyframes = []
        const keyframe = new VectorKeyframe()
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

      this.vectorLayer_FixStrokeGroups(vectorLayer)

      this.vectorLayer_SetRuntimeProperties(vectorLayer)
    }
    else if (AutoFillLayer.isAutoFillLayer(layer)) {

      const autoFillLayer = <AutoFillLayer>layer

      for (const fillPoint of autoFillLayer.fillPoints) {

        fillPoint.startStroke = null
      }
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      const vRefLayer = <VectorLayerReferenceLayer>layer

      if (vRefLayer.referenceLayerID) {

        vRefLayer.referenceLayer = <VectorLayer>state.layerDictionary.get(vRefLayer.referenceLayerID)
        vRefLayer.keyframes = vRefLayer.referenceLayer.keyframes

        delete vRefLayer.referenceLayerID
      }
      else {

        vRefLayer.referenceLayer = null
        vRefLayer.keyframes = null
      }
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      ifrLayer.imageResource = null

      ifrLayer.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0)
      ifrLayer.adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0)
      ifrLayer.adjustingScale = vec3.fromValues(1.0, 1.0, 1.0)

      if (ifrLayer.location == undefined) {

        ifrLayer.location = vec3.fromValues(0.0, 0.0, 0.0)
        ifrLayer.rotation = vec3.fromValues(0.0, 0.0, 0.0)
        ifrLayer.scale = vec3.fromValues(1.0, 1.0, 1.0)
      }

      vec3.copy(ifrLayer.adjustingLocation, ifrLayer.location)
      vec3.copy(ifrLayer.adjustingRotation, ifrLayer.rotation)
      vec3.copy(ifrLayer.adjustingScale, ifrLayer.scale)
    }
    else if (PosingLayer.isPosingLayer(layer)) {

      const posingLayer = <PosingLayer>layer

      posingLayer.drawingUnits = null

      let posingData = posingLayer.posingData

      if (posingData.rootMatrix == undefined) {

        posingData = new PosingData()
      }

      if (posingData.real3DModelDistance == undefined) {

        posingData.real3DModelDistance = (new PosingData()).real3DModelDistance
      }

      if (posingData.real3DViewMeterPerPixel == undefined) {

        const posingModel = posingLayer.posingModel
        const radiusPx = posingData.headLocationInputData.radius
        const real2DViewWidth = posingData.real3DViewHalfWidth / posingModel.headSphereSize * radiusPx

        posingData.real3DViewMeterPerPixel = posingData.real3DViewHalfWidth * 2.0 / real2DViewWidth
      }

      posingLayer.posingModel = state.modelFile.posingModelDictionary.get('dummy_skin')
    }

    for (const childLayer of layer.childLayers) {

      childLayer.parentLayer = layer

      this.fixLayer_Recursive(childLayer, state)
    }
  }

  private vectorLayer_FixStrokeGroups(layer: VectorLayer) {

    for (const keyframe of layer.keyframes) {

      if (keyframe.geometry['units'] == undefined && keyframe.geometry['groups'] != undefined) {

        const new_units: VectorDrawingUnit[] = []

        for (const group of keyframe.geometry['groups']) {

          const old_lines: VectorStroke[] = group['lines']

          let new_unit = new VectorDrawingUnit()
          let new_group = new VectorStrokeGroup()

          for (const line of old_lines) {

            if (line['strokeWidth'] != undefined) {

              delete line['strokeWidth']
            }

            new_group.lines.push(line)

            if (!line.continuousFill) {

              new_unit.groups.push(new_group)
              new_units.push(new_unit)

              new_unit = new VectorDrawingUnit()
              new_group = new VectorStrokeGroup()
            }
          }
        }

        if (new_units.length == 0) {

          const new_unit = new VectorDrawingUnit()
          new_units.push(new_unit)

          const new_group = new VectorStrokeGroup()
          new_unit.groups.push(new_group)
        }

        keyframe.geometry.units = new_units

        delete keyframe.geometry['groups']
      }
    }
  }

  private vectorLayer_SetRuntimeProperties(layer: VectorLayer) {

    for (const keyframe of layer.keyframes) {

      for (const unit of keyframe.geometry.units) {

        for (const group of unit.groups) {

          group.isUpdated = true
          group.buffer = new GPUVertexBuffer()

          for (const line of group.lines) {

            line.modifyFlag = VectorLineModifyFlagID.none
            line.isCloseToMouse = false

            for (const point of line.points) {

              point.modifyFlag = LinePointModifyFlagID.none

              if (point.v != undefined) {

                point.location = vec3.fromValues(point.v[0], point.v[1], 0.0)
                point.lineWidth = point.w
                point.isSelected = (point.s == 1)

                delete point.v
                delete point.w
                delete point.s
              }

              if (point.lineWidth == undefined) {
                point.lineWidth = 1.0
              }

              point.tempLocation = vec3.create()
              point.adjustingLocation = vec3.clone(point.location)
              point.adjustingLineWidth = point.lineWidth
              point.adjustingLengthFrom = 1.0
              point.adjustingLengthTo = 0.0
              point.totalLength = 0.0
              point.curvature = 0.0

              if (point['adjustedLocation'] != undefined) {
                delete point['adjustedLocation']
              }

              point.location3D = vec3.create()
            }

            Logic_Edit_Line.calculateParameters(line)
          }
        }
      }
    }
  }

  finishResourceLoading(documentData: DocumentData) {

    this.finishResourceLoading_Recursive(documentData.rootLayer)
  }

  private finishResourceLoading_Recursive(layer: Layer) {

    if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      if (ifrLayer.imageFirstLoading) {

        ifrLayer.imageFirstLoading = false

        ifrLayer.location[0] = -ifrLayer.imageResource.image.width / 2
        ifrLayer.location[1] = -ifrLayer.imageResource.image.height / 2
      }
    }

    for (const childLayer of layer.childLayers) {

      this.finishResourceLoading_Recursive(childLayer)
    }
  }

  static getDefaultDocumentFileName(localSetting: LocalSetting): string {

    const date = new Date()
    const fileName = (''
      + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
      + '_' + ('0' + this.fileNameCount).slice(-2)
    )

    this.fileNameCount++

    return localSetting.currentDirectoryPath + '\\' + fileName + '.v.ora'
  }

  static getExportFileName(filePath: string, documentData: DocumentData) {

    let fileName = filePath

    let lastSeperatorIndex = Strings.lastIndexOf(fileName, '\\')
    if (lastSeperatorIndex == -1) {

      lastSeperatorIndex = Strings.lastIndexOf(fileName, '/')
    }

    const separatorDotIndex = Strings.indexOf(fileName, '.', lastSeperatorIndex)

    if (lastSeperatorIndex != -1 && separatorDotIndex != -1 && separatorDotIndex - lastSeperatorIndex > 0) {

      fileName = Strings.substring(fileName, lastSeperatorIndex + 1, separatorDotIndex - lastSeperatorIndex - 1)
    }

    fileName += '_' + ('00' + documentData.exportingCount).slice(-2)

    return fileName
  }
}
