import { Lists } from "../logics/conversion"
import { VectorStrokeGroup, VectorStroke, VectorPoint } from "../document_data"
import { Platform } from "../../platform/platform"
import { CommandBase } from "../command/command"
import { Logic_Edit_Line } from "../logics/edit_vector_layer"
import { SubToolContext } from "../context/subtool_context"
import { ViewKeyframeLayer } from "../view/view_keyframe"

class Command_EditGeometry_EditData {

    targetGroup: VectorStrokeGroup = null
    oldLines: VectorStroke[] = null
    newLines: VectorStroke[] = null
}

export class Command_FilterGeometry extends CommandBase {

    editDatas: Command_EditGeometry_EditData[] = null

    prepareEditData(ctx: SubToolContext): boolean {

        this.useGroups()

        const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

        const editDatas: Command_EditGeometry_EditData[] = []

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            const newLines: VectorStroke[] = []

            for (const line of group.lines) {

                if (!line.isSelected) {
                    continue
                }

                const newLine = new VectorStroke()

                for (const point of line.points) {

                    if (!point.isSelected) {
                        continue
                    }

                    newLine.points.push(VectorPoint.clone(point))
                }

                if (newLine.points.length > 0) {

                    newLines.push(newLine)
                }
            }

            if (newLines.length > 0) {

                const editData = new Command_EditGeometry_EditData()
                editData.targetGroup = group
                editData.newLines = newLines
                editData.oldLines = group.lines

                editDatas.push(editData)

                this.targetGroups.push(group)
            }
        })

        if (editDatas.length > 0) {

            this.editDatas = editDatas
            return true
        }
        else {

            return false
        }
    }

    isAvailable(_ctx: SubToolContext): boolean { // @override

        return (this.editDatas != null)
    }

    execute(ctx: SubToolContext) { // @override

        this.redo(ctx)
    }

    undo(_ctx: SubToolContext) { // @override

        for (const editData of this.editDatas) {

            editData.targetGroup.lines = editData.oldLines
        }
    }

    redo(_ctx: SubToolContext) { // @override

        for (const editData of this.editDatas) {

            editData.targetGroup.lines = editData.newLines
        }
    }
}

export class Command_CopyGeometry extends CommandBase {

    copy_VectorGroup: VectorStrokeGroup = null

    prepareEditData(ctx: SubToolContext): boolean {

        const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

        const copy_GroupData = new VectorStrokeGroup()

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (const line of group.lines) {

                if (!line.isSelected) {
                    continue
                }

                const newLine = new VectorStroke()

                for (const point of line.points) {

                    if (!point.isSelected) {
                        continue
                    }

                    newLine.points.push(VectorPoint.clone(point))
                }

                if (newLine.points.length > 0) {

                    Logic_Edit_Line.calculateParameters(newLine)

                    copy_GroupData.lines.push(newLine)
                }
            }
        })

        if (copy_GroupData.lines.length > 0) {

            this.copy_VectorGroup = copy_GroupData
            return true
        }
        else {

            return false
        }
    }

    isAvailable(_ctx: SubToolContext): boolean { // @override

        return (this.copy_VectorGroup != null)
    }

    execute(_ctx: SubToolContext) { // @override

        // ctx.clipboard.copy_VectorGroup = this.copy_VectorGroup

        Platform.clipboard.writeText(JSON.stringify(this.copy_VectorGroup))
    }
}

export class Command_PasteGeometry extends CommandBase {

    editData: Command_EditGeometry_EditData = null
    copy_Lines: VectorStroke[] = null

    prepareEditData(ctx: SubToolContext): boolean {

        if (!this.isAvailable(ctx)) {
            return false
        }

        this.editData = new Command_EditGeometry_EditData()
        this.editData.targetGroup = ctx.currentVectorGroup
        this.editData.oldLines = ctx.currentVectorGroup.lines
        this.editData.newLines = Lists.clone(ctx.currentVectorGroup.lines)

        // let copy_Lines: List<VectorLine> = JSON.parse(JSON.stringify(ctx.clipboard.copy_VectorGroup.lines))

        for (const line of this.copy_Lines) {

            line.isSelected = true

            for (const point of line.points) {

                point.isSelected = true
            }
        }

        Lists.addRange(this.editData.newLines, this.copy_Lines)

        return true
    }

    isAvailable(_ctx: SubToolContext): boolean { // @override

        // return (ctx.currentVectorGroup != null
        //     && ctx.clipboard.copy_VectorGroup != null)

        if (Platform.clipboard.availableFormats('clipboard') == null) {
            return false
        }

        try {

            const copy_group = JSON.parse(Platform.clipboard.readText('clipboard'))

            if (!copy_group || !copy_group.lines) {
                return false
            }

            this.copy_Lines = copy_group.lines
        }
        catch (e) {

            return false
        }

        return true
    }

    execute(ctx: SubToolContext) { // @override

        this.redo(ctx)
    }

    undo(_ctx: SubToolContext) { // @override

        this.editData.targetGroup.lines = this.editData.oldLines
    }

    redo(_ctx: SubToolContext) { // @override

        this.editData.targetGroup.lines = this.editData.newLines
    }
}
