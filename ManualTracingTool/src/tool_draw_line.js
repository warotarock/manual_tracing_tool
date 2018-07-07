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
    var Tool_DrawLine = /** @class */ (function (_super) {
        __extends(Tool_DrawLine, _super);
        function Tool_DrawLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editLine = null;
            _this.resamplingUnitLength = 1.0;
            return _this;
        }
        Tool_DrawLine.prototype.isAvailable = function (env) {
            return (env.currentVectorLayer != null);
        };
        Tool_DrawLine.prototype.mouseDown = function (e, env) {
            if (!e.isLeftButtonPressing()) {
                return;
            }
            if (env.isAnyModifierKeyPressing()) {
                return;
            }
            this.editLine = new ManualTracingTool.VectorLine();
            this.addPointToEditLine(e);
        };
        Tool_DrawLine.prototype.addPointToEditLine = function (e) {
            var point = new ManualTracingTool.LinePoint();
            vec3.copy(point.location, e.location);
            this.editLine.points.push(point);
        };
        Tool_DrawLine.prototype.mouseMove = function (e, env) {
            if (this.editLine == null) {
                return;
            }
            this.addPointToEditLine(e);
            env.setRedrawEditorWindow();
        };
        Tool_DrawLine.prototype.mouseUp = function (e, env) {
            if (this.editLine == null) {
                return;
            }
            if (env.currentVectorGroup == null) {
                this.editLine = null;
                env.setRedrawEditorWindow();
                return;
            }
            this.executeCommand(env);
            env.setRedrawMainWindow();
            env.setRedrawEditorWindow();
            this.editLine = null;
        };
        Tool_DrawLine.prototype.executeCommand = function (env) {
            ManualTracingTool.Logic_Edit_Line.smooth(this.editLine);
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.editLine);
            var resamplingUnitLength = env.getViewScaledLength(this.resamplingUnitLength);
            var divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);
            var resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);
            var command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = resampledLine;
            command.execute(env);
            env.commandHistory.addCommand(command);
            this.editLine = null;
        };
        return Tool_DrawLine;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_DrawLine = Tool_DrawLine;
    var Command_AddLine = /** @class */ (function (_super) {
        __extends(Command_AddLine, _super);
        function Command_AddLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.group = null;
            _this.line = null;
            return _this;
        }
        Command_AddLine.prototype.execute = function (env) {
            this.errorCheck();
            this.group.lines.push(this.line);
            env.setCurrentVectorLine(this.line, false);
        };
        Command_AddLine.prototype.undo = function (env) {
            ListRemoveAt(this.group.lines, this.group.lines.length - 1);
        };
        Command_AddLine.prototype.redo = function (env) {
            this.execute(env);
        };
        Command_AddLine.prototype.errorCheck = function () {
            if (this.group == null) {
                throw ('Com_AddLine: group is null!');
            }
            if (this.line == null) {
                throw ('Com_AddLine: line is null!');
            }
        };
        return Command_AddLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_AddLine = Command_AddLine;
})(ManualTracingTool || (ManualTracingTool = {}));
