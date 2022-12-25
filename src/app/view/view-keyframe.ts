import { DocumentContext } from '../context'
import { Layer, VectorLayerGeometry, VectorLayerKeyframe, VectorLayer, VectorStrokeGroup, AutoFillLayerKeyframe, AutoFillLayer, KeyframeDataObject, AnimatableLayer } from '../document-data'
import { EditAnimationFrameLogic, LayerLogic } from '../document-logic'
import { int } from '../common-logics'

export class ViewKeyframeLayer {

  layer: Layer = null
  keyframe: KeyframeDataObject = null
  vectorLayerKeyframe: VectorLayerKeyframe = null
  autoFillLayerKeyframe: AutoFillLayerKeyframe = null
  hasActualFrame = false

  hasKeyframe(): boolean {

    return (this.keyframe != null)
  }

  static forEachStrokeGroup(viewKeyframeLayers: ViewKeyframeLayer[], loopBodyFunction: (group: VectorStrokeGroup, layer?: VectorLayer) => void) {

    for (const viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue
      }

      for (const unit of viewKeyframeLayer.vectorLayerKeyframe.geometry.units) {

        for (const group of unit.groups) {

          loopBodyFunction(group, <VectorLayer>viewKeyframeLayer.layer)
        }
      }
    }
  }

  static forEachVectorGeometry(viewKeyframeLayers: ViewKeyframeLayer[], loopBodyFunction: (geometry: VectorLayerGeometry, layer?: VectorLayer) => void) {

    for (const viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue
      }

      loopBodyFunction(viewKeyframeLayer.vectorLayerKeyframe.geometry, <VectorLayer>viewKeyframeLayer.layer)
    }
  }
}

export class ViewKeyframe {

  frame = 0
  layers: ViewKeyframeLayer[] = []

  static findViewKeyframe(viewKeyframes: ViewKeyframe[], frame: int): ViewKeyframe {

    const keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, frame)

    if (keyframeIndex != -1) {

      return viewKeyframes[keyframeIndex]
    }
    else {

      return null
    }
  }

  static findViewKeyframeIndex(viewKeyframes: ViewKeyframe[], frame: int): int {

    let resultIndex = 0

    for (let index = 0; index < viewKeyframes.length; index++) {

      if (viewKeyframes[index].frame > frame) {
        break
      }

      resultIndex = index
    }

    return resultIndex
  }

  static findViewKeyframeLayerIndex(viewKeyFrame: ViewKeyframe, layer: Layer): int {

    for (let index = 0; index < viewKeyFrame.layers.length; index++) {

      if (viewKeyFrame.layers[index].layer == layer) {

        return index
      }
    }

    return -1
  }

  static findViewKeyframeLayer(viewKeyFrame: ViewKeyframe, layer: Layer): ViewKeyframeLayer {

    const index = this.findViewKeyframeLayerIndex(viewKeyFrame, layer)

    if (index != -1) {

      return viewKeyFrame.layers[index]
    }
    else {

      return null
    }
  }
}

export class ViewKeyframeLogic {

  collectViewKeyframesToContext(docContext: DocumentContext) {

    // Collects layers

    const layers = LayerLogic.collectLayers(docContext.documentData.rootLayer)

    // Creates all view-keyframes.

    const viewKeyFrames = this.collectKeyframes(layers)

    // Collects layers for each view-keyframes

    this.updateViewKeyframesForLayerReferences(viewKeyFrames, layers)

    docContext.keyframes = viewKeyFrames

    this.updateContextForViewKeyframeReferences(docContext, docContext.documentData.animationSettingData.currentTimeFrame)
  }

  updateContextForViewKeyframeReferences(docContext: DocumentContext, frame: int): boolean {

    const viewKeyframes = docContext.keyframes

    const keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, frame)

    if (keyframeIndex == -1) {
      return false
    }

    const last_currentViewKeyframe = docContext.currentViewKeyframe
    const last_previousKeyframe = docContext.previousKeyframe
    const last_nextKeyframe = docContext.nextKeyframe

    docContext.currentViewKeyframe = viewKeyframes[keyframeIndex]

    if (keyframeIndex - 1 >= 0) {

      docContext.previousKeyframe = viewKeyframes[keyframeIndex - 1]
    }
    else {

      docContext.previousKeyframe = null
    }

    if (keyframeIndex + 1 < viewKeyframes.length) {

      docContext.nextKeyframe = viewKeyframes[keyframeIndex + 1]
    }
    else {

      docContext.nextKeyframe = null
    }

