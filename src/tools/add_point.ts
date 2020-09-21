import { float, ListRemoveAt } from '../base/conversion';

import {
    VectorPoint,
    VectorStroke,
    VectorStrokeGroup,
} from '../base/data';

import {
    ToolEnvironment, ToolMouseEvent,
    ToolBase,
} from '../base/tool';

import { CommandBase } from '../base/command';

import { Logic_Edit_Line } from '../logics/edit_vector_layer';

export class Tool_AddPoint extends ToolBase {

    edit_Line: VectorStroke = null;

    mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (!e.isLeftButtonPressing()) {
            return;
        }

        if (env.isAnyModifierKeyPressing()) {
            return;
        }

        let addLine = false;

        if (this.edit_Line == null) {
            this.edit_Line = new VectorStroke();
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
        command.point = new VectorPoint();
        command.addLine = addLine;
        vec3.set(command.point.location, x, y, 0.0);

        command.useGroup(command.group);

        command.executeCommand(env);

        env.commandHistory.addCommand(command);
    }
}

export class Command_AddPoint extends CommandBase {

    group: VectorStrokeGroup = null;
    line: VectorStroke = null;
    point: VectorPoint = null;
    addLine = false;

    protected execute(env: ToolEnvironment) { // @override

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        ListRemoveAt(this.line.points, this.line.points.length - 1);

        if (this.addLine) {

            ListRemoveAt(this.group.lines, this.group.lines.length - 1);
        }
    }

    redo(env: ToolEnvironment) { // @override

        if (this.addLine) {

            this.group.lines.push(this.line);
        }

        this.line.points.push(this.point);
    }
}
