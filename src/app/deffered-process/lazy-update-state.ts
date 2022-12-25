import { Platform } from '../../platform'

export class LazyUpdateState {

  needsStartingLazyUpdate = false

  processedIndex = -1
  lastResetTime = 0
  limitTime = 100
  partialProcessMaxTime = 100 // TODO: 適当な値を設定する
  waitTime = 500
  isLazyDrawingFinished = false
  isFirstTime = true
  isFinished = false
  isRendered = false

  processStartTime = 0

  resetLazyUpdate() {

    this.needsStartingLazyUpdate = false
    this.isFirstTime = true
    this.isFinished = false
    this.isRendered = false
  }

  setLazyUpdate() {

    this.needsStartingLazyUpdate = true
    this.isFinished = false
  }

  startLazyCalculation() {

    this.needsStartingLazyUpdate = false
    this.processedIndex = -1
    this.lastResetTime = Platform.getCurrentTime()
    this.isLazyDrawingFinished = false
    this.isFirstTime = true
    this.isFinished = false
    this.isRendered = false
  }

  finishLazyUpdate() {

    this.isFinished = true
    this.isRendered = true
  }

  isLazyDrawBigining(): boolean {

    return (this.processedIndex == -1)
  }

  isLazyUpdateWaiting(): boolean {

    return (!this.isFinished
      && this.lastResetTime + this.waitTime > Platform.getCurrentTime())
  }

  startPartialProcess() {

    this.processStartTime = Platform.getCurrentTime()
  }

  isOverPartialProcessMaxTime(): boolean {

    const currentTime = Platform.getCurrentTime()

    return (currentTime - this.processStartTime >= this.partialProcessMaxTime)
  }

  finishLazyDrawing() {

    this.isLazyDrawingFinished = true
  }
}
