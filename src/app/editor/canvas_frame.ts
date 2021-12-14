import { float, int } from '../logics/conversion'
import { ToolDrawingStyle } from "../drawing/drawing_style"
import { CanvasRender, CanvasWindow } from '../render/render2d'
import { DocumentData } from '../document_data'

export class CanvasFrame {

  private drawStyle: ToolDrawingStyle = null

  private viewWidth = 0.0
  private viewHeight = 0.0

  private documentFrameCornerIndexs: int[][] = [[0, 1], [0, 3], [2, 3], [2, 1], [0, 1]]

  private cornerPosition = vec3.fromValues(0.0, 0.0, 0.0)
  private tempVec3 = vec3.create()

  link(drawStyle: ToolDrawingStyle) {

    this.drawStyle = drawStyle
  }

  updateLayout(canvasWindow: CanvasWindow) {

    this.viewWidth = canvasWindow.width
    this.viewHeight = canvasWindow.height
  }

  draw(render: CanvasRender, canvasWindow: CanvasWindow, documentData: DocumentData) {

    // TODO: ズームが大きいなどでビュー全体がフレーム内である場合は描画不要なため、そのときは描画をキャンセルする処理の実装

    render.resetTransform()

    render.setFillColorV(this.drawStyle.documentFrameOutAreaColor)
    render.beginPath()
    let index = 0
    for (const documentFrameCornerIndex of this.documentFrameCornerIndexs) {

      const x = documentData.documentFrame[documentFrameCornerIndex[0]]
      const y = documentData.documentFrame[documentFrameCornerIndex[1]]

      vec3.set(this.tempVec3, x, y, 0.0)
      vec3.transformMat4(this.cornerPosition, this.tempVec3, canvasWindow.transformMatrix)

      if (index == 0) {

        render.moveToV(this.cornerPosition)
      }
      else {

        render.lineToV(this.cornerPosition)
      }

      index++
    }

    render.moveTo(0, 0)
    render.lineTo(this.viewWidth, 0)
    render.lineTo(this.viewWidth, this.viewHeight)
    render.lineTo(0, this.viewHeight)
    render.lineTo(0, 0)

    render.fill()
  }
}
