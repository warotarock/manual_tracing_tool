import { float, int } from '../common-logics'
import { VectorPoint, VectorStroke } from '../document-data'
import { VectorStrokeLogic } from '../document-logic'
import { CanvasRender, CanvasRenderLineCap } from '../render'

enum StrokeDrawingMode {
  stroke,
  fill,
}

enum CurrentSelectionStateID {
  unset,
  selected,
  notSelected,
}

class StrokeDrawingState {

  drawingMode = StrokeDrawingMode.stroke
  color: Vec4 | null = null
  useAdjustingLocation = false
  isExporting = false
  strokeWidthBiasRate = 1.0
  strokeWidthBolding = 0.0

  strokeStarted = false
  drawingRemainging = false
  currentLineWidth = -1.0
  currentSelection = CurrentSelectionStateID.unset

  begin(drawingMode: StrokeDrawingMode) {

    this.drawingMode = drawingMode
    this.useAdjustingLocation = false
    this.isExporting = false
    this.strokeWidthBiasRate = 1.0
    this.strokeWidthBolding = 0.0

    this.strokeStarted = false
    this.drawingRemainging = false
    this.currentLineWidth = 0.0
    this.currentSelection = CurrentSelectionStateID.unset
  }
}

export class DrawingStrokeLogic {

  private toLocation = vec3.create()
  private fromLocation = vec3.create()
  private drawingState = new StrokeDrawingState()

  isStrokeInViewRectangle(render: CanvasRender, stroke: VectorStroke): boolean {

    if (VectorStrokeLogic.isEmptyStroke(stroke)) {
      return true
    }

    return render.isInViewRectangle(stroke.runtime.area.centerLocation, stroke.runtime.area.range)
  }

  beginStroke(color: Vec4, strokeWidthBiasRate: float, strokeWidthBolding: float, useAdjustingLocation: boolean, isExporting: boolean) {

    this.drawingState.begin(StrokeDrawingMode.stroke)
    this.drawingState.color = color
    this.drawingState.useAdjustingLocation = useAdjustingLocation
    this.drawingState.isExporting = isExporting
    this.drawingState.strokeWidthBiasRate = strokeWidthBiasRate
    this.drawingState.strokeWidthBolding = strokeWidthBolding
    this.drawingState.isExporting = isExporting
  }

  finishStroke(render: CanvasRender) {

    if (this.drawingState.drawingRemainging) {

      render.stroke()
      this.drawingState.drawingRemainging = false
    }
  }

  drawVectorStroke(
    render: CanvasRender,
    stroke: VectorStroke,
    color: Vec4,
    strokeWidthBiasRate: float,
    strokeWidthBolding: float,
    useAdjustingLocation: boolean,
    isExporting: boolean
  ) {

    this.beginStroke(color, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation, isExporting)

    this.processStroke(render, stroke)

    this.finishStroke(render)
  }

  processStroke(render: CanvasRender, stroke: VectorStroke) {

    const state = this.drawingState

    if ((!state.isExporting && !this.isStrokeInViewRectangle(render, stroke))
      || VectorStrokeLogic.isEmptyStroke(stroke)
    ) {
      return
    }

    if (!state.strokeStarted) {

      render.setStrokeColorV(state.color)
      render.setLineCap(CanvasRenderLineCap.round)
    }

    for (let pointIndex = 0; pointIndex < stroke.points.length - 1;) {

      const fromPoint = stroke.points[pointIndex]
      const lineWidth = (state.useAdjustingLocation ? fromPoint.adjustingLineWidth : fromPoint.lineWidth)

      if (state.drawingMode == StrokeDrawingMode.stroke && lineWidth != state.currentLineWidth) {

        if (state.drawingRemainging) {

          render.stroke()
          state.strokeStarted = false
          state.drawingRemainging = false
        }

        render.setStrokeWidth(lineWidth * state.strokeWidthBiasRate + state.strokeWidthBolding)
        state.currentLineWidth = lineWidth
      }

      this.processStrokeSegment(render, stroke, pointIndex, state)

      pointIndex++
    }
  }

