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
    var MainProcessStateID;
    (function (MainProcessStateID) {
        MainProcessStateID[MainProcessStateID["none"] = 0] = "none";
        MainProcessStateID[MainProcessStateID["startup"] = 1] = "startup";
        MainProcessStateID[MainProcessStateID["pause"] = 2] = "pause";
        MainProcessStateID[MainProcessStateID["systemResourceLoading"] = 3] = "systemResourceLoading";
        MainProcessStateID[MainProcessStateID["documentJSONLoading"] = 4] = "documentJSONLoading";
        MainProcessStateID[MainProcessStateID["documentResourceLoading"] = 5] = "documentResourceLoading";
        MainProcessStateID[MainProcessStateID["running"] = 6] = "running";
    })(MainProcessStateID = ManualTracingTool.MainProcessStateID || (ManualTracingTool.MainProcessStateID = {}));
    var App_Main = /** @class */ (function (_super) {
        __extends(App_Main, _super);
        function App_Main() {
            // Main process management
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.mainProcessState = MainProcessStateID.startup;
            _this.isDeferredWindowResizeWaiting = false;
            _this.deferredWindowResizeWaitingDuration = 250;
            _this.deferredWindowResizeWaitingEndTime = 0;
            _this.lastTime = 0;
            _this.elapsedTime = 0;
            _this.loadingDocument = null;
            _this.loadingDocumentImageResources = null;
            // Main drawing process
            _this.activeLayerBufferDrawn = false;
            _this.drawPathContext = new ManualTracingTool.DrawPathContext();
            _this.lazy_DrawPathContext = new ManualTracingTool.DrawPathContext();
            _this.drawPath_logging = false;
            // Subtool window
            _this.subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            _this.subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);
            return _this;
        }
        // Backward interface implementations
        App_Main.prototype.isWhileLoading = function () {
            return (this.mainProcessState == MainProcessStateID.systemResourceLoading
                || this.mainProcessState == MainProcessStateID.documentResourceLoading);
        };
        App_Main.prototype.setDefferedWindowResize = function () {
            this.isDeferredWindowResizeWaiting = true;
            this.deferredWindowResizeWaitingEndTime = Platform.getCurrentTime() + this.deferredWindowResizeWaitingDuration;
        };
        App_Main.prototype.isEventDisabled = function () {
            if (this.isWhileLoading()) {
                return true;
            }
            if (this.isModalShown()) {
                return true;
            }
            return false;
        };
        App_Main.prototype.resetDocument = function () {
            var documentData = this.createDefaultDocumentData();
            this.initializeContext(documentData);
            this.updateLayerStructure();
            this.setCurrentLayer(null);
            this.setCurrentFrame(0);
            this.setCurrentLayer(documentData.rootLayer.childLayers[0]);
            this.setHeaderDefaultDocumentFileName();
            this.toolEnv.setRedrawAllWindows();
        };
        App_Main.prototype.saveDocument = function () {
            var documentData = this.toolContext.document;
            var filePath = this.getInputElementText(this.ID.fileName);
            if (StringIsNullOrEmpty(filePath)) {
                this.showMessageBox('ファイル名が指定されていません。');
                return;
            }
            this.saveDocumentData(filePath, documentData, false);
            this.saveSettings();
            this.showMessageBox('保存しました。');
        };
        App_Main.prototype.updateForLayerProperty = function () {
            this.updateLayerStructureInternal(true, true, true, true);
            this.prepareDrawPathBuffers();
        };
        // Initializing devices not depending media resoures
        App_Main.prototype.onInitializeSystemDevices = function () {
            this.loadSettings();
            this.initializeViewDevices();
            this.initializeDrawingDevices();
            this.layerWindow_CaluculateLayout(this.layerWindow);
            //this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            this.paletteSelector_CaluculateLayout();
            this.startLoadingSystemResources();
        };
        // Loading system resources
        App_Main.prototype.startLoadingSystemResources = function () {
            // Start loading
            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
            this.mainProcessState = MainProcessStateID.systemResourceLoading;
        };
        App_Main.prototype.processLoadingSystemResources = function () {
            // Check loading states
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
            if (this.localSetting.lastUsedFilePaths.length == 0
                && StringIsNullOrEmpty(this.localSetting.lastUsedFilePaths[0])) {
                var newDocument = this.createDefaultDocumentData();
                this.start(newDocument);
            }
            else {
                var lastURL = this.localSetting.lastUsedFilePaths[0];
                var newDocument = new ManualTracingTool.DocumentData();
                this.startLoadingDocumentURL(newDocument, lastURL);
                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, newDocument);
                this.setHeaderDocumentFileName(lastURL);
            }
        };
        // Loading document resources
        App_Main.prototype.setDocumentLoadingState = function (state, documentData) {
            this.mainProcessState = state;
            this.loadingDocument = documentData;
        };
        App_Main.prototype.startReloadDocument = function () {
            var documentData = new ManualTracingTool.DocumentData();
            var fileName = this.getInputElementText(this.ID.fileName);
            this.startLoadingDocumentURL(documentData, fileName);
            this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
        };
        App_Main.prototype.startReloadDocumentFromFile = function (file, url) {
            if (StringIsNullOrEmpty(url) && file == null) {
                throw ('both of url and file are null or empty');
            }
            // Get document type from name
            var fileType = this.getDocumentFileTypeFromName(url);
            if (fileType == ManualTracingTool.DocumentFileType.none) {
                console.log('error: not supported file type.');
                return;
            }
            if (fileType == ManualTracingTool.DocumentFileType.json && !StringIsNullOrEmpty(url)) {
                var documentData = new ManualTracingTool.DocumentData();
                this.startLoadingDocumentURL(documentData, url);
                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
            }
            else if (fileType == ManualTracingTool.DocumentFileType.ora && file != null) {
                var documentData = new ManualTracingTool.DocumentData();
                this.startLoadDocumentOraFile(documentData, file, url);
                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
            }
            else {
                console.log('error: not supported file type.');
                return;
            }
        };
        App_Main.prototype.startReloadDocumentFromText = function (documentData, textData, filePath) {
            var data = JSON.parse(textData);
            this.storeLoadedDocumentJSON(documentData, data, filePath);
        };
        App_Main.prototype.processLoadingDocumentJSON = function () {
            if (this.loadingDocument.hasErrorOnLoading) {
                //this.showMessageBox('ドキュメントの読み込みに失敗しました。デフォルトのドキュメントを開きます。');
                this.loadingDocument = this.createDefaultDocumentData();
                this.setHeaderDefaultDocumentFileName();
                this.mainProcessState = MainProcessStateID.running;
            }
            if (!this.loadingDocument.loaded) {
                return;
            }
            this.fixLoadedDocumentData(this.loadingDocument);
            this.startLoadingDocumentResources(this.loadingDocument);
            this.setDocumentLoadingState(MainProcessStateID.documentResourceLoading, this.loadingDocument);
        };
        App_Main.prototype.startLoadingDocumentResourcesProcess = function (document) {
            this.startLoadingDocumentResources(document);
            this.setDocumentLoadingState(MainProcessStateID.documentResourceLoading, this.loadingDocument);
        };
        App_Main.prototype.processLoadingDocumentResources = function () {
            // Check loading states
            for (var _i = 0, _a = this.loadingDocumentImageResources; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            if (this.toolContext != null && this.toolContext.document != null) {
                ManualTracingTool.DocumentLogic.releaseDocumentResources(this.toolContext.document, this.drawGPURender.gl);
                this.toolContext.document = null;
            }
            this.finishLayerLoading_Recursive(this.loadingDocument.rootLayer);
            this.start(this.loadingDocument);
            this.loadingDocument == null;
        };
        App_Main.prototype.startLoadingDocumentResources = function (document) {
            this.loadingDocumentImageResources = new List();
            for (var _i = 0, _a = document.rootLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        };
        App_Main.prototype.startLoadingDocumentResourcesRecursive = function (layer, loadingDocumentImageResources) {
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
        App_Main.prototype.loadTexture = function (imageResource, url) {
            var _this = this;
            var image = new Image();
            imageResource.image.imageData = image;
            image.addEventListener('load', function () {
                if (imageResource.isGLTexture) {
                    _this.posing3DViewRender.initializeImageTexture(imageResource.image);
                }
                imageResource.loaded = true;
                imageResource.image.width = image.width;
                imageResource.image.height = image.height;
            });
            image.src = url;
        };
        App_Main.prototype.loadModels = function (modelFile, url) {
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
                    _this.posing3DViewRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float
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
        // Starting ups after loading resources
        App_Main.prototype.start = function (documentData) {
            this.initializeContext(documentData);
            this.initializeTools();
            this.initializeViewState();
            this.drawPaletteColorMixer(this.colorMixerWindow_colorCanvas);
            this.drawPaletteColorMixer(this.paletteColorModal_colorCanvas);
            this.updateLayerStructureInternal(true, true, false, false);
            this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);
            this.setCurrentOperationUnitID(this.toolContext.operationUnitID);
            this.setCurrentFrame(0);
            this.setCurrentLayer(documentData.rootLayer.childLayers[0]);
            this.updateLayerStructureInternal(false, false, true, true);
            this.mainWindow.viewScale = documentData.defaultViewScale;
            this.mainWindow.viewRotation = 0.0;
            this.mainWindow.mirrorX = false;
            this.mainWindow.mirrorY = false;
            this.toolEnv.updateContext();
            // 初回描画
            this.resizeWindowsAndBuffers(); // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。
            this.updateHeaderButtons();
            this.updateFooterMessage();
            this.toolEnv.setRedrawAllWindows();
            this.setEvents();
            this.mainProcessState = MainProcessStateID.running;
        };
        App_Main.prototype.initializeContext = function (documentData) {
            this.toolContext = new ManualTracingTool.ToolContext();
            this.toolContext.mainEditor = this;
            this.toolContext.drawStyle = this.drawStyle;
            this.toolContext.commandHistory = new ManualTracingTool.CommandHistory();
            this.toolContext.document = documentData;
            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;
            this.toolContext.lazy_DrawPathContext = this.lazy_DrawPathContext;
            this.toolEnv = new ManualTracingTool.ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ManualTracingTool.ToolDrawingEnvironment();
            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);
            this.lazy_DrawPathContext.resetLazyDrawProcess();
        };
        App_Main.prototype.onWindowBlur = function () {
            // console.log('Window blur');
            if (this.mainProcessState == MainProcessStateID.running) {
                this.mainProcessState = MainProcessStateID.pause;
                // console.log('  mainProcessState -> pause');
            }
        };
        App_Main.prototype.onWindowFocus = function () {
            // console.log('Window focus');
            if (this.mainProcessState == MainProcessStateID.pause) {
                this.mainProcessState = MainProcessStateID.running;
                // console.log('  mainProcessState -> running');
            }
        };
        // Continuous processes
        App_Main.prototype.run = function () {
            var context = this.toolContext;
            var env = this.toolEnv;
            if (this.isDeferredWindowResizeWaiting
                && Platform.getCurrentTime() > this.deferredWindowResizeWaitingEndTime) {
                this.isDeferredWindowResizeWaiting = false;
                this.resizeWindowsAndBuffers();
                this.toolEnv.setRedrawAllWindows();
            }
            // Process animation time
            var currentTime = Platform.getCurrentTime();
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
        App_Main.prototype.resizeWindowsAndBuffers = function () {
            this.resizeWindows();
            this.prepareDrawPathBuffers();
        };
        // Document data operations
        App_Main.prototype.updateLayerStructure = function () {
            this.updateLayerStructureInternal(true, true, true, true);
            this.prepareDrawPathBuffers();
        };
        App_Main.prototype.updateLayerStructureInternal = function (updateLayerWindowItems, updateViewKeyframes, updateHierarchicalStates, updateDrawPash) {
            var documentData = this.toolContext.document;
            // Update document data
            if (updateHierarchicalStates) {
                ManualTracingTool.Layer.updateHierarchicalStatesRecursive(documentData.rootLayer);
            }
            // Update view level context
            if (updateViewKeyframes) {
                this.collectViewKeyframeContext();
                this.setCurrentFrame(documentData.animationSettingData.currentTimeFrame); // TODO: this.currentViewKeyframeを更新するために必要 updateContextCurrentRefferences() で必要なため。
            }
            if (updateLayerWindowItems) {
                this.layerWindow_CollectItems(documentData);
                this.layerWindow_CaluculateLayout(this.layerWindow);
            }
            // Update draw path
            if (updateDrawPash) {
                this.collectDrawPaths();
            }
            // Update tool context
            this.updateContextCurrentRefferences();
        };
        App_Main.prototype.setHeaderDefaultDocumentFileName = function () {
            var fileName = ManualTracingTool.DocumentLogic.getDefaultDocumentFileName(this.localSetting);
            this.setHeaderDocumentFileName(fileName);
        };
        App_Main.prototype.getPosingModelByName = function (name) {
            return this.modelFile.posingModelDictionary[name];
        };
        App_Main.prototype.draw = function () {
            var isDrawingExist = false;
            this.toolEnv.updateContext();
            if (this.toolContext.redrawMainWindow) {
                this.drawMainWindow(this.mainWindow, this.toolContext.redrawCurrentLayer);
                this.toolContext.redrawMainWindow = false;
                this.toolContext.redrawCurrentLayer = false;
                if (this.selectCurrentLayerAnimationTime > 0.0) {
                    this.toolEnv.setRedrawMainWindow();
                }
                isDrawingExist = true;
            }
            if (this.toolContext.redrawEditorWindow) {
                this.clearWindow(this.editorWindow);
                this.drawEditorWindow(this.editorWindow, this.mainWindow);
                this.toolContext.redrawEditorWindow = false;
            }
            if (this.toolContext.redrawLayerWindow) {
                this.clearWindow(this.layerWindow);
                this.drawLayerWindow(this.layerWindow);
                this.toolContext.redrawLayerWindow = false;
            }
            if (this.toolContext.redrawSubtoolWindow) {
                //this.clearWindow(this.subtoolWindow);
                this.subtoolWindow_Draw();
                this.toolContext.redrawSubtoolWindow = false;
            }
            if (this.toolContext.redrawPaletteSelectorWindow) {
                this.clearWindow(this.paletteSelectorWindow);
                this.drawPaletteSelectorWindow();
                this.toolContext.redrawPaletteSelectorWindow = false;
            }
            if (this.toolContext.redrawColorMixerWindow) {
                this.drawColorMixerWindow();
                this.toolContext.redrawColorMixerWindow = false;
            }
            if (this.toolContext.redrawTimeLineWindow) {
                this.clearWindow(this.timeLineWindow);
                this.drawTimeLineWindow();
                this.toolContext.redrawTimeLineWindow = false;
                isDrawingExist = true;
            }
            if (this.toolContext.redrawWebGLWindow) {
                this.drawPosing3DView(this.webglWindow, this.layerWindow.layerWindowItems, this.mainWindow, null);
                this.toolContext.redrawWebGLWindow = false;
                isDrawingExist = true;
            }
            if (this.toolContext.redrawHeaderWindow) {
                this.updateHeaderButtons();
                this.toolContext.redrawHeaderWindow = false;
            }
            if (this.toolContext.redrawFooterWindow) {
                this.updateFooterText();
                this.toolContext.redrawFooterWindow = false;
            }
            this.lazyDraw_Process(this.lazy_DrawPathContext, isDrawingExist);
        };
        App_Main.prototype.collectDrawPaths = function () {
            var documentData = this.toolContext.document;
            var drawPathSteps = new List();
            // Insert a step for begin
            {
                var drawPathStep = new ManualTracingTool.DrawPathStep();
                drawPathStep.layer = documentData.rootLayer;
                drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.beginDrawing);
                drawPathSteps.push(drawPathStep);
            }
            // Collect virtual-grouped layer info
            var vLayers = new List();
            this.collectDrawPaths_CollectVirtualLayerRecursive(vLayers, documentData.rootLayer.childLayers);
            // Collect steps recursive
            this.collectDrawPasths_CollectPathRecursive(drawPathSteps, vLayers);
            // Insert a step for end
            {
                var drawPathStep = new ManualTracingTool.DrawPathStep();
                drawPathStep.layer = documentData.rootLayer;
                drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.endDrawing);
                drawPathSteps.push(drawPathStep);
            }
            // Attach layers to paths
            if (this.currentViewKeyframe != null) {
                this.collectDrawPasths_CollectViewKeyframe(drawPathSteps, this.currentViewKeyframe.layers);
            }
            this.drawPathContext.steps = drawPathSteps;
            // Collecct selected part
            this.collectDrawPasths_CollectSelectionInfo(this.drawPathContext);
            this.lazy_DrawPathContext.steps = this.drawPathContext.steps;
            console.log("collectDrawPaths");
            var stepIndex = 0;
            for (var _i = 0, _a = this.drawPathContext.steps; _i < _a.length; _i++) {
                var step = _a[_i];
                console.log(" " + stepIndex + ": " + step._debugText + " " + (step.layer ? step.layer.name : step.layer));
                stepIndex++;
            }
        };
        App_Main.prototype.collectDrawPaths_CollectVirtualLayerRecursive = function (result, layers) {
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var vLayer = new ManualTracingTool.TempVirtualLayer();
                vLayer.type = ManualTracingTool.TempVirtualLayerTypeID.normal;
                vLayer.layer = layer;
                this.collectDrawPaths_CollectVirtualLayerRecursive(vLayer.children, layer.childLayers);
                if (layer.isMaskedByBelowLayer) {
                    // Creates vitual group, inserts the layer and following layers into the group
                    var virtualGroup_vLayer = new ManualTracingTool.TempVirtualLayer();
                    virtualGroup_vLayer.type = ManualTracingTool.TempVirtualLayerTypeID.virtualGroup;
                    virtualGroup_vLayer.layer = layer;
                    // the layer
                    virtualGroup_vLayer.children.push(vLayer);
                    // following layers
                    var nextIndex = i + 1;
                    while (nextIndex < layers.length) {
                        var nextLayer = layers[nextIndex];
                        var next_vLayer = new ManualTracingTool.TempVirtualLayer();
                        next_vLayer.type = ManualTracingTool.TempVirtualLayerTypeID.normal;
                        next_vLayer.layer = nextLayer;
                        this.collectDrawPaths_CollectVirtualLayerRecursive(next_vLayer.children, nextLayer.childLayers);
                        virtualGroup_vLayer.children.push(next_vLayer);
                        if (nextLayer.isMaskedByBelowLayer) {
                            nextIndex++;
                        }
                        else {
                            i = nextIndex;
                            break;
                        }
                    }
                    result.push(virtualGroup_vLayer);
                }
                else {
                    result.push(vLayer);
                }
            }
        };
        App_Main.prototype.collectDrawPasths_CollectPathRecursive = function (result, vLayers) {
            var isGPUDrawContinuing = false;
            for (var i = vLayers.length - 1; i >= 0; i--) {
                var vLayer = vLayers[i];
                if (vLayer.type == ManualTracingTool.TempVirtualLayerTypeID.virtualGroup
                    || vLayer.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                    // Insert a step to begin buffering
                    {
                        var drawPathStep = new ManualTracingTool.DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.prepareBuffer);
                        drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                        result.push(drawPathStep);
                    }
                    // Insert steps for group children
                    this.collectDrawPasths_CollectPathRecursive(result, vLayer.children);
                    // insert a step to finish buffering
                    {
                        var drawPathStep = new ManualTracingTool.DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.flushBuffer);
                        result.push(drawPathStep);
                    }
                }
                else if (ManualTracingTool.VectorLayer.isVectorLayer(vLayer.layer)) {
                    var vectorLayer = vLayer.layer;
                    // Insert a step to draw fill
                    if (vectorLayer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        var drawPathStep = new ManualTracingTool.DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.drawBackground);
                        result.push(drawPathStep);
                    }
                    // Insert steps to draw line
                    if (vectorLayer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                        // Insert a step to clear gl buffer
                        if (!isGPUDrawContinuing) {
                            var drawPathStep = new ManualTracingTool.DrawPathStep();
                            drawPathStep.layer = vLayer.layer;
                            drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.prepareRendering);
                            result.push(drawPathStep);
                        }
                        // Insert a step to draw
                        {
                            var drawPathStep = new ManualTracingTool.DrawPathStep();
                            drawPathStep.layer = vLayer.layer;
                            drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.drawForeground);
                            drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                            result.push(drawPathStep);
                        }
                        // Insert a step to flush gl buffer if the next layer dont need draw lines
                        isGPUDrawContinuing = false;
                        if (vectorLayer.fillAreaType == ManualTracingTool.FillAreaTypeID.none && i > 0) {
                            var next_layer = vLayers[i - 1].layer;
                            if (ManualTracingTool.VectorLayer.isVectorLayer(next_layer)) {
                                var next_vectorLayer = next_layer;
                                if (next_vectorLayer.drawLineType != ManualTracingTool.DrawLineTypeID.none
                                    && next_vectorLayer.fillAreaType == ManualTracingTool.FillAreaTypeID.none) {
                                    isGPUDrawContinuing = true;
                                }
                            }
                        }
                        if (!isGPUDrawContinuing) {
                            var drawPathStep = new ManualTracingTool.DrawPathStep();
                            drawPathStep.layer = vLayer.layer;
                            drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.flushRendering);
                            drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                            result.push(drawPathStep);
                        }
                    }
                }
                else {
                    var drawPathStep = new ManualTracingTool.DrawPathStep();
                    drawPathStep.layer = vLayer.layer;
                    drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.drawForeground);
                    result.push(drawPathStep);
                }
            }
        };
        App_Main.prototype.collectDrawPasths_CollectSelectionInfo = function (drawPathContext) {
            var firstSelectedIndex = -1;
            var lastSelectedIndex = -1;
            var bufferNestStartIndex = -1;
            var bufferNestLevel = 0;
            var isSelectedNest = false;
            for (var i = 0; i < drawPathContext.steps.length; i++) {
                var drawPathStep = drawPathContext.steps[i];
                if (ManualTracingTool.Layer.isSelected(drawPathStep.layer)) {
                    // Detect selected range for level = 0
                    if (bufferNestLevel == 0) {
                        if (firstSelectedIndex == -1) {
                            firstSelectedIndex = i;
                        }
                        lastSelectedIndex = i;
                    }
                    else {
                        // Set flag for level > 0
                        isSelectedNest = true;
                    }
                }
                if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.prepareBuffer) {
                    if (bufferNestLevel == 0) {
                        bufferNestStartIndex = i;
                    }
                    bufferNestLevel++;
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.flushBuffer) {
                    bufferNestLevel--;
                    // Detect selected range for level > 0
                    if (bufferNestLevel == 0) {
                        if (isSelectedNest) {
                            if (firstSelectedIndex == -1) {
                                firstSelectedIndex = bufferNestStartIndex;
                            }
                            lastSelectedIndex = i;
                            isSelectedNest = false;
                        }
                    }
                }
            }
            drawPathContext.activeDrawPathStartIndex = firstSelectedIndex;
            drawPathContext.activeDrawPathEndIndex = lastSelectedIndex;
            //console.log('CollectSelectionInfo', firstSelectedIndex, lastSelectedIndex);
        };
        App_Main.prototype.collectDrawPasths_CollectViewKeyframe = function (drawPathSteps, viewKeyframeLayers) {
            for (var _i = 0, drawPathSteps_1 = drawPathSteps; _i < drawPathSteps_1.length; _i++) {
                var drawPathStep = drawPathSteps_1[_i];
                drawPathStep.viewKeyframeLayer = null;
                for (var _a = 0, viewKeyframeLayers_1 = viewKeyframeLayers; _a < viewKeyframeLayers_1.length; _a++) {
                    var viewKeyframeLayer = viewKeyframeLayers_1[_a];
                    if (viewKeyframeLayer.layer == drawPathStep.layer) {
                        drawPathStep.viewKeyframeLayer = viewKeyframeLayer;
                        break;
                    }
                }
            }
        };
        App_Main.prototype.prepareDrawPathBuffers = function () {
            var baseCanvasWindow = this.mainWindow;
            if (this.prepareDrawPathBuffers_IsChanged(this.lazy_DrawPathContext.lazyDraw_Buffer, baseCanvasWindow)) {
                this.lazy_DrawPathContext.lazyDraw_Buffer = this.prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow);
            }
            for (var _i = 0, _a = this.drawPathContext.steps; _i < _a.length; _i++) {
                var drawPathStep = _a[_i];
                if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.prepareBuffer) {
                    if (this.prepareDrawPathBuffers_IsChanged(drawPathStep.layer.bufferCanvasWindow, baseCanvasWindow)) {
                        drawPathStep.layer.bufferCanvasWindow = this.prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow);
                    }
                }
            }
        };
        App_Main.prototype.prepareDrawPathBuffers_IsChanged = function (bufferCanvasWindow, baseCanvasWindow) {
            return (bufferCanvasWindow == null
                || bufferCanvasWindow.width != baseCanvasWindow.width
                || bufferCanvasWindow.height != baseCanvasWindow.height);
        };
        App_Main.prototype.prepareDrawPathBuffers_CreateCanvasWindow = function (baseCanvasWindow) {
            var canvasWindow = new ManualTracingTool.CanvasWindow();
            canvasWindow.createCanvas();
            canvasWindow.setCanvasSize(baseCanvasWindow.width, baseCanvasWindow.height);
            canvasWindow.initializeContext();
            return canvasWindow;
        };
        App_Main.prototype.drawMainWindow = function (canvasWindow, redrawActiveLayerOnly) {
            if (this.currentViewKeyframe == null) {
                return;
            }
            var env = this.toolEnv;
            var currentLayerOnly = (this.selectCurrentLayerAnimationTime > 0.0);
            var isModalToolRunning = this.isModalToolRunning();
            var isFullRendering = false;
            // Draw edit mode ui
            if (env.isDrawMode()) {
                this.drawMainWindow_drawDrawMode(canvasWindow, redrawActiveLayerOnly, currentLayerOnly, isModalToolRunning, this.toolContext.drawCPUOnly);
            }
            else if (env.isEditMode()) {
                this.drawMainWindow_drawEditMode(canvasWindow, redrawActiveLayerOnly, currentLayerOnly, isModalToolRunning);
            }
        };
        App_Main.prototype.drawMainWindow_drawDrawMode = function (canvasWindow, redrawActiveLayerOnly, currentLayerOnly, isModalToolRunning, drawCPUOnly) {
            var drawPathContext = this.drawPathContext;
            // TODO: 必要なときだけ実行する
            this.collectDrawPasths_CollectSelectionInfo(drawPathContext);
            var isLazyDrawFinished = this.lazy_DrawPathContext.isLazyDrawFinished();
            var activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex;
            var activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex;
            var maxStepIndex = drawPathContext.steps.length - 1;
            if (isLazyDrawFinished && !isModalToolRunning && !drawCPUOnly) {
                drawPathContext.drawPathModeID = ManualTracingTool.DrawPathModeID.editorPreview;
            }
            else {
                drawPathContext.drawPathModeID = ManualTracingTool.DrawPathModeID.editor;
            }
            // drawPathContext.drawPathModeID = DrawPathModeID.editor;
            drawPathContext.isModalToolRunning = isModalToolRunning;
            drawPathContext.currentLayerOnly = currentLayerOnly;
            if (redrawActiveLayerOnly && activeRangeStartIndex != -1) {
                this.clearWindow(canvasWindow);
                // Draw back layers
                if (activeRangeStartIndex > 0) {
                    drawPathContext.startIndex = 0;
                    drawPathContext.endIndex = activeRangeStartIndex - 1;
                    this.drawMainWindow_drawPathStepsToBuffer(canvasWindow, this.backLayerRenderWindow, drawPathContext, this.activeLayerBufferDrawn);
                }
                // Draw current layers
                drawPathContext.startIndex = activeRangeStartIndex;
                drawPathContext.endIndex = activeRangeEndIndex;
                this.drawDrawPaths(canvasWindow, drawPathContext, true);
                // Draw fore layers
                if (activeRangeEndIndex < maxStepIndex) {
                    drawPathContext.startIndex = activeRangeEndIndex + 1;
                    drawPathContext.endIndex = maxStepIndex;
                    this.drawMainWindow_drawPathStepsToBuffer(canvasWindow, this.foreLayerRenderWindow, drawPathContext, this.activeLayerBufferDrawn);
                }
                this.activeLayerBufferDrawn = true;
            }
            else {
                // Draw all layers
                drawPathContext.startIndex = 0;
                drawPathContext.endIndex = maxStepIndex;
                this.drawDrawPaths(canvasWindow, drawPathContext, true);
                this.activeLayerBufferDrawn = false;
            }
        };
        App_Main.prototype.drawMainWindow_drawPathStepsToBuffer = function (canvasWindow, bufferCanvasWindow, drawPathContext, activeLayerBufferDrawn) {
            // Draw layers to buffer if requested
            if (!activeLayerBufferDrawn) {
                this.clearWindow(bufferCanvasWindow);
                canvasWindow.copyTransformTo(bufferCanvasWindow);
                this.drawDrawPaths(bufferCanvasWindow, drawPathContext, true);
            }
            // Draw layers from buffer
            this.drawFullWindowImage(canvasWindow, bufferCanvasWindow);
        };
        App_Main.prototype.drawMainWindow_drawEditMode = function (canvasWindow, redrawActiveLayerOnly, currentLayerOnly, isModalToolRunning) {
            var drawPathContext = this.drawPathContext;
            var activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex;
            var activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex;
            var maxStepIndex = drawPathContext.steps.length - 1;
            // TODO: 必要なときだけ実行する
            this.collectDrawPasths_CollectSelectionInfo(drawPathContext);
            this.canvasRender.setContext(canvasWindow);
            this.clearWindow(canvasWindow);
            //redrawActiveLayerOnly = false;
            if (redrawActiveLayerOnly && activeRangeStartIndex != -1) {
                // Draw back layers
                if (activeRangeStartIndex > 0) {
                    drawPathContext.startIndex = 0;
                    drawPathContext.endIndex = activeRangeStartIndex - 1;
                    this.drawMainWindow_drawEditModeToBuffer(canvasWindow, this.backLayerRenderWindow, drawPathContext, this.activeLayerBufferDrawn, currentLayerOnly, isModalToolRunning);
                }
                // Draw current layers
                drawPathContext.startIndex = activeRangeStartIndex;
                drawPathContext.endIndex = activeRangeEndIndex;
                this.drawMainWindow_drawEditModeToBuffer(canvasWindow, null, drawPathContext, false, currentLayerOnly, isModalToolRunning);
                // Draw fore layers
                if (activeRangeEndIndex < maxStepIndex) {
                    drawPathContext.startIndex = activeRangeEndIndex + 1;
                    drawPathContext.endIndex = maxStepIndex;
                    this.drawMainWindow_drawEditModeToBuffer(canvasWindow, this.foreLayerRenderWindow, drawPathContext, this.activeLayerBufferDrawn, currentLayerOnly, isModalToolRunning);
                }
                this.activeLayerBufferDrawn = true;
            }
            else {
                // Draw all layers
                drawPathContext.startIndex = 0;
                drawPathContext.endIndex = maxStepIndex;
                this.drawMainWindow_drawEditModeToBuffer(canvasWindow, null, drawPathContext, false, currentLayerOnly, isModalToolRunning);
                this.activeLayerBufferDrawn = false;
            }
        };
        App_Main.prototype.drawMainWindow_drawEditModeToBuffer = function (canvasWindow, bufferCanvasWindow, drawPathContext, activeLayerBufferDrawn, currentLayerOnly, isModalToolRunning) {
            var documentData = this.toolContext.document;
            var drawStrokes = true; //!isFullRendering;
            var drawPoints = true;
            if (!activeLayerBufferDrawn) {
                if (bufferCanvasWindow != null) {
                    this.clearWindow(bufferCanvasWindow);
                    canvasWindow.copyTransformTo(bufferCanvasWindow);
                    this.canvasRender.setContextTransformByWindow(bufferCanvasWindow);
                }
                for (var i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {
                    var drawPathStep = drawPathContext.steps[i];
                    if (drawPathStep.operationType != ManualTracingTool.DrawPathOperationTypeID.drawForeground
                        && drawPathStep.operationType != ManualTracingTool.DrawPathOperationTypeID.drawBackground) {
                        continue;
                    }
                    var viewKeyFrameLayer = drawPathStep.viewKeyframeLayer;
                    var layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null;
                    //console.log('  DrawPath EditMode', i, drawPathStep._debugText, layer ? layer.name : '');
                    if (currentLayerOnly) {
                        //if (layer != this.selectCurrentLayerAnimationLayer) {
                        if (!this.isdrawTargetForCurrentLayerOnly(layer)) {
                            continue;
                        }
                    }
                    else {
                        if (!ManualTracingTool.Layer.isVisible(layer)) {
                            continue;
                        }
                    }
                    if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                        var vectorLayer = layer;
                        if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.drawBackground) {
                            this.drawBackground(viewKeyFrameLayer, this.toolContext.document, false, isModalToolRunning);
                        }
                        this.drawVectorLayerForEditMode(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData, drawStrokes, drawPoints, isModalToolRunning);
                    }
                }
            }
            if (bufferCanvasWindow != null) {
                this.drawFullWindowImage(canvasWindow, bufferCanvasWindow);
            }
        };
        App_Main.prototype.drawDrawPaths = function (canvasWindow, drawPathContext, clearState) {
            var bufferCanvasWindow = canvasWindow;
            var startTime = Platform.getCurrentTime();
            var isFullRendering = drawPathContext.isFullRendering();
            if (clearState) {
                drawPathContext.clearDrawingStates();
                drawPathContext.bufferStack.push(canvasWindow);
                this.canvasRender.setContext(canvasWindow);
            }
            else {
                bufferCanvasWindow = drawPathContext.bufferStack.pop();
                this.canvasRender.setContext(bufferCanvasWindow);
            }
            if (this.drawPath_logging) {
                console.log('  DrawPath start clearState', clearState);
            }
            for (var i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {
                var drawPathStep = drawPathContext.steps[i];
                drawPathContext.lastDrawPathIndex = i;
                var viewKeyFrameLayer = drawPathStep.viewKeyframeLayer;
                var layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null;
                if (this.drawPath_logging) {
                    console.log('  DrawPath', i, drawPathStep._debugText, layer ? layer.name : '', 'stack:', drawPathContext.bufferStack.length);
                }
                if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.beginDrawing) {
                    this.clearWindow(canvasWindow);
                    this.mainWindow.copyTransformTo(canvasWindow);
                    this.canvasRender.setTransform(canvasWindow);
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.drawForeground
                    || drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.drawBackground) {
                    if (drawPathContext.drawPathModeID == ManualTracingTool.DrawPathModeID.export) {
                        if (!ManualTracingTool.Layer.isVisible(layer) || !layer.isRenderTarget) {
                            continue;
                        }
                    }
                    else if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {
                        continue;
                    }
                    // Draw layer to current buffer
                    this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep);
                    if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.drawForeground) {
                        if (isFullRendering && ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                            // GPU rendering
                            this.mainWindow.copyTransformTo(this.drawGPUWindow);
                            this.drawGPUWindow.viewScale *= (this.drawGPUWindow.width / this.mainWindow.width);
                            this.renderForeground_VectorLayer(this.drawGPUWindow, viewKeyFrameLayer, this.toolContext.document, drawPathContext.isModalToolRunning);
                        }
                        else {
                            // CPU drawing
                            this.drawForeground(viewKeyFrameLayer, this.toolContext.document, isFullRendering, drawPathContext.isModalToolRunning);
                        }
                    }
                    else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.drawBackground) {
                        this.drawBackground(viewKeyFrameLayer, this.toolContext.document, isFullRendering, drawPathContext.isModalToolRunning);
                    }
                    this.canvasRender.setCompositeOperation('source-over');
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.prepareRendering) {
                    if (isFullRendering) {
                        this.renderClearBuffer(this.drawGPUWindow);
                    }
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.flushRendering) {
                    if (isFullRendering) {
                        var renderCanvasWindow = this.drawGPUWindow;
                        this.canvasRender.setContext(bufferCanvasWindow);
                        this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep);
                        this.drawFullWindowImage(bufferCanvasWindow, renderCanvasWindow);
                        //this.canvasRender.resetTransform();
                        //this.canvasRender.drawImage(renderCanvasWindow.canvas
                        //    , 0, 0, renderCanvasWindow.width, renderCanvasWindow.height
                        //    , 0, 0, bufferCanvasWindow.width, bufferCanvasWindow.height);
                        //this.canvasRender.setTransform(bufferCanvasWindow);
                        this.canvasRender.setCompositeOperation('source-over');
                    }
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.prepareBuffer) {
                    if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {
                        continue;
                    }
                    // Prepare buffer
                    this.canvasRender.setContext(layer.bufferCanvasWindow);
                    this.clearWindow(layer.bufferCanvasWindow);
                    bufferCanvasWindow.copyTransformTo(layer.bufferCanvasWindow);
                    this.canvasRender.setTransform(layer.bufferCanvasWindow);
                    drawPathContext.bufferStack.push(bufferCanvasWindow);
                    bufferCanvasWindow = layer.bufferCanvasWindow;
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.flushBuffer) {
                    if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {
                        continue;
                    }
                    // Flush buffered image to upper buffer
                    var before_BufferCanvasWindow = drawPathContext.bufferStack.pop();
                    this.canvasRender.setContext(before_BufferCanvasWindow);
                    this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep);
                    this.drawFullWindowImage(before_BufferCanvasWindow, bufferCanvasWindow);
                    //this.canvasRender.setContext(before_BufferCanvasWindow);
                    //this.canvasRender.resetTransform();
                    //this.canvasRender.drawImage(bufferCanvasWindow.canvas
                    //    , 0, 0, bufferCanvasWindow.width, bufferCanvasWindow.height
                    //    , 0, 0, before_BufferCanvasWindow.width, before_BufferCanvasWindow.height);
                    //this.canvasRender.setTransform(before_BufferCanvasWindow);
                    bufferCanvasWindow = before_BufferCanvasWindow;
                }
                var lastTime = Platform.getCurrentTime();
                if (lastTime - startTime >= drawPathContext.lazyDraw_MaxTime
                    || i == drawPathContext.endIndex) {
                    drawPathContext.bufferStack.push(bufferCanvasWindow);
                    break;
                }
            }
        };
        App_Main.prototype.drawDrawPaths_isLayerDrawTarget = function (layer, currentLayerOnly) {
            if (currentLayerOnly) {
                if (!this.isdrawTargetForCurrentLayerOnly(layer)) {
                    return false;
                }
            }
            else {
                if (!ManualTracingTool.Layer.isVisible(layer)) {
                    return false;
                }
            }
            return true;
        };
        App_Main.prototype.drawDrawPaths_setCompositeOperation = function (drawPathContext, drawPathStep) {
            if (!drawPathContext.currentLayerOnly) {
                this.canvasRender.setCompositeOperation(drawPathStep.compositeOperation);
            }
            else {
                this.canvasRender.setCompositeOperation('source-over');
            }
        };
        App_Main.prototype.isdrawTargetForCurrentLayerOnly = function (layer) {
            //return (layer != this.selectCurrentLayerAnimationLayer);
            return (ManualTracingTool.Layer.isSelected(layer));
        };
        App_Main.prototype.drawLayers = function (canvasWindow, startIndex, endIndex, isExporting, currentLayerOnly, isModalToolRunning) {
            this.canvasRender.setContext(canvasWindow);
            for (var i = startIndex; i >= endIndex; i--) {
                var viewKeyFrameLayer = this.currentViewKeyframe.layers[i];
                var layer = viewKeyFrameLayer.layer;
                if (isExporting) {
                    if (!ManualTracingTool.Layer.isVisible(layer) || !layer.isRenderTarget) {
                        continue;
                    }
                }
                else if (currentLayerOnly) {
                    if (layer != this.selectCurrentLayerAnimationLayer) {
                        continue;
                    }
                }
                else {
                    if (!ManualTracingTool.Layer.isVisible(layer)) {
                        continue;
                    }
                }
                this.drawLayerByCanvas(viewKeyFrameLayer, this.toolContext.document, isExporting, isModalToolRunning);
            }
        };
        App_Main.prototype.lazyDraw_Process = function (drawPathContext, isMainDrawingExist) {
            if (this.toolContext.drawCPUOnly) {
                return;
            }
            var canvasWindow = drawPathContext.lazyDraw_Buffer;
            var env = this.toolEnv;
            // Rest or skip process
            if (drawPathContext.needsLazyRedraw) {
                drawPathContext.resetLazyDrawProcess();
                drawPathContext.needsLazyRedraw = false;
                return;
            }
            if (drawPathContext.isLazyDrawFinished()) {
                return;
            }
            if (drawPathContext.isLazyDrawWaiting()) {
                return;
            }
            var clearState = drawPathContext.isLazyDrawBigining();
            console.log("LazyDraw from " + drawPathContext.lazyDraw_ProcessedIndex + (clearState ? ' clear' : '') + " buffer-stack[" + drawPathContext.bufferStack.length + "]");
            // Draw steps
            drawPathContext.drawPathModeID = ManualTracingTool.DrawPathModeID.editorPreview;
            drawPathContext.startIndex = drawPathContext.lazyDraw_ProcessedIndex + 1;
            drawPathContext.endIndex = drawPathContext.steps.length - 1;
            drawPathContext.isModalToolRunning = env.isModalToolRunning();
            drawPathContext.currentLayerOnly = false;
            drawPathContext.lazyDraw_MaxTime = 10; // TODO: 適当な値を設定する
            this.drawDrawPaths(canvasWindow, drawPathContext, clearState);
            // Save states for drawing steps
            if (drawPathContext.isLastDrawExist()) {
                drawPathContext.lazyDraw_ProcessedIndex = drawPathContext.lastDrawPathIndex;
                if (drawPathContext.isLazyDrawFinished()) {
                    console.log('  --> lazyDraw finished', drawPathContext.lazyDraw_ProcessedIndex);
                    this.clearWindow(this.mainWindow);
                    this.canvasRender.resetTransform();
                    this.canvasRender.drawImage(canvasWindow.canvas, 0, 0, this.mainWindow.width, this.mainWindow.height, 0, 0, this.mainWindow.width, this.mainWindow.height);
                    if (env.isEditMode()) {
                        this.drawMainWindow_drawEditMode(this.mainWindow, true, false, false);
                    }
                }
            }
            else {
                drawPathContext.lazyDraw_ProcessedIndex = drawPathContext.steps.length;
            }
        };
        App_Main.prototype.drawEditorWindow = function (editorWindow, mainWindow) {
            var context = this.toolContext;
            mainWindow.updateViewMatrix();
            mainWindow.copyTransformTo(editorWindow);
            this.canvasRender.setContext(editorWindow);
            if (this.toolEnv.needsDrawOperatorCursor()) {
                this.drawOperatorCursor();
            }
            if (this.toolEnv.isDrawMode()) {
                if (this.currentTool == this.tool_DrawLine) {
                    if (this.tool_DrawLine.editLine != null) {
                        this.drawEditLineStroke(this.tool_DrawLine.editLine);
                    }
                }
                else if (context.mainToolID == ManualTracingTool.MainToolID.posing) {
                    if (this.currentTool == this.tool_Posing3d_LocateHead
                        && this.tool_Posing3d_LocateHead.editLine != null) {
                        this.drawEditLineStroke(this.tool_Posing3d_LocateHead.editLine);
                    }
                }
            }
            if (this.currentTool != null) {
                this.toolEnv.updateContext();
                this.toolDrawEnv.setVariables(editorWindow);
                this.currentTool.onDrawEditor(this.toolEnv, this.toolDrawEnv);
            }
        };
        App_Main.prototype.drawExportImage = function (canvasWindow) {
            this.drawLayers(canvasWindow, this.currentViewKeyframe.layers.length - 1, 0, true, false, false);
        };
        App_Main.prototype.drawTimeLineWindow = function () {
            this.drawTimeLineWindow_CommandButtons(this.timeLineWindow, this.toolContext.animationPlaying);
            this.drawTimeLineWindow_TimeLine(this.timeLineWindow, this.toolContext.document, this.viewLayerContext.keyframes, this.toolEnv.currentVectorLayer);
        };
        App_Main.prototype.drawPaletteSelectorWindow = function () {
            this.drawPaletteSelectorWindow_CommandButtons(this.paletteSelectorWindow);
            this.drawPaletteSelectorWindow_PaletteItems(this.paletteSelectorWindow, this.toolContext.document, this.toolEnv.currentVectorLayer);
        };
        App_Main.prototype.drawColorMixerWindow = function () {
            this.drawColorMixerWindow_SetInputControls();
        };
        App_Main.prototype.subtoolWindow_Draw = function () {
            //this.canvasRender.setContext(subtoolWindow);
            //let context = this.toolContext;
            //let currentMainTool = this.getCurrentMainTool();
            //let scale = subtoolWindow.subToolItemScale;
            //let fullWidth = subtoolWindow.width - 1;
            //let unitWidth = subtoolWindow.subToolItemUnitWidth;
            //let unitHeight = subtoolWindow.subToolItemUnitHeight;
            //let lastY = 0.0;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                var tool = viewItem.tool;
                var srcImage = tool.toolBarImage;
                //if (srcImage == null) {
                //    continue;
                //}
                // TODO: 再構築時と同じ処理をしているため共通化する
                viewItem.isAvailable = tool.isAvailable(this.toolEnv);
                if (viewItem.buttons.length > 0) {
                    // TODO: 複数ボタンが必要か検討
                    viewItem.buttonStateID = tool.getInputSideID(0, this.toolEnv);
                }
                // TODO: 以降、React移行により削除
                //let srcY = tool.toolBarImageIndex * unitHeight;
                //let dstY = viewItem.top;
                //// Draw subtool image
                //if (tool == this.currentTool) {
                //    this.canvasRender.setFillColorV(this.subToolItemSelectedColor);
                //}
                //else {
                //    this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
                //}
                //this.canvasRender.fillRect(0, dstY, fullWidth, unitHeight * scale);
                //if (tool.isAvailable(this.toolEnv)) {
                //    this.canvasRender.setGlobalAlpha(1.0);
                //}
                //else {
                //    this.canvasRender.setGlobalAlpha(0.5);
                //}
                //this.canvasRender.drawImage(srcImage.image.imageData
                //    , 0, srcY, unitWidth, unitHeight
                //    , 0, dstY, unitWidth * scale, unitHeight * scale);
                //// Draw subtool option buttons
                //for (let button of viewItem.buttons) {
                //    let buttonWidth = 128 * scale;
                //    let buttonHeight = 128 * scale;
                //    button.left = unitWidth * scale * 0.8;
                //    button.top = dstY;
                //    button.right = button.left + buttonWidth - 1;
                //    button.bottom = button.top + buttonHeight - 1;
                //    if (viewItem.buttonStateID == InputSideID.front) {
                //        this.canvasRender.drawImage(this.systemImage.image.imageData
                //            , 0, 0, 128, 128
                //            , button.left, button.top, buttonWidth, buttonHeight);
                //    }
                //    else {
                //        this.canvasRender.drawImage(this.systemImage.image.imageData
                //            , 128, 0, 128, 128
                //            , button.left, button.top, buttonWidth, buttonHeight);
                //    }
                //}
                //this.canvasRender.setStrokeWidth(0.0);
                //this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                //this.canvasRender.drawLine(0, dstY, fullWidth, dstY);
                //lastY = dstY + unitHeight * scale;
            }
            //this.canvasRender.setGlobalAlpha(1.0);
            //this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
            this.updateUISubToolWindow(true);
        };
        // View operations
        App_Main.prototype.onModalWindowClosed = function () {
            if (this.currentModalDialogID == this.ID.layerPropertyModal) {
                this.onClosedLayerPropertyModal();
                this.updateForLayerProperty();
            }
            else if (this.currentModalDialogID == this.ID.paletteColorModal) {
                this.onClosedPaletteColorModal();
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {
                this.toolContext.drawLineBaseWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineWidth, 1.0);
                this.toolContext.drawLineMinWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineMinWidth, 0.1);
                var operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, ManualTracingTool.OperationUnitID.linePoint);
                this.setCurrentOperationUnitID(operationUnitID);
            }
            else if (this.currentModalDialogID == this.ID.newLayerCommandOptionModal) {
                this.onNewLayerCommandOptionModal();
            }
            else if (this.currentModalDialogID == this.ID.openFileDialogModal) {
                this.onClosedFileDialogModal();
            }
            else if (this.currentModalDialogID == this.ID.documentSettingModal) {
                this.onClosedDocumentSettingModal();
            }
            else if (this.currentModalDialogID == this.ID.exportImageFileModal) {
                this.onClosedExportImageFileModal();
            }
            else if (this.currentModalDialogID == this.ID.newKeyframeModal) {
                this.onClosedNewKeyframeModal();
            }
            else if (this.currentModalDialogID == this.ID.deleteKeyframeModal) {
                this.onClosedDeleteKeyframeModal();
            }
            this.currentModalDialogID = this.ID.none;
            this.currentModalDialogResult = this.ID.none;
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
            this.toolEnv.setRedrawSubtoolWindow();
        };
        App_Main.prototype.onClosedExportImageFileModal = function () {
            if (this.currentModalDialogResult != this.ID.exportImageFileModal_ok) {
                return;
            }
            var fileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(fileName)) {
                return;
            }
            var backGroundType = (this.getRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, 1));
            var scale = this.getInputElementNumber(this.ID.exportImageFileModal_scale, 1.0);
            this.exportImageFile(fileName, this.toolContext.document, scale, backGroundType);
        };
        App_Main.prototype.onNewLayerCommandOptionModal = function () {
            if (this.currentModalDialogResult != this.ID.newLayerCommandOptionModal_ok) {
                return;
            }
            var newLayerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, ManualTracingTool.NewLayerTypeID.vectorLayer);
            // Select command
            var layerCommand = null;
            if (newLayerType == ManualTracingTool.NewLayerTypeID.vectorLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
            }
            else if (newLayerType == ManualTracingTool.NewLayerTypeID.vectorLayer_Fill) {
                var command = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
                command.createForFillColor = true;
                layerCommand = command;
            }
            else if (newLayerType == ManualTracingTool.NewLayerTypeID.vectorLayerReferenceLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition();
            }
            else if (newLayerType == ManualTracingTool.NewLayerTypeID.groupLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddGroupLayerToCurrentPosition();
            }
            else if (newLayerType == ManualTracingTool.NewLayerTypeID.posingLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddPosingLayerToCurrentPosition();
            }
            else if (newLayerType == ManualTracingTool.NewLayerTypeID.imageFileReferenceLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddImageFileReferenceLayerToCurrentPosition();
            }
            if (layerCommand == null) {
                return;
            }
            // Execute command
            this.executeLayerCommand(layerCommand);
        };
        App_Main.prototype.openDocumentSettingDialog = function () {
            this.openDocumentSettingModal();
        };
        return App_Main;
    }(ManualTracingTool.App_Event));
    ManualTracingTool.App_Main = App_Main;
})(ManualTracingTool || (ManualTracingTool = {}));
