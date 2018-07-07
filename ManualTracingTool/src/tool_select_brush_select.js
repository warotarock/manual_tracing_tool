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
    var SelectionProgressID;
    (function (SelectionProgressID) {
        SelectionProgressID[SelectionProgressID["none"] = 0] = "none";
        SelectionProgressID[SelectionProgressID["selecting"] = 1] = "selecting";
    })(SelectionProgressID || (SelectionProgressID = {}));
    var Tool_Select_BrushSelet_LinePoint = /** @class */ (function (_super) {
        __extends(Tool_Select_BrushSelet_LinePoint, _super);
        function Tool_Select_BrushSelet_LinePoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.selectionProcessID = SelectionProgressID.none;
            _this.logic_Selector = new ManualTracingTool.Selector_LinePoint_BrushSelect(); // @virtual
            return _this;
        }
        Tool_Select_BrushSelet_LinePoint.prototype.mouseDown = function (e, env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            if (e.isLeftButtonPressing()) {
                this.startSelection(e, env);
                this.processSelection(e, env);
                env.setRedrawMainWindow();
                env.setRedrawEditorWindow();
            }
        };
        Tool_Select_BrushSelet_LinePoint.prototype.mouseMove = function (e, env) {
            if (env.currentVectorLayer == null) {
                // redraw cursor
                env.setRedrawEditorWindow();
                return;
            }
            if (this.selectionProcessID == SelectionProgressID.selecting) {
                if (e.isLeftButtonPressing()) {
                    this.processSelection(e, env);
                    env.setRedrawMainWindow();
                }
            }
            // redraw cursor
            env.setRedrawEditorWindow();
        };
        Tool_Select_BrushSelet_LinePoint.prototype.mouseUp = function (e, env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            if (this.selectionProcessID == SelectionProgressID.selecting) {
                this.endSelection(env);
                env.setRedrawMainWindow();
            }
            env.setRedrawEditorWindow();
        };
        Tool_Select_BrushSelet_LinePoint.prototype.startSelection = function (e, env) {
            if (env.isCtrlKeyPressing()) {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.toggle;
            }
            else if (env.isAltKeyPressing()) {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.setUnselected;
            }
            else {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.setSelected;
            }
            this.logic_Selector.startProcess();
            this.selectionProcessID = SelectionProgressID.selecting;
        };
        Tool_Select_BrushSelet_LinePoint.prototype.processSelection = function (e, env) {
            this.logic_Selector.processLayer(env.currentVectorLayer, e.location[0], e.location[1], env.mouseCursorViewRadius);
        };
        Tool_Select_BrushSelet_LinePoint.prototype.endSelection = function (env) {
            if (this.selectionProcessID != SelectionProgressID.selecting) {
                return;
            }
            this.logic_Selector.endProcess();
            this.selectionProcessID = SelectionProgressID.none;
            if (this.logic_Selector.selectionInfo.selectedLines.length == 0
                && this.logic_Selector.selectionInfo.selectedPoints.length == 0) {
                return;
            }
            this.executeCommand(env);
        };
        Tool_Select_BrushSelet_LinePoint.prototype.executeCommand = function (env) {
            var command = new Command_Select();
            command.selectionInfo = this.logic_Selector.selectionInfo;
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_Select_BrushSelet_LinePoint;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Select_BrushSelet_LinePoint = Tool_Select_BrushSelet_LinePoint;
    var Tool_Select_BrushSelet_Line = /** @class */ (function (_super) {
        __extends(Tool_Select_BrushSelet_Line, _super);
        function Tool_Select_BrushSelet_Line() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.logic_Selector = new ManualTracingTool.Selector_Line_BrushSelect(); // @override
            return _this;
        }
        return Tool_Select_BrushSelet_Line;
    }(Tool_Select_BrushSelet_LinePoint));
    ManualTracingTool.Tool_Select_BrushSelet_Line = Tool_Select_BrushSelet_Line;
    var Tool_Select_BrushSelet_LineSegment = /** @class */ (function (_super) {
        __extends(Tool_Select_BrushSelet_LineSegment, _super);
        function Tool_Select_BrushSelet_LineSegment() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.logic_Selector = new ManualTracingTool.Selector_LineSegment_BrushSelect(); // @override
            return _this;
        }
        return Tool_Select_BrushSelet_LineSegment;
    }(Tool_Select_BrushSelet_LinePoint));
    ManualTracingTool.Tool_Select_BrushSelet_LineSegment = Tool_Select_BrushSelet_LineSegment;
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
            this.errorCheck();
            // Selection process has done while inputting
            this.selectedLines = ListClone(this.selectionInfo.selectedLines);
            this.selectedPoints = ListClone(this.selectionInfo.selectedPoints);
            if (this.selectedLines.length > 0) {
                var firstLine = this.selectedLines[0];
                env.setCurrentVectorLine(firstLine.line, false);
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
        Command_Select.prototype.errorCheck = function () {
            if (this.selectionInfo == null) {
                throw ('Com_Select: selectedLines is null!');
            }
            if (this.selectionInfo.selectedLines == null) {
                throw ('Com_Select: selectedLines is null!');
            }
            if (this.selectionInfo.selectedPoints == null) {
                throw ('Com_Select: selectedPoints is null!');
            }
            if (this.selectionInfo.selectedLines.length == 0
                && this.selectionInfo.selectedPoints.length == 0) {
                throw ('Com_Select: no points is selected!');
            }
        };
        return Command_Select;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Select = Command_Select;
})(ManualTracingTool || (ManualTracingTool = {}));
