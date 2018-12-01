
namespace ManualTracingTool {

    export class Tool_EditDocumentFrame extends Tool_Transform_Lattice {

        helpText = '4キーで設定ダイアログを開きます。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return true;
        }

        toolWindowItemDoubleClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.openDocumentSettingDialog();
        }

        // Preparing for operation (Override methods)

        protected checkTarget(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            return true;
        }

        protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override

            // calculate lattice points

            this.baseRectangleArea.left = env.document.documentFrame[0];
            this.baseRectangleArea.top = env.document.documentFrame[1];
            this.baseRectangleArea.right = env.document.documentFrame[2];
            this.baseRectangleArea.bottom = env.document.documentFrame[3];

            this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, 0.0, env);
            this.setLatticePointsByRectangle(this.rectangleArea);
            this.resetLatticePointLocationToBaseLocation();

            return true;
        }

        // Operation inputs

        keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @override

            if (!env.isModalToolRunning()) {

                if (e.key == 'g') {

                    this.startLatticeAffineTransform(TransformType.grabMove, false, env);
                    return true;
                }
                else if (e.key == 'r') {

                    this.startLatticeAffineTransform(TransformType.rotate, false, env);
                    return true;
                }
                else if (e.key == 's') {

                    this.startLatticeAffineTransform(TransformType.scale, false, env);
                    return true;
                }
            }

            return false;
        }

        protected executeCommand(env: ToolEnvironment) {

            let command = new Command_EditDocumentFrame();
            command.targetDocument = env.document;
            command.newDocumentFrame[0] = this.latticePoints[0].location[0];
            command.newDocumentFrame[1] = this.latticePoints[0].location[1];
            command.newDocumentFrame[2] = this.latticePoints[2].location[0];
            command.newDocumentFrame[3] = this.latticePoints[2].location[1];
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
