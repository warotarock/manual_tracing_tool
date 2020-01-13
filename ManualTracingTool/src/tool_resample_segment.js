var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_Resample_Segment_EditLine {
        constructor() {
            this.targetLine = null;
            this.oldPoints = null;
            this.newPoints = null;
        }
    }
    class Tool_Resample_Segment extends ManualTracingTool.ToolBase {
        constructor() {
            super(...arguments);
            this.helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。';
            this.targetGroups = null;
            this.editLines = null;
        }
        isAvailable(env) {
            return (env.isCurrentLayerVectorLayer()
                && ManualTracingTool.Layer.isEditTarget(env.currentVectorLayer));
        }
        toolWindowItemClick(e, env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.linePoint);
            env.setRedrawMainWindow();
        }
        keydown(e, env) {
            if (e.key == 'Enter') {
                if (env.currentVectorLayer != null) {
                    this.executeCommand(env);
                    return true;
                }
            }
            return false;
        }
        executeCommand(env) {
            if (this.collectEditTargets(env.currentVectorGeometry, env)) {
                let command = new Command_Resample_Segment();
                command.editLines = this.editLines;
                command.useGroups(this.targetGroups);
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
                env.setRedrawMainWindowEditorWindow();
            }
        }
        collectEditTargets(geometry, env) {
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            let targetGroups = new List();
            let editLines = new List();
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
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
        existsSelectedSegment(line) {
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
        createResampledPoints(line, resamplingUnitLength) {
            let currentIndex = 0;
            let segmentStartIndex = -1;
            let segmentEndIndex = -1;
            let newPoints = new List();
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
                        ManualTracingTool.Logic_Edit_Points.resamplePoints(newPoints, line.points, segmentStartIndex, segmentEndIndex, resamplingUnitLength);
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
    ManualTracingTool.Tool_Resample_Segment = Tool_Resample_Segment;
    class Command_Resample_Segment extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.editLines = null;
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editLine of this.editLines) {
                editLine.targetLine.points = editLine.oldPoints;
            }
            this.updateRelatedObjects();
        }
        redo(env) {
            for (let editLine of this.editLines) {
                editLine.targetLine.points = editLine.newPoints;
            }
            this.updateRelatedObjects();
        }
        updateRelatedObjects() {
            for (let editLine of this.editLines) {
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
        }
    }
    ManualTracingTool.Command_Resample_Segment = Command_Resample_Segment;
})(ManualTracingTool || (ManualTracingTool = {}));
