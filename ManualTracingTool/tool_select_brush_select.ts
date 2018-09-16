
namespace ManualTracingTool {

    export class Tool_BrushSelectLinePointBase extends ModalToolBase {

        logic_Selector: ISelector_BrushSelect = new Selector_LinePoint_BrushSelect(); // @virtual

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
            );
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            if (!env.isSelectMode()) {

                drawEnv.editorDrawer.drawMouseCursor();
            }
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentVectorLayer == null) {

                return;
            }

            if (e.isLeftButtonPressing()) {

                this.startSelection(e, env);
                this.processSelection(e, env);

                env.setRedrawMainWindow();
                env.setRedrawEditorWindow();
            }
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentVectorLayer == null) {

                env.setRedrawEditorWindow();
                return;
            }

            if (env.isModalToolRunning()) {

                if (e.isLeftButtonPressing()) {

                    this.processSelection(e, env);
                    env.setRedrawMainWindow();
                }
            }

            // redraw cursor
            env.setRedrawEditorWindow();
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentVectorLayer == null) {

                return;
            }

            if (env.isModalToolRunning()) {

                this.endSelection(env);

                env.setRedrawMainWindow();
            }

            env.setRedrawEditorWindow();
        }

        private startSelection(e: ToolMouseEvent, env: ToolEnvironment) {

            if (env.isCtrlKeyPressing()) {

                this.logic_Selector.editMode = SelectionEditMode.toggle;
            }
            else if (env.isAltKeyPressing()) {

                this.logic_Selector.editMode = SelectionEditMode.setUnselected;
            }
            else {

                this.logic_Selector.editMode = SelectionEditMode.setSelected;
            }

            this.onStartSelection(e, env);

            this.logic_Selector.startProcess();

            env.startModalTool(this);
        }

        protected onStartSelection(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

        }

        private processSelection(e: ToolMouseEvent, env: ToolEnvironment) {

            this.logic_Selector.processLayer(env.currentVectorLayer, e.location[0], e.location[1], env.mouseCursorViewRadius);
        }

        private endSelection(env: ToolEnvironment) {

            this.logic_Selector.endProcess();

            if (this.logic_Selector.selectionInfo.selectedLines.length == 0
                && this.logic_Selector.selectionInfo.selectedPoints.length == 0) {

                return;
            }

            this.executeCommand(env);

            env.endModalTool();
        }

        protected executeCommand(env: ToolEnvironment) { // @virtual

        }
    }

    export class Tool_Select_BrushSelect_LinePoint extends Tool_BrushSelectLinePointBase {

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            return true;
        }

        cancelModal(env: ToolEnvironment) { // @override

            for (let selPoint of this.logic_Selector.selectionInfo.selectedPoints) {

                selPoint.point.isSelected = selPoint.selectStateBefore;
            }

            this.logic_Selector.endProcess();

            env.setRedrawMainWindowEditorWindow();
        }

        protected executeCommand(env: ToolEnvironment) { // @override

            let command = new Command_Select();
            command.selectionInfo = this.logic_Selector.selectionInfo;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    export class Tool_Select_BrushSelect_Line extends Tool_Select_BrushSelect_LinePoint {

        logic_Selector: ISelector_BrushSelect = new Selector_Line_BrushSelect(); // @override
    }

    export class Tool_Select_BrushSelect_LineSegment extends Tool_Select_BrushSelect_LinePoint {

        logic_Selector: ISelector_BrushSelect = new Selector_LineSegment_BrushSelect(); // @override
    }

    export class Command_Select extends CommandBase {

        selectionInfo: VectorLayerEditorSelectionInfo = null;

        private selectedLines: List<LineSelectionInfo> = null;
        private selectedPoints: List<PointSelectionInfo> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            // Selection process has done while inputting

            this.selectedLines = ListClone(this.selectionInfo.selectedLines);
            this.selectedPoints = ListClone(this.selectionInfo.selectedPoints);

            if (this.selectedLines.length > 0) {

                let firstLine = this.selectedLines[0];
                env.setCurrentVectorLine(firstLine.line, false);
            }
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

            if (this.selectionInfo == null) {
                throw ('Com_Select: selectedLines is null!');
            }

            if (this.selectionInfo.selectedLines == null) {
                throw ('Com_Select: selectedLines is null!');
            }

            if (this.selectionInfo.selectedPoints == null) {
                throw ('Com_Select: selectedPoints is null!');
            }

            if (this.selectionInfo.selectedLines.length == 0
                && this.selectionInfo.selectedPoints.length == 0) {

                throw ('Com_Select: no points is selected!');
            }
        }
    }
}
