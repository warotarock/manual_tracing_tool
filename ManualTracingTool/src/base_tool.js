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
    var MainToolID;
    (function (MainToolID) {
        MainToolID[MainToolID["none"] = 0] = "none";
        MainToolID[MainToolID["drawLine"] = 1] = "drawLine";
        MainToolID[MainToolID["scratchLine"] = 2] = "scratchLine";
        MainToolID[MainToolID["posing"] = 3] = "posing";
    })(MainToolID = ManualTracingTool.MainToolID || (ManualTracingTool.MainToolID = {}));
    var OperationUnitID;
    (function (OperationUnitID) {
        OperationUnitID[OperationUnitID["none"] = 0] = "none";
        OperationUnitID[OperationUnitID["linePoint"] = 1] = "linePoint";
        OperationUnitID[OperationUnitID["lineSegment"] = 2] = "lineSegment";
        OperationUnitID[OperationUnitID["line"] = 3] = "line";
        OperationUnitID[OperationUnitID["layer"] = 4] = "layer";
        OperationUnitID[OperationUnitID["countOfID"] = 5] = "countOfID";
    })(OperationUnitID = ManualTracingTool.OperationUnitID || (ManualTracingTool.OperationUnitID = {}));
    var Posing3DSubToolID;
    (function (Posing3DSubToolID) {
        Posing3DSubToolID[Posing3DSubToolID["locateHead"] = 0] = "locateHead";
        Posing3DSubToolID[Posing3DSubToolID["rotateHead"] = 1] = "rotateHead";
        Posing3DSubToolID[Posing3DSubToolID["locateBody"] = 2] = "locateBody";
        Posing3DSubToolID[Posing3DSubToolID["rotateBody"] = 3] = "rotateBody";
        Posing3DSubToolID[Posing3DSubToolID["locateRightArm1"] = 4] = "locateRightArm1";
        Posing3DSubToolID[Posing3DSubToolID["locateRightArm2"] = 5] = "locateRightArm2";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftArm1"] = 6] = "locateLeftArm1";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftArm2"] = 7] = "locateLeftArm2";
        Posing3DSubToolID[Posing3DSubToolID["locateRightLeg1"] = 8] = "locateRightLeg1";
        Posing3DSubToolID[Posing3DSubToolID["locateRightLeg2"] = 9] = "locateRightLeg2";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftLeg1"] = 10] = "locateLeftLeg1";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftLeg2"] = 11] = "locateLeftLeg2";
        Posing3DSubToolID[Posing3DSubToolID["twistHead"] = 12] = "twistHead";
    })(Posing3DSubToolID = ManualTracingTool.Posing3DSubToolID || (ManualTracingTool.Posing3DSubToolID = {}));
    var EditModeID;
    (function (EditModeID) {
        EditModeID[EditModeID["selectMode"] = 1] = "selectMode";
        EditModeID[EditModeID["drawMode"] = 2] = "drawMode";
    })(EditModeID = ManualTracingTool.EditModeID || (ManualTracingTool.EditModeID = {}));
    var OpenFileDialogTargetID;
    (function (OpenFileDialogTargetID) {
        OpenFileDialogTargetID[OpenFileDialogTargetID["none"] = 0] = "none";
        OpenFileDialogTargetID[OpenFileDialogTargetID["openDocument"] = 1] = "openDocument";
        OpenFileDialogTargetID[OpenFileDialogTargetID["saveDocument"] = 2] = "saveDocument";
        OpenFileDialogTargetID[OpenFileDialogTargetID["imageFileReferenceLayerFilePath"] = 3] = "imageFileReferenceLayerFilePath";
    })(OpenFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID || (ManualTracingTool.OpenFileDialogTargetID = {}));
    var PickingWindow = /** @class */ (function (_super) {
        __extends(PickingWindow, _super);
        function PickingWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxDepth = 4.0;
            return _this;
        }
        return PickingWindow;
    }(ManualTracingTool.CanvasWindow));
    ManualTracingTool.PickingWindow = PickingWindow;
    var OperatorCursor = /** @class */ (function () {
        function OperatorCursor() {
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.radius = 15.0;
        }
        return OperatorCursor;
    }());
    ManualTracingTool.OperatorCursor = OperatorCursor;
    var ToolContext = /** @class */ (function () {
        function ToolContext() {
            this.mainEditor = null;
            this.mainToolID = MainToolID.none;
            this.subToolIndex = 0;
            this.editMode = EditModeID.drawMode;
            this.operationUnitID = OperationUnitID.linePoint;
            this.drawLineBaseWidth = 1.0;
            this.drawLineMinWidth = 0.1;
            this.commandHistory = null;
            this.document = null;
            this.currentLayer = null;
            this.currentVectorLayer = null;
            this.currentVectorGroup = null;
            this.currentVectorLine = null;
            this.currentPosingLayer = null;
            this.currentPosingModel = null;
            this.currentPosingData = null;
            this.currentImageFileReferenceLayer = null;
            this.redrawMainWindow = false;
            this.redrawEditorWindow = false;
            this.redrawLayerWindow = false;
            this.redrawSubtoolWindow = false;
            this.updateLayerWindowItems = false;
            this.redrawWebGLWindow = false;
            this.redrawHeaderWindow = false;
            this.redrawFooterWindow = false;
            this.mainWindow = null;
            this.pickingWindow = null;
            this.mouseCursorRadius = 20.0;
            this.resamplingUnitLength = 12.0;
            this.operatorCursor = new OperatorCursor();
            this.shiftKey = false;
            this.altKey = false;
            this.ctrlKey = false;
            this.posing3DView = null;
            this.posing3DLogic = null;
        }
        return ToolContext;
    }());
    ManualTracingTool.ToolContext = ToolContext;
    var ToolEnvironment = /** @class */ (function () {
        function ToolEnvironment(toolContext) {
            this.toolContext = null;
            this.mainToolID = MainToolID.posing;
            this.subToolIndex = 0;
            this.editMode = EditModeID.drawMode;
            this.operationUnitID = OperationUnitID.linePoint;
            this.commandHistory = null;
            this.operatorCursor = null;
            this.document = null;
            this.drawLineBaseWidth = 1.0;
            this.drawLineMinWidth = 1.0;
            this.currentVectorLayer = null;
            this.currentVectorGroup = null;
            this.currentVectorLine = null;
            this.currentPosingLayer = null;
            this.currentPosingModel = null;
            this.currentPosingData = null;
            this.currentImageFileReferenceLayer = null;
            this.mainWindow = null;
            this.pickingWindow = null;
            this.posing3DView = null;
            this.posing3DLogic = null;
            this.mouseCursorViewRadius = 0.0;
            this.mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.viewScale = 0.0;
            this.toolContext = toolContext;
        }
        ToolEnvironment.prototype.updateContext = function () {
            this.mainToolID = this.toolContext.mainToolID;
            this.subToolIndex = this.toolContext.subToolIndex;
            this.editMode = this.toolContext.editMode;
            this.operationUnitID = this.toolContext.operationUnitID;
            this.commandHistory = this.toolContext.commandHistory;
            this.operatorCursor = this.toolContext.operatorCursor;
            this.document = this.toolContext.document;
            this.drawLineBaseWidth = this.toolContext.drawLineBaseWidth;
            this.drawLineMinWidth = this.toolContext.drawLineMinWidth;
            this.currentVectorLayer = this.toolContext.currentVectorLayer;
            this.currentVectorGroup = this.toolContext.currentVectorGroup;
            this.currentVectorLine = this.toolContext.currentVectorLine;
            if (this.toolContext.currentVectorLine != null) {
                if (this.toolContext.currentVectorLine.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.delete) {
                    this.toolContext.currentVectorLine = null;
                    this.currentVectorLine = null;
                }
            }
            this.currentPosingLayer = this.toolContext.currentPosingLayer;
            this.currentPosingModel = this.toolContext.currentPosingModel;
            this.currentPosingData = this.toolContext.currentPosingData;
            this.currentImageFileReferenceLayer = this.toolContext.currentImageFileReferenceLayer;
            this.mainWindow = this.toolContext.mainWindow;
            this.pickingWindow = this.toolContext.pickingWindow;
            this.posing3DView = this.toolContext.posing3DView;
            this.posing3DLogic = this.toolContext.posing3DLogic;
            this.viewScale = this.toolContext.mainWindow.viewScale;
            this.mouseCursorViewRadius = this.getViewScaledLength(this.toolContext.mouseCursorRadius);
        };
        ToolEnvironment.prototype.setRedrawMainWindow = function () {
            this.toolContext.redrawMainWindow = true;
        };
        ToolEnvironment.prototype.setRedrawEditorWindow = function () {
            this.toolContext.redrawEditorWindow = true;
        };
        ToolEnvironment.prototype.setRedrawLayerWindow = function () {
            this.toolContext.redrawLayerWindow = true;
        };
        ToolEnvironment.prototype.setUpadateLayerWindowItems = function () {
            this.toolContext.updateLayerWindowItems = true;
            this.toolContext.redrawLayerWindow = true;
        };
        ToolEnvironment.prototype.setRedrawSubtoolWindow = function () {
            this.toolContext.redrawSubtoolWindow = true;
        };
        ToolEnvironment.prototype.setRedrawMainWindowEditorWindow = function () {
            this.setRedrawMainWindow();
            this.setRedrawEditorWindow();
            this.setRedrawWebGLWindow();
        };
        ToolEnvironment.prototype.setRedrawAllWindows = function () {
            this.setRedrawMainWindowEditorWindow();
            this.setUpadateLayerWindowItems();
            this.setRedrawSubtoolWindow();
        };
        ToolEnvironment.prototype.setRedrawWebGLWindow = function () {
            this.toolContext.redrawWebGLWindow = true;
        };
        ToolEnvironment.prototype.isAnyModifierKeyPressing = function () {
            return (this.toolContext.shiftKey || this.toolContext.altKey || this.toolContext.ctrlKey);
        };
        ToolEnvironment.prototype.isShiftKeyPressing = function () {
            return (this.toolContext.shiftKey);
        };
        ToolEnvironment.prototype.isCtrlKeyPressing = function () {
            return (this.toolContext.ctrlKey);
        };
        ToolEnvironment.prototype.isAltKeyPressing = function () {
            return (this.toolContext.altKey);
        };
        ToolEnvironment.prototype.isDrawMode = function () {
            return (this.toolContext.editMode == EditModeID.drawMode);
        };
        ToolEnvironment.prototype.isSelectMode = function () {
            return (this.toolContext.editMode == EditModeID.selectMode);
        };
        ToolEnvironment.prototype.isCurrentLayerVectorLayer = function () {
            return (this.currentVectorLayer != null);
        };
        ToolEnvironment.prototype.isCurrentLayerImageFileReferenceLayer = function () {
            return (this.currentImageFileReferenceLayer != null);
        };
        ToolEnvironment.prototype.needsDrawOperatorCursor = function () {
            return (this.isSelectMode() || this.isCurrentLayerImageFileReferenceLayer());
        };
        ToolEnvironment.prototype.setCurrentLayer = function (layer) {
            this.toolContext.mainEditor.setCurrentLayer(layer);
        };
        ToolEnvironment.prototype.setCurrentVectorLine = function (line, isEditTarget) {
            this.toolContext.currentVectorLine = line;
            this.currentVectorLine = line;
            this.currentVectorLine.isEditTarget = isEditTarget;
        };
        ToolEnvironment.prototype.startModalTool = function (modalTool) {
            this.toolContext.mainEditor.startModalTool(modalTool);
        };
        ToolEnvironment.prototype.endModalTool = function () {
            this.toolContext.mainEditor.endModalTool();
        };
        ToolEnvironment.prototype.cancelModalTool = function () {
            this.toolContext.mainEditor.cancelModalTool();
        };
        ToolEnvironment.prototype.isModalToolRunning = function () {
            return this.toolContext.mainEditor.isModalToolRunning();
        };
        ToolEnvironment.prototype.openFileDialog = function (targetID) {
            this.toolContext.mainEditor.openFileDialog(targetID);
        };
        ToolEnvironment.prototype.openDocumentSettingDialog = function () {
            this.toolContext.mainEditor.openDocumentSettingDialog();
        };
        ToolEnvironment.prototype.startLoadingCurrentDocumentResources = function () {
            this.toolContext.mainEditor.startLoadingDocumentResourcesProcess(this.toolContext.document);
        };
        ToolEnvironment.prototype.getViewScaledLength = function (length) {
            return length / this.viewScale;
        };
        return ToolEnvironment;
    }());
    ManualTracingTool.ToolEnvironment = ToolEnvironment;
    var ToolDrawingStyle = /** @class */ (function () {
        function ToolDrawingStyle() {
            this.linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
            this.sampledPointColor = vec4.fromValues(0.0, 0.5, 1.0, 1.0);
            this.extrutePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
            this.selectedVectorLineColor = vec4.fromValues(1.0, 0.5, 0.0, 0.8);
            this.linePointVisualBrightnessAdjustRate = 0.3;
            this.mouseCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
            this.operatorCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
            this.modalToolSelectedAreaLineColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
            this.generalLinePointRadius = 2.0;
            this.selectedLinePointRadius = 3.0;
            this.viewZoomAdjustingSpeedRate = 3.0;
        }
        return ToolDrawingStyle;
    }());
    ManualTracingTool.ToolDrawingStyle = ToolDrawingStyle;
    var ToolDrawingEnvironment = /** @class */ (function () {
        function ToolDrawingEnvironment() {
            this.canvasWindow = null;
            this.editorDrawer = null;
            this.render = null;
            this.style = null;
        }
        ToolDrawingEnvironment.prototype.setEnvironment = function (editorDrawer, render, style) {
            this.editorDrawer = editorDrawer;
            this.render = render;
            this.style = style;
        };
        ToolDrawingEnvironment.prototype.setVariables = function (canvasWindow) {
            this.canvasWindow = canvasWindow;
        };
        return ToolDrawingEnvironment;
    }());
    ManualTracingTool.ToolDrawingEnvironment = ToolDrawingEnvironment;
    var ToolMouseEvent = /** @class */ (function () {
        function ToolMouseEvent() {
            this.button = 0;
            this.buttons = 0;
            this.offsetX = 0.0;
            this.offsetY = 0.0;
            this.wheelDelta = 0.0;
            this.isMouseDragging = false;
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0);
            this.clickCount = 0;
            this.lastClickedOffset = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0);
            this.tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);
        }
        ToolMouseEvent.prototype.isLeftButtonPressing = function () {
            return (this.button == 0 && this.buttons != 0);
        };
        ToolMouseEvent.prototype.isRightButtonPressing = function () {
            return (this.button == 2 && this.buttons != 0);
        };
        ToolMouseEvent.prototype.isCenterButtonPressing = function () {
            return (this.button == 1 && this.buttons != 0);
        };
        ToolMouseEvent.prototype.isLeftButtonReleased = function () {
            return (this.buttons == 0);
        };
        ToolMouseEvent.prototype.isRightButtonReleased = function () {
            return (this.buttons == 0);
        };
        ToolMouseEvent.prototype.isCenterButtonReleased = function () {
            return (this.buttons == 0);
        };
        ToolMouseEvent.prototype.hundleDoubleClick = function (offsetX, offsetY) {
            var _this = this;
            if (this.clickCount == 0) {
                this.clickCount++;
                this.lastClickedOffset[0] = offsetX;
                this.lastClickedOffset[1] = offsetY;
                setTimeout(function () {
                    _this.clickCount = 0;
                }, 350);
                return false;
            }
            else {
                this.clickCount = 0;
                if (Math.pow(offsetX - this.lastClickedOffset[0], 2)
                    + Math.pow(offsetY - this.lastClickedOffset[1], 2) < 9.0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        };
        ToolMouseEvent.prototype.startMouseDragging = function () {
            this.isMouseDragging = true;
            vec3.copy(this.mouseDownLocation, this.location);
            vec3.set(this.mouseMovedVector, 0.0, 0.0, 0.0);
            vec3.set(this.mouseDownOffset, this.offsetX, this.offsetY, 0.0);
            vec3.set(this.mouseMovedOffset, 0.0, 0.0, 0.0);
        };
        ToolMouseEvent.prototype.processMouseDragging = function () {
            if (!this.isMouseDragging) {
                return;
            }
            vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.location);
            vec3.set(this.tempVec3, this.offsetX, this.offsetY, 0.0);
            vec3.subtract(this.mouseMovedOffset, this.mouseDownOffset, this.tempVec3);
        };
        ToolMouseEvent.prototype.endMouseDragging = function () {
            this.isMouseDragging = false;
        };
        return ToolMouseEvent;
    }());
    ManualTracingTool.ToolMouseEvent = ToolMouseEvent;
    var ToolBase = /** @class */ (function () {
        function ToolBase() {
            this.helpText = '';
            this.toolBarImage = null;
            this.toolBarImageIndex = 0;
        }
        ToolBase.prototype.isAvailable = function (env) {
            return true;
        };
        ToolBase.prototype.mouseDown = function (e, env) {
        };
        ToolBase.prototype.mouseMove = function (e, env) {
        };
        ToolBase.prototype.mouseUp = function (e, env) {
        };
        ToolBase.prototype.toolWindowItemClick = function (e, env) {
        };
        ToolBase.prototype.toolWindowItemDoubleClick = function (e, env) {
        };
        ToolBase.prototype.keydown = function (e, env) {
        };
        ToolBase.prototype.onDrawEditor = function (env, drawEnv) {
        };
        ToolBase.prototype.onOpenFile = function (filePath, env) {
        };
        return ToolBase;
    }());
    ManualTracingTool.ToolBase = ToolBase;
    var ModalToolBase = /** @class */ (function (_super) {
        __extends(ModalToolBase, _super);
        function ModalToolBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ModalToolBase.prototype.prepareModal = function (e, env) {
            return true;
        };
        ModalToolBase.prototype.startModal = function (env) {
            env.setRedrawEditorWindow();
        };
        ModalToolBase.prototype.endModal = function (env) {
            env.setRedrawEditorWindow();
        };
        ModalToolBase.prototype.cancelModal = function (env) {
            env.setRedrawMainWindowEditorWindow();
        };
        return ModalToolBase;
    }(ToolBase));
    ManualTracingTool.ModalToolBase = ModalToolBase;
    var MainTool = /** @class */ (function () {
        function MainTool() {
            this.mainToolID = MainToolID.none;
            this.subTools = new List();
            this.currentSubToolIndex = 0;
        }
        MainTool.prototype.id = function (mainToolID) {
            this.mainToolID = mainToolID;
            return this;
        };
        MainTool.prototype.subTool = function (tool, toolBarImage, toolBarImageIndex) {
            tool.toolBarImage = toolBarImage;
            tool.toolBarImageIndex = toolBarImageIndex;
            this.subTools.push(tool);
            return this;
        };
        return MainTool;
    }());
    ManualTracingTool.MainTool = MainTool;
})(ManualTracingTool || (ManualTracingTool = {}));
