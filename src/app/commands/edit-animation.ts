import { CommandBase } from "../command"
import { Lists } from "../common-logics"
import { SubToolContext } from "../context"
import { AutoFillLayer, AutoFillLayerKeyframe, Layer, VectorLayer, VectorLayerGeometry, VectorLayerKeyframe } from "../document-data"
import { EditAnimationFrameLogic, LayerLogic } from "../document-logic"

export class Command_Animation_InsertKeyframeAllLayer extends CommandBase {

  frame = 0
  rootLayer: Layer = null

  prepareEditData(ctx: SubToolContext): boolean {

    const layers = LayerLogic.collectLayers(ctx.documentData.rootLayer)

    const targetFrame = this.frame

    for (const layer of layers) {

      if (!EditAnimationFrameLogic.isAnimatableLayer(layer)) {
        continue
      }

      if (VectorLayer.isVectorLayer(layer)) {

        const vectorLayer = <VectorLayer>layer

        const newKeyframes = EditAnimationFrameLogic.processInsertKeyframeData<VectorLayer, VectorLayerKeyframe>(
          vectorLayer,
          targetFrame,
          (last_KeyFrame) => {
            const newKeyframe = new VectorLayerKeyframe(VectorLayerGeometry.getGeometryTypeForLayer(layer))
            newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry))
            return newKeyframe
          }
        )

        this.refferenceUpdate.set(this.rootLayer, vectorLayer.keyframes, newKeyframes)
      }
      else if (AutoFillLayer.isAutoFillLayer(layer)) {

        const autoFillLayer = <AutoFillLayer>layer

        const newKeyframes = EditAnimationFrameLogic.processInsertKeyframeData<AutoFillLayer, AutoFillLayerKeyframe>(
          autoFillLayer,
          targetFrame,
          (last_KeyFrame) => {
            const newKeyframe = new AutoFillLayerKeyframe()
            newKeyframe.groups = JSON.parse(JSON.stringify(last_KeyFrame.groups))
            newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry))
            return newKeyframe
          }
        )

        this.refferenceUpdate.set(this.rootLayer, autoFillLayer.keyframes, newKeyframes)
      }
    }

    return this.isAvailable(ctx)
  }

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return this.refferenceUpdate.existsReplacedReference()
  }

  execute(ctx: SubToolContext) { // @override

    ctx.updateLayerStructure()
  }

  undo(ctx: SubToolContext) { // @override

    this.refferenceUpdate.undoReplacedReferences()

    ctx.updateLayerStructure()
  }

  redo(ctx: SubToolContext) { // @override

    this.refferenceUpdate.redoReplacedReferences()

    ctx.updateLayerStructure()
  }
}

export class Command_Animation_DeleteKeyframeAllLayer extends CommandBase {

  frame = 0
  rootLayer: Layer = null

  prepareEditData(ctx: SubToolContext): boolean {

    const layers = LayerLogic.collectLayers(ctx.documentData.rootLayer)

    const targetFrame = this.frame

    for (const layer of layers) {

      if (!VectorLayer.isVectorLayerWithOwnData(layer)) {
        continue
      }

      const vectorLayer = <VectorLayer>layer

      // Search index to insert and last keyframe
      const keyframeIndex = EditAnimationFrameLogic.findLastKeyframeDataIndex(vectorLayer.keyframes, targetFrame)

      if (keyframeIndex == -1) {
        continue
      }

      const last_KeyFrame = vectorLayer.keyframes[keyframeIndex]

      if (last_KeyFrame.frame != targetFrame) {
        continue
      }

      const newKeyFrames = Lists.clone(vectorLayer.keyframes)
      Lists.removeAt(newKeyFrames, keyframeIndex)

      this.refferenceUpdate.set(this.rootLayer, vectorLayer.keyframes, newKeyFrames)
    }

    return this.isAvailable(ctx)
  }

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return this.refferenceUpdate.existsReplacedReference()
  }

  execute(ctx: SubToolContext) { // @override

    ctx.updateLayerStructure()
  }

  undo(ctx: SubToolContext) { // @override

    this.refferenceUpdate.undoReplacedReferences()

    ctx.updateLayerStructure()
  }

  redo(ctx: SubToolContext) { // @override

    this.refferenceUpdate.redoReplacedReferences()

    ctx.updateLayerStructure()
  }
}
