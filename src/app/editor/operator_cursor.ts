import { ToolDrawingStyle } from "../drawing/drawing_style"
import { CanvasRender } from '../render/render2d'
import { DrawingStrokeLogic } from '../drawing/drawing_stroke'

export class OperatorCursor {

  location = vec3.fromValues(0.0, 0.0, 0.0)
  radius = 15.0
}

export class OperatorCursorLogic {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null
  private drawingStroke: DrawingStrokeLogic = null

  private operatorCurosrLineDash = [2.0, 2.0]
  private operatorCurosrLineDashScaled = [0.0, 0.0]
  private operatorCurosrLineDashNone = []

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, drawingStroke: DrawingStrokeLogic) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.drawingStroke = drawingStroke
  }

  drawOperatorCursor(operatorCursor: OperatorCursor) {

    this.canvasRender.beginPath()

    this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor)
    this.canvasRender.setStrokeWidth(this.drawingStroke.getCurrentViewScaleLineWidth(1.0))

    const viewScale = this.drawingStroke.getViewScaledSize(1.0)

    this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale
    this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale
    this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled)

    this.canvasRender.circle(
      operatorCursor.location[0]
      , operatorCursor.location[1]
      , operatorCursor.radius * viewScale
    )

    this.canvasRender.stroke()

    const centerX = operatorCursor.location[0]
    const centerY = operatorCursor.location[1]
    const clossBeginPosition = operatorCursor.radius * viewScale * 1.5
    const clossEndPosition = operatorCursor.radius * viewScale * 0.5

    this.canvasRender.drawLine(centerX - clossBeginPosition, centerY, centerX - clossEndPosition, centerY)
    this.canvasRender.drawLine(centerX + clossBeginPosition, centerY, centerX + clossEndPosition, centerY)
    this.canvasRender.drawLine(centerX, centerY - clossBeginPosition, centerX, centerY - clossEndPosition)
    this.canvasRender.drawLine(centerX, centerY + clossBeginPosition, centerX, centerY + clossEndPosition)

    this.canvasRender.setLineDash(this.operatorCurosrLineDashNone)
  }
}
