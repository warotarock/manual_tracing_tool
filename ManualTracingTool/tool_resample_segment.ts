
namespace ManualTracingTool {

    class Tool_Resample_Segment_EditLine {

        targetLine: VectorLine = null;

        oldPoints: List<LinePoint> = null;
        newPoints: List<LinePoint> = null;
    }

    export class Tool_Resample_Segment extends ToolBase {

        helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。';

        targetGroups: List<VectorGroup> = null;
        editLines: List<Tool_Resample_Segment_EditLine> = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.isCurrentLayerVectorLayer()
                && Layer.isEditTarget(env.currentVectorLayer)
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

            if (this.collectEditTargets(env.currentVectorGeometry, env)) {

                let command = new Command_Resample_Segment();
                command.editLines = this.editLines;
                command.useGroups(this.targetGroups);

                command.executeCommand(env);

                env.commandHistory.addCommand(command);

                env.setRedrawMainWindowEditorWindow();
            }
        }

        private collectEditTargets(geometry: VectorLayerGeometry, env: ToolEnvironment): boolean {

            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            let targetGroups = new List<VectorGroup>();
            let editLines = new List<Tool_Resample_Segment_EditLine>();

            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();

            ViewKeyframeLayer.forEachLayerAndGroup(viewKeyframeLayers, (layer: VectorLayer, group: VectorGroup) => {

                if (!Layer.isEditTarget(layer)) {
                    return;
                }

                let existsInGroup = false;

                for (let line of group.lines) {

                    if (line.isSelected && this.existsSelectedSegment(line)) {

                        let editLine = new Tool_Resample_Segment_EditLine();
                        editLine.targetLine = line;
                        editLine.oldPoints = line.points;
                        editLine.newPoints = new List<LinePoint>();

                        editLine.newPoints = this.createResampledPoints(editLine.targetLine, resamplingUnitLength);

                        editLines.push(editLine);

                        existsInGroup = true;
                    }
                }

                if (existsInGroup) {

                    return;
                }

                targetGroups.push(group);
            });

            this.targetGroups = targetGroups;
            this.editLines = editLines;

            return (targetGroups.length > 0);
        }

        private existsSelectedSegment(line: VectorLine): boolean {

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

        private createResampledPoints(line: VectorLine, resamplingUnitLength: float): List<LinePoint> {

            let currentIndex = 0;
            let segmentStartIndex = -1;
            let segmentEndIndex = -1;

            let newPoints = new List<LinePoint>();

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

            return;
        }
    }

    export class Command_Resample_Segment extends CommandBase {

        editLines: List<Tool_Resample_Segment_EditLine> = null;

        protected execute(env: ToolEnvironment) { // @override

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
}
