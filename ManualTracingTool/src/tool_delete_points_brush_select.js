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
    var Selector_DeleteLinePoint_BrushSelect = /** @class */ (function (_super) {
        __extends(Selector_DeleteLinePoint_BrushSelect, _super);
        function Selector_DeleteLinePoint_BrushSelect() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Selector_DeleteLinePoint_BrushSelect.prototype.onPointHited = function (group, line, point) {
            this.selectionInfo.deletePoint(point);
        };
        Selector_DeleteLinePoint_BrushSelect.prototype.afterHitTest = function () {
            // doesn't clear flagas when deletion
        };
        return Selector_DeleteLinePoint_BrushSelect;
    }(ManualTracingTool.Selector_LinePoint_BrushSelect));
    ManualTracingTool.Selector_DeleteLinePoint_BrushSelect = Selector_DeleteLinePoint_BrushSelect;
    var Tool_DeletePoints_BrushSelect = /** @class */ (function (_super) {
        __extends(Tool_DeletePoints_BrushSelect, _super);
        function Tool_DeletePoints_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ブラシ選択で点を削除します。';
            _this.isEditTool = false; // @override
            _this.logic_Selector = new Selector_DeleteLinePoint_BrushSelect(); // @override
            return _this;
        }
        Tool_DeletePoints_BrushSelect.prototype.executeCommand = function (env) {
            var command = new ManualTracingTool.Command_DeleteFlaggedPoints();
            if (command.prepareEditTargets(env.currentVectorLayer, env.currentVectorGeometry)) {
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
            env.setRedrawMainWindow();
        };
        return Tool_DeletePoints_BrushSelect;
    }(ManualTracingTool.Tool_BrushSelectLinePointBase));
    ManualTracingTool.Tool_DeletePoints_BrushSelect = Tool_DeletePoints_BrushSelect;
})(ManualTracingTool || (ManualTracingTool = {}));
