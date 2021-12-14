import { float, int } from '../logics/conversion'
import { AnimationSettingData, DocumentData, VectorLayer } from '../document_data'
import { ToolDrawingStyle } from "../drawing/drawing_style"
import { ImageResource } from '../posing3d/posing3d_view'
import { CanvasRender } from '../render/render2d'
import { ViewKeyframe } from '../view/view_keyframe'
import { PointerInputWindow } from '../view/pointer_input'

export class TimeLineWindow extends PointerInputWindow {

  canvasRender: CanvasRender = null
  drawStyle: ToolDrawingStyle = null
  systemImage: ImageResource = null

  leftPanelWidth = 100.0
  frameUnitWidth = 8.0

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, systemImage: ImageResource) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.systemImage = systemImage
  }

  getFrameUnitWidth(aniSetting: AnimationSettingData): float {

    return this.frameUnitWidth * aniSetting.timeLineWindowScale
  }

  getTimeLineLeft(): float {

    return this.leftPanelWidth
  }

  getTimeLineRight(): float {

    return this.getTimeLineLeft() + this.width - 1
  }

  getFrameByLocation(x: float, aniSetting: AnimationSettingData): int {

    const left = this.getTimeLineLeft()
    const right = this.getTimeLineRight()

    if (x < left) {
      return -1
    }

    if (x > right) {
      return -1
    }

    const frameUnitWidth = this.getFrameUnitWidth(aniSetting)

    const absoluteX = x - (left - aniSetting.timeLineWindowViewLocationX)

    let frame = Math.floor(absoluteX / frameUnitWidth)
    if (frame < 0) {
      frame = 0
    }

    return frame
  }

  getFrameLocation(frame: float, aniSetting: AnimationSettingData) {

    const left = this.getTimeLineLeft()
    const frameUnitWidth = this.getFrameUnitWidth(aniSetting)
    const x = left - aniSetting.timeLineWindowViewLocationX + frame * frameUnitWidth

    return x
  }

  drawCommandButton(wnd: TimeLineWindow, animationPlaying: boolean) {

    // Play / Stop
    {
      let srcX = 0
      const srcY = 196
      const srcW = 128
      const srcH = 128
      const dstW = 45
      const dstH = 45
      const dstX = wnd.getTimeLineLeft() / 2 - dstW / 2 + 1
      const dstY = wnd.height / 2 - dstH / 2 + 1

      if (animationPlaying) {

        srcX = 128
      }

      this.canvasRender.drawImage(wnd.systemImage.image.imageData, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH)
    }
  }

  drawTimeLine(wnd: TimeLineWindow, documentData: DocumentData, viewKeyframes: ViewKeyframe[], currentVectorLayer: VectorLayer) {

    const aniSetting = documentData.animationSettingData

    const left = wnd.getTimeLineLeft()
    const right = wnd.getTimeLineRight()
    const bottom = wnd.height
    const frameUnitWidth = wnd.getFrameUnitWidth(aniSetting)

    const frameNumberHeight = 16.0
    const frameLineBottom = wnd.height - 1.0 - frameNumberHeight
    const frameLineHeight = 10.0
    const secondFrameLineHeight = 30.0

    // Current frame

    const currentFrameX = left - aniSetting.timeLineWindowViewLocationX + aniSetting.currentTimeFrame * frameUnitWidth
    this.canvasRender.setStrokeWidth(1.0)
    this.canvasRender.setFillColorV(this.drawStyle.timeLineCurrentFrameColor)
    this.canvasRender.fillRect(currentFrameX, 0.0, frameUnitWidth, bottom)

    //aniSetting.maxFrame = 60
    //aniSetting.loopStartFrame = 10
    //aniSetting.loopEndFrame = 24

    // Document keyframes

    let minFrame = wnd.getFrameByLocation(left, aniSetting)
    if (minFrame < 0) {
      minFrame = 0
    }

    let maxFrame = wnd.getFrameByLocation(right, aniSetting)
    if (maxFrame > aniSetting.maxFrame) {
      maxFrame = aniSetting.maxFrame
    }

    this.canvasRender.setStrokeWidth(1.0)
    this.canvasRender.setFillColorV(this.drawStyle.timeLineKeyFrameColor)

    for (const viewKeyframe of viewKeyframes) {

      const frame = viewKeyframe.frame

      if (frame < minFrame) {
        continue
      }

      if (frame > maxFrame) {
        break
      }

      const frameX = wnd.getFrameLocation(frame, aniSetting)
      this.canvasRender.fillRect(frameX, 0.0, frameUnitWidth - 1.0, frameLineBottom)
    }

    // Loop part
    this.canvasRender.setFillColorV(this.drawStyle.timeLineOutOfLoopingColor)
    {
      const frameX = wnd.getFrameLocation(aniSetting.loopStartFrame, aniSetting)
      if (frameX > left) {

        this.canvasRender.fillRect(left, 0.0, frameX - left, bottom)
      }
    }
    {
      const frameX = wnd.getFrameLocation(aniSetting.loopEndFrame, aniSetting)
      if (frameX < right) {

        this.canvasRender.fillRect(frameX, 0.0, right - frameX, bottom)
      }
    }

    // Layer keyframes

    this.canvasRender.setStrokeWidth(1.0)
    this.canvasRender.setFillColorV(this.drawStyle.timeLineLayerKeyFrameColor)

    if (currentVectorLayer != null) {

      const viewKeyFrame = ViewKeyframe.findViewKeyframe(viewKeyframes, aniSetting.currentTimeFrame)
      let layerIndex = -1
      if (viewKeyFrame != null) {

        layerIndex = ViewKeyframe.findViewKeyframeLayerIndex(viewKeyFrame, currentVectorLayer)
      }

      if (layerIndex != -1) {

        for (const viewKeyframe of viewKeyframes) {

          const frame = viewKeyframe.frame

          if (frame < minFrame) {
            continue
          }

          if (frame > maxFrame) {
            break
          }

          const viewKeyFrameLayer = viewKeyframe.layers[layerIndex]

          if (viewKeyFrameLayer.vectorLayerKeyframe.frame == frame) {

            const frameX = wnd.getFrameLocation(frame, aniSetting)
            this.canvasRender.fillRect(frameX + 2.0, 0.0, frameUnitWidth - 5.0, frameLineBottom)
          }
        }
      }
    }

    // Left panel

    this.canvasRender.setGlobalAlpha(1.0)

    this.canvasRender.setStrokeWidth(1.0)
    this.canvasRender.setStrokeColorV(this.drawStyle.timeLineUnitFrameColor)
    this.canvasRender.drawLine(left, 0.0, left, wnd.height)

    // Frame measure
    {
      let x = left
      for (let frame = minFrame; frame <= maxFrame; frame++) {

        if (frame % aniSetting.animationFrameParSecond == 0 || frame == maxFrame) {

          this.canvasRender.drawLine(x, frameLineBottom - secondFrameLineHeight, x, frameLineBottom)
        }

        this.canvasRender.drawLine(x, frameLineBottom - frameLineHeight, x, frameLineBottom)

        x += frameUnitWidth
      }
    }

    this.canvasRender.drawLine(left, frameLineBottom, right, frameLineBottom)
  }
}
