import { float, int, Lists } from '../logics/conversion'
import { VectorGeometry, VectorLineModifyFlagID, VectorPoint, VectorStroke } from '../document_data'
import { Command_DeleteFlaggedPoints } from '../commands/delete_points'
import { Logic_Edit_Line, Logic_Edit_Points } from '../logics/edit_vector_layer'
import { Logic_Stroke } from '../logics/stroke'
import { Logic_Points } from '../logics/points'
import { SubToolContext } from '../context/subtool_context'
import { SubToolDrawingContext } from '../context/subtool_drawing_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'
import { Command_AddLine } from './draw_line'
import { Tool_ScratchLine } from './scratch_line'
import { ToolKeyboardEvent } from '../tool/tool_keyboard_event'

class SubjoinProcessingState {

  isAvailable = true

  nearestLine: VectorStroke = null
  nearestLine_SegmentIndex = Logic_Stroke.InvalidIndex

  targetLine_SearchForward = false
  targetLine_OrderedPoints: VectorPoint[] = null
  targetLine_SegmentIndex = Logic_Stroke.InvalidIndex

  subjoinLine_OrderedPoints: VectorPoint[] = null

  newLine: VectorStroke = null
  deleteLines: VectorStroke[] = []
}

class LineOverlappingInfo {

  isAvailable = true
  overlap_FirstIndex = -1
  overlap_LastIndex = -1
}

export class Tool_ScratchLineDraw extends Tool_ScratchLine {

  helpText = '既存の線の端点近くに線を描いて線を結合します。'

  editLineVec = vec3.fromValues(0.0, 0.0, 0.0)
  targetLineVec = vec3.fromValues(0.0, 0.0, 0.0)

  minDistanceRangeRate = 2.0

