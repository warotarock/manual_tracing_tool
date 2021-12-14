import { float, int } from '../logics/conversion'
import { VectorPoint, VectorStroke } from '../document_data'
import { ToolDrawingStyle } from "../drawing/drawing_style"
import { CanvasRender, CanvasWindow } from '../render/render2d'

export interface SubToolDrawingContext_EditorDrawer_Interface {

  drawMouseCursorCircle(radius: float)
  drawEditorEditLineStroke(line: VectorStroke)
  drawEditorVectorLineStroke(line: VectorStroke, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean)
  drawEditorVectorLinePoints(line: VectorStroke, color: Vec4, useAdjustingLocation: boolean)
  drawEditorVectorLinePoint(point: VectorPoint, color: Vec4, useAdjustingLocation: boolean)
  drawEditorVectorLineSegment(line: VectorStroke, startIndex: int, endIndex: int, useAdjustingLocation: boolean)
}

export class SubToolDrawingContext {

  canvasWindow: CanvasWindow = null
  editorDrawer: SubToolDrawingContext_EditorDrawer_Interface = null
  render: CanvasRender = null
  style: ToolDrawingStyle = null

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
}
