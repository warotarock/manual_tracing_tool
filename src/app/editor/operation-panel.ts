import { ToolDrawingStyle } from "../document-drawing"
import { float, LayoutLogic, RectangleLayoutArea } from '../common-logics'
import { CanvasRender, CanvasWindow } from '../render'
import { SVGFiles } from '../resource-files'
import { ToolPointerEvent } from '../tool'

export enum OperationPanelButtonID {

  view_zoom = 1,
  view_rotate = 2,
  view_move = 3,
  draw = 4,
  eraser = 5,
  brushSize = 6,
  scratchLine = 7,
}

export class OperationPanel {

  private visible = false
  private drawStyle: ToolDrawingStyle = null

  private mainOperationUI_Icons = [
    { image: new Image(), filePath: SVGFiles.icons.zoom },
    { image: new Image(), filePath: SVGFiles.icons.rotate },
    { image: new Image(), filePath: SVGFiles.icons.move },
    { image: new Image(), filePath: SVGFiles.icons.draw },
    { image: new Image(), filePath: SVGFiles.icons.eracer },
    { image: new Image(), filePath: SVGFiles.icons.scratchLine },
  ]

  private mainOperationUI_PanelBorderPoints: float[][] = []

  private mainOperationUI_Area = new RectangleLayoutArea()
    .setSize(250, 170)
    .setPadding({ left: 10, top: 10, right: 10, bottom: 10})
    .setGridLayout({ columns: 3, columnGap: 7, rows: 2 ,rowGap: 7 })
    .setChildren([
      // new RectangleLayoutArea().setIndex(OperationPanelButtonID.brushSize).setCellSpan(1, 1),
      new RectangleLayoutArea().setIndex(OperationPanelButtonID.draw).setIcon(3),
      new RectangleLayoutArea().setIndex(OperationPanelButtonID.view_rotate).setIcon(1),
      new RectangleLayoutArea().setIndex(OperationPanelButtonID.view_move).setIcon(2),
      new RectangleLayoutArea().setIndex(OperationPanelButtonID.eraser).setIcon(4),
      new RectangleLayoutArea().setIndex(OperationPanelButtonID.scratchLine).setIcon(5),
      new RectangleLayoutArea().setIndex(OperationPanelButtonID.view_zoom).setIcon(0),
    ])

  link(drawStyle: ToolDrawingStyle) {

    this.drawStyle = drawStyle
  }

  startLoadingImageResources() {

    for (const icon of this.mainOperationUI_Icons) {

      icon.image.src = icon.filePath
    }
  }

  isVisible(): boolean {

    return this.visible
  }

  setVisibility(visible: boolean) {

    return this.visible = visible
  }

  toggleVisibility() {

    return this.visible = !this.visible
  }

  hittestToButtons(e: ToolPointerEvent): RectangleLayoutArea | null {

    if (!this.visible) {
      return null
    }

    return LayoutLogic.hitTestLayout(this.mainOperationUI_Area.children, e.offsetX, e.offsetY)
  }

  hittestToPanel(e: ToolPointerEvent): RectangleLayoutArea | null {

    if (!this.visible) {
      return null
    }

    return LayoutLogic.hitTestLayout(this.mainOperationUI_Area, e.offsetX, e.offsetY)
  }

  updateLayout(canvasWindow: CanvasWindow) {

    const area = this.mainOperationUI_Area
    const offsetToCancelAntialius = 0.5

    area.left = -offsetToCancelAntialius
    area.right = area.left + area.width
    area.top = offsetToCancelAntialius + canvasWindow.height - area.height
    area.bottom = area.top + area.height

    const windowBorderRadius = 20 // [px]
    const windowBorderRadiusUnit = 90 / 10

    // 外枠の形状の計算
    this.mainOperationUI_PanelBorderPoints = []

    this.mainOperationUI_PanelBorderPoints.push([area.left, area.top])
    this.mainOperationUI_PanelBorderPoints.push([area.right - windowBorderRadius, area.top])

    for (let r = 90 - windowBorderRadiusUnit; r >= 0; r -= windowBorderRadiusUnit) {

      this.mainOperationUI_PanelBorderPoints.push([
        area.right - windowBorderRadius + Math.cos(r * Math.PI / 180) * windowBorderRadius,
        area.top + windowBorderRadius - Math.sin(r * Math.PI / 180) * windowBorderRadius
      ])
    }

    this.mainOperationUI_PanelBorderPoints.push([area.right, area.bottom])
    this.mainOperationUI_PanelBorderPoints.push([area.left, area.bottom])

    LayoutLogic.calculateGridLayout(area, area.gridLayoutOptions)
  }

  draw(render: CanvasRender) {

    if (!this.visible) {
      return null
    }

    render.resetTransform()

    render.setStrokeWidth(1.0)
    render.setFillColorV(this.drawStyle.windowBackgroundColor)

    // 背景
    render.fillPath(this.mainOperationUI_PanelBorderPoints)

    // 枠線
    render.setStrokeColorV(this.drawStyle.windowBorderColor)
    render.strokePath(this.mainOperationUI_PanelBorderPoints)

    // ボタン
    render.setStrokeColorV(this.drawStyle.operationPanelButtonBorderColor)
    for (const area of this.mainOperationUI_Area.children) {

      if (area.iconID != -1) {

        if (area.hover) {

          render.setFillColorV(this.drawStyle.controlHoverColor)
          render.fillRoundRect(area.left, area.top, area.width, area.width, 10)
        }

        // render.strokeRect(area.left, area.top, area.width, area.width)
        render.setStrokeWidth(3.0)
        render.strokeRoundRect(area.left, area.top, area.width, area.width, 10)

        const icon = this.mainOperationUI_Icons[area.iconID]
        render.drawImage(icon.image, 0, 0, 24, 24, area.left, area.top, area.width, area.width)
      }
    }
  }
}
