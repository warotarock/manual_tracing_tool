﻿import { float, List } from 'base/conversion';
import {
  DocumentData, DocumentDataSaveInfo,
  DocumentBackGroundTypeID,
  Layer, LayerTypeID, FillAreaTypeID, VectorLayerKeyframe,
  VectorLayer,
  ImageFileReferenceLayer,
  VectorLayerReferenceLayer,
  DrawLineTypeID,
  PaletteColor,
  VectorLineModifyFlagID,
  LinePointModifyFlagID,
  AnimationSettingData,
  PosingData,
  PosingLayer,
  LocalSetting,
} from 'base/data';

import { GPUVertexBuffer } from 'logics/gpu_data';
import { Logic_Edit_Line } from 'logics/edit_vector_layer';


export class DocumentLogic {

  private static fileNameCount = 1;

  static getDefaultDocumentFileName(localSetting: LocalSetting): string {

    var date = new Date();
    var fileName = (''
      + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
      + '_' + ('0' + this.fileNameCount).slice(-2)
    );

    this.fileNameCount++;

    return localSetting.currentDirectoryPath + '\\' + fileName + '.ora';
  }

  static fixLoadedDocumentData(documentData: DocumentData, info: DocumentDataSaveInfo) {

    // palette
    {
      if (documentData.paletteColors == undefined) {

        if ('palletColors' in documentData) {

          documentData['paletteColors'] = documentData['palletColors'];
        }
        else {

          DocumentData.initializeDefaultPaletteColors(documentData);
        }
      }

      for (let paletteColor of documentData.paletteColors) {

        paletteColor.isSelected = false;
      }

      while (documentData.paletteColors.length < DocumentData.maxPaletteColors) {

        documentData.paletteColors.push(new PaletteColor());
      }
    }

    if (documentData.exportingCount == undefined) {

      documentData.exportingCount = 1;
    }

    if (documentData.animationSettingData == undefined) {

      documentData.animationSettingData = new AnimationSettingData();
    }

    if (documentData.defaultViewScale == undefined) {

      documentData.defaultViewScale = 1.0;
    }

    if (documentData.lineWidthBiasRate == undefined) {

      documentData.lineWidthBiasRate = 1.0;
    }

    if (documentData.exportBackGroundType == undefined) {

      documentData.exportBackGroundType = DocumentBackGroundTypeID.lastPaletteColor;
    }

    this.fixLoadedDocumentData_FixLayer_Recursive(documentData.rootLayer, info);
  }

  static fixLoadedDocumentData_CollectLayers_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

    info.collectLayer(layer);

