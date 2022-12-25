import { float } from 'app/common-logics'
import {
  AutoFillLayer, DocumentData, ImageFileReferenceLayer, Layer, Layer_RuntimeProperty, VectorPointModifyFlagID,
  PosingLayer, VectorLayer, VectorLayerGeometry_RuntimeProperty, VectorLayerReferenceLayer,
  VectorLayerReferenceLayer_RuntimeProperty,
  VectorLayer_RuntimeProperty,
  VectorStrokeDrawingUnitModifyFlagID, VectorStrokeGroup_RuntimeProperty, VectorStroke_RuntimeProperty,
  VectorLayerGeometry, VectorStrokeGroup, PosingLayer_RuntimeProperty, ImageFileReferenceLayer_RuntimeProperty
} from '../document-data'
import { DocumentMigration_v00_01_01, DocumentMigration_v00_01_02, DocumentMigration_v00_01_03 } from '../document-migration'
import { DocumentDataSerializingState } from './serializing'
import { VectorStrokeLogic } from './vector-stroke'

export class DocumentDeserializingLogic {

  static fixLoadedDocumentData(documentData: DocumentData, state: DocumentDataSerializingState) {

    this.registerLayerRecursive(documentData.rootLayer, state)

    let curentVersionString = documentData.version

    this.fixDocumentData(documentData)

    this.fixLayer_Recursive(curentVersionString, documentData.rootLayer, null, state)

    documentData.version = DocumentData.versionString
  }

  private static registerLayerRecursive(layer: Layer, state: DocumentDataSerializingState) {

    state.registerLayerToDeserialize(layer)

    for (const childLayer of layer.childLayers) {

      this.registerLayerRecursive(childLayer, state)
    }
  }

  private static fixDocumentData(documentData: DocumentData) {

    if (documentData.version == undefined) {
      documentData.version = '0.1.1'
    }

    {
      let curentVersionString = documentData.version

      if (DocumentMigration_v00_01_01.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_01.migrateDocumentData(documentData)
      }
    }

    const template_DocumentData = new DocumentData()

    this.copyDefaultValue(documentData, template_DocumentData, 'animationSettingData')
    this.copyDefaultValue(documentData, template_DocumentData, 'defaultViewScale')
    this.copyDefaultValue(documentData, template_DocumentData, 'lineWidthBiasRate')
    this.copyDefaultValue(documentData, template_DocumentData, 'documentFrame_HideOuterArea')
    this.copyDefaultValue(documentData, template_DocumentData, 'exportImageSetting')

    this.copyDefaultValue(documentData.animationSettingData, template_DocumentData.animationSettingData, 'onionSkinMode')
    this.copyDefaultValue(documentData.animationSettingData, template_DocumentData.animationSettingData, 'onionSkinForwardLevel')
    this.copyDefaultValue(documentData.animationSettingData, template_DocumentData.animationSettingData, 'onionSkinBackwardLevel')
  }

  private static copyDefaultValue<T>(targetData: T, templateData: T, propertyName: keyof(T)) {

    if (targetData[propertyName] == undefined) {

      targetData[propertyName] = templateData[propertyName]
    }
  }

  private static fixLayer_Recursive(versionString: string, layer: Layer, parentLayer: Layer, state: DocumentDataSerializingState) {

    layer.hashID = Layer.getHashID()

    {
      let curentVersionString = versionString

      if (DocumentMigration_v00_01_01.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_01.migrateLayer(layer)
      }
    }

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      let curentVersionString = versionString

      if (DocumentMigration_v00_01_01.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_01.migrateVectorLayer(layer, state)
      }

      if (DocumentMigration_v00_01_02.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_02.migrateVectorLayer(layer)
      }

      if (DocumentMigration_v00_01_03.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_03.migrateVectorLayer(layer)
      }

      this.setRuntimePropertiesForVectorLayer(layer, state)
      this.setRuntimePropertiesForVectorLayerContents(layer)
    }
    else if (AutoFillLayer.isAutoFillLayer(layer)) {

      let curentVersionString = versionString

      if (DocumentMigration_v00_01_01.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_01.migrateAutoFillLayer(layer)
      }
      if (DocumentMigration_v00_01_02.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_02.pass()
      }

      if (DocumentMigration_v00_01_03.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_03.migrateAutoFillLayer(layer)
      }

      this.setRuntimePropertiesForAutoFillLayer(layer)
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      this.setRuntimePropertiesForVectorLayer(layer, state)
      this.setRuntimePropertiesForVectorLayerReferenceLayer(layer, state)
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      let curentVersionString = versionString

      if (DocumentMigration_v00_01_01.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_01.migrateImageFileReferenceLayer(layer, state)
      }

      this.setRuntimePropertiesForImageFileReferenceLayer(layer)
    }
    else if (PosingLayer.isPosingLayer(layer)) {

      let curentVersionString = versionString

      if (DocumentMigration_v00_01_01.matches(curentVersionString)) {
        curentVersionString = DocumentMigration_v00_01_01.migratePosingLayer(layer, state)
      }

      this.setRuntimePropertiesForPosingLayer(layer)
    }

