var ManualTracingTool;
(function (ManualTracingTool) {
    class Command_Animation_KeyframeListEditData {
        constructor() {
            this.layer = null;
            this.oldKeyFrames = null;
            this.newKeyFrames = null;
        }
    }
    class Command_Animation_InsertKeyframeAllLayer extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.frame = 0;
            this.editDatas = new List();
        }
        prepareEditData(env) {
            var layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, env.document.rootLayer);
            let targetFrame = this.frame;
            for (let layer of layers) {
                if (layer.type != ManualTracingTool.LayerTypeID.vectorLayer) {
                    continue;
                }
                let vectorLayer = layer;
                // Search index to insert and last keyframe
                let keyframeIndex = ManualTracingTool.VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame);
                if (keyframeIndex == -1) {
                    continue;
                }
                let last_KeyFrame = vectorLayer.keyframes[keyframeIndex];
                if (last_KeyFrame.frame == targetFrame) {
                    continue;
                }
                // Create keyframe and insert
                let newKeyframe = new ManualTracingTool.VectorLayerKeyframe();
                newKeyframe.frame = targetFrame;
                if (last_KeyFrame != null) {
                    newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry));
                }
                else {
                    newKeyframe.geometry = new ManualTracingTool.VectorLayerGeometry();
                }
                let newKeyFrames = ListClone(vectorLayer.keyframes);
                if (keyframeIndex + 1 < newKeyFrames.length) {
                    ListInsertAt(newKeyFrames, keyframeIndex + 1, newKeyframe);
                }
                else {
                    newKeyFrames.push(newKeyframe);
                }
                let editData = new Command_Animation_KeyframeListEditData();
                editData.layer = vectorLayer;
                editData.oldKeyFrames = vectorLayer.keyframes;
                editData.newKeyFrames = newKeyFrames;
                this.editDatas.push(editData);
            }
            return this.isAvailable(env);
        }
        isAvailable(env) {
            return (this.editDatas.length > 0);
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editData of this.editDatas) {
                editData.layer.keyframes = editData.oldKeyFrames;
            }
            env.updateLayerStructure();
        }
        redo(env) {
            for (let editData of this.editDatas) {
                editData.layer.keyframes = editData.newKeyFrames;
            }
            env.updateLayerStructure();
        }
    }
    ManualTracingTool.Command_Animation_InsertKeyframeAllLayer = Command_Animation_InsertKeyframeAllLayer;
    class Command_Animation_DeleteKeyframeAllLayer extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.frame = 0;
            this.editDatas = new List();
        }
        prepareEditData(env) {
            var layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, env.document.rootLayer);
            let targetFrame = this.frame;
            for (let layer of layers) {
                if (layer.type != ManualTracingTool.LayerTypeID.vectorLayer) {
                    continue;
                }
                let vectorLayer = layer;
                // Search index to insert and last keyframe
                let keyframeIndex = ManualTracingTool.VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame);
                if (keyframeIndex == -1) {
                    continue;
                }
                let last_KeyFrame = vectorLayer.keyframes[keyframeIndex];
                if (last_KeyFrame.frame != targetFrame) {
                    continue;
                }
                let newKeyFrames = ListClone(vectorLayer.keyframes);
                ListRemoveAt(newKeyFrames, keyframeIndex);
                let editData = new Command_Animation_KeyframeListEditData();
                editData.layer = vectorLayer;
                editData.oldKeyFrames = vectorLayer.keyframes;
                editData.newKeyFrames = newKeyFrames;
                this.editDatas.push(editData);
            }
            return this.isAvailable(env);
        }
        isAvailable(env) {
            return (this.editDatas.length > 0);
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editData of this.editDatas) {
                editData.layer.keyframes = editData.oldKeyFrames;
            }
            env.updateLayerStructure();
        }
        redo(env) {
            for (let editData of this.editDatas) {
                editData.layer.keyframes = editData.newKeyFrames;
            }
            env.updateLayerStructure();
        }
    }
    ManualTracingTool.Command_Animation_DeleteKeyframeAllLayer = Command_Animation_DeleteKeyframeAllLayer;
})(ManualTracingTool || (ManualTracingTool = {}));
