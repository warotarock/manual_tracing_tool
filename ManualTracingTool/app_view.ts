
namespace ManualTracingTool {

    export class Main_View extends Main_Core {

        protected initializeViews() { //@override

            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;

            this.setCanvasSizeFromStyle(this.palletColorModal_colorCanvas);
            this.drawPalletColorMixer(this.palletColorModal_colorCanvas);

            this.collectLayerWindowButtons();
            this.updateLayerStructure();
        }

        // View management

        protected resizeWindows() { //@override

            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.pickingWindow, this.mainWindow);

            this.resizeCanvasToParent(this.layerWindow);
            this.resizeCanvasToParent(this.subtoolWindow);
            this.resizeCanvasToParent(this.timeLineWindow);

            if (this.isWhileLoading()) {

                this.caluculateLayerWindowLayout(this.layerWindow);
                this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
            }
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

        protected getMouseInfo(toolMouseEvent: ToolMouseEvent, e: MouseEvent, touchUp: boolean, canvasWindow: CanvasWindow) {

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

        // Layer window

        layerWindowLayoutArea = new RectangleLayoutArea();
        layerWindowItems: List<LayerWindowItem> = null;
        layerWindowButtons: List<LayerWindowButton> = null;

        private collectLayerWindowButtons() {

            this.layerWindowButtons = new List<LayerWindowButton>();

            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.addLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.deleteLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveUp));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveDown));
        }

        protected collectLayerWindowItems() { //@override

            this.layerWindowItems = new List<LayerWindowItem>();
            this.collectLayerWindowItemsRecursive(this.layerWindowItems, this.document.rootLayer, 0);

            let previousItem: LayerWindowItem = null;
            for (let item of this.layerWindowItems) {

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

                    this.collectLayerWindowItemsRecursive(this.layerWindowItems, layer, currentDepth + 1);
                }

                siblingItem = item;
            }
        }

        protected findCurrentLayerLayerWindowItemIndex() {

            for (let index = 0; index < this.layerWindowItems.length; index++) {
                let item = this.layerWindowItems[index];

                if (item.layer == this.toolContext.currentLayer) {

                    return index;
                }
            }

            return -1;
        }

        protected findCurrentLayerLayerWindowItem(): LayerWindowItem {

            let index = this.findCurrentLayerLayerWindowItemIndex();

            if (index != -1) {

                let item = this.layerWindowItems[index];

                return item;
            }

            return null;
        }

        protected caluculateLayerWindowLayout(layerWindow: LayerWindow) { //@override

            // layer item buttons
            this.layerWindowLayoutArea.copyRectangle(layerWindow);
            this.layerWindowLayoutArea.bottom = layerWindow.height - 1.0;

            this.caluculateLayerWindowLayout_LayerButtons(layerWindow, this.layerWindowLayoutArea);

            if (this.layerWindowButtons.length > 0) {

                let lastButton = this.layerWindowButtons[this.layerWindowButtons.length - 1];
                this.layerWindowLayoutArea.top = lastButton.getHeight() + 1.0;// lastButton.bottom + 1.0;
            }

            // layer items
            this.caluculateLayerWindowLayout_LayerWindowItem(layerWindow, this.layerWindowLayoutArea);
        }

        protected caluculateLayerWindowLayout_LayerButtons(layerWindow: LayerWindow, layoutArea: RectangleLayoutArea) {

            let currentX = layoutArea.left;
            let currentY = layerWindow.viewLocation[1]; // layoutArea.top;
            let unitWidth = layerWindow.layerItemButtonWidth * layerWindow.layerItemButtonScale;
            let unitHeight = layerWindow.layerItemButtonHeight * layerWindow.layerItemButtonScale;

            for (let button of this.layerWindowButtons) {

                button.left = currentX;
                button.right = currentX + unitWidth - 1;
                button.top = currentY;
                button.bottom = currentY + unitHeight - 1;

                currentX += unitWidth;

                layerWindow.layerItemButtonButtom = button.bottom + 1.0;
            }
        }

        private caluculateLayerWindowLayout_LayerWindowItem(layerWindow: LayerWindow, layoutArea: RectangleLayoutArea) {

            let currentY = layoutArea.top;

            let itemHeight = layerWindow.layerItemHeight;

            let margine = itemHeight * 0.1;
            let iconWidth = (itemHeight - margine * 2);
            let textLeftMargin = itemHeight * 0.3;

            for (let item of this.layerWindowItems) {

                item.left = 0.0;
                item.top = currentY;
                item.right = layerWindow.width - 1;
                item.bottom = currentY + itemHeight - 1;

                item.marginLeft = margine;
                item.marginTop = margine;
                item.marginRight = margine;
                item.marginBottom = margine;
                item.visibilityIconWidth = iconWidth;
                item.textLeft = item.left + margine + iconWidth + textLeftMargin;

                currentY += itemHeight;
            }

            layerWindow.layerItemsBottom = currentY;
        }

        // Subtool window

        subToolViewItems: List<SubToolViewItem> = null;

        protected subtoolWindow_CollectViewItems() { //@override

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

        protected subtoolWindow_CaluculateLayout(subtoolWindow: SubtoolWindow) { //@override

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

        protected isModalShown(): boolean { //@override

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

                let palletColor = documentData.palletColos[palletColorIndex];
                this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                this.setInputElementRangeValue(this.ID.palletColorModal_currentAlpha, palletColor.color[3], 0.0, 1.0);
            }

            for (let palletColorIndex = 0; palletColorIndex < documentData.palletColos.length; palletColorIndex++) {

                let palletColor = documentData.palletColos[palletColorIndex];

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
            let palletColor = documentData.palletColos[palletColorIndex];

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
            let palletColor = documentData.palletColos[palletColorIndex];

            this.getInputElementColor(this.ID.palletColorModal_colorValue + palletColorIndex, palletColor.color);

            this.displayPalletColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPalletColorModal_ColorCanvas_mousedown(e: ToolMouseEvent) {

            if (this.palletColorWindow_EditLayer == null) {
                return;
            }

            let context = this.toolContext;
            let wnd = this.palletColorModal_colorCanvas;
            let env = this.toolEnv;

            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.palletColorWindow_EditLayer;
            let palletColorIndex = this.getRadioElementIntValue(this.ID.palletColorModal_colorIndex, 0);
            let palletColor = documentData.palletColos[palletColorIndex];

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
                    let palletColor = documentData.palletColos[palletColorIndex];
                    this.getInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                    palletColor.color[3] = this.getInputElementRangeValue(this.ID.palletColorModal_currentAlpha, 0.0, 1.0);
                }

                for (let i = 0; i < documentData.palletColos.length; i++) {

                    let palletColor = documentData.palletColos[i];

                    let id = this.ID.palletColorModal_colorValue + i;
                    this.getInputElementColor(id, palletColor.color);
                }
            }

            this.currentModalDialog_DocumentData = null;
            this.palletColorWindow_EditLayer = null;
        }

        public openDocumentSettingDialog() { //@override

            this.openDocumentSettingModal();
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

        protected onNewLayerCommandOptionModal() {

            if (this.currentModalDialogResult != this.ID.newLayerCommandOptionModal_ok) {

                return;
            }

            var layerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, LayerTypeID.vectorLayer);

            // Select command

            let layerCommand: Command_Layer_CommandBase = null;

            if (layerType == LayerTypeID.vectorLayer) {

                layerCommand = new Command_Layer_AddVectorLayerToCurrentPosition();
            }
            else if (layerType == LayerTypeID.vectorLayerReferenceLayer) {

                layerCommand = new Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition();
            }
            else if (layerType == LayerTypeID.groupLayer) {

                layerCommand = new Command_Layer_AddGroupLayerToCurrentPosition();
            }
            else if (layerType == LayerTypeID.posingLayer) {

                layerCommand = new Command_Layer_AddPosingLayerToCurrentPosition();
            }
            else if (layerType == LayerTypeID.imageFileReferenceLayer) {

                layerCommand = new Command_Layer_AddImageFileReferenceLayerToCurrentPosition();
            }

            if (layerCommand == null) {

                return;
            }

            // Execute command

            this.executeLayerCommand(layerCommand);
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

                if (this.currentTool != null) {

                    if (!StringIsNullOrEmpty(filePath)) {

                        this.currentTool.onOpenFile(filePath, this.toolEnv);
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

            this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, this.document.documentFrame[0]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, this.document.documentFrame[1]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, this.document.documentFrame[2]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, this.document.documentFrame[3]);

            this.openModal(this.ID.documentSettingModal, null);
        }

        protected openExportImageFileModal() {

            if (this.isModalShown()) {
                return;
            }

            let fileName = this.getInputElementText(this.ID.fileName);
            let lastSeperatorIndex = StringLastIndexOf(fileName, '\\');
            if (lastSeperatorIndex == -1) {
                lastSeperatorIndex = StringLastIndexOf(fileName, '/');
            }
            let eperatorDotIndex = StringLastIndexOf(fileName, '.');
            if (lastSeperatorIndex != -1 && eperatorDotIndex != -1 && eperatorDotIndex - lastSeperatorIndex > 0) {

                fileName = StringSubstring(fileName, lastSeperatorIndex + 1, eperatorDotIndex - lastSeperatorIndex - 1);
            }

            this.setInputElementText(this.ID.exportImageFileModal_fileName, fileName);

            this.setRadioElementIntValue(this.ID.exportImageFileModal_imageFileType, 1);

            this.openModal(this.ID.exportImageFileModal, null);
        }

        protected onClosedExportImageFileModal() {

            if (this.currentModalDialogResult != this.ID.exportImageFileModal_ok) {
                return;
            }

            let fileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);

            if (StringIsNullOrEmpty(fileName)) {
                return;
            }

            let imageWidth = Math.floor(this.document.documentFrame[2] - this.document.documentFrame[0] + 1);
            let imageHeight = Math.floor(this.document.documentFrame[3] - this.document.documentFrame[1] + 1);

            if (imageWidth > 0 && imageHeight > 0) {

                let canvas = this.renderingWindow.canvas;
                canvas.width = imageWidth;
                canvas.height = imageHeight;

                this.renderingWindow.width = imageWidth;
                this.renderingWindow.height = imageHeight;
                this.renderingWindow.viewLocation[0] = 0.0;
                this.renderingWindow.viewLocation[1] = 0.0;
                this.renderingWindow.viewScale = 1.0;
                this.renderingWindow.viewRotation = 0.0;
                this.renderingWindow.centerLocationRate[0] = 0.5;
                this.renderingWindow.centerLocationRate[1] = 0.5;
                this.clearWindow(this.renderingWindow);
                this.drawMainWindow(this.renderingWindow);

                let exportPath = window.localStorage.getItem(this.exportPathKey);
                let imageType = this.getRadioElementIntValue(this.ID.exportImageFileModal_imageFileType, 1);
                let extText = '.png';
                if (imageType == 2) {
                    extText = '.jpg';
                }
                let fileFullPath = exportPath + '/' + fileName + extText;

                let imageTypeText = 'image/png';
                if (imageType == 2) {
                    imageTypeText = 'image/jpeg';
                }
                var dataUrl = canvas.toDataURL(imageTypeText, 0.9);
                var data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
                var buf = new Buffer(data, 'base64');

                fs.writeFile(fileFullPath, buf, (error) => {
                    if (error) {
                        alert(error);
                    }
                });
            }
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

        protected onModalWindowClosed() {

            if (this.currentModalDialogID == this.ID.layerPropertyModal) {

                let layer = this.layerPropertyWindow_EditLayer;

                // common layer properties

                let layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);

                if (!StringIsNullOrEmpty(layerName)) {

                    layer.name = layerName;
                }

                this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
                layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 0.0, 1.0);

                if (VectorLayer.isVectorLayer(layer)) {

                    let vectorLayer = <VectorLayer>layer;

                    this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                    vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 0.0, 1.0);

                    vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, DrawLineTypeID.layerColor);

                    vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, FillAreaTypeID.fillColor);
                }

                this.layerPropertyWindow_EditLayer = null;
            }
            else if (this.currentModalDialogID == this.ID.palletColorModal) {

                this.onClosedPalletColorModal();
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {

                this.toolContext.drawLineBaseWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineWidth);
                this.toolContext.drawLineMinWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineMinWidth);

                this.toolContext.operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, OperationUnitID.linePoint);

                this.setCurrentSelectionTool(this.toolContext.operationUnitID);
            }
            else if (this.currentModalDialogID == this.ID.newLayerCommandOptionModal) {

                this.onNewLayerCommandOptionModal();
            }
            else if (this.currentModalDialogID == this.ID.openFileDialogModal) {

                this.onClosedFileDialogModal();
            }
            else if (this.currentModalDialogID == this.ID.documentSettingModal) {

                this.document.documentFrame[0] = this.getInputElementNumber(this.ID.documentSettingModal_FrameLeft);
                this.document.documentFrame[1] = this.getInputElementNumber(this.ID.documentSettingModal_FrameTop);
                this.document.documentFrame[2] = this.getInputElementNumber(this.ID.documentSettingModal_FrameRight);
                this.document.documentFrame[3] = this.getInputElementNumber(this.ID.documentSettingModal_FrameBottom);
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

        public openFileDialog(targetID: OpenFileDialogTargetID) { //@override

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
            let minRadius = 10.0;
            let maxRadius = width * 1.0;

            this.canvasRender.setContext(wnd);
            this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
            this.canvasRender.setFillColorV(this.colorB);
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
            let division = 50.0;
            let unitWidth = width / division;
            let unitHeight = height / division;
            for (let x = 0.0; x < 1.0; x += (1.0 / division)) {

                for (let y = 0.0; y < 1.0; y += (1.0 / division)) {

                    let h = x;
                    let s = 0.0;
                    let v = 0.0;
                    if (y <= 0.5) {
                        s = y * 2.0;
                        v = 1.0;
                    }
                    else {
                        s = 1.0;
                        v = 1.0 - (y - 0.5) * 2.0;
                    }

                    Maths.hsvToRGBVec4(this.tempColor4, h, s, v);
                    this.tempColor4[3] = 1.0;
                    this.canvasRender.setFillColorV(this.tempColor4);
                    this.canvasRender.fillRect(x * width, y * height, unitWidth, unitHeight);
                }
            }
            this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
        }

        // Header window

        protected updateHeaderButtons() { //@override

            {
                let isButtonON = (this.toolContext.editMode == EditModeID.drawMode
                    && (this.toolContext.mainToolID == MainToolID.drawLine
                        || this.toolContext.mainToolID == MainToolID.posing));

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

        protected updateHdeaderDocumentFileName() { //@override

            let filePath = window.localStorage.getItem(this.lastFilePathKey);

            this.setInputElementText(this.ID.fileName, filePath);
        }

        // Footer window

        footerText: string = '';
        footerTextBefore: string = '';

        protected updateFooterMessage() { //@override

            let context = this.toolContext;
            let modeText = '';

            if (this.toolEnv.isDrawMode()) {

                modeText = 'DrawMode';
            }
            else if (this.toolEnv.isEditMode()) {

                modeText = 'SelectMode';
            }

            let toolText = '';

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

        protected mousemoveHittest(x: float, y: float, minDistance: float): boolean {

            this.hittest_Line_IsCloseTo.startProcess();

            if (this.toolEnv.currentVectorGeometry != null) {

                this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorGeometry, x, y, minDistance);
            }

            this.hittest_Line_IsCloseTo.endProcess();

            return this.hittest_Line_IsCloseTo.isChanged;
        }

        // Common functions

        protected setLayerCommandParameters(layerCommand: Command_Layer_CommandBase, currentLayerWindowItem: LayerWindowItem) {

            // Collects layer items for command
            let currentLayer: Layer = currentLayerWindowItem.layer;
            let currentLayerParent: Layer = currentLayerWindowItem.parentLayer;

            let previousLayer: Layer = null;
            let previousLayerParent: Layer = null;
            if (currentLayerWindowItem.layer.type == LayerTypeID.groupLayer) {

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

            let nextLayer: Layer = null;
            let nextLayerParent: Layer = null;
            if (currentLayerWindowItem.layer.type == LayerTypeID.groupLayer) {

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

            layerCommand.setPrameters(
                currentLayer
                , currentLayerParent
                , previousLayer
                , previousLayerParent
                , nextLayer
                , nextLayerParent
            );
        }

        protected executeLayerCommand(layerCommand: Command_Layer_CommandBase) {

            let currentLayerWindowItem = this.findCurrentLayerLayerWindowItem();

            if (currentLayerWindowItem == null) {

                return;
            }

            this.setLayerCommandParameters(layerCommand, currentLayerWindowItem);

            if (layerCommand.isAvailable(this.toolEnv)) {

                layerCommand.execute(this.toolEnv);

                this.toolContext.commandHistory.addCommand(layerCommand);
            }
        }

        protected startVectorLayerModalTool(modalToolID: ModalToolID) {

            let modalTool = this.vectorLayer_ModalTools[<int>modalToolID];

            if (modalTool == null) {

                return;
            }

            this.startModalTool(modalTool);
        }

        protected startImageFileReferenceLayerModalTool(modalToolID: ModalToolID) {

            let modalTool = this.imageFileReferenceLayer_ModalTools[<int>modalToolID];

            if (modalTool == null) {

                return;
            }

            this.startModalTool(modalTool);
        }

        protected layerWindow_UnselectAllLayer() { //@override

            for (let item of this.layerWindowItems) {

                item.layer.isSelected = false;
            }
        }

        protected selectNextOrPreviousLayer(selectNext: boolean) {

            let item = this.findCurrentLayerLayerWindowItem();

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
        }

        // Drawing for export

        protected clearWindow(canvasWindow: CanvasWindow) { //@virtual
        }

        protected drawMainWindow(canvasWindow: CanvasWindow) { //@virtual
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

        getInputElementText(id: string): string { //@override

            let element = <HTMLInputElement>(document.getElementById(id));

            return element.value;
        }

        setInputElementNumber(id: string, value: float): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = value.toString();

            return element;
        }

        getInputElementNumber(id: string): float {

            let element = <HTMLInputElement>(document.getElementById(id));

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

        layerItemButtonScale = 0.375;
        layerItemButtonWidth = 64.0;
        layerItemButtonHeight = 64.0;
        layerItemButtonButtom = 64.0;

        layerItemHeight = 24.0;
        layerItemFontSize = 16.0;

        layerItemVisibilityIconWidth = 24.0;
        layerItemVisibilityIconRight = 24.0;

        layerItemsBottom = 0.0;
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

    export enum LayerWindowButtonID {

        none = 0,
        addLayer = 1,
        deleteLayer = 2,
        moveUp = 3,
        moveDown = 4,
    }

    export class LayerWindowButton extends RectangleLayoutArea {

        buttonID: LayerWindowButtonID;

        ID(id: LayerWindowButtonID): LayerWindowButton {

            this.buttonID = id;

            return this;
        }
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

    export enum DrawLineToolSubToolID {

        drawLine = 0,
        scratchLine = 2,
        deletePointBrush = 1
    }

    export enum EditModeSubToolID {

        mainEditTool = 0,
    }

    export enum ModalToolID {

        none = 0,
        grabMove = 1,
        ratate = 2,
        scale = 3,
        latticeMove = 4,
        countOfID = 5,
    }

    export class ViewKeyframeLayer {

        layer: Layer = null;
        vectorLayerKeyframe: VectorLayerKeyFrame = null;

        hasKeyframe(): boolean {

            return (this.vectorLayerKeyframe != null);
        }
    }

    export class ViewKeyFrame {

        frame = 0;
        layers = new List<ViewKeyframeLayer>();
    }

    export class ViewLayerContext {

        keyframes: List<ViewKeyFrame> = null;
    }

    export class HTMLElementID {

        none = 'none';

        fileName = 'fileName';

        mainCanvas = 'mainCanvas';
        editorCanvas = 'editorCanvas';
        webglCanvas = 'webglCanvas';
        layerCanvas = 'layerCanvas';
        subtoolCanvas = 'subtoolCanvas';
        timeLineCanvas = 'timeLineCanvas';

        menu_btnDrawTool = 'menu_btnDrawTool';
        menu_btnMiscTool = 'menu_btnMiscTool';
        menu_btnEditTool = 'menu_btnEditTool';
        menu_btnOperationOption = 'menu_btnOperationOption';
        menu_btnOpen = 'menu_btnOpen';
        menu_btnSave = 'menu_btnSave';
        menu_btnExport = 'menu_btnExport';
        menu_btnPalette1 = 'menu_btnPalette1';
        menu_btnPalette2 = 'menu_btnPalette2';

        unselectedMainButton = 'unselectedMainButton';
        selectedMainButton = 'selectedMainButton';

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
        documentSettingModal_FrameLeft = 'documentSettingModal_FrameLeft';
        documentSettingModal_FrameTop = 'documentSettingModal_FrameTop';
        documentSettingModal_FrameRight = 'documentSettingModal_FrameRight';
        documentSettingModal_FrameBottom = 'documentSettingModal_FrameBottom';

        exportImageFileModal = '#exportImageFileModal';
        exportImageFileModal_fileName = 'exportImageFileModal_fileName';
        exportImageFileModal_imageFileType = 'exportImageFileModal_imageFileType';
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
