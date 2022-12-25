import { float, int } from '../common-logics'
import {
  AutoFillLayer,
  DocumentData,
  ImageFileReferenceLayer, Layer,
  Layer_RuntimeProperty,
  PosingLayer, VectorLayer, VectorLayerReferenceLayer
} from '../document-data'
import { ModelFile } from '../posing3d'
import { RenderImage, WebGLRender } from '../render'
import { DocumentFileNameLogic } from './file-name'

export class DocumentDataSerializingState {

  layers: Layer[] = []
  infileLayerID = 0

  layerDictionary = new Map<int, Layer>()

  modelFile: ModelFile = null

  registerLayerToSerialize(layer: Layer) {

    layer.ID = this.infileLayerID

    this.layers.push(layer)

    this.infileLayerID++
  }

  registerLayerToDeserialize(layer: Layer) {

    if (layer.ID === undefined) {
      return
    }

    this.layerDictionary.set(layer.ID, layer)

    delete layer.ID
  }
}

export class DocumentSerializingLogic {

  static vec3ToArray(vec: Vec3): float[] {

    return [vec[0], vec[1], vec[2]]
  }

  static vec4ToArray(vec: Vec4): float[] {

    return [vec[0], vec[1], vec[2], vec[3]]
  }

  static duplicateDocumentDataForSave(documentData: DocumentData, save_filePath: string): DocumentData {

    const state = new DocumentDataSerializingState()

    this.setIDRecursive(documentData.rootLayer, state)
    this.copyIDRecursive(documentData.rootLayer, state)

    const result_documentData = JSON.parse(this.stringifyDocumentData(documentData))

    this.fixLayersRecursive(result_documentData.rootLayer, save_filePath, state)

    for (const paletteColor of result_documentData.paletteColors) {

      delete paletteColor.isSelected

      paletteColor.color = this.vec4ToArray(paletteColor.color)
    }

    return result_documentData
  }

  private static stringifyDocumentData(documentData: DocumentData): string {

    const ignore_key_imageData: keyof(RenderImage) = 'imageData'
    const ignore_key_runtime: keyof(Layer) = 'runtime'
    const ignore_key_parentLayer: keyof(Layer_RuntimeProperty) = 'parentLayer'

    return JSON.stringify(documentData, (key, value) => {

      if (key == ignore_key_parentLayer
        || key == ignore_key_imageData
        || key == ignore_key_runtime
      ) {

        return null
      }
      else {

        return value
      }
    })
  }

  private static setIDRecursive(layer: Layer, state: DocumentDataSerializingState) {

    state.registerLayerToSerialize(layer)

    for (const childLayer of layer.childLayers) {

      this.setIDRecursive(childLayer, state)
    }
  }

  private static copyIDRecursive(layer: Layer, state: DocumentDataSerializingState) {

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      if (vectorLayer.runtime.posingLayer != null) {

        vectorLayer.posingLayerID = vectorLayer.runtime.posingLayer.ID
      }
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      const vRefLayer = <VectorLayerReferenceLayer>layer

      if (vRefLayer.runtime.referenceLayer != null) {

        vRefLayer.referenceLayerID = vRefLayer.runtime.referenceLayer.ID
      }
    }

    for (const childLayer of layer.childLayers) {

      this.copyIDRecursive(childLayer, state)
    }
  }

  static fixLayersRecursive(layer: Layer, save_filePath: string, state: DocumentDataSerializingState) {

    delete layer.hashID
    delete layer.runtime

    layer.layerColor = this.vec4ToArray(layer.layerColor)

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      vectorLayer.fillColor = this.vec4ToArray(vectorLayer.fillColor)
      delete vectorLayer.runtime

      for (const keyframe of vectorLayer.keyframes) {

        const geometry = keyframe.geometry
        delete geometry.runtime

        for (const unit of geometry.units) {

          delete unit.modifyFlag

          for (const group of unit.groups) {

            delete group.runtime

            for (const line of group.lines) {

              delete line.runtime

              for (const point of line.points) {

                // データ量削減
                point.v = this.vec3ToArray(point.location)
                point.w = point.lineWidth
                point.s = point.isSelected ? 1 : 0

                delete point.location
                delete point.lineWidth
                delete point.isSelected
                delete point.modifyFlag
                delete point.tempLocation
                delete point.adjustingLocation
                delete point.adjustingLineWidth
                delete point.adjustingLengthFrom
                delete point.adjustingLengthTo
                delete point.totalLength
                delete point.curvature
                delete point.location3D
              }
            }
          }
        }
      }
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      const vRefLayer = <VectorLayerReferenceLayer>layer

      delete vRefLayer.keyframes
    }
    else if (AutoFillLayer.isAutoFillLayer(layer)) {

      // const autoFillLayer = <AutoFillLayer>layer
      // for (const keyframe of autoFillLayer.keyframes) {
      //   for (const group of keyframe.groups) {
      //     for (const fillPoint of group.fillPoints) {
      //       delete fillPoint.startStroke
      //     }
      //   }
      // }
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      ifrLayer.imageFilePath = DocumentFileNameLogic.getDocumentRelativeFilePath(save_filePath, ifrLayer.imageFilePath)

      ifrLayer.location = this.vec3ToArray(ifrLayer.location)
      ifrLayer.rotation = this.vec3ToArray(ifrLayer.rotation)
      ifrLayer.scale = this.vec3ToArray(ifrLayer.scale)

      delete ifrLayer.runtime
    }
    else if (PosingLayer.isPosingLayer(layer)) {

      const posingLayer = <PosingLayer>layer

      // TODO: Vec3、Vec4データも変換する

      // TODO: 他のデータも削除する
      delete posingLayer.posingData.bodyLocationInputData.parentMatrix
      delete posingLayer.posingData.bodyLocationInputData.hitTestSphereRadius
    }

    for (const childLayer of layer.childLayers) {

      this.fixLayersRecursive(childLayer, save_filePath, state)
    }
  }

  static releaseDocumentResources(documentData: DocumentData, render: WebGLRender) {

    this.releaseDocumentResources_Recursive(documentData.rootLayer, render)
  }

  static releaseDocumentResources_Recursive(layer: Layer, render: WebGLRender) {

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      for (const keyframe of vectorLayer.keyframes) {

        for (const unit of keyframe.geometry.units) {

          for (const group of unit.groups) {

            if (group.runtime.buffer.buffer != null) {

              render.deleteBuffer(group.runtime.buffer.buffer)
              group.runtime.buffer.buffer = null
            }
          }
        }
      }
    }

    for (const childLayer of layer.childLayers) {

      this.releaseDocumentResources_Recursive(childLayer, render)
    }
  }
}
