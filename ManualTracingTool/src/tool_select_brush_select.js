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
    var SelectProcessID;
    (function (SelectProcessID) {
        SelectProcessID[SelectProcessID["none"] = 0] = "none";
        SelectProcessID[SelectProcessID["selectiong"] = 1] = "selectiong";
    })(SelectProcessID || (SelectProcessID = {}));
    var Tool_Select_BrushSelet = (function (_super) {
        __extends(Tool_Select_BrushSelet, _super);
        function Tool_Select_BrushSelet() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.selectProcessID = SelectProcessID.none;
            _this.selectedPoints = null;
            _this.logic_BrushSelect = new ManualTracingTool.Selector_LinePoint_BrushSelect();
            return _this;
        }
        Tool_Select_BrushSelet.prototype.mouseDown = function (e, env) {
            if (e.isLeftButtonPressing()) {
                this.processSelectionEdit(e, env);
                env.setRedrawMainWindow();
                env.setRedrawEditorWindow();
            }
        };
        Tool_Select_BrushSelet.prototype.mouseMove = function (e, env) {
            if (e.isLeftButtonPressing()) {
                this.processSelectionEdit(e, env);
                env.setRedrawMainWindow();
            }
            else {
                this.endSelectionEdit(env);
            }
            env.setRedrawEditorWindow();
        };
        Tool_Select_BrushSelet.prototype.mouseUp = function (e, env) {
            if (!e.isLeftButtonPressing()) {
                this.endSelectionEdit(env);
                env.setRedrawEditorWindow();
            }
        };
        Tool_Select_BrushSelet.prototype.processSelectionEdit = function (e, env) {
            if (this.selectProcessID == SelectProcessID.none) {
                if (env.isCtrlKeyPressing()) {
                    this.logic_BrushSelect.editMode = ManualTracingTool.SelectionEditMode.toggle;
                }
                else if (env.isAltKeyPressing()) {
                    this.logic_BrushSelect.editMode = ManualTracingTool.SelectionEditMode.setUnselected;
                }
                else {
                    this.logic_BrushSelect.editMode = ManualTracingTool.SelectionEditMode.setSelected;
                }
                this.logic_BrushSelect.startProcess();
                this.selectProcessID = SelectProcessID.selectiong;
            }
            this.logic_BrushSelect.processLayer(env.currentVectorLayer, e.location[0], e.location[1], env.mouseCursorRadius);
        };
        Tool_Select_BrushSelet.prototype.endSelectionEdit = function (env) {
            if (this.selectProcessID != SelectProcessID.selectiong) {
                return;
            }
            this.logic_BrushSelect.endProcess();
            this.selectProcessID = SelectProcessID.none;
            if (this.logic_BrushSelect.selectionInfo.selectedLines.length == 0
                && this.logic_BrushSelect.selectionInfo.selectedPoints.length == 0) {
                return;
            }
            this.executeCommand(env);
        };
        Tool_Select_BrushSelet.prototype.executeCommand = function (env) {
            var command = new Command_Select();
            command.selector = this.logic_BrushSelect.selectionInfo;
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_Select_BrushSelet;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Select_BrushSelet = Tool_Select_BrushSelet;
    var Command_Select = (function (_super) {
        __extends(Command_Select, _super);
        function Command_Select() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.selector = null;
            _this.selectedLines = null;
            _this.selectedPoints = null;
            return _this;
        }
        Command_Select.prototype.execute = function (env) {
            this.errorCheck();
            // Selection process is done while inputting
            this.selectedLines = ListClone(this.selector.selectedLines);
            this.selectedPoints = ListClone(this.selector.selectedPoints);
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
            if (this.selector == null) {
                throw ('Com_Select: selectedLines is null!');
            }
            if (this.selector.selectedLines == null) {
                throw ('Com_Select: selectedLines is null!');
            }
            if (this.selector.selectedPoints == null) {
                throw ('Com_Select: selectedPoints is null!');
            }
            if (this.selector.selectedLines.length == 0
                && this.selector.selectedPoints.length == 0) {
                throw ('Com_Select: no points is selected!');
            }
        };
        return Command_Select;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Select = Command_Select;
})(ManualTracingTool || (ManualTracingTool = {}));
