import { float, int } from '../logics/conversion'
import { LinePointModifyFlagID, VectorPoint, VectorStroke } from '../document_data'
import { ToolDrawingStyle } from "./drawing_style"
import { ColorLogic } from '../logics/color'
import { CanvasRender, CanvasRenderLineCap } from '../render/render2d'

export class DrawingStrokeLogic {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null

  private toLocation = vec3.create()
  private fromLocation = vec3.create()
  private linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private selectedLinePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private hsv = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private sel_hsv = vec4.fromValues(0.0, 0.0, 0.0, 1.0)

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
  }

  isStrokeInViewRectangle(stroke: VectorStroke): boolean {

    if (stroke.range == 0.0) {

      return true
    }

    if (stroke.points.length == 0) {

      return false
    }

    return this.canvasRender.isInViewRectangle(stroke.left, stroke.top, stroke.right, stroke.bottom, stroke.range)
  }

  getCurrentViewScaleLineWidth(width: float) {

    return width / this.canvasRender.getViewScale()
  }

  getViewScaledSize(width: float) {

    return width / this.canvasRender.getViewScale()
  }

  lineWidthAdjust(width: float) {

    //return Math.floor(width * 5) / 5
    return width
  }

  drawVectorLineStroke(stroke: VectorStroke, color: Vec4, strokeWidthBiasRate: float, strokeWidthBolding: float, useAdjustingLocation: boolean, isExporting: boolean) {

    if (!isExporting && !this.isStrokeInViewRectangle(stroke)
      //&& this.toolEnv.isShiftKeyPressing() // for clipping test
    ) {
      return
    }

    this.canvasRender.setStrokeColorV(color)

    this.drawVectorLineSegment(stroke, 0, stroke.points.length - 1, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation)
  }

  drawVectorLineSegment(line: VectorStroke, startIndex: int, endIndex: int, strokeWidthBiasRate: float, strokeWidthBolding: float, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    if (line.points.length < 2) {
      return
    }

    //line.points[0].lengthFrom = 0.0
    //line.points[0].lengthTo = 0.5
    //line.points[line.points.length - 2].lineWidth = 2.3
    //line.points[line.points.length - 2].lengthFrom = 0.3
    //line.points[line.points.length - 2].lengthTo = 0.6

    this.canvasRender.setLineCap(CanvasRenderLineCap.round)

    // let firstPoint = line.points[startIndex]
    let currentLineWidth = -1.0

    let strokeStarted = false
    let drawingRemainging = false

    for (let pointIndex = startIndex; pointIndex < endIndex;) {

      const fromPoint = line.points[pointIndex]
      const fromLocation = (useAdjustingLocation ? fromPoint.adjustingLocation : fromPoint.location)
      const toPoint = line.points[pointIndex + 1]
      const toLocation = (useAdjustingLocation ? toPoint.adjustingLocation : toPoint.location)

      const lineWidth = (useAdjustingLocation ? fromPoint.adjustingLineWidth : fromPoint.lineWidth)
      // let isVisibleWidth = (lineWidth > 0.0)
      //let isVisibleSegment = (fromPoint.lengthFrom != 0.0 || fromPoint.lengthTo != 0.0)

      const lengthFrom = (useAdjustingLocation ? fromPoint.adjustingLengthFrom : 1.0)
      const lengthTo = (useAdjustingLocation ? fromPoint.adjustingLengthTo : 0.0)

      if (lineWidth != currentLineWidth) {

        if (drawingRemainging) {

          this.canvasRender.stroke()

          strokeStarted = false
          drawingRemainging = false
        }

        this.canvasRender.setStrokeWidth(lineWidth * strokeWidthBiasRate + this.getCurrentViewScaleLineWidth(strokeWidthBolding))
        currentLineWidth = lineWidth
      }

      if (lengthFrom == 1.0) {

        // draw segment's full length
        if (!strokeStarted) {

          this.canvasRender.beginPath()
          this.canvasRender.moveToV(fromLocation)
        }

        this.canvasRender.lineToV(toLocation)
        strokeStarted = true
        drawingRemainging = true
      }
      else {

        // draw segment's from-side part
        if (lengthFrom > 0.0) {

          if (!strokeStarted) {

            this.canvasRender.beginPath()
            this.canvasRender.moveToV(fromLocation)
          }

          vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom)
          this.canvasRender.lineToV(this.toLocation)
          this.canvasRender.stroke()
          strokeStarted = false
          drawingRemainging = false
        }

        // draw segment's to-side part
        if (lengthTo > 0.0 && lengthTo < 1.0) {

          if (drawingRemainging) {

            this.canvasRender.stroke()
          }

          vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo)
          this.canvasRender.beginPath()
          this.canvasRender.moveToV(this.fromLocation)
          this.canvasRender.lineToV(toLocation)
          strokeStarted = true
          drawingRemainging = true
        }
      }

      pointIndex++
    }

    if (drawingRemainging) {

      this.canvasRender.stroke()
    }
  }

  drawVectorLinePoints(stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    if (!this.isStrokeInViewRectangle(stroke)) {
      return
    }

    this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0))

    // make line point color darker or lighter than original to easy to see on the line
    ColorLogic.rgbToHSVv(this.hsv, color)
    if (this.hsv[2] > 0.5) {

      this.hsv[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate
    }
    else {

      this.hsv[2] += this.drawStyle.linePointVisualBrightnessAdjustRate
    }
    ColorLogic.hsvToRGBv(this.linePointColor, this.hsv)

    // make slected color easy to see on the line
    vec4.copy(this.selectedLinePointColor, this.drawStyle.selectedVectorLineColor)
    if ((this.hsv[0] < this.drawStyle.selectedLineColorVisibilityAdjustThreshold1
        || this.hsv[0] > this.drawStyle.selectedLineColorVisibilityAdjustThreshold2)
      && this.hsv[1] > 0.0) {

      ColorLogic.rgbToHSVv(this.sel_hsv, this.selectedLinePointColor)

      this.sel_hsv[0] += this.drawStyle.selectedLineColorVisibilityAdjustHue

      ColorLogic.hsvToRGBv(this.selectedLinePointColor, this.sel_hsv)
    }

    this.linePointColor[3] = color[3]

    for (const point of stroke.points) {

      this.drawVectorLinePoint(point, this.linePointColor, useAdjustingLocation, this.selectedLinePointColor)
    }
  }

  drawVectorLinePoint(point: VectorPoint, color: Vec4, useAdjustingLocation: boolean, slectedColor: Vec4) {

    const viewScale = this.canvasRender.getViewScale()

    let radius = this.drawStyle.generalLinePointRadius / viewScale

    let location: Vec3

    if (useAdjustingLocation) {

      location = point.adjustingLocation
    }
    else {

      location = point.location
    }

    if (!this.canvasRender.isInViewRectangle(location[0], location[1], location[0], location[1], radius)) {
      return
    }

    if (point.isSelected) {

      radius = this.drawStyle.selectedLinePointRadius / viewScale
      this.canvasRender.setStrokeColorV(slectedColor)
      // this.canvasRender.setFillColorV(this.drawStyle.selectedVectorLineColor)
    }
    else {

      this.canvasRender.setStrokeColorV(color)
      // this.canvasRender.setFillColorV(color)
    }

    // this.canvasRender.beginPath()
    // this.canvasRender.circle(location[0], location[1], radius)
    // this.canvasRender.fill()

    this.canvasRender.setStrokeWidth(radius * 2)
    this.canvasRender.beginPath()
    this.canvasRender.moveTo(location[0], location[1])
    this.canvasRender.lineTo(location[0] + 0.1, location[1])
    this.canvasRender.stroke()
  }

  drawVectorLineFill(line: VectorStroke, color: Vec4, useAdjustingLocation: boolean, isFillContinuing: boolean) {

    if (line.points.length <= 1) {
      return
    }

    if (!isFillContinuing) {

      this.canvasRender.setLineCap(CanvasRenderLineCap.round)
      this.canvasRender.beginPath()
      this.canvasRender.setFillColorV(color)
    }

    const startIndex = 0
    const endIndex = line.points.length - 1

    // search first visible point
    let firstIndex = -1
    for (let i = startIndex; i <= endIndex; i++) {

      const point = line.points[i]

      if (point.modifyFlag != LinePointModifyFlagID.delete) {

        firstIndex = i
        break
      }
    }

    if (firstIndex == -1) {

      return
    }

    // set first location
    const firstPoint = line.points[firstIndex]
    const firstLocation = (useAdjustingLocation ? firstPoint.adjustingLocation : firstPoint.location)
    if (isFillContinuing) {

      this.canvasRender.lineToV(firstLocation)
    }
    else {

      this.canvasRender.moveToV(firstLocation)
    }

    const currentLineWidth = this.lineWidthAdjust(firstPoint.lineWidth)
    this.canvasRender.setStrokeWidth(currentLineWidth)

    for (let i = 1; i < line.points.length; i++) {

      const point = line.points[i]

      if (point.modifyFlag == LinePointModifyFlagID.delete) {

        continue
      }

      const location = (useAdjustingLocation ? point.adjustingLocation : point.location)
      this.canvasRender.lineTo(location[0], location[1])
    }

    if (!line.continuousFill) {

      this.canvasRender.fill()
    }
  }
}
