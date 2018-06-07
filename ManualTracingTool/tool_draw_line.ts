
namespace ManualTracingTool {

    export class Tool_DrawLine extends ToolBase {

        editLine: VectorLine = null;

        resamplingUnitLength = 1.0;

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!e.isLeftButtonPressing()) {
                return;
            }

            if (env.isAnyModifierKeyPressing()) {
                return;
            }

            this.editLine = new VectorLine();

            this.addPointToEditLine(e);
        }

        private addPointToEditLine(e: ToolMouseEvent) {

            let point = new LinePoint();
            vec3.copy(point.location, e.location);

            this.editLine.points.push(point);
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.editLine == null) {
                return;
            }

            this.addPointToEditLine(e);

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

            this.executeCommand(env);

            env.setRedrawMainWindow();
            env.setRedrawEditorWindow();

            this.editLine = null;
        }

        private executeCommand(env: ToolEnvironment) {

            Logic_Edit_Line.smooth(this.editLine);

            Logic_Edit_Line.calculateParameters(this.editLine);

            let resamplingUnitLength = env.getView_ResamplingUnitLength(this.resamplingUnitLength);

            let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength);

            let resampledLine = Logic_Edit_Line.createResampledLine(this.editLine, divisionCount);

            let command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = resampledLine;

            command.execute(env);

            env.commandHistory.addCommand(command);

            this.editLine = null;
        }
    }

    export class Command_AddLine extends CommandBase {

        group: VectorGroup = null;
        line: VectorLine = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.group.lines.push(this.line);

            env.setCurrentVectorLine(this.line, false);
        }

        undo(env: ToolEnvironment) { // @override

            ListRemoveAt(this.group.lines, this.group.lines.length - 1);
        }

        redo(env: ToolEnvironment) { // @override

            this.execute(env);
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
