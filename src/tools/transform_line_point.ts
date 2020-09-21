import { List } from '../base/conversion';

import {
    VectorLayer,
    VectorPoint,
    VectorStroke,
    VectorStrokeGroup,
} from '../base/data';

import {
    ToolEnvironment, ToolMouseEvent,
    ViewKeyframeLayer,
    OperationUnitID,
} from '../base/tool';

import { CommandBase } from '../base/command';

import { Tool_Transform_Lattice, TransformType } from '../tools/transform_lattice';
import { Logic_Edit_Points, Logic_Edit_Line } from '../logics/edit_vector_layer';

class Tool_Transform_Lattice_EditPoint {

    targetPoint: VectorPoint = null;
    targetLine: VectorStroke = null;

    relativeLocation = vec3.fromValues(0.0, 0.0, 0.0);
    newLocation = vec3.fromValues(0.0, 0.0, 0.0);
    oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
}

export class Tool_Transform_Lattice_LinePoint extends Tool_Transform_Lattice {

    lerpLocation1 = vec3.create();
    lerpLocation2 = vec3.create();
    lerpLocation3 = vec3.create();

    targetGroups: List<VectorStrokeGroup> = null;
    targetLines: List<VectorStroke> = null;
    editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

    protected clearEditData() { // @override

        this.targetGroups = null;
        this.targetLines = null;
        this.editPoints = null;
    }

    protected checkTarget(env: ToolEnvironment): boolean { // @override

        return (env.isCurrentLayerVectorLayer() || env.isCurrentLayerContainerLayer());
    }

    protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override

        let rect = this.baseRectangleArea;

        Logic_Edit_Points.setMinMaxToRectangleArea(rect);

        let selectedOnly = true;

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (let line of group.lines) {

                Logic_Edit_Points.calculateSurroundingRectangle(rect, rect, line.points, selectedOnly);
            }
        });

        let available = Logic_Edit_Points.existsRectangleArea(rect);

        return available;
    }

    protected prepareEditData(env: ToolEnvironment) { // @override

        let targetGroups = new List<VectorStrokeGroup>();
        let targetLines = new List<VectorStroke>();
        let editPoints = new List<Tool_Transform_Lattice_EditPoint>();

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        ViewKeyframeLayer.forEachLayerAndGroup(viewKeyframeLayers, (layer: VectorLayer, group: VectorStrokeGroup) => {

            let existsInGroup = false;

            for (let line of group.lines) {

                let existsInLine = false;

                for (let point of line.points) {

                    if ((env.operationUnitID != OperationUnitID.line && !point.isSelected)
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

    protected existsEditData(): boolean { // @override

        return (this.editPoints.length > 0);
    }

    cancelModal(env: ToolEnvironment) { // @override

        for (let editPoint of this.editPoints) {

            vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.targetPoint.location);
        }

        this.editPoints = null;

        env.setRedrawMainWindowEditorWindow();
    }

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

export class Command_TransformLattice_LinePoint extends CommandBase {

    targetLines: List<VectorStroke> = null;
    editPoints: List<Tool_Transform_Lattice_EditPoint> = null;

    protected execute(env: ToolEnvironment) { // @override

        this.errorCheck();

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        for (let editPoint of this.editPoints) {

            vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation);
            vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.oldLocation);
        }

        this.updateRelatedObjects();
    }

    redo(env: ToolEnvironment) { // @override

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

    private updateRelatedObjects() {

        Logic_Edit_Line.calculateParametersV(this.targetLines);
    }
}

export class Tool_Transform_Lattice_GrabMove extends Tool_Transform_Lattice_LinePoint {

    protected selectTransformCalculator(env: ToolEnvironment) { // @override

        this.setLatticeAffineTransform(TransformType.grabMove, env);
    }
}

export class Tool_Transform_Lattice_Rotate extends Tool_Transform_Lattice_LinePoint {

    protected selectTransformCalculator(env: ToolEnvironment) { // @override

        this.setLatticeAffineTransform(TransformType.rotate, env);
    }
}

export class Tool_Transform_Lattice_Scale extends Tool_Transform_Lattice_LinePoint {

    protected selectTransformCalculator(env: ToolEnvironment) { // @override

        this.setLatticeAffineTransform(TransformType.scale, env);
    }
}
