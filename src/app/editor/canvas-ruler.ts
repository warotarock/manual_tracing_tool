import { float, int } from '../common-logics'
import { ToolDrawingStyle } from "../document-drawing"
import { CanvasRender, CanvasWindow } from '../render'
import { DocumentData } from '../document-data'

export enum CanvasRulerOrientation {

  horizontalTop,
  verticalLeft
}

export class CanvasRuler {

  private drawStyle: ToolDrawingStyle = null

  private orientation = CanvasRulerOrientation.horizontalTop
  private viewHeight = 0.0
  private width = 0.0
  private height = 13.0

  private documentFrameCornerIndexs: int[][] = [[0, 1], [2, 3], [2, 1], [0, 3]]
  private documentFramePositions: float[] = [0.0, 0.0, 0.0, 0.0]
  private documentPositionInfo = {
    origin: 0.0,
    frameLeft: 0.0,
    frameRight: 0.0
  }
  private unitScaleNumbers: float[] = [1, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000]

  private origin = vec3.fromValues(0.0, 0.0, 0.0)
  private cornerPosition = vec3.fromValues(0.0, 0.0, 0.0)
  private tempVec3 = vec3.create()
  private viewMatrix = mat4.create()

  link(drawStyle: ToolDrawingStyle) {

    this.drawStyle = drawStyle
  }

  isHorizontal(): boolean {

    return (this.orientation == CanvasRulerOrientation.horizontalTop)
  }

  updateLayout(canvasWindow: CanvasWindow, orientation: CanvasRulerOrientation) {

    this.orientation = orientation

    this.viewHeight = canvasWindow.height

    if (this.isHorizontal()) {

      this.width = canvasWindow.width
    }
    else {

      this.width = canvasWindow.height
    }

    this.height = this.drawStyle.rulerHeight
  }

  draw(render: CanvasRender, canvasWindow: CanvasWindow, documentData: DocumentData) {

    const isHorizontal = this.isHorizontal()
    const cornerPositionIndex = (isHorizontal ? 0 : 1)
    const right = this.width
    const bottom = this.height
    const cornerMargin = this.height
    const { frameLeft, frameRight, origin } = this.calculateDocumentFramePositionInfo(canvasWindow, documentData, cornerPositionIndex)

    // set base transform
    this.setBaseTransform(render, isHorizontal)

    render.setStrokeWidth(1.0)

    // background
    render.setFillColorV(this.drawStyle.rulerBackGroundColor)
    this.fillRect(cornerMargin, 0, frameLeft, bottom, isHorizontal, render)

    render.setFillColorV(this.drawStyle.rulerDocumentAreaColor)
    this.fillRect(frameLeft, 0, frameRight - frameLeft, bottom, isHorizontal, render)

    render.setFillColorV(this.drawStyle.rulerBackGroundColor)
    this.fillRect(frameRight, 0, right - frameRight, bottom, isHorizontal, render)

    // bottom line
    render.setStrokeColorV(this.drawStyle.rulerLineColor)
    this.drawLine(0, bottom + 0.5, right, bottom + 0.5, isHorizontal, render)

    // scale lines
    render.setStrokeColorV(this.drawStyle.rulerLineColor)
    this.drawScales(render, canvasWindow, origin, bottom, isHorizontal, this.drawScaleLine)

    // scale numbers
    render.setFontSize(this.drawStyle.rulerTextSize)
    render.setFillColorV(this.drawStyle.rulerLineColor)
    this.drawScales(render, canvasWindow, origin, bottom, isHorizontal, this.drawScaleNumber)
  }

  private calculateDocumentFramePositionInfo(canvasWindow: CanvasWindow, documentData: DocumentData, cornerPositionIndex: int) {

    let index = 0
    for (const documentFrameCornerIndex of this.documentFrameCornerIndexs) {

      const x = documentData.documentFrame[documentFrameCornerIndex[0]]
      const y = documentData.documentFrame[documentFrameCornerIndex[1]]

      vec3.set(this.tempVec3, x, y, 0.0)
      vec3.transformMat4(this.cornerPosition, this.tempVec3, canvasWindow.transformMatrix)

      this.documentFramePositions[index] = this.cornerPosition[cornerPositionIndex]
      index++
    }

    vec3.set(this.tempVec3, 0.0, 0.0, 0.0)
    vec3.transformMat4(this.origin, this.tempVec3, canvasWindow.transformMatrix)

    this.documentPositionInfo.frameLeft = this.documentFramePositions.reduce((a, b) => Math.min(a, b))
    this.documentPositionInfo.frameRight = this.documentFramePositions.reduce((a, b) => Math.max(a, b))
    this.documentPositionInfo.origin = this.origin[cornerPositionIndex]

    return this.documentPositionInfo
  }

