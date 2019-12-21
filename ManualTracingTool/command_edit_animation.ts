
namespace ManualTracingTool {

    class Command_Animation_KeyframeListEditData {

        layer: VectorLayer = null;
        oldKeyFrames: List<VectorLayerKeyframe> = null;
        newKeyFrames: List<VectorLayerKeyframe> = null;
    }

    export class Command_Animation_InsertKeyframeAllLayer extends CommandBase {

        frame = 0;

        editDatas = new List<Command_Animation_KeyframeListEditData>();

        prepareEditData(env: ToolEnvironment): boolean {

            var layers = new List<Layer>();
            Layer.collectLayerRecursive(layers, env.document.rootLayer);

            let targetFrame = this.frame;

            for (let layer of layers) {

                if (layer.type != LayerTypeID.vectorLayer) {
                    continue;
                }

                let vectorLayer = <VectorLayer>layer;

                // Search index to insert and last keyframe
                let keyframeIndex = VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame);

                if (keyframeIndex == -1) {
                    continue;
                }

                let last_KeyFrame = vectorLayer.keyframes[keyframeIndex];

                if (last_KeyFrame.frame == targetFrame) {
                    continue;
                }

                // Create keyframe and insert
                let newKeyframe = new VectorLayerKeyframe();
                newKeyframe.frame = targetFrame;
                if (last_KeyFrame != null) {
                    newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry));
                }
                else {
                    newKeyframe.geometry = new VectorLayerGeometry();
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

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (this.editDatas.length > 0);
        }

        protected execute(env: ToolEnvironment) { // @override

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editData of this.editDatas) {

                editData.layer.keyframes = editData.oldKeyFrames;
            }

            env.updateLayerStructure();
        }

        redo(env: ToolEnvironment) { // @override

            for (let editData of this.editDatas) {

                editData.layer.keyframes = editData.newKeyFrames;
            }

            env.updateLayerStructure();
        }
    }

    export class Command_Animation_DeleteKeyframeAllLayer extends CommandBase {

        frame = 0;

        editDatas = new List<Command_Animation_KeyframeListEditData>();

        prepareEditData(env: ToolEnvironment): boolean {

            var layers = new List<Layer>();
            Layer.collectLayerRecursive(layers, env.document.rootLayer);

            let targetFrame = this.frame;

            for (let layer of layers) {

                if (layer.type != LayerTypeID.vectorLayer) {
                    continue;
                }

                let vectorLayer = <VectorLayer>layer;

                // Search index to insert and last keyframe
                let keyframeIndex = VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame);

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

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (this.editDatas.length > 0);
        }

        protected execute(env: ToolEnvironment) { // @override

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editData of this.editDatas) {

                editData.layer.keyframes = editData.oldKeyFrames;
            }

            env.updateLayerStructure();
        }

        redo(env: ToolEnvironment) { // @override

            for (let editData of this.editDatas) {

                editData.layer.keyframes = editData.newKeyFrames;
            }

            env.updateLayerStructure();
        }
    }
}
