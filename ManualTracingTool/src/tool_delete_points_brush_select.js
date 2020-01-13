var ManualTracingTool;
(function (ManualTracingTool) {
    class Selector_DeleteLinePoint_BrushSelect extends ManualTracingTool.Selector_LinePoint_BrushSelect {
        onPointHited(group, line, point) {
            this.selectionInfo.deletePoint(point);
        }
        afterHitTest() {
            // doesn't clear flagas when deletion
        }
    }
    ManualTracingTool.Selector_DeleteLinePoint_BrushSelect = Selector_DeleteLinePoint_BrushSelect;
    class Tool_DeletePoints_BrushSelect extends ManualTracingTool.Tool_BrushSelectLinePointBase {
        constructor() {
            super(...arguments);
            this.helpText = 'ブラシ選択で点を削除します。';
            this.isEditTool = false; // @override
            this.logic_Selector = new Selector_DeleteLinePoint_BrushSelect(); // @override
        }
        executeCommand(env) {
            let command = new ManualTracingTool.Command_DeleteFlaggedPoints();
            if (command.prepareEditTargets(env)) {
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
            }
            env.setRedrawMainWindow();
        }
    }
    ManualTracingTool.Tool_DeletePoints_BrushSelect = Tool_DeletePoints_BrushSelect;
})(ManualTracingTool || (ManualTracingTool = {}));
