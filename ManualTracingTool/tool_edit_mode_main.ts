
namespace ManualTracingTool {

    class Tool_Transform_Lattice_EditPoint {

        targetPoint: LinePoint = null;
        targetLine: VectorLine = null;

        relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
    }

    export class Tool_EditModeMain extends Tool_Transform_Lattice {

        editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

        lerpLocation1 = vec3.create();
        lerpLocation2 = vec3.create();
        lerpLocation3 = vec3.create();

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible
            );
        }

        toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.setCurrentOperationUnitID(OperationUnitID.line);
        }

        // Preparing for operation

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            this.clearEditData(e, env);

            if (!this.checkTarget(e, env)) {

                return false;
            }

            // Current cursor location
            vec3.copy(this.mouseAnchorLocation, e.location);

            // Create edit info
            this.prepareEditData(e, env);

            return true;
        }

        protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override

            Logic_Edit_Points.setMinMaxToRectangleArea(this.baseRectangleArea);

            let selectedOnly = true;

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        Logic_Edit_Points.calculateSurroundingRectangle(this.baseRectangleArea, this.baseRectangleArea, line.points, selectedOnly);
                    }
                }
            }

            let available = Logic_Edit_Points.existsRectangleArea(this.baseRectangleArea);

            if (available) {

                this.latticeState = LatticeStateID.initialState;
                this.setLatticeLocation(env);
            }
            else {

                this.latticeState = LatticeStateID.invalid;
            }

            return available;
        }

        protected clearEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            this.editPoints = null;
        }

        protected prepareEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            let editPoints = new List<Tool_Transform_Lattice_EditPoint>();

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                if (!viewKeyframeLayer.layer.isSelected || !viewKeyframeLayer.layer.isVisible) {
                    continue;
                }

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

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
            }

            this.editPoints = editPoints;
        }

        // Operation process implementation (Override methods)

        protected processTransform(env: ToolEnvironment) { // @override

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
}
