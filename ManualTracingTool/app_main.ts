
declare var Custombox: any;
declare var require: any;
declare var Buffer: any;

let fs = (typeof (require) != 'undefined') ? require('fs') : {
    writeFile(fileName, text) {
        window.localStorage.setItem(fileName, text);
    }
};

namespace ManualTracingTool {

    export enum MainProcessStateID {

        none,
        startup,
        pause,
        systemResourceLoading,
        initialDocumentJSONLoading,
        initialDocumentResourceLoading,
        running,
        documentResourceLoading,
        documentJSONLoading
    }

    export class Main_Core implements MainEditor, MainEditorDrawer {

        // Main process management

        mainProcessState = MainProcessStateID.startup;
        isEventSetDone = false;
        isDeferredWindowResizeWaiting = false;
        lastTime: long = 0;
        elapsedTime: long = 0;

        // UI elements

        mainWindow = new MainWindow();
        editorWindow = new CanvasWindow();
        webglWindow = new CanvasWindow();
        pickingWindow = new PickingWindow();
        layerWindow = new LayerWindow();
        subtoolWindow = new SubtoolWindow();
        timeLineWindow = new TimeLineWindow();
        palletSelectorWindow = new PalletSelectorWindow();
        colorMixerWindow_colorCanvas = new ColorCanvasWindow();
        palletColorModal_colorCanvas = new ColorCanvasWindow();

        renderingWindow = new CanvasWindow();

        activeCanvasWindow: CanvasWindow = null;

        canvasRender = new CanvasRender();
        webGLRender = new WebGLRender();

        ID = new HTMLElementID();

        layerTypeNameDictionary: List<string> = [
            'none',
            'root',
            'ベクター レイヤー',
            'グループ レイヤー',
            '画像ファイル レイヤー',
            '３Dポーズ レイヤー',
            'ベクター参照 レイヤー'
        ];

        // Resources

        systemImage: ImageResource = null;
        subToolImages = new List<ImageResource>();
        layerButtonImage: ImageResource = null;

        // Integrated tool system

        toolContext: ToolContext = null;
        toolEnv: ToolEnvironment = null;
        toolDrawEnv: ToolDrawingEnvironment = null;

        mainTools = new List<MainTool>();

        currentTool: ToolBase = null;
        currentKeyframe: ViewKeyframe = null;
        previousKeyframe: ViewKeyframe = null;
        nextKeyframe: ViewKeyframe = null;

        //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);

        // Modal tools
        currentModalTool: ModalToolBase = null;
        modalBeforeTool: ToolBase = null;
        vectorLayer_ModalTools = List<ModalToolBase>(<int>ModalToolID.countOfID);
        imageFileReferenceLayer_ModalTools = List<ModalToolBase>(<int>ModalToolID.countOfID);

        // Document setting tools
        tool_EditDocumentFrame = new Tool_EditDocumentFrame();

        // Selection tools
        selectionTools = List<ToolBase>(<int>OperationUnitID.countOfID);
        tool_LinePointBrushSelect = new Tool_Select_BrushSelect_LinePoint();
        tool_LineSegmentBrushSelect = new Tool_Select_BrushSelect_LineSegment();
        tool_LineBrushSelect = new Tool_Select_BrushSelect_Line();
        tool_SelectAllPoints = new Tool_Select_All_LinePoint();

        // File reference layer tools
        tool_EditImageFileReference = new Tool_EditImageFileReference();
        tool_Transform_ReferenceImage_GrabMove = new Tool_Transform_ReferenceImage_GrabMove();
        tool_Transform_ReferenceImage_Rotate = new Tool_Transform_ReferenceImage_Rotate();
        tool_Transform_ReferenceImage_Scale = new Tool_Transform_ReferenceImage_Scale();

        // Transform tools
        tool_Transform_Lattice_GrabMove = new Tool_Transform_Lattice_GrabMove();
        tool_Transform_Lattice_Rotate = new Tool_Transform_Lattice_Rotate();
        tool_Transform_Lattice_Scale = new Tool_Transform_Lattice_Scale();
        tool_EditModeMain = new Tool_EditModeMain();

