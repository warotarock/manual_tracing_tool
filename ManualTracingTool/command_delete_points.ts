
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

        layer: VectorLayer = null;

        editGroups: List<Command_DeletePoints_EditGroup> = null;
        editLines: List<Command_DeletePoints_EditLine> = null;

        deletedLines: List<VectorLine> = null;
        deletedPoints: List<LinePoint> = null;

        prepareEditTargets(layer: VectorLayer, geometry: VectorLayerGeometry): boolean {

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

        execute(env: ToolEnvironment) { // @override

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.group.lines = editGroup.oldLineList;

                GPUVertexBuffer.setUpdated(editGroup.group.buffer);
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

                GPUVertexBuffer.setUpdated(editGroup.group.buffer);
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

        errorCheck(layer: VectorLayer): boolean {

            if (layer == null) {
                return true;
            }

            return false;
        }

        private collectEditTargets(layer: VectorLayer, geometry: VectorLayerGeometry) {

            // Collect informations for modified lines and deleted points
            let editLines = new List<Command_DeletePoints_EditLine>();
            let deletedPoints = new List<LinePoint>();

            for (let group of geometry.groups) {

                if (group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                    continue;
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
            }

            // Collect informations for modified groups and deleted lines
            let editGroups = new List<Command_DeletePoints_EditGroup>();
            let deletedLines = new List<VectorLine>();

            for (let group of geometry.groups) {

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

        private setFlagsToGroups(layer: VectorLayer, geometry: VectorLayerGeometry) {

            let modifiedGroupCount = 0;

            for (let group of geometry.groups) {

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
        }

        protected setFlagsToPoints(geometry: VectorLayerGeometry): boolean { // @virtual

            return false;
        }
    }

    export class Command_DeleteSelectedPoints extends Command_DeletePoints {

        protected setFlagsToPoints(geometry: VectorLayerGeometry): boolean { // @override

            let deletePointCount = 0;

            for (let group of geometry.groups) {

                for (let line of group.lines) {

                    // Set flag to delete points
                    for (let point of line.points) {

                        if (point.isSelected && point.modifyFlag == LinePointModifyFlagID.none) {

                            point.modifyFlag = LinePointModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }
                }
            }

            return (deletePointCount > 0);
        }
    }

    export class Command_DeleteFlaggedPoints extends Command_DeletePoints {

        protected setFlagsToPoints(geometry: VectorLayerGeometry): boolean { // @override

            let deletePointCount = 0;

            for (let group of geometry.groups) {

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
            }

            return (deletePointCount > 0);
        }
    }
}
