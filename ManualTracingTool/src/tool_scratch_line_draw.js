var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_ScratchLineWidth_EditPoint {
        constructor() {
            this.pair = null;
            this.newLineWidth = 0.0;
            this.oldLineWidth = 0.0;
            this.newLocation = vec3.create();
            this.oldLocation = vec3.create();
        }
    }
    class SubjoinProcessingState {
        constructor() {
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
    }
    class LineOverlappingInfo {
        constructor() {
            this.isAvailable = true;
            this.overlap_FirstIndex = -1;
            this.overlap_LastIndex = -1;
        }
    }
    class Tool_ScratchLineDraw extends ManualTracingTool.Tool_ScratchLine {
        constructor() {
            super(...arguments);
            this.helpText = '既存の線の端点近くに線を描いて線を結合します。';
            this.editLineVec = vec3.fromValues(0.0, 0.0, 0.0);
            this.targetLineVec = vec3.fromValues(0.0, 0.0, 0.0);
        }
        getMinDistanceRange(env) {
            return env.getViewScaledLength(env.drawLineBaseWidth * 8.0);
        }
        onDrawEditor(env, drawEnv) {
            let minDistanceRange = this.getMinDistanceRange(env);
            drawEnv.editorDrawer.drawMouseCursorCircle(minDistanceRange);
            if (this.editLine != null) {
                drawEnv.editorDrawer.drawEditorEditLineStroke(this.editLine);
            }
        }
        mouseMove(e, env) {
            env.setRedrawEditorWindow();
            if (this.editLine == null) {
                return;
            }
            if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {
                let point = new ManualTracingTool.LinePoint();
                vec3.copy(point.location, e.location);
                vec3.copy(point.adjustingLocation, e.location);
                point.lineWidth = env.drawLineBaseWidth;
                this.editLine.points.push(point);
            }
        }
        mouseUp(e, env) {
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
        }
        keydown(e, env) {
            return false;
        }
        executeAddDrawLine(newLine, env) {
            ManualTracingTool.Logic_Edit_Line.smooth(newLine);
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(newLine.totalLength, resamplingUnitLength);
            let resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(newLine, divisionCount);
            let command = new ManualTracingTool.Command_AddLine();
            command.prepareEditTargets(env.currentVectorGroup, resampledLine);
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
            return resampledLine;
        }
        getNearestLine(state, targetPoint, geometry, minDistanceRange) {
            let nearestLine = null;
            let nearestLine_SegmentIndex = ManualTracingTool.HitTest_Line.InvalidIndex;
            let minDistance = ManualTracingTool.HitTest_Line.MaxDistance;
            for (let group of geometry.groups) {
                for (let line of group.lines) {
                    if (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.none) {
                        continue;
                    }
                    if (ManualTracingTool.HitTest_Line.hitTestLocationToLineByRectangle(targetPoint.location, line, minDistanceRange)) {
                        let nearestSegmentIndex = ManualTracingTool.HitTest_Line.getNearestSegmentIndex(line, targetPoint.location);
                        if (nearestSegmentIndex != ManualTracingTool.HitTest_Line.InvalidIndex) {
                            let distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(line.points[nearestSegmentIndex].location, line.points[nearestSegmentIndex + 1].location, targetPoint.location);
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
        }
        getSearchDirectionForTargetLine(state, editLinePoint1, editLinePoint2) {
            let nearestLine = state.nearestLine;
            // Ditermine search-index direction
            let point1 = nearestLine.points[state.nearestLine_SegmentIndex];
            let point2 = nearestLine.points[state.nearestLine_SegmentIndex + 1];
            let firstPoint_Position = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, editLinePoint1.location);
            let secondPoint_Position = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, editLinePoint2.location);
            if (secondPoint_Position == firstPoint_Position) {
                state.isAvailable = false;
                return;
            }
            state.targetLine_SearchForward = (secondPoint_Position >= firstPoint_Position);
        }
        getLineOverlappingInfo(sourcePoints, source_StartIndex, targetPoints, target_StartIndex, minDistanceRange) {
            //重なる領域について
            //・元の線…①重なっている領域の一つ外の点、②重なっている領域の点
            //・対象の線…①重なっている領域の点、②重なっている領域の一つ外側の点
            //この領域を記録する値は、常に開始位置の値が終了位置の値以下とする（配列のインデクスそのまま）
            //その値に対応する点は重なっている領域の内側にあるとする（ぴったり境界の位置も含む）
            let source_Index = source_StartIndex;
            let target_Index = target_StartIndex;
            let target_IndexNext = target_StartIndex + 1;
            let isAvailable = true;
            let overlap_FirstIndex = -1;
            let overlap_LastIndex = -1;
            while (source_Index < sourcePoints.length
                && target_IndexNext < targetPoints.length) {
                let sourcePoint = sourcePoints[source_Index];
                let targetPoint1 = targetPoints[target_Index];
                let targetPoint2 = targetPoints[target_IndexNext];
                // tests whether the edit-point is nearby the target-line
                let distance = ManualTracingTool.Logic_Points.pointToLine_Distance(sourcePoint.location, targetPoint1.location, targetPoint2.location);
                if (distance > minDistanceRange) {
                    isAvailable = false;
                    break;
                }
                // if the edit-point is nearby, increment any one of search-index
                let localPosition = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(targetPoint1.location, targetPoint2.location, sourcePoint.location);
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
            let info = new LineOverlappingInfo();
            info.isAvailable = isAvailable;
            info.overlap_FirstIndex = overlap_FirstIndex;
            info.overlap_LastIndex = overlap_LastIndex;
            return info;
        }
        createSubjoinedLine(topPoints, topPonts_OverlappingInfo, followingPoints, followingPoints_OverlappingInfo, resamplingUnitLength, subjoinToAfter) {
            let newPoints = new List();
            let subjoinedIndex;
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
                let resampledPoins = new List();
                ListAddRange(resampledPoins, ListGetRange(newPoints, 0, (subjoinedIndex - 2) + 1));
                ManualTracingTool.Logic_Edit_Points.resamplePoints(resampledPoins, newPoints, subjoinedIndex - 1, subjoinedIndex + 3, resamplingUnitLength);
                ListAddRange(resampledPoins, ListGetRangeToLast(newPoints, subjoinedIndex + 4));
                newPoints = resampledPoins;
            }
            let newLine = new ManualTracingTool.VectorLine();
            for (let point of newPoints) {
                newLine.points.push(ManualTracingTool.LinePoint.clone(point));
            }
            return newLine;
        }
        executeProcessLine(state, subjoinLine, subjoinToAfter, env) {
            // get nearest line
            if (subjoinToAfter) {
                state.subjoinLine_OrderedPoints = ListClone(subjoinLine.points);
            }
            else {
                state.subjoinLine_OrderedPoints = ListReverse(subjoinLine.points);
            }
            let editLineFirstPoint = state.subjoinLine_OrderedPoints[0];
            let minDistanceRange = this.getMinDistanceRange(env);
            this.getNearestLine(state, editLineFirstPoint, env.currentVectorGeometry, minDistanceRange);
            if (!state.isAvailable) {
                return;
            }
            // get searching direction
            let editLineSecondPoint = state.subjoinLine_OrderedPoints[1];
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
            let editLine_OverlappingInfo = this.getLineOverlappingInfo(state.subjoinLine_OrderedPoints, 0, state.targetLine_OrderedPoints, state.targetLine_SegmentIndex, minDistanceRange);
            let nearestLine_OverlappingInfo = this.getLineOverlappingInfo(state.targetLine_OrderedPoints, state.targetLine_SegmentIndex, state.subjoinLine_OrderedPoints, 0, minDistanceRange);
            if (!editLine_OverlappingInfo.isAvailable || !nearestLine_OverlappingInfo.isAvailable) {
                state.isAvailable = false;
                return;
            }
            // join the two lines
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            state.newLine = this.createSubjoinedLine(state.targetLine_OrderedPoints, nearestLine_OverlappingInfo, subjoinLine.points, editLine_OverlappingInfo, resamplingUnitLength, true);
            // delete the joined line
            state.nearestLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.deleteLine;
            state.deleteLines.push(state.nearestLine);
            if (!subjoinToAfter) {
                state.newLine.points = ListReverse(state.newLine.points);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(state.newLine);
        }
        executeCommand(env) {
            if (this.editLine.points.length < 2) {
                return;
            }
            let processingState = new SubjoinProcessingState();
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
                    let command = new ManualTracingTool.Command_DeleteFlaggedPoints();
                    if (command.prepareEditTargets(env)) {
                        command.executeCommand(env);
                        env.commandHistory.addCommand(command);
                    }
                }
                {
                    let command = new ManualTracingTool.Command_AddLine();
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
        }
    }
    ManualTracingTool.Tool_ScratchLineDraw = Tool_ScratchLineDraw;
})(ManualTracingTool || (ManualTracingTool = {}));
