
declare var Custombox: any;
declare var Buffer: any;

namespace ManualTracingTool {

    export enum MainProcessStateID {

        none,
        startup,
        pause,
        systemResourceLoading,
        documentJSONLoading,
        documentResourceLoading,
        running
    }

    export class App_Main extends App_Event implements MainEditor {

        // Main process management

        mainProcessState = MainProcessStateID.startup;
        isDeferredWindowResizeWaiting = false;
        lastTime: long = 0;
        elapsedTime: long = 0;

        loadingDocument: DocumentData = null;
        loadingDocumentImageResources: List<ImageResource> = null;

        // Backward interface implementations

        protected isWhileLoading(): boolean { // @override

            return (this.mainProcessState == MainProcessStateID.systemResourceLoading
                || this.mainProcessState == MainProcessStateID.documentResourceLoading);
        }

        protected setDefferedWindowResize() { // @override

            this.isDeferredWindowResizeWaiting = true;
        }

        protected isEventDisabled(): boolean { // @override

            if (this.isWhileLoading()) {
                return true;
            }

            if (this.isModalShown()) {
                return true;
            }

            return false;
        }

        protected resetDocument() { // @override

            let documentData = this.createDefaultDocumentData();

            this.initializeContext(documentData);

            this.updateLayerStructure();
            this.setCurrentLayer(null);
            this.setCurrentFrame(0);
            this.setCurrentLayer(documentData.rootLayer.childLayers[0]);

            this.setHeaderDefaultDocumentFileName();

            this.toolEnv.setRedrawAllWindows();
        }

        protected saveDocument() { // @override

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

        // Initializing devices not depending media resoures

        onInitializeSystemDevices() {

            this.loadSettings();

            this.initializeViewDevices();

            this.layerWindow_CaluculateLayout(this.layerWindow);
            this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            this.palletSelector_CaluculateLayout();

            this.startLoadingSystemResources();
        }

        // Loading system resources

        private startLoadingSystemResources() {

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

                let newDocument = new DocumentData();
                this.startLoadingDocumentURL(newDocument, lastURL);

                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, newDocument);

                this.setHeaderDocumentFileName(lastURL);
            }
        }

        // Loading document resources

        private setDocumentLoadingState(state: MainProcessStateID, documentData: DocumentData) {

            this.mainProcessState = state;
            this.loadingDocument = documentData;
        }

        protected startReloadDocument() { // @override

            let documentData = new DocumentData();

            let fileName = this.getInputElementText(this.ID.fileName);

            this.startLoadingDocumentURL(documentData, fileName);

            this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
        }

        protected startReloadDocumentFromFile(file: File, url: string) { // @override

            if (StringIsNullOrEmpty(url) && file == null) {

                throw ('both of url and file are null or empty');
            }

            // Get document type from name
            let fileType = this.getDocumentFileTypeFromName(url);

            if (fileType == DocumentFileType.none) {

                console.log('error: not supported file type.');
                return;
            }

            if (fileType == DocumentFileType.json && !StringIsNullOrEmpty(url)) {

                let documentData = new DocumentData();

                this.startLoadingDocumentURL(documentData, url);

                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
            }
            else if (fileType == DocumentFileType.ora && file != null) {

                let documentData = new DocumentData();

                this.startLoadDocumentOraFile(documentData, file, url);

                this.setDocumentLoadingState(MainProcessStateID.documentJSONLoading, documentData);
            }
            else {

                console.log('error: not supported file type.');
                return;
            }
        }

