
namespace ManualTracingTool {

    export class Tool_EditDocumentFrame extends Tool_Transform_Lattice {

        helpText = '2キーで設定ダイアログを開きます。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return true;
        }

        protected checkTarget(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            return true;
        }

        protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override

            // calculate lattice points

            vec3.set(this.latticePoints[0].baseLocation, env.document.documentFrame[0], env.document.documentFrame[1], 0.0);
            vec3.set(this.latticePoints[1].baseLocation, env.document.documentFrame[2], env.document.documentFrame[1], 0.0);
            vec3.set(this.latticePoints[2].baseLocation, env.document.documentFrame[2], env.document.documentFrame[2], 0.0);
            vec3.set(this.latticePoints[3].baseLocation, env.document.documentFrame[0], env.document.documentFrame[2], 0.0);

            this.resetLatticePointLocationToBaseLocation();

            return true;
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            // prevent modal operation
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            // prevent modal operation
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            if (this.latticePoints == null) {

                this.createLatticePoints(this.latticePointCount);
            }

            this.prepareLatticePoints(env);

            this.drawLatticeLine(env, drawEnv);
        }

        protected executeCommand(env: ToolEnvironment) {

            let command = new Command_EditDocumentFrame();
            command.targetDocument = env.document;
            command.newDocumentFrame[0] = this.latticePoints[0].baseLocation[0];
            command.newDocumentFrame[1] = this.latticePoints[0].baseLocation[1];
            command.newDocumentFrame[2] = this.latticePoints[2].baseLocation[0];
            command.newDocumentFrame[3] = this.latticePoints[2].baseLocation[1];
            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    class Command_EditDocumentFrame extends CommandBase {

        targetDocument: DocumentData = null;

        newDocumentFrame = vec4.create();

        oldDocumentFrame = vec4.create();

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            vec4.copy(this.oldDocumentFrame, this.targetDocument.documentFrame);

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            vec4.copy(this.targetDocument.documentFrame, this.oldDocumentFrame);
        }

        redo(env: ToolEnvironment) { // @override

            vec4.copy(this.targetDocument.documentFrame, this.newDocumentFrame);
        }

        errorCheck() {

            if (this.targetDocument == null) {

                throw ('Command_EditDocumentFrame: targetDocument is null!');
            }
        }
    }
}
