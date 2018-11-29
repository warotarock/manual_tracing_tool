﻿
namespace ManualTracingTool {

    export class Tool_Transform_Lattice extends ModalToolBase {

        latticePoints: List<LatticePoint> = null;
        latticePointCount = 4;

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
            this.createEditData(e, env);

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

        protected createEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        protected prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (!env.isModalToolRunning()) {

                env.setRedrawEditorWindow(); // redraw cursor
                return;
            }

            // Move lattice points

            this.processLatticePointMouseMove(e, env);

            // Transform edit data

            this.processTransform(env);

            env.setRedrawMainWindowEditorWindow();
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

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            if (e.key == 'Enter') {

                this.processTransform(env);

                this.executeCommand(env);

                env.endModalTool();
            }
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
            let viewScale = env.getViewScaledLength(1.0);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            drawEnv.render.setLineDash(this.operatorCurosrLineDashScaled);

            // Draw lattice line

            drawEnv.render.beginPath();

            let firstPoint = this.latticePoints[0];
            drawEnv.render.moveTo(firstPoint.location[0], firstPoint.location[1]);

            for (let i = 1; i < this.latticePoints.length; i++) {
                let latticePoint = this.latticePoints[i];

                drawEnv.render.lineTo(latticePoint.location[0], latticePoint.location[1]);
            }

            drawEnv.render.lineTo(firstPoint.location[0], firstPoint.location[1]);
            drawEnv.render.stroke();
            drawEnv.render.setLineDash(this.operatorCurosrLineDashNone);

        }

        protected drawLatticePoints(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

            // Draw lattice

            for (let latticePoint of this.latticePoints) {

                drawEnv.render.beginPath();

                drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
                drawEnv.render.setStrokeWidth(env.getViewScaledLength(1.0));

                drawEnv.render.circle(
                    latticePoint.location[0], latticePoint.location[1]
                    , env.getViewScaledLength(drawEnv.style.latticePointRadius)
                );

                drawEnv.render.stroke();
            }
        }
    }

    export interface ITool_Transform_Lattice_Calculator {

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment);
    }

    export class GrabMove_Calculator implements ITool_Transform_Lattice_Calculator {

        private dLocation = vec3.create();

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment) {

            vec3.subtract(this.dLocation, e.location, mouseAnchorLocation);

            for (let latticePoint of latticePoints) {

                vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
            }
        }
    }

    export class Rotate_Calculator implements ITool_Transform_Lattice_Calculator {

        private initialAngle = 0.0;

        private dLocation = vec3.create();
        private direction = vec3.create();
        private centerLocation = vec3.create();
        private rotationMatrix = mat4.create();

        prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) {

            this.initialAngle = this.calulateInputAngle(e, env);
        }

        private calulateInputAngle(e: ToolMouseEvent, env: ToolEnvironment): float {

            vec3.subtract(this.direction, e.location, env.operatorCursor.location);
            let angle = Math.atan2(this.direction[1], this.direction[0]);

            return angle;
        }

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment) {

            let angle = this.calulateInputAngle(e, env) - this.initialAngle;

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

    export class Scale_Calculator {

        private initialDistance = 0.0;

        private dLocation = vec3.create();
        private direction = vec3.create();
        private centerLocation = vec3.create();
        private rotationMatrix = mat4.create();

        private scaling = vec3.create();

        prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) {

            this.initialDistance = this.calulateDistance(e, env);

            if (this.initialDistance == 0.0) {

                this.initialDistance = 1.0;
            }
        }

        calulateDistance(e: ToolMouseEvent, env: ToolEnvironment): float {

            vec3.subtract(this.direction, e.location, env.operatorCursor.location);

            let distance = vec3.length(this.direction);

            return distance;
        }

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent, env: ToolEnvironment) {

            let scale = this.calulateDistance(e, env) / this.initialDistance;
            vec3.set(this.scaling, scale, scale, 1.0);

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
