var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_Transform_Lattice_EditPoint {
        constructor() {
            this.targetPoint = null;
            this.targetLine = null;
            this.relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
        }
    }
    class Tool_EditModeMain extends ManualTracingTool.Tool_Transform_Lattice {
        constructor() {
            super(...arguments);
            this.helpText = '左クリックで矩形の辺や角を操作して、選択中の線または点を変形できます。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';
            this.editPoints = null;
            this.lerpLocation1 = vec3.create();
            this.lerpLocation2 = vec3.create();
            this.lerpLocation3 = vec3.create();
        }
        isAvailable(env) {
            return (env.currentVectorLayer != null
                && ManualTracingTool.Layer.isVisible(env.currentVectorLayer));
        }
        toolWindowItemClick(e, env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.line);
        }
        // Preparing for operation
        prepareModal(e, env) {
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
        prepareLatticePoints(env) {
            ManualTracingTool.Logic_Edit_Points.setMinMaxToRectangleArea(this.baseRectangleArea);
            let selectedOnly = true;
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (let viewKeyframeLayer of editableKeyframeLayers) {
                if (ManualTracingTool.VectorLayer.isVectorLayer(viewKeyframeLayer.layer)) {
                    for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                        for (let line of group.lines) {
                            ManualTracingTool.Logic_Edit_Points.calculateSurroundingRectangle(this.baseRectangleArea, this.baseRectangleArea, line.points, selectedOnly);
                        }
                    }
                }
            }
            let available = ManualTracingTool.Logic_Edit_Points.existsRectangleArea(this.baseRectangleArea);
            if (available) {
                this.latticeState = ManualTracingTool.LatticeStateID.initialState;
                this.setLatticeLocation(env);
            }
            else {
                this.latticeState = ManualTracingTool.LatticeStateID.invalid;
            }
            return available;
        }
        clearEditData(e, env) {
            this.editPoints = null;
        }
        prepareEditData(e, env) {
            let editPoints = new List();
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (let viewKeyframeLayer of editableKeyframeLayers) {
                if (!ManualTracingTool.Layer.isSelected(viewKeyframeLayer.layer) || !ManualTracingTool.Layer.isVisible(viewKeyframeLayer.layer)) {
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
        processTransform(env) {
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
        executeCommand(env) {
            let targetLines = new List();
            for (let editPoint of this.editPoints) {
                vec3.copy(editPoint.newLocation, editPoint.targetPoint.adjustingLocation);
            }
            // Get target line
            for (let editPoint of this.editPoints) {
                if (editPoint.targetLine.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.none) {
                    targetLines.push(editPoint.targetLine);
                    editPoint.targetLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.transform;
                }
            }
            ManualTracingTool.Logic_Edit_Line.resetModifyStates(targetLines);
            // Execute the command
            let command = new ManualTracingTool.Command_TransformLattice_LinePoint();
            command.editPoints = this.editPoints;
            command.targetLines = targetLines;
            command.execute(env);
            env.commandHistory.addCommand(command);
            this.editPoints = null;
        }
    }
    ManualTracingTool.Tool_EditModeMain = Tool_EditModeMain;
})(ManualTracingTool || (ManualTracingTool = {}));
