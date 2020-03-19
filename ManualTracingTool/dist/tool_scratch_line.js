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
    var Tool_ScratchLine_CandidatePair = /** @class */ (function () {
        function Tool_ScratchLine_CandidatePair() {
            this.targetPoint = null;
            this.candidatePoint = null;
            this.normPosition = 0.0;
            this.totalLength = 0.0;
            this.influence = 0.0;
        }
        return Tool_ScratchLine_CandidatePair;
    }());
    ManualTracingTool.Tool_ScratchLine_CandidatePair = Tool_ScratchLine_CandidatePair;
    var Tool_ScratchLine_EditPoint = /** @class */ (function () {
        function Tool_ScratchLine_EditPoint() {
            this.pair = null;
            this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
        }
        return Tool_ScratchLine_EditPoint;
    }());
    var Tool_ScratchLine = /** @class */ (function (_super) {
        __extends(Tool_ScratchLine, _super);
        function Tool_ScratchLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '右クリック(G)で線を選択し、左クリックで線を修正します。';
            _this.enableScratchEdit = true;
            _this.enableExtrude = false;
            _this.editLine = null;
            _this.resampledLine = null;
            _this.candidateLine = null;
            _this.forwardExtrude = false;
            _this.extrudeLine = null;
            _this.nearestPointLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.samplePoint = vec3.fromValues(0.0, 0.0, 0.0);
            _this.lineSingleHitTester = new ManualTracingTool.HitTest_Line_PointToLineByDistanceSingle();
            _this.isLeftButtonEdit = false;
            _this.isRightButtonEdit = false;
            _this.maxResamplingDivisionCount = 51;
            _this.curveCheckPointCount = 3;
            _this.cutoutAngle = 30 / 180.0 * Math.PI;
            _this.editFalloffRadiusMinRate = 0.15;
            _this.editFalloffRadiusMaxRate = 2.0;
            _this.editFalloffRadiusContainsLineWidth = false;
            _this.editInfluence = 0.5;
            _this.editExtrudeMinRadiusRate = 0.5;
            _this.editExtrudeMaxRadiusRate = 1.0;
            _this.tool_ScratchLine_EditLine_Visible = true;
            _this.tool_ScratchLine_TargetLine_Visible = true;
            _this.tool_ScratchLine_SampledLine_Visible = true;
            _this.tool_ScratchLine_CandidatePoints_Visible = false;
            _this.tool_ScratchLine_ExtrudePoints_Visible = false;
            return _this;
        }
        Tool_ScratchLine.prototype.isAvailable = function (env) {
            return (env.currentLayer != null
                && ManualTracingTool.Layer.isEditTarget(env.currentLayer));
        };
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
                vec3.copy(point.adjustingLocation, e.location);
                //point.lineWidth = env.mouseCursorViewRadius * 2.0;
                point.lineWidth = env.drawLineBaseWidth;
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
                ManualTracingTool.Logic_Edit_Line.calculateParameters(this.editLine);
                this.executeCommand(env);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
                return;
            }
            if (this.isRightButtonEdit) {
                this.isRightButtonEdit = false;
                // Finish selectiong a line
                this.selectLine(e.location, env);
                return;
            }
        };
        Tool_ScratchLine.prototype.keydown = function (e, env) {
            if (e.key == 'g') {
                // Select a line
                this.selectLine(env.mouseCursorLocation, env);
                return true;
            }
            return false;
        };
        Tool_ScratchLine.prototype.onDrawEditor = function (env, drawEnv) {
            drawEnv.editorDrawer.drawMouseCursor();
            if (this.tool_ScratchLine_EditLine_Visible) {
                if (this.editLine != null && this.resampledLine == null) {
                    drawEnv.editorDrawer.drawEditorEditLineStroke(this.editLine);
                }
            }
            if (this.tool_ScratchLine_TargetLine_Visible) {
                var drawPointsAll = false;
                if (env.currentVectorLine != null) {
                    if (drawPointsAll) {
                        if (env.currentVectorLayer != null) {
                            drawEnv.editorDrawer.drawEditorVectorLinePoints(env.currentVectorLine, env.currentVectorLayer.layerColor, false);
                        }
                    }
                    else {
                        if (env.currentVectorLine.points.length >= 2) {
                            drawEnv.editorDrawer.drawEditorVectorLinePoint(env.currentVectorLine.points[0], env.drawStyle.sampledPointColor, false);
                            drawEnv.editorDrawer.drawEditorVectorLinePoint(env.currentVectorLine.points[env.currentVectorLine.points.length - 1], env.drawStyle.sampledPointColor, false);
                        }
                    }
                }
            }
            if (this.tool_ScratchLine_SampledLine_Visible) {
                if (this.resampledLine != null) {
                    drawEnv.editorDrawer.drawEditorVectorLinePoints(this.resampledLine, drawEnv.style.sampledPointColor, false);
                }
            }
            if (this.tool_ScratchLine_CandidatePoints_Visible) {
                if (this.candidateLine != null) {
                    drawEnv.editorDrawer.drawEditorVectorLinePoints(this.candidateLine, drawEnv.style.linePointColor, false);
                }
            }
            if (this.tool_ScratchLine_ExtrudePoints_Visible) {
                if (this.extrudeLine != null) {
                    drawEnv.editorDrawer.drawEditorVectorLinePoints(this.extrudeLine, drawEnv.style.extrutePointColor, false);
                }
            }
        };
        Tool_ScratchLine.prototype.selectLine = function (location, env) {
            var _this = this;
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            var hitedLine = null;
            var hitedGroup = null;
            ManualTracingTool.ViewKeyframeLayer.forEachGeometry(viewKeyframeLayers, function (geometry) {
                if (hitedLine == null) {
                    _this.lineSingleHitTester.startProcess();
                    _this.lineSingleHitTester.processLayer(geometry, location, env.mouseCursorViewRadius);
                    hitedLine = _this.lineSingleHitTester.hitedLine;
                    hitedGroup = _this.lineSingleHitTester.hitedGroup;
                }
            });
            if (hitedLine != null) {
                env.setCurrentVectorLine(hitedLine, hitedGroup);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
        };
        Tool_ScratchLine.prototype.executeCommand = function (env) {
            var isExtrudeDone = false;
            var isScratchingDone = false;
            var targetLine = env.currentVectorLine;
            var targetGroup = env.currentVectorGroup;
            var oldPoints = targetLine.points;
            if (this.enableExtrude) {
                var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
                var divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);
                this.resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);
                isExtrudeDone = this.executeExtrudeLine(targetLine, targetGroup, this.resampledLine, env);
            }
            if (this.enableScratchEdit) {
                this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);
                isScratchingDone = this.executeScratchingLine(targetLine, targetGroup, this.resampledLine, isExtrudeDone, env);
            }
            if (isExtrudeDone || isScratchingDone) {
                this.deleteDuplications(targetLine, targetGroup, env);
            }
            ManualTracingTool.Logic_Edit_VectorLayer.clearPointModifyFlags(oldPoints);
        };
        // Adjusting edit line
        Tool_ScratchLine.prototype.cutoutLine = function (result) {
            var startIndex = this.searchCutoutIndex(result, false);
            var endIndex = this.searchCutoutIndex(result, true);
            result.points = ListGetRange(result.points, startIndex, (endIndex - startIndex) + 1);
            ManualTracingTool.Logic_Edit_Line.smooth(result);
            ManualTracingTool.Logic_Edit_Line.applyAdjustments(result);
            return result;
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
        Tool_ScratchLine.prototype.generateCutoutedResampledLine = function (editorLine, env) {
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            var divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(editorLine.totalLength, resamplingUnitLength);
            if (divisionCount > this.maxResamplingDivisionCount) {
                divisionCount = this.maxResamplingDivisionCount;
            }
            var resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(editorLine, divisionCount);
            //Logic_Edit_Line.smooth(resampledLine);
            this.cutoutLine(resampledLine);
            return resampledLine;
        };
        // Extruding edit
        Tool_ScratchLine.prototype.executeExtrudeLine = function (targetLine, targetGroup, resampledLine, env) {
            // Create extrude points
            var baseRadius = env.mouseCursorViewRadius;
            var editExtrudeMinRadius = baseRadius * this.editExtrudeMinRadiusRate;
            var editExtrudeMaxRadius = baseRadius * this.editExtrudeMaxRadiusRate;
            var forwardExtrude = true;
            var extrudeLine = this.generateExtrudePoints(false, targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius); // forward extrude
            if (extrudeLine == null) {
                extrudeLine = this.generateExtrudePoints(true, targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius); // backword extrude
                if (extrudeLine != null) {
                    forwardExtrude = false;
                }
            }
            // Execute command
            this.forwardExtrude = forwardExtrude;
            this.extrudeLine = extrudeLine;
            if (extrudeLine != null && extrudeLine.points.length > 0) {
                var command = new Command_ExtrudeLine();
                command.targetLine = targetLine;
                command.forwardExtrude = forwardExtrude;
                command.extrudeLine = extrudeLine;
                command.useGroup(targetGroup);
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
                return true;
            }
            else {
                return false;
            }
        };
        Tool_ScratchLine.prototype.generateExtrudePoints = function (fromTargetLineTop, targetLine, sampleLine, editExtrudeMinRadius, editExtrudeMaxRadius) {
            var startPoint;
            if (fromTargetLineTop) {
                startPoint = targetLine.points[0];
            }
            else {
                startPoint = targetLine.points[targetLine.points.length - 1];
            }
            var sampleLine_NearestPointIndex = this.findNearestPointIndex_PointToPoint(sampleLine, startPoint, 0.0, editExtrudeMaxRadius);
            if (sampleLine_NearestPointIndex == -1) {
                return null;
            }
            var nearPointCount_SampleLineForward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, true, editExtrudeMaxRadius);
            var nearPointCount_SampleLineBackward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, false, editExtrudeMaxRadius);
            //console.log(sampleLine_NearestPointIndex + ' ' + nearPointCount_SampleLineForward + ' ' + nearPointCount_SampleLineBackward);
            var isForwardExtrudeInSampleLine = (nearPointCount_SampleLineForward < 0 && nearPointCount_SampleLineBackward >= 0);
            var isBackwardExtrudeInSampleLine = (nearPointCount_SampleLineForward >= 0 && nearPointCount_SampleLineBackward < 0);
            var extrudable = (isForwardExtrudeInSampleLine || isBackwardExtrudeInSampleLine);
            if (!extrudable) {
                return null;
            }
            var extrudePoints = this.getExtrudePoints(targetLine, sampleLine, sampleLine_NearestPointIndex, isForwardExtrudeInSampleLine, editExtrudeMinRadius, editExtrudeMaxRadius);
            if (extrudePoints == null) {
                // when all points is far away from edit line
                return null;
            }
            var extrudeLine = new ManualTracingTool.VectorLine();
            extrudeLine.points = extrudePoints;
            return extrudeLine;
        };
        Tool_ScratchLine.prototype.getExtrudePoints = function (targetLine, sampleLine, searchStartIndex, forwardSearch, limitMinDistance, limitMaxDistance) {
            var scanDirection = (forwardSearch ? 1 : -1);
            var startIndex = -1;
            var currentIndex = searchStartIndex;
            var nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {
                var point1 = sampleLine.points[currentIndex];
                var point2 = sampleLine.points[nextIndex];
                var nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, limitMinDistance, limitMaxDistance, false, true);
                if (nearestPointIndex == -1) {
                    startIndex = nextIndex;
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
        // Scratching edit
        Tool_ScratchLine.prototype.executeScratchingLine = function (targetLine, targetGroup, resampledLine, isExtrudeDone, env) {
            // Get scratching candidate points
            var baseRadius = env.mouseCursorViewRadius;
            var editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            var editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
            var candidatePointPairs = this.ganerateScratchingCandidatePoints(targetLine, resampledLine, editFalloffRadiusMin, editFalloffRadiusMax, this.editFalloffRadiusContainsLineWidth);
            // For display
            this.candidateLine = new ManualTracingTool.VectorLine();
            for (var _i = 0, candidatePointPairs_1 = candidatePointPairs; _i < candidatePointPairs_1.length; _i++) {
                var pair = candidatePointPairs_1[_i];
                this.candidateLine.points.push(pair.candidatePoint);
            }
            // Execute command
            if (candidatePointPairs != null && candidatePointPairs.length > 0) {
                var command = new Command_ScratchLine();
                command.isContinued = isExtrudeDone;
                command.targetLine = targetLine;
                for (var _a = 0, candidatePointPairs_2 = candidatePointPairs; _a < candidatePointPairs_2.length; _a++) {
                    var pair = candidatePointPairs_2[_a];
                    var editPoint = new Tool_ScratchLine_EditPoint();
                    editPoint.pair = pair;
                    command.editPoints.push(editPoint);
                }
                command.useGroup(targetGroup);
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
                return true;
            }
            else {
                return false;
            }
        };
        Tool_ScratchLine.prototype.ganerateScratchingCandidatePoints = function (target_Line, editorLine, editFalloffRadiusMin, editFalloffRadiusMax, containsPointLineWidth) {
            var result = new List();
            for (var _i = 0, _a = target_Line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                // Targets selected point only if line is selected
                //if (target_Line.isSelected && !point.isSelected) {
                //    continue;
                //}
                // Search nearest segment
                var isHited = false;
                var minDistance = 99999.0;
                var nearestSegmentIndex = -1;
                for (var i = 0; i < editorLine.points.length - 1; i++) {
                    var editPoint1 = editorLine.points[i];
                    var editPoint2 = editorLine.points[i + 1];
                    var distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(editPoint1.location, editPoint2.location, point.location);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestSegmentIndex = i;
                    }
                }
                if (nearestSegmentIndex != -1) {
                    var nearestLinePoint1 = editorLine.points[nearestSegmentIndex];
                    var nearestLinePoint2 = editorLine.points[nearestSegmentIndex + 1];
                    // Calculate candidate point
                    var nearestPoint_Available = ManualTracingTool.Logic_Points.pointToLine_NearestLocation(this.nearestPointLocation, nearestLinePoint1.location, nearestLinePoint2.location, point.location);
                    if (!nearestPoint_Available) {
                        continue;
                    }
                    var directDistance = vec3.distance(point.location, this.nearestPointLocation);
                    if (containsPointLineWidth) {
                        directDistance -= point.lineWidth * 0.5;
                        if (directDistance < 0.0) {
                            directDistance = 0.0;
                        }
                    }
                    if (directDistance > editFalloffRadiusMax) {
                        continue;
                    }
                    // Calculate edit influence
                    var sorroundingDistance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(nearestLinePoint1.location, nearestLinePoint2.location, this.nearestPointLocation);
                    if (sorroundingDistance > editFalloffRadiusMax) {
                        continue;
                    }
                    var normPositionInEditorLineSegment = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(nearestLinePoint1.location, nearestLinePoint2.location, point.location);
                    var totalLengthInEditorLine = (nearestLinePoint1.totalLength
                        + (nearestLinePoint2.totalLength - nearestLinePoint1.totalLength) * normPositionInEditorLineSegment);
                    var influence = this.calculateScratchingCandidatePointInfluence(editorLine.totalLength, sorroundingDistance, totalLengthInEditorLine, normPositionInEditorLineSegment, editFalloffRadiusMin, editFalloffRadiusMax);
                    if (influence > 0.0) {
                        // Create edit data
                        var candidatePoint = new ManualTracingTool.LinePoint();
                        vec3.copy(candidatePoint.location, this.nearestPointLocation);
                        vec3.copy(candidatePoint.adjustingLocation, candidatePoint.location);
                        candidatePoint.lineWidth = ManualTracingTool.Maths.lerp(normPositionInEditorLineSegment, nearestLinePoint1.lineWidth, nearestLinePoint2.lineWidth);
                        var pair = new Tool_ScratchLine_CandidatePair();
                        pair.targetPoint = point;
                        pair.candidatePoint = candidatePoint;
                        pair.normPosition = normPositionInEditorLineSegment;
                        pair.totalLength = totalLengthInEditorLine;
                        pair.influence = influence;
                        result.push(pair);
                        // Set the flag for after editing
                        point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.edit;
                    }
                }
            }
            return result;
        };
        Tool_ScratchLine.prototype.calculateScratchingCandidatePointInfluence = function (editorLine_TotalLength, sorroundingDistance, totalLengthInEditorLine, normPositionInEditorLineSegment, editFalloffRadiusMin, editFalloffRadiusMax) {
            var falloffDistance = 1.0;
            if (editorLine_TotalLength > editFalloffRadiusMax * 2.0) {
                if (totalLengthInEditorLine < editFalloffRadiusMax) {
                    //falloffDistance = 0.0;
                    falloffDistance = totalLengthInEditorLine / editFalloffRadiusMax;
                }
                if (totalLengthInEditorLine > editorLine_TotalLength - editFalloffRadiusMax) {
                    //falloffDistance = 0.0;
                    falloffDistance = (editorLine_TotalLength - totalLengthInEditorLine) / editFalloffRadiusMax;
                }
            }
            else {
                falloffDistance = 1.0 - sorroundingDistance / editFalloffRadiusMax;
            }
            var influence = ManualTracingTool.Maths.clamp(falloffDistance, 0.0, 1.0);
            if (influence == 0.0) {
                return 0.0;
            }
            influence *= this.editInfluence * ManualTracingTool.Maths.sigmoid10(1.0 - sorroundingDistance / editFalloffRadiusMax);
            return influence;
        };
        // Delete duplication edit
        Tool_ScratchLine.prototype.deleteDuplications = function (targetLine, targetGroup, env) {
            // Search edited index range of points
            var firstPointIndex = -1;
            var lastPointIndex = -1;
            for (var i = 0; i < targetLine.points.length; i++) {
                var point = targetLine.points[i];
                if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.edit) {
                    if (firstPointIndex == -1) {
                        firstPointIndex = i;
                    }
                    lastPointIndex = i;
                }
            }
            if (firstPointIndex > 0) {
                firstPointIndex--;
            }
            if (lastPointIndex < targetLine.points.length - 1) {
                lastPointIndex++;
            }
            if (lastPointIndex - firstPointIndex < 2) {
                return;
            }
            // Create new point list
            var newPoints = ListGetRange(targetLine.points, 0, firstPointIndex);
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            ManualTracingTool.Logic_Edit_Points.resamplePoints(newPoints, targetLine.points, firstPointIndex, lastPointIndex, resamplingUnitLength);
            for (var index = lastPointIndex + 1; index < targetLine.points.length; index++) {
                newPoints.push(targetLine.points[index]);
            }
            // Execute command
            var command = new Command_DeleteDuplicationInLine();
            command.isContinued = true;
            command.targetLine = targetLine;
            command.oldPoints = targetLine.points;
            command.newPoints = newPoints;
            command.useGroup(targetGroup);
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        };
        // Common functions
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
                        || (includeOuterSide && (normPosition < 0.0 || normPosition > 1.0))) {
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
                if (distance < minDistance
                    && distance > limitMinDistance
                    && distance < limitMaxDistance) {
                    minDistance = distance;
                    nearestPointIndex = i;
                }
            }
            return nearestPointIndex;
        };
        Tool_ScratchLine.prototype.getNearPointCount = function (targetLine, sampleLine, searchStartIndex, forwardSearch, limitMaxDistance) {
            var nearPointCcount = 0;
            var scanDirection = (forwardSearch ? 1 : -1);
            var currentIndex = searchStartIndex;
            var nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {
                var point1 = sampleLine.points[currentIndex];
                var point2 = sampleLine.points[nextIndex];
                // find the nearest point in target-line by the sample-line's segment
                var nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, true, false);
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
        return Tool_ScratchLine;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_ScratchLine = Tool_ScratchLine;
    var Tool_ExtrudeLine = /** @class */ (function (_super) {
        __extends(Tool_ExtrudeLine, _super);
        function Tool_ExtrudeLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '右クリックで線を選択し、左クリックで線の端の近くから線を描きはじめると線が延長されます。';
            _this.enableScratchEdit = false;
            _this.enableExtrude = true;
            return _this;
        }
        return Tool_ExtrudeLine;
    }(Tool_ScratchLine));
    ManualTracingTool.Tool_ExtrudeLine = Tool_ExtrudeLine;
    var Command_ExtrudeLine = /** @class */ (function (_super) {
        __extends(Command_ExtrudeLine, _super);
        function Command_ExtrudeLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetGroups = null;
            _this.targetLine = null;
            _this.forwardExtrude = false;
            _this.extrudeLine = null;
            _this.oldPointList = null;
            _this.newPointList = null;
            return _this;
        }
        Command_ExtrudeLine.prototype.execute = function (env) {
            this.prepareEditPoints();
            this.redo(env);
        };
        Command_ExtrudeLine.prototype.prepareEditPoints = function () {
            this.oldPointList = this.targetLine.points;
            if (this.forwardExtrude) {
                this.newPointList = ListClone(this.targetLine.points);
                ListAddRange(this.newPointList, this.extrudeLine.points);
            }
            else {
                this.newPointList = List();
                for (var i = this.extrudeLine.points.length - 1; i >= 0; i--) {
                    this.newPointList.push(this.extrudeLine.points[i]);
                }
                ListAddRange(this.newPointList, this.targetLine.points);
            }
        };
        Command_ExtrudeLine.prototype.undo = function (env) {
            this.targetLine.points = this.oldPointList;
        };
        Command_ExtrudeLine.prototype.redo = function (env) {
            this.targetLine.points = this.newPointList;
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
            this.prepareEditPoints();
            this.redo(env);
        };
        Command_ScratchLine.prototype.prepareEditPoints = function () {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var candidatePoint = editPoint.pair.candidatePoint;
                var targetPoint = editPoint.pair.targetPoint;
                vec3.copy(editPoint.oldLocation, targetPoint.adjustingLocation);
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
                vec3.copy(targetPoint.adjustingLocation, targetPoint.location);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        Command_ScratchLine.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                var targetPoint = editPoint.pair.targetPoint;
                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustingLocation, targetPoint.location);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        return Command_ScratchLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_ScratchLine = Command_ScratchLine;
    var Command_DeleteDuplicationInLine = /** @class */ (function (_super) {
        __extends(Command_DeleteDuplicationInLine, _super);
        function Command_DeleteDuplicationInLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLine = null;
            _this.oldPoints = null;
            _this.newPoints = null;
            return _this;
        }
        Command_DeleteDuplicationInLine.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_DeleteDuplicationInLine.prototype.undo = function (env) {
            this.targetLine.points = this.oldPoints;
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        Command_DeleteDuplicationInLine.prototype.redo = function (env) {
            this.targetLine.points = this.newPoints;
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        };
        return Command_DeleteDuplicationInLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_DeleteDuplicationInLine = Command_DeleteDuplicationInLine;
})(ManualTracingTool || (ManualTracingTool = {}));