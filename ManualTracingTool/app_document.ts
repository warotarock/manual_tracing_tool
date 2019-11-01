
namespace ManualTracingTool {

    export class App_Document extends App_Tool {

        document: DocumentData = null;
        localSetting = new LocalSetting();
        localStorage_SettingKey = 'MTT-Settings';
        localStorage_SettingIndexKey = 'MTT-Settings Index';
        tempFileNameKey = 'Manual tracing tool save data';
        oraScriptPath = './external/ora_js/';
        oraVectorFileName = 'mttf.json';

        // Backward interface implementations

        protected getDocument(): DocumentData { // @override

            return this.document;
        }

        protected getLocalSetting(): LocalSetting { // @override

            return this.localSetting;
        }

        // Backward interface definitions

        protected startReloadDocument() { // @virtual
        }

        protected startReloadDocumentFromURL(url: string) { // @virtual
        }

        protected startReloadDocumentFromText(textData: string) { // @virtual
        }

        protected resetDocument() { // @virtual
        }

        protected saveDocument() { // @virtual
        }

        // System settings

        protected loadSettings() {

            let index = Platform.settings.getItem(this.localStorage_SettingIndexKey);
            let localSetting: LocalSetting = Platform.settings.getItem(this.localStorage_SettingKey + index);

            if (localSetting != null) {

                this.localSetting = localSetting;
            }
        }

        protected saveSettings() {

            let index = Platform.settings.getItem(this.localStorage_SettingIndexKey);

            Platform.settings.setItem(this.localStorage_SettingKey + index, this.localSetting);
        }

