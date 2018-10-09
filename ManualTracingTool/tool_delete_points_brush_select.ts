
namespace ManualTracingTool {

    export class Selector_DeleteLinePoint_BrushSelect extends Selector_LinePoint_BrushSelect {

        protected onPointHited(group: VectorGroup, line: VectorLine, point: LinePoint) { // @override

            this.selectionInfo.deletePoint(point);
        }

        protected afterHitTest() { // @override

            // doesn't clear flagas
        }
    }

    export class Tool_DeletePoints_BrushSelect extends Tool_BrushSelectLinePointBase {

        helpText = 'ブラシ選択で点を削除します。';

        logic_Selector: ISelector_BrushSelect = new Selector_DeleteLinePoint_BrushSelect(); // @override

        protected executeCommand(env: ToolEnvironment) { // @override

            let command = new Command_DeleteFlagedPoints();
            if (command.prepareEditTargets(env.currentVectorLayer, env.currentVectorGeometry)) {

                command.execute(env);
                env.commandHistory.addCommand(command);
            }

            env.setRedrawMainWindow();
        }
    }
}
