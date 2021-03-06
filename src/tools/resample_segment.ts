﻿import { List, float } from '../base/conversion';

import {
    Layer, VectorStrokeGroup, VectorStroke, VectorPoint,
} from '../base/data';

import {
    ToolEnvironment, ToolBase,
    OperationUnitID,
    ViewKeyframeLayer,
} from '../base/tool';

import { CommandBase } from '../base/command';
import { Logic_Edit_Points, Logic_Edit_Line } from '../logics/edit_vector_layer';

class Tool_Resample_Segment_EditLine {

    targetLine: VectorStroke = null;

    oldPoints: List<VectorPoint> = null;
    newPoints: List<VectorPoint> = null;
}

export class Tool_Resample_Segment extends ToolBase {

    helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。';

    targetGroups: List<VectorStrokeGroup> = null;
    editLines: List<Tool_Resample_Segment_EditLine> = null;

    isAvailable(env: ToolEnvironment): boolean { // @override

        return (
            env.isCurrentLayerVectorLayer()
            && Layer.isEditTarget(env.currentVectorLayer)
        );
    }

    toolWindowItemClick(env: ToolEnvironment) { // @override

        env.setCurrentOperationUnitID(OperationUnitID.linePoint);
        env.setRedrawMainWindow();
    }

    keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @override

        if (e.key == 'Enter') {

            if (env.currentVectorLayer != null) {

                this.executeCommand(env);
                return true;
            }
        }

        return false;
    }

    private executeCommand(env: ToolEnvironment) {

        if (this.collectEditTargets(env)) {

            let command = new Command_Resample_Segment();
            command.editLines = this.editLines;
            command.useGroups(this.targetGroups);

            env.commandHistory.executeCommand(command, env);

            env.setRedrawMainWindowEditorWindow();
        }
    }

    private collectEditTargets(env: ToolEnvironment): boolean {

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        let targetGroups = new List<VectorStrokeGroup>();
        let editLines = new List<Tool_Resample_Segment_EditLine>();

        let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            let existsInGroup = false;

            for (let line of group.lines) {

                if (line.isSelected && this.existsSelectedSegment(line)) {

                    let editLine = new Tool_Resample_Segment_EditLine();
                    editLine.targetLine = line;
                    editLine.oldPoints = line.points;
                    editLine.newPoints = this.createResampledPoints(editLine.targetLine, resamplingUnitLength);

                    editLines.push(editLine);

                    existsInGroup = true;
                }
            }

            if (existsInGroup) {

                targetGroups.push(group);
            }
        });

        this.targetGroups = targetGroups;
        this.editLines = editLines;

        return (editLines.length > 0);
    }

    private existsSelectedSegment(line: VectorStroke): boolean {

        let selectedPointCount = 0;

        for (let point of line.points) {

            if (point.isSelected) {

                selectedPointCount++;

                if (selectedPointCount >= 2) {

                    break;
                }
            }
            else {

                selectedPointCount = 0;
            }
        }

        return (selectedPointCount >= 2);
    }

    private createResampledPoints(line: VectorStroke, resamplingUnitLength: float): List<VectorPoint> {

        let currentIndex = 0;
        let segmentStartIndex = -1;
        let segmentEndIndex = -1;

        let newPoints = new List<VectorPoint>();

        while (currentIndex < line.points.length) {

            let currentPoint = line.points[currentIndex];

            // selected segment
            if (currentPoint.isSelected) {

                segmentStartIndex = currentIndex;

                // search end of selected segment
                for (let i = segmentStartIndex; i < line.points.length; i++) {

                    let point = line.points[i];

                    if (!point.isSelected) {

                        break;
                    }

                    segmentEndIndex = i;
                }

                // if exists selected segment, execute resampling
                if (segmentEndIndex > segmentStartIndex) {

                    Logic_Edit_Points.resamplePoints(
                        newPoints
                        , line.points
                        , segmentStartIndex
                        , segmentEndIndex
                        , resamplingUnitLength
                    );
                }
                // if no segment, execute insert current point
                else {

                    let point = line.points[currentIndex];

                    newPoints.push(point);
                }

                currentIndex = segmentEndIndex + 1;
            }
            // non-selected segment
            else {

                segmentStartIndex = currentIndex;

                // search end of non-selected segment
                for (let i = segmentStartIndex; i < line.points.length; i++) {

                    let point = line.points[i];

                    if (point.isSelected) {

                        break;
                    }

                    segmentEndIndex = i;
                }

                // execute insert original points
                for (let i = segmentStartIndex; i <= segmentEndIndex; i++) {

                    let point = line.points[i];

                    newPoints.push(point);
                }

                currentIndex = segmentEndIndex + 1;
            }
        }

        return newPoints;
    }
}

export class Command_Resample_Segment extends CommandBase {

    editLines: List<Tool_Resample_Segment_EditLine> = null;

    execute(env: ToolEnvironment) { // @override

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        for (let editLine of this.editLines) {

            editLine.targetLine.points = editLine.oldPoints;
        }

        this.updateRelatedObjects();
    }

    redo(env: ToolEnvironment) { // @override

        for (let editLine of this.editLines) {

            editLine.targetLine.points = editLine.newPoints;
        }

        this.updateRelatedObjects();
    }

    private updateRelatedObjects() {

        for (let editLine of this.editLines) {

            Logic_Edit_Line.calculateParameters(editLine.targetLine);
        }
    }
}