        protected registerLastUsedFile(filePath: string) {

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

        protected fixLoadedDocumentData() {

            let info = new DocumentDataSaveInfo();
            info.modelFile = this.modelFile;

            DocumentLogic.fixLoadedDocumentData_CollectLayers_Recursive(this.document.rootLayer, info);
            DocumentLogic.fixLoadedDocumentData(this.document, info);
        }

        protected storeLoadedDocument(documentData: DocumentData, loadedData: DocumentData) {

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
        }

        // Document data operations

        protected getDocumentFileTypeFromName(filePath: string): DocumentFileType {

            let fileType = DocumentFileType.json;
            if (StringLastIndexOf(filePath, '.json') == filePath.length - 5) {

                fileType = DocumentFileType.json;
            }
            else if (StringLastIndexOf(filePath, '.ora') == filePath.length - 4) {

                fileType = DocumentFileType.ora;
            }

            return fileType;
        }

        protected createDefaultDocumentData(): DocumentData {

            let saveData = Platform.settings.getItem(this.tempFileNameKey);

            if (!StringIsNullOrEmpty(saveData)) {

                let document = JSON.parse(saveData);
                document.loaded = true;

                return document;
            }

            let document = new DocumentData();

            let rootLayer = document.rootLayer;
            rootLayer.type = LayerTypeID.rootLayer;

            {
                let layer1 = new VectorLayer();
                layer1.name = 'layer1'
                rootLayer.childLayers.push(layer1);
                let group1 = new VectorGroup();
                layer1.keyframes[0].geometry.groups.push(group1);
            }

            {
                let layer1 = new PosingLayer();
                layer1.name = 'posing1'
                rootLayer.childLayers.push(layer1);
                layer1.posingModel = this.modelFile.posingModelDictionary['dummy_skin'];
            }

            document.loaded = true;

            return document;
        }

        protected createPosingModel(modelData: any): PosingModel {

            let posingModel = new PosingModel();

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

        private translationOf(vec: Vec3, mat: Mat4) {

            vec3.set(vec, mat[12], mat[13], mat[14]);
        }

        private findBone(bones: List<any>, boneName: string) {

            for (let bone of bones) {

                if (bone.name == boneName) {

                    return bone;
                }
            }

            return null;
        }

        protected finishLayerLoading_Recursive(layer: Layer) {

            if (layer.type == LayerTypeID.imageFileReferenceLayer) {

                let ifrLayer = <ImageFileReferenceLayer>layer;

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

        protected createSaveDocumentData(documentData: DocumentData): any {

            let info = new DocumentDataSaveInfo();
            DocumentLogic.fixSaveDocumentData_SetID_Recursive(documentData.rootLayer, info);
            DocumentLogic.fixSaveDocumentData_CopyID_Recursive(documentData.rootLayer, info);

            let copy = JSON.parse(JSON.stringify(documentData));
            DocumentLogic.fixSaveDocumentData(copy, info);

            return copy;
        }

        protected saveDocumentData(filePath: string, documentData: DocumentData, forceToLocalStrage: boolean) {

            let save_DocumentData = this.createSaveDocumentData(documentData);

            this.registerLastUsedFile(filePath);

            if (forceToLocalStrage) {

                Platform.settings.setItem(this.tempFileNameKey, save_DocumentData);

                return;
            }

            let fileType = this.getDocumentFileTypeFromName(filePath);

            if (fileType == DocumentFileType.json) {

                this.saveDocumentJsonFile(filePath, save_DocumentData, DocumentBackGroundTypeID.transparent);
            }
            else if (fileType == DocumentFileType.ora) {

                this.saveDocumentOraFile(filePath, save_DocumentData, DocumentBackGroundTypeID.transparent);
            }
        }

        protected saveDocumentJsonFile(filePath: string, documentData: DocumentData, backGroundType: DocumentBackGroundTypeID) {

            Platform.fs.writeFile(filePath, JSON.stringify(documentData), function (error) {
                if (error != null) {
                    this.showMessageBox('error : ' + error);
                }
            });
        }

        protected saveDocumentOraFile(filePath: string, documentData: DocumentData, backGroundType: DocumentBackGroundTypeID) {

            let canvas = this.createExportImage(documentData, 1.0, backGroundType);

            ora.scriptsPath = this.oraScriptPath;

            let oraFile = new ora.Ora(canvas.width, canvas.height);

            let layer = oraFile.addLayer('marged', 0);
            layer.image = canvas;

            let localSetting = this.getLocalSetting();

            let save_DocumentData = this.createSaveDocumentData(documentData);

            oraFile.save(
                this.oraVectorFileName
                , JSON.stringify(save_DocumentData)
                , (dataURL: string) => {

                    let base64Data = dataURL.substr(dataURL.indexOf(',') + 1);

                    Platform.fs.writeFile(filePath, base64Data, 'base64', (error) => {
                        if (error) {
                            this.showMessageBox(error);
                        }
                    });
                }
            );
        }

        protected createExportImage(documentData: DocumentData, scale: float, backGroundType: DocumentBackGroundTypeID): HTMLCanvasElement {

            let layout = DocumentData.getDocumentLayout(documentData);

            let imageLeft = Math.floor(layout.left);
            let imageTop = Math.floor(layout.top);
            let imageWidth = Math.floor(layout.width * scale);
            let imageHeight = Math.floor(layout.height * scale);

            if (imageWidth <= 0 || imageHeight <= 0) {

                return null;
            }

            //let canvas = this.exportRenderWindow.canvas;
            let canvas = document.createElement('canvas');
            this.exportRenderWindow.context = canvas.getContext('2d');
            canvas.width = imageWidth;
            canvas.height = imageHeight;

            this.exportRenderWindow.canvas = canvas;
            this.exportRenderWindow.width = imageWidth;
            this.exportRenderWindow.height = imageHeight;
            this.exportRenderWindow.viewLocation[0] = imageLeft;
            this.exportRenderWindow.viewLocation[1] = imageTop;
            this.exportRenderWindow.viewScale = scale;
            this.exportRenderWindow.viewRotation = 0.0;
            this.exportRenderWindow.centerLocationRate[0] = 0.0;
            this.exportRenderWindow.centerLocationRate[1] = 0.0;

            this.clearWindow(this.exportRenderWindow);

            if (backGroundType == DocumentBackGroundTypeID.lastPalletColor) {

                this.canvasRender.setFillColorV(documentData.palletColors[documentData.palletColors.length - 1].color);
                this.canvasRender.fillRect(0, 0, imageWidth, imageHeight);
            }

            this.drawExportImage(this.exportRenderWindow);

            return canvas;
        }

        protected exportImageFile(fileName: string, documentData: DocumentData, scale: float, backGroundType: DocumentBackGroundTypeID) {

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
            let base64Data = dataURL.substr(dataURL.indexOf(',') + 1);
            Platform.fs.writeFile(fileFullPath, base64Data, 'base64', (error) => {
                if (error) {
                    this.showMessageBox(error);
                }
            });

            // Free canvas memory
            canvas.width = 10;
            canvas.height = 10;
        }

        protected startLoadDocumentOraFile(filePath: string, file: File) {

            var zipfs = new zip.fs.FS();
            zip.workerScriptsPath = this.oraScriptPath;

            zipfs.importBlob(file, () => {

                var entry = zipfs.find(this.oraVectorFileName);

                if (entry) {

                    entry.getText((text: string) => {

                        this.registerLastUsedFile(filePath);

                        this.setHeaderDocumentFileName(filePath);
                        this.setExportImageFileNameFromFileName();

                        this.startReloadDocumentFromText(text);
                    });
                }
                else {

                    console.log('error: failed to read from ora file.');
                }
            });
        }
        // Layer and animation operations

        updateLayerStructure() { // @implements MainEditor

            let documentData = this.getDocument();

            Layer.updateHierarchicalVisiblityRecursive(documentData.rootLayer);

            this.collectViewContext();

            // Re-set current keyframe and collects informations
            this.setCurrentFrame(documentData.animationSettingData.currentTimeFrame);

            this.layerWindow_CollectItems(documentData);
            this.layerWindow_CaluculateLayout(this.layerWindow);
            //this.subtoolWindow_CollectViewItems();
            //this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            //this.palletSelector_CaluculateLayout();
        }
    }
}
