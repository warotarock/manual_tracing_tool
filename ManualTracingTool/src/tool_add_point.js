var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_AddPoint extends ManualTracingTool.ToolBase {
        constructor() {
            super(...arguments);
            this.edit_Line = null;
        }
        mouseDown(e, env) {
            if (!e.isLeftButtonPressing()) {
                return;
            }
            if (env.isAnyModifierKeyPressing()) {
                return;
            }
            let addLine = false;
            if (this.edit_Line == null) {
                this.edit_Line = new ManualTracingTool.VectorLine();
                addLine = true;
            }
            ManualTracingTool.Logic_Edit_Line.smooth(this.edit_Line);
            this.executeCommand(e.location[0], e.location[1], addLine, env);
            env.setRedrawMainWindow();
        }
        mouseMove(e, env) {
        }
        mouseUp(e, env) {
        }
        executeCommand(x, y, addLine, env) {
            let command = new Command_AddPoint();
            command.group = env.currentVectorGroup;
            command.line = this.edit_Line;
            command.point = new ManualTracingTool.LinePoint();
            command.addLine = addLine;
            vec3.set(command.point.location, x, y, 0.0);
            command.execute(env);
            env.commandHistory.addCommand(command);
        }
    }
    ManualTracingTool.Tool_AddPoint = Tool_AddPoint;
    class Command_AddPoint extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.group = null;
            this.line = null;
            this.point = null;
            this.addLine = false;
        }
        execute(env) {
            this.errorCheck();
            if (this.addLine) {
                this.group.lines.push(this.line);
            }
            this.line.points.push(this.point);
            ManualTracingTool.GPUVertexBuffer.setUpdated(this.group.buffer);
        }
        undo(env) {
            ListRemoveAt(this.line.points, this.line.points.length - 1);
            if (this.addLine) {
                ListRemoveAt(this.group.lines, this.group.lines.length - 1);
            }
            ManualTracingTool.GPUVertexBuffer.setUpdated(this.group.buffer);
        }
        redo(env) {
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
    ManualTracingTool.Command_AddPoint = Command_AddPoint;
})(ManualTracingTool || (ManualTracingTool = {}));
