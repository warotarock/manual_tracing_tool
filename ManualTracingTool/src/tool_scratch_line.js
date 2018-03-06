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
    var Tool_ScratchLine_CandidatePair = /** @class */ (function () {
        function Tool_ScratchLine_CandidatePair() {
            this.targetPoint = null;
            this.candidatePoint = null;
            this.influence = 0.0;
        }
        return Tool_ScratchLine_CandidatePair;
    }());
    var Tool_ScratchLine_EditPoint = /** @class */ (function () {
        function Tool_ScratchLine_EditPoint() {
            this.pair = null;
            this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
        }
        return Tool_ScratchLine_EditPoint;
    }());
    var Tool_ScratchLine_EditData = /** @class */ (function () {
        function Tool_ScratchLine_EditData() {
        }
        return Tool_ScratchLine_EditData;
    }());
    var Tool_ScratchLine = /** @class */ (function (_super) {
        __extends(Tool_ScratchLine, _super);
        function Tool_ScratchLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editLine = null;
            _this.resampledLine = null;
            _this.candidateLine = null;
            _this.forwardExtrude = false;
            _this.extrudeLine = null;
            _this.nearestPoint = vec3.fromValues(0.0, 0.0, 0.0);
            _this.samplePoint = vec3.fromValues(0.0, 0.0, 0.0);
            _this.lineSingleHitTester = new ManualTracingTool.HitTest_Line_PointToLineByDistanceSingle();
            _this.isLeftButtonEdit = false;
            _this.isRightButtonEdit = false;
            _this.samplingDivisionCount = 15;
            _this.curveCheckPointCount = 3;
            _this.cutoutAngle = 30 / 180.0 * Math.PI;
            _this.editFalloffRadiusMin = 10.0;
            _this.editFalloffRadiusMax = 20.0;
            _this.editInfluence = 0.5;
            _this.editExtrudeMinRadius = 1.0;
            _this.editExtrudeMaxRadius = 10.0;
            _this.viewScale = 1.0;
            return _this;
        }
        Tool_ScratchLine.prototype.mouseDown = function (e, env) {
            if (e.isLeftButtonPressing()) {
                this.editLine = new ManualTracingTool.VectorLine();
                this.resampledLine = null;
                this.candidateLine = null;
                this.isLeftButtonEdit = true;
                return;
            }
            else {
                this.isLeftButtonEdit = false;
            }
            if (e.isRightButtonPressing()) {
                this.isRightButtonEdit = true;
            }
            else {
                this.isRightButtonEdit = false;
            }
        };
        Tool_ScratchLine.prototype.mouseMove = function (e, env) {
            env.setRedrawEditorWindow();
            if (env.currentVectorLine == null || this.editLine == null) {
                return;
            }
            if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {
                var point = new ManualTracingTool.LinePoint();
                vec3.copy(point.location, e.location);
                vec3.copy(point.adjustedLocation, e.location);
                this.editLine.points.push(point);
            }
        };
        Tool_ScratchLine.prototype.mouseUp = function (e, env) {
            if (this.isLeftButtonEdit) {
                this.isLeftButtonEdit = false;
                if (env.currentVectorLine == null
                    || this.editLine == null
                    || this.editLine.points.length <= 1) {
                    return;
                }
                this.executeCommand(env);
                env.setRedrawMainWindowEditorWindow();
                return;
            }
            if (this.isRightButtonEdit) {
                this.isRightButtonEdit = false;
                // Finish selectiong a line
                this.lineSingleHitTester.processLayer(env.currentVectorLayer, e.location[0], e.location[1], env.mouseCursorRadius);
                var hitedLine = this.lineSingleHitTester.hitedLine;
                if (hitedLine != null) {
                    if (env.currentVectorLine != null) {
                        env.currentVectorLine.isEditTarget = false;
                    }
                    env.setCurrentVectorLine(hitedLine, true);
                    env.setRedrawMainWindowEditorWindow();
                }
                return;
            }
        };
        Tool_ScratchLine.prototype.executeCommand = function (env) {
            this.viewScale = env.viewScale;
            var targetLine = env.currentVectorLine;
            ManualTracingTool.Logic_Edit_Line.calcParameters(this.editLine);
            // Resampling
            this.resampledLine = this.resampleLine(this.editLine);
            var startIndex = this.searchCutoutIndex(this.resampledLine, false);
            var endIndex = this.searchCutoutIndex(this.resampledLine, true);
            this.resampledLine.points = ListGetRange(this.resampledLine.points, startIndex, endIndex + 1);
            ManualTracingTool.Logic_Edit_Line.smooth(this.resampledLine);
            ManualTracingTool.Logic_Edit_Line.applyAdjustments(this.resampledLine);
            // Extruding line
            var forwardExtrude = true;
            var extrudeLine = this.generateExtrudePoints(targetLine, this.resampledLine, false);
            if (extrudeLine == null) {
                extrudeLine = this.generateExtrudePoints(targetLine, this.resampledLine, true);
                if (extrudeLine != null) {
                    forwardExtrude = false;
                }
            }
            this.forwardExtrude = forwardExtrude;
            this.extrudeLine = extrudeLine;
            // Scratching
            var candidatePointPairs = this.ganerateCandidatePoints(targetLine, this.resampledLine);
            // for display
            this.candidateLine = new ManualTracingTool.VectorLine();
            for (var _i = 0, candidatePointPairs_1 = candidatePointPairs; _i < candidatePointPairs_1.length; _i++) {
                var pair = candidatePointPairs_1[_i];
                this.candidateLine.points.push(pair.candidatePoint);
            }
            // command
            if (this.extrudeLine != null && this.extrudeLine.points.length > 0) {
                var command = new Command_ExtrudeLine();
                command.isContinuing = true;
                command.targetLine = targetLine;
                command.forwardExtrude = this.forwardExtrude;
                command.extrudeLine = this.extrudeLine;
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
            if (candidatePointPairs != null && candidatePointPairs.length > 0) {
                var command = new Command_ScratchLine();
                command.isContinued = (this.extrudeLine != null);
                command.targetLine = targetLine;
                for (var _a = 0, candidatePointPairs_2 = candidatePointPairs; _a < candidatePointPairs_2.length; _a++) {
                    var pair = candidatePointPairs_2[_a];
                    var editPoint = new Tool_ScratchLine_EditPoint();
                    editPoint.pair = pair;
                    command.editPoints.push(editPoint);
                }
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
        };
        Tool_ScratchLine.prototype.resampleLine = function (baseLine) {
            var sampledLine = new ManualTracingTool.VectorLine();
            var samplingLength = baseLine.totalLength / this.samplingDivisionCount;
            var samplePos = samplingLength;
            var currentIndex = 0;
            var sampledLength = 0.0;
            {
                var sampledPoint = new ManualTracingTool.LinePoint();
                vec3.copy(sampledPoint.location, baseLine.points[0].location);
                vec3.copy(sampledPoint.adjustedLocation, sampledPoint.location);
                sampledLine.points.push(sampledPoint);
            }
            var sampledCount = 1;
            while (sampledLength < baseLine.totalLength) {
                var currentPoint = baseLine.points[currentIndex];
                var nextPoint = baseLine.points[currentIndex + 1];
                var segmentLength = nextPoint.totalLength - currentPoint.totalLength;
                if (segmentLength == 0.0) {
                    currentIndex++;
                    if (currentIndex + 1 >= baseLine.points.length) {
                        break;
                    }
                }
                if (sampledLength + samplePos <= nextPoint.totalLength) {
                    var localPosition = (sampledLength + samplePos) - currentPoint.totalLength;
                    var positionRate = localPosition / segmentLength;
                    vec3.lerp(this.samplePoint, currentPoint.location, nextPoint.location, positionRate);
                    var sampledPoint = new ManualTracingTool.LinePoint();
                    vec3.copy(sampledPoint.location, this.samplePoint);
                    vec3.copy(sampledPoint.adjustedLocation, sampledPoint.location);
                    sampledLine.points.push(sampledPoint);
                    sampledLength = sampledLength + samplePos;
                    samplePos = samplingLength;
                    sampledCount++;
                    if (sampledCount >= this.samplingDivisionCount) {
                        break;
                    }
                }
                else {
                    samplePos = (sampledLength + samplePos) - nextPoint.totalLength;
                    sampledLength = nextPoint.totalLength;
                    currentIndex++;
                    if (currentIndex + 1 >= baseLine.points.length) {
                        break;
                    }
                }
            }
            {
                var sampledPoint = new ManualTracingTool.LinePoint();
                vec3.copy(sampledPoint.location, baseLine.points[baseLine.points.length - 1].location);
                vec3.copy(sampledPoint.adjustedLocation, sampledPoint.location);
                sampledLine.points.push(sampledPoint);
            }
            ManualTracingTool.Logic_Edit_Line.calcParameters(sampledLine);
            return sampledLine;
        };
        Tool_ScratchLine.prototype.searchCutoutIndex = function (editorLine, isForward) {
            var scanDirection = isForward ? 1 : -1;
            var cutoutIndex = isForward ? (editorLine.points.length - 1) : 0;
            var centerIndex = Math.floor(editorLine.points.length / 2);
            var scanRangeOffset = this.curveCheckPointCount * scanDirection;
            var limitCurvature = this.cutoutAngle;
            var k = centerIndex;
            while (k >= 0 && k < editorLine.points.length) {
                var scanCount = this.curveCheckPointCount;
                var totalCurvature = 0.0;
                var i = k + scanDirection;
                while (i >= 0 && i < editorLine.points.length) {
                    var point = editorLine.points[i];
                    totalCurvature += point.curvature;
                    scanCount--;
                    if (scanCount == 0) {
                        break;
                    }
                    i += scanDirection;
                }
                if (totalCurvature >= limitCurvature) {
                    cutoutIndex = i;
                    break;
                }
                k += scanDirection;
            }
            return cutoutIndex;
        };
        Tool_ScratchLine.prototype.ganerateCandidatePoints = function (target_Line, editorLine) {
            var result = new List();
            for (var _i = 0, _a = target_Line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                // Targets selected point only if line is selected
                if (target_Line.isSelected && !point.isSelected) {
                    continue;
                }
                // Search nearest segment
                var isHited = false;
                var minDistance = 99999.0;
                var nearestSegmentIndex = -1;
                var nearestLinePoint1 = null;
                var nearestLinePoint2 = null;
                for (var i = 0; i < editorLine.points.length - 1; i++) {
                    var editPoint1 = editorLine.points[i];
                    var editPoint2 = editorLine.points[i + 1];
                    var distance = ManualTracingTool.Logic_Points.pointToLineSegmentDistance(editPoint1.location, editPoint2.location, point.location[0], point.location[1]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestSegmentIndex = i;
                        nearestLinePoint1 = editPoint1;
                        nearestLinePoint2 = editPoint2;
                    }
                }
                if (nearestSegmentIndex != -1) {
                    // Calculate candidate point
                    ManualTracingTool.Logic_Points.pointToLineNearestPoint(this.nearestPoint, nearestLinePoint1.location, nearestLinePoint2.location, point.location);
                    // Calculate edit influence
                    var falloffDistance = ManualTracingTool.Logic_Points.pointToLineSegmentDistance(nearestLinePoint1.location, nearestLinePoint2.location, this.nearestPoint[0], this.nearestPoint[1]);
                    var editFalloffRadiusMax = this.editFalloffRadiusMax / this.viewScale;
                    var editFalloffRadiusMin = this.editFalloffRadiusMin / this.viewScale;
                    if (falloffDistance > editFalloffRadiusMax) {
                        continue;
                    }
                    var influenceDistance = vec3.distance(point.adjustedLocation, this.nearestPoint);
                    if (influenceDistance > editFalloffRadiusMax) {
                        continue;
                    }
                    var influence = ManualTracingTool.Maths.smoothstep(editFalloffRadiusMin, editFalloffRadiusMax, influenceDistance);
                    influence = 1.0 - ManualTracingTool.Maths.clamp(influence, 0.0, 1.0);
                    if (influence == 0.0) {
                        continue;
                    }
                    influence *= this.editInfluence;
                    // Create edit data
                    var candidatePoint = new ManualTracingTool.LinePoint();
                    vec3.copy(candidatePoint.location, this.nearestPoint);
                    vec3.copy(candidatePoint.adjustedLocation, candidatePoint.location);
                    var pair = new Tool_ScratchLine_CandidatePair();
                    pair.targetPoint = point;
                    pair.candidatePoint = candidatePoint;
                    pair.influence = influence;
                    result.push(pair);
                }
            }
            return result;
        };
        Tool_ScratchLine.prototype.generateExtrudePoints = function (targetLine, sampleLine, fromTargetLineTop) {
            var startPoint;
            if (fromTargetLineTop) {
                startPoint = targetLine.points[0];
            }
            else {
                startPoint = targetLine.points[targetLine.points.length - 1];
            }
            var sampleLine_NearestPointIndex = this.findNearestPointIndex_PointToPoint(sampleLine, startPoint, this.editExtrudeMinRadius, this.editExtrudeMaxRadius);
            if (sampleLine_NearestPointIndex == -1) {
                return null;
            }
            var nearPointCcount_SampleLineForward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, true, this.editExtrudeMaxRadius);
            var nearPointCcount_SampleLineBackward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, false, this.editExtrudeMaxRadius);
            var isForwardExtrudeInSampleLine = (nearPointCcount_SampleLineForward < 0 && nearPointCcount_SampleLineBackward >= 0);
            var isBackwardExtrudeInSampleLine = (nearPointCcount_SampleLineForward >= 0 && nearPointCcount_SampleLineBackward < 0);
            var extrudable = (isForwardExtrudeInSampleLine || isBackwardExtrudeInSampleLine);
            if (!extrudable) {
                return null;
            }
            var extrudeLine = new ManualTracingTool.VectorLine();
            extrudeLine.points = this.getExtrudePoints(targetLine, sampleLine, sampleLine_NearestPointIndex, isForwardExtrudeInSampleLine, this.editExtrudeMaxRadius);
            return extrudeLine;
        };
        Tool_ScratchLine.prototype.findNearestPointIndex_LineSegmentToPoint = function (line, point1, point2, limitMinDistance, limitMaxDistance, includeInnerSide, includeOuterSide) {
            var isHited = false;
            var minDistance = 99999.0;
            var nearestPointIndex = -1;
            for (var i = 0; i < line.points.length - 1; i++) {
                var linePoint = line.points[i];
                var distance = vec3.distance(point1.location, linePoint.location);
                if (distance < minDistance) {
                    var normPosition = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, linePoint.location);
                    if ((includeInnerSide && normPosition >= 0.0 && normPosition <= 1.0)
                        || (includeOuterSide && normPosition < 0.0 || normPosition > 1.0)) {
                        if (distance > limitMinDistance
                            && distance < limitMaxDistance) {
                            minDistance = distance;
                            nearestPointIndex = i;
                        }
                    }
                }
            }
            return nearestPointIndex;
        };
        Tool_ScratchLine.prototype.findNearestPointIndex_PointToPoint = function (line, point, limitMinDistance, limitMaxDistance) {
            var isHited = false;
            var minDistance = 99999.0;
            var nearestPointIndex = -1;
            for (var i = 0; i < line.points.length - 1; i++) {
                var linePoint = line.points[i];
                var distance = vec3.distance(point.location, linePoint.location);
                if (distance > limitMinDistance && distance < minDistance && distance < limitMaxDistance) {
                    minDistance = distance;
                    nearestPointIndex = i;
                }
            }
            return nearestPointIndex;
        };
        Tool_ScratchLine.prototype.getNearPointCount = function (targetLine, sampleLine, scanStartIndex, forwardSearch, limitMaxDistance) {
            var nearPointCcount = 0;
            var scanDirection = (forwardSearch ? 1 : -1);
            var currentIndex = scanStartIndex;
            var nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {
                var point1 = sampleLine.points[currentIndex];
                var point2 = sampleLine.points[nextIndex];
                var nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, true, true);
                if (nearestPointIndex != -1) {
                    nearPointCcount++;
                }
                else {
                    nearPointCcount--;
                }
                currentIndex += scanDirection;
                nextIndex += scanDirection;
            }
            return nearPointCcount;
        };
        Tool_ScratchLine.prototype.getExtrudePoints = function (targetLine, sampleLine, scanStartIndex, forwardSearch, limitMaxDistance) {
            var scanDirection = (forwardSearch ? 1 : -1);
            var startIndex = -1;
            var currentIndex = scanStartIndex;
            var nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {
                var point1 = sampleLine.points[currentIndex];
                var point2 = sampleLine.points[nextIndex];
                var nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, false, true);
                if (nearestPointIndex == -1) {
                    startIndex = currentIndex;
                    break;
                }
                currentIndex += scanDirection;
                nextIndex += scanDirection;
            }
            if (startIndex == -1) {
                return null;
            }
            var result = new List();
            if (forwardSearch) {
                for (var i = startIndex; i < sampleLine.points.length; i++) {
                    result.push(sampleLine.points[i]);
                }
            }
            else {
                for (var i = startIndex; i >= 0; i--) {
                    result.push(sampleLine.points[i]);
                }
            }
            return result;
        };
        return Tool_ScratchLine;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_ScratchLine = Tool_ScratchLine;
    var CommandEditVectorLine = /** @class */ (function () {
        function CommandEditVectorLine() {
            this.line = null;
            this.oldPointList = null;
            this.newPointList = null;
        }
        return CommandEditVectorLine;
    }());
    var Command_ExtrudeLine = /** @class */ (function (_super) {
        __extends(Command_ExtrudeLine, _super);
        function Command_ExtrudeLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLine = null;
            _this.forwardExtrude = false;
            _this.extrudeLine = null;
            _this.editLine = null;
            return _this;
        }
        Command_ExtrudeLine.prototype.execute = function (env) {
            this.errorCheck();
            this.prepareEditPoints();
            this.redo(env);
        };
        Command_ExtrudeLine.prototype.prepareEditPoints = function () {
            this.editLine = new CommandEditVectorLine();
            this.editLine.line = this.targetLine;
            this.editLine.oldPointList = this.targetLine.points;
            if (this.forwardExtrude) {
                this.editLine.newPointList = ListClone(this.targetLine.points);
                ListAddRange(this.editLine.newPointList, this.extrudeLine.points);
            }
            else {
                this.editLine.newPointList = List();
                for (var i = this.extrudeLine.points.length - 1; i >= 0; i--) {
                    this.editLine.newPointList.push(this.extrudeLine.points[i]);
                }
                ListAddRange(this.editLine.newPointList, this.targetLine.points);
            }
        };
        Command_ExtrudeLine.prototype.undo = function (env) {
            this.targetLine.points = this.editLine.oldPointList;
        };
        Command_ExtrudeLine.prototype.redo = function (env) {
            this.targetLine.points = this.editLine.newPointList;
        };
        Command_ExtrudeLine.prototype.errorCheck = function () {
        };
        return Command_ExtrudeLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_ExtrudeLine = Command_ExtrudeLine;
    var Command_ScratchLine = /** @class */ (function (_super) {
        __extends(Command_ScratchLine, _super);
        function Command_ScratchLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLine = null;
            _this.editPoints = new List();
            return _this;
        }
        Command_ScratchLine.prototype.execute = function (env) {
            this.errorCheck();
            this.prepareEditPoints();
            this.redo(env);
        };
        Command_ScratchLine.prototype.prepareEditPoints = function () {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var candidatePoint = editPoint.pair.candidatePoint;
                var targetPoint = editPoint.pair.targetPoint;
                vec3.copy(editPoint.oldLocation, targetPoint.adjustedLocation);
                if (editPoint.pair.influence > 0.0) {
                    vec3.lerp(editPoint.newLocation, targetPoint.location, candidatePoint.location, editPoint.pair.influence);
                }
                else {
                    vec3.copy(editPoint.newLocation, targetPoint.location);
                }
            }
        };
        Command_ScratchLine.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                vec3.copy(targetPoint.location, editPoint.oldLocation);
                vec3.copy(targetPoint.adjustedLocation, targetPoint.location);
            }
        };
        Command_ScratchLine.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustedLocation, targetPoint.location);
            }
        };
        Command_ScratchLine.prototype.errorCheck = function () {
            if (this.targetLine == null) {
                throw ('Command_ScratchLine: line is null!');
            }
        };
        return Command_ScratchLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_ScratchLine = Command_ScratchLine;
})(ManualTracingTool || (ManualTracingTool = {}));
