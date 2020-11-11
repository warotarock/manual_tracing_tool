import { List } from '../base/conversion';
import { VectorStroke, } from '../base/data';
import { ToolEnvironment, } from '../base/tool';
import { CommandBase } from '../base/command';

import { Maths } from '../logics/math';
import { Logic_Edit_Line, Logic_Edit_VectorLayer } from '../logics/edit_vector_layer';

import { Tool_ScratchLine, Tool_ScratchLine_CandidatePair } from '../tools/scratch_line';

class Tool_ScratchLineWidth_EditPoint {

    pair: Tool_ScratchLine_CandidatePair = null;

    newLineWidth = 0.0;
    oldLineWidth = 0.0;
    newLocation = vec3.create();
    oldLocation = vec3.create();
}

export class Tool_OverWriteLineWidth extends Tool_ScratchLine {

    helpText = '線を最大の太さに近づけます。Shiftキーで線を細くします。<br />Ctrlキーで最大の太さ固定になります。';

    editFalloffRadiusContainsLineWidth = true;

    protected executeCommand(env: ToolEnvironment) { // @override

        let baseRadius = env.mouseCursorViewRadius;
        let targetLine = env.currentVectorLine;
        let targetGroup = env.currentVectorGroup;
        let oldPoints = targetLine.points;

        // Resampling editor line
        this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);

        // Get candidate points
        let editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
        let editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
        let candidatePointPairs = this.ganerateScratchingCandidatePoints(
            targetLine
            , this.resampledLine
            , editFalloffRadiusMin
            , editFalloffRadiusMax
            , this.editFalloffRadiusContainsLineWidth
        );

        if (candidatePointPairs != null && candidatePointPairs.length > 0) {

            let command = new Command_ScratchLineWidth();
            command.targetLine = targetLine;

            for (let pair of candidatePointPairs) {

                let editPoint = new Tool_ScratchLineWidth_EditPoint();
                editPoint.pair = pair;

                editPoint.oldLineWidth = editPoint.pair.targetPoint.lineWidth;
                vec3.copy(editPoint.oldLocation, editPoint.pair.targetPoint.location);

                this.processPoint(editPoint, env);

                command.editPoints.push(editPoint);
            }

            command.useGroup(targetGroup);

            env.commandHistory.executeCommand(command, env);
          }

        Logic_Edit_VectorLayer.clearPointModifyFlags(oldPoints);
    }

    protected processPoint(editPoint: Tool_ScratchLineWidth_EditPoint, env: ToolEnvironment) { // @virtual

        let setTo_LineWidth = env.drawLineBaseWidth;
        if (env.isShiftKeyPressing()) {

            setTo_LineWidth = env.drawLineMinWidth;
        }

        let fixedOverWriting = false;
        if (env.isCtrlKeyPressing()) {

            fixedOverWriting = true;
        }


        vec3.copy(editPoint.newLocation, editPoint.pair.targetPoint.location);

        if (editPoint.pair.influence > 0.0) {

            if (fixedOverWriting) {

                editPoint.newLineWidth = setTo_LineWidth;
            }
            else {

                editPoint.newLineWidth = Maths.lerp(
                    editPoint.pair.influence * 0.5
                    , editPoint.pair.targetPoint.lineWidth
                    , setTo_LineWidth);
            }
        }
        else {

            editPoint.newLineWidth = editPoint.pair.targetPoint.lineWidth;
        }
    }
}

export class Tool_ScratchLineWidth extends Tool_OverWriteLineWidth {

    helpText = '線の太さを足します。Shiftキーで減らします。';

    editFalloffRadiusMinRate = 0.15;
    editFalloffRadiusMaxRate = 1.0;
    editInfluence = 1.0;

    subtructVector = vec3.create();
    moveVector = vec3.create();

    protected processPoint(editPoint: Tool_ScratchLineWidth_EditPoint, env: ToolEnvironment) { // @override

        let targetPoint = editPoint.pair.targetPoint;
        let candidatePoint = editPoint.pair.candidatePoint;

        let targetPointRadius = targetPoint.lineWidth * 0.5;
        let candidatePointRadius = candidatePoint.lineWidth * 0.5;

        let distance = vec3.distance(targetPoint.location, candidatePoint.location);

        if (!env.isShiftKeyPressing()) {

            if (distance + candidatePointRadius > targetPointRadius
                && distance - candidatePointRadius > -targetPointRadius) {

                let totalDiameter = targetPointRadius + distance + candidatePointRadius;
                let totalRadius = totalDiameter * 0.5;

                let newRadius = Maths.lerp(
                    editPoint.pair.influence
                    , targetPointRadius
                    , totalRadius);

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

                let totalDiameter = targetPointRadius + distance - candidatePointRadius;
                let totalRadius = totalDiameter * 0.5;

                let newRadius = Maths.lerp(
                    editPoint.pair.influence
                    , targetPointRadius
                    , totalRadius);

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
    }
}

export class Command_ScratchLineWidth extends CommandBase {

    targetLine: VectorStroke = null;
    editPoints = new List<Tool_ScratchLineWidth_EditPoint>();

    execute(env: ToolEnvironment) { // @override

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        for (let editPoint of this.editPoints) {
            let targetPoint = editPoint.pair.targetPoint;

            targetPoint.lineWidth = editPoint.oldLineWidth;
            targetPoint.adjustingLineWidth = editPoint.oldLineWidth;

            vec3.copy(targetPoint.location, editPoint.oldLocation);
            vec3.copy(targetPoint.adjustingLocation, editPoint.oldLocation);
        }

        Logic_Edit_Line.calculateParameters(this.targetLine);
    }

    redo(env: ToolEnvironment) { // @override

        for (let editPoint of this.editPoints) {
            let targetPoint = editPoint.pair.targetPoint;

            targetPoint.lineWidth = editPoint.newLineWidth;
            targetPoint.adjustingLineWidth = editPoint.newLineWidth;

            vec3.copy(targetPoint.location, editPoint.newLocation);
            vec3.copy(targetPoint.adjustingLocation, editPoint.newLocation);
        }

        Logic_Edit_Line.calculateParameters(this.targetLine);
    }
}
