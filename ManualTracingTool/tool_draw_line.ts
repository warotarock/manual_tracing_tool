
namespace ManualTracingTool {

    export class Tool_DrawLine extends ToolBase {

        helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。';

        editLine: VectorLine = null;
        continuousFill = false;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
                && Layer.isVisible(env.currentVectorLayer)
            );
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!e.isLeftButtonPressing()) {
                return;
            }

            this.continuousFill = env.isShiftKeyPressing();

            this.editLine = new VectorLine();

            this.addPointToEditLine(e, env);
        }

        private addPointToEditLine(e: ToolMouseEvent, env: ToolEnvironment) {

            let point = new LinePoint();
            vec3.copy(point.location, e.location);
            point.lineWidth = env.drawLineBaseWidth;

            this.editLine.points.push(point);
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.editLine == null) {
                return;
            }

            this.addPointToEditLine(e, env);

            env.setRedrawEditorWindow();
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.editLine == null) {
                return;
            }

            if (env.currentVectorGroup == null) {

                this.editLine = null;
                env.setRedrawEditorWindow();
                return;
            }

            this.continuousFill = (this.continuousFill || env.isShiftKeyPressing());

            this.executeCommand(env);

            env.setRedrawCurrentLayer();
            env.setRedrawEditorWindow();

            this.editLine = null;
        }

        private executeCommand(env: ToolEnvironment) {

            let targetGroup = env.currentVectorGroup;
            let editLine = this.editLine;

            // Crete new line
            Logic_Edit_Line.smooth(editLine);

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(editLine.totalLength, resamplingUnitLength);

            let resampledLine = Logic_Edit_Line.createResampledLine(editLine, divisionCount);

            if (resampledLine.points.length < 2) {

                return;
            }

            // Collect continuous filling info
            let previousConnectedLine: VectorLine = null;
            let previousConnectedLine_continuousFill = false;

            if (this.continuousFill && targetGroup.lines.length >= 1) {

                let connectLine = targetGroup.lines[targetGroup.lines.length - 1];

                if (connectLine.points.length >= 2) {

                    let lastPoint = connectLine.points[connectLine.points.length - 1];

                    let point1 = resampledLine.points[0];
                    let point2 = resampledLine.points[resampledLine.points.length - 1];

                    let distance1 = vec3.squaredDistance(lastPoint.location, point1.location);
                    let distance2 = vec3.squaredDistance(lastPoint.location, point2.location);

                    if (distance2 < distance1) {

                        let revercedList = new List<LinePoint>();
                        for (let i = resampledLine.points.length - 1; i >= 0; i--) {

                            revercedList.push(resampledLine.points[i]);
                        }

                        resampledLine.points = revercedList;
                    }

                    previousConnectedLine = targetGroup.lines[targetGroup.lines.length - 1];
                    previousConnectedLine_continuousFill = previousConnectedLine.continuousFill;
                }
            }

            let command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = resampledLine;
            command.continuousFill = this.continuousFill;
            command.previousConnectedLine = previousConnectedLine;
            command.previousConnectedLine_continuousFill = previousConnectedLine_continuousFill;

            command.execute(env);

            env.commandHistory.addCommand(command);

            this.editLine = null;
        }
    }

    export class Command_AddLine extends CommandBase {

        group: VectorGroup = null;
        line: VectorLine = null;
        continuousFill = false;

        previousConnectedLine: VectorLine = null;
        previousConnectedLine_continuousFill = false;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            ListRemoveAt(this.group.lines, this.group.lines.length - 1);

            if (this.previousConnectedLine != null) {

                this.previousConnectedLine.continuousFill = this.previousConnectedLine_continuousFill;
            }
        }

        redo(env: ToolEnvironment) { // @override

            this.group.lines.push(this.line);

            if (this.previousConnectedLine != null) {

                this.previousConnectedLine.continuousFill = true;
            }

            env.setCurrentVectorLine(this.line, false);
        }

        errorCheck() {

            if (this.group == null) {
                throw ('Com_AddLine: group is null!');
            }

            if (this.line == null) {
                throw ('Com_AddLine: line is null!');
            }
        }
    }
}
