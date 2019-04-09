
namespace ManualTracingTool {

    class Tool_ScratchLineWidth_EditPoint {

        pair: Tool_ScratchLine_CandidatePair = null;

        newLineWidth = 0.0;
        oldLineWidth = 0.0;
        newLocation = vec3.create();
        oldLocation = vec3.create();
    }

    class NearestLineInfo {

        isAvailable = true;

        nearestLine: VectorLine = null;
        nearestLine_SegmentIndex = HitTest_Line.InvalidIndex;

        targetLine_SearchForward = false;
        targetLine_OrderedPoints: List<LinePoint> = null;
        targetLine_SegmentIndex = HitTest_Line.InvalidIndex;
    }

    class LineOverlappingInfo {

        isAvailable = true;
        overlap_FirstIndex = -1;
        overlap_LastIndex = -1;
    }

    export class Tool_ScratchLineDraw extends ManualTracingTool.Tool_ScratchLine {

        helpText = '線を描きます。既存の線の端点近くに線を描いた場合、線を結合します。';

        editLineVec = vec3.fromValues(0.0, 0.0, 0.0);
        targetLineVec = vec3.fromValues(0.0, 0.0, 0.0);

        getMinDistanceRange(env: ToolEnvironment): float {

            return env.getViewScaledLength(env.drawLineBaseWidth * 8.0);
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            let minDistanceRange = this.getMinDistanceRange(env);
            drawEnv.editorDrawer.drawMouseCursorCircle(minDistanceRange);

            if (this.editLine != null) {

                drawEnv.editorDrawer.drawEditorEditLineStroke(this.editLine);
            }
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.setRedrawEditorWindow();

            if (this.editLine == null) {
                return;
            }

            if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {

                let point = new LinePoint();
                vec3.copy(point.location, e.location);
                vec3.copy(point.adjustingLocation, e.location);
                point.lineWidth = env.drawLineBaseWidth;

                this.editLine.points.push(point);
            }
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.isLeftButtonEdit) {

                this.isLeftButtonEdit = false;

                if (this.editLine == null
                    || this.editLine.points.length <= 1) {

                    return;
                }

                Logic_Edit_Line.calculateParameters(this.editLine);

                this.executeCommand(env);

                env.setRedrawMainWindowEditorWindow();

                return;
            }
        }

        public executeAddDrawLine(env: ToolEnvironment) {

            Logic_Edit_Line.smooth(this.editLine);

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);

