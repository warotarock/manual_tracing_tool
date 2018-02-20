
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

        collectEditTargets(layer: VectorLayer): boolean {

            if (this.errorCheck(layer)) {
                return false;
            }

            // Collect deletion target points, if a line has no points in result, delete that line. A group remains even if there is no lines.
            let modifiedGroupCount = 0;
            for (let group of layer.groups) {

                let deleteLineCount = 0;
                let modifiedLineCount = 0;

                for (let line of group.lines) {

                    let deletePointCount = 0;

                    // Set flag to delete points
                    for (let point of line.points) {

                        if (point.isSelected && point.modifyFlag == ModifyFlagID.none) {

                            point.modifyFlag = ModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }

                    // Set flag to delete line
                    if (deletePointCount > 0 && line.modifyFlag == ModifyFlagID.none) {

                        if (deletePointCount >= line.points.length) {

                            line.modifyFlag = ModifyFlagID.delete;
                            deleteLineCount++;
                        }
                        else {

                            line.modifyFlag = ModifyFlagID.deletePoints;
                        }

                        modifiedLineCount++;
                    }
                }

                // Set modify flag to group
                if (deleteLineCount > 0) {

                    group.modifyFlag = VectorGroupModifyFlagID.deleteLines;
                }

                if (modifiedLineCount > 0) {

                    group.linePointModifyFlag = VectorGroupModifyFlagID.deletePoints;
                }

                if (group.modifyFlag != VectorGroupModifyFlagID.none || group.linePointModifyFlag != VectorGroupModifyFlagID.none) {

                    modifiedGroupCount++;
                }
            }

            // If nochange, cancel it
            if (modifiedGroupCount == 0) {
                return false;
            }

            // Create command argument
            let editGroups = new List<CommandEditVectorGroup>();
            let editLines = new List<CommandEditVectorLine>();

            for (let group of layer.groups) {

                if (group.modifyFlag == VectorGroupModifyFlagID.none
                    && group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                    continue;
                }

                // Gthering editing informations for lines in the goroup
                for (let line of group.lines) {

                    if (line.modifyFlag == ModifyFlagID.deletePoints) {

                        // Delete points by creating new list
                        let newPointList = new List<LinePoint>();

                        for (let point of line.points) {

                            if (point.modifyFlag == ModifyFlagID.none) {

                                newPointList.push(point);
                            }
                        }

                        // Push to command argument
                        let editLine = new CommandEditVectorLine();
                        editLine.line = line;
                        editLine.oldPointList = line.points;
                        editLine.newPointList = newPointList;

                        editLines.push(editLine);
                    }
                }

                // Create a editing information for the group
                let editGroup = new CommandEditVectorGroup();
                editGroup.group = group;
                editGroup.oldLineList = group.lines;

                let newLineList: List<VectorLine> = null;

                if (group.modifyFlag == VectorGroupModifyFlagID.deleteLines) {

                    newLineList = new List<VectorLine>();

                    for (let line of group.lines) {

                        if (line.modifyFlag != ModifyFlagID.delete) {

                            newLineList.push(line);
                        }
                    }
                }
                else {

                    newLineList = group.lines;
                }

                editGroup.newLineList = newLineList;

                editGroups.push(editGroup);
            }

            // Set command arguments
            this.editGroups = editGroups;
            this.editLines = editLines;

            // Clear flags
            for (let group of layer.groups) {

                group.modifyFlag = VectorGroupModifyFlagID.none;
                group.linePointModifyFlag = VectorGroupModifyFlagID.none;

                for (let line of group.lines) {

                    line.modifyFlag = ModifyFlagID.none;

                    for (let point of line.points) {

                        point.modifyFlag = ModifyFlagID.none;
                    }
                }
            }

            this.layer = layer;

            return true;
        }

        execute(env: ToolEnvironment) { // @override

            this.executeTargets();
        }

        private executeTargets() {

            for (let editGroup of this.editGroups) {

                editGroup.group.lines = editGroup.newLineList;
            }

            for (let editLine of this.editLines) {

                editLine.line.points = editLine.newPointList;
            }
        }

        undo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.group.lines = editGroup.oldLineList;
            }

            for (let editLine of this.editLines) {

                editLine.line.points = editLine.oldPointList;
            }
        }

        redo(env: ToolEnvironment) { // @override

            this.executeTargets();
        }

        errorCheck(layer: VectorLayer): boolean {

            if (layer == null) {
                return true;
            }

            return false;
        }
    }
}
