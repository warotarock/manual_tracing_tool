
namespace ManualTracingTool {

    class CommandEditVectorGroup {

        group: VectorGroup = null;
        oldLineList: List<VectorLine> = null;
        newLineList: List<VectorLine> = null;
    }

    class CommandEditVectorLine {

        line: VectorLine = null;
        oldPointList: List<LinePoint> = null;
        newPointList: List<LinePoint> = null;
    }

    export class Command_DeletePoints extends CommandBase {

        layer: VectorLayer = null;

        editGroups: List<CommandEditVectorGroup> = null;
        editLines: List<CommandEditVectorLine> = null;

        deletedLines: List<VectorLine> = null;
        deletedPoints: List<LinePoint> = null;

        collectEditTargets(layer: VectorLayer): boolean {

            if (this.errorCheck(layer)) {
                return false;
            }

            // Set modify flags to groups, lines and points. If a line has no points in result, delete that line. A group remains even if there is no lines.
            let modifiedGroupCount = 0;
            for (let group of layer.groups) {

                let deleteLineCount = 0;
                let modifiedLineCount = 0;

                for (let line of group.lines) {

                    let deletePointCount = 0;

                    // Set flag to delete points
                    for (let point of line.points) {

                        if (point.isSelected && point.modifyFlag == LinePointModifyFlagID.none) {

                            point.modifyFlag = LinePointModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }

                    // Set flag to delete line
                    if (deletePointCount > 0 && line.modifyFlag == VectorLineModifyFlagID.none) {

                        if (deletePointCount >= line.points.length) {

                            line.modifyFlag = VectorLineModifyFlagID.delete;
                            deleteLineCount++;
                        }
                        else {

                            line.modifyFlag = VectorLineModifyFlagID.deletePoints;
                        }

                        modifiedLineCount++;
                    }
                }

                // Set modify flag to group
                if (deleteLineCount > 0) {

                    group.modifyFlag = VectorGroupModifyFlagID.deleteLines;
                }

                if (modifiedLineCount > 0) {

                    group.linePointModifyFlag = VectorGroupModifyFlagID.modifyLines;
                }

                if (group.modifyFlag != VectorGroupModifyFlagID.none || group.linePointModifyFlag != VectorGroupModifyFlagID.none) {

                    modifiedGroupCount++;
                }
            }

            // If no change, cancel it
            if (modifiedGroupCount == 0) {
                return false;
            }

            // Collect informations for modified lines and deleted points
            let editLines = new List<CommandEditVectorLine>();
            let deletedPoints = new List<LinePoint>();

            for (let group of layer.groups) {

                if (group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                    continue;
                }

                for (let line of group.lines) {

                    if (line.modifyFlag != VectorLineModifyFlagID.deletePoints) {
                        continue;
                    }

                    // Delete points by creating new list
                    let newPointList = new List<LinePoint>();

                    for (let point of line.points) {

                        if (point.modifyFlag == LinePointModifyFlagID.none) {

                            newPointList.push(point);
                        }
                        else {

                            deletedPoints.push(point);
                        }
                    }

                    let editLine = new CommandEditVectorLine();
                    editLine.line = line;
                    editLine.oldPointList = line.points;
                    editLine.newPointList = newPointList;

                    editLines.push(editLine);
                }
            }

            // Collect informations for modified groups and deleted lines
            let editGroups = new List<CommandEditVectorGroup>();
            let deletedLines = new List<VectorLine>();

            for (let group of layer.groups) {

                if (group.modifyFlag == VectorGroupModifyFlagID.none) {
                    continue;
                }

                let newLineList: List<VectorLine> = null;

                if (group.modifyFlag == VectorGroupModifyFlagID.deleteLines) {

                    newLineList = new List<VectorLine>();

                    for (let line of group.lines) {

                        if (line.modifyFlag != VectorLineModifyFlagID.delete) {

                            newLineList.push(line);
                        }
                        else {

                            deletedLines.push(line);
                        }
                    }
                }
                else {

                    newLineList = group.lines;
                }

                let editGroup = new CommandEditVectorGroup();
                editGroup.group = group;
                editGroup.oldLineList = group.lines;
                editGroup.newLineList = newLineList;

                editGroups.push(editGroup);
            }

            // Set command arguments
            this.editGroups = editGroups;
            this.editLines = editLines;
            this.deletedLines = deletedLines;
            this.deletedPoints = deletedPoints;

            this.layer = layer;

            return true;
        }

        execute(env: ToolEnvironment) { // @override

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.group.lines = editGroup.oldLineList;
            }

            for (let editLine of this.editLines) {

                editLine.line.points = editLine.oldPointList;
            }

            for (let line of this.deletedLines) {

                line.modifyFlag = VectorLineModifyFlagID.none;
            }

            for (let point of this.deletedPoints) {

                point.modifyFlag = LinePointModifyFlagID.none;
            }
        }

        redo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.group.lines = editGroup.newLineList;
                editGroup.group.modifyFlag = VectorGroupModifyFlagID.none;
            }

            for (let editLine of this.editLines) {

                editLine.line.points = editLine.newPointList;
                editLine.line.modifyFlag = VectorLineModifyFlagID.none;
            }

            for (let line of this.deletedLines) {

                line.modifyFlag = VectorLineModifyFlagID.delete;
            }

            for (let point of this.deletedPoints) {

                point.modifyFlag = LinePointModifyFlagID.delete;
            }
        }

        errorCheck(layer: VectorLayer): boolean {

            if (layer == null) {
                return true;
            }

            return false;
        }
    }
}
