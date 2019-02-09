var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var Main_View = /** @class */ (function (_super) {
        __extends(Main_View, _super);
        function Main_View() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            // Layer window
            _this.layerWindowLayoutArea = new RectangleLayoutArea();
            _this.layerWindowItems = null;
            _this.layerWindowCommandButtons = null;
            // Subtool window
            _this.subToolViewItems = null;
            // Dialogs
            _this.currentModalDialogID = null;
            _this.currentModalFocusElementID = null;
            _this.currentModalDialogResult = null;
            _this.currentModalDialog_DocumentData = null;
            _this.layerPropertyWindow_EditLayer = null;
            _this.palletColorWindow_EditLayer = null;
            _this.palletColorWindow_Mode = OpenPalletColorModalMode.LineColor;
            _this.openFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID.none;
            _this.modalOverlayOption = {
                speedIn: 0,
                speedOut: 100,
                opacity: 0.0
            };
            _this.modalLoaderOption = {
                active: false
            };
            // Pallet modal drawing
            _this.colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            _this.colorB = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            // Footer window
            _this.footerText = '';
            _this.footerTextBefore = '';
            return _this;
        }
        Main_View.prototype.initializeViewDevices = function () {
            this.resizeWindows();
            this.mainWindow.context = this.mainWindow.canvas.getContext('2d');
            this.editorWindow.context = this.editorWindow.canvas.getContext('2d');
            this.pickingWindow.context = this.pickingWindow.canvas.getContext('2d');
            this.layerWindow.context = this.layerWindow.canvas.getContext('2d');
            this.subtoolWindow.context = this.subtoolWindow.canvas.getContext('2d');
            this.palletSelectorWindow.context = this.palletSelectorWindow.canvas.getContext('2d');
            this.colorMixerWindow_colorCanvas.context = this.colorMixerWindow_colorCanvas.canvas.getContext('2d');
            this.timeLineWindow.context = this.timeLineWindow.canvas.getContext('2d');
            this.renderingWindow.context = this.renderingWindow.canvas.getContext('2d');
            this.palletColorModal_colorCanvas.context = this.palletColorModal_colorCanvas.canvas.getContext('2d');
            this.canvasRender.setContext(this.layerWindow);
            this.canvasRender.setFontSize(18.0);
            if (this.webGLRender.initializeWebGL(this.webglWindow.canvas)) {
                throw ('３Ｄ機能を初期化できませんでした。');
            }
            this.posing3dView.initialize(this.webGLRender, this.webglWindow, this.pickingWindow);
        };
        Main_View.prototype.initializeViewState = function () {
            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;
            this.setCanvasSizeFromStyle(this.colorMixerWindow_colorCanvas);
            this.drawPalletColorMixer(this.colorMixerWindow_colorCanvas);
            this.setCanvasSizeFromStyle(this.palletColorModal_colorCanvas);
            this.drawPalletColorMixer(this.palletColorModal_colorCanvas);
            this.collectLayerWindowButtons();
            this.updateLayerStructure();
        };
        // View management
        Main_View.prototype.resizeWindows = function () {
            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.pickingWindow, this.mainWindow);
            this.resizeCanvasToParent(this.layerWindow);
            this.resizeCanvasToParent(this.subtoolWindow);
            this.resizeCanvasToParent(this.palletSelectorWindow);
            this.resizeCanvasToParent(this.timeLineWindow);
            if (this.isWhileLoading()) {
                this.layerWindow_CaluculateLayout(this.layerWindow);
                this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
                this.palletSelector_CaluculateLayout();
            }
        };
        Main_View.prototype.resizeCanvasToParent = function (canvasWindow) {
            canvasWindow.width = canvasWindow.canvas.parentElement.clientWidth;
            canvasWindow.height = canvasWindow.canvas.parentElement.clientHeight;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main_View.prototype.fitCanvas = function (canvasWindow, fitToWindow) {
            canvasWindow.width = fitToWindow.width;
            canvasWindow.height = fitToWindow.height;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main_View.prototype.setCanvasSizeFromStyle = function (canvasWindow) {
            var style = window.getComputedStyle(canvasWindow.canvas);
            canvasWindow.width = Number(style.width.replace('px', ''));
            canvasWindow.height = Number(style.height.replace('px', ''));
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main_View.prototype.getMouseInfo = function (toolMouseEvent, e, touchUp, canvasWindow) {
            this.activeCanvasWindow = canvasWindow;
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
        Main_View.prototype.getTouchInfo = function (toolMouseEvent, e, touchDown, touchUp, canvasWindow) {
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
        Main_View.prototype.calculateTransfomredLocation = function (resultVec, canvasWindow, x, y) {
            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);
            vec3.set(this.tempVec3, x, y, 0.0);
            vec3.transformMat4(resultVec, this.tempVec3, this.invView2DMatrix);
        };
        Main_View.prototype.calculateTransfomredMouseParams = function (toolMouseEvent, canvasWindow) {
            this.calculateTransfomredLocation(toolMouseEvent.location, canvasWindow, toolMouseEvent.offsetX, toolMouseEvent.offsetY);
            vec3.copy(this.toolEnv.mouseCursorLocation, toolMouseEvent.location);
        };
        Main_View.prototype.getWheelInfo = function (toolMouseEvent, e) {
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
        Main_View.prototype.startShowingLayerItem = function (item) {
            if (item != null) {
                this.selectCurrentLayerAnimationLayer = item.layer;
                this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax;
                this.toolEnv.setRedrawMainWindow();
                this.setLayerWindowViewLocationToItem(item);
            }
        };
        Main_View.prototype.startShowingCurrentLayer = function () {
            var item = this.findCurrentLayerLayerWindowItem();
            this.startShowingLayerItem(item);
        };
        Main_View.prototype.copyLastViewLocation = function (setUpdate) {
            this.isViewLocationMoved = setUpdate;
            vec3.copy(this.lastViewLocation, this.mainWindow.viewLocation);
            this.lastViewScale = this.mainWindow.viewScale;
            this.lastViewRotation = this.mainWindow.viewRotation;
        };
        Main_View.prototype.setViewRotation = function (rotation) {
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
        Main_View.prototype.addViewScale = function (addScale) {
            var env = this.toolEnv;
            this.copyLastViewLocation(true);
            this.mainWindow.addViewScale(addScale);
            env.setRedrawMainWindowEditorWindow();
        };
        Main_View.prototype.collectLayerWindowButtons = function () {
            this.layerWindowCommandButtons = new List();
            this.layerWindowCommandButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.addLayer));
            this.layerWindowCommandButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.deleteLayer));
            this.layerWindowCommandButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveUp));
            this.layerWindowCommandButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveDown));
        };
        Main_View.prototype.layerWindow_CollectItems = function () {
            this.layerWindowItems = new List();
            this.collectLayerWindowItemsRecursive(this.layerWindowItems, this.document.rootLayer, 0);
            var previousItem = null;
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.previousItem = previousItem;
                if (previousItem != null) {
                    previousItem.nextItem = item;
                }
                previousItem = item;
            }
        };
        Main_View.prototype.collectLayerWindowItemsRecursive = function (result, parentLayer, currentDepth) {
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
                    this.collectLayerWindowItemsRecursive(this.layerWindowItems, layer, currentDepth + 1);
                }
                siblingItem = item;
            }
        };
        Main_View.prototype.findCurrentLayerLayerWindowItemIndex = function () {
            for (var index = 0; index < this.layerWindowItems.length; index++) {
                var item = this.layerWindowItems[index];
                if (item.layer == this.toolContext.currentLayer) {
                    return index;
                }
            }
            return -1;
        };
        Main_View.prototype.findCurrentLayerLayerWindowItem = function () {
            var index = this.findCurrentLayerLayerWindowItemIndex();
            if (index != -1) {
                var item = this.layerWindowItems[index];
                return item;
            }
            return null;
        };
        Main_View.prototype.setLayerWindowViewLocationToItem = function (item) {
            var layerWindow = this.layerWindow;
            var viewTop = layerWindow.viewLocation[1];
            if (item.top < viewTop + layerWindow.layerCommandButtonButtom) {
                layerWindow.viewLocation[1] = item.top - layerWindow.layerCommandButtonButtom;
            }
            else if (item.top > viewTop + layerWindow.height - layerWindow.layerItemHeight * 2.0) {
                layerWindow.viewLocation[1] = item.top - layerWindow.height + layerWindow.layerItemHeight * 2.0;
            }
        };
        Main_View.prototype.subtoolWindow_CollectViewItems = function () {
            this.subToolViewItems = new List();
            var currentMainTool = this.getCurrentMainTool();
            for (var i = 0; i < currentMainTool.subTools.length; i++) {
                var tool = currentMainTool.subTools[i];
                var viewItem = new SubToolViewItem();
                viewItem.toolIndex = i;
                viewItem.tool = tool;
                for (var buttonIndex = 0; buttonIndex < tool.inputSideOptionCount; buttonIndex++) {
                    var button = new SubToolViewItemOptionButton();
                    button.index = buttonIndex;
                    viewItem.buttons.push(button);
                }
                this.subToolViewItems.push(viewItem);
            }
        };
        Main_View.prototype.subtoolWindow_CaluculateLayout = function (subtoolWindow) {
            var scale = subtoolWindow.subToolItemScale;
            var fullWidth = subtoolWindow.width - 1;
            var unitHeight = subtoolWindow.subToolItemUnitHeight * scale - 1;
            var currentY = 0;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                viewItem.left = 0.0;
                viewItem.top = currentY;
                viewItem.right = fullWidth;
                viewItem.bottom = currentY + unitHeight - 1;
                currentY += unitHeight;
            }
            subtoolWindow.subToolItemsBottom = currentY;
        };
        Main_View.prototype.createModalOptionObject = function (targetElementId) {
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
        Main_View.prototype.isModalShown = function () {
            return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
        };
        Main_View.prototype.closeModal = function () {
            Custombox.modal.closeAll();
        };
        Main_View.prototype.openModal = function (modalID, focusElementName) {
            this.currentModalDialogID = modalID;
            this.currentModalFocusElementID = focusElementName;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        };
        Main_View.prototype.openLayerPropertyModal = function (layer, layerWindowItem) {
            if (this.isModalShown()) {
                return;
            }
            // common layer properties
            var layerTypeName = this.layerTypeNameDictionary[layer.type];
            this.setElementText(this.ID.layerPropertyModal_layerTypeName, layerTypeName);
            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);
            this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            this.setInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, layer.layerColor[3], 0.0, 1.0);
            this.setInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget, layer.isRenderTarget);
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
        Main_View.prototype.onClosedLayerPropertyModal = function () {
            var layer = this.layerPropertyWindow_EditLayer;
            // common layer properties
            var layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);
            if (!StringIsNullOrEmpty(layerName)) {
                layer.name = layerName;
            }
            this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 0.0, 1.0);
            layer.isRenderTarget = this.getInputElementBoolean(this.ID.layerPropertyModal_isRenderTarget);
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 0.0, 1.0);
                vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, ManualTracingTool.DrawLineTypeID.layerColor);
                vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, ManualTracingTool.FillAreaTypeID.fillColor);
            }
            this.layerPropertyWindow_EditLayer = null;
        };
        Main_View.prototype.openPalletColorModal = function (mode, documentData, layer) {
            if (this.isModalShown()) {
                return;
            }
            if (layer == null || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                return;
            }
            var vectorLayer = layer;
            var targetName;
            var palletColorIndex;
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
        };
        Main_View.prototype.displayPalletColorModalColors = function (documentData, vectorLayer) {
            {
                var palletColorIndex = void 0;
                if (this.palletColorWindow_Mode == OpenPalletColorModalMode.LineColor) {
                    palletColorIndex = vectorLayer.line_PalletColorIndex;
                }
                else {
                    palletColorIndex = vectorLayer.fill_PalletColorIndex;
                }
                var palletColor = documentData.palletColors[palletColorIndex];
                this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                this.setInputElementRangeValue(this.ID.palletColorModal_currentAlpha, palletColor.color[3], 0.0, 1.0);
            }
            for (var palletColorIndex = 0; palletColorIndex < documentData.palletColors.length; palletColorIndex++) {
                var palletColor = documentData.palletColors[palletColorIndex];
                this.setColorPalletElementValue(palletColorIndex, palletColor.color);
            }
        };
        Main_View.prototype.setColorPalletElementValue = function (palletColorIndex, color) {
            var id = this.ID.palletColorModal_colorValue + palletColorIndex;
            this.setInputElementColor(id, color);
        };
        Main_View.prototype.onPalletColorModal_ColorIndexChanged = function () {
            if (this.palletColorWindow_EditLayer == null) {
                return;
            }
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.palletColorWindow_EditLayer;
            var palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            ;
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
        };
        Main_View.prototype.onPalletColorModal_CurrentColorChanged = function () {
            if (this.palletColorWindow_EditLayer == null) {
                return;
            }
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.palletColorWindow_EditLayer;
            var palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            var palletColor = documentData.palletColors[palletColorIndex];
            this.getInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
            palletColor.color[3] = this.getInputElementRangeValue(this.ID.palletColorModal_currentAlpha, 0.0, 1.0);
            this.displayPalletColorModalColors(documentData, vectorLayer);
            this.toolEnv.setRedrawMainWindow();
        };
        Main_View.prototype.onPalletColorModal_ColorChanged = function (palletColorIndex) {
            if (this.palletColorWindow_EditLayer == null) {
                return;
            }
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.palletColorWindow_EditLayer;
            var palletColor = documentData.palletColors[palletColorIndex];
            this.getInputElementColor(this.ID.palletColorModal_colorValue + palletColorIndex, palletColor.color);
            this.displayPalletColorModalColors(documentData, vectorLayer);
            this.toolEnv.setRedrawMainWindow();
        };
        Main_View.prototype.onPalletColorModal_ColorCanvas_mousedown = function (e) {
            if (this.palletColorWindow_EditLayer == null) {
                return;
            }
            var context = this.toolContext;
            var wnd = this.palletColorModal_colorCanvas;
            var env = this.toolEnv;
            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.palletColorWindow_EditLayer;
            var palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            var palletColor = documentData.palletColors[palletColorIndex];
            palletColor.color[0] = this.tempColor4[0];
            palletColor.color[1] = this.tempColor4[1];
            palletColor.color[2] = this.tempColor4[2];
            this.setColorPalletElementValue(palletColorIndex, palletColor.color);
            this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
            this.toolEnv.setRedrawMainWindow();
        };
        Main_View.prototype.onClosedPalletColorModal = function () {
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.palletColorWindow_EditLayer;
            var palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            ;
            if (this.palletColorWindow_Mode == OpenPalletColorModalMode.LineColor) {
                vectorLayer.line_PalletColorIndex = palletColorIndex;
            }
            else {
                vectorLayer.fill_PalletColorIndex = palletColorIndex;
            }
            var updateOnClose = false;
            if (updateOnClose) {
                {
                    var palletColor = documentData.palletColors[palletColorIndex];
                    this.getInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                    palletColor.color[3] = this.getInputElementRangeValue(this.ID.palletColorModal_currentAlpha, 0.0, 1.0);
                }
                for (var i = 0; i < documentData.palletColors.length; i++) {
                    var palletColor = documentData.palletColors[i];
                    var id = this.ID.palletColorModal_colorValue + i;
                    this.getInputElementColor(id, palletColor.color);
                }
            }
            this.currentModalDialog_DocumentData = null;
            this.palletColorWindow_EditLayer = null;
        };
        Main_View.prototype.openDocumentSettingDialog = function () {
            this.openDocumentSettingModal();
        };
        Main_View.prototype.openOperationOptionModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.setInputElementNumber(this.ID.operationOptionModal_LineWidth, this.toolContext.drawLineBaseWidth);
            this.setInputElementNumber(this.ID.operationOptionModal_LineMinWidth, this.toolContext.drawLineMinWidth);
            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);
            this.openModal(this.ID.operationOptionModal, null);
        };
        Main_View.prototype.openNewLayerCommandOptionModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.openModal(this.ID.newLayerCommandOptionModal, null);
        };
        Main_View.prototype.onNewLayerCommandOptionModal = function () {
            if (this.currentModalDialogResult != this.ID.newLayerCommandOptionModal_ok) {
                return;
            }
            var newLayerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, NewLayerTypeID.vectorLayer);
            // Select command
            var layerCommand = null;
            if (newLayerType == NewLayerTypeID.vectorLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.vectorLayer_Fill) {
                var command = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
                command.createForFillColor = true;
                layerCommand = command;
            }
            else if (newLayerType == NewLayerTypeID.vectorLayerReferenceLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.groupLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddGroupLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.posingLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddPosingLayerToCurrentPosition();
            }
            else if (newLayerType == NewLayerTypeID.imageFileReferenceLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddImageFileReferenceLayerToCurrentPosition();
            }
            if (layerCommand == null) {
                return;
            }
            // Execute command
            this.executeLayerCommand(layerCommand);
        };
        Main_View.prototype.openFileDialogModal = function (targetID, filePath) {
            if (this.isModalShown()) {
                return;
            }
            this.openFileDialogTargetID = targetID;
            this.openModal(this.ID.openFileDialogModal, null);
        };
        Main_View.prototype.onClosedFileDialogModal = function () {
            this.toolEnv.updateContext();
            var filePath = this.getInputElementFilePath(this.ID.openFileDialogModal_file);
            var targetID = this.openFileDialogTargetID;
            this.openFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID.none;
            if (this.currentModalDialogResult != this.ID.openFileDialogModal_ok) {
                return;
            }
            if (targetID == ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {
                if (this.currentTool != null) {
                    if (!StringIsNullOrEmpty(filePath)) {
                        this.currentTool.onOpenFile(filePath, this.toolEnv);
                    }
                }
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.openDocument) {
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.saveDocument) {
            }
        };
        Main_View.prototype.openDocumentSettingModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.setInputElementNumber(this.ID.documentSettingModal_ViewScale, this.document.defaultViewScale);
            this.setInputElementNumber(this.ID.documentSettingModal_LineWidth, this.document.lineWidthBiasRate);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, this.document.documentFrame[0]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, this.document.documentFrame[1]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, this.document.documentFrame[2]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, this.document.documentFrame[3]);
            this.openModal(this.ID.documentSettingModal, null);
        };
        Main_View.prototype.onClosedDocumentSettingModal = function () {
            this.document.defaultViewScale = this.getInputElementNumber(this.ID.documentSettingModal_ViewScale, 1.0);
            if (this.document.defaultViewScale < this.mainWindow.minViewScale) {
                this.document.defaultViewScale = this.mainWindow.minViewScale;
            }
            this.document.lineWidthBiasRate = this.getInputElementNumber(this.ID.documentSettingModal_LineWidth, 1.0);
            this.document.documentFrame[0] = this.getInputElementNumber(this.ID.documentSettingModal_FrameLeft, -512);
            this.document.documentFrame[1] = this.getInputElementNumber(this.ID.documentSettingModal_FrameTop, -512);
            this.document.documentFrame[2] = this.getInputElementNumber(this.ID.documentSettingModal_FrameRight, 512);
            this.document.documentFrame[3] = this.getInputElementNumber(this.ID.documentSettingModal_FrameBottom, 512);
        };
        Main_View.prototype.openExportImageFileModal = function () {
            if (this.isModalShown()) {
                return;
            }
            var exportFileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(exportFileName)) {
                var fileName = this.getInputElementText(this.ID.fileName);
                var lastSeperatorIndex = StringLastIndexOf(fileName, '\\');
                if (lastSeperatorIndex == -1) {
                    lastSeperatorIndex = StringLastIndexOf(fileName, '/');
                }
                var separatorDotIndex = StringLastIndexOf(fileName, '.');
                if (lastSeperatorIndex != -1 && separatorDotIndex != -1 && separatorDotIndex - lastSeperatorIndex > 0) {
                    fileName = StringSubstring(fileName, lastSeperatorIndex + 1, separatorDotIndex - lastSeperatorIndex - 1);
                }
                this.setInputElementText(this.ID.exportImageFileModal_fileName, fileName);
            }
            this.openModal(this.ID.exportImageFileModal, null);
        };
        Main_View.prototype.onClosedExportImageFileModal = function () {
            var _this = this;
            if (this.currentModalDialogResult != this.ID.exportImageFileModal_ok) {
                return;
            }
            var fileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(fileName)) {
                return;
            }
            var backGroundType = this.getRadioElementIntValue(this.ID.exportImageFileModal_backGroundType, 1);
            var scale = this.getInputElementNumber(this.ID.exportImageFileModal_scale, 1.0);
            var frameLeft = Math.floor(this.document.documentFrame[0]);
            var frameTop = Math.floor(this.document.documentFrame[1]);
            var documentWidth = Math.floor(this.document.documentFrame[2]) - frameLeft + 1;
            var documentHeight = Math.floor(this.document.documentFrame[3]) - frameTop + 1;
            var imageLeft = Math.floor(frameLeft);
            var imageTop = Math.floor(frameTop);
            var imageWidth = Math.floor(documentWidth * scale);
            var imageHeight = Math.floor(documentHeight * scale);
            if (imageWidth > 0 && imageHeight > 0) {
                var canvas = this.renderingWindow.canvas;
                canvas.width = imageWidth;
                canvas.height = imageHeight;
                this.renderingWindow.width = imageWidth;
                this.renderingWindow.height = imageHeight;
                this.renderingWindow.viewLocation[0] = imageLeft;
                this.renderingWindow.viewLocation[1] = imageTop;
                this.renderingWindow.viewScale = scale;
                this.renderingWindow.viewRotation = 0.0;
                this.renderingWindow.centerLocationRate[0] = 0.0;
                this.renderingWindow.centerLocationRate[1] = 0.0;
                this.clearWindow(this.renderingWindow);
                if (backGroundType == 1) {
                    this.canvasRender.setFillColorV(this.document.palletColors[this.document.palletColors.length - 1].color);
                    this.canvasRender.fillRect(0, 0, imageWidth, imageHeight);
                }
                this.drawMainWindow(this.renderingWindow, true);
                var exportPath = this.localSetting.exportPath;
                var imageType = this.getRadioElementIntValue(this.ID.exportImageFileModal_imageFileType, 1);
                var extText = '.png';
                if (imageType == 2) {
                    extText = '.jpg';
                }
                var fileFullPath = exportPath + '/' + fileName + extText;
                var imageTypeText = 'image/png';
                if (imageType == 2) {
                    imageTypeText = 'image/jpeg';
                }
                var dataUrl = canvas.toDataURL(imageTypeText, 0.9);
                var data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
                var buf = new Buffer(data, 'base64');
                fs.writeFile(fileFullPath, buf, function (error) {
                    if (error) {
                        _this.showMessageBox(error);
                    }
                });
                // Free canvas memory
                canvas.width = 10;
                canvas.height = 10;
            }
        };
        Main_View.prototype.openNewKeyframeModal = function () {
            this.openModal(this.ID.newKeyframeModal, null);
        };
        Main_View.prototype.onClosedNewKeyframeModal = function () {
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
                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
        };
        Main_View.prototype.openDeleteKeyframeModal = function () {
            this.openModal(this.ID.deleteKeyframeModal, null);
        };
        Main_View.prototype.onClosedDeleteKeyframeModal = function () {
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
                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
        };
        Main_View.prototype.onModalWindowShown = function () {
            if (!StringIsNullOrEmpty(this.currentModalFocusElementID)) {
                var element = this.getElement(this.currentModalFocusElementID);
                element.focus();
            }
        };
        Main_View.prototype.onModalWindowClosed = function () {
            if (this.currentModalDialogID == this.ID.layerPropertyModal) {
                this.onClosedLayerPropertyModal();
            }
            else if (this.currentModalDialogID == this.ID.palletColorModal) {
                this.onClosedPalletColorModal();
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
        Main_View.prototype.openFileDialog = function (targetID) {
            if (targetID == ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {
                if (this.toolContext.currentLayer != null
                    && this.toolContext.currentLayer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                    var filePath = (this.toolContext.currentLayer).imageFilePath;
                    this.openFileDialogModal(targetID, filePath);
                }
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.openDocument) {
            }
            else if (targetID == ManualTracingTool.OpenFileDialogTargetID.saveDocument) {
            }
        };
        Main_View.prototype.drawPalletColorMixer = function (wnd) {
            var width = wnd.width;
            var height = wnd.height;
            var left = 0.0;
            var top = 0.0;
            var right = width - 1.0;
            var bottom = height - 1.0;
            //let minRadius = 10.0;
            //let maxRadius = width * 1.0;
            this.canvasRender.setContext(wnd);
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
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
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
            var divisionW = 40.0;
            var divisionH = 25.0;
            var unitWidth = Math.floor(width / divisionW);
            var unitHeight = Math.floor(height / divisionH);
            var drawX = 0.0;
            for (var x = 0; x <= divisionW; x++) {
                var drawY = 0.0;
                for (var y = 1; y <= divisionH; y++) {
                    var h = x / divisionW;
                    var s = 0.0;
                    var v = 0.0;
                    var iy = y / divisionH;
                    if (iy <= 0.5) {
                        s = iy * 2.0;
                        v = 1.0;
                    }
                    else {
                        s = 1.0;
                        v = 1.0 - (iy - 0.5) * 2.0;
                    }
                    ManualTracingTool.Maths.hsvToRGBVec4(this.tempColor4, h, s, v);
                    this.tempColor4[3] = 1.0;
                    this.canvasRender.setFillColorV(this.tempColor4);
                    this.canvasRender.fillRect(drawX, drawY, unitWidth, unitHeight);
                    drawY += unitHeight;
                }
                drawX += unitWidth;
            }
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
        };
        // Header window
        Main_View.prototype.updateHeaderButtons = function () {
            {
                var isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.drawMode
                    && (this.toolContext.mainToolID == ManualTracingTool.MainToolID.drawLine
                        || this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing
                        || this.toolContext.mainToolID == ManualTracingTool.MainToolID.imageReferenceLayer));
                this.setHeaderButtonVisual(this.ID.menu_btnDrawTool, isButtonON);
            }
            {
                var isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.editMode);
                this.setHeaderButtonVisual(this.ID.menu_btnEditTool, isButtonON);
            }
            {
                var isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.drawMode
                    && this.toolContext.mainToolID == ManualTracingTool.MainToolID.misc);
                this.setHeaderButtonVisual(this.ID.menu_btnMiscTool, isButtonON);
            }
        };
        Main_View.prototype.setHeaderButtonVisual = function (elementID, isSelected) {
            var element = this.getElement(elementID);
            if (isSelected) {
                element.classList.remove(this.ID.unselectedMainButton);
                element.classList.add(this.ID.selectedMainButton);
            }
            else {
                element.classList.remove(this.ID.selectedMainButton);
                element.classList.add(this.ID.unselectedMainButton);
            }
        };
        Main_View.prototype.updateHeaderDocumentFileName = function () {
            if (this.localSetting.lastUsedFilePaths.length > 0) {
                var filePath = this.localSetting.lastUsedFilePaths[0];
                this.setInputElementText(this.ID.fileName, filePath);
            }
            else {
                this.setInputElementText(this.ID.fileName, this.getDefaultDocumentFileName());
            }
        };
        Main_View.prototype.setHeaderDefaultDocumentFileName = function () {
            this.setInputElementText(this.ID.fileName, this.getDefaultDocumentFileName());
        };
        Main_View.prototype.updateFooterMessage = function () {
            var context = this.toolContext;
            var modeText = '';
            if (this.toolEnv.isDrawMode()) {
                modeText = 'DrawMode';
            }
            else if (this.toolEnv.isEditMode()) {
                modeText = 'SelectMode';
            }
            var toolText = '';
            if (this.toolEnv.isDrawMode()) {
                if (this.currentTool == this.tool_DrawLine) {
                    toolText = 'Draw line';
                }
                else if (this.currentTool == this.tool_ScratchLine) {
                    toolText = 'Scratch line';
                }
                else if (this.currentTool == this.tool_Posing3d_LocateHead) {
                    toolText = 'Posing(Head location)';
                }
            }
            else if (this.toolEnv.isEditMode()) {
                toolText = '';
            }
            this.footerText = modeText + ' ' + toolText;
            this.footerText = this.currentTool.helpText;
        };
        // Hit test
        Main_View.prototype.hitTestLayout = function (areas, x, y) {
            for (var _i = 0, areas_1 = areas; _i < areas_1.length; _i++) {
                var area = areas_1[_i];
                if (this.hitTestLayoutRectangle(area, x, y)) {
                    return area;
                }
            }
            return null;
        };
        Main_View.prototype.hitTestLayoutRectangle = function (area, x, y) {
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
        Main_View.prototype.mousemoveHittest = function (x, y, minDistance) {
            this.hittest_Line_IsCloseTo.startProcess();
            if (this.toolEnv.currentVectorGeometry != null) {
                this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorGeometry, x, y, minDistance);
            }
            this.hittest_Line_IsCloseTo.endProcess();
            return this.hittest_Line_IsCloseTo.isChanged;
        };
        // Common functions
        Main_View.prototype.setLayerCommandParameters = function (layerCommand, currentLayerWindowItem) {
            // Collects layer items for command
            var currentLayer = currentLayerWindowItem.layer;
            var currentLayerParent = currentLayerWindowItem.parentLayer;
            var previousLayer = null;
            var previousLayerParent = null;
            if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (currentLayerWindowItem.previousSiblingItem != null) {
                    previousLayer = currentLayerWindowItem.previousSiblingItem.layer;
                    previousLayerParent = currentLayerWindowItem.previousSiblingItem.parentLayer;
                }
            }
            else {
                if (currentLayerWindowItem.previousItem != null) {
                    previousLayer = currentLayerWindowItem.previousItem.layer;
                    previousLayerParent = currentLayerWindowItem.previousItem.parentLayer;
                }
            }
            var nextLayer = null;
            var nextLayerParent = null;
            if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (currentLayerWindowItem.nextSiblingItem != null) {
                    nextLayer = currentLayerWindowItem.nextSiblingItem.layer;
                    nextLayerParent = currentLayerWindowItem.nextSiblingItem.parentLayer;
                }
            }
            else {
                if (currentLayerWindowItem.nextItem != null) {
                    nextLayer = currentLayerWindowItem.nextItem.layer;
                    nextLayerParent = currentLayerWindowItem.nextItem.parentLayer;
                }
            }
            layerCommand.setPrameters(currentLayer, currentLayerParent, previousLayer, previousLayerParent, nextLayer, nextLayerParent);
        };
        Main_View.prototype.executeLayerCommand = function (layerCommand) {
            var currentLayerWindowItem = this.findCurrentLayerLayerWindowItem();
            if (currentLayerWindowItem == null) {
                return;
            }
            this.setLayerCommandParameters(layerCommand, currentLayerWindowItem);
            if (layerCommand.isAvailable(this.toolEnv)) {
                layerCommand.execute(this.toolEnv);
                this.toolContext.commandHistory.addCommand(layerCommand);
            }
        };
        Main_View.prototype.startVectorLayerModalTool = function (modalToolID) {
            var modalTool = this.vectorLayer_ModalTools[modalToolID];
            if (modalTool == null) {
                return;
            }
            this.startModalTool(modalTool);
        };
        Main_View.prototype.startImageFileReferenceLayerModalTool = function (modalToolID) {
            var modalTool = this.imageFileReferenceLayer_ModalTools[modalToolID];
            if (modalTool == null) {
                return;
            }
            this.startModalTool(modalTool);
        };
        Main_View.prototype.layerWindow_UnselectAllLayer = function () {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.layer.isSelected = false;
            }
        };
        Main_View.prototype.selectNextOrPreviousLayer = function (selectNext) {
            var item = this.findCurrentLayerLayerWindowItem();
            if (selectNext) {
                if (item.nextItem != null) {
                    this.setCurrentLayer(item.nextItem.layer);
                }
            }
            else {
                if (item.previousItem != null) {
                    this.setCurrentLayer(item.previousItem.layer);
                }
            }
        };
        // Drawing for export
        Main_View.prototype.clearWindow = function (canvasWindow) {
        };
        Main_View.prototype.drawMainWindow = function (canvasWindow, isExporting) {
        };
        // HTML helper
        Main_View.prototype.getElement = function (id) {
            var element = document.getElementById(id);
            if (element == null) {
                throw ('Could not find element "' + id + '"');
            }
            return element;
        };
        Main_View.prototype.setElementText = function (id, text) {
            var element = (document.getElementById(id));
            element.innerText = text;
            return element;
        };
        Main_View.prototype.setInputElementText = function (id, text) {
            var element = (document.getElementById(id));
            element.value = text;
            return element;
        };
        Main_View.prototype.getInputElementText = function (id) {
            var element = (document.getElementById(id));
            return element.value;
        };
        Main_View.prototype.setInputElementNumber = function (id, value) {
            var element = (document.getElementById(id));
            element.value = value.toString();
            return element;
        };
        Main_View.prototype.getInputElementNumber = function (id, defaultValue) {
            var element = (document.getElementById(id));
            if (element.value == '') {
                return defaultValue;
            }
            return Number(element.value);
        };
        Main_View.prototype.setInputElementRangeValue = function (id, value, min, max) {
            var element = (document.getElementById(id));
            element.value = (value / max * Number(element.max)).toString();
            return element;
        };
        Main_View.prototype.getInputElementRangeValue = function (id, min, max) {
            var element = (document.getElementById(id));
            var value = Number(element.value) / Number(element.max) * max;
            return value;
        };
        Main_View.prototype.setRadioElementIntValue = function (elementName, value) {
            var valueText = value.toString();
            var elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                var radio = elements[i];
                radio.checked = (radio.value == valueText);
            }
        };
        Main_View.prototype.getRadioElementIntValue = function (elementName, defaultValue) {
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
        Main_View.prototype.setInputElementBoolean = function (id, checked) {
            var element = (document.getElementById(id));
            element.checked = checked;
        };
        Main_View.prototype.getInputElementBoolean = function (id) {
            var element = (document.getElementById(id));
            return element.checked;
        };
        Main_View.prototype.setInputElementColor = function (id, color) {
            var colorText = '#' + ManualTracingTool.ColorLogic.rgbToHex2String(color);
            var element = (document.getElementById(id));
            element.value = colorText;
            return color;
        };
        Main_View.prototype.getInputElementColor = function (id, result) {
            var element = (document.getElementById(id));
            var colorText = element.value;
            ManualTracingTool.ColorLogic.hex2StringToRGB(result, colorText);
            return result;
        };
        Main_View.prototype.getInputElementFilePath = function (id) {
            var element = (document.getElementById(id));
            if (element.files.length == 0) {
                return null;
            }
            var file = element.files[0];
            return file.path;
        };
        return Main_View;
    }(ManualTracingTool.Main_Core));
    ManualTracingTool.Main_View = Main_View;
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
    var PalletSelectorWindow = /** @class */ (function (_super) {
        __extends(PalletSelectorWindow, _super);
        function PalletSelectorWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.leftMargin = 7.0;
            _this.topMargin = 30.0;
            _this.rightMargin = 5.0;
            _this.itemScale = 1.0;
            _this.itemWidth = 33.0;
            _this.itemHeight = 15.0;
            _this.itemRightMargin = 5.0;
            _this.itemBottomMargin = 5.0;
            _this.itemAreas = null;
            return _this;
        }
        return PalletSelectorWindow;
    }(ManualTracingTool.ToolBaseWindow));
    ManualTracingTool.PalletSelectorWindow = PalletSelectorWindow;
    var LayerWindowButtonID;
    (function (LayerWindowButtonID) {
        LayerWindowButtonID[LayerWindowButtonID["none"] = 0] = "none";
        LayerWindowButtonID[LayerWindowButtonID["addLayer"] = 1] = "addLayer";
        LayerWindowButtonID[LayerWindowButtonID["deleteLayer"] = 2] = "deleteLayer";
        LayerWindowButtonID[LayerWindowButtonID["moveUp"] = 3] = "moveUp";
        LayerWindowButtonID[LayerWindowButtonID["moveDown"] = 4] = "moveDown";
    })(LayerWindowButtonID = ManualTracingTool.LayerWindowButtonID || (ManualTracingTool.LayerWindowButtonID = {}));
    var LayerWindowButton = /** @class */ (function (_super) {
        __extends(LayerWindowButton, _super);
        function LayerWindowButton() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LayerWindowButton.prototype.ID = function (id) {
            this.buttonID = id;
            return this;
        };
        return LayerWindowButton;
    }(RectangleLayoutArea));
    ManualTracingTool.LayerWindowButton = LayerWindowButton;
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
            _this.toolIndex = 0;
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
    var OpenPalletColorModalMode;
    (function (OpenPalletColorModalMode) {
        OpenPalletColorModalMode[OpenPalletColorModalMode["LineColor"] = 1] = "LineColor";
        OpenPalletColorModalMode[OpenPalletColorModalMode["FillColor"] = 2] = "FillColor";
    })(OpenPalletColorModalMode = ManualTracingTool.OpenPalletColorModalMode || (ManualTracingTool.OpenPalletColorModalMode = {}));
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
        return HTMLElementID;
    }());
    ManualTracingTool.HTMLElementID = HTMLElementID;
})(ManualTracingTool || (ManualTracingTool = {}));
