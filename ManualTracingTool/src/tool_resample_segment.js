var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_Resample_Segment_EditGroup {
        constructor() {
            this.group = null;
        }
    }
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
        }
        isAvailable(env) {
            return (env.isCurrentLayerVectorLayer()
                && ManualTracingTool.Layer.isVisible(env.currentVectorLayer));
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
            let command = new Command_Resample_Segment();
            if (command.collectEditTargets(env.currentVectorGeometry, env)) {
                command.execute(env);
                env.commandHistory.addCommand(command);
                env.setRedrawMainWindowEditorWindow();
            }
        }
    }
    ManualTracingTool.Tool_Resample_Segment = Tool_Resample_Segment;
    class Command_Resample_Segment extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.editGroups = null;
            this.editLines = null;
        }
        collectEditTargets(geometry, env) {
            let editGroups = new List();
            let editLines = new List();
            let modifiedGroupCount = 0;
            for (let group of geometry.groups) {
                let modifiedLineCount = 0;
                for (let line of group.lines) {
                    if (line.isSelected) {
                        let editLine = this.collectEditTargets_CreateEditLine(line);
                        if (editLine != null) {
                            editLines.push(editLine);
                            editLine.targetLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.resampling;
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
                group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.modifyLines;
                modifiedGroupCount++;
            }
            this.editGroups = editGroups;
            this.editLines = editLines;
            return (modifiedGroupCount > 0);
        }
        collectEditTargets_ExistsSelectedSegment(line) {
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
        collectEditTargets_CreateEditLine(line) {
            // check selected point exists
            if (!this.collectEditTargets_ExistsSelectedSegment(line)) {
                return null;
            }
            let result = new Tool_Resample_Segment_EditLine();
            result.targetLine = line;
            result.oldPoints = line.points;
            result.newPoints = new List();
            return result;
        }
        executeResampling(env) {
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            for (let editLine of this.editLines) {
                this.createResampledLineToEditLine(editLine, resamplingUnitLength);
            }
        }
        createResampledLineToEditLine(editLine, resamplingUnitLength) {
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
                        ManualTracingTool.Logic_Edit_Points.resamplePoints(editLine.newPoints, line.points, segmentStartIndex, segmentEndIndex, resamplingUnitLength);
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
        execute(env) {
            this.errorCheck();
            this.executeResampling(env);
            this.redo(env);
        }
        undo(env) {
            for (let editLine of this.editLines) {
                editLine.targetLine.points = editLine.oldPoints;
            }
            this.calculateLineParameters();
        }
        redo(env) {
            for (let editGroup of this.editGroups) {
                ManualTracingTool.Logic_Edit_VectorLayer.clearGroupModifyFlags(editGroup.group);
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
        calculateLineParameters() {
            for (let editLine of this.editLines) {
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
        }
    }
    ManualTracingTool.Command_Resample_Segment = Command_Resample_Segment;
})(ManualTracingTool || (ManualTracingTool = {}));
