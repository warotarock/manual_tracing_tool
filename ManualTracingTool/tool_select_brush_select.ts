
namespace ManualTracingTool {

    export class Tool_BrushSelectLinePointBase extends ModalToolBase {

        helpText = '左クリックで選択を追加、Altキーを押しながらで選択を解除します。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';
        isEditTool = true; // @override

        logic_Selector: ISelector_BrushSelect = null; // @virtual

        editableKeyframeLayers: List<ViewKeyframeLayer> = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible
            );
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            drawEnv.editorDrawer.drawMouseCursor();
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!this.isAvailable(env)) {
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

            this.editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            this.onStartSelection(e, env);

            this.logic_Selector.startProcess();

            env.startModalTool(this);
        }

        protected onStartSelection(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

        }

        private processSelection(e: ToolMouseEvent, env: ToolEnvironment) {

            if (this.editableKeyframeLayers == null) {

                return null;
            }

            for (let viewKeyframeLayer of this.editableKeyframeLayers) {

                this.logic_Selector.processLayer(viewKeyframeLayer.vectorLayerKeyframe.geometry, e.location, env.mouseCursorViewRadius);
            }
        }

        private endSelection(env: ToolEnvironment) {

            this.logic_Selector.endProcess();

            env.endModalTool();

            if (!this.existsResults()) {

                return;
            }

            this.executeCommand(env);

            this.editableKeyframeLayers = null;
        }

        protected existsResults(): boolean { // @virtual

            return (this.logic_Selector.selectionInfo.selectedLines.length != 0
                || this.logic_Selector.selectionInfo.selectedPoints.length != 0);
        }

        protected executeCommand(env: ToolEnvironment) { // @virtual

        }
    }

    export class Tool_Select_BrushSelect_LinePoint extends Tool_BrushSelectLinePointBase {

        logic_Selector: ISelector_BrushSelect = new Selector_LinePoint_BrushSelect(); // @override

        toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.setCurrentOperationUnitID(OperationUnitID.linePoint);
            env.setRedrawMainWindow();
        }

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

        toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.setCurrentOperationUnitID(OperationUnitID.line);
            env.setRedrawMainWindow();
        }
    }

    export class Tool_Select_BrushSelect_LineSegment extends Tool_Select_BrushSelect_LinePoint {

        logic_Selector: ISelector_BrushSelect = new Selector_LineSegment_BrushSelect(); // @override

        toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.setCurrentOperationUnitID(OperationUnitID.lineSegment);
            env.setRedrawMainWindow();
        }
    }

    export class Command_Select extends CommandBase {

        selectionInfo: VectorLayerEditorSelectionInfo = null;

        private selectedLines: List<LineSelectionInfo> = null;
        private selectedPoints: List<PointSelectionInfo> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            // Selection process has done while inputting
            // so not required execute this.redo(env);

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
