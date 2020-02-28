
namespace ManualTracingTool {

    export class App_Event extends App_Document {

        isEventSetDone = false;

        // Backward interface definitions

        protected onWindowBlur() { // @virtual
        }

        protected onWindowFocus() { // @virtual
        }

        protected openDocumentSettingDialog() { // @virtual
        }

        protected setDefferedWindowResize() { // @virtual
        }

        protected onModalWindowClosed() { // @virtual
        }

        // Events

        protected setEvents() {

            if (this.isEventSetDone) {
                return;
            }

            this.isEventSetDone = true;

            this.setCanvasWindowMouseEvent(this.editorWindow, this.mainWindow
                , this.mainWindow_mousedown
                , this.mainWindow_mousemove
                , this.mainWindow_mouseup
                , this.mainWindow_mousewheel
                , false
            );

            this.setCanvasWindowMouseEvent(this.layerWindow, this.layerWindow
                , this.layerWindow_mousedown
                , this.layerWindow_mousemove
                , this.layerWindow_mouseup
                , null
                , false
            );

            //this.setCanvasWindowMouseEvent(this.subtoolWindow, this.subtoolWindow
            //    , this.subtoolWindow_mousedown
            //    , this.subtoolWindow_mousemove
            //    , this.subtoolWindow_mouseup
            //    , null
            //    , false
            //);

            this.setCanvasWindowMouseEvent(this.paletteSelectorWindow, this.paletteSelectorWindow
                , this.paletteSelectorWindow_mousedown
                , null
                , null
                , null
                , false
            );

            this.setCanvasWindowMouseEvent(this.timeLineWindow, this.timeLineWindow
                , this.timeLineWindow_mousedown
                , this.timeLineWindow_mousemove
                , this.timeLineWindow_mouseup
                , this.timeLineWindow_mousewheel
                , false
            );

            this.setCanvasWindowMouseEvent(this.paletteColorModal_colorCanvas, this.paletteColorModal_colorCanvas
                , this.onPaletteColorModal_ColorCanvas_mousedown
                , null
                , null
                , null
                , true
            );

            this.setCanvasWindowMouseEvent(this.colorMixerWindow_colorCanvas, this.colorMixerWindow_colorCanvas
                , this.colorMixerWindow_colorCanvas_mousedown
                , this.colorMixerWindow_colorCanvas_mousedown
                , null
                , null
                , true
            );

            document.addEventListener('keydown', (e: KeyboardEvent) => {

                if (this.isWhileLoading()) {
                    return;
                }

                if (this.isModalShown()) {
                    return;
                }

                if (document.activeElement.nodeName == 'INPUT') {
                    return;
                }

                this.document_keydown(e);
            });

            document.addEventListener('keyup', (e: KeyboardEvent) => {

                if (this.isModalShown()) {
                    return;
                }

                if (document.activeElement.nodeName == 'INPUT') {
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

            window.addEventListener('blur', (e: Event) => {

                this.onWindowBlur();
            });

            window.addEventListener('focus', (e: Event) => {

                this.onWindowFocus();
            });

            document.addEventListener('dragover', (e: DragEvent) => {

                e.stopPropagation();
                e.preventDefault();

                let available = false;
                if (e.dataTransfer.types.length > 0) {

                    for (let type of e.dataTransfer.types) {

                        if (type == 'Files') {

                            available = true;
                            break;
                        }
                    }
                }

                if (available) {

                    e.dataTransfer.dropEffect = 'move';
                }
                else {

                    e.dataTransfer.dropEffect = 'none';
                }
            });

            document.addEventListener('drop', (e: DragEvent) => {

                this.document_drop(e);
            });

            // Menu buttons

            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                let env = this.toolEnv;
                let context = this.toolContext;

                this.setCurrentEditMode(EditModeID.drawMode);
                this.setCurrentMainToolForCurentLayer();

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

                this.setCurrentEditMode(EditModeID.drawMode);
                this.setCurrentMainTool(MainToolID.misc);

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

            this.getElement(this.ID.menu_btnProperty).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openDocumentSettingDialog();
                e.preventDefault();
            });

            /*
            this.getElement(this.ID.menu_btnPalette1).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openPaletteColorModal(OpenPaletteColorModalMode.LineColor, this.toolContext.document, this.toolContext.currentLayer);
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnPalette2).addEventListener('mousedown', (e: Event) => {

                if (this.isEventDisabled()) {
                    return;
                }

                this.openPaletteColorModal(OpenPaletteColorModalMode.FillColor, this.toolContext.document, this.toolContext.currentLayer);
                e.preventDefault();
            });
            */

            // React conponents

            this.uiSubToolWindowRef.item_Click = (item: SubToolViewItem) => {

                this.subtoolWindow_Item_Click(item);
            }

            this.uiSubToolWindowRef.itemButton_Click = (item: SubToolViewItem) => {

                this.subtoolWindow_Button_Click(item);
            }

            // Modal window

            document.addEventListener('custombox:content:open', () => {

                this.onModalWindowShown();
            });

            document.addEventListener('custombox:content:close', () => {

                this.onModalWindowClosed();
            });

            this.setEvents_ModalCloseButton(this.ID.messageDialogModal_ok);

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

            // Color mixer window
            this.setColorMixerRGBElementEvent(this.ID.colorMixer_red, 0);
            this.setColorMixerRGBElementEvent(this.ID.colorMixer_green, 1);
            this.setColorMixerRGBElementEvent(this.ID.colorMixer_blue, 2);
            this.setColorMixerRGBElementEvent(this.ID.colorMixer_alpha, 3);

            this.setColorMixerHSVElementEvent(this.ID.colorMixer_hue);
            this.setColorMixerHSVElementEvent(this.ID.colorMixer_sat);
            this.setColorMixerHSVElementEvent(this.ID.colorMixer_val);

            // Palette modal

            this.getElement(this.ID.paletteColorModal_currentColor).addEventListener('change', (e: Event) => {

                this.onPaletteColorModal_CurrentColorChanged();
            });

            this.getElement(this.ID.paletteColorModal_currentAlpha).addEventListener('change', (e: Event) => {

                this.onPaletteColorModal_CurrentColorChanged();
            });

            for (let paletteColorIndex = 0; paletteColorIndex < DocumentData.maxPaletteColors; paletteColorIndex++) {

                {
                    let id = this.ID.paletteColorModal_colorValue + paletteColorIndex;
                    let colorButton = <HTMLInputElement>this.getElement(id);

                    colorButton.addEventListener('change', (e: Event) => {

                        this.onPaletteColorModal_ColorChanged(paletteColorIndex);
                    });
                }

                {
                    let id = this.ID.paletteColorModal_colorIndex + paletteColorIndex;
                    let radioButton = <HTMLInputElement>this.getElement(id);

                    radioButton.addEventListener('click', (e: Event) => {

                        this.onPaletteColorModal_ColorIndexChanged();
                    });
                }
            }
        }

        protected setCanvasWindowMouseEvent(eventCanvasWindow: CanvasWindow, drawCanvasWindew: ToolBaseWindow, mousedown: Function, mousemove: Function, mouseup: Function, mousewheel: Function, isModal: boolean) {

            if (mousedown != null) {

                eventCanvasWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, false, drawCanvasWindew);
                    mousedown.call(this);
                    e.preventDefault();
                });
            }

