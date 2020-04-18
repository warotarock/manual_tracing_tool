import { StringIsNullOrEmpty, int, long, List } from 'base/conversion';
import {
    DocumentData, DocumentBackGroundTypeID, DocumentFileType,
    Layer, LayerTypeID,
    VectorLayer, FillAreaTypeID, DrawLineTypeID,
    ImageFileReferenceLayer,
    PosingModel,
} from 'base/data';

import {
    MainEditor,
    MainToolID,
    ToolContext,
    ToolEnvironment, ToolDrawingEnvironment,
    DrawPathContext,
    DrawPathStep,
    DrawPathOperationTypeID,
    TempVirtualLayer,
    TempVirtualLayerTypeID,
    ViewKeyframeLayer,
    DrawPathModeID,
    OperationUnitID
} from 'base/tool';

import { CanvasWindow } from 'renders/render2d';

import {
    Command_Layer_CommandBase,
    Command_Layer_AddVectorLayerToCurrentPosition,
    Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition,
    Command_Layer_AddGroupLayerToCurrentPosition,
    Command_Layer_AddPosingLayerToCurrentPosition,
    Command_Layer_AddImageFileReferenceLayerToCurrentPosition
} from 'commands/edit_layer';

import {
    NewLayerTypeID
} from 'app/view.class';

import { ImageResource, ModelFile, ModelResource } from 'posing3d/posing3d_view';

