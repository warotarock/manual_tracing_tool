var ManualTracingTool;
(function (ManualTracingTool) {
    var DocumentLogic = /** @class */ (function () {
        function DocumentLogic() {
        }
        DocumentLogic.getDefaultDocumentFileName = function (localSetting) {
            var date = new Date();
            var fileName = (''
                + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
                + '_' + ('0' + this.fileNameCount).slice(-2));
            this.fileNameCount++;
            return localSetting.currentDirectoryPath + '\\' + fileName + '.ora';
        };
        DocumentLogic.fixLoadedDocumentData = function (documentData, info) {
            if (documentData.paletteColors == undefined) {
                if ('palletColors' in documentData) {
                    documentData['paletteColors'] = documentData['palletColors'];
                }
                else {
                    ManualTracingTool.DocumentData.initializeDefaultPaletteColors(documentData);
                }
            }
            if (documentData.exportingCount == undefined) {
                documentData.exportingCount = 1;
            }
            while (documentData.paletteColors.length < ManualTracingTool.DocumentData.maxPaletteColors) {
                documentData.paletteColors.push(new ManualTracingTool.PaletteColor());
            }
            if (documentData.animationSettingData == undefined) {
                documentData.animationSettingData = new ManualTracingTool.AnimationSettingData();
            }
            if (documentData.defaultViewScale == undefined) {
                documentData.defaultViewScale = 1.0;
            }
            if (documentData.lineWidthBiasRate == undefined) {
                documentData.lineWidthBiasRate = 1.0;
            }
            if (documentData.exportBackGroundType == undefined) {
                documentData.exportBackGroundType = ManualTracingTool.DocumentBackGroundTypeID.lastPaletteColor;
            }
            this.fixLoadedDocumentData_FixLayer_Recursive(documentData.rootLayer, info);
        };
        DocumentLogic.fixLoadedDocumentData_CollectLayers_Recursive = function (layer, info) {
            info.collectLayer(layer);
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.fixLoadedDocumentData_CollectLayers_Recursive(childLayer, info);
            }
        };
        DocumentLogic.fixLoadedDocumentData_FixLayer_Recursive = function (layer, info) {
            if (layer.isRenderTarget == undefined) {
                layer.isRenderTarget = true;
            }
            layer.isHierarchicalVisible = layer.isVisible;
            layer.isHierarchicalSelected = layer.isSelected;
            if (layer.isMaskedByBelowLayer == undefined) {
                layer.isMaskedByBelowLayer = false;
            }
            layer.bufferCanvasWindow = null;
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                if (vectorLayer.drawLineType == undefined) {
                    vectorLayer.drawLineType = ManualTracingTool.DrawLineTypeID.layerColor;
                }
                if (vectorLayer.fillAreaType == undefined) {
                    vectorLayer.fillAreaType = ManualTracingTool.FillAreaTypeID.none;
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
                    vectorLayer.keyframes = new List();
                    var key = new ManualTracingTool.VectorLayerKeyframe();
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
                for (var _i = 0, _a = vectorLayer.keyframes; _i < _a.length; _i++) {
                    var keyframe = _a[_i];
                    for (var _b = 0, _c = keyframe.geometry.groups; _b < _c.length; _b++) {
                        var group = _c[_b];
                        group.buffer = new ManualTracingTool.GPUVertexBuffer();
                        for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                            var line = _e[_d];
                            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                            line.isCloseToMouse = false;
                            if (line['strokeWidth'] != undefined) {
                                delete line['strokeWidth'];
                            }
                            for (var _f = 0, _g = line.points; _f < _g.length; _f++) {
                                var point = _g[_f];
                                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
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
                            ManualTracingTool.Logic_Edit_Line.calculateParameters(line);
                        }
                    }
                }
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.vectorLayerReferenceLayer) {
                var vRefLayer = layer;
                vRefLayer.referenceLayer = info.layerDictionary[vRefLayer.referenceLayerID];
                vRefLayer.keyframes = vRefLayer.referenceLayer.keyframes;
                delete vRefLayer.referenceLayerID;
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
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
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = layer;
                posingLayer.drawingUnits = null;
                var posingData = posingLayer.posingData;
                if (posingData.rootMatrix == undefined) {
                    posingData = new ManualTracingTool.PosingData();
                }
                if (posingData.real3DViewMeterPerPixel == undefined) {
                    var posingModel = posingLayer.posingModel;
                    var radiusSum = posingData.headLocationInputData.radius;
                    var real2DViewWidth = posingData.real3DViewHalfWidth / posingModel.headSphereSize * radiusSum;
                    posingData.real3DViewMeterPerPixel = posingData.real3DViewHalfWidth / real2DViewWidth / 1.75 * 2.0;
                }
                posingLayer.posingModel = info.modelFile.posingModelDictionary['dummy_skin'];
            }
            for (var _h = 0, _j = layer.childLayers; _h < _j.length; _h++) {
                var childLayer = _j[_h];
                this.fixLoadedDocumentData_FixLayer_Recursive(childLayer, info);
            }
        };
        DocumentLogic.vec3ToArray = function (vec) {
            return [vec[0], vec[1], vec[2]];
        };
        DocumentLogic.vec4ToArray = function (vec) {
            return [vec[0], vec[1], vec[2], vec[3]];
        };
        DocumentLogic.fixSaveDocumentData = function (document, info) {
            this.fixSaveDocumentData_FixLayer_Recursive(document.rootLayer, info);
            for (var i = 0; i < document.paletteColors.length; i++) {
                var paletteColor = document.paletteColors[i];
                paletteColor.color = DocumentLogic.vec4ToArray(paletteColor.color);
            }
        };
        DocumentLogic.fixSaveDocumentData_SetID_Recursive = function (layer, info) {
            info.addLayer(layer);
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.fixSaveDocumentData_SetID_Recursive(childLayer, info);
            }
        };
        DocumentLogic.fixSaveDocumentData_CopyID_Recursive = function (layer, info) {
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayerReferenceLayer) {
                var vRefLayer = layer;
                vRefLayer.referenceLayerID = vRefLayer.referenceLayer.ID;
            }
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.fixSaveDocumentData_CopyID_Recursive(childLayer, info);
            }
        };
        DocumentLogic.fixSaveDocumentData_FixLayer_Recursive = function (layer, info) {
            delete layer.bufferCanvasWindow;
            layer.layerColor = this.vec4ToArray(layer.layerColor);
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                vectorLayer.fillColor = DocumentLogic.vec4ToArray(vectorLayer.fillColor);
                for (var _i = 0, _a = vectorLayer.keyframes; _i < _a.length; _i++) {
                    var keyframe = _a[_i];
                    for (var _b = 0, _c = keyframe.geometry.groups; _b < _c.length; _b++) {
                        var group = _c[_b];
                        delete group.buffer;
                        for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                            var line = _e[_d];
                            delete line.modifyFlag;
                            delete line.isCloseToMouse;
                            delete line.left;
                            delete line.top;
                            delete line.right;
                            delete line.bottom;
                            delete line.range;
                            delete line.totalLength;
                            for (var _f = 0, _g = line.points; _f < _g.length; _f++) {
                                var point = _g[_f];
                                point.location = DocumentLogic.vec3ToArray(point.location);
                                delete point.adjustingLocation;
                                delete point.tempLocation;
                                delete point.adjustingLineWidth;
                            }
                        }
                    }
                }
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.vectorLayerReferenceLayer) {
                var vRefLayer = layer;
                delete vRefLayer.keyframes;
                delete vRefLayer.referenceLayer;
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                ifrLayer.location = DocumentLogic.vec3ToArray(ifrLayer.location);
                ifrLayer.rotation = DocumentLogic.vec3ToArray(ifrLayer.rotation);
                ifrLayer.scale = DocumentLogic.vec3ToArray(ifrLayer.scale);
                delete ifrLayer.imageResource;
                delete ifrLayer.imageLoading;
                delete ifrLayer.adjustingLocation;
                delete ifrLayer.adjustingRotation;
                delete ifrLayer.adjustingScale;
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = layer;
                // TODO: Vec3、Vec4データも変換する
                // TODO: 他のデータも削除する
                delete posingLayer.posingData.bodyLocationInputData.parentMatrix;
                delete posingLayer.posingData.bodyLocationInputData.hitTestSphereRadius;
            }
            for (var _h = 0, _j = layer.childLayers; _h < _j.length; _h++) {
                var childLayer = _j[_h];
                this.fixSaveDocumentData_FixLayer_Recursive(childLayer, info);
            }
        };
        DocumentLogic.releaseDocumentResources = function (document, gl) {
            this.releaseDocumentResources_Recursive(document.rootLayer, gl);
        };
        DocumentLogic.releaseDocumentResources_Recursive = function (layer, gl) {
            delete layer.isHierarchicalVisible;
            delete layer.isHierarchicalSelected;
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                for (var _i = 0, _a = vectorLayer.keyframes; _i < _a.length; _i++) {
                    var keyframe = _a[_i];
                    for (var _b = 0, _c = keyframe.geometry.groups; _b < _c.length; _b++) {
                        var group = _c[_b];
                        if (group.buffer.buffer != null) {
                            gl.deleteBuffer(group.buffer.buffer);
                            group.buffer.buffer = null;
                        }
                    }
                }
            }
            for (var _d = 0, _e = layer.childLayers; _d < _e.length; _d++) {
                var childLayer = _e[_d];
                this.releaseDocumentResources_Recursive(childLayer, gl);
            }
        };
        DocumentLogic.fileNameCount = 1;
        return DocumentLogic;
    }());
    ManualTracingTool.DocumentLogic = DocumentLogic;
})(ManualTracingTool || (ManualTracingTool = {}));
