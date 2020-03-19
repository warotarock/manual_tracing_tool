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
    var SubjoinProcessingState = /** @class */ (function () {
        function SubjoinProcessingState() {
            this.isAvailable = true;
            this.nearestLine = null;
            this.nearestLine_SegmentIndex = ManualTracingTool.HitTest_Line.InvalidIndex;
            this.targetLine_SearchForward = false;
            this.targetLine_OrderedPoints = null;
            this.targetLine_SegmentIndex = ManualTracingTool.HitTest_Line.InvalidIndex;
            this.subjoinLine_OrderedPoints = null;
            this.newLine = null;
            this.deleteLines = new List();
        }
        return SubjoinProcessingState;
    }());
    var LineOverlappingInfo = /** @class */ (function () {
        function LineOverlappingInfo() {
            this.isAvailable = true;
            this.overlap_FirstIndex = -1;
            this.overlap_LastIndex = -1;
        }
        return LineOverlappingInfo;
    }());
    var Tool_ScratchLineDraw = /** @class */ (function (_super) {
        __extends(Tool_ScratchLineDraw, _super);
        function Tool_ScratchLineDraw() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '既存の線の端点近くに線を描いて線を結合します。';
            _this.editLineVec = vec3.fromValues(0.0, 0.0, 0.0);
            _this.targetLineVec = vec3.fromValues(0.0, 0.0, 0.0);
            return _this;
        }
        Tool_ScratchLineDraw.prototype.getMinDistanceRange = function (env) {
            return env.getViewScaledLength(env.drawLineBaseWidth * 8.0);
        };
        Tool_ScratchLineDraw.prototype.onDrawEditor = function (env, drawEnv) {
            var minDistanceRange = this.getMinDistanceRange(env);
            drawEnv.editorDrawer.drawMouseCursorCircle(minDistanceRange);
            if (this.editLine != null) {
                drawEnv.editorDrawer.drawEditorEditLineStroke(this.editLine);
            }
        };
        Tool_ScratchLineDraw.prototype.mouseMove = function (e, env) {
            env.setRedrawEditorWindow();
            if (this.editLine == null) {
                return;
            }
            if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {
                var point = new ManualTracingTool.LinePoint();
                vec3.copy(point.location, e.location);
                vec3.copy(point.adjustingLocation, e.location);
                point.lineWidth = env.drawLineBaseWidth;
                this.editLine.points.push(point);
            }
        };
        Tool_ScratchLineDraw.prototype.mouseUp = function (e, env) {
            if (this.isLeftButtonEdit) {
                this.isLeftButtonEdit = false;
                if (this.editLine == null
                    || this.editLine.points.length <= 1) {
                    return;
                }
                ManualTracingTool.Logic_Edit_Line.calculateParameters(this.editLine);
                this.editLine = this.generateCutoutedResampledLine(this.editLine, env);
                this.executeCommand(env);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
                return;
            }
        };
        Tool_ScratchLineDraw.prototype.keydown = function (e, env) {
            return false;
        };
        Tool_ScratchLineDraw.prototype.executeAddDrawLine = function (newLine, env) {
            ManualTracingTool.Logic_Edit_Line.smooth(newLine);
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            var divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(newLine.totalLength, resamplingUnitLength);
            var resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(newLine, divisionCount);
            var command = new ManualTracingTool.Command_AddLine();
            command.prepareEditTargets(env.currentVectorGroup, resampledLine);
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
            return resampledLine;
        };
        Tool_ScratchLineDraw.prototype.getNearestLine = function (state, targetPoint, geometry, minDistanceRange) {
            var nearestLine = null;
            var nearestLine_SegmentIndex = ManualTracingTool.HitTest_Line.InvalidIndex;
            var minDistance = ManualTracingTool.HitTest_Line.MaxDistance;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.none) {
                        continue;
                    }
                    if (ManualTracingTool.HitTest_Line.hitTestLocationToLineByRectangle(targetPoint.location, line, minDistanceRange)) {
                        var nearestSegmentIndex = ManualTracingTool.HitTest_Line.getNearestSegmentIndex(line, targetPoint.location);
                        if (nearestSegmentIndex != ManualTracingTool.HitTest_Line.InvalidIndex) {
                            var distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(line.points[nearestSegmentIndex].location, line.points[nearestSegmentIndex + 1].location, targetPoint.location);
                            if (distance < minDistanceRange) {
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    nearestLine = line;
                                    nearestLine_SegmentIndex = nearestSegmentIndex;
                                }
                            }
                        }
                    }
                }
            }
            if (nearestLine == null) {
                state.isAvailable = false;
                return false;
            }
            state.isAvailable = true;
            state.nearestLine = nearestLine;
            state.nearestLine_SegmentIndex = nearestLine_SegmentIndex;
        };
        Tool_ScratchLineDraw.prototype.getSearchDirectionForTargetLine = function (state, editLinePoint1, editLinePoint2) {
            var nearestLine = state.nearestLine;
            // Ditermine search-index direction
            var point1 = nearestLine.points[state.nearestLine_SegmentIndex];
            var point2 = nearestLine.points[state.nearestLine_SegmentIndex + 1];
            var firstPoint_Position = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, editLinePoint1.location);
            var secondPoint_Position = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, editLinePoint2.location);
            if (secondPoint_Position == firstPoint_Position) {
                state.isAvailable = false;
                return;
            }
            state.targetLine_SearchForward = (secondPoint_Position >= firstPoint_Position);
        };
        Tool_ScratchLineDraw.prototype.getLineOverlappingInfo = function (sourcePoints, source_StartIndex, targetPoints, target_StartIndex, minDistanceRange) {
            //重なる領域について
            //・元の線…①重なっている領域の一つ外の点、②重なっている領域の点
            //・対象の線…①重なっている領域の点、②重なっている領域の一つ外側の点
            //この領域を記録する値は、常に開始位置の値が終了位置の値以下とする（配列のインデクスそのまま）
            //その値に対応する点は重なっている領域の内側にあるとする（ぴったり境界の位置も含む）
            var source_Index = source_StartIndex;
            var target_Index = target_StartIndex;
            var target_IndexNext = target_StartIndex + 1;
            var isAvailable = true;
            var overlap_FirstIndex = -1;
            var overlap_LastIndex = -1;
            while (source_Index < sourcePoints.length
                && target_IndexNext < targetPoints.length) {
                var sourcePoint = sourcePoints[source_Index];
                var targetPoint1 = targetPoints[target_Index];
                var targetPoint2 = targetPoints[target_IndexNext];
                // tests whether the edit-point is nearby the target-line
                var distance = ManualTracingTool.Logic_Points.pointToLine_Distance(sourcePoint.location, targetPoint1.location, targetPoint2.location);
                if (distance > minDistanceRange) {
                    isAvailable = false;
                    break;
                }
                // if the edit-point is nearby, increment any one of search-index
                var localPosition = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(targetPoint1.location, targetPoint2.location, sourcePoint.location);
                if (localPosition <= 1.0) {
                    if (localPosition >= 0.0) {
                        if (overlap_FirstIndex == -1) {
                            overlap_FirstIndex = source_Index;
                        }
                        overlap_LastIndex = source_Index;
                    }
                    if (source_Index >= sourcePoints.length - 1) {
                        break;
                    }
                    else {
                        source_Index++;
                    }
                }
                else {
                    if (target_Index >= targetPoints.length - 2) {
                        break;
                    }
                    else {
                        target_Index++;
                        target_IndexNext++;
                    }
                }
            }
            var info = new LineOverlappingInfo();
            info.isAvailable = isAvailable;
            info.overlap_FirstIndex = overlap_FirstIndex;
            info.overlap_LastIndex = overlap_LastIndex;
            return info;
        };
        Tool_ScratchLineDraw.prototype.createSubjoinedLine = function (topPoints, topPonts_OverlappingInfo, followingPoints, followingPoints_OverlappingInfo, resamplingUnitLength, subjoinToAfter) {
            var newPoints = new List();
            var subjoinedIndex;
            if (subjoinToAfter) {
                ListAddRange(newPoints, topPoints);
                subjoinedIndex = newPoints.length - 1;
                ListAddRange(newPoints, ListGetRangeToLast(followingPoints, followingPoints_OverlappingInfo.overlap_LastIndex + 1));
            }
            else {
                ListAddRange(newPoints, ListGetRange(topPoints, 0, topPonts_OverlappingInfo.overlap_FirstIndex));
                subjoinedIndex = newPoints.length - 1;
                ListAddRange(newPoints, followingPoints);
            }
            if (subjoinedIndex < 0) {
                subjoinedIndex = 0;
            }
            // resampling for neighbor points of subjoined part
            if (subjoinedIndex - 2 >= 0 && subjoinedIndex + 4 <= newPoints.length - 1) {
                var resampledPoins = new List();
                ListAddRange(resampledPoins, ListGetRange(newPoints, 0, (subjoinedIndex - 2) + 1));
                ManualTracingTool.Logic_Edit_Points.resamplePoints(resampledPoins, newPoints, subjoinedIndex - 1, subjoinedIndex + 3, resamplingUnitLength);
                ListAddRange(resampledPoins, ListGetRangeToLast(newPoints, subjoinedIndex + 4));
                newPoints = resampledPoins;
            }
            var newLine = new ManualTracingTool.VectorLine();
            for (var _i = 0, newPoints_1 = newPoints; _i < newPoints_1.length; _i++) {
                var point = newPoints_1[_i];
                newLine.points.push(ManualTracingTool.LinePoint.clone(point));
            }
            return newLine;
        };
        Tool_ScratchLineDraw.prototype.executeProcessLine = function (state, subjoinLine, subjoinToAfter, env) {
            // get nearest line
            if (subjoinToAfter) {
                state.subjoinLine_OrderedPoints = ListClone(subjoinLine.points);
            }
            else {
                state.subjoinLine_OrderedPoints = ListReverse(subjoinLine.points);
            }
            var editLineFirstPoint = state.subjoinLine_OrderedPoints[0];
            var minDistanceRange = this.getMinDistanceRange(env);
            this.getNearestLine(state, editLineFirstPoint, env.currentVectorGeometry, minDistanceRange);
            if (!state.isAvailable) {
                return;
            }
            // get searching direction
            var editLineSecondPoint = state.subjoinLine_OrderedPoints[1];
            this.getSearchDirectionForTargetLine(state, editLineFirstPoint, editLineSecondPoint);
            if (!state.isAvailable) {
                return;
            }
            // get overlapping part
            if (state.targetLine_SearchForward) {
                state.targetLine_OrderedPoints = ListClone(state.nearestLine.points);
                state.targetLine_SegmentIndex = state.nearestLine_SegmentIndex;
            }
            else {
                state.targetLine_OrderedPoints = ListReverse(state.nearestLine.points);
                state.targetLine_SegmentIndex = (state.nearestLine.points.length - 1) - state.nearestLine_SegmentIndex - 1;
            }
            var editLine_OverlappingInfo = this.getLineOverlappingInfo(state.subjoinLine_OrderedPoints, 0, state.targetLine_OrderedPoints, state.targetLine_SegmentIndex, minDistanceRange);
            var nearestLine_OverlappingInfo = this.getLineOverlappingInfo(state.targetLine_OrderedPoints, state.targetLine_SegmentIndex, state.subjoinLine_OrderedPoints, 0, minDistanceRange);
            if (!editLine_OverlappingInfo.isAvailable || !nearestLine_OverlappingInfo.isAvailable) {
                state.isAvailable = false;
                return;
            }
            // join the two lines
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            state.newLine = this.createSubjoinedLine(state.targetLine_OrderedPoints, nearestLine_OverlappingInfo, subjoinLine.points, editLine_OverlappingInfo, resamplingUnitLength, true);
            // delete the joined line
            state.nearestLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.deleteLine;
            state.deleteLines.push(state.nearestLine);
            if (!subjoinToAfter) {
                state.newLine.points = ListReverse(state.newLine.points);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(state.newLine);
        };
        Tool_ScratchLineDraw.prototype.executeCommand = function (env) {
            if (this.editLine.points.length < 2) {
                return;
            }
            var processingState = new SubjoinProcessingState();
            // process forward direction for edit line
            this.executeProcessLine(processingState, this.editLine, true, env);
            // process backward direction for edit line if not processed
            if (!processingState.isAvailable) {
                this.editLine.points = ListReverse(this.editLine.points);
                ManualTracingTool.Logic_Edit_Line.calculateParameters(this.editLine);
                processingState = new SubjoinProcessingState();
                this.executeProcessLine(processingState, this.editLine, true, env);
            }
            // process to connect to another line
            if (processingState.isAvailable) {
                processingState.nearestLine = null;
                processingState.nearestLine_SegmentIndex = -1;
                processingState.subjoinLine_OrderedPoints = null;
                processingState.targetLine_OrderedPoints = null;
                processingState.targetLine_SearchForward = true;
                processingState.targetLine_SegmentIndex = -1;
                this.executeProcessLine(processingState, processingState.newLine, false, env);
                if (processingState.deleteLines.length > 0) {
                    var command = new ManualTracingTool.Command_DeleteFlaggedPoints();
                    if (command.prepareEditTargets(env)) {
                        command.executeCommand(env);
                        env.commandHistory.addCommand(command);
                    }
                }
                {
                    var command = new ManualTracingTool.Command_AddLine();
                    command.prepareEditTargets(env.currentVectorGroup, processingState.newLine);
                    command.isContinued = true;
                    command.executeCommand(env);
                    env.commandHistory.addCommand(command);
                }
            }
            else {
                //this.executeAddDrawLine(this.editLine, env);
            }
            this.editLine = null;
            env.setRedrawCurrentLayer();
            env.setRedrawEditorWindow();
        };
        return Tool_ScratchLineDraw;
    }(ManualTracingTool.Tool_ScratchLine));
    ManualTracingTool.Tool_ScratchLineDraw = Tool_ScratchLineDraw;
})(ManualTracingTool || (ManualTracingTool = {}));
