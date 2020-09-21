import { CommandBase } from "../base/command";
import { ToolEnvironment } from "../base/tool";


export class Command_Palette_CommandBase extends CommandBase {

    isAvailable(env: ToolEnvironment): boolean { // @virtual

        return false;
    }

    protected execute(env: ToolEnvironment) { // @override

        this.executeCommand(env);

        env.setRedrawMainWindowEditorWindow();
    }

    undo(env: ToolEnvironment) { // @override

        env.setRedrawMainWindowEditorWindow();
    }

    redo(env: ToolEnvironment) { // @override

        env.setRedrawMainWindowEditorWindow();
    }
}
