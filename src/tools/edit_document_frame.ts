import {
    DocumentData,
} from '../base/data';

import {
    ToolEnvironment, ToolMouseEvent,
} from '../base/tool';

import { CommandBase } from '../base/command';

import { Tool_Transform_Lattice, TransformType } from '../tools/transform_lattice';

export class Tool_EditDocumentFrame extends Tool_Transform_Lattice {

    helpText = 'エクスポート範囲を設定します。座標は整数値になります。<br />正確な座標値を確認するには4キーで設定ダイアログを開きます。';

    isAvailable(env: ToolEnvironment): boolean { // @override

        return true;
    }

    toolWindowItemDoubleClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        env.openDocumentSettingDialog();
    }

    // Preparing for operation (Override methods)

    protected checkTarget(env: ToolEnvironment): boolean { // @override

        return true;
    }

    protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override

        // calculate lattice points

        this.baseRectangleArea.left = env.document.documentFrame[0];
        this.baseRectangleArea.top = env.document.documentFrame[1];
        this.baseRectangleArea.right = env.document.documentFrame[2];
        this.baseRectangleArea.bottom = env.document.documentFrame[3];

        this.setLatticeLocation(env);

        return true;
    }

    protected setLatticeLocation(env: ToolEnvironment) { // @override

        this.latticePadding = 0.0;

        this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, this.latticePadding, env);

        this.setLatticePointsByRectangle(this.rectangleArea);
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

    protected executeCommand(env: ToolEnvironment) { // @override

        let command = new Command_EditDocumentFrame();
        command.targetDocument = env.document;
        command.newDocumentFrame[0] = Math.floor(this.latticePoints[0].location[0]);
        command.newDocumentFrame[1] = Math.floor(this.latticePoints[0].location[1]);
        command.newDocumentFrame[2] = Math.floor(this.latticePoints[2].location[0]);
        command.newDocumentFrame[3] = Math.floor(this.latticePoints[2].location[1]);

        env.commandHistory.executeCommand(command, env);
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
