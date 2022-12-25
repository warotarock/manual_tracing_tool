import { int, Lists } from '../common-logics'
import { ToolDrawingStyle } from "../document-drawing"
import { CanvasRender, CanvasWindow } from '../render'
import { DocumentData } from '../document-data'

export class CanvasFrame {

  private drawStyle: ToolDrawingStyle = null

  private documentFrameCornerIndexs: int[][] = [[0, 1], [0, 3], [2, 3], [2, 1], [0, 1]]
  private documentFrameCornerIndexsReverse = Lists.reverse(Lists.clone(this.documentFrameCornerIndexs))

  private cornerPosition = vec3.fromValues(0.0, 0.0, 0.0)
  private tempVec3 = vec3.create()

  link(drawStyle: ToolDrawingStyle) {

    this.drawStyle = drawStyle
  }

  draw(render: CanvasRender, documentData: DocumentData, mirrored: boolean) {

    // TODO: ズームが大きいなどでビュー全体がフレーム内である場合は描画不要なため、そのときは描画をキャンセルする処理の実装

    render.resetTransform()

    render.setFillColorV(this.drawStyle.documentFrameOutAreaColor)

    const cornerIndeces = mirrored
      ? this.documentFrameCornerIndexs
      : this.documentFrameCornerIndexsReverse

    render.beginPath()
    let index = 0
    for (const cornerIndex of cornerIndeces) {

      const x = documentData.documentFrame[cornerIndex[0]]
      const y = documentData.documentFrame[cornerIndex[1]]

      vec3.set(this.tempVec3, x, y, 0.0)
      vec3.transformMat4(this.cornerPosition, this.tempVec3, render.transformMatrix)

      if (index == 0) {

        render.moveToV(this.cornerPosition)
      }
      else {

        render.lineToV(this.cornerPosition)
      }

      index++
    }

    render.moveTo(0, 0)
    render.lineTo(render.canvasWidth, 0)
    render.lineTo(render.canvasWidth, render.canvasHeight)
    render.lineTo(0, render.canvasHeight)
    render.lineTo(0, 0)

    render.fill()
  }
}
