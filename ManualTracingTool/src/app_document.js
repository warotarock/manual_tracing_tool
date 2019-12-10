var ManualTracingTool;
(function (ManualTracingTool) {
    class App_Document extends ManualTracingTool.App_Tool {
        constructor() {
            super(...arguments);
            this.localSetting = new ManualTracingTool.LocalSetting();
            this.localStorage_SettingKey = 'MTT-Settings';
            this.localStorage_SettingIndexKey = 'MTT-Settings Index';
            this.tempFileNameKey = 'Manual tracing tool save data';
            this.oraScriptPath = './external/ora_js/';
            this.oraVectorFileName = 'mttf.json';
        }
        // Backward interface implementations
        getLocalSetting() {
            return this.localSetting;
        }
        // Backward interface definitions
        resetDocument() {
        }
        saveDocument() {
        }
        startReloadDocument() {
            // To request reloading in App_Event
        }
        startReloadDocumentFromFile(file, url) {
            // To request reloading for File drop event in App_Event
        }
        startReloadDocumentFromText(documentData, textData, filePath) {
            // To call App_Main function in App_Document to start loading from text after extructing from .ora file
            //   case 1:                           App_Main(start loading at startup) -> App_Document.startStoreDocumentOraFile -> App_Main(this function)
            //   case 2: App_Event(drop a file) -> App_Main(start loading for a file) -> App_Document.startStoreDocumentOraFile -> App_Main(this function)
        }
        // System settings
        loadSettings() {
            let index = Platform.settings.getItem(this.localStorage_SettingIndexKey);
            let localSetting = Platform.settings.getItem(this.localStorage_SettingKey + index);
            if (localSetting != null) {
                this.localSetting = localSetting;
            }
        }
        saveSettings() {
            let index = Platform.settings.getItem(this.localStorage_SettingIndexKey);
            Platform.settings.setItem(this.localStorage_SettingKey + index, this.localSetting);
        }
        registerLastUsedFile(filePath) {
            let paths = this.localSetting.lastUsedFilePaths;
            for (let index = 0; index < paths.length; index++) {
                if (paths[index] == filePath) {
                    ListRemoveAt(paths, index);
                }
            }
            ListInsertAt(paths, 0, filePath);
            if (paths.length > this.localSetting.maxLastUsedFilePaths) {
                paths = ListGetRange(paths, 0, this.localSetting.maxLastUsedFilePaths);
            }
            this.localSetting.lastUsedFilePaths = paths;
        }
        // Loading document resources
        startLoadingDocumentURL(documentData, url) {
            let fileType = this.getDocumentFileTypeFromName(url);
            if (fileType == ManualTracingTool.DocumentFileType.none) {
                console.log('error: not supported file type.');
                return;
            }
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.timeout = 3000;
            if (fileType == ManualTracingTool.DocumentFileType.json) {
                xhr.responseType = 'json';
            }
            else if (fileType == ManualTracingTool.DocumentFileType.ora) {
                xhr.responseType = 'blob';
            }
            xhr.addEventListener('load', (e) => {
                if (fileType == ManualTracingTool.DocumentFileType.json) {
                    let data;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }
                    this.storeLoadedDocumentJSON(documentData, data, url);
                }
                else if (fileType == ManualTracingTool.DocumentFileType.ora) {
                    this.startLoadDocumentOraFile(documentData, xhr.response, url);
                }
            });
            xhr.addEventListener('timeout', (e) => {
                documentData.hasErrorOnLoading = true;
            });
            xhr.addEventListener('error', (e) => {
                documentData.hasErrorOnLoading = true;
            });
            xhr.send();
        }
        startLoadDocumentOraFile(documentData, file, filePath) {
            var zipfs = new zip.fs.FS();
            zip.workerScriptsPath = this.oraScriptPath;
            zipfs.importBlob(file, () => {
                var entry = zipfs.find(this.oraVectorFileName);
                if (entry) {
                    entry.getText((text) => {
                        this.startReloadDocumentFromText(documentData, text, filePath);
                        this.updateFileNameRelatedUI(filePath);
                    });
                }
                else {
                    console.log('error: failed to read from ora file.');
                }
            });
        }
        storeLoadedDocumentJSON(documentData, loadedData, filePath) {
            documentData.rootLayer = loadedData.rootLayer;
            documentData.documentFrame = loadedData.documentFrame;
            if (loadedData['palletColos']) {
                documentData.palletColors = loadedData['palletColos'];
            }
            else {
                documentData.palletColors = loadedData.palletColors;
            }
            documentData.defaultViewScale = loadedData.defaultViewScale;
            documentData.lineWidthBiasRate = loadedData.lineWidthBiasRate;
            documentData.animationSettingData = loadedData.animationSettingData;
            documentData.loaded = true;
            this.updateFileNameRelatedUI(filePath);
        }
        fixLoadedDocumentData(documentData) {
            let info = new ManualTracingTool.DocumentDataSaveInfo();
            info.modelFile = this.modelFile;
            ManualTracingTool.DocumentLogic.fixLoadedDocumentData_CollectLayers_Recursive(documentData.rootLayer, info);
            ManualTracingTool.DocumentLogic.fixLoadedDocumentData(documentData, info);
        }
        updateFileNameRelatedUI(filePath) {
            this.registerLastUsedFile(filePath);
            this.setHeaderDocumentFileName(filePath);
            this.setExportImageFileNameFromFileName();
        }
        // Document data operations
        getDocumentFileTypeFromName(filePath) {
            let fileType = ManualTracingTool.DocumentFileType.json;
            if (StringLastIndexOf(filePath, '.json') == filePath.length - 5) {
                fileType = ManualTracingTool.DocumentFileType.json;
            }
            else if (StringLastIndexOf(filePath, '.ora') == filePath.length - 4) {
                fileType = ManualTracingTool.DocumentFileType.ora;
            }
            return fileType;
        }
        createDefaultDocumentData() {
            let saveData = Platform.settings.getItem(this.tempFileNameKey);
            if (!StringIsNullOrEmpty(saveData)) {
                let document = JSON.parse(saveData);
                document.loaded = true;
                return document;
            }
            let document = new ManualTracingTool.DocumentData();
            let rootLayer = document.rootLayer;
            rootLayer.type = ManualTracingTool.LayerTypeID.rootLayer;
            {
                let layer1 = new ManualTracingTool.VectorLayer();
                layer1.name = 'layer1';
                rootLayer.childLayers.push(layer1);
                let group1 = new ManualTracingTool.VectorGroup();
                layer1.keyframes[0].geometry.groups.push(group1);
            }
            {
                let layer1 = new ManualTracingTool.PosingLayer();
                layer1.name = 'posing1';
                rootLayer.childLayers.push(layer1);
                layer1.posingModel = this.modelFile.posingModelDictionary['dummy_skin'];
            }
            document.loaded = true;
            return document;
        }
        createPosingModel(modelData) {
            let posingModel = new ManualTracingTool.PosingModel();
            for (let index = 0; index < modelData.bones.length; index++) {
                let bone = modelData.bones[index];
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
            let head = this.findBone(modelData.bones, 'head');
            let headCenter = this.findBone(modelData.bones, 'headCenter');
            let headTop = this.findBone(modelData.bones, 'headTop');
            let headBottom = this.findBone(modelData.bones, 'headBottom');
            let chest = this.findBone(modelData.bones, 'chest');
            let hips = this.findBone(modelData.bones, 'hips');
            let hipsTop = this.findBone(modelData.bones, 'hipsTop');
            let hipL = this.findBone(modelData.bones, 'hip.L');
            let neck1 = this.findBone(modelData.bones, 'neck1');
            let neck2 = this.findBone(modelData.bones, 'neck2');
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
            let arm1L = this.findBone(modelData.bones, 'arm1.L');
            this.translationOf(this.toLocation, arm1L.worldMat);
            vec3.transformMat4(posingModel.leftArm1Location, this.toLocation, this.chestInvMat4);
            let arm1R = this.findBone(modelData.bones, 'arm1.R');
            this.translationOf(this.toLocation, arm1R.worldMat);
            vec3.transformMat4(posingModel.rightArm1Location, this.toLocation, this.chestInvMat4);
            let arm2L = this.findBone(modelData.bones, 'arm2.L');
            posingModel.leftArm1HeadLocation[2] = -arm2L.matrix[13];
            let arm2R = this.findBone(modelData.bones, 'arm2.R');
            posingModel.rightArm1HeadLocation[2] = -arm2R.matrix[13];
            let leg1L = this.findBone(modelData.bones, 'leg1.L');
            this.translationOf(this.toLocation, leg1L.worldMat);
            vec3.transformMat4(posingModel.leftLeg1Location, this.toLocation, this.hipsInvMat4);
            let leg1R = this.findBone(modelData.bones, 'leg1.R');
            this.translationOf(this.toLocation, leg1R.worldMat);
            vec3.transformMat4(posingModel.rightLeg1Location, this.toLocation, this.hipsInvMat4);
            let leg2L = this.findBone(modelData.bones, 'leg2.L');
            posingModel.leftLeg1HeadLocation[2] = -leg2L.matrix[13];
            let leg2R = this.findBone(modelData.bones, 'leg2.R');
            posingModel.rightLeg1HeadLocation[2] = -leg2R.matrix[13];
            return posingModel;
        }
        translationOf(vec, mat) {
            vec3.set(vec, mat[12], mat[13], mat[14]);
        }
        findBone(bones, boneName) {
            for (let bone of bones) {
                if (bone.name == boneName) {
                    return bone;
                }
            }
            return null;
        }
        finishLayerLoading_Recursive(layer) {
            if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                let ifrLayer = layer;
                if (ifrLayer.imageLoading) {
                    ifrLayer.imageLoading = false;
                    ifrLayer.location[0] = -ifrLayer.imageResource.image.width / 2;
                    ifrLayer.location[1] = -ifrLayer.imageResource.image.height / 2;
                }
            }
            for (let childLayer of layer.childLayers) {
                this.finishLayerLoading_Recursive(childLayer);
            }
        }
        createSaveDocumentData(documentData) {
            let info = new ManualTracingTool.DocumentDataSaveInfo();
            ManualTracingTool.DocumentLogic.fixSaveDocumentData_SetID_Recursive(documentData.rootLayer, info);
            ManualTracingTool.DocumentLogic.fixSaveDocumentData_CopyID_Recursive(documentData.rootLayer, info);
            let copy = JSON.parse(JSON.stringify(documentData));
            ManualTracingTool.DocumentLogic.fixSaveDocumentData(copy, info);
            return copy;
        }
        saveDocumentData(filePath, documentData, forceToLocalStrage) {
            let save_DocumentData = this.createSaveDocumentData(documentData);
            this.registerLastUsedFile(filePath);
            if (forceToLocalStrage) {
                Platform.settings.setItem(this.tempFileNameKey, save_DocumentData);
                return;
            }
            let fileType = this.getDocumentFileTypeFromName(filePath);
            if (fileType == ManualTracingTool.DocumentFileType.json) {
                this.saveDocumentJsonFile(filePath, save_DocumentData, documentData.exportBackGroundType);
            }
            else if (fileType == ManualTracingTool.DocumentFileType.ora) {
                this.saveDocumentOraFile(filePath, save_DocumentData, documentData.exportBackGroundType);
            }
        }
        saveDocumentJsonFile(filePath, documentData, backGroundType) {
            Platform.writeFileSync(filePath, JSON.stringify(documentData), 'text', function (error) {
                if (error != null) {
                    this.showMessageBox('error : ' + error);
                }
            });
        }
        saveDocumentOraFile(filePath, documentData, backGroundType) {
            let canvas = this.createExportImage(documentData, 1.0, backGroundType);
            ora.scriptsPath = this.oraScriptPath;
            let oraFile = new ora.Ora(canvas.width, canvas.height);
            let layer = oraFile.addLayer('marged', 0);
            layer.image = canvas;
            let save_DocumentData = this.createSaveDocumentData(documentData);
            oraFile.save(this.oraVectorFileName, JSON.stringify(save_DocumentData), (dataURL) => {
                Platform.writeFileSync(filePath, dataURL, 'base64', (error) => {
                    if (error) {
                        this.showMessageBox(error);
                    }
                });
            });
        }
        createExportImage(documentData, scale, backGroundType) {
            let layout = ManualTracingTool.DocumentData.getDocumentLayout(documentData);
            let imageLeft = Math.floor(layout.left);
            let imageTop = Math.floor(layout.top);
            let imageWidth = Math.floor(layout.width * scale);
            let imageHeight = Math.floor(layout.height * scale);
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
            if (backGroundType == ManualTracingTool.DocumentBackGroundTypeID.lastPalletColor) {
                this.canvasRender.setFillColorV(documentData.palletColors[documentData.palletColors.length - 1].color);
                this.canvasRender.fillRect(0, 0, imageWidth, imageHeight);
            }
            this.drawExportImage(this.exportRenderWindow);
            let canvas = this.exportRenderWindow.releaseCanvas();
            return canvas;
        }
        exportImageFile(fileName, documentData, scale, backGroundType) {
            let canvas = this.createExportImage(documentData, scale, backGroundType);
            if (canvas == null) {
                return;
            }
            let localSetting = this.getLocalSetting();
            let exportPath = localSetting.exportPath;
            let imageType = this.getRadioElementIntValue(this.ID.exportImageFileModal_imageFileType, 1);
            let extText = '.png';
            if (imageType == 2) {
                extText = '.jpg';
            }
            let fileFullPath = exportPath + '/' + fileName + extText;
            let imageTypeText = 'image/png';
            if (imageType == 2) {
                imageTypeText = 'image/jpeg';
            }
            let dataURL = canvas.toDataURL(imageTypeText, 0.9);
            Platform.writeFileSync(fileFullPath, dataURL, 'base64', (error) => {
                if (error) {
                    this.showMessageBox(error);
                }
            });
            // Free canvas memory
            canvas.width = 10;
            canvas.height = 10;
        }
    }
    ManualTracingTool.App_Document = App_Document;
})(ManualTracingTool || (ManualTracingTool = {}));
