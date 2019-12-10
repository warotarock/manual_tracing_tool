var ManualTracingTool;
(function (ManualTracingTool) {
    class App_View {
        constructor() {
            // HTML elements
            this.ID = new HTMLElementID();
            this.mainWindow = new MainWindow();
            this.editorWindow = new ManualTracingTool.CanvasWindow();
            this.layerWindow = new LayerWindow();
            this.subtoolWindow = new SubtoolWindow();
            this.timeLineWindow = new TimeLineWindow();
            this.palletSelectorWindow = new PalletSelectorWindow();
            this.colorMixerWindow_colorCanvas = new ColorCanvasWindow();
            this.palletColorModal_colorCanvas = new ColorCanvasWindow();
            // Drawing variables
            this.foreLayerRenderWindow = new ManualTracingTool.CanvasWindow();
            this.backLayerRenderWindow = new ManualTracingTool.CanvasWindow();
            this.exportRenderWindow = new ManualTracingTool.CanvasWindow();
            this.drawGPUWindow = new ManualTracingTool.CanvasWindow();
            this.webglWindow = new ManualTracingTool.CanvasWindow();
            //pickingWindow = new PickingWindow();
            this.activeCanvasWindow = null;
            this.layerTypeNameList = [
                'none',
                'root',
                'ベクター レイヤー',
                'グループ レイヤー',
                '画像ファイル レイヤー',
                '３Dポーズ レイヤー',
                'ベクター参照 レイヤー'
            ];
            // UI states
            this.selectCurrentLayerAnimationLayer = null;
            this.selectCurrentLayerAnimationTime = 0.0;
            this.selectCurrentLayerAnimationTimeMax = 0.4;
            this.isViewLocationMoved = false;
            this.homeViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.lastViewLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.lastViewScale = 1.0;
            this.lastViewRotation = 0.0;
            // Integrated tool system
            this.toolContext = null;
            this.toolEnv = null;
            this.toolDrawEnv = null;
            this.viewLayerContext = new ManualTracingTool.ViewLayerContext();
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
            // Subtool window
            this.subToolViewItems = new List();
            // Dialogs
            this.currentModalDialogID = null;
            this.currentModalFocusElementID = null;
            this.currentModalDialogResult = null;
            this.currentModalDialog_DocumentData = null;
            this.layerPropertyWindow_EditLayer = null;
            this.palletColorWindow_EditLayer = null;
            this.palletColorWindow_Mode = OpenPalletColorModalMode.LineColor;
            this.openFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID.none;
            this.modalOverlayOption = {
                speedIn: 0,
                speedOut: 100,
                opacity: 0.0
            };
            this.modalLoaderOption = {
                active: false
            };
            // Footer window
            this.footerText = '';
            this.footerTextBefore = '';
        }
        // Backward interface definitions
        getLocalSetting() {
            return null;
        }
        getCurrentMainTool() {
            return null;
        }
        getCurrentTool() {
            return null;
        }
        isWhileLoading() {
            return false;
        }
        isEventDisabled() {
            return false;
        }
        onLayerPropertyModalClosed() {
        }
        // Initializing devices not depending media resoures
        initializeViewDevices() {
            this.resizeWindows();
            this.mainWindow.initializeContext();
            this.editorWindow.initializeContext();
            this.foreLayerRenderWindow.initializeContext();
            this.backLayerRenderWindow.initializeContext();
            this.layerWindow.initializeContext();
            this.subtoolWindow.initializeContext();
            this.palletSelectorWindow.initializeContext();
            this.colorMixerWindow_colorCanvas.initializeContext();
            this.timeLineWindow.initializeContext();
            this.exportRenderWindow.initializeContext();
            this.palletColorModal_colorCanvas.initializeContext();
            this.layerWindow_Initialize();
            this.initializePalletSelectorWindow();
        }
        // Initializing after loading resources
        initializeViewState() {
            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;
            this.setCanvasSizeFromStyle(this.colorMixerWindow_colorCanvas);
            this.setCanvasSizeFromStyle(this.palletColorModal_colorCanvas);
        }
        // View management
        resizeWindows() {
            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.foreLayerRenderWindow, this.mainWindow);
            this.fitCanvas(this.backLayerRenderWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.drawGPUWindow, this.mainWindow);
            this.resizeCanvasToParent(this.layerWindow);
            this.resizeCanvasToParent(this.subtoolWindow);
            this.resizeCanvasToParent(this.palletSelectorWindow);
            this.resizeCanvasToParent(this.timeLineWindow);
        }
        resizeCanvasToParent(canvasWindow) {
            canvasWindow.width = canvasWindow.canvas.parentElement.clientWidth;
            canvasWindow.height = canvasWindow.canvas.parentElement.clientHeight;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }
        fitCanvas(canvasWindow, fitToWindow) {
            canvasWindow.width = fitToWindow.width;
            canvasWindow.height = fitToWindow.height;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }
        setCanvasSizeFromStyle(canvasWindow) {
            let style = window.getComputedStyle(canvasWindow.canvas);
            canvasWindow.width = Number(style.width.replace('px', ''));
            canvasWindow.height = Number(style.height.replace('px', ''));
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }
        processMouseEventInput(toolMouseEvent, e, touchUp, canvasWindow) {
            this.activeCanvasWindow = canvasWindow;
            if (document.activeElement.nodeName == 'INPUT') {
                document.activeElement.blur();
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
        getTouchInfo(toolMouseEvent, e, touchDown, touchUp, canvasWindow) {
            this.activeCanvasWindow = canvasWindow;
            if (e.touches == undefined || e.touches.length == 0) {
                toolMouseEvent.button = 0;
                toolMouseEvent.buttons = 0;
                return;
            }
            //console.log(e.touches.length);
            var rect = canvasWindow.canvas.getBoundingClientRect();
            let touch = e.touches[0];
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
        calculateTransfomredLocation(resultVec, canvasWindow, x, y) {
            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);
            vec3.set(this.tempVec3, x, y, 0.0);
            vec3.transformMat4(resultVec, this.tempVec3, this.invView2DMatrix);
        }
        calculateTransfomredMouseParams(toolMouseEvent, canvasWindow) {
            this.calculateTransfomredLocation(toolMouseEvent.location, canvasWindow, toolMouseEvent.offsetX, toolMouseEvent.offsetY);
            vec3.copy(this.toolEnv.mouseCursorLocation, toolMouseEvent.location);
        }
        getWheelInfo(toolMouseEvent, e) {
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
        startShowingLayerItem(item) {
            if (item != null) {
                this.selectCurrentLayerAnimationLayer = item.layer;
                this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax;
                this.toolEnv.setRedrawMainWindow();
                this.layerWindow_SetViewLocationToItem(item);
            }
        }
        startShowingCurrentLayer() {
            let item = this.layerWindow_FindCurrentItem();
            this.startShowingLayerItem(item);
        }
        copyLastViewLocation(setUpdate) {
            this.isViewLocationMoved = setUpdate;
            vec3.copy(this.lastViewLocation, this.mainWindow.viewLocation);
            this.lastViewScale = this.mainWindow.viewScale;
            this.lastViewRotation = this.mainWindow.viewRotation;
        }
        setViewRotation(rotation) {
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
        addViewScale(addScale) {
            var env = this.toolEnv;
            this.copyLastViewLocation(true);
            this.mainWindow.addViewScale(addScale);
            env.setRedrawMainWindowEditorWindow();
        }
        // ViewKeyframe for timeline
        collectViewKeyframeContext() {
            let context = this.toolContext;
            // Collects layers
            let layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, context.document.rootLayer);
            // Creates all view-keyframes.
            let viewKeyFrames = new List();
            this.collectViewKeyframeContext_CollectKeyframes(viewKeyFrames, layers);
            let sortedViewKeyFrames = viewKeyFrames.sort((a, b) => { return a.frame - b.frame; });
            // Collects layers for each view-keyframes
            this.collectViewKeyframeContext_CollectKeyframeLayers(sortedViewKeyFrames, layers);
            this.viewLayerContext.keyframes = sortedViewKeyFrames;
        }
        collectViewKeyframeContext_CollectKeyframes(result, layers) {
            let keyframeDictionary = new Dictionary();
            for (let layer of layers) {
                if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    let vectorLayer = (layer);
                    for (let keyframe of vectorLayer.keyframes) {
                        let frameText = keyframe.frame.toString();
                        if (!DictionaryContainsKey(keyframeDictionary, frameText)) {
                            let viewKeyframe = new ManualTracingTool.ViewKeyframe();
                            viewKeyframe.frame = keyframe.frame;
                            result.push(viewKeyframe);
                            keyframeDictionary[frameText] = true;
                        }
                    }
                }
            }
        }
        collectViewKeyframeContext_CollectKeyframeLayers(result, layers) {
            // All view-keyframes contains view-layer info for all layer.
            for (let viewKeyframe of result) {
                for (let layer of layers) {
                    let keyframeLayer = new ManualTracingTool.ViewKeyframeLayer();
                    keyframeLayer.layer = layer;
                    if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                        let vectorLayer = layer;
                        let max_KeyFrame = null;
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
        findNextViewKeyframeIndex(startFrame, searchDirection) {
            let resultFrame = -1;
            let viewKeyframes = this.viewLayerContext.keyframes;
            let startKeyframeIndex = ManualTracingTool.ViewKeyframe.findViewKeyframeIndex(viewKeyframes, startFrame);
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
        findNextViewKeyframeFrame(startFrame, searchDirection) {
            let resultFrame = -1;
            let keyframeIndex = this.findNextViewKeyframeIndex(startFrame, searchDirection);
            if (keyframeIndex == -1) {
                return -2;
            }
            else {
                return this.viewLayerContext.keyframes[keyframeIndex].frame;
            }
        }
        // Laye window
        layerWindow_Initialize() {
            let wnd = this.layerWindow;
            wnd.layerWindowCommandButtons = new List();
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.addLayer).setIcon(1));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.deleteLayer).setIcon(2));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.moveUp).setIcon(3));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.moveDown).setIcon(4));
        }
        layerWindow_CollectItems(document) {
            let wnd = this.layerWindow;
            wnd.layerWindowItems = new List();
            this.layerWindow_CollectItemsRecursive(wnd.layerWindowItems, document.rootLayer, 0);
            let previousItem = null;
            for (let item of wnd.layerWindowItems) {
                item.previousItem = previousItem;
                if (previousItem != null) {
                    previousItem.nextItem = item;
                }
                previousItem = item;
            }
        }
        layerWindow_CollectItemsRecursive(result, parentLayer, currentDepth) {
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
                    this.layerWindow_CollectItemsRecursive(result, layer, currentDepth + 1);
                }
                siblingItem = item;
            }
        }
        layerWindow_FindCurrentItemIndex() {
            let wnd = this.layerWindow;
            for (let index = 0; index < wnd.layerWindowItems.length; index++) {
                let item = wnd.layerWindowItems[index];
                if (item.layer == this.toolContext.currentLayer) {
                    return index;
                }
            }
            return -1;
        }
        layerWindow_FindCurrentItem() {
            let wnd = this.layerWindow;
            let index = this.layerWindow_FindCurrentItemIndex();
            if (index != -1) {
                let item = wnd.layerWindowItems[index];
                return item;
            }
            return null;
        }
        layerWindow_SetViewLocationToItem(item) {
            let layerWindow = this.layerWindow;
            let viewTop = layerWindow.viewLocation[1];
            if (item.top < viewTop + layerWindow.layerCommandButtonButtom) {
                layerWindow.viewLocation[1] = item.top - layerWindow.layerCommandButtonButtom;
            }
            else if (item.top > viewTop + layerWindow.height - layerWindow.layerItemHeight * 2.0) {
                layerWindow.viewLocation[1] = item.top - layerWindow.height + layerWindow.layerItemHeight * 2.0;
            }
        }
        // Pallet selector window
        initializePalletSelectorWindow() {
            this.palletSelectorWindow.commandButtonAreas = new List();
            this.palletSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PalletSelectorWindowButtonID.lineColor).setIcon(5));
            this.palletSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PalletSelectorWindowButtonID.fillColor).setIcon(6));
        }
        subtoolWindow_CollectViewItems() {
            this.subToolViewItems = new List();
            let currentMainTool = this.getCurrentMainTool();
            for (let i = 0; i < currentMainTool.subTools.length; i++) {
                let tool = currentMainTool.subTools[i];
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
        subtoolWindow_CaluculateLayout(subtoolWindow) {
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
        getPalletSelectorWindow_SelectedColor() {
            let wnd = this.palletSelectorWindow;
            let env = this.toolEnv;
            if (wnd.currentTargetID == PalletSelectorWindowButtonID.lineColor) {
                return env.currentVectorLayer.layerColor;
            }
            else {
                return env.currentVectorLayer.fillColor;
            }
        }
        getPalletSelectorWindow_CurrentColor() {
            let wnd = this.palletSelectorWindow;
            let env = this.toolEnv;
            if (wnd.currentTargetID == PalletSelectorWindowButtonID.lineColor) {
                return env.getCurrentLayerLineColor();
            }
            else {
                return env.getCurrentLayerFillColor();
            }
        }
        setColorMixerValue(id, colorValue) {
            this.setInputElementNumber2Decimal(id + this.ID.colorMixer_id_number, colorValue);
            this.setInputElementRangeValue(id + this.ID.colorMixer_id_range, colorValue, 0.0, 1.0);
        }
        createModalOptionObject(targetElementId) {
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
        isModalShown() {
            return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
        }
        closeModal() {
            Custombox.modal.closeAll();
        }
        openModal(modalID, focusElementName) {
            this.currentModalDialogID = modalID;
            this.currentModalFocusElementID = focusElementName;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        }
        showMessageBox(text) {
            if (this.isModalShown()) {
                return;
            }
            this.setElementText(this.ID.messageDialogModal_message, text);
            this.openModal(this.ID.messageDialogModal, this.ID.messageDialogModal_ok);
        }
        openLayerPropertyModal(layer, layerWindowItem) {
            if (this.isModalShown()) {
                return;
            }
            // common layer properties
            let layerTypeName = this.layerTypeNameList[layer.type];
            this.setElementText(this.ID.layerPropertyModal_layerTypeName, layerTypeName);
            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);
            this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            this.setInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, layer.layerColor[3], 0.0, 1.0);
            this.setInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget, layer.isRenderTarget);
            this.setInputElementBoolean(this.ID.layerPropertyModal_isMaskedBelowLayer, layer.isMaskedByBelowLayer);
            // for each layer type properties
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                let vectorLayer = layer;
                this.setInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                this.setInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, vectorLayer.fillColor[3], 0.0, 1.0);
                this.setRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, vectorLayer.drawLineType);
                this.setRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, vectorLayer.fillAreaType);
            }
            this.layerPropertyWindow_EditLayer = layer;
            this.openModal(this.ID.layerPropertyModal, this.ID.layerPropertyModal_layerName);
        }
        onClosedLayerPropertyModal() {
            let layer = this.layerPropertyWindow_EditLayer;
            // common layer properties
            let layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);
            if (!StringIsNullOrEmpty(layerName)) {
                layer.name = layerName;
            }
            this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 0.0, 1.0);
            layer.isRenderTarget = this.getInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget);
            layer.isMaskedByBelowLayer = this.getInputElementBoolean(this.ID.layerPropertyModal_isMaskedBelowLayer);
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                let vectorLayer = layer;
                this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 0.0, 1.0);
                vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, ManualTracingTool.DrawLineTypeID.layerColor);
                vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, ManualTracingTool.FillAreaTypeID.fillColor);
            }
            this.layerPropertyWindow_EditLayer = null;
            this.onLayerPropertyModalClosed();
        }
        openPalletColorModal(mode, documentData, layer) {
            if (this.isModalShown()) {
                return;
            }
            if (layer == null || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                return;
            }
            let vectorLayer = layer;
            let targetName;
            let palletColorIndex;
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
        displayPalletColorModalColors(documentData, vectorLayer) {
            {
                let palletColorIndex;
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
        setColorPalletElementValue(palletColorIndex, color) {
            let id = this.ID.palletColorModal_colorValue + palletColorIndex;
            this.setInputElementColor(id, color);
        }
        onClosedPalletColorModal() {
            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;
            let palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            ;
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
        openOperationOptionModal() {
            if (this.isModalShown()) {
                return;
            }
            this.setInputElementNumber(this.ID.operationOptionModal_LineWidth, this.toolContext.drawLineBaseWidth);
            this.setInputElementNumber(this.ID.operationOptionModal_LineMinWidth, this.toolContext.drawLineMinWidth);
            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);
            this.openModal(this.ID.operationOptionModal, null);
        }
        openNewLayerCommandOptionModal() {
            if (this.isModalShown()) {
                return;
            }
            this.openModal(this.ID.newLayerCommandOptionModal, null);
        }
        openFileDialogModal(targetID, filePath) {
            if (this.isModalShown()) {
                return;
            }
            this.openFileDialogTargetID = targetID;
            this.openModal(this.ID.openFileDialogModal, null);
        }
        onClosedFileDialogModal() {
            this.toolEnv.updateContext();
            let filePath = this.getInputElementFilePath(this.ID.openFileDialogModal_file);
            let targetID = this.openFileDialogTargetID;
            this.openFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID.none;
            if (this.currentModalDialogResult != this.ID.openFileDialogModal_ok) {
                return;
            }
            if (targetID == ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {
                let currentTool = this.getCurrentTool();
                if (currentTool != null) {
                    if (!StringIsNullOrEmpty(filePath)) {
                        currentTool.onOpenFile(filePath, this.toolEnv);
                    }
                }
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.openDocument) {
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.saveDocument) {
            }
        }
        openDocumentSettingModal() {
            if (this.isModalShown()) {
                return;
            }
            let documentData = this.toolContext.document;
            this.setInputElementNumber(this.ID.documentSettingModal_ViewScale, documentData.defaultViewScale);
            this.setInputElementNumber(this.ID.documentSettingModal_LineWidth, documentData.lineWidthBiasRate);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, documentData.documentFrame[0]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, documentData.documentFrame[1]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, documentData.documentFrame[2]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, documentData.documentFrame[3]);
            this.openModal(this.ID.documentSettingModal, null);
        }
        onClosedDocumentSettingModal() {
            let documentData = this.toolContext.document;
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
        openExportImageFileModal() {
            if (this.isModalShown()) {
                return;
            }
            let exportFileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(exportFileName)) {
                this.setExportImageFileNameFromFileName();
            }
            this.setRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, this.toolContext.document.exportBackGroundType);
            this.openModal(this.ID.exportImageFileModal, this.ID.exportImageFileModal_ok);
        }
        setExportImageFileNameFromFileName() {
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
        openNewKeyframeModal() {
            this.openModal(this.ID.newKeyframeModal, null);
        }
        onClosedNewKeyframeModal() {
            if (this.currentModalDialogResult != this.ID.newKeyframeModal_ok) {
                return;
            }
            let env = this.toolEnv;
            let insertType = (this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));
            if (insertType == 1) {
                let command = new ManualTracingTool.Command_Animation_InsertKeyframeAllLayer();
                command.frame = env.document.animationSettingData.currentTimeFrame;
                command.prepareEditData(env);
                if (command.isAvailable(env)) {
                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
        }
        openDeleteKeyframeModal() {
            this.openModal(this.ID.deleteKeyframeModal, null);
        }
        onClosedDeleteKeyframeModal() {
            if (this.currentModalDialogResult != this.ID.deleteKeyframeModal_ok) {
                return;
            }
            let env = this.toolEnv;
            let insertType = (this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));
            if (insertType == 1) {
                let command = new ManualTracingTool.Command_Animation_DeleteKeyframeAllLayer();
                command.frame = env.document.animationSettingData.currentTimeFrame;
                command.prepareEditData(env);
                if (command.isAvailable(env)) {
                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
        }
        onModalWindowShown() {
            if (!StringIsNullOrEmpty(this.currentModalFocusElementID)) {
                let element = this.getElement(this.currentModalFocusElementID);
                element.focus();
            }
        }
        openFileDialog(targetID) {
            if (targetID == ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {
                if (this.toolContext.currentLayer != null
                    && this.toolContext.currentLayer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                    let filePath = (this.toolContext.currentLayer).imageFilePath;
                    this.openFileDialogModal(targetID, filePath);
                }
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.openDocument) {
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.saveDocument) {
            }
        }
        // Header window
        updateHeaderButtons() {
            {
                let isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.drawMode
                    && (this.toolContext.mainToolID == ManualTracingTool.MainToolID.drawLine
                        || this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing
                        || this.toolContext.mainToolID == ManualTracingTool.MainToolID.imageReferenceLayer));
                this.setHeaderButtonVisual(this.ID.menu_btnDrawTool, isButtonON);
            }
            {
                let isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.editMode);
                this.setHeaderButtonVisual(this.ID.menu_btnEditTool, isButtonON);
            }
            {
                let isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.drawMode
                    && this.toolContext.mainToolID == ManualTracingTool.MainToolID.misc);
                this.setHeaderButtonVisual(this.ID.menu_btnMiscTool, isButtonON);
            }
        }
        setHeaderButtonVisual(elementID, isSelected) {
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
        setHeaderDocumentFileName(lastURL) {
            this.setInputElementText(this.ID.fileName, lastURL);
        }
        updateFooterText() {
            if (this.footerText != this.footerTextBefore) {
                this.getElement(this.ID.footer).innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
        }
        // Hit test
        hitTestLayout(areas, x, y) {
            for (let area of areas) {
                if (this.hitTestLayoutRectangle(area, x, y)) {
                    return area;
                }
            }
            return null;
        }
        hitTestLayoutRectangle(area, x, y) {
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
        getElement(id) {
            let element = document.getElementById(id);
            if (element == null) {
                throw ('Could not find element "' + id + '"');
            }
            return element;
        }
        setElementText(id, text) {
            let element = (document.getElementById(id));
            element.innerText = text;
            return element;
        }
        setInputElementText(id, text) {
            let element = (document.getElementById(id));
            element.value = text;
            return element;
        }
        getInputElementText(id) {
            let element = (document.getElementById(id));
            return element.value;
        }
        setInputElementNumber(id, value) {
            let element = (document.getElementById(id));
            element.value = value.toString();
            return element;
        }
        setInputElementNumber2Decimal(id, value) {
            let element = (document.getElementById(id));
            element.value = value.toFixed(2);
            return element;
        }
        getInputElementNumber(id, defaultValue) {
            let element = (document.getElementById(id));
            if (element.value == '') {
                return defaultValue;
            }
            return Number(element.value);
        }
        setInputElementRangeValue(id, value, min, max) {
            let element = (document.getElementById(id));
            element.value = (value / max * Number(element.max)).toString();
            return element;
        }
        getInputElementRangeValue(id, min, max) {
            let element = (document.getElementById(id));
            let value = Number(element.value) / Number(element.max) * max;
            return value;
        }
        setRadioElementIntValue(elementName, value) {
            let valueText = value.toString();
            let elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                let radio = elements[i];
                radio.checked = (radio.value == valueText);
            }
        }
        getRadioElementIntValue(elementName, defaultValue) {
            let value = defaultValue;
            let elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                let radio = elements[i];
                if (radio.checked) {
                    value = (Number(radio.value));
                }
            }
            return value;
        }
        setInputElementBoolean(id, checked) {
            let element = (document.getElementById(id));
            element.checked = checked;
        }
        getInputElementBoolean(id) {
            let element = (document.getElementById(id));
            return element.checked;
        }
        setInputElementColor(id, color) {
            let colorText = '#' + ManualTracingTool.ColorLogic.rgbToHex2String(color);
            let element = (document.getElementById(id));
            element.value = colorText;
            return color;
        }
        getInputElementColor(id, result) {
            let element = (document.getElementById(id));
            let colorText = element.value;
            ManualTracingTool.ColorLogic.hex2StringToRGB(result, colorText);
            return result;
        }
        getInputElementFilePath(id) {
            let element = (document.getElementById(id));
            if (element.files.length == 0) {
                return null;
            }
            let file = element.files[0];
            return file.path;
        }
    }
    ManualTracingTool.App_View = App_View;
    class MainWindow extends ManualTracingTool.ToolBaseWindow {
        constructor() {
            super(...arguments);
            this.dragBeforeTransformMatrix = mat4.create();
        }
    }
    ManualTracingTool.MainWindow = MainWindow;
    class EditorWindow extends ManualTracingTool.ToolBaseWindow {
    }
    ManualTracingTool.EditorWindow = EditorWindow;
    class LayerWindow extends ManualTracingTool.ToolBaseWindow {
        constructor() {
            super(...arguments);
            this.layerItemButtonScale = 0.5;
            this.layerItemButtonWidth = 64.0;
            this.layerItemButtonHeight = 64.0;
            this.layerItemButtonButtom = 64.0;
            this.layerCommandButtonButtom = 0.0;
            this.layerItemHeight = 24.0;
            this.layerItemFontSize = 16.0;
            this.layerItemVisibilityIconWidth = 24.0;
            this.layerItemVisibilityIconRight = 24.0;
            this.layerItemsBottom = 0.0;
            this.layerWindowLayoutArea = new RectangleLayoutArea();
            this.layerWindowItems = new List();
            this.layerWindowCommandButtons = null;
        }
    }
    ManualTracingTool.LayerWindow = LayerWindow;
    class SubtoolWindow extends ManualTracingTool.ToolBaseWindow {
        constructor() {
            super(...arguments);
            this.subToolItemScale = 0.5;
            this.subToolItemUnitWidth = 256;
            this.subToolItemUnitHeight = 128;
            this.subToolItemsBottom = 0.0;
        }
    }
    ManualTracingTool.SubtoolWindow = SubtoolWindow;
    class ColorCanvasWindow extends ManualTracingTool.ToolBaseWindow {
    }
    ManualTracingTool.ColorCanvasWindow = ColorCanvasWindow;
    class RectangleLayoutArea {
        constructor() {
            this.index = -1;
            this.iconID = -1;
            this.marginTop = 0.0;
            this.marginRight = 0.0;
            this.marginBottom = 0.0;
            this.marginLeft = 0.0;
            this.top = 0.0;
            this.right = 0.0;
            this.bottom = 0.0;
            this.left = 0.0;
            this.borderTop = 0.0;
            this.borderRight = 0.0;
            this.borderBottom = 0.0;
            this.borderLeft = 0.0;
            this.paddingTop = 0.0;
            this.paddingRight = 0.0;
            this.paddingBottom = 0.0;
            this.paddingLeft = 0.0;
        }
        setIndex(index) {
            this.index = index;
            return this;
        }
        setIcon(index) {
            this.iconID = index;
            return this;
        }
        getWidth() {
            return (this.right - this.left + 1.0);
        }
        getHeight() {
            return (this.bottom - this.top + 1.0);
        }
        copyRectangle(canvasWindow) {
            this.left = 0.0;
            this.top = 0.0;
            this.right = canvasWindow.width - 1.0;
            this.bottom = canvasWindow.width - 1.0;
        }
    }
    ManualTracingTool.RectangleLayoutArea = RectangleLayoutArea;
    class TimeLineWindow extends ManualTracingTool.ToolBaseWindow {
        constructor() {
            super(...arguments);
            this.leftPanelWidth = 100.0;
            this.frameUnitWidth = 8.0;
        }
        getFrameUnitWidth(aniSetting) {
            return this.frameUnitWidth * aniSetting.timeLineWindowScale;
        }
        getTimeLineLeft() {
            return this.leftPanelWidth;
        }
        getTimeLineRight() {
            return this.getTimeLineLeft() + this.width - 1;
        }
        getFrameByLocation(x, aniSetting) {
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
        getFrameLocation(frame, aniSetting) {
            let left = this.getTimeLineLeft();
            let frameUnitWidth = this.getFrameUnitWidth(aniSetting);
            let x = left - aniSetting.timeLineWindowViewLocationX + frame * frameUnitWidth;
            return x;
        }
    }
    ManualTracingTool.TimeLineWindow = TimeLineWindow;
    let PalletSelectorWindowButtonID;
    (function (PalletSelectorWindowButtonID) {
        PalletSelectorWindowButtonID[PalletSelectorWindowButtonID["none"] = 0] = "none";
        PalletSelectorWindowButtonID[PalletSelectorWindowButtonID["lineColor"] = 1] = "lineColor";
        PalletSelectorWindowButtonID[PalletSelectorWindowButtonID["fillColor"] = 2] = "fillColor";
    })(PalletSelectorWindowButtonID = ManualTracingTool.PalletSelectorWindowButtonID || (ManualTracingTool.PalletSelectorWindowButtonID = {}));
    class PalletSelectorWindow extends ManualTracingTool.ToolBaseWindow {
        constructor() {
            super(...arguments);
            this.leftMargin = 4.0;
            this.topMargin = 5.0;
            this.rightMargin = 5.0;
            this.buttonScale = 0.5;
            this.buttonWidth = 64.0;
            this.buttonHeight = 64.0;
            this.buttonRightMargin = 5.0;
            this.buttonBottomMargin = 5.0;
            this.commandButtonsBottom = 0.0;
            this.commandButtonAreas = new List();
            this.itemScale = 1.0;
            this.itemWidth = 34.0;
            this.itemHeight = 15.0;
            this.itemRightMargin = 5.0;
            this.itemBottomMargin = 5.0;
            this.itemAreas = new List();
            this.currentTargetID = PalletSelectorWindowButtonID.lineColor;
        }
    }
    ManualTracingTool.PalletSelectorWindow = PalletSelectorWindow;
    let LayerWindowButtonID;
    (function (LayerWindowButtonID) {
        LayerWindowButtonID[LayerWindowButtonID["none"] = 0] = "none";
        LayerWindowButtonID[LayerWindowButtonID["addLayer"] = 1] = "addLayer";
        LayerWindowButtonID[LayerWindowButtonID["deleteLayer"] = 2] = "deleteLayer";
        LayerWindowButtonID[LayerWindowButtonID["moveUp"] = 3] = "moveUp";
        LayerWindowButtonID[LayerWindowButtonID["moveDown"] = 4] = "moveDown";
    })(LayerWindowButtonID = ManualTracingTool.LayerWindowButtonID || (ManualTracingTool.LayerWindowButtonID = {}));
    class LayerWindowItem extends RectangleLayoutArea {
        constructor() {
            super(...arguments);
            this.layer = null;
            this.parentLayer = null;
            this.previousItem = null;
            this.nextItem = null;
            this.previousSiblingItem = null;
            this.nextSiblingItem = null;
            this.hierarchyDepth = 0;
            this.margine = 0.0;
            this.visibilityIconWidth = 0.0;
            this.textLeft = 0.0;
        }
    }
    ManualTracingTool.LayerWindowItem = LayerWindowItem;
    class SubToolViewItem extends RectangleLayoutArea {
        constructor() {
            super(...arguments);
            this.toolIndex = 0;
            this.tool = null;
            this.buttons = new List();
        }
    }
    ManualTracingTool.SubToolViewItem = SubToolViewItem;
    class SubToolViewItemOptionButton extends RectangleLayoutArea {
    }
    ManualTracingTool.SubToolViewItemOptionButton = SubToolViewItemOptionButton;
    let OpenPalletColorModalMode;
    (function (OpenPalletColorModalMode) {
        OpenPalletColorModalMode[OpenPalletColorModalMode["LineColor"] = 1] = "LineColor";
        OpenPalletColorModalMode[OpenPalletColorModalMode["FillColor"] = 2] = "FillColor";
    })(OpenPalletColorModalMode = ManualTracingTool.OpenPalletColorModalMode || (ManualTracingTool.OpenPalletColorModalMode = {}));
    let NewLayerTypeID;
    (function (NewLayerTypeID) {
        NewLayerTypeID[NewLayerTypeID["none"] = 0] = "none";
        NewLayerTypeID[NewLayerTypeID["rootLayer"] = 1] = "rootLayer";
        NewLayerTypeID[NewLayerTypeID["vectorLayer"] = 2] = "vectorLayer";
        NewLayerTypeID[NewLayerTypeID["vectorLayer_Fill"] = 3] = "vectorLayer_Fill";
        NewLayerTypeID[NewLayerTypeID["groupLayer"] = 4] = "groupLayer";
        NewLayerTypeID[NewLayerTypeID["imageFileReferenceLayer"] = 5] = "imageFileReferenceLayer";
        NewLayerTypeID[NewLayerTypeID["posingLayer"] = 6] = "posingLayer";
        NewLayerTypeID[NewLayerTypeID["vectorLayerReferenceLayer"] = 7] = "vectorLayerReferenceLayer";
    })(NewLayerTypeID = ManualTracingTool.NewLayerTypeID || (ManualTracingTool.NewLayerTypeID = {}));
    class HTMLElementID {
        constructor() {
            this.none = 'none';
            this.fileName = 'fileName';
            this.footer = 'footer';
            this.mainCanvas = 'mainCanvas';
            this.editorCanvas = 'editorCanvas';
            this.webglCanvas = 'webglCanvas';
            this.layerCanvas = 'layerCanvas';
            this.subtoolCanvas = 'subtoolCanvas';
            this.timeLineCanvas = 'timeLineCanvas';
            this.palletSelectorCanvas = 'palletSelectorCanvas';
            this.colorMixerWindow_colorCanvas = 'colorMixer_colorCanvas';
            this.menu_btnDrawTool = 'menu_btnDrawTool';
            this.menu_btnMiscTool = 'menu_btnMiscTool';
            this.menu_btnEditTool = 'menu_btnEditTool';
            this.menu_btnOperationOption = 'menu_btnOperationOption';
            this.menu_btnOpen = 'menu_btnOpen';
            this.menu_btnSave = 'menu_btnSave';
            this.menu_btnExport = 'menu_btnExport';
            this.menu_btnProperty = 'menu_btnProperty';
            this.menu_btnPalette1 = 'menu_btnPalette1';
            this.menu_btnPalette2 = 'menu_btnPalette2';
            this.unselectedMainButton = 'unselectedMainButton';
            this.selectedMainButton = 'selectedMainButton';
            this.colorMixer_id_number = '_number';
            this.colorMixer_id_range = '_range';
            this.colorMixer_alpha = 'colorMixer_alpha';
            this.colorMixer_red = 'colorMixer_red';
            this.colorMixer_green = 'colorMixer_green';
            this.colorMixer_blue = 'colorMixer_blue';
            this.colorMixer_hue = 'colorMixer_hue';
            this.colorMixer_sat = 'colorMixer_sat';
            this.colorMixer_val = 'colorMixer_val';
            this.messageDialogModal = '#messageDialogModal';
            this.messageDialogModal_message = 'messageDialogModal_message';
            this.messageDialogModal_ok = 'messageDialogModal_ok';
            this.openFileDialogModal = '#openFileDialogModal';
            this.openFileDialogModal_file = 'openFileDialogModal_file';
            this.openFileDialogModal_ok = 'openFileDialogModal_ok';
            this.openFileDialogModal_cancel = 'openFileDialogModal_cancel';
            this.layerPropertyModal = '#layerPropertyModal';
            this.layerPropertyModal_layerTypeName = 'layerPropertyModal_layerTypeName';
            this.layerPropertyModal_layerName = 'layerPropertyModal_layerName';
            this.layerPropertyModal_layerColor = 'layerPropertyModal_layerColor';
            this.layerPropertyModal_layerAlpha = 'layerPropertyModal_layerAlpha';
            this.layerPropertyModal_drawLineType = 'layerPropertyModal_drawLineType';
            this.layerPropertyModal_fillColor = 'layerPropertyModal_fillColor';
            this.layerPropertyModal_fillColorAlpha = 'layerPropertyModal_fillColorAlpha';
            this.layerPropertyModal_fillAreaType = 'layerPropertyModal_fillAreaType';
            this.layerPropertyModal_isRenderTarget = 'layerPropertyModal_isRenderTarget';
            this.layerPropertyModal_isMaskedBelowLayer = 'layerPropertyModal_isMaskedBelowLayer';
            this.palletColorModal = '#palletColorModal';
            this.palletColorModal_targetName = 'palletColorModal_targetName';
            this.palletColorModal_currentColor = 'palletColorModal_currentColor';
            this.palletColorModal_currentAlpha = 'palletColorModal_currentAlpha';
            this.palletColorModal_colors = 'palletColorModal_colors';
            this.palletColorModal_colorItemStyle = 'colorItem';
            this.palletColorModal_colorIndex = 'palletColorModal_colorIndex';
            this.palletColorModal_colorValue = 'palletColorModal_colorValue';
            this.palletColorModal_colorCanvas = 'palletColorModal_colorCanvas';
            this.operationOptionModal = '#operationOptionModal';
            this.operationOptionModal_LineWidth = 'operationOptionModal_LineWidth';
            this.operationOptionModal_LineMinWidth = 'operationOptionModal_LineMinWidth';
            this.operationOptionModal_operationUnit = 'operationOptionModal_operationUnit';
            this.newLayerCommandOptionModal = '#newLayerCommandOptionModal';
            this.newLayerCommandOptionModal_layerType = 'newLayerCommandOptionModal_layerType';
            this.newLayerCommandOptionModal_ok = 'newLayerCommandOptionModal_ok';
            this.newLayerCommandOptionModal_cancel = 'newLayerCommandOptionModal_cancel';
            this.documentSettingModal = '#documentSettingModal';
            this.documentSettingModal_ViewScale = 'documentSettingModal_ViewScale';
            this.documentSettingModal_LineWidth = 'documentSettingModal_LineWidth';
            this.documentSettingModal_FrameLeft = 'documentSettingModal_FrameLeft';
            this.documentSettingModal_FrameTop = 'documentSettingModal_FrameTop';
            this.documentSettingModal_FrameRight = 'documentSettingModal_FrameRight';
            this.documentSettingModal_FrameBottom = 'documentSettingModal_FrameBottom';
            this.exportImageFileModal = '#exportImageFileModal';
            this.exportImageFileModal_fileName = 'exportImageFileModal_fileName';
            this.exportImageFileModal_imageFileType = 'exportImageFileModal_imageFileType';
            this.exportImageFileModal_backGroundType = 'exportImageFileModal_backGroundType';
            this.exportImageFileModal_scale = 'exportImageFileModal_scale';
            this.exportImageFileModal_ok = 'exportImageFileModal_ok';
            this.exportImageFileModal_cancel = 'exportImageFileModal_cancel';
            this.newKeyframeModal = '#newKeyframeModal';
            this.newKeyframeModal_InsertType = 'newKeyframeModal_InsertType';
            this.newKeyframeModal_ok = 'newKeyframeModal_ok';
            this.newKeyframeModal_cancel = 'newKeyframeModal_cancel';
            this.deleteKeyframeModal = '#deleteKeyframeModal';
            this.deleteKeyframeModal_InsertType = 'deleteKeyframeModal_InsertType';
            this.deleteKeyframeModal_ok = 'deleteKeyframeModal_ok';
            this.deleteKeyframeModal_cancel = 'deleteKeyframeModal_cancel';
        }
    }
    ManualTracingTool.HTMLElementID = HTMLElementID;
})(ManualTracingTool || (ManualTracingTool = {}));
