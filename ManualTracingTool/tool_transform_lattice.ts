
namespace ManualTracingTool {

    class Tool_Transform_Lattice_EditPoint {

        targetPoint: LinePoint = null;

        rerativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
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

        dLocation = vec3.create();
        lerpLocation1 = vec3.create();
        lerpLocation2 = vec3.create();
        lerpLocation3 = vec3.create();

        editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            this.editPoints = null;

            if (env.currentVectorLayer == null) {

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
            this.editPoints = this.createEditInfo(this.rectangleArea, env);

            return true;
        }

        startModal(env: ToolEnvironment) { // @override

            env.setRedrawEditorWindow();
        }

        endModal(env: ToolEnvironment) { // @override

        }

        cancelModal(env: ToolEnvironment) { // @override

            this.editPoints = null;

            env.setRedrawMainWindowEditorWindow();
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

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (this.editPoints == null) {
                return;
            }

            // Move lattice points

            vec3.subtract(this.dLocation, e.location, this.mouseAnchorLocation);

            for (let latticePoint of this.latticePoints) {

                vec3.add(latticePoint.location, latticePoint.baseLocation, this.dLocation);
            }

            // Move line points adjusting location

            this.processLatticeTransform(this.editPoints, this.latticePoints);

            env.setRedrawMainWindowEditorWindow();
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

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

        private calculateSurroundingRectangle(result: Logic_Edit_Points_RectangleArea, env: ToolEnvironment): boolean {

            Logic_Edit_Points.setMinMaxToRectangleArea(result);

            let selectedOnly = true;

            for (let group of env.currentVectorLayer.groups) {

                for (let line of group.lines) {

                    Logic_Edit_Points.calculateSurroundingRectangle(result, result, line.points, selectedOnly);
                }
            }

            let available = Logic_Edit_Points.existsRectangleArea(this.rectangleArea);

            return available;
        }

        private createEditInfo(rectangle: Logic_Edit_Points_RectangleArea, env: ToolEnvironment): List<Tool_Transform_Lattice_EditPoint> {

            let result = new List<Tool_Transform_Lattice_EditPoint>();

            for (let group of env.currentVectorLayer.groups) {

                for (let line of group.lines) {

                    for (let point of line.points) {

                        if (!point.isSelected) {

                            continue;
                        }

                        let editPoint = new Tool_Transform_Lattice_EditPoint();
                        editPoint.targetPoint = point;

                        vec3.copy(editPoint.oldLocation, point.location);
                        vec3.copy(editPoint.newLocation, point.location);

                        let xPosition = rectangle.getHorizontalPositionInRate(point.location[0]);
                        let yPosition = rectangle.getVerticalPositionInRate(point.location[1]);
                        vec3.set(editPoint.rerativeLocation, xPosition, yPosition, 0.0);

                        result.push(editPoint);
                    }
                }
            }

            return result;
        }

        private processLatticeTransform(editPoints: List<Tool_Transform_Lattice_EditPoint>, latticePoints: List<LatticePoint>) {

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

                vec3.lerp(this.lerpLocation1, latticePointLocationH1A, latticePointLocationH1B, editPoint.rerativeLocation[0]);
                vec3.lerp(this.lerpLocation2, latticePointLocationH2A, latticePointLocationH2B, editPoint.rerativeLocation[0]);

                vec3.lerp(editPoint.targetPoint.adjustedLocation, this.lerpLocation1, this.lerpLocation2, editPoint.rerativeLocation[1]);
            }
        }

        private executeCommand(env: ToolEnvironment) {

            // Commit location
            this.processLatticeTransform(this.editPoints, this.latticePoints);

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.newLocation, editPoint.targetPoint.adjustedLocation);
            }

            let command = new Command_TransformLattice();
            command.editPoints = this.editPoints;

            command.execute(env);

            env.commandHistory.addCommand(command);

            this.editPoints = null;
        }
    }

    export class Command_TransformLattice extends CommandBase {

        editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation);
                vec3.copy(editPoint.targetPoint.adjustedLocation, editPoint.oldLocation);
            }
        }

        redo(env: ToolEnvironment) { // @override

            for (let editPoint of this.editPoints) {

                vec3.copy(editPoint.targetPoint.location, editPoint.newLocation);
                vec3.copy(editPoint.targetPoint.adjustedLocation, editPoint.newLocation);
            }
        }

        errorCheck() {
        }
    }
}
