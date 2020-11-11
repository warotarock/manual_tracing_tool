import { CommandBase } from "../base/command";
import { ToolEnvironment } from "../base/tool";


export class Command_Palette_CommandBase extends CommandBase {

    isAvailable(env: ToolEnvironment): boolean { // @virtual

        return false;
    }

    execute(env: ToolEnvironment) { // @override

        env.setRedrawMainWindowEditorWindow();
    }

    undo(env: ToolEnvironment) { // @override

        env.setRedrawMainWindowEditorWindow();
    }

    redo(env: ToolEnvironment) { // @override

        env.setRedrawMainWindowEditorWindow();
    }
}
