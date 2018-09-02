
namespace ManualTracingTool {

    class Tool_ScratchLineWidth_EditPoint {

        pair: Tool_ScratchLine_CandidatePair = null;

        newLineWidth = 0.0;
        oldLineWidth = 0.0;
    }

    export class Tool_ScratchLineWidth extends ManualTracingTool.Tool_ScratchLine {

        helpText = '線の太くします。SHIFTキーで線を細くします。最大は描画の線の太さ、最小は0.1です。';

        enableExtrude = false;

        protected executeCommand(env: ToolEnvironment) { // @override

            let baseRadius = env.mouseCursorViewRadius;
            let targetLine = env.currentVectorLine;

            // Resampling editor line
            this.resampledLine = this.generateCutoutedResampledLine(this.editLine, env);

            // Get candidate points
            let editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate;
            let editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate;
            let candidatePointPairs = this.ganerateCandidatePoints(
                targetLine
                , this.resampledLine
                , editFalloffRadiusMin
                , editFalloffRadiusMax
            );

            if (candidatePointPairs != null && candidatePointPairs.length > 0) {

                let command = new Command_ScratchLineWidth();
                command.isContinued = (this.extrudeLine != null);
                command.targetLine = targetLine;

                if (env.isCtrlKeyPressing()) {

                    command.fixedOverWriting = true;
                    command.fixedOverWritingLineWidth = 3.0;
                }

                for (let pair of candidatePointPairs) {

                    let editPoint = new Tool_ScratchLineWidth_EditPoint();
                    editPoint.pair = pair;

                    if (env.isShiftKeyPressing()) {

                        editPoint.pair.candidatePoint.lineWidth = 0.1;
                    }
                    else {

                        editPoint.pair.candidatePoint.lineWidth = env.drawLineBaseWidth;
                    }

                    command.editPoints.push(editPoint);
                }

                command.execute(env);

                env.commandHistory.addCommand(command);
            }
        }
    }

    export class Command_ScratchLineWidth extends CommandBase {

        targetLine: VectorLine = null;
        editPoints = new List<Tool_ScratchLineWidth_EditPoint>();

        fixedOverWriting = false;
        fixedOverWritingLineWidth = 0.0;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.prepareEditPoints();

            this.redo(env);
        }

        private prepareEditPoints() {

            for (let editPoint of this.editPoints) {

                let candidatePoint = editPoint.pair.candidatePoint;
                let targetPoint = editPoint.pair.targetPoint;

                editPoint.oldLineWidth = editPoint.pair.targetPoint.lineWidth;

                if (editPoint.pair.influence > 0.0) {

                    if (this.fixedOverWriting) {

                        editPoint.newLineWidth = this.fixedOverWritingLineWidth;
                    }
                    else {

                        editPoint.newLineWidth = Maths.lerp(
                            editPoint.pair.influence * 0.5
                            , editPoint.pair.targetPoint.lineWidth
                            , editPoint.pair.candidatePoint.lineWidth);
                    }
                }
                else {

                    editPoint.newLineWidth = editPoint.pair.targetPoint.lineWidth;
                }
            }
        }

        undo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;

                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }

            Logic_Edit_Line.calculateParameters(this.targetLine);
        }

        redo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.pair.targetPoint;

                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
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
