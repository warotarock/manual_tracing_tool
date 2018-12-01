var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var Tool_Transform_Lattice_EditPoint = /** @class */ (function () {
        function Tool_Transform_Lattice_EditPoint() {
            this.targetPoint = null;
            this.targetLine = null;
            this.relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
        }
        return Tool_Transform_Lattice_EditPoint;
    }());
    var LatticeStateID;
    (function (LatticeStateID) {
        LatticeStateID[LatticeStateID["invalid"] = 0] = "invalid";
        LatticeStateID[LatticeStateID["defaultRentangle"] = 1] = "defaultRentangle";
        LatticeStateID[LatticeStateID["modified"] = 2] = "modified";
    })(LatticeStateID = ManualTracingTool.LatticeStateID || (ManualTracingTool.LatticeStateID = {}));
    var TransformType;
    (function (TransformType) {
        TransformType[TransformType["none"] = 0] = "none";
        TransformType[TransformType["grabMove"] = 1] = "grabMove";
        TransformType[TransformType["rotate"] = 2] = "rotate";
        TransformType[TransformType["scale"] = 3] = "scale";
    })(TransformType || (TransformType = {}));
    var Tool_EditModeMain = /** @class */ (function (_super) {
        __extends(Tool_EditModeMain, _super);
        function Tool_EditModeMain() {
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
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.latticeState = LatticeStateID.invalid;
            _this.baseRectangleArea = new ManualTracingTool.Logic_Edit_Points_RectangleArea();
            _this.rectangleArea = new ManualTracingTool.Logic_Edit_Points_RectangleArea();
            _this.transformType = TransformType.none;
            _this.transformCalculator = null;
            _this.grabMove_Calculator = new ManualTracingTool.GrabMove_Calculator();
            _this.rotate_Calculator = new ManualTracingTool.Rotate_Calculator();
            _this.scale_Calculator = new ManualTracingTool.Scale_Calculator();
            _this.lerpLocation1 = vec3.create();
            _this.lerpLocation2 = vec3.create();
            _this.lerpLocation3 = vec3.create();
            _this.editPoints = null;
            return _this;
        }
        Tool_EditModeMain.prototype.isAvailable = function (env) {
            return (env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible);
        };
        Tool_EditModeMain.prototype.onActivated = function (env) {
            this.prepareLatticePoints(env);
        };
        Tool_EditModeMain.prototype.prepareLatticePoints = function (env) {
            ManualTracingTool.Logic_Edit_Points.setMinMaxToRectangleArea(this.baseRectangleArea);
            var selectedOnly = true;
            var editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (var _i = 0, editableKeyframeLayers_1 = editableKeyframeLayers; _i < editableKeyframeLayers_1.length; _i++) {
                var viewKeyframeLayer = editableKeyframeLayers_1[_i];
                if (!viewKeyframeLayer.layer.isSelected || !viewKeyframeLayer.layer.isVisible) {
                    continue;
                }
                for (var _a = 0, _b = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _a < _b.length; _a++) {
                    var group = _b[_a];
                    for (var _c = 0, _d = group.lines; _c < _d.length; _c++) {
                        var line = _d[_c];
                        ManualTracingTool.Logic_Edit_Points.calculateSurroundingRectangle(this.baseRectangleArea, this.baseRectangleArea, line.points, selectedOnly);
                    }
                }
            }
            var available = ManualTracingTool.Logic_Edit_Points.existsRectangleArea(this.baseRectangleArea);
            if (available) {
                this.latticeState = LatticeStateID.defaultRentangle;
                this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, env);
                this.setLatticePointsByRectangle(this.rectangleArea);
            }
            else {
                this.latticeState = LatticeStateID.invalid;
            }
            return available;
        };
        Tool_EditModeMain.prototype.keydown = function (e, env) {
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
        };
        Tool_EditModeMain.prototype.mouseDown = function (e, env) {
            if (!env.isModalToolRunning()) {
                this.startLatticeTransform(env);
            }
            else {
                if (e.isRightButtonPressing()) {
                    this.cancelTransform(env);
                }
            }
        };
        Tool_EditModeMain.prototype.mouseUp = function (e, env) {
            if (!env.isModalToolRunning()) {
            }
            else {
                if (e.isLeftButtonReleased()) {
                    if (this.latticeState == LatticeStateID.modified) {
                        this.endTransform(env);
                    }
                }
            }
        };
        Tool_EditModeMain.prototype.clearEditData = function (e, env) {
            this.editPoints = null;
        };
        Tool_EditModeMain.prototype.checkTarget = function (e, env) {
            return (this.transformType != TransformType.none);
        };
        Tool_EditModeMain.prototype.startLatticeAffineTransform = function (transformType, isContinueEdit, env) {
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                latticePoint.latticePointEditType = ManualTracingTool.LatticePointEditTypeID.allDirection;
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
        };
        Tool_EditModeMain.prototype.startLatticeTransform = function (env) {
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                latticePoint.latticePointEditType = ManualTracingTool.LatticePointEditTypeID.none;
            }
            if (this.mouseOver_SelectedLatticePart == ManualTracingTool.SelectedLatticePartID.latticePoint) {
                var pointIndexH = -1;
                var pointIndexV = -1;
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
                this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = ManualTracingTool.LatticePointEditTypeID.allDirection;
                this.latticePoints[pointIndexH].latticePointEditType = ManualTracingTool.LatticePointEditTypeID.horizontalOnly;
                this.latticePoints[pointIndexV].latticePointEditType = ManualTracingTool.LatticePointEditTypeID.verticalOnly;
                this.transformType = TransformType.grabMove;
                this.transformCalculator = this.grabMove_Calculator;
                this.latticeState = LatticeStateID.defaultRentangle;
                env.startModalTool(this);
            }
            if (this.mouseOver_SelectedLatticePart == ManualTracingTool.SelectedLatticePartID.latticeEdge) {
                var latticePointEditType = void 0;
                if (this.mouseOver_PartIndex == 0 || this.mouseOver_PartIndex == 2) {
                    latticePointEditType = ManualTracingTool.LatticePointEditTypeID.verticalOnly;
                }
                else {
                    latticePointEditType = ManualTracingTool.LatticePointEditTypeID.horizontalOnly;
                }
                this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = latticePointEditType;
                this.latticePoints[this.mouseOver_PartIndexTo].latticePointEditType = latticePointEditType;
                this.transformType = TransformType.grabMove;
                this.transformCalculator = this.grabMove_Calculator;
                this.latticeState = LatticeStateID.defaultRentangle;
                env.startModalTool(this);
            }
        };
        Tool_EditModeMain.prototype.endTransform = function (env) {
            this.processTransform(env);
            this.executeCommand(env);
            this.transformType = TransformType.none;
            this.transformCalculator = null;
            env.endModalTool();
        };
        Tool_EditModeMain.prototype.cancelTransform = function (env) {
            this.transformType = TransformType.none;
            this.transformCalculator = null;
            env.cancelModalTool();
        };
        Tool_EditModeMain.prototype.prepareModal = function (e, env) {
            this.clearEditData(e, env);
            if (!this.checkTarget(e, env)) {
                return false;
            }
            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);
            // Create edit info
            this.prepareEditData(e, env);
            return true;
        };
        Tool_EditModeMain.prototype.prepareEditData = function (e, env) {
            var editPoints = new List();
            var editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (var _i = 0, editableKeyframeLayers_2 = editableKeyframeLayers; _i < editableKeyframeLayers_2.length; _i++) {
                var viewKeyframeLayer = editableKeyframeLayers_2[_i];
                if (!viewKeyframeLayer.layer.isSelected || !viewKeyframeLayer.layer.isVisible) {
                    continue;
                }
                for (var _a = 0, _b = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _a < _b.length; _a++) {
                    var group = _b[_a];
                    for (var _c = 0, _d = group.lines; _c < _d.length; _c++) {
                        var line = _d[_c];
                        for (var _e = 0, _f = line.points; _e < _f.length; _e++) {
                            var point = _f[_e];
                            if (!point.isSelected) {
                                continue;
                            }
                            var editPoint = new Tool_Transform_Lattice_EditPoint();
                            editPoint.targetPoint = point;
                            editPoint.targetLine = line;
                            vec3.copy(editPoint.oldLocation, point.location);
                            vec3.copy(editPoint.newLocation, point.location);
                            var xPosition = this.rectangleArea.getHorizontalPositionInRate(point.location[0]);
                            var yPosition = this.rectangleArea.getVerticalPositionInRate(point.location[1]);
                            vec3.set(editPoint.relativeLocation, xPosition, yPosition, 0.0);
                            editPoints.push(editPoint);
                        }
                    }
                }
            }
            this.editPoints = editPoints;
        };
        Tool_EditModeMain.prototype.processLatticePointMouseMove = function (e, env) {
            this.transformCalculator.processLatticePointMouseMove(this.latticePoints, this.mouseAnchorLocation, e, env);
            this.latticeState = LatticeStateID.modified;
        };
        Tool_EditModeMain.prototype.processTransform = function (env) {
            if (this.editPoints == null) {
                return;
            }
            var editPoints = this.editPoints;
            var latticePoints = this.latticePoints;
            //            lerpLocation1
            // (0)-------+-------(1)
            //  |        |        |
            //  |        |        |
            //  |        * result |
            //  |        |        |
            //  |        |        |
            // (3)-------+-------(2)
            //            lerpLocation2
            var latticePointLocationH1A = latticePoints[0].location;
            var latticePointLocationH1B = latticePoints[1].location;
            var latticePointLocationH2A = latticePoints[3].location;
            var latticePointLocationH2B = latticePoints[2].location;
            for (var _i = 0, editPoints_1 = editPoints; _i < editPoints_1.length; _i++) {
                var editPoint = editPoints_1[_i];
                vec3.lerp(this.lerpLocation1, latticePointLocationH1A, latticePointLocationH1B, editPoint.relativeLocation[0]);
                vec3.lerp(this.lerpLocation2, latticePointLocationH2A, latticePointLocationH2B, editPoint.relativeLocation[0]);
                vec3.lerp(editPoint.targetPoint.adjustingLocation, this.lerpLocation1, this.lerpLocation2, editPoint.relativeLocation[1]);
            }
        };
        Tool_EditModeMain.prototype.executeCommand = function (env) {
            var targetLines = new List();
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.newLocation, editPoint.targetPoint.adjustingLocation);
            }
            // Get target line
            for (var _b = 0, _c = this.editPoints; _b < _c.length; _b++) {
                var editPoint = _c[_b];
                if (editPoint.targetLine.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.none) {
                    targetLines.push(editPoint.targetLine);
                    editPoint.targetLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.transform;
                }
            }
            ManualTracingTool.Logic_Edit_Line.resetModifyStatus(targetLines);
            // Execute the command
            var command = new ManualTracingTool.Command_TransformLattice_LinePoint();
            command.editPoints = this.editPoints;
            command.targetLines = targetLines;
            command.execute(env);
            env.commandHistory.addCommand(command);
            this.editPoints = null;
        };
        Tool_EditModeMain.prototype.onDrawEditor = function (env, drawEnv) {
            if (this.latticeState != LatticeStateID.invalid) {
                if (this.latticeState == LatticeStateID.defaultRentangle) {
                    this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, env);
                    this.setLatticePointsByRectangle(this.rectangleArea);
                }
                //drawEnv.editorDrawer.drawMouseCursor();
                this.drawLatticeRectangle(env, drawEnv);
                this.drawLatticePoints(env, drawEnv);
            }
        };
        return Tool_EditModeMain;
    }(ManualTracingTool.Tool_Transform_Lattice));
    ManualTracingTool.Tool_EditModeMain = Tool_EditModeMain;
})(ManualTracingTool || (ManualTracingTool = {}));
