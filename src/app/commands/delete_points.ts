import { SubToolContext } from "../context/subtool_context"
import { ViewKeyframeLayer } from "../view/view_keyframe"
import { CommandBase } from "../command/command"
import { int } from "../logics/conversion"
import { LinePointModifyFlagID, VectorGroupModifyFlagID, VectorLineModifyFlagID, VectorPoint,
  VectorStroke, VectorStrokeGroup } from "../document_data"
import { Logic_Edit_Line } from "../logics/edit_vector_layer"

class Command_DeletePoints_EditGroup {

    group: VectorStrokeGroup = null
    oldLineList: VectorStroke[] = null
    newLineList: VectorStroke[] = null
}

class Command_DeletePoints_EditLine {

    targetLine: VectorStroke = null
    oldPointList: VectorPoint[] = null
    newPointList: VectorPoint[] = null
}

export class Command_DeletePoints extends CommandBase {

    editGroups: Command_DeletePoints_EditGroup[] = null
    editLines: Command_DeletePoints_EditLine[] = null

    deletedLines: VectorStroke[] = null
    deletedPoints: VectorPoint[] = null

    prepareEditTargets(ctx: SubToolContext): boolean {

        const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

        // Set modify flags to groups, lines and points. If a line has no points in result, set delete flag to the line. A group remains even if there is no lines.
        const existsChanges = this.setFlagsToPoints(viewKeyframeLayers)

        // If no change, cancel it
        if (!existsChanges) {
            return false
        }

        this.setFlagsToGroups(viewKeyframeLayers)

        this.collectEditTargets(viewKeyframeLayers)

        return true
    }

    execute(ctx: SubToolContext) { // @override

        this.redo(ctx)
    }

    undo(_ctx: SubToolContext) { // @override

        for (const editGroup of this.editGroups) {

            editGroup.group.lines = editGroup.oldLineList
        }

        for (const editLine of this.editLines) {

            editLine.targetLine.points = editLine.oldPointList

            Logic_Edit_Line.calculateParameters(editLine.targetLine)
        }

        for (const line of this.deletedLines) {

            line.modifyFlag = VectorLineModifyFlagID.none
        }

        for (const point of this.deletedPoints) {

            point.modifyFlag = LinePointModifyFlagID.none
        }
    }

    redo(_ctx: SubToolContext) { // @override

        for (const editGroup of this.editGroups) {

            editGroup.group.lines = editGroup.newLineList
            editGroup.group.modifyFlag = VectorGroupModifyFlagID.none
        }

        for (const editLine of this.editLines) {

            editLine.targetLine.points = editLine.newPointList
            editLine.targetLine.modifyFlag = VectorLineModifyFlagID.none

            Logic_Edit_Line.calculateParameters(editLine.targetLine)
        }

        for (const line of this.deletedLines) {

            line.modifyFlag = VectorLineModifyFlagID.delete
        }

        for (const point of this.deletedPoints) {

            point.modifyFlag = LinePointModifyFlagID.delete
        }
    }

