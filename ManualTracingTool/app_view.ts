
namespace ManualTracingTool {

    export class App_View {

        // UI elements

        mainWindow = new MainWindow();
        editorWindow = new CanvasWindow();
        webglWindow = new CanvasWindow();
        layerWindow = new LayerWindow();
        subtoolWindow = new SubtoolWindow();
        timeLineWindow = new TimeLineWindow();
        palletSelectorWindow = new PalletSelectorWindow();
        colorMixerWindow_colorCanvas = new ColorCanvasWindow();
        palletColorModal_colorCanvas = new ColorCanvasWindow();

        foreLayerRenderWindow = new CanvasWindow();
        backLayerRenderWindow = new CanvasWindow();

        exportRenderWindow = new CanvasWindow();

        pickingWindow = new PickingWindow();
        posing3dView = new Posing3DView();

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

        // UI states

        selectCurrentLayerAnimationLayer: Layer = null;
        selectCurrentLayerAnimationTime = 0.0;
        selectCurrentLayerAnimationTimeMax = 0.4;

        isViewLocationMoved = false;
        homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
        lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
        lastViewScale = 1.0;
        lastViewRotation = 0.0;

        // Integrated tool system

        toolContext: ToolContext = null;
        toolEnv: ToolEnvironment = null;
        toolDrawEnv: ToolDrawingEnvironment = null;
        viewLayerContext = new ViewLayerContext();

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

        // Backward interfaces

        protected getDocument(): DocumentData { // @virtual

            return null;
        }

        protected getLocalSetting(): LocalSetting { // @virtual

            return null;
        }

        protected getCurrentMainTool(): MainTool { // @virtual

            return null;
        }

        protected getCurrentTool(): ToolBase { // @virtual

            return null;
        }

        protected isWhileLoading(): boolean { // @virtual

            return false;
        }

        protected isEventDisabled(): boolean { // @virtual

            return false;
        }

        // Initializing devices not depending media resoures

        protected initializeViewDevices() {

            this.resizeWindows();

            this.mainWindow.context = this.mainWindow.canvas.getContext('2d');
            this.editorWindow.context = this.editorWindow.canvas.getContext('2d');
            this.foreLayerRenderWindow.context = this.foreLayerRenderWindow.canvas.getContext('2d');
            this.backLayerRenderWindow.context = this.backLayerRenderWindow.canvas.getContext('2d');

            this.layerWindow.context = this.layerWindow.canvas.getContext('2d');
            this.subtoolWindow.context = this.subtoolWindow.canvas.getContext('2d');

            this.palletSelectorWindow.context = this.palletSelectorWindow.canvas.getContext('2d');
            this.colorMixerWindow_colorCanvas.context = this.colorMixerWindow_colorCanvas.canvas.getContext('2d');

            this.timeLineWindow.context = this.timeLineWindow.canvas.getContext('2d');

            this.exportRenderWindow.context = this.exportRenderWindow.canvas.getContext('2d');
            this.palletColorModal_colorCanvas.context = this.palletColorModal_colorCanvas.canvas.getContext('2d');

            this.canvasRender.setContext(this.layerWindow);
            this.canvasRender.setFontSize(18.0);

            if (this.webGLRender.initializeWebGL(this.webglWindow.canvas)) {

                throw ('３Ｄ機能を初期化できませんでした。');
            }

            this.pickingWindow.context = this.pickingWindow.canvas.getContext('2d');

            this.posing3dView.initialize(this.webGLRender, this.webglWindow, this.pickingWindow);

            this.initializeLayerWindow();
            this.initializePalletSelectorWindow();
        }

        // Starting ups after loading resources

        protected initializeViewState() {

            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;

            this.setCanvasSizeFromStyle(this.colorMixerWindow_colorCanvas);
            this.drawPalletColorMixer(this.colorMixerWindow_colorCanvas);

            this.setCanvasSizeFromStyle(this.palletColorModal_colorCanvas);
            this.drawPalletColorMixer(this.palletColorModal_colorCanvas);
        }

        // View management

        protected resizeWindows() {

            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.foreLayerRenderWindow, this.mainWindow);
            this.fitCanvas(this.backLayerRenderWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            //this.fitCanvas(this.pickingWindow, this.mainWindow); depth picking is not used now

            this.resizeCanvasToParent(this.layerWindow);
            this.resizeCanvasToParent(this.subtoolWindow);
            this.resizeCanvasToParent(this.palletSelectorWindow);
            this.resizeCanvasToParent(this.timeLineWindow);
        }

        private resizeCanvasToParent(canvasWindow: CanvasWindow) {

            canvasWindow.width = canvasWindow.canvas.parentElement.clientWidth;
            canvasWindow.height = canvasWindow.canvas.parentElement.clientHeight;

            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }

        private fitCanvas(canvasWindow: CanvasWindow, fitToWindow: CanvasWindow) {

            canvasWindow.width = fitToWindow.width;
            canvasWindow.height = fitToWindow.height;

            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }

        private setCanvasSizeFromStyle(canvasWindow: CanvasWindow) {

            let style = window.getComputedStyle(canvasWindow.canvas);
            canvasWindow.width = Number(style.width.replace('px', ''));
            canvasWindow.height = Number(style.height.replace('px', ''));

            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }

        protected processMouseEventInput(toolMouseEvent: ToolMouseEvent, e: MouseEvent, touchUp: boolean, canvasWindow: CanvasWindow) {

            this.activeCanvasWindow = canvasWindow;

            if (document.activeElement.nodeName == 'INPUT') {
                (<HTMLInputElement>document.activeElement).blur();
            }

            toolMouseEvent.button = e.button;
            toolMouseEvent.buttons = e.buttons;

            if (touchUp) {
                toolMouseEvent.button = -1;
                toolMouseEvent.buttons = 0;
            }

            // ____________| forefox | chrome        | opera         | firefox with pen
            // L down      | 0, 1    | 0, 1 and 0, 1 | 0, 1          | 0, 0
            // move with L | 0, 1    | 0, 1          | 0, 1          |
            // L up        | 0, 0    | 0, 0 and 0, 0 | 0, 0 and 0, 0 |
            // R down      | 2, 2    | 2, 2 and 2, 0 | 2, 2          | 2, 2
            // move with R | 2, 0    | 2, 0          | 2, 0          | 0, 2
            // R up        | 0, 0    | 2, 0 and 0, 0 | 0, 0          | 2, 0
            // M down      | 1, 4    | 1, 4 and 0, 4 | 1, 4          |
            // move with M | 0, 4    | 1, 0          | 0, 4          |
            // M up        | 1, 0    | 1, 0 and 0, 0 | 1, 0 and 0, 0 |
            //console.log(e.button + ', ' + e.buttons);

            toolMouseEvent.offsetX = e.offsetX;
            toolMouseEvent.offsetY = e.offsetY;
            this.calculateTransfomredMouseParams(toolMouseEvent, canvasWindow);

            toolMouseEvent.processMouseDragging();

            //console.log(e.offsetX.toFixed(2) + ',' + e.offsetY.toFixed(2) + '  ' + toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
        }

