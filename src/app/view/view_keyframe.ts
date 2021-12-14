import { int } from '../logics/conversion'
import { DocumentData, Layer, VectorGeometry, VectorKeyframe, VectorLayer, VectorStrokeGroup } from '../document_data'
import { DocumentContext } from '../context/document_context'

export class ViewKeyframeLayer {

  layer: Layer = null
  vectorLayerKeyframe: VectorKeyframe = null

  hasKeyframe(): boolean {

    return (this.vectorLayerKeyframe != null)
  }

  static forEachGroup(viewKeyframeLayers: ViewKeyframeLayer[], loopBodyFunction: (group: VectorStrokeGroup, vectorLayer?: VectorLayer) => void) {

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

  static forEachGeometry(viewKeyframeLayers: ViewKeyframeLayer[], loopBodyFunction: (geometry: VectorGeometry) => void) {

    for (const viewKeyframeLayer of viewKeyframeLayers) {

      if (viewKeyframeLayer.vectorLayerKeyframe == null) {
        continue
      }

      loopBodyFunction(viewKeyframeLayer.vectorLayerKeyframe.geometry)
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

  collectViewKeyframeContext(docContext: DocumentContext, documentData: DocumentData) {

    // Collects layers

    const layers: Layer[] = []
    Layer.collectLayerRecursive(layers, documentData.rootLayer)

    // Creates all view-keyframes.

    const viewKeyFrames = this.collectKeyframes(layers)

    // Collects layers for each view-keyframes

    this.setKeyframeLayers(viewKeyFrames, layers)

    docContext.keyframes = viewKeyFrames
  }

  private collectKeyframes(layers: Layer[]) {

    const viewKeyFrames: ViewKeyframe[] = []

    const keyframeDictionary = new Map<string, boolean>()

    for (const layer of layers) {

      if (VectorLayer.isVectorLayer(layer)) {

        const vectorLayer = <VectorLayer>(layer)

        for (const keyframe of vectorLayer.keyframes) {

          const frameText = keyframe.frame.toString()

          if (!keyframeDictionary.has(frameText)) {

            const viewKeyframe = new ViewKeyframe()
            viewKeyframe.frame = keyframe.frame
            viewKeyFrames.push(viewKeyframe)

            keyframeDictionary.set(frameText,  true)
          }
        }
      }
    }

    const result = viewKeyFrames.sort((a, b) => { return a.frame - b.frame })

    return result
  }

  private setKeyframeLayers(target: ViewKeyframe[], layers: Layer[]) {

    // All view-keyframes contains view-layer info for all layer.

    for (const viewKeyframe of target) {

      for (const layer of layers) {

        const keyframeLayer = new ViewKeyframeLayer()
        keyframeLayer.layer = layer

        if (VectorLayer.isVectorLayer(layer)) {

          const vectorLayer = <VectorLayer>layer

          let max_KeyFrame: VectorKeyframe = null
          for (const keyframe of vectorLayer.keyframes) {

            if (keyframe.frame > viewKeyframe.frame) {
              break
            }

            max_KeyFrame = keyframe
          }

          if (max_KeyFrame == null) {

            throw new Error('ERROR-0071:The document contains a layer that has no keyframe.')
          }

          keyframeLayer.vectorLayerKeyframe = max_KeyFrame
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
