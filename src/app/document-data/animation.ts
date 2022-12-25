export enum OnionSkinMode {
  none = 0,
  disabled = 1,
  showOnTopLayer = 2,
  showOnLowestLayer = 3,
}

export class AnimationSettingData {

  static readonly MAX_ONION_SIKIN_FRAMES = 5

  animationFrameParSecond = 24
  loopStartFrame = 0
  loopEndFrame = 24
  maxFrame = 24

  onionSkinMode = OnionSkinMode.disabled
  onionSkinBackwardLevel = 1
  onionSkinForwardLevel = 1

  currentTimeFrame = 0.0

  timeLineWindowScale = 1.0
  timeLineWindowScaleMax = 10.0
  timeLineWindowViewLocationX = 0.0
}