        protected getTouchInfo(toolMouseEvent: ToolMouseEvent, e: TouchEvent, touchDown: boolean, touchUp: boolean, canvasWindow: CanvasWindow) {

            this.activeCanvasWindow = canvasWindow;

            if (e.touches == undefined || e.touches.length == 0) {
                toolMouseEvent.button = 0;
                toolMouseEvent.buttons = 0;
                return;
            }

            //console.log(e.touches.length);

            var rect = canvasWindow.canvas.getBoundingClientRect();

            let touch: any = e.touches[0];

            if (!touchDown && touch.force < 0.1) {
                return;
            }

            if (touchDown) {
                toolMouseEvent.button = 0;
                toolMouseEvent.buttons = 1;
            }
            if (touchUp) {
                toolMouseEvent.button = 0;
                toolMouseEvent.buttons = 0;
            }
            toolMouseEvent.offsetX = touch.clientX - rect.left;
            toolMouseEvent.offsetY = touch.clientY - rect.top;

            this.calculateTransfomredMouseParams(toolMouseEvent, canvasWindow);

            //console.log(touch.clientX.toFixed(2) + ',' + touch.clientY.toFixed(2) + '(' + ')'  + '  ' + this.toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
        }

        protected calculateTransfomredLocation(resultVec: Vec3, canvasWindow: CanvasWindow, x: float, y: float) {

            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);

            vec3.set(this.tempVec3, x, y, 0.0);
            vec3.transformMat4(resultVec, this.tempVec3, this.invView2DMatrix);
        }

        protected calculateTransfomredMouseParams(toolMouseEvent: ToolMouseEvent, canvasWindow: CanvasWindow) {

            this.calculateTransfomredLocation(toolMouseEvent.location, canvasWindow, toolMouseEvent.offsetX, toolMouseEvent.offsetY);

            vec3.copy(this.toolEnv.mouseCursorLocation, toolMouseEvent.location);
        }

        protected getWheelInfo(toolMouseEvent: ToolMouseEvent, e: MouseEvent) {

            let wheelDelta = 0.0;
            if ('wheelDelta' in e) {

                wheelDelta = e['wheelDelta'];
            }
            else if ('deltaY' in e) {

                wheelDelta = e['deltaY'];
            }
            else if ('wheelDeltaY' in e) {

                wheelDelta = e['wheelDeltaY'];
            }

            if (wheelDelta > 0) {

                wheelDelta = 1.0;
            }
            else if (wheelDelta < 0) {

                wheelDelta = -1.0;
            }

            toolMouseEvent.wheelDelta = wheelDelta;
        }

        protected startShowingLayerItem(item: LayerWindowItem) {

            if (item != null) {

                this.selectCurrentLayerAnimationLayer = item.layer;
                this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax;
                this.toolEnv.setRedrawMainWindow();

                this.setLayerWindowViewLocationToItem(item);
            }
        }

        protected startShowingCurrentLayer() {

            let item = this.findCurrentLayerLayerWindowItem();

            this.startShowingLayerItem(item);
        }

        private copyLastViewLocation(setUpdate: boolean) {

            this.isViewLocationMoved = setUpdate;
            vec3.copy(this.lastViewLocation, this.mainWindow.viewLocation);
            this.lastViewScale = this.mainWindow.viewScale;
            this.lastViewRotation = this.mainWindow.viewRotation;
        }

        protected setViewRotation(rotation: float) {

            var env = this.toolEnv;

            this.copyLastViewLocation(true);

            if (this.mainWindow.viewRotation >= 360.0) {
                this.mainWindow.viewRotation -= 360.0;
            }
            if (this.mainWindow.viewRotation <= 0.0) {
                this.mainWindow.viewRotation += 360.0;
            }

            env.setRedrawMainWindowEditorWindow();
        }

        protected addViewScale(addScale: float) {

            var env = this.toolEnv;

            this.copyLastViewLocation(true);

            this.mainWindow.addViewScale(addScale);

            env.setRedrawMainWindowEditorWindow();
        }