  private setBaseTransform(render: CanvasRender, isHorizontal: boolean) {

    mat4.identity(this.viewMatrix)
    if (!isHorizontal) {
      mat4.translate(this.viewMatrix, this.viewMatrix, vec3.set(this.tempVec3, 0, this.viewHeight, 0.0))
      mat4.rotateZ(this.viewMatrix, this.viewMatrix, -Math.PI / 2)
    }

    render.setTransformFromMatrix(this.viewMatrix)
  }

  private getUnitScaleNumber(canvasWindow: CanvasWindow, scaleUnitWidth: float) {

    const letterUnitWidth = 6.0
    const letterDigits = 4
    const letterTextMargin = letterUnitWidth * 4
    const scaleTextWidth = letterUnitWidth * letterDigits + letterTextMargin

    let unitScaleNumber = 1

    for (let scaleNumber of this.unitScaleNumbers) {

      if (scaleNumber * scaleUnitWidth > scaleTextWidth) {

        unitScaleNumber = scaleNumber
        break
      }
    }

    return unitScaleNumber
  }

  private drawScales(
    render: CanvasRender,
    canvasWindow: CanvasWindow,
    origin: float,
    bottom: float,
    isHorizontal: boolean,
    drawFunction: (scaleNumber: int, x: float, scaleHeight: float, bottom: float, isLargeScale: boolean, isHorizontal: boolean, render: CanvasRender) => void
  ) {

    const scaleHeightL = this.height * 0.8
    const scaleHeightM = this.height * 0.4
    const scaleHeightS = this.height * 0.2

    const scaleUnitWidth = canvasWindow.viewScale
    const unitScaleNumber = this.getUnitScaleNumber(canvasWindow, scaleUnitWidth)
    const scaleStep = unitScaleNumber * scaleUnitWidth
    const subscaleDivision = unitScaleNumber > 1 ? 5 : 2
    const subScaleStep = scaleStep / subscaleDivision

    const startScaleCount = - (Math.floor(origin / scaleStep) + 1)
    const endScaleCount = (Math.floor((this.width - origin) / scaleStep) + 1)

    let scaleCount = startScaleCount
    let subScaleCount = 0
    while (scaleCount <= endScaleCount) {

      let scaleX = origin + scaleCount * scaleStep + subScaleCount * subScaleStep
      let scaleNumber = scaleCount * unitScaleNumber

      let scaleHeight: float
      let isLargeScale: boolean
      if (scaleCount == 0 && subScaleCount == 0) {

        scaleHeight = scaleHeightL
        isLargeScale = true
      }
      else if (subScaleCount == 0) {

        scaleHeight = scaleHeightM
        isLargeScale = true
      }
      else {

        scaleHeight = scaleHeightS
        isLargeScale = false
      }

      drawFunction.call(this, scaleNumber, scaleX, scaleHeight, bottom, isLargeScale, isHorizontal, render)

      scaleX += subScaleStep

      subScaleCount++
      if(subScaleCount >= subscaleDivision) {
        subScaleCount = 0
        scaleCount++
      }
    }
  }

  private drawScaleLine(_scaleNumber: int, x: float, scaleHeight: float, bottom: float, _isLargeScale: boolean, isHorizontal: boolean, render: CanvasRender) {

    this.drawLine(x, bottom - scaleHeight, x, bottom, isHorizontal, render)
  }

  private drawScaleNumber(scaleNumber: int, x: float, _scaleHeight: float, bottom: float, isLargeScale: boolean, isHorizontal: boolean, render: CanvasRender) {

    if (!isLargeScale) {
      return
    }

    let destX: float
    if (isHorizontal) {

      destX = x
    }
    else {

      destX = this.viewHeight - x
    }

    render.fillText(scaleNumber.toFixed(0), destX + this.drawStyle.rulerTextMargin.x, bottom -  + this.drawStyle.rulerTextMargin.y)
  }

  private drawLine(x1: float, y1: float, x2: float, y2: float, isHorizontal: boolean, render: CanvasRender) {

    if (isHorizontal) {

      render.drawLine(x1, y1, x2, y2)
    }
    else {

      render.drawLine(this.viewHeight - x1, y1, this.viewHeight - x2, y2)
    }
  }

  private fillRect(left: float, top: float, width: float, height: float, isHorizontal: boolean, render: CanvasRender) {

    if (isHorizontal) {

      render.fillRect(left, top, width, height)
    }
    else {

      render.fillRect(this.viewHeight - left - width, top, width, height)
    }
  }

  drawCorner(render: CanvasRender) {

    render.resetTransform()
    render.setStrokeWidth(1.0)
    render.setStrokeColorV(this.drawStyle.rulerLineColor)
    render.setFillColorV(this.drawStyle.windowBackgroundColor)

    render.fillRect(0, 0, this.height, this.height)
    render.drawLine(0, this.height + 0.5, this.height + 0.5, this.height + 0.5)
    render.drawLine(this.height + 0.5, 0, this.height + 0.5, this.height + 0.5)
  }
}
