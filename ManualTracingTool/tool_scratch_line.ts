
namespace ManualTracingTool {

    export class Tool_ScratchLine_CandidatePair {

        targetPoint: LinePoint = null;
        candidatePoint: LinePoint = null;

        normPosition = 0.0;
        totalLength = 0.0;
        influence = 0.0;
    }

    class Tool_ScratchLine_EditPoint {

        pair: Tool_ScratchLine_CandidatePair = null;

        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
    }

    export class Tool_ScratchLine extends ToolBase {

        helpText = '右クリック(G)で線を選択し、左クリックで線を修正します。';

        enableScratchEdit = true;
        enableExtrude = false;

        editLine: VectorLine = null;
        resampledLine: VectorLine = null;
        candidateLine: VectorLine = null;
        forwardExtrude = false;
        extrudeLine: VectorLine = null;

        nearestPointLocation = vec3.fromValues(0.0, 0.0, 0.0);
        samplePoint = vec3.fromValues(0.0, 0.0, 0.0);

        lineSingleHitTester = new HitTest_Line_PointToLineByDistanceSingle();

        isLeftButtonEdit = false;
        isRightButtonEdit = false;

        maxResamplingDivisionCount = 51;
        curveCheckPointCount = 3;
        cutoutAngle = 30 / 180.0 * Math.PI;

        editFalloffRadiusMinRate = 0.15;
        editFalloffRadiusMaxRate = 2.0;
        editFalloffRadiusContainsLineWidth = false;
        editInfluence = 0.5;

        editExtrudeMinRadiusRate = 0.5;
        editExtrudeMaxRadiusRate = 1.0;

        tool_ScratchLine_EditLine_Visible = true;
        tool_ScratchLine_TargetLine_Visible = true;
        tool_ScratchLine_SampledLine_Visible = true;
        tool_ScratchLine_CandidatePoints_Visible = false;
        tool_ScratchLine_ExtrudePoints_Visible = false;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
                && env.currentVectorLayer.isHierarchicalVisible
            );
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (e.isLeftButtonPressing()) {

                this.editLine = new VectorLine();
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

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.setRedrawEditorWindow();

            if (env.currentVectorLine == null || this.editLine == null) {
                return;
            }

            if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {

                let point = new LinePoint();
                vec3.copy(point.location, e.location);
                vec3.copy(point.adjustingLocation, e.location);
                //point.lineWidth = env.mouseCursorViewRadius * 2.0;
                point.lineWidth = env.drawLineBaseWidth;

                this.editLine.points.push(point);
            }
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.isLeftButtonEdit) {

                this.isLeftButtonEdit = false;

                if (env.currentVectorLine == null
                    || this.editLine == null
                    || this.editLine.points.length <= 1) {

                    return;
                }

                Logic_Edit_Line.calculateParameters(this.editLine);

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

        keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @override

            if (e.key == 'g') {

                // Select a line
                this.selectLine(env.mouseCursorLocation, env);

                return true;
            }

            return false;
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

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

                        drawEnv.editorDrawer.drawEditorVectorLinePoints(
                            env.currentVectorLine
                            , env.currentVectorLayer.layerColor
                            , false
                        );
                    }
                    else {

                        if (env.currentVectorLine.points.length >= 2) {

                            drawEnv.editorDrawer.drawEditorVectorLinePoint(
                                env.currentVectorLine.points[0]
                                , env.drawStyle.sampledPointColor
                                , false
                            );

                            drawEnv.editorDrawer.drawEditorVectorLinePoint(
                                env.currentVectorLine.points[env.currentVectorLine.points.length - 1]
                                , env.drawStyle.sampledPointColor
                                , false
                            );
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

        selectLine(location: Vec3, env: ToolEnvironment) {

            if (env.currentVectorLayer == null) {

                return;
            }

            this.lineSingleHitTester.processLayer(env.currentVectorGeometry, location, env.mouseCursorViewRadius);

            let hitedLine = this.lineSingleHitTester.hitedLine;

            if (hitedLine != null) {

                if (env.currentVectorLine != null) {
                    env.currentVectorLine.isEditTarget = false;
                }

                env.setCurrentVectorLine(hitedLine, true);

                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
        }

        protected executeCommand(env: ToolEnvironment) { // @virtual

            let isExtrudeDone = false;
            let isScratchingDone = false;

            if (this.enableExtrude) {

                let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
                let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);

                this.resampledLine = Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);

                isExtrudeDone = this.executeExtrudeLine(this.resampledLine, env);
            }

            if (this.enableScratchEdit) {

                this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);

                isScratchingDone  = this.executeScratchingLine(this.resampledLine, isExtrudeDone, env);
            }

            if (isExtrudeDone || isScratchingDone) {

                this.deleteDuplications(env);
            }
        }