    for (let childLayer of layer.childLayers) {

      this.fixLoadedDocumentData_CollectLayers_Recursive(childLayer, info);
    }
  }

  static fixLoadedDocumentData_FixLayer_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

    layer.hashID = Layer.getHashID();
    layer.bufferCanvasWindow = null;

    if (layer.isRenderTarget == undefined) {
      layer.isRenderTarget = true;
    }

    layer.isHierarchicalVisible = layer.isVisible;
    layer.isHierarchicalSelected = layer.isSelected;

    if (layer.isMaskedByBelowLayer == undefined) {
      layer.isMaskedByBelowLayer = false;
    }

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      let vectorLayer = <VectorLayer>layer;

      if (vectorLayer.drawLineType == undefined) {
        vectorLayer.drawLineType = DrawLineTypeID.layerColor;
      }

      if (vectorLayer.fillAreaType == undefined) {
        vectorLayer.fillAreaType = FillAreaTypeID.none;
      }

      if (vectorLayer.fillColor == undefined) {
        vectorLayer.fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
      }

      if (vectorLayer.line_PaletteColorIndex == undefined) {

        vectorLayer['line_PaletteColorIndex'] = vectorLayer['line_PalletColorIndex'] || 0;
      }

      if (vectorLayer.fill_PaletteColorIndex == undefined) {

        vectorLayer['fill_PaletteColorIndex'] = vectorLayer['fill_PalletColorIndex'] || 0;
      }

      if (vectorLayer.keyframes == undefined && vectorLayer['geometry'] != undefined) {

        vectorLayer.keyframes = new List<VectorLayerKeyframe>();
        let key = new VectorLayerKeyframe();
        key.frame = 0;
        key.geometry = vectorLayer['geometry'];
        vectorLayer.keyframes.push(key);
      }

      if (vectorLayer['geometry'] != undefined) {
        delete vectorLayer['geometry'];
      }

      if (vectorLayer['groups'] != undefined) {
        delete vectorLayer['groups'];
      }

      for (let keyframe of vectorLayer.keyframes) {

        for (let group of keyframe.geometry.groups) {

          group.buffer = new GPUVertexBuffer();

          for (let line of group.lines) {

            line.modifyFlag = VectorLineModifyFlagID.none;
            line.isCloseToMouse = false;

            if (line['strokeWidth'] != undefined) {
              delete line['strokeWidth'];
            }

            for (let point of line.points) {

              point.modifyFlag = LinePointModifyFlagID.none;

              point.location[2] = 0.0;

              point.adjustingLocation = vec3.create();
              vec3.copy(point.adjustingLocation, point.location);

              point.tempLocation = vec3.create();

              point.adjustingLineWidth = point.lineWidth;

              if (point.lineWidth == undefined) {
                point.lineWidth = 1.0;
              }

              point.adjustingLengthFrom = 1.0;
              point.adjustingLengthTo = 0.0;

              if (point['adjustedLocation'] != undefined) {
                delete point['adjustedLocation'];
              }
            }

            Logic_Edit_Line.calculateParameters(line);
          }
        }
      }
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      let vRefLayer = <VectorLayerReferenceLayer>layer;

      vRefLayer.referenceLayer = <VectorLayer>info.layerDictionary[vRefLayer.referenceLayerID];
      vRefLayer.keyframes = vRefLayer.referenceLayer.keyframes;

      delete vRefLayer.referenceLayerID;
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      let ifrLayer = <ImageFileReferenceLayer>layer;

      ifrLayer.imageResource = null;

      ifrLayer.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
      ifrLayer.adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0);
      ifrLayer.adjustingScale = vec3.fromValues(1.0, 1.0, 1.0);

      if (ifrLayer.location == undefined) {

        ifrLayer.location = vec3.fromValues(0.0, 0.0, 0.0);
        ifrLayer.rotation = vec3.fromValues(0.0, 0.0, 0.0);
        ifrLayer.scale = vec3.fromValues(1.0, 1.0, 1.0);
      }

      vec3.copy(ifrLayer.adjustingLocation, ifrLayer.location);
      vec3.copy(ifrLayer.adjustingRotation, ifrLayer.rotation);
      vec3.copy(ifrLayer.adjustingScale, ifrLayer.scale);
    }
    else if (PosingLayer.isPosingLayer(layer)) {

      let posingLayer = <PosingLayer>layer;

      posingLayer.drawingUnits = null;

      let posingData = posingLayer.posingData;

      if (posingData.rootMatrix == undefined) {

        posingData = new PosingData();
      }

      if (posingData.real3DViewMeterPerPixel == undefined) {

        let posingModel = posingLayer.posingModel;
        let radiusSum = posingData.headLocationInputData.radius;
        let real2DViewWidth = posingData.real3DViewHalfWidth / posingModel.headSphereSize * radiusSum;

        posingData.real3DViewMeterPerPixel = posingData.real3DViewHalfWidth / real2DViewWidth / 1.75 * 2.0;
      }

      posingLayer.posingModel = info.modelFile.posingModelDictionary['dummy_skin'];
    }

    for (let childLayer of layer.childLayers) {

      this.fixLoadedDocumentData_FixLayer_Recursive(childLayer, info);
    }
  }

  static vec3ToArray(vec: Vec3): float[] {

    return [vec[0], vec[1], vec[2]];
  }

  static vec4ToArray(vec: Vec4): float[] {

    return [vec[0], vec[1], vec[2], vec[3]];
  }

  static fixSaveDocumentData(documentData: DocumentData, info: DocumentDataSaveInfo) {

    this.fixSaveDocumentData_FixLayer_Recursive(documentData.rootLayer, info);

    for (let paletteColor of documentData.paletteColors) {

      delete paletteColor.isSelected;

      paletteColor.color = DocumentLogic.vec4ToArray(paletteColor.color);
    }
  }

  static fixSaveDocumentData_SetID_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

    info.addLayer(layer);

    for (let childLayer of layer.childLayers) {

      this.fixSaveDocumentData_SetID_Recursive(childLayer, info);
    }
  }

  static fixSaveDocumentData_CopyID_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

    if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      let vRefLayer = <VectorLayerReferenceLayer>layer;

      vRefLayer.referenceLayerID = vRefLayer.referenceLayer.ID;
    }

    for (let childLayer of layer.childLayers) {

      this.fixSaveDocumentData_CopyID_Recursive(childLayer, info);
    }
  }

  static fixSaveDocumentData_FixLayer_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

    delete layer.hashID;
    delete layer.bufferCanvasWindow;

    layer.layerColor = this.vec4ToArray(layer.layerColor);

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      let vectorLayer = <VectorLayer>layer;

      vectorLayer.fillColor = DocumentLogic.vec4ToArray(vectorLayer.fillColor);

      for (let keyframe of vectorLayer.keyframes) {

        for (let group of keyframe.geometry.groups) {

          delete group.buffer;

          for (let line of group.lines) {

            delete line.modifyFlag;
            delete line.isCloseToMouse;
            delete line.left;
            delete line.top;
            delete line.right;
            delete line.bottom;
            delete line.range;
            delete line.totalLength;

            for (let point of line.points) {

              point.location = DocumentLogic.vec3ToArray(point.location);

              delete point.adjustingLocation;
              delete point.tempLocation;
              delete point.adjustingLineWidth;
            }
          }
        }
      }
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      let vRefLayer = <VectorLayerReferenceLayer>layer;

      delete vRefLayer.keyframes;
      delete vRefLayer.referenceLayer;
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      let ifrLayer = <ImageFileReferenceLayer>layer;

      ifrLayer.location = DocumentLogic.vec3ToArray(ifrLayer.location);
      ifrLayer.rotation = DocumentLogic.vec3ToArray(ifrLayer.rotation);
      ifrLayer.scale = DocumentLogic.vec3ToArray(ifrLayer.scale);

      delete ifrLayer.imageResource;
      delete ifrLayer.imageLoading;
      delete ifrLayer.adjustingLocation;
      delete ifrLayer.adjustingRotation;
      delete ifrLayer.adjustingScale;
    }
    else if (PosingLayer.isPosingLayer(layer)) {

      let posingLayer = <PosingLayer>layer;

      // TODO: Vec3、Vec4データも変換する

      // TODO: 他のデータも削除する
      delete posingLayer.posingData.bodyLocationInputData.parentMatrix;
      delete posingLayer.posingData.bodyLocationInputData.hitTestSphereRadius;
    }

    for (let childLayer of layer.childLayers) {

      this.fixSaveDocumentData_FixLayer_Recursive(childLayer, info);
    }
  }

  static releaseDocumentResources(documentData: DocumentData, gl: WebGLRenderingContext) {

    this.releaseDocumentResources_Recursive(documentData.rootLayer, gl);
  }

  static releaseDocumentResources_Recursive(layer: Layer, gl: WebGLRenderingContext) {

    delete layer.isHierarchicalVisible;
    delete layer.isHierarchicalSelected;

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      let vectorLayer = <VectorLayer>layer;

      for (let keyframe of vectorLayer.keyframes) {

        for (let group of keyframe.geometry.groups) {

          if (group.buffer.buffer != null) {

            gl.deleteBuffer(group.buffer.buffer);
            group.buffer.buffer = null;
          }
        }
      }
    }

    for (let childLayer of layer.childLayers) {

      this.releaseDocumentResources_Recursive(childLayer, gl);
    }
  }
}
