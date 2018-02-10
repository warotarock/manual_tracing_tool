
namespace ManualTracingTool {

    enum SelectProcessID {

        none = 0,
        selectiong = 1
    }

    export class Tool_Select_BrushSelet extends ToolBase {

        selectProcessID = SelectProcessID.none;

        selectedPoints: List<LinePoint> = null;

        logic_BrushSelect = new Selector_LinePoint_BrushSelect();

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (e.isLeftButtonPressing()) {

                this.processSelectionEdit(e, env);

                env.setRedrawMainWindow();
                env.setRedrawEditorWindow();
            }
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (e.isLeftButtonPressing()) {

                this.processSelectionEdit(e, env);
                env.setRedrawMainWindow();
            }
            else {

                this.endSelectionEdit(env);
            }

            env.setRedrawEditorWindow();
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!e.isLeftButtonPressing()) {

                this.endSelectionEdit(env);

                env.setRedrawEditorWindow();
            }
        }

        private processSelectionEdit(e: ToolMouseEvent, env: ToolEnvironment) {

            if (this.selectProcessID == SelectProcessID.none) {

                if (env.isCtrlKeyPressing()) {

                    this.logic_BrushSelect.editMode = SelectionEditMode.toggle;
                }
                else if (env.isAltKeyPressing()) {

                    this.logic_BrushSelect.editMode = SelectionEditMode.setUnselected;
                }
                else {

                    this.logic_BrushSelect.editMode = SelectionEditMode.setSelected;
                }

                this.logic_BrushSelect.startProcess();

                this.selectProcessID = SelectProcessID.selectiong;
            }

            this.logic_BrushSelect.processLayer(env.currentVectorLayer, e.location[0], e.location[1], env.mouseCursorRadius);
        }

        private endSelectionEdit(env: ToolEnvironment) {

            if (this.selectProcessID != SelectProcessID.selectiong) {
                return;
            }

            this.logic_BrushSelect.endProcess();

            this.selectProcessID = SelectProcessID.none;

            if (this.logic_BrushSelect.selectionInfo.selectedLines.length == 0
                && this.logic_BrushSelect.selectionInfo.selectedPoints.length == 0) {

                return;
            }

            this.executeCommand(env);
        }

        private executeCommand(env: ToolEnvironment) {

            let command = new Command_Select();
            command.selector = this.logic_BrushSelect.selectionInfo;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    export class Command_Select extends CommandBase {

        selector: VectorLineSelectionEditingInfo = null;

        selectedLines: List<LineSelectionInfo> = null;
        selectedPoints: List<PointSelectionInfo> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            // Selection process is done while inputting

            this.selectedLines = ListClone(this.selector.selectedLines);
            this.selectedPoints = ListClone(this.selector.selectedPoints);
        }

        undo(env: ToolEnvironment) { // @override

            for (let selPoint of this.selectedPoints) {

                selPoint.point.isSelected = selPoint.selectStateBefore;
            }

            for (let selLine of this.selectedLines) {

                selLine.line.isSelected = selLine.selectStateBefore;
            }
        }

        redo(env: ToolEnvironment) { // @override

            for (let selPoint of this.selectedPoints) {

                selPoint.point.isSelected = selPoint.selectStateAfter;
            }

            for (let selLine of this.selectedLines) {

                selLine.line.isSelected = selLine.selectStateAfter;
            }
        }

        errorCheck() {

            if (this.selector == null) {
                throw ('Com_Select: selectedLines is null!');
            }

            if (this.selector.selectedLines == null) {
                throw ('Com_Select: selectedLines is null!');
            }

            if (this.selector.selectedPoints == null) {
                throw ('Com_Select: selectedPoints is null!');
            }

            if (this.selector.selectedLines.length == 0
                && this.selector.selectedPoints.length == 0) {

                throw ('Com_Select: no points is selected!');
            }
        }
    }
}
