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
    var SelectedLatticePartID;
    (function (SelectedLatticePartID) {
        SelectedLatticePartID[SelectedLatticePartID["none"] = 0] = "none";
        SelectedLatticePartID[SelectedLatticePartID["latticePoint"] = 1] = "latticePoint";
        SelectedLatticePartID[SelectedLatticePartID["latticeEdge"] = 2] = "latticeEdge";
    })(SelectedLatticePartID = ManualTracingTool.SelectedLatticePartID || (ManualTracingTool.SelectedLatticePartID = {}));
    var Tool_Transform_Lattice = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice, _super);
        function Tool_Transform_Lattice() {
            var _this = _super.call(this) || this;
            _this.latticePoints = null;
            _this.latticePointCount = 4;
            _this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
            _this.mouseOver_PartIndex = -1;
            _this.mouseOver_PartIndexTo = -1;
            _this.mouseAnchorLocation = vec3.create();
            _this.operatorCurosrLineDash = [2.0, 2.0];
            _this.operatorCurosrLineDashScaled = [0.0, 0.0];
            _this.operatorCurosrLineDashNone = [];
            _this.createLatticePoints();
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
                this.createLatticePoints();
            }
            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);
            // Caluclate surrounding rectangle of all selected points
            var available = this.prepareLatticePoints(env);
            if (!available) {
                return false;
            }
            // Create edit info
            this.prepareEditData(e, env);
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
        Tool_Transform_Lattice.prototype.createLatticePoints = function () {
            this.latticePoints = new List();
            for (var i = 0; i < this.latticePointCount; i++) {
                this.latticePoints.push(new ManualTracingTool.LatticePoint());
            }
        };
        Tool_Transform_Lattice.prototype.addPaddingToRectangle = function (result, rectangle, env) {
            var padding = env.getViewScaledLength(env.drawStyle.latticePointPadding);
            result.left = rectangle.left - padding;
            result.top = rectangle.top - padding;
            result.right = rectangle.right + padding;
            result.bottom = rectangle.bottom + padding;
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
        Tool_Transform_Lattice.prototype.applytLatticePointBaseLocation = function () {
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                vec3.copy(latticePoint.baseLocation, latticePoint.location);
            }
        };
        Tool_Transform_Lattice.prototype.prepareEditData = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.prepareModalExt = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.mouseMove = function (e, env) {
            if (env.isModalToolRunning()) {
                // Move lattice points
                this.processLatticePointMouseMove(e, env);
                // Transform edit data
                this.processTransform(env);
                env.setRedrawMainWindowEditorWindow();
            }
            else {
                this.processMouseOver(e, env);
                env.setRedrawEditorWindow(); // redraw cursor
            }
        };
        Tool_Transform_Lattice.prototype.processMouseOver = function (e, env) {
            this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
            this.mouseOver_PartIndex = -1;
            this.mouseOver_PartIndexTo = -1;
            var partIndex = this.getMouseOverLatticePointIndex(e, env);
            if (partIndex != -1) {
                this.mouseOver_SelectedLatticePart = SelectedLatticePartID.latticePoint;
                this.mouseOver_PartIndex = partIndex;
            }
            else {
                partIndex = this.getMouseOverLatticeEdgeIndex(e, env);
                if (partIndex != -1) {
                    this.mouseOver_SelectedLatticePart = SelectedLatticePartID.latticeEdge;
                    this.mouseOver_PartIndex = partIndex;
                    this.mouseOver_PartIndexTo = (partIndex + 1) % this.latticePoints.length;
                }
            }
        };
        Tool_Transform_Lattice.prototype.getMouseOverLatticePointIndex = function (e, env) {
            var resultIndex = -1;
            var scaledHitRadius = env.getViewScaledLength(env.drawStyle.latticePointHitRadius);
            for (var index = 0; index < this.latticePoints.length; index++) {
                var latticePoint = this.latticePoints[index];
                var distance = vec3.distance(latticePoint.location, e.location);
                if (distance <= scaledHitRadius) {
                    resultIndex = index;
                    break;
                }
            }
            return resultIndex;
        };
        Tool_Transform_Lattice.prototype.getMouseOverLatticeEdgeIndex = function (e, env) {
            var resultIndex = -1;
            var scaledHitRadius = env.getViewScaledLength(env.drawStyle.latticePointHitRadius);
            for (var index = 0; index < this.latticePoints.length; index++) {
                var indexTo = (index + 1) % this.latticePoints.length;
                var latticePoint1 = this.latticePoints[index];
                var latticePoint2 = this.latticePoints[indexTo];
                var distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(latticePoint1.location, latticePoint2.location, e.location[0], e.location[1]);
                if (distance <= scaledHitRadius) {
                    resultIndex = index;
                    break;
                }
            }
            return resultIndex;
        };
        Tool_Transform_Lattice.prototype.processLatticePointMouseMove = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.processTransform = function (env) {
        };
        Tool_Transform_Lattice.prototype.mouseDown = function (e, env) {
            if (!env.isModalToolRunning()) {
                return;
            }
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
                return true;
            }
            return false;
        };
        Tool_Transform_Lattice.prototype.executeCommand = function (env) {
        };
        Tool_Transform_Lattice.prototype.onDrawEditor = function (env, drawEnv) {
            this.drawLatticeRectangle(env, drawEnv);
        };
        Tool_Transform_Lattice.prototype.drawLatticeRectangle = function (env, drawEnv) {
            if (this.latticePoints == null) {
                return;
            }
            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(1.0));
            // Set dash
            var viewScale = env.getViewScaledLength(1.0 + Math.random() * 0.2);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            drawEnv.render.setLineDash(this.operatorCurosrLineDashScaled);
            // Draw lattice line
            drawEnv.render.beginPath();
            var firstPoint = this.latticePoints[0];
            drawEnv.render.moveTo(firstPoint.location[0], firstPoint.location[1]);
            for (var i = 1; i < this.latticePoints.length; i++) {
                var latticePoint = this.latticePoints[i];
                if (latticePoint.latticePointEditType != ManualTracingTool.LatticePointEditTypeID.none) {
                    var a = 1;
                }
                drawEnv.render.lineTo(latticePoint.location[0], latticePoint.location[1]);
            }
            drawEnv.render.lineTo(firstPoint.location[0], firstPoint.location[1]);
            drawEnv.render.stroke();
            drawEnv.render.setLineDash(this.operatorCurosrLineDashNone);
            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {
                var latticePoint1 = this.latticePoints[this.mouseOver_PartIndex];
                var latticePoint2 = this.latticePoints[this.mouseOver_PartIndexTo];
                drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
                drawEnv.render.setStrokeWidth(env.getViewScaledLength(3.0));
                drawEnv.render.beginPath();
                drawEnv.render.moveTo(latticePoint1.location[0], latticePoint1.location[1]);
                drawEnv.render.lineTo(latticePoint2.location[0], latticePoint2.location[1]);
                drawEnv.render.stroke();
            }
        };
        Tool_Transform_Lattice.prototype.drawLatticePoints = function (env, drawEnv) {
            // Draw lattice
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                this.drawLatticePoint(latticePoint, 1.0, env, drawEnv);
            }
            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {
                var latticePoint = this.latticePoints[this.mouseOver_PartIndex];
                this.drawLatticePoint(latticePoint, 3.0, env, drawEnv);
            }
        };
        Tool_Transform_Lattice.prototype.drawLatticePoint = function (latticePoint, lineWidth, env, drawEnv) {
            drawEnv.render.beginPath();
            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(lineWidth));
            drawEnv.render.circle(latticePoint.location[0], latticePoint.location[1], env.getViewScaledLength(drawEnv.style.latticePointRadius));
            drawEnv.render.stroke();
        };
        return Tool_Transform_Lattice;
    }(ManualTracingTool.ModalToolBase));
    ManualTracingTool.Tool_Transform_Lattice = Tool_Transform_Lattice;
    var GrabMove_Calculator = /** @class */ (function () {
        function GrabMove_Calculator() {
            this.dLocation = vec3.create();
        }
        GrabMove_Calculator.prototype.prepare = function (env) {
        };
        GrabMove_Calculator.prototype.processLatticePointMouseMove = function (latticePoints, mouseAnchorLocation, e, env) {
            vec3.subtract(this.dLocation, env.mouseCursorLocation, mouseAnchorLocation);
            for (var _i = 0, latticePoints_1 = latticePoints; _i < latticePoints_1.length; _i++) {
                var latticePoint = latticePoints_1[_i];
                if (latticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.horizontalOnly) {
                    latticePoint.location[0] = latticePoint.baseLocation[0] + this.dLocation[0];
                }
                else if (latticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.verticalOnly) {
                    latticePoint.location[1] = latticePoint.baseLocation[1] + this.dLocation[1];
                }
                else if (latticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.allDirection) {
                    vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
                }
            }
        };
        return GrabMove_Calculator;
    }());
    ManualTracingTool.GrabMove_Calculator = GrabMove_Calculator;
    var Rotate_Calculator = /** @class */ (function () {
        function Rotate_Calculator() {
            this.initialAngle = 0.0;
            this.dLocation = vec3.create();
            this.direction = vec3.create();
            this.centerLocation = vec3.create();
            this.rotationMatrix = mat4.create();
        }
        Rotate_Calculator.prototype.prepare = function (env) {
            this.initialAngle = this.calulateInputAngle(env);
        };
        Rotate_Calculator.prototype.calulateInputAngle = function (env) {
            vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);
            var angle = Math.atan2(this.direction[1], this.direction[0]);
            return angle;
        };
        Rotate_Calculator.prototype.processLatticePointMouseMove = function (latticePoints, mouseAnchorLocation, e, env) {
            var angle = this.calulateInputAngle(env) - this.initialAngle;
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
        return Rotate_Calculator;
    }());
    ManualTracingTool.Rotate_Calculator = Rotate_Calculator;
    var Scale_Calculator = /** @class */ (function () {
        function Scale_Calculator() {
            this.initialDistance = 0.0;
            this.dLocation = vec3.create();
            this.direction = vec3.create();
            this.centerLocation = vec3.create();
            this.rotationMatrix = mat4.create();
            this.scaling = vec3.create();
        }
        Scale_Calculator.prototype.prepare = function (env) {
            this.initialDistance = this.calulateDistance(env);
            if (this.initialDistance == 0.0) {
                this.initialDistance = 1.0;
            }
        };
        Scale_Calculator.prototype.calulateDistance = function (env) {
            vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);
            var distance = vec3.length(this.direction);
            return distance;
        };
        Scale_Calculator.prototype.processLatticePointMouseMove = function (latticePoints, mouseAnchorLocation, e, env) {
            if (latticePoints.length == 0) {
                return;
            }
            var scale = this.calulateDistance(env) / this.initialDistance;
            vec3.set(this.scaling, 1.0, 1.0, 1.0);
            var firstLatticePoint = latticePoints[0];
            if (firstLatticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.horizontalOnly) {
                this.scaling[0] = scale;
            }
            else if (firstLatticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.verticalOnly) {
                this.scaling[1] = scale;
            }
            else if (firstLatticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.allDirection) {
                vec3.set(this.scaling, scale, scale, 1.0);
            }
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
        return Scale_Calculator;
    }());
    ManualTracingTool.Scale_Calculator = Scale_Calculator;
})(ManualTracingTool || (ManualTracingTool = {}));
