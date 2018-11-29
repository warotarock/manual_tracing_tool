
namespace ManualTracingTool {

    class Tool_Transform_Lattice_EditPoint {

        targetPoint: LinePoint = null;
        targetLine: VectorLine = null;

        relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
    }

    enum TransformType {

        none = 0,
        grabMove = 1,
        rotate = 2,
        scale = 3
    }

    export class Tool_EditModeMain extends Tool_Transform_Lattice {

        // エディットモードメインツールクラス……最初にラティス矩形を計算し、変形ツールでもある。選択ツールをモーダル起動する、矩形は渡す。
        // 選択中の点の矩形を表示する
        // 　staticな関数を変形ツール、選択ツールから読んで描画
        // 　矩形に加えて角に丸を表示する
        // 変形ツールは移動回転拡縮を連続してコマンドにするため、一つのツールに統合する。
        // 　g、r、sキーでモーダル状態を開始する。中心はピボットで開始、４点全てが対象
        // 　矩形の辺をクリックすると、辺の点を対象にして上下か左右どちらか固定方向でモーダルを開始する
        // 　　モーダル中にg→固定方向を解除してフリー移動にする
        // 　　モーダル中にr、s→ピボット中心の４点回転、スケーリングにする
        // 　矩形の角の点は反対側の点を中心とした３点をスケーリングする
        // 　矩形の角の点で開始してモーダル中に
        // 　　g→角の点以外の点の除外してグラブムーブする
        // 　　x,y→１点除外して上下か左右だけのスケーリングにする
        // 　　r→反対側の点を中心とした４点の回転にする
        // 　なのでモーダル開始時に、辺をクリックしたときはピボットを中心にし、角の点のときは反対側の点を中心にして開始する

        rectangleArea = new Logic_Edit_Points_RectangleArea();

        transformType = TransformType.none;
        transformCalculator: ITool_Transform_Lattice_Calculator = null;
        grabMove_Calculator = new GrabMove_Calculator();
        rotate_Calculator = new Rotate_Calculator();
        scale_Calculator = new Scale_Calculator();

        lerpLocation1 = vec3.create();
        lerpLocation2 = vec3.create();
        lerpLocation3 = vec3.create();

        editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