        protected collectViewContext() {

            let context = this.toolContext;
            let aniSetting = context.document.animationSettingData;

            // Collects layers

            let layers = new List<Layer>();
            Layer.collectLayerRecursive(layers, this.toolContext.document.rootLayer);

            // Creates all view-keyframes.

            let viewKeyFrames = new List<ViewKeyframe>();
            this.collectViewContext_CollectKeyframes(viewKeyFrames, layers);
            let sortedViewKeyFrames = viewKeyFrames.sort((a, b) => { return a.frame - b.frame });

            // Collects layers for each view-keyframes

            this.collectViewContext_CollectKeyframeLayers(sortedViewKeyFrames, layers);

            this.viewLayerContext.keyframes = sortedViewKeyFrames;
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

        protected findNextViewKeyframeIndex(startFrame: int, searchDirection: int): int {

            let resultFrame = -1;

            let viewKeyframes = this.viewLayerContext.keyframes;

            let startKeyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, startFrame);

            if (startKeyframeIndex == -1) {
                return -1;
            }

            let resultIndex = startKeyframeIndex + searchDirection;

            if (resultIndex < 0) {

                return 0;
            }

            if (resultIndex >= viewKeyframes.length) {

                return viewKeyframes.length - 1;
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

        // Message box

        protected showMessageBox(text: string) {

            alert(text);
        }

        // Layer window

        private initializeLayerWindow() {

            let wnd = this.layerWindow;

            wnd.layerWindowCommandButtons = new List<RectangleLayoutArea>();
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.addLayer).setIcon(1));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.deleteLayer).setIcon(2));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.moveUp).setIcon(3));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(<int>LayerWindowButtonID.moveDown).setIcon(4));
        }

        protected layerWindow_CollectItems(document: DocumentData) {

            let wnd = this.layerWindow;

            wnd.layerWindowItems = new List<LayerWindowItem>();
            this.collectLayerWindowItemsRecursive(wnd.layerWindowItems, document.rootLayer, 0);

            let previousItem: LayerWindowItem = null;
            for (let item of wnd.layerWindowItems) {

                item.previousItem = previousItem;

                if (previousItem != null) {

                    previousItem.nextItem = item;
                }

                previousItem = item;
            }
        }

        private collectLayerWindowItemsRecursive(result: List<LayerWindowItem>, parentLayer: Layer, currentDepth: int) {

            let siblingItem = null;

            for (let layer of parentLayer.childLayers) {

                let item = new LayerWindowItem();
                item.layer = layer;
                item.parentLayer = parentLayer;
                item.hierarchyDepth = currentDepth;
                item.previousSiblingItem = siblingItem;

                if (siblingItem != null) {

                    siblingItem.nextSiblingItem = item;
                }

                result.push(item);

                if (layer.childLayers.length > 0) {

                    this.collectLayerWindowItemsRecursive(result, layer, currentDepth + 1);
                }

                siblingItem = item;
            }
        }

        protected findCurrentLayerLayerWindowItemIndex() {

            let wnd = this.layerWindow;

            for (let index = 0; index < wnd.layerWindowItems.length; index++) {
                let item = wnd.layerWindowItems[index];

                if (item.layer == this.toolContext.currentLayer) {

                    return index;
                }
            }

            return -1;
        }

        protected findCurrentLayerLayerWindowItem(): LayerWindowItem {

            let wnd = this.layerWindow;

            let index = this.findCurrentLayerLayerWindowItemIndex();

            if (index != -1) {

                let item = wnd.layerWindowItems[index];

                return item;
            }

            return null;
        }

        protected setLayerWindowViewLocationToItem(item: LayerWindowItem) {

            let layerWindow = this.layerWindow;

            let viewTop = layerWindow.viewLocation[1];

            if (item.top < viewTop + layerWindow.layerCommandButtonButtom) {

                layerWindow.viewLocation[1] = item.top - layerWindow.layerCommandButtonButtom;
            }
            else if (item.top > viewTop + layerWindow.height - layerWindow.layerItemHeight * 2.0) {

                layerWindow.viewLocation[1] = item.top - layerWindow.height + layerWindow.layerItemHeight * 2.0;
            }
        }

        protected layerWindow_UnselectAllLayer() {

            for (let item of this.layerWindow.layerWindowItems) {

                item.layer.isSelected = false;
            }
        }

        // Pallet selector window

        protected initializePalletSelectorWindow() {

            this.palletSelectorWindow.commandButtonAreas = new List<RectangleLayoutArea>();

            this.palletSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(<int>PalletSelectorWindowButtonID.lineColor).setIcon(5));
            this.palletSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(<int>PalletSelectorWindowButtonID.fillColor).setIcon(6));
        }

        // Subtool window

        subToolViewItems = new List<SubToolViewItem>();

        protected subtoolWindow_CollectViewItems() {

            this.subToolViewItems = new List<SubToolViewItem>();

            let currentMainTool = this.getCurrentMainTool();

            for (let i = 0; i < currentMainTool.subTools.length; i++) {

                let tool = <Tool_Posing3d_ToolBase>currentMainTool.subTools[i];

                let viewItem = new SubToolViewItem();
                viewItem.toolIndex = i;
                viewItem.tool = tool;

                for (let buttonIndex = 0; buttonIndex < tool.inputSideOptionCount; buttonIndex++) {

                    let button = new SubToolViewItemOptionButton();
                    button.index = buttonIndex;

                    viewItem.buttons.push(button);
                }

                this.subToolViewItems.push(viewItem);
            }
        }

        protected subtoolWindow_CaluculateLayout(subtoolWindow: SubtoolWindow) {

            let scale = subtoolWindow.subToolItemScale;
            let fullWidth = subtoolWindow.width - 1;
            let unitHeight = subtoolWindow.subToolItemUnitHeight * scale - 1;

            let currentY = 0;

            for (let viewItem of this.subToolViewItems) {

                viewItem.left = 0.0;
                viewItem.top = currentY;
                viewItem.right = fullWidth;
                viewItem.bottom = currentY + unitHeight - 1;

                currentY += unitHeight;
            }

            subtoolWindow.subToolItemsBottom = currentY;
        }

        // Color mixer window

        protected getPalletSelectorWindow_SelectedColor(): Vec4 {

            let wnd = this.palletSelectorWindow;
            let env = this.toolEnv;

            if (wnd.currentTargetID == PalletSelectorWindowButtonID.lineColor) {

                return env.currentVectorLayer.layerColor;
            }
            else {

                return env.currentVectorLayer.fillColor;
            }
        }

        protected getPalletSelectorWindow_CurrentColor(): Vec4 {

            let wnd = this.palletSelectorWindow;
            let env = this.toolEnv;

            if (wnd.currentTargetID == PalletSelectorWindowButtonID.lineColor) {

                return env.getCurrentLayerLineColor();
            }
            else {

                return env.getCurrentLayerFillColor();
            }
        }

        protected setColorMixerValue(id: string, colorValue: float) {

            this.setInputElementNumber2Decimal(id + this.ID.colorMixer_id_number, colorValue);
            this.setInputElementRangeValue(id + this.ID.colorMixer_id_range, colorValue, 0.0, 1.0);
        }

        // Dialogs

        currentModalDialogID: string = null;
        currentModalFocusElementID: string = null;
        currentModalDialogResult: string = null;
        currentModalDialog_DocumentData: DocumentData = null;
        layerPropertyWindow_EditLayer: Layer = null;
        palletColorWindow_EditLayer: VectorLayer = null;
        palletColorWindow_Mode = OpenPalletColorModalMode.LineColor;
        openFileDialogTargetID = OpenFileDialogTargetID.none;
        modalOverlayOption = {
            speedIn: 0,
            speedOut: 100,
            opacity: 0.0
        };
        modalLoaderOption = {
            active: false
        };

        private createModalOptionObject(targetElementId: string): any {

            return {
                content: {
                    target: targetElementId,
                    close: true,
                    speedIn: 0,
                    delay: 0,
                    positionX: 'center',
                    positionY: 'center',
                    speedOut: 100
                },
                overlay: this.modalOverlayOption,
                loader: this.modalLoaderOption
            };
        }

        protected isModalShown(): boolean {

            return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
        }

        protected closeModal() {

            Custombox.modal.closeAll();
        }

        protected openModal(modalID: string, focusElementName: string) {

            this.currentModalDialogID = modalID;
            this.currentModalFocusElementID = focusElementName;

            var modal: any = new Custombox.modal(
                this.createModalOptionObject(this.currentModalDialogID)
            );

            modal.open();
        }

        protected openLayerPropertyModal(layer: Layer, layerWindowItem: LayerWindowItem) {

            if (this.isModalShown()) {
                return;
            }

            // common layer properties

            let layerTypeName = this.layerTypeNameDictionary[<int>layer.type];
            this.setElementText(this.ID.layerPropertyModal_layerTypeName, layerTypeName);

            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);

            this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);

            this.setInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, layer.layerColor[3], 0.0, 1.0);

            this.setInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget, layer.isRenderTarget);

            // for each layer type properties

            if (VectorLayer.isVectorLayer(layer)) {

                let vectorLayer = <VectorLayer>layer;

                this.setInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);

                this.setInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, vectorLayer.fillColor[3], 0.0, 1.0);

                this.setRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, vectorLayer.drawLineType);

                this.setRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, vectorLayer.fillAreaType);
            }

            this.layerPropertyWindow_EditLayer = layer;

            this.openModal(this.ID.layerPropertyModal, this.ID.layerPropertyModal_layerName);
        }

        protected onClosedLayerPropertyModal() {

            let layer = this.layerPropertyWindow_EditLayer;

            // common layer properties

            let layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);

            if (!StringIsNullOrEmpty(layerName)) {

                layer.name = layerName;
            }

            this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 0.0, 1.0);

            layer.isRenderTarget = this.getInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget);

            if (VectorLayer.isVectorLayer(layer)) {

                let vectorLayer = <VectorLayer>layer;

                this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 0.0, 1.0);

                vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, DrawLineTypeID.layerColor);

                vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, FillAreaTypeID.fillColor);
            }

            this.layerPropertyWindow_EditLayer = null;
        }

        protected openPalletColorModal(mode: OpenPalletColorModalMode, documentData: DocumentData, layer: Layer) {

            if (this.isModalShown()) {
                return;
            }

            if (layer == null || !VectorLayer.isVectorLayer(layer)) {
                return;
            }

            let vectorLayer = <VectorLayer>layer;

            let targetName: string;
            let palletColorIndex: int;
            if (mode == OpenPalletColorModalMode.LineColor) {

                targetName = '線色';
                palletColorIndex = vectorLayer.line_PalletColorIndex;
            }
            else {

                targetName = '塗りつぶし色';
                palletColorIndex = vectorLayer.fill_PalletColorIndex;
            }

            this.setElementText(this.ID.palletColorModal_targetName, targetName);
            this.setRadioElementIntValue(this.ID.palletColorModal_colorIndex, palletColorIndex);

            this.palletColorWindow_Mode = mode;
            this.currentModalDialog_DocumentData = documentData;
            this.palletColorWindow_EditLayer = vectorLayer;

            this.displayPalletColorModalColors(documentData, vectorLayer);

            this.openModal(this.ID.palletColorModal, null);
        }

        protected displayPalletColorModalColors(documentData: DocumentData, vectorLayer: VectorLayer) {

            {
                let palletColorIndex: int;
                if (this.palletColorWindow_Mode == OpenPalletColorModalMode.LineColor) {

                    palletColorIndex = vectorLayer.line_PalletColorIndex;
                }
                else {

                    palletColorIndex = vectorLayer.fill_PalletColorIndex;
                }

                let palletColor = documentData.palletColors[palletColorIndex];
                this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                this.setInputElementRangeValue(this.ID.palletColorModal_currentAlpha, palletColor.color[3], 0.0, 1.0);
            }

            for (let palletColorIndex = 0; palletColorIndex < documentData.palletColors.length; palletColorIndex++) {

                let palletColor = documentData.palletColors[palletColorIndex];

                this.setColorPalletElementValue(palletColorIndex, palletColor.color);
            }
        }

        protected setColorPalletElementValue(palletColorIndex: int, color: Vec4) {

            let id = this.ID.palletColorModal_colorValue + palletColorIndex;
            this.setInputElementColor(id, color);
        }

        protected onPalletColorModal_ColorIndexChanged() {

            if (this.palletColorWindow_EditLayer == null) {
                return;
            }

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;

            let palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);;

            if (this.palletColorWindow_Mode == OpenPalletColorModalMode.LineColor) {

                vectorLayer.line_PalletColorIndex = palletColorIndex;
            }
            else {

                vectorLayer.fill_PalletColorIndex = palletColorIndex;
            }

            //let palletColor = documentData.palletColos[palletColorIndex];
            //this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
            //this.setInputElementRangeValue(this.ID.palletColorModal_currentAlpha, palletColor.color[3], 0.0, 1.0);

            this.displayPalletColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPalletColorModal_CurrentColorChanged() {

            if (this.palletColorWindow_EditLayer == null) {
                return;
            }

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;
            let palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            let palletColor = documentData.palletColors[palletColorIndex];

            this.getInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
            palletColor.color[3] = this.getInputElementRangeValue(this.ID.palletColorModal_currentAlpha, 0.0, 1.0);

            this.displayPalletColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPalletColorModal_ColorChanged(palletColorIndex: int) {

            if (this.palletColorWindow_EditLayer == null) {

                return;
            }

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;
            let palletColor = documentData.palletColors[palletColorIndex];

            this.getInputElementColor(this.ID.palletColorModal_colorValue + palletColorIndex, palletColor.color);

            this.displayPalletColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPalletColorModal_ColorCanvas_mousedown() {

            if (this.palletColorWindow_EditLayer == null) {
                return;
            }

            let context = this.toolContext;
            let wnd = this.palletColorModal_colorCanvas;
            let e = wnd.toolMouseEvent;
            let env = this.toolEnv;

            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;
            let palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            let palletColor = documentData.palletColors[palletColorIndex];

            palletColor.color[0] = this.tempColor4[0];
            palletColor.color[1] = this.tempColor4[1];
            palletColor.color[2] = this.tempColor4[2];

            this.setColorPalletElementValue(palletColorIndex, palletColor.color);

            this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onClosedPalletColorModal() {

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;

            let palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);;

            if (this.palletColorWindow_Mode == OpenPalletColorModalMode.LineColor) {

                vectorLayer.line_PalletColorIndex = palletColorIndex;
            }
            else {

                vectorLayer.fill_PalletColorIndex = palletColorIndex;
            }

            let updateOnClose = false;
            if (updateOnClose) {

                {
                    let palletColor = documentData.palletColors[palletColorIndex];
                    this.getInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                    palletColor.color[3] = this.getInputElementRangeValue(this.ID.palletColorModal_currentAlpha, 0.0, 1.0);
                }

                for (let i = 0; i < documentData.palletColors.length; i++) {

                    let palletColor = documentData.palletColors[i];

                    let id = this.ID.palletColorModal_colorValue + i;
                    this.getInputElementColor(id, palletColor.color);
                }
            }

            this.currentModalDialog_DocumentData = null;
            this.palletColorWindow_EditLayer = null;
        }

        protected openOperationOptionModal() {

            if (this.isModalShown()) {
                return;
            }

            this.setInputElementNumber(this.ID.operationOptionModal_LineWidth, this.toolContext.drawLineBaseWidth);
            this.setInputElementNumber(this.ID.operationOptionModal_LineMinWidth, this.toolContext.drawLineMinWidth);

            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);

            this.openModal(this.ID.operationOptionModal, null);
        }

        protected openNewLayerCommandOptionModal() {

            if (this.isModalShown()) {
                return;
            }

            this.openModal(this.ID.newLayerCommandOptionModal, null);
        }

        protected openFileDialogModal(targetID: OpenFileDialogTargetID, filePath: string) {

            if (this.isModalShown()) {
                return;
            }

            this.openFileDialogTargetID = targetID;

            this.openModal(this.ID.openFileDialogModal, null);
        }

        protected onClosedFileDialogModal() {

            this.toolEnv.updateContext();

            let filePath = this.getInputElementFilePath(this.ID.openFileDialogModal_file);

            let targetID = this.openFileDialogTargetID;
            this.openFileDialogTargetID = OpenFileDialogTargetID.none;

            if (this.currentModalDialogResult != this.ID.openFileDialogModal_ok) {

                return;
            }

            if (targetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

                let currentTool = this.getCurrentTool();
                if (currentTool != null) {

                    if (!StringIsNullOrEmpty(filePath)) {

                        currentTool.onOpenFile(filePath, this.toolEnv);
                    }
                }
            }
            else if (targetID == OpenFileDialogTargetID.openDocument) {

            }
            else if (targetID == OpenFileDialogTargetID.saveDocument) {

            }
        }

        protected openDocumentSettingModal() {

            if (this.isModalShown()) {
                return;
            }

            let documentData = this.getDocument();

            this.setInputElementNumber(this.ID.documentSettingModal_ViewScale, documentData.defaultViewScale);
            this.setInputElementNumber(this.ID.documentSettingModal_LineWidth, documentData.lineWidthBiasRate);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, documentData.documentFrame[0]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, documentData.documentFrame[1]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, documentData.documentFrame[2]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, documentData.documentFrame[3]);

            this.openModal(this.ID.documentSettingModal, null);
        }

        protected onClosedDocumentSettingModal() {

            let documentData = this.getDocument();

            documentData.defaultViewScale = this.getInputElementNumber(this.ID.documentSettingModal_ViewScale, 1.0);
            if (documentData.defaultViewScale < this.mainWindow.minViewScale) {

                documentData.defaultViewScale = this.mainWindow.minViewScale;
            }
            documentData.lineWidthBiasRate = this.getInputElementNumber(this.ID.documentSettingModal_LineWidth, 1.0);
            documentData.documentFrame[0] = this.getInputElementNumber(this.ID.documentSettingModal_FrameLeft, -512);
            documentData.documentFrame[1] = this.getInputElementNumber(this.ID.documentSettingModal_FrameTop, -512);
            documentData.documentFrame[2] = this.getInputElementNumber(this.ID.documentSettingModal_FrameRight, 512);
            documentData.documentFrame[3] = this.getInputElementNumber(this.ID.documentSettingModal_FrameBottom, 512);
        }

        protected openExportImageFileModal() {

            if (this.isModalShown()) {
                return;
            }

            let exportFileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);

            if (StringIsNullOrEmpty(exportFileName)) {

                this.setExportImageFileNameFromFileName();
            }

            this.openModal(this.ID.exportImageFileModal, null);
        }

        protected setExportImageFileNameFromFileName() {

            let fileName = this.getInputElementText(this.ID.fileName);
            let lastSeperatorIndex = StringLastIndexOf(fileName, '\\');
            if (lastSeperatorIndex == -1) {
                lastSeperatorIndex = StringLastIndexOf(fileName, '/');
            }
            let separatorDotIndex = StringLastIndexOf(fileName, '.');
            if (lastSeperatorIndex != -1 && separatorDotIndex != -1 && separatorDotIndex - lastSeperatorIndex > 0) {

                fileName = StringSubstring(fileName, lastSeperatorIndex + 1, separatorDotIndex - lastSeperatorIndex - 1);
            }

            this.setInputElementText(this.ID.exportImageFileModal_fileName, fileName);
        }

        protected openNewKeyframeModal() {

            this.openModal(this.ID.newKeyframeModal, null);
        }

        protected onClosedNewKeyframeModal() {

            if (this.currentModalDialogResult != this.ID.newKeyframeModal_ok) {
                return;
            }

            let env = this.toolEnv;

            let insertType = <int>(this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));

            if (insertType == 1) {

                let command = new Command_Animation_InsertKeyframeAllLayer();
                command.frame = env.document.animationSettingData.currentTimeFrame;
                command.prepareEditData(env);

                if (command.isAvailable(env)) {

                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
        }

        protected openDeleteKeyframeModal() {

            this.openModal(this.ID.deleteKeyframeModal, null);
        }

        protected onClosedDeleteKeyframeModal() {

            if (this.currentModalDialogResult != this.ID.deleteKeyframeModal_ok) {
                return;
            }

            let env = this.toolEnv;

            let insertType = <int>(this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));

            if (insertType == 1) {

                let command = new Command_Animation_DeleteKeyframeAllLayer();
                command.frame = env.document.animationSettingData.currentTimeFrame;
                command.prepareEditData(env);

                if (command.isAvailable(env)) {

                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
        }

        protected onModalWindowShown() {

            if (!StringIsNullOrEmpty(this.currentModalFocusElementID)) {

                let element = this.getElement(this.currentModalFocusElementID);
                element.focus();
            }
        }

        public openFileDialog(targetID: OpenFileDialogTargetID) {

            if (targetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

                if (this.toolContext.currentLayer != null
                    && this.toolContext.currentLayer.type == LayerTypeID.imageFileReferenceLayer) {

                    let filePath = (<ImageFileReferenceLayer>(this.toolContext.currentLayer)).imageFilePath;

                    this.openFileDialogModal(targetID, filePath);
                }

            }
            else if (targetID == OpenFileDialogTargetID.openDocument) {

            }
            else if (targetID == OpenFileDialogTargetID.saveDocument) {

            }
        }

        // Pallet modal drawing

        colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        colorB = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        private drawPalletColorMixer(wnd: CanvasWindow) {

            let width = wnd.width;
            let height = wnd.height;
            let left = 0.0;
            let top = 0.0;
            let right = width - 1.0;
            let bottom = height - 1.0;
            //let minRadius = 10.0;
            //let maxRadius = width * 1.0;

            this.canvasRender.setContext(wnd);
            this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
            this.canvasRender.setFillColorV(this.colorW);
            this.canvasRender.fillRect(0.0, 0.0, width, height);

            //this.canvasRender.setBlendMode(CanvasRenderBlendMode.add);
            //this.canvasRender.setFillRadialGradient(left, top, minRadius, maxRadius, this.color11, this.color12);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setFillRadialGradient(right, top, minRadius, maxRadius, this.color21, this.color22);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setFillRadialGradient(right, bottom, minRadius, maxRadius, this.color31, this.color32);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setFillRadialGradient(left, bottom, minRadius, maxRadius, this.color41, this.color42);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);

            //this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
            //this.canvasRender.setFillLinearGradient(left, top, left, bottom, this.colorW, this.colorB);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);

            this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
            let divisionW = 40.0;
            let divisionH = 25.0;
            let unitWidth = Math.floor(width / divisionW);
            let unitHeight = Math.floor(height / divisionH);

            let drawX = 0.0;

            for (let x = 0; x <= divisionW; x++) {

                let drawY = 0.0;

                for (let y = 1; y <= divisionH; y++) {

                    let h = x / divisionW;
                    let s = 0.0;
                    let v = 0.0;
                    let iy = y / divisionH;
                    if (iy <= 0.5) {
                        s = iy * 2.0;
                        v = 1.0;
                    }
                    else {
                        s = 1.0;
                        v = 1.0 - (iy - 0.5) * 2.0;
                    }

                    Maths.hsvToRGB(this.tempColor4, h, s, v);
                    this.tempColor4[3] = 1.0;
                    this.canvasRender.setFillColorV(this.tempColor4);
                    this.canvasRender.fillRect(drawX, drawY, unitWidth, unitHeight);

                    drawY += unitHeight;
                }

                drawX += unitWidth;
            }
            this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
        }

        // Header window

        protected updateHeaderButtons() {

            {
                let isButtonON = (this.toolContext.editMode == EditModeID.drawMode
                    && (this.toolContext.mainToolID == MainToolID.drawLine
                        || this.toolContext.mainToolID == MainToolID.posing
                        || this.toolContext.mainToolID == MainToolID.imageReferenceLayer));

                this.setHeaderButtonVisual(this.ID.menu_btnDrawTool, isButtonON);
            }
            {
                let isButtonON = (this.toolContext.editMode == EditModeID.editMode);

                this.setHeaderButtonVisual(this.ID.menu_btnEditTool, isButtonON);
            }
            {
                let isButtonON = (this.toolContext.editMode == EditModeID.drawMode
                    && this.toolContext.mainToolID == MainToolID.misc);

                this.setHeaderButtonVisual(this.ID.menu_btnMiscTool, isButtonON);
            }
        }

        private setHeaderButtonVisual(elementID: string, isSelected: boolean) {

            var element = this.getElement(elementID);

            if (isSelected) {

                element.classList.remove(this.ID.unselectedMainButton);
                element.classList.add(this.ID.selectedMainButton);
            }
            else {

                element.classList.remove(this.ID.selectedMainButton);
                element.classList.add(this.ID.unselectedMainButton);
            }
        }

        protected setHeaderDocumentFileName(lastURL: string) {

            this.setInputElementText(this.ID.fileName, lastURL);
        }

        // Footer window

        protected footerText: string = '';
        protected footerTextBefore: string = '';

        protected updateFooterText() {

            if (this.footerText != this.footerTextBefore) {

                this.getElement(this.ID.footer).innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
        }

        // Hit test

        protected hitTestLayout(areas: List<RectangleLayoutArea>, x: float, y: float): RectangleLayoutArea {

            for (let area of areas) {

                if (this.hitTestLayoutRectangle(area, x, y)) {

                    return area;
                }
            }

            return null;
        }

        protected hitTestLayoutRectangle(area: RectangleLayoutArea, x: float, y: float): boolean {

            if (x >= area.left
                && x <= area.right
                && y >= area.top
                && y <= area.bottom) {

                return true;
            }
            else {

                return false;
            }
        }

        // HTML helper

        getElement(id: string): HTMLElement {

            let element = document.getElementById(id);

            if (element == null) {
                throw ('Could not find element "' + id + '"');
            }

            return element;
        }

        setElementText(id: string, text: string): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.innerText = text;

            return element;
        }

        setInputElementText(id: string, text: string): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = text;

            return element;
        }

        getInputElementText(id: string): string {

            let element = <HTMLInputElement>(document.getElementById(id));

            return element.value;
        }

        setInputElementNumber(id: string, value: float): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = value.toString();

            return element;
        }

        setInputElementNumber2Decimal(id: string, value: float): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = value.toFixed(2);

            return element;
        }

        getInputElementNumber(id: string, defaultValue: float): float {

            let element = <HTMLInputElement>(document.getElementById(id));

            if (element.value == '') {

                return defaultValue;
            }

            return Number(element.value);
        }

        setInputElementRangeValue(id: string, value: float, min: float, max: float): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = (value / max * Number(element.max)).toString();

            return element;
        }

        getInputElementRangeValue(id: string, min: int, max: int): float {

            let element = <HTMLInputElement>(document.getElementById(id));

            let value = Number(element.value) / Number(element.max) * max;

            return value;
        }

        setRadioElementIntValue(elementName: string, value: int) {

            let valueText = value.toString();

            let elements = document.getElementsByName(elementName);

            for (var i = 0; i < elements.length; i++) {
                let radio = <HTMLInputElement>elements[i];

                radio.checked = (radio.value == valueText);
            }
        }

        getRadioElementIntValue<T>(elementName: string, defaultValue: T): T {

            let value = defaultValue;

            let elements = document.getElementsByName(elementName);

            for (var i = 0; i < elements.length; i++) {
                let radio = <HTMLInputElement>elements[i];

                if (radio.checked) {

                    value = <any>(Number(radio.value));
                }
            }

            return value;
        }

        setInputElementBoolean(id: string, checked: boolean) {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.checked = checked;
        }

        getInputElementBoolean(id: string): boolean {

            let element = <HTMLInputElement>(document.getElementById(id));

            return element.checked;
        }

        setInputElementColor(id: string, color: Vec4): Vec4 {

            let colorText = '#' + ColorLogic.rgbToHex2String(color);

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = colorText;

            return color;
        }

        getInputElementColor(id: string, result: Vec4): Vec4 {

            let element = <HTMLInputElement>(document.getElementById(id));

            let colorText = element.value;

            ColorLogic.hex2StringToRGB(result, colorText);

            return result;
        }

        getInputElementFilePath(id: string): string {

            let element = <HTMLInputElement>(document.getElementById(id));

            if (element.files.length == 0) {

                return null;
            }

            let file: any = element.files[0];

            return file.path;
        }
    }

    export class MainWindow extends ToolBaseWindow {

        dragBeforeTransformMatrix = mat4.create();
    }

    export class EditorWindow extends ToolBaseWindow {
    }

    export class LayerWindow extends ToolBaseWindow {

        layerItemButtonScale = 0.5;
        layerItemButtonWidth = 64.0;
        layerItemButtonHeight = 64.0;
        layerItemButtonButtom = 64.0;
        layerCommandButtonButtom = 0.0;

        layerItemHeight = 24.0;
        layerItemFontSize = 16.0;

        layerItemVisibilityIconWidth = 24.0;
        layerItemVisibilityIconRight = 24.0;

        layerItemsBottom = 0.0;

        layerWindowLayoutArea = new RectangleLayoutArea();

        layerWindowItems = new List<LayerWindowItem>();

        layerWindowCommandButtons: List<RectangleLayoutArea> = null;
    }

    export class SubtoolWindow extends ToolBaseWindow {

        subToolItemScale = 0.5;
        subToolItemUnitWidth = 256;
        subToolItemUnitHeight = 128;

        subToolItemsBottom = 0.0;
    }

    export class ColorCanvasWindow extends ToolBaseWindow {
    }

    export class RectangleLayoutArea {

        index = -1;
        iconID = -1;

        marginTop = 0.0;
        marginRight = 0.0;
        marginBottom = 0.0;
        marginLeft = 0.0;

        top = 0.0;
        right = 0.0;
        bottom = 0.0;
        left = 0.0;

        borderTop = 0.0;
        borderRight = 0.0;
        borderBottom = 0.0;
        borderLeft = 0.0;

        paddingTop = 0.0;
        paddingRight = 0.0;
        paddingBottom = 0.0;
        paddingLeft = 0.0;

        setIndex(index: int): RectangleLayoutArea {

            this.index = index;

            return this;
        }

        setIcon(index: int): RectangleLayoutArea {

            this.iconID = index;

            return this;
        }


        getWidth(): float {

            return (this.right - this.left + 1.0);
        }

        getHeight(): float {

            return (this.bottom - this.top + 1.0);
        }

        copyRectangle(canvasWindow: LayerWindow) {

            this.left = 0.0;
            this.top = 0.0;
            this.right = canvasWindow.width - 1.0;
            this.bottom = canvasWindow.width - 1.0;
        }
    }

    export class TimeLineWindow extends ToolBaseWindow {

        leftPanelWidth = 100.0;
        frameUnitWidth = 8.0;

        getFrameUnitWidth(aniSetting: AnimationSettingData): float {

            return this.frameUnitWidth * aniSetting.timeLineWindowScale;
        }

        getTimeLineLeft(): float {

            return this.leftPanelWidth;
        }

        getTimeLineRight(): float {

            return this.getTimeLineLeft() + this.width - 1;
        }

        getFrameByLocation(x: float, aniSetting: AnimationSettingData): int {

            let left = this.getTimeLineLeft();
            let right = this.getTimeLineRight();

            if (x < left) {
                return -1;
            }

            if (x > right) {
                return -1;
            }

            let frameUnitWidth = this.getFrameUnitWidth(aniSetting);

            let absoluteX = x - (left - aniSetting.timeLineWindowViewLocationX);

            let frame = Math.floor(absoluteX / frameUnitWidth);
            if (frame < 0) {
                frame = 0;
            }

            return frame;
        }

        getFrameLocation(frame: float, aniSetting: AnimationSettingData) {

            let left = this.getTimeLineLeft();
            let frameUnitWidth = this.getFrameUnitWidth(aniSetting);
            let x = left - aniSetting.timeLineWindowViewLocationX + frame * frameUnitWidth;

            return x;
        }
    }

    export enum PalletSelectorWindowButtonID {

        none = 0,
        lineColor = 1,
        fillColor = 2,
    }

    export class PalletSelectorWindow extends ToolBaseWindow {

        leftMargin = 4.0;
        topMargin = 5.0;
        rightMargin = 5.0;

        buttonScale = 0.5;
        buttonWidth = 64.0;
        buttonHeight = 64.0;
        buttonRightMargin = 5.0;
        buttonBottomMargin = 5.0;

        commandButtonsBottom = 0.0;

        commandButtonAreas = new List<RectangleLayoutArea>();

        itemScale = 1.0;
        itemWidth = 34.0;
        itemHeight = 15.0;
        itemRightMargin = 5.0;
        itemBottomMargin = 5.0;

        itemAreas = new List<RectangleLayoutArea>();

        currentTargetID = PalletSelectorWindowButtonID.lineColor;
    }

    export enum LayerWindowButtonID {

        none = 0,
        addLayer = 1,
        deleteLayer = 2,
        moveUp = 3,
        moveDown = 4,
    }

    export class LayerWindowItem extends RectangleLayoutArea {

        layer: Layer = null;
        parentLayer: Layer = null;
        previousItem: LayerWindowItem = null;
        nextItem: LayerWindowItem = null;
        previousSiblingItem: LayerWindowItem = null;
        nextSiblingItem: LayerWindowItem = null;
        hierarchyDepth = 0;

        margine = 0.0;
        visibilityIconWidth = 0.0;
        textLeft = 0.0;
    }

    export class SubToolViewItem extends RectangleLayoutArea {

        toolIndex = 0;
        tool: Tool_Posing3d_ToolBase = null;
        buttons = new List<SubToolViewItemOptionButton>();
    }

    export class SubToolViewItemOptionButton extends RectangleLayoutArea {

    }

    export enum OpenPalletColorModalMode {

        LineColor = 1,
        FillColor = 2
    }

    export enum NewLayerTypeID {

        none = 0,
        rootLayer = 1,
        vectorLayer = 2,
        vectorLayer_Fill = 3,
        groupLayer = 4,
        imageFileReferenceLayer = 5,
        posingLayer = 6,
        vectorLayerReferenceLayer = 7,
    }

    export class HTMLElementID {

        none = 'none';

        fileName = 'fileName';

        footer = 'footer';

        mainCanvas = 'mainCanvas';
        editorCanvas = 'editorCanvas';
        webglCanvas = 'webglCanvas';
        layerCanvas = 'layerCanvas';
        subtoolCanvas = 'subtoolCanvas';
        timeLineCanvas = 'timeLineCanvas';
        palletSelectorCanvas = 'palletSelectorCanvas';
        colorMixerWindow_colorCanvas = 'colorMixer_colorCanvas';

        menu_btnDrawTool = 'menu_btnDrawTool';
        menu_btnMiscTool = 'menu_btnMiscTool';
        menu_btnEditTool = 'menu_btnEditTool';
        menu_btnOperationOption = 'menu_btnOperationOption';
        menu_btnOpen = 'menu_btnOpen';
        menu_btnSave = 'menu_btnSave';
        menu_btnExport = 'menu_btnExport';
        menu_btnProperty = 'menu_btnProperty';
        menu_btnPalette1 = 'menu_btnPalette1';
        menu_btnPalette2 = 'menu_btnPalette2';

        unselectedMainButton = 'unselectedMainButton';
        selectedMainButton = 'selectedMainButton';

        colorMixer_id_number = '_number';
        colorMixer_id_range = '_range';
        colorMixer_alpha = 'colorMixer_alpha';
        colorMixer_red = 'colorMixer_red';
        colorMixer_green = 'colorMixer_green';
        colorMixer_blue = 'colorMixer_blue';
        colorMixer_hue = 'colorMixer_hue';
        colorMixer_sat = 'colorMixer_sat';
        colorMixer_val = 'colorMixer_val';

        openFileDialogModal = '#openFileDialogModal';
        openFileDialogModal_file = 'openFileDialogModal_file';
        openFileDialogModal_ok = 'openFileDialogModal_ok';
        openFileDialogModal_cancel = 'openFileDialogModal_cancel';

        layerPropertyModal = '#layerPropertyModal';
        layerPropertyModal_layerTypeName = 'layerPropertyModal_layerTypeName';
        layerPropertyModal_layerName = 'layerPropertyModal_layerName';
        layerPropertyModal_layerColor = 'layerPropertyModal_layerColor';
        layerPropertyModal_layerAlpha = 'layerPropertyModal_layerAlpha';
        layerPropertyModal_drawLineType = 'layerPropertyModal_drawLineType';
        layerPropertyModal_fillColor = 'layerPropertyModal_fillColor';
        layerPropertyModal_fillColorAlpha = 'layerPropertyModal_fillColorAlpha';
        layerPropertyModal_fillAreaType = 'layerPropertyModal_fillAreaType';
        layerPropertyModal_isRenderTarget = 'layerPropertyModal_isRenderTarget';

        palletColorModal = '#palletColorModal';
        palletColorModal_targetName = 'palletColorModal_targetName';
        palletColorModal_currentColor = 'palletColorModal_currentColor';
        palletColorModal_currentAlpha = 'palletColorModal_currentAlpha';
        palletColorModal_colors = 'palletColorModal_colors';
        palletColorModal_colorItemStyle = 'colorItem';
        palletColorModal_colorIndex = 'palletColorModal_colorIndex';
        palletColorModal_colorValue = 'palletColorModal_colorValue';
        palletColorModal_colorCanvas = 'palletColorModal_colorCanvas';

        operationOptionModal = '#operationOptionModal';
        operationOptionModal_LineWidth = 'operationOptionModal_LineWidth'
        operationOptionModal_LineMinWidth = 'operationOptionModal_LineMinWidth'
        operationOptionModal_operationUnit = 'operationOptionModal_operationUnit'

        newLayerCommandOptionModal = '#newLayerCommandOptionModal';
        newLayerCommandOptionModal_layerType = 'newLayerCommandOptionModal_layerType';
        newLayerCommandOptionModal_ok = 'newLayerCommandOptionModal_ok';
        newLayerCommandOptionModal_cancel = 'newLayerCommandOptionModal_cancel';

        documentSettingModal = '#documentSettingModal';
        documentSettingModal_ViewScale = 'documentSettingModal_ViewScale';
        documentSettingModal_LineWidth = 'documentSettingModal_LineWidth';
        documentSettingModal_FrameLeft = 'documentSettingModal_FrameLeft';
        documentSettingModal_FrameTop = 'documentSettingModal_FrameTop';
        documentSettingModal_FrameRight = 'documentSettingModal_FrameRight';
        documentSettingModal_FrameBottom = 'documentSettingModal_FrameBottom';

        exportImageFileModal = '#exportImageFileModal';
        exportImageFileModal_fileName = 'exportImageFileModal_fileName';
        exportImageFileModal_imageFileType = 'exportImageFileModal_imageFileType';
        exportImageFileModal_backGroundType = 'exportImageFileModal_backGroundType';
        exportImageFileModal_scale = 'exportImageFileModal_scale';
        exportImageFileModal_ok = 'exportImageFileModal_ok';
        exportImageFileModal_cancel = 'exportImageFileModal_cancel';

        newKeyframeModal = '#newKeyframeModal';
        newKeyframeModal_InsertType = 'newKeyframeModal_InsertType';
        newKeyframeModal_ok = 'newKeyframeModal_ok';
        newKeyframeModal_cancel = 'newKeyframeModal_cancel';

        deleteKeyframeModal = '#deleteKeyframeModal';
        deleteKeyframeModal_InsertType = 'deleteKeyframeModal_InsertType';
        deleteKeyframeModal_ok = 'deleteKeyframeModal_ok';
        deleteKeyframeModal_cancel = 'deleteKeyframeModal_cancel';
    }
}