        // Drawing tools
        tool_DrawLine = new Tool_DrawLine();
        //tool_AddPoint = new Tool_AddPoint();
        tool_ScratchLine = new Tool_ScratchLine();
        tool_ExtrudeLine = new Tool_ScratchLineDraw();
        tool_OverWriteLineWidth = new Tool_OverWriteLineWidth();
        tool_ScratchLineWidth = new Tool_ScratchLineWidth();
        tool_ResampleSegment = new Tool_Resample_Segment();
        //tool_DeletePoints_BrushSelect = new Tool_DeletePoints_BrushSelect();
        tool_DeletePoints_BrushSelect = new Tool_DeletePoints_DivideLine();
        tool_EditLinePointWidth_BrushSelect = new Tool_HideLinePoint_BrushSelect();

        hittest_Line_IsCloseTo = new HitTest_Line_IsCloseToMouse();

        // Posing tools
        posing3dView = new Posing3DView();
        posing3DLogic = new Posing3DLogic();
        tool_Posing3d_LocateHead = new Tool_Posing3d_LocateHead();
        tool_Posing3d_RotateHead = new Tool_Posing3d_RotateHead();
        tool_Posing3d_LocateBody = new Tool_Posing3d_LocateBody();
        tool_Posing3d_LocateHips = new Tool_Posing3d_LocateHips();
        tool_Posing3d_LocateLeftShoulder = new Tool_Posing3d_LocateLeftShoulder();
        tool_Posing3d_LocateRightShoulder = new Tool_Posing3d_LocateRightShoulder();
        tool_Posing3d_LocateLeftArm1 = new Tool_Posing3d_LocateLeftArm1();
        tool_Posing3d_LocateLeftArm2 = new Tool_Posing3d_LocateLeftArm2();
        tool_Posing3d_LocateRightArm1 = new Tool_Posing3d_LocateRightArm1();
        tool_Posing3d_LocateRightArm2 = new Tool_Posing3d_LocateRightArm2();
        tool_Posing3d_LocateLeftLeg1 = new Tool_Posing3d_LocateLeftLeg1();
        tool_Posing3d_LocateLeftLeg2 = new Tool_Posing3d_LocateLeftLeg2();
        tool_Posing3d_LocateRightLeg1 = new Tool_Posing3d_LocateRightLeg1();
        tool_Posing3d_LocateRightLeg2 = new Tool_Posing3d_LocateRightLeg2();
        imageResurces = new List<ImageResource>();
        modelFile = new ModelFile();
        modelResources = new List<ModelResource>();

        // Document data
        document: DocumentData = null;
        localSetting = new LocalSetting();
        localStorage_SettingKey = 'MTT-Settings';
        localStorage_SettingIndexKey = 'MTT-Settings Index';
        tempFileNameKey = 'Manual tracing tool save data';

        loadingDocumentImageResources: List<ImageResource> = null;

        // UI states

        selectCurrentLayerAnimationLayer: Layer = null;
        selectCurrentLayerAnimationTime = 0.0;
        selectCurrentLayerAnimationTimeMax = 0.4;

        isViewLocationMoved = false;
        homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
        lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
        lastViewScale = 1.0;
        lastViewRotation = 0.0;

        // Setting values
        drawStyle = new ToolDrawingStyle();

        // Work variable
        view2DMatrix = mat4.create();
        invView2DMatrix = mat4.create();
        tempVec3 = vec3.create();
        tempVec4 = vec4.create();
        tempColor4 = vec4.create();
        tempMat4 = mat4.create();
        fromLocation = vec3.create();
        toLocation = vec3.create();
        upVector = vec3.create();

        chestInvMat4 = mat4.create();
        hipsInvMat4 = mat4.create();

        editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);

        tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        layerPickingPositions = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]];

        viewLayerContext = new ViewLayerContext();

        constructor() {

            this.modelFile.file('models.json');

            this.imageResurces.push(new ImageResource().file('texture01.png').tex(true));
            this.imageResurces.push(new ImageResource().file('system_image01.png'));
            this.imageResurces.push(new ImageResource().file('toolbar_image01.png'));
            this.imageResurces.push(new ImageResource().file('toolbar_image02.png'));
            this.imageResurces.push(new ImageResource().file('toolbar_image03.png'));
            this.imageResurces.push(new ImageResource().file('layerbar_image01.png'));

            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.subToolImages.push(this.imageResurces[3]);
            this.subToolImages.push(this.imageResurces[4]);
            this.layerButtonImage = this.imageResurces[5];
        }

        protected showMessageBox(text: string) {

            alert(text);
        }

        // Initializing devices not depending media resoures

        onInitializeSystemDevices() {

            this.loadSettings();

            this.initializeViewDevices();

            this.startLoadingSystemResources();
        }

        protected initializeViewDevices() { // @virtual
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

            if (!this.modelFile.loaded) {
                return;
            }

            for (let imageResource of this.imageResurces) {

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

                let lastURL = this.localSetting.lastUsedFilePaths[0];

                this.document = new DocumentData();
                this.startLoadingDocument(this.document, lastURL);

                this.updateHeaderDocumentFileName();
            }

            this.mainProcessState = MainProcessStateID.initialDocumentJSONLoading;
        }

        // Loading document resources

        protected startLoadingDocument(documentData: DocumentData, url: string) {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.timeout = 3000;

            xhr.addEventListener('load',
                (e: Event) => {

                    let data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }

                    this.storeLoadedDocument(documentData, data);
                }
            );

            xhr.addEventListener('timeout',
                (e: Event) => {

                    documentData.hasErrorOnLoading = true;
                }
            );

            xhr.addEventListener('error',
                (e: Event) => {

                    documentData.hasErrorOnLoading = true;
                }
            );

            xhr.send();
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

        protected startReloadDocument() {

            this.document = new DocumentData();
            this.initializeContext();

            let fileName = this.getInputElementText(this.ID.fileName);
            this.startLoadingDocument(this.document, fileName);

            this.mainProcessState = MainProcessStateID.initialDocumentJSONLoading;

            this.toolEnv.setRedrawAllWindows();
        }

        protected startReloadDocumentFromText(textData: string) {

            this.document = new DocumentData();
            this.initializeContext();

            let data = JSON.parse(textData);
            this.storeLoadedDocument(this.document, data);

            this.mainProcessState = MainProcessStateID.initialDocumentJSONLoading;

            this.toolEnv.setRedrawAllWindows();
        }

        processLoadingDocumentJSON() {

            if (this.document.hasErrorOnLoading) {

                //this.showMessageBox('ドキュメントの読み込みに失敗しました。デフォルトのドキュメントを開きます。');

                this.document = this.createDefaultDocumentData();

                this.setHeaderDefaultDocumentFileName();

                this.mainProcessState = MainProcessStateID.running;
            }

            if (!this.document.loaded) {
                return;
            }

            let info = new DocumentDataSaveInfo();
            info.modelFile = this.modelFile;

            DocumentLogic.fixLoadedDocumentData_CollectLayers_Recursive(this.document.rootLayer, info);
            DocumentLogic.fixLoadedDocumentData(this.document, info);

            this.startLoadingDocumentResources(this.document);
            this.mainProcessState = MainProcessStateID.initialDocumentResourceLoading;
        }

        // Starting ups after loading resources

        protected start() {

            this.initializeContext();
            this.initializeTools();
            this.initializeViewState();
            this.initializeModals();

            this.setCurrentMainTool(MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);

            this.setCurrentOperationUnitID(this.toolContext.operationUnitID);

            this.setCurrentFrame(0);
            this.setCurrentLayer(this.document.rootLayer.childLayers[0]);
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

        protected initializeContext() {

            this.toolContext = new ToolContext();

            this.toolContext.mainEditor = this;
            this.toolContext.drawStyle = this.drawStyle;
            this.toolContext.commandHistory = new CommandHistory();

            this.toolContext.document = this.document;

            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.pickingWindow = this.pickingWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;

            this.toolEnv = new ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ToolDrawingEnvironment();
            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);
        }

        protected initializeViewState() { // @virtual
        }

        protected initializeModals() {

        }

        protected initializeTools() {

            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);

            // Constructs main tools and sub tools structure
            this.mainTools.push(
                new MainTool().id(MainToolID.none)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.drawLine)
                    .subTool(this.tool_DrawLine, this.subToolImages[1], 0)
                    .subTool(this.tool_ExtrudeLine, this.subToolImages[1], 2)
                    .subTool(this.tool_DeletePoints_BrushSelect, this.subToolImages[1], 5)
                    .subTool(this.tool_EditLinePointWidth_BrushSelect, this.subToolImages[1], 6)
                    .subTool(this.tool_ScratchLine, this.subToolImages[1], 1)
                    .subTool(this.tool_OverWriteLineWidth, this.subToolImages[1], 3)
                    .subTool(this.tool_ScratchLineWidth, this.subToolImages[1], 3)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.posing)
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
                    .subTool(this.tool_Posing3d_LocateRightLeg2, this.subToolImages[2], 11)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.imageReferenceLayer)
                    .subTool(this.tool_EditImageFileReference, this.subToolImages[0], 1)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.misc)
                    .subTool(this.tool_EditDocumentFrame, this.subToolImages[0], 2)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.edit)
                    .subTool(this.tool_LineBrushSelect, this.subToolImages[2], 0)
                    .subTool(this.tool_LineSegmentBrushSelect, this.subToolImages[2], 0)
                    .subTool(this.tool_LinePointBrushSelect, this.subToolImages[2], 0)
                    .subTool(this.tool_EditModeMain, this.subToolImages[2], 0)
                    .subTool(this.tool_ResampleSegment, this.subToolImages[1], 4)
            );

            // Modal tools
            this.vectorLayer_ModalTools[<int>ModalToolID.none] = null;
            this.vectorLayer_ModalTools[<int>ModalToolID.grabMove] = this.tool_Transform_Lattice_GrabMove;
            this.vectorLayer_ModalTools[<int>ModalToolID.rotate] = this.tool_Transform_Lattice_Rotate;
            this.vectorLayer_ModalTools[<int>ModalToolID.scale] = this.tool_Transform_Lattice_Scale;

            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.none] = null;
            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.grabMove] = this.tool_Transform_ReferenceImage_GrabMove;
            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.rotate] = this.tool_Transform_ReferenceImage_Rotate;
            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.scale] = this.tool_Transform_ReferenceImage_Scale;

            // Selection tools
            this.selectionTools[<int>OperationUnitID.none] = null;
            this.selectionTools[<int>OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[<int>OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[<int>OperationUnitID.line] = this.tool_LineBrushSelect;

            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;
        }

        protected isEventDisabled() {

            if (this.isWhileLoading()) {
                return true;
            }

            if (this.isModalShown()) {
                return true;
            }

            return false;
        }

        protected setEvents() { // @virtual
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

        // System settings

        private loadSettings() {

            let index = window.localStorage.getItem(this.localStorage_SettingIndexKey);
            let localSettingText = window.localStorage.getItem(this.localStorage_SettingKey + index);

            if (!StringIsNullOrEmpty(localSettingText)) {

                this.localSetting = JSON.parse(localSettingText);
            }
        }

        private saveSettings() {

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

        startLoadingDocumentResourcesProcess(document: DocumentData) { // @implements MainEditor

            this.startLoadingDocumentResources(document);

            this.mainProcessState = MainProcessStateID.documentResourceLoading;
        }

        protected startLoadingDocumentResources(document: DocumentData) {

            this.loadingDocumentImageResources = new List<ImageResource>();

            for (let layer of document.rootLayer.childLayers) {

                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        }

        protected startLoadingDocumentResourcesRecursive(layer: Layer, loadingDocumentImageResources: List<ImageResource>) {

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

        processLoadingDocumentResources() {

            for (let imageResource of this.loadingDocumentImageResources) {

                if (!imageResource.loaded) {
                    return;
                }
            }

            // Loading finished
            if (this.mainProcessState == MainProcessStateID.initialDocumentResourceLoading) {

                this.start();
            }
            else {

                this.finishLayerLoading_Recursive(this.document.rootLayer);

                this.mainProcessState = MainProcessStateID.running;

                this.toolEnv.setRedrawAllWindows();
            }
        }

        protected isWhileLoading(): boolean {

            return (this.mainProcessState == MainProcessStateID.systemResourceLoading
                || this.mainProcessState == MainProcessStateID.documentResourceLoading);
        }

        loadTexture(imageResource: ImageResource, url: string) {

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

        loadModels(modelFile: ModelFile, url: string) {

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

        private createPosingModel(modelData: any): PosingModel {

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

        saveDocument() {

            let filePath = this.getInputElementText(this.ID.fileName);
            if (StringIsNullOrEmpty(filePath)) {

                this.showMessageBox('ファイル名が指定されていません。');
                return;
            }

            let info = new DocumentDataSaveInfo();
            DocumentLogic.fixSaveDocumentData_SetID_Recursive(this.document.rootLayer, info);
            DocumentLogic.fixSaveDocumentData_CopyID_Recursive(this.document.rootLayer, info);

            let copy = JSON.parse(JSON.stringify(this.document));
            DocumentLogic.fixSaveDocumentData(copy, info);

            let forceToLocalStrage = false;

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
        }

        // Layer and animation operations

        updateLayerStructure() { // @implements MainEditor

            this.collectViewContext();
            this.layerWindow_CollectItems();
            this.layerWindow_CaluculateLayout(this.layerWindow);
            //this.subtoolWindow_CollectViewItems();
            //this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            //this.palletSelector_CaluculateLayout();
        }

        collectViewContext() {

            let context = this.toolContext;
            let aniSetting = context.document.animationSettingData;

            // Collects layers

            let layers = new List<Layer>();
            Layer.collectLayerRecursive(layers, this.toolContext.document.rootLayer);

            // Creates all view-keyframes.

            let viewKeyFrames = new List<ViewKeyframe>();
            this.collectViewContext_CollectKeyframes(viewKeyFrames, layers);
            let sortedViewKeyFrames = viewKeyFrames.sort((a, b) => { return a.frame - b.frame });

            this.viewLayerContext.keyframes = sortedViewKeyFrames;

            // Collects layers for each view-keyframes

            this.collectViewContext_CollectKeyframeLayers(sortedViewKeyFrames, layers);

            // Re-set current keyframe and collects informations
            this.setCurrentFrame(context.document.animationSettingData.currentTimeFrame);

            // Prepare lattice points
            //this.calculateLatticePoints();
        }

        protected collectViewContext_CollectLayersRecursive(result: List<Layer>, parentLayer: Layer) {

            for (let layer of parentLayer.childLayers) {

                result.push(layer);

                if (layer.childLayers.length > 0) {

                    this.collectViewContext_CollectLayersRecursive(result, layer);
                }
            }
        }

        protected collectViewContext_CollectKeyframes(result: List<ViewKeyframe>, layers: List<Layer>) {

            let keyframeDictionary = new Dictionary<boolean>();

            for (let layer of layers) {

                if (VectorLayer.isVectorLayer(layer)) {

                    let vectorLayer = <VectorLayer>(layer);

                    for (let keyframe of vectorLayer.keyframes) {

                        let frameText = keyframe.frame.toString();

                        if (!DictionaryContainsKey(keyframeDictionary, frameText)) {

                            let viewKeyframe = new ViewKeyframe();
                            viewKeyframe.frame = keyframe.frame;
                            result.push(viewKeyframe);

                            keyframeDictionary[frameText] = true;
                        }
                    }
                }
            }
        }

        protected collectViewContext_CollectKeyframeLayers(result: List<ViewKeyframe>, layers: List<Layer>) {

            // All view-keyframes contains view-layer info for all layer.

            for (let viewKeyframe of result) {

                for (let layer of layers) {

                    let keyframeLayer = new ViewKeyframeLayer();
                    keyframeLayer.layer = layer;

                    if (VectorLayer.isVectorLayer(layer)) {

                        let vectorLayer = <VectorLayer>layer;

                        let max_KeyFrame: VectorLayerKeyframe = null;
                        for (let keyframe of vectorLayer.keyframes) {

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
        }

        protected findViewKeyframeIndex(frame: int): int {

            let resultIndex = 0;

            for (let index = 0; index < this.viewLayerContext.keyframes.length; index++) {

                if (this.viewLayerContext.keyframes[index].frame > frame) {
                    break;
                }

                resultIndex = index;
            }

            return resultIndex;
        }

        protected findNextViewKeyframeIndex(startFrame: int, searchDirection: int): int {

            let resultFrame = -1;

            let startKeyframeIndex = this.findViewKeyframeIndex(startFrame);

            if (startKeyframeIndex == -1) {
                return -1;
            }

            let resultIndex = startKeyframeIndex + searchDirection;

            if (resultIndex < 0) {

                return 0;
            }

            if (resultIndex >= this.viewLayerContext.keyframes.length) {

                return this.viewLayerContext.keyframes.length - 1;
            }

            return resultIndex;
        }

        protected findNextViewKeyframeFrame(startFrame: int, searchDirection: int): int {

            let resultFrame = -1;

            let keyframeIndex = this.findNextViewKeyframeIndex(startFrame, searchDirection);

            if (keyframeIndex == -1) {

                return -2;
            }
            else {

                return this.viewLayerContext.keyframes[keyframeIndex].frame;
            }
        }

        protected findViewKeyframe(frame: int): ViewKeyframe {

            let keyframeIndex = this.findViewKeyframeIndex(frame);

            if (keyframeIndex != -1) {

                return this.viewLayerContext.keyframes[keyframeIndex];
            }
            else {

                return null;
            }
        }

        protected findViewKeyframeLayerIndex(viewKeyFrame: ViewKeyframe, layer: Layer): int {

            for (let index = 0; index < viewKeyFrame.layers.length; index++) {

                if (viewKeyFrame.layers[index].layer == layer) {

                    return index;
                }
            }

            return -1;
        }

        protected findViewKeyframeLayer(viewKeyFrame: ViewKeyframe, layer: Layer): ViewKeyframeLayer {

            let index = this.findViewKeyframeLayerIndex(viewKeyFrame, layer);

            if (index != -1) {

                return viewKeyFrame.layers[index];
            }
            else {

                return null;
            }
        }

        // Tools and context operations

        protected setCurrentEditMode(editModeID: EditModeID) {

            var env = this.toolEnv;
            let context = this.toolContext;

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
        }

        protected getCurrentMainTool(): MainTool {

            return this.mainTools[<int>this.toolContext.mainToolID];
        }

        protected setCurrentMainToolForCurentLayer() {

            var env = this.toolEnv;
            env.updateContext();

            if (env.isDrawMode()) {

                if (env.isCurrentLayerVectorLayer()) {

                    this.setCurrentMainTool(MainToolID.drawLine);

                }
                else if (env.isCurrentLayerPosingLayer()) {

                    this.setCurrentMainTool(MainToolID.posing);
                }
                else if (env.isCurrentLayerImageFileReferenceLayer()) {

                    this.setCurrentMainTool(MainToolID.imageReferenceLayer);
                }
            }
            else {

                this.setCurrentMainTool(MainToolID.edit);
            }
        }

        protected setCurrentMainTool(id: MainToolID) {

            var env = this.toolEnv;
            let context = this.toolContext;

            let isChanged = (context.mainToolID != id);

            context.mainToolID = id;

            if (env.isDrawMode()) {

                context.drawMode_MainToolID = id;
            }

            let mainTool = this.getCurrentMainTool();

            this.setCurrentSubTool(mainTool.currentSubToolIndex);

            if (isChanged) {

                this.subtoolWindow.viewLocation[1] = 0.0;
                this.subtoolWindow_CollectViewItems();
                this.subtoolWindow_CaluculateLayout(this.subtoolWindow);

                this.activateCurrentTool();

                this.toolEnv.setRedrawHeaderWindow();
            }
        }

        protected setCurrentSubTool(subToolIndex: int) {

            this.cancelModalTool();

            let mainTool = this.getCurrentMainTool();

            if (this.toolContext.mainToolID != subToolIndex) {

                this.toolContext.redrawFooterWindow = true;
            }

            mainTool.currentSubToolIndex = subToolIndex;

            this.toolContext.subToolIndex = subToolIndex;

            this.currentTool = mainTool.subTools[subToolIndex];
        }

        public setCurrentOperationUnitID(operationUnitID: OperationUnitID) { // @implements MainEditor

            this.toolContext.operationUnitID = operationUnitID;
        }

        public setCurrentLayer(layer: Layer) { // @implements MainEditor

            let viewKeyframe = this.currentKeyframe;

            this.toolContext.currentLayer = layer;

            if (layer != null && VectorLayer.isVectorLayer(layer) && viewKeyframe != null) {

                let viewKeyframeLayer = this.findViewKeyframeLayer(viewKeyframe, layer);
                let geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry;

                this.toolContext.currentVectorLayer = <VectorLayer>layer;
                this.toolContext.currentVectorGeometry = geometry;
                this.toolContext.currentVectorGroup = geometry.groups[0];
            }
            else {

                this.toolContext.currentVectorLayer = null;
                this.toolContext.currentVectorGeometry = null;
                this.toolContext.currentVectorGroup = null;
            }

            if (layer != null && layer.type == LayerTypeID.posingLayer) {

                let posingLayer = <PosingLayer>layer;

                this.toolContext.currentPosingLayer = posingLayer;
                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {

                this.toolContext.currentPosingLayer = null;
                this.toolContext.currentPosingData = null;
                this.toolContext.currentPosingModel = null;
            }

            if (layer != null && layer.type == LayerTypeID.imageFileReferenceLayer) {

                let imageFileReferenceLayer = <ImageFileReferenceLayer>layer;

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
        }

        public setCurrentFrame(frame: int) { // @implements MainEditor

            let context = this.toolContext;
            let aniSetting = context.document.animationSettingData;

            let before_CurrentKeyframe = this.currentKeyframe;

            aniSetting.currentTimeFrame = frame;

            // Find current keyframe for frame

            if (aniSetting.currentTimeFrame < 0) {
                aniSetting.currentTimeFrame = 0;
            }

            if (aniSetting.currentTimeFrame > aniSetting.maxFrame) {
                aniSetting.currentTimeFrame = aniSetting.maxFrame;
            }

            let keyframeIndex = this.findViewKeyframeIndex(aniSetting.currentTimeFrame);

            if (keyframeIndex != -1) {

                this.currentKeyframe = this.viewLayerContext.keyframes[keyframeIndex];

                if (keyframeIndex - 1 >= 0) {

                    this.previousKeyframe = this.viewLayerContext.keyframes[keyframeIndex - 1];
                }
                else {

                    this.previousKeyframe = null;
                }

                if (keyframeIndex + 1 < this.viewLayerContext.keyframes.length) {

                    this.nextKeyframe = this.viewLayerContext.keyframes[keyframeIndex + 1];
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
        }

        public setLayerSelection(layer: Layer, isSelected: boolean) {

            layer.isSelected = isSelected;

            //this.collectViewContext_CollectEditTargets();
        }

        protected setLayerVisiblity(layer: Layer, isVisible: boolean) {

            layer.isVisible = isVisible;

            //this.collectViewContext_CollectEditTargets();
        }

        protected activateCurrentTool() {

            if (this.currentTool != null) {

                this.toolContext.needsDrawOperatorCursor = this.currentTool.isEditTool;

                this.currentTool.onActivated(this.toolEnv);
            }
        }

        public startModalTool(modalTool: ModalToolBase) { // @implements MainEditor

            if (modalTool == null) {

                return;
            }

            let available = modalTool.prepareModal(this.mainWindow.toolMouseEvent, this.toolEnv);

            if (!available) {

                return;
            }

            modalTool.startModal(this.toolEnv);

            this.modalBeforeTool = this.currentTool;
            this.currentModalTool = modalTool;
            this.currentTool = modalTool;
        }

        public endModalTool() { // @implements MainEditor

            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);

            this.setModalToolBefore();

            this.toolEnv.setRedrawMainWindowEditorWindow();

            this.activateCurrentTool();
        }

        public cancelModalTool() { // @implements MainEditor

            if (!this.isModalToolRunning()) {

                return;
            }

            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);

            this.setModalToolBefore();

            this.activateCurrentTool();
        }

        protected setModalToolBefore() {

            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        }

        public isModalToolRunning(): boolean { // @implements MainEditor

            return (this.currentModalTool != null);
        }

        public collectEditTargetViewKeyframeLayers(): List<ViewKeyframeLayer> { // @implements MainEditor

            let editableKeyframeLayers = new List<ViewKeyframeLayer>();

            // Collects layers

            if (this.currentKeyframe != null) {

                for (let viewKeyframeLayer of this.currentKeyframe.layers) {

                    let layer = viewKeyframeLayer.layer;

                    if (layer.isSelected && layer.isVisible) {

                        editableKeyframeLayers.push(viewKeyframeLayer);
                    }
                }
            }

            return editableKeyframeLayers;
        }

        // View operations (virtual functions)

        public openFileDialog(targetID: OpenFileDialogTargetID) { // @implements MainEditor @virtual
        }

        public openDocumentSettingDialog() { // @implements MainEditor @virtual
        }

        protected resizeWindows() { // @virtual
        }

        protected updateHeaderDocumentFileName() { // @virtual
        }

        protected setHeaderDefaultDocumentFileName() { // @virtual
        }

        protected updateHeaderButtons() { // @virtual
        }

        protected updateFooterMessage() { // @virtual
        }

        protected layerWindow_CollectItems() { // @virtual
        }

        protected layerWindow_CaluculateLayout(layerWindow: LayerWindow) { // @virtual
        }

        protected subtoolWindow_CollectViewItems() { // @virtual
        }

        protected subtoolWindow_CaluculateLayout(subtoolWindow: SubtoolWindow) { // @virtual
        }

        protected layerWindow_UnselectAllLayer() { // @virtual
        }

        protected palletSelector_CaluculateLayout() { // @virtual
        }

        protected isModalShown(): boolean { // @virtual
            return false;
        }

        // MainEditorDrawer implementations (virtual functions)

        drawMouseCursor() { // @implements MainEditorDrawer @virtual
        }

        drawMouseCursorCircle(radius: float) { // @implements MainEditorDrawer @virtual
        }

        drawEditorEditLineStroke(line: VectorLine) { // @implements MainEditorDrawer @virtual
        }

        drawEditorVectorLineStroke(line: VectorLine, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean) { // @implements MainEditorDrawer @virtual
        }

        drawEditorVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer @virtual
        }

        drawEditorVectorLinePoint(point: LinePoint, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer @virtual
        }

        drawEditorVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean) { // @implements MainEditorDrawer @virtual
        }

        // HTML helper (virtual functions)

        getInputElementText(id: string): string { // @virtual
            return null;
        }
    }
}
