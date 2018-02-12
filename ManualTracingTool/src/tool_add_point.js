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
    var Tool_AddPoint = /** @class */ (function (_super) {
        __extends(Tool_AddPoint, _super);
        function Tool_AddPoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.edit_Line = null;
            return _this;
        }
        Tool_AddPoint.prototype.mouseDown = function (e, env) {
            if (!e.isLeftButtonPressing()) {
                return;
            }
            if (env.isAnyModifierKeyPressing()) {
                return;
            }
            var addLine = false;
            if (this.edit_Line == null) {
                this.edit_Line = new ManualTracingTool.VectorLine();
                addLine = true;
            }
            ManualTracingTool.Logic_Edit_Line.smooth(this.edit_Line);
            this.executeCommand(e.location[0], e.location[1], addLine, env);
            env.setRedrawMainWindow();
        };
        Tool_AddPoint.prototype.mouseMove = function (e, env) {
        };
        Tool_AddPoint.prototype.mouseUp = function (e, env) {
        };
        Tool_AddPoint.prototype.executeCommand = function (x, y, addLine, env) {
            var command = new Command_AddPoint();
            command.group = env.currentVectorGroup;
            command.line = this.edit_Line;
            command.point = new ManualTracingTool.LinePoint();
            command.addLine = addLine;
            vec3.set(command.point.location, x, y, 0.0);
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_AddPoint;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_AddPoint = Tool_AddPoint;
    var Command_AddPoint = /** @class */ (function (_super) {
        __extends(Command_AddPoint, _super);
        function Command_AddPoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.group = null;
            _this.line = null;
            _this.point = null;
            _this.addLine = false;
            return _this;
        }
        Command_AddPoint.prototype.execute = function (env) {
            this.errorCheck();
            if (this.addLine) {
                this.group.lines.push(this.line);
            }
            this.line.points.push(this.point);
        };
        Command_AddPoint.prototype.undo = function (env) {
            ListRemoveAt(this.line.points, this.line.points.length - 1);
            if (this.addLine) {
                ListRemoveAt(this.group.lines, this.group.lines.length - 1);
            }
        };
        Command_AddPoint.prototype.redo = function (env) {
            this.execute(env);
        };
        Command_AddPoint.prototype.errorCheck = function () {
            if (this.group == null) {
                throw ('Com_AddLine: group is null!');
            }
            if (this.line == null) {
                throw ('Com_AddPoint: line is null!');
            }
            if (this.point == null) {
                throw ('Com_AddPoint: point is null!');
            }
        };
        return Command_AddPoint;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_AddPoint = Command_AddPoint;
})(ManualTracingTool || (ManualTracingTool = {}));