    private setFlagsToGroups(viewKeyframeLayers: ViewKeyframeLayer[]): int {

        let modifiedGroupCount = 0

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            let deleteLineCount = 0
            let modifiedLineCount = 0

            for (const line of group.lines) {

                let deletePointCount = 0

                if (line.modifyFlag == VectorLineModifyFlagID.none) {

                    // Check deleting points
                    for (const point of line.points) {

                        if (point.modifyFlag == LinePointModifyFlagID.delete) {

                            deletePointCount++
                        }
                    }

                    // Set flag to delete line
                    if (deletePointCount > 0) {

                        if (line.points.length - deletePointCount < 2) {

                            line.modifyFlag = VectorLineModifyFlagID.delete
                            deleteLineCount++
                        }
                        else {

                            line.modifyFlag = VectorLineModifyFlagID.deletePoints
                        }

                        modifiedLineCount++
                    }
                }
                else if (line.modifyFlag == VectorLineModifyFlagID.deleteLine) {

                    line.modifyFlag = VectorLineModifyFlagID.delete
                    deleteLineCount++
                    modifiedLineCount++
                }
            }

            // Set modify flag to group
            if (deleteLineCount > 0) {

                group.modifyFlag = VectorGroupModifyFlagID.deleteLines
            }

            if (modifiedLineCount > 0) {

                group.linePointModifyFlag = VectorGroupModifyFlagID.modifyLines
            }

            if (group.modifyFlag != VectorGroupModifyFlagID.none || group.linePointModifyFlag != VectorGroupModifyFlagID.none) {

                modifiedGroupCount++
            }
        })

        return modifiedGroupCount
    }

    protected setFlagsToPoints(_viewKeyframeLayers: ViewKeyframeLayer[]): boolean { // @virtual

        return false
    }

    private collectEditTargets(viewKeyframeLayers: ViewKeyframeLayer[]) {

        this.useGroups()

        // Collect informations for modified lines and deleted points
        const editLines: Command_DeletePoints_EditLine[] = []
        const deletedPoints: VectorPoint[] = []

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            if (group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                return
            }

            for (const line of group.lines) {

                if (line.modifyFlag == VectorLineModifyFlagID.delete) {

                    for (const point of line.points) {

                        deletedPoints.push(point)
                    }
                }
                else if (line.modifyFlag == VectorLineModifyFlagID.deletePoints) {

                    // Delete points by creating new list
                    const newPointList: VectorPoint[] = []

                    for (const point of line.points) {

                        if (point.modifyFlag == LinePointModifyFlagID.none) {

                            newPointList.push(point)
                        }
                        else {

                            deletedPoints.push(point)
                        }
                    }

                    const editLine = new Command_DeletePoints_EditLine()
                    editLine.targetLine = line
                    editLine.oldPointList = line.points
                    editLine.newPointList = newPointList

                    editLines.push(editLine)
                }
            }
        })

        // Collect informations for modified groups and deleted lines
        const editGroups: Command_DeletePoints_EditGroup[] = []
        const deletedLines: VectorStroke[] = []

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            if (group.linePointModifyFlag == VectorGroupModifyFlagID.none) {
                return
            }

            if (group.modifyFlag == VectorGroupModifyFlagID.deleteLines) {

                const newLineList: VectorStroke[] = []

                for (const line of group.lines) {

                    if (line.modifyFlag != VectorLineModifyFlagID.delete) {

                        newLineList.push(line)
                    }
                    else {

                        deletedLines.push(line)
                    }
                }

                const editGroup = new Command_DeletePoints_EditGroup()
                editGroup.group = group
                editGroup.oldLineList = group.lines
                editGroup.newLineList = newLineList

                editGroups.push(editGroup)

                this.targetGroups.push(group)
            }

            group.linePointModifyFlag = VectorGroupModifyFlagID.none

            this.useGroup(group)
        })

        // Set command arguments
        this.editGroups = editGroups
        this.editLines = editLines
        this.deletedLines = deletedLines
        this.deletedPoints = deletedPoints
    }
}

export class Command_DeleteSelectedPoints extends Command_DeletePoints {

    protected setFlagsToPoints(viewKeyframeLayers: ViewKeyframeLayer[]): boolean { // @override

        let deletePointCount = 0

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (const line of group.lines) {

                // Set flag to delete points
                for (const point of line.points) {

                    if (point.isSelected && point.modifyFlag == LinePointModifyFlagID.none) {

                        point.modifyFlag = LinePointModifyFlagID.delete
                        deletePointCount++
                    }
                }
            }
        })

        return (deletePointCount > 0)
    }
}

export class Command_DeleteFlaggedPoints extends Command_DeletePoints {

    protected setFlagsToPoints(viewKeyframeLayers: ViewKeyframeLayer[]): boolean { // @override

        let deletePointCount = 0

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (const line of group.lines) {

                if (line.modifyFlag == VectorLineModifyFlagID.deleteLine) {

                    deletePointCount++
                }

                // Set flag to delete points
                for (const point of line.points) {

                    if (point.modifyFlag == LinePointModifyFlagID.delete) {

                        deletePointCount++
                    }
                }
            }
        })

        return (deletePointCount > 0)
    }
}