            let resampledLine = Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);

            let command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = resampledLine;
            command.execute(env);
            env.commandHistory.addCommand(command);
        }

        private getNearestLine(info: NearestLineInfo, targetPoint: LinePoint, geometry: VectorLayerGeometry, minDistanceRange: float) {

            // Search nearest line and segment about the editor line top point

            let nearestLine: VectorLine = null;
            let nearestLine_SegmentIndex = HitTest_Line.InvalidIndex;

            let minDistance = HitTest_Line.MaxDistance;

            for (let group of geometry.groups) {

                for (let line of group.lines) {

                    if (line.modifyFlag != VectorLineModifyFlagID.none) {

                        continue;
                    }

                    if (HitTest_Line.hitTestLocationToLineByRectangle(targetPoint.location, line, minDistanceRange)) {

                        let nearestSegmentIndex = HitTest_Line.getNearestSegmentIndex(
                            line,
                            targetPoint.location
                        );

                        if (nearestSegmentIndex != HitTest_Line.InvalidIndex) {

                            let distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                                line.points[nearestSegmentIndex].location,
                                line.points[nearestSegmentIndex + 1].location,
                                targetPoint.location
                            );

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

                info.isAvailable = false;
                return false;
            }

            info.isAvailable = true;
            info.nearestLine = nearestLine;
            info.nearestLine_SegmentIndex = nearestLine_SegmentIndex;
        }

        private getSearchDirectionForTargetLine(info: NearestLineInfo, editLinePoint1: LinePoint, editLinePoint2: LinePoint) {

            let nearestLine = info.nearestLine;

            // Ditermine search-index direction
            {
                let point1 = nearestLine.points[info.nearestLine_SegmentIndex];
                let point2 = nearestLine.points[info.nearestLine_SegmentIndex + 1];

                let firstPoint_Position = Logic_Points.pointToLineSegment_NormalizedPosition(
                    point1.location,
                    point2.location,
                    editLinePoint1.location
                );

                let secondPoint_Position = Logic_Points.pointToLineSegment_NormalizedPosition(
                    point1.location,
                    point2.location,
                    editLinePoint2.location
                );

                if (secondPoint_Position == firstPoint_Position) {

                    info.isAvailable = false;
                    return;
                }

                info.isAvailable = true;
                info.targetLine_SearchForward = (secondPoint_Position >= firstPoint_Position);
            }

            // get ordered points
            if (info.targetLine_SearchForward) {

                info.targetLine_OrderedPoints = ListClone(nearestLine.points);

                info.targetLine_SegmentIndex = info.nearestLine_SegmentIndex;
            }
            else {

                info.targetLine_OrderedPoints = new List<LinePoint>();
                for (let i = nearestLine.points.length - 1; i >= 0; i--) {

                    info.targetLine_OrderedPoints.push(nearestLine.points[i]);
                }

                info.targetLine_SegmentIndex = (nearestLine.points.length - 1) - info.nearestLine_SegmentIndex - 1;
            }
        }

        private getLineOverlappingInfo(sourcePoints: List<LinePoint>, source_StartIndex: int, targetPoints: List<LinePoint>, target_StartIndex: int, minDistanceRange: float): LineOverlappingInfo {

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
                let distance = Logic_Points.pointToLine_Distance(
                    sourcePoint.location,
                    targetPoint1.location,
                    targetPoint2.location
                );

                if (distance > minDistanceRange) {

                    isAvailable = false;
                    break;
                }

                // if the edit-point is nearby, increment any one of search-index
                let localPosition = Logic_Points.pointToLineSegment_NormalizedPosition(
                    targetPoint1.location,
                    targetPoint2.location,
                    sourcePoint.location
                );

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

        private createSubjoinedLine(topPoints: List<LinePoint>, topPonts_OverlappingInfo: LineOverlappingInfo, followingPoints: List<LinePoint>, followingPoints_OverlappingInfo: LineOverlappingInfo, isTopPointsPrior: boolean, resamplingUnitLength: float): VectorLine {

            let newPoints = new List<LinePoint>();

            let subjoinedIndex: int;
            if (isTopPointsPrior) {

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
            if (subjoinedIndex - 2 >= 0 && subjoinedIndex + 4 <= newPoints.length - 1)
            {
                let resampledPoins = new List<LinePoint>();

                ListAddRange(resampledPoins, ListGetRange(newPoints, 0, (subjoinedIndex - 2) + 1));

                Logic_Edit_Points.resamplePoints(
                    resampledPoins
                    , newPoints
                    , subjoinedIndex - 1
                    , subjoinedIndex + 3
                    , resamplingUnitLength);

                ListAddRange(resampledPoins, ListGetRangeToLast(newPoints, subjoinedIndex + 4));

                newPoints = resampledPoins;
            }

            let newLine = new VectorLine();
            for (let point of newPoints) {

                newLine.points.push(LinePoint.clone(point));
            }

            Logic_Edit_Line.calculateParameters(newLine);

            return newLine;
        }

        public executeDrawLineWithSubjoin(editLine: VectorLine, nearestLineInfo: NearestLineInfo, minDistanceRange: float, resamplingUnitLength: float, env: ToolEnvironment) {

            let editLineFirstPoint = this.editLine.points[0];
            let editLineSecondPoint = this.editLine.points[1];

            // get searching direction
            this.getSearchDirectionForTargetLine(nearestLineInfo, editLineFirstPoint, editLineSecondPoint);

            if (!nearestLineInfo.isAvailable) {

                this.executeAddDrawLine(env);
                return;
            }

            // get overlapping part
            let editLine_OverlappingInfo = this.getLineOverlappingInfo(
                editLine.points, 0, nearestLineInfo.targetLine_OrderedPoints, nearestLineInfo.targetLine_SegmentIndex, minDistanceRange);

            let nearestLine_OverlappingInfo = this.getLineOverlappingInfo(
                nearestLineInfo.targetLine_OrderedPoints, nearestLineInfo.targetLine_SegmentIndex, editLine.points, 0, minDistanceRange);

            // join the two lines
            if (editLine_OverlappingInfo.isAvailable && nearestLine_OverlappingInfo.isAvailable) {

                let newLine = this.createSubjoinedLine(
                    nearestLineInfo.targetLine_OrderedPoints,
                    nearestLine_OverlappingInfo,
                    editLine.points,
                    editLine_OverlappingInfo,
                    true,
                    resamplingUnitLength
                );

                {
                    nearestLineInfo.nearestLine.modifyFlag = VectorLineModifyFlagID.deleteLine;

                    let command = new Command_DeleteFlaggedPoints();
                    if (command.prepareEditTargets(env.currentVectorLayer, env.currentVectorGeometry)) {

                        command.execute(env);
                        env.commandHistory.addCommand(command);
                    }
                }

                {
                    let command = new Command_AddLine();
                    command.group = env.currentVectorGroup;
                    command.line = newLine;
                    command.isContinued = true;
                    command.execute(env);
                    env.commandHistory.addCommand(command);
                }
            }
            else {

                this.executeAddDrawLine(env);
            }
        }

        protected executeCommand(env: ToolEnvironment) { // @override

            let editLineFirstPoint = this.editLine.points[0];
            let editLineSecondPoint = this.editLine.points[1];

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let minDistanceRange = this.getMinDistanceRange(env);

            // get nearest line
            let nearestLineInfo = new NearestLineInfo();
            this.getNearestLine(nearestLineInfo, editLineFirstPoint, env.currentVectorGeometry, minDistanceRange);

            if (nearestLineInfo.isAvailable) {

                this.executeDrawLineWithSubjoin(this.editLine, nearestLineInfo, minDistanceRange, resamplingUnitLength, env);
            }
            else {

                this.executeAddDrawLine(env);
            }

            this.editLine = null;

            env.setRedrawEditorWindow();
        }
    }
}