        constructor() {
            super();

            this.createLatticePoints();
        }

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible
            );
        }

        onActivated(env: ToolEnvironment) { // @override

            this.prepareLatticePoints(env);
        }

        protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override

            let rect = this.rectangleArea;

            Logic_Edit_Points.setMinMaxToRectangleArea(rect);

            let selectedOnly = true;

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                if (!viewKeyframeLayer.layer.isSelected || !viewKeyframeLayer.layer.isVisible) {
                    continue;
                }

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        Logic_Edit_Points.calculateSurroundingRectangle(rect, rect, line.points, selectedOnly);
                    }
                }
            }

            let available = Logic_Edit_Points.existsRectangleArea(rect);

            this.setLatticePointsByRectangle(rect);

            return available;
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            if (!env.isModalToolRunning()) {

                if (e.key == 'g') {

                    this.transformType = TransformType.grabMove;
                    this.transformCalculator = this.grabMove_Calculator;
                    env.startModalTool(this);
                }
                else if (e.key == 'r') {

                    this.transformType = TransformType.rotate;
                    this.transformCalculator = this.rotate_Calculator;
                    env.startModalTool(this);
                }
                else if (e.key == 's') {

                    this.transformType = TransformType.scale;
                    this.transformCalculator = this.scale_Calculator;
                    env.startModalTool(this);
                }
            }
            else {

                if (e.key == 'Enter') {

                    this.endTransform(env);
                }
                else if (e.key == 'Escape') {

                    this.cancelTransform(env);
                }
                else if (e.key == 'g') {

                    this.transformType = TransformType.grabMove;
                    this.transformCalculator = this.grabMove_Calculator;
                    vec3.copy(this.mouseAnchorLocation, env.mouseCursorLocation);
                    this.applytLatticePointBaseLocation();
                }
                else if (e.key == 'r') {

                    this.transformType = TransformType.rotate;
                    this.transformCalculator = this.rotate_Calculator;
                    this.applytLatticePointBaseLocation();
                }
                else if (e.key == 's') {

                    this.transformType = TransformType.scale;
                    this.transformCalculator = this.scale_Calculator;
                    this.applytLatticePointBaseLocation();
                }
            }
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.isModalToolRunning()) {

                if (e.isLeftButtonPressing()) {

                    this.endTransform(env);
                }
                else if (e.isRightButtonPressing()) {

                    this.cancelTransform(env);
                }
            }
        }

        protected clearEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            this.editPoints = null;
        }

        protected endTransform(env: ToolEnvironment) {

            this.processTransform(env);

            this.executeCommand(env);

            this.transformType = TransformType.none;
            this.transformCalculator = null;

            env.endModalTool();
        }

        protected cancelTransform(env: ToolEnvironment) {

            this.transformType = TransformType.none;
            this.transformCalculator = null;

            env.cancelModalTool();
        }

        protected createEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            let editPoints = new List<Tool_Transform_Lattice_EditPoint>();

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                if (!viewKeyframeLayer.layer.isSelected || !viewKeyframeLayer.layer.isVisible) {
                    continue;
                }

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        for (let point of line.points) {

                            if (!point.isSelected) {

                                continue;
                            }

                            let editPoint = new Tool_Transform_Lattice_EditPoint();
                            editPoint.targetPoint = point;
                            editPoint.targetLine = line;

                            vec3.copy(editPoint.oldLocation, point.location);
                            vec3.copy(editPoint.newLocation, point.location);

                            let xPosition = this.rectangleArea.getHorizontalPositionInRate(point.location[0]);
                            let yPosition = this.rectangleArea.getVerticalPositionInRate(point.location[1]);
                            vec3.set(editPoint.relativeLocation, xPosition, yPosition, 0.0);

                            editPoints.push(editPoint);
                        }
                    }
                }
            }

            this.editPoints = editPoints;
        }

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            this.transformCalculator.processLatticePointMouseMove(this.latticePoints, this.mouseAnchorLocation, e, env);
        }

        protected processTransform(env: ToolEnvironment) { // @override

            if (this.editPoints == null) {
                return;
            }

            let editPoints = this.editPoints;

            let latticePoints = this.latticePoints;

            //            lerpLocation1
            // (0)-------+-------(1)
            //  |        |        |
            //  |        |        |
            //  |        * result |
            //  |        |        |
            //  |        |        |
            // (3)-------+-------(2)
            //            lerpLocation2

            let latticePointLocationH1A = latticePoints[0].location;
            let latticePointLocationH1B = latticePoints[1].location;
            let latticePointLocationH2A = latticePoints[3].location;
            let latticePointLocationH2B = latticePoints[2].location;

            for (let editPoint of editPoints) {

                vec3.lerp(this.lerpLocation1, latticePointLocationH1A, latticePointLocationH1B, editPoint.relativeLocation[0]);
                vec3.lerp(this.lerpLocation2, latticePointLocationH2A, latticePointLocationH2B, editPoint.relativeLocation[0]);

                vec3.lerp(editPoint.targetPoint.adjustingLocation, this.lerpLocation1, this.lerpLocation2, editPoint.relativeLocation[1]);
            }
        }

        protected executeCommand(env: ToolEnvironment) { // @override

            let targetLines = new List<VectorLine>();

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.newLocation, editPoint.targetPoint.adjustingLocation);
            }

            // Get target line
            for (let editPoint of this.editPoints) {

                if (editPoint.targetLine.modifyFlag == VectorLineModifyFlagID.none) {

                    targetLines.push(editPoint.targetLine);
                    editPoint.targetLine.modifyFlag = VectorLineModifyFlagID.transform;
                }
            }

            Logic_Edit_Line.resetModifyStatus(targetLines);

            // Execute the command
            let command = new Command_TransformLattice_LinePoint();
            command.editPoints = this.editPoints;
            command.targetLines = targetLines;

            command.execute(env);

            env.commandHistory.addCommand(command);

            this.editPoints = null;
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            //drawEnv.editorDrawer.drawMouseCursor();
            this.drawLatticeRectangle(env, drawEnv);
            this.drawLatticePoints(env, drawEnv);
        }
    }
}
