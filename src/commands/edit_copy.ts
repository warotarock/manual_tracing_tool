import { List, ListClone, ListAddRange } from "../base/conversion";
import { VectorStrokeGroup, VectorStroke, VectorPoint } from "../base/data";
import { CommandBase } from "../base/command";
import { ToolEnvironment, ViewKeyframeLayer } from "../base/tool";
import { Logic_Edit_Line } from "../logics/edit_vector_layer";
import { Platform } from "../platform/platform";

interface Clipboard {

    writeText(text: string, type: string);
    readText(key: string): string;
    availableFormats(type: string): string;
}


class Command_EditGeometry_EditData {

    targetGroup: VectorStrokeGroup = null;
    oldLines: List<VectorStroke> = null;
    newLines: List<VectorStroke> = null;
}

export class Command_FilterGeometry extends CommandBase {

    editDatas: List<Command_EditGeometry_EditData> = null;

    prepareEditData(env: ToolEnvironment): boolean {

        this.useGroups();

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        let editDatas = new List<Command_EditGeometry_EditData>();

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            let newLines = List<VectorStroke>();

            for (let line of group.lines) {

                if (!line.isSelected) {
                    continue;
                }

                let newLine = new VectorStroke();

                for (let point of line.points) {

                    if (!point.isSelected) {
                        continue;
                    }

                    newLine.points.push(VectorPoint.clone(point));
                }

                if (newLine.points.length > 0) {

                    newLines.push(newLine);
                }
            }

            if (newLines.length > 0) {

                let editData = new Command_EditGeometry_EditData();
                editData.targetGroup = group;
                editData.newLines = newLines;
                editData.oldLines = group.lines;

                editDatas.push(editData);

                this.targetGroups.push(group);
            }
        });

        if (editDatas.length > 0) {

            this.editDatas = editDatas;
            return true;
        }
        else {

            return false;
        }
    }

    isAvailable(env: ToolEnvironment): boolean { // @override

        return (this.editDatas != null);
    }

    execute(env: ToolEnvironment) { // @override

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        for (let editData of this.editDatas) {

            editData.targetGroup.lines = editData.oldLines;
        }
    }

    redo(env: ToolEnvironment) { // @override

        for (let editData of this.editDatas) {

            editData.targetGroup.lines = editData.newLines;
        }
    }
}

export class Command_CopyGeometry extends CommandBase {

    copy_VectorGroup: VectorStrokeGroup = null;

    prepareEditData(env: ToolEnvironment): boolean {

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        let copy_GroupData = new VectorStrokeGroup();

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (let line of group.lines) {

                if (!line.isSelected) {
                    continue;
                }

                let newLine = new VectorStroke();

                for (let point of line.points) {

                    if (!point.isSelected) {
                        continue;
                    }

                    newLine.points.push(VectorPoint.clone(point));
                }

                if (newLine.points.length > 0) {

                    Logic_Edit_Line.calculateParameters(newLine);

                    copy_GroupData.lines.push(newLine);
                }
            }
        });

        if (copy_GroupData.lines.length > 0) {

            this.copy_VectorGroup = copy_GroupData;
            return true;
        }
        else {

            return false;
        }
    }

    isAvailable(env: ToolEnvironment): boolean { // @override

        return (this.copy_VectorGroup != null);
    }

    execute(env: ToolEnvironment) { // @override

        // env.clipboard.copy_VectorGroup = this.copy_VectorGroup;

        Platform.clipboard.writeText(JSON.stringify(this.copy_VectorGroup));
    }
}

export class Command_PasteGeometry extends CommandBase {

    editData: Command_EditGeometry_EditData = null;
    copy_Lines: List<VectorStroke> = null;

    prepareEditData(env: ToolEnvironment): boolean {

        if (!this.isAvailable(env)) {
            return false;
        }

        this.editData = new Command_EditGeometry_EditData();
        this.editData.targetGroup = env.currentVectorGroup;
        this.editData.oldLines = env.currentVectorGroup.lines;
        this.editData.newLines = ListClone(env.currentVectorGroup.lines);

        // let copy_Lines: List<VectorLine> = JSON.parse(JSON.stringify(env.clipboard.copy_VectorGroup.lines));

        for (let line of this.copy_Lines) {

            line.isSelected = true;

            for (let point of line.points) {

                point.isSelected = true;
            }
        }

        ListAddRange(this.editData.newLines, this.copy_Lines);

        return true;
    }

    isAvailable(env: ToolEnvironment): boolean { // @override

        // return (env.currentVectorGroup != null
        //     && env.clipboard.copy_VectorGroup != null);

        if (Platform.clipboard.availableFormats('clipboard') == null) {
            return false;
        }

        try {

            let copy_group = JSON.parse(Platform.clipboard.readText('clipboard'))

            if (!copy_group || !copy_group.lines) {
                return false;
            }

            this.copy_Lines = copy_group.lines;
        }
        catch (e) {

            return false;
        }

        return true;
    }

    execute(env: ToolEnvironment) { // @override

        this.redo(env);
    }

    undo(env: ToolEnvironment) { // @override

        this.editData.targetGroup.lines = this.editData.oldLines;
    }

    redo(env: ToolEnvironment) { // @override

        this.editData.targetGroup.lines = this.editData.newLines;
    }
}
