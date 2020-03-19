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
    var Tool_BrushSelectLinePointBase = /** @class */ (function (_super) {
        __extends(Tool_BrushSelectLinePointBase, _super);
        function Tool_BrushSelectLinePointBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '左クリックで選択を追加、Altキーを押しながらで選択を解除します。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';
            _this.isEditTool = true; // @override
            _this.logic_Selector = null; // @virtual
            _this.viewKeyframeLayers = null;
            return _this;
        }
        Tool_BrushSelectLinePointBase.prototype.isAvailable = function (env) {
            return (env.currentLayer != null
                && ManualTracingTool.Layer.isEditTarget(env.currentLayer));
        };
        Tool_BrushSelectLinePointBase.prototype.onDrawEditor = function (env, drawEnv) {
            drawEnv.editorDrawer.drawMouseCursor();
        };
        Tool_BrushSelectLinePointBase.prototype.mouseDown = function (e, env) {
            if (!this.isAvailable(env)) {
                return;
            }
            if (e.isLeftButtonPressing()) {
                this.startSelection(e, env);
                this.processSelection(e, env);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
        };
        Tool_BrushSelectLinePointBase.prototype.mouseMove = function (e, env) {
            //if (env.currentVectorLayer == null) {
            //    env.setRedrawEditorWindow();
            //    return;
            //}
            if (!this.isAvailable(env)) {
                return;
            }
            if (env.isModalToolRunning()) {
                if (e.isLeftButtonPressing()) {
                    this.processSelection(e, env);
                    env.setRedrawCurrentLayer();
                }
            }
            // redraw cursor
            env.setRedrawEditorWindow();
        };
        Tool_BrushSelectLinePointBase.prototype.mouseUp = function (e, env) {
            //if (env.currentVectorLayer == null) {
            //    return;
            //}
            if (!this.isAvailable(env)) {
                return;
            }
            if (env.isModalToolRunning()) {
                this.endSelection(env);
                env.setRedrawCurrentLayer();
            }
            env.setRedrawEditorWindow();
        };
        Tool_BrushSelectLinePointBase.prototype.startSelection = function (e, env) {
            if (env.isCtrlKeyPressing()) {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.toggle;
            }
            else if (env.isAltKeyPressing()) {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.setUnselected;
            }
            else {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.setSelected;
            }
            this.viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.onStartSelection(e, env);
            this.logic_Selector.startProcess();
            env.startModalTool(this);
        };
        Tool_BrushSelectLinePointBase.prototype.onStartSelection = function (e, env) {
        };
        Tool_BrushSelectLinePointBase.prototype.processSelection = function (e, env) {
            if (this.viewKeyframeLayers == null) {
                return null;
            }
            for (var _i = 0, _a = this.viewKeyframeLayers; _i < _a.length; _i++) {
                var viewKeyframeLayer = _a[_i];
                if (ManualTracingTool.VectorLayer.isVectorLayer(viewKeyframeLayer.layer)) {
                    this.logic_Selector.processLayer(viewKeyframeLayer.vectorLayerKeyframe.geometry, e.location, env.mouseCursorViewRadius);
                }
            }
        };
        Tool_BrushSelectLinePointBase.prototype.endSelection = function (env) {
            this.logic_Selector.endProcess();
            env.endModalTool();
            if (!this.existsResults()) {
                return;
            }
            this.executeCommand(env);
            this.viewKeyframeLayers = null;
        };
        Tool_BrushSelectLinePointBase.prototype.existsResults = function () {
            return (this.logic_Selector.selectionInfo.selectedLines.length != 0
                || this.logic_Selector.selectionInfo.selectedPoints.length != 0);
        };
        Tool_BrushSelectLinePointBase.prototype.executeCommand = function (env) {
        };
        return Tool_BrushSelectLinePointBase;
    }(ManualTracingTool.ModalToolBase));
    ManualTracingTool.Tool_BrushSelectLinePointBase = Tool_BrushSelectLinePointBase;
    var Tool_Select_BrushSelect_LinePoint = /** @class */ (function (_super) {
        __extends(Tool_Select_BrushSelect_LinePoint, _super);
        function Tool_Select_BrushSelect_LinePoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.logic_Selector = new ManualTracingTool.Selector_LinePoint_BrushSelect(); // @override
            return _this;
        }
        Tool_Select_BrushSelect_LinePoint.prototype.toolWindowItemClick = function (env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.linePoint);
            env.setRedrawCurrentLayer();
        };
        Tool_Select_BrushSelect_LinePoint.prototype.prepareModal = function (e, env) {
            return true;
        };
        Tool_Select_BrushSelect_LinePoint.prototype.cancelModal = function (env) {
            for (var _i = 0, _a = this.logic_Selector.selectionInfo.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                selPoint.point.isSelected = selPoint.selectStateBefore;
            }
            this.logic_Selector.endProcess();
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Select_BrushSelect_LinePoint.prototype.executeCommand = function (env) {
            var command = new Command_Select();
            command.selectionInfo = this.logic_Selector.selectionInfo;
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_Select_BrushSelect_LinePoint;
    }(Tool_BrushSelectLinePointBase));
    ManualTracingTool.Tool_Select_BrushSelect_LinePoint = Tool_Select_BrushSelect_LinePoint;
    var Tool_Select_BrushSelect_Line = /** @class */ (function (_super) {
        __extends(Tool_Select_BrushSelect_Line, _super);
        function Tool_Select_BrushSelect_Line() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.logic_Selector = new ManualTracingTool.Selector_Line_BrushSelect(); // @override
            return _this;
        }
        Tool_Select_BrushSelect_Line.prototype.toolWindowItemClick = function (env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.line);
            env.setRedrawCurrentLayer();
        };
        return Tool_Select_BrushSelect_Line;
    }(Tool_Select_BrushSelect_LinePoint));
    ManualTracingTool.Tool_Select_BrushSelect_Line = Tool_Select_BrushSelect_Line;
    var Tool_Select_BrushSelect_LineSegment = /** @class */ (function (_super) {
        __extends(Tool_Select_BrushSelect_LineSegment, _super);
        function Tool_Select_BrushSelect_LineSegment() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.logic_Selector = new ManualTracingTool.Selector_LineSegment_BrushSelect(); // @override
            return _this;
        }
        Tool_Select_BrushSelect_LineSegment.prototype.toolWindowItemClick = function (env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.lineSegment);
            env.setRedrawCurrentLayer();
        };
        return Tool_Select_BrushSelect_LineSegment;
    }(Tool_Select_BrushSelect_LinePoint));
    ManualTracingTool.Tool_Select_BrushSelect_LineSegment = Tool_Select_BrushSelect_LineSegment;
    var Command_Select = /** @class */ (function (_super) {
        __extends(Command_Select, _super);
        function Command_Select() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.selectionInfo = null;
            _this.selectedLines = null;
            _this.selectedPoints = null;
            return _this;
        }
        Command_Select.prototype.execute = function (env) {
            // Selection process has done while inputting
            // so not required execute this.redo(env);
            this.selectedLines = ListClone(this.selectionInfo.selectedLines);
            this.selectedPoints = ListClone(this.selectionInfo.selectedPoints);
            if (this.selectedLines.length > 0) {
                var firstLine = this.selectedLines[0];
                env.setCurrentVectorLine(firstLine.line, env.currentVectorGroup);
            }
        };
        Command_Select.prototype.undo = function (env) {
            for (var _i = 0, _a = this.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                selPoint.point.isSelected = selPoint.selectStateBefore;
            }
            for (var _b = 0, _c = this.selectedLines; _b < _c.length; _b++) {
                var selLine = _c[_b];
                selLine.line.isSelected = selLine.selectStateBefore;
            }
        };
        Command_Select.prototype.redo = function (env) {
            for (var _i = 0, _a = this.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                selPoint.point.isSelected = selPoint.selectStateAfter;
            }
            for (var _b = 0, _c = this.selectedLines; _b < _c.length; _b++) {
                var selLine = _c[_b];
                selLine.line.isSelected = selLine.selectStateAfter;
            }
        };
        return Command_Select;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Select = Command_Select;
})(ManualTracingTool || (ManualTracingTool = {}));
