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
            this.editGroups = null;
            this.editLines = null;
            this.deletedLines = null;
            this.deletedPoints = null;
        }
        prepareEditTargets(env) {
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            // Set modify flags to groups, lines and points. If a line has no points in result, set delete flag to the line. A group remains even if there is no lines.
            let existsChanges = this.setFlagsToPoints(viewKeyframeLayers);
            // If no change, cancel it
            if (!existsChanges) {
                return false;
            }
            this.setFlagsToGroups(viewKeyframeLayers);
            this.collectEditTargets(viewKeyframeLayers);
            return true;
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editGroup of this.editGroups) {
                editGroup.group.lines = editGroup.oldLineList;
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
        setFlagsToGroups(viewKeyframeLayers) {
            let modifiedGroupCount = 0;
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
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
                        modifiedLineCount++;
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
            });
            return modifiedGroupCount;
        }
        setFlagsToPoints(viewKeyframeLayers) {
            return false;
        }
        collectEditTargets(viewKeyframeLayers) {
            this.useGroups();
            // Collect informations for modified lines and deleted points
            let editLines = new List();
            let deletedPoints = new List();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
                if (group.linePointModifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    return;
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
            });
            // Collect informations for modified groups and deleted lines
            let editGroups = new List();
            let deletedLines = new List();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
                if (group.linePointModifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    return;
                }
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.deleteLines) {
                    let newLineList = null;
                    newLineList = new List();
                    for (let line of group.lines) {
                        if (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.delete) {
                            newLineList.push(line);
                        }
                        else {
                            deletedLines.push(line);
                        }
                    }
                    let editGroup = new Command_DeletePoints_EditGroup();
                    editGroup.group = group;
                    editGroup.oldLineList = group.lines;
                    editGroup.newLineList = newLineList;
                    editGroups.push(editGroup);
                    this.targetGroups.push(group);
                }
                group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
                this.useGroup(group);
            });
            // Set command arguments
            this.editGroups = editGroups;
            this.editLines = editLines;
            this.deletedLines = deletedLines;
            this.deletedPoints = deletedPoints;
        }
    }
    ManualTracingTool.Command_DeletePoints = Command_DeletePoints;
    class Command_DeleteSelectedPoints extends Command_DeletePoints {
        setFlagsToPoints(viewKeyframeLayers) {
            let deletePointCount = 0;
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
                for (let line of group.lines) {
                    // Set flag to delete points
                    for (let point of line.points) {
                        if (point.isSelected && point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }
                }
            });
            return (deletePointCount > 0);
        }
    }
    ManualTracingTool.Command_DeleteSelectedPoints = Command_DeleteSelectedPoints;
    class Command_DeleteFlaggedPoints extends Command_DeletePoints {
        setFlagsToPoints(viewKeyframeLayers) {
            let deletePointCount = 0;
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
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
            });
            return (deletePointCount > 0);
        }
    }
    ManualTracingTool.Command_DeleteFlaggedPoints = Command_DeleteFlaggedPoints;
})(ManualTracingTool || (ManualTracingTool = {}));
