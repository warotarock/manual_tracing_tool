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
    var Tool_ScratchLineWidth_EditPoint = /** @class */ (function () {
        function Tool_ScratchLineWidth_EditPoint() {
            this.pair = null;
            this.newLineWidth = 0.0;
            this.oldLineWidth = 0.0;
        }
        return Tool_ScratchLineWidth_EditPoint;
    }());
    var Tool_ScratchLineWidth = /** @class */ (function (_super) {
        __extends(Tool_ScratchLineWidth, _super);
        function Tool_ScratchLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.enableExtrude = false;
            return _this;
        }
        Tool_ScratchLineWidth.prototype.executeCommand = function (env) {
            var baseRadius = env.mouseCursorViewRadius;
            var targetLine = env.currentVectorLine;
            // Resampling editor line
            this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);
            // Get candidate points
            var editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            var editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
            var candidatePointPairs = this.ganerateCandidatePoints(targetLine, this.resampledLine, editFalloffRadiusMin, editFalloffRadiusMax);
            if (candidatePointPairs != null && candidatePointPairs.length > 0) {
                var command = new Command_ScratchLineWidth();
                command.isContinued = (this.extrudeLine != null);
                command.targetLine = targetLine;
                if (env.isCtrlKeyPressing()) {
                    command.fixedOverWriting = true;
                    command.fixedOverWritingLineWidth = 3.0;
                }
                for (var _i = 0, candidatePointPairs_1 = candidatePointPairs; _i < candidatePointPairs_1.length; _i++) {
                    var pair = candidatePointPairs_1[_i];
                    var editPoint = new Tool_ScratchLineWidth_EditPoint();
                    editPoint.pair = pair;
                    if (env.isShiftKeyPressing()) {
                        editPoint.pair.candidatePoint.lineWidth = 0.1;
                    }
                    else {
                        editPoint.pair.candidatePoint.lineWidth = 3.0;
                    }
                    command.editPoints.push(editPoint);
                }
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
        };
        return Tool_ScratchLineWidth;
    }(ManualTracingTool.Tool_ScratchLine));
    ManualTracingTool.Tool_ScratchLineWidth = Tool_ScratchLineWidth;
    var Command_ScratchLineWidth = /** @class */ (function (_super) {
        __extends(Command_ScratchLineWidth, _super);
        function Command_ScratchLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLine = null;
            _this.editPoints = new List();
            _this.fixedOverWriting = false;
            _this.fixedOverWritingLineWidth = 0.0;
            return _this;
        }
        Command_ScratchLineWidth.prototype.execute = function (env) {
            this.errorCheck();
            this.prepareEditPoints();
            this.redo(env);
        };
        Command_ScratchLineWidth.prototype.prepareEditPoints = function () {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var candidatePoint = editPoint.pair.candidatePoint;
                var targetPoint = editPoint.pair.targetPoint;
                editPoint.oldLineWidth = editPoint.pair.targetPoint.lineWidth;
                if (editPoint.pair.influence > 0.0) {
                    if (this.fixedOverWriting) {
                        editPoint.newLineWidth = this.fixedOverWritingLineWidth;
                    }
                    else {
                        editPoint.newLineWidth = ManualTracingTool.Maths.lerp(editPoint.pair.influence * 0.5, editPoint.pair.targetPoint.lineWidth, editPoint.pair.candidatePoint.lineWidth);
                    }
                }
                else {
                    editPoint.newLineWidth = editPoint.pair.targetPoint.lineWidth;
                }
            }
        };
        Command_ScratchLineWidth.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        Command_ScratchLineWidth.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        Command_ScratchLineWidth.prototype.errorCheck = function () {
            if (this.targetLine == null) {
                throw ('Command_ScratchLine: line is null!');
            }
        };
        return Command_ScratchLineWidth;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_ScratchLineWidth = Command_ScratchLineWidth;
})(ManualTracingTool || (ManualTracingTool = {}));
