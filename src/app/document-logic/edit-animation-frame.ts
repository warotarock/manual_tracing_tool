import {
  AnimatableDataObject, AnimationSettingData, AutoFillLayer, KeyframeDataObject, Layer, VectorLayer
} from '../document-data'
import { int, Lists } from '../common-logics'
import { ViewKeyframe } from '../view'

export class EditAnimationFrameLogic {

  static isAnimatableLayer(layer: Layer) {

    return (VectorLayer.isVectorLayerWithOwnData(layer) || AutoFillLayer.isAutoFillLayer(layer))
  }

  static findLastKeyframeDataIndex<T extends KeyframeDataObject>(keyframes: T[], targetFrame: int): int {

    let keyframeIndex = -1
    for (let index = 0; index < keyframes.length; index++) {

      const keyframe = keyframes[index]

      if (keyframe.frame > targetFrame) {
        break
      }

      keyframeIndex = index
    }

    return keyframeIndex
  }

  static findLastKeyframeData<T extends KeyframeDataObject>(keyframes: T[], targetFrame: int): T {

    const keyframeIndex = EditAnimationFrameLogic.findLastKeyframeDataIndex(keyframes, targetFrame)

    if (keyframeIndex == -1) {
      return null
    }

    return keyframes[keyframeIndex]
  }

  static moveKeyframeData(currentViewKeyframe: ViewKeyframe, previousKeyframe: ViewKeyframe, nextKeyframe: ViewKeyframe, moveForward: boolean): boolean {

    if (currentViewKeyframe == null) {
      return
    }

    let add_FrameTime = 1
    if (!moveForward) {
      add_FrameTime = -1
    }

    let newFrame = currentViewKeyframe.frame + add_FrameTime

    if (newFrame < 0) {
      newFrame = 0
    }

    if (add_FrameTime > 0 && nextKeyframe != null && newFrame >= nextKeyframe.frame) {
      newFrame = nextKeyframe.frame - 1
    }

    if (add_FrameTime < 0 && previousKeyframe != null && newFrame <= previousKeyframe.frame) {
      newFrame = previousKeyframe.frame + 1
    }

    if (currentViewKeyframe.frame != newFrame) {

      for (const viewKeyFrameLayer of currentViewKeyframe.layers) {

        if (viewKeyFrameLayer.hasKeyframe()) {

          if (viewKeyFrameLayer.vectorLayerKeyframe != null) {

            viewKeyFrameLayer.vectorLayerKeyframe.frame = newFrame
          }

          if (viewKeyFrameLayer.autoFillLayerKeyframe != null) {

            viewKeyFrameLayer.autoFillLayerKeyframe.frame = newFrame
          }
        }
      }

      currentViewKeyframe.frame = newFrame

      return true
    }

    return false
  }

  static processInsertKeyframeData<T extends AnimatableDataObject<G>, G extends KeyframeDataObject>(layer: T, targetFrame: int, createKeyframeFunc: (last_KeyFrame: G) => G): G[] {

    // Search index to insert and last keyframe
    const keyframeIndex = EditAnimationFrameLogic.findLastKeyframeDataIndex(layer.keyframes, targetFrame)

    if (keyframeIndex == -1) {
      return
    }

    const last_KeyFrame = layer.keyframes[keyframeIndex]

    if (last_KeyFrame.frame == targetFrame) {
      return
    }

    // Create keyframe and insert
    const newKeyframe = createKeyframeFunc(last_KeyFrame)
    newKeyframe.frame = targetFrame

    const newKeyFrames = Lists.clone(layer.keyframes)
    if (keyframeIndex + 1 < newKeyFrames.length) {

      Lists.insertAt(newKeyFrames, keyframeIndex + 1, newKeyframe)
    }
    else {

      newKeyFrames.push(newKeyframe)
    }

    return newKeyFrames
  }

  static changeAnimationMaxFrame(aniSetting: AnimationSettingData, moveForward: boolean) {

    let add_FrameTime = 1
    if (!moveForward) {
      add_FrameTime = -1
    }

    aniSetting.maxFrame += add_FrameTime

    if (aniSetting.maxFrame < 0) {
      aniSetting.maxFrame = 0
    }

    if (aniSetting.maxFrame > 10000) {
      aniSetting.maxFrame = 10000
    }
  }

  static changeLoopStartFrame(aniSetting: AnimationSettingData, moveForward: boolean) {

    let add_FrameTime = 1
    if (!moveForward) {
      add_FrameTime = -1
    }

    aniSetting.loopStartFrame += add_FrameTime

    if (aniSetting.loopStartFrame > aniSetting.loopEndFrame) {
      aniSetting.loopStartFrame = aniSetting.loopEndFrame
    }

    if (aniSetting.loopStartFrame < 0) {
      aniSetting.loopStartFrame = 0
    }
  }

  static changeLoopEndFrame(aniSetting: AnimationSettingData, moveForward: boolean) {

    let add_FrameTime = 1
    if (!moveForward) {
      add_FrameTime = -1
    }

    aniSetting.loopEndFrame += add_FrameTime

    if (aniSetting.loopEndFrame < aniSetting.loopStartFrame) {
      aniSetting.loopEndFrame = aniSetting.loopStartFrame
    }

    if (aniSetting.loopEndFrame < 0) {
      aniSetting.loopEndFrame = 0
    }
  }
}
