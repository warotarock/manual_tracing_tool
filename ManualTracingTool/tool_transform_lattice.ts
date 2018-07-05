
namespace ManualTracingTool {

    class Tool_Transform_Lattice_EditPoint {

        targetPoint: LinePoint = null;
        targetLine: VectorLine = null;

        relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
    }

    class LatticePoint {

        baseLocation = vec3.fromValues(0.0, 0.0, 0.0);
        location = vec3.fromValues(0.0, 0.0, 0.0);
    }

    export class Tool_Transform_Lattice extends ModalToolBase {

        rectangleArea = new Logic_Edit_Points_RectangleArea();
        latticePoints: List<LatticePoint> = null;
        latticePointCount = 4;

        mouseAnchorLocation = vec3.create();

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            this.clearEditData(e, env);

            if (!this.checkTarget(e, env)) {

                return false;
            }

            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);

            // Caluclate surrounding rectangle of all selected points
            let available = this.calculateSurroundingRectangle(this.rectangleArea, env);

            if (!available) {

                return false;
            }

            // Create lattie points
            if (this.latticePoints == null) {

                this.createLatticePoints(this.latticePointCount);
            }

            this.setLatticePoints(this.rectangleArea);

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

        protected calculateSurroundingRectangle(result: Logic_Edit_Points_RectangleArea, env: ToolEnvironment): boolean { // @virtual

            Logic_Edit_Points.setMinMaxToRectangleArea(result);

            // Do anything for operation

            let available = Logic_Edit_Points.existsRectangleArea(result);

            return available;
        }

        private createLatticePoints(count: int) {

            this.latticePoints = new List<LatticePoint>();

            for (let i = 0; i < count; i++) {

                this.latticePoints.push(new LatticePoint());
            }
        }

        private setLatticePoints(rectangle: Logic_Edit_Points_RectangleArea) {

            vec3.set(this.latticePoints[0].baseLocation, rectangle.left, rectangle.top, 0.0);
            vec3.set(this.latticePoints[1].baseLocation, rectangle.right, rectangle.top, 0.0);
            vec3.set(this.latticePoints[2].baseLocation, rectangle.right, rectangle.bottom, 0.0);
            vec3.set(this.latticePoints[3].baseLocation, rectangle.left, rectangle.bottom, 0.0);

            for (let latticePoint of this.latticePoints) {

                vec3.copy(latticePoint.location, latticePoint.baseLocation);
            }
        }

        protected createEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        protected prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        startModal(env: ToolEnvironment) { // @override

            env.setRedrawEditorWindow();
        }

        endModal(env: ToolEnvironment) { // @override

            env.setRedrawMainWindowEditorWindow();
        }

