var ManualTracingTool;
(function (ManualTracingTool) {
    class Command_DeletePoints_EditGroup {
        constructor() {
            this.group = null;
            this.oldLineList = null;
            this.newLineList = null;
        }
    }
    class Command_DeletePoints_EditLine {
        constructor() {
            this.targetLine = null;
            this.oldPointList = null;
            this.newPointList = null;
        }
    }
    class Command_DeletePoints extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.layer = null;
            this.editGroups = null;
            this.editLines = null;
            this.deletedLines = null;
            this.deletedPoints = null;
        }
        prepareEditTargets(layer, geometry) {
            if (this.errorCheck(layer)) {
                return false;
            }
            // Set modify flags to groups, lines and points. If a line has no points in result, set delete flag to the line. A group remains even if there is no lines.
            let existsChanges = this.setFlagsToPoints(geometry);
            // If no change, cancel it
            if (!existsChanges) {
                return false;
            }
            this.setFlagsToGroups(layer, geometry);
            this.collectEditTargets(layer, geometry);
            return true;
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editGroup of this.editGroups) {
                editGroup.group.lines = editGroup.oldLineList;
                ManualTracingTool.GPUVertexBuffer.setUpdated(editGroup.group.buffer);
            }
            for (let editLine of this.editLines) {
                editLine.targetLine.points = editLine.oldPointList;
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
            for (let line of this.deletedLines) {
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            }
            for (let point of this.deletedPoints) {
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
        }
        redo(env) {
            for (let editGroup of this.editGroups) {
                editGroup.group.lines = editGroup.newLineList;
                editGroup.group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
                ManualTracingTool.GPUVertexBuffer.setUpdated(editGroup.group.buffer);
            }
            for (let editLine of this.editLines) {
                editLine.targetLine.points = editLine.newPointList;
                editLine.targetLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
            for (let line of this.deletedLines) {
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
            }
            for (let point of this.deletedPoints) {
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
            }
        }
        errorCheck(layer) {
            if (layer == null) {
                return true;
            }
            return false;
        }
        collectEditTargets(layer, geometry) {
            // Collect informations for modified lines and deleted points
            let editLines = new List();
            let deletedPoints = new List();
            for (let group of geometry.groups) {
                if (group.linePointModifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    continue;
                }
                for (let line of group.lines) {
                    if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.delete) {
                        for (let point of line.points) {
                            deletedPoints.push(point);
                        }
                    }
                    else if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.deletePoints) {
                        // Delete points by creating new list
                        let newPointList = new List();
                        for (let point of line.points) {
                            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                                newPointList.push(point);
                            }
                            else {
                                deletedPoints.push(point);
                            }
                        }
                        let editLine = new Command_DeletePoints_EditLine();
                        editLine.targetLine = line;
                        editLine.oldPointList = line.points;
                        editLine.newPointList = newPointList;
                        editLines.push(editLine);
                    }
                }
            }
            // Collect informations for modified groups and deleted lines
            let editGroups = new List();
            let deletedLines = new List();
            for (let group of geometry.groups) {
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    continue;
                }
                let newLineList = null;
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.deleteLines) {
                    newLineList = new List();
                    for (let line of group.lines) {
                        if (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.delete) {
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
                let editGroup = new Command_DeletePoints_EditGroup();
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
        }
        setFlagsToGroups(layer, geometry) {
            let modifiedGroupCount = 0;
            for (let group of geometry.groups) {
                let deleteLineCount = 0;
                let modifiedLineCount = 0;
                for (let line of group.lines) {
                    let deletePointCount = 0;
                    if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.none) {
                        // Check deleting points
                        for (let point of line.points) {
                            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                                deletePointCount++;
                            }
                        }
                        // Set flag to delete line
                        if (deletePointCount > 0) {
                            if (line.points.length - deletePointCount < 2) {
                                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
                                deleteLineCount++;
                            }
                            else {
                                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.deletePoints;
                            }
                            modifiedLineCount++;
                        }
                    }
                    else if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.deleteLine) {
                        line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
                        deleteLineCount++;
                    }
                }
                // Set modify flag to group
                if (deleteLineCount > 0) {
                    group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.deleteLines;
                }
                if (modifiedLineCount > 0) {
                    group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.modifyLines;
                }
                if (group.modifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none || group.linePointModifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none) {
                    modifiedGroupCount++;
                }
            }
        }
        setFlagsToPoints(geometry) {
            return false;
        }
    }
    ManualTracingTool.Command_DeletePoints = Command_DeletePoints;
    class Command_DeleteSelectedPoints extends Command_DeletePoints {
        setFlagsToPoints(geometry) {
            let deletePointCount = 0;
            for (let group of geometry.groups) {
                for (let line of group.lines) {
                    // Set flag to delete points
                    for (let point of line.points) {
                        if (point.isSelected && point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }
                }
            }
            return (deletePointCount > 0);
        }
    }
    ManualTracingTool.Command_DeleteSelectedPoints = Command_DeleteSelectedPoints;
    class Command_DeleteFlaggedPoints extends Command_DeletePoints {
        setFlagsToPoints(geometry) {
            let deletePointCount = 0;
            for (let group of geometry.groups) {
                for (let line of group.lines) {
                    if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.deleteLine) {
                        deletePointCount++;
                    }
                    // Set flag to delete points
                    for (let point of line.points) {
                        if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                            deletePointCount++;
                        }
                    }
                }
            }
            return (deletePointCount > 0);
        }
    }
    ManualTracingTool.Command_DeleteFlaggedPoints = Command_DeleteFlaggedPoints;
})(ManualTracingTool || (ManualTracingTool = {}));
