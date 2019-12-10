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
    class Tool_OverWriteLineWidth extends ManualTracingTool.Tool_ScratchLine {
        constructor() {
            super(...arguments);
            this.helpText = '線を最大の太さに近づけます。Shiftキーで線を細くします。<br />Ctrlキーで最大の太さ固定になります。';
            this.editFalloffRadiusContainsLineWidth = true;
        }
        executeCommand(env) {
            let baseRadius = env.mouseCursorViewRadius;
            let targetLine = env.currentVectorLine;
            // Resampling editor line
            this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);
            // Get candidate points
            let editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            let editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
            let candidatePointPairs = this.ganerateScratchingCandidatePoints(targetLine, this.resampledLine, editFalloffRadiusMin, editFalloffRadiusMax, this.editFalloffRadiusContainsLineWidth);
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
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
            this.clearFlags(env);
        }
        processPoint(editPoint, env) {
            let setTo_LineWidth = env.drawLineBaseWidth;
            if (env.isShiftKeyPressing()) {
                setTo_LineWidth = env.drawLineMinWidth;
            }
            let fixedOverWriting = false;
            if (env.isCtrlKeyPressing()) {
                fixedOverWriting = true;
            }
            let candidatePoint = editPoint.pair.candidatePoint;
            let targetPoint = editPoint.pair.targetPoint;
            vec3.copy(editPoint.newLocation, editPoint.pair.targetPoint.location);
            if (editPoint.pair.influence > 0.0) {
                if (fixedOverWriting) {
                    editPoint.newLineWidth = setTo_LineWidth;
                }
                else {
                    editPoint.newLineWidth = ManualTracingTool.Maths.lerp(editPoint.pair.influence * 0.5, editPoint.pair.targetPoint.lineWidth, setTo_LineWidth);
                }
            }
            else {
                editPoint.newLineWidth = editPoint.pair.targetPoint.lineWidth;
            }
        }
    }
    ManualTracingTool.Tool_OverWriteLineWidth = Tool_OverWriteLineWidth;
    class Tool_ScratchLineWidth extends Tool_OverWriteLineWidth {
        constructor() {
            super(...arguments);
            this.helpText = '線の太さを足します。Shiftキーで減らします。';
            this.editFalloffRadiusMinRate = 0.15;
            this.editFalloffRadiusMaxRate = 1.0;
            this.editInfluence = 1.0;
            this.subtructVector = vec3.create();
            this.moveVector = vec3.create();
        }
        processPoint(editPoint, env) {
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
                    let newRadius = ManualTracingTool.Maths.lerp(editPoint.pair.influence, targetPointRadius, totalRadius);
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
                    let newRadius = ManualTracingTool.Maths.lerp(editPoint.pair.influence, targetPointRadius, totalRadius);
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
    ManualTracingTool.Tool_ScratchLineWidth = Tool_ScratchLineWidth;
    class Command_ScratchLineWidth extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetLine = null;
            this.editPoints = new List();
        }
        execute(env) {
            this.errorCheck();
            this.redo(env);
        }
        undo(env) {
            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;
                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = editPoint.oldLineWidth;
                vec3.copy(targetPoint.location, editPoint.oldLocation);
                vec3.copy(targetPoint.adjustingLocation, editPoint.oldLocation);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        }
        redo(env) {
            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;
                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = editPoint.newLineWidth;
                vec3.copy(targetPoint.location, editPoint.newLocation);
                vec3.copy(targetPoint.adjustingLocation, editPoint.newLocation);
            }
            ManualTracingTool.Logic_Edit_Line.calculateParameters(this.targetLine);
        }
        errorCheck() {
            if (this.targetLine == null) {
                throw ('Command_ScratchLine: line is null!');
            }
        }
    }
    ManualTracingTool.Command_ScratchLineWidth = Command_ScratchLineWidth;
})(ManualTracingTool || (ManualTracingTool = {}));
