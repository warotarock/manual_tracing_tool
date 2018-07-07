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
    var Tool_Transform_Lattice_LinePoint = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_LinePoint, _super);
        function Tool_Transform_Lattice_LinePoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.rectangleArea = new ManualTracingTool.Logic_Edit_Points_RectangleArea();
            _this.lerpLocation1 = vec3.create();
            _this.lerpLocation2 = vec3.create();
            _this.lerpLocation3 = vec3.create();
            _this.editPoints = null;
            return _this;
        }
        Tool_Transform_Lattice_LinePoint.prototype.clearEditData = function (e, env) {
            this.editPoints = null;
        };
        Tool_Transform_Lattice_LinePoint.prototype.checkTarget = function (e, env) {
            if (env.currentVectorLayer == null) {
                return false;
            }
            return true;
        };
        Tool_Transform_Lattice_LinePoint.prototype.prepareLatticePoints = function (env) {
            var rect = this.rectangleArea;
            ManualTracingTool.Logic_Edit_Points.setMinMaxToRectangleArea(rect);
            var selectedOnly = true;
            for (var _i = 0, _a = env.currentVectorLayer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    ManualTracingTool.Logic_Edit_Points.calculateSurroundingRectangle(rect, rect, line.points, selectedOnly);
                }
            }
            var available = ManualTracingTool.Logic_Edit_Points.existsRectangleArea(rect);
            this.setLatticePointsByRectangle(rect);
            return available;
        };
        Tool_Transform_Lattice_LinePoint.prototype.createEditData = function (e, env) {
            var editPoints = new List();
            for (var _i = 0, _a = env.currentVectorLayer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                        var point = _e[_d];
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
            this.editPoints = editPoints;
        };
        Tool_Transform_Lattice_LinePoint.prototype.cancelModal = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.targetPoint.location);
            }
            this.editPoints = null;
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Transform_Lattice_LinePoint.prototype.processLatticePointMouseMove = function (e, env) {
        };
        Tool_Transform_Lattice_LinePoint.prototype.processTransform = function (env) {
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
        Tool_Transform_Lattice_LinePoint.prototype.executeCommand = function (env) {
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
            var command = new Command_TransformLattice_LinePoint();
            command.editPoints = this.editPoints;
            command.targetLines = targetLines;
            command.execute(env);
            env.commandHistory.addCommand(command);
            this.editPoints = null;
        };
        return Tool_Transform_Lattice_LinePoint;
    }(ManualTracingTool.Tool_Transform_Lattice));
    ManualTracingTool.Tool_Transform_Lattice_LinePoint = Tool_Transform_Lattice_LinePoint;
    var Command_TransformLattice_LinePoint = /** @class */ (function (_super) {
        __extends(Command_TransformLattice_LinePoint, _super);
        function Command_TransformLattice_LinePoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLines = null;
            _this.editPoints = null;
            return _this;
        }
        Command_TransformLattice_LinePoint.prototype.execute = function (env) {
            this.errorCheck();
            this.redo(env);
        };
        Command_TransformLattice_LinePoint.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.oldLocation);
            }
            this.calculateLineParameters();
        };
        Command_TransformLattice_LinePoint.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.targetPoint.location, editPoint.newLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.newLocation);
            }
            this.calculateLineParameters();
        };
        Command_TransformLattice_LinePoint.prototype.errorCheck = function () {
            if (this.targetLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }
            if (this.editPoints.length == 0) {
                throw ('Command_TransformLattice: no target point!');
            }
        };
        Command_TransformLattice_LinePoint.prototype.calculateLineParameters = function () {
            ManualTracingTool.Logic_Edit_Line.calculateParametersV(this.targetLines);
        };
        return Command_TransformLattice_LinePoint;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_TransformLattice_LinePoint = Command_TransformLattice_LinePoint;
    var Tool_Transform_Lattice_GrabMove = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_GrabMove, _super);
        function Tool_Transform_Lattice_GrabMove() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.calcer = new ManualTracingTool.Tool_Transform_Lattice_Calcer_GrabMove();
            return _this;
        }
        Tool_Transform_Lattice_GrabMove.prototype.processLatticePointMouseMove = function (e, env) {
            this.calcer.processLatticePointMouseMove(this.latticePoints, this.mouseAnchorLocation, e);
        };
        return Tool_Transform_Lattice_GrabMove;
    }(Tool_Transform_Lattice_LinePoint));
    ManualTracingTool.Tool_Transform_Lattice_GrabMove = Tool_Transform_Lattice_GrabMove;
    var Tool_Transform_Lattice_Rotate = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_Rotate, _super);
        function Tool_Transform_Lattice_Rotate() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.calcer = new ManualTracingTool.Tool_Transform_Lattice_Calcer_Rotate();
            return _this;
        }
        Tool_Transform_Lattice_Rotate.prototype.prepareModalExt = function (e, env) {
            this.calcer.prepareModalExt(e, env);
        };
        Tool_Transform_Lattice_Rotate.prototype.processLatticePointMouseMove = function (e, env) {
            this.calcer.processLatticePointMouseMove(this.latticePoints, e, env);
        };
        return Tool_Transform_Lattice_Rotate;
    }(Tool_Transform_Lattice_LinePoint));
    ManualTracingTool.Tool_Transform_Lattice_Rotate = Tool_Transform_Lattice_Rotate;
    var Tool_Transform_Lattice_Scale = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_Scale, _super);
        function Tool_Transform_Lattice_Scale() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.calcer = new ManualTracingTool.Tool_Transform_Lattice_Calcer_Scale();
            return _this;
        }
        Tool_Transform_Lattice_Scale.prototype.prepareModalExt = function (e, env) {
            this.calcer.prepareModalExt(e, env);
        };
        Tool_Transform_Lattice_Scale.prototype.processLatticePointMouseMove = function (e, env) {
            this.calcer.processLatticePointMouseMove(this.latticePoints, e, env);
        };
        return Tool_Transform_Lattice_Scale;
    }(Tool_Transform_Lattice_LinePoint));
    ManualTracingTool.Tool_Transform_Lattice_Scale = Tool_Transform_Lattice_Scale;
})(ManualTracingTool || (ManualTracingTool = {}));