    if (!layer.runtime) {

      layer.runtime = new Layer_RuntimeProperty()
    }

    layer.runtime.parentLayer = parentLayer

    for (const childLayer of layer.childLayers) {

      this.fixLayer_Recursive(versionString, childLayer, layer, state)
    }
  }

  static setRuntimePropertiesForVectorLayer(layer: Layer, state: DocumentDataSerializingState) {

    const vectorLayer = <VectorLayer>layer

    vectorLayer.runtime = new VectorLayer_RuntimeProperty()

    if (vectorLayer.posingLayerID) {

      vectorLayer.runtime.posingLayer = <PosingLayer>state.layerDictionary.get(vectorLayer.posingLayerID)

      delete vectorLayer.posingLayerID

      Layer.setLazyUpdateNeeded(vectorLayer)
    }
  }

  static setRuntimePropertiesForVectorLayerContents(layer: Layer) {

    const vectorLayer = <VectorLayer>layer

    for (const keyframe of vectorLayer.keyframes) {

      this.setRuntimePropertiesForVectorLayerGeometry(keyframe.geometry, vectorLayer.lineWidthBiasRate)
    }
  }

  static setRuntimePropertiesForVectorLayerGeometry(geometry: VectorLayerGeometry, lineWidthBiasRate: float) {

    geometry.runtime = new VectorLayerGeometry_RuntimeProperty()
    geometry.runtime.needsPostUpdate = false

    geometry.runtime.area.setMinimumValue()

    for (const unit of geometry.units) {

      unit.modifyFlag = VectorStrokeDrawingUnitModifyFlagID.none

      for (const group of unit.groups) {

        group.runtime = new VectorStrokeGroup_RuntimeProperty()

        VectorStrokeGroup.setLazyUpdateNeeded(group)

        for (const stroke of group.lines) {

          stroke.runtime = new VectorStroke_RuntimeProperty()

          for (const point of stroke.points) {

            point.modifyFlag = VectorPointModifyFlagID.none

            if (point.v !== undefined) {

              point.location = vec3.fromValues(point.v[0], point.v[1], 0.0)
              point.lineWidth = point.w
              point.isSelected = (point.s == 1)

              delete point.v
              delete point.w
              delete point.s
            }

            point.tempLocation = vec3.create()
            point.adjustingLocation = vec3.clone(point.location)
            point.adjustingLineWidth = point.lineWidth
            point.adjustingLengthFrom = 1.0
            point.adjustingLengthTo = 0.0
            point.totalLength = 0.0
            point.curvature = 0.0

            point.location3D = vec3.create()
          }

          VectorStrokeLogic.calculateParameters(stroke, lineWidthBiasRate)
        }

        VectorStrokeLogic.calculateSurroundingArea(group.runtime.area, group.lines)

        group.runtime.connectionInfos = VectorStrokeLogic.createConnectionInfos(group)

        geometry.runtime.area.expandByRectangle(group.runtime.area)
      }

      geometry.runtime.area.calculateParams()
    }
  }

  static setRuntimePropertiesForVectorLayerReferenceLayer(layer: Layer, state: DocumentDataSerializingState) {

    const ifrLayer = <VectorLayerReferenceLayer>layer

    ifrLayer.runtime = new VectorLayerReferenceLayer_RuntimeProperty()

    if (ifrLayer.referenceLayerID) {

      ifrLayer.runtime.referenceLayer = <VectorLayer>state.layerDictionary.get(ifrLayer.referenceLayerID)

      delete ifrLayer.referenceLayerID
    }
  }

  static setRuntimePropertiesForImageFileReferenceLayer(layer: Layer) {

    const ifrLayer = <ImageFileReferenceLayer>layer

    ifrLayer.runtime = new ImageFileReferenceLayer_RuntimeProperty()

    vec3.copy(ifrLayer.runtime.adjustingLocation, ifrLayer.location)
    vec3.copy(ifrLayer.runtime.adjustingRotation, ifrLayer.rotation)
    vec3.copy(ifrLayer.runtime.adjustingScale, ifrLayer.scale)
  }

  static setRuntimePropertiesForAutoFillLayer(layer: Layer) {

    const autoFillLayer = <AutoFillLayer>layer

    autoFillLayer.runtime = new Layer_RuntimeProperty()

    Layer.setLazyUpdateNeeded(autoFillLayer)

    for (const keyframe of autoFillLayer.keyframes) {

      this.setRuntimePropertiesForVectorLayerGeometry(keyframe.geometry, 1.0)
    }
  }

  static setRuntimePropertiesForPosingLayer(layer: Layer) {

    const posingLayer = <PosingLayer>layer

    posingLayer.runtime = new PosingLayer_RuntimeProperty()
  }

  static finishResourceLoading(documentData: DocumentData) {

    this.finishResourceLoading_Recursive(documentData.rootLayer)
  }

  private static finishResourceLoading_Recursive(layer: Layer) {

    if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      ifrLayer.imageFirstLoading = false
    }

    for (const childLayer of layer.childLayers) {

      this.finishResourceLoading_Recursive(childLayer)
    }
  }
}
