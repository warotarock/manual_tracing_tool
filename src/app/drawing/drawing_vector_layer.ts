import { DocumentData, DrawLineTypeID, FillAreaTypeID, FillDrawable, Layer, StrokeDrawable, VectorGeometry, VectorLayer, VectorLineModifyFlagID } from '../document_data'
import { OperationUnitID } from '../tool/constants'
import { ToolDrawingStyle } from "./drawing_style"
import { DrawingStrokeLogic } from './drawing_stroke'
import { float } from '../logics/conversion'

export class DrawingVectorLayerLogic {

  private drawStyle: ToolDrawingStyle = null
  private drawingStroke: DrawingStrokeLogic = null

  private editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5)
  private editOtherLayerFillColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5)

  link(drawStyle: ToolDrawingStyle, drawingStroke: DrawingStrokeLogic) {

    this.drawStyle = drawStyle
    this.drawingStroke = drawingStroke
  }

  getLineColor(drawable: StrokeDrawable, documentData: DocumentData, isEditMode: boolean, hideWhenEditMode: boolean) {

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

      vec4.copy(this.editOtherLayerLineColor, color)
      this.editOtherLayerLineColor[3] *= this.drawStyle.editModeOtherLayerAlphaAdjustRate

      color = this.editOtherLayerLineColor
    }

    return color
  }

  getFillColor(drawable: FillDrawable, documentData: DocumentData, isEditMode: boolean, hideWhenEditMode: boolean) {

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

      vec4.copy(this.editOtherLayerFillColor, color)
      this.editOtherLayerFillColor[3] *= this.drawStyle.editModeOtherLayerAlphaAdjustRate

      color = this.editOtherLayerFillColor
    }

    return color
  }

  getWidthRate(drawable: StrokeDrawable, documentData: DocumentData): float {

    return drawable.lineWidthBiasRate * documentData.lineWidthBiasRate
  }

  drawForeground(drawable: StrokeDrawable, geometry: VectorGeometry, documentData: DocumentData, isEditMode: boolean, isExporting: boolean, isModalToolRunning: boolean) {

    if (drawable.drawLineType == DrawLineTypeID.none) {
      return
    }

    const useAdjustingLocation = isModalToolRunning

    const widthRate = this.getWidthRate(drawable, documentData)

    const color = this.getLineColor(drawable, documentData, isEditMode, true)

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const line of group.lines) {

          this.drawingStroke.drawVectorLineStroke(line, color, widthRate, 0.0, useAdjustingLocation, isExporting)
        }
      }
    }
  }

  drawBackground(drawable: FillDrawable, geometry: VectorGeometry, documentData: DocumentData, isSelectedLayer: boolean, isEditMode: boolean, isExporting: boolean, isModalToolRunning: boolean) {

    if (drawable.fillAreaType == FillAreaTypeID.none) {
      return
    }

    const useAdjustingLocation = isModalToolRunning

    const color = this.getFillColor(drawable, documentData, isEditMode, !isSelectedLayer)

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        let continuousFill = false

        for (const line of group.lines) {

          this.drawingStroke.drawVectorLineFill(line, color, useAdjustingLocation, continuousFill)

          continuousFill = line.continuousFill
        }
      }
    }
  }

  drawForegroundForEditMode(layer: VectorLayer, geometry: VectorGeometry, documentData: DocumentData, operationUnitID: OperationUnitID, isEditMode: boolean, isSelectedLayer: boolean, drawStrokes: boolean, drawPoints: boolean, isModalToolRunning: boolean) {

    // drawing parameters
    const widthRate = this.getWidthRate(layer, documentData)

    const lineColor = this.getLineColor(layer, documentData, isEditMode, !isSelectedLayer)

    // drawing geometry lines

    const useAdjustingLocation = isModalToolRunning

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const line of group.lines) {

          if (!isSelectedLayer) {

            if (layer.drawLineType != DrawLineTypeID.none) {

              this.drawingStroke.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, false)
            }
          }
          else {

            if (operationUnitID == OperationUnitID.linePoint) {

              if (drawStrokes) {

                this.drawingStroke.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, false)
              }

              if (drawPoints) {

                this.drawingStroke.drawVectorLinePoints(line, lineColor, useAdjustingLocation)
              }
            }
            else if (operationUnitID == OperationUnitID.line
              || operationUnitID == OperationUnitID.lineSegment) {

              if (drawStrokes) {

                let color: Vec3
                if ((line.isSelected && line.modifyFlag != VectorLineModifyFlagID.selectedToUnselected)
                  || line.modifyFlag == VectorLineModifyFlagID.unselectedToSelected) {

                  color = this.drawStyle.selectedVectorLineColor
                }
                else {

                  color = lineColor
                }

                const lineWidthBolding = (line.isCloseToMouse ? 2.0 : 0.0)

                this.drawingStroke.drawVectorLineStroke(line, color, widthRate, lineWidthBolding, useAdjustingLocation, false)
              }
            }
          }
        }
      }
    }
  }
}
