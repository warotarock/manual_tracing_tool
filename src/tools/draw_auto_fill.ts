import { List, ListRemoveAt } from '../base/conversion';
import { VectorPoint, VectorStroke, VectorStrokeGroup, Layer, } from '../base/data';
import { ToolEnvironment, ToolMouseEvent, ToolBase, } from '../base/tool';
import { CommandBase } from '../base/command';
import { Logic_Edit_Points, Logic_Edit_Line } from '../logics/edit_vector_layer';

export class Tool_DrawAutoFill extends ToolBase {

    helpText = '塗りつぶしを追加します。指定した位置から最も近い線の内側を塗りつぶします。';

    editLine: VectorStroke = null;

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
    }

    mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (this.editLine == null) {
            return;
        }

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

        let command = new Command_AddLine();
        command.prepareEditTargets(env.currentVectorGroup, resampledLine);
        command.useGroup(env.currentVectorGroup);
        command.executeCommand(env);

        env.commandHistory.addCommand(command);

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

    protected execute(env: ToolEnvironment) { // @override

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
