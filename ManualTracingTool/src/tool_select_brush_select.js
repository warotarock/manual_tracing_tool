var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_BrushSelectLinePointBase extends ManualTracingTool.ModalToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '左クリックで選択を追加、Altキーを押しながらで選択を解除します。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';
            this.isEditTool = true; // @override
            this.logic_Selector = null; // @virtual
            this.viewKeyframeLayers = null;
        }
        isAvailable(env) {
            return (env.currentVectorLayer != null
                && ManualTracingTool.Layer.isEditTarget(env.currentVectorLayer));
        }
        onDrawEditor(env, drawEnv) {
            drawEnv.editorDrawer.drawMouseCursor();
        }
        mouseDown(e, env) {
            if (!this.isAvailable(env)) {
                return;
            }
            if (e.isLeftButtonPressing()) {
                this.startSelection(e, env);
                this.processSelection(e, env);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
        }
        mouseMove(e, env) {
            if (env.currentVectorLayer == null) {
                env.setRedrawEditorWindow();
                return;
            }
            if (env.isModalToolRunning()) {
                if (e.isLeftButtonPressing()) {
                    this.processSelection(e, env);
                    env.setRedrawCurrentLayer();
                }
            }
            // redraw cursor
            env.setRedrawEditorWindow();
        }
        mouseUp(e, env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            if (env.isModalToolRunning()) {
                this.endSelection(env);
                env.setRedrawCurrentLayer();
            }
            env.setRedrawEditorWindow();
        }
        startSelection(e, env) {
            if (env.isCtrlKeyPressing()) {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.toggle;
            }
            else if (env.isAltKeyPressing()) {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.setUnselected;
            }
            else {
                this.logic_Selector.editMode = ManualTracingTool.SelectionEditMode.setSelected;
            }
            this.viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.onStartSelection(e, env);
            this.logic_Selector.startProcess();
            env.startModalTool(this);
        }
        onStartSelection(e, env) {
        }
        processSelection(e, env) {
            if (this.viewKeyframeLayers == null) {
                return null;
            }
            for (let viewKeyframeLayer of this.viewKeyframeLayers) {
                this.logic_Selector.processLayer(viewKeyframeLayer.vectorLayerKeyframe.geometry, e.location, env.mouseCursorViewRadius);
            }
        }
        endSelection(env) {
            this.logic_Selector.endProcess();
            env.endModalTool();
            if (!this.existsResults()) {
                return;
            }
            this.executeCommand(env);
            this.viewKeyframeLayers = null;
        }
        existsResults() {
            return (this.logic_Selector.selectionInfo.selectedLines.length != 0
                || this.logic_Selector.selectionInfo.selectedPoints.length != 0);
        }
        executeCommand(env) {
        }
    }
    ManualTracingTool.Tool_BrushSelectLinePointBase = Tool_BrushSelectLinePointBase;
    class Tool_Select_BrushSelect_LinePoint extends Tool_BrushSelectLinePointBase {
        constructor() {
            super(...arguments);
            this.logic_Selector = new ManualTracingTool.Selector_LinePoint_BrushSelect(); // @override
        }
        toolWindowItemClick(e, env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.linePoint);
            env.setRedrawCurrentLayer();
        }
        prepareModal(e, env) {
            return true;
        }
        cancelModal(env) {
            for (let selPoint of this.logic_Selector.selectionInfo.selectedPoints) {
                selPoint.point.isSelected = selPoint.selectStateBefore;
            }
            this.logic_Selector.endProcess();
            env.setRedrawMainWindowEditorWindow();
        }
        executeCommand(env) {
            let command = new Command_Select();
            command.selectionInfo = this.logic_Selector.selectionInfo;
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        }
    }
    ManualTracingTool.Tool_Select_BrushSelect_LinePoint = Tool_Select_BrushSelect_LinePoint;
    class Tool_Select_BrushSelect_Line extends Tool_Select_BrushSelect_LinePoint {
        constructor() {
            super(...arguments);
            this.logic_Selector = new ManualTracingTool.Selector_Line_BrushSelect(); // @override
        }
        toolWindowItemClick(e, env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.line);
            env.setRedrawCurrentLayer();
        }
    }
    ManualTracingTool.Tool_Select_BrushSelect_Line = Tool_Select_BrushSelect_Line;
    class Tool_Select_BrushSelect_LineSegment extends Tool_Select_BrushSelect_LinePoint {
        constructor() {
            super(...arguments);
            this.logic_Selector = new ManualTracingTool.Selector_LineSegment_BrushSelect(); // @override
        }
        toolWindowItemClick(e, env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.lineSegment);
            env.setRedrawCurrentLayer();
        }
    }
    ManualTracingTool.Tool_Select_BrushSelect_LineSegment = Tool_Select_BrushSelect_LineSegment;
    class Command_Select extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.selectionInfo = null;
            this.selectedLines = null;
            this.selectedPoints = null;
        }
        execute(env) {
            // Selection process has done while inputting
            // so not required execute this.redo(env);
            this.selectedLines = ListClone(this.selectionInfo.selectedLines);
            this.selectedPoints = ListClone(this.selectionInfo.selectedPoints);
            if (this.selectedLines.length > 0) {
                let firstLine = this.selectedLines[0];
                env.setCurrentVectorLine(firstLine.line, false);
            }
        }
        undo(env) {
            for (let selPoint of this.selectedPoints) {
                selPoint.point.isSelected = selPoint.selectStateBefore;
            }
            for (let selLine of this.selectedLines) {
                selLine.line.isSelected = selLine.selectStateBefore;
            }
        }
        redo(env) {
            for (let selPoint of this.selectedPoints) {
                selPoint.point.isSelected = selPoint.selectStateAfter;
            }
            for (let selLine of this.selectedLines) {
                selLine.line.isSelected = selLine.selectStateAfter;
            }
        }
    }
    ManualTracingTool.Command_Select = Command_Select;
})(ManualTracingTool || (ManualTracingTool = {}));
