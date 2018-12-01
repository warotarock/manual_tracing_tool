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
            _this.operatorCurosrLineDash = [2.0, 2.0];
            _this.operatorCurosrLineDashScaled = [0.0, 0.0];
            _this.operatorCurosrLineDashNone = [];
            // Layer window drawing
            _this.layerWindowLayoutArea = new RectangleLayoutArea();
            _this.layerWindowItems = null;
            _this.layerWindowButtons = null;
            _this.subToolViewItems = null;
            _this.layerWindowBackgroundColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            _this.layerWindowItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            // Subtool window drawing
            _this.subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            _this.subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);
            // Pallet modal drawing
            _this.colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            _this.colorB = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            // Footer window drawing
            _this.footerText = '';
            _this.footerTextBefore = '';
            return _this;
        }
        Main_View.prototype.initializeViews = function () {
            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;
            this.setCanvasSizeFromStyle(this.palletColorModal_colorCanvas);
            this.drawPalletColorMixer(this.palletColorModal_colorCanvas);
            this.collectLayerWindowButtons();
            this.updateLayerStructure();
        };
        // Events
        Main_View.prototype.setEvents = function () {
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
            // Menu buttons
            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                var env = _this.toolEnv;
                var context = _this.toolContext;
                _this.setCurrentMainToolForCurentLayer();
                _this.setCurrentEditMode(ManualTracingTool.EditModeID.drawMode);
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
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.misc);
                _this.setCurrentEditMode(ManualTracingTool.EditModeID.drawMode);
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
            this.getElement(this.ID.menu_btnPalette1).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openPalletColorModal(OpenPalletColorModalMode.LineColor, _this.toolContext.document, _this.toolContext.currentLayer);
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnPalette2).addEventListener('mousedown', function (e) {
                if (_this.isEventDisabled()) {
                    return;
                }
                _this.openPalletColorModal(OpenPalletColorModalMode.FillColor, _this.toolContext.document, _this.toolContext.currentLayer);
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
        Main_View.prototype.setEvents_ModalCloseButton = function (id) {
            var _this = this;
            this.getElement(id).addEventListener('click', function (e) {
                _this.currentModalDialogResult = id;
                _this.closeModal();
                e.preventDefault();
            });
        };
        Main_View.prototype.mainWindow_mousedown = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
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
        };
        Main_View.prototype.mainWindow_MouseViewOperationStart = function () {
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            e.startMouseDragging();
            mat4.copy(wnd.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(wnd.dragBeforeViewLocation, wnd.viewLocation);
        };
        Main_View.prototype.mainWindow_MouseViewOperationEnd = function () {
            var e = this.mainWindow.toolMouseEvent;
            e.endMouseDragging();
        };
        Main_View.prototype.mainWindow_mousemove = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
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
                var isHitChanged = this.mousemoveHittest(e.location[0], e.location[1], this.toolEnv.mouseCursorViewRadius);
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
        };
        Main_View.prototype.mainWindow_mouseup = function () {
            var context = this.toolContext;
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            this.toolEnv.updateContext();
            // Draw mode
            if (this.toolEnv.isDrawMode()) {
                this.currentTool.mouseUp(e, this.toolEnv);
            }
            else if (this.toolEnv.isEditMode()) {
                this.currentSelectTool.mouseUp(e, this.toolEnv);
            }
            this.mainWindow_MouseViewOperationEnd();
        };
        Main_View.prototype.editorWindow_mousewheel = function () {
            var wnd = this.mainWindow;
            var e = wnd.toolMouseEvent;
            // View operation
            if (e.wheelDelta != 0.0
                && !e.isMouseDragging) {
                this.mainWindow.addViewScale(e.wheelDelta * 0.1);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        };
        Main_View.prototype.layerWindow_mousedown = function () {
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
        };
        Main_View.prototype.layerWindow_mousemove = function () {
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
        Main_View.prototype.layerWindow_mouseup = function () {
            this.layerWindow.endMouseDragging();
        };
        Main_View.prototype.layerWindow_mousedown_LayerItemButton = function (clickedX, clickedY, doubleClicked) {
            var hitedButton = this.hitTestLayout(this.layerWindowButtons, clickedX, clickedY);
            if (hitedButton != null) {
                // Select command
                var layerCommand = null;
                if (hitedButton.buttonID == LayerWindowButtonID.addLayer) {
                    this.openNewLayerCommandOptionModal();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.deleteLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveUp) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveDown) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveDown();
                }
                if (layerCommand == null) {
                    return;
                }
                // Execute command
                this.executeLayerCommand(layerCommand);
            }
        };
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
        Main_View.prototype.layerWindow_mousedown_LayerItem = function (clickedX, clickedY, doubleClicked) {
            if (this.layerWindowItems.length == 0) {
                return;
            }
            var firstItem = this.layerWindowItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());
            if (selectedIndex >= 0 && selectedIndex < this.layerWindowItems.length) {
                var selectedItem = this.layerWindowItems[selectedIndex];
                var selectedLayer = selectedItem.layer;
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
        };
        Main_View.prototype.subtoolWindow_mousedown = function (e) {
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
                            this.currentTool.toolWindowItemClick(e, env);
                        }
                    }
                }
            }
            else if (e.isCenterButtonPressing() || e.isRightButtonPressing()) {
                wnd.startMouseDragging();
            }
        };
        Main_View.prototype.subtoolWindow_mousemove = function (e) {
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
        Main_View.prototype.subtoolWindow_mouseup = function (e) {
            this.subtoolWindow.endMouseDragging();
        };
        Main_View.prototype.timeLineWindow_mousedown = function (e) {
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
        Main_View.prototype.timeLineWindow_OnPlayPauseButton = function (e) {
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
        Main_View.prototype.timeLineWindow_ProcessFrameInput = function (e) {
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
        Main_View.prototype.timeLineWindow_mousemove = function (e) {
            var context = this.toolContext;
            var wnd = this.timeLineWindow;
            var env = this.toolEnv;
            if (e.isLeftButtonPressing()) {
                this.timeLineWindow_ProcessFrameInput(e);
            }
        };
        Main_View.prototype.timeLineWindow_mouseup = function (e) {
            var context = this.toolContext;
            var wnd = this.timeLineWindow;
            var env = this.toolEnv;
            wnd.endMouseDragging();
        };
        Main_View.prototype.timeLineWindow_mousewheel = function (e) {
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
        Main_View.prototype.document_keydown = function (e) {
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
                    this.setCurrentEditMode(ManualTracingTool.EditModeID.editMode);
                }
                else {
                    this.setCurrentEditMode(ManualTracingTool.EditModeID.drawMode);
                }
                return;
            }
            if (key == 'n' && env.isCtrlKeyPressing()) {
                this.document = this.createDefaultDocumentData();
                this.toolContext.document = this.document;
                this.toolContext.commandHistory = new ManualTracingTool.CommandHistory();
                this.updateLayerStructure();
                this.setCurrentLayer(null);
                this.setCurrentFrame(0);
                this.setCurrentLayer(this.document.rootLayer.childLayers[0]);
                env.setRedrawAllWindows();
                return;
            }
            if (key == 'b') {
                if (env.isDrawMode()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                    this.setCurrentSubTool(DrawLineToolSubToolID.drawLine);
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
                    if (context.subToolIndex != DrawLineToolSubToolID.deletePointBrush) {
                        this.setCurrentSubTool(DrawLineToolSubToolID.deletePointBrush);
                    }
                    else {
                        this.setCurrentSubTool(DrawLineToolSubToolID.drawLine);
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
                this.mainWindow.viewLocation[0] = 0.0;
                this.mainWindow.viewLocation[1] = 0.0;
                this.mainWindow.viewScale = 1.0;
                this.mainWindow.viewRotation = 0.0;
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
                var addScale = 0.1 * this.drawStyle.viewZoomAdjustingSpeedRate;
                if (key == 'd') {
                    addScale = -addScale;
                }
                this.mainWindow.addViewScale(addScale);
                env.setRedrawMainWindowEditorWindow();
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
                    var modalToolID = ModalToolID.grabMove;
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
                var layerItem = this.findCurrentLayerLayerWindowItem();
                this.openLayerPropertyModal(layerItem.layer, layerItem);
            }
            if (key == '2') {
                var layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPalletColorModal(OpenPalletColorModalMode.LineColor, this.toolContext.document, layerItem.layer);
            }
            if (key == '3') {
                var layerItem = this.findCurrentLayerLayerWindowItem();
                this.openPalletColorModal(OpenPalletColorModalMode.FillColor, this.toolContext.document, layerItem.layer);
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
        Main_View.prototype.document_keyup = function (e) {
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
        Main_View.prototype.document_keydown_modalTool = function (key, e) {
            var env = this.toolEnv;
            if (key == 'Escape') {
                this.cancelModalTool();
            }
            else {
                this.currentTool.keydown(e, env);
            }
        };
        Main_View.prototype.document_keydown_timeLineWindow = function (key, e) {
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
                        newFrame = this.nextKeyframe.frame + 1;
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
        Main_View.prototype.htmlWindow_resize = function (e) {
            this.isDeferredWindowResizeWaiting = true;
        };
        Main_View.prototype.htmlWindow_contextmenu = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }
            return false;
        };
        // Tool operations
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
        // View operations
        Main_View.prototype.resizeWindows = function () {
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
                var palletColor = documentData.palletColos[palletColorIndex];
                this.setInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                this.setInputElementRangeValue(this.ID.palletColorModal_currentAlpha, palletColor.color[3], 0.0, 1.0);
            }
            for (var palletColorIndex = 0; palletColorIndex < documentData.palletColos.length; palletColorIndex++) {
                var palletColor = documentData.palletColos[palletColorIndex];
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
            var palletColor = documentData.palletColos[palletColorIndex];
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
            var palletColor = documentData.palletColos[palletColorIndex];
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
            var palletColor = documentData.palletColos[palletColorIndex];
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
                    var palletColor = documentData.palletColos[palletColorIndex];
                    this.getInputElementColor(this.ID.palletColorModal_currentColor, palletColor.color);
                    palletColor.color[3] = this.getInputElementRangeValue(this.ID.palletColorModal_currentAlpha, 0.0, 1.0);
                }
                for (var i = 0; i < documentData.palletColos.length; i++) {
                    var palletColor = documentData.palletColos[i];
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
            var layerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, ManualTracingTool.LayerTypeID.vectorLayer);
            // Select command
            var layerCommand = null;
            if (layerType == ManualTracingTool.LayerTypeID.vectorLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
            }
            else if (layerType == ManualTracingTool.LayerTypeID.vectorLayerReferenceLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition();
            }
            else if (layerType == ManualTracingTool.LayerTypeID.groupLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddGroupLayerToCurrentPosition();
            }
            else if (layerType == ManualTracingTool.LayerTypeID.posingLayer) {
                layerCommand = new ManualTracingTool.Command_Layer_AddPosingLayerToCurrentPosition();
            }
            else if (layerType == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
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
            this.setInputElementNumber(this.ID.documentSettingModal_FrameLeft, this.document.documentFrame[0]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameTop, this.document.documentFrame[1]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameRight, this.document.documentFrame[2]);
            this.setInputElementNumber(this.ID.documentSettingModal_FrameBottom, this.document.documentFrame[3]);
            this.openModal(this.ID.documentSettingModal, null);
        };
        Main_View.prototype.openExportImageFileModal = function () {
            if (this.isModalShown()) {
                return;
            }
            var fileName = this.getInputElementText(this.ID.fileName);
            var lastSeperatorIndex = StringLastIndexOf(fileName, '\\');
            if (lastSeperatorIndex == -1) {
                lastSeperatorIndex = StringLastIndexOf(fileName, '/');
            }
            var eperatorDotIndex = StringLastIndexOf(fileName, '.');
            if (lastSeperatorIndex != -1 && eperatorDotIndex != -1 && eperatorDotIndex - lastSeperatorIndex > 0) {
                fileName = StringSubstring(fileName, lastSeperatorIndex + 1, eperatorDotIndex - lastSeperatorIndex - 1);
            }
            this.setInputElementText(this.ID.exportImageFileModal_fileName, fileName);
            this.setRadioElementIntValue(this.ID.exportImageFileModal_imageFileType, 1);
            this.openModal(this.ID.exportImageFileModal, null);
        };
        Main_View.prototype.onClosedExportImageFileModal = function () {
            if (this.currentModalDialogResult != this.ID.exportImageFileModal_ok) {
                return;
            }
            var fileName = this.getInputElementText(this.ID.exportImageFileModal_fileName);
            if (StringIsNullOrEmpty(fileName)) {
                return;
            }
            var imageWidth = Math.floor(this.document.documentFrame[2] - this.document.documentFrame[0] + 1);
            var imageHeight = Math.floor(this.document.documentFrame[3] - this.document.documentFrame[1] + 1);
            if (imageWidth > 0 && imageHeight > 0) {
                var canvas = this.renderingWindow.canvas;
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
                var exportPath = window.localStorage.getItem(this.exportPathKey);
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
                        alert(error);
                    }
                });
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
                var layer = this.layerPropertyWindow_EditLayer;
                // common layer properties
                var layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);
                if (!StringIsNullOrEmpty(layerName)) {
                    layer.name = layerName;
                }
                this.getInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
                layer.layerColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_layerAlpha, 0.0, 1.0);
                if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    var vectorLayer = layer;
                    this.getInputElementColor(this.ID.layerPropertyModal_fillColor, vectorLayer.fillColor);
                    vectorLayer.fillColor[3] = this.getInputElementRangeValue(this.ID.layerPropertyModal_fillColorAlpha, 0.0, 1.0);
                    vectorLayer.drawLineType = this.getRadioElementIntValue(this.ID.layerPropertyModal_drawLineType, ManualTracingTool.DrawLineTypeID.layerColor);
                    vectorLayer.fillAreaType = this.getRadioElementIntValue(this.ID.layerPropertyModal_fillAreaType, ManualTracingTool.FillAreaTypeID.fillColor);
                }
                this.layerPropertyWindow_EditLayer = null;
            }
            else if (this.currentModalDialogID == this.ID.palletColorModal) {
                this.onClosedPalletColorModal();
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {
                this.toolContext.drawLineBaseWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineWidth);
                this.toolContext.drawLineMinWidth = this.getInputElementNumber(this.ID.operationOptionModal_LineMinWidth);
                this.toolContext.operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, ManualTracingTool.OperationUnitID.linePoint);
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
        // Drawings
        Main_View.prototype.draw = function () {
            this.toolEnv.updateContext();
            if (this.footerText != this.footerTextBefore) {
                this.getElement('footer').innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
            if (this.toolContext.redrawMainWindow) {
                this.toolContext.redrawMainWindow = false;
                this.clearWindow(this.mainWindow);
                this.drawMainWindow(this.mainWindow);
                if (this.selectCurrentLayerAnimationTime > 0.0) {
                    this.toolEnv.setRedrawMainWindow();
                }
            }
            if (this.toolContext.redrawEditorWindow) {
                this.toolContext.redrawEditorWindow = false;
                this.clearWindow(this.editorWindow);
                this.drawEditorWindow(this.editorWindow, this.mainWindow);
            }
            if (this.toolContext.redrawLayerWindow) {
                this.toolContext.redrawLayerWindow = false;
                this.clearWindow(this.layerWindow);
                this.drawLayerWindow(this.layerWindow);
            }
            if (this.toolContext.redrawSubtoolWindow) {
                this.toolContext.redrawSubtoolWindow = false;
                this.clearWindow(this.subtoolWindow);
                this.subtoolWindow_Draw(this.subtoolWindow);
            }
            if (this.toolContext.redrawTimeLineWindow) {
                this.toolContext.redrawTimeLineWindow = false;
                this.clearWindow(this.timeLineWindow);
                this.drawTimeLineWindow(this.timeLineWindow);
            }
            if (this.toolContext.redrawWebGLWindow) {
                this.toolContext.redrawWebGLWindow = false;
                this.drawWebGLWindow(this.mainWindow, this.webglWindow, this.pickingWindow);
            }
            if (this.toolContext.redrawHeaderWindow) {
                this.toolContext.redrawHeaderWindow = false;
                this.updateHeaderButtons();
            }
            if (this.toolContext.redrawFooterWindow) {
                this.toolContext.redrawFooterWindow = false;
                this.updateFooterMessage();
            }
        };
        // Main window drawing
        Main_View.prototype.clearWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
        };
        Main_View.prototype.drawMainWindow = function (canvasWindow) {
            if (this.currentKeyframe == null) {
                return;
            }
            var currentLayerOnly = (this.selectCurrentLayerAnimationTime > 0.0);
            this.canvasRender.setContext(canvasWindow);
            var viewKeyframe = this.currentKeyframe;
            for (var i = viewKeyframe.layers.length - 1; i >= 0; i--) {
                var viewKeyFrameLayer = viewKeyframe.layers[i];
                this.drawLayer(viewKeyFrameLayer, currentLayerOnly, this.document);
            }
        };
        Main_View.prototype.drawLayer = function (viewKeyFrameLayer, currentLayerOnly, documentData) {
            var layer = viewKeyFrameLayer.layer;
            if (!layer.isVisible) {
                return;
            }
            if (currentLayerOnly && layer != this.toolContext.currentLayer) {
                return;
            }
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.drawVectorLayer(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                // No drawing
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                // No drawing
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                this.drawImageFileReferenceLayer(ifrLayer);
            }
        };
        Main_View.prototype.drawVectorLayer = function (layer, geometry, documentData) {
            var context = this.toolContext;
            var isCurrentLayer = (layer == context.currentVectorLayer);
            // color setting
            var lineColor;
            if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.layerColor) {
                lineColor = layer.layerColor;
            }
            else if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.palletColor) {
                var palletColor = documentData.palletColos[layer.line_PalletColorIndex];
                lineColor = palletColor.color;
            }
            else {
                lineColor = layer.layerColor;
            }
            var fillColor;
            if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.fillColor) {
                fillColor = layer.fillColor;
            }
            else if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.palletColor) {
                var palletColor = documentData.palletColos[layer.fill_PalletColorIndex];
                fillColor = palletColor.color;
            }
            else {
                fillColor = layer.fillColor;
            }
            vec4.copy(this.editOtherLayerLineColor, lineColor);
            this.editOtherLayerLineColor[3] *= 0.3;
            var useAdjustingLocation = this.isModalToolRunning();
            // drawing geometry
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                var continuousFill = false;
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (layer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        this.drawVectorLineFill(line, fillColor, 1.0, useAdjustingLocation, continuousFill);
                        continuousFill = line.continuousFill;
                    }
                }
                for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                    var line = _e[_d];
                    if (this.toolEnv.isDrawMode()) {
                        if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.layerColor) {
                            this.drawVectorLineStroke(line, lineColor, 1.0, useAdjustingLocation);
                        }
                        else if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.palletColor) {
                            var palletColor = documentData.palletColos[layer.line_PalletColorIndex];
                            this.drawVectorLineStroke(line, palletColor.color, 1.0, useAdjustingLocation);
                        }
                    }
                    else if (this.toolEnv.isEditMode()) {
                        if (!isCurrentLayer) {
                            this.drawVectorLineStroke(line, this.editOtherLayerLineColor, 1.0, useAdjustingLocation);
                        }
                        else {
                            if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.linePoint
                                || this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.lineSegment) {
                                this.drawVectorLineStroke(line, lineColor, 1.0, useAdjustingLocation);
                                this.drawVectorLinePoints(line, lineColor, useAdjustingLocation);
                            }
                            else if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.line) {
                                var color = lineColor;
                                if (line.isSelected || line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected) {
                                    color = this.drawStyle.selectedVectorLineColor;
                                }
                                if (line.isCloseToMouse) {
                                    this.drawVectorLineStroke(line, color, 1.0 + 2.0, useAdjustingLocation);
                                }
                                else {
                                    this.drawVectorLineStroke(line, color, 1.0, useAdjustingLocation);
                                }
                                //this.drawAdjustingLinePoints(canvasWindow, line);
                            }
                        }
                    }
                }
            }
        };
        Main_View.prototype.drawVectorLineStroke = function (line, color, strokeWidth, useAdjustingLocation) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeColorV(color);
            this.drawVectorLineSegment(line, 0, line.points.length - 1, useAdjustingLocation);
        };
        Main_View.prototype.drawVectorLinePoints = function (line, color, useAdjustingLocation) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            // make color darker or lighter than original to visible on line color
            ManualTracingTool.ColorLogic.rgbToHSV(this.tempEditorLinePointColor1, color);
            if (this.tempEditorLinePointColor1[2] > 0.5) {
                this.tempEditorLinePointColor1[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            else {
                this.tempEditorLinePointColor1[2] += this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            ManualTracingTool.ColorLogic.hsvToRGB(this.tempEditorLinePointColor2, this.tempEditorLinePointColor1);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        };
        Main_View.prototype.lineWidthAdjust = function (width) {
            return Math.floor(width * 5) / 5;
        };
        Main_View.prototype.drawVectorLineFill = function (line, color, strokeWidth, useAdjustingLocation, isFillContinuing) {
            if (line.points.length <= 1) {
                return;
            }
            if (!isFillContinuing) {
                this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
                this.canvasRender.beginPath();
                this.canvasRender.setFillColorV(color);
            }
            var startIndex = 0;
            var endIndex = line.points.length - 1;
            // search first visible point
            var firstIndex = -1;
            for (var i = startIndex; i <= endIndex; i++) {
                var point = line.points[i];
                if (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete) {
                    firstIndex = i;
                    break;
                }
            }
            if (firstIndex == -1) {
                return;
            }
            // set first location
            var firstPoint = line.points[firstIndex];
            var firstLocation = (useAdjustingLocation ? firstPoint.adjustingLocation : firstPoint.location);
            if (isFillContinuing) {
                this.canvasRender.lineTo(firstLocation[0], firstLocation[1]);
            }
            else {
                this.canvasRender.moveTo(firstLocation[0], firstLocation[1]);
            }
            var currentLineWidth = this.lineWidthAdjust(firstPoint.lineWidth);
            this.canvasRender.setStrokeWidth(currentLineWidth);
            for (var i = 1; i < line.points.length; i++) {
                var point = line.points[i];
                if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                    continue;
                }
                var location_1 = (useAdjustingLocation ? point.adjustingLocation : point.location);
                this.canvasRender.lineTo(location_1[0], location_1[1]);
            }
            if (!line.continuousFill) {
                this.canvasRender.fill();
            }
        };
        Main_View.prototype.drawVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
            this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
            for (var pointIndex = startIndex; pointIndex <= endIndex;) {
                // search first visible point
                var segmentStartIndex = -1;
                for (var index = pointIndex; index <= endIndex; index++) {
                    var point = line.points[index];
                    var isNotDeleted = (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete);
                    var lineWidth = (useAdjustingLocation ? point.adjustingLineWidth : point.lineWidth);
                    var isVisibleWidth = (lineWidth > 0.0);
                    if (isNotDeleted && isVisibleWidth) {
                        segmentStartIndex = index;
                        break;
                    }
                }
                if (segmentStartIndex == -1) {
                    break;
                }
                var firstPoint = line.points[segmentStartIndex];
                var currentLineWidth = this.lineWidthAdjust(useAdjustingLocation ? firstPoint.adjustingLineWidth : firstPoint.lineWidth);
                // search end index of the segment
                var segmentEndIndex = segmentStartIndex;
                for (var index = segmentStartIndex + 1; index <= endIndex; index++) {
                    var point = line.points[index];
                    var isNotDeleted = (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete);
                    var lineWidth = this.lineWidthAdjust(useAdjustingLocation ? point.adjustingLineWidth : point.lineWidth);
                    var isVisibleWidth = (lineWidth > 0.0);
                    var isSameLineWidth = (lineWidth == currentLineWidth);
                    segmentEndIndex = index;
                    if (isNotDeleted && isVisibleWidth && isSameLineWidth) {
                        continue;
                    }
                    else {
                        break;
                    }
                }
                if (segmentEndIndex == segmentStartIndex) {
                    break;
                }
                // draw segment
                this.canvasRender.beginPath();
                this.canvasRender.setStrokeWidth(currentLineWidth);
                var firstLocaton = (useAdjustingLocation ? firstPoint.adjustingLocation : firstPoint.location);
                this.canvasRender.moveTo(firstLocaton[0], firstLocaton[1]);
                for (var index = segmentStartIndex + 1; index <= segmentEndIndex; index++) {
                    var point = line.points[index];
                    var location_2 = (useAdjustingLocation ? point.adjustingLocation : point.location);
                    this.canvasRender.lineTo(location_2[0], location_2[1]);
                }
                this.canvasRender.stroke();
                // next step
                pointIndex = segmentEndIndex;
            }
        };
        Main_View.prototype.drawVectorLinePoint = function (point, color, useAdjustingLocation) {
            var viewScale = this.canvasRender.getViewScale();
            this.canvasRender.beginPath();
            var radius = this.drawStyle.generalLinePointRadius / viewScale;
            if (point.isSelected) {
                radius = this.drawStyle.selectedLinePointRadius / viewScale;
                this.canvasRender.setStrokeColorV(this.drawStyle.selectedVectorLineColor);
                this.canvasRender.setFillColorV(this.drawStyle.selectedVectorLineColor);
            }
            else {
                this.canvasRender.setStrokeColorV(color);
                this.canvasRender.setFillColorV(color);
            }
            if (useAdjustingLocation) {
                this.canvasRender.circle(point.adjustingLocation[0], point.adjustingLocation[1], radius);
            }
            else {
                this.canvasRender.circle(point.location[0], point.location[1], radius);
            }
            this.canvasRender.fill();
        };
        Main_View.prototype.drawEditLineStroke = function (line) {
            this.drawVectorLineStroke(line, this.drawStyle.editingLineColor, this.getCurrentViewScaleLineWidth(3.0), false);
        };
        Main_View.prototype.drawEditLinePoints = function (canvasWindow, line, color) {
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, color, false);
            }
        };
        Main_View.prototype.getCurrentViewScaleLineWidth = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        Main_View.prototype.getViewScaledSize = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        Main_View.prototype.drawImageFileReferenceLayer = function (layer) {
            if (layer.imageResource == null
                || layer.imageResource.image == null
                || layer.imageResource.image.imageData == null) {
                return;
            }
            var image = layer.imageResource.image.imageData;
            var isModal = this.isModalToolRunning();
            var location = (isModal ? layer.adjustingLocation : layer.location);
            var rotation = (isModal ? layer.adjustingRotation[0] : layer.rotation[0]);
            var scale = (isModal ? layer.adjustingScale : layer.scale);
            mat4.identity(this.tempMat4);
            mat4.translate(this.tempMat4, this.tempMat4, location);
            mat4.rotateZ(this.tempMat4, this.tempMat4, rotation);
            mat4.scale(this.tempMat4, this.tempMat4, scale);
            this.canvasRender.setLocalTransForm(this.tempMat4);
            this.canvasRender.setGlobalAlpha(layer.layerColor[3]);
            this.canvasRender.drawImage(image, 0.0, 0.0, image.width, image.height, 0.0, 0.0, image.width, image.height);
            this.canvasRender.cancelLocalTransForm();
            this.canvasRender.setGlobalAlpha(1.0);
        };
        Main_View.prototype.layerPicking = function (canvasWindow, pickLocationX, pickLocationY) {
            if (this.layerWindowItems == null || this.currentKeyframe == null) {
                return null;
            }
            var documentData = this.toolContext.document;
            var viewKeyframe = this.currentKeyframe;
            var pickedLayer = null;
            for (var _i = 0, _a = viewKeyframe.layers; _i < _a.length; _i++) {
                var viewKeyframeLayer = _a[_i];
                var layer = viewKeyframeLayer.layer;
                if (!layer.isVisible || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    continue;
                }
                var vectorLayer = layer;
                this.clearWindow(canvasWindow);
                this.canvasRender.setContext(canvasWindow);
                this.drawVectorLayer(vectorLayer, viewKeyframeLayer.vectorLayerKeyframe.geometry, documentData);
                this.canvasRender.pickColor(this.tempColor4, canvasWindow, pickLocationX, pickLocationY);
                if (this.tempColor4[3] > 0.0) {
                    pickedLayer = layer;
                    this.setCurrentLayer(layer);
                    this.toolEnv.setRedrawLayerWindow();
                    break;
                }
            }
            this.drawMainWindow(this.mainWindow);
            return pickedLayer;
        };
        Main_View.prototype.startShowingCurrentLayer = function () {
            this.selectCurrentLayerAnimationTime = this.selectCurrentLayerAnimationTimeMax;
            this.toolEnv.setRedrawMainWindow();
            var layerWindow = this.layerWindow;
            var item = this.findCurrentLayerLayerWindowItem();
            if (item != null) {
                var viewTop = layerWindow.viewLocation[1];
                if (item.top < viewTop + layerWindow.layerItemHeight * 2.0) {
                    layerWindow.viewLocation[1] = item.top - layerWindow.layerItemHeight * 2.0;
                }
                else if (item.top > viewTop + layerWindow.height - layerWindow.layerItemHeight * 2.0) {
                    layerWindow.viewLocation[1] = item.top - layerWindow.height + layerWindow.layerItemHeight * 2.0;
                }
            }
        };
        // Editor window drawing
        Main_View.prototype.drawEditorWindow = function (editorWindow, mainWindow) {
            var context = this.toolContext;
            mainWindow.updateViewMatrix();
            mainWindow.copyTransformTo(editorWindow);
            this.canvasRender.setContext(editorWindow);
            if (this.toolEnv.needsDrawOperatorCursor()) {
                this.drawOperatorCursor();
            }
            if (this.toolEnv.isEditMode()) {
                this.drawMouseCursor();
            }
            if (this.toolEnv.isDrawMode()) {
                if (this.currentTool == this.tool_DrawLine) {
                    if (this.tool_DrawLine.editLine != null) {
                        this.drawEditLineStroke(this.tool_DrawLine.editLine);
                    }
                }
                else if (context.mainToolID == ManualTracingTool.MainToolID.posing) {
                    //for (let subtool of this.mainTools[<int>MainToolID.posing].subTools) {
                    //    let posingTools = <Tool_Posing3d_ToolBase>subtool;
                    //    if (posingTools.editLine != null) {
                    //        this.drawRawLine(editorWindow, posingTools.editLine);
                    //    }
                    //}
                    if (this.currentTool == this.tool_Posing3d_LocateHead
                        && this.tool_Posing3d_LocateHead.editLine != null) {
                        this.drawEditLineStroke(this.tool_Posing3d_LocateHead.editLine);
                    }
                }
            }
            if (this.currentTool != null) {
                this.toolEnv.updateContext();
                this.toolDrawEnv.setVariables(editorWindow);
                this.currentTool.onDrawEditor(this.toolEnv, this.toolDrawEnv);
            }
        };
        Main_View.prototype.drawOperatorCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            var viewScale = this.getViewScaledSize(1.0);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled);
            this.canvasRender.circle(this.toolContext.operatorCursor.location[0], this.toolContext.operatorCursor.location[1], this.toolContext.operatorCursor.radius * viewScale);
            this.canvasRender.stroke();
            var centerX = this.toolContext.operatorCursor.location[0];
            var centerY = this.toolContext.operatorCursor.location[1];
            var clossBeginPosition = this.toolContext.operatorCursor.radius * viewScale * 1.5;
            var clossEndPosition = this.toolContext.operatorCursor.radius * viewScale * 0.5;
            this.canvasRender.drawLine(centerX - clossBeginPosition, centerY, centerX - clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX + clossBeginPosition, centerY, centerX + clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX, centerY - clossBeginPosition, centerX, centerY - clossEndPosition);
            this.canvasRender.drawLine(centerX, centerY + clossBeginPosition, centerX, centerY + clossEndPosition);
            this.canvasRender.setLineDash(this.operatorCurosrLineDashNone);
        };
        // MainEditorDrawer implementations
        Main_View.prototype.drawMouseCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.mainWindow.toolMouseEvent.location[0], this.mainWindow.toolMouseEvent.location[1], this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius));
            this.canvasRender.stroke();
        };
        Main_View.prototype.drawEditorEditLineStroke = function (line) {
            this.drawEditLineStroke(line);
        };
        Main_View.prototype.drawEditorVectorLineStroke = function (line, color, strokeWidth, useAdjustingLocation) {
            this.drawVectorLineStroke(line, color, strokeWidth, useAdjustingLocation);
        };
        Main_View.prototype.drawEditorVectorLinePoints = function (line, color, useAdjustingLocation) {
            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        };
        Main_View.prototype.drawEditorVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
            this.drawVectorLineSegment(line, startIndex, endIndex, useAdjustingLocation);
        };
        // WebGL window drawing
        Main_View.prototype.drawWebGLWindow = function (mainWindow, webglWindow, pickingWindow) {
            var env = this.toolEnv;
            this.webGLRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.clear(env);
            if (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing) {
                var posingLayer = env.currentPosingLayer;
                this.posing3dView.prepareDrawingStructures(posingLayer);
                this.posing3dView.drawPickingImage(posingLayer, env);
                mainWindow.copyTransformTo(pickingWindow);
                pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
                pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);
                this.posing3dView.clear(env);
                this.posing3dView.drawManipulaters(posingLayer, env);
            }
            for (var index = this.layerWindowItems.length - 1; index >= 0; index--) {
                var item = this.layerWindowItems[index];
                if (item.layer.type != ManualTracingTool.LayerTypeID.posingLayer) {
                    continue;
                }
                var posingLayer = item.layer;
                this.posing3dView.prepareDrawingStructures(posingLayer);
                this.posing3dView.drawPosingModel(posingLayer, env);
            }
        };
        // Layer window operation
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
        Main_View.prototype.layerWindow_UnselectAllLayer = function () {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.layer.isSelected = false;
            }
        };
        Main_View.prototype.collectLayerWindowButtons = function () {
            this.layerWindowButtons = new List();
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.addLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.deleteLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveUp));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveDown));
        };
        Main_View.prototype.collectLayerWindowItems = function () {
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
        Main_View.prototype.caluculateLayerWindowLayout = function (layerWindow) {
            // layer item buttons
            this.layerWindowLayoutArea.copyRectangle(layerWindow);
            this.layerWindowLayoutArea.bottom = layerWindow.height - 1.0;
            this.caluculateLayerWindowLayout_LayerButtons(layerWindow, this.layerWindowLayoutArea);
            if (this.layerWindowButtons.length > 0) {
                var lastButton = this.layerWindowButtons[this.layerWindowButtons.length - 1];
                this.layerWindowLayoutArea.top = lastButton.getHeight() + 1.0; // lastButton.bottom + 1.0;
            }
            // layer items
            this.caluculateLayerWindowLayout_LayerWindowItem(layerWindow, this.layerWindowLayoutArea);
        };
        Main_View.prototype.caluculateLayerWindowLayout_LayerButtons = function (layerWindow, layoutArea) {
            var currentX = layoutArea.left;
            var currentY = layerWindow.viewLocation[1]; // layoutArea.top;
            var unitWidth = layerWindow.layerItemButtonWidth * layerWindow.layerItemButtonScale;
            var unitHeight = layerWindow.layerItemButtonHeight * layerWindow.layerItemButtonScale;
            for (var _i = 0, _a = this.layerWindowButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                button.left = currentX;
                button.right = currentX + unitWidth - 1;
                button.top = currentY;
                button.bottom = currentY + unitHeight - 1;
                currentX += unitWidth;
                layerWindow.layerItemButtonButtom = button.bottom + 1.0;
            }
        };
        Main_View.prototype.caluculateLayerWindowLayout_LayerWindowItem = function (layerWindow, layoutArea) {
            var currentY = layoutArea.top;
            var itemHeight = layerWindow.layerItemHeight;
            var margine = itemHeight * 0.1;
            var iconWidth = (itemHeight - margine * 2);
            var textLeftMargin = itemHeight * 0.3;
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
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
        };
        Main_View.prototype.drawLayerWindow = function (layerWindow) {
            this.canvasRender.setContext(layerWindow);
            this.drawLayerWindow_LayerItems(layerWindow);
            this.drawLayerWindow_LayerWindowButtons(layerWindow);
        };
        Main_View.prototype.drawLayerWindow_LayerWindowButtons = function (layerWindow) {
            this.caluculateLayerWindowLayout_LayerButtons(layerWindow, this.layerWindowLayoutArea);
            if (this.layerWindowButtons.length > 0) {
                var button = this.layerWindowButtons[0];
                this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
                this.canvasRender.fillRect(0.0, button.top, layerWindow.width - 1, button.getHeight());
            }
            for (var _i = 0, _a = this.layerWindowButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                this.drawLayerWindow_LayerWindowButton(button);
            }
        };
        Main_View.prototype.drawLayerWindow_LayerWindowButton = function (button) {
            var srcWidth = 64.0;
            var srcHeight = 64.0;
            var srcX = 0.0;
            var srcY = (button.buttonID - 1) * srcHeight;
            var dstX = button.left;
            var dstY = button.top;
            var scale = 1.0;
            var dstWidth = button.getWidth() * scale;
            var dstHeight = button.getHeight() * scale;
            var srcImage = this.layerButtonImage;
            this.canvasRender.drawImage(srcImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
        };
        Main_View.prototype.drawLayerWindow_LayerItems = function (layerWindow) {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                this.drawLayerWindowItem(item, layerWindow.layerItemFontSize);
            }
        };
        Main_View.prototype.drawLayerWindowItem = function (item, fontSize) {
            var layer = item.layer;
            var left = item.left;
            var top = item.top;
            var bottom = item.bottom;
            var itemWidth = item.getWidth();
            var itemHeight = item.getHeight();
            var bottomMargin = itemHeight * 0.3;
            var depthOffset = 10.0 * item.hierarchyDepth;
            if (layer.isSelected) {
                this.canvasRender.setFillColorV(this.layerWindowItemSelectedColor);
            }
            else {
                this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
            }
            this.canvasRender.fillRect(left, top, itemWidth, itemHeight);
            // Visible/Unvisible icon
            var srcImage = this.systemImage.image;
            var iconIndex = (item.layer.isVisible ? 0.0 : 1.0);
            var srcWidth = srcImage.width * 0.125;
            var srcHeight = srcImage.height * 0.125;
            var srcX = srcWidth * iconIndex;
            var srcY = srcImage.height * 0.25;
            var dstX = item.marginLeft;
            var dstY = top + item.marginTop;
            var dstWidth = item.visibilityIconWidth;
            var dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeigh);
            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
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
        Main_View.prototype.subtoolWindow_Draw = function (subtoolWindow) {
            this.canvasRender.setContext(subtoolWindow);
            var context = this.toolContext;
            var currentMainTool = this.getCurrentMainTool();
            var scale = subtoolWindow.subToolItemScale;
            var fullWidth = subtoolWindow.width - 1;
            var unitWidth = subtoolWindow.subToolItemUnitWidth;
            var unitHeight = subtoolWindow.subToolItemUnitHeight;
            var lastY = 0.0;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                var tool = viewItem.tool;
                var srcImage = tool.toolBarImage;
                if (srcImage == null) {
                    continue;
                }
                var srcY = tool.toolBarImageIndex * unitHeight;
                var dstY = viewItem.top;
                // Draw subtool image
                if (tool == this.currentTool) {
                    this.canvasRender.setFillColorV(this.subToolItemSelectedColor);
                }
                else {
                    this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
                }
                this.canvasRender.fillRect(0, dstY, fullWidth, unitHeight * scale);
                if (tool.isAvailable(this.toolEnv)) {
                    this.canvasRender.setGlobalAlpha(1.0);
                }
                else {
                    this.canvasRender.setGlobalAlpha(0.5);
                }
                this.canvasRender.drawImage(srcImage.image.imageData, 0, srcY, unitWidth, unitHeight, 0, dstY, unitWidth * scale, unitHeight * scale);
                // Draw subtool option buttons
                for (var _b = 0, _c = viewItem.buttons; _b < _c.length; _b++) {
                    var button = _c[_b];
                    var buttonWidth = 128 * scale;
                    var buttonHeight = 128 * scale;
                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;
                    var inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == ManualTracingTool.InputSideID.front) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 0, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == ManualTracingTool.InputSideID.back) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 128, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                }
                this.canvasRender.setStrokeWidth(0.0);
                this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                this.canvasRender.drawLine(0, dstY, fullWidth, dstY);
                lastY = dstY + unitHeight * scale;
            }
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
        };
        // TimeLine window drawing
        Main_View.prototype.drawTimeLineWindow = function (wnd) {
            var context = this.toolContext;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            var left = wnd.getTimeLineLeft();
            var right = wnd.getTimeLineRight();
            var bottom = wnd.height;
            var frameUnitWidth = wnd.getFrameUnitWidth(aniSetting);
            var frameNumberHeight = 16.0;
            var frameLineBottom = wnd.height - 1.0 - frameNumberHeight;
            var frameLineHeight = 10.0;
            var secondFrameLineHeight = 30.0;
            // Control buttons
            {
                var srcX = 0;
                var srcY = 196;
                var srcW = 128;
                var srcH = 128;
                var dstW = 45;
                var dstH = 45;
                var dstX = left / 2 - dstW / 2 + 1;
                var dstY = wnd.height / 2 - dstH / 2 + 1;
                if (context.animationPlaying) {
                    srcX = 128;
                }
                this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
            }
            // Current frame
            var currentFrameX = left - aniSetting.timeLineWindowViewLocationX + aniSetting.currentTimeFrame * frameUnitWidth;
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineCurrentFrameColor);
            this.canvasRender.fillRect(currentFrameX, 0.0, frameUnitWidth, bottom);
            //aniSetting.maxFrame = 60;
            //aniSetting.loopStartFrame = 10;
            //aniSetting.loopEndFrame = 24;
            // Document keyframes
            var minFrame = wnd.getFrameByLocation(left, aniSetting);
            if (minFrame < 0) {
                minFrame = 0;
            }
            var maxFrame = wnd.getFrameByLocation(right, aniSetting);
            if (maxFrame > aniSetting.maxFrame) {
                maxFrame = aniSetting.maxFrame;
            }
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineKeyFrameColor);
            for (var _i = 0, _a = this.viewLayerContext.keyframes; _i < _a.length; _i++) {
                var viewKeyframe = _a[_i];
                var frame = viewKeyframe.frame;
                if (frame < minFrame) {
                    continue;
                }
                if (frame > maxFrame) {
                    break;
                }
                var frameX = wnd.getFrameLocation(frame, aniSetting);
                this.canvasRender.fillRect(frameX, 0.0, frameUnitWidth - 1.0, frameLineBottom);
            }
            // Loop part
            this.canvasRender.setFillColorV(this.drawStyle.timeLineOutOfLoopingColor);
            {
                var frameX = wnd.getFrameLocation(aniSetting.loopStartFrame, aniSetting);
                if (frameX > left) {
                    this.canvasRender.fillRect(left, 0.0, frameX - left, bottom);
                }
            }
            {
                var frameX = wnd.getFrameLocation(aniSetting.loopEndFrame, aniSetting);
                if (frameX < right) {
                    this.canvasRender.fillRect(frameX, 0.0, right - frameX, bottom);
                }
            }
            // Layer keyframes
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineLayerKeyFrameColor);
            if (env.currentVectorLayer != null) {
                var viewKeyFrame = this.findViewKeyFrame(aniSetting.currentTimeFrame);
                var layerIndex = -1;
                if (viewKeyFrame != null) {
                    layerIndex = this.findViewKeyframeLayerIndex(viewKeyFrame, env.currentVectorLayer);
                }
                if (layerIndex != -1) {
                    for (var _b = 0, _c = this.viewLayerContext.keyframes; _b < _c.length; _b++) {
                        var viewKeyframe = _c[_b];
                        var frame = viewKeyframe.frame;
                        if (frame < minFrame) {
                            continue;
                        }
                        if (frame > maxFrame) {
                            break;
                        }
                        var viewKeyFrameLayer = viewKeyframe.layers[layerIndex];
                        if (viewKeyFrameLayer.vectorLayerKeyframe.frame == frame) {
                            var frameX = wnd.getFrameLocation(frame, aniSetting);
                            this.canvasRender.fillRect(frameX + 2.0, 0.0, frameUnitWidth - 5.0, frameLineBottom);
                        }
                    }
                }
            }
            // Left panel
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setStrokeColorV(this.drawStyle.timeLineUnitFrameColor);
            this.canvasRender.drawLine(left, 0.0, left, wnd.height);
            // Frame measure
            {
                var x = left;
                for (var frame = minFrame; frame <= maxFrame; frame++) {
                    if (frame % aniSetting.animationFrameParSecond == 0 || frame == maxFrame) {
                        this.canvasRender.drawLine(x, frameLineBottom - secondFrameLineHeight, x, frameLineBottom);
                    }
                    this.canvasRender.drawLine(x, frameLineBottom - frameLineHeight, x, frameLineBottom);
                    x += frameUnitWidth;
                }
            }
            this.canvasRender.drawLine(left, frameLineBottom, right, frameLineBottom);
        };
        Main_View.prototype.drawPalletColorMixer = function (wnd) {
            var width = wnd.width;
            var height = wnd.height;
            var left = 0.0;
            var top = 0.0;
            var right = width - 1.0;
            var bottom = height - 1.0;
            var minRadius = 10.0;
            var maxRadius = width * 1.0;
            this.canvasRender.setContext(wnd);
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
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
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
            var division = 50.0;
            var unitWidth = width / division;
            var unitHeight = height / division;
            for (var x = 0.0; x < 1.0; x += (1.0 / division)) {
                for (var y = 0.0; y < 1.0; y += (1.0 / division)) {
                    var h = x;
                    var s = 0.0;
                    var v = 0.0;
                    if (y <= 0.5) {
                        s = y * 2.0;
                        v = 1.0;
                    }
                    else {
                        s = 1.0;
                        v = 1.0 - (y - 0.5) * 2.0;
                    }
                    ManualTracingTool.Maths.hsvToRGBVec4(this.tempColor4, h, s, v);
                    this.tempColor4[3] = 1.0;
                    this.canvasRender.setFillColorV(this.tempColor4);
                    this.canvasRender.fillRect(x * width, y * height, unitWidth, unitHeight);
                }
            }
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
        };
        // Header window drawing
        Main_View.prototype.updateHeaderButtons = function () {
            {
                var isButtonON = (this.toolContext.editMode == ManualTracingTool.EditModeID.drawMode
                    && (this.toolContext.mainToolID == ManualTracingTool.MainToolID.drawLine
                        || this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing));
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
        Main_View.prototype.updateHdeaderDocumentFileName = function () {
            var filePath = window.localStorage.getItem(this.lastFilePathKey);
            this.setInputElementText(this.ID.fileName, filePath);
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
        // UI management
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
        // Selection management
        Main_View.prototype.mousemoveHittest = function (x, y, minDistance) {
            this.hittest_Line_IsCloseTo.startProcess();
            if (this.toolEnv.currentVectorGeometry != null) {
                this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorGeometry, x, y, minDistance);
            }
            this.hittest_Line_IsCloseTo.endProcess();
            return this.hittest_Line_IsCloseTo.isChanged;
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
        Main_View.prototype.getInputElementNumber = function (id) {
            var element = (document.getElementById(id));
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
            _this.layerItemButtonScale = 0.375;
            _this.layerItemButtonWidth = 64.0;
            _this.layerItemButtonHeight = 64.0;
            _this.layerItemButtonButtom = 64.0;
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
    var DrawLineToolSubToolID;
    (function (DrawLineToolSubToolID) {
        DrawLineToolSubToolID[DrawLineToolSubToolID["drawLine"] = 0] = "drawLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["scratchLine"] = 2] = "scratchLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["deletePointBrush"] = 1] = "deletePointBrush";
    })(DrawLineToolSubToolID = ManualTracingTool.DrawLineToolSubToolID || (ManualTracingTool.DrawLineToolSubToolID = {}));
    var EditModeSubToolID;
    (function (EditModeSubToolID) {
        EditModeSubToolID[EditModeSubToolID["mainEditTool"] = 0] = "mainEditTool";
    })(EditModeSubToolID = ManualTracingTool.EditModeSubToolID || (ManualTracingTool.EditModeSubToolID = {}));
    var ModalToolID;
    (function (ModalToolID) {
        ModalToolID[ModalToolID["none"] = 0] = "none";
        ModalToolID[ModalToolID["grabMove"] = 1] = "grabMove";
        ModalToolID[ModalToolID["ratate"] = 2] = "ratate";
        ModalToolID[ModalToolID["scale"] = 3] = "scale";
        ModalToolID[ModalToolID["latticeMove"] = 4] = "latticeMove";
        ModalToolID[ModalToolID["countOfID"] = 5] = "countOfID";
    })(ModalToolID = ManualTracingTool.ModalToolID || (ManualTracingTool.ModalToolID = {}));
    var ViewKeyframeLayer = /** @class */ (function () {
        function ViewKeyframeLayer() {
            this.layer = null;
            this.vectorLayerKeyframe = null;
        }
        ViewKeyframeLayer.prototype.hasKeyframe = function () {
            return (this.vectorLayerKeyframe != null);
        };
        return ViewKeyframeLayer;
    }());
    ManualTracingTool.ViewKeyframeLayer = ViewKeyframeLayer;
    var ViewKeyFrame = /** @class */ (function () {
        function ViewKeyFrame() {
            this.frame = 0;
            this.layers = new List();
        }
        return ViewKeyFrame;
    }());
    ManualTracingTool.ViewKeyFrame = ViewKeyFrame;
    var ViewLayerContext = /** @class */ (function () {
        function ViewLayerContext() {
            this.keyframes = null;
        }
        return ViewLayerContext;
    }());
    ManualTracingTool.ViewLayerContext = ViewLayerContext;
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
            this.menu_btnDrawTool = 'menu_btnDrawTool';
            this.menu_btnMiscTool = 'menu_btnMiscTool';
            this.menu_btnEditTool = 'menu_btnEditTool';
            this.menu_btnOperationOption = 'menu_btnOperationOption';
            this.menu_btnOpen = 'menu_btnOpen';
            this.menu_btnSave = 'menu_btnSave';
            this.menu_btnExport = 'menu_btnExport';
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
            this.documentSettingModal_FrameLeft = 'documentSettingModal_FrameLeft';
            this.documentSettingModal_FrameTop = 'documentSettingModal_FrameTop';
            this.documentSettingModal_FrameRight = 'documentSettingModal_FrameRight';
            this.documentSettingModal_FrameBottom = 'documentSettingModal_FrameBottom';
            this.exportImageFileModal = '#exportImageFileModal';
            this.exportImageFileModal_fileName = 'exportImageFileModal_fileName';
            this.exportImageFileModal_imageFileType = 'exportImageFileModal_imageFileType';
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
