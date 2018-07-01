
namespace ManualTracingTool {

    export class Tool_EditImageFileReference extends ToolBase {

        private executeCommand(env: ToolEnvironment) {

            let command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = resampledLine;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    export class Command_LoadReferenceImageToLayer extends CommandBase {

        targetLayer: ImageFileReferenceLayer = null;
        oldFilePath: string = null;
        newFilePath: string = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.oldFilePath = this.targetLayer.imageFilePath;





        }

        undo(env: ToolEnvironment) { // @override

            this.targetLayer.imageFilePath = this.oldFilePath;




        }

        redo(env: ToolEnvironment) { // @override

            this.execute(env);
        }

        errorCheck() {

            if (this.targetLayer == null) {
                throw ('Command_LoadReferenceImageToLayer: layer is null!');
            }
        }
    }
}
