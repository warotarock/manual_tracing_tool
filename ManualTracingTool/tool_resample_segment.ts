
namespace ManualTracingTool {

    class Tool_Resample_Segment_EditGroup {

        group: VectorGroup = null;
    }

    class Tool_Resample_Segment_EditLine {

        targetLine: VectorLine = null;

        oldPoints: List<LinePoint> = null;
        newPoints: List<LinePoint> = null;
    }

    export class Tool_Resample_Segment extends ToolBase {

        helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.isCurrentLayerVectorLayer()
                && env.currentVectorLayer.isVisible
            );
        }

        toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

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

            let command = new Command_Resample_Segment();

            if (command.collectEditTargets(env.currentVectorGeometry, env)) {

                command.execute(env);

                env.commandHistory.addCommand(command);

                env.setRedrawMainWindowEditorWindow();
            }
        }
    }

    export class Command_Resample_Segment extends CommandBase {

        editGroups: List<Tool_Resample_Segment_EditGroup> = null;
        editLines: List<Tool_Resample_Segment_EditLine> = null;

        collectEditTargets(geometry: VectorLayerGeometry, env: ToolEnvironment): boolean {

            let editGroups = new List<Tool_Resample_Segment_EditGroup>();
            let editLines = new List<Tool_Resample_Segment_EditLine>();

            let modifiedGroupCount = 0;

            for (let group of geometry.groups) {

                let modifiedLineCount = 0;

                for (let line of group.lines) {

                    if (line.isSelected) {

                        let editLine = this.collectEditTargets_CreateEditLine(line);

                        if (editLine != null) {

                            editLines.push(editLine);

                            editLine.targetLine.modifyFlag = VectorLineModifyFlagID.resampling;
                            modifiedLineCount++;
                        }
                    }
                }

                if (modifiedLineCount == 0) {

                    continue;
                }

                let editGroup = new Tool_Resample_Segment_EditGroup();
                editGroup.group = group;
                editGroups.push(editGroup);

                group.linePointModifyFlag = VectorGroupModifyFlagID.modifyLines;
                modifiedGroupCount++;
            }

            this.editGroups = editGroups;
            this.editLines = editLines;

            return (modifiedGroupCount > 0);
        }

        private collectEditTargets_ExistsSelectedSegment(line: VectorLine): boolean {

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

        private collectEditTargets_CreateEditLine(line: VectorLine): Tool_Resample_Segment_EditLine {

            // check selected point exists
            if (!this.collectEditTargets_ExistsSelectedSegment(line)) {

                return null;
            }

            let result = new Tool_Resample_Segment_EditLine();
            result.targetLine = line;
            result.oldPoints = line.points;
            result.newPoints = new List<LinePoint>();

            return result;
        }

        executeResampling(env: ToolEnvironment) {

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();

            for (let editLine of this.editLines) {

                this.createResampledLineToEditLine(editLine, resamplingUnitLength);
            }
        }

        private createResampledLineToEditLine(editLine: Tool_Resample_Segment_EditLine, resamplingUnitLength: float) {

            let line = editLine.targetLine;

            let currentIndex = 0;
            let segmentStartIndex = -1;
            let segmentEndIndex = -1;

            while (currentIndex < line.points.length) {

                let currentPoint = line.points[currentIndex];

                let isSelectedSegment = (currentPoint.isSelected);

                // selected segment
                if (isSelectedSegment) {

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
                            editLine.newPoints
                            , line.points
                            , segmentStartIndex
                            , segmentEndIndex
                            , resamplingUnitLength
                        );
                    }
                    // if no segment, execute insert current point
                    else {

                        let point = line.points[currentIndex];

                        editLine.newPoints.push(point);
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

                    // execute insert original point
                    for (let i = segmentStartIndex; i <= segmentEndIndex; i++) {

                        let point = line.points[i];

                        editLine.newPoints.push(point);
                    }

                    currentIndex = segmentEndIndex + 1;
                }
            }
        }

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.executeResampling(env);

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editLine of this.editLines) {

                editLine.targetLine.points = editLine.oldPoints;
            }

            this.calculateLineParameters();
        }

        redo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                Logic_VectorLayer.clearGroupModifyFlags(editGroup.group);
            }

            for (let editLine of this.editLines) {

                editLine.targetLine.points = editLine.newPoints;
            }

            this.calculateLineParameters();
        }

        errorCheck() {

            if (this.editLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }
        }

        private calculateLineParameters() {

            for (let editLine of this.editLines) {

                Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
        }
    }
}