    return (
      docContext.currentViewKeyframe != last_currentViewKeyframe
      || docContext.previousKeyframe != last_previousKeyframe
      || docContext.nextKeyframe != last_nextKeyframe
    )
  }

  private collectKeyframes(layers: Layer[]): ViewKeyframe[] {

    const viewKeyFrames: ViewKeyframe[] = []

    const keyframeDictionary = new Map<string, boolean>()

    for (const layer of layers) {

      if (EditAnimationFrameLogic.isAnimatableLayer(layer)) {

        const animatableLayer = <AnimatableLayer>(layer)

        this.registerKeyframes(viewKeyFrames, keyframeDictionary, animatableLayer.keyframes)
      }
    }

    const result = viewKeyFrames.sort((a, b) => { return a.frame - b.frame })

    return result
  }

  private registerKeyframes<T extends KeyframeDataObject>(
    viewKeyFrames: ViewKeyframe[],
    keyframeDictionary: Map<string, boolean>,
    keyframes: T[]
  ) {

    for (const keyframe of keyframes) {

      const frameText = keyframe.frame.toString()

      if (!keyframeDictionary.has(frameText)) {

        const viewKeyframe = new ViewKeyframe()
        viewKeyframe.frame = keyframe.frame
        viewKeyFrames.push(viewKeyframe)

        keyframeDictionary.set(frameText,  true)
      }
    }
  }

  private updateViewKeyframesForLayerReferences(viewKeyframes: ViewKeyframe[], layers: Layer[]) {

    // All view-keyframes contains view-layer info for all layer.

    for (const viewKeyframe of viewKeyframes) {

      for (const layer of layers) {

        const keyframeLayer = new ViewKeyframeLayer()
        keyframeLayer.layer = layer

        if (EditAnimationFrameLogic.isAnimatableLayer(layer)) {

          if (VectorLayer.isVectorLayer(layer)) {

            const vectorLayer = <VectorLayer>layer

            let max_KeyFrame = EditAnimationFrameLogic.findLastKeyframeData(vectorLayer.keyframes, viewKeyframe.frame)

            if (max_KeyFrame == null) {

              throw new Error('ERROR-0071:The document contains a layer that has no keyframe.')
            }

            keyframeLayer.keyframe = max_KeyFrame
            keyframeLayer.vectorLayerKeyframe = max_KeyFrame
          }
          else if (AutoFillLayer.isAutoFillLayer(layer)) {

            const autoFillLayer = <AutoFillLayer>layer

            let max_KeyFrame = EditAnimationFrameLogic.findLastKeyframeData(autoFillLayer.keyframes, viewKeyframe.frame)

            if (max_KeyFrame == null) {

              throw new Error('ERROR-0071:The document contains a layer that has no keyframe.')
            }

            keyframeLayer.keyframe = max_KeyFrame
            keyframeLayer.autoFillLayerKeyframe = max_KeyFrame
          }

          keyframeLayer.hasActualFrame = (keyframeLayer.keyframe.frame == viewKeyframe.frame)
        }

        viewKeyframe.layers.push(keyframeLayer)
      }
    }
  }

  findNextViewKeyframeIndex(docContext: DocumentContext, startFrame: int, searchDirection: int): int {

    const viewKeyframes = docContext.keyframes

    const startKeyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, startFrame)

    if (startKeyframeIndex == -1) {
      return -1
    }

    const resultIndex = startKeyframeIndex + searchDirection

    if (resultIndex < 0) {

      return 0
    }

    if (resultIndex >= viewKeyframes.length) {

      return viewKeyframes.length - 1
    }

    return resultIndex
  }

  findNextViewKeyframeFrame(docContext: DocumentContext, startFrame: int, searchDirection: int): int {

    const keyframeIndex = this.findNextViewKeyframeIndex(docContext, startFrame, searchDirection)

    if (keyframeIndex == -1) {

      return -1
    }
    else {

      return docContext.keyframes[keyframeIndex].frame
    }
  }

  collectVectorViewKeyframeLayersForEdit(currentViewKeyframe: ViewKeyframe, editTargetOnly = false): ViewKeyframeLayer[] {

    const editableKeyframeLayers: ViewKeyframeLayer[] = []

    // Collects layers

    if (currentViewKeyframe == null) {

      return editableKeyframeLayers
    }

    for (const viewKeyframeLayer of currentViewKeyframe.layers) {

      const layer = viewKeyframeLayer.layer

      if (!VectorLayer.isVectorLayer(layer)) {
        continue
      }

      if (editTargetOnly && !Layer.isEditTarget(layer)) {
        continue
      }

      editableKeyframeLayers.push(viewKeyframeLayer)
    }

    return editableKeyframeLayers
  }
}
