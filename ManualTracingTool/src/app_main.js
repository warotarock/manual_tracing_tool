var ManualTracingTool;
(function (ManualTracingTool) {
    let MainProcessStateID;
    (function (MainProcessStateID) {
        MainProcessStateID[MainProcessStateID["none"] = 0] = "none";
        MainProcessStateID[MainProcessStateID["startup"] = 1] = "startup";
        MainProcessStateID[MainProcessStateID["pause"] = 2] = "pause";
        MainProcessStateID[MainProcessStateID["systemResourceLoading"] = 3] = "systemResourceLoading";
        MainProcessStateID[MainProcessStateID["documentJSONLoading"] = 4] = "documentJSONLoading";
        MainProcessStateID[MainProcessStateID["documentResourceLoading"] = 5] = "documentResourceLoading";
        MainProcessStateID[MainProcessStateID["running"] = 6] = "running";
    })(MainProcessStateID = ManualTracingTool.MainProcessStateID || (ManualTracingTool.MainProcessStateID = {}));
    class App_Main extends ManualTracingTool.App_Event {
        constructor() {
            // Main process management
            super(...arguments);
            this.mainProcessState = MainProcessStateID.startup;
            this.isDeferredWindowResizeWaiting = false;
            this.lastTime = 0;
            this.elapsedTime = 0;
            this.loadingDocument = null;
            this.loadingDocumentImageResources = null;
            // Main drawing process
            this.activeLayerBufferDrawn = false;
            this.drawPathContext = new ManualTracingTool.DrawPathContext();
            this.lazy_DrawPathContext = new ManualTracingTool.DrawPathContext();
            this.lazyDraw_ProcessedIndex = 0;
            this.drawPath_logging = true;
            // Subtool window
            this.subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            this.subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);
        }
        // Backward interface implementations
        isWhileLoading() {
            return (this.mainProcessState == MainProcessStateID.systemResourceLoading
                || this.mainProcessState == MainProcessStateID.documentResourceLoading);
        }
        setDefferedWindowResize() {
            this.isDeferredWindowResizeWaiting = true;
        }
        isEventDisabled() {
            if (this.isWhileLoading()) {
                return true;
            }
            if (this.isModalShown()) {
                return true;
            }
            return false;
        }
        resetDocument() {
            let documentData = this.createDefaultDocumentData();
            this.initializeContext(documentData);
            this.updateLayerStructure();
            this.setCurrentLayer(null);
            this.setCurrentFrame(0);
            this.setCurrentLayer(documentData.rootLayer.childLayers[0]);
            this.setHeaderDefaultDocumentFileName();
            this.toolEnv.setRedrawAllWindows();
        }
        saveDocument() {
            let documentData = this.toolContext.document;
            let filePath = this.getInputElementText(this.ID.fileName);
            if (StringIsNullOrEmpty(filePath)) {
                this.showMessageBox('ファイル名が指定されていません。');
                return;
            }
            this.saveDocumentData(filePath, documentData, false);
            this.saveSettings();
            this.showMessageBox('保存しました。');
        }
        onLayerPropertyModalClosed() {
            this.updateLayerStructureInternal(true, true, true, true);
            this.prepareDrawPathBuffers();
        }
        // Initializing devices not depending media resoures
        onInitializeSystemDevices() {
            this.loadSettings();
            this.initializeViewDevices();
            this.initializeDrawingDevices();
            this.layerWindow_CaluculateLayout(this.layerWindow);
            this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            this.palletSelector_CaluculateLayout();
            this.startLoadingSystemResources();
        }
        // Loading system resources
        startLoadingSystemResources() {
            // Start loading
            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);
            for (let imageResource of this.imageResurces) {
                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
            this.mainProcessState = MainProcessStateID.systemResourceLoading;
        }
        processLoadingSystemResources() {
            // Check loading states
            if (!this.modelFile.loaded) {
                return;
            }
            for (let imageResource of this.imageResurces) {
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            if (this.localSetting.lastUsedFilePaths.length == 0
                && StringIsNullOrEmpty(this.localSetting.lastUsedFilePaths[0])) {
                let newDocument = this.createDefaultDocumentData();
                this.start(newDocument);
            }
            else {
                let lastURL = this.localSetting.lastUsedFilePaths[0];
                let newDocument = new ManualTracingTool.DocumentData();
                this.startLoadingDocumentURL(newDocument, lastURL);
                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, newDocument);
                this.setHeaderDocumentFileName(lastURL);
            }
        }
        // Loading document resources
        setDocumentLoadingState(state, documentData) {
            this.mainProcessState = state;
            this.loadingDocument = documentData;
        }
        startReloadDocument() {
            let documentData = new ManualTracingTool.DocumentData();
            let fileName = this.getInputElementText(this.ID.fileName);
            this.startLoadingDocumentURL(documentData, fileName);
            this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
        }
        startReloadDocumentFromFile(file, url) {
            if (StringIsNullOrEmpty(url) && file == null) {
                throw ('both of url and file are null or empty');
            }
            // Get document type from name
            let fileType = this.getDocumentFileTypeFromName(url);
            if (fileType == ManualTracingTool.DocumentFileType.none) {
                console.log('error: not supported file type.');
                return;
            }
            if (fileType == ManualTracingTool.DocumentFileType.json && !StringIsNullOrEmpty(url)) {
                let documentData = new ManualTracingTool.DocumentData();
                this.startLoadingDocumentURL(documentData, url);
                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
            }
            else if (fileType == ManualTracingTool.DocumentFileType.ora && file != null) {
                let documentData = new ManualTracingTool.DocumentData();
                this.startLoadDocumentOraFile(documentData, file, url);
                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
            }
            else {
                console.log('error: not supported file type.');
                return;
            }
        }
        startReloadDocumentFromText(documentData, textData, filePath) {
            let data = JSON.parse(textData);
            this.storeLoadedDocumentJSON(documentData, data, filePath);
        }
        processLoadingDocumentJSON() {
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
        }
        startLoadingDocumentResourcesProcess(document) {
            this.startLoadingDocumentResources(document);
            this.setDocumentLoadingState(MainProcessStateID.documentResourceLoading, this.loadingDocument);
        }
        processLoadingDocumentResources() {
            // Check loading states
            for (let imageResource of this.loadingDocumentImageResources) {
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
        }
        startLoadingDocumentResources(document) {
            this.loadingDocumentImageResources = new List();
            for (let layer of document.rootLayer.childLayers) {
                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        }
        startLoadingDocumentResourcesRecursive(layer, loadingDocumentImageResources) {
            if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                // Create an image resource
                let ifrLayer = layer;
                if (ifrLayer.imageResource == null) {
                    ifrLayer.imageResource = new ManualTracingTool.ImageResource();
                }
                // Load an image file
                let imageResource = ifrLayer.imageResource;
                if (!imageResource.loaded && !StringIsNullOrEmpty(ifrLayer.imageFilePath)) {
                    let refFileBasePath = this.localSetting.referenceDirectoryPath;
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
            for (let chldLayer of layer.childLayers) {
                this.startLoadingDocumentResourcesRecursive(chldLayer, loadingDocumentImageResources);
            }
        }
        loadTexture(imageResource, url) {
            let image = new Image();
            imageResource.image.imageData = image;
            image.addEventListener('load', () => {
                if (imageResource.isGLTexture) {
                    this.posing3DViewRender.initializeImageTexture(imageResource.image);
                }
                imageResource.loaded = true;
                imageResource.image.width = image.width;
                imageResource.image.height = image.height;
            });
            image.src = url;
        }
        loadModels(modelFile, url) {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.addEventListener('load', (e) => {
                let data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                for (let modelData of data.static_models) {
                    let modelResource = new ManualTracingTool.ModelResource();
                    modelResource.modelName = modelData.name;
                    this.posing3DViewRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float
                    modelFile.modelResources.push(modelResource);
                    modelFile.modelResourceDictionary[modelData.name] = modelResource;
                }
                for (let modelData of data.skin_models) {
                    modelFile.posingModelDictionary[modelData.name] = this.createPosingModel(modelData);
                }
                modelFile.loaded = true;
            });
            xhr.send();
        }
        // Starting ups after loading resources
        start(documentData) {
            this.initializeContext(documentData);
            this.initializeTools();
            this.initializeViewState();
            this.drawPalletColorMixer(this.colorMixerWindow_colorCanvas);
            this.drawPalletColorMixer(this.palletColorModal_colorCanvas);
            this.updateLayerStructureInternal(true, true, false, false);
            this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);
            this.setCurrentOperationUnitID(this.toolContext.operationUnitID);
            this.setCurrentFrame(0);
            this.setCurrentLayer(documentData.rootLayer.childLayers[0]);
            this.updateLayerStructureInternal(false, false, true, true);
            this.toolEnv.updateContext();
            // 初回描画
            this.resizeWindowsAndBuffers(); // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。
            this.updateHeaderButtons();
            this.updateFooterMessage();
            this.toolEnv.setRedrawAllWindows();
            this.setEvents();
            this.mainProcessState = MainProcessStateID.running;
        }
        initializeContext(documentData) {
            this.toolContext = new ManualTracingTool.ToolContext();
            this.toolContext.mainEditor = this;
            this.toolContext.drawStyle = this.drawStyle;
            this.toolContext.commandHistory = new ManualTracingTool.CommandHistory();
            this.toolContext.document = documentData;
            this.toolContext.mainWindow = this.mainWindow;
            //this.toolContext.pickingWindow = this.pickingWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;
            this.toolEnv = new ManualTracingTool.ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ManualTracingTool.ToolDrawingEnvironment();
            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);
        }
        onWindowBlur() {
            console.log('Window blur');
            if (this.mainProcessState == MainProcessStateID.running) {
                this.mainProcessState = MainProcessStateID.pause;
                console.log('  mainProcessState -> pause');
            }
        }
        onWindowFocus() {
            console.log('Window focus');
            if (this.mainProcessState == MainProcessStateID.pause) {
                this.mainProcessState = MainProcessStateID.running;
                console.log('  mainProcessState -> running');
            }
        }
        // Continuous processes
        run() {
            let context = this.toolContext;
            let env = this.toolEnv;
            if (this.isDeferredWindowResizeWaiting) {
                this.isDeferredWindowResizeWaiting = false;
                this.resizeWindowsAndBuffers();
                this.toolEnv.setRedrawAllWindows();
            }
            // Process animation time
            let currentTime = Platform.getCurrentTime();
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
                let aniSetting = context.document.animationSettingData;
                aniSetting.currentTimeFrame += 1;
                if (aniSetting.currentTimeFrame >= aniSetting.loopEndFrame) {
                    aniSetting.currentTimeFrame = aniSetting.loopStartFrame;
                }
                this.setCurrentFrame(aniSetting.currentTimeFrame);
                env.setRedrawMainWindow();
                env.setRedrawTimeLineWindow();
            }
        }
        resizeWindowsAndBuffers() {
            this.resizeWindows();
            this.prepareDrawPathBuffers();
        }
        // Document data operations
        updateLayerStructure() {
            this.updateLayerStructureInternal(true, true, true, true);
            this.prepareDrawPathBuffers();
        }
        updateLayerStructureInternal(updateLayerWindowItems, updateViewKeyframes, updateHierarchicalStates, updateDrawPash) {
            let documentData = this.toolContext.document;
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
        }
        setHeaderDefaultDocumentFileName() {
            let fileName = ManualTracingTool.DocumentLogic.getDefaultDocumentFileName(this.localSetting);
            this.setHeaderDocumentFileName(fileName);
        }
        getPosingModelByName(name) {
            return this.modelFile.posingModelDictionary[name];
        }
        draw() {
            let isDrawingExist = false;
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
                this.clearWindow(this.subtoolWindow);
                this.subtoolWindow_Draw(this.subtoolWindow);
                this.toolContext.redrawSubtoolWindow = false;
            }
            if (this.toolContext.redrawPalletSelectorWindow) {
                this.clearWindow(this.palletSelectorWindow);
                this.drawPalletSelectorWindow();
                this.toolContext.redrawPalletSelectorWindow = false;
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
        }
        collectDrawPaths() {
            let documentData = this.toolContext.document;
            let drawPathSteps = new List();
            // Insert a step for begin
            {
                let drawPathStep = new ManualTracingTool.DrawPathStep();
                drawPathStep.layer = documentData.rootLayer;
                drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.beginDrawing);
                drawPathSteps.push(drawPathStep);
            }
            // Collect virtual-grouped layer info
            let vLayers = new List();
            this.collectDrawPaths_CollectVirtualLayerRecursive(vLayers, documentData.rootLayer.childLayers);
            // Collect steps recursive
            this.collectDrawPasths_CollectPathRecursive(drawPathSteps, vLayers);
            // Insert a step for end
            {
                let drawPathStep = new ManualTracingTool.DrawPathStep();
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
        }
        collectDrawPaths_CollectVirtualLayerRecursive(result, layers) {
            for (let i = 0; i < layers.length; i++) {
                let layer = layers[i];
                let vLayer = new ManualTracingTool.TempVirtualLayer();
                vLayer.type = ManualTracingTool.TempVirtualLayerTypeID.normal;
                vLayer.layer = layer;
                this.collectDrawPaths_CollectVirtualLayerRecursive(vLayer.children, layer.childLayers);
                if (layer.isMaskedByBelowLayer) {
                    // Creates vitual group, inserts the layer and following layers into the group
                    let virtualGroup_vLayer = new ManualTracingTool.TempVirtualLayer();
                    virtualGroup_vLayer.type = ManualTracingTool.TempVirtualLayerTypeID.virtualGroup;
                    virtualGroup_vLayer.layer = layer;
                    // the layer
                    virtualGroup_vLayer.children.push(vLayer);
                    // following layers
                    let nextIndex = i + 1;
                    while (nextIndex < layers.length) {
                        let nextLayer = layers[nextIndex];
                        let next_vLayer = new ManualTracingTool.TempVirtualLayer();
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
        }
        collectDrawPasths_CollectPathRecursive(result, vLayers) {
            let isGPUDrawContinuing = false;
            for (let i = vLayers.length - 1; i >= 0; i--) {
                let vLayer = vLayers[i];
                if (vLayer.type == ManualTracingTool.TempVirtualLayerTypeID.virtualGroup
                    || vLayer.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                    // Insert a step to begin buffering
                    {
                        let drawPathStep = new ManualTracingTool.DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.prepareBuffer);
                        drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                        result.push(drawPathStep);
                    }
                    // Insert steps for group children
                    this.collectDrawPasths_CollectPathRecursive(result, vLayer.children);
                    // insert a step to finish buffering
                    {
                        let drawPathStep = new ManualTracingTool.DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.flushBuffer);
                        result.push(drawPathStep);
                    }
                }
                else if (ManualTracingTool.VectorLayer.isVectorLayer(vLayer.layer)) {
                    let vectorLayer = vLayer.layer;
                    // Insert a step to draw line
                    if (vectorLayer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                        // Insert a step to clear gl buffer
                        if (!isGPUDrawContinuing) {
                            let drawPathStep = new ManualTracingTool.DrawPathStep();
                            drawPathStep.layer = vLayer.layer;
                            drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.prepareRendering);
                            result.push(drawPathStep);
                        }
                        // Insert a step to draw
                        {
                            let drawPathStep = new ManualTracingTool.DrawPathStep();
                            drawPathStep.layer = vLayer.layer;
                            drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.drawForeground);
                            drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                            result.push(drawPathStep);
                        }
                        // Insert a step to flush gl buffer
                        isGPUDrawContinuing = false;
                        if (vectorLayer.fillAreaType == ManualTracingTool.FillAreaTypeID.none && i > 0) {
                            let next_layer = vLayers[i - 1].layer;
                            if (ManualTracingTool.VectorLayer.isVectorLayer(next_layer)) {
                                let next_vectorLayer = next_layer;
                                if (next_vectorLayer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                                    isGPUDrawContinuing = true;
                                }
                            }
                        }
                        if (!isGPUDrawContinuing) {
                            let drawPathStep = new ManualTracingTool.DrawPathStep();
                            drawPathStep.layer = vLayer.layer;
                            drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.flushRendering);
                            drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                            result.push(drawPathStep);
                        }
                    }
                    // Insert a step to draw fill
                    if (vectorLayer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        let drawPathStep = new ManualTracingTool.DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.drawBackground);
                        result.push(drawPathStep);
                    }
                }
                else {
                    let drawPathStep = new ManualTracingTool.DrawPathStep();
                    drawPathStep.layer = vLayer.layer;
                    drawPathStep.setType(ManualTracingTool.DrawPathOperationTypeID.drawForeground);
                    result.push(drawPathStep);
                }
            }
        }
        collectDrawPasths_CollectSelectionInfo(drawPathContext) {
            let firstSelectedIndex = -1;
            let lastSelectedIndex = -1;
            let bufferNestStartIndex = -1;
            let bufferNestLevel = 0;
            let isSelectedNest = false;
            for (let i = 0; i < drawPathContext.steps.length; i++) {
                let drawPathStep = drawPathContext.steps[i];
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
            console.log('CollectSelectionInfo', firstSelectedIndex, lastSelectedIndex);
        }
        collectDrawPasths_CollectViewKeyframe(drawPathSteps, viewKeyframeLayers) {
            for (let drawPathStep of drawPathSteps) {
                drawPathStep.viewKeyframeLayer = null;
                for (let viewKeyframeLayer of viewKeyframeLayers) {
                    if (viewKeyframeLayer.layer == drawPathStep.layer) {
                        drawPathStep.viewKeyframeLayer = viewKeyframeLayer;
                        break;
                    }
                }
            }
        }
        prepareDrawPathBuffers() {
            let baseCanvasWindow = this.mainWindow;
            if (this.prepareDrawPathBuffers_IsChanged(this.lazy_DrawPathContext.lazyDraw_Buffer, baseCanvasWindow)) {
                this.lazy_DrawPathContext.lazyDraw_Buffer = this.prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow);
            }
            for (let drawPathStep of this.drawPathContext.steps) {
                if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.prepareBuffer) {
                    if (this.prepareDrawPathBuffers_IsChanged(drawPathStep.layer.bufferCanvasWindow, baseCanvasWindow)) {
                        drawPathStep.layer.bufferCanvasWindow = this.prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow);
                    }
                }
            }
        }
        prepareDrawPathBuffers_IsChanged(bufferCanvasWindow, baseCanvasWindow) {
            return (bufferCanvasWindow == null
                || bufferCanvasWindow.width != baseCanvasWindow.width
                || bufferCanvasWindow.height != baseCanvasWindow.height);
        }
        prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow) {
            let canvasWindow = new ManualTracingTool.CanvasWindow();
            canvasWindow.createCanvas();
            canvasWindow.setCanvasSize(baseCanvasWindow.width, baseCanvasWindow.height);
            canvasWindow.initializeContext();
            return canvasWindow;
        }
        drawMainWindow(canvasWindow, redrawActiveLayerOnly) {
            if (this.currentViewKeyframe == null) {
                return;
            }
            let env = this.toolEnv;
            let drawPathContext = this.drawPathContext;
            // TODO: 必要なときだけ実行する
            this.collectDrawPasths_CollectSelectionInfo(drawPathContext);
            let currentLayerOnly = (this.selectCurrentLayerAnimationTime > 0.0);
            let isModalToolRunning = this.isModalToolRunning();
            let isFullRendering = false;
            let activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex;
            let activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex;
            let maxStepIndex = drawPathContext.steps.length - 1;
            drawPathContext.drawPathModeID = ManualTracingTool.DrawPathModeID.editor;
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
            // Draw edit mode ui
            if (env.isEditMode()) {
                this.drawMainWindow_drawEditMode(canvasWindow, this.currentViewKeyframe, isFullRendering, currentLayerOnly, isModalToolRunning);
            }
        }
        drawMainWindow_drawPathStepsToBuffer(canvasWindow, bufferCanvasWindow, drawPathContext, activeLayerBufferDrawn) {
            // Draw layers to buffer if requested
            if (!activeLayerBufferDrawn) {
                this.clearWindow(bufferCanvasWindow);
                canvasWindow.copyTransformTo(bufferCanvasWindow);
                this.drawDrawPaths(bufferCanvasWindow, drawPathContext, true);
                //console.log('drawPathStepsToBuffer', drawPathContext.startIndex, drawPathContext.endIndex);
            }
            // Draw layers from buffer
            this.drawFullWindowImage(canvasWindow, bufferCanvasWindow);
            //this.canvasRender.setContext(bufferCanvasWindow);
            //this.canvasRender.resetTransform();
            //this.canvasRender.setFillColor(1.0, 0.0, 0.0, 0.5);
            //this.canvasRender.fillRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
            //this.canvasRender.setContext(canvasWindow);
            //this.canvasRender.resetTransform();
            //this.canvasRender.drawImage(bufferCanvasWindow.canvas
            //    , 0, 0, bufferCanvasWindow.width, bufferCanvasWindow.height
            //    , 0, 0, canvasWindow.width, canvasWindow.height);
        }
        drawMainWindow_drawEditMode(canvasWindow, viewKeyframe, isFullRendering, currentLayerOnly, isModalToolRunning) {
            this.canvasRender.setContext(canvasWindow);
            let documentData = this.toolContext.document;
            let drawStrokes = !isFullRendering;
            let drawPoints = true;
            for (let i = viewKeyframe.layers.length - 1; i >= 0; i--) {
                let viewKeyFrameLayer = viewKeyframe.layers[i];
                let layer = viewKeyFrameLayer.layer;
                if (currentLayerOnly) {
                    if (layer != this.selectCurrentLayerAnimationLayer) {
                        continue;
                    }
                }
                else {
                    if (!ManualTracingTool.Layer.isVisible(layer)) {
                        continue;
                    }
                }
                if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    let vectorLayer = layer;
                    this.drawVectorLayerForEditMode(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData, drawStrokes, drawPoints, isModalToolRunning);
                }
            }
        }
        drawDrawPaths(canvasWindow, drawPathContext, clearState) {
            let bufferCanvasWindow = canvasWindow;
            let startTime = Platform.getCurrentTime();
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
                console.log('[DrawPath] start clearState', clearState);
            }
            for (let i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {
                let drawPathStep = drawPathContext.steps[i];
                drawPathContext.lastDrawPathIndex = i;
                let viewKeyFrameLayer = drawPathStep.viewKeyframeLayer;
                let layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null;
                if (this.drawPath_logging) {
                    console.log('[DrawPath]', i, drawPathStep._debugText, layer ? layer.name : '', 'stack:', drawPathContext.bufferStack.length);
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
                        if (drawPathContext.isFullRendering() && ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                            // GPU rendering
                            this.renderForeground_VectorLayer(bufferCanvasWindow, viewKeyFrameLayer, this.toolContext.document, drawPathContext.isModalToolRunning);
                        }
                        else {
                            // CPU drawing
                            this.drawForeground(viewKeyFrameLayer, this.toolContext.document, drawPathContext.isFullRendering(), drawPathContext.isModalToolRunning);
                        }
                    }
                    else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.drawBackground) {
                        this.drawBackground(viewKeyFrameLayer, this.toolContext.document, drawPathContext.isFullRendering(), drawPathContext.isModalToolRunning);
                    }
                    this.canvasRender.setCompositeOperation('source-over');
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.prepareRendering) {
                    if (drawPathContext.isFullRendering()) {
                        this.renderClearBuffer();
                    }
                }
                else if (drawPathStep.operationType == ManualTracingTool.DrawPathOperationTypeID.flushRendering) {
                    if (drawPathContext.isFullRendering()) {
                        let renderCanvasWindow = this.drawGPUWindow;
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
                    let before_BufferCanvasWindow = drawPathContext.bufferStack.pop();
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
                let lastTime = Platform.getCurrentTime();
                if (lastTime - startTime >= drawPathContext.lazyDraw_MaxTime
                    || i == drawPathContext.endIndex) {
                    drawPathContext.bufferStack.push(bufferCanvasWindow);
                    break;
                }
            }
        }
        drawDrawPaths_isLayerDrawTarget(layer, currentLayerOnly) {
            if (currentLayerOnly) {
                if (layer != this.selectCurrentLayerAnimationLayer) {
                    return false;
                }
            }
            else {
                if (!ManualTracingTool.Layer.isVisible(layer)) {
                    return false;
                }
            }
            return true;
        }
        drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep) {
            if (!drawPathContext.currentLayerOnly) {
                this.canvasRender.setCompositeOperation(drawPathStep.compositeOperation);
            }
            else {
                this.canvasRender.setCompositeOperation('source-over');
            }
        }
        drawLayers(canvasWindow, startIndex, endIndex, isExporting, currentLayerOnly, isModalToolRunning) {
            this.canvasRender.setContext(canvasWindow);
            for (let i = startIndex; i >= endIndex; i--) {
                let viewKeyFrameLayer = this.currentViewKeyframe.layers[i];
                let layer = viewKeyFrameLayer.layer;
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
        }
        lazyDraw_Process(drawPathContext, isMainDrawingExist) {
            let canvasWindow = drawPathContext.lazyDraw_Buffer;
            let env = this.toolEnv;
            // Rest or skip process
            if (isMainDrawingExist) {
                drawPathContext.resetLazyDrawProcess();
                return;
            }
            if (drawPathContext.isLazyDrawFinished()) {
                return;
            }
            if (drawPathContext.isLazyDrawWaiting()) {
                return;
            }
            let clearState = drawPathContext.isLazyDrawBigining();
            console.log(`lazyDraw from ${drawPathContext.lazyDraw_ProcessedIndex} clear: ${clearState} stack: ${drawPathContext.bufferStack.length}`);
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
                    console.log('lazyDraw finished', drawPathContext.lazyDraw_ProcessedIndex);
                    this.clearWindow(this.mainWindow);
                    //this.drawFullWindowImage(this.mainWindow, canvasWindow);
                    this.canvasRender.resetTransform();
                    this.canvasRender.drawImage(canvasWindow.canvas, 0, 0, this.mainWindow.width, this.mainWindow.height, 0, 0, this.mainWindow.width, this.mainWindow.height);
                    if (env.isEditMode()) {
                        this.drawMainWindow_drawEditMode(this.mainWindow, this.currentViewKeyframe, true, false, false);
                    }
                }
            }
            else {
                drawPathContext.lazyDraw_ProcessedIndex = drawPathContext.steps.length;
            }
        }
        drawEditorWindow(editorWindow, mainWindow) {
            let context = this.toolContext;
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
        }
        drawExportImage(canvasWindow) {
            this.drawLayers(canvasWindow, this.currentViewKeyframe.layers.length - 1, 0, true, false, false);
        }
        drawTimeLineWindow() {
            this.drawTimeLineWindow_CommandButtons(this.timeLineWindow, this.toolContext.animationPlaying);
            this.drawTimeLineWindow_TimeLine(this.timeLineWindow, this.toolContext.document, this.viewLayerContext.keyframes, this.toolEnv.currentVectorLayer);
        }
        drawPalletSelectorWindow() {
            this.drawPalletSelectorWindow_CommandButtons(this.palletSelectorWindow);
            this.drawPalletSelectorWindow_PalletItems(this.palletSelectorWindow, this.toolContext.document, this.toolEnv.currentVectorLayer);
        }
        drawColorMixerWindow() {
            this.drawColorMixerWindow_SetInputControls();
        }
        subtoolWindow_Draw(subtoolWindow) {
            this.canvasRender.setContext(subtoolWindow);
            let context = this.toolContext;
            let currentMainTool = this.getCurrentMainTool();
            let scale = subtoolWindow.subToolItemScale;
            let fullWidth = subtoolWindow.width - 1;
            let unitWidth = subtoolWindow.subToolItemUnitWidth;
            let unitHeight = subtoolWindow.subToolItemUnitHeight;
            let lastY = 0.0;
            for (let viewItem of this.subToolViewItems) {
                let tool = viewItem.tool;
                let srcImage = tool.toolBarImage;
                if (srcImage == null) {
                    continue;
                }
                let srcY = tool.toolBarImageIndex * unitHeight;
                let dstY = viewItem.top;
                // Draw subtool image
                if (tool == this.currentTool) {
                    this.canvasRender.setFillColorV(this.subToolItemSelectedColor);
                }
                else {
                    this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
                }
                this.canvasRender.fillRect(0, dstY, fullWidth, unitHeight * scale);
                if (tool.isAvailable(this.toolEnv)) {
                    this.canvasRender.setGlobalAlpha(1.0);
                }
                else {
                    this.canvasRender.setGlobalAlpha(0.5);
                }
                this.canvasRender.drawImage(srcImage.image.imageData, 0, srcY, unitWidth, unitHeight, 0, dstY, unitWidth * scale, unitHeight * scale);
                // Draw subtool option buttons
                for (let button of viewItem.buttons) {
                    let buttonWidth = 128 * scale;
                    let buttonHeight = 128 * scale;
                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;
                    let inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == ManualTracingTool.InputSideID.front) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 0, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == ManualTracingTool.InputSideID.back) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 128, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                }
                this.canvasRender.setStrokeWidth(0.0);
                this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                this.canvasRender.drawLine(0, dstY, fullWidth, dstY);
                lastY = dstY + unitHeight * scale;
            }
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
        }
        // View operations
        onModalWindowClosed() {
            if (this.currentModalDialogID == this.ID.layerPropertyModal) {
                this.onClosedLayerPropertyModal();
                this.updateLayerStructureInternal(false, false, true, true);
            }
            else if (this.currentModalDialogID == this.ID.palletColorModal) {
                this.onClosedPalletColorModal();
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {
                this.toolContext.drawLineBaseWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineWidth, 1.0);
                this.toolContext.drawLineMinWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineMinWidth, 0.1);
                let operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, ManualTracingTool.OperationUnitID.linePoint);
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
        }
        onClosedExportImageFileModal() {
            if (this.currentModalDialogResult != this.ID.exportImageFileModal_ok) {
                return;
            }
            let fileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(fileName)) {
                return;
            }
            let backGroundType = (this.getRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, 1));
            let scale = this.getInputElementNumber(this.ID.exportImageFileModal_scale, 1.0);
            this.exportImageFile(fileName, this.toolContext.document, scale, backGroundType);
        }
        onNewLayerCommandOptionModal() {
            if (this.currentModalDialogResult != this.ID.newLayerCommandOptionModal_ok) {
                return;
            }
            var newLayerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, ManualTracingTool.NewLayerTypeID.vectorLayer);
            // Select command
            let layerCommand = null;
            if (newLayerType == ManualTracingTool.NewLayerTypeID.vectorLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
            }
            else if (newLayerType == ManualTracingTool.NewLayerTypeID.vectorLayer_Fill) {
                let command = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
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
        }
        openDocumentSettingDialog() {
            this.openDocumentSettingModal();
        }
    }
    ManualTracingTool.App_Main = App_Main;
})(ManualTracingTool || (ManualTracingTool = {}));
