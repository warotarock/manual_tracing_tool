
namespace ManualTracingTool {

    export class Tool_DrawLine extends ToolBase {

        editLine: VectorLine = null;

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

            Logic_Edit_Line.smooth(this.editLine);

            env.setRedrawMainWindow();
            env.setRedrawEditorWindow();

            this.editLine = null;
        }

        private executeCommand(env: ToolEnvironment) {

            let command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = this.editLine;

            command.execute(env);

            env.commandHistory.addCommand(command);
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
