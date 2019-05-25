
declare var require: any;

namespace ManualTracingTool {

    let fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile(fileName, text) {
            window.localStorage.setItem(fileName, text);
        }
    };

    export class App_Document extends App_Tool {

        document: DocumentData = null;
        localSetting = new LocalSetting();
        localStorage_SettingKey = 'MTT-Settings';
        localStorage_SettingIndexKey = 'MTT-Settings Index';
        tempFileNameKey = 'Manual tracing tool save data';

        protected getDocument(): DocumentData { // @override

            return this.document;
        }

        protected getLocalSetting(): LocalSetting { // @override

            return this.localSetting;
        }

        // System settings

        protected loadSettings() {

            let index = window.localStorage.getItem(this.localStorage_SettingIndexKey);
            let localSettingText = window.localStorage.getItem(this.localStorage_SettingKey + index);

            if (!StringIsNullOrEmpty(localSettingText)) {

                this.localSetting = JSON.parse(localSettingText);
            }
        }

        protected saveSettings() {

            let index = window.localStorage.getItem(this.localStorage_SettingIndexKey);

            window.localStorage.setItem(this.localStorage_SettingKey + index, JSON.stringify(this.localSetting));
        }

        protected regsterLastUsedFile(filePath: string) {

            for (let index = 0; index < this.localSetting.lastUsedFilePaths.length; index++) {

                if (this.localSetting.lastUsedFilePaths[index] == filePath) {

                    ListRemoveAt(this.localSetting.lastUsedFilePaths, index);
                }
            }

            ListInsertAt(this.localSetting.lastUsedFilePaths, 0, filePath);
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

        protected createDefaultDocumentData(): DocumentData {

            let saveData = window.localStorage.getItem(this.tempFileNameKey);

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

        finishLayerLoading_Recursive(layer: Layer) {

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

        saveDocumentData(filePath: string, documentData: DocumentData, forceToLocalStrage: boolean) {

            let info = new DocumentDataSaveInfo();
            DocumentLogic.fixSaveDocumentData_SetID_Recursive(documentData.rootLayer, info);
            DocumentLogic.fixSaveDocumentData_CopyID_Recursive(documentData.rootLayer, info);

            let copy = JSON.parse(JSON.stringify(documentData));
            DocumentLogic.fixSaveDocumentData(copy, info);

            if (forceToLocalStrage) {

                window.localStorage.setItem(this.tempFileNameKey, JSON.stringify(copy));
            }
            else {

                fs.writeFile(filePath, JSON.stringify(copy), function (error) {
                    if (error != null) {
                        this.showMessageBox('error : ' + error);
                    }
                });

                this.regsterLastUsedFile(filePath);
            }
        }

        exportImageFile(fileName: string, documentData: DocumentData, scale: float, backGroundType: DocumentBackGroundTypeID) {

            let frameLeft = Math.floor(documentData.documentFrame[0]);
            let frameTop = Math.floor(documentData.documentFrame[1]);
            let documentWidth = Math.floor(documentData.documentFrame[2]) - frameLeft + 1;
            let documentHeight = Math.floor(documentData.documentFrame[3]) - frameTop + 1;

            let imageLeft = Math.floor(frameLeft);
            let imageTop = Math.floor(frameTop);
            let imageWidth = Math.floor(documentWidth * scale);
            let imageHeight = Math.floor(documentHeight * scale);

            if (imageWidth > 0 && imageHeight > 0) {

                let canvas = this.exportRenderWindow.canvas;
                canvas.width = imageWidth;
                canvas.height = imageHeight;

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
                var dataUrl = canvas.toDataURL(imageTypeText, 0.9);
                var data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
                var buf = new Buffer(data, 'base64');

                fs.writeFile(fileFullPath, buf, (error) => {
                    if (error) {
                        this.showMessageBox(error);
                    }
                });

                // Free canvas memory
                canvas.width = 10;
                canvas.height = 10;
            }
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