import { App_Event } from './event';
import { Platform } from 'platform/platform';
import { DocumentLogic } from 'logics/document';
import { CommandHistory } from 'base/command';


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
    deferredWindowResizeWaitingDuration = 250;
    deferredWindowResizeWaitingEndTime = 0;
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
        this.deferredWindowResizeWaitingEndTime = Platform.getCurrentTime() + this.deferredWindowResizeWaitingDuration;
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

    protected updateForLayerProperty() { // @override

        this.updateLayerStructureInternal(true, true, true, true);

        this.prepareDrawPathBuffers();
    }

    // Initializing devices not depending media resoures

    onInitializeSystemDevices() {

        this.loadSettings();

        this.initializeViewDevices();

        this.initializeDrawingDevices();

        this.layerWindow_CaluculateLayout(this.layerWindow);
        //this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
        this.paletteSelector_CaluculateLayout();

        this.startLoadingSystemResources();
    }

    // Loading system resources

    private startLoadingSystemResources() {

        // Start loading

        this.loadModels(this.modelFile, './dist/res/' + this.modelFile.fileName);

        for (let imageResource of this.imageResurces) {

            this.loadTexture(imageResource, './dist/res/' + imageResource.fileName);
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

        if (this.toolContext != null && this.toolContext.document != null) {

            DocumentLogic.releaseDocumentResources(this.toolContext.document, this.drawGPURender.gl);

            this.toolContext.document = null;
        }

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
                    this.posing3DViewRender.initializeImageTexture(imageResource.image);
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
            () => {

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

                    this.posing3DViewRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float

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

        this.drawPaletteColorMixer(this.colorMixerWindow_colorCanvas);
        this.drawPaletteColorMixer(this.paletteColorModal_colorCanvas);

        this.updateLayerStructureInternal(true, true, false, false);

        this.setCurrentMainTool(MainToolID.drawLine);
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
    }

    protected initializeContext(documentData: DocumentData) {

        this.toolContext = new ToolContext();

        this.toolContext.mainEditor = this;
        this.toolContext.drawStyle = this.drawStyle;
        this.toolContext.commandHistory = new CommandHistory();

        this.toolContext.document = documentData;

        this.toolContext.mainWindow = this.mainWindow;
        this.toolContext.posing3DView = this.posing3dView;
        this.toolContext.posing3DLogic = this.posing3DLogic;

        this.toolContext.lazy_DrawPathContext = this.lazy_DrawPathContext;

        this.toolEnv = new ToolEnvironment(this.toolContext);
        this.toolDrawEnv = new ToolDrawingEnvironment();
        this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);

        this.lazy_DrawPathContext.resetLazyDrawProcess();
    }

    protected onWindowBlur() { // @override

        // console.log('Window blur');

        if (this.mainProcessState == MainProcessStateID.running) {

            this.mainProcessState = MainProcessStateID.pause;
            // console.log('  mainProcessState -> pause');
        }
    }

    protected onWindowFocus() { // @override

        // console.log('Window focus');

        if (this.mainProcessState == MainProcessStateID.pause) {

            this.mainProcessState = MainProcessStateID.running;
            // console.log('  mainProcessState -> running');
        }
    }

    // Continuous processes

    run() {

        let context = this.toolContext;
        let env = this.toolEnv;

        if (this.isDeferredWindowResizeWaiting
            && Platform.getCurrentTime() > this.deferredWindowResizeWaitingEndTime) {

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

    updateLayerStructure() { // @implements MainEditor

        this.updateLayerStructureInternal(true, true, true, true);

        this.prepareDrawPathBuffers();
    }

    updateLayerStructureInternal(updateLayerWindowItems: boolean, updateViewKeyframes: boolean, updateHierarchicalStates: boolean, updateDrawPash: boolean) { // @implements MainEditor

        let documentData = this.toolContext.document;

        // Update document data
        if (updateHierarchicalStates) {

            Layer.updateHierarchicalStatesRecursive(documentData.rootLayer);
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

    private setHeaderDefaultDocumentFileName() {

        let fileName = DocumentLogic.getDefaultDocumentFileName(this.localSetting);
        this.setHeaderDocumentFileName(fileName);
    }

    getPosingModelByName(name: string): PosingModel { // @implements MainEditor

        return this.modelFile.posingModelDictionary[name];
    }

    // Main drawing process

    activeLayerBufferDrawn = false;

    drawPathContext = new DrawPathContext();
    lazy_DrawPathContext = new DrawPathContext();

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

            // this.clearWindow(this.layerWindow);
            this.drawLayerWindow(this.layerWindow);

            this.uiLayerwindowRef.update(this.layerWindow.layerWindowItems);

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

        this.lazyDraw_Process(this.lazy_DrawPathContext);
    }

    protected collectDrawPaths() {

        let documentData = this.toolContext.document;

        let drawPathSteps = new List<DrawPathStep>();

        // Insert a step for begin
        {
            let drawPathStep = new DrawPathStep();
            drawPathStep.layer = documentData.rootLayer;
            drawPathStep.setType(DrawPathOperationTypeID.beginDrawing);
            drawPathSteps.push(drawPathStep);
        }

        // Collect virtual-grouped layer info
        let vLayers = new List<TempVirtualLayer>();
        this.collectDrawPaths_CollectVirtualLayerRecursive(vLayers, documentData.rootLayer.childLayers);

        // Collect steps recursive
        this.collectDrawPasths_CollectPathRecursive(drawPathSteps, vLayers);

        // Insert a step for end
        {
            let drawPathStep = new DrawPathStep();
            drawPathStep.layer = documentData.rootLayer;
            drawPathStep.setType(DrawPathOperationTypeID.endDrawing);
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

        console.log(`collectDrawPaths`);
        let stepIndex = 0;
        for (let step of this.drawPathContext.steps) {

            console.log(` ${stepIndex}: ${step._debugText} ${step.layer ? step.layer.name : step.layer}`);

            stepIndex++;
        }
    }

    protected collectDrawPaths_CollectVirtualLayerRecursive(result: List<TempVirtualLayer>, layers: List<Layer>) {

        for (let i = 0; i < layers.length; i++) {

            let layer = layers[i];

            let vLayer = new TempVirtualLayer();
            vLayer.type = TempVirtualLayerTypeID.normal;
            vLayer.layer = layer;

            this.collectDrawPaths_CollectVirtualLayerRecursive(vLayer.children, layer.childLayers);

            if (layer.isMaskedByBelowLayer) {

                // Creates vitual group, inserts the layer and following layers into the group

                let virtualGroup_vLayer = new TempVirtualLayer();
                virtualGroup_vLayer.type = TempVirtualLayerTypeID.virtualGroup;
                virtualGroup_vLayer.layer = layer;

                // the layer
                virtualGroup_vLayer.children.push(vLayer);

                // following layers
                let nextIndex = i + 1;
                while (nextIndex < layers.length) {

                    let nextLayer = layers[nextIndex];

                    let next_vLayer = new TempVirtualLayer();
                    next_vLayer.type = TempVirtualLayerTypeID.normal;
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

    protected collectDrawPasths_CollectPathRecursive(result: List<DrawPathStep>, vLayers: List<TempVirtualLayer>) {

        let isGPUDrawContinuing = false;

        for (let i = vLayers.length - 1; i >= 0; i--) {

            let vLayer = vLayers[i];

            if (vLayer.type == TempVirtualLayerTypeID.virtualGroup
                || vLayer.layer.type == LayerTypeID.groupLayer) {

                // Insert a step to begin buffering
                {
                    let drawPathStep = new DrawPathStep();
                    drawPathStep.layer = vLayer.layer;
                    drawPathStep.setType(DrawPathOperationTypeID.prepareBuffer);
                    drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
                    result.push(drawPathStep);
                }

                // Insert steps for group children
                this.collectDrawPasths_CollectPathRecursive(result, vLayer.children);

                // insert a step to finish buffering
                {
                    let drawPathStep = new DrawPathStep();
                    drawPathStep.layer = vLayer.layer;
                    drawPathStep.setType(DrawPathOperationTypeID.flushBuffer);
                    result.push(drawPathStep);
                }
            }
            else if (VectorLayer.isVectorLayer(vLayer.layer)) {

                let vectorLayer = <VectorLayer>vLayer.layer;

                // Insert a step to draw fill
                if (vectorLayer.fillAreaType != FillAreaTypeID.none) {

                    let drawPathStep = new DrawPathStep();
                    drawPathStep.layer = vLayer.layer;
                    drawPathStep.setType(DrawPathOperationTypeID.drawBackground);
                    drawPathStep.compositeOperation = this.collectDrawPasths_getCompositeOperationString(vLayer.layer);
                    result.push(drawPathStep);
                }

                // Insert steps to draw line
                if (vectorLayer.drawLineType != DrawLineTypeID.none) {

                    // Insert a step to clear gl buffer
                    if (!isGPUDrawContinuing) {

                        let drawPathStep = new DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(DrawPathOperationTypeID.prepareRendering);
                        result.push(drawPathStep);
                    }

                    // Insert a step to draw
                    {
                        let drawPathStep = new DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(DrawPathOperationTypeID.drawForeground);
                        drawPathStep.compositeOperation = this.collectDrawPasths_getCompositeOperationString(vLayer.layer);
                        result.push(drawPathStep);
                    }

                    // Insert a step to flush gl buffer if the next layer dont need draw lines
                    isGPUDrawContinuing = false;
                    if (vectorLayer.fillAreaType == FillAreaTypeID.none && i > 0) {

                        let next_layer = vLayers[i - 1].layer;

                        if (VectorLayer.isVectorLayer(next_layer)) {

                            let next_vectorLayer = <VectorLayer>next_layer;

                            if (next_vectorLayer.drawLineType != DrawLineTypeID.none
                                && next_vectorLayer.fillAreaType == FillAreaTypeID.none) {

                                isGPUDrawContinuing = true;
                            }
                        }
                    }

                    if (!isGPUDrawContinuing) {

                        let drawPathStep = new DrawPathStep();
                        drawPathStep.layer = vLayer.layer;
                        drawPathStep.setType(DrawPathOperationTypeID.flushRendering);
                        drawPathStep.compositeOperation = this.collectDrawPasths_getCompositeOperationString(vLayer.layer);
                        result.push(drawPathStep);
                    }
                }
            }
            else {

                let drawPathStep = new DrawPathStep();
                drawPathStep.layer = vLayer.layer;
                drawPathStep.setType(DrawPathOperationTypeID.drawForeground);
                result.push(drawPathStep);
            }
        }
    }

    protected collectDrawPasths_CollectSelectionInfo(drawPathContext: DrawPathContext) {

        let firstSelectedIndex = -1;
        let lastSelectedIndex = -1;

        let bufferNestStartIndex = -1;
        let bufferNestLevel = 0;
        let isSelectedNest = false;

        for (let i = 0; i < drawPathContext.steps.length; i++) {

            let drawPathStep = drawPathContext.steps[i];

            if (Layer.isSelected(drawPathStep.layer)) {

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

            if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

                if (bufferNestLevel == 0) {

                    bufferNestStartIndex = i;
                }

                bufferNestLevel++;
            }
            else if (drawPathStep.operationType == DrawPathOperationTypeID.flushBuffer) {

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
    }

    protected collectDrawPasths_CollectViewKeyframe(drawPathSteps: List<DrawPathStep>, viewKeyframeLayers: Array<ViewKeyframeLayer>) {

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

    protected collectDrawPasths_getCompositeOperationString(layer: Layer) {

        return (layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over');
    }

    protected prepareDrawPathBuffers() {

        let baseCanvasWindow = this.mainWindow;

        if (this.prepareDrawPathBuffers_IsChanged(this.lazy_DrawPathContext.lazyDraw_Buffer, baseCanvasWindow)) {

            this.lazy_DrawPathContext.lazyDraw_Buffer = this.prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow);
        }

        for (let drawPathStep of this.drawPathContext.steps) {

            if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

                if (this.prepareDrawPathBuffers_IsChanged(drawPathStep.layer.bufferCanvasWindow, baseCanvasWindow)) {

                    drawPathStep.layer.bufferCanvasWindow = this.prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow);
                }
            }
        }
    }

    protected prepareDrawPathBuffers_IsChanged(bufferCanvasWindow: CanvasWindow, baseCanvasWindow: CanvasWindow) {

        return (bufferCanvasWindow == null
            || bufferCanvasWindow.width != baseCanvasWindow.width
            || bufferCanvasWindow.height != baseCanvasWindow.height);
    }

    protected prepareDrawPathBuffers_CreateCanvasWindow(baseCanvasWindow: CanvasWindow) {

        let canvasWindow = new CanvasWindow();
        canvasWindow.createCanvas();
        canvasWindow.setCanvasSize(baseCanvasWindow.width, baseCanvasWindow.height);
        canvasWindow.initializeContext();

        return canvasWindow;
    }

    protected drawMainWindow(canvasWindow: CanvasWindow, redrawActiveLayerOnly: boolean) { // @override

        if (this.currentViewKeyframe == null) {
            return;
        }

        let env = this.toolEnv;
        let currentLayerOnly = (this.selectCurrentLayerAnimationTime > 0.0);
        let isModalToolRunning = this.isModalToolRunning();

        // Draw edit mode ui
        if (env.isDrawMode()) {

            this.drawMainWindow_drawDrawMode(canvasWindow, redrawActiveLayerOnly, currentLayerOnly, isModalToolRunning, this.toolContext.drawCPUOnly);
        }
        else if (env.isEditMode()) {

            this.drawMainWindow_drawEditMode(canvasWindow, redrawActiveLayerOnly, currentLayerOnly, isModalToolRunning);
        }
    }

    protected drawMainWindow_drawDrawMode(
        canvasWindow: CanvasWindow,
        redrawActiveLayerOnly: boolean,
        currentLayerOnly: boolean,
        isModalToolRunning: boolean,
        drawCPUOnly: boolean) {

        let drawPathContext = this.drawPathContext;

        // TODO: 必要なときだけ実行する
        this.collectDrawPasths_CollectSelectionInfo(drawPathContext);

        let isLazyDrawFinished = this.lazy_DrawPathContext.isLazyDrawFinished();

        let activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex;
        let activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex;
        let maxStepIndex = drawPathContext.steps.length - 1;

        if (isLazyDrawFinished && !isModalToolRunning && !drawCPUOnly) {

            drawPathContext.drawPathModeID = DrawPathModeID.editorPreview;
        }
        else {

            drawPathContext.drawPathModeID = DrawPathModeID.editor;
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

                this.drawMainWindow_drawPathStepsToBuffer(
                    canvasWindow
                    , this.backLayerRenderWindow
                    , drawPathContext
                    , this.activeLayerBufferDrawn
                );
            }

            // Draw current layers
            drawPathContext.startIndex = activeRangeStartIndex;
            drawPathContext.endIndex = activeRangeEndIndex;
            this.drawDrawPaths(canvasWindow, drawPathContext, true);

            // Draw fore layers
            if (activeRangeEndIndex < maxStepIndex) {

                drawPathContext.startIndex = activeRangeEndIndex + 1;
                drawPathContext.endIndex = maxStepIndex;

                this.drawMainWindow_drawPathStepsToBuffer(
                    canvasWindow
                    , this.foreLayerRenderWindow
                    , drawPathContext
                    , this.activeLayerBufferDrawn
                );
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
    }

    protected drawMainWindow_drawPathStepsToBuffer(
        canvasWindow: CanvasWindow
        , bufferCanvasWindow: CanvasWindow
        , drawPathContext: DrawPathContext
        , activeLayerBufferDrawn: boolean
    ) {
        // Draw layers to buffer if requested

        if (!activeLayerBufferDrawn) {

            this.clearWindow(bufferCanvasWindow);

            canvasWindow.copyTransformTo(bufferCanvasWindow);

            this.drawDrawPaths(bufferCanvasWindow, drawPathContext, true);
        }

        // Draw layers from buffer

        this.drawFullWindowImage(canvasWindow, bufferCanvasWindow);
    }

    protected drawMainWindow_drawEditMode(
        canvasWindow: CanvasWindow,
        redrawActiveLayerOnly: boolean,
        currentLayerOnly: boolean,
        isModalToolRunning: boolean) {

        let drawPathContext = this.drawPathContext;
        let activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex;
        let activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex;
        let maxStepIndex = drawPathContext.steps.length - 1;

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

                this.drawMainWindow_drawEditModeToBuffer(
                    canvasWindow,
                    this.backLayerRenderWindow,
                    drawPathContext,
                    this.activeLayerBufferDrawn,
                    currentLayerOnly,
                    isModalToolRunning
                );
            }

            // Draw current layers
            drawPathContext.startIndex = activeRangeStartIndex;
            drawPathContext.endIndex = activeRangeEndIndex;

            this.drawMainWindow_drawEditModeToBuffer(
                canvasWindow,
                null,
                drawPathContext,
                false,
                currentLayerOnly,
                isModalToolRunning
            );

            // Draw fore layers
            if (activeRangeEndIndex < maxStepIndex) {

                drawPathContext.startIndex = activeRangeEndIndex + 1;
                drawPathContext.endIndex = maxStepIndex;

                this.drawMainWindow_drawEditModeToBuffer(
                    canvasWindow,
                    this.foreLayerRenderWindow,
                    drawPathContext,
                    this.activeLayerBufferDrawn,
                    currentLayerOnly,
                    isModalToolRunning
                );
            }

            this.activeLayerBufferDrawn = true;
        }
        else {

            // Draw all layers
            drawPathContext.startIndex = 0;
            drawPathContext.endIndex = maxStepIndex;

            this.drawMainWindow_drawEditModeToBuffer(
                canvasWindow,
                null,
                drawPathContext,
                false,
                currentLayerOnly,
                isModalToolRunning
            );

            this.activeLayerBufferDrawn = false;
        }
    }

    protected drawMainWindow_drawEditModeToBuffer(
        canvasWindow: CanvasWindow,
        bufferCanvasWindow: CanvasWindow,
        drawPathContext: DrawPathContext,
        activeLayerBufferDrawn: boolean,
        currentLayerOnly: boolean,
        isModalToolRunning: boolean
    ) {

        let documentData = this.toolContext.document;
        let drawStrokes = true;//!isFullRendering;
        let drawPoints = true;

        if (!activeLayerBufferDrawn) {

            if (bufferCanvasWindow != null) {

                this.clearWindow(bufferCanvasWindow);

                canvasWindow.copyTransformTo(bufferCanvasWindow);
                this.canvasRender.setContextTransformByWindow(bufferCanvasWindow);
            }

            for (let i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {

                let drawPathStep = drawPathContext.steps[i];

                if (drawPathStep.operationType != DrawPathOperationTypeID.drawForeground
                    && drawPathStep.operationType != DrawPathOperationTypeID.drawBackground) {

                    continue;
                }

                let viewKeyFrameLayer = drawPathStep.viewKeyframeLayer;
                let layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null;

                //console.log('  DrawPath EditMode', i, drawPathStep._debugText, layer ? layer.name : '');

                if (currentLayerOnly) {

                    //if (layer != this.selectCurrentLayerAnimationLayer) {
                    if (!this.isdrawTargetForCurrentLayerOnly(layer)) {
                        continue;
                    }
                }
                else {

                    if (!Layer.isVisible(layer)) {
                        continue;
                    }
                }

                if (VectorLayer.isVectorLayer(layer)) {

                    let vectorLayer = <VectorLayer>layer;

                    if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

                        this.drawBackground(
                            viewKeyFrameLayer,
                            this.toolContext.document,
                            false,
                            isModalToolRunning
                        );
                    }

                    this.drawVectorLayerForEditMode(
                        vectorLayer
                        , viewKeyFrameLayer.vectorLayerKeyframe.geometry
                        , documentData
                        , drawStrokes
                        , drawPoints
                        , isModalToolRunning
                    );
                }
                else {

                    this.drawForeground(
                        viewKeyFrameLayer,
                        this.toolContext.document
                        , false,
                        drawPathContext.isModalToolRunning
                    );
                }
            }
        }

        if (bufferCanvasWindow != null) {

            this.drawFullWindowImage(canvasWindow, bufferCanvasWindow);
        }
    }

    drawPath_logging = false;

    protected drawDrawPaths(canvasWindow: CanvasWindow, drawPathContext: DrawPathContext, clearState: boolean) {

        let bufferCanvasWindow = canvasWindow;
        let startTime = Platform.getCurrentTime();
        let isFullRendering = drawPathContext.isFullRendering();

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

        for (let i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {

            let drawPathStep = drawPathContext.steps[i];

            drawPathContext.lastDrawPathIndex = i;

            let viewKeyFrameLayer = drawPathStep.viewKeyframeLayer;
            let layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null;

            if (this.drawPath_logging) {

                console.log('  DrawPath', i, drawPathStep._debugText, layer ? layer.name : '', 'stack:', drawPathContext.bufferStack.length);
            }

            if (drawPathStep.operationType == DrawPathOperationTypeID.beginDrawing) {

                this.clearWindow(canvasWindow);

                this.mainWindow.copyTransformTo(canvasWindow);
                this.canvasRender.setTransform(canvasWindow);
            }
            else if (drawPathStep.operationType == DrawPathOperationTypeID.drawForeground
                || drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

                if (drawPathContext.drawPathModeID == DrawPathModeID.export) {

                    if (!Layer.isVisible(layer) || !layer.isRenderTarget) {
                        continue;
                    }
                }
                else if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {

                    continue;
                }

                // Draw layer to current buffer
                this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep);

                if (drawPathStep.operationType == DrawPathOperationTypeID.drawForeground) {

                    if (isFullRendering && VectorLayer.isVectorLayer(layer)) {

                        // GPU rendering
                        this.mainWindow.copyTransformTo(this.drawGPUWindow);
                        this.drawGPUWindow.viewScale *= (this.drawGPUWindow.width / this.mainWindow.width);

                        this.renderForeground_VectorLayer(this.drawGPUWindow
                            , viewKeyFrameLayer
                            , this.toolContext.document
                            , drawPathContext.isModalToolRunning);
                    }
                    else {

                        // CPU drawing
                        this.drawForeground(viewKeyFrameLayer, this.toolContext.document
                            , isFullRendering, drawPathContext.isModalToolRunning);
                    }
                }
                else if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

                    this.drawBackground(viewKeyFrameLayer, this.toolContext.document
                        , isFullRendering, drawPathContext.isModalToolRunning);
                }

                this.canvasRender.setCompositeOperation('source-over');
            }
            else if (drawPathStep.operationType == DrawPathOperationTypeID.prepareRendering) {

                if (isFullRendering) {

                    this.renderClearBuffer(this.drawGPUWindow);
                }
            }
            else if (drawPathStep.operationType == DrawPathOperationTypeID.flushRendering) {

                if (isFullRendering) {

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
            else if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

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
            else if (drawPathStep.operationType == DrawPathOperationTypeID.flushBuffer) {

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

    private drawDrawPaths_isLayerDrawTarget(layer: Layer, currentLayerOnly: boolean) {

        if (currentLayerOnly) {

            if (!this.isdrawTargetForCurrentLayerOnly(layer)) {
                return false;
            }
        }
        else {

            if (!Layer.isVisible(layer)) {
                return false;
            }
        }

        return true;
    }

    private drawDrawPaths_setCompositeOperation(drawPathContext: DrawPathContext, drawPathStep: DrawPathStep) {

        if (!drawPathContext.currentLayerOnly) {

            this.canvasRender.setCompositeOperation(drawPathStep.compositeOperation);
        }
        else {

            this.canvasRender.setCompositeOperation('source-over');
        }
    }

    private isdrawTargetForCurrentLayerOnly(layer: Layer) {

        //return (layer != this.selectCurrentLayerAnimationLayer);
        return (Layer.isSelected(layer));
    }

    protected drawLayers(canvasWindow: CanvasWindow, startIndex: int, endIndex: int, isExporting: boolean, currentLayerOnly: boolean, isModalToolRunning: boolean) {

        this.canvasRender.setContext(canvasWindow);

        for (let i = startIndex; i >= endIndex; i--) {

            let viewKeyFrameLayer = this.currentViewKeyframe.layers[i];
            let layer = viewKeyFrameLayer.layer;

            if (isExporting) {

                if (!Layer.isVisible(layer) || !layer.isRenderTarget) {
                    continue;
                }
            }
            else if (currentLayerOnly) {

                if (layer != this.selectCurrentLayerAnimationLayer) {
                    continue;
                }
            }
            else {

                if (!Layer.isVisible(layer)) {
                    continue;
                }
            }

            this.drawLayerByCanvas(viewKeyFrameLayer, this.toolContext.document
                , isExporting, isModalToolRunning)
        }
    }

    protected lazyDraw_Process(drawPathContext: DrawPathContext) {

        if (this.toolContext.drawCPUOnly) {
            return;
        }

        let canvasWindow = drawPathContext.lazyDraw_Buffer;
        let env = this.toolEnv;

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

        let clearState = drawPathContext.isLazyDrawBigining();

        console.log(`LazyDraw from ${drawPathContext.lazyDraw_ProcessedIndex}${clearState ? ' clear' : ''} buffer-stack[${drawPathContext.bufferStack.length}]`);

        // Draw steps
        drawPathContext.drawPathModeID = DrawPathModeID.editorPreview;
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

                this.canvasRender.drawImage(canvasWindow.canvas
                    , 0, 0, this.mainWindow.width, this.mainWindow.height
                    , 0, 0, this.mainWindow.width, this.mainWindow.height);

                if (env.isEditMode()) {

                    this.drawMainWindow_drawEditMode(this.mainWindow, true, false, false);
                }
            }
        }
        else {

            drawPathContext.lazyDraw_ProcessedIndex = drawPathContext.steps.length;
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

    protected drawPaletteSelectorWindow() {

        this.drawPaletteSelectorWindow_CommandButtons(
            this.paletteSelectorWindow);

        this.drawPaletteSelectorWindow_PaletteItems(
            this.paletteSelectorWindow,
            this.toolContext.document,
            this.toolEnv.currentVectorLayer);
    }

    protected drawColorMixerWindow() {

        this.drawColorMixerWindow_SetInputControls();
    }

    // Subtool window

    subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
    subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);

    private subtoolWindow_Draw() {

        //this.canvasRender.setContext(subtoolWindow);

        //let context = this.toolContext;

        //let currentMainTool = this.getCurrentMainTool();

        //let scale = subtoolWindow.subToolItemScale;
        //let fullWidth = subtoolWindow.width - 1;
        //let unitWidth = subtoolWindow.subToolItemUnitWidth;
        //let unitHeight = subtoolWindow.subToolItemUnitHeight;

        //let lastY = 0.0;

        for (let viewItem of this.subToolViewItems) {

            let tool = viewItem.tool;

            //if (srcImage == null) {
            //    continue;
            //}

            // TODO: 再構築時と同じ処理をしているため共通化する
            viewItem.isAvailable = tool.isAvailable(this.toolEnv);
            if (viewItem.buttons.length > 0) {

                // TODO: 複数ボタンが必要か検討
                viewItem.buttonStateID = tool.getOptionButtonState(0, this.toolEnv);
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
    }

    // View operations

    protected onModalWindowClosed() { // @override

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
