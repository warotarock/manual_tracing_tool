import { float, int } from '../common-logics'
import {
  DocumentData, DrawLineTypeID, FillAreaTypeID, FillDrawable, StrokeDrawable,
  VectorLayer, VectorLayerGeometry, VectorStrokeModifyFlagID
} from '../document-data'
import { MainCanvasEditorDrawer } from '../editor'
import { CanvasRender } from '../render'
import { OperationUnitID } from '../tool'
import { DrawPathRenderCache } from './draw-path-render-cache'
import { DrawingPointBrushLogic } from './drawing-point-brush'
import { DrawingStrokeLogic } from './drawing-stroke'
import { ToolDrawingStyle } from "./drawing-style"

export class DrawingVectorLayerLogic {

  private canvasRender: CanvasRender = null
  private drawStyle: ToolDrawingStyle = null
  private drawingStroke: DrawingStrokeLogic = null
  private drawingPointBrush: DrawingPointBrushLogic = null
  private editorDrawer: MainCanvasEditorDrawer = null

  private strokeColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private fillColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private tempColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, drawingStroke: DrawingStrokeLogic, drawingPointBrush: DrawingPointBrushLogic, editorDrawer: MainCanvasEditorDrawer) {

    this.canvasRender = canvasRender
    this.drawStyle = drawStyle
    this.drawingStroke = drawingStroke
    this.drawingPointBrush = drawingPointBrush
    this.editorDrawer = editorDrawer
  }

  getStrokeColor(
    result: Vec4,
    drawable: StrokeDrawable,
    documentData: DocumentData,
    isEditMode: boolean,
    hideWhenEditMode: boolean
  ): Vec4 {

    let color: Vec4
    if (drawable.drawLineType == DrawLineTypeID.layerColor) {

      color = drawable.layerColor
    }
    else if (drawable.drawLineType == DrawLineTypeID.paletteColor) {

      const paletteColor = documentData.paletteColors[drawable.line_PaletteColorIndex]
      color = paletteColor.color
    }
    else {

      color = drawable.layerColor
    }

    if (hideWhenEditMode && isEditMode) {

      vec4.copy(this.tempColor, color)
      this.tempColor[3] *= this.drawStyle.editModeOtherLayerAlphaAdjustRate

      color = this.tempColor
    }

    vec4.copy(result, color)

    return color
  }

  getOnionSkinStrokeColor(result: Vec4, onionSkinLevel: int, maxOnionSkinLevel: int): Vec4 {

    vec4.copy(result, onionSkinLevel > 0 ? this.drawStyle.onionSkinForwardLineColor : this.drawStyle.onionSkinBackwardLineColor)

    result[3] *= 1.0 - Math.abs(onionSkinLevel) / maxOnionSkinLevel * 0.3

    return result
  }

  getFillColor(result: Vec4, drawable: FillDrawable, documentData: DocumentData, isEditMode: boolean, hideWhenEditMode: boolean) {

    let color: Vec4
    if (drawable.fillAreaType == FillAreaTypeID.fillColor) {

      color = drawable.fillColor
    }
    else if (drawable.fillAreaType == FillAreaTypeID.paletteColor) {

      const paletteColor = documentData.paletteColors[drawable.fill_PaletteColorIndex]
      color = paletteColor.color
    }
    else {

      color = drawable.fillColor
    }

    if (hideWhenEditMode && isEditMode) {

      vec4.copy(this.tempColor, color)
      this.tempColor[3] *= this.drawStyle.editModeOtherLayerAlphaAdjustRate

      color = this.tempColor
    }

    vec4.copy(result, color)

    return result
  }

  getWidthRate(drawable: StrokeDrawable, documentData: DocumentData): float {

    return drawable.lineWidthBiasRate * documentData.lineWidthBiasRate
  }

  drawForeground(
    render: CanvasRender,
    drawable: StrokeDrawable,
    geometry: VectorLayerGeometry,
    renderCache: DrawPathRenderCache,
    documentData: DocumentData,
    isEditMode: boolean,
    isExporting: boolean,
    isModalToolRunning: boolean,
    onionSkinLevel: int,
    maxOnionSkinLevel: int
    ) {

    if (drawable.drawLineType == DrawLineTypeID.none) {
      return
    }

    // DEBUG
    // if (renderCache.isInitialized()) {
    //   console.debug('drawForeground',
    //     `(${geometry.runtime.area.centerLocation[0].toFixed(3)}, ${geometry.runtime.area.centerLocation[1].toFixed(3)}), ${geometry.runtime.area.range.toFixed(3)}`,
    //     `${renderCache.width.toFixed(2)} x ${renderCache.height.toFixed(2)}`
    //   )
    // }

    if (!render.isInViewRectangle(geometry.runtime.area.centerLocation, geometry.runtime.area.range)) {
      // DEBUG
      // console.debug('  範囲外')
      return
    }

    const useAdjustingLocation = isModalToolRunning

    const widthRate = this.getWidthRate(drawable, documentData)

    if (onionSkinLevel == 0) {

      this.getStrokeColor(this.strokeColor, drawable, documentData, isEditMode, true)
    }
    else {

      this.getOnionSkinStrokeColor(this.strokeColor, onionSkinLevel, maxOnionSkinLevel)
    }

    if (renderCache.isInitialized()) {

      renderCache.clearMaskData()

      // DEBUG
      // console.debug('drawForeground renderCache.clearMaskData', renderCache.width, renderCache.height)
    }

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        if (!render.isInViewRectangle(group.runtime.area.centerLocation, group.runtime.area.range)) {
          continue
        }

        if (VectorLayerGeometry.isStrokeDraw(geometry)) {

          for (const stroke of group.lines) {

            this.drawingStroke.drawVectorStroke(render, stroke, this.strokeColor, widthRate, 0.0, useAdjustingLocation, isExporting)
          }
        }
        else if (VectorLayerGeometry.isPointBrushFill(geometry)) {

          if (renderCache.isInitialized()) {

            for (const stroke of group.lines) {

              this.drawingPointBrush.drawPointBrushStroke(render, stroke, this.strokeColor, useAdjustingLocation, renderCache)
            }

            this.drawingPointBrush.drawRenderResult(render, renderCache)
          }
        }
        else if (VectorLayerGeometry.isSurroundingFill(geometry)) {

          this.drawingStroke.beginStroke(this.strokeColor, widthRate, 0.0, useAdjustingLocation, isExporting)

          for (const stroke of group.lines) {

            this.drawingStroke.processStroke(render, stroke)
          }

          this.drawingStroke.finishStroke(render)
        }
      }
    }
  }

  drawBackground(
    render: CanvasRender,
    drawable: FillDrawable,
    geometry: VectorLayerGeometry,
    documentData: DocumentData,
    isSelectedLayer: boolean,
    isEditMode: boolean,
    isExporting: boolean,
    isModalToolRunning: boolean
  ) {

    if (drawable.fillAreaType == FillAreaTypeID.none) {
      return
    }

    const useAdjustingLocation = isModalToolRunning

    this.getFillColor(this.fillColor, drawable, documentData, isEditMode, !isSelectedLayer)

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        if (!render.isInViewRectangle(group.runtime.area.centerLocation, group.runtime.area.range)) {
          continue
        }

        if (VectorLayerGeometry.isStrokeDraw(geometry)) {

          for (const line of group.lines) {

            this.drawingStroke.beginFill(this.fillColor, useAdjustingLocation)

            this.drawingStroke.processFill(render, line)

            this.drawingStroke.finishFill(render)
          }
        }
        else if (VectorLayerGeometry.isSurroundingFill(geometry)) {

          this.drawingStroke.beginFill(this.fillColor, useAdjustingLocation)

          for (const line of group.lines) {

            this.drawingStroke.processFill(render, line)
          }

          this.drawingStroke.finishFill(render)
        }
      }
    }
  }

  drawForegroundForEditMode(
    render: CanvasRender,
    layer: VectorLayer,
    geometry: VectorLayerGeometry,
    documentData: DocumentData,
    operationUnitID: OperationUnitID,
    isEditMode: boolean,
    isSelectedLayer: boolean,
    drawStrokes: boolean,
    drawPoints: boolean,
    isModalToolRunning: boolean
  ) {

    // drawing parameters
    const widthRate = this.getWidthRate(layer, documentData)

    this.getStrokeColor(this.strokeColor, layer, documentData, isEditMode, !isSelectedLayer)

    // drawing geometry lines

    const useAdjustingLocation = isModalToolRunning

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        if (!render.isInViewRectangle(group.runtime.area.centerLocation, group.runtime.area.range)) {
          continue
        }

        for (const stroke of group.lines) {

          if (!isSelectedLayer) {

            if (layer.drawLineType != DrawLineTypeID.none) {

              this.drawingStroke.drawVectorStroke(render, stroke, this.strokeColor, widthRate, 0.0, useAdjustingLocation, false)
            }
          }
          else {

            if (operationUnitID == OperationUnitID.strokePoint) {

              if (drawStrokes) {

                this.drawingStroke.drawVectorStroke(render, stroke, this.strokeColor, widthRate, 0.0, useAdjustingLocation, false)
              }

              if (drawPoints) {

                this.editorDrawer.drawVectorLinePoints(stroke, this.strokeColor, useAdjustingLocation)
              }
            }
            else if (operationUnitID == OperationUnitID.strokeSegment) {

              if (drawStrokes) {

                this.drawingStroke.drawVectorStrokeSegment(this.canvasRender, stroke, this.strokeColor, this.drawStyle.selectedVectorLineColor, widthRate,  useAdjustingLocation)
              }
            }
            else if (operationUnitID == OperationUnitID.stroke) {

              if (drawStrokes) {

                let color: Vec4
                if ((stroke.isSelected && stroke.runtime.modifyFlag != VectorStrokeModifyFlagID.selectedToUnselected)
                  || stroke.runtime.modifyFlag == VectorStrokeModifyFlagID.unselectedToSelected) {

                  color = this.drawStyle.selectedVectorLineColor
                }
                else {

                  color = this.strokeColor
                }

                const lineWidthBolding = this.editorDrawer.getCurrentViewScaleLineWidth(stroke.runtime.isCloseToMouse ? 2.0 : 0.0)

                this.drawingStroke.drawVectorStroke(render, stroke, color, widthRate, lineWidthBolding, useAdjustingLocation, false)
              }
            }
          }
        }
      }
    }
  }

  drawBackgroundExtra(
    render: CanvasRender,
    drawable: FillDrawable,
    geometry: VectorLayerGeometry,
    isSelectedLayer: boolean,
    isEditMode: boolean,
    isModalToolRunning: boolean
  ) {

    if (drawable.fillAreaType == FillAreaTypeID.none) {
      return
    }
    if (!isSelectedLayer && isEditMode) {
      return
    }

    const useAdjustingLocation = isModalToolRunning

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        if (!render.isInViewRectangle(group.runtime.area.centerLocation, group.runtime.area.range)) {
          continue
        }

        for (const connectionInfo of group.runtime.connectionInfos) {

          this.editorDrawer.drawVectorStrokeConnectionInfo(render, connectionInfo, useAdjustingLocation)
        }
      }
    }
  }
}
