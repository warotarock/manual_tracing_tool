import { CommandBase } from "../command/command"
import { SubToolContext } from "../context/subtool_context"

export class Command_Palette_CommandBase extends CommandBase {

    isAvailable(_ctx: SubToolContext): boolean { // @virtual

        return false
    }

    execute(ctx: SubToolContext) { // @override

        ctx.setRedrawMainWindowEditorWindow()
    }

    undo(ctx: SubToolContext) { // @override

        ctx.setRedrawMainWindowEditorWindow()
    }

    redo(ctx: SubToolContext) { // @override

        ctx.setRedrawMainWindowEditorWindow()
    }
}
