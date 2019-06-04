
namespace ManualTracingTool {

    class Command_EditGeometry_EditData {

        targetGroup: VectorGroup = null;
        oldLines: List<VectorLine> = null;
        newLines: List<VectorLine> = null;
    }

    export class Command_FilterGeometry extends CommandBase {

        editDatas: List<Command_EditGeometry_EditData> = null;

        prepareEditData(env: ToolEnvironment): boolean {

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            let editDatas = new List<Command_EditGeometry_EditData>();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    let newLines = List<VectorLine>();

                    for (let line of group.lines) {

                        if (!line.isSelected) {
                            continue;
                        }

                        let newLine = new VectorLine();

                        for (let point of line.points) {

                            if (!point.isSelected) {
                                continue;
                            }

                            newLine.points.push(LinePoint.clone(point));
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
                    }
                }
            }

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

        copy_VectorGroup: VectorGroup = null;

        prepareEditData(env: ToolEnvironment): boolean {

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            let copy_GroupData = new VectorGroup();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        if (!line.isSelected) {
                            continue;
                        }

                        let newLine = new VectorLine();

                        for (let point of line.points) {

                            if (!point.isSelected) {
                                continue;
                            }

                            newLine.points.push(LinePoint.clone(point));
                        }

                        if (newLine.points.length > 0) {

                            copy_GroupData.lines.push(newLine);
                        }
                    }
                }
            }

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

            env.clipboard.copy_VectorGroup = this.copy_VectorGroup;
        }
    }

    export class Command_PasteGeometry extends CommandBase {

        editData: Command_EditGeometry_EditData = null;

        prepareEditData(env: ToolEnvironment): boolean {

            if (!this.isAvailable(env)) {
                return false;
            }

            this.editData = new Command_EditGeometry_EditData();
            this.editData.targetGroup = env.currentVectorGroup;
            this.editData.oldLines = env.currentVectorGroup.lines;
            this.editData.newLines = ListClone(env.currentVectorGroup.lines);

            let copy_Lines: List<VectorLine> = JSON.parse(JSON.stringify(env.clipboard.copy_VectorGroup.lines));

            for (let line of copy_Lines) {

                line.isSelected = true;

                for (let point of line.points) {

                    point.isSelected = true;
                }
            }

            ListAddRange(this.editData.newLines, copy_Lines);

            return true;
        }

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (env.currentVectorGroup != null
                && env.clipboard.copy_VectorGroup != null);
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
}
