import { ColorLogic, float } from '../common-logics'
import { VectorPoint, VectorStroke, VectorStrokeConnectionInfo } from '../document-data'
import { ToolDrawingStyle } from "../document-drawing/drawing-style"
import { CanvasRender, CanvasRenderLineCap } from '../render'
import { DrawingPointBrushLogic, DrawingStrokeLogic } from '../document-drawing'
import { SubToolDrawingContext_EditorDrawer_Interface } from '../context'
import { PointerInputWindow } from '../view'
import { VectorPointLogic, VectorStrokeLogic } from '../document-logic'

export class MainCanvasEditorDrawer implements SubToolDrawingContext_EditorDrawer_Interface {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null
  private drawingStroke: DrawingStrokeLogic = null
  private drawingPointBrush: DrawingPointBrushLogic = null
  private mainWindow: PointerInputWindow = null

  private linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private selectedLinePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private hsv = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private sel_hsv = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private editorStrokeDashScaled = [0.0, 0.0]
  private strokeConnectionDash = [4.0, 4.0]

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, mainWindow: PointerInputWindow, drawingStroke: DrawingStrokeLogic, drawingPointBrush: DrawingPointBrushLogic) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.mainWindow = mainWindow
    this.drawingStroke = drawingStroke
    this.drawingPointBrush = drawingPointBrush
  }

  getCurrentViewScaleLineWidth(width: float) {

    return this.canvasRender.getViewScaledSize(width)
  }

  drawPointerCursor(radius: float) { // @implements MainEditorDrawer

    this.drawCursorCircle(this.mainWindow.pointerEvent.location, radius, this.drawStyle.mouseCursorCircleColor)
  }

  drawaBrushCursor(lineWidth: float, lineWidthBiasRate: float) { // @implements MainEditorDrawer

    this.drawCursorCircle(
      this.mainWindow.pointerEvent.location,
      VectorPointLogic.getLineRadiusFromLineWidth(lineWidth * lineWidthBiasRate),
      this.drawStyle.brushCursorCircleColor
    )
  }

  drawCursorCircle(location: Vec3, radius: float, color: Vec4) { // @implements MainEditorDrawer

    this.canvasRender.beginPath()

    this.canvasRender.setStrokeColorV(color)
    this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0))

    this.canvasRender.circle(
      location[0]
      , location[1]
      , radius
    )

    this.canvasRender.stroke()
  }

  drawOperatorSolidStroke(stroke: VectorStroke, strokeWidthBiasRate = 1.0) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorStroke(this.canvasRender, stroke, this.drawStyle.editingLineColor, strokeWidthBiasRate, 0.0, false, false)
  }

  drawOperatorPointBrushStroke(stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawingPointBrush.drawPointBrushStroke(this.canvasRender, stroke, color, useAdjustingLocation, null)
  }

  drawEditorStroke(stroke: VectorStroke, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorStroke(this.canvasRender, stroke, color, 1.0, strokeWidthBolding, useAdjustingLocation, false)
  }

  drawEditorStrokePoints(stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawVectorLinePoints(stroke, color, useAdjustingLocation)
  }

  drawVectorLinePoints(stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    if (!this.isStrokeInViewRectangle(stroke)) {
      return
    }

    const render = this.canvasRender

    render.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0))

    // make line point color darker or lighter than original to easy to see on the line
    ColorLogic.rgbToHSVv(this.hsv, color)
    if (this.hsv[2] > 0.5) {

      this.hsv[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate
    }
    else {

      this.hsv[2] += this.drawStyle.linePointVisualBrightnessAdjustRate
    }
    if (this.hsv[1] < 0.2) {

      this.hsv[0] = 0.2
      this.hsv[1] = 0.2
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

    this.linePointColor[3] = 0.8

    render.setLineCap(CanvasRenderLineCap.round)

    for (const point of stroke.points) {

      this.drawVectorLinePoint(render, point, this.linePointColor, useAdjustingLocation, this.selectedLinePointColor)
    }
  }

  drawVectorLinePoint(render: CanvasRender, point: VectorPoint, color: Vec4, useAdjustingLocation: boolean, slectedColor: Vec4) {

    const viewScale = render.getViewScale()

    let radius = this.drawStyle.generalLinePointRadius / viewScale

    let location: Vec3

    if (useAdjustingLocation) {

      location = point.adjustingLocation
    }
    else {

      location = point.location
    }

    if (!render.isInViewRectangle(location, radius)) {
      return
    }

    if (point.isSelected) {

      radius = this.drawStyle.selectedLinePointRadius / viewScale
      render.setStrokeColorV(slectedColor)
    }
    else {

      render.setStrokeColorV(color)
    }

    render.setStrokeWidth(radius * 2)
    render.beginPath()
    render.moveTo(location[0], location[1])
    render.lineTo(location[0] + 0.01, location[1])
    render.stroke()
  }

  drawEditorStrokePoint(point: VectorPoint, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawVectorLinePoint(this.canvasRender, point, color, useAdjustingLocation, this.drawStyle.selectedVectorLineColor)
  }

  drawStrokeConnectionInfoLine(from: Vec3, to: Vec3) { // @implements MainEditorDrawer

    this.drawVectorStrokeConnectionInfoLine(this.canvasRender, from, to)
  }

  drawVectorStrokeConnectionInfo(render: CanvasRender, connectionInfo: VectorStrokeConnectionInfo, useAdjustingLocation: boolean) {

    if (connectionInfo.from_Stroke.points.length <= 1
      || connectionInfo.to_Stroke.points.length <= 1) {
      return
    }

    // set first location
    const from_point = connectionInfo.from_Stroke.points.at(-1)
    const from_location = (useAdjustingLocation ? from_point.adjustingLocation : from_point.location)

    const to_point = connectionInfo.to_Stroke.points.at(0)
    const to_location = (useAdjustingLocation ? to_point.adjustingLocation : to_point.location)

    this.drawVectorStrokeConnectionInfoLine(render, from_location, to_location)
  }

  drawVectorStrokeConnectionInfoLine(render: CanvasRender, from: Vec3, to: Vec3) {

    render.setFillColorV(this.drawStyle.strokeConnectionInfoColor)

    this.setEditorThinLineStyle(this.strokeConnectionDash)

    render.beginPath()

    render.moveToV(from)
    render.lineToV(to)

    render.stroke()

    render.clearLineDash()
  }

  getEditorThinLineWidth() {

    return this.canvasRender.getViewScaledSize(this.drawStyle.editorThinLineWidth)
  }

  setEditorThinLineStyle(dashSetting: float[]) {

    const render = this.canvasRender

    render.setLineCap(CanvasRenderLineCap.round)
    render.setStrokeWidth(this.getEditorThinLineWidth())

    const viewScale = render.getViewScaledSize(1.0)
    this.editorStrokeDashScaled[0] = dashSetting[0] * viewScale
    this.editorStrokeDashScaled[1] = dashSetting[1] * viewScale
    render.setLineDash(this.editorStrokeDashScaled)
  }

  isStrokeInViewRectangle(stroke: VectorStroke): boolean {

    if (VectorStrokeLogic.isEmptyStroke(stroke)) {
      return true
    }

    return this.canvasRender.isInViewRectangle(stroke.runtime.area.centerLocation, stroke.runtime.area.range)
  }
}
