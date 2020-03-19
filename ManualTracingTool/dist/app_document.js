var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var App_Document = /** @class */ (function (_super) {
        __extends(App_Document, _super);
        function App_Document() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.localSetting = new ManualTracingTool.LocalSetting();
            _this.localStorage_SettingKey = 'setting';
            _this.localStrageSaveDataKey = 'Manual tracing tool save data';
            _this.activeSettingName = 'activeSettingName';
            _this.oraScriptPath = './external/ora_js/';
            _this.oraVectorFileName = 'mttf.json';
            return _this;
        }
        // Backward interface implementations
        App_Document.prototype.getLocalSetting = function () {
            return this.localSetting;
        };
        // Backward interface definitions
        App_Document.prototype.resetDocument = function () {
        };
        App_Document.prototype.saveDocument = function () {
        };
        App_Document.prototype.startReloadDocument = function () {
            // To request reloading in App_Event
        };
        App_Document.prototype.startReloadDocumentFromFile = function (file, url) {
            // To request reloading for File drop event in App_Event
        };
        App_Document.prototype.startReloadDocumentFromText = function (documentData, textData, filePath) {
            // To call App_Main function in App_Document to start loading from text after extructing from .ora file
            //   case 1:                           App_Main(start loading at startup) -> App_Document.startStoreDocumentOraFile -> App_Main(this function)
            //   case 2: App_Event(drop a file) -> App_Main(start loading for a file) -> App_Document.startStoreDocumentOraFile -> App_Main(this function)
        };
        // System settings
        App_Document.prototype.loadSettings = function () {
            var activeSettingName = Platform.settings.getItem(this.activeSettingName);
            var localSetting = Platform.settings.getItem(activeSettingName);
            if (localSetting != null) {
                this.localSetting = localSetting;
            }
        };
        App_Document.prototype.saveSettings = function () {
            var activeSettingName = Platform.settings.getItem(this.activeSettingName);
            Platform.settings.setItem(activeSettingName, this.localSetting);
        };
        App_Document.prototype.registerLastUsedFile = function (filePath) {
            var paths = this.localSetting.lastUsedFilePaths;
            for (var index = 0; index < paths.length; index++) {
                if (paths[index] == filePath) {
                    ListRemoveAt(paths, index);
                }
            }
            ListInsertAt(paths, 0, filePath);
            if (paths.length > this.localSetting.maxLastUsedFilePaths) {
                paths = ListGetRange(paths, 0, this.localSetting.maxLastUsedFilePaths);
            }
            this.localSetting.lastUsedFilePaths = paths;
        };
        // Loading document resources
        App_Document.prototype.startLoadingDocumentURL = function (documentData, url) {
            var _this = this;
            var fileType = this.getDocumentFileTypeFromName(url);
            if (fileType == ManualTracingTool.DocumentFileType.none) {
                console.log('error: not supported file type.');
                return;
            }
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.timeout = 3000;
            if (fileType == ManualTracingTool.DocumentFileType.json) {
                xhr.responseType = 'json';
            }
            else if (fileType == ManualTracingTool.DocumentFileType.ora) {
                xhr.responseType = 'blob';
            }
            xhr.addEventListener('load', function (e) {
                if (fileType == ManualTracingTool.DocumentFileType.json) {
                    var data = void 0;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }
                    _this.storeLoadedDocumentJSON(documentData, data, url);
                }
                else if (fileType == ManualTracingTool.DocumentFileType.ora) {
                    _this.startLoadDocumentOraFile(documentData, xhr.response, url);
                }
            });
            xhr.addEventListener('timeout', function (e) {
                documentData.hasErrorOnLoading = true;
            });
            xhr.addEventListener('error', function (e) {
                documentData.hasErrorOnLoading = true;
            });
            xhr.send();
        };
        App_Document.prototype.startLoadDocumentOraFile = function (documentData, file, filePath) {
            var _this = this;
            var zipfs = new zip.fs.FS();
            zip.workerScriptsPath = this.oraScriptPath;
            zipfs.importBlob(file, function () {
                var entry = zipfs.find(_this.oraVectorFileName);
                if (entry) {
                    entry.getText(function (text) {
                        _this.startReloadDocumentFromText(documentData, text, filePath);
                        _this.registerLastUsedFile(filePath);
                        _this.setHeaderDocumentFileName(filePath);
                    });
                }
                else {
                    console.log('error: failed to read from ora file.');
                }
            });
        };
        App_Document.prototype.storeLoadedDocumentJSON = function (documentData, loadedData, filePath) {
            documentData.rootLayer = loadedData.rootLayer;
            documentData.documentFrame = loadedData.documentFrame;
            if (loadedData['paletteColos']) {
                documentData.paletteColors = loadedData['paletteColos'];
            }
            else {
                documentData.paletteColors = loadedData.paletteColors;
            }
            documentData.defaultViewScale = loadedData.defaultViewScale;
            documentData.lineWidthBiasRate = loadedData.lineWidthBiasRate;
            documentData.animationSettingData = loadedData.animationSettingData;
            documentData.exportBackGroundType = loadedData.exportBackGroundType;
            documentData.exportingCount = loadedData.exportingCount;
            documentData.loaded = true;
            this.setHeaderDocumentFileName(filePath);
        };
        App_Document.prototype.fixLoadedDocumentData = function (documentData) {
            var info = new ManualTracingTool.DocumentDataSaveInfo();
            info.modelFile = this.modelFile;
            ManualTracingTool.DocumentLogic.fixLoadedDocumentData_CollectLayers_Recursive(documentData.rootLayer, info);
            ManualTracingTool.DocumentLogic.fixLoadedDocumentData(documentData, info);
        };
        // Document data operations
        App_Document.prototype.getDocumentFileTypeFromName = function (filePath) {
            var fileType = ManualTracingTool.DocumentFileType.json;
            if (StringLastIndexOf(filePath, '.json') == filePath.length - 5) {
                fileType = ManualTracingTool.DocumentFileType.json;
            }
            else if (StringLastIndexOf(filePath, '.ora') == filePath.length - 4) {
                fileType = ManualTracingTool.DocumentFileType.ora;
            }
            return fileType;
        };
        App_Document.prototype.createDefaultDocumentData = function () {
            var saveData = Platform.settings.getItem(this.localStrageSaveDataKey);
            if (!StringIsNullOrEmpty(saveData)) {
                var document_1 = JSON.parse(saveData);
                document_1.loaded = true;
                return document_1;
            }
            var document = new ManualTracingTool.DocumentData();
            var rootLayer = document.rootLayer;
            rootLayer.type = ManualTracingTool.LayerTypeID.rootLayer;
            {
                var layer1 = new ManualTracingTool.VectorLayer();
                layer1.name = 'layer1';
                rootLayer.childLayers.push(layer1);
                var group1 = new ManualTracingTool.VectorGroup();
                layer1.keyframes[0].geometry.groups.push(group1);
            }
            //{
            //    let layer1 = new PosingLayer();
            //    layer1.name = 'posing1'
            //    rootLayer.childLayers.push(layer1);
            //    layer1.posingModel = this.modelFile.posingModelDictionary['dummy_skin'];
            //}
            document.loaded = true;
            return document;
        };
        App_Document.prototype.createPosingModel = function (modelData) {
            var posingModel = new ManualTracingTool.PosingModel();
            for (var index = 0; index < modelData.bones.length; index++) {
                var bone = modelData.bones[index];
                bone.worldMat = mat4.create();
                if (bone.parent == -1) {
                    mat4.copy(bone.worldMat, bone.matrix);
                }
                else {
                    mat4.multiply(bone.worldMat, modelData.bones[bone.parent].worldMat, bone.matrix);
                }
                bone.invMat = mat4.create();
                mat4.invert(bone.invMat, bone.worldMat);
            }
            var head = this.findBone(modelData.bones, 'head');
            var headCenter = this.findBone(modelData.bones, 'headCenter');
            var headTop = this.findBone(modelData.bones, 'headTop');
            var headBottom = this.findBone(modelData.bones, 'headBottom');
            var chest = this.findBone(modelData.bones, 'chest');
            var hips = this.findBone(modelData.bones, 'hips');
            var hipsTop = this.findBone(modelData.bones, 'hipsTop');
            var hipL = this.findBone(modelData.bones, 'hip.L');
            var neck1 = this.findBone(modelData.bones, 'neck1');
            var neck2 = this.findBone(modelData.bones, 'neck2');
            this.translationOf(this.toLocation, headCenter.worldMat);
            vec3.transformMat4(posingModel.headCenterLocation, this.toLocation, head.invMat);
            mat4.multiply(this.tempMat4, headTop.worldMat, head.invMat);
            this.translationOf(posingModel.headTopLocation, this.tempMat4);
            this.translationOf(this.toLocation, neck2.worldMat);
            vec3.transformMat4(posingModel.neckSphereLocation, this.toLocation, head.invMat);
            this.translationOf(this.fromLocation, headTop.worldMat);
            this.translationOf(this.toLocation, neck2.worldMat);
            vec3.subtract(posingModel.headTopToNeckVector, this.fromLocation, this.toLocation);
            this.translationOf(this.fromLocation, neck2.worldMat);
            this.translationOf(this.toLocation, chest.worldMat);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            mat4.lookAt(this.chestInvMat4, this.fromLocation, this.toLocation, this.upVector);
            mat4.multiply(posingModel.chestModelConvertMatrix, this.chestInvMat4, chest.worldMat);
            this.translationOf(this.toLocation, hips.worldMat);
            vec3.transformMat4(posingModel.bodyRotationSphereLocation, this.toLocation, this.chestInvMat4);
            vec3.subtract(this.tempVec3, this.fromLocation, this.toLocation);
            posingModel.bodySphereSize = vec3.length(this.tempVec3);
            this.translationOf(this.fromLocation, hips.worldMat);
            this.translationOf(this.toLocation, hipL.worldMat);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            mat4.lookAt(this.hipsInvMat4, this.fromLocation, this.toLocation, this.upVector);
            mat4.multiply(posingModel.hipsModelConvertMatrix, this.hipsInvMat4, hips.worldMat);
            mat4.rotateY(posingModel.hipsModelConvertMatrix, posingModel.hipsModelConvertMatrix, Math.PI);
            this.translationOf(this.fromLocation, hips.worldMat);
            this.translationOf(this.toLocation, hipsTop.worldMat);
            vec3.subtract(this.tempVec3, this.fromLocation, this.toLocation);
            posingModel.hipsSphereSize = vec3.length(this.tempVec3);
            this.translationOf(this.toLocation, neck1.worldMat);
            vec3.transformMat4(posingModel.shoulderSphereLocation, this.toLocation, this.chestInvMat4);
            var arm1L = this.findBone(modelData.bones, 'arm1.L');
            this.translationOf(this.toLocation, arm1L.worldMat);
            vec3.transformMat4(posingModel.leftArm1Location, this.toLocation, this.chestInvMat4);
            var arm1R = this.findBone(modelData.bones, 'arm1.R');
            this.translationOf(this.toLocation, arm1R.worldMat);
            vec3.transformMat4(posingModel.rightArm1Location, this.toLocation, this.chestInvMat4);
            var arm2L = this.findBone(modelData.bones, 'arm2.L');
            posingModel.leftArm1HeadLocation[2] = -arm2L.matrix[13];
            var arm2R = this.findBone(modelData.bones, 'arm2.R');
            posingModel.rightArm1HeadLocation[2] = -arm2R.matrix[13];
            var leg1L = this.findBone(modelData.bones, 'leg1.L');
            this.translationOf(this.toLocation, leg1L.worldMat);
            vec3.transformMat4(posingModel.leftLeg1Location, this.toLocation, this.hipsInvMat4);
            var leg1R = this.findBone(modelData.bones, 'leg1.R');
            this.translationOf(this.toLocation, leg1R.worldMat);
            vec3.transformMat4(posingModel.rightLeg1Location, this.toLocation, this.hipsInvMat4);
            var leg2L = this.findBone(modelData.bones, 'leg2.L');
            posingModel.leftLeg1HeadLocation[2] = -leg2L.matrix[13];
            var leg2R = this.findBone(modelData.bones, 'leg2.R');
            posingModel.rightLeg1HeadLocation[2] = -leg2R.matrix[13];
            return posingModel;
        };
        App_Document.prototype.translationOf = function (vec, mat) {
            vec3.set(vec, mat[12], mat[13], mat[14]);
        };
        App_Document.prototype.findBone = function (bones, boneName) {
            for (var _i = 0, bones_1 = bones; _i < bones_1.length; _i++) {
                var bone = bones_1[_i];
                if (bone.name == boneName) {
                    return bone;
                }
            }
            return null;
        };
        App_Document.prototype.finishLayerLoading_Recursive = function (layer) {
            if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                if (ifrLayer.imageLoading) {
                    ifrLayer.imageLoading = false;
                    ifrLayer.location[0] = -ifrLayer.imageResource.image.width / 2;
                    ifrLayer.location[1] = -ifrLayer.imageResource.image.height / 2;
                }
            }
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.finishLayerLoading_Recursive(childLayer);
            }
        };
        App_Document.prototype.createSaveDocumentData = function (documentData) {
            var info = new ManualTracingTool.DocumentDataSaveInfo();
            ManualTracingTool.DocumentLogic.fixSaveDocumentData_SetID_Recursive(documentData.rootLayer, info);
            ManualTracingTool.DocumentLogic.fixSaveDocumentData_CopyID_Recursive(documentData.rootLayer, info);
            var copy = JSON.parse(JSON.stringify(documentData));
            ManualTracingTool.DocumentLogic.fixSaveDocumentData(copy, info);
            return copy;
        };
        App_Document.prototype.saveDocumentData = function (filePath, documentData, forceToLocalStrage) {
            var save_DocumentData = this.createSaveDocumentData(documentData);
            this.registerLastUsedFile(filePath);
            if (forceToLocalStrage) {
                Platform.settings.setItem(this.localStrageSaveDataKey, save_DocumentData);
                return;
            }
            var fileType = this.getDocumentFileTypeFromName(filePath);
            if (fileType == ManualTracingTool.DocumentFileType.json) {
                this.saveDocumentJsonFile(filePath, save_DocumentData, documentData.exportBackGroundType);
            }
            else if (fileType == ManualTracingTool.DocumentFileType.ora) {
                this.saveDocumentOraFile(filePath, save_DocumentData, documentData.exportBackGroundType);
            }
        };
        App_Document.prototype.saveDocumentJsonFile = function (filePath, documentData, backGroundType) {
            Platform.writeFileSync(filePath, JSON.stringify(documentData), 'utf8', function (error) {
                if (error != null) {
                    this.showMessageBox('error : ' + error);
                }
            });
        };
        App_Document.prototype.saveDocumentOraFile = function (filePath, documentData, backGroundType) {
            var _this = this;
            var canvas = this.createExportImage(documentData, 1.0, backGroundType);
            ora.scriptsPath = this.oraScriptPath;
            var oraFile = new ora.Ora(canvas.width, canvas.height);
            var layer = oraFile.addLayer('marged', 0);
            layer.image = canvas;
            var save_DocumentData = this.createSaveDocumentData(documentData);
            oraFile.save(this.oraVectorFileName, JSON.stringify(save_DocumentData), function (dataURL) {
                Platform.writeFileSync(filePath, dataURL, 'base64', function (error) {
                    if (error) {
                        _this.showMessageBox(error);
                    }
                });
            });
        };
        App_Document.prototype.createExportImage = function (documentData, scale, backGroundType) {
            var layout = ManualTracingTool.DocumentData.getDocumentLayout(documentData);
            var imageLeft = Math.floor(layout.left);
            var imageTop = Math.floor(layout.top);
            var imageWidth = Math.floor(layout.width * scale);
            var imageHeight = Math.floor(layout.height * scale);
            if (imageWidth <= 0 || imageHeight <= 0) {
                return null;
            }
            this.exportRenderWindow.createCanvas();
            this.exportRenderWindow.setCanvasSize(imageWidth, imageHeight);
            this.exportRenderWindow.initializeContext();
            this.exportRenderWindow.viewLocation[0] = imageLeft;
            this.exportRenderWindow.viewLocation[1] = imageTop;
            this.exportRenderWindow.viewScale = scale;
            this.exportRenderWindow.viewRotation = 0.0;
            this.exportRenderWindow.centerLocationRate[0] = 0.0;
            this.exportRenderWindow.centerLocationRate[1] = 0.0;
            this.clearWindow(this.exportRenderWindow);
            if (backGroundType == ManualTracingTool.DocumentBackGroundTypeID.lastPaletteColor) {
                this.canvasRender.setContext(this.exportRenderWindow);
                this.canvasRender.resetTransform();
                this.canvasRender.setFillColorV(documentData.paletteColors[documentData.paletteColors.length - 1].color);
                this.canvasRender.fillRect(0, 0, imageWidth, imageHeight);
            }
            this.drawExportImage(this.exportRenderWindow);
            var canvas = this.exportRenderWindow.releaseCanvas();
            return canvas;
        };
        App_Document.prototype.exportImageFile = function (fileName, documentData, scale, backGroundType) {
            var _this = this;
            var canvas = this.createExportImage(documentData, scale, backGroundType);
            if (canvas == null) {
                return;
            }
            var localSetting = this.getLocalSetting();
            var exportPath = localSetting.exportPath;
            var imageType = this.getRadioElementIntValue(this.ID.exportImageFileModal_imageFileType, 1);
            var extText = '.png';
            if (imageType == 2) {
                extText = '.jpg';
            }
            var fileFullPath = exportPath + '/' + fileName + extText;
            var imageTypeText = 'image/png';
            if (imageType == 2) {
                imageTypeText = 'image/jpeg';
            }
            var dataURL = canvas.toDataURL(imageTypeText, 0.9);
            Platform.writeFileSync(fileFullPath, dataURL, 'base64', function (error) {
                if (error) {
                    _this.showMessageBox(error);
                }
            });
            // Free canvas memory
            canvas.width = 10;
            canvas.height = 10;
        };
        return App_Document;
    }(ManualTracingTool.App_Tool));
    ManualTracingTool.App_Document = App_Document;
})(ManualTracingTool || (ManualTracingTool = {}));
