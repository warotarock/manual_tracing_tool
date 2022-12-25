import { CommandBase } from "../command"
import { SubToolContext } from "../context"

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
