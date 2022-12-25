import { DocumentContext } from '../context'
import { AnimationSettingData } from '../document-data'
import { ToolDrawingStyle } from "../document-drawing"
import { DOMLogic } from '../dom'
import { float, int } from '../common-logics'
import { ImageResource } from '../posing3d'
import { CanvasRender } from '../render'
import { UI_TimeLineWindowRef } from '../ui-panel'
import { UI_SelectBoxPopoverRef } from '../ui-popover'
import { PointerInputWindow, ViewKeyframe } from '../view'

export class TimeLineWindow {

  uiTimeLineWindowRef: UI_TimeLineWindowRef = {}

  canvasWindow = new PointerInputWindow()
  canvasRender: CanvasRender = null
  drawStyle: ToolDrawingStyle = null
  systemImage: ImageResource = null
  dom: DOMLogic = null

  leftPanelWidth = 100.0
  frameUnitWidth = 8.0

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, dom: DOMLogic, selectBoxRef: UI_SelectBoxPopoverRef) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.dom = dom
    this.uiTimeLineWindowRef.selectBoxPopoverRef = selectBoxRef
  }

  isVisible(): boolean {

    const container = this.getContainer()

    return this.isContainerVisible(container)
  }

  setVisibility(visible: boolean) {

    const container = this.getContainer()

    if (visible) {

      container.classList.remove('hidden')
    }
    else {

      container.classList.add('hidden')
    }
  }

  toggleVisibility() {

    const container = this.getContainer()

    if (this.isContainerVisible(container)) {

      this.setVisibility(false)
    }
    else {

      this.setVisibility(true)
    }
  }

  private getContainer(): HTMLDivElement {

    return this.dom.getElement<HTMLDivElement>(this.dom.ID.timeLineWindow)
  }

  private isContainerVisible(container: HTMLDivElement): boolean {

    return !container.classList.contains('hidden')
  }

  getFrameUnitWidth(aniSetting: AnimationSettingData): float {

    return this.frameUnitWidth * aniSetting.timeLineWindowScale
  }

  getTimeLineLeft(): float {

    return this.leftPanelWidth
  }

  getTimeLineRight(): float {

    return this.getTimeLineLeft() + this.canvasWindow.width - 1
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

  drawCommandButton(ctx: DocumentContext) {

    this.canvasRender.setContext(this.canvasWindow)

    // Play / Stop
    {
      let srcX = 0
      const srcY = 196
      const srcW = 128
      const srcH = 128
      const dstW = 45
      const dstH = 45
      const dstX = this.getTimeLineLeft() / 2 - dstW / 2 + 1
      const dstY = this.canvasWindow.height / 2 - dstH / 2 + 1

      if (ctx.animationPlaying) {

        srcX = 128
      }

      this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH)
    }

    this.uiTimeLineWindowRef.update(ctx)
  }

  drawTimeLine(ctx: DocumentContext) {

    this.canvasRender.setContext(this.canvasWindow)

    const viewKeyframes = ctx.keyframes
    const currentVectorLayer = ctx.currentLayer
    const aniSetting = ctx.documentData.animationSettingData

    const left = this.getTimeLineLeft()
    const right = this.getTimeLineRight()
    const bottom = this.canvasWindow.height
    const frameUnitWidth = this.getFrameUnitWidth(aniSetting)

    const frameNumberHeight = 16.0
    const frameLineBottom = this.canvasWindow.height - 1.0 - frameNumberHeight
    const frameLineHeight = 10.0
    const secondFrameLineHeight = 30.0

    // Current frame

    const currentFrameX = left - aniSetting.timeLineWindowViewLocationX + aniSetting.currentTimeFrame * frameUnitWidth
    this.canvasRender.setStrokeWidth(1.0)
    this.canvasRender.setFillColorV(this.drawStyle.timeLineCurrentFrameColor)
    this.canvasRender.fillRect(currentFrameX, 0.0, frameUnitWidth, bottom)

    // Document keyframes

    let minFrame = this.getFrameByLocation(left, aniSetting)
    if (minFrame < 0) {
      minFrame = 0
    }

    let maxFrame = this.getFrameByLocation(right, aniSetting)
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

      const frameX = this.getFrameLocation(frame, aniSetting)
      this.canvasRender.fillRect(frameX, 0.0, frameUnitWidth - 1.0, frameLineBottom)
    }

    // Loop part
    this.canvasRender.setFillColorV(this.drawStyle.timeLineOutOfLoopingColor)
    {
      const frameX = this.getFrameLocation(aniSetting.loopStartFrame, aniSetting)
      if (frameX > left) {

        this.canvasRender.fillRect(left, 0.0, frameX - left, bottom)
      }
    }
    {
      const frameX = this.getFrameLocation(aniSetting.loopEndFrame + 1, aniSetting)
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

          if (viewKeyFrameLayer.hasActualFrame) {

            const frameX = this.getFrameLocation(frame, aniSetting)
            this.canvasRender.fillRect(frameX + 2.0, 0.0, frameUnitWidth - 5.0, frameLineBottom)
          }
        }
      }
    }

    // Left panel

    this.canvasRender.setGlobalAlpha(1.0)

    this.canvasRender.setStrokeWidth(1.0)
    this.canvasRender.setStrokeColorV(this.drawStyle.timeLineUnitFrameColor)
    this.canvasRender.drawLine(left, 0.0, left, this.canvasWindow.height)

    // Frame measure
    {
      let x = left
      for (let frame = minFrame; frame <= maxFrame + 1; frame++) {

        if (frame % aniSetting.animationFrameParSecond == 0 || frame == maxFrame + 1) {

          this.canvasRender.drawLine(x, frameLineBottom - secondFrameLineHeight, x, frameLineBottom)
        }

        this.canvasRender.drawLine(x, frameLineBottom - frameLineHeight, x, frameLineBottom)

        x += frameUnitWidth
      }
    }

    this.canvasRender.drawLine(left, frameLineBottom, right, frameLineBottom)
  }
}
