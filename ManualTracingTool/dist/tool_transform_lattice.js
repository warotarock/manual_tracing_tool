var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
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
    var LatticeStateID;
    (function (LatticeStateID) {
        LatticeStateID[LatticeStateID["invalid"] = 0] = "invalid";
        LatticeStateID[LatticeStateID["initialState"] = 1] = "initialState";
        LatticeStateID[LatticeStateID["modified"] = 2] = "modified";
    })(LatticeStateID = ManualTracingTool.LatticeStateID || (ManualTracingTool.LatticeStateID = {}));
    var TransformType;
    (function (TransformType) {
        TransformType[TransformType["none"] = 0] = "none";
        TransformType[TransformType["grabMove"] = 1] = "grabMove";
        TransformType[TransformType["rotate"] = 2] = "rotate";
        TransformType[TransformType["scale"] = 3] = "scale";
    })(TransformType = ManualTracingTool.TransformType || (ManualTracingTool.TransformType = {}));
    var TransformLockType;
    (function (TransformLockType) {
        TransformLockType[TransformLockType["none"] = 0] = "none";
        TransformLockType[TransformLockType["x"] = 1] = "x";
        TransformLockType[TransformLockType["y"] = 2] = "y";
    })(TransformLockType = ManualTracingTool.TransformLockType || (ManualTracingTool.TransformLockType = {}));
    var TransformModifyType;
    (function (TransformModifyType) {
        TransformModifyType[TransformModifyType["none"] = 0] = "none";
        TransformModifyType[TransformModifyType["zero"] = 1] = "zero";
        TransformModifyType[TransformModifyType["slow"] = 2] = "slow";
        TransformModifyType[TransformModifyType["one"] = 3] = "one";
    })(TransformModifyType = ManualTracingTool.TransformModifyType || (ManualTracingTool.TransformModifyType = {}));
    var Tool_Transform_Lattice = /** @class */ (function (_super) {
        __extends(Tool_Transform_Lattice, _super);
        function Tool_Transform_Lattice() {
            var _this = _super.call(this) || this;
            _this.isEditTool = true; // @override
            _this.latticeState = LatticeStateID.invalid;
            _this.baseRectangleArea = new ManualTracingTool.Logic_Edit_Points_RectangleArea();
            _this.rectangleArea = new ManualTracingTool.Logic_Edit_Points_RectangleArea();
            _this.latticePoints = null;
            _this.latticePointCount = 4;
            _this.latticePadding = 0.0;
            _this.transformType = TransformType.none;
            _this.transformLockType = TransformLockType.none;
            _this.transformModifyType = TransformModifyType.none;
            _this.transformCalculator = null;
            _this.grabMove_Calculator = new GrabMove_Calculator();
            _this.rotate_Calculator = new Rotate_Calculator();
            _this.scale_Calculator = new Scale_Calculator();
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
            return (
            //env.currentVectorLayer != null
            //&& Layer.isEditTarget(env.currentVectorLayer)
            env.currentLayer != null
                && ManualTracingTool.Layer.isEditTarget(env.currentLayer));
        };
        Tool_Transform_Lattice.prototype.onActivated = function (env) {
            this.latticeState = LatticeStateID.invalid;
            this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
            var available = this.prepareLatticePoints(env);
            if (available) {
                this.latticeState = LatticeStateID.initialState;
            }
            else {
                this.latticeState = LatticeStateID.invalid;
            }
        };
        // Preparing for operation
        Tool_Transform_Lattice.prototype.prepareModal = function (e, env) {
            this.clearEditData(e, env);
            this.latticeState = LatticeStateID.invalid;
            this.transformLockType = TransformLockType.none;
            this.transformModifyType = TransformModifyType.none;
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
                this.latticeState = LatticeStateID.invalid;
                return false;
            }
            this.latticeState = LatticeStateID.initialState;
            this.setLatticeLocation(env);
            this.selectTransformCalculator(env);
            // Create edit info
            this.prepareEditData(e, env);
            this.prepareModalExt(e, env);
            return this.existsEditData();
        };
        Tool_Transform_Lattice.prototype.createLatticePoints = function () {
            this.latticePoints = new List();
            for (var i = 0; i < this.latticePointCount; i++) {
                this.latticePoints.push(new ManualTracingTool.LatticePoint());
            }
        };
        Tool_Transform_Lattice.prototype.addPaddingToRectangle = function (result, rectangle, padding, env) {
            var viewPadding = env.getViewScaledLength(padding);
            result.left = rectangle.left - viewPadding;
            result.top = rectangle.top - viewPadding;
            result.right = rectangle.right + viewPadding;
            result.bottom = rectangle.bottom + viewPadding;
        };
        Tool_Transform_Lattice.prototype.setLatticePointsByRectangle = function (rectangle) {
            vec3.set(this.latticePoints[0].baseLocation, rectangle.left, rectangle.top, 0.0);
            vec3.set(this.latticePoints[1].baseLocation, rectangle.right, rectangle.top, 0.0);
            vec3.set(this.latticePoints[2].baseLocation, rectangle.right, rectangle.bottom, 0.0);
            vec3.set(this.latticePoints[3].baseLocation, rectangle.left, rectangle.bottom, 0.0);
            this.resetLatticePointLocationToBaseLocation();
        };
        Tool_Transform_Lattice.prototype.setLatticeLocation = function (env) {
            this.latticePadding = env.drawStyle.latticePointPadding;
            this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, this.latticePadding, env);
            this.setLatticePointsByRectangle(this.rectangleArea);
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
        // Preparing for operation (Override methods)
        Tool_Transform_Lattice.prototype.checkTarget = function (e, env) {
            return (this.transformType != TransformType.none);
        };
        Tool_Transform_Lattice.prototype.prepareLatticePoints = function (env) {
            var available = false;
            return available;
        };
        Tool_Transform_Lattice.prototype.clearEditData = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.selectTransformCalculator = function (env) {
        };
        Tool_Transform_Lattice.prototype.prepareEditData = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.prepareModalExt = function (e, env) {
        };
        Tool_Transform_Lattice.prototype.existsEditData = function () {
            return ManualTracingTool.Logic_Edit_Points.existsRectangleArea(this.baseRectangleArea);
        };
        // Operation functions
        Tool_Transform_Lattice.prototype.setLatticeAffineTransform = function (transformType, env) {
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
        };
        Tool_Transform_Lattice.prototype.startLatticeAffineTransform = function (transformType, isContinueEdit, env) {
            this.setLatticeAffineTransform(transformType, env);
            vec3.copy(this.mouseAnchorLocation, env.mouseCursorLocation);
            if (isContinueEdit) {
                this.applytLatticePointBaseLocation();
            }
            else {
                env.startModalTool(this);
            }
        };
        Tool_Transform_Lattice.prototype.startLatticeTransform = function (env) {
            for (var _i = 0, _a = this.latticePoints; _i < _a.length; _i++) {
                var latticePoint = _a[_i];
                latticePoint.latticePointEditType = ManualTracingTool.LatticePointEditTypeID.none;
            }
            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {
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
                this.latticeState = LatticeStateID.initialState;
                this.transformCalculator.prepare(env);
                env.startModalTool(this);
            }
            else if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {
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
                this.latticeState = LatticeStateID.initialState;
                this.transformCalculator.prepare(env);
                env.startModalTool(this);
            }
        };
        Tool_Transform_Lattice.prototype.endTransform = function (env) {
            this.processTransform(env);
            this.executeCommand(env);
            this.transformType = TransformType.none;
            this.transformCalculator = null;
            env.endModalTool();
        };
        Tool_Transform_Lattice.prototype.cancelTransform = function (env) {
            this.transformType = TransformType.none;
            this.transformCalculator = null;
            env.cancelModalTool();
        };
        // Operation inputs
        Tool_Transform_Lattice.prototype.mouseDown = function (e, env) {
            if (!env.isModalToolRunning() && e.isLeftButtonPressing()) {
                this.startLatticeTransform(env);
            }
            else {
                if (e.isRightButtonPressing()) {
                    this.cancelTransform(env);
                }
            }
        };
        Tool_Transform_Lattice.prototype.mouseMove = function (e, env) {
            if (env.isModalToolRunning()) {
                // Move lattice points
                this.processLatticePointMouseMove(env);
                // Transform edit data
                this.processTransform(env);
                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
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
                var distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(latticePoint1.location, latticePoint2.location, e.location);
                if (distance <= scaledHitRadius) {
                    resultIndex = index;
                    break;
                }
            }
            return resultIndex;
        };
        Tool_Transform_Lattice.prototype.keydown = function (e, env) {
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
                else if (e.key == 'x') {
                    if (this.transformLockType != TransformLockType.x) {
                        this.transformLockType = TransformLockType.x;
                    }
                    else {
                        this.transformLockType = TransformLockType.none;
                    }
                    this.processLatticePointMouseMove(env);
                    this.processTransform(env);
                    env.setRedrawCurrentLayer();
                    env.setRedrawEditorWindow();
                }
                else if (e.key == 'y') {
                    if (this.transformLockType != TransformLockType.y) {
                        this.transformLockType = TransformLockType.y;
                    }
                    else {
                        this.transformLockType = TransformLockType.none;
                    }
                    this.processLatticePointMouseMove(env);
                    this.processTransform(env);
                    env.setRedrawCurrentLayer();
                    env.setRedrawEditorWindow();
                }
                else if (e.key == '0') {
                    if (this.transformModifyType != TransformModifyType.zero) {
                        this.transformModifyType = TransformModifyType.zero;
                    }
                    else {
                        this.transformModifyType = TransformModifyType.none;
                    }
                    this.processLatticePointMouseMove(env);
                    this.processTransform(env);
                    env.setRedrawCurrentLayer();
                    env.setRedrawEditorWindow();
                }
                else if (e.key == '1') {
                    if (this.transformModifyType != TransformModifyType.one) {
                        this.transformModifyType = TransformModifyType.one;
                    }
                    else {
                        this.transformModifyType = TransformModifyType.none;
                    }
                    this.processLatticePointMouseMove(env);
                    this.processTransform(env);
                    env.setRedrawCurrentLayer();
                    env.setRedrawEditorWindow();
                }
                else if (e.key == 'Shift') {
                    if (this.transformModifyType != TransformModifyType.slow) {
                        this.transformModifyType = TransformModifyType.slow;
                    }
                    else {
                        this.transformModifyType = TransformModifyType.none;
                    }
                    env.setRedrawCurrentLayer();
                    env.setRedrawEditorWindow();
                }
            }
            return false;
        };
        Tool_Transform_Lattice.prototype.mouseUp = function (e, env) {
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
        Tool_Transform_Lattice.prototype.processLatticePointMouseMove = function (env) {
            this.transformCalculator.transformLockType = this.transformLockType;
            this.transformCalculator.transformModifyType = this.transformModifyType;
            this.transformCalculator.processLatticePointMouseMove(this.latticePoints, env);
            this.latticeState = LatticeStateID.modified;
        };
        // Operation process implementation (Override methods)
        Tool_Transform_Lattice.prototype.processTransform = function (env) {
        };
        Tool_Transform_Lattice.prototype.executeCommand = function (env) {
        };
        // Drawing
        Tool_Transform_Lattice.prototype.onDrawEditor = function (env, drawEnv) {
            if (this.latticeState != LatticeStateID.invalid) {
                if (this.latticeState == LatticeStateID.initialState) {
                    this.setLatticeLocation(env);
                }
                this.drawLatticeRectangle(env, drawEnv);
                this.drawLatticePoints(env, drawEnv);
            }
        };
        Tool_Transform_Lattice.prototype.drawLatticeRectangle = function (env, drawEnv) {
            if (this.latticePoints == null) {
                return;
            }
            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(1.0));
            // Set dash
            var viewScale = env.getViewScaledLength(1.0);
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
            this.transformModifyType = TransformModifyType.none;
            this.lastLocation = vec3.create();
            this.moveAmount = vec3.create();
            this.dLocation = vec3.create();
        }
        GrabMove_Calculator.prototype.prepare = function (env) {
            vec3.copy(this.lastLocation, env.mouseCursorLocation);
            vec3.set(this.moveAmount, 0.0, 0.0, 0.0);
        };
        GrabMove_Calculator.prototype.processLatticePointMouseMove = function (latticePoints, env) {
            vec3.subtract(this.dLocation, env.mouseCursorLocation, this.lastLocation);
            if (this.transformModifyType == TransformModifyType.slow) {
                vec3.scale(this.dLocation, this.dLocation, 0.25);
            }
            vec3.add(this.moveAmount, this.moveAmount, this.dLocation);
            vec3.copy(this.lastLocation, env.mouseCursorLocation);
            for (var _i = 0, latticePoints_1 = latticePoints; _i < latticePoints_1.length; _i++) {
                var latticePoint = latticePoints_1[_i];
                if (latticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.horizontalOnly) {
                    latticePoint.location[0] = latticePoint.baseLocation[0] + this.moveAmount[0];
                }
                else if (latticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.verticalOnly) {
                    latticePoint.location[1] = latticePoint.baseLocation[1] + this.moveAmount[1];
                }
                else if (latticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.allDirection) {
                    if (this.transformLockType == TransformLockType.none) {
                        vec3.add(latticePoint.location, latticePoint.baseLocation, this.moveAmount);
                    }
                    else if (this.transformLockType == TransformLockType.x) {
                        latticePoint.location[0] = latticePoint.baseLocation[0] + this.moveAmount[0];
                        latticePoint.location[1] = latticePoint.baseLocation[1];
                    }
                    else if (this.transformLockType == TransformLockType.y) {
                        latticePoint.location[0] = latticePoint.baseLocation[0];
                        latticePoint.location[1] = latticePoint.baseLocation[1] + this.moveAmount[1];
                    }
                }
            }
        };
        return GrabMove_Calculator;
    }());
    ManualTracingTool.GrabMove_Calculator = GrabMove_Calculator;
    var Rotate_Calculator = /** @class */ (function () {
        function Rotate_Calculator() {
            this.transformModifyType = TransformModifyType.none;
            this.lastAngle = 0.0;
            this.rotationAmount = 0.0;
            this.dLocation = vec3.create();
            this.direction = vec3.create();
            this.centerLocation = vec3.create();
            this.rotationMatrix = mat4.create();
        }
        Rotate_Calculator.prototype.prepare = function (env) {
            this.lastAngle = this.calulateInputAngle(env);
            this.rotationAmount = 0.0;
        };
        Rotate_Calculator.prototype.calulateInputAngle = function (env) {
            vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);
            var angle = Math.atan2(this.direction[1], this.direction[0]);
            return angle;
        };
        Rotate_Calculator.prototype.processLatticePointMouseMove = function (latticePoints, env) {
            var inputedAngle = this.calulateInputAngle(env);
            var movedAngle = inputedAngle - this.lastAngle;
            if (movedAngle >= Math.PI) {
                movedAngle -= Math.PI * 2;
            }
            if (movedAngle <= -Math.PI) {
                movedAngle += Math.PI * 2;
            }
            if (this.transformModifyType == TransformModifyType.slow) {
                movedAngle *= 0.25;
            }
            this.rotationAmount += movedAngle;
            this.lastAngle = inputedAngle;
            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);
            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.rotateZ(this.rotationMatrix, this.rotationMatrix, this.rotationAmount);
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
            this.transformModifyType = TransformModifyType.none;
            this.initialDistance = 0.0;
            this.lastDistance = 0.0;
            this.scalingAmount = 0.0;
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
            this.lastDistance = this.initialDistance;
            this.scalingAmount = 1.0;
        };
        Scale_Calculator.prototype.calulateDistance = function (env) {
            vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);
            var distance = vec3.length(this.direction);
            return distance;
        };
        Scale_Calculator.prototype.processLatticePointMouseMove = function (latticePoints, env) {
            if (latticePoints.length == 0) {
                return;
            }
            var distance = this.calulateDistance(env);
            var movedDistance = distance - this.lastDistance;
            if (this.transformModifyType == TransformModifyType.slow) {
                movedDistance *= 0.25;
            }
            this.scalingAmount += movedDistance / this.initialDistance;
            this.lastDistance = distance;
            vec3.set(this.scaling, 1.0, 1.0, 1.0);
            var scale = this.scalingAmount;
            var firstLatticePoint = latticePoints[0];
            if (firstLatticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.horizontalOnly) {
                this.scaling[0] = scale;
            }
            else if (firstLatticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.verticalOnly) {
                this.scaling[1] = scale;
            }
            else if (firstLatticePoint.latticePointEditType == ManualTracingTool.LatticePointEditTypeID.allDirection) {
                if (this.transformLockType == TransformLockType.none) {
                    vec3.set(this.scaling, scale, scale, 1.0);
                }
                else if (this.transformLockType == TransformLockType.x) {
                    if (this.transformModifyType == TransformModifyType.zero) {
                        vec3.set(this.scaling, 0.0, 1.0, 1.0);
                    }
                    else {
                        vec3.set(this.scaling, scale, 1.0, 1.0);
                    }
                }
                else if (this.transformLockType == TransformLockType.y) {
                    if (this.transformModifyType == TransformModifyType.zero) {
                        vec3.set(this.scaling, 1.0, 0.0, 1.0);
                    }
                    else {
                        vec3.set(this.scaling, 1.0, scale, 1.0);
                    }
                }
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
