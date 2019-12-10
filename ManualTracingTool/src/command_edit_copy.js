var ManualTracingTool;
(function (ManualTracingTool) {
    class Command_EditGeometry_EditData {
        constructor() {
            this.targetGroup = null;
            this.oldLines = null;
            this.newLines = null;
        }
    }
    class Command_FilterGeometry extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.editDatas = null;
        }
        prepareEditData(env) {
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            let editDatas = new List();
            for (let viewKeyframeLayer of editableKeyframeLayers) {
                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                    let newLines = List();
                    for (let line of group.lines) {
                        if (!line.isSelected) {
                            continue;
                        }
                        let newLine = new ManualTracingTool.VectorLine();
                        for (let point of line.points) {
                            if (!point.isSelected) {
                                continue;
                            }
                            newLine.points.push(ManualTracingTool.LinePoint.clone(point));
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
        isAvailable(env) {
            return (this.editDatas != null);
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editData of this.editDatas) {
                editData.targetGroup.lines = editData.oldLines;
            }
        }
        redo(env) {
            for (let editData of this.editDatas) {
                editData.targetGroup.lines = editData.newLines;
            }
        }
    }
    ManualTracingTool.Command_FilterGeometry = Command_FilterGeometry;
    class Command_CopyGeometry extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.copy_VectorGroup = null;
        }
        prepareEditData(env) {
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            let copy_GroupData = new ManualTracingTool.VectorGroup();
            for (let viewKeyframeLayer of editableKeyframeLayers) {
                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                    for (let line of group.lines) {
                        if (!line.isSelected) {
                            continue;
                        }
                        let newLine = new ManualTracingTool.VectorLine();
                        for (let point of line.points) {
                            if (!point.isSelected) {
                                continue;
                            }
                            newLine.points.push(ManualTracingTool.LinePoint.clone(point));
                        }
                        if (newLine.points.length > 0) {
                            ManualTracingTool.Logic_Edit_Line.calculateParameters(newLine);
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
        isAvailable(env) {
            return (this.copy_VectorGroup != null);
        }
        execute(env) {
            // env.clipboard.copy_VectorGroup = this.copy_VectorGroup;
            Platform.clipboard.writeText(JSON.stringify(this.copy_VectorGroup));
        }
    }
    ManualTracingTool.Command_CopyGeometry = Command_CopyGeometry;
    class Command_PasteGeometry extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.editData = null;
            this.copy_Lines = null;
        }
        prepareEditData(env) {
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
        isAvailable(env) {
            // return (env.currentVectorGroup != null
            //     && env.clipboard.copy_VectorGroup != null);
            if (Platform.clipboard.availableFormats('clipboard') == null) {
                return false;
            }
            try {
                let copy_group = JSON.parse(Platform.clipboard.readText('clipboard'));
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
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            this.editData.targetGroup.lines = this.editData.oldLines;
            ManualTracingTool.GPUVertexBuffer.setUpdated(this.editData.targetGroup.buffer);
        }
        redo(env) {
            this.editData.targetGroup.lines = this.editData.newLines;
            ManualTracingTool.GPUVertexBuffer.setUpdated(this.editData.targetGroup.buffer);
        }
    }
    ManualTracingTool.Command_PasteGeometry = Command_PasteGeometry;
})(ManualTracingTool || (ManualTracingTool = {}));
