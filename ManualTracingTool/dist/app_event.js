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
    var App_Event = /** @class */ (function (_super) {
        __extends(App_Event, _super);
        function App_Event() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.isEventSetDone = false;
            return _this;
        }
        // Backward interface definitions
        App_Event.prototype.onWindowBlur = function () {
        };
        App_Event.prototype.onWindowFocus = function () {
        };
        App_Event.prototype.openDocumentSettingDialog = function () {
        };
        App_Event.prototype.setDefferedWindowResize = function () {
        };
        App_Event.prototype.onModalWindowClosed = function () {
        };
        // Events
        App_Event.prototype.setEvents = function () {
            var _this = this;
            if (this.isEventSetDone) {
                return;
            }
            this.isEventSetDone = true;
            this.setCanvasWindowMouseEvent(this.editorWindow, this.mainWindow, this.mainWindow_mousedown, this.mainWindow_mousemove, this.mainWindow_mouseup, this.mainWindow_mousewheel, false);
            this.setCanvasWindowMouseEvent(this.layerWindow, this.layerWindow, this.layerWindow_mousedown, this.layerWindow_mousemove, this.layerWindow_mouseup, null, false);
            //this.setCanvasWindowMouseEvent(this.subtoolWindow, this.subtoolWindow
            //    , this.subtoolWindow_mousedown
            //    , this.subtoolWindow_mousemove
            //    , this.subtoolWindow_mouseup
            //    , null
            //    , false
            //);
            this.setCanvasWindowMouseEvent(this.paletteSelectorWindow, this.paletteSelectorWindow, this.paletteSelectorWindow_mousedown, null, null, null, false);
            this.setCanvasWindowMouseEvent(this.timeLineWindow, this.timeLineWindow, this.timeLineWindow_mousedown, this.timeLineWindow_mousemove, this.timeLineWindow_mouseup, this.timeLineWindow_mousewheel, false);
            this.setCanvasWindowMouseEvent(this.paletteColorModal_colorCanvas, this.paletteColorModal_colorCanvas, this.onPaletteColorModal_ColorCanvas_mousedown, null, null, null, true);
            this.setCanvasWindowMouseEvent(this.colorMixerWindow_colorCanvas, this.colorMixerWindow_colorCanvas, this.colorMixerWindow_colorCanvas_mousedown, this.colorMixerWindow_colorCanvas_mousedown, null, null, true);
            document.addEventListener('keydown', function (e) {
                if (_this.isWhileLoading()) {
                    return;
                }
                if (_this.isModalShown()) {
                    return;
                }
                if (document.activeElement.nodeName == 'INPUT') {
                    return;
                }
                _this.document_keydown(e);
            });
            document.addEventListener('keyup', function (e) {
                if (_this.isModalShown()) {
                    return;
                }
                if (document.activeElement.nodeName == 'INPUT') {
                    return;
                }
                _this.document_keyup(e);
            });
            window.addEventListener('resize', function (e) {
                _this.htmlWindow_resize(e);
            });
            window.addEventListener('contextmenu', function (e) {
                return _this.htmlWindow_contextmenu(e);
            });
            window.addEventListener('blur', function (e) {
                _this.onWindowBlur();
            });
            window.addEventListener('focus', function (e) {
                _this.onWindowFocus();
            });
            document.addEventListener('dragover', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var available = false;
                if (e.dataTransfer.types.length > 0) {
                    for (var _i = 0, _a = e.dataTransfer.types; _i < _a.length; _i++) {
                        var type = _a[_i];
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
            document.addEventListener('drop', function (e) {
                _this.document_drop(e);
            });
            // Menu buttons
            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                var env = _this.toolEnv;
                var context = _this.toolContext;
                _this.setCurrentEditMode(ManualTracingTool.EditModeID.drawMode);
                _this.setCurrentMainToolForCurentLayer();
                _this.toolEnv.setRedrawMainWindowEditorWindow();
                _this.toolEnv.setRedrawLayerWindow();
                _this.toolEnv.setRedrawSubtoolWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnEditTool).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                var env = _this.toolEnv;
                var context = _this.toolContext;
                if (env.isDrawMode()) {
                    _this.setCurrentEditMode(ManualTracingTool.EditModeID.editMode);
                }
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnMiscTool).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.setCurrentEditMode(ManualTracingTool.EditModeID.drawMode);
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.misc);
                _this.toolEnv.setRedrawMainWindowEditorWindow();
                _this.toolEnv.setRedrawLayerWindow();
                _this.toolEnv.setRedrawSubtoolWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnOperationOption).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openOperationOptionModal();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnOpen).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.startReloadDocument();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnSave).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.saveDocument();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnExport).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openExportImageFileModal();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnProperty).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openDocumentSettingDialog();
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
            this.uiSubToolWindowRef.item_Click = function (item) {
                _this.subtoolWindow_Item_Click(item);
            };
            this.uiSubToolWindowRef.itemButton_Click = function (item) {
                _this.subtoolWindow_Button_Click(item);
            };
            // Modal window
            document.addEventListener('custombox:content:open', function () {
                _this.onModalWindowShown();
            });
            document.addEventListener('custombox:content:close', function () {
                _this.onModalWindowClosed();
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
            this.getElement(this.ID.paletteColorModal_currentColor).addEventListener('change', function (e) {
                _this.onPaletteColorModal_CurrentColorChanged();
            });
            this.getElement(this.ID.paletteColorModal_currentAlpha).addEventListener('change', function (e) {
                _this.onPaletteColorModal_CurrentColorChanged();
            });
            var _loop_1 = function (paletteColorIndex) {
                {
                    var id = this_1.ID.paletteColorModal_colorValue + paletteColorIndex;
                    var colorButton = this_1.getElement(id);
                    colorButton.addEventListener('change', function (e) {
                        _this.onPaletteColorModal_ColorChanged(paletteColorIndex);
                    });
                }
                {
                    var id = this_1.ID.paletteColorModal_colorIndex + paletteColorIndex;
                    var radioButton = this_1.getElement(id);
                    radioButton.addEventListener('click', function (e) {
                        _this.onPaletteColorModal_ColorIndexChanged();
                    });
                }
            };
            var this_1 = this;
            for (var paletteColorIndex = 0; paletteColorIndex < ManualTracingTool.DocumentData.maxPaletteColors; paletteColorIndex++) {
                _loop_1(paletteColorIndex);
            }
        };
        App_Event.prototype.setCanvasWindowMouseEvent = function (eventCanvasWindow, drawCanvasWindew, mousedown, mousemove, mouseup, mousewheel, isModal) {
            var _this = this;
            if (mousedown != null) {
                eventCanvasWindow.canvas.addEventListener('mousedown', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, false, drawCanvasWindew);
                    mousedown.call(_this);
                    e.preventDefault();
                });
            }
            if (mousemove != null) {
                eventCanvasWindow.canvas.addEventListener('mousemove', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, false, drawCanvasWindew);
                    mousemove.call(_this);
                    e.preventDefault();
                });
            }
            if (mouseup != null) {
                eventCanvasWindow.canvas.addEventListener('mouseup', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, true, drawCanvasWindew);
                    mouseup.call(_this);
                    e.preventDefault();
                });
            }
            if (mousedown != null) {
                eventCanvasWindow.canvas.addEventListener('touchstart', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.getTouchInfo(drawCanvasWindew.toolMouseEvent, e, true, false, drawCanvasWindew);
                    mousedown.call(_this);
                    e.preventDefault();
                });
            }
            if (mousemove != null) {
                eventCanvasWindow.canvas.addEventListener('touchmove', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.getTouchInfo(drawCanvasWindew.toolMouseEvent, e, false, false, drawCanvasWindew);
                    mousemove.call(_this);
                    e.preventDefault();
                });
            }
            if (mouseup != null) {
                eventCanvasWindow.canvas.addEventListener('touchend', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.getTouchInfo(drawCanvasWindew.toolMouseEvent, e, false, true, drawCanvasWindew);
                    mouseup.call(_this);
                    e.preventDefault();
                });
            }
            if (mousewheel != null) {
                eventCanvasWindow.canvas.addEventListener('wheel', function (e) {
                    if (_this.isEventDisabled() && !isModal) {
                        return;
                    }
                    _this.getWheelInfo(drawCanvasWindew.toolMouseEvent, e);
                    _this.processMouseEventInput(drawCanvasWindew.toolMouseEvent, e, false, drawCanvasWindew);
                    mousewheel.call(_this);
                    e.preventDefault();
                });
            }
        };
        App_Event.prototype.setEvents_ModalCloseButton = function (id) {
            var _this = this;
            this.getElement(id).addEventListener('click', function (e) {
                _this.currentModalDialogResult = id;
                _this.closeModal();
                e.preventDefault();
            });
        };
        App_Event.prototype.document_keydown = function (e) {
            var env = this.toolEnv;
            var context = this.toolContext;
            var key = e.key;
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
                    this.setCurrentEditMode(ManualTracingTool.EditModeID.editMode);
                }
                else {
                    this.setCurrentEditMode(ManualTracingTool.EditModeID.drawMode);
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
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                    this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.drawLine);
                    this.updateFooterMessage();
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawLayerWindow();
                    env.setRedrawSubtoolWindow();
                }
                return;
            }
            if (key == 'e') {
                if (env.isDrawMode()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                    if (context.subToolIndex != ManualTracingTool.DrawLineToolSubToolID.deletePointBrush) {
                        this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.deletePointBrush);
                    }
                    else {
                        this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.drawLine);
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
                    if (env.isCurrentLayerVectorLayer() || env.isCurrentLayerContainerLayer()) {
                        var withCut = (key == 'x' && env.isCtrlKeyPressing());
                        var command = new ManualTracingTool.Command_DeleteSelectedPoints();
                        if (command.prepareEditTargets(env)) {
                            if (withCut) {
                                var command_1 = new ManualTracingTool.Command_CopyGeometry();
                                if (command_1.prepareEditData(env)) {
                                    command_1.executeCommand(env);
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
                        var command = new ManualTracingTool.Command_CopyGeometry();
                        if (command.prepareEditData(env)) {
                            command.executeCommand(env);
                        }
                    }
                }
                return;
            }
            if (env.isCtrlKeyPressing() && key == 'v') {
                if (this.toolContext.currentVectorGroup != null) {
                    var command = new ManualTracingTool.Command_PasteGeometry();
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
                    var rot = 10.0;
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
                var addScale = 1.0 + this.drawStyle.viewZoomAdjustingSpeedRate;
                if (key == 'd') {
                    addScale = 1 / addScale;
                }
                this.addViewScale(addScale);
                return;
            }
            if (env.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight' || key == 'ArrowUp' || key == 'ArrowDown')) {
                var x = 0.0;
                var y = 0.0;
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
                var leftLimit = this.mainWindow.width * (-0.5);
                var rightLimit = this.mainWindow.width * 1.5;
                var topLimit = this.mainWindow.height * (-0.5);
                var bottomLimit = this.mainWindow.height * 1.5;
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
                var addFrame = 1;
                if (key == 'ArrowLeft') {
                    addFrame = -addFrame;
                }
                this.setCurrentFrame(context.document.animationSettingData.currentTimeFrame + addFrame);
                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();
            }
            if (!env.isCtrlKeyPressing() && (key == 'c' || key == 'v')) {
                var addFrame = 1;
                if (key == 'c') {
                    addFrame = -addFrame;
                }
                var frame = this.findNextViewKeyframeFrame(context.document.animationSettingData.currentTimeFrame, addFrame);
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
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                    this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.extrudeLine);
                    this.currentTool.keydown(e, env);
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawSubtoolWindow();
                }
                return;
            }
            if (key == 'w') {
                var pickedLayer = null;
                for (var _i = 0, _a = this.layerPickingPositions; _i < _a.length; _i++) {
                    var pickingPosition = _a[_i];
                    var pickX = this.mainWindow.toolMouseEvent.offsetX + pickingPosition[0];
                    var pickY = this.mainWindow.toolMouseEvent.offsetY + pickingPosition[1];
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
                        this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                        this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.scratchLine);
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
                    var modalToolID = ManualTracingTool.ModalToolID.grabMove;
                    if (key == 'r') {
                        modalToolID = ManualTracingTool.ModalToolID.rotate;
                    }
                    else if (key == 's') {
                        modalToolID = ManualTracingTool.ModalToolID.scale;
                    }
                    if (env.isCurrentLayerVectorLayer() || env.isCurrentLayerContainerLayer()) {
                        this.startVectorLayerModalTool(modalToolID);
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
                var layerItem = this.layerWindow_FindCurrentItem();
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
        };
        App_Event.prototype.document_keyup = function (e) {
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
        };
        App_Event.prototype.document_keydown_modalTool = function (key, e) {
            var env = this.toolEnv;
            if (key == 'Escape') {
                this.cancelModalTool();
            }
            else {
                this.currentTool.keydown(e, env);
            }
        };
        App_Event.prototype.document_keydown_timeLineWindow = function (key, e) {
            var env = this.toolEnv;
            var context = this.toolContext;
            var aniSetting = context.document.animationSettingData;
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
                        for (var _i = 0, _a = this.currentViewKeyframe.layers; _i < _a.length; _i++) {
                            var viewKeyFrameLayer = _a[_i];
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
        };
        App_Event.prototype.document_drop = function (e) {
            e.preventDefault();
            // Check file exists
            if (e.dataTransfer.files.length == 0) {
                console.log('error: no dropped files.');
                return;
            }
            // Get file path or name
            var file = e.dataTransfer.files[0];
            var filePath = '';
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
        };
        App_Event.prototype.htmlWindow_resize = function (e) {
            this.setDefferedWindowResize();
        };
        App_Event.prototype.htmlWindow_contextmenu = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }
            return false;
        };
        App_Event.prototype.mainWindow_mousedown = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var env = this.toolEnv;
            var e = wnd.toolMouseEvent;
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
        };
        App_Event.prototype.mainWindow_MouseViewOperationStart = function () {
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            e.startMouseDragging();
            mat4.copy(wnd.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(wnd.dragBeforeViewLocation, wnd.viewLocation);
        };
        App_Event.prototype.mainWindow_MouseViewOperationEnd = function () {
            var e = this.mainWindow.toolMouseEvent;
            e.endMouseDragging();
        };
        App_Event.prototype.mainWindow_mousemove = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var env = this.toolEnv;
            var e = wnd.toolMouseEvent;
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
                var isHitChanged = this.mousemoveHittest(e.location, this.toolEnv.mouseCursorViewRadius);
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
        };
        App_Event.prototype.mousemoveHittest = function (location, minDistance) {
            if (this.toolEnv.currentVectorGeometry == null) {
                return false;
            }
            this.hittest_Line_IsCloseTo.startProcess();
            this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorGeometry, location, minDistance);
            this.hittest_Line_IsCloseTo.endProcess();
            return this.hittest_Line_IsCloseTo.isChanged;
        };
        App_Event.prototype.mainWindow_mouseup = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            this.toolEnv.updateContext();
            this.currentTool.mouseUp(e, this.toolEnv);
            this.mainWindow_MouseViewOperationEnd();
        };
        App_Event.prototype.mainWindow_mousewheel = function () {
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            // View operation
            if (e.wheelDelta != 0.0
                && !e.isMouseDragging) {
                var addScale = 1.0 + this.drawStyle.viewZoomAdjustingSpeedRate * 0.5;
                if (e.wheelDelta < 0.0) {
                    addScale = 1.0 / addScale;
                }
                this.addViewScale(addScale);
            }
            this.calculateTransfomredMouseParams(e, wnd);
        };
        App_Event.prototype.layerWindow_mousedown = function () {
            var context = this.toolContext;
            var wnd = this.layerWindow;
            var e = wnd.toolMouseEvent;
            this.toolEnv.updateContext();
            var doubleClicked = wnd.toolMouseEvent.hundleDoubleClick(e.offsetX, e.offsetY);
            var clickedX = e.location[0];
            var clickedY = e.location[1];
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
        };
        App_Event.prototype.layerWindow_mousemove = function () {
            var wnd = this.layerWindow;
            var e = wnd.toolMouseEvent;
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
        };
        App_Event.prototype.layerWindow_mouseup = function () {
            this.layerWindow.endMouseDragging();
        };
        App_Event.prototype.layerWindow_mousedown_LayerCommandButton = function (clickedX, clickedY, doubleClicked) {
            var wnd = this.layerWindow;
            var hitedButton = this.hitTestLayout(wnd.layerWindowCommandButtons, clickedX, clickedY);
            if (hitedButton != null) {
                // Select command
                var layerCommand = null;
                if (hitedButton.index == ManualTracingTool.LayerWindowButtonID.addLayer) {
                    this.openNewLayerCommandOptionModal();
                }
                else if (hitedButton.index == ManualTracingTool.LayerWindowButtonID.deleteLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_Delete();
                }
                else if (hitedButton.index == ManualTracingTool.LayerWindowButtonID.moveUp) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveUp();
                }
                else if (hitedButton.index == ManualTracingTool.LayerWindowButtonID.moveDown) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveDown();
                }
                if (layerCommand == null) {
                    return;
                }
                // Execute command
                this.executeLayerCommand(layerCommand);
            }
        };
        App_Event.prototype.layerWindow_mousedown_LayerItem = function (clickedX, clickedY, doubleClicked) {
            var wnd = this.layerWindow;
            if (wnd.layerWindowItems.length == 0) {
                return;
            }
            var firstItem = wnd.layerWindowItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());
            if (selectedIndex >= 0 && selectedIndex < wnd.layerWindowItems.length) {
                var selectedItem = wnd.layerWindowItems[selectedIndex];
                var selectedLayer = selectedItem.layer;
                if (clickedX <= selectedItem.textLeft) {
                    this.setLayerVisiblity(selectedItem.layer, !selectedItem.layer.isVisible);
                    ManualTracingTool.Layer.updateHierarchicalStatesRecursive(this.toolEnv.document.rootLayer);
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
                        ManualTracingTool.Layer.updateHierarchicalStatesRecursive(selectedLayer);
                        this.toolEnv.setRedrawMainWindowEditorWindow();
                    }
                }
            }
            this.toolEnv.setRedrawLayerWindow();
            this.toolEnv.setRedrawSubtoolWindow();
        };
        App_Event.prototype.subtoolWindow_Item_Click = function (item) {
            this.subtoolWindow_selectItem(item);
        };
        App_Event.prototype.subtoolWindow_Button_Click = function (item) {
            var tool = item.tool;
            var env = this.toolEnv;
            if (!tool.isAvailable(env)) {
                return;
            }
            var buttonIndex = 0; // TODO: 複数ボタンが必要か検討
            var inpuSideID = tool.getInputSideID(buttonIndex, env);
            if (tool.setInputSide(buttonIndex, inpuSideID, env)) {
                item.buttonStateID = tool.getInputSideID(buttonIndex, env);
                env.setRedrawMainWindowEditorWindow();
                env.setRedrawSubtoolWindow();
                this.updateUISubToolWindow();
            }
        };
        App_Event.prototype.subtoolWindow_selectItem = function (item) {
            var tool = item.tool;
            var env = this.toolEnv;
            if (!tool.isAvailable(env)) {
                return;
            }
            // Change current sub tool
            this.setCurrentSubTool(item.subToolIndex);
            env.setRedrawMainWindowEditorWindow();
            // Tool event
            this.activateCurrentTool();
            this.currentTool.toolWindowItemClick(env);
        };
        App_Event.prototype.paletteSelectorWindow_mousedown = function () {
            var context = this.toolContext;
            var wnd = this.paletteSelectorWindow;
            var e = wnd.toolMouseEvent;
            var env = this.toolEnv;
            var documentData = context.document;
            if (e.isLeftButtonPressing()) {
                if (env.currentVectorLayer != null) {
                    var button_LayoutArea = this.hitTestLayout(wnd.commandButtonAreas, e.location[0], e.location[1]);
                    if (button_LayoutArea != null) {
                        wnd.currentTargetID = button_LayoutArea.index;
                        env.setRedrawColorSelectorWindow();
                        env.setRedrawColorMixerWindow();
                    }
                    var palette_LayoutArea = this.hitTestLayout(wnd.itemAreas, e.location[0], e.location[1]);
                    if (palette_LayoutArea != null) {
                        var paletteColorIndex = palette_LayoutArea.index;
                        var color = documentData.paletteColors[paletteColorIndex];
                        var destColor = this.getPaletteSelectorWindow_SelectedColor();
                        vec4.copy(destColor, color.color);
                        if (wnd.currentTargetID == ManualTracingTool.PaletteSelectorWindowButtonID.lineColor) {
                            env.currentVectorLayer.line_PaletteColorIndex = paletteColorIndex;
                        }
                        else if (wnd.currentTargetID == ManualTracingTool.PaletteSelectorWindowButtonID.fillColor) {
                            env.currentVectorLayer.fill_PaletteColorIndex = paletteColorIndex;
                        }
                        env.setRedrawLayerWindow();
                        env.setRedrawMainWindowEditorWindow();
                    }
                }
            }
        };
        App_Event.prototype.setColorMixerRGBElementEvent = function (id, elementID) {
            var _this = this;
            this.getElement(id + this.ID.colorMixer_id_number).addEventListener('change', function (e) {
                var numberValue = _this.getInputElementNumber(id + _this.ID.colorMixer_id_number, 0.0);
                var color = _this.getPaletteSelectorWindow_CurrentColor();
                if (color != null) {
                    color[elementID] = numberValue;
                }
                _this.toolEnv.setRedrawMainWindow();
                _this.toolEnv.setRedrawColorSelectorWindow();
                _this.toolEnv.setRedrawColorMixerWindow();
            });
            this.getElement(id + this.ID.colorMixer_id_range).addEventListener('change', function (e) {
                var rangeValue = _this.getInputElementRangeValue(id + _this.ID.colorMixer_id_range, 0.0, 1.0);
                var color = _this.getPaletteSelectorWindow_CurrentColor();
                if (color != null) {
                    color[elementID] = rangeValue;
                }
                _this.toolEnv.setRedrawMainWindow();
                _this.toolEnv.setRedrawColorSelectorWindow();
                _this.toolEnv.setRedrawColorMixerWindow();
            });
        };
        App_Event.prototype.setColorMixerHSVElementEvent = function (id) {
            var _this = this;
            this.getElement(id + this.ID.colorMixer_id_number).addEventListener('change', function (e) {
                var hueValue = _this.getInputElementNumber(_this.ID.colorMixer_hue + _this.ID.colorMixer_id_number, 0.0);
                var satValue = _this.getInputElementNumber(_this.ID.colorMixer_sat + _this.ID.colorMixer_id_number, 0.0);
                var valValue = _this.getInputElementNumber(_this.ID.colorMixer_val + _this.ID.colorMixer_id_number, 0.0);
                var color = _this.getPaletteSelectorWindow_CurrentColor();
                if (color != null) {
                    ManualTracingTool.ColorLogic.hsvToRGB(color, hueValue, satValue, valValue);
                    _this.toolEnv.setRedrawMainWindow();
                    _this.toolEnv.setRedrawColorSelectorWindow();
                    _this.toolEnv.setRedrawColorMixerWindow();
                }
            });
            this.getElement(id + this.ID.colorMixer_id_range).addEventListener('change', function (e) {
                var hueValue = _this.getInputElementRangeValue(_this.ID.colorMixer_hue + _this.ID.colorMixer_id_range, 0.0, 1.0);
                var satValue = _this.getInputElementRangeValue(_this.ID.colorMixer_sat + _this.ID.colorMixer_id_range, 0.0, 1.0);
                var valValue = _this.getInputElementRangeValue(_this.ID.colorMixer_val + _this.ID.colorMixer_id_range, 0.0, 1.0);
                var color = _this.getPaletteSelectorWindow_CurrentColor();
                if (color != null) {
                    ManualTracingTool.ColorLogic.hsvToRGB(color, hueValue, satValue, valValue);
                    _this.toolEnv.setRedrawMainWindow();
                    _this.toolEnv.setRedrawColorSelectorWindow();
                    _this.toolEnv.setRedrawColorMixerWindow();
                }
            });
        };
        App_Event.prototype.colorMixerWindow_colorCanvas_mousedown = function () {
            var wnd = this.colorMixerWindow_colorCanvas;
            var e = wnd.toolMouseEvent;
            if (!e.isLeftButtonPressing()) {
                return;
            }
            var context = this.toolContext;
            var env = this.toolEnv;
            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);
            var color = this.getPaletteSelectorWindow_CurrentColor();
            if (color != null) {
                color[0] = this.tempColor4[0];
                color[1] = this.tempColor4[1];
                color[2] = this.tempColor4[2];
                this.toolEnv.setRedrawMainWindow();
                this.toolEnv.setRedrawColorSelectorWindow();
                this.toolEnv.setRedrawColorMixerWindow();
            }
        };
        App_Event.prototype.timeLineWindow_mousedown = function () {
            var wnd = this.timeLineWindow;
            var e = wnd.toolMouseEvent;
            var context = this.toolContext;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            var left = wnd.getTimeLineLeft();
            if (e.offsetX < left) {
                this.timeLineWindow_OnPlayPauseButton();
            }
            else {
                this.timeLineWindow_ProcessFrameInput();
            }
        };
        App_Event.prototype.timeLineWindow_OnPlayPauseButton = function () {
            var wnd = this.timeLineWindow;
            var e = wnd.toolMouseEvent;
            var context = this.toolContext;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            if (context.animationPlaying) {
                context.animationPlaying = false;
                env.setRedrawTimeLineWindow();
            }
            else {
                context.animationPlaying = true;
                context.animationPlayingFPS = aniSetting.animationFrameParSecond;
            }
        };
        App_Event.prototype.timeLineWindow_ProcessFrameInput = function () {
            var wnd = this.timeLineWindow;
            var e = wnd.toolMouseEvent;
            var context = this.toolContext;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            var clickedFrame = wnd.getFrameByLocation(e.offsetX, aniSetting);
            if (clickedFrame != -1) {
                this.setCurrentFrame(clickedFrame);
                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();
            }
        };
        App_Event.prototype.timeLineWindow_mousemove = function () {
            var wnd = this.timeLineWindow;
            var e = wnd.toolMouseEvent;
            var context = this.toolContext;
            var env = this.toolEnv;
            if (e.isLeftButtonPressing()) {
                this.timeLineWindow_ProcessFrameInput();
            }
        };
        App_Event.prototype.timeLineWindow_mouseup = function () {
            var wnd = this.timeLineWindow;
            var e = wnd.toolMouseEvent;
            var context = this.toolContext;
            var env = this.toolEnv;
            wnd.endMouseDragging();
        };
        App_Event.prototype.timeLineWindow_mousewheel = function () {
            var wnd = this.timeLineWindow;
            var e = wnd.toolMouseEvent;
            var context = this.toolContext;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            if (env.isCtrlKeyPressing()) {
                var addScale = 0.2;
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
        };
        App_Event.prototype.onPaletteColorModal_ColorIndexChanged = function () {
            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.paletteColorWindow_EditLayer;
            var paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);
            ;
            if (this.paletteColorWindow_Mode == ManualTracingTool.OpenPaletteColorModalMode.LineColor) {
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
        };
        App_Event.prototype.onPaletteColorModal_CurrentColorChanged = function () {
            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.paletteColorWindow_EditLayer;
            var paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);
            var paletteColor = documentData.paletteColors[paletteColorIndex];
            this.getInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
            paletteColor.color[3] = this.getInputElementRangeValue(this.ID.paletteColorModal_currentAlpha, 0.0, 1.0);
            this.displayPaletteColorModalColors(documentData, vectorLayer);
            this.toolEnv.setRedrawMainWindow();
        };
        App_Event.prototype.onPaletteColorModal_ColorChanged = function (paletteColorIndex) {
            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.paletteColorWindow_EditLayer;
            var paletteColor = documentData.paletteColors[paletteColorIndex];
            this.getInputElementColor(this.ID.paletteColorModal_colorValue + paletteColorIndex, paletteColor.color);
            this.displayPaletteColorModalColors(documentData, vectorLayer);
            this.toolEnv.setRedrawMainWindow();
        };
        App_Event.prototype.onPaletteColorModal_ColorCanvas_mousedown = function () {
            if (this.paletteColorWindow_EditLayer == null) {
                return;
            }
            var context = this.toolContext;
            var wnd = this.paletteColorModal_colorCanvas;
            var e = wnd.toolMouseEvent;
            var env = this.toolEnv;
            this.canvasRender.setContext(wnd);
            this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);
            var documentData = this.currentModalDialog_DocumentData;
            var vectorLayer = this.paletteColorWindow_EditLayer;
            var paletteColorIndex = this.getRadioElementIntValue(this.ID.paletteColorModal_colorIndex, 0);
            var paletteColor = documentData.paletteColors[paletteColorIndex];
            paletteColor.color[0] = this.tempColor4[0];
            paletteColor.color[1] = this.tempColor4[1];
            paletteColor.color[2] = this.tempColor4[2];
            this.setColorPaletteElementValue(paletteColorIndex, paletteColor.color);
            this.setInputElementColor(this.ID.paletteColorModal_currentColor, paletteColor.color);
            this.toolEnv.setRedrawMainWindow();
        };
        App_Event.prototype.setOperatorCursorLocationToMouse = function () {
            vec3.copy(this.toolContext.operatorCursor.location, this.mainWindow.toolMouseEvent.location);
            this.toolEnv.setRedrawEditorWindow();
        };
        return App_Event;
    }(ManualTracingTool.App_Document));
    ManualTracingTool.App_Event = App_Event;
})(ManualTracingTool || (ManualTracingTool = {}));
