var ManualTracingTool;
(function (ManualTracingTool) {
    class Command_Palette_CommandBase extends ManualTracingTool.CommandBase {
        isAvailable(env) {
            return false;
        }
        execute(env) {
            this.executeCommand(env);
            env.setRedrawMainWindowEditorWindow();
        }
        undo(env) {
            env.setRedrawMainWindowEditorWindow();
        }
        redo(env) {
            env.setRedrawMainWindowEditorWindow();
        }
    }
    ManualTracingTool.Command_Palette_CommandBase = Command_Palette_CommandBase;
})(ManualTracingTool || (ManualTracingTool = {}));
