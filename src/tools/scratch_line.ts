import {
    List, float, int, ListAddRange, ListGetRange, ListClone
} from '../base/conversion';

import {
    Layer, VectorStrokeGroup, VectorStroke, VectorPoint, VectorGeometry, LinePointModifyFlagID,
} from '../base/data';

import {
    ToolEnvironment, ToolBase,
    ViewKeyframeLayer,
    ToolDrawingEnvironment,
    ToolMouseEvent,
} from '../base/tool';

import { CommandBase } from '../base/command';
import { Logic_Edit_Points, Logic_Edit_Line, Logic_Edit_VectorLayer } from '../logics/edit_vector_layer';
import { HitTest_Line_PointToLineByDistanceSingle } from '../logics/hittest';
import { Logic_Points } from '../logics/points';
import { Maths } from '../logics/math';

export class Tool_ScratchLine_CandidatePair {

    targetPoint: VectorPoint = null;
    candidatePoint: VectorPoint = null;

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

    editLine: VectorStroke = null;
    resampledLine: VectorStroke = null;
    candidateLine: VectorStroke = null;
    forwardExtrude = false;
    extrudeLine: VectorStroke = null;

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
            env.currentLayer != null
            && Layer.isEditTarget(env.currentLayer)
        );
    }

    mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (e.isLeftButtonPressing()) {

            this.editLine = new VectorStroke();
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

            let point = new VectorPoint();
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

        drawEnv.editorDrawer.drawMouseCursor(env.mouseCursorViewRadius);

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

                        drawEnv.editorDrawer.drawEditorVectorLinePoints(
                            env.currentVectorLine
                            , env.currentVectorLayer.layerColor
                            , false
                        );
                    }
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

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        let hitedLine: VectorStroke = null;
        let hitedGroup: VectorStrokeGroup = null;

        ViewKeyframeLayer.forEachGeometry(viewKeyframeLayers, (geometry: VectorGeometry) => {

            if (hitedLine == null) {

                this.lineSingleHitTester.startProcess();
                this.lineSingleHitTester.processLayer(geometry, location, env.mouseCursorViewRadius);

                hitedLine = this.lineSingleHitTester.hitedLine;
                hitedGroup = this.lineSingleHitTester.hitedGroup;
            }
        });

        if (hitedLine != null) {

            env.setCurrentVectorLine(hitedLine, hitedGroup);

            env.setRedrawCurrentLayer();
            env.setRedrawEditorWindow();
        }
    }

    protected executeCommand(env: ToolEnvironment) { // @virtual

        let isExtrudeDone = false;
        let isScratchingDone = false;

        let targetLine = env.currentVectorLine;
        let targetGroup = env.currentVectorGroup;
        let oldPoints = targetLine.points;

        if (this.enableExtrude) {

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);

            this.resampledLine = Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);

            isExtrudeDone = this.executeExtrudeLine(targetLine, targetGroup, this.resampledLine, env);
        }

        if (this.enableScratchEdit) {

            this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);

            isScratchingDone = this.executeScratchingLine(targetLine, targetGroup, this.resampledLine, isExtrudeDone, env);
        }

        if (isExtrudeDone || isScratchingDone) {

            this.deleteDuplications(targetLine, targetGroup, env);
        }

        Logic_Edit_VectorLayer.clearPointModifyFlags(oldPoints);
    }

    // Adjusting edit line

    protected cutoutLine(result: VectorStroke): VectorStroke {

        let startIndex = this.searchCutoutIndex(result, false);
        let endIndex = this.searchCutoutIndex(result, true);

        result.points = ListGetRange(result.points, startIndex, (endIndex - startIndex) + 1);

        Logic_Edit_Line.smooth(result);
        Logic_Edit_Line.applyAdjustments(result);

        return result;
    }

    private searchCutoutIndex(editorLine: VectorStroke, isForward: boolean): int {

        let scanDirection = isForward ? 1 : -1;

        let cutoutIndex = isForward ? (editorLine.points.length - 1) : 0;

        let centerIndex = Math.floor(editorLine.points.length / 2);

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

    protected generateCutoutedResampledLine(editorLine: VectorStroke, env: ToolEnvironment): VectorStroke {

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

    protected executeExtrudeLine(targetLine: VectorStroke, targetGroup: VectorStrokeGroup, resampledLine: VectorStroke, env: ToolEnvironment): boolean {

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

            command.useGroup(targetGroup);

            env.commandHistory.executeCommand(command, env);

            return true;
        }
        else {

            return false;
        }
    }

    protected generateExtrudePoints(fromTargetLineTop: boolean, targetLine: VectorStroke, sampleLine: VectorStroke, editExtrudeMinRadius: float, editExtrudeMaxRadius: float): VectorStroke {

        let startPoint: VectorPoint;
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

        let extrudeLine = new VectorStroke();
        extrudeLine.points = extrudePoints;

        return extrudeLine;
    }

    protected getExtrudePoints(targetLine: VectorStroke, sampleLine: VectorStroke, searchStartIndex: int, forwardSearch: boolean, limitMinDistance: float, limitMaxDistance: float): List<VectorPoint> {

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

        let result = new List<VectorPoint>();
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

    protected executeScratchingLine(targetLine: VectorStroke, targetGroup: VectorStrokeGroup, resampledLine: VectorStroke, isExtrudeDone: boolean, env: ToolEnvironment): boolean {

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
        this.candidateLine = new VectorStroke();
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

            env.commandHistory.executeCommand(command, env);

            return true;
        }
        else {

            return false;
        }
    }

    protected ganerateScratchingCandidatePoints(target_Line: VectorStroke, editorLine: VectorStroke, editFalloffRadiusMin: float, editFalloffRadiusMax: float, containsPointLineWidth: boolean): List<Tool_ScratchLine_CandidatePair> {

        let result = new List<Tool_ScratchLine_CandidatePair>();

        for (let point of target_Line.points) {

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
                    , editFalloffRadiusMax
                );

                if (influence > 0.0) {

                    // Create edit data
                    let candidatePoint = new VectorPoint();
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

    protected calculateScratchingCandidatePointInfluence(editorLine_TotalLength: float, sorroundingDistance: float, totalLengthInEditorLine: float, editFalloffRadiusMax: float): float { // @virtual

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

    protected deleteDuplications(targetLine: VectorStroke, targetGroup: VectorStrokeGroup, env: ToolEnvironment) {

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

        command.useGroup(targetGroup);

        env.commandHistory.executeCommand(command, env);
    }

    // Common functions

    protected findNearestPointIndex_LineSegmentToPoint(line: VectorStroke, point1: VectorPoint, point2: VectorPoint, limitMinDistance: float, limitMaxDistance: float, includeInnerSide: boolean, includeOuterSide: boolean): int {

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

    protected findNearestPointIndex_PointToPoint(line: VectorStroke, point: VectorPoint, limitMinDistance: float, limitMaxDistance: float): int {

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

    protected getNearPointCount(targetLine: VectorStroke, sampleLine: VectorStroke, searchStartIndex: int, forwardSearch: boolean, limitMaxDistance: float): int {

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

export class Command_ExtrudeLine extends CommandBase {

    targetGroups: List<VectorStrokeGroup> = null;
    targetLine: VectorStroke = null;

    forwardExtrude = false;
    extrudeLine: VectorStroke = null;

    oldPointList: List<VectorPoint> = null;
    newPointList: List<VectorPoint> = null;

    execute(env: ToolEnvironment) { // @override

        this.prepareEditPoints();

        this.redo(env);
    }

    private prepareEditPoints() {

        this.oldPointList = this.targetLine.points;

        if (this.forwardExtrude) {

            this.newPointList = ListClone(this.targetLine.points);
            ListAddRange(this.newPointList, this.extrudeLine.points);
        }
        else {

            this.newPointList = List<VectorPoint>();

            for (let i = this.extrudeLine.points.length - 1; i >= 0; i--) {

                this.newPointList.push(this.extrudeLine.points[i]);
            }

            ListAddRange(this.newPointList, this.targetLine.points);
        }
    }

    undo(env: ToolEnvironment) { // @override

        this.targetLine.points = this.oldPointList;
    }

    redo(env: ToolEnvironment) { // @override

        this.targetLine.points = this.newPointList;
    }
}

export class Command_ScratchLine extends CommandBase {

    targetLine: VectorStroke = null;
    editPoints = new List<Tool_ScratchLine_EditPoint>();

    execute(env: ToolEnvironment) { // @override

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
}

export class Command_DeleteDuplicationInLine extends CommandBase {

    targetLine: VectorStroke = null;

    oldPoints: List<VectorPoint> = null;
    newPoints: List<VectorPoint> = null;

    execute(env: ToolEnvironment) { // @override

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
}