  drawVectorStrokeSegment(render: CanvasRender, stroke: VectorStroke, color: Vec4, selected_color: Vec4, strokeWidthBiasRate: float, useAdjustingLocation: boolean) {

    if (!this.isStrokeInViewRectangle(render, stroke)) {
      return
    }

    if (VectorStrokeLogic.isEmptyStroke(stroke)) {
      return
    }

    const state = this.drawingState

    state.begin(StrokeDrawingMode.stroke)
    state.useAdjustingLocation = useAdjustingLocation

    render.setLineCap(CanvasRenderLineCap.round)

    for (let pointIndex = 0; pointIndex < stroke.points.length - 1; pointIndex++) {

      const fromPoint = stroke.points[pointIndex]
      const lineWidth = this.getPointWidth(fromPoint, state.useAdjustingLocation)
      const selection = fromPoint.isSelected ? CurrentSelectionStateID.selected : CurrentSelectionStateID.notSelected

      if (lineWidth != state.currentLineWidth || selection != state.currentSelection) {

        if (state.drawingRemainging) {

          render.stroke()
          state.strokeStarted = false
          state.drawingRemainging = false
        }

        render.setStrokeWidth(lineWidth * strokeWidthBiasRate)
        state.currentLineWidth = lineWidth

        render.setStrokeColorV(selection == CurrentSelectionStateID.selected ? selected_color : color)
        state.currentSelection = selection
      }

      this.processStrokeSegment(render, stroke, pointIndex, state)
    }

    if (state.drawingRemainging) {

      render.stroke()
      state.drawingRemainging = false
    }
  }

  beginFill(color: Vec4, useAdjustingLocation: boolean) {

    this.drawingState.begin(StrokeDrawingMode.fill)
    this.drawingState.color = color
    this.drawingState.useAdjustingLocation = useAdjustingLocation
  }

  finishFill(render: CanvasRender) {

    if (this.drawingState.drawingRemainging) {

      render.fill()
      this.drawingState.drawingRemainging = false
    }
  }

  processFill(render: CanvasRender, stroke: VectorStroke) {

    if (VectorStrokeLogic.isEmptyStroke(stroke)) {
      return
    }

    const state = this.drawingState

    if (!state.strokeStarted) {

      render.setLineCap(CanvasRenderLineCap.round)
      render.setFillColorV(state.color)
    }

    for (let pointIndex = 0; pointIndex < stroke.points.length - 1; pointIndex++) {

      this.processStrokeSegment(render, stroke, pointIndex, state)
    }
  }

  private getPointLocation(point: VectorPoint, useAdjustingLocation: boolean): Vec3 {

    return (useAdjustingLocation ? point.adjustingLocation : point.location)
  }

  private getPointWidth(point: VectorPoint, useAdjustingLocation: boolean): float {

    return (useAdjustingLocation ? point.adjustingLineWidth : point.lineWidth)
  }

  private processStrokeSegment(render: CanvasRender, stroke: VectorStroke, pointIndex: int, state: StrokeDrawingState) {

    const fromPoint = stroke.points[pointIndex]
    const fromLocation = this.getPointLocation(fromPoint, state.useAdjustingLocation)

    const toPoint = stroke.points[pointIndex + 1]
    const toLocation = this.getPointLocation(toPoint, state.useAdjustingLocation)

    const lengthFrom = (state.useAdjustingLocation ? fromPoint.adjustingLengthFrom : 1.0)
    const lengthTo = (state.useAdjustingLocation ? fromPoint.adjustingLengthTo : 0.0)

    if (lengthFrom == 1.0) {

      // draw segment's full length
      if (!state.strokeStarted) {

        render.beginPath()
        render.moveToV(fromLocation)
        state.strokeStarted = true
      }
      else if (pointIndex == 0) {

        render.lineToV(fromLocation)
      }

      render.lineToV(toLocation)
      state.drawingRemainging = true
    }
    else {

      // draw segment's from-side part
      if (lengthFrom > 0.0) {

        if (!state.strokeStarted) {

          render.beginPath()
          render.moveToV(fromLocation)
          state.strokeStarted = true
        }

        vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom)
        render.lineToV(this.toLocation)
        state.drawingRemainging = true

        if (state.drawingMode == StrokeDrawingMode.stroke) {

          render.stroke()
          state.strokeStarted = false
          state.drawingRemainging = false
        }
      }

      // draw segment's to-side part
      if (lengthTo > 0.0 && lengthTo < 1.0) {

        if (state.drawingMode == StrokeDrawingMode.stroke && state.drawingRemainging) {

          render.stroke()
          state.strokeStarted = false
          state.drawingRemainging = false
        }

        vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo)

        if (!state.strokeStarted) {

          render.beginPath()
          render.moveToV(this.fromLocation)
          state.strokeStarted = true
        }
        else {

          render.lineToV(this.fromLocation)
          state.drawingRemainging = false
        }

        render.lineToV(toLocation)
        state.drawingRemainging = true
      }
    }
  }
}