        cancelModal(env: ToolEnvironment) { // @override

            env.setRedrawMainWindowEditorWindow();
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            // Move lattice points

            this.processLatticePointMouseMove(e, env);

            // Transform edit data

            this.processLatticeTransform(env);

            env.setRedrawMainWindowEditorWindow();
        }

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

        }

        protected processLatticeTransform(env: ToolEnvironment) { // @virtual

        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (e.isLeftButtonPressing()) {

                this.executeCommand(env);

                env.endModalTool();
            }
            else if (e.isRightButtonPressing()) {

                env.cancelModalTool();
            }
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            if (e.key == 'Enter') {

                this.executeCommand(env);

                env.endModalTool();
            }
        }

        protected executeCommand(env: ToolEnvironment) { // @virtual
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

            drawEnv.render.beginPath();

            let firstPoint = this.latticePoints[0];
            drawEnv.render.moveTo(firstPoint.location[0], firstPoint.location[1]);

            for (let i = 1; i < this.latticePoints.length; i++) {
                let latticePoint = this.latticePoints[i];

                drawEnv.render.lineTo(latticePoint.location[0], latticePoint.location[1]);
            }

            drawEnv.render.lineTo(firstPoint.location[0], firstPoint.location[1]);

            drawEnv.render.stroke();
        }
    }

    export class Tool_Transform_Lattice_LinePoint extends Tool_Transform_Lattice {

        private lerpLocation1 = vec3.create();
        private lerpLocation2 = vec3.create();
        private lerpLocation3 = vec3.create();

        protected editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

        protected clearEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            this.editPoints = null;
        }

        protected checkTarget(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            if (env.currentVectorLayer == null) {

                return false;
            }

            return true;
        }

        protected calculateSurroundingRectangle(result: Logic_Edit_Points_RectangleArea, env: ToolEnvironment): boolean { // @override

            Logic_Edit_Points.setMinMaxToRectangleArea(result);

            let selectedOnly = true;

            for (let group of env.currentVectorLayer.groups) {

                for (let line of group.lines) {

                    Logic_Edit_Points.calculateSurroundingRectangle(result, result, line.points, selectedOnly);
                }
            }

            let available = Logic_Edit_Points.existsRectangleArea(result);

            return available;
        }

        protected createEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            let editPoints = new List<Tool_Transform_Lattice_EditPoint>();

            for (let group of env.currentVectorLayer.groups) {

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

            this.editPoints = editPoints;
        }

        cancelModal(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.targetPoint.location);
            }

            this.editPoints = null;

            env.setRedrawMainWindowEditorWindow();
        }

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        }

        protected processLatticeTransform(env: ToolEnvironment) { // @override

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

            // Commit location
            this.processLatticeTransform(env);

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
    }

    export class Command_TransformLattice_LinePoint extends CommandBase {

        targetLines: List<VectorLine> = null;
        editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.oldLocation);
            }

            this.calculateLineParameters();
        }

        redo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.targetPoint.location, editPoint.newLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.newLocation);
            }

            this.calculateLineParameters();
        }

        errorCheck() {

            if (this.targetLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }

            if (this.editPoints.length == 0) {
                throw ('Command_TransformLattice: no target point!');
            }
        }

        private calculateLineParameters() {

            Logic_Edit_Line.calculateParametersV(this.targetLines);
        }
    }

    export class Tool_Transform_Lattice_Calcer_GrabMove {

        private dLocation = vec3.create();

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, mouseAnchorLocation: Vec3, e: ToolMouseEvent) {

            vec3.subtract(this.dLocation, e.location, mouseAnchorLocation);

            for (let latticePoint of latticePoints) {

                vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
            }
        }
    }

    export class Tool_Transform_Lattice_Calcer_Rotate {

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

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, e: ToolMouseEvent, env: ToolEnvironment) {

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

    export class Tool_Transform_Lattice_Calcer_Scale {

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

        processLatticePointMouseMove(latticePoints: List<LatticePoint>, e: ToolMouseEvent, env: ToolEnvironment) {

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

    export class Tool_Transform_Lattice_GrabMove extends Tool_Transform_Lattice_LinePoint {

        calcer = new Tool_Transform_Lattice_Calcer_GrabMove();

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) {

            this.calcer.processLatticePointMouseMove(this.latticePoints, this.mouseAnchorLocation, e);
        }
    }

    export class Tool_Transform_Lattice_Rotate extends Tool_Transform_Lattice_LinePoint {

        calcer = new Tool_Transform_Lattice_Calcer_Rotate();

        protected prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

            this.calcer.prepareModalExt(e, env);
        }

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) {

            this.calcer.processLatticePointMouseMove(this.latticePoints, e, env);
        }
    }

    export class Tool_Transform_Lattice_Scale extends Tool_Transform_Lattice_LinePoint {

        calcer = new Tool_Transform_Lattice_Calcer_Scale();

        protected prepareModalExt(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

            this.calcer.prepareModalExt(e, env);
        }

        protected processLatticePointMouseMove(e: ToolMouseEvent, env: ToolEnvironment) {

            this.calcer.processLatticePointMouseMove(this.latticePoints, e, env);
        }
    }
}
