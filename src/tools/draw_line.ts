import { List, ListRemoveAt } from '../base/conversion';

import {
    VectorPoint,
    VectorStroke,
    VectorStrokeGroup,
    Layer,
} from '../base/data';

import {
    ToolEnvironment, ToolMouseEvent,
    ToolBase,
    ToolDrawingEnvironment,
} from '../base/tool';

import { CommandBase } from '../base/command';
import { Logic_Edit_Points, Logic_Edit_Line } from '../logics/edit_vector_layer';

export class Tool_DrawLine extends ToolBase {

    helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。';

    editLine: VectorStroke = null;
    continuousFill = false;

    isAvailable(env: ToolEnvironment): boolean { // @override

        return (
            env.currentVectorLayer != null
            && Layer.isVisible(env.currentVectorLayer)
        );
    }

    onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

        if (this.editLine != null) {

            drawEnv.editorDrawer.drawEditorEditLineStroke(this.editLine);
        }
    }

    mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (!e.isLeftButtonPressing()) {
            return;
        }

        this.continuousFill = env.isShiftKeyPressing();

        this.editLine = new VectorStroke();

        this.addPointToEditLine(e, env);
    }

    private addPointToEditLine(e: ToolMouseEvent, env: ToolEnvironment) {

        let point = new VectorPoint();
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
        let previousConnectedLine: VectorStroke = null;
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

                    let revercedList = new List<VectorPoint>();
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
        command.prepareEditTargets(env.currentVectorGroup, resampledLine);
        command.setContiuousStates(this.continuousFill, previousConnectedLine, previousConnectedLine_continuousFill);

        command.useGroup(env.currentVectorGroup);

        env.commandHistory.executeCommand(command, env);

        this.editLine = null;
    }
}

export class Command_AddLine extends CommandBase {

    protected group: VectorStrokeGroup = null;
    protected line: VectorStroke = null;
    protected continuousFill = false;

    previousConnectedLine: VectorStroke = null;
    previousConnectedLine_continuousFill = false;

    prepareEditTargets(group: VectorStrokeGroup, line: VectorStroke) {

        this.group = group;
        this.line = line;

        this.useGroup(group);
    }

    setContiuousStates(continuousFill: boolean, previousConnectedLine: VectorStroke, previousConnectedLine_continuousFill: boolean) {

        this.continuousFill = continuousFill;
        this.previousConnectedLine = previousConnectedLine;
        this.previousConnectedLine_continuousFill = previousConnectedLine_continuousFill;
    }

    execute(env: ToolEnvironment) { // @override

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

        env.setCurrentVectorLine(this.line, this.group);
    }
}
