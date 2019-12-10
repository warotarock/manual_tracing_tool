var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_EditDocumentFrame extends ManualTracingTool.Tool_Transform_Lattice {
        constructor() {
            super(...arguments);
            this.helpText = 'エクスポート範囲を設定します。座標は整数値になります。<br />正確な座標値を確認するには4キーで設定ダイアログを開きます。';
        }
        isAvailable(env) {
            return true;
        }
        toolWindowItemDoubleClick(e, env) {
            env.openDocumentSettingDialog();
        }
        // Preparing for operation (Override methods)
        checkTarget(e, env) {
            return true;
        }
        prepareLatticePoints(env) {
            // calculate lattice points
            this.baseRectangleArea.left = env.document.documentFrame[0];
            this.baseRectangleArea.top = env.document.documentFrame[1];
            this.baseRectangleArea.right = env.document.documentFrame[2];
            this.baseRectangleArea.bottom = env.document.documentFrame[3];
            this.setLatticeLocation(env);
            return true;
        }
        setLatticeLocation(env) {
            this.latticePadding = 0.0;
            this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, this.latticePadding, env);
            this.setLatticePointsByRectangle(this.rectangleArea);
        }
        // Operation inputs
        keydown(e, env) {
            if (!env.isModalToolRunning()) {
                if (e.key == 'g') {
                    this.startLatticeAffineTransform(ManualTracingTool.TransformType.grabMove, false, env);
                    return true;
                }
                else if (e.key == 'r') {
                    this.startLatticeAffineTransform(ManualTracingTool.TransformType.rotate, false, env);
                    return true;
                }
                else if (e.key == 's') {
                    this.startLatticeAffineTransform(ManualTracingTool.TransformType.scale, false, env);
                    return true;
                }
            }
            return false;
        }
        executeCommand(env) {
            let command = new Command_EditDocumentFrame();
            command.targetDocument = env.document;
            command.newDocumentFrame[0] = Math.floor(this.latticePoints[0].location[0]);
            command.newDocumentFrame[1] = Math.floor(this.latticePoints[0].location[1]);
            command.newDocumentFrame[2] = Math.floor(this.latticePoints[2].location[0]);
            command.newDocumentFrame[3] = Math.floor(this.latticePoints[2].location[1]);
            command.execute(env);
            env.commandHistory.addCommand(command);
        }
    }
    ManualTracingTool.Tool_EditDocumentFrame = Tool_EditDocumentFrame;
    class Command_EditDocumentFrame extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetDocument = null;
            this.newDocumentFrame = vec4.create();
            this.oldDocumentFrame = vec4.create();
        }
        execute(env) {
            this.errorCheck();
            vec4.copy(this.oldDocumentFrame, this.targetDocument.documentFrame);
            this.redo(env);
        }
        undo(env) {
            vec4.copy(this.targetDocument.documentFrame, this.oldDocumentFrame);
        }
        redo(env) {
            vec4.copy(this.targetDocument.documentFrame, this.newDocumentFrame);
        }
        errorCheck() {
            if (this.targetDocument == null) {
                throw ('Command_EditDocumentFrame: targetDocument is null!');
            }
        }
    }
})(ManualTracingTool || (ManualTracingTool = {}));
