
namespace ManualTracingTool {

    class Command_DeletePoints_EditGroup {

        group: VectorGroup = null;
        oldLineList: List<VectorLine> = null;
        newLineList: List<VectorLine> = null;
    }

    class Command_DeletePoints_EditLine {

        targetLine: VectorLine = null;
        oldPointList: List<LinePoint> = null;
        newPointList: List<LinePoint> = null;
    }

    export class Command_DeletePoints extends CommandBase {

        editGroups: List<Command_DeletePoints_EditGroup> = null;
        editLines: List<Command_DeletePoints_EditLine> = null;

        deletedLines: List<VectorLine> = null;
        deletedPoints: List<LinePoint> = null;

        prepareEditTargets(env: ToolEnvironment): boolean {

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

        protected execute(env: ToolEnvironment) { // @override

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.group.lines = editGroup.oldLineList;
            }

            for (let editLine of this.editLines) {

                editLine.targetLine.points = editLine.oldPointList;

                Logic_Edit_Line.calculateParameters(editLine.targetLine);
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

                editLine.targetLine.points = editLine.newPointList;
                editLine.targetLine.modifyFlag = VectorLineModifyFlagID.none;

                Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }

            for (let line of this.deletedLines) {

                line.modifyFlag = VectorLineModifyFlagID.delete;
            }

            for (let point of this.deletedPoints) {

                point.modifyFlag = LinePointModifyFlagID.delete;
            }
        }

        private setFlagsToGroups(viewKeyframeLayers: List<ViewKeyframeLayer>): int {

            let modifiedGroupCount = 0;

            ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorGroup) => {

                let deleteLineCount = 0;
                let modifiedLineCount = 0;

                for (let line of group.lines) {

                    let deletePointCount = 0;

                    if (line.modifyFlag == VectorLineModifyFlagID.none) {

                        // Check deleting points
                        for (let point of line.points) {

                            if (point.modifyFlag == LinePointModifyFlagID.delete) {

                                deletePointCount++;
                            }
                        }

                        // Set flag to delete line
                        if (deletePointCount > 0) {

                            if (line.points.length - deletePointCount < 2) {

                                line.modifyFlag = VectorLineModifyFlagID.delete;
                                deleteLineCount++;
                            }
                            else {

                                line.modifyFlag = VectorLineModifyFlagID.deletePoints;
                            }

                            modifiedLineCount++;
                        }
                    }
                    else if (line.modifyFlag == VectorLineModifyFlagID.deleteLine) {

                        line.modifyFlag = VectorLineModifyFlagID.delete;
                        deleteLineCount++;
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
            });

            return modifiedGroupCount;
        }

        protected setFlagsToPoints(viewKeyframeLayers: List<ViewKeyframeLayer>): boolean { // @virtual

            return false;
        }

        private collectEditTargets(viewKeyframeLayers: List<ViewKeyframeLayer>) {

            this.useGroups();

            // Collect informations for modified lines and deleted points
            let editLines = new List<Command_DeletePoints_EditLine>();
            let deletedPoints = new List<LinePoint>();

            ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorGroup) => {

                if (group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                    return;
                }

                for (let line of group.lines) {

                    if (line.modifyFlag == VectorLineModifyFlagID.delete) {

                        for (let point of line.points) {

                            deletedPoints.push(point);
                        }
                    }
                    else if (line.modifyFlag == VectorLineModifyFlagID.deletePoints) {

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

                        let editLine = new Command_DeletePoints_EditLine();
                        editLine.targetLine = line;
                        editLine.oldPointList = line.points;
                        editLine.newPointList = newPointList;

                        editLines.push(editLine);
                    }
                }
            });

            // Collect informations for modified groups and deleted lines
            let editGroups = new List<Command_DeletePoints_EditGroup>();
            let deletedLines = new List<VectorLine>();

            ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorGroup) => {

                if (group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                    return;
                }

                if (group.modifyFlag == VectorGroupModifyFlagID.deleteLines) {

                    let newLineList: List<VectorLine> = null;

                    newLineList = new List<VectorLine>();

                    for (let line of group.lines) {

                        if (line.modifyFlag != VectorLineModifyFlagID.delete) {

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

                group.linePointModifyFlag = VectorGroupModifyFlagID.none;

                this.useGroup(group);
            });

            // Set command arguments
            this.editGroups = editGroups;
            this.editLines = editLines;
            this.deletedLines = deletedLines;
            this.deletedPoints = deletedPoints;
        }
    }

    export class Command_DeleteSelectedPoints extends Command_DeletePoints {

        protected setFlagsToPoints(viewKeyframeLayers: List<ViewKeyframeLayer>): boolean { // @override

            let deletePointCount = 0;

            ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorGroup) => {

                for (let line of group.lines) {

                    // Set flag to delete points
                    for (let point of line.points) {

                        if (point.isSelected && point.modifyFlag == LinePointModifyFlagID.none) {

                            point.modifyFlag = LinePointModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }
                }
            });

            return (deletePointCount > 0);
        }
    }

    export class Command_DeleteFlaggedPoints extends Command_DeletePoints {

        protected setFlagsToPoints(viewKeyframeLayers: List<ViewKeyframeLayer>): boolean { // @override

            let deletePointCount = 0;

            ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorGroup) => {

                for (let line of group.lines) {

                    if (line.modifyFlag == VectorLineModifyFlagID.deleteLine) {

                        deletePointCount++;
                    }

                    // Set flag to delete points
                    for (let point of line.points) {

                        if (point.modifyFlag == LinePointModifyFlagID.delete) {

                            deletePointCount++;
                        }
                    }
                }
            });

            return (deletePointCount > 0);
        }
    }
}
