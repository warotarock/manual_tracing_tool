import { float, int } from '../logics/conversion'
import { VectorPoint, VectorStroke } from '../document_data'
import { ToolDrawingStyle } from "../drawing/drawing_style"
import { CanvasRender } from '../render/render2d'
import { DrawingStrokeLogic } from '../drawing/drawing_stroke'
import { SubToolDrawingContext_EditorDrawer_Interface } from '../context/subtool_drawing_context'
import { PointerInputWindow } from '../view/pointer_input'

export class MainCanvasEditorDrawer implements SubToolDrawingContext_EditorDrawer_Interface {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null
  private drawingStroke: DrawingStrokeLogic = null
  private mainWindow: PointerInputWindow = null

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, drawingStroke: DrawingStrokeLogic, mainWindow: PointerInputWindow) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.drawingStroke = drawingStroke
    this.mainWindow = mainWindow
  }

  drawMouseCursorCircle(radius: float) { // @implements MainEditorDrawer

    this.canvasRender.beginPath()

    this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor)
    this.canvasRender.setStrokeWidth(this.drawingStroke.getCurrentViewScaleLineWidth(1.0))

    this.canvasRender.circle(
      this.mainWindow.pointerEvent.location[0]
      , this.mainWindow.pointerEvent.location[1]
      , radius
    )

    this.canvasRender.stroke()
  }

  drawEditorEditLineStroke(line: VectorStroke) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorLineStroke(line, this.drawStyle.editingLineColor, 1.0, 2.0, false, false)
  }

  drawEditorVectorLineStroke(line: VectorStroke, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorLineStroke(line, color, 1.0, strokeWidthBolding, useAdjustingLocation, false)
  }

  drawEditorVectorLinePoints(line: VectorStroke, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawVectorLinePoints(line, color, useAdjustingLocation)
  }

  drawVectorLinePoints(stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorLinePoints(stroke, color, useAdjustingLocation)
  }

  drawEditorVectorLinePoint(point: VectorPoint, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorLinePoint(point, color, useAdjustingLocation, this.drawStyle.selectedVectorLineColor)
  }

  drawEditorVectorLineSegment(line: VectorStroke, startIndex: int, endIndex: int, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

    this.drawingStroke.drawVectorLineSegment(line, startIndex, endIndex, 1.0, 0.0, useAdjustingLocation)
  }
}
