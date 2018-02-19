
namespace ManualTracingTool {

    enum SelectionProgressID {

        none = 0,
        selecting = 1
    }

    export class Tool_Select_BrushSelet_LinePoint extends ToolBase {

        selectionProcessID = SelectionProgressID.none;

        logic_Selector: ISelector_BrushSelect = new Selector_LinePoint_BrushSelect(); // @virtual

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (e.isLeftButtonPressing()) {

                this.startSelection(e, env);
                this.processSelection(e, env);

                env.setRedrawMainWindow();
                env.setRedrawEditorWindow();
            }
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.selectionProcessID == SelectionProgressID.selecting) {

                if (e.isLeftButtonPressing()) {

                    this.processSelection(e, env);
                    env.setRedrawMainWindow();
                }
            }

            env.setRedrawEditorWindow();
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.selectionProcessID == SelectionProgressID.selecting) {

                this.endSelection(env);

                env.setRedrawMainWindow();
            }

            env.setRedrawEditorWindow();
        }

        private startSelection(e: ToolMouseEvent, env: ToolEnvironment) {

            if (this.selectionProcessID != SelectionProgressID.none) {

                return;
            }

            if (env.isCtrlKeyPressing()) {

                this.logic_Selector.editMode = SelectionEditMode.toggle;
            }
            else if (env.isAltKeyPressing()) {

                this.logic_Selector.editMode = SelectionEditMode.setUnselected;
            }
            else {

                this.logic_Selector.editMode = SelectionEditMode.setSelected;
            }

            this.logic_Selector.startProcess();

            this.selectionProcessID = SelectionProgressID.selecting;
        }

        private processSelection(e: ToolMouseEvent, env: ToolEnvironment) {

            this.logic_Selector.processLayer(env.currentVectorLayer, e.location[0], e.location[1], env.mouseCursorRadius);
        }

        private endSelection(env: ToolEnvironment) {

            if (this.selectionProcessID != SelectionProgressID.selecting) {

                return;
            }

            this.logic_Selector.endProcess();

            this.selectionProcessID = SelectionProgressID.none;

            if (this.logic_Selector.selectionInfo.selectedLines.length == 0
                && this.logic_Selector.selectionInfo.selectedPoints.length == 0) {

                return;
            }

            this.executeCommand(env);
        }

        protected executeCommand(env: ToolEnvironment) { // @virtual

            let command = new Command_Select();
            command.selector = this.logic_Selector.selectionInfo;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    export class Tool_Select_BrushSelet_Line extends Tool_Select_BrushSelet_LinePoint {

        logic_Selector: ISelector_BrushSelect = new Selector_Line_BrushSelect(); // @override
    }

    export class Tool_Select_BrushSelet_LineSegment extends Tool_Select_BrushSelet_LinePoint {

        logic_Selector: ISelector_BrushSelect = new Selector_LineSegment_BrushSelect(); // @override
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
