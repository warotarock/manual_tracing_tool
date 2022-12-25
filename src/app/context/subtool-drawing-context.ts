import { float, int } from '../common-logics'
import { VectorPoint, VectorStroke } from '../document-data'
import { ToolDrawingStyle } from "../document-drawing"
import { CanvasRender, CanvasWindow } from '../render'

export interface SubToolDrawingContext_EditorDrawer_Interface {

  drawPointerCursor(radius: float)
  drawaBrushCursor(radius: float, lineWidthBiasRate: float)
  drawCursorCircle(location: Vec3, radius: float, color: Vec4)
  drawOperatorSolidStroke(line: VectorStroke, strokeWidthBiasRate?: float)
  drawEditorStroke(line: VectorStroke, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean)
  drawEditorStrokePoints(line: VectorStroke, color: Vec4, useAdjustingLocation: boolean)
  drawEditorStrokePoint(point: VectorPoint, color: Vec4, useAdjustingLocation: boolean)
  drawOperatorPointBrushStroke(stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean)
  drawStrokeConnectionInfoLine(from: Vec3, to: Vec3)
}

export class SubToolDrawingContext {

  canvasWindow: CanvasWindow = null
  editorDrawer: SubToolDrawingContext_EditorDrawer_Interface = null
  render: CanvasRender = null
  style: ToolDrawingStyle = null
  operatorCurosrLineDashScaled = [0.0, 0.0]

  constructor(editorDrawer: SubToolDrawingContext_EditorDrawer_Interface, render: CanvasRender, style: ToolDrawingStyle) {

    this.editorDrawer = editorDrawer
    this.render = render
    this.style = style
  }

  setCanvasWindow(canvasWindow: CanvasWindow) {

    this.canvasWindow = canvasWindow
  }

  beginPath(locationFrom?: Vec3) {

    this.render.beginPath()

    if (locationFrom) {

      this.render.moveTo(locationFrom[0], locationFrom[1])
    }
  }

  stroke(strokeWidth: float, color: Vec4) {

    this.render.setStrokeColorV(color)
    this.render.setStrokeWidth(strokeWidth)
    this.render.stroke()
  }

  fill(color: Vec4) {

    this.render.setFillColorV(color)
    this.render.fill()
  }

  moveTo(location: Vec3) {

    this.render.moveTo(location[0], location[1])
  }

  lineTo(location: Vec3) {

    this.render.lineTo(location[0], location[1])
  }

  drawLine(locationFrom: Vec3, locationTo: Vec3, strokeWidth: float, color: Vec4) {

    this.render.setStrokeColorV(color)
    this.render.setStrokeWidth(strokeWidth)
    this.render.beginPath()
    this.render.moveTo(locationFrom[0], locationFrom[1])
    this.render.lineTo(locationTo[0], locationTo[1])
    this.render.stroke()
  }

  drawCircle(center: Vec3, raduis: float, strokeWidth: float, color: Vec4) {

    this.render.setStrokeColorV(color)
    this.render.setStrokeWidth(strokeWidth)
    this.render.beginPath()
    this.render.circle(center[0], center[1], raduis)
    this.render.stroke()
  }

  setLineDash(scale: float) {

    const viewScale = this.render.getViewScaledSize(scale)

    this.operatorCurosrLineDashScaled[0] = this.style.operatorCurosrLineDash[0] * viewScale
    this.operatorCurosrLineDashScaled[1] = this.style.operatorCurosrLineDash[1] * viewScale
    this.render.setLineDash(this.operatorCurosrLineDashScaled)
  }

  cancelLineDash() {

    this.render.clearLineDash()
  }
}
