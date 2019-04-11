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
            this.newLocation = vec3.create();
            this.oldLocation = vec3.create();
        }
        return Tool_ScratchLineWidth_EditPoint;
    }());
    var Tool_OverWriteLineWidth = /** @class */ (function (_super) {
        __extends(Tool_OverWriteLineWidth, _super);
        function Tool_OverWriteLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '線を最大の太さに近づけます。Shiftキーで線を細くします。<br />Ctrlキーで最大の太さ固定になります。';
            _this.editFalloffRadiusContainsLineWidth = true;
            return _this;
        }
        Tool_OverWriteLineWidth.prototype.executeCommand = function (env) {
            var baseRadius = env.mouseCursorViewRadius;
            var targetLine = env.currentVectorLine;
            // Resampling editor line
            this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);
            // Get candidate points
            var editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            var editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
            var candidatePointPairs = this.ganerateScratchingCandidatePoints(targetLine, this.resampledLine, editFalloffRadiusMin, editFalloffRadiusMax, this.editFalloffRadiusContainsLineWidth);
            if (candidatePointPairs != null && candidatePointPairs.length > 0) {
                var command = new Command_ScratchLineWidth();
                command.targetLine = targetLine;
                for (var _i = 0, candidatePointPairs_1 = candidatePointPairs; _i < candidatePointPairs_1.length; _i++) {
                    var pair = candidatePointPairs_1[_i];
                    var editPoint = new Tool_ScratchLineWidth_EditPoint();
                    editPoint.pair = pair;
                    editPoint.oldLineWidth = editPoint.pair.targetPoint.lineWidth;
                    vec3.copy(editPoint.oldLocation, editPoint.pair.targetPoint.location);
                    this.processPoint(editPoint, env);
                    command.editPoints.push(editPoint);
                }
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
        };
        Tool_OverWriteLineWidth.prototype.processPoint = function (editPoint, env) {
            var setTo_LineWidth = env.drawLineBaseWidth;
            if (env.isShiftKeyPressing()) {
                setTo_LineWidth = env.drawLineMinWidth;
            }
            var fixedOverWriting = false;
            if (env.isCtrlKeyPressing()) {
                fixedOverWriting = true;
            }
            var candidatePoint = editPoint.pair.candidatePoint;
            var targetPoint = editPoint.pair.targetPoint;
            vec3.copy(editPoint.newLocation, editPoint.pair.targetPoint.location);
            if (editPoint.pair.influence > 0.0) {
                if (fixedOverWriting) {
                    editPoint.newLineWidth = setTo_LineWidth;
                }
                else {
                    editPoint.newLineWidth = ManualTracingTool.Maths.lerp(editPoint.pair.influence * 0.5, editPoint.pair.targetPoint.lineWidth, setTo_LineWidth);
                }
            }
            else {
                editPoint.newLineWidth = editPoint.pair.targetPoint.lineWidth;
            }
        };
        return Tool_OverWriteLineWidth;
    }(ManualTracingTool.Tool_ScratchLine));
    ManualTracingTool.Tool_OverWriteLineWidth = Tool_OverWriteLineWidth;
    var Tool_ScratchLineWidth = /** @class */ (function (_super) {
        __extends(Tool_ScratchLineWidth, _super);
        function Tool_ScratchLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '線の太さを足します。Shiftキーで減らします。';
            _this.editFalloffRadiusMinRate = 0.15;
            _this.editFalloffRadiusMaxRate = 1.0;
            _this.editInfluence = 1.0;
            _this.subtructVector = vec3.create();
            _this.moveVector = vec3.create();
            return _this;
        }
        Tool_ScratchLineWidth.prototype.processPoint = function (editPoint, env) {
            var targetPoint = editPoint.pair.targetPoint;
            var candidatePoint = editPoint.pair.candidatePoint;
            var targetPointRadius = targetPoint.lineWidth * 0.5;
            var candidatePointRadius = candidatePoint.lineWidth * 0.5;
            var distance = vec3.distance(targetPoint.location, candidatePoint.location);
            if (!env.isShiftKeyPressing()) {
                if (distance + candidatePointRadius > targetPointRadius
                    && distance - candidatePointRadius > -targetPointRadius) {
                    var totalDiameter = targetPointRadius + distance + candidatePointRadius;
                    var totalRadius = totalDiameter * 0.5;
                    var newRadius = ManualTracingTool.Maths.lerp(editPoint.pair.influence, targetPointRadius, totalRadius);
                    editPoint.newLineWidth = newRadius * 2.0;
                    vec3.subtract(this.subtructVector, candidatePoint.location, targetPoint.location);
                    vec3.normalize(this.subtructVector, this.subtructVector);
                    vec3.scale(this.moveVector, this.subtructVector, -targetPointRadius + newRadius);
                    vec3.add(editPoint.newLocation, targetPoint.location, this.moveVector);
                }
                else if (candidatePointRadius > targetPointRadius) {
                    editPoint.newLineWidth = candidatePointRadius * 2.0;
                    vec3.copy(editPoint.newLocation, candidatePoint.location);
                }
                else {
                    editPoint.newLineWidth = targetPoint.lineWidth;
                    vec3.copy(editPoint.newLocation, targetPoint.location);
                }
            }
            else {
                if (distance - candidatePointRadius < targetPointRadius
                    && distance - candidatePointRadius > -targetPointRadius) {
                    var totalDiameter = targetPointRadius + distance - candidatePointRadius;
                    var totalRadius = totalDiameter * 0.5;
                    var newRadius = ManualTracingTool.Maths.lerp(editPoint.pair.influence, targetPointRadius, totalRadius);
                    editPoint.newLineWidth = newRadius * 2.0;
                    vec3.subtract(this.subtructVector, candidatePoint.location, targetPoint.location);
                    vec3.normalize(this.subtructVector, this.subtructVector);
                    vec3.scale(this.moveVector, this.subtructVector, -targetPointRadius + newRadius);
                    vec3.add(editPoint.newLocation, targetPoint.location, this.moveVector);
                }
                else if (distance < candidatePointRadius) {
                    editPoint.newLineWidth = 0.0;
                    vec3.copy(editPoint.newLocation, targetPoint.location);
                }
                else {
                    editPoint.newLineWidth = targetPoint.lineWidth;
                    vec3.copy(editPoint.newLocation, targetPoint.location);
                }
            }
        };
        return Tool_ScratchLineWidth;
    }(Tool_OverWriteLineWidth));
    ManualTracingTool.Tool_ScratchLineWidth = Tool_ScratchLineWidth;
    var Command_ScratchLineWidth = /** @class */ (function (_super) {
        __extends(Command_ScratchLineWidth, _super);
        function Command_ScratchLineWidth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLine = null;
            _this.editPoints = new List();
            return _this;
        }
        Command_ScratchLineWidth.prototype.execute = function (env) {
            this.errorCheck();
            this.redo(env);
        };
        Command_ScratchLineWidth.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = editPoint.oldLineWidth;
                vec3.copy(targetPoint.location, editPoint.oldLocation);
                vec3.copy(targetPoint.adjustingLocation, editPoint.oldLocation);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        Command_ScratchLineWidth.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = editPoint.newLineWidth;
                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustingLocation, editPoint.newLocation);
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
