
namespace ManualTracingTool {

    class Tool_ScratchLine_CandidatePair {

        targetPoint: LinePoint = null;
        candidatePoint: LinePoint = null;

        influence = 0.0;
    }

    class Tool_ScratchLine_EditPoint {

        pair: Tool_ScratchLine_CandidatePair = null;

        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
    }

    export class Tool_ScratchLine extends ToolBase {

        editLine: VectorLine = null;

        resampledLine: VectorLine = null;
        candidateLine: VectorLine = null;
        forwardExtrude = false;
        extrudeLine: VectorLine = null;

        nearestPoint = vec3.fromValues(0.0, 0.0, 0.0);
        samplePoint = vec3.fromValues(0.0, 0.0, 0.0);

        lineSingleHitTester = new HitTest_Line_PointToLineByDistanceSingle();

        isLeftButtonEdit = false;
        isRightButtonEdit = false;

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
                vec3.copy(point.adjustedLocation, e.location);

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

                this.executeCommand(env);

                env.setRedrawMainWindowEditorWindow();

                return;
            }

            if (this.isRightButtonEdit) {

                this.isRightButtonEdit = false;

                // Finish selectiong a line
                this.selectLine(e.location, env);

                return;
            }
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            if (e.key == 'g') {

                // Finish selectiong a line
                this.selectLine(env.mouseCursorLocation, env);
            }
        }

        selectLine(location: Vec3, env: ToolEnvironment) {

            if (env.currentVectorLayer == null) {

                return;
            }

            this.lineSingleHitTester.processLayer(env.currentVectorLayer, location[0], location[1], env.mouseCursorRadius);

            let hitedLine = this.lineSingleHitTester.hitedLine;

            if (hitedLine != null) {

                if (env.currentVectorLine != null) {
                    env.currentVectorLine.isEditTarget = false;
                }

                env.setCurrentVectorLine(hitedLine, true);

                env.setRedrawMainWindowEditorWindow();
            }
        }

        private executeCommand(env: ToolEnvironment) {

            this.viewScale = env.viewScale;

            let targetLine = env.currentVectorLine;

            Logic_Edit_Line.calculateParameters(this.editLine);

            // Resampling
            this.resampledLine = this.resampleLine(this.editLine, env);

            let startIndex = this.searchCutoutIndex(this.resampledLine, false);
            let endIndex = this.searchCutoutIndex(this.resampledLine, true);
            this.resampledLine.points = ListGetRange(this.resampledLine.points, startIndex, endIndex + 1);

            Logic_Edit_Line.smooth(this.resampledLine);
            Logic_Edit_Line.applyAdjustments(this.resampledLine);

            // Extruding line
            let forwardExtrude = true;
            let extrudeLine = this.generateExtrudePoints(targetLine, this.resampledLine, false);
            if (extrudeLine == null) {

                extrudeLine = this.generateExtrudePoints(targetLine, this.resampledLine, true);
                if (extrudeLine != null) {
                    forwardExtrude = false;
                }
            }

            this.forwardExtrude = forwardExtrude;
            this.extrudeLine = extrudeLine;

            // Scratching
            let candidatePointPairs = this.ganerateCandidatePoints(targetLine, this.resampledLine);

            // For display
            this.candidateLine = new VectorLine();
            for (let pair of candidatePointPairs) {
                this.candidateLine.points.push(pair.candidatePoint);
            }

            // Create command
            if (this.extrudeLine != null && this.extrudeLine.points.length > 0) {

                let command = new Command_ExtrudeLine();
                command.isContinuing = true;
                command.targetLine = targetLine;
                command.forwardExtrude = this.forwardExtrude;
                command.extrudeLine = this.extrudeLine;

                command.execute(env);

                env.commandHistory.addCommand(command);
            }

            if (candidatePointPairs != null && candidatePointPairs.length > 0) {

                let command = new Command_ScratchLine();
                command.isContinued = (this.extrudeLine != null);
                command.targetLine = targetLine;

                for (let pair of candidatePointPairs) {

                    let editPoint = new Tool_ScratchLine_EditPoint();
                    editPoint.pair = pair;
                    command.editPoints.push(editPoint);
                }

                command.execute(env);

                env.commandHistory.addCommand(command);
            }
        }

        resamplingUnitLength = 1.0;
        maxResamplingDivisionCount = 15;
        curveCheckPointCount = 3;
        cutoutAngle = 30 / 180.0 * Math.PI;

        editFalloffRadiusMin = 5.0;
        editFalloffRadiusMax = 10.0;
        editInfluence = 0.5;

        editExtrudeMinRadius = 1.0;
        editExtrudeMaxRadius = 10.0;

        viewScale = 1.0;

        private resampleLine(baseLine: VectorLine, env: ToolEnvironment): VectorLine {

            let resamplingUnitLength = env.getView_ResamplingUnitLength(this.resamplingUnitLength);

            let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(baseLine.totalLength, resamplingUnitLength);
            if (divisionCount > this.maxResamplingDivisionCount) {

                divisionCount = this.maxResamplingDivisionCount;
            }

            return Logic_Edit_Line.createResampledLine(baseLine, divisionCount);
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

        private ganerateCandidatePoints(target_Line: VectorLine, editorLine: VectorLine): List<Tool_ScratchLine_CandidatePair> {

            let result = new List<Tool_ScratchLine_CandidatePair>();

            for (let point of target_Line.points) {

                // Targets selected point only if line is selected
                if (target_Line.isSelected && !point.isSelected) {
                    continue;
                }

                // Search nearest segment
                let isHited = false;
                let minDistance = 99999.0;
                let nearestSegmentIndex = -1;

                for (let i = 0; i < editorLine.points.length - 1; i++) {

                    let editPoint1 = editorLine.points[i];
                    let editPoint2 = editorLine.points[i + 1];

                    let distance = Logic_Points.pointToLineSegmentDistance(
                        editPoint1.location,
                        editPoint2.location,
                        point.location[0],
                        point.location[1]
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
                    Logic_Points.pointToLineNearestPoint(
                        this.nearestPoint,
                        nearestLinePoint1.location,
                        nearestLinePoint2.location,
                        point.location
                    );

                    // Calculate edit influence
                    let falloffDistance = Logic_Points.pointToLineSegmentDistance(
                        nearestLinePoint1.location,
                        nearestLinePoint2.location,
                        this.nearestPoint[0],
                        this.nearestPoint[1]
                    );

                    let editFalloffRadiusMax = this.editFalloffRadiusMax / this.viewScale;
                    let editFalloffRadiusMin = this.editFalloffRadiusMin / this.viewScale;

                    //if (falloffDistance > editFalloffRadiusMax) {
                    //    continue;
                    //}

                    let influenceDistance = vec3.distance(point.adjustedLocation, this.nearestPoint);

                    if (influenceDistance > editFalloffRadiusMax) {
                        continue;
                    }
                    
                    let distanceRate = Maths.smoothstep(editFalloffRadiusMin, editFalloffRadiusMax, falloffDistance);
                    let influence = 1.0 - Maths.clamp(distanceRate, 0.0, 1.0);

                    if (influence == 0.0) {
                        continue;
                    }

                    influence *= this.editInfluence;

                    // Create edit data
                    let candidatePoint = new LinePoint();
                    vec3.copy(candidatePoint.location, this.nearestPoint);
                    vec3.copy(candidatePoint.adjustedLocation, candidatePoint.location);

                    let pair = new Tool_ScratchLine_CandidatePair();
                    pair.targetPoint = point;
                    pair.candidatePoint = candidatePoint;
                    pair.influence = influence;

                    result.push(pair);
                }
            }

            return result;
        }

        private generateExtrudePoints(targetLine: VectorLine, sampleLine: VectorLine, fromTargetLineTop: boolean): VectorLine {

            let startPoint: LinePoint;
            if (fromTargetLineTop) {
                startPoint = targetLine.points[0];
            }
            else {
                startPoint = targetLine.points[targetLine.points.length - 1];
            }

            let sampleLine_NearestPointIndex = this.findNearestPointIndex_PointToPoint(sampleLine, startPoint, this.editExtrudeMinRadius, this.editExtrudeMaxRadius);
            if (sampleLine_NearestPointIndex == -1) {
                return null;
            }

            let nearPointCcount_SampleLineForward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, true, this.editExtrudeMaxRadius);
            let nearPointCcount_SampleLineBackward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, false, this.editExtrudeMaxRadius);

            let isForwardExtrudeInSampleLine = (nearPointCcount_SampleLineForward < 0 && nearPointCcount_SampleLineBackward >= 0);
            let isBackwardExtrudeInSampleLine = (nearPointCcount_SampleLineForward >= 0 && nearPointCcount_SampleLineBackward < 0);

            let extrudable = (isForwardExtrudeInSampleLine || isBackwardExtrudeInSampleLine);

            if (!extrudable) {
                return null;
            }

            let extrudeLine = new VectorLine();
            extrudeLine.points = this.getExtrudePoints(targetLine, sampleLine, sampleLine_NearestPointIndex, isForwardExtrudeInSampleLine, this.editExtrudeMaxRadius);

            return extrudeLine;
        }

        private findNearestPointIndex_LineSegmentToPoint(line: VectorLine, point1: LinePoint, point2: LinePoint, limitMinDistance: float, limitMaxDistance: float, includeInnerSide: boolean, includeOuterSide: boolean): int {

            let isHited = false;
            let minDistance = 99999.0;
            let nearestPointIndex = -1;

            for (let i = 0; i < line.points.length - 1; i++) {
                let linePoint = line.points[i];

                let distance = vec3.distance(point1.location, linePoint.location);

                if (distance < minDistance) {

                    let normPosition = Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, linePoint.location);

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
        }

        private findNearestPointIndex_PointToPoint(line: VectorLine, point: LinePoint, limitMinDistance: float, limitMaxDistance: float): int {

            let isHited = false;
            let minDistance = 99999.0;
            let nearestPointIndex = -1;

            for (let i = 0; i < line.points.length - 1; i++) {
                let linePoint = line.points[i];

                let distance = vec3.distance(point.location, linePoint.location);

                if (distance > limitMinDistance && distance < minDistance && distance < limitMaxDistance) {

                    minDistance = distance;
                    nearestPointIndex = i;
                }
            }

            return nearestPointIndex;
        }

        private getNearPointCount(targetLine: VectorLine, sampleLine: VectorLine, scanStartIndex: int, forwardSearch: boolean, limitMaxDistance: float): int {

            let nearPointCcount = 0;

            let scanDirection = (forwardSearch ? 1 : -1);

            let currentIndex = scanStartIndex;
            let nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {

                let point1 = sampleLine.points[currentIndex];
                let point2 = sampleLine.points[nextIndex];

                let nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, true, true);

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

        private getExtrudePoints(targetLine: VectorLine, sampleLine: VectorLine, scanStartIndex: int, forwardSearch: boolean, limitMaxDistance: float): List<LinePoint> {

            let scanDirection = (forwardSearch ? 1 : -1);

            let startIndex = -1;

            let currentIndex = scanStartIndex;
            let nextIndex = currentIndex + scanDirection;
            while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {

                let point1 = sampleLine.points[currentIndex];
                let point2 = sampleLine.points[nextIndex];

                let nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, false, true);

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

                vec3.copy(editPoint.oldLocation, targetPoint.adjustedLocation);

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
                vec3.copy(targetPoint.adjustedLocation, targetPoint.location);
            }

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        redo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;

                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustedLocation, targetPoint.location);
            }

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        errorCheck() {

            if (this.targetLine == null) {
                throw ('Command_ScratchLine: line is null!');
            }
        }
    }
}
