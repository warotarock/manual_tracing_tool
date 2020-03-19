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
    var App_View = /** @class */ (function () {
        function App_View() {
            // HTML elements
            this.ID = new HTMLElementID();
            this.mainWindow = new MainWindow();
            this.editorWindow = new ManualTracingTool.CanvasWindow();
            this.layerWindow = new LayerWindow();
            //subtoolWindow = new SubtoolWindow();
            this.timeLineWindow = new TimeLineWindow();
            this.paletteSelectorWindow = new PaletteSelectorWindow();
            this.colorMixerWindow_colorCanvas = new ColorCanvasWindow();
            this.paletteColorModal_colorCanvas = new ColorCanvasWindow();
            this.uiSubToolWindowRef = {};
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
            this.paletteColorWindow_EditLayer = null;
            this.paletteColorWindow_Mode = OpenPaletteColorModalMode.LineColor;
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
        App_View.prototype.getLocalSetting = function () {
            return null;
        };
        App_View.prototype.getCurrentMainTool = function () {
            return null;
        };
        App_View.prototype.getCurrentTool = function () {
            return null;
        };
        App_View.prototype.isWhileLoading = function () {
            return false;
        };
        App_View.prototype.isEventDisabled = function () {
            return false;
        };
        // Initializing devices not depending media resoures
        App_View.prototype.initializeViewDevices = function () {
            this.resizeWindows();
            this.mainWindow.initializeContext();
            this.editorWindow.initializeContext();
            this.foreLayerRenderWindow.initializeContext();
            this.backLayerRenderWindow.initializeContext();
            this.layerWindow.initializeContext();
            //this.subtoolWindow.initializeContext();
            this.paletteSelectorWindow.initializeContext();
            this.colorMixerWindow_colorCanvas.initializeContext();
            this.timeLineWindow.initializeContext();
            this.exportRenderWindow.initializeContext();
            this.paletteColorModal_colorCanvas.initializeContext();
            this.layerWindow_Initialize();
            this.initializePaletteSelectorWindow();
        };
        // Initializing after loading resources
        App_View.prototype.initializeViewState = function () {
            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;
            this.setCanvasSizeFromStyle(this.colorMixerWindow_colorCanvas);
            this.setCanvasSizeFromStyle(this.paletteColorModal_colorCanvas);
        };
        // View management
        App_View.prototype.resizeWindows = function () {
            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow, 1);
            this.fitCanvas(this.foreLayerRenderWindow, this.mainWindow, 1);
            this.fitCanvas(this.backLayerRenderWindow, this.mainWindow, 1);
            this.fitCanvas(this.webglWindow, this.mainWindow, 1);
            this.fitCanvas(this.drawGPUWindow, this.mainWindow, 2.0);
            this.resizeCanvasToCurrent(this.layerWindow);
            //this.resizeCanvasToCurrent(this.subtoolWindow);
            this.resizeCanvasToCurrent(this.paletteSelectorWindow);
            this.resizeCanvasToCurrent(this.timeLineWindow);
        };
        App_View.prototype.resizeCanvasToParent = function (canvasWindow) {
            var rect = canvasWindow.canvas.parentElement.getBoundingClientRect();
            canvasWindow.width = rect.width - 2;
            canvasWindow.height = rect.height - 2;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        App_View.prototype.resizeCanvasToCurrent = function (canvasWindow) {
            canvasWindow.width = canvasWindow.canvas.clientWidth;
            canvasWindow.height = canvasWindow.canvas.clientHeight;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        App_View.prototype.fitCanvas = function (canvasWindow, fitToWindow, scale) {
            canvasWindow.width = fitToWindow.width * scale;
            canvasWindow.height = fitToWindow.height * scale;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        App_View.prototype.setCanvasSizeFromStyle = function (canvasWindow) {
            var style = window.getComputedStyle(canvasWindow.canvas);
            canvasWindow.width = Number(style.width.replace('px', ''));
            canvasWindow.height = Number(style.height.replace('px', ''));
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        App_View.prototype.processMouseEventInput = function (toolMouseEvent, e, touchUp, canvasWindow) {
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
        };
        App_View.prototype.getTouchInfo = function (toolMouseEvent, e, touchDown, touchUp, canvasWindow) {
            this.activeCanvasWindow = canvasWindow;
            if (e.touches == undefined || e.touches.length == 0) {
                toolMouseEvent.button = 0;
                toolMouseEvent.buttons = 0;
                return;
            }
            //console.log(e.touches.length);
            var rect = canvasWindow.canvas.getBoundingClientRect();
            var touch = e.touches[0];
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
        };
        App_View.prototype.calculateTransfomredLocation = function (resultVec, canvasWindow, x, y) {
            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);
            vec3.set(this.tempVec3, x, y, 0.0);
            vec3.transformMat4(resultVec, this.tempVec3, this.invView2DMatrix);
        };
        App_View.prototype.calculateTransfomredMouseParams = function (toolMouseEvent, canvasWindow) {
            this.calculateTransfomredLocation(toolMouseEvent.location, canvasWindow, toolMouseEvent.offsetX, toolMouseEvent.offsetY);
            vec3.copy(this.toolEnv.mouseCursorLocation, toolMouseEvent.location);
        };
        App_View.prototype.getWheelInfo = function (toolMouseEvent, e) {
            var wheelDelta = 0.0;
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
        };
        App_View.prototype.startShowingLayerItem = function (item) {
            if (item != null) {
                this.selectCurrentLayerAnimationLayer = item.layer;
                this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax;
                this.toolEnv.setRedrawMainWindow();
                this.layerWindow_SetViewLocationToItem(item);
            }
        };
        App_View.prototype.startShowingCurrentLayer = function () {
            var item = this.layerWindow_FindCurrentItem();
            this.startShowingLayerItem(item);
        };
        App_View.prototype.copyLastViewLocation = function (setUpdate) {
            this.isViewLocationMoved = setUpdate;
            vec3.copy(this.lastViewLocation, this.mainWindow.viewLocation);
            this.lastViewScale = this.mainWindow.viewScale;
            this.lastViewRotation = this.mainWindow.viewRotation;
        };
        App_View.prototype.setViewRotation = function (rotation) {
            var env = this.toolEnv;
            this.copyLastViewLocation(true);
            if (this.mainWindow.viewRotation >= 360.0) {
                this.mainWindow.viewRotation -= 360.0;
            }
            if (this.mainWindow.viewRotation <= 0.0) {
                this.mainWindow.viewRotation += 360.0;
            }
            env.setRedrawMainWindowEditorWindow();
        };
        App_View.prototype.addViewScale = function (addScale) {
            var env = this.toolEnv;
            this.copyLastViewLocation(true);
            this.mainWindow.addViewScale(addScale);
            env.setRedrawMainWindowEditorWindow();
        };
        // ViewKeyframe for timeline
        App_View.prototype.collectViewKeyframeContext = function () {
            var context = this.toolContext;
            // Collects layers
            var layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, context.document.rootLayer);
            // Creates all view-keyframes.
            var viewKeyFrames = new List();
            this.collectViewKeyframeContext_CollectKeyframes(viewKeyFrames, layers);
            var sortedViewKeyFrames = viewKeyFrames.sort(function (a, b) { return a.frame - b.frame; });
            // Collects layers for each view-keyframes
            this.collectViewKeyframeContext_CollectKeyframeLayers(sortedViewKeyFrames, layers);
            this.viewLayerContext.keyframes = sortedViewKeyFrames;
        };
        App_View.prototype.collectViewKeyframeContext_CollectKeyframes = function (result, layers) {
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
        App_View.prototype.collectViewKeyframeContext_CollectKeyframeLayers = function (result, layers) {
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
        App_View.prototype.findNextViewKeyframeIndex = function (startFrame, searchDirection) {
            var resultFrame = -1;
            var viewKeyframes = this.viewLayerContext.keyframes;
            var startKeyframeIndex = ManualTracingTool.ViewKeyframe.findViewKeyframeIndex(viewKeyframes, startFrame);
            if (startKeyframeIndex == -1) {
                return -1;
            }
            var resultIndex = startKeyframeIndex + searchDirection;
            if (resultIndex < 0) {
                return 0;
            }
            if (resultIndex >= viewKeyframes.length) {
                return viewKeyframes.length - 1;
            }
            return resultIndex;
        };
        App_View.prototype.findNextViewKeyframeFrame = function (startFrame, searchDirection) {
            var resultFrame = -1;
            var keyframeIndex = this.findNextViewKeyframeIndex(startFrame, searchDirection);
            if (keyframeIndex == -1) {
                return -2;
            }
            else {
                return this.viewLayerContext.keyframes[keyframeIndex].frame;
            }
        };
        // Laye window
        App_View.prototype.layerWindow_Initialize = function () {
            var wnd = this.layerWindow;
            wnd.layerWindowCommandButtons = new List();
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.addLayer).setIcon(1));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.deleteLayer).setIcon(2));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.moveUp).setIcon(3));
            wnd.layerWindowCommandButtons.push((new RectangleLayoutArea()).setIndex(LayerWindowButtonID.moveDown).setIcon(4));
        };
        App_View.prototype.layerWindow_CollectItems = function (document) {
            var wnd = this.layerWindow;
            wnd.layerWindowItems = new List();
            this.layerWindow_CollectItemsRecursive(wnd.layerWindowItems, document.rootLayer, 0);
            var previousItem = null;
            for (var _i = 0, _a = wnd.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.previousItem = previousItem;
                if (previousItem != null) {
                    previousItem.nextItem = item;
                }
                previousItem = item;
            }
        };
        App_View.prototype.layerWindow_CollectItemsRecursive = function (result, parentLayer, currentDepth) {
            var siblingItem = null;
            for (var _i = 0, _a = parentLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                var item = new LayerWindowItem();
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
        };
        App_View.prototype.layerWindow_FindCurrentItemIndex = function () {
            var wnd = this.layerWindow;
            for (var index = 0; index < wnd.layerWindowItems.length; index++) {
                var item = wnd.layerWindowItems[index];
                if (item.layer == this.toolContext.currentLayer) {
                    return index;
                }
            }
            return -1;
        };
        App_View.prototype.layerWindow_FindCurrentItem = function () {
            var wnd = this.layerWindow;
            var index = this.layerWindow_FindCurrentItemIndex();
            if (index != -1) {
                var item = wnd.layerWindowItems[index];
                return item;
            }
            return null;
        };
        App_View.prototype.layerWindow_SetViewLocationToItem = function (item) {
            var layerWindow = this.layerWindow;
            var viewTop = layerWindow.viewLocation[1];
            if (item.top < viewTop + layerWindow.layerCommandButtonButtom) {
                layerWindow.viewLocation[1] = item.top - layerWindow.layerCommandButtonButtom;
            }
            else if (item.top > viewTop + layerWindow.height - layerWindow.layerItemHeight * 2.0) {
                layerWindow.viewLocation[1] = item.top - layerWindow.height + layerWindow.layerItemHeight * 2.0;
            }
        };
        // Palette selector window
        App_View.prototype.initializePaletteSelectorWindow = function () {
            this.paletteSelectorWindow.commandButtonAreas = new List();
            this.paletteSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.lineColor).setIcon(5));
            this.paletteSelectorWindow.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.fillColor).setIcon(6));
        };
        App_View.prototype.paletteSelector_SetCurrentModeForCurrentLayer = function () {
            if (ManualTracingTool.VectorLayer.isVectorLayer(this.toolContext.currentLayer)) {
                var vectorLayer = (this.toolContext.currentLayer);
                if (vectorLayer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                    this.paletteSelectorWindow.currentTargetID = PaletteSelectorWindowButtonID.fillColor;
                }
                else if (vectorLayer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                    this.paletteSelectorWindow.currentTargetID = PaletteSelectorWindowButtonID.lineColor;
                }
            }
        };
        App_View.prototype.subtoolWindow_CollectViewItems = function () {
            this.subToolViewItems = new List();
            var currentMainTool = this.getCurrentMainTool();
            for (var i = 0; i < currentMainTool.subTools.length; i++) {
                var tool = currentMainTool.subTools[i];
                var viewItem = new SubToolViewItem();
                viewItem.subToolIndex = i;
                viewItem.tool = tool;
                // TODO: 再描画時と同じ処理をしているため共通化する
                viewItem.isAvailable = tool.isAvailable(this.toolEnv);
                if (viewItem.buttons.length > 0) {
                    // TODO: 複数ボタンが必要か検討
                    viewItem.buttonStateID = tool.getInputSideID(0, this.toolEnv);
                }
                for (var buttonIndex = 0; buttonIndex < tool.inputSideOptionCount; buttonIndex++) {
                    var button = new SubToolViewItemOptionButton();
                    button.index = buttonIndex;
                    viewItem.buttons.push(button);
                }
                this.subToolViewItems.push(viewItem);
            }
        };
        //protected subtoolWindow_CaluculateLayout(subtoolWindow: SubtoolWindow) {
        //    let scale = subtoolWindow.subToolItemScale;
        //    let fullWidth = subtoolWindow.width - 1;
        //    let unitHeight = subtoolWindow.subToolItemUnitHeight * scale - 1;
        //    let currentY = 0;
        //    for (let viewItem of this.subToolViewItems) {
        //        viewItem.left = 0.0;
        //        viewItem.top = currentY;
        //        viewItem.right = fullWidth;
        //        viewItem.bottom = currentY + unitHeight - 1;
        //        currentY += unitHeight;
        //    }
        //    subtoolWindow.subToolItemsBottom = currentY;
        //}
        // Color mixer window
        App_View.prototype.getPaletteSelectorWindow_SelectedColor = function () {
            var wnd = this.paletteSelectorWindow;
            var env = this.toolEnv;
            if (wnd.currentTargetID == PaletteSelectorWindowButtonID.lineColor) {
                return env.currentVectorLayer.layerColor;
            }
            else {
                return env.currentVectorLayer.fillColor;
            }
        };
        App_View.prototype.getPaletteSelectorWindow_CurrentColor = function () {
            var wnd = this.paletteSelectorWindow;
            var env = this.toolEnv;
            if (wnd.currentTargetID == PaletteSelectorWindowButtonID.lineColor) {
                return env.getCurrentLayerLineColor();
            }
            else {
                return env.getCurrentLayerFillColor();
            }
        };
        App_View.prototype.setColorMixerValue = function (id, colorValue) {
            this.setInputElementNumber2Decimal(id + this.ID.colorMixer_id_number, colorValue);
            this.setInputElementRangeValue(id + this.ID.colorMixer_id_range, colorValue, 0.0, 1.0);
        };
        App_View.prototype.createModalOptionObject = function (targetElementId) {
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
        };
        App_View.prototype.isModalShown = function () {
            return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
        };
        App_View.prototype.closeModal = function () {
            Custombox.modal.closeAll();
        };
        App_View.prototype.openModal = function (modalID, focusElementName) {
            this.currentModalDialogID = modalID;
            this.currentModalFocusElementID = focusElementName;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        };
        App_View.prototype.showMessageBox = function (text) {
            if (this.isModalShown()) {
                return;
            }
            this.setElementText(this.ID.messageDialogModal_message, text);
            this.openModal(this.ID.messageDialogModal, this.ID.messageDialogModal_ok);
        };
        App_View.prototype.openLayerPropertyModal = function (layer, layerWindowItem) {
            if (this.isModalShown()) {
                return;
            }
            // common layer properties
            var layerTypeName = this.layerTypeNameList[layer.type];
            this.setElementText(this.ID.layerPropertyModal_layerTypeName, layerTypeName);
            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);
            this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            this.setInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, layer.layerColor[3], 0.0, 1.0);
            this.setInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget, layer.isRenderTarget);
            this.setInputElementBoolean(this.ID.layerPropertyModal_isMaskedBelowLayer, layer.isMaskedByBelowLayer);
            // for each layer type properties
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.setInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                this.setInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, vectorLayer.fillColor[3], 0.0, 1.0);
                this.setRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, vectorLayer.drawLineType);
                this.setRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, vectorLayer.fillAreaType);
            }
            this.layerPropertyWindow_EditLayer = layer;
            this.openModal(this.ID.layerPropertyModal, this.ID.layerPropertyModal_layerName);
        };
        App_View.prototype.onClosedLayerPropertyModal = function () {
            var layer = this.layerPropertyWindow_EditLayer;
            // common layer properties
            var layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);
            if (!StringIsNullOrEmpty(layerName)) {
                layer.name = layerName;
            }
            this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 0.0, 1.0);
            layer.isRenderTarget = this.getInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget);
            layer.isMaskedByBelowLayer = this.getInputElementBoolean(this.ID.layerPropertyModal_isMaskedBelowLayer);
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 0.0, 1.0);
                vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, ManualTracingTool.DrawLineTypeID.layerColor);
                vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, ManualTracingTool.FillAreaTypeID.fillColor);
            }
            this.layerPropertyWindow_EditLayer = null;
        };
        App_View.prototype.openPaletteColorModal = function (mode, documentData, layer) {
            if (this.isModalShown()) {
                return;
            }
            if (layer == null || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                return;
            }
            var vectorLayer = layer;
            var targetName;
            var paletteColorIndex;
            if (mode == OpenPaletteColorModalMode.LineColor) {
                targetName = '線色';
                paletteColorIndex = vectorLayer.line_PaletteColorIndex;
            }
            else {
                targetName = '塗りつぶし色';
                paletteColorIndex = vectorLayer.fill_PaletteColorIndex;
            }
            this.setElementText(this.ID.paletteColorModal_targetName, targetName);
            this.setRadioElementIntValue(this.ID.paletteColorModal_colorIndex, paletteColorIndex);
            this.paletteColorWindow_Mode = mode;
            this.currentModalDialog_DocumentData = documentData;
            this.paletteColorWindow_EditLayer = vectorLayer;
            this.displayPaletteColorModalColors(documentData, vectorLayer);
            this.openModal(this.ID.paletteColorModal, null);
        };
        App_View.prototype.displayPaletteColorModalColors = function (documentData, vectorLayer) {
            {
                var paletteColorIndex = void 0;
                if (this.paletteColorWindow_Mode == OpenPaletteColorModalMode.LineColor) {
                    paletteColorIndex = vectorLayer.line_PaletteColorIndex;
                }
                else {
                    paletteColorIndex = vectorLayer.fill_PaletteColorIndex;
                }
                var paletteColor = documentData.paletteColors[paletteColorIndex];
                this.setInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
                this.setInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, paletteColor.color[3], 0.0, 1.0);
            }
            for (var paletteColorIndex = 0; paletteColorIndex < documentData.paletteColors.length; paletteColorIndex++) {
                var paletteColor = documentData.paletteColors[paletteColorIndex];
                this.setColorPaletteElementValue(paletteColorIndex, paletteColor.color);
            }
        };
        App_View.prototype.setColorPaletteElementValue = function (paletteColorIndex, color) {
            var id = this.ID.paletteColorModal_colorValue + paletteColorIndex;
            this.setInputElementColor(id, color);
        };
        App_View.prototype.onClosedPaletteColorModal = function () {
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.paletteColorWindow_EditLayer;
            var paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);
            ;
            if (this.paletteColorWindow_Mode == OpenPaletteColorModalMode.LineColor) {
                vectorLayer.line_PaletteColorIndex = paletteColorIndex;
            }
            else {
                vectorLayer.fill_PaletteColorIndex = paletteColorIndex;
            }
            var updateOnClose = false;
            if (updateOnClose) {
                {
                    var paletteColor = documentData.paletteColors[paletteColorIndex];
                    this.getInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
                    paletteColor.color[3] = this.getInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, 0.0, 1.0);
                }
                for (var i = 0; i < documentData.paletteColors.length; i++) {
                    var paletteColor = documentData.paletteColors[i];
                    var id = this.ID.paletteColorModal_colorValue + i;
                    this.getInputElementColor(id, paletteColor.color);
                }
            }
            this.currentModalDialog_DocumentData = null;
            this.paletteColorWindow_EditLayer = null;
        };
        App_View.prototype.openOperationOptionModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.setInputElementNumber(this.ID.operationOptionModal_LineWidth, this.toolContext.drawLineBaseWidth);
            this.setInputElementNumber(this.ID.operationOptionModal_LineMinWidth, this.toolContext.drawLineMinWidth);
            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);
            this.openModal(this.ID.operationOptionModal, null);
        };
        App_View.prototype.openNewLayerCommandOptionModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.openModal(this.ID.newLayerCommandOptionModal, null);
        };
        App_View.prototype.openFileDialogModal = function (targetID, filePath) {
            if (this.isModalShown()) {
                return;
            }
            this.openFileDialogTargetID = targetID;
            this.openModal(this.ID.openFileDialogModal, null);
        };
        App_View.prototype.onClosedFileDialogModal = function () {
            this.toolEnv.updateContext();
            var filePath = this.getInputElementFilePath(this.ID.openFileDialogModal_file);
            var targetID = this.openFileDialogTargetID;
            this.openFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID.none;
            if (this.currentModalDialogResult != this.ID.openFileDialogModal_ok) {
                return;
            }
            if (targetID == ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {
                var currentTool = this.getCurrentTool();
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
        };
        App_View.prototype.openDocumentSettingModal = function () {
            if (this.isModalShown()) {
                return;
            }
            var documentData = this.toolContext.document;
            this.setInputElementNumber(this.ID.documentSettingModal_ViewScale, documentData.defaultViewScale);
            this.setInputElementNumber(this.ID.documentSettingModal_LineWidth, documentData.lineWidthBiasRate);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, documentData.documentFrame[0]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, documentData.documentFrame[1]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, documentData.documentFrame[2]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, documentData.documentFrame[3]);
            this.openModal(this.ID.documentSettingModal, null);
        };
        App_View.prototype.onClosedDocumentSettingModal = function () {
            var documentData = this.toolContext.document;
            documentData.defaultViewScale = this.getInputElementNumber(this.ID.documentSettingModal_ViewScale, 1.0);
            if (documentData.defaultViewScale < this.mainWindow.minViewScale) {
                documentData.defaultViewScale = this.mainWindow.minViewScale;
            }
            documentData.lineWidthBiasRate = this.getInputElementNumber(this.ID.documentSettingModal_LineWidth, 1.0);
            documentData.documentFrame[0] = this.getInputElementNumber(this.ID.documentSettingModal_FrameLeft, -512);
            documentData.documentFrame[1] = this.getInputElementNumber(this.ID.documentSettingModal_FrameTop, -512);
            documentData.documentFrame[2] = this.getInputElementNumber(this.ID.documentSettingModal_FrameRight, 512);
            documentData.documentFrame[3] = this.getInputElementNumber(this.ID.documentSettingModal_FrameBottom, 512);
        };
        App_View.prototype.openExportImageFileModal = function () {
            if (this.isModalShown()) {
                return;
            }
            var exportFileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(exportFileName)) {
                this.setExportImageFileNameFromFileName();
            }
            this.setRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, this.toolContext.document.exportBackGroundType);
            this.openModal(this.ID.exportImageFileModal, this.ID.exportImageFileModal_ok);
        };
        App_View.prototype.setExportImageFileNameFromFileName = function () {
            var documentData = this.toolEnv.document;
            var fileName = this.getInputElementText(this.ID.fileName);
            var lastSeperatorIndex = StringLastIndexOf(fileName, '\\');
            if (lastSeperatorIndex == -1) {
                lastSeperatorIndex = StringLastIndexOf(fileName, '/');
            }
            var separatorDotIndex = StringLastIndexOf(fileName, '.');
            if (lastSeperatorIndex != -1 && separatorDotIndex != -1 && separatorDotIndex - lastSeperatorIndex > 0) {
                fileName = StringSubstring(fileName, lastSeperatorIndex + 1, separatorDotIndex - lastSeperatorIndex - 1);
            }
            fileName += '_' + ('00' + documentData.exportingCount).slice(-2);
            this.setInputElementText(this.ID.exportImageFileModal_fileName, fileName);
            documentData.exportingCount++;
        };
        App_View.prototype.openNewKeyframeModal = function () {
            this.openModal(this.ID.newKeyframeModal, null);
        };
        App_View.prototype.onClosedNewKeyframeModal = function () {
            if (this.currentModalDialogResult != this.ID.newKeyframeModal_ok) {
                return;
            }
            var env = this.toolEnv;
            var insertType = (this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));
            if (insertType == 1) {
                var command = new ManualTracingTool.Command_Animation_InsertKeyframeAllLayer();
                command.frame = env.document.animationSettingData.currentTimeFrame;
                command.prepareEditData(env);
                if (command.isAvailable(env)) {
                    command.executeCommand(env);
                    env.commandHistory.addCommand(command);
                }
            }
        };
        App_View.prototype.openDeleteKeyframeModal = function () {
            this.openModal(this.ID.deleteKeyframeModal, null);
        };
        App_View.prototype.onClosedDeleteKeyframeModal = function () {
            if (this.currentModalDialogResult != this.ID.deleteKeyframeModal_ok) {
                return;
            }
            var env = this.toolEnv;
            var insertType = (this.getRadioElementIntValue(this.ID.newKeyframeModal_InsertType, 1));
            if (insertType == 1) {
                var command = new ManualTracingTool.Command_Animation_DeleteKeyframeAllLayer();
                command.frame = env.document.animationSettingData.currentTimeFrame;
                command.prepareEditData(env);
                if (command.isAvailable(env)) {
                    command.executeCommand(env);
                    env.commandHistory.addCommand(command);
                }
            }
        };
        App_View.prototype.onModalWindowShown = function () {
            if (!StringIsNullOrEmpty(this.currentModalFocusElementID)) {
                var element = this.getElement(this.currentModalFocusElementID);
                element.focus();
            }
        };
        App_View.prototype.openFileDialog = function (targetID) {
            if (targetID == ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {
                if (this.toolContext.currentLayer != null
                    && this.toolContext.currentLayer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                    var ifrLayer = (this.toolContext.currentLayer);
                    var filePath = ifrLayer.imageFilePath;
                    this.openFileDialogModal(targetID, filePath);
                }
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.openDocument) {
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.saveDocument) {
            }
        };
        App_View.prototype.updateHeaderButtons = function () {
            var activeElementID = '';
            if (this.toolContext.editMode == ManualTracingTool.EditModeID.drawMode
                && (this.toolContext.mainToolID == ManualTracingTool.MainToolID.drawLine
                    || this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing
                    || this.toolContext.mainToolID == ManualTracingTool.MainToolID.imageReferenceLayer)) {
                activeElementID = this.ID.menu_btnDrawTool;
            }
            else if (this.toolContext.editMode == ManualTracingTool.EditModeID.editMode) {
                activeElementID = this.ID.menu_btnEditTool;
            }
            else {
                activeElementID = this.ID.menu_btnMiscTool;
            }
            this.uiMenuButtons.setState({ activeElementID: activeElementID });
        };
        //private setHeaderButtonVisual(elementID: string, isSelected: boolean) {
        //    var element = this.getElement(elementID);
        //    if (isSelected) {
        //        element.classList.remove(this.ID.unselectedMainButton);
        //        element.classList.add(this.ID.selectedMainButton);
        //    }
        //    else {
        //        element.classList.remove(this.ID.selectedMainButton);
        //        element.classList.add(this.ID.unselectedMainButton);
        //    }
        //}
        App_View.prototype.setHeaderDocumentFileName = function (lastURL) {
            this.setInputElementText(this.ID.fileName, lastURL);
        };
        App_View.prototype.updateFooterText = function () {
            if (this.footerText != this.footerTextBefore) {
                this.getElement(this.ID.footer).innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
        };
        // Hit test
        App_View.prototype.hitTestLayout = function (areas, x, y) {
            for (var _i = 0, areas_1 = areas; _i < areas_1.length; _i++) {
                var area = areas_1[_i];
                if (this.hitTestLayoutRectangle(area, x, y)) {
                    return area;
                }
            }
            return null;
        };
        App_View.prototype.hitTestLayoutRectangle = function (area, x, y) {
            if (x >= area.left
                && x <= area.right
                && y >= area.top
                && y <= area.bottom) {
                return true;
            }
            else {
                return false;
            }
        };
        // HTML helper
        App_View.prototype.getElement = function (id) {
            var element = document.getElementById(id);
            if (element == null) {
                throw ('Could not find element "' + id + '"');
            }
            return element;
        };
        App_View.prototype.setElementText = function (id, text) {
            var element = (document.getElementById(id));
            element.innerText = text;
            return element;
        };
        App_View.prototype.setInputElementText = function (id, text) {
            var element = (document.getElementById(id));
            element.value = text;
            return element;
        };
        App_View.prototype.getInputElementText = function (id) {
            var element = (document.getElementById(id));
            return element.value;
        };
        App_View.prototype.setInputElementNumber = function (id, value) {
            var element = (document.getElementById(id));
            element.value = value.toString();
            return element;
        };
        App_View.prototype.setInputElementNumber2Decimal = function (id, value) {
            var element = (document.getElementById(id));
            element.value = value.toFixed(2);
            return element;
        };
        App_View.prototype.getInputElementNumber = function (id, defaultValue) {
            var element = (document.getElementById(id));
            if (element.value == '') {
                return defaultValue;
            }
            return Number(element.value);
        };
        App_View.prototype.setInputElementRangeValue = function (id, value, min, max) {
            var element = (document.getElementById(id));
            element.value = (value / max * Number(element.max)).toString();
            return element;
        };
        App_View.prototype.getInputElementRangeValue = function (id, min, max) {
            var element = (document.getElementById(id));
            var value = Number(element.value) / Number(element.max) * max;
            return value;
        };
        App_View.prototype.setRadioElementIntValue = function (elementName, value) {
            var valueText = value.toString();
            var elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                var radio = elements[i];
                radio.checked = (radio.value == valueText);
            }
        };
        App_View.prototype.getRadioElementIntValue = function (elementName, defaultValue) {
            var value = defaultValue;
            var elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                var radio = elements[i];
                if (radio.checked) {
                    value = (Number(radio.value));
                }
            }
            return value;
        };
        App_View.prototype.setInputElementBoolean = function (id, checked) {
            var element = (document.getElementById(id));
            element.checked = checked;
        };
        App_View.prototype.getInputElementBoolean = function (id) {
            var element = (document.getElementById(id));
            return element.checked;
        };
        App_View.prototype.setInputElementColor = function (id, color) {
            var colorText = '#' + ManualTracingTool.ColorLogic.rgbToHex2String(color);
            var element = (document.getElementById(id));
            element.value = colorText;
            return color;
        };
        App_View.prototype.getInputElementColor = function (id, result) {
            var element = (document.getElementById(id));
            var colorText = element.value;
            ManualTracingTool.ColorLogic.hex2StringToRGB(result, colorText);
            return result;
        };
        App_View.prototype.getInputElementFilePath = function (id) {
            var element = (document.getElementById(id));
            if (element.files.length == 0) {
                return null;
            }
            var file = element.files[0];
            return file.path;
        };
        return App_View;
    }());
    ManualTracingTool.App_View = App_View;
    var MainWindow = /** @class */ (function (_super) {
        __extends(MainWindow, _super);
        function MainWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.dragBeforeTransformMatrix = mat4.create();
            return _this;
        }
        return MainWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.MainWindow = MainWindow;
    var EditorWindow = /** @class */ (function (_super) {
        __extends(EditorWindow, _super);
        function EditorWindow() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return EditorWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.EditorWindow = EditorWindow;
    var LayerWindow = /** @class */ (function (_super) {
        __extends(LayerWindow, _super);
        function LayerWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.layerItemButtonScale = 0.5;
            _this.layerItemButtonWidth = 64.0;
            _this.layerItemButtonHeight = 64.0;
            _this.layerItemButtonButtom = 64.0;
            _this.layerCommandButtonButtom = 0.0;
            _this.layerItemHeight = 24.0;
            _this.layerItemFontSize = 16.0;
            _this.layerItemVisibilityIconWidth = 24.0;
            _this.layerItemVisibilityIconRight = 24.0;
            _this.layerItemsBottom = 0.0;
            _this.layerWindowLayoutArea = new RectangleLayoutArea();
            _this.layerWindowItems = new List();
            _this.layerWindowCommandButtons = null;
            return _this;
        }
        return LayerWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.LayerWindow = LayerWindow;
    var SubtoolWindow = /** @class */ (function (_super) {
        __extends(SubtoolWindow, _super);
        function SubtoolWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.subToolItemScale = 0.5;
            _this.subToolItemUnitWidth = 256;
            _this.subToolItemUnitHeight = 128;
            _this.subToolItemsBottom = 0.0;
            return _this;
        }
        return SubtoolWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.SubtoolWindow = SubtoolWindow;
    var ColorCanvasWindow = /** @class */ (function (_super) {
        __extends(ColorCanvasWindow, _super);
        function ColorCanvasWindow() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ColorCanvasWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.ColorCanvasWindow = ColorCanvasWindow;
    var RectangleLayoutArea = /** @class */ (function () {
        function RectangleLayoutArea() {
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
        RectangleLayoutArea.prototype.setIndex = function (index) {
            this.index = index;
            return this;
        };
        RectangleLayoutArea.prototype.setIcon = function (index) {
            this.iconID = index;
            return this;
        };
        RectangleLayoutArea.prototype.getWidth = function () {
            return (this.right - this.left + 1.0);
        };
        RectangleLayoutArea.prototype.getHeight = function () {
            return (this.bottom - this.top + 1.0);
        };
        RectangleLayoutArea.prototype.copyRectangle = function (canvasWindow) {
            this.left = 0.0;
            this.top = 0.0;
            this.right = canvasWindow.width - 1.0;
            this.bottom = canvasWindow.width - 1.0;
        };
        return RectangleLayoutArea;
    }());
    ManualTracingTool.RectangleLayoutArea = RectangleLayoutArea;
    var TimeLineWindow = /** @class */ (function (_super) {
        __extends(TimeLineWindow, _super);
        function TimeLineWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.leftPanelWidth = 100.0;
            _this.frameUnitWidth = 8.0;
            return _this;
        }
        TimeLineWindow.prototype.getFrameUnitWidth = function (aniSetting) {
            return this.frameUnitWidth * aniSetting.timeLineWindowScale;
        };
        TimeLineWindow.prototype.getTimeLineLeft = function () {
            return this.leftPanelWidth;
        };
        TimeLineWindow.prototype.getTimeLineRight = function () {
            return this.getTimeLineLeft() + this.width - 1;
        };
        TimeLineWindow.prototype.getFrameByLocation = function (x, aniSetting) {
            var left = this.getTimeLineLeft();
            var right = this.getTimeLineRight();
            if (x < left) {
                return -1;
            }
            if (x > right) {
                return -1;
            }
            var frameUnitWidth = this.getFrameUnitWidth(aniSetting);
            var absoluteX = x - (left - aniSetting.timeLineWindowViewLocationX);
            var frame = Math.floor(absoluteX / frameUnitWidth);
            if (frame < 0) {
                frame = 0;
            }
            return frame;
        };
        TimeLineWindow.prototype.getFrameLocation = function (frame, aniSetting) {
            var left = this.getTimeLineLeft();
            var frameUnitWidth = this.getFrameUnitWidth(aniSetting);
            var x = left - aniSetting.timeLineWindowViewLocationX + frame * frameUnitWidth;
            return x;
        };
        return TimeLineWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.TimeLineWindow = TimeLineWindow;
    var PaletteSelectorWindowButtonID;
    (function (PaletteSelectorWindowButtonID) {
        PaletteSelectorWindowButtonID[PaletteSelectorWindowButtonID["none"] = 0] = "none";
        PaletteSelectorWindowButtonID[PaletteSelectorWindowButtonID["lineColor"] = 1] = "lineColor";
        PaletteSelectorWindowButtonID[PaletteSelectorWindowButtonID["fillColor"] = 2] = "fillColor";
    })(PaletteSelectorWindowButtonID = ManualTracingTool.PaletteSelectorWindowButtonID || (ManualTracingTool.PaletteSelectorWindowButtonID = {}));
    var PaletteSelectorWindow = /** @class */ (function (_super) {
        __extends(PaletteSelectorWindow, _super);
        function PaletteSelectorWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.leftMargin = 4.0;
            _this.topMargin = 5.0;
            _this.rightMargin = 5.0;
            _this.buttonScale = 0.5;
            _this.buttonWidth = 64.0;
            _this.buttonHeight = 64.0;
            _this.buttonRightMargin = 5.0;
            _this.buttonBottomMargin = 5.0;
            _this.commandButtonsBottom = 0.0;
            _this.commandButtonAreas = new List();
            _this.itemScale = 1.0;
            _this.itemWidth = 34.0;
            _this.itemHeight = 15.0;
            _this.itemRightMargin = 5.0;
            _this.itemBottomMargin = 5.0;
            _this.itemAreas = new List();
            _this.currentTargetID = PaletteSelectorWindowButtonID.lineColor;
            return _this;
        }
        return PaletteSelectorWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.PaletteSelectorWindow = PaletteSelectorWindow;
    var LayerWindowButtonID;
    (function (LayerWindowButtonID) {
        LayerWindowButtonID[LayerWindowButtonID["none"] = 0] = "none";
        LayerWindowButtonID[LayerWindowButtonID["addLayer"] = 1] = "addLayer";
        LayerWindowButtonID[LayerWindowButtonID["deleteLayer"] = 2] = "deleteLayer";
        LayerWindowButtonID[LayerWindowButtonID["moveUp"] = 3] = "moveUp";
        LayerWindowButtonID[LayerWindowButtonID["moveDown"] = 4] = "moveDown";
    })(LayerWindowButtonID = ManualTracingTool.LayerWindowButtonID || (ManualTracingTool.LayerWindowButtonID = {}));
    var LayerWindowItem = /** @class */ (function (_super) {
        __extends(LayerWindowItem, _super);
        function LayerWindowItem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.layer = null;
            _this.parentLayer = null;
            _this.previousItem = null;
            _this.nextItem = null;
            _this.previousSiblingItem = null;
            _this.nextSiblingItem = null;
            _this.hierarchyDepth = 0;
            _this.margine = 0.0;
            _this.visibilityIconWidth = 0.0;
            _this.textLeft = 0.0;
            return _this;
        }
        return LayerWindowItem;
    }(RectangleLayoutArea));
    ManualTracingTool.LayerWindowItem = LayerWindowItem;
    var SubToolViewItem = /** @class */ (function (_super) {
        __extends(SubToolViewItem, _super);
        function SubToolViewItem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.subToolIndex = 0;
            _this.isAvailable = false;
            _this.buttonStateID = ManualTracingTool.InputSideID.front;
            _this.tool = null;
            _this.buttons = new List();
            return _this;
        }
        return SubToolViewItem;
    }(RectangleLayoutArea));
    ManualTracingTool.SubToolViewItem = SubToolViewItem;
    var SubToolViewItemOptionButton = /** @class */ (function (_super) {
        __extends(SubToolViewItemOptionButton, _super);
        function SubToolViewItemOptionButton() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return SubToolViewItemOptionButton;
    }(RectangleLayoutArea));
    ManualTracingTool.SubToolViewItemOptionButton = SubToolViewItemOptionButton;
    var OpenPaletteColorModalMode;
    (function (OpenPaletteColorModalMode) {
        OpenPaletteColorModalMode[OpenPaletteColorModalMode["LineColor"] = 1] = "LineColor";
        OpenPaletteColorModalMode[OpenPaletteColorModalMode["FillColor"] = 2] = "FillColor";
    })(OpenPaletteColorModalMode = ManualTracingTool.OpenPaletteColorModalMode || (ManualTracingTool.OpenPaletteColorModalMode = {}));
    var NewLayerTypeID;
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
    var HTMLElementID = /** @class */ (function () {
        function HTMLElementID() {
            this.none = 'none';
            this.fileName = 'fileName';
            this.footer = 'footer';
            this.subtoolWindow = "subtoolWindow";
            this.mainCanvas = 'mainCanvas';
            this.editorCanvas = 'editorCanvas';
            this.webglCanvas = 'webglCanvas';
            this.layerCanvas = 'layerCanvas';
            //subtoolCanvas = 'subtoolCanvas';
            this.timeLineCanvas = 'timeLineCanvas';
            this.paletteSelectorCanvas = 'paletteSelectorCanvas';
            this.colorMixerWindow_colorCanvas = 'colorMixer_colorCanvas';
            this.mainToolButtons = "mainToolButtons";
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
            this.paletteColorModal = '#paletteColorModal';
            this.paletteColorModal_targetName = 'paletteColorModal_targetName';
            this.paletteColorModal_currentColor = 'paletteColorModal_currentColor';
            this.paletteColorModal_currentAlpha = 'paletteColorModal_currentAlpha';
            this.paletteColorModal_colors = 'paletteColorModal_colors';
            this.paletteColorModal_colorItemStyle = 'colorItem';
            this.paletteColorModal_colorIndex = 'paletteColorModal_colorIndex';
            this.paletteColorModal_colorValue = 'paletteColorModal_colorValue';
            this.paletteColorModal_colorCanvas = 'paletteColorModal_colorCanvas';
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
        return HTMLElementID;
    }());
    ManualTracingTool.HTMLElementID = HTMLElementID;
})(ManualTracingTool || (ManualTracingTool = {}));
