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
    class Tool_Transform_Lattice_LinePoint extends ManualTracingTool.Tool_Transform_Lattice {
        constructor() {
            super(...arguments);
            this.lerpLocation1 = vec3.create();
            this.lerpLocation2 = vec3.create();
            this.lerpLocation3 = vec3.create();
            this.targetGroups = null;
            this.targetLines = null;
            this.editPoints = null;
        }
        clearEditData(e, env) {
            this.targetGroups = null;
            this.targetLines = null;
            this.editPoints = null;
        }
        checkTarget(e, env) {
            if (env.currentVectorLayer == null) {
                return false;
            }
            return true;
        }
        prepareLatticePoints(env) {
            let rect = this.baseRectangleArea;
            ManualTracingTool.Logic_Edit_Points.setMinMaxToRectangleArea(rect);
            let selectedOnly = true;
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
                for (let line of group.lines) {
                    ManualTracingTool.Logic_Edit_Points.calculateSurroundingRectangle(rect, rect, line.points, selectedOnly);
                }
            });
            let available = ManualTracingTool.Logic_Edit_Points.existsRectangleArea(rect);
            return available;
        }
        prepareEditData(e, env) {
            let targetGroups = new List();
            let targetLines = new List();
            let editPoints = new List();
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            ManualTracingTool.ViewKeyframeLayer.forEachLayerAndGroup(viewKeyframeLayers, (layer, group) => {
                let existsInGroup = false;
                for (let line of group.lines) {
                    let existsInLine = false;
                    for (let point of line.points) {
                        if ((env.operationUnitID != ManualTracingTool.OperationUnitID.line && !point.isSelected)
                            || !line.isSelected) {
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
                        existsInLine = true;
                    }
                    if (existsInLine) {
                        targetLines.push(line);
                        existsInGroup = true;
                    }
                }
                if (existsInGroup) {
                    targetGroups.push(group);
                }
            });
            this.targetGroups = targetGroups;
            this.targetLines = targetLines;
            this.editPoints = editPoints;
        }
        existsEditData() {
            return (this.editPoints.length > 0);
        }
        cancelModal(env) {
            for (let editPoint of this.editPoints) {
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.targetPoint.location);
            }
            this.editPoints = null;
            env.setRedrawMainWindowEditorWindow();
        }
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
            if (this.editPoints.length == 0) {
                return;
            }
            for (let editPoint of this.editPoints) {
                vec3.copy(editPoint.newLocation, editPoint.targetPoint.adjustingLocation);
            }
            // Execute the command
            let command = new Command_TransformLattice_LinePoint();
            command.editPoints = this.editPoints;
            command.targetLines = this.targetLines;
            command.useGroups(this.targetGroups);
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
            this.editPoints = null;
        }
    }
    ManualTracingTool.Tool_Transform_Lattice_LinePoint = Tool_Transform_Lattice_LinePoint;
    class Command_TransformLattice_LinePoint extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetLines = null;
            this.editPoints = null;
        }
        execute(env) {
            this.errorCheck();
            this.redo(env);
        }
        undo(env) {
            for (let editPoint of this.editPoints) {
                vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.oldLocation);
            }
            this.updateRelatedObjects();
        }
        redo(env) {
            for (let editPoint of this.editPoints) {
                vec3.copy(editPoint.targetPoint.location, editPoint.newLocation);
                vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.newLocation);
            }
            this.updateRelatedObjects();
        }
        errorCheck() {
            if (this.targetLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }
            if (this.editPoints.length == 0) {
                throw ('Command_TransformLattice: no target point!');
            }
        }
        updateRelatedObjects() {
            ManualTracingTool.Logic_Edit_Line.calculateParametersV(this.targetLines);
        }
    }
    ManualTracingTool.Command_TransformLattice_LinePoint = Command_TransformLattice_LinePoint;
    class Tool_Transform_Lattice_GrabMove extends Tool_Transform_Lattice_LinePoint {
        selectTransformCalculator(env) {
            this.setLatticeAffineTransform(ManualTracingTool.TransformType.grabMove, env);
        }
    }
    ManualTracingTool.Tool_Transform_Lattice_GrabMove = Tool_Transform_Lattice_GrabMove;
    class Tool_Transform_Lattice_Rotate extends Tool_Transform_Lattice_LinePoint {
        selectTransformCalculator(env) {
            this.setLatticeAffineTransform(ManualTracingTool.TransformType.rotate, env);
        }
    }
    ManualTracingTool.Tool_Transform_Lattice_Rotate = Tool_Transform_Lattice_Rotate;
    class Tool_Transform_Lattice_Scale extends Tool_Transform_Lattice_LinePoint {
        selectTransformCalculator(env) {
            this.setLatticeAffineTransform(ManualTracingTool.TransformType.scale, env);
        }
    }
    ManualTracingTool.Tool_Transform_Lattice_Scale = Tool_Transform_Lattice_Scale;
})(ManualTracingTool || (ManualTracingTool = {}));
