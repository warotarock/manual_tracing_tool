
namespace ManualTracingTool {

    export class Tool_Transform_Lattice extends ModalToolBase {

        editLine: VectorLine = null;
        rectangleArea = new Logic_Edit_Points_RectangleArea();

        prepareModal(env: ToolEnvironment): boolean { // @override

            if (env.currentVectorLayer == null) {

                return false;
            }

            // Caluclates surrounding rectangle of all selected points
            Logic_Edit_Points.setMinMaxToRectangleArea(this.rectangleArea);

            let selectedOnly = true;

            for (let group of env.currentVectorLayer.groups) {

                for (let line of group.lines) {

                    Logic_Edit_Points.calculateSurroundingRectangle(this.rectangleArea, this.rectangleArea, line.points, selectedOnly);
                }
            }

            let available = Logic_Edit_Points.existsRectangleArea(this.rectangleArea);

            //次に対象となる点ごとに編集頂点データを作る。移動前の位置と対象の点の参照の情報。比率などのパラメータはとりあえずそのとき計算で出すことにする。

            return available;
        }

        startModal(env: ToolEnvironment) { // @override

            env.setRedrawEditorWindow();
        }

        endModal(env: ToolEnvironment) { // @override

        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!e.isLeftButtonPressing()) {
                return;
            }

            if (env.isAnyModifierKeyPressing()) {
                return;
            }

            this.editLine = new VectorLine();

            this.addPointToEditLine(e);
        }

        private addPointToEditLine(e: ToolMouseEvent) {

            let point = new LinePoint();
            vec3.copy(point.location, e.location);

            this.editLine.points.push(point);
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.editLine == null) {
                return;
            }

            this.addPointToEditLine(e);

            env.setRedrawEditorWindow();
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.editLine == null) {
                return;
            }

            if (env.currentVectorGroup == null) {

                this.editLine = null;
                env.setRedrawEditorWindow();
                return;
            }

            this.executeCommand(env);

            Logic_Edit_Line.smooth(this.editLine);

            env.setRedrawMainWindow();
            env.setRedrawEditorWindow();

            this.editLine = null;
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

            drawEnv.render.beginPath();
            drawEnv.render.moveTo(this.rectangleArea.left, this.rectangleArea.top);
            drawEnv.render.lineTo(this.rectangleArea.right, this.rectangleArea.top);
            drawEnv.render.lineTo(this.rectangleArea.right, this.rectangleArea.bottom);
            drawEnv.render.lineTo(this.rectangleArea.left, this.rectangleArea.bottom);
            drawEnv.render.lineTo(this.rectangleArea.left, this.rectangleArea.top);
            drawEnv.render.stroke();
        }

        private executeCommand(env: ToolEnvironment) {

            let command = new Command_AddLine();
            command.group = env.currentVectorGroup;
            command.line = this.editLine;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }
}