        // Adjusting edit line

        protected cutoutLine(result: VectorLine): VectorLine {

            let startIndex = this.searchCutoutIndex(result, false);
            let endIndex = this.searchCutoutIndex(result, true);

            result.points = ListGetRange(result.points, startIndex, (endIndex - startIndex) + 1);

            Logic_Edit_Line.smooth(result);
            Logic_Edit_Line.applyAdjustments(result);

            return result;
        }

        private searchCutoutIndex(editorLine: VectorLine, isForward: boolean): int {

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

        protected generateCutoutedResampledLine(editorLine: VectorLine, env: ToolEnvironment): VectorLine {

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(editorLine.totalLength, resamplingUnitLength);
            if (divisionCount > this.maxResamplingDivisionCount) {
                divisionCount = this.maxResamplingDivisionCount;
            }

            let resampledLine = Logic_Edit_Line.createResampledLine(editorLine, divisionCount);

            //Logic_Edit_Line.smooth(resampledLine);

            this.cutoutLine(resampledLine);

            return resampledLine;
        }

        // Extruding edit

        protected executeExtrudeLine(resampledLine: VectorLine, env: ToolEnvironment): boolean {

            let targetLine = env.currentVectorLine;

            // Create extrude points

            let baseRadius = env.mouseCursorViewRadius;
            let editExtrudeMinRadius = baseRadius * this.editExtrudeMinRadiusRate;
            let editExtrudeMaxRadius = baseRadius * this.editExtrudeMaxRadiusRate;

            let forwardExtrude = true;

            let extrudeLine = this.generateExtrudePoints(false
                , targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius); // forward extrude

            if (extrudeLine == null) {

                extrudeLine = this.generateExtrudePoints(true
                    , targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius); // backword extrude

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

                command.execute(env);

                env.commandHistory.addCommand(command);

                return true;
            }
            else {

                return false;
            }
        }

        protected generateExtrudePoints(fromTargetLineTop: boolean, targetLine: VectorLine, sampleLine: VectorLine, editExtrudeMinRadius: float, editExtrudeMaxRadius: float): VectorLine {

            let startPoint: LinePoint;
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

            let extrudeLine = new VectorLine();
            extrudeLine.points = extrudePoints;

            return extrudeLine;
        }

        protected getExtrudePoints(targetLine: VectorLine, sampleLine: VectorLine, searchStartIndex: int, forwardSearch: boolean, limitMinDistance: float, limitMaxDistance: float): List<LinePoint> {

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

            let result = new List<LinePoint>();
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

        protected executeScratchingLine(resampledLine: VectorLine, isExtrudeDone: boolean, env: ToolEnvironment): boolean {

            let targetLine = env.currentVectorLine;

            // Get scratching candidate points

            let baseRadius = env.mouseCursorViewRadius;
            let editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            let editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;

            let candidatePointPairs = this.ganerateScratchingCandidatePoints(
                targetLine
                , resampledLine
                , editFalloffRadiusMin
                , editFalloffRadiusMax
                , this.editFalloffRadiusContainsLineWidth
            );

            // For display
            this.candidateLine = new VectorLine();
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

                command.execute(env);

                env.commandHistory.addCommand(command);

                return true;
            }
            else {

                return false;
            }
        }

        protected ganerateScratchingCandidatePoints(target_Line: VectorLine, editorLine: VectorLine, editFalloffRadiusMin: float, editFalloffRadiusMax: float, containsPointLineWidth: boolean): List<Tool_ScratchLine_CandidatePair> {

            let result = new List<Tool_ScratchLine_CandidatePair>();

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

                    let distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                        editPoint1.location,
                        editPoint2.location,
                        point.location
                    );

                    if (distance < minDistance) {

                        minDistance = distance;
                        nearestSegmentIndex = i;
                    }
                }

