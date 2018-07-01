
namespace ManualTracingTool {

    export class Tool_EditImageFileReference extends ToolBase {

        helpText = 'Oキーで画像ファイルを開きます。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentImageFileReferenceLayer != null
            );
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            if (e.key == 'o') {

                env.openFileDialog();

                //this.executeCommand(env);
            }
        }

        onOpenFile(filePath: string, env: ToolEnvironment) { // @override
        }

        private executeCommand(env: ToolEnvironment) {


            let command = new Command_LoadReferenceImageToLayer();
            command.targetLayer = env.currentImageFileReferenceLayer;

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
