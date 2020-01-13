var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_ScratchLine_CandidatePair {
        constructor() {
            this.targetPoint = null;
            this.candidatePoint = null;
            this.normPosition = 0.0;
            this.totalLength = 0.0;
            this.influence = 0.0;
        }
    }
    ManualTracingTool.Tool_ScratchLine_CandidatePair = Tool_ScratchLine_CandidatePair;
    class Tool_ScratchLine_EditPoint {
        constructor() {
            this.pair = null;
            this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
        }
    }
    class Tool_ScratchLine extends ManualTracingTool.ToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '右クリック(G)で線を選択し、左クリックで線を修正します。';
            this.enableScratchEdit = true;
            this.enableExtrude = false;
            this.editLine = null;
            this.resampledLine = null;
            this.candidateLine = null;
            this.forwardExtrude = false;
            this.extrudeLine = null;
            this.nearestPointLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.samplePoint = vec3.fromValues(0.0, 0.0, 0.0);
            this.lineSingleHitTester = new ManualTracingTool.HitTest_Line_PointToLineByDistanceSingle();
            this.isLeftButtonEdit = false;
            this.isRightButtonEdit = false;
            this.maxResamplingDivisionCount = 51;
            this.curveCheckPointCount = 3;
            this.cutoutAngle = 30 / 180.0 * Math.PI;
            this.editFalloffRadiusMinRate = 0.15;
            this.editFalloffRadiusMaxRate = 2.0;
            this.editFalloffRadiusContainsLineWidth = false;
            this.editInfluence = 0.5;
            this.editExtrudeMinRadiusRate = 0.5;
            this.editExtrudeMaxRadiusRate = 1.0;
            this.tool_ScratchLine_EditLine_Visible = true;
            this.tool_ScratchLine_TargetLine_Visible = true;
            this.tool_ScratchLine_SampledLine_Visible = true;
            this.tool_ScratchLine_CandidatePoints_Visible = false;
            this.tool_ScratchLine_ExtrudePoints_Visible = false;
        }
        isAvailable(env) {
            return (env.currentVectorLayer != null
                && ManualTracingTool.Layer.isEditTarget(env.currentVectorLayer));
        }
        mouseDown(e, env) {
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
        }
        mouseMove(e, env) {
            env.setRedrawEditorWindow();
            if (env.currentVectorLine == null || this.editLine == null) {
                return;
            }
            if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {
                let point = new ManualTracingTool.LinePoint();
                vec3.copy(point.location, e.location);
                vec3.copy(point.adjustingLocation, e.location);
                //point.lineWidth = env.mouseCursorViewRadius * 2.0;
                point.lineWidth = env.drawLineBaseWidth;
                this.editLine.points.push(point);
            }
        }
        mouseUp(e, env) {
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
        }
        keydown(e, env) {
            if (e.key == 'g') {
                // Select a line
                this.selectLine(env.mouseCursorLocation, env);
                return true;
            }
            return false;
        }
        onDrawEditor(env, drawEnv) {
            drawEnv.editorDrawer.drawMouseCursor();
            if (this.tool_ScratchLine_EditLine_Visible) {
                if (this.editLine != null && this.resampledLine == null) {
                    drawEnv.editorDrawer.drawEditorEditLineStroke(this.editLine);
                }
            }
            if (this.tool_ScratchLine_TargetLine_Visible) {
                var drawPointsAll = false;
                if (env.currentVectorLine != null
                    && env.currentVectorLayer != null) {
                    if (drawPointsAll) {
                        drawEnv.editorDrawer.drawEditorVectorLinePoints(env.currentVectorLine, env.currentVectorLayer.layerColor, false);
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
        }
        selectLine(location, env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            this.lineSingleHitTester.processLayer(env.currentVectorGeometry, location, env.mouseCursorViewRadius);
            let hitedLine = this.lineSingleHitTester.hitedLine;
            if (hitedLine != null) {
                env.setCurrentVectorLine(hitedLine, true);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
        }
        executeCommand(env) {
            let isExtrudeDone = false;
            let isScratchingDone = false;
            let targetLine = env.currentVectorLine;
            let targetGroup = env.currentVectorGroup;
            let oldPoints = targetLine.points;
            if (this.enableExtrude) {
                let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
                let divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);
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
        }
        // Adjusting edit line
        cutoutLine(result) {
            let startIndex = this.searchCutoutIndex(result, false);
            let endIndex = this.searchCutoutIndex(result, true);
            result.points = ListGetRange(result.points, startIndex, (endIndex - startIndex) + 1);
            ManualTracingTool.Logic_Edit_Line.smooth(result);
            ManualTracingTool.Logic_Edit_Line.applyAdjustments(result);
            return result;
        }
        searchCutoutIndex(editorLine, isForward) {
            let scanDirection = isForward ? 1 : -1;
            let cutoutIndex = isForward ? (editorLine.points.length - 1) : 0;
            let centerIndex = Math.floor(editorLine.points.length / 2);
            let scanRangeOffset = this.curveCheckPointCount * scanDirection;
            let limitCurvature = this.cutoutAngle;
            let k = centerIndex;
            while (k >= 0 && k < editorLine.points.length) {
                let scanCount = this.curveCheckPointCount;
                let totalCurvature = 0.0;
                let i = k + scanDirection;
                while (i >= 0 && i < editorLine.points.length) {
                    let point = editorLine.points[i];
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
        }
        generateCutoutedResampledLine(editorLine, env) {
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(editorLine.totalLength, resamplingUnitLength);
            if (divisionCount > this.maxResamplingDivisionCount) {
                divisionCount = this.maxResamplingDivisionCount;
            }
            let resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(editorLine, divisionCount);
            //Logic_Edit_Line.smooth(resampledLine);
            this.cutoutLine(resampledLine);
            return resampledLine;
        }
        // Extruding edit
        executeExtrudeLine(targetLine, targetGroup, resampledLine, env) {
            // Create extrude points
            let baseRadius = env.mouseCursorViewRadius;
            let editExtrudeMinRadius = baseRadius * this.editExtrudeMinRadiusRate;
            let editExtrudeMaxRadius = baseRadius * this.editExtrudeMaxRadiusRate;
            let forwardExtrude = true;
            let extrudeLine = this.generateExtrudePoints(false, targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius); // forward extrude
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
                let command = new Command_ExtrudeLine();
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
        }
        generateExtrudePoints(fromTargetLineTop, targetLine, sampleLine, editExtrudeMinRadius, editExtrudeMaxRadius) {
            let startPoint;
            if (fromTargetLineTop) {
                startPoint = targetLine.points[0];
            }
            else {
                startPoint = targetLine.points[targetLine.points.length - 1];
            }
            let sampleLine_NearestPointIndex = this.findNearestPointIndex_PointToPoint(sampleLine, startPoint, 0.0, editExtrudeMaxRadius);
            if (sampleLine_NearestPointIndex == -1) {
                return null;
            }
            let nearPointCount_SampleLineForward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, true, editExtrudeMaxRadius);
            let nearPointCount_SampleLineBackward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, false, editExtrudeMaxRadius);
            //console.log(sampleLine_NearestPointIndex + ' ' + nearPointCount_SampleLineForward + ' ' + nearPointCount_SampleLineBackward);
            let isForwardExtrudeInSampleLine = (nearPointCount_SampleLineForward < 0 && nearPointCount_SampleLineBackward >= 0);
            let isBackwardExtrudeInSampleLine = (nearPointCount_SampleLineForward >= 0 && nearPointCount_SampleLineBackward < 0);
            let extrudable = (isForwardExtrudeInSampleLine || isBackwardExtrudeInSampleLine);
            if (!extrudable) {
                return null;
            }
            let extrudePoints = this.getExtrudePoints(targetLine, sampleLine, sampleLine_NearestPointIndex, isForwardExtrudeInSampleLine, editExtrudeMinRadius, editExtrudeMaxRadius);
            if (extrudePoints == null) {
                // when all points is far away from edit line
                return null;
            }
            let extrudeLine = new ManualTracingTool.VectorLine();
            extrudeLine.points = extrudePoints;
            return extrudeLine;
        }
        getExtrudePoints(targetLine, sampleLine, searchStartIndex, forwardSearch, limitMinDistance, limitMaxDistance) {
            let scanDirection = (forwardSearch ? 1 : -1);
            let startIndex = -1;
            let currentIndex = searchStartIndex;
            let nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {
                let point1 = sampleLine.points[currentIndex];
                let point2 = sampleLine.points[nextIndex];
                let nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, limitMinDistance, limitMaxDistance, false, true);
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
            let result = new List();
            if (forwardSearch) {
                for (let i = startIndex; i < sampleLine.points.length; i++) {
                    result.push(sampleLine.points[i]);
                }
            }
            else {
                for (let i = startIndex; i >= 0; i--) {
                    result.push(sampleLine.points[i]);
                }
            }
            return result;
        }
        // Scratching edit
        executeScratchingLine(targetLine, targetGroup, resampledLine, isExtrudeDone, env) {
            // Get scratching candidate points
            let baseRadius = env.mouseCursorViewRadius;
            let editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            let editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
            let candidatePointPairs = this.ganerateScratchingCandidatePoints(targetLine, resampledLine, editFalloffRadiusMin, editFalloffRadiusMax, this.editFalloffRadiusContainsLineWidth);
            // For display
            this.candidateLine = new ManualTracingTool.VectorLine();
            for (let pair of candidatePointPairs) {
                this.candidateLine.points.push(pair.candidatePoint);
            }
            // Execute command
            if (candidatePointPairs != null && candidatePointPairs.length > 0) {
                let command = new Command_ScratchLine();
                command.isContinued = isExtrudeDone;
                command.targetLine = targetLine;
                for (let pair of candidatePointPairs) {
                    let editPoint = new Tool_ScratchLine_EditPoint();
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
        }
        ganerateScratchingCandidatePoints(target_Line, editorLine, editFalloffRadiusMin, editFalloffRadiusMax, containsPointLineWidth) {
            let result = new List();
            for (let point of target_Line.points) {
                // Targets selected point only if line is selected
                //if (target_Line.isSelected && !point.isSelected) {
                //    continue;
                //}
                // Search nearest segment
                let isHited = false;
                let minDistance = 99999.0;
                let nearestSegmentIndex = -1;
                for (let i = 0; i < editorLine.points.length - 1; i++) {
                    let editPoint1 = editorLine.points[i];
                    let editPoint2 = editorLine.points[i + 1];
                    let distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(editPoint1.location, editPoint2.location, point.location);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestSegmentIndex = i;
                    }
                }
                if (nearestSegmentIndex != -1) {
                    let nearestLinePoint1 = editorLine.points[nearestSegmentIndex];
                    let nearestLinePoint2 = editorLine.points[nearestSegmentIndex + 1];
                    // Calculate candidate point
                    let nearestPoint_Available = ManualTracingTool.Logic_Points.pointToLine_NearestLocation(this.nearestPointLocation, nearestLinePoint1.location, nearestLinePoint2.location, point.location);
                    if (!nearestPoint_Available) {
                        continue;
                    }
                    let directDistance = vec3.distance(point.location, this.nearestPointLocation);
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
                    let sorroundingDistance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(nearestLinePoint1.location, nearestLinePoint2.location, this.nearestPointLocation);
                    if (sorroundingDistance > editFalloffRadiusMax) {
                        continue;
                    }
                    let normPositionInEditorLineSegment = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(nearestLinePoint1.location, nearestLinePoint2.location, point.location);
                    let totalLengthInEditorLine = (nearestLinePoint1.totalLength
                        + (nearestLinePoint2.totalLength - nearestLinePoint1.totalLength) * normPositionInEditorLineSegment);
                    let influence = this.calculateScratchingCandidatePointInfluence(editorLine.totalLength, sorroundingDistance, totalLengthInEditorLine, normPositionInEditorLineSegment, editFalloffRadiusMin, editFalloffRadiusMax);
                    if (influence > 0.0) {
                        // Create edit data
                        let candidatePoint = new ManualTracingTool.LinePoint();
                        vec3.copy(candidatePoint.location, this.nearestPointLocation);
                        vec3.copy(candidatePoint.adjustingLocation, candidatePoint.location);
                        candidatePoint.lineWidth = ManualTracingTool.Maths.lerp(normPositionInEditorLineSegment, nearestLinePoint1.lineWidth, nearestLinePoint2.lineWidth);
                        let pair = new Tool_ScratchLine_CandidatePair();
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
        }
        calculateScratchingCandidatePointInfluence(editorLine_TotalLength, sorroundingDistance, totalLengthInEditorLine, normPositionInEditorLineSegment, editFalloffRadiusMin, editFalloffRadiusMax) {
            let falloffDistance = 1.0;
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
            let influence = ManualTracingTool.Maths.clamp(falloffDistance, 0.0, 1.0);
            if (influence == 0.0) {
                return 0.0;
            }
            influence *= this.editInfluence * ManualTracingTool.Maths.sigmoid10(1.0 - sorroundingDistance / editFalloffRadiusMax);
            return influence;
        }
        // Delete duplication edit
        deleteDuplications(targetLine, targetGroup, env) {
            // Search edited index range of points
            let firstPointIndex = -1;
            let lastPointIndex = -1;
            for (let i = 0; i < targetLine.points.length; i++) {
                let point = targetLine.points[i];
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
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            ManualTracingTool.Logic_Edit_Points.resamplePoints(newPoints, targetLine.points, firstPointIndex, lastPointIndex, resamplingUnitLength);
            for (let index = lastPointIndex + 1; index < targetLine.points.length; index++) {
                newPoints.push(targetLine.points[index]);
            }
            // Execute command
            let command = new Command_DeleteDuplicationInLine();
            command.isContinued = true;
            command.targetLine = targetLine;
            command.oldPoints = targetLine.points;
            command.newPoints = newPoints;
            command.useGroup(targetGroup);
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        }
        // Common functions
        findNearestPointIndex_LineSegmentToPoint(line, point1, point2, limitMinDistance, limitMaxDistance, includeInnerSide, includeOuterSide) {
            let isHited = false;
            let minDistance = 99999.0;
            let nearestPointIndex = -1;
            for (let i = 0; i < line.points.length - 1; i++) {
                let linePoint = line.points[i];
                let distance = vec3.distance(point1.location, linePoint.location);
                if (distance < minDistance) {
                    let normPosition = ManualTracingTool.Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, linePoint.location);
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
        }
        findNearestPointIndex_PointToPoint(line, point, limitMinDistance, limitMaxDistance) {
            let isHited = false;
            let minDistance = 99999.0;
            let nearestPointIndex = -1;
            for (let i = 0; i < line.points.length - 1; i++) {
                let linePoint = line.points[i];
                let distance = vec3.distance(point.location, linePoint.location);
                if (distance < minDistance
                    && distance > limitMinDistance
                    && distance < limitMaxDistance) {
                    minDistance = distance;
                    nearestPointIndex = i;
                }
            }
            return nearestPointIndex;
        }
        getNearPointCount(targetLine, sampleLine, searchStartIndex, forwardSearch, limitMaxDistance) {
            let nearPointCcount = 0;
            let scanDirection = (forwardSearch ? 1 : -1);
            let currentIndex = searchStartIndex;
            let nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {
                let point1 = sampleLine.points[currentIndex];
                let point2 = sampleLine.points[nextIndex];
                // find the nearest point in target-line by the sample-line's segment
                let nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, true, false);
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
        }
    }
    ManualTracingTool.Tool_ScratchLine = Tool_ScratchLine;
    class Tool_ExtrudeLine extends Tool_ScratchLine {
        constructor() {
            super(...arguments);
            this.helpText = '右クリックで線を選択し、左クリックで線の端の近くから線を描きはじめると線が延長されます。';
            this.enableScratchEdit = false;
            this.enableExtrude = true;
        }
    }
    ManualTracingTool.Tool_ExtrudeLine = Tool_ExtrudeLine;
    class Command_ExtrudeLine extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetGroups = null;
            this.targetLine = null;
            this.forwardExtrude = false;
            this.extrudeLine = null;
            this.oldPointList = null;
            this.newPointList = null;
        }
        execute(env) {
            this.prepareEditPoints();
            this.redo(env);
        }
        prepareEditPoints() {
            this.oldPointList = this.targetLine.points;
            if (this.forwardExtrude) {
                this.newPointList = ListClone(this.targetLine.points);
                ListAddRange(this.newPointList, this.extrudeLine.points);
            }
            else {
                this.newPointList = List();
                for (let i = this.extrudeLine.points.length - 1; i >= 0; i--) {
                    this.newPointList.push(this.extrudeLine.points[i]);
                }
                ListAddRange(this.newPointList, this.targetLine.points);
            }
        }
        undo(env) {
            this.targetLine.points = this.oldPointList;
        }
        redo(env) {
            this.targetLine.points = this.newPointList;
        }
    }
    ManualTracingTool.Command_ExtrudeLine = Command_ExtrudeLine;
    class Command_ScratchLine extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetLine = null;
            this.editPoints = new List();
        }
        execute(env) {
            this.prepareEditPoints();
            this.redo(env);
        }
        prepareEditPoints() {
            for (let editPoint of this.editPoints) {
                let candidatePoint = editPoint.pair.candidatePoint;
                let targetPoint = editPoint.pair.targetPoint;
                vec3.copy(editPoint.oldLocation, targetPoint.adjustingLocation);
                if (editPoint.pair.influence > 0.0) {
                    vec3.lerp(editPoint.newLocation, targetPoint.location, candidatePoint.location, editPoint.pair.influence);
                }
                else {
                    vec3.copy(editPoint.newLocation, targetPoint.location);
                }
            }
        }
        undo(env) {
            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;
                vec3.copy(targetPoint.location, editPoint.oldLocation);
                vec3.copy(targetPoint.adjustingLocation, targetPoint.location);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        }
        redo(env) {
            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;
                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustingLocation, targetPoint.location);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        }
    }
    ManualTracingTool.Command_ScratchLine = Command_ScratchLine;
    class Command_DeleteDuplicationInLine extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetLine = null;
            this.oldPoints = null;
            this.newPoints = null;
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            this.targetLine.points = this.oldPoints;
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        }
        redo(env) {
            this.targetLine.points = this.newPoints;
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        }
    }
    ManualTracingTool.Command_DeleteDuplicationInLine = Command_DeleteDuplicationInLine;
})(ManualTracingTool || (ManualTracingTool = {}));
