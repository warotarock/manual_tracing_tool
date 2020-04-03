import { List } from 'base/conversion';

import {
    VectorGroup, VectorLine, LinePoint, LinePointModifyFlagID,
} from 'base/data';

import {
    ToolEnvironment, ToolMouseEvent,
} from 'base/tool';

import { CommandBase } from 'base/command';
import { Selector_LinePoint_BrushSelect, ISelector_BrushSelect, VectorLayerEditorSelectionInfo } from 'logics/selector';

import { Tool_BrushSelectLinePointBase } from 'tools/select_brush_select';


export class Selector_HideLinePoint_BrushSelect extends Selector_LinePoint_BrushSelect {

    lineWidth = 0.0;

    protected onPointHited(group: VectorGroup, line: VectorLine, point: LinePoint) { // @override

        if (point.modifyFlag == LinePointModifyFlagID.none) {

            point.adjustingLineWidth = this.lineWidth;

            this.selectionInfo.editGroup(group);
            this.selectionInfo.editLine(line);
            this.selectionInfo.editPoint(point);
        }
    }
}

export class Tool_HideLinePoint_BrushSelect extends Tool_BrushSelectLinePointBase {

    helpText = '線の太さに最大の太さに設定します。<br />Shiftキーで最小の太さに設定します。Ctrlキーで線をの太さを０にします。';
    isEditTool = false; // @override

    selector = new Selector_HideLinePoint_BrushSelect();
    logic_Selector: ISelector_BrushSelect = this.selector; // @override

    protected onStartSelection(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (env.isShiftKeyPressing()) {

            this.selector.lineWidth = env.drawLineMinWidth;
        }
        else if (env.isCtrlKeyPressing()) {

            this.selector.lineWidth = 0.0;
        }
        else {

            this.selector.lineWidth = env.drawLineBaseWidth;
        }
    }

    protected executeCommand(env: ToolEnvironment) { // @override

        let command = new Command_EditLinePointLineWidth();
        if (command.prepareEditTargets(this.selector.selectionInfo)) {

            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        }

        env.setRedrawMainWindow();
    }

    cancelModal(env: ToolEnvironment) { // @override

        for (let selPoint of this.logic_Selector.selectionInfo.selectedPoints) {

            selPoint.point.adjustingLineWidth = selPoint.point.lineWidth;
        }

        this.logic_Selector.endProcess();

        env.setRedrawMainWindowEditorWindow();
    }
}

class Tool_EditLineWidth_EditPoint {

    targetPoint: LinePoint = null;

    newLineWidth = 0.0;
    oldLineWidth = 0.0;
}

export class Command_EditLinePointLineWidth extends CommandBase {

    editPoints = new List<Tool_EditLineWidth_EditPoint>();

    prepareEditTargets(selectionInfo: VectorLayerEditorSelectionInfo): boolean {

        let editPointCount = 0;

        for (let selPoint of selectionInfo.selectedPoints) {
            let point = selPoint.point;

            let editPoint = new Tool_EditLineWidth_EditPoint();
            editPoint.targetPoint = point;
            editPoint.oldLineWidth = point.lineWidth;
            editPoint.newLineWidth = point.adjustingLineWidth;

            this.editPoints.push(editPoint);

            editPointCount++;
        }

        if (editPointCount > 0) {

            this.useGroups();

            for (let selGroup of selectionInfo.selectedGroups) {

                this.targetGroups.push(selGroup.group);
            }
        }

        return (editPointCount > 0);
    }

    protected execute(env: ToolEnvironment) { // @override

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        for (let editPoint of this.editPoints) {
            let targetPoint = editPoint.targetPoint;

            targetPoint.lineWidth = editPoint.oldLineWidth;
            targetPoint.adjustingLineWidth = targetPoint.lineWidth;
        }
    }

    redo(env: ToolEnvironment) { // @override

        for (let editPoint of this.editPoints) {
            let targetPoint = editPoint.targetPoint;

            targetPoint.lineWidth = editPoint.newLineWidth;
            targetPoint.adjustingLineWidth = targetPoint.lineWidth;
        }
    }
}
