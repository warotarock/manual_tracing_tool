
namespace ManualTracingTool {

    class Tool_Transform_Lattice_EditPoint {

        targetPoint: LinePoint = null;
        targetLine: VectorLine = null;

        relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
    }

    export enum LatticeStateID {

        invalid = 0,
        defaultRentangle = 1,
        modified = 2,
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

        latticeState = LatticeStateID.invalid;
        baseRectangleArea = new Logic_Edit_Points_RectangleArea();
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

            Logic_Edit_Points.setMinMaxToRectangleArea(this.baseRectangleArea);

            let selectedOnly = true;

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                if (!viewKeyframeLayer.layer.isSelected || !viewKeyframeLayer.layer.isVisible) {
                    continue;
                }

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        Logic_Edit_Points.calculateSurroundingRectangle(this.baseRectangleArea, this.baseRectangleArea, line.points, selectedOnly);
                    }
                }
            }

            let available = Logic_Edit_Points.existsRectangleArea(this.baseRectangleArea);

            if (available) {

                this.latticeState = LatticeStateID.defaultRentangle;
                this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, env);
                this.setLatticePointsByRectangle(this.rectangleArea);
            }
            else {

                this.latticeState = LatticeStateID.invalid;
            }

            return available;
        }

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
            else {

                if (e.key == 'Enter') {

                    this.endTransform(env);
                    return true;
                }
                else if (e.key == 'Escape') {

                    this.cancelTransform(env);
                    return true;
                }
                else if (e.key == 'g') {

                    this.startLatticeAffineTransform(TransformType.grabMove, true, env);
                    return true;
                }
                else if (e.key == 'r') {

                    this.startLatticeAffineTransform(TransformType.rotate, true, env);
                    return true;
                }
                else if (e.key == 's') {

                    this.startLatticeAffineTransform(TransformType.scale, true, env);
                    return true;
                }
            }

            return false;
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!env.isModalToolRunning()) {

                this.startLatticeTransform(env);
            }
            else {

                if (e.isRightButtonPressing()) {

                    this.cancelTransform(env);
                }
            }
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!env.isModalToolRunning()) {

            }
            else {

                if (e.isLeftButtonReleased()) {

                    if (this.latticeState == LatticeStateID.modified) {

                        this.endTransform(env);
                    }
                }
            }
        }

        protected clearEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            this.editPoints = null;
        }

        protected checkTarget(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            return (this.transformType != TransformType.none);
        }

        protected startLatticeAffineTransform(transformType: TransformType, isContinueEdit: boolean, env: ToolEnvironment) {

            for (let latticePoint of this.latticePoints) {

                latticePoint.latticePointEditType = LatticePointEditTypeID.allDirection;
            }

            if (transformType == TransformType.grabMove) {

                this.transformType = TransformType.grabMove;
                this.transformCalculator = this.grabMove_Calculator;
            }
            else if (transformType == TransformType.rotate) {

                this.transformType = TransformType.rotate;
                this.transformCalculator = this.rotate_Calculator;
            }
            else if (transformType == TransformType.scale) {

                this.transformType = TransformType.scale;
                this.transformCalculator = this.scale_Calculator;
            }

            this.transformCalculator.prepare(env);

            vec3.copy(this.mouseAnchorLocation, env.mouseCursorLocation);

            if (isContinueEdit) {

                this.applytLatticePointBaseLocation();
            }
            else {

                env.startModalTool(this);
            }
        }

        protected startLatticeTransform(env: ToolEnvironment) {

            for (let latticePoint of this.latticePoints) {

                latticePoint.latticePointEditType = LatticePointEditTypeID.none;
            }

            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {

                let pointIndexH = -1;
                let pointIndexV = -1;
                if (this.mouseOver_PartIndex == 0) {

                    pointIndexH = 3;
                    pointIndexV = 1;
                }
                else if (this.mouseOver_PartIndex == 1) {

                    pointIndexH = 2;
                    pointIndexV = 0;
                }
                else if (this.mouseOver_PartIndex == 2) {

                    pointIndexH = 1;
                    pointIndexV = 3;
                }
                else if (this.mouseOver_PartIndex == 3) {

                    pointIndexH = 0;
                    pointIndexV = 2;
                }

                this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = LatticePointEditTypeID.allDirection;
                this.latticePoints[pointIndexH].latticePointEditType = LatticePointEditTypeID.horizontalOnly;
                this.latticePoints[pointIndexV].latticePointEditType = LatticePointEditTypeID.verticalOnly;

                this.transformType = TransformType.grabMove;
                this.transformCalculator = this.grabMove_Calculator;
                this.latticeState = LatticeStateID.defaultRentangle;

                env.startModalTool(this);
            }

            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {

                let latticePointEditType: LatticePointEditTypeID;
                if (this.mouseOver_PartIndex == 0 || this.mouseOver_PartIndex == 2) {

                    latticePointEditType = LatticePointEditTypeID.verticalOnly;
                }
                else {

                    latticePointEditType = LatticePointEditTypeID.horizontalOnly;
                }

                this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = latticePointEditType;
                this.latticePoints[this.mouseOver_PartIndexTo].latticePointEditType = latticePointEditType;

                this.transformType = TransformType.grabMove;
                this.transformCalculator = this.grabMove_Calculator;
                this.latticeState = LatticeStateID.defaultRentangle;

                env.startModalTool(this);
            }
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

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            this.clearEditData(e, env);

            if (!this.checkTarget(e, env)) {

                return false;
            }

            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);

            // Create edit info
            this.prepareEditData(e, env);

            return true;
        }

        protected prepareEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

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

            this.latticeState = LatticeStateID.modified;
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

            if (this.latticeState != LatticeStateID.invalid) {

                if (this.latticeState == LatticeStateID.defaultRentangle) {

                    this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, env);
                    this.setLatticePointsByRectangle(this.rectangleArea);
                }

                //drawEnv.editorDrawer.drawMouseCursor();
                this.drawLatticeRectangle(env, drawEnv);
                this.drawLatticePoints(env, drawEnv);
            }
        }
    }
}
