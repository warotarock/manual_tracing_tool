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
    var ToolContext = /** @class */ (function () {
        function ToolContext() {
            this.mainEditor = null;
            this.mainToolID = MainToolID.none;
            this.subToolIndex = 0;
            this.editMode = EditModeID.drawMode;
            this.operationUnitID = OperationUnitID.linePoint;
            this.commandHistory = null;
            this.document = null;
            this.currentLayer = null;
            this.currentVectorLayer = null;
            this.currentVectorGroup = null;
            this.currentVectorLine = null;
            this.currentPosingLayer = null;
            this.currentPosingModel = null;
            this.currentPosingData = null;
            this.redrawMainWindow = false;
            this.redrawEditorWindow = false;
            this.redrawLayerWindow = false;
            this.updateLayerWindowItems = false;
            this.redrawWebGLWindow = false;
            this.redrawHeaderWindow = false;
            this.redrawFooterWindow = false;
            this.mainWindow = null;
            this.pickingWindow = null;
            this.mouseCursorRadius = 20.0;
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
            this.currentVectorLayer = null;
            this.currentVectorGroup = null;
            this.currentVectorLine = null;
            this.currentPosingLayer = null;
            this.currentPosingModel = null;
            this.currentPosingData = null;
            this.mainWindow = null;
            this.pickingWindow = null;
            this.posing3DView = null;
            this.posing3DLogic = null;
            this.mouseCursorRadius = 0.0;
            this.viewScale = 0.0;
            this.toolContext = toolContext;
        }
        ToolEnvironment.prototype.updateContext = function () {
            this.mainToolID = this.toolContext.mainToolID;
            this.subToolIndex = this.toolContext.subToolIndex;
            this.editMode = this.toolContext.editMode;
            this.operationUnitID = this.toolContext.operationUnitID;
            this.commandHistory = this.toolContext.commandHistory;
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
            this.mainWindow = this.toolContext.mainWindow;
            this.pickingWindow = this.toolContext.pickingWindow;
            this.posing3DView = this.toolContext.posing3DView;
            this.posing3DLogic = this.toolContext.posing3DLogic;
            this.viewScale = this.toolContext.mainWindow.viewScale;
            this.mouseCursorRadius = this.toolContext.mouseCursorRadius / this.viewScale;
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
        ToolEnvironment.prototype.setRedrawMainWindowEditorWindow = function () {
            this.setRedrawMainWindow();
            this.setRedrawEditorWindow();
            this.setRedrawWebGLWindow();
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
        ToolEnvironment.prototype.setCurrentLayer = function (layer) {
            this.toolContext.mainEditor.setCurrentLayer(layer);
        };
        ToolEnvironment.prototype.setCurrentVectorLine = function (line, isEditTarget) {
            this.toolContext.currentVectorLine = line;
            this.currentVectorLine = line;
            this.currentVectorLine.isEditTarget = isEditTarget;
        };
        return ToolEnvironment;
    }());
    ManualTracingTool.ToolEnvironment = ToolEnvironment;
    var ToolMouseEvent = /** @class */ (function () {
        function ToolMouseEvent() {
            this.button = 0;
            this.buttons = 0;
            this.offsetX = 0.0;
            this.offsetY = 0.0;
            this.wheelDelta = 0.0;
            this.isMouseDragging = false;
            this.location = [0.0, 0.0, 0.0];
            this.mouseDownLocation = [0.0, 0.0, 0.0];
            this.mouseMovedVector = [0.0, 0.0, 0.0];
        }
        ToolMouseEvent.prototype.isLeftButtonPressing = function () {
            return (this.buttons == 1);
        };
        ToolMouseEvent.prototype.isRightButtonPressing = function () {
            return (this.buttons == 2);
        };
        ToolMouseEvent.prototype.isLeftButtonReleased = function () {
            return (this.button == 0);
        };
        ToolMouseEvent.prototype.isRightButtonReleased = function () {
            return (this.button == 2);
        };
        return ToolMouseEvent;
    }());
    ManualTracingTool.ToolMouseEvent = ToolMouseEvent;
    var ToolBase = /** @class */ (function () {
        function ToolBase() {
            this.helpText = '';
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
        return ToolBase;
    }());
    ManualTracingTool.ToolBase = ToolBase;
    var ModalToolBase = /** @class */ (function (_super) {
        __extends(ModalToolBase, _super);
        function ModalToolBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ModalToolBase.prototype.exitModal = function (env) {
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
        MainTool.prototype.subTool = function (tool) {
            this.subTools.push(tool);
            return this;
        };
        return MainTool;
    }());
    ManualTracingTool.MainTool = MainTool;
})(ManualTracingTool || (ManualTracingTool = {}));
