var ManualTracingTool;
(function (ManualTracingTool) {
    class Selector_HideLinePoint_BrushSelect extends ManualTracingTool.Selector_LinePoint_BrushSelect {
        constructor() {
            super(...arguments);
            this.lineWidth = 0.0;
        }
        onPointHited(group, line, point) {
            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                point.adjustingLineWidth = this.lineWidth;
                this.selectionInfo.editPoint(point);
            }
        }
        afterHitTest() {
            this.selectionInfo.resetModifyStates();
        }
    }
    ManualTracingTool.Selector_HideLinePoint_BrushSelect = Selector_HideLinePoint_BrushSelect;
    class Tool_HideLinePoint_BrushSelect extends ManualTracingTool.Tool_BrushSelectLinePointBase {
        constructor() {
            super(...arguments);
            this.helpText = '線の太さに最大の太さに設定します。<br />Shiftキーで最小の太さに設定します。Ctrlキーで線をの太さを０にします。';
            this.isEditTool = false; // @override
            this.logic_Selector = new Selector_HideLinePoint_BrushSelect(); // @override
        }
        onStartSelection(e, env) {
            let logic_Selector = this.logic_Selector;
            if (env.isShiftKeyPressing()) {
                logic_Selector.lineWidth = env.drawLineMinWidth;
            }
            else if (env.isCtrlKeyPressing()) {
                logic_Selector.lineWidth = 0.0;
            }
            else {
                logic_Selector.lineWidth = env.drawLineBaseWidth;
            }
        }
        executeCommand(env) {
            let command = new Command_EditLinePointLineWidth();
            if (command.prepareEditTargets(this.logic_Selector.selectionInfo)) {
                command.execute(env);
                env.commandHistory.addCommand(command);
            }
            env.setRedrawMainWindow();
        }
        cancelModal(env) {
            for (let selPoint of this.logic_Selector.selectionInfo.selectedPoints) {
                selPoint.point.adjustingLineWidth = selPoint.point.lineWidth;
            }
            // TODO: グループに変更フラグを設定する
            this.logic_Selector.endProcess();
            env.setRedrawMainWindowEditorWindow();
        }
    }
    ManualTracingTool.Tool_HideLinePoint_BrushSelect = Tool_HideLinePoint_BrushSelect;
    class Tool_EditLineWidth_EditPoint {
        constructor() {
            this.targetPoint = null;
            this.newLineWidth = 0.0;
            this.oldLineWidth = 0.0;
        }
    }
    class Command_EditLinePointLineWidth extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.editPoints = new List();
        }
        prepareEditTargets(selectionInfo) {
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
        execute(env) {
            this.errorCheck();
            this.redo(env);
        }
        undo(env) {
            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.targetPoint;
                targetPoint.lineWidth = editPoint.oldLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
        }
        redo(env) {
            for (let editPoint of this.editPoints) {
                let targetPoint = editPoint.targetPoint;
                targetPoint.lineWidth = editPoint.newLineWidth;
                targetPoint.adjustingLineWidth = targetPoint.lineWidth;
            }
        }
        errorCheck() {
        }
    }
    ManualTracingTool.Command_EditLinePointLineWidth = Command_EditLinePointLineWidth;
})(ManualTracingTool || (ManualTracingTool = {}));
