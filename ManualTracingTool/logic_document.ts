﻿
namespace ManualTracingTool {

    export class DocumentLogic {

        private static fileNameCount = 1;

        static getDefaultDocumentFileName(localSetting: LocalSetting): string {

            var date = new Date();
            var fileName = (''
                + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
                + '_' + ('0' + this.fileNameCount).slice(-2)
            );

            this.fileNameCount++;

            return localSetting.currentDirectoryPath + '\\' + fileName + '.json';
        }

        static fixLoadedDocumentData(document: DocumentData, info: DocumentDataSaveInfo) {

            if (document.palletColors == undefined) {
                DocumentData.initializeDefaultPalletColors(document);
            }

            while (document.palletColors.length < DocumentData.maxPalletColors) {

                document.palletColors.push(new PalletColor());
            }

            if (document.animationSettingData == undefined) {
                document.animationSettingData = new AnimationSettingData();
            }

            if (document.defaultViewScale == undefined) {
                document.defaultViewScale = 1.0;
            }

            if (document.lineWidthBiasRate == undefined) {
                document.lineWidthBiasRate = 1.0;
            }

            this.fixLoadedDocumentData_FixLayer_Recursive(document.rootLayer, info);
        }

        static fixLoadedDocumentData_CollectLayers_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

            info.collectLayer(layer);

            for (let childLayer of layer.childLayers) {

                this.fixLoadedDocumentData_CollectLayers_Recursive(childLayer, info);
            }
        }

        static fixLoadedDocumentData_FixLayer_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

            if (layer.isRenderTarget == undefined) {
                layer.isRenderTarget = true;
            }

            if (layer.isHierarchicalVisible == undefined) {
                layer.isHierarchicalVisible = true;
            }

            if (layer.type == LayerTypeID.vectorLayer) {

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

                if (vectorLayer.line_PalletColorIndex == undefined) {
                    vectorLayer.line_PalletColorIndex = 0;
                }

                if (vectorLayer.fill_PalletColorIndex == undefined) {
                    vectorLayer.fill_PalletColorIndex = 1;
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

                        for (let line of group.lines) {

                            line.modifyFlag = VectorLineModifyFlagID.none;
                            line.isCloseToMouse = false;

                            if (line['strokeWidth'] != undefined) {
                                delete line['strokeWidth'];
                            }

                            for (let point of line.points) {

                                point.modifyFlag = LinePointModifyFlagID.none;

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
            else if (layer.type == LayerTypeID.vectorLayerReferenceLayer) {

                let vRefLayer = <VectorLayerReferenceLayer>layer;

                vRefLayer.referenceLayer = <VectorLayer>info.layerDictionary[vRefLayer.referenceLayerID];
                vRefLayer.keyframes = vRefLayer.referenceLayer.keyframes;

                delete vRefLayer.referenceLayerID;
            }
            else if (layer.type == LayerTypeID.imageFileReferenceLayer) {

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
            else if (layer.type == LayerTypeID.posingLayer) {

                let posingLayer = <PosingLayer>layer;

                posingLayer.drawingUnits = null;

                if (posingLayer.posingData.rootMatrix == undefined) {

                    posingLayer.posingData = new PosingData();
                }

                posingLayer.posingModel = info.modelFile.posingModelDictionary['dummy_skin'];
            }

            for (let childLayer of layer.childLayers) {

                this.fixLoadedDocumentData_FixLayer_Recursive(childLayer, info);
            }
        }

        static fixSaveDocumentData(document: DocumentData, info: DocumentDataSaveInfo) {

            this.fixSaveDocumentData_FixLayer_Recursive(document.rootLayer, info);
        }

        static fixSaveDocumentData_SetID_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

            info.addLayer(layer);

            for (let childLayer of layer.childLayers) {

                this.fixSaveDocumentData_SetID_Recursive(childLayer, info);
            }
        }

        static fixSaveDocumentData_CopyID_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

            if (layer.type == LayerTypeID.vectorLayerReferenceLayer) {

                let vRefLayer = <VectorLayerReferenceLayer>layer;

                vRefLayer.referenceLayerID = vRefLayer.referenceLayer.ID;
            }

            for (let childLayer of layer.childLayers) {

                this.fixSaveDocumentData_CopyID_Recursive(childLayer, info);
            }
        }

        static fixSaveDocumentData_FixLayer_Recursive(layer: Layer, info: DocumentDataSaveInfo) {

            if (layer.type == LayerTypeID.vectorLayer) {

                let vectorLayer = <VectorLayer>layer;

                for (let keyframe of vectorLayer.keyframes) {

                    for (let group of keyframe.geometry.groups) {

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

                                delete point.adjustingLocation;
                                delete point.tempLocation;
                                delete point.adjustingLineWidth;
                            }
                        }
                    }
                }
            }
            else if (layer.type == LayerTypeID.vectorLayerReferenceLayer) {

                let vRefLayer = <VectorLayerReferenceLayer>layer;

                delete vRefLayer.keyframes;
                delete vRefLayer.referenceLayer;
            }
            else if (layer.type == LayerTypeID.imageFileReferenceLayer) {

                let ifrLayer = <ImageFileReferenceLayer>layer;

                delete ifrLayer.imageResource;
                delete ifrLayer.imageLoading;
                delete ifrLayer.adjustingLocation;
                delete ifrLayer.adjustingRotation;
                delete ifrLayer.adjustingScale;
            }
            else if (layer.type == LayerTypeID.posingLayer) {

                let posingLayer = <PosingLayer>layer;

                // TODO: 他のデータも削除する
                delete posingLayer.posingData.bodyLocationInputData.parentMatrix;
                delete posingLayer.posingData.bodyLocationInputData.hitTestSphereRadius;
            }

            for (let childLayer of layer.childLayers) {

                this.fixSaveDocumentData_FixLayer_Recursive(childLayer, info);
            }
        }
    }
}