        protected startReloadDocumentFromText(documentData: DocumentData, textData: string, filePath: string) { // @override

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

        startLoadingDocumentResourcesProcess(document: DocumentData) { // @implements MainEditor

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

            this.finishLayerLoading_Recursive(this.loadingDocument.rootLayer);

            this.start(this.loadingDocument);

            this.loadingDocument == null;
        }

        private startLoadingDocumentResources(document: DocumentData) {

            this.loadingDocumentImageResources = new List<ImageResource>();

            for (let layer of document.rootLayer.childLayers) {

                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        }

        private startLoadingDocumentResourcesRecursive(layer: Layer, loadingDocumentImageResources: List<ImageResource>) {

            if (layer.type == LayerTypeID.imageFileReferenceLayer) {

                // Create an image resource

                let ifrLayer = <ImageFileReferenceLayer>layer;

                if (ifrLayer.imageResource == null) {

                    ifrLayer.imageResource = new ImageResource();
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

        private loadTexture(imageResource: ImageResource, url: string) {

            let image = new Image();

            imageResource.image.imageData = image;

            image.addEventListener('load',
                () => {
                    if (imageResource.isGLTexture) {
                        this.webGLRender.initializeImageTexture(imageResource.image);
                    }
                    imageResource.loaded = true;
                    imageResource.image.width = image.width;
                    imageResource.image.height = image.height;
                }
            );

            image.src = url;
        }

        private loadModels(modelFile: ModelFile, url: string) {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {

                    let data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }

                    for (let modelData of data.static_models) {

                        let modelResource = new ModelResource();
                        modelResource.modelName = modelData.name;

                        this.webGLRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float

                        modelFile.modelResources.push(modelResource);
                        modelFile.modelResourceDictionary[modelData.name] = modelResource;
                    }

                    for (let modelData of data.skin_models) {

                        modelFile.posingModelDictionary[modelData.name] = this.createPosingModel(modelData);
                    }

                    modelFile.loaded = true;
                }
            );

            xhr.send();
        }

        // Starting ups after loading resources

        protected start(documentData: DocumentData) {

            this.initializeContext(documentData);
            this.initializeTools();
            this.initializeViewState();
            this.updateLayerStructure();

            this.setCurrentMainTool(MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);

            this.setCurrentOperationUnitID(this.toolContext.operationUnitID);

            this.setCurrentFrame(0);
            this.setCurrentLayer(documentData.rootLayer.childLayers[0]);
            //this.collectViewContext_CollectEditTargets();

            this.toolEnv.updateContext();

            // 初回描画
            this.resizeWindows();   // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。

            this.updateHeaderButtons();

            this.updateFooterMessage();

            this.toolEnv.setRedrawAllWindows();

            this.setEvents();

            this.mainProcessState = MainProcessStateID.running;
        }

        protected initializeContext(documentData: DocumentData) {

            this.toolContext = new ToolContext();

            this.toolContext.mainEditor = this;
            this.toolContext.drawStyle = this.drawStyle;
            this.toolContext.commandHistory = new CommandHistory();

            this.toolContext.document = documentData;

            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.pickingWindow = this.pickingWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;

            this.toolEnv = new ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ToolDrawingEnvironment();
            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);
        }

        private resetContext(documentData: DocumentData) {

            this.initializeContext(documentData);
        }

        protected onWindowBlur() { // @override

            console.log('Window blur');

            if (this.mainProcessState == MainProcessStateID.running) {

                this.mainProcessState = MainProcessStateID.pause;
                console.log('  mainProcessState -> pause');
            }
        }

        protected onWindowFocus() { // @virtual

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

                this.resizeWindows();

                this.toolEnv.setRedrawAllWindows();
            }

            // Process animation time

            let currentTime = (new Date().getTime());
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

        // Document data operations

        updateLayerStructure() { // @override @implements MainEditor

            let documentData = this.toolContext.document;

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

        private setHeaderDefaultDocumentFileName() {

            let fileName = DocumentLogic.getDefaultDocumentFileName(this.localSetting);
            this.setHeaderDocumentFileName(fileName);
        }

        // Main drawing process

        draw() {

            this.toolEnv.updateContext();

            this.updateFooterText();

            if (this.toolContext.redrawMainWindow) {

                this.drawMainWindow(this.mainWindow, this.toolContext.redrawCurrentLayer);

                this.toolContext.redrawMainWindow = false;
                this.toolContext.redrawCurrentLayer = false;

                if (this.selectCurrentLayerAnimationTime > 0.0) {

                    this.toolEnv.setRedrawMainWindow();
                }
            }

            if (this.toolContext.redrawEditorWindow) {

                this.toolContext.redrawEditorWindow = false;

                this.clearWindow(this.editorWindow);

                this.drawEditorWindow(this.editorWindow, this.mainWindow);
            }

            if (this.toolContext.redrawLayerWindow) {

                this.toolContext.redrawLayerWindow = false;

                this.clearWindow(this.layerWindow);
                this.drawLayerWindow(this.layerWindow);
            }

            if (this.toolContext.redrawSubtoolWindow) {

                this.toolContext.redrawSubtoolWindow = false;

                this.clearWindow(this.subtoolWindow);
                this.subtoolWindow_Draw(this.subtoolWindow);
            }

            if (this.toolContext.redrawPalletSelectorWindow) {

                this.toolContext.redrawPalletSelectorWindow = false;

                this.clearWindow(this.palletSelectorWindow);
                this.drawPalletSelectorWindow();
            }

            if (this.toolContext.redrawColorMixerWindow) {

                this.toolContext.redrawColorMixerWindow = false;

                this.drawColorMixerWindow();
            }

            if (this.toolContext.redrawTimeLineWindow) {

                this.toolContext.redrawTimeLineWindow = false;

                this.clearWindow(this.timeLineWindow);
                this.drawTimeLineWindow();
            }

            if (this.toolContext.redrawWebGLWindow) {

                this.toolContext.redrawWebGLWindow = false;

                this.drawWebGLWindow(this.webglWindow, this.layerWindow.layerWindowItems, this.mainWindow, this.pickingWindow);
            }

            if (this.toolContext.redrawHeaderWindow) {

                this.toolContext.redrawHeaderWindow = false;
                this.updateHeaderButtons();
            }

            if (this.toolContext.redrawFooterWindow) {

                this.toolContext.redrawFooterWindow = false;
                this.updateFooterText();
            }
        }

        activeLayerBufferDrawn = false;

        drawPathContext = new DrawPathContext();

        protected collectDrawPaths() {

            let documentData = this.toolContext.document;

            let drawPathSteps = new List<DrawPathStep>();

            // insert a step for begining
            let drawPathStep = new DrawPathStep();
            drawPathStep.layer = documentData.rootLayer;
            drawPathStep.operationType = DrawPathOperationTypeID.beginDrawing;

            drawPathSteps.push(drawPathStep);

            // collect steps recursive
            this.collectDrawPasths_Recursive(drawPathSteps, documentData.rootLayer);

            // attach layers to paths
            this.setVirekeyframeToDrawPath(drawPathSteps, this.currentViewKeyframe.layers);

            this.drawPathContext.steps = drawPathSteps;
        }

        protected collectDrawPasths_Recursive(result: List<DrawPathStep>, parentLayer: Layer) {

            for (let i = parentLayer.childLayers.length - 1; i >= 0; i--) {

                let layer = parentLayer[i];

                let drawPathStep = new DrawPathStep();
                drawPathStep.layer = layer;

                result.push(drawPathStep);

                if (layer.type == LayerTypeID.groupLayer) {

                    // a step to begin buffering
                    drawPathStep.operationType = DrawPathOperationTypeID.prepareBuffer;

                    // insert steps for group children
                    this.collectDrawPasths_Recursive(result, layer);

                    // insert a step to finish buffering
                    let end_DrawPathStep = new DrawPathStep();
                    end_DrawPathStep.layer = layer;
                    drawPathStep.operationType = DrawPathOperationTypeID.flushBuffer;

                    result.push(end_DrawPathStep);
                }
                else {

                    drawPathStep.operationType = DrawPathOperationTypeID.draw;
                }
            }
        }

        protected setVirekeyframeToDrawPath(drawPathSteps: List<DrawPathStep>, viewKeyframeLayers: Array<ViewKeyframeLayer>) {

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

        protected drawMainWindow(canvasWindow: CanvasWindow, redrawActiveLayerOnly: boolean) { // @override

            if (this.currentViewKeyframe == null) {
                return;
            }

            let env = this.toolEnv;
            let currentLayerOnly = (this.selectCurrentLayerAnimationTime > 0.0);
            let isModalToolRunning = this.isModalToolRunning();

            let maxLayerIndex = this.currentViewKeyframe.layers.length - 1;

            // Searching edit target layers and not target layers
            let editLayerStartIndex = -1;
            let editLayerEndIndex = -1;
            if (redrawActiveLayerOnly) {

                for (let i = 0; i <= maxLayerIndex; i++) {

                    let viewKeyFrameLayer = this.currentViewKeyframe.layers[i];

                    if (viewKeyFrameLayer.layer.isSelected) {

                        if (editLayerEndIndex == -1) {

                            editLayerEndIndex = i;
                        }

                        editLayerStartIndex = i;
                    }
                }

                if (editLayerStartIndex == -1 && env.currentLayer != null) {

                    for (let i = 0; i <= maxLayerIndex; i++) {

                        let viewKeyFrameLayer = this.currentViewKeyframe.layers[i];

                        if (viewKeyFrameLayer.layer == env.currentLayer) {

                            editLayerStartIndex = i;
                            editLayerEndIndex = i;
                            break;
                        }
                    }
                }
            }

            this.clearWindow(canvasWindow);

            if (redrawActiveLayerOnly && editLayerStartIndex != -1) {

                if (editLayerStartIndex < maxLayerIndex) {

                    // Draw back layers to buffer if requested
                    if (!this.activeLayerBufferDrawn) {

                        this.mainWindow.copyTransformTo(this.backLayerRenderWindow);
                        this.clearWindow(this.backLayerRenderWindow);
                        this.drawLayers(this.backLayerRenderWindow
                            , maxLayerIndex, editLayerStartIndex + 1, false, currentLayerOnly, isModalToolRunning);
                    }

                    // Draw back layers from buffer
                    this.canvasRender.setContext(canvasWindow);
                    this.canvasRender.resetTransform();
                    this.canvasRender.drawImage(this.backLayerRenderWindow.canvas
                        , 0, 0, this.backLayerRenderWindow.width, this.backLayerRenderWindow.height
                        , 0, 0, canvasWindow.width, canvasWindow.height);
                }

                // Draw current layer
                this.drawLayers(canvasWindow, editLayerStartIndex, editLayerEndIndex, false, currentLayerOnly, isModalToolRunning);

                if (editLayerEndIndex > 0) {

                    // Draw fore layers if requested
                    if (!this.activeLayerBufferDrawn) {

                        this.mainWindow.copyTransformTo(this.foreLayerRenderWindow);
                        this.clearWindow(this.foreLayerRenderWindow);
                        this.drawLayers(this.foreLayerRenderWindow
                            , editLayerEndIndex - 1, 0, false, currentLayerOnly, isModalToolRunning);
                    }

                    // Draw fore layers from buffer
                    this.canvasRender.setContext(canvasWindow);
                    this.canvasRender.resetTransform();
                    this.canvasRender.drawImage(this.foreLayerRenderWindow.canvas
                        , 0, 0, this.foreLayerRenderWindow.width, this.foreLayerRenderWindow.height
                        , 0, 0, canvasWindow.width, canvasWindow.height);
                }

                this.activeLayerBufferDrawn = true;
            }
            else {

                this.drawLayers(canvasWindow, maxLayerIndex, 0, false, currentLayerOnly, isModalToolRunning);

                this.activeLayerBufferDrawn = false;
            }

            if (env.isEditMode()) {

                this.canvasRender.setContext(canvasWindow);

                for (let i = this.currentViewKeyframe.layers.length - 1; i >= 0; i--) {

                    let viewKeyFrameLayer = this.currentViewKeyframe.layers[i];
                    let layer = viewKeyFrameLayer.layer;

                    if (currentLayerOnly) {

                        if (layer != this.selectCurrentLayerAnimationLayer) {
                            continue;
                        }
                    }
                    else {

                        if (!layer.isHierarchicalVisible) {
                            continue;
                        }
                    }

                    this.drawLayerForEditMode(viewKeyFrameLayer, currentLayerOnly, this.toolContext.document, isModalToolRunning)
                }
            }
        }

        protected drawLayers(canvasWindow: CanvasWindow, startIndex: int, endIndex: int, isExporting: boolean, currentLayerOnly: boolean, isModalToolRunning: boolean) {

            this.canvasRender.setContext(canvasWindow);

            for (let i = startIndex; i >= endIndex; i--) {

                let viewKeyFrameLayer = this.currentViewKeyframe.layers[i];
                let layer = viewKeyFrameLayer.layer;

                if (isExporting) {

                    if (!layer.isHierarchicalVisible
                        || !layer.isRenderTarget) {
                        continue;
                    }
                }
                else if (currentLayerOnly) {

                    if (layer != this.selectCurrentLayerAnimationLayer) {
                        continue;
                    }
                }
                else {

                    if (!layer.isHierarchicalVisible) {
                        continue;
                    }
                }

                this.drawLayer(viewKeyFrameLayer, this.toolContext.document, isExporting, currentLayerOnly, isModalToolRunning)
            }
        }

        protected drawEditorWindow(editorWindow: CanvasWindow, mainWindow: CanvasWindow) {

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
                else if (context.mainToolID == MainToolID.posing) {

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

        protected drawExportImage(canvasWindow: CanvasWindow) { // @override

            this.drawLayers(canvasWindow, this.currentViewKeyframe.layers.length - 1, 0, true, false, false);
        }

        protected drawTimeLineWindow() {

            this.drawTimeLineWindow_CommandButtons(
                this.timeLineWindow,
                this.toolContext.animationPlaying);

            this.drawTimeLineWindow_TimeLine(
                this.timeLineWindow,
                this.toolContext.document,
                this.viewLayerContext.keyframes,
                this.toolEnv.currentVectorLayer
            );
        }

        protected drawPalletSelectorWindow() {

            this.drawPalletSelectorWindow_CommandButtons(
                this.palletSelectorWindow);

            this.drawPalletSelectorWindow_PalletItems(
                this.palletSelectorWindow,
                this.toolContext.document,
                this.toolEnv.currentVectorLayer);
        }

        protected drawColorMixerWindow() {

            this.drawColorMixerWindow_SetInputControls();
        }

        // Subtool window

        subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
        subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);

        private subtoolWindow_Draw(subtoolWindow: SubtoolWindow) {

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

                this.canvasRender.drawImage(srcImage.image.imageData
                    , 0, srcY, unitWidth, unitHeight
                    , 0, dstY, unitWidth * scale, unitHeight * scale);

                // Draw subtool option buttons
                for (let button of viewItem.buttons) {

                    let buttonWidth = 128 * scale;
                    let buttonHeight = 128 * scale;

                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;

                    let inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == InputSideID.front) {

                        this.canvasRender.drawImage(this.systemImage.image.imageData
                            , 0, 0, 128, 128
                            , button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == InputSideID.back) {

                        this.canvasRender.drawImage(this.systemImage.image.imageData
                            , 128, 0, 128, 128
                            , button.left, button.top, buttonWidth, buttonHeight);
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

        protected onModalWindowClosed() { // @override

            if (this.currentModalDialogID == this.ID.layerPropertyModal) {

                this.onClosedLayerPropertyModal();
            }
            else if (this.currentModalDialogID == this.ID.palletColorModal) {

                this.onClosedPalletColorModal();
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {

                this.toolContext.drawLineBaseWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineWidth, 1.0);
                this.toolContext.drawLineMinWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineMinWidth, 0.1);

                let operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, OperationUnitID.linePoint);

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

        protected onClosedExportImageFileModal() {

            if (this.currentModalDialogResult != this.ID.exportImageFileModal_ok) {
                return;
            }

            let fileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);

            if (StringIsNullOrEmpty(fileName)) {
                return;
            }

            let backGroundType = <DocumentBackGroundTypeID>(this.getRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, 1));
            let scale = this.getInputElementNumber(this.ID.exportImageFileModal_scale, 1.0);

            this.exportImageFile(fileName, this.toolContext.document, scale, backGroundType);
        }

        protected onNewLayerCommandOptionModal() {

            if (this.currentModalDialogResult != this.ID.newLayerCommandOptionModal_ok) {

                return;
            }

            var newLayerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, NewLayerTypeID.vectorLayer);

            // Select command

            let layerCommand: Command_Layer_CommandBase = null;

            if (newLayerType == NewLayerTypeID.vectorLayer) {

                layerCommand = new Command_Layer_AddVectorLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.vectorLayer_Fill) {

                let command = new Command_Layer_AddVectorLayerToCurrentPosition();
                command.createForFillColor = true;

                layerCommand = command;
            }
            else if (newLayerType == NewLayerTypeID.vectorLayerReferenceLayer) {

                layerCommand = new Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.groupLayer) {

                layerCommand = new Command_Layer_AddGroupLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.posingLayer) {

                layerCommand = new Command_Layer_AddPosingLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.imageFileReferenceLayer) {

                layerCommand = new Command_Layer_AddImageFileReferenceLayerToCurrentPosition();
            }

            if (layerCommand == null) {

                return;
            }

            // Execute command

            this.executeLayerCommand(layerCommand);
        }

        public openDocumentSettingDialog() { // @implements MainEditor @override

            this.openDocumentSettingModal();
        }
    }
}
