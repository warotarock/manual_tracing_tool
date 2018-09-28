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
    var Selector_EditLinePointWidth_BrushSelect = /** @class */ (function (_super) {
        __extends(Selector_EditLinePointWidth_BrushSelect, _super);
        function Selector_EditLinePointWidth_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.lineWidth = 0.0;
            return _this;
        }
        Selector_EditLinePointWidth_BrushSelect.prototype.onPointHited = function (group, line, point) {
            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                point.adjustingLineWidth = this.lineWidth;
                this.selectionInfo.editPoint(point);
            }
        };
        Selector_EditLinePointWidth_BrushSelect.prototype.afterHitTest = function () {
            this.selectionInfo.resetModifyStatus();
        };
        return Selector_EditLinePointWidth_BrushSelect;
    }(ManualTracingTool.Selector_LinePoint_BrushSelect));
    ManualTracingTool.Selector_EditLinePointWidth_BrushSelect = Selector_EditLinePointWidth_BrushSelect;
    var Tool_EditLinePointWidth_BrushSelect = /** @class */ (function (_super) {
        __extends(Tool_EditLinePointWidth_BrushSelect, _super);
        function Tool_EditLinePointWidth_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '線の太さを０に設定し、非表示にします。表示した場合は線の太さを変更してください。';
            _this.logic_Selector = new Selector_EditLinePointWidth_BrushSelect(); // @override
            return _this;
        }
        Tool_EditLinePointWidth_BrushSelect.prototype.onStartSelection = function (e, env) {
            var logic_Selector = this.logic_Selector;
            logic_Selector.lineWidth = 0.0;
        };
        Tool_EditLinePointWidth_BrushSelect.prototype.executeCommand = function (env) {
            var command = new Command_EditLineWidth();
            if (command.prepareEditTargets(this.logic_Selector.selectionInfo)) {
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
            env.setRedrawMainWindow();
        };
        Tool_EditLinePointWidth_BrushSelect.prototype.cancelModal = function (env) {
            for (var _i = 0, _a = this.logic_Selector.selectionInfo.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                selPoint.point.adjustingLineWidth = selPoint.point.lineWidth;
            }
            this.logic_Selector.endProcess();
            env.setRedrawMainWindowEditorWindow();
        };
        return Tool_EditLinePointWidth_BrushSelect;
    }(ManualTracingTool.Tool_BrushSelectLinePointBase));
    ManualTracingTool.Tool_EditLinePointWidth_BrushSelect = Tool_EditLinePointWidth_BrushSelect;
    var Tool_EditLineWidth_EditPoint = /** @class */ (function () {
        function Tool_EditLineWidth_EditPoint() {
            this.targetPoint = null;
            this.newLineWidth = 0.0;
            this.oldLineWidth = 0.0;
        }
        return Tool_EditLineWidth_EditPoint;
    }());
    var Command_EditLineWidth = /** @class */ (function (_super) {
        __extends(Command_EditLineWidth, _super);
        function Command_EditLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editPoints = new List();
            return _this;
        }
        Command_EditLineWidth.prototype.prepareEditTargets = function (selectionInfo) {
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
            return (editPointCount > 0);
        };
        Command_EditLineWidth.prototype.execute = function (env) {
            this.errorCheck();
            this.redo(env);
        };
        Command_EditLineWidth.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.targetPoint;
                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
        };
        Command_EditLineWidth.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.targetPoint;
                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
        };
        Command_EditLineWidth.prototype.errorCheck = function () {
        };
        return Command_EditLineWidth;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_EditLineWidth = Command_EditLineWidth;
})(ManualTracingTool || (ManualTracingTool = {}));
