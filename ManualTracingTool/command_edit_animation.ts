
namespace ManualTracingTool {

    class Command_Animation_InsertKeyframeAllLayer_EditData {

        layer: VectorLayer = null;
        oldKeyFrames: List<VectorLayerKeyFrame> = null;
        newKeyFrames: List<VectorLayerKeyFrame> = null;
    }

    export class Command_Animation_InsertKeyframeAllLayer extends CommandBase {

        frame = 0;

        editDatas = new List<Command_Animation_InsertKeyframeAllLayer_EditData>();

        isAvailable(env: ToolEnvironment): boolean { // @override

            return true;
        }

        execute(env: ToolEnvironment) { // @override

            let layers = new List<Layer>();
            Layer.collectLayerRecursive(layers, env.document.rootLayer);

            let targetFrame = this.frame;

            for (let layer of layers) {

                if (layer.type != LayerTypeID.vectorLayer) {
                    continue;
                }

                let vectorLayer = <VectorLayer>layer;

                // Search index to insert and last keyframe
                let existsKeyframe = false;
                let keyframeIndex = 0;
                let last_KeyFrame: VectorLayerKeyFrame = null;
                for (let index = 0; index < vectorLayer.keyframes.length; index++) {

                    let keyframe = vectorLayer.keyframes[index];

                    if (keyframe.frame == targetFrame) {

                        existsKeyframe = true;
                        break;
                    }

                    if (keyframe.frame > targetFrame) {
                        break;
                    }

                    keyframeIndex = index;
                    last_KeyFrame = keyframe;
                }

                if (existsKeyframe) {
                    continue;
                }

                // Crete keyframe and insert
                let newKeyframe = new VectorLayerKeyFrame();
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

                let editData = new Command_Animation_InsertKeyframeAllLayer_EditData();
                editData.layer = vectorLayer;
                editData.oldKeyFrames = vectorLayer.keyframes;
                editData.newKeyFrames = newKeyFrames;

                this.editDatas.push(editData);
            }

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