  getMinDistanceRange(ctx: SubToolContext): float {

    return ctx.getViewScaledLength(ctx.mouseCursorRadius * this.minDistanceRangeRate)
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    const minDistanceRange = this.getMinDistanceRange(ctx)
    drawing.editorDrawer.drawMouseCursorCircle(minDistanceRange)

    if (this.editLine != null) {

      drawing.editorDrawer.drawEditorEditLineStroke(this.editLine)
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.setRedrawEditorWindow()

    if (this.editLine == null) {
      return
    }

    if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {

      const point = new VectorPoint()
      vec3.copy(point.location, e.location)
      vec3.copy(point.adjustingLocation, e.location)
      point.lineWidth = ctx.drawLineBaseWidth

      this.editLine.points.push(point)
    }
  }

  mouseUp(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (this.isLeftButtonEdit) {

      this.isLeftButtonEdit = false

      if (this.editLine == null
        || this.editLine.points.length <= 1) {

        return
      }

      Logic_Edit_Line.calculateParameters(this.editLine)

      this.editLine = this.generateCutoutedResampledLine(this.editLine, ctx)

      this.executeCommand(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()

      return
    }
  }

  keydown(_e: ToolKeyboardEvent, _ctx: SubToolContext): boolean { // @override

    return false
  }

  private getNearestLine(state: SubjoinProcessingState, targetPoint: VectorPoint, geometry: VectorGeometry, minDistanceRange: float) {

    let nearestLine: VectorStroke = null
    let nearestLine_SegmentIndex = Logic_Stroke.InvalidIndex

    let minDistance = Logic_Stroke.MaxDistance

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const stroke of group.lines) {

          if (stroke.modifyFlag != VectorLineModifyFlagID.none) {

            continue
          }

          if (Logic_Stroke.hitTestLocationToStrokeByRectangle(targetPoint.location, stroke, minDistanceRange)) {

            const nearestSegmentIndex = Logic_Stroke.getNearestSegmentIndex(
              stroke,
              targetPoint.location
            )

            if (nearestSegmentIndex != Logic_Stroke.InvalidIndex) {

              const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                stroke.points[nearestSegmentIndex].location,
                stroke.points[nearestSegmentIndex + 1].location,
                targetPoint.location
              )

              if (distance < minDistanceRange) {

                if (distance < minDistance) {

                  minDistance = distance

                  nearestLine = stroke
                  nearestLine_SegmentIndex = nearestSegmentIndex
                }
              }
            }
          }
        }
      }
    }

    if (nearestLine == null) {

      state.isAvailable = false
      return false
    }

    state.isAvailable = true
    state.nearestLine = nearestLine
    state.nearestLine_SegmentIndex = nearestLine_SegmentIndex
  }

  private getSearchDirectionForTargetLine(state: SubjoinProcessingState, editLinePoint1: VectorPoint, editLinePoint2: VectorPoint) {

    const nearestLine = state.nearestLine

    // Ditermine search-index direction
    const point1 = nearestLine.points[state.nearestLine_SegmentIndex]
    const point2 = nearestLine.points[state.nearestLine_SegmentIndex + 1]

    const firstPoint_Position = Logic_Points.pointToLineSegment_NormalizedPosition(
      point1.location,
      point2.location,
      editLinePoint1.location
    )

    const secondPoint_Position = Logic_Points.pointToLineSegment_NormalizedPosition(
      point1.location,
      point2.location,
      editLinePoint2.location
    )

    if (secondPoint_Position == firstPoint_Position) {

      state.isAvailable = false
      return
    }

    state.targetLine_SearchForward = (secondPoint_Position >= firstPoint_Position)
  }

  private getLineOverlappingInfo(sourcePoints: VectorPoint[], source_StartIndex: int, targetPoints: VectorPoint[], target_StartIndex: int, minDistanceRange: float): LineOverlappingInfo {

    //重なる領域について
    //・元の線…①重なっている領域の一つ外の点、②重なっている領域の点
    //・対象の線…①重なっている領域の点、②重なっている領域の一つ外側の点
    //この領域を記録する値は、常に開始位置の値が終了位置の値以下とする（配列のインデクスそのまま）
    //その値に対応する点は重なっている領域の内側にあるとする（ぴったり境界の位置も含む）

    let source_Index = source_StartIndex

    let target_Index = target_StartIndex
    let target_IndexNext = target_StartIndex + 1

    let isAvailable = true
    let overlap_FirstIndex = -1
    let overlap_LastIndex = -1

    while (source_Index < sourcePoints.length
      && target_IndexNext < targetPoints.length) {

      const sourcePoint = sourcePoints[source_Index]
      const targetPoint1 = targetPoints[target_Index]
      const targetPoint2 = targetPoints[target_IndexNext]

      // tests whether the edit-point is nearby the target-line
      const distance = Logic_Points.pointToLine_Distance(
        sourcePoint.location,
        targetPoint1.location,
        targetPoint2.location
      )

      if (distance > minDistanceRange) {

        isAvailable = false
        break
      }

      // if the edit-point is nearby, increment any one of search-index
      const localPosition = Logic_Points.pointToLineSegment_NormalizedPosition(
        targetPoint1.location,
        targetPoint2.location,
        sourcePoint.location
      )

      if (localPosition <= 1.0) {

        if (localPosition >= 0.0) {

          if (overlap_FirstIndex == -1) {

            overlap_FirstIndex = source_Index
          }

          overlap_LastIndex = source_Index
        }

        if (source_Index >= sourcePoints.length - 1) {

          break
        }
        else {

          source_Index++
        }
      }
      else {

        if (target_Index >= targetPoints.length - 2) {

          break
        }
        else {

          target_Index++
          target_IndexNext++
        }
      }
    }

    const info = new LineOverlappingInfo()
    info.isAvailable = isAvailable
    info.overlap_FirstIndex = overlap_FirstIndex
    info.overlap_LastIndex = overlap_LastIndex

    return info
  }

  private createSubjoinedLine(topPoints: VectorPoint[], topPonts_OverlappingInfo: LineOverlappingInfo, followingPoints: VectorPoint[], followingPoints_OverlappingInfo: LineOverlappingInfo, resamplingUnitLength: float, subjoinToAfter: boolean): VectorStroke {

    let newPoints: VectorPoint[] = []

    let subjoinedIndex: int
    if (subjoinToAfter) {

      Lists.addRange(newPoints, topPoints)

      subjoinedIndex = newPoints.length - 1

      Lists.addRange(newPoints, Lists.getRangeToLast(followingPoints, followingPoints_OverlappingInfo.overlap_LastIndex + 1))
    }
    else {

      Lists.addRange(newPoints, Lists.getRange(topPoints, 0, topPonts_OverlappingInfo.overlap_FirstIndex))

      subjoinedIndex = newPoints.length - 1

      Lists.addRange(newPoints, followingPoints)
    }

    if (subjoinedIndex < 0) {

      subjoinedIndex = 0
    }

    // resampling for neighbor points of subjoined part
    if (subjoinedIndex - 2 >= 0 && subjoinedIndex + 4 <= newPoints.length - 1) {

      const resampledPoins: VectorPoint[] = []

      Lists.addRange(resampledPoins, Lists.getRange(newPoints, 0, (subjoinedIndex - 2) + 1))

      Logic_Edit_Points.resamplePoints(
        resampledPoins
        , newPoints
        , subjoinedIndex - 1
        , subjoinedIndex + 3
        , resamplingUnitLength)

        Lists.addRange(resampledPoins, Lists.getRangeToLast(newPoints, subjoinedIndex + 4))

      newPoints = resampledPoins
    }

    const newLine = new VectorStroke()
    for (const point of newPoints) {

      newLine.points.push(VectorPoint.clone(point))
    }

    return newLine
  }

  private executeProcessForStroke(state: SubjoinProcessingState, subjoinLine: VectorStroke, subjoinToAfter: boolean, ctx: SubToolContext) {

    // get nearest line
    if (subjoinToAfter) {

      state.subjoinLine_OrderedPoints = Lists.clone(subjoinLine.points)
    }
    else {

      state.subjoinLine_OrderedPoints = Lists.reverse(subjoinLine.points)
    }

    const editLineFirstPoint = state.subjoinLine_OrderedPoints[0]

    const minDistanceRange = this.getMinDistanceRange(ctx)

    this.getNearestLine(state, editLineFirstPoint, ctx.currentVectorGeometry, minDistanceRange)

    if (!state.isAvailable) {

      return
    }

    // get searching direction
    const editLineSecondPoint = state.subjoinLine_OrderedPoints[1]

    this.getSearchDirectionForTargetLine(state, editLineFirstPoint, editLineSecondPoint)

    if (!state.isAvailable) {

      return
    }

    // get overlapping part
    if (state.targetLine_SearchForward) {

      state.targetLine_OrderedPoints = Lists.clone(state.nearestLine.points)

      state.targetLine_SegmentIndex = state.nearestLine_SegmentIndex
    }
    else {

      state.targetLine_OrderedPoints = Lists.reverse(state.nearestLine.points)

      state.targetLine_SegmentIndex = (state.nearestLine.points.length - 1) - state.nearestLine_SegmentIndex - 1
    }

    const editLine_OverlappingInfo = this.getLineOverlappingInfo(
      state.subjoinLine_OrderedPoints, 0, state.targetLine_OrderedPoints, state.targetLine_SegmentIndex, minDistanceRange)

    const nearestLine_OverlappingInfo = this.getLineOverlappingInfo(
      state.targetLine_OrderedPoints, state.targetLine_SegmentIndex, state.subjoinLine_OrderedPoints, 0, minDistanceRange)

    if (!editLine_OverlappingInfo.isAvailable || !nearestLine_OverlappingInfo.isAvailable) {

      state.isAvailable = false
      return
    }

    // join the two lines
    const resamplingUnitLength = ctx.getViewScaledDrawLineUnitLength()

    state.newLine = this.createSubjoinedLine(
      state.targetLine_OrderedPoints,
      nearestLine_OverlappingInfo,
      subjoinLine.points,
      editLine_OverlappingInfo,
      resamplingUnitLength,
      true
    )

    // delete the joined line
    state.nearestLine.modifyFlag = VectorLineModifyFlagID.deleteLine
    state.deleteLines.push(state.nearestLine)

    if (!subjoinToAfter) {

      state.newLine.points = Lists.reverse(state.newLine.points)
    }

    Logic_Edit_Line.calculateParameters(state.newLine)
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    if (this.editLine.points.length < 2) {

      return
    }

    let processingState = new SubjoinProcessingState()

    // process forward direction for edit line
    this.executeProcessForStroke(processingState, this.editLine, true, ctx)

    // process backward direction for edit line if not processed
    if (!processingState.isAvailable) {

      this.editLine.points = Lists.reverse(this.editLine.points)
      Logic_Edit_Line.calculateParameters(this.editLine)

      processingState = new SubjoinProcessingState()
      this.executeProcessForStroke(processingState, this.editLine, true, ctx)
    }

    // process to connect to another line
    if (processingState.isAvailable) {

      processingState.nearestLine = null
      processingState.nearestLine_SegmentIndex = -1
      processingState.subjoinLine_OrderedPoints = null
      processingState.targetLine_OrderedPoints = null
      processingState.targetLine_SearchForward = true
      processingState.targetLine_SegmentIndex = -1
      this.executeProcessForStroke(processingState, processingState.newLine, false, ctx)

      if (processingState.deleteLines.length > 0) {

        const command = new Command_DeleteFlaggedPoints()
        if (command.prepareEditTargets(ctx)) {

          ctx.commandHistory.executeCommand(command, ctx)
        }
      }

      {
        const command = new Command_AddLine()
        command.prepareEditTargets(ctx.currentVectorGroup, processingState.newLine)
        command.isContinued = true

        ctx.commandHistory.executeCommand(command, ctx)
      }
    }
    else {

      //this.executeAddDrawLine(this.editLine, ctx)
    }

    this.editLine = null

    ctx.setRedrawCurrentLayer()
    ctx.setRedrawEditorWindow()
  }
}
