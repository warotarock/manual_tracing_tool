import { ToolDrawingStyle } from "../document-drawing/drawing-style"
import { CanvasRender } from '../render'
import { DrawingStrokeLogic } from '../document-drawing'
import { MainCanvasEditorDrawer } from "./editor-drawer"

export class OperatorCursor {

  location = vec3.fromValues(0.0, 0.0, 0.0)
  radius = 15.0
}

export class OperatorCursorLogic {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null
  private editorDrawer: MainCanvasEditorDrawer = null

  private operatorCurosrLineDash = [2.0, 2.0]

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, editorDrawer: MainCanvasEditorDrawer) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.editorDrawer = editorDrawer
  }

  drawOperatorCursor(operatorCursor: OperatorCursor) {

    this.canvasRender.beginPath()

    this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor)
    this.canvasRender.setStrokeWidth(this.editorDrawer.getEditorThinLineWidth())

    this.editorDrawer.setEditorThinLineStyle(this.operatorCurosrLineDash)

    const viewScale = this.canvasRender.getViewScaledSize(1.0)

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

    this.canvasRender.clearLineDash()
  }
}
