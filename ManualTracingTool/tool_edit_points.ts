
namespace ManualTracingTool {

    export class Selector_EditLinePointWidth_BrushSelect extends Selector_LinePoint_BrushSelect {

        lineWidth = 0.0;

        protected onPointHited(group: VectorGroup, line: VectorLine, point: LinePoint) { // @override

            if (point.modifyFlag == LinePointModifyFlagID.none) {

                point.adjustingLineWidth = this.lineWidth;

                this.selectionInfo.editPoint(point);
            }
        }

        protected afterHitTest() { // @override

            this.selectionInfo.resetModifyStatus();
        }
    }

    export class Tool_EditLinePointWidth_BrushSelect extends Tool_BrushSelectLinePointBase {

        logic_Selector: ISelector_BrushSelect = new Selector_EditLinePointWidth_BrushSelect(); // @override

        protected onStartSelection(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            let logic_Selector = (<Selector_EditLinePointWidth_BrushSelect>this.logic_Selector);
            logic_Selector.lineWidth = 0.0;
        }

        protected executeCommand(env: ToolEnvironment) { // @override

            let command = new Command_EditLineWidth();
            if (command.prepareEditTargets(this.logic_Selector.selectionInfo)) {

                command.execute(env);
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

    export class Command_EditLineWidth extends CommandBase {

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

            return (editPointCount > 0);
        }

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

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

        errorCheck() {

        }
    }
}
