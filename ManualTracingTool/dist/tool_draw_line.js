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
                && ManualTracingTool.Layer.isVisible(env.currentVectorLayer));
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
            env.setRedrawCurrentLayer();
            env.setRedrawEditorWindow();
            this.editLine = null;
        };
        Tool_DrawLine.prototype.executeCommand = function (env) {
            var targetGroup = env.currentVectorGroup;
            var editLine = this.editLine;
            // Crete new line
            ManualTracingTool.Logic_Edit_Line.smooth(editLine);
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            var divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(editLine.totalLength, resamplingUnitLength);
            var resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(editLine, divisionCount);
            if (resampledLine.points.length < 2) {
                return;
            }
            // Collect continuous filling info
            var previousConnectedLine = null;
            var previousConnectedLine_continuousFill = false;
            if (this.continuousFill && targetGroup.lines.length >= 1) {
                var connectLine = targetGroup.lines[targetGroup.lines.length - 1];
                if (connectLine.points.length >= 2) {
                    var lastPoint = connectLine.points[connectLine.points.length - 1];
                    var point1 = resampledLine.points[0];
                    var point2 = resampledLine.points[resampledLine.points.length - 1];
                    var distance1 = vec3.squaredDistance(lastPoint.location, point1.location);
                    var distance2 = vec3.squaredDistance(lastPoint.location, point2.location);
                    if (distance2 < distance1) {
                        var revercedList = new List();
                        for (var i = resampledLine.points.length - 1; i >= 0; i--) {
                            revercedList.push(resampledLine.points[i]);
                        }
                        resampledLine.points = revercedList;
                    }
                    previousConnectedLine = targetGroup.lines[targetGroup.lines.length - 1];
                    previousConnectedLine_continuousFill = previousConnectedLine.continuousFill;
                }
            }
            var command = new Command_AddLine();
            command.prepareEditTargets(env.currentVectorGroup, resampledLine);
            command.setContiuousStates(this.continuousFill, previousConnectedLine, previousConnectedLine_continuousFill);
            command.useGroup(env.currentVectorGroup);
            command.executeCommand(env);
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
        Command_AddLine.prototype.prepareEditTargets = function (group, line) {
            this.group = group;
            this.line = line;
            this.useGroup(group);
        };
        Command_AddLine.prototype.setContiuousStates = function (continuousFill, previousConnectedLine, previousConnectedLine_continuousFill) {
            this.continuousFill = continuousFill;
            this.previousConnectedLine = previousConnectedLine;
            this.previousConnectedLine_continuousFill = previousConnectedLine_continuousFill;
        };
        Command_AddLine.prototype.execute = function (env) {
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
            env.setCurrentVectorLine(this.line, this.group);
        };
        return Command_AddLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_AddLine = Command_AddLine;
})(ManualTracingTool || (ManualTracingTool = {}));
