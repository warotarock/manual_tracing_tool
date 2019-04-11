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
            _this.helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。';
            _this.editLine = null;
            _this.continuousFill = false;
            return _this;
        }
        Tool_DrawLine.prototype.isAvailable = function (env) {
            return (env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible);
        };
        Tool_DrawLine.prototype.mouseDown = function (e, env) {
            if (!e.isLeftButtonPressing()) {
                return;
            }
            this.continuousFill = env.isShiftKeyPressing();
            this.editLine = new ManualTracingTool.VectorLine();
            this.addPointToEditLine(e, env);
        };
        Tool_DrawLine.prototype.addPointToEditLine = function (e, env) {
            var point = new ManualTracingTool.LinePoint();
            vec3.copy(point.location, e.location);
            point.lineWidth = env.drawLineBaseWidth;
            this.editLine.points.push(point);
        };
        Tool_DrawLine.prototype.mouseMove = function (e, env) {
            if (this.editLine == null) {
                return;
            }
            this.addPointToEditLine(e, env);
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
            this.continuousFill = (this.continuousFill || env.isShiftKeyPressing());
            this.executeCommand(env);
            env.setRedrawMainWindow();
            env.setRedrawEditorWindow();
            this.editLine = null;
        };
        Tool_DrawLine.prototype.executeCommand = function (env) {
            ManualTracingTool.Logic_Edit_Line.smooth(this.editLine);
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            var divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);
            var resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);
            var command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = resampledLine;
            command.continuousFill = this.continuousFill;
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
            _this.continuousFill = false;
            _this.previousConnectedLine = null;
            _this.previousConnectedLine_continuousFill = false;
            return _this;
        }
        Command_AddLine.prototype.execute = function (env) {
            this.errorCheck();
            if (this.continuousFill && this.group.lines.length >= 1 && this.line.points.length >= 2) {
                var connectLine = this.group.lines[this.group.lines.length - 1];
                if (connectLine.points.length >= 2) {
                    var lastPoint = connectLine.points[connectLine.points.length - 1];
                    var point1 = this.line.points[0];
                    var point2 = this.line.points[this.line.points.length - 1];
                    var distance1 = vec3.squaredDistance(lastPoint.location, point1.location);
                    var distance2 = vec3.squaredDistance(lastPoint.location, point2.location);
                    if (distance2 < distance1) {
                        var revercedList = new List();
                        for (var i = this.line.points.length - 1; i >= 0; i--) {
                            revercedList.push(this.line.points[i]);
                        }
                        this.line.points = revercedList;
                    }
                    this.previousConnectedLine = this.group.lines[this.group.lines.length - 1];
                    this.previousConnectedLine_continuousFill = this.previousConnectedLine.continuousFill;
                }
            }
            this.redo(env);
        };
        Command_AddLine.prototype.undo = function (env) {
            ListRemoveAt(this.group.lines, this.group.lines.length - 1);
            if (this.previousConnectedLine != null) {
                this.previousConnectedLine.continuousFill = this.previousConnectedLine_continuousFill;
            }
        };
        Command_AddLine.prototype.redo = function (env) {
            this.group.lines.push(this.line);
            if (this.previousConnectedLine != null) {
                this.previousConnectedLine.continuousFill = true;
            }
            env.setCurrentVectorLine(this.line, false);
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
