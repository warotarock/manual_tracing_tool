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
    var Tool_EditModeMain = /** @class */ (function (_super) {
        __extends(Tool_EditModeMain, _super);
        function Tool_EditModeMain() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '左クリックで矩形の辺や角を操作して、選択中の線または点を変形できます。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';
            _this.editPoints = null;
            _this.lerpLocation1 = vec3.create();
            _this.lerpLocation2 = vec3.create();
            _this.lerpLocation3 = vec3.create();
            return _this;
        }
        Tool_EditModeMain.prototype.isAvailable = function (env) {
            return (env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible);
        };
        Tool_EditModeMain.prototype.toolWindowItemClick = function (e, env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.line);
        };
        // Preparing for operation
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
        Tool_EditModeMain.prototype.prepareLatticePoints = function (env) {
            ManualTracingTool.Logic_Edit_Points.setMinMaxToRectangleArea(this.baseRectangleArea);
            var selectedOnly = true;
            var editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (var _i = 0, editableKeyframeLayers_1 = editableKeyframeLayers; _i < editableKeyframeLayers_1.length; _i++) {
                var viewKeyframeLayer = editableKeyframeLayers_1[_i];
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
                this.latticeState = ManualTracingTool.LatticeStateID.initialState;
                this.setLatticeLocation(env);
            }
            else {
                this.latticeState = ManualTracingTool.LatticeStateID.invalid;
            }
            return available;
        };
        Tool_EditModeMain.prototype.clearEditData = function (e, env) {
            this.editPoints = null;
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
        // Operation process implementation (Override methods)
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
        return Tool_EditModeMain;
    }(ManualTracingTool.Tool_Transform_Lattice));
    ManualTracingTool.Tool_EditModeMain = Tool_EditModeMain;
})(ManualTracingTool || (ManualTracingTool = {}));
