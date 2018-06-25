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
    var LatticePoint = /** @class */ (function () {
        function LatticePoint() {
            this.baseLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
        }
        return LatticePoint;
    }());
    var Tool_Transform_Lattice = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice, _super);
        function Tool_Transform_Lattice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.rectangleArea = new ManualTracingTool.Logic_Edit_Points_RectangleArea();
            _this.latticePoints = null;
            _this.latticePointCount = 4;
            _this.mouseAnchorLocation = vec3.create();
            _this.dLocation = vec3.create();
            _this.lerpLocation1 = vec3.create();
            _this.lerpLocation2 = vec3.create();
            _this.lerpLocation3 = vec3.create();
            _this.editPoints = null;
            return _this;
        }
        Tool_Transform_Lattice.prototype.prepareModal = function (e, env) {
            this.editPoints = null;
            if (env.currentVectorLayer == null) {
                return false;
            }
            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);
            // Caluclate surrounding rectangle of all selected points
            var available = this.calculateSurroundingRectangle(this.rectangleArea, env);
            if (!available) {
                return false;
            }
            // Create lattie points
            if (this.latticePoints == null) {
                this.createLatticePoints(this.latticePointCount);
            }
            this.setLatticePoints(this.rectangleArea);
            // Create edit info
            this.editPoints = this.createEditInfo(this.rectangleArea, env);
            this.prepareModalExt(e, env);
            return true;
        };
        Tool_Transform_Lattice.prototype.prepareModalExt = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.startModal = function (env) {
            env.setRedrawEditorWindow();
        };
        Tool_Transform_Lattice.prototype.endModal = function (env) {
        };
        Tool_Transform_Lattice.prototype.cancelModal = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.targetPoint.location);
            }
            this.editPoints = null;
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Transform_Lattice.prototype.mouseDown = function (e, env) {
            if (e.isLeftButtonPressing()) {
                this.executeCommand(env);
                env.endModalTool();
            }
            else if (e.isRightButtonPressing()) {
                env.cancelModalTool();
            }
        };
        Tool_Transform_Lattice.prototype.keydown = function (e, env) {
            if (e.key == 'Enter') {
                this.executeCommand(env);
                env.endModalTool();
            }
        };
        Tool_Transform_Lattice.prototype.mouseMove = function (e, env) {
            if (this.editPoints == null) {
                return;
            }
            // Move lattice points
            this.processLatticeMouseMove(e, env);
            // Move line points adjusting location
            this.processLatticeTransform(this.editPoints, this.latticePoints);
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Transform_Lattice.prototype.mouseUp = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.onDrawEditor = function (env, drawEnv) {
            drawEnv.render.beginPath();
            var firstPoint = this.latticePoints[0];
            drawEnv.render.moveTo(firstPoint.location[0], firstPoint.location[1]);
            for (var i = 1; i < this.latticePoints.length; i++) {
                var latticePoint = this.latticePoints[i];
                drawEnv.render.lineTo(latticePoint.location[0], latticePoint.location[1]);
            }
            drawEnv.render.lineTo(firstPoint.location[0], firstPoint.location[1]);
            drawEnv.render.stroke();
        };
        Tool_Transform_Lattice.prototype.createLatticePoints = function (count) {
            this.latticePoints = new List();
            for (var i = 0; i < count; i++) {
                this.latticePoints.push(new LatticePoint());
            }
        };
        Tool_Transform_Lattice.prototype.setLatticePoints = function (rectangle) {
            vec3.set(this.latticePoints[0].baseLocation, rectangle.left, rectangle.top, 0.0);
            vec3.set(this.latticePoints[1].baseLocation, rectangle.right, rectangle.top, 0.0);
            vec3.set(this.latticePoints[2].baseLocation, rectangle.right, rectangle.bottom, 0.0);
            vec3.set(this.latticePoints[3].baseLocation, rectangle.left, rectangle.bottom, 0.0);
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                vec3.copy(latticePoint.location, latticePoint.baseLocation);
            }
        };
        Tool_Transform_Lattice.prototype.calculateSurroundingRectangle = function (result, env) {
            ManualTracingTool.Logic_Edit_Points.setMinMaxToRectangleArea(result);
            var selectedOnly = true;
            for (var _i = 0, _a = env.currentVectorLayer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    ManualTracingTool.Logic_Edit_Points.calculateSurroundingRectangle(result, result, line.points, selectedOnly);
                }
            }
            var available = ManualTracingTool.Logic_Edit_Points.existsRectangleArea(this.rectangleArea);
            return available;
        };
        Tool_Transform_Lattice.prototype.createEditInfo = function (rectangle, env) {
            var result = new List();
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
                        var xPosition = rectangle.getHorizontalPositionInRate(point.location[0]);
                        var yPosition = rectangle.getVerticalPositionInRate(point.location[1]);
                        vec3.set(editPoint.relativeLocation, xPosition, yPosition, 0.0);
                        result.push(editPoint);
                    }
                }
            }
            return result;
        };
        Tool_Transform_Lattice.prototype.processLatticeMouseMove = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.processLatticeTransform = function (editPoints, latticePoints) {
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
        Tool_Transform_Lattice.prototype.executeCommand = function (env) {
            // Commit location
            this.processLatticeTransform(this.editPoints, this.latticePoints);
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
            var command = new Command_TransformLattice();
            command.editPoints = this.editPoints;
            command.targetLines = targetLines;
            command.execute(env);
            env.commandHistory.addCommand(command);
            this.editPoints = null;
        };
        return Tool_Transform_Lattice;
    }(ManualTracingTool.ModalToolBase));
    ManualTracingTool.Tool_Transform_Lattice = Tool_Transform_Lattice;
    var Command_TransformLattice = /** @class */ (function (_super) {
        __extends(Command_TransformLattice, _super);
        function Command_TransformLattice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLines = null;
            _this.editPoints = null;
            return _this;
        }
        Command_TransformLattice.prototype.execute = function (env) {
            this.errorCheck();
            this.redo(env);
        };
        Command_TransformLattice.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.oldLocation);
            }
            this.calculateLineParameters();
        };
        Command_TransformLattice.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editPoints; _i < _a.length; _i++) {
                var editPoint = _a[_i];
                vec3.copy(editPoint.targetPoint.location, editPoint.newLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.newLocation);
            }
            this.calculateLineParameters();
        };
        Command_TransformLattice.prototype.errorCheck = function () {
            if (this.targetLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }
            if (this.editPoints.length == 0) {
                throw ('Command_TransformLattice: no target point!');
            }
        };
        Command_TransformLattice.prototype.calculateLineParameters = function () {
            ManualTracingTool.Logic_Edit_Line.calculateParametersV(this.targetLines);
        };
        return Command_TransformLattice;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_TransformLattice = Command_TransformLattice;
    var Tool_Transform_Lattice_GrabMove = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_GrabMove, _super);
        function Tool_Transform_Lattice_GrabMove() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Tool_Transform_Lattice_GrabMove.prototype.processLatticeMouseMove = function (e, env) {
            vec3.subtract(this.dLocation, e.location, this.mouseAnchorLocation);
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
            }
        };
        return Tool_Transform_Lattice_GrabMove;
    }(Tool_Transform_Lattice));
    ManualTracingTool.Tool_Transform_Lattice_GrabMove = Tool_Transform_Lattice_GrabMove;
    var Tool_Transform_Lattice_Rotate = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_Rotate, _super);
        function Tool_Transform_Lattice_Rotate() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.initialAngle = 0.0;
            _this.direction = vec3.create();
            _this.centerLocation = vec3.create();
            _this.rotationMatrix = mat4.create();
            return _this;
        }
        Tool_Transform_Lattice_Rotate.prototype.prepareModalExt = function (e, env) {
            this.initialAngle = this.calulateInputAngle(e, env);
        };
        Tool_Transform_Lattice_Rotate.prototype.calulateInputAngle = function (e, env) {
            vec3.subtract(this.direction, e.location, env.operatorCursor.location);
            var angle = Math.atan2(this.direction[1], this.direction[0]);
            return angle;
        };
        Tool_Transform_Lattice_Rotate.prototype.processLatticeMouseMove = function (e, env) {
            var angle = this.calulateInputAngle(e, env) - this.initialAngle;
            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);
            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.rotateZ(this.rotationMatrix, this.rotationMatrix, angle);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
            }
        };
        return Tool_Transform_Lattice_Rotate;
    }(Tool_Transform_Lattice));
    ManualTracingTool.Tool_Transform_Lattice_Rotate = Tool_Transform_Lattice_Rotate;
    var Tool_Transform_Lattice_Scale = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice_Scale, _super);
        function Tool_Transform_Lattice_Scale() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.initialDistance = 0.0;
            _this.direction = vec3.create();
            _this.centerLocation = vec3.create();
            _this.rotationMatrix = mat4.create();
            _this.scaling = vec3.create();
            return _this;
        }
        Tool_Transform_Lattice_Scale.prototype.prepareModalExt = function (e, env) {
            this.initialDistance = this.calulateDistance(e, env);
            if (this.initialDistance == 0.0) {
                this.initialDistance = 1.0;
            }
        };
        Tool_Transform_Lattice_Scale.prototype.calulateDistance = function (e, env) {
            vec3.subtract(this.direction, e.location, env.operatorCursor.location);
            var distance = vec3.length(this.direction);
            return distance;
        };
        Tool_Transform_Lattice_Scale.prototype.processLatticeMouseMove = function (e, env) {
            var scale = this.calulateDistance(e, env) / this.initialDistance;
            vec3.set(this.scaling, scale, scale, 1.0);
            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);
            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.scale(this.rotationMatrix, this.rotationMatrix, this.scaling);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
            }
        };
        return Tool_Transform_Lattice_Scale;
    }(Tool_Transform_Lattice));
    ManualTracingTool.Tool_Transform_Lattice_Scale = Tool_Transform_Lattice_Scale;
})(ManualTracingTool || (ManualTracingTool = {}));
