import { Lists } from "../logics/conversion"
import { Layer, VectorLayer, VectorKeyframe, VectorGeometry } from "../document_data"
import { CommandBase } from "../command/command"
import { SubToolContext } from "../context/subtool_context"

export class Command_Animation_InsertKeyframeAllLayer extends CommandBase {

  frame = 0
  rootLayer: Layer = null

  prepareEditData(ctx: SubToolContext): boolean {

    const layers: Layer[] = []
    Layer.collectLayerRecursive(layers, ctx.document.rootLayer)

    const targetFrame = this.frame

    for (const layer of layers) {

      if (!VectorLayer.isVectorLayerWithOwnData(layer)) {
        continue
      }

      const vectorLayer = <VectorLayer>layer

      // Search index to insert and last keyframe
      const keyframeIndex = VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame)

      if (keyframeIndex == -1) {
        continue
      }

      const last_KeyFrame = vectorLayer.keyframes[keyframeIndex]

      if (last_KeyFrame.frame == targetFrame) {
        continue
      }

      // Create keyframe and insert
      const newKeyframe = new VectorKeyframe()
      newKeyframe.frame = targetFrame
      if (last_KeyFrame != null) {

        newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry))
      }
      else {

        newKeyframe.geometry = new VectorGeometry()
      }

      const newKeyFrames = Lists.clone(vectorLayer.keyframes)
      if (keyframeIndex + 1 < newKeyFrames.length) {

        Lists.insertAt(newKeyFrames, keyframeIndex + 1, newKeyframe)
      }
      else {

        newKeyFrames.push(newKeyframe)
      }

      this.replaceReferenceRecursive(this.rootLayer, vectorLayer.keyframes, newKeyFrames)
    }

    return this.isAvailable(ctx)
  }

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return this.existsReplacedReference()
  }

  execute(ctx: SubToolContext) { // @override

    ctx.updateLayerStructure()
  }

  undo(ctx: SubToolContext) { // @override

    this.undoReplacedReferences()

    ctx.updateLayerStructure()
  }

  redo(ctx: SubToolContext) { // @override

    this.redoReplacedReferences()

    ctx.updateLayerStructure()
  }
}

export class Command_Animation_DeleteKeyframeAllLayer extends CommandBase {

  frame = 0
  rootLayer: Layer = null

  prepareEditData(ctx: SubToolContext): boolean {

    const layers: Layer[] = []
    Layer.collectLayerRecursive(layers, ctx.document.rootLayer)

    const targetFrame = this.frame

    for (const layer of layers) {

      if (!VectorLayer.isVectorLayerWithOwnData(layer)) {
        continue
      }

      const vectorLayer = <VectorLayer>layer

      // Search index to insert and last keyframe
      const keyframeIndex = VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame)

      if (keyframeIndex == -1) {
        continue
      }

      const last_KeyFrame = vectorLayer.keyframes[keyframeIndex]

      if (last_KeyFrame.frame != targetFrame) {
        continue
      }

      const newKeyFrames = Lists.clone(vectorLayer.keyframes)
      Lists.removeAt(newKeyFrames, keyframeIndex)

      this.replaceReferenceRecursive(this.rootLayer, vectorLayer.keyframes, newKeyFrames)
    }

    return this.isAvailable(ctx)
  }

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return this.existsReplacedReference()
  }

  execute(ctx: SubToolContext) { // @override

    ctx.updateLayerStructure()
  }

  undo(ctx: SubToolContext) { // @override

    this.undoReplacedReferences()

    ctx.updateLayerStructure()
  }

  redo(ctx: SubToolContext) { // @override

    this.redoReplacedReferences()

    ctx.updateLayerStructure()
  }
}
