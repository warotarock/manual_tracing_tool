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
    var Main_Event = /** @class */ (function (_super) {
        __extends(Main_Event, _super);
        function Main_Event() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        // Events
        Main_Event.prototype.setEvents = function () {
            var _this = this;
            if (this.isEventSetDone) {
                return;
            }
            this.isEventSetDone = true;
            this.editorWindow.canvas.addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.mainWindow.toolMouseEvent, e, false, _this.mainWindow);
                _this.mainWindow_mousedown();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mousemove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.mainWindow.toolMouseEvent, e, false, _this.mainWindow);
                _this.mainWindow_mousemove();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mouseup', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.mainWindow.toolMouseEvent, e, true, _this.mainWindow);
                _this.mainWindow_mouseup();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchstart', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.mainWindow.toolMouseEvent, e, true, false, _this.mainWindow);
                _this.mainWindow_mousedown();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchmove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.mainWindow.toolMouseEvent, e, false, false, _this.mainWindow);
                _this.mainWindow_mousemove();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchend', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.mainWindow.toolMouseEvent, e, false, true, _this.mainWindow);
                _this.mainWindow_mouseup();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mousewheel', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getWheelInfo(_this.mainWindow.toolMouseEvent, e);
                _this.editorWindow_mousewheel();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.layerWindow.toolMouseEvent, e, false, _this.layerWindow);
                _this.layerWindow_mousedown();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('mousemove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.layerWindow.toolMouseEvent, e, false, _this.layerWindow);
                _this.layerWindow_mousemove();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('mouseup', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.layerWindow.toolMouseEvent, e, true, _this.mainWindow);
                _this.layerWindow_mouseup();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('touchstart', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.layerWindow.toolMouseEvent, e, true, false, _this.layerWindow);
                _this.layerWindow_mousedown();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('touchmove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.layerWindow.toolMouseEvent, e, false, false, _this.layerWindow);
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('touchend', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.layerWindow.toolMouseEvent, e, false, true, _this.layerWindow);
                e.preventDefault();
            });
            this.subtoolWindow.canvas.addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.subtoolWindow.toolMouseEvent, e, false, _this.subtoolWindow);
                _this.subtoolWindow_mousedown(_this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.subtoolWindow.canvas.addEventListener('mousemove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.subtoolWindow.toolMouseEvent, e, false, _this.subtoolWindow);
                _this.subtoolWindow_mousemove(_this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.subtoolWindow.canvas.addEventListener('mouseup', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.subtoolWindow.toolMouseEvent, e, true, _this.mainWindow);
                _this.subtoolWindow_mouseup(_this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.subtoolWindow.canvas.addEventListener('touchstart', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.subtoolWindow.toolMouseEvent, e, true, false, _this.subtoolWindow);
                _this.subtoolWindow_mousedown(_this.subtoolWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.subtoolWindow.canvas.addEventListener('touchmove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.subtoolWindow.toolMouseEvent, e, false, false, _this.subtoolWindow);
                e.preventDefault();
            });
            this.subtoolWindow.canvas.addEventListener('touchend', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.subtoolWindow.toolMouseEvent, e, false, true, _this.subtoolWindow);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.timeLineWindow.toolMouseEvent, e, false, _this.timeLineWindow);
                _this.timeLineWindow_mousedown(_this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('mousemove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.timeLineWindow.toolMouseEvent, e, false, _this.timeLineWindow);
                _this.timeLineWindow_mousemove(_this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('mouseup', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getMouseInfo(_this.timeLineWindow.toolMouseEvent, e, true, _this.mainWindow);
                _this.timeLineWindow_mouseup(_this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('touchstart', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.timeLineWindow.toolMouseEvent, e, true, false, _this.timeLineWindow);
                _this.timeLineWindow_mousedown(_this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('touchmove', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.timeLineWindow.toolMouseEvent, e, false, false, _this.timeLineWindow);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('touchend', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getTouchInfo(_this.timeLineWindow.toolMouseEvent, e, false, true, _this.timeLineWindow);
                e.preventDefault();
            });
            this.timeLineWindow.canvas.addEventListener('mousewheel', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.getWheelInfo(_this.timeLineWindow.toolMouseEvent, e);
                _this.timeLineWindow_mousewheel(_this.timeLineWindow.toolMouseEvent);
                e.preventDefault();
            });
            this.palletColorModal_colorCanvas.canvas.addEventListener('mousedown', function (e) {
                if (_this.currentModalDialogID != _this.ID.palletColorModal) {
                    return;
                }
                _this.getMouseInfo(_this.palletColorModal_colorCanvas.toolMouseEvent, e, false, _this.palletColorModal_colorCanvas);
                _this.onPalletColorModal_ColorCanvas_mousedown(_this.palletColorModal_colorCanvas.toolMouseEvent);
                e.preventDefault();
            });
            document.addEventListener('keydown', function (e) {
                if (_this.isWhileLoading()) {
                    return;
                }
                if (_this.isModalShown()) {
                    return;
                }
                if (document.activeElement.id == _this.ID.fileName) {
                    return;
                }
                _this.document_keydown(e);
            });
            document.addEventListener('keyup', function (e) {
                if (_this.isModalShown()) {
                    return;
                }
                if (document.activeElement.id == _this.ID.fileName) {
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
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) {
                    var file = e.dataTransfer.files[0];
                    var reader_1 = new FileReader();
                    reader_1.addEventListener('load', function (e) {
                        _this.startReloadDocumentFromText(reader_1.result);
                    });
                    reader_1.readAsText(file);
                }
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
            this.getElement(this.ID.menu_btnPalette1).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openPalletColorModal(ManualTracingTool.OpenPalletColorModalMode.LineColor, _this.toolContext.document, _this.toolContext.currentLayer);
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnPalette2).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openPalletColorModal(ManualTracingTool.OpenPalletColorModalMode.FillColor, _this.toolContext.document, _this.toolContext.currentLayer);
                e.preventDefault();
            });
            // Modal window
            document.addEventListener('custombox:content:open', function () {
                _this.onModalWindowShown();
            });
            document.addEventListener('custombox:content:close', function () {
                _this.onModalWindowClosed();
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
            this.getElement(this.ID.palletColorModal_currentColor).addEventListener('change', function (e) {
                _this.onPalletColorModal_CurrentColorChanged();
            });
            this.getElement(this.ID.palletColorModal_currentAlpha).addEventListener('change', function (e) {
                _this.onPalletColorModal_CurrentColorChanged();
            });
            var _loop_1 = function (palletColorIndex) {
                {
                    var id = this_1.ID.palletColorModal_colorValue + palletColorIndex;
                    var colorButton = this_1.getElement(id);
                    colorButton.addEventListener('change', function (e) {
                        _this.onPalletColorModal_ColorChanged(palletColorIndex);
                    });
                }
                {
                    var id = this_1.ID.palletColorModal_colorIndex + palletColorIndex;
                    var radioButton = this_1.getElement(id);
                    radioButton.addEventListener('click', function (e) {
                        _this.onPalletColorModal_ColorIndexChanged();
                    });
                }
            };
            var this_1 = this;
            for (var palletColorIndex = 0; palletColorIndex < ManualTracingTool.DocumentData.maxPalletColors; palletColorIndex++) {
                _loop_1(palletColorIndex);
            }
        };
        Main_Event.prototype.setEvents_ModalCloseButton = function (id) {
            var _this = this;
            this.getElement(id).addEventListener('click', function (e) {
                _this.currentModalDialogResult = id;
                _this.closeModal();
                e.preventDefault();
            });
        };
        Main_Event.prototype.mainWindow_mousedown = function () {
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
            if (e.isRightButtonPressing() || e.isCenterButtonPressing()) {
                this.mainWindow_MouseViewOperationStart();
            }
            else {
                this.mainWindow_MouseViewOperationEnd();
            }
        };
        Main_Event.prototype.mainWindow_MouseViewOperationStart = function () {
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            e.startMouseDragging();
            mat4.copy(wnd.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(wnd.dragBeforeViewLocation, wnd.viewLocation);
        };
        Main_Event.prototype.mainWindow_MouseViewOperationEnd = function () {
            var e = this.mainWindow.toolMouseEvent;
            e.endMouseDragging();
        };
        Main_Event.prototype.mainWindow_mousemove = function () {
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
                var isHitChanged = this.mousemoveHittest(e.location[0], e.location[1], this.toolEnv.mouseCursorViewRadius);
                if (isHitChanged) {
                    this.toolEnv.setRedrawMainWindow();
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
        Main_Event.prototype.mainWindow_mouseup = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            this.toolEnv.updateContext();
            this.currentTool.mouseUp(e, this.toolEnv);
            this.mainWindow_MouseViewOperationEnd();
        };
        Main_Event.prototype.editorWindow_mousewheel = function () {
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
        };
        Main_Event.prototype.layerWindow_mousedown = function () {
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
        Main_Event.prototype.layerWindow_mousemove = function () {
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
        Main_Event.prototype.layerWindow_mouseup = function () {
            this.layerWindow.endMouseDragging();
        };
        Main_Event.prototype.layerWindow_mousedown_LayerCommandButton = function (clickedX, clickedY, doubleClicked) {
            var hitedButton = this.hitTestLayout(this.layerWindowCommandButtons, clickedX, clickedY);
            if (hitedButton != null) {
                // Select command
                var layerCommand = null;
                if (hitedButton.buttonID == ManualTracingTool.LayerWindowButtonID.addLayer) {
                    this.openNewLayerCommandOptionModal();
                }
                else if (hitedButton.buttonID == ManualTracingTool.LayerWindowButtonID.deleteLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == ManualTracingTool.LayerWindowButtonID.moveUp) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == ManualTracingTool.LayerWindowButtonID.moveDown) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveDown();
                }
                if (layerCommand == null) {
                    return;
                }
                // Execute command
                this.executeLayerCommand(layerCommand);
            }
        };
        Main_Event.prototype.layerWindow_mousedown_LayerItem = function (clickedX, clickedY, doubleClicked) {
            if (this.layerWindowItems.length == 0) {
                return;
            }
            var firstItem = this.layerWindowItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());
            if (selectedIndex >= 0 && selectedIndex < this.layerWindowItems.length) {
                var selectedItem = this.layerWindowItems[selectedIndex];
                var selectedLayer = selectedItem.layer;
                if (clickedX <= selectedItem.textLeft) {
                    this.setLayerVisiblity(selectedItem.layer, !selectedItem.layer.isVisible);
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
                            this.setLayerSelection(selectedLayer, true);
                            this.activateCurrentTool();
                            this.startShowingLayerItem(selectedItem);
                        }
                        else {
                            this.setCurrentLayer(selectedLayer);
                            this.startShowingCurrentLayer();
                        }
                        this.toolEnv.setRedrawMainWindowEditorWindow();
                    }
                }
            }
            this.toolEnv.setRedrawLayerWindow();
            this.toolEnv.setRedrawSubtoolWindow();
        };
        Main_Event.prototype.subtoolWindow_mousedown = function (e) {
            var context = this.toolContext;
            var wnd = this.subtoolWindow;
            var env = this.toolEnv;
            var doubleClicked = wnd.toolMouseEvent.hundleDoubleClick(e.offsetX, e.offsetY);
            if (context.mainToolID == ManualTracingTool.MainToolID.none || this.subToolViewItems.length == 0) {
                return;
            }
            env.updateContext();
            var clickedX = e.location[0];
            var clickedY = e.location[1];
            if (e.isLeftButtonPressing()) {
                var firstItem = this.subToolViewItems[0];
                var selectedIndex = Math.floor((clickedY - firstItem.top) / (firstItem.getHeight()));
                if (selectedIndex < 0 || selectedIndex >= this.subToolViewItems.length) {
                    return;
                }
                var viewItem = this.subToolViewItems[selectedIndex];
                var tool = viewItem.tool;
                if (tool.isAvailable(env)) {
                    // Change current sub tool
                    this.setCurrentSubTool(selectedIndex);
                    this.updateFooterMessage();
                    env.setRedrawMainWindowEditorWindow();
                    env.setRedrawSubtoolWindow();
                    // Option button click
                    var button = this.hitTestLayout(viewItem.buttons, clickedX, clickedY);
                    if (button != null) {
                        var inpuSideID = tool.getInputSideID(button.index, env);
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
                            this.activateCurrentTool();
                            this.currentTool.toolWindowItemClick(e, env);
                        }
                    }
                }
            }
            else if (e.isCenterButtonPressing() || e.isRightButtonPressing()) {
                wnd.startMouseDragging();
            }
        };
        Main_Event.prototype.subtoolWindow_mousemove = function (e) {
            var wnd = this.subtoolWindow;
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
        };
        Main_Event.prototype.subtoolWindow_mouseup = function (e) {
            this.subtoolWindow.endMouseDragging();
        };
        Main_Event.prototype.timeLineWindow_mousedown = function (e) {
            var context = this.toolContext;
            var wnd = this.timeLineWindow;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            var left = wnd.getTimeLineLeft();
            if (e.offsetX < left) {
                this.timeLineWindow_OnPlayPauseButton(e);
            }
            else {
                this.timeLineWindow_ProcessFrameInput(e);
            }
        };
        Main_Event.prototype.timeLineWindow_OnPlayPauseButton = function (e) {
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
        Main_Event.prototype.timeLineWindow_ProcessFrameInput = function (e) {
            var context = this.toolContext;
            var wnd = this.timeLineWindow;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            var clickedFrame = wnd.getFrameByLocation(e.offsetX, aniSetting);
            if (clickedFrame != -1) {
                this.setCurrentFrame(clickedFrame);
                env.setRedrawMainWindowEditorWindow();
                env.setRedrawTimeLineWindow();
            }
        };
        Main_Event.prototype.timeLineWindow_mousemove = function (e) {
            var context = this.toolContext;
            var wnd = this.timeLineWindow;
            var env = this.toolEnv;
            if (e.isLeftButtonPressing()) {
                this.timeLineWindow_ProcessFrameInput(e);
            }
        };
        Main_Event.prototype.timeLineWindow_mouseup = function (e) {
            var context = this.toolContext;
            var wnd = this.timeLineWindow;
            var env = this.toolEnv;
            wnd.endMouseDragging();
        };
        Main_Event.prototype.timeLineWindow_mousewheel = function (e) {
            var context = this.toolContext;
            var wnd = this.mainWindow;
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
        Main_Event.prototype.document_keydown = function (e) {
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
                vec3.copy(this.toolContext.operatorCursor.location, this.mainWindow.toolMouseEvent.location);
                this.toolEnv.setRedrawEditorWindow();
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
                this.document = this.createDefaultDocumentData();
                this.toolContext.document = this.document;
                this.initializeContext();
                this.updateLayerStructure();
                this.setCurrentLayer(null);
                this.setCurrentFrame(0);
                this.setCurrentLayer(this.document.rootLayer.childLayers[0]);
                this.toolEnv.setRedrawAllWindows();
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
                    if (this.toolContext.currentVectorLayer != null
                        && this.toolContext.currentVectorGeometry != null) {
                        var command = new ManualTracingTool.Command_DeleteSelectedPoints();
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
                if (env.isShiftKeyPressing()) {
                    this.mainWindow.viewLocation[0] = 0.0;
                    this.mainWindow.viewLocation[1] = 0.0;
                    vec3.copy(this.homeViewLocation, this.mainWindow.viewLocation);
                    this.mainWindow.viewScale = context.document.defaultViewScale;
                    this.mainWindow.viewRotation = 0.0;
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
                    this.mainWindow.viewRotation += rot;
                    this.setViewRotation(this.mainWindow.viewRotation);
                    return;
                }
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
            if (key == 'a') {
                if (env.isEditMode()) {
                    this.tool_SelectAllPoints.execute(env);
                    this.activateCurrentTool();
                }
                else {
                    this.selectNextOrPreviousLayer(false);
                    this.startShowingCurrentLayer();
                    env.setRedrawLayerWindow();
                }
                return;
            }
            if (key == 'w') {
                var pickedLayer = null;
                for (var _i = 0, _a = this.layerPickingPositions; _i < _a.length; _i++) {
                    var pickingPosition = _a[_i];
                    var pickX = this.mainWindow.toolMouseEvent.offsetX + pickingPosition[0];
                    var pickY = this.mainWindow.toolMouseEvent.offsetY + pickingPosition[1];
                    pickedLayer = this.layerPicking(this.mainWindow, pickX, pickY);
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
            if (key == 'g' || key == 'r' || key == 's') {
                if (key == 's' && env.isCtrlKeyPressing()) {
                    this.saveDocument();
                    return;
                }
                if (env.isDrawMode()) {
                    if (!env.needsDrawOperatorCursor()) {
                        if (key == 's') {
                            this.selectNextOrPreviousLayer(true);
                            this.startShowingCurrentLayer();
                            env.setRedrawLayerWindow();
                        }
                        else {
                            if (!this.currentTool.keydown(e, env)) {
                                // Switch to scratch line tool
                                if (key == 'g') {
                                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                                    this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.scratchLine);
                                    this.currentTool.keydown(e, env);
                                    env.setRedrawMainWindowEditorWindow();
                                    env.setRedrawSubtoolWindow();
                                }
                            }
                        }
                    }
                }
                else if (env.isEditMode()) {
                    var modalToolID = ManualTracingTool.ModalToolID.grabMove;
                    if (key == 'r') {
                        modalToolID = ManualTracingTool.ModalToolID.ratate;
                    }
                    else if (key == 's') {
                        modalToolID = ManualTracingTool.ModalToolID.scale;
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
                var layerItem = this.findCurrentLayerLayerWindowItem();
                this.openLayerPropertyModal(layerItem.layer, layerItem);
            }
            if (key == '2') {
                var layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPalletColorModal(ManualTracingTool.OpenPalletColorModalMode.LineColor, this.toolContext.document, layerItem.layer);
            }
            if (key == '3') {
                var layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPalletColorModal(ManualTracingTool.OpenPalletColorModalMode.FillColor, this.toolContext.document, layerItem.layer);
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
        };
        Main_Event.prototype.document_keyup = function (e) {
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
        };
        Main_Event.prototype.document_keydown_modalTool = function (key, e) {
            var env = this.toolEnv;
            if (key == 'Escape') {
                this.cancelModalTool();
            }
            else {
                this.currentTool.keydown(e, env);
            }
        };
        Main_Event.prototype.document_keydown_timeLineWindow = function (key, e) {
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
                        for (var _i = 0, _a = this.currentKeyframe.layers; _i < _a.length; _i++) {
                            var viewKeyFrameLayer = _a[_i];
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
        };
        Main_Event.prototype.htmlWindow_resize = function (e) {
            this.isDeferredWindowResizeWaiting = true;
        };
        Main_Event.prototype.htmlWindow_contextmenu = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }
            return false;
        };
        return Main_Event;
    }(ManualTracingTool.Main_Drawing));
    ManualTracingTool.Main_Event = Main_Event;
})(ManualTracingTool || (ManualTracingTool = {}));
