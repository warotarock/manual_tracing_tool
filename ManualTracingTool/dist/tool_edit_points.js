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
    var Selector_HideLinePoint_BrushSelect = /** @class */ (function (_super) {
        __extends(Selector_HideLinePoint_BrushSelect, _super);
        function Selector_HideLinePoint_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.lineWidth = 0.0;
            return _this;
        }
        Selector_HideLinePoint_BrushSelect.prototype.onPointHited = function (group, line, point) {
            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                point.adjustingLineWidth = this.lineWidth;
                this.selectionInfo.editGroup(group);
                this.selectionInfo.editLine(line);
                this.selectionInfo.editPoint(point);
            }
        };
        return Selector_HideLinePoint_BrushSelect;
    }(ManualTracingTool.Selector_LinePoint_BrushSelect));
    ManualTracingTool.Selector_HideLinePoint_BrushSelect = Selector_HideLinePoint_BrushSelect;
    var Tool_HideLinePoint_BrushSelect = /** @class */ (function (_super) {
        __extends(Tool_HideLinePoint_BrushSelect, _super);
        function Tool_HideLinePoint_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '線の太さに最大の太さに設定します。<br />Shiftキーで最小の太さに設定します。Ctrlキーで線をの太さを０にします。';
            _this.isEditTool = false; // @override
            _this.selector = new Selector_HideLinePoint_BrushSelect();
            _this.logic_Selector = _this.selector; // @override
            return _this;
        }
        Tool_HideLinePoint_BrushSelect.prototype.onStartSelection = function (e, env) {
            if (env.isShiftKeyPressing()) {
                this.selector.lineWidth = env.drawLineMinWidth;
            }
            else if (env.isCtrlKeyPressing()) {
                this.selector.lineWidth = 0.0;
            }
            else {
                this.selector.lineWidth = env.drawLineBaseWidth;
            }
        };
        Tool_HideLinePoint_BrushSelect.prototype.executeCommand = function (env) {
            var command = new Command_EditLinePointLineWidth();
            if (command.prepareEditTargets(this.selector.selectionInfo)) {
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
            }
            env.setRedrawMainWindow();
        };
        Tool_HideLinePoint_BrushSelect.prototype.cancelModal = function (env) {
            for (var _i = 0, _a = this.logic_Selector.selectionInfo.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                selPoint.point.adjustingLineWidth = selPoint.point.lineWidth;
            }
            this.logic_Selector.endProcess();
            env.setRedrawMainWindowEditorWindow();
        };
        return Tool_HideLinePoint_BrushSelect;
    }(ManualTracingTool.Tool_BrushSelectLinePointBase));
    ManualTracingTool.Tool_HideLinePoint_BrushSelect = Tool_HideLinePoint_BrushSelect;
    var Tool_EditLineWidth_EditPoint = /** @class */ (function () {
        function Tool_EditLineWidth_EditPoint() {
            this.targetPoint = null;
            this.newLineWidth = 0.0;
            this.oldLineWidth = 0.0;
        }
        return Tool_EditLineWidth_EditPoint;
    }());
    var Command_EditLinePointLineWidth = /** @class */ (function (_super) {
        __extends(Command_EditLinePointLineWidth, _super);
        function Command_EditLinePointLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editPoints = new List();
            return _this;
        }
        Command_EditLinePointLineWidth.prototype.prepareEditTargets = function (selectionInfo) {
            var editPointCount = 0;
            for (var _i = 0, _a = selectionInfo.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                var point = selPoint.point;
                var editPoint = new Tool_EditLineWidth_EditPoint();
                editPoint.targetPoint = point;
                editPoint.oldLineWidth = point.lineWidth;
                editPoint.newLineWidth = point.adjustingLineWidth;
                this.editPoints.push(editPoint);
                editPointCount++;
            }
            if (editPointCount > 0) {
                this.useGroups();
                for (var _b = 0, _c = selectionInfo.selectedGroups; _b < _c.length; _b++) {
                    var selGroup = _c[_b];
                    this.targetGroups.push(selGroup.group);
                }
            }
            return (editPointCount > 0);
        };
        Command_EditLinePointLineWidth.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_EditLinePointLineWidth.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.targetPoint;
                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
        };
        Command_EditLinePointLineWidth.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.targetPoint;
                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
        };
        return Command_EditLinePointLineWidth;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_EditLinePointLineWidth = Command_EditLinePointLineWidth;
})(ManualTracingTool || (ManualTracingTool = {}));
