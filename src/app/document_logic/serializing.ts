import { float } from '../logics/conversion'
import {
  AutoFillLayer,
  DocumentData, DocumentDataSerializingState,
  ImageFileReferenceLayer, Layer,
  PosingLayer, VectorLayer, VectorLayerReferenceLayer} from '../document_data'
import { WebGLRender } from '../render/render3d'

export class DocumentSerializingLogic {

  vec3ToArray(vec: Vec3): float[] {

    return [vec[0], vec[1], vec[2]]
  }

  vec4ToArray(vec: Vec4): float[] {

    return [vec[0], vec[1], vec[2], vec[3]]
  }

  fixSaveDocumentData(documentData: DocumentData, state: DocumentDataSerializingState) {

    this.fixSaveDocumentData_FixLayer_Recursive(documentData.rootLayer, state)

    for (const paletteColor of documentData.paletteColors) {

      delete paletteColor.isSelected

      paletteColor.color = this.vec4ToArray(paletteColor.color)
    }
  }

  fixSaveDocumentData_SetID_Recursive(layer: Layer, state: DocumentDataSerializingState) {

    state.addLayer(layer)

    for (const childLayer of layer.childLayers) {

      this.fixSaveDocumentData_SetID_Recursive(childLayer, state)
    }
  }

  fixSaveDocumentData_CopyID_Recursive(layer: Layer, state: DocumentDataSerializingState) {

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      if (vectorLayer.posingLayer != null) {

        vectorLayer.posingLayerID = vectorLayer.posingLayer.ID
      }
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      const vRefLayer = <VectorLayerReferenceLayer>layer

      if (vRefLayer.referenceLayer != null) {

        vRefLayer.referenceLayerID = vRefLayer.referenceLayer.ID
      }
    }

    for (const childLayer of layer.childLayers) {

      this.fixSaveDocumentData_CopyID_Recursive(childLayer, state)
    }
  }

  fixSaveDocumentData_FixLayer_Recursive(layer: Layer, state: DocumentDataSerializingState) {

    delete layer.hashID
    delete layer.parentLayer
    delete layer.isHierarchicalVisible
    delete layer.isHierarchicalSelected

    layer.layerColor = this.vec4ToArray(layer.layerColor)

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      vectorLayer.fillColor = this.vec4ToArray(vectorLayer.fillColor)
      delete vectorLayer.posingLayer
      delete vectorLayer.eyesSymmetryGeometry

      for (const keyframe of vectorLayer.keyframes) {

        for (const unit of keyframe.geometry.units) {

          for (const group of unit.groups) {

            delete group.isUpdated
            delete group.buffer

            for (const line of group.lines) {

              delete line.modifyFlag
              delete line.isCloseToMouse
              delete line.left
              delete line.top
              delete line.right
              delete line.bottom
              delete line.range
              delete line.totalLength

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
      delete vRefLayer.referenceLayer
    }
    else if (AutoFillLayer.isAutoFillLayer(layer)) {

      const autoFillLayer = <AutoFillLayer>layer

      for (const fillPoint of autoFillLayer.fillPoints) {

        delete fillPoint.startStroke
      }
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      ifrLayer.location = this.vec3ToArray(ifrLayer.location)
      ifrLayer.rotation = this.vec3ToArray(ifrLayer.rotation)
      ifrLayer.scale = this.vec3ToArray(ifrLayer.scale)

      delete ifrLayer.imageResource
      delete ifrLayer.imageFirstLoading
      delete ifrLayer.adjustingLocation
      delete ifrLayer.adjustingRotation
      delete ifrLayer.adjustingScale
    }
    else if (PosingLayer.isPosingLayer(layer)) {

      const posingLayer = <PosingLayer>layer

      // TODO: Vec3、Vec4データも変換する

      // TODO: 他のデータも削除する
      delete posingLayer.posingData.bodyLocationInputData.parentMatrix
      delete posingLayer.posingData.bodyLocationInputData.hitTestSphereRadius
    }

    for (const childLayer of layer.childLayers) {

      this.fixSaveDocumentData_FixLayer_Recursive(childLayer, state)
    }
  }

  releaseDocumentResources(documentData: DocumentData, render: WebGLRender) {

    this.releaseDocumentResources_Recursive(documentData.rootLayer, render)
  }

  releaseDocumentResources_Recursive(layer: Layer, render: WebGLRender) {

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      for (const keyframe of vectorLayer.keyframes) {

        for (const unit of keyframe.geometry.units) {

          for (const group of unit.groups) {

            if (group.buffer.buffer != null) {

              render.deleteBuffer(group.buffer.buffer)
              group.buffer.buffer = null
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
