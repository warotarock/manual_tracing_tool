import { Platform } from '../../platform/platform'

export class LazyProcess {

  needsStartingLazyProcess = false

  processedIndex = -1
  lastResetTime = 0
  limitTime = 100
  maxTime = 100000
  waitTime = 500
  isFirstTime = true
  isFinished = false
  isRendered = false

  resetLazyProcess() {

    this.needsStartingLazyProcess = false
    this.isFirstTime = true
    this.isFinished = false
    this.isRendered = false
  }

  setLazyProcess() {

    this.needsStartingLazyProcess = true
    this.isFinished = false
  }

  startLazyProcess() {

    this.needsStartingLazyProcess = false
    this.processedIndex = -1
    this.lastResetTime = Platform.getCurrentTime()
    this.isFirstTime = true
    this.isFinished = false
    this.isRendered = false
  }

  finishLazyProcess() {

    this.isFinished = true
    this.isRendered = true
  }

  isLazyDrawBigining(): boolean {

    return (this.processedIndex == -1)
  }

  isLazyDrawWaiting(): boolean {

    return (!this.isFinished
      && this.lastResetTime + this.waitTime > Platform.getCurrentTime())
  }
}
