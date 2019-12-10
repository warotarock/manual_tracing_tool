
namespace ManualTracingTool {

    export class Tool_AddPoint extends ToolBase {

        edit_Line: VectorLine = null;

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!e.isLeftButtonPressing()) {
                return;
            }

            if (env.isAnyModifierKeyPressing()) {
                return;
            }

            let addLine = false;

            if (this.edit_Line == null) {
                this.edit_Line = new VectorLine();
                addLine = true;
            }

            Logic_Edit_Line.smooth(this.edit_Line);

            this.executeCommand(e.location[0], e.location[1], addLine, env);

            env.setRedrawMainWindow();
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override
        }

        private executeCommand(x: float, y: float, addLine: boolean, env: ToolEnvironment) {

            let command = new Command_AddPoint();
            command.group = env.currentVectorGroup;
            command.line = this.edit_Line;
            command.point = new LinePoint();
            command.addLine = addLine;
            vec3.set(command.point.location, x, y, 0.0);

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    export class Command_AddPoint extends CommandBase {

        group: VectorGroup = null;
        line: VectorLine = null;
        point: LinePoint = null;
        addLine = false;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            if (this.addLine) {

                this.group.lines.push(this.line);
            }

            this.line.points.push(this.point);

            GPUVertexBuffer.setUpdated(this.group.buffer);
        }

        undo(env: ToolEnvironment) { // @override

            ListRemoveAt(this.line.points, this.line.points.length - 1);

            if (this.addLine) {

                ListRemoveAt(this.group.lines, this.group.lines.length - 1);
            }

            GPUVertexBuffer.setUpdated(this.group.buffer);
        }

        redo(env: ToolEnvironment) { // @override

            this.execute(env);
        }

        errorCheck() {

            if (this.group == null) {
                throw ('Com_AddLine: group is null!');
            }

            if (this.line == null) {
                throw ('Com_AddPoint: line is null!');
            }

            if (this.point == null) {
                throw ('Com_AddPoint: point is null!');
            }
        }
    }
}
