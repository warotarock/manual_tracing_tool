import { List, ListClone, ListInsertAt, ListRemoveAt } from "../base/conversion";
import { CommandBase } from "../base/command";
import { ToolEnvironment } from "../base/tool";
import { VectorLayer, VectorKeyframe, Layer, VectorGeometry } from "../base/data";

export class Command_Animation_InsertKeyframeAllLayer extends CommandBase {

  frame = 0;
  rootLayer: Layer = null;

  prepareEditData(env: ToolEnvironment): boolean {

    var layers = new List<Layer>();
    Layer.collectLayerRecursive(layers, env.document.rootLayer);

    let targetFrame = this.frame;

    for (let layer of layers) {

      if (!VectorLayer.isVectorLayerWithOwnData(layer)) {
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
      let newKeyframe = new VectorKeyframe();
      newKeyframe.frame = targetFrame;
      if (last_KeyFrame != null) {

        newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry));
      }
      else {

        newKeyframe.geometry = new VectorGeometry();
      }

      let newKeyFrames = ListClone(vectorLayer.keyframes);
      if (keyframeIndex + 1 < newKeyFrames.length) {

        ListInsertAt(newKeyFrames, keyframeIndex + 1, newKeyframe);
      }
      else {

        newKeyFrames.push(newKeyframe);
      }

      this.replaceReferenceRecursive(this.rootLayer, vectorLayer.keyframes, newKeyFrames);
    }

    return this.isAvailable(env);
  }

  isAvailable(env: ToolEnvironment): boolean { // @override

    return this.existsReplacedReference();
  }

  execute(env: ToolEnvironment) { // @override

    env.updateLayerStructure();
  }

  undo(env: ToolEnvironment) { // @override

    this.undoReplacedReferences();

    env.updateLayerStructure();
  }

  redo(env: ToolEnvironment) { // @override

    this.redoReplacedReferences();

    env.updateLayerStructure();
  }
}

export class Command_Animation_DeleteKeyframeAllLayer extends CommandBase {

  frame = 0;
  rootLayer: Layer = null;

  prepareEditData(env: ToolEnvironment): boolean {

    var layers = new List<Layer>();
    Layer.collectLayerRecursive(layers, env.document.rootLayer);

    let targetFrame = this.frame;

    for (let layer of layers) {

      if (!VectorLayer.isVectorLayerWithOwnData(layer)) {
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

      this.replaceReferenceRecursive(this.rootLayer, vectorLayer.keyframes, newKeyFrames);
    }

    return this.isAvailable(env);
  }

  isAvailable(env: ToolEnvironment): boolean { // @override

    return this.existsReplacedReference();
  }

  execute(env: ToolEnvironment) { // @override

    env.updateLayerStructure();
  }

  undo(env: ToolEnvironment) { // @override

    this.undoReplacedReferences();

    env.updateLayerStructure();
  }

  redo(env: ToolEnvironment) { // @override

    this.redoReplacedReferences();

    env.updateLayerStructure();
  }
}