                if (nearestSegmentIndex != -1) {

                    let nearestLinePoint1 = editorLine.points[nearestSegmentIndex];
                    let nearestLinePoint2 = editorLine.points[nearestSegmentIndex + 1];

                    // Calculate candidate point
                    let nearestPoint_Available = Logic_Points.pointToLine_NearestLocation(
                        this.nearestPointLocation,
                        nearestLinePoint1.location,
                        nearestLinePoint2.location,
                        point.location
                    );

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
                    let sorroundingDistance = Logic_Points.pointToLineSegment_SorroundingDistance(
                        nearestLinePoint1.location,
                        nearestLinePoint2.location,
                        this.nearestPointLocation
                    );

                    if (sorroundingDistance > editFalloffRadiusMax) {

                        continue;
                    }

                    let normPositionInEditorLineSegment = Logic_Points.pointToLineSegment_NormalizedPosition(
                        nearestLinePoint1.location
                        , nearestLinePoint2.location
                        , point.location);

                    let totalLengthInEditorLine = (
                        nearestLinePoint1.totalLength
                        + (nearestLinePoint2.totalLength - nearestLinePoint1.totalLength) * normPositionInEditorLineSegment
                    );

                    let influence = this.calculateScratchingCandidatePointInfluence(
                        editorLine.totalLength
                        , sorroundingDistance
                        , totalLengthInEditorLine
                        , normPositionInEditorLineSegment
                        , editFalloffRadiusMin
                        , editFalloffRadiusMax
                    );

                    if (influence > 0.0) {

                        // Create edit data
                        let candidatePoint = new LinePoint();
                        vec3.copy(candidatePoint.location, this.nearestPointLocation);
                        vec3.copy(candidatePoint.adjustingLocation, candidatePoint.location);
                        candidatePoint.lineWidth = Maths.lerp(normPositionInEditorLineSegment, nearestLinePoint1.lineWidth, nearestLinePoint2.lineWidth);

                        let pair = new Tool_ScratchLine_CandidatePair();
                        pair.targetPoint = point;
                        pair.candidatePoint = candidatePoint;
                        pair.normPosition = normPositionInEditorLineSegment;
                        pair.totalLength = totalLengthInEditorLine;
                        pair.influence = influence;

                        result.push(pair);

                        // Set the flag for after editing
                        point.modifyFlag = LinePointModifyFlagID.edit;
                    }
                }
            }

            return result;
        }

        protected calculateScratchingCandidatePointInfluence(editorLine_TotalLength: float, sorroundingDistance: float, totalLengthInEditorLine: float, normPositionInEditorLineSegment: float, editFalloffRadiusMin: float, editFalloffRadiusMax: float): float { // @virtual

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
            let influence = Maths.clamp(falloffDistance, 0.0, 1.0);

            if (influence == 0.0) {
                return 0.0;
            }

            influence *= this.editInfluence * Maths.sigmoid10(1.0 - sorroundingDistance / editFalloffRadiusMax);

            return influence;
        }

        // Delete duplication edit

        protected deleteDuplications(env: ToolEnvironment) {

            let targetLine = env.currentVectorLine;

            // Search edited index range of points

            let firstPointIndex = -1;
            let lastPointIndex = -1;

            for (let i = 0; i < targetLine.points.length; i++) {

                let point = targetLine.points[i];

                if (point.modifyFlag == LinePointModifyFlagID.edit) {

                    if (firstPointIndex == -1) {

                        firstPointIndex = i;
                    }

                    lastPointIndex = i;
                }

                point.modifyFlag = LinePointModifyFlagID.none;
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

            Logic_Edit_Points.resamplePoints(
                newPoints
                , targetLine.points
                , firstPointIndex
                , lastPointIndex
                , resamplingUnitLength
            );

            for (let index = lastPointIndex + 1; index < targetLine.points.length; index++) {

                newPoints.push(targetLine.points[index]);
            }

            // Execute command

            let command = new Command_DeleteDuplicationInLine();
            command.isContinued = true;
            command.targetLine = targetLine;
            command.oldPoints = targetLine.points;
            command.newPoints = newPoints;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }

        // Common functions

        protected findNearestPointIndex_LineSegmentToPoint(line: VectorLine, point1: LinePoint, point2: LinePoint, limitMinDistance: float, limitMaxDistance: float, includeInnerSide: boolean, includeOuterSide: boolean): int {

            let isHited = false;
            let minDistance = 99999.0;
            let nearestPointIndex = -1;

            for (let i = 0; i < line.points.length - 1; i++) {
                let linePoint = line.points[i];

                let distance = vec3.distance(point1.location, linePoint.location);

                if (distance < minDistance) {

                    let normPosition = Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, linePoint.location);

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

        protected findNearestPointIndex_PointToPoint(line: VectorLine, point: LinePoint, limitMinDistance: float, limitMaxDistance: float): int {

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

        protected getNearPointCount(targetLine: VectorLine, sampleLine: VectorLine, searchStartIndex: int, forwardSearch: boolean, limitMaxDistance: float): int {

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

    export class Tool_ExtrudeLine extends Tool_ScratchLine {

        helpText = '右クリックで線を選択し、左クリックで線の端の近くから線を描きはじめると線が延長されます。';

        enableScratchEdit = false;
        enableExtrude = true;
    }

    class CommandEditVectorLine {

        line: VectorLine = null;
        oldPointList: List<LinePoint> = null;
        newPointList: List<LinePoint> = null;
    }

    export class Command_ExtrudeLine extends CommandBase {

        targetLine: VectorLine = null;
        forwardExtrude = false;
        extrudeLine: VectorLine = null;

        editLine: CommandEditVectorLine = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.prepareEditPoints();

            this.redo(env);
        }

        private prepareEditPoints() {

            this.editLine = new CommandEditVectorLine();
            this.editLine.line = this.targetLine;
            this.editLine.oldPointList = this.targetLine.points;

            if (this.forwardExtrude) {

                this.editLine.newPointList = ListClone(this.targetLine.points);
                ListAddRange(this.editLine.newPointList, this.extrudeLine.points);
            }
            else {

                this.editLine.newPointList = List<LinePoint>();
                for (let i = this.extrudeLine.points.length - 1; i >= 0; i--) {
                    this.editLine.newPointList.push(this.extrudeLine.points[i]);
                }
                ListAddRange(this.editLine.newPointList, this.targetLine.points);
            }
        }

        undo(env: ToolEnvironment) { // @override

            this.targetLine.points = this.editLine.oldPointList;
        }

        redo(env: ToolEnvironment) { // @override

            this.targetLine.points = this.editLine.newPointList;
        }

        errorCheck() {
        }
    }

    export class Command_ScratchLine extends CommandBase {

        targetLine: VectorLine = null;
        editPoints = new List<Tool_ScratchLine_EditPoint>();

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.prepareEditPoints();

            this.redo(env);
        }

        private prepareEditPoints() {

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

        undo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;

                vec3.copy(targetPoint.location, editPoint.oldLocation);
                vec3.copy(targetPoint.adjustingLocation, targetPoint.location);
            }

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        redo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;

                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustingLocation, targetPoint.location);
            }

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        errorCheck() {

            if (this.targetLine == null) {
                throw ('Command_ScratchLine: line is null!');
            }
        }
    }

    export class Command_DeleteDuplicationInLine extends CommandBase {

        targetLine: VectorLine = null;

        oldPoints: List<LinePoint> = null;
        newPoints: List<LinePoint> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            this.targetLine.points = this.oldPoints;

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        redo(env: ToolEnvironment) { // @override

            this.targetLine.points = this.newPoints;

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        errorCheck() {

            if (this.targetLine == null) {
                throw ('Command_ScratchLine: line is null!');
            }
        }
    }
}
