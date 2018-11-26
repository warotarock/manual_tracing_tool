
namespace ManualTracingTool {

    export class Main_Event extends Main_Drawing {

        // Events

        protected setEvents() { //@override

            if (this.isEventSetDone) {
                return;
            }

            this.isEventSetDone = true;

            this.editorWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.mainWindow.toolMouseEvent, e, false, this.mainWindow);
                this.mainWindow_mousedown();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('mousemove', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.mainWindow.toolMouseEvent, e, false, this.mainWindow);
                this.mainWindow_mousemove();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('mouseup', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.mainWindow.toolMouseEvent, e, true, this.mainWindow);
                this.mainWindow_mouseup();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.mainWindow.toolMouseEvent, e, true, false, this.mainWindow);
                this.mainWindow_mousedown();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.mainWindow.toolMouseEvent, e, false, false, this.mainWindow);
                this.mainWindow_mousemove();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.mainWindow.toolMouseEvent, e, false, true, this.mainWindow);
                this.mainWindow_mouseup();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('mousewheel', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getWheelInfo(this.mainWindow.toolMouseEvent, e);
                this.editorWindow_mousewheel();
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.layerWindow.toolMouseEvent, e, false, this.layerWindow);
                this.layerWindow_mousedown();
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('mousemove', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.layerWindow.toolMouseEvent, e, false, this.layerWindow);
                this.layerWindow_mousemove();
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('mouseup', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.layerWindow.toolMouseEvent, e, true, this.mainWindow);
                this.layerWindow_mouseup();
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.layerWindow.toolMouseEvent, e, true, false, this.layerWindow);
                this.layerWindow_mousedown();
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.layerWindow.toolMouseEvent, e, false, false, this.layerWindow);
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.layerWindow.toolMouseEvent, e, false, true, this.layerWindow);
                e.preventDefault();
            });

            this.subtoolWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.subtoolWindow.toolMouseEvent, e, false, this.subtoolWindow);
                this.subtoolWindow_mousedown(this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.subtoolWindow.canvas.addEventListener('mousemove', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.subtoolWindow.toolMouseEvent, e, false, this.subtoolWindow);
                this.subtoolWindow_mousemove(this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.subtoolWindow.canvas.addEventListener('mouseup', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.subtoolWindow.toolMouseEvent, e, true, this.mainWindow);
                this.subtoolWindow_mouseup(this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.subtoolWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.subtoolWindow.toolMouseEvent, e, true, false, this.subtoolWindow);
                this.subtoolWindow_mousedown(this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.subtoolWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.subtoolWindow.toolMouseEvent, e, false, false, this.subtoolWindow);
                e.preventDefault();
            });

            this.subtoolWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.subtoolWindow.toolMouseEvent, e, false, true, this.subtoolWindow);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.timeLineWindow.toolMouseEvent, e, false, this.timeLineWindow);
                this.timeLineWindow_mousedown(this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('mousemove', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.timeLineWindow.toolMouseEvent, e, false, this.timeLineWindow);
                this.timeLineWindow_mousemove(this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('mouseup', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getMouseInfo(this.timeLineWindow.toolMouseEvent, e, true, this.mainWindow);
                this.timeLineWindow_mouseup(this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.timeLineWindow.toolMouseEvent, e, true, false, this.timeLineWindow);
                this.timeLineWindow_mousedown(this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.timeLineWindow.toolMouseEvent, e, false, false, this.timeLineWindow);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getTouchInfo(this.timeLineWindow.toolMouseEvent, e, false, true, this.timeLineWindow);
                e.preventDefault();
            });

            this.timeLineWindow.canvas.addEventListener('mousewheel', (e: MouseEvent) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.getWheelInfo(this.timeLineWindow.toolMouseEvent, e);
                this.timeLineWindow_mousewheel(this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });

            this.palletColorModal_colorCanvas.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                if (this.currentModalDialogID != this.ID.palletColorModal) {
                    return;
                }

                this.getMouseInfo(this.palletColorModal_colorCanvas.toolMouseEvent, e, false, this.palletColorModal_colorCanvas);
                this.onPalletColorModal_ColorCanvas_mousedown(this.palletColorModal_colorCanvas.toolMouseEvent);
                e.preventDefault();
            });

            document.addEventListener('keydown', (e: KeyboardEvent) => {

                if (this.isWhileLoading()) {
                    return;
                }

                if (this.isModalShown()) {
                    return;
                }

                if (document.activeElement.id == this.ID.fileName) {
                    return;
                }

                this.document_keydown(e);
            });

            document.addEventListener('keyup', (e: KeyboardEvent) => {

                if (this.isModalShown()) {
                    return;
                }

                if (document.activeElement.id == this.ID.fileName) {
                    return;
                }

                this.document_keyup(e);
            });

            window.addEventListener('resize', (e: Event) => {
                this.htmlWindow_resize(e);
            });

            window.addEventListener('contextmenu', (e: Event) => {
                return this.htmlWindow_contextmenu(e);
            });

            // Menu buttons

            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                let env = this.toolEnv;
                let context = this.toolContext;

                this.setCurrentMainToolForCurentLayer();
                this.setCurrentEditMode(EditModeID.drawMode);

                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawLayerWindow();
                this.toolEnv.setRedrawSubtoolWindow();

                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnEditTool).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                let env = this.toolEnv;
                let context = this.toolContext;

                if (env.isDrawMode()) {

                    this.setCurrentEditMode(EditModeID.editMode);
                }

                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnMiscTool).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.setCurrentMainTool(MainToolID.misc);
                this.setCurrentEditMode(EditModeID.drawMode);

                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawLayerWindow();
                this.toolEnv.setRedrawSubtoolWindow();

                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnOperationOption).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openOperationOptionModal();
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnOpen).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.startReloadDocument();
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnSave).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.saveDocument();
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnExport).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openExportImageFileModal();
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnPalette1).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openPalletColorModal(OpenPalletColorModalMode.LineColor, this.toolContext.document, this.toolContext.currentLayer);
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnPalette2).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openPalletColorModal(OpenPalletColorModalMode.FillColor, this.toolContext.document, this.toolContext.currentLayer);
                e.preventDefault();
            });

            // Modal window

            document.addEventListener('custombox:content:open', () => {

                this.onModalWindowShown();
            });

            document.addEventListener('custombox:content:close', () => {

                this.onModalWindowClosed();
            });

            this.setEvents_ModalCloseButton(this.ID.openFileDialogModal_ok);
            this.setEvents_ModalCloseButton(this.ID.openFileDialogModal_cancel);

            this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_ok);
            this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_cancel);

            this.setEvents_ModalCloseButton(this.ID.exportImageFileModal_ok);
            this.setEvents_ModalCloseButton(this.ID.exportImageFileModal_cancel);

            this.setEvents_ModalCloseButton(this.ID.newKeyframeModal_ok);
            this.setEvents_ModalCloseButton(this.ID.newKeyframeModal_cancel);

            this.setEvents_ModalCloseButton(this.ID.deleteKeyframeModal_ok);
            this.setEvents_ModalCloseButton(this.ID.deleteKeyframeModal_cancel);

            // Pallet modal

            this.getElement(this.ID.palletColorModal_currentColor).addEventListener('change', (e: Event) => {

                this.onPalletColorModal_CurrentColorChanged();
            });

            this.getElement(this.ID.palletColorModal_currentAlpha).addEventListener('change', (e: Event) => {

                this.onPalletColorModal_CurrentColorChanged();
            });

            for (let palletColorIndex = 0; palletColorIndex < DocumentData.maxPalletColors; palletColorIndex++) {

                {
                    let id = this.ID.palletColorModal_colorValue + palletColorIndex;
                    let colorButton = <HTMLInputElement>this.getElement(id);

                    colorButton.addEventListener('change', (e: Event) => {

                        this.onPalletColorModal_ColorChanged(palletColorIndex);
                    });
                }

                {
                    let id = this.ID.palletColorModal_colorIndex + palletColorIndex;
                    let radioButton = <HTMLInputElement>this.getElement(id);

                    radioButton.addEventListener('click', (e: Event) => {

                        this.onPalletColorModal_ColorIndexChanged();
                    });
                }
            }
        }

        protected setEvents_ModalCloseButton(id: string) {

            this.getElement(id).addEventListener('click', (e: Event) => {

                this.currentModalDialogResult = id;

                this.closeModal();

                e.preventDefault();
            });
        }

        protected mainWindow_mousedown() {

            let context = this.toolContext;
            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            this.toolEnv.updateContext();

            // Execute current tool
            if (this.isModalToolRunning()) {

                this.currentTool.mouseDown(e, this.toolEnv);
            }
            else if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseDown(e, this.toolEnv);
            }
            else if (this.toolEnv.isEditMode()) {

                this.currentSelectTool.mouseDown(e, this.toolEnv);
            }

            // View operation
            if (e.isRightButtonPressing() || e.isCenterButtonPressing()) {

                this.mainWindow_MouseViewOperationStart();
            }
            else {

                this.mainWindow_MouseViewOperationEnd();
            }
        }

        protected mainWindow_MouseViewOperationStart() {

            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            e.startMouseDragging();

            mat4.copy(wnd.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(wnd.dragBeforeViewLocation, wnd.viewLocation);
        }

        protected mainWindow_MouseViewOperationEnd() {

            let e = this.mainWindow.toolMouseEvent;

            e.endMouseDragging();
        }

        protected mainWindow_mousemove() {

            let context = this.toolContext;
            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            this.toolEnv.updateContext();

            // Execute current tool
            if (this.isModalToolRunning()) {

                if (!e.isMouseDragging) {

                    this.currentTool.mouseMove(e, this.toolEnv);
                }
            }
            else if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseMove(e, this.toolEnv);
            }
            else if (this.toolEnv.isEditMode()) {

                let isHitChanged = this.mousemoveHittest(e.location[0], e.location[1], this.toolEnv.mouseCursorViewRadius);
                if (isHitChanged) {
                    this.toolEnv.setRedrawMainWindow();
                }

                this.currentSelectTool.mouseMove(e, this.toolEnv);
            }

            // View operation
            if (e.isMouseDragging) {

                vec3.set(this.tempVec3, e.offsetX, e.offsetY, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, wnd.dragBeforeTransformMatrix);

                vec3.subtract(e.mouseMovedVector, e.mouseDownLocation, this.tempVec3);

                vec3.add(this.mainWindow.viewLocation, wnd.dragBeforeViewLocation, e.mouseMovedVector);

                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        }

        protected mainWindow_mouseup() {

            let context = this.toolContext;
            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            this.toolEnv.updateContext();

            // Draw mode
            if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseUp(e, this.toolEnv);
            }
            // Select mode
            else if (this.toolEnv.isEditMode()) {

                this.currentSelectTool.mouseUp(e, this.toolEnv);
            }

            this.mainWindow_MouseViewOperationEnd();
        }

        protected editorWindow_mousewheel() {

            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            // View operation
            if (e.wheelDelta != 0.0
                && !e.isMouseDragging) {

                this.mainWindow.addViewScale(e.wheelDelta * 0.1);

                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        }

        protected layerWindow_mousedown() {

            let context = this.toolContext;
            let wnd = this.layerWindow;
            let e = wnd.toolMouseEvent;

            this.toolEnv.updateContext();

            let doubleClicked = wnd.toolMouseEvent.hundleDoubleClick(e.offsetX, e.offsetY);

            let clickedX = e.location[0];
            let clickedY = e.location[1];

            if (e.isLeftButtonPressing()) {

                if (e.location[1] <= wnd.layerItemButtonButtom) {

                    // Layer window button click
                    this.layerWindow_mousedown_LayerItemButton(clickedX, clickedY, doubleClicked);
                }
                else if (e.location[1] < wnd.layerItemsBottom) {

                    // Layer window item click
                    this.layerWindow_mousedown_LayerItem(clickedX, clickedY, doubleClicked);
                }
            }
            else if (e.isCenterButtonPressing() || e.isRightButtonPressing()) {

                wnd.startMouseDragging();
            }
        }

        protected layerWindow_mousemove() {

            let wnd = this.layerWindow;
            let e = wnd.toolMouseEvent;

            // View operation
            if (e.isMouseDragging) {

                vec3.add(wnd.viewLocation, wnd.dragBeforeViewLocation, e.mouseMovedOffset);
                wnd.viewLocation[0] = 0.0;

                if (wnd.viewLocation[1] < 0.0) {
                    wnd.viewLocation[1] = 0.0;
                }

                if (wnd.viewLocation[1] > wnd.layerItemsBottom - wnd.layerItemHeight) {
                    wnd.viewLocation[1] = wnd.layerItemsBottom - wnd.layerItemHeight;
                }

                this.toolEnv.setRedrawLayerWindow();
            }
        }

        protected layerWindow_mouseup() {

            this.layerWindow.endMouseDragging();
        }

        protected layerWindow_mousedown_LayerItemButton(clickedX: float, clickedY: float, doubleClicked: boolean) {

            let hitedButton = <LayerWindowButton>this.hitTestLayout(this.layerWindowButtons, clickedX, clickedY);

            if (hitedButton != null) {

                // Select command
                let layerCommand: Command_Layer_CommandBase = null;

                if (hitedButton.buttonID == LayerWindowButtonID.addLayer) {

                    this.openNewLayerCommandOptionModal();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.deleteLayer) {

                    layerCommand = new Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveUp) {

                    layerCommand = new Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveDown) {

                    layerCommand = new Command_Layer_MoveDown();
                }

                if (layerCommand == null) {

                    return;
                }

                // Execute command
                this.executeLayerCommand(layerCommand);
            }
        }

        protected layerWindow_mousedown_LayerItem(clickedX: float, clickedY: float, doubleClicked: boolean) {

            if (this.layerWindowItems.length == 0) {
                return;
            }

            let firstItem = this.layerWindowItems[0];
            let selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());

            if (selectedIndex >= 0 && selectedIndex < this.layerWindowItems.length) {

                let selectedItem = this.layerWindowItems[selectedIndex];
                let selectedLayer = selectedItem.layer;

                if (clickedX <= selectedItem.textLeft) {

                    selectedItem.layer.isVisible = !selectedItem.layer.isVisible;

                    this.toolEnv.setRedrawMainWindowEditorWindow();
                }
                else {

                    if (doubleClicked) {

                        // Layer property

                        this.openLayerPropertyModal(selectedLayer, selectedItem);
                    }
                    else {

                        // Select layer content

                        this.setCurrentLayer(selectedLayer);

                        this.toolEnv.setRedrawMainWindowEditorWindow();
                    }
                }
            }

            this.toolEnv.setRedrawLayerWindow();
            this.toolEnv.setRedrawSubtoolWindow();
        }

        protected subtoolWindow_mousedown(e: ToolMouseEvent) {

            let context = this.toolContext;
            let wnd = this.subtoolWindow;
            let env = this.toolEnv;
            let doubleClicked = wnd.toolMouseEvent.hundleDoubleClick(e.offsetX, e.offsetY);

            if (context.mainToolID == MainToolID.none || this.subToolViewItems.length == 0) {

                return;
            }

            env.updateContext();

            let clickedX = e.location[0];
            let clickedY = e.location[1];

            if (e.isLeftButtonPressing()) {

                let firstItem = this.subToolViewItems[0];
                let selectedIndex = Math.floor((clickedY - firstItem.top) / (firstItem.getHeight()));

                if (selectedIndex < 0 || selectedIndex >= this.subToolViewItems.length) {

                    return;
                }

                let viewItem = this.subToolViewItems[selectedIndex];
                let tool = viewItem.tool;

                if (tool.isAvailable(env)) {

                    // Change current sub tool
                    this.setCurrentSubTool(selectedIndex);
                    this.updateFooterMessage();
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawSubtoolWindow();

                    // Option button click
                    let button = this.hitTestLayout(viewItem.buttons, clickedX, clickedY);
                    if (button != null) {

                        let inpuSideID = tool.getInputSideID(button.index, env);

                        if (tool.setInputSide(button.index, inpuSideID, env)) {

                            env.setRedrawMainWindowEditorWindow();
                            env.setRedrawSubtoolWindow();
                        }
                    }

                    // Tool event
                    if (button == null && this.currentTool != null) {

                        if (doubleClicked) {

                            this.currentTool.toolWindowItemDoubleClick(e, env);
                        }
                        else if (e.isLeftButtonPressing()) {

                            this.currentTool.toolWindowItemClick(e, env);
                        }
                    }
                }
            }
            else if (e.isCenterButtonPressing() || e.isRightButtonPressing()) {

                wnd.startMouseDragging();
            }
        }

        protected subtoolWindow_mousemove(e: ToolMouseEvent) {

            let wnd = this.subtoolWindow;

            // View operation
            if (e.isMouseDragging) {

                vec3.add(wnd.viewLocation, wnd.dragBeforeViewLocation, e.mouseMovedOffset);
                wnd.viewLocation[0] = 0.0;

                if (wnd.viewLocation[1] < 0.0) {
                    wnd.viewLocation[1] = 0.0;
                }

                if (wnd.viewLocation[1] > wnd.subToolItemsBottom - wnd.subToolItemUnitHeight) {
                    wnd.viewLocation[1] = wnd.subToolItemsBottom - wnd.subToolItemUnitHeight;
                }

                this.toolEnv.setRedrawSubtoolWindow();
            }
        }

        protected subtoolWindow_mouseup(e: ToolMouseEvent) {

            this.subtoolWindow.endMouseDragging();
        }

        protected timeLineWindow_mousedown(e: ToolMouseEvent) {

            let context = this.toolContext;
            let wnd = this.timeLineWindow;
            let env = this.toolEnv;
            let aniSetting = context.document.animationSettingData;

            let left = wnd.getTimeLineLeft();

            if (e.offsetX < left) {

                this.timeLineWindow_OnPlayPauseButton(e);
            }
            else {

                this.timeLineWindow_ProcessFrameInput(e);
            }
        }

        protected timeLineWindow_OnPlayPauseButton(e: ToolMouseEvent) {

            let context = this.toolContext;
            let env = this.toolEnv;
            let aniSetting = context.document.animationSettingData;

            if (context.animationPlaying) {

                context.animationPlaying = false;

                env.setRedrawTimeLineWindow();
            }
            else {

                context.animationPlaying = true;
                context.animationPlayingFPS = aniSetting.animationFrameParSecond;
            }
        }

        protected timeLineWindow_ProcessFrameInput(e: ToolMouseEvent) {

            let context = this.toolContext;
            let wnd = this.timeLineWindow;
            let env = this.toolEnv;
            let aniSetting = context.document.animationSettingData;

            let clickedFrame = wnd.getFrameByLocation(e.offsetX, aniSetting);

            if (clickedFrame != -1) {

                this.setCurrentFrame(clickedFrame);
                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();
            }
        }

        protected timeLineWindow_mousemove(e: ToolMouseEvent) {

            let context = this.toolContext;
            let wnd = this.timeLineWindow;
            let env = this.toolEnv;

            if (e.isLeftButtonPressing()) {

                this.timeLineWindow_ProcessFrameInput(e);
            }
        }

        protected timeLineWindow_mouseup(e: ToolMouseEvent) {

            let context = this.toolContext;
            let wnd = this.timeLineWindow;
            let env = this.toolEnv;


            wnd.endMouseDragging();
        }

        protected timeLineWindow_mousewheel(e: ToolMouseEvent) {

            let context = this.toolContext;
            let wnd = this.mainWindow;
            let env = this.toolEnv;
            let aniSetting = context.document.animationSettingData;

            if (env.isCtrlKeyPressing()) {

                let addScale = 0.2;

                if (e.wheelDelta > 0) {

                    aniSetting.timeLineWindowScale += addScale;
                }
                else {

                    aniSetting.timeLineWindowScale -= addScale;
                }

                if (aniSetting.timeLineWindowScale < 1.0) {

                    aniSetting.timeLineWindowScale = 1.0;
                }

                if (aniSetting.timeLineWindowScale > aniSetting.timeLineWindowScaleMax) {

                    aniSetting.timeLineWindowScale = aniSetting.timeLineWindowScaleMax;
                }

                env.setRedrawTimeLineWindow();
            }
        }

        protected document_keydown(e: KeyboardEvent) {

            var env = this.toolEnv;
            let context = this.toolContext;
            let key = e.key;
            if (key.length == 1) {
                key = key.toLowerCase();
            }

            e.preventDefault();

            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;

            env.updateContext();

            if (this.isModalToolRunning()) {

                this.document_keydown_modalTool(key, e);

                return;
            }

            if (this.activeCanvasWindow == this.timeLineWindow) {

                if (this.document_keydown_timeLineWindow(key, e)) {

                    return;
                }
            }

            if (key == 'Tab') {

                // Change mode
                if (env.isDrawMode()) {

                    this.setCurrentEditMode(EditModeID.editMode);
                }
                else {

                    this.setCurrentEditMode(EditModeID.drawMode);
                }

                return;
            }

            if (key == 'n' && env.isCtrlKeyPressing()) {

                this.document = this.createDefaultDocumentData();
                this.toolContext.document = this.document;
                this.toolContext.commandHistory = new CommandHistory();

                this.updateLayerStructure();
                this.setCurrentLayer(null);
                this.setCurrentFrame(0);
                this.setCurrentLayer(this.document.rootLayer.childLayers[0]);

                env.setRedrawAllWindows();

                return;
            }

            if (key == 'b') {

                if (env.isDrawMode()) {

                    this.setCurrentMainTool(MainToolID.drawLine);
                    this.setCurrentSubTool(<int>DrawLineToolSubToolID.drawLine);

                    this.updateFooterMessage();
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawLayerWindow();
                    env.setRedrawSubtoolWindow();
                }

                return;
            }

            if (key == 'e') {

                if (env.isDrawMode()) {

                    this.setCurrentMainTool(MainToolID.drawLine);
                    if (context.subToolIndex != <int>DrawLineToolSubToolID.deletePointBrush) {

                        this.setCurrentSubTool(<int>DrawLineToolSubToolID.deletePointBrush);
                    }
                    else {

                        this.setCurrentSubTool(<int>DrawLineToolSubToolID.drawLine);
                    }

                    this.updateFooterMessage();
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawLayerWindow();
                    env.setRedrawSubtoolWindow();
                }

                return;
            }

            if (key == 'p') {

                return;
            }

            if (key == 'z') {

                this.toolContext.commandHistory.undo(env);

                env.setRedrawMainWindow();

                return;
            }

            if (key == 'y') {

                this.toolContext.commandHistory.redo(env);

                env.setRedrawMainWindow();

                return;
            }

            if (key == 'Delete' || key == 'x') {

                if (env.isEditMode()) {

                    if (this.toolContext.currentVectorLayer != null
                        && this.toolContext.currentVectorGeometry != null) {

                        let command = new Command_DeleteSelectedPoints();
                        if (command.prepareEditTargets(this.toolContext.currentVectorLayer, this.toolContext.currentVectorGeometry)) {

                            command.execute(env);
                            this.toolContext.commandHistory.addCommand(command);
                        }

                        env.setRedrawMainWindow();
                    }
                }

                return;
            }

            if (key == 'Home' || key == 'q') {

                this.mainWindow.viewLocation[0] = 0.0;
                this.mainWindow.viewLocation[1] = 0.0;
                this.mainWindow.viewScale = 1.0;
                this.mainWindow.viewRotation = 0.0;

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (key == 't' || key == 'r') {

                if (env.isDrawMode()) {

                    let rot = 10.0;
                    if (key == 't') {
                        rot = -rot;
                    }

                    this.mainWindow.viewRotation += rot;
                    if (this.mainWindow.viewRotation >= 360.0) {
                        this.mainWindow.viewRotation -= 360.0;
                    }
                    if (this.mainWindow.viewRotation <= 0.0) {
                        this.mainWindow.viewRotation += 360.0;
                    }

                    env.setRedrawMainWindowEditorWindow();

                    return;
                }
            }

            if (key == 'f' || key == 'd') {

                let addScale = 0.1 * this.drawStyle.viewZoomAdjustingSpeedRate;
                if (key == 'd') {
                    addScale = -addScale;
                }

                this.mainWindow.addViewScale(addScale);

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (env.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight' || key == 'ArrowUp' || key == 'ArrowDown')) {

                let x = 0.0;
                let y = 0.0;
                if (key == 'ArrowLeft') {
                    x = -10.0;
                }
                if (key == 'ArrowRight') {
                    x = 10.0;
                }
                if (key == 'ArrowUp') {
                    y = -10.0;
                }
                if (key == 'ArrowDown') {
                    y = 10.0;
                }

                this.mainWindow.calculateViewUnitMatrix(this.view2DMatrix);
                mat4.invert(this.invView2DMatrix, this.view2DMatrix);
                vec3.set(this.tempVec3, x, y, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, this.invView2DMatrix);

                vec3.add(this.mainWindow.viewLocation, this.mainWindow.viewLocation, this.tempVec3);

                let leftLimit = this.mainWindow.width * (-0.5);
                let rightLimit = this.mainWindow.width * 1.5
                let topLimit = this.mainWindow.height * (-0.5);
                let bottomLimit = this.mainWindow.height * 1.5

                if (this.mainWindow.viewLocation[0] < leftLimit) {
                    this.mainWindow.viewLocation[0] = leftLimit;
                }
                if (this.mainWindow.viewLocation[0] > rightLimit) {
                    this.mainWindow.viewLocation[0] = rightLimit;
                }
                if (this.mainWindow.viewLocation[1] < topLimit) {
                    this.mainWindow.viewLocation[1] = topLimit;
                }
                if (this.mainWindow.viewLocation[1] > bottomLimit) {
                    this.mainWindow.viewLocation[1] = bottomLimit;
                }

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (!env.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight')) {

                let addFrame = 1;
                if (key == 'ArrowLeft') {
                    addFrame = -addFrame;
                }

                this.setCurrentFrame(context.document.animationSettingData.currentTimeFrame + addFrame);

                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();
            }

            if (key == 'i') {

                return;
            }

            if (key == ' ') {

                if (this.activeCanvasWindow == this.mainWindow) {

                    this.mainWindow_MouseViewOperationStart();
                }
                else if (this.activeCanvasWindow == this.layerWindow) {

                    this.layerWindow.startMouseDragging();
                }
                else if (this.activeCanvasWindow == this.subtoolWindow) {

                    this.subtoolWindow.startMouseDragging();
                }

                return;
            }

            if (key == '.' && env.needsDrawOperatorCursor()) {

                vec3.copy(this.toolContext.operatorCursor.location, this.mainWindow.toolMouseEvent.location);
                this.toolEnv.setRedrawEditorWindow();
            }

            if (key == 'a') {

                if (env.isEditMode()) {

                    this.tool_SelectAllPoints.execute(env);
                }
                else {

                    this.selectNextOrPreviousLayer(false);
                    this.startShowingCurrentLayer();
                    env.setRedrawLayerWindow();
                }

                return;
            }

            if (key == 'w') {

                let pickedLayer: Layer = null;
                for (let pickingPosition of this.layerPickingPositions) {

                    let pickX = this.mainWindow.toolMouseEvent.offsetX + pickingPosition[0];
                    let pickY = this.mainWindow.toolMouseEvent.offsetY + pickingPosition[1];

                    pickedLayer = this.layerPicking(this.mainWindow, pickX, pickY);

                    if (pickedLayer != null) {
                        break;
                    }
                }

                if (pickedLayer != null) {

                    this.startShowingCurrentLayer();
                }
                else {

                    env.setRedrawMainWindowEditorWindow();
                }

                return;
            }

            if (key == 'l') {
            }

            if (key == 'g' || key == 'r' || key == 's') {

                if (key == 's' && env.isCtrlKeyPressing()) {

                    this.saveDocument();
                    return;
                }

                if (env.isDrawMode()) {

                    if (key == 's') {
                        this.selectNextOrPreviousLayer(true);
                        this.startShowingCurrentLayer();
                        env.setRedrawLayerWindow();
                    }
                    else {

                        this.currentTool.keydown(e, env);
                    }
                }
                else if (env.isEditMode()) {

                    let modalToolID = ModalToolID.grabMove;

                    if (key == 'r') {

                        modalToolID = ModalToolID.ratate;
                    }
                    else if (key == 's') {

                        modalToolID = ModalToolID.scale;
                    }

                    if (env.isCurrentLayerVectorLayer()) {

                        if (env.isEditMode()) {

                            this.startVectorLayerModalTool(modalToolID);
                        }
                        else {

                            this.currentTool.keydown(e, env);
                        }
                    }
                    else if (env.isCurrentLayerImageFileReferenceLayer()) {

                        this.startImageFileReferenceLayerModalTool(modalToolID);
                    }
                }
            }

            if (key == 'Enter') {

                this.currentTool.keydown(e, env);
            }

            if (key == '1') {

                let layerItem = this.findCurrentLayerLayerWindowItem();
                this.openLayerPropertyModal(layerItem.layer, layerItem);
            }

            if (key == '2') {

                let layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPalletColorModal(
                    OpenPalletColorModalMode.LineColor, this.toolContext.document, layerItem.layer);
            }

            if (key == '3') {

                let layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPalletColorModal(
                    OpenPalletColorModalMode.FillColor, this.toolContext.document, layerItem.layer);
            }

            if (key == '4') {

                this.openDocumentSettingModal();
            }

            if (key == '5') {

                this.openNewLayerCommandOptionModal();
            }

            if (key == '^') {

                this.openOperationOptionModal();
            }

            if (key == '\\') {

                this.openExportImageFileModal();
            }

            if (key == 'o') {

                if (env.isCtrlKeyPressing()) {

                    this.startReloadDocument();
                }
                else {

                    this.currentTool.keydown(e, env);
                }

                return;
            }
        }

        protected document_keyup(e: KeyboardEvent) {

            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;

            if (e.key == ' ') {

                if (this.activeCanvasWindow == this.mainWindow) {

                    this.mainWindow_MouseViewOperationEnd();
                }
                else if (this.activeCanvasWindow == this.layerWindow) {

                    this.layerWindow.endMouseDragging();
                }
                else if (this.activeCanvasWindow == this.subtoolWindow) {

                    this.subtoolWindow.endMouseDragging();
                }
            }
        }

        protected document_keydown_modalTool(key: string, e: KeyboardEvent) {

            var env = this.toolEnv;

            if (key == 'Escape') {

                this.cancelModalTool();
            }
            else {

                this.currentTool.keydown(e, env);
            }
        }

        protected document_keydown_timeLineWindow(key: string, e: KeyboardEvent): boolean {

            var env = this.toolEnv;
            let context = this.toolContext;
            let aniSetting = context.document.animationSettingData;

            if (key == 'i') {
                this.openNewKeyframeModal();
                return true;
            }

            if (key == 'Delete' || key == 'x') {
                this.openDeleteKeyframeModal();
                return true;
            }

            if (key == 'k' || key == 'l') {

                if (this.currentKeyframe != null) {

                    var add_FrameTime = 1;
                    if (key == 'k') {
                        add_FrameTime = -1;
                    }

                    var newFrame = this.currentKeyframe.frame + add_FrameTime;

                    if (newFrame < 0) {

                        newFrame = 0;
                    }

                    if (add_FrameTime > 0
                        && this.nextKeyframe != null
                        && newFrame >= this.nextKeyframe.frame) {

                        newFrame = this.nextKeyframe.frame - 1;
                    }

                    if (add_FrameTime < 0
                        && this.previousKeyframe != null
                        && newFrame <= this.previousKeyframe.frame) {

                        newFrame = this.previousKeyframe.frame + 1;
                    }

                    if (this.currentKeyframe.frame != newFrame) {

                        for (let viewKeyFrameLayer of this.currentKeyframe.layers) {

                            if (viewKeyFrameLayer.hasKeyframe()) {

                                viewKeyFrameLayer.vectorLayerKeyframe.frame = newFrame;
                            }
                        }

                        this.currentKeyframe.frame = newFrame;

                        env.setRedrawMainWindowEditorWindow();
                        env.setRedrawTimeLineWindow();
                    }
                }

                return true;
            }

            if (key == 'o' || key == 'p') {

                var add_FrameTime = 1;
                if (key == 'o') {
                    add_FrameTime = -1;
                }

                if (env.isShiftKeyPressing()) {

                    aniSetting.loopEndFrame += add_FrameTime;
                    if (aniSetting.loopEndFrame < 0) {
                        aniSetting.loopEndFrame = 0;
                    }
                }
                else if (env.isCtrlKeyPressing()) {

                    aniSetting.loopStartFrame += add_FrameTime;
                    if (aniSetting.loopStartFrame < 0) {
                        aniSetting.loopStartFrame = 0;
                    }
                }
                else {

                    aniSetting.maxFrame += add_FrameTime;
                    if (aniSetting.maxFrame < 0) {
                        aniSetting.maxFrame = 0;
                    }
                }

                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();

                return true;
            }

            return false;
        }

        protected htmlWindow_resize(e: Event) {

            this.isDeferredWindowResizeWaiting = true;
        }

        protected htmlWindow_contextmenu(e): boolean {

            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }

            return false;
        }
    }
}