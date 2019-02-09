var fs = (typeof (require) != 'undefined') ? require('fs') : {
    writeFile: function (fileName, text) {
        window.localStorage.setItem(fileName, text);
    }
};
var ManualTracingTool;
(function (ManualTracingTool) {
    var MainProcessStateID;
    (function (MainProcessStateID) {
        MainProcessStateID[MainProcessStateID["none"] = 0] = "none";
        MainProcessStateID[MainProcessStateID["pause"] = 1] = "pause";
        MainProcessStateID[MainProcessStateID["systemResourceLoading"] = 2] = "systemResourceLoading";
        MainProcessStateID[MainProcessStateID["initialDocumentJSONLoading"] = 3] = "initialDocumentJSONLoading";
        MainProcessStateID[MainProcessStateID["initialDocumentResourceLoading"] = 4] = "initialDocumentResourceLoading";
        MainProcessStateID[MainProcessStateID["running"] = 5] = "running";
        MainProcessStateID[MainProcessStateID["documentResourceLoading"] = 6] = "documentResourceLoading";
        MainProcessStateID[MainProcessStateID["documentJSONLoading"] = 7] = "documentJSONLoading";
    })(MainProcessStateID = ManualTracingTool.MainProcessStateID || (ManualTracingTool.MainProcessStateID = {}));
    var Main_Core = /** @class */ (function () {
        function Main_Core() {
            // Main process management
            this.mainProcessState = MainProcessStateID.none;
            this.isEventSetDone = false;
            this.isDeferredWindowResizeWaiting = false;
            this.lastTime = 0;
            this.elapsedTime = 0;
            // UI elements
            this.mainWindow = new ManualTracingTool.MainWindow();
            this.editorWindow = new ManualTracingTool.CanvasWindow();
            this.webglWindow = new ManualTracingTool.CanvasWindow();
            this.pickingWindow = new ManualTracingTool.PickingWindow();
            this.layerWindow = new ManualTracingTool.LayerWindow();
            this.subtoolWindow = new ManualTracingTool.SubtoolWindow();
            this.timeLineWindow = new ManualTracingTool.TimeLineWindow();
            this.palletSelectorWindow = new ManualTracingTool.PalletSelectorWindow();
            this.colorMixerWindow_colorCanvas = new ManualTracingTool.ColorCanvasWindow();
            this.palletColorModal_colorCanvas = new ManualTracingTool.ColorCanvasWindow();
            this.renderingWindow = new ManualTracingTool.CanvasWindow();
            this.activeCanvasWindow = null;
            this.canvasRender = new ManualTracingTool.CanvasRender();
            this.webGLRender = new WebGLRender();
            this.ID = new ManualTracingTool.HTMLElementID();
            this.layerTypeNameDictionary = [
                'none',
                'root',
                'ベクター レイヤー',
                'グループ レイヤー',
                '画像ファイル レイヤー',
                '３Dポーズ レイヤー',
                'ベクター参照 レイヤー'
            ];
            // Resources
            this.systemImage = null;
            this.subToolImages = new List();
            this.layerButtonImage = null;
            // Integrated tool system
            this.toolContext = null;
            this.toolEnv = null;
            this.toolDrawEnv = null;
            this.mainTools = new List();
            this.currentTool = null;
            this.currentKeyframe = null;
            this.previousKeyframe = null;
            this.nextKeyframe = null;
            //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);
            // Modal tools
            this.currentModalTool = null;
            this.modalBeforeTool = null;
            this.vectorLayer_ModalTools = List(ManualTracingTool.ModalToolID.countOfID);
            this.imageFileReferenceLayer_ModalTools = List(ManualTracingTool.ModalToolID.countOfID);
            // Document setting tools
            this.tool_EditDocumentFrame = new ManualTracingTool.Tool_EditDocumentFrame();
            // Selection tools
            this.selectionTools = List(ManualTracingTool.OperationUnitID.countOfID);
            this.tool_LinePointBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_LinePoint();
            this.tool_LineSegmentBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_LineSegment();
            this.tool_LineBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_Line();
            this.tool_SelectAllPoints = new ManualTracingTool.Tool_Select_All_LinePoint();
            // File reference layer tools
            this.tool_EditImageFileReference = new ManualTracingTool.Tool_EditImageFileReference();
            this.tool_Transform_ReferenceImage_GrabMove = new ManualTracingTool.Tool_Transform_ReferenceImage_GrabMove();
            this.tool_Transform_ReferenceImage_Rotate = new ManualTracingTool.Tool_Transform_ReferenceImage_Rotate();
            this.tool_Transform_ReferenceImage_Scale = new ManualTracingTool.Tool_Transform_ReferenceImage_Scale();
            // Transform tools
            this.tool_Transform_Lattice_GrabMove = new ManualTracingTool.Tool_Transform_Lattice_GrabMove();
            this.tool_Transform_Lattice_Rotate = new ManualTracingTool.Tool_Transform_Lattice_Rotate();
            this.tool_Transform_Lattice_Scale = new ManualTracingTool.Tool_Transform_Lattice_Scale();
            this.tool_EditModeMain = new ManualTracingTool.Tool_EditModeMain();
            // Drawing tools
            this.tool_DrawLine = new ManualTracingTool.Tool_DrawLine();
            this.tool_AddPoint = new ManualTracingTool.Tool_AddPoint();
            this.tool_ScratchLine = new ManualTracingTool.Tool_ScratchLine();
            this.tool_ExtrudeLine = new ManualTracingTool.Tool_ExtrudeLine();
            this.tool_OverWriteLineWidth = new ManualTracingTool.Tool_OverWriteLineWidth();
            this.tool_ScratchLineWidth = new ManualTracingTool.Tool_ScratchLineWidth();
            this.tool_ResampleSegment = new ManualTracingTool.Tool_Resample_Segment();
            //tool_DeletePoints_BrushSelect = new Tool_DeletePoints_BrushSelect();
            this.tool_DeletePoints_BrushSelect = new ManualTracingTool.Tool_DeletePoints_DivideLine();
            this.tool_EditLinePointWidth_BrushSelect = new ManualTracingTool.Tool_HideLinePoint_BrushSelect();
            this.hittest_Line_IsCloseTo = new ManualTracingTool.HitTest_Line_IsCloseToMouse();
            // Posing tools
            this.posing3dView = new ManualTracingTool.Posing3DView();
            this.posing3DLogic = new ManualTracingTool.Posing3DLogic();
            this.tool_Posing3d_LocateHead = new ManualTracingTool.Tool_Posing3d_LocateHead();
            this.tool_Posing3d_RotateHead = new ManualTracingTool.Tool_Posing3d_RotateHead();
            this.tool_Posing3d_LocateBody = new ManualTracingTool.Tool_Posing3d_LocateBody();
            this.tool_Posing3d_LocateHips = new ManualTracingTool.Tool_Posing3d_LocateHips();
            this.tool_Posing3d_LocateLeftShoulder = new ManualTracingTool.Tool_Posing3d_LocateLeftShoulder();
            this.tool_Posing3d_LocateRightShoulder = new ManualTracingTool.Tool_Posing3d_LocateRightShoulder();
            this.tool_Posing3d_LocateLeftArm1 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm1();
            this.tool_Posing3d_LocateLeftArm2 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm2();
            this.tool_Posing3d_LocateRightArm1 = new ManualTracingTool.Tool_Posing3d_LocateRightArm1();
            this.tool_Posing3d_LocateRightArm2 = new ManualTracingTool.Tool_Posing3d_LocateRightArm2();
            this.tool_Posing3d_LocateLeftLeg1 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg1();
            this.tool_Posing3d_LocateLeftLeg2 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg2();
            this.tool_Posing3d_LocateRightLeg1 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg1();
            this.tool_Posing3d_LocateRightLeg2 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg2();
            this.imageResurces = new List();
            this.modelFile = new ManualTracingTool.ModelFile();
            this.modelResources = new List();
            // Document data
            this.document = null;
            this.localSetting = new ManualTracingTool.LocalSetting();
            this.localStorage_SettingKey = 'MTT-Settings';
            this.localStorage_SettingIndexKey = 'MTT-Settings Index';
            this.tempFileNameKey = 'Manual tracing tool save data';
            this.loadingDocumentImageResources = null;
            // UI states
            this.selectCurrentLayerAnimationLayer = null;
            this.selectCurrentLayerAnimationTime = 0.0;
            this.selectCurrentLayerAnimationTimeMax = 0.4;
            this.isViewLocationMoved = false;
            this.homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.lastViewScale = 1.0;
            this.lastViewRotation = 0.0;
            // Setting values
            this.drawStyle = new ManualTracingTool.ToolDrawingStyle();
            // Work variable
            this.view2DMatrix = mat4.create();
            this.invView2DMatrix = mat4.create();
            this.tempVec3 = vec3.create();
            this.tempVec4 = vec4.create();
            this.tempColor4 = vec4.create();
            this.tempMat4 = mat4.create();
            this.fromLocation = vec3.create();
            this.toLocation = vec3.create();
            this.upVector = vec3.create();
            this.chestInvMat4 = mat4.create();
            this.hipsInvMat4 = mat4.create();
            this.editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
            this.tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.layerPickingPositions = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]];
            this.viewLayerContext = new ManualTracingTool.ViewLayerContext();
            this.fileNameCount = 1;
            this.modelFile.file('models.json');
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('texture01.png').tex(true));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('system_image01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image02.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image03.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('layerbar_image01.png'));
            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.subToolImages.push(this.imageResurces[3]);
            this.subToolImages.push(this.imageResurces[4]);
            this.layerButtonImage = this.imageResurces[5];
        }
        Main_Core.prototype.showMessageBox = function (text) {
            alert(text);
        };
        Main_Core.prototype.onLoad = function () {
            this.loadSettings();
            this.initializeViewDevices();
            this.startLoadingSystemResources();
            this.mainProcessState = MainProcessStateID.systemResourceLoading;
        };
        Main_Core.prototype.initializeViewDevices = function () {
        };
        // Loading
        Main_Core.prototype.startLoadingSystemResources = function () {
            // Start loading
            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
        };
        Main_Core.prototype.processLoadingSystemResources = function () {
            if (!this.modelFile.loaded) {
                return;
            }
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            // Start loading document data
            if (this.localSetting.lastUsedFilePaths.length == 0
                && StringIsNullOrEmpty(this.localSetting.lastUsedFilePaths[0])) {
                this.document = this.createDefaultDocumentData();
            }
            else {
                var lastURL = this.localSetting.lastUsedFilePaths[0];
                this.document = new ManualTracingTool.DocumentData();
                this.startLoadingDocument(this.document, lastURL);
                this.updateHeaderDocumentFileName();
            }
            this.mainProcessState = MainProcessStateID.initialDocumentJSONLoading;
        };
        Main_Core.prototype.startLoadingDocument = function (documentData, url) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.timeout = 3000;
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                _this.storeLoadedDocument(documentData, data);
            });
            xhr.addEventListener('timeout', function (e) {
                documentData.hasErrorOnLoading = true;
            });
            xhr.addEventListener('error', function (e) {
                documentData.hasErrorOnLoading = true;
            });
            xhr.send();
        };
        Main_Core.prototype.storeLoadedDocument = function (documentData, loadedData) {
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
        };
        Main_Core.prototype.startReloadDocument = function () {
            this.document = new ManualTracingTool.DocumentData();
            this.initializeContext();
            var fileName = this.getInputElementText(this.ID.fileName);
            this.startLoadingDocument(this.document, fileName);
            this.mainProcessState = MainProcessStateID.initialDocumentJSONLoading;
            this.toolEnv.setRedrawAllWindows();
        };
        Main_Core.prototype.startReloadDocumentFromText = function (textData) {
            this.document = new ManualTracingTool.DocumentData();
            this.initializeContext();
            var data = JSON.parse(textData);
            this.storeLoadedDocument(this.document, data);
            this.mainProcessState = MainProcessStateID.initialDocumentJSONLoading;
            this.toolEnv.setRedrawAllWindows();
        };
        Main_Core.prototype.processLoadingDocumentJSON = function () {
            if (this.document.hasErrorOnLoading) {
                //this.showMessageBox('ドキュメントの読み込みに失敗しました。デフォルトのドキュメントを開きます。');
                this.document = this.createDefaultDocumentData();
                this.setHeaderDefaultDocumentFileName();
                this.mainProcessState = MainProcessStateID.running;
            }
            if (!this.document.loaded) {
                return;
            }
            var info = new ManualTracingTool.DocumentDataSaveInfo();
            this.fixLoadedDocumentData_CollectLayers_Recursive(this.document.rootLayer, info);
            this.fixLoadedDocumentData(this.document, info);
            this.startLoadingDocumentResources(this.document);
            this.mainProcessState = MainProcessStateID.initialDocumentResourceLoading;
        };
        Main_Core.prototype.startLoadingDocumentResourcesProcess = function (document) {
            this.startLoadingDocumentResources(document);
            this.mainProcessState = MainProcessStateID.documentResourceLoading;
        };
        Main_Core.prototype.startLoadingDocumentResources = function (document) {
            this.loadingDocumentImageResources = new List();
            for (var _i = 0, _a = document.rootLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        };
        Main_Core.prototype.startLoadingDocumentResourcesRecursive = function (layer, loadingDocumentImageResources) {
            if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                // Create an image resource
                var ifrLayer = layer;
                if (ifrLayer.imageResource == null) {
                    ifrLayer.imageResource = new ManualTracingTool.ImageResource();
                }
                // Load an image file
                var imageResource = ifrLayer.imageResource;
                if (!imageResource.loaded && !StringIsNullOrEmpty(ifrLayer.imageFilePath)) {
                    var refFileBasePath = this.localSetting.referenceDirectoryPath;
                    if (!StringIsNullOrEmpty(refFileBasePath)) {
                        imageResource.fileName = refFileBasePath + '/' + ifrLayer.imageFilePath;
                    }
                    else {
                        imageResource.fileName = ifrLayer.imageFilePath;
                    }
                    this.loadTexture(imageResource, imageResource.fileName);
                    loadingDocumentImageResources.push(imageResource);
                }
            }
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var chldLayer = _a[_i];
                this.startLoadingDocumentResourcesRecursive(chldLayer, loadingDocumentImageResources);
            }
        };
        Main_Core.prototype.processLoadingDocumentResources = function () {
            for (var _i = 0, _a = this.loadingDocumentImageResources; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            if (this.mainProcessState == MainProcessStateID.initialDocumentResourceLoading) {
                this.start();
            }
            else {
                this.mainProcessState = MainProcessStateID.running;
                this.toolEnv.setRedrawAllWindows();
            }
        };
        Main_Core.prototype.isWhileLoading = function () {
            return (this.mainProcessState == MainProcessStateID.systemResourceLoading
                || this.mainProcessState == MainProcessStateID.documentResourceLoading);
        };
        Main_Core.prototype.loadTexture = function (imageResource, url) {
            var _this = this;
            var image = new Image();
            imageResource.image.imageData = image;
            image.addEventListener('load', function () {
                if (imageResource.isGLTexture) {
                    _this.webGLRender.initializeImageTexture(imageResource.image);
                }
                imageResource.loaded = true;
                imageResource.image.width = image.width;
                imageResource.image.height = image.height;
            });
            image.src = url;
        };
        Main_Core.prototype.loadModels = function (modelFile, url) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                for (var _i = 0, _a = data.static_models; _i < _a.length; _i++) {
                    var modelData = _a[_i];
                    var modelResource = new ManualTracingTool.ModelResource();
                    modelResource.modelName = modelData.name;
                    _this.webGLRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float
                    modelFile.modelResources.push(modelResource);
                    modelFile.modelResourceDictionary[modelData.name] = modelResource;
                }
                for (var _b = 0, _c = data.skin_models; _b < _c.length; _b++) {
                    var modelData = _c[_b];
                    modelFile.posingModelDictionary[modelData.name] = _this.createPosingModel(modelData);
                }
                modelFile.loaded = true;
            });
            xhr.send();
        };
        Main_Core.prototype.createPosingModel = function (modelData) {
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
        Main_Core.prototype.translationOf = function (vec, mat) {
            vec3.set(vec, mat[12], mat[13], mat[14]);
        };
        Main_Core.prototype.findBone = function (bones, boneName) {
            for (var _i = 0, bones_1 = bones; _i < bones_1.length; _i++) {
                var bone = bones_1[_i];
                if (bone.name == boneName) {
                    return bone;
                }
            }
            return null;
        };
        // Saving 
        Main_Core.prototype.saveDocument = function () {
            var filePath = this.getInputElementText(this.ID.fileName);
            if (StringIsNullOrEmpty(filePath)) {
                this.showMessageBox('ファイル名が指定されていません。');
                return;
            }
            var info = new ManualTracingTool.DocumentDataSaveInfo();
            this.fixSaveDocumentData_SetID_Recursive(this.document.rootLayer, info);
            this.fixSaveDocumentData_CopyID_Recursive(this.document.rootLayer, info);
            var copy = JSON.parse(JSON.stringify(this.document));
            this.fixSaveDocumentData(copy, info);
            var forceToLocalStrage = false;
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
            this.saveSettings();
            this.showMessageBox('保存しました。');
        };
        Main_Core.prototype.regsterLastUsedFile = function (filePath) {
            for (var index = 0; index < this.localSetting.lastUsedFilePaths.length; index++) {
                if (this.localSetting.lastUsedFilePaths[index] == filePath) {
                    ListRemoveAt(this.localSetting.lastUsedFilePaths, index);
                }
            }
            ListInsertAt(this.localSetting.lastUsedFilePaths, 0, filePath);
        };
        // Settings
        Main_Core.prototype.loadSettings = function () {
            var index = window.localStorage.getItem(this.localStorage_SettingIndexKey);
            var localSettingText = window.localStorage.getItem(this.localStorage_SettingKey + index);
            if (!StringIsNullOrEmpty(localSettingText)) {
                this.localSetting = JSON.parse(localSettingText);
            }
        };
        Main_Core.prototype.saveSettings = function () {
            var index = window.localStorage.getItem(this.localStorage_SettingIndexKey);
            window.localStorage.setItem(this.localStorage_SettingKey + index, JSON.stringify(this.localSetting));
        };
        // Starting ups
        Main_Core.prototype.start = function () {
            this.initializeContext();
            this.initializeTools();
            this.initializeViewState();
            this.initializeModals();
            this.mainProcessState = MainProcessStateID.running;
            this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);
            this.setCurrentOperationUnitID(this.toolContext.operationUnitID);
            this.setCurrentFrame(0);
            this.setCurrentLayer(this.document.rootLayer.childLayers[0]);
            //this.collectViewContext_CollectEditTargets();
            this.toolEnv.updateContext();
            // 初回描画
            this.resizeWindows(); // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。
            this.updateHeaderButtons();
            this.updateFooterMessage();
            this.toolEnv.setRedrawAllWindows();
            this.setEvents();
        };
        Main_Core.prototype.createDefaultDocumentData = function () {
            var saveData = window.localStorage.getItem(this.tempFileNameKey);
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
            {
                var layer1 = new ManualTracingTool.PosingLayer();
                layer1.name = 'posing1';
                rootLayer.childLayers.push(layer1);
                layer1.posingModel = this.modelFile.posingModelDictionary['dummy_skin'];
            }
            document.loaded = true;
            return document;
        };
        Main_Core.prototype.getDefaultDocumentFileName = function () {
            var date = new Date();
            var fileName = (''
                + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
                + '_' + ('0' + this.fileNameCount).slice(-2));
            this.fileNameCount++;
            return this.localSetting.currentDirectoryPath + '\\' + fileName + '.json';
        };
        Main_Core.prototype.fixLoadedDocumentData = function (document, info) {
            if (document.palletColors == undefined) {
                ManualTracingTool.DocumentData.initializeDefaultPalletColors(document);
            }
            while (document.palletColors.length < ManualTracingTool.DocumentData.maxPalletColors) {
                document.palletColors.push(new ManualTracingTool.PalletColor());
            }
            if (document.animationSettingData == undefined) {
                document.animationSettingData = new ManualTracingTool.AnimationSettingData();
            }
            if (document.defaultViewScale == undefined) {
                document.defaultViewScale = 1.0;
            }
            if (document.lineWidthBiasRate == undefined) {
                document.lineWidthBiasRate = 1.0;
            }
            this.fixLoadedDocumentData_FixLayer_Recursive(document.rootLayer, info);
        };
        Main_Core.prototype.fixLoadedDocumentData_CollectLayers_Recursive = function (layer, info) {
            info.collectLayer(layer);
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.fixLoadedDocumentData_CollectLayers_Recursive(childLayer, info);
            }
        };
        Main_Core.prototype.fixLoadedDocumentData_FixLayer_Recursive = function (layer, info) {
            if (layer.isRenderTarget == undefined) {
                layer.isRenderTarget = true;
            }
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
                if (vectorLayer.line_PalletColorIndex == undefined) {
                    vectorLayer.line_PalletColorIndex = 0;
                }
                if (vectorLayer.fill_PalletColorIndex == undefined) {
                    vectorLayer.fill_PalletColorIndex = 1;
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
                        for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                            var line = _e[_d];
                            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                            line.isEditTarget = false;
                            line.isCloseToMouse = false;
                            if (line['strokeWidth'] != undefined) {
                                delete line['strokeWidth'];
                            }
                            for (var _f = 0, _g = line.points; _f < _g.length; _f++) {
                                var point = _g[_f];
                                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
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
                if (posingLayer.posingData.rootMatrix == undefined) {
                    posingLayer.posingData = new ManualTracingTool.PosingData();
                }
                posingLayer.posingModel = this.modelFile.posingModelDictionary['dummy_skin'];
            }
            for (var _h = 0, _j = layer.childLayers; _h < _j.length; _h++) {
                var childLayer = _j[_h];
                this.fixLoadedDocumentData_FixLayer_Recursive(childLayer, info);
            }
        };
        Main_Core.prototype.fixSaveDocumentData = function (document, info) {
            this.fixSaveDocumentData_FixLayer_Recursive(document.rootLayer, info);
        };
        Main_Core.prototype.fixSaveDocumentData_SetID_Recursive = function (layer, info) {
            info.addLayer(layer);
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.fixSaveDocumentData_SetID_Recursive(childLayer, info);
            }
        };
        Main_Core.prototype.fixSaveDocumentData_CopyID_Recursive = function (layer, info) {
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayerReferenceLayer) {
                var vRefLayer = layer;
                vRefLayer.referenceLayerID = vRefLayer.referenceLayer.ID;
            }
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var childLayer = _a[_i];
                this.fixSaveDocumentData_CopyID_Recursive(childLayer, info);
            }
        };
        Main_Core.prototype.fixSaveDocumentData_FixLayer_Recursive = function (layer, info) {
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                for (var _i = 0, _a = vectorLayer.keyframes; _i < _a.length; _i++) {
                    var keyframe = _a[_i];
                    for (var _b = 0, _c = keyframe.geometry.groups; _b < _c.length; _b++) {
                        var group = _c[_b];
                        for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                            var line = _e[_d];
                            delete line.modifyFlag;
                            delete line.isCloseToMouse;
                            delete line.isEditTarget;
                            for (var _f = 0, _g = line.points; _f < _g.length; _f++) {
                                var point = _g[_f];
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
                delete ifrLayer.imageResource;
                delete ifrLayer.adjustingLocation;
                delete ifrLayer.adjustingRotation;
                delete ifrLayer.adjustingScale;
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = layer;
                // TODO: 他のデータも削除する
                delete posingLayer.posingData.bodyLocationInputData.parentMatrix;
                delete posingLayer.posingData.bodyLocationInputData.hitTestSphereRadius;
            }
            for (var _h = 0, _j = layer.childLayers; _h < _j.length; _h++) {
                var childLayer = _j[_h];
                this.fixSaveDocumentData_FixLayer_Recursive(childLayer, info);
            }
        };
        Main_Core.prototype.initializeContext = function () {
            this.toolContext = new ManualTracingTool.ToolContext();
            this.toolContext.mainEditor = this;
            this.toolContext.drawStyle = this.drawStyle;
            this.toolContext.commandHistory = new ManualTracingTool.CommandHistory();
            this.toolContext.document = this.document;
            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.pickingWindow = this.pickingWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;
            this.toolEnv = new ManualTracingTool.ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ManualTracingTool.ToolDrawingEnvironment();
            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);
        };
        Main_Core.prototype.initializeViewState = function () {
        };
        Main_Core.prototype.initializeModals = function () {
        };
        Main_Core.prototype.initializeTools = function () {
            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);
            // Constructs main tools and sub tools structure
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.none));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.drawLine)
                .subTool(this.tool_DrawLine, this.subToolImages[1], 0)
                .subTool(this.tool_DeletePoints_BrushSelect, this.subToolImages[1], 5)
                .subTool(this.tool_ScratchLine, this.subToolImages[1], 1)
                .subTool(this.tool_ExtrudeLine, this.subToolImages[1], 2)
                .subTool(this.tool_OverWriteLineWidth, this.subToolImages[1], 3)
                .subTool(this.tool_ScratchLineWidth, this.subToolImages[1], 3)
                .subTool(this.tool_EditLinePointWidth_BrushSelect, this.subToolImages[1], 6));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.posing)
                .subTool(this.tool_Posing3d_LocateHead, this.subToolImages[2], 0)
                .subTool(this.tool_Posing3d_RotateHead, this.subToolImages[2], 1)
                .subTool(this.tool_Posing3d_LocateBody, this.subToolImages[2], 2)
                .subTool(this.tool_Posing3d_LocateHips, this.subToolImages[2], 3)
                .subTool(this.tool_Posing3d_LocateLeftShoulder, this.subToolImages[2], 6)
                .subTool(this.tool_Posing3d_LocateLeftArm1, this.subToolImages[2], 6)
                .subTool(this.tool_Posing3d_LocateLeftArm2, this.subToolImages[2], 7)
                .subTool(this.tool_Posing3d_LocateRightShoulder, this.subToolImages[2], 4)
                .subTool(this.tool_Posing3d_LocateRightArm1, this.subToolImages[2], 4)
                .subTool(this.tool_Posing3d_LocateRightArm2, this.subToolImages[2], 5)
                .subTool(this.tool_Posing3d_LocateLeftLeg1, this.subToolImages[2], 8)
                .subTool(this.tool_Posing3d_LocateLeftLeg2, this.subToolImages[2], 9)
                .subTool(this.tool_Posing3d_LocateRightLeg1, this.subToolImages[2], 10)
                .subTool(this.tool_Posing3d_LocateRightLeg2, this.subToolImages[2], 11));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.imageReferenceLayer)
                .subTool(this.tool_EditImageFileReference, this.subToolImages[0], 1));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.misc)
                .subTool(this.tool_EditDocumentFrame, this.subToolImages[0], 2));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.edit)
                .subTool(this.tool_LineBrushSelect, this.subToolImages[2], 0)
                .subTool(this.tool_LineSegmentBrushSelect, this.subToolImages[2], 0)
                .subTool(this.tool_LinePointBrushSelect, this.subToolImages[2], 0)
                .subTool(this.tool_EditModeMain, this.subToolImages[2], 0)
                .subTool(this.tool_ResampleSegment, this.subToolImages[1], 4));
            // Modal tools
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.none] = null;
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.grabMove] = this.tool_Transform_Lattice_GrabMove;
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.ratate] = this.tool_Transform_Lattice_Rotate;
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.scale] = this.tool_Transform_Lattice_Scale;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.none] = null;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.grabMove] = this.tool_Transform_ReferenceImage_GrabMove;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.ratate] = this.tool_Transform_ReferenceImage_Rotate;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.scale] = this.tool_Transform_ReferenceImage_Scale;
            // Selection tools
            this.selectionTools[ManualTracingTool.OperationUnitID.none] = null;
            this.selectionTools[ManualTracingTool.OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[ManualTracingTool.OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[ManualTracingTool.OperationUnitID.line] = this.tool_LineBrushSelect;
            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;
            // TODO: ツールを作るたびに忘れるのでなんとかしる
            this.tool_DrawLine.resamplingUnitLength = this.toolContext.resamplingUnitLength;
            this.tool_ScratchLine.resamplingUnitLength = this.toolContext.resamplingUnitLength;
            this.tool_ExtrudeLine.resamplingUnitLength = this.toolContext.resamplingUnitLength;
            this.tool_OverWriteLineWidth.resamplingUnitLength = this.toolContext.resamplingUnitLength;
            this.tool_ResampleSegment.resamplingUnitLength = this.toolContext.resamplingUnitLength;
        };
        Main_Core.prototype.isEventDisabled = function () {
            if (this.isWhileLoading()) {
                return true;
            }
            if (this.isModalShown()) {
                return true;
            }
            return false;
        };
        // Continuous processes
        Main_Core.prototype.run = function () {
            var context = this.toolContext;
            var env = this.toolEnv;
            if (this.isDeferredWindowResizeWaiting) {
                this.isDeferredWindowResizeWaiting = false;
                this.resizeWindows();
                this.toolEnv.setRedrawAllWindows();
            }
            // Process animation time
            var currentTime = (new Date().getTime());
            if (this.lastTime == 0) {
                this.elapsedTime = 100;
            }
            else {
                this.elapsedTime = currentTime - this.lastTime;
            }
            this.lastTime = currentTime;
            this.selectCurrentLayerAnimationTime -= this.elapsedTime / 1000.0;
            if (this.selectCurrentLayerAnimationTime < 0) {
                this.selectCurrentLayerAnimationTime = 0;
            }
            // Process animation
            if (context.animationPlaying) {
                var aniSetting = context.document.animationSettingData;
                aniSetting.currentTimeFrame += 1;
                if (aniSetting.currentTimeFrame >= aniSetting.loopEndFrame) {
                    aniSetting.currentTimeFrame = aniSetting.loopStartFrame;
                }
                this.setCurrentFrame(aniSetting.currentTimeFrame);
                env.setRedrawMainWindow();
                env.setRedrawTimeLineWindow();
            }
        };
        // Events
        Main_Core.prototype.setEvents = function () {
        };
        // Core data system for layer and animation
        Main_Core.prototype.updateLayerStructure = function () {
            this.collectViewContext();
            this.layerWindow_CollectItems();
            this.layerWindow_CaluculateLayout(this.layerWindow);
            this.subtoolWindow_CollectViewItems();
            this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            this.palletSelector_CaluculateLayout();
        };
        Main_Core.prototype.collectViewContext = function () {
            var context = this.toolContext;
            var aniSetting = context.document.animationSettingData;
            // Collects layers
            var layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, this.toolContext.document.rootLayer);
            // Creates all view-keyframes.
            var viewKeyFrames = new List();
            this.collectViewContext_CollectKeyframes(viewKeyFrames, layers);
            var sortedViewKeyFrames = viewKeyFrames.sort(function (a, b) { return a.frame - b.frame; });
            this.viewLayerContext.keyframes = sortedViewKeyFrames;
            // Collects layers for each view-keyframes
            this.collectViewContext_CollectKeyframeLayers(sortedViewKeyFrames, layers);
            // Re-set current keyframe and collects informations
            this.setCurrentFrame(context.document.animationSettingData.currentTimeFrame);
            // Prepare lattice points
            //this.calculateLatticePoints();
        };
        Main_Core.prototype.collectViewContext_CollectLayersRecursive = function (result, parentLayer) {
            for (var _i = 0, _a = parentLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                result.push(layer);
                if (layer.childLayers.length > 0) {
                    this.collectViewContext_CollectLayersRecursive(result, layer);
                }
            }
        };
        Main_Core.prototype.collectViewContext_CollectKeyframes = function (result, layers) {
            var keyframeDictionary = new Dictionary();
            for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
                var layer = layers_1[_i];
                if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    var vectorLayer = (layer);
                    for (var _a = 0, _b = vectorLayer.keyframes; _a < _b.length; _a++) {
                        var keyframe = _b[_a];
                        var frameText = keyframe.frame.toString();
                        if (!DictionaryContainsKey(keyframeDictionary, frameText)) {
                            var viewKeyframe = new ManualTracingTool.ViewKeyframe();
                            viewKeyframe.frame = keyframe.frame;
                            result.push(viewKeyframe);
                            keyframeDictionary[frameText] = true;
                        }
                    }
                }
            }
        };
        Main_Core.prototype.collectViewContext_CollectKeyframeLayers = function (result, layers) {
            // All view-keyframes contains view-layer info for all layer.
            for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                var viewKeyframe = result_1[_i];
                for (var _a = 0, layers_2 = layers; _a < layers_2.length; _a++) {
                    var layer = layers_2[_a];
                    var keyframeLayer = new ManualTracingTool.ViewKeyframeLayer();
                    keyframeLayer.layer = layer;
                    if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                        var vectorLayer = layer;
                        var max_KeyFrame = null;
                        for (var _b = 0, _c = vectorLayer.keyframes; _b < _c.length; _b++) {
                            var keyframe = _c[_b];
                            if (keyframe.frame > viewKeyframe.frame) {
                                break;
                            }
                            max_KeyFrame = keyframe;
                        }
                        if (max_KeyFrame == null) {
                            throw ('The document contains a layer that has no keyframe!');
                        }
                        keyframeLayer.vectorLayerKeyframe = max_KeyFrame;
                    }
                    viewKeyframe.layers.push(keyframeLayer);
                }
            }
        };
        Main_Core.prototype.findViewKeyFrameIndex = function (currentFrame) {
            var max_ViewKeyFrameIndex = 0;
            for (var index = 0; index < this.viewLayerContext.keyframes.length; index++) {
                if (this.viewLayerContext.keyframes[index].frame > currentFrame) {
                    break;
                }
                max_ViewKeyFrameIndex = index;
            }
            return max_ViewKeyFrameIndex;
        };
        Main_Core.prototype.findViewKeyFrame = function (currentFrame) {
            var keyFrameIndex = this.findViewKeyFrameIndex(currentFrame);
            if (keyFrameIndex != -1) {
                return this.viewLayerContext.keyframes[keyFrameIndex];
            }
            else {
                return null;
            }
        };
        Main_Core.prototype.findViewKeyframeLayerIndex = function (viewKeyFrame, layer) {
            for (var index = 0; index < viewKeyFrame.layers.length; index++) {
                if (viewKeyFrame.layers[index].layer == layer) {
                    return index;
                }
            }
            return -1;
        };
        Main_Core.prototype.findViewKeyframeLayer = function (viewKeyFrame, layer) {
            var index = this.findViewKeyframeLayerIndex(viewKeyFrame, layer);
            if (index != -1) {
                return viewKeyFrame.layers[index];
            }
            else {
                return null;
            }
        };
        // Tools and context operations
        Main_Core.prototype.setCurrentEditMode = function (editModeID) {
            var env = this.toolEnv;
            var context = this.toolContext;
            context.editMode = editModeID;
            if (env.isDrawMode()) {
                this.setCurrentMainTool(context.drawMode_MainToolID);
            }
            else {
                this.setCurrentMainTool(context.editMode_MainToolID);
            }
            this.updateFooterMessage();
            env.setRedrawHeaderWindow();
            env.setRedrawMainWindowEditorWindow();
            env.setRedrawSubtoolWindow();
        };
        Main_Core.prototype.getCurrentMainTool = function () {
            return this.mainTools[this.toolContext.mainToolID];
        };
        Main_Core.prototype.setCurrentMainToolForCurentLayer = function () {
            var env = this.toolEnv;
            env.updateContext();
            if (env.isDrawMode()) {
                if (env.isCurrentLayerVectorLayer()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                }
                else if (env.isCurrentLayerPosingLayer()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.posing);
                }
                else if (env.isCurrentLayerImageFileReferenceLayer()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.imageReferenceLayer);
                }
            }
            else {
                this.setCurrentMainTool(ManualTracingTool.MainToolID.edit);
            }
        };
        Main_Core.prototype.setCurrentMainTool = function (id) {
            var env = this.toolEnv;
            var context = this.toolContext;
            var isChanged = (context.mainToolID != id);
            context.mainToolID = id;
            if (env.isDrawMode()) {
                context.drawMode_MainToolID = id;
            }
            var mainTool = this.getCurrentMainTool();
            this.setCurrentSubTool(mainTool.currentSubToolIndex);
            if (isChanged) {
                this.subtoolWindow.viewLocation[1] = 0.0;
                this.subtoolWindow_CollectViewItems();
                this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
                this.activateCurrentTool();
                this.toolEnv.setRedrawHeaderWindow();
            }
        };
        Main_Core.prototype.setCurrentSubTool = function (subToolIndex) {
            this.cancelModalTool();
            var mainTool = this.getCurrentMainTool();
            if (this.toolContext.mainToolID != subToolIndex) {
                this.toolContext.redrawFooterWindow = true;
            }
            mainTool.currentSubToolIndex = subToolIndex;
            this.toolContext.subToolIndex = subToolIndex;
            this.currentTool = mainTool.subTools[subToolIndex];
        };
        Main_Core.prototype.setCurrentOperationUnitID = function (operationUnitID) {
            this.toolContext.operationUnitID = operationUnitID;
        };
        Main_Core.prototype.setCurrentLayer = function (layer) {
            var viewKeyframe = this.currentKeyframe;
            this.toolContext.currentLayer = layer;
            if (layer != null && ManualTracingTool.VectorLayer.isVectorLayer(layer) && viewKeyframe != null) {
                var viewKeyframeLayer = this.findViewKeyframeLayer(viewKeyframe, layer);
                var geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry;
                this.toolContext.currentVectorLayer = layer;
                this.toolContext.currentVectorGeometry = geometry;
                this.toolContext.currentVectorGroup = geometry.groups[0];
            }
            else {
                this.toolContext.currentVectorLayer = null;
                this.toolContext.currentVectorGeometry = null;
                this.toolContext.currentVectorGroup = null;
            }
            if (layer != null && layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = layer;
                this.toolContext.currentPosingLayer = posingLayer;
                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {
                this.toolContext.currentPosingLayer = null;
                this.toolContext.currentPosingData = null;
                this.toolContext.currentPosingModel = null;
            }
            if (layer != null && layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var imageFileReferenceLayer = layer;
                this.toolContext.currentImageFileReferenceLayer = imageFileReferenceLayer;
            }
            else {
                this.toolContext.currentImageFileReferenceLayer = null;
            }
            this.layerWindow_UnselectAllLayer();
            if (layer != null) {
                layer.isSelected = true;
            }
            this.setCurrentMainToolForCurentLayer();
            this.activateCurrentTool();
            //this.collectViewContext_CollectEditTargets();
        };
        Main_Core.prototype.setCurrentFrame = function (frame) {
            var context = this.toolContext;
            var aniSetting = context.document.animationSettingData;
            var before_CurrentKeyframe = this.currentKeyframe;
            aniSetting.currentTimeFrame = frame;
            // Find current keyframe for frame
            if (aniSetting.currentTimeFrame < 0) {
                aniSetting.currentTimeFrame = 0;
            }
            if (aniSetting.currentTimeFrame > aniSetting.maxFrame) {
                aniSetting.currentTimeFrame = aniSetting.maxFrame;
            }
            var currentKeyframeIndex = this.findViewKeyFrameIndex(aniSetting.currentTimeFrame);
            if (currentKeyframeIndex != -1) {
                this.currentKeyframe = this.viewLayerContext.keyframes[currentKeyframeIndex];
                if (currentKeyframeIndex - 1 >= 0) {
                    this.previousKeyframe = this.viewLayerContext.keyframes[currentKeyframeIndex - 1];
                }
                else {
                    this.previousKeyframe = null;
                }
                if (currentKeyframeIndex + 1 < this.viewLayerContext.keyframes.length) {
                    this.nextKeyframe = this.viewLayerContext.keyframes[currentKeyframeIndex + 1];
                }
                else {
                    this.nextKeyframe = null;
                }
            }
            // Update tool context
            if (context.currentLayer != null) {
                this.setCurrentLayer(context.currentLayer);
            }
            if (this.currentKeyframe != before_CurrentKeyframe) {
                //this.collectViewContext_CollectEditTargets();
            }
        };
        Main_Core.prototype.setLayerSelection = function (layer, isSelected) {
            layer.isSelected = isSelected;
            //this.collectViewContext_CollectEditTargets();
        };
        Main_Core.prototype.setLayerVisiblity = function (layer, isVisible) {
            layer.isVisible = isVisible;
            //this.collectViewContext_CollectEditTargets();
        };
        Main_Core.prototype.activateCurrentTool = function () {
            if (this.currentTool != null) {
                this.toolContext.needsDrawOperatorCursor = this.currentTool.isEditTool;
                this.currentTool.onActivated(this.toolEnv);
            }
        };
        Main_Core.prototype.startModalTool = function (modalTool) {
            if (modalTool == null) {
                return;
            }
            var available = modalTool.prepareModal(this.mainWindow.toolMouseEvent, this.toolEnv);
            if (!available) {
                return;
            }
            modalTool.startModal(this.toolEnv);
            this.modalBeforeTool = this.currentTool;
            this.currentModalTool = modalTool;
            this.currentTool = modalTool;
        };
        Main_Core.prototype.endModalTool = function () {
            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);
            this.setModalToolBefore();
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.activateCurrentTool();
        };
        Main_Core.prototype.cancelModalTool = function () {
            if (!this.isModalToolRunning()) {
                return;
            }
            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);
            this.setModalToolBefore();
            this.activateCurrentTool();
        };
        Main_Core.prototype.setModalToolBefore = function () {
            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        };
        Main_Core.prototype.isModalToolRunning = function () {
            return (this.currentModalTool != null);
        };
        Main_Core.prototype.collectEditTargetViewKeyframeLayers = function () {
            var editableKeyframeLayers = new List();
            // Collects layers
            if (this.currentKeyframe != null) {
                for (var _i = 0, _a = this.currentKeyframe.layers; _i < _a.length; _i++) {
                    var viewKeyframeLayer = _a[_i];
                    var layer = viewKeyframeLayer.layer;
                    if (layer.isSelected && layer.isVisible) {
                        editableKeyframeLayers.push(viewKeyframeLayer);
                    }
                }
            }
            return editableKeyframeLayers;
        };
        // View operations (virtual functions)
        Main_Core.prototype.openFileDialog = function (targetID) {
        };
        Main_Core.prototype.openDocumentSettingDialog = function () {
        };
        Main_Core.prototype.resizeWindows = function () {
        };
        Main_Core.prototype.updateHeaderDocumentFileName = function () {
        };
        Main_Core.prototype.setHeaderDefaultDocumentFileName = function () {
        };
        Main_Core.prototype.updateHeaderButtons = function () {
        };
        Main_Core.prototype.updateFooterMessage = function () {
        };
        Main_Core.prototype.layerWindow_CollectItems = function () {
        };
        Main_Core.prototype.layerWindow_CaluculateLayout = function (layerWindow) {
        };
        Main_Core.prototype.subtoolWindow_CollectViewItems = function () {
        };
        Main_Core.prototype.subtoolWindow_CaluculateLayout = function (subtoolWindow) {
        };
        Main_Core.prototype.layerWindow_UnselectAllLayer = function () {
        };
        Main_Core.prototype.palletSelector_CaluculateLayout = function () {
        };
        Main_Core.prototype.isModalShown = function () {
            return false;
        };
        // MainEditorDrawer implementations (virtual functions)
        Main_Core.prototype.drawMouseCursor = function () {
        };
        Main_Core.prototype.drawEditorEditLineStroke = function (line) {
        };
        Main_Core.prototype.drawEditorVectorLineStroke = function (line, color, strokeWidthBolding, useAdjustingLocation) {
        };
        Main_Core.prototype.drawEditorVectorLinePoints = function (line, color, useAdjustingLocation) {
        };
        Main_Core.prototype.drawEditorVectorLinePoint = function (point, color, useAdjustingLocation) {
        };
        Main_Core.prototype.drawEditorVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
        };
        // HTML  (virtual functions)
        Main_Core.prototype.getInputElementText = function (id) {
            return null;
        };
        return Main_Core;
    }());
    ManualTracingTool.Main_Core = Main_Core;
})(ManualTracingTool || (ManualTracingTool = {}));