            if (mousemove != null) {

                eventCanvasWindow.canvas.addEventListener('mousemove', (e: MouseEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, false, drawCanvasWindew);
                    mousemove.call(this);
                    e.preventDefault();
                });
            }

            if (mouseup != null) {

                eventCanvasWindow.canvas.addEventListener('mouseup', (e: MouseEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, true, drawCanvasWindew);
                    mouseup.call(this);
                    e.preventDefault();
                });
            }

            if (mousedown != null) {

                eventCanvasWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.getTouchInfo(drawCanvasWindew.toolMouseEvent, e, true, false, drawCanvasWindew);
                    mousedown.call(this);
                    e.preventDefault();
                });
            }

            if (mousemove != null) {

                eventCanvasWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.getTouchInfo(drawCanvasWindew.toolMouseEvent, e, false, false, drawCanvasWindew);
                    mousemove.call(this);
                    e.preventDefault();
                });
            }

            if (mouseup != null) {

                eventCanvasWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.getTouchInfo(drawCanvasWindew.toolMouseEvent, e, false, true, drawCanvasWindew);
                    mouseup.call(this);
                    e.preventDefault();
                });
            }

            if (mousewheel != null) {

                eventCanvasWindow.canvas.addEventListener('mousewheel', (e: MouseEvent) => {

                    if (this.isEventDisabled() && !isModal) {
                        return;
                    }

                    this.getWheelInfo(drawCanvasWindew.toolMouseEvent, e);
                    this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, false, drawCanvasWindew);

                    mousewheel.call(this);
                    e.preventDefault();
                });
            }
        }

        protected setEvents_ModalCloseButton(id: string) {

            this.getElement(id).addEventListener('click', (e: Event) => {

                this.currentModalDialogResult = id;

                this.closeModal();

                e.preventDefault();
            });
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

            if (this.activeCanvasWindow == this.timeLineWindow) {

                if (this.document_keydown_timeLineWindow(key, e)) {

                    return;
                }
            }

            if (key == '.' && env.needsDrawOperatorCursor()) {

                this.setOperatorCursorLocationToMouse();
            }

            if (this.isModalToolRunning()) {

                this.document_keydown_modalTool(key, e);

                return;
            }
            else if (env.isEditMode()) {

                if (this.currentTool.keydown(e, env)) {
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

                env.setRedrawLayerWindow();
                env.setRedrawSubtoolWindow();

                return;
            }

            if (key == 'n' && env.isCtrlKeyPressing()) {

                this.resetDocument();

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

                this.activateCurrentTool();

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (key == 'y') {

                this.toolContext.commandHistory.redo(env);

                this.activateCurrentTool();

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (key == 'Delete' || key == 'x') {

                if (env.isEditMode()) {

                    if (this.toolContext.currentVectorLayer != null
                        && this.toolContext.currentVectorGeometry != null
                        && this.toolContext.currentVectorGroup != null) {

                        let withCut = (key == 'x' && env.isCtrlKeyPressing());

                        let command = new Command_DeleteSelectedPoints();
                        if (command.prepareEditTargets(env)) {

                            if (withCut) {

                                let command = new Command_CopyGeometry();
                                if (command.prepareEditData(env)) {

                                    command.executeCommand(env);
                                }
                            }

                            command.executeCommand(env);
                            this.toolContext.commandHistory.addCommand(command);

                            env.setRedrawMainWindow();
                        }
                    }
                }

                return;
            }

            if (env.isCtrlKeyPressing() && key == 'c') {

                if (env.isEditMode()) {

                    if (this.toolContext.currentVectorGroup != null) {

                        let command = new Command_CopyGeometry();
                        if (command.prepareEditData(env)) {

                            command.executeCommand(env);
                        }
                    }
                }

                return;
            }

            if (env.isCtrlKeyPressing() && key == 'v') {

                if (this.toolContext.currentVectorGroup != null) {

                    let command = new Command_PasteGeometry();
                    if (command.prepareEditData(env)) {

                        this.tool_SelectAllPoints.executeClearSelectAll(env);

                        command.executeCommand(env);
                        this.toolContext.commandHistory.addCommand(command);
                    }

                    env.setRedrawCurrentLayer();
                }

                return;
            }

            if (key == 'Home' || key == 'q') {

                if (env.isShiftKeyPressing()) {

                    this.mainWindow.viewLocation[0] = 0.0;
                    this.mainWindow.viewLocation[1] = 0.0;
                    vec3.copy(this.homeViewLocation, this.mainWindow.viewLocation);
                    this.mainWindow.viewScale = context.document.defaultViewScale;
                    this.mainWindow.viewRotation = 0.0;
                    this.mainWindow.mirrorX = false;
                    this.mainWindow.mirrorY = false;
                    this.isViewLocationMoved = false;
                }
                else if (this.isViewLocationMoved) {

                    vec3.copy(this.mainWindow.viewLocation, this.homeViewLocation);
                    this.mainWindow.viewScale = context.document.defaultViewScale;
                    this.mainWindow.viewRotation = 0.0;
                    this.isViewLocationMoved = false;
                }
                else {

                    vec3.copy(this.mainWindow.viewLocation, this.lastViewLocation);
                    this.mainWindow.viewScale = this.lastViewScale;
                    this.mainWindow.viewRotation = this.lastViewRotation;
                    this.isViewLocationMoved = true;
                }

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (key == 't' || key == 'r') {

                if (env.isDrawMode()) {

                    let rot = 10.0;
                    if (key == 't') {
                        rot = -rot;
                    }
                    if (this.mainWindow.mirrorX) {
                        rot = -rot;
                    }

                    this.mainWindow.viewRotation += rot;
                    this.setViewRotation(this.mainWindow.viewRotation);
                    return;
                }
            }

            if (key == 'm') {

                this.mainWindow.mirrorX = !this.mainWindow.mirrorX;
                env.setRedrawMainWindowEditorWindow();
                return;
            }

            if (key == 'f' || key == 'd') {

                let addScale = 1.0 + this.drawStyle.viewZoomAdjustingSpeedRate;
                if (key == 'd') {
                    addScale = 1 / addScale;
                }

                this.addViewScale(addScale);

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

            if (!env.isCtrlKeyPressing() && (key == 'c' || key == 'v')) {

                let addFrame = 1;
                if (key == 'c') {
                    addFrame = -addFrame;
                }

                let frame = this.findNextViewKeyframeFrame(context.document.animationSettingData.currentTimeFrame, addFrame);

                this.setCurrentFrame(frame);

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
                //else if (this.activeCanvasWindow == this.subtoolWindow) {

                //    this.subtoolWindow.startMouseDragging();
                //}

                return;
            }

            if (key == 'a') {

                if (env.isEditMode()) {

                    this.tool_SelectAllPoints.executeToggleSelection(env);
                    this.activateCurrentTool();
                }
                else {

                    this.selectNextOrPreviousLayer(false);
                    this.startShowingCurrentLayer();
                    env.setRedrawLayerWindow();
                    env.setRedrawSubtoolWindow();
                }

                return;
            }

            if (key == 'h') {

                if (env.isEditMode()) {

                }
                else {


                    this.setCurrentMainTool(MainToolID.drawLine);
                    this.setCurrentSubTool(<int>DrawLineToolSubToolID.extrudeLine);
                    this.currentTool.keydown(e, env);
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawSubtoolWindow();
                }

                return;
            }

            if (key == 'w') {

                let pickedLayer: Layer = null;
                for (let pickingPosition of this.layerPickingPositions) {

                    let pickX = this.mainWindow.toolMouseEvent.offsetX + pickingPosition[0];
                    let pickY = this.mainWindow.toolMouseEvent.offsetY + pickingPosition[1];

                    pickedLayer = this.pickLayer(this.mainWindow, this.currentViewKeyframe, pickX, pickY);

                    if (pickedLayer != null) {
                        break;
                    }
                }

                if (pickedLayer != null) {

                    this.setCurrentLayer(pickedLayer);
                    env.setRedrawLayerWindow();
                    env.setRedrawSubtoolWindow();
                    this.startShowingCurrentLayer();
                }
                else {

                    env.setRedrawMainWindowEditorWindow();
                }

                return;
            }

            if (key == 'l') {
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

            if (key == 'g' || key == 'r' || key == 's') {

                if (key == 's' && env.isCtrlKeyPressing()) {

                    this.saveDocument();
                    return;
                }

                if (env.isDrawMode()) {

                    if (this.currentTool.keydown(e, env)) {

                        // Switch to scratch line tool
                    }
                    else if (key == 'g') {

                        this.setCurrentMainTool(MainToolID.drawLine);
                        this.setCurrentSubTool(<int>DrawLineToolSubToolID.scratchLine);
                        this.currentTool.keydown(e, env);
                        env.setRedrawMainWindowEditorWindow();
                        env.setRedrawSubtoolWindow();
                    }
                    else if (key == 's') {

                        this.selectNextOrPreviousLayer(true);
                        this.startShowingCurrentLayer();
                        env.setRedrawLayerWindow();
                        env.setRedrawSubtoolWindow();
                    }

                    return;
                }

                if (env.isEditMode()) {

                    let modalToolID = ModalToolID.grabMove;

                    if (key == 'r') {

                        modalToolID = ModalToolID.rotate;
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

                    return;
                }
            }

            if (key == 'Enter') {

                this.currentTool.keydown(e, env);
            }

            if (key == '1') {

                let layerItem = this.layerWindow_FindCurrentItem();
                this.openLayerPropertyModal(layerItem.layer, layerItem);
            }

            /*
            if (key == '2') {

                let layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPaletteColorModal(
                    OpenPaletteColorModalMode.LineColor, this.toolContext.document, layerItem.layer);
            }

            if (key == '3') {

                let layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPaletteColorModal(
                    OpenPaletteColorModalMode.FillColor, this.toolContext.document, layerItem.layer);
            }
            */

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

            if (key == '-') {

                context.drawCPUOnly = !this.toolContext.drawCPUOnly;
                env.setRedrawMainWindow();
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
                //else if (this.activeCanvasWindow == this.subtoolWindow) {

                //    this.subtoolWindow.endMouseDragging();
                //}
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

                if (this.currentViewKeyframe != null) {

                    var add_FrameTime = 1;
                    if (key == 'k') {
                        add_FrameTime = -1;
                    }

                    var newFrame = this.currentViewKeyframe.frame + add_FrameTime;

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

                    if (this.currentViewKeyframe.frame != newFrame) {

                        for (let viewKeyFrameLayer of this.currentViewKeyframe.layers) {

                            if (viewKeyFrameLayer.hasKeyframe()) {

                                viewKeyFrameLayer.vectorLayerKeyframe.frame = newFrame;
                            }
                        }

                        this.currentViewKeyframe.frame = newFrame;

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

        protected document_drop(e: DragEvent) {

            e.preventDefault();

            // Check file exists
            if (e.dataTransfer.files.length == 0) {

                console.log('error: no dropped files.');
                return;
            }

            // Get file path or name
            let file = e.dataTransfer.files[0];

            let filePath = '';
            if ('path' in file) {
                filePath = file['path'];
            }
            else {
                filePath = file.name;
            }

            if (StringIsNullOrEmpty(filePath)) {

                console.log('error: cannot get file path.');
                return;
            }

            // Start loading document
            this.startReloadDocumentFromFile(file, filePath);
        }

        protected htmlWindow_resize(e: Event) {

            this.setDefferedWindowResize();
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

        protected mainWindow_mousedown() {

            let context = this.toolContext;
            let wnd = this.mainWindow;
            let env = this.toolEnv;
            let e = wnd.toolMouseEvent;

            env.updateContext();

            // Execute current tool
            if (this.isModalToolRunning()) {

                if (this.currentTool.isAvailable(env)) {

                    this.currentTool.mouseDown(e, this.toolEnv);
                }
            }
            else {

                if (this.currentTool.isAvailable(env)) {

                    this.currentTool.mouseDown(e, this.toolEnv);
                }
            }

            // View operation
            if (e.isRightButtonPressing() && this.toolEnv.isShiftKeyPressing()) {

                this.setOperatorCursorLocationToMouse();
            }
            else if (e.isRightButtonPressing() || e.isCenterButtonPressing()) {

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
            let env = this.toolEnv;
            let e = wnd.toolMouseEvent;

            this.toolEnv.updateContext();

            // Execute current tool
            if (this.isModalToolRunning()) {

                if (!e.isMouseDragging) {

                    if (this.currentTool.isAvailable(env)) {

                        this.currentTool.mouseMove(e, env);
                    }
                }
            }
            else if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseMove(e, this.toolEnv);
            }
            else if (this.toolEnv.isEditMode()) {

                let isHitChanged = this.mousemoveHittest(e.location, this.toolEnv.mouseCursorViewRadius);
                if (isHitChanged) {
                    this.toolEnv.setRedrawCurrentLayer();
                }

                this.currentTool.mouseMove(e, this.toolEnv);
            }

            // View operation
            if (e.isMouseDragging) {

                vec3.set(this.tempVec3, e.offsetX, e.offsetY, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, wnd.dragBeforeTransformMatrix);

                vec3.subtract(e.mouseMovedVector, e.mouseDownLocation, this.tempVec3);

                vec3.add(this.mainWindow.viewLocation, wnd.dragBeforeViewLocation, e.mouseMovedVector);

                if (!this.isViewLocationMoved) {

                    vec3.copy(this.homeViewLocation, this.mainWindow.viewLocation);
                }
                else {

                    vec3.copy(this.lastViewLocation, this.mainWindow.viewLocation);
                }

                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        }

        protected mousemoveHittest(location: Vec3, minDistance: float): boolean {

            if (this.toolEnv.currentVectorGeometry == null) {

                return false;
            }

            this.hittest_Line_IsCloseTo.startProcess();

            this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorGeometry, location, minDistance);

            this.hittest_Line_IsCloseTo.endProcess();

            return this.hittest_Line_IsCloseTo.isChanged;
        }

        protected mainWindow_mouseup() {

            let context = this.toolContext;
            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            this.toolEnv.updateContext();
                
            this.currentTool.mouseUp(e, this.toolEnv);

            this.mainWindow_MouseViewOperationEnd();
        }

        protected mainWindow_mousewheel() {

            let wnd = this.mainWindow;
            let e = wnd.toolMouseEvent;

            // View operation
            if (e.wheelDelta != 0.0
                && !e.isMouseDragging) {

                let addScale = 1.0 + this.drawStyle.viewZoomAdjustingSpeedRate * 0.5;
                if (e.wheelDelta < 0.0) {
                    addScale = 1.0 / addScale;
                }

                this.addViewScale(addScale);
            }

            this.calculateTransfomredMouseParams(e, wnd);
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
                    this.layerWindow_mousedown_LayerCommandButton(clickedX, clickedY, doubleClicked);
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

        protected layerWindow_mousedown_LayerCommandButton(clickedX: float, clickedY: float, doubleClicked: boolean) {

            let wnd = this.layerWindow;

            let hitedButton = this.hitTestLayout(wnd.layerWindowCommandButtons, clickedX, clickedY);

            if (hitedButton != null) {

                // Select command
                let layerCommand: Command_Layer_CommandBase = null;

                if (hitedButton.index == <int>LayerWindowButtonID.addLayer) {

                    this.openNewLayerCommandOptionModal();
                }
                else if (hitedButton.index == <int>LayerWindowButtonID.deleteLayer) {

                    layerCommand = new Command_Layer_Delete();
                }
                else if (hitedButton.index == <int>LayerWindowButtonID.moveUp) {

                    layerCommand = new Command_Layer_MoveUp();
                }
                else if (hitedButton.index == <int>LayerWindowButtonID.moveDown) {

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

            let wnd = this.layerWindow;

            if (wnd.layerWindowItems.length == 0) {
                return;
            }

            let firstItem = wnd.layerWindowItems[0];
            let selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());

            if (selectedIndex >= 0 && selectedIndex < wnd.layerWindowItems.length) {

                let selectedItem = wnd.layerWindowItems[selectedIndex];
                let selectedLayer = selectedItem.layer;

                if (clickedX <= selectedItem.textLeft) {

                    this.setLayerVisiblity(selectedItem.layer, !selectedItem.layer.isVisible);
                    Layer.updateHierarchicalStatesRecursive(this.toolEnv.document.rootLayer);
                    this.activateCurrentTool();

                    this.toolEnv.setRedrawMainWindowEditorWindow();
                }
                else {

                    if (doubleClicked) {

                        // Layer property

                        this.openLayerPropertyModal(selectedLayer, selectedItem);
                    }
                    else {

                        // Select layer content

                        if (this.toolEnv.isShiftKeyPressing()) {

                            this.setLayerSelection(selectedLayer, !selectedLayer.isSelected);
                            this.activateCurrentTool();
                            this.startShowingLayerItem(selectedItem);
                        }
                        else {

                            this.setCurrentLayer(selectedLayer);
                            this.startShowingCurrentLayer();
                        }

                        Layer.updateHierarchicalStatesRecursive(selectedLayer);

                        this.toolEnv.setRedrawMainWindowEditorWindow();
                    }
                }
            }

            this.toolEnv.setRedrawLayerWindow();
            this.toolEnv.setRedrawSubtoolWindow();
        }

        //protected subtoolWindow_mousedown() {

        //    let context = this.toolContext;
        //    let wnd = this.subtoolWindow;
        //    let e = wnd.toolMouseEvent;
        //    let env = this.toolEnv;
        //    let doubleClicked = wnd.toolMouseEvent.hundleDoubleClick(e.offsetX, e.offsetY);

        //    if (context.mainToolID == MainToolID.none || this.subToolViewItems.length == 0) {

        //        return;
        //    }

        //    env.updateContext();

        //    let clickedX = e.location[0];
        //    let clickedY = e.location[1];

        //    if (e.isLeftButtonPressing()) {

        //        let firstItem = this.subToolViewItems[0];
        //        let subToolIndex = Math.floor((clickedY - firstItem.top) / (firstItem.getHeight()));

        //        if (subToolIndex < 0 || subToolIndex >= this.subToolViewItems.length) {

        //            return;
        //        }

        //        let viewItem = this.subToolViewItems[subToolIndex];
        //        let tool = viewItem.tool;

        //        if (tool.isAvailable(env)) {

        //            // Change current sub tool
        //            this.setCurrentSubTool(subToolIndex);

        //            this.updateFooterMessage();
        //            env.setRedrawMainWindowEditorWindow();

        //            // Option button click
        //            let button = this.hitTestLayout(viewItem.buttons, clickedX, clickedY);
        //            if (button != null) {

        //                let inpuSideID = tool.getInputSideID(button.index, env);

        //                if (tool.setInputSide(button.index, inpuSideID, env)) {

        //                    env.setRedrawMainWindowEditorWindow();
        //                    env.setRedrawSubtoolWindow();
        //                }
        //            }

        //            // Tool event
        //            if (button == null && this.currentTool != null) {

        //                if (doubleClicked) {

        //                    this.currentTool.toolWindowItemDoubleClick(e, env);
        //                }
        //                else if (e.isLeftButtonPressing()) {

        //                    this.activateCurrentTool();
        //                    this.currentTool.toolWindowItemClick(e, env);
        //                }
        //            }
        //        }
        //    }
        //    else if (e.isCenterButtonPressing() || e.isRightButtonPressing()) {

        //        wnd.startMouseDragging();
        //    }
        //}

        //protected subtoolWindow_mousemove() {

        //    let wnd = this.subtoolWindow;
        //    let e = wnd.toolMouseEvent;

        //    // View operation
        //    if (e.isMouseDragging) {

        //        vec3.add(wnd.viewLocation, wnd.dragBeforeViewLocation, e.mouseMovedOffset);
        //        wnd.viewLocation[0] = 0.0;

        //        if (wnd.viewLocation[1] < 0.0) {
        //            wnd.viewLocation[1] = 0.0;
        //        }

        //        if (wnd.viewLocation[1] > wnd.subToolItemsBottom - wnd.subToolItemUnitHeight) {
        //            wnd.viewLocation[1] = wnd.subToolItemsBottom - wnd.subToolItemUnitHeight;
        //        }

        //        this.toolEnv.setRedrawSubtoolWindow();
        //    }
        //}

        //protected subtoolWindow_mouseup() {

        //    this.subtoolWindow.endMouseDragging();
        //}

        protected subtoolWindow_Item_Click(item: SubToolViewItem) {

            this.subtoolWindow_selectItem(item);
        }

        protected subtoolWindow_Button_Click(item: SubToolViewItem) {

            let tool = item.tool;
            let env = this.toolEnv;

            if (!tool.isAvailable(env)) {
                return;
            }

            let buttonIndex = 0; // TODO: 複数ボタンが必要か検討
            let inpuSideID = tool.getInputSideID(buttonIndex, env);

            if (tool.setInputSide(buttonIndex, inpuSideID, env)) {

                item.buttonStateID = tool.getInputSideID(buttonIndex, env);

                env.setRedrawMainWindowEditorWindow();
                env.setRedrawSubtoolWindow();

                this.updateUISubToolWindow();
            }
        }

        protected subtoolWindow_selectItem(item: SubToolViewItem) {

            let tool = item.tool;
            let env = this.toolEnv;

            if (!tool.isAvailable(env)) {
                return;
            }

            // Change current sub tool
            this.setCurrentSubTool(item.subToolIndex);

            env.setRedrawMainWindowEditorWindow();

            // Tool event
            this.activateCurrentTool();
            this.currentTool.toolWindowItemClick(env);
        }

        protected paletteSelectorWindow_mousedown() {

            let context = this.toolContext;
            let wnd = this.paletteSelectorWindow;
            let e = wnd.toolMouseEvent;
            let env = this.toolEnv;
            let documentData = context.document;

            if (e.isLeftButtonPressing()) {

                if (env.currentVectorLayer != null) {

                    let button_LayoutArea = this.hitTestLayout(wnd.commandButtonAreas, e.location[0], e.location[1]);

                    if (button_LayoutArea != null) {

                        wnd.currentTargetID = button_LayoutArea.index;

                        env.setRedrawColorSelectorWindow();
                        env.setRedrawColorMixerWindow();
                    }

                    let palette_LayoutArea = this.hitTestLayout(wnd.itemAreas, e.location[0], e.location[1]);

                    if (palette_LayoutArea != null) {

                        let paletteColorIndex = palette_LayoutArea.index;
                        let color = documentData.paletteColors[paletteColorIndex];

                        let destColor = this.getPaletteSelectorWindow_SelectedColor();
                        vec4.copy(destColor, color.color);

                        if (wnd.currentTargetID == PaletteSelectorWindowButtonID.lineColor) {

                            env.currentVectorLayer.line_PaletteColorIndex = paletteColorIndex;
                        }
                        else if (wnd.currentTargetID == PaletteSelectorWindowButtonID.fillColor) {

                            env.currentVectorLayer.fill_PaletteColorIndex = paletteColorIndex;
                        }

                        env.setRedrawLayerWindow();
                        env.setRedrawMainWindowEditorWindow();
                    }
                }
            }
        }

        protected setColorMixerRGBElementEvent(id: string, elementID: int) {

            this.getElement(id + this.ID.colorMixer_id_number).addEventListener('change', (e: Event) => {

                let numberValue = this.getInputElementNumber(id + this.ID.colorMixer_id_number, 0.0);

                let color = this.getPaletteSelectorWindow_CurrentColor();

                if (color != null) {

                    color[elementID] = numberValue;
                }

                this.toolEnv.setRedrawMainWindow();
                this.toolEnv.setRedrawColorSelectorWindow();
                this.toolEnv.setRedrawColorMixerWindow();
            });

            this.getElement(id + this.ID.colorMixer_id_range).addEventListener('change', (e: Event) => {

                let rangeValue = this.getInputElementRangeValue(id + this.ID.colorMixer_id_range, 0.0, 1.0);

                let color = this.getPaletteSelectorWindow_CurrentColor();

                if (color != null) {

                    color[elementID] = rangeValue;
                }

                this.toolEnv.setRedrawMainWindow();
                this.toolEnv.setRedrawColorSelectorWindow();
                this.toolEnv.setRedrawColorMixerWindow();
            });
        }

        protected setColorMixerHSVElementEvent(id: string) {

            this.getElement(id + this.ID.colorMixer_id_number).addEventListener('change', (e: Event) => {

                let hueValue = this.getInputElementNumber(this.ID.colorMixer_hue + this.ID.colorMixer_id_number, 0.0);
                let satValue = this.getInputElementNumber(this.ID.colorMixer_sat + this.ID.colorMixer_id_number, 0.0);
                let valValue = this.getInputElementNumber(this.ID.colorMixer_val + this.ID.colorMixer_id_number, 0.0);

                let color = this.getPaletteSelectorWindow_CurrentColor();

                if (color != null) {

                    ColorLogic.hsvToRGB(color, hueValue, satValue, valValue);

                    this.toolEnv.setRedrawMainWindow();
                    this.toolEnv.setRedrawColorSelectorWindow();
                    this.toolEnv.setRedrawColorMixerWindow();
                }
            });

            this.getElement(id + this.ID.colorMixer_id_range).addEventListener('change', (e: Event) => {

                let hueValue = this.getInputElementRangeValue(this.ID.colorMixer_hue + this.ID.colorMixer_id_range, 0.0, 1.0);
                let satValue = this.getInputElementRangeValue(this.ID.colorMixer_sat + this.ID.colorMixer_id_range, 0.0, 1.0);
                let valValue = this.getInputElementRangeValue(this.ID.colorMixer_val + this.ID.colorMixer_id_range, 0.0, 1.0);

                let color = this.getPaletteSelectorWindow_CurrentColor();

                if (color != null) {

                    ColorLogic.hsvToRGB(color, hueValue, satValue, valValue);

                    this.toolEnv.setRedrawMainWindow();
                    this.toolEnv.setRedrawColorSelectorWindow();
                    this.toolEnv.setRedrawColorMixerWindow();
                }
            });
        }

        protected colorMixerWindow_colorCanvas_mousedown() {

            let wnd = this.colorMixerWindow_colorCanvas;
            let e = wnd.toolMouseEvent;

            if (!e.isLeftButtonPressing()) {
                return;
            }

            let context = this.toolContext;
            let env = this.toolEnv;

            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);

            let color = this.getPaletteSelectorWindow_CurrentColor();

            if (color != null) {

                color[0] = this.tempColor4[0];
                color[1] = this.tempColor4[1];
                color[2] = this.tempColor4[2];

                this.toolEnv.setRedrawMainWindow();
                this.toolEnv.setRedrawColorSelectorWindow();
                this.toolEnv.setRedrawColorMixerWindow();
            }
        }

        protected timeLineWindow_mousedown() {

            let wnd = this.timeLineWindow;
            let e = wnd.toolMouseEvent;

            let context = this.toolContext;
            let env = this.toolEnv;
            let aniSetting = context.document.animationSettingData;

            let left = wnd.getTimeLineLeft();

            if (e.offsetX < left) {

                this.timeLineWindow_OnPlayPauseButton();
            }
            else {

                this.timeLineWindow_ProcessFrameInput();
            }
        }

        protected timeLineWindow_OnPlayPauseButton() {

            let wnd = this.timeLineWindow;
            let e = wnd.toolMouseEvent;

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

        protected timeLineWindow_ProcessFrameInput() {

            let wnd = this.timeLineWindow;
            let e = wnd.toolMouseEvent;

            let context = this.toolContext;
            let env = this.toolEnv;
            let aniSetting = context.document.animationSettingData;

            let clickedFrame = wnd.getFrameByLocation(e.offsetX, aniSetting);

            if (clickedFrame != -1) {

                this.setCurrentFrame(clickedFrame);
                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();
            }
        }

        protected timeLineWindow_mousemove() {

            let wnd = this.timeLineWindow;
            let e = wnd.toolMouseEvent;

            let context = this.toolContext;
            let env = this.toolEnv;

            if (e.isLeftButtonPressing()) {

                this.timeLineWindow_ProcessFrameInput();
            }
        }

        protected timeLineWindow_mouseup() {

            let wnd = this.timeLineWindow;
            let e = wnd.toolMouseEvent;

            let context = this.toolContext;
            let env = this.toolEnv;

            wnd.endMouseDragging();
        }

        protected timeLineWindow_mousewheel() {

            let wnd = this.timeLineWindow;
            let e = wnd.toolMouseEvent;

            let context = this.toolContext;
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

        protected onPaletteColorModal_ColorIndexChanged() {

            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.paletteColorWindow_EditLayer;

            let paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);;

            if (this.paletteColorWindow_Mode == OpenPaletteColorModalMode.LineColor) {

                vectorLayer.line_PaletteColorIndex = paletteColorIndex;
            }
            else {

                vectorLayer.fill_PaletteColorIndex = paletteColorIndex;
            }

            //let paletteColor = documentData.paletteColos[paletteColorIndex];
            //this.setInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
            //this.setInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, paletteColor.color[3], 0.0, 1.0);

            this.displayPaletteColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPaletteColorModal_CurrentColorChanged() {

            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.paletteColorWindow_EditLayer;
            let paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);
            let paletteColor = documentData.paletteColors[paletteColorIndex];

            this.getInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
            paletteColor.color[3] = this.getInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, 0.0, 1.0);

            this.displayPaletteColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPaletteColorModal_ColorChanged(paletteColorIndex: int) {

            if (this.paletteColorWindow_EditLayer == null) {

                return;
            }

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.paletteColorWindow_EditLayer;
            let paletteColor = documentData.paletteColors[paletteColorIndex];

            this.getInputElementColor(this.ID.paletteColorModal_colorValue + paletteColorIndex, paletteColor.color);

            this.displayPaletteColorModalColors(documentData, vectorLayer);

            this.toolEnv.setRedrawMainWindow();
        }

        protected onPaletteColorModal_ColorCanvas_mousedown() {

            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }

            let context = this.toolContext;
            let wnd = this.paletteColorModal_colorCanvas;
            let e = wnd.toolMouseEvent;
            let env = this.toolEnv;

            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);

            let documentData = this.currentModalDialog_DocumentData;
            let vectorLayer = this.paletteColorWindow_EditLayer;
            let paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);
            let paletteColor = documentData.paletteColors[paletteColorIndex];

            paletteColor.color[0] = this.tempColor4[0];
            paletteColor.color[1] = this.tempColor4[1];
            paletteColor.color[2] = this.tempColor4[2];

            this.setColorPaletteElementValue(paletteColorIndex, paletteColor.color);

            this.setInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);

            this.toolEnv.setRedrawMainWindow();
        }

        protected setOperatorCursorLocationToMouse() {

            vec3.copy(this.toolContext.operatorCursor.location, this.mainWindow.toolMouseEvent.location);
            this.toolEnv.setRedrawEditorWindow();
        }
    }
}
