
namespace ManualTracingTool {

    export enum SelectedLatticePartID {

        none, latticePoint, latticeEdge
    }

    export class Tool_Transform_Lattice extends ModalToolBase {

        latticePoints: List<LatticePoint> = null;
        latticePointCount = 4;

        mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
        mouseOver_PartIndex = -1;
        mouseOver_PartIndexTo = -1;

        constructor() {
            super();

            this.createLatticePoints();
        }

        mouseAnchorLocation = vec3.create();

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible
            );
        }

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

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
            let available = this.prepareLatticePoints(env);

            if (!available) {

                return false;
            }

            // Create edit info
            this.prepareEditData(e, env);

            this.prepareModalExt(e, env);

            return true;
        }

        protected clearEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        protected checkTarget(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @virtual

            return false;
        }

        protected prepareLatticePoints(env: ToolEnvironment): boolean { // @virtual

            let available = false;

            return available;
        }

        protected createLatticePoints() {

            this.latticePoints = new List<LatticePoint>();

            for (let i = 0; i < this.latticePointCount; i++) {

                this.latticePoints.push(new LatticePoint());
            }
        }

        protected addPaddingToRectangle(result: Logic_Edit_Points_RectangleArea, rectangle: Logic_Edit_Points_RectangleArea, env: ToolEnvironment) {

            let padding = env.getViewScaledLength(env.drawStyle.latticePointPadding);

            result.left = rectangle.left - padding;
            result.top = rectangle.top - padding;
            result.right = rectangle.right + padding;
            result.bottom = rectangle.bottom + padding;
        }

        protected setLatticePointsByRectangle(rectangle: Logic_Edit_Points_RectangleArea) {

            vec3.set(this.latticePoints[0].baseLocation, rectangle.left, rectangle.top, 0.0);
            vec3.set(this.latticePoints[1].baseLocation, rectangle.right, rectangle.top, 0.0);
            vec3.set(this.latticePoints[2].baseLocation, rectangle.right, rectangle.bottom, 0.0);
            vec3.set(this.latticePoints[3].baseLocation, rectangle.left, rectangle.bottom, 0.0);

            this.resetLatticePointLocationToBaseLocation();
        }

        protected resetLatticePointLocationToBaseLocation() {

            for (let latticePoint of this.latticePoints) {

                vec3.copy(latticePoint.location, latticePoint.baseLocation);
            }
        }

        protected applytLatticePointBaseLocation() {

            for (let latticePoint of this.latticePoints) {

                vec3.copy(latticePoint.baseLocation, latticePoint.location);
            }
        }

        protected prepareEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        protected prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) { // @override
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

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
        }

        protected processMouseOver(e: ToolMouseEvent, env: ToolEnvironment) {

            this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
            this.mouseOver_PartIndex = -1;
            this.mouseOver_PartIndexTo = -1;

            let partIndex = this.getMouseOverLatticePointIndex(e, env);

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
        }

        protected getMouseOverLatticePointIndex(e: ToolMouseEvent, env: ToolEnvironment): int {

            let resultIndex = -1;

            let scaledHitRadius = env.getViewScaledLength(env.drawStyle.latticePointHitRadius);

            for (let index = 0; index < this.latticePoints.length; index++) {

                let latticePoint = this.latticePoints[index];

                let distance = vec3.distance(latticePoint.location, e.location);

                if (distance <= scaledHitRadius) {

                    resultIndex = index;
                    break;
                }
            }

            return resultIndex;
        }

        protected getMouseOverLatticeEdgeIndex(e: ToolMouseEvent, env: ToolEnvironment): int {

            let resultIndex = -1;

            let scaledHitRadius = env.getViewScaledLength(env.drawStyle.latticePointHitRadius);

            for (let index = 0; index < this.latticePoints.length; index++) {

                let indexTo = (index + 1) % this.latticePoints.length;

                let latticePoint1 = this.latticePoints[index];
                let latticePoint2 = this.latticePoints[indexTo];

                let distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                    latticePoint1.location, latticePoint2.location
                    , e.location[0], e.location[1]);

                if (distance <= scaledHitRadius) {

                    resultIndex = index;
                    break;
                }
            }

            return resultIndex;
        }

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

        }

        protected processTransform(env: ToolEnvironment) { // @virtual

        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

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
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @override

            if (e.key == 'Enter') {

                this.processTransform(env);

                this.executeCommand(env);

                env.endModalTool();

                return true;
            }

            return false;
        }

        protected executeCommand(env: ToolEnvironment) { // @virtual
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            this.drawLatticeRectangle(env, drawEnv);
        }

        private operatorCurosrLineDash = [2.0, 2.0];
        private operatorCurosrLineDashScaled = [0.0, 0.0];
        private operatorCurosrLineDashNone = [];

        protected drawLatticeRectangle(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

            if (this.latticePoints == null) {
                return;
            }

            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(1.0));

            // Set dash
            let viewScale = env.getViewScaledLength(1.0 + Math.random() * 0.2);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            drawEnv.render.setLineDash(this.operatorCurosrLineDashScaled);

            // Draw lattice line

            drawEnv.render.beginPath();

            let firstPoint = this.latticePoints[0];
            drawEnv.render.moveTo(firstPoint.location[0], firstPoint.location[1]);

            for (let i = 1; i < this.latticePoints.length; i++) {
                let latticePoint = this.latticePoints[i];

                if (latticePoint.latticePointEditType != LatticePointEditTypeID.none) {
                    let a = 1;
                }

                drawEnv.render.lineTo(latticePoint.location[0], latticePoint.location[1]);
            }

            drawEnv.render.lineTo(firstPoint.location[0], firstPoint.location[1]);
            drawEnv.render.stroke();
            drawEnv.render.setLineDash(this.operatorCurosrLineDashNone);

            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {

                let latticePoint1 = this.latticePoints[this.mouseOver_PartIndex];
                let latticePoint2 = this.latticePoints[this.mouseOver_PartIndexTo];

                drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
                drawEnv.render.setStrokeWidth(env.getViewScaledLength(3.0));

                drawEnv.render.beginPath();

                drawEnv.render.moveTo(latticePoint1.location[0], latticePoint1.location[1]);
                drawEnv.render.lineTo(latticePoint2.location[0], latticePoint2.location[1]);

                drawEnv.render.stroke();
            }
        }

        protected drawLatticePoints(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

            // Draw lattice

            for (let latticePoint of this.latticePoints) {

                this.drawLatticePoint(latticePoint, 1.0, env, drawEnv);
            }

            if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {

                let latticePoint = this.latticePoints[this.mouseOver_PartIndex];

                this.drawLatticePoint(latticePoint, 3.0, env, drawEnv);
            }
        }

        drawLatticePoint(latticePoint: LatticePoint, lineWidth: float, env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

            drawEnv.render.beginPath();

            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(lineWidth));

            drawEnv.render.circle(
                latticePoint.location[0], latticePoint.location[1]
                , env.getViewScaledLength(drawEnv.style.latticePointRadius)
            );

            drawEnv.render.stroke();
        }
    }

    export interface ITool_Transform_Lattice_Calculator {

        prepare(env: ToolEnvironment);
        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment);
    }

    export class GrabMove_Calculator implements ITool_Transform_Lattice_Calculator {

        private dLocation = vec3.create();

        prepare(env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator
        }

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

            vec3.subtract(this.dLocation, env.mouseCursorLocation, mouseAnchorLocation);

            for (let latticePoint of latticePoints) {

                if (latticePoint.latticePointEditType == LatticePointEditTypeID.horizontalOnly) {

                    latticePoint.location[0] = latticePoint.baseLocation[0] + this.dLocation[0];
                }
                else if (latticePoint.latticePointEditType == LatticePointEditTypeID.verticalOnly) {

                    latticePoint.location[1] = latticePoint.baseLocation[1] + this.dLocation[1];
                }
                else if (latticePoint.latticePointEditType == LatticePointEditTypeID.allDirection) {

                    vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
                }
            }
        }
    }

    export class Rotate_Calculator implements ITool_Transform_Lattice_Calculator {

        private initialAngle = 0.0;

        private dLocation = vec3.create();
        private direction = vec3.create();
        private centerLocation = vec3.create();
        private rotationMatrix = mat4.create();

        prepare(env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

            this.initialAngle = this.calulateInputAngle(env);
        }

        private calulateInputAngle(env: ToolEnvironment): float {

            vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);
            let angle = Math.atan2(this.direction[1], this.direction[0]);

            return angle;
        }

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

            let angle = this.calulateInputAngle(env) - this.initialAngle;

            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);

            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.rotateZ(this.rotationMatrix, this.rotationMatrix, angle);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);

            for (let latticePoint of latticePoints) {

                vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
            }
        }
    }

    export class Scale_Calculator implements ITool_Transform_Lattice_Calculator {

        private initialDistance = 0.0;

        private dLocation = vec3.create();
        private direction = vec3.create();
        private centerLocation = vec3.create();
        private rotationMatrix = mat4.create();

        private scaling = vec3.create();

        prepare(env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

            this.initialDistance = this.calulateDistance(env);

            if (this.initialDistance == 0.0) {

                this.initialDistance = 1.0;
            }
        }

        calulateDistance(env: ToolEnvironment): float {

            vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);

            let distance = vec3.length(this.direction);

            return distance;
        }

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

            if (latticePoints.length == 0) {
                return;
            }

            let scale = this.calulateDistance(env) / this.initialDistance;
            vec3.set(this.scaling, 1.0, 1.0, 1.0);

            let firstLatticePoint = latticePoints[0];
            if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.horizontalOnly) {

                this.scaling[0] = scale;
            }
            else if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.verticalOnly) {

                this.scaling[1] = scale;
            }
            else if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.allDirection) {

                vec3.set(this.scaling, scale, scale, 1.0);
            }

            vec3.copy(this.centerLocation, env.operatorCursor.location);
            vec3.scale(this.dLocation, this.centerLocation, -1.0);

            mat4.identity(this.rotationMatrix);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
            mat4.scale(this.rotationMatrix, this.rotationMatrix, this.scaling);
            mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);

            for (let latticePoint of latticePoints) {

                vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
            }
        }
    }
}
