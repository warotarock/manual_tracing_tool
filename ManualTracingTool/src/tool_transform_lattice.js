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
    var LatticePoint = /** @class */ (function () {
        function LatticePoint() {
            this.baseLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
        }
        return LatticePoint;
    }());
    ManualTracingTool.LatticePoint = LatticePoint;
    var Tool_Transform_Lattice = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice, _super);
        function Tool_Transform_Lattice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.latticePoints = null;
            _this.latticePointCount = 4;
            _this.mouseAnchorLocation = vec3.create();
            return _this;
        }
        Tool_Transform_Lattice.prototype.isAvailable = function (env) {
            return (env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible);
        };
        Tool_Transform_Lattice.prototype.prepareModal = function (e, env) {
            this.clearEditData(e, env);
            if (!this.checkTarget(e, env)) {
                return false;
            }
            // Create lattie points
            if (this.latticePoints == null) {
                this.createLatticePoints(this.latticePointCount);
            }
            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);
            // Caluclate surrounding rectangle of all selected points
            var available = this.prepareLatticePoints(env);
            if (!available) {
                return false;
            }
            // Create edit info
            this.createEditData(e, env);
            this.prepareModalExt(e, env);
            return true;
        };
        Tool_Transform_Lattice.prototype.clearEditData = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.checkTarget = function (e, env) {
            return false;
        };
        Tool_Transform_Lattice.prototype.prepareLatticePoints = function (env) {
            var available = false;
            return available;
        };
        Tool_Transform_Lattice.prototype.createLatticePoints = function (count) {
            this.latticePoints = new List();
            for (var i = 0; i < count; i++) {
                this.latticePoints.push(new LatticePoint());
            }
        };
        Tool_Transform_Lattice.prototype.setLatticePointsByRectangle = function (rectangle) {
            vec3.set(this.latticePoints[0].baseLocation, rectangle.left, rectangle.top, 0.0);
            vec3.set(this.latticePoints[1].baseLocation, rectangle.right, rectangle.top, 0.0);
            vec3.set(this.latticePoints[2].baseLocation, rectangle.right, rectangle.bottom, 0.0);
            vec3.set(this.latticePoints[3].baseLocation, rectangle.left, rectangle.bottom, 0.0);
            this.resetLatticePointLocationToBaseLocation();
        };
        Tool_Transform_Lattice.prototype.resetLatticePointLocationToBaseLocation = function () {
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                vec3.copy(latticePoint.location, latticePoint.baseLocation);
            }
        };
        Tool_Transform_Lattice.prototype.createEditData = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.prepareModalExt = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.mouseMove = function (e, env) {
            if (!env.isModalToolRunning()) {
                return;
            }
            // Move lattice points
            this.processLatticePointMouseMove(e, env);
            // Transform edit data
            this.processTransform(env);
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Transform_Lattice.prototype.processLatticePointMouseMove = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.processTransform = function (env) {
        };
        Tool_Transform_Lattice.prototype.mouseDown = function (e, env) {
            if (e.isLeftButtonPressing()) {
                this.processTransform(env);
                this.executeCommand(env);
                env.endModalTool();
            }
            else if (e.isRightButtonPressing()) {
                env.cancelModalTool();
            }
        };
        Tool_Transform_Lattice.prototype.keydown = function (e, env) {
            if (e.key == 'Enter') {
                this.processTransform(env);
                this.executeCommand(env);
                env.endModalTool();
            }
        };
        Tool_Transform_Lattice.prototype.executeCommand = function (env) {
        };
        Tool_Transform_Lattice.prototype.onDrawEditor = function (env, drawEnv) {
            if (this.latticePoints == null) {
                this.createLatticePoints(this.latticePointCount);
                this.prepareLatticePoints(env);
            }
            this.drawLatticeLine(env, drawEnv);
        };
        Tool_Transform_Lattice.prototype.drawLatticeLine = function (env, drawEnv) {
            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(1.0));
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
        return Tool_Transform_Lattice;
    }(ManualTracingTool.ModalToolBase));
    ManualTracingTool.Tool_Transform_Lattice = Tool_Transform_Lattice;
    var Tool_Transform_Lattice_Calcer_GrabMove = /** @class */ (function () {
        function Tool_Transform_Lattice_Calcer_GrabMove() {
            this.dLocation = vec3.create();
        }
        Tool_Transform_Lattice_Calcer_GrabMove.prototype.processLatticePointMouseMove = function (latticePoints, mouseAnchorLocation, e) {
            vec3.subtract(this.dLocation, e.location, mouseAnchorLocation);
            for (var _i = 0, latticePoints_1 = latticePoints; _i < latticePoints_1.length; _i++) {
                var latticePoint = latticePoints_1[_i];
                vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
            }
        };
        return Tool_Transform_Lattice_Calcer_GrabMove;
    }());
    ManualTracingTool.Tool_Transform_Lattice_Calcer_GrabMove = Tool_Transform_Lattice_Calcer_GrabMove;
    var Tool_Transform_Lattice_Calcer_Rotate = /** @class */ (function () {
        function Tool_Transform_Lattice_Calcer_Rotate() {
            this.initialAngle = 0.0;
            this.dLocation = vec3.create();
            this.direction = vec3.create();
            this.centerLocation = vec3.create();
            this.rotationMatrix = mat4.create();
        }
        Tool_Transform_Lattice_Calcer_Rotate.prototype.prepareModalExt = function (e, env) {
            this.initialAngle = this.calulateInputAngle(e, env);
        };
        Tool_Transform_Lattice_Calcer_Rotate.prototype.calulateInputAngle = function (e, env) {
            vec3.subtract(this.direction, e.location, env.operatorCursor.location);
            var angle = Math.atan2(this.direction[1], this.direction[0]);
            return angle;
        };
        Tool_Transform_Lattice_Calcer_Rotate.prototype.processLatticePointMouseMove = function (latticePoints, e, env) {
            var angle = this.calulateInputAngle(e, env) - this.initialAngle;
            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);
            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.rotateZ(this.rotationMatrix, this.rotationMatrix, angle);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);
            for (var _i = 0, latticePoints_2 = latticePoints; _i < latticePoints_2.length; _i++) {
                var latticePoint = latticePoints_2[_i];
                vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
            }
        };
        return Tool_Transform_Lattice_Calcer_Rotate;
    }());
    ManualTracingTool.Tool_Transform_Lattice_Calcer_Rotate = Tool_Transform_Lattice_Calcer_Rotate;
    var Tool_Transform_Lattice_Calcer_Scale = /** @class */ (function () {
        function Tool_Transform_Lattice_Calcer_Scale() {
            this.initialDistance = 0.0;
            this.dLocation = vec3.create();
            this.direction = vec3.create();
            this.centerLocation = vec3.create();
            this.rotationMatrix = mat4.create();
            this.scaling = vec3.create();
        }
        Tool_Transform_Lattice_Calcer_Scale.prototype.prepareModalExt = function (e, env) {
            this.initialDistance = this.calulateDistance(e, env);
            if (this.initialDistance == 0.0) {
                this.initialDistance = 1.0;
            }
        };
        Tool_Transform_Lattice_Calcer_Scale.prototype.calulateDistance = function (e, env) {
            vec3.subtract(this.direction, e.location, env.operatorCursor.location);
            var distance = vec3.length(this.direction);
            return distance;
        };
        Tool_Transform_Lattice_Calcer_Scale.prototype.processLatticePointMouseMove = function (latticePoints, e, env) {
            var scale = this.calulateDistance(e, env) / this.initialDistance;
            vec3.set(this.scaling, scale, scale, 1.0);
            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);
            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.scale(this.rotationMatrix, this.rotationMatrix, this.scaling);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);
            for (var _i = 0, latticePoints_3 = latticePoints; _i < latticePoints_3.length; _i++) {
                var latticePoint = latticePoints_3[_i];
                vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
            }
        };
        return Tool_Transform_Lattice_Calcer_Scale;
    }());
    ManualTracingTool.Tool_Transform_Lattice_Calcer_Scale = Tool_Transform_Lattice_Calcer_Scale;
})(ManualTracingTool || (ManualTracingTool = {}));
