import { CommandBase } from '../command'
import { float, int, Lists, Logic_Points } from '../common-logics'
import { SubToolContext, SubToolDrawingContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import { VectorLayer, VectorLayerGeometry, VectorStrokeModifyFlagID, VectorPoint, VectorStroke, VectorStrokeDrawingUnit, VectorStrokeGroup } from '../document-data'
import { VectorPointLogic, VectorStrokeHitTestLogic, VectorStrokeLogic } from '../document-logic'
import { ToolPointerEvent } from '../tool'
import { ShortcutCommandID } from '../user-setting'
import { Tool_ScratchLine } from './scratch-line'

interface LineOverlappingInfo {

  isAvailable: boolean
  overlap_FirstIndex: int
  overlap_LastIndex: int
}

interface StrokeSearchResult {

  isAvailable: boolean
  stroke: VectorStroke | null
  strokeIndex: int
  segmentIndex: int
  unit: VectorStrokeDrawingUnit | null
  group: VectorStrokeGroup | null
}

class SubjoinProcessingState {

  newLine: VectorStroke | null = null
  subjoinedStroke: StrokeSearchResult | null = null
  subjoinedForward = false
  deleteLines: VectorStroke[] = []
}

export class Tool_ScratchLineDraw extends Tool_ScratchLine {

  helpText = '既存の線の端点近くに線を描いて線を結合します。'

  editLineVec = vec3.fromValues(0.0, 0.0, 0.0)
  targetLineVec = vec3.fromValues(0.0, 0.0, 0.0)

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawaBrushCursor(ctx.brushBaseSize, ctx.currentVectorLayer.lineWidthBiasRate)

    drawing.editorDrawer.drawPointerCursor(ctx.toolBaseViewRadius)

    if (this.resampledStroke != null) {

      drawing.editorDrawer.drawOperatorSolidStroke(this.resampledStroke, ctx.currentVectorLayer.lineWidthBiasRate)
    }
  }

  mouseUp(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    ctx.setRedrawEditorWindow()

    if (!this.isEditing
      || this.editStroke == null) {

      this.resetState(false)
      return
    }

    VectorStrokeLogic.calculateParameters(this.editStroke)

    if (VectorStrokeLogic.isEmptyStroke(this.editStroke)) {

      this.resetState(false)
      return
    }

    this.editStroke = this.generateResampledEditorStroke(this.editStroke, ctx)

    this.executeCommand(ctx)

    this.resetState(false)
  }

  keydown(_key: string, _commandID: ShortcutCommandID, _ctx: SubToolContext): boolean { // @override

    return false
  }

  protected generateResampledEditorStroke(editorLine: VectorStroke, ctx: SubToolContext): VectorStroke { // @virtual

    const resamplingUnitLength = ctx.getViewScaledResamplingUnitLengthForEdit()

    const resampledLine = VectorStrokeLogic.createResampledLine(editorLine, resamplingUnitLength)

    VectorStrokeLogic.smooth(resampledLine, this.strokeSmoothLevel)

    return resampledLine

  }

  private getNearestStroke(targetPoint: VectorPoint, geometry: VectorLayerGeometry, minDistanceRange: float): StrokeSearchResult {

    let nearestStroke: VectorStroke = null
    let nearestStroke_index = VectorStrokeHitTestLogic.InvalidIndex
    let nearestStroke_segmentIndex = VectorStrokeHitTestLogic.InvalidIndex
    let nearestStroke_drawingUnit: VectorStrokeDrawingUnit = null
    let nearestStroke_group: VectorStrokeGroup = null

    let minDistance = VectorStrokeHitTestLogic.MaxDistance

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        for (const [strokeIndex, stroke] of group.lines.entries()) {

          if (stroke.runtime.modifyFlag != VectorStrokeModifyFlagID.none) {
            continue
          }

          if (VectorStrokeHitTestLogic.hitTestLocationToStrokeByRectangle(targetPoint.location, stroke, minDistanceRange)) {

            const nearestSegmentIndex = VectorStrokeHitTestLogic.getNearestSegmentIndex(
              stroke,
              targetPoint.location
            )

            if (nearestSegmentIndex != VectorStrokeHitTestLogic.InvalidIndex) {

              const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                stroke.points[nearestSegmentIndex].location,
                stroke.points[nearestSegmentIndex + 1].location,
                targetPoint.location
              )

              if (distance < minDistanceRange) {

                if (distance < minDistance) {

                  minDistance = distance

                  nearestStroke = stroke
                  nearestStroke_index = strokeIndex
                  nearestStroke_segmentIndex = nearestSegmentIndex
                  nearestStroke_drawingUnit = unit
                  nearestStroke_group = group
                }
              }
            }
          }
        }
      }
    }

    return {
      isAvailable: (nearestStroke != null),
      stroke: nearestStroke,
      strokeIndex: nearestStroke_index,
      segmentIndex: nearestStroke_segmentIndex,
      unit: nearestStroke_drawingUnit,
      group: nearestStroke_group
    }
  }

  private getSearchDirectionForTargetLine(
    nearestStroke: VectorStroke,
    nearestStroke_segmentIndex: int,
    inputStroke_firstPoint: VectorPoint,
    inputStroke_secondPoint: VectorPoint
  ): { isAvailable: boolean, searchForward: boolean } {

    // Ditermine search-index direction
    const point1 = nearestStroke.points[nearestStroke_segmentIndex]
    const point2 = nearestStroke.points[nearestStroke_segmentIndex + 1]

    const firstPoint_Position = Logic_Points.pointToLineSegment_NormalizedPosition(
      point1.location,
      point2.location,
      inputStroke_firstPoint.location
    )

    const secondPoint_Position = Logic_Points.pointToLineSegment_NormalizedPosition(
      point1.location,
      point2.location,
      inputStroke_secondPoint.location
    )

    return {
      isAvailable: (secondPoint_Position != firstPoint_Position),
      searchForward: (secondPoint_Position >= firstPoint_Position)
    }
  }

  private getLineOverlappingInfo(
    sourcePoints: VectorPoint[],
    source_StartIndex: int,
    targetPoints: VectorPoint[],
    target_StartIndex: int,
    minDistanceRange: float,
    searchForward: boolean
  ): LineOverlappingInfo {

    // source側の重なっている領域のインデクスを検索する。
    // 前提として、二つの線はおおむね並行していて、同じ向きを向いているとする。
    // 重なる領域は、結果的に次のようになる。
    // 　・元の線…①重なっている領域の一つ外の点、②重なっている領域の点
    // 　・対象の線…①重なっている領域の点、②重なっている領域の一つ外側の点
    // この計算の結果に対応する点は、重なっている領域の内側にある用に検索される（ぴったり境界の位置である場合もある）

    let source_Index = source_StartIndex

    let target_Index = target_StartIndex

    let isAvailable = true
    let overlap_FirstIndex = -1
    let overlap_LastIndex = -1

    while (source_Index < sourcePoints.length
      && target_Index + 1 < targetPoints.length) {

      const sourcePoint = sourcePoints[source_Index]
      const targetPoint1 = targetPoints[target_Index]
      const targetPoint2 = targetPoints[target_Index + 1]

      // tests whether the edit-point is nearby the target-line
      const distance = Logic_Points.pointToLine_Distance(
        targetPoint1.location,
        targetPoint2.location,
        sourcePoint.location
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
        }
      }
    }

    const firstIndex = this.getReorderedPointIndex(sourcePoints.length, overlap_FirstIndex, searchForward)
    const lastIndex = this.getReorderedPointIndex(sourcePoints.length, overlap_LastIndex, searchForward)

    return {
      isAvailable: isAvailable,
      overlap_FirstIndex: searchForward ? firstIndex : lastIndex,
      overlap_LastIndex: searchForward ? lastIndex : firstIndex
    }
  }

  private createSubjoinedLine(topPoints: VectorPoint[], followingPoints: VectorPoint[], followingPoints_OverlappingInfo: LineOverlappingInfo, resamplingUnitLength: float, subjoinToAfter: boolean): VectorStroke {

    let newPoints: VectorPoint[] = []

    let subjoinedIndex: int
    if (subjoinToAfter) {

      Lists.addRange(newPoints, topPoints)

      subjoinedIndex = newPoints.length - 1

      const followingPoints_startIndex = (
        followingPoints_OverlappingInfo.overlap_LastIndex != -1
        ? followingPoints_OverlappingInfo.overlap_LastIndex + 1
        : 0
      )
      Lists.addRange(newPoints, Lists.getRangeToLast(followingPoints, followingPoints_startIndex))
    }
    else {

      const followingPoints_length = (
        followingPoints_OverlappingInfo.overlap_FirstIndex != -1
        ? followingPoints_OverlappingInfo.overlap_FirstIndex
        : followingPoints.length
      )
      Lists.addRange(newPoints, Lists.getRange(followingPoints, 0, followingPoints_length))

      subjoinedIndex = newPoints.length - 1

      Lists.addRange(newPoints, topPoints)
    }

    if (subjoinedIndex < 0) {

      subjoinedIndex = 0
    }

    // resampling for neighbor points of subjoined part
    if (subjoinedIndex - 2 >= 0 && subjoinedIndex + 4 <= newPoints.length - 1) {

      const resampledPoins: VectorPoint[] = []

      Lists.addRange(resampledPoins, Lists.getRange(newPoints, 0, (subjoinedIndex - 2) + 1))

      VectorPointLogic.resamplePoints(
        resampledPoins
        , newPoints
        , subjoinedIndex - 1
        , subjoinedIndex + 3
        , resamplingUnitLength)

        Lists.addRange(resampledPoins, Lists.getRangeToLast(newPoints, subjoinedIndex + 4))

      newPoints = resampledPoins
    }

    const new_stroke = new VectorStroke()
    for (const point of newPoints) {

      new_stroke.points.push(VectorPoint.clone(point))
    }

    return new_stroke
  }

  private executeProcessForStroke(state: SubjoinProcessingState, input_stroke: VectorStroke, subjoinFromTailOfInput: boolean, ctx: SubToolContext, limitTargetForSurroundingFillLayer = false): boolean {

    // 注意：囲み塗りレイヤー対応のため、線の向きや順番を変えないこと

    // create
    const input_points = this.getReorderedPoints(input_stroke.points, subjoinFromTailOfInput)

    // get nearest line
    const input_firstPoint = input_points[0]
    const minDistanceRange = ctx.toolBaseViewRadius
    const nearest_stroke = this.getNearestStroke(input_firstPoint, ctx.currentVectorLayerGeometry, minDistanceRange)

    if (!nearest_stroke.isAvailable) {
      return false
    }

    // get searching direction
    const input_secondPoint = input_points[1]
    const searchDirection =  this.getSearchDirectionForTargetLine(
      nearest_stroke.stroke, nearest_stroke.segmentIndex, input_firstPoint, input_secondPoint)

    if (!searchDirection.isAvailable) {
      return false
    }

    // special limitation for surrounding fill
    if (state.subjoinedStroke != null) {

      if (limitTargetForSurroundingFillLayer) {

        if (nearest_stroke.group != state.subjoinedStroke.group) {
          return false
        }

        const isAvailable = (
          (nearest_stroke.strokeIndex == state.subjoinedStroke.strokeIndex + 1 && !searchDirection.searchForward)
          || (nearest_stroke.strokeIndex == state.subjoinedStroke.strokeIndex - 1 && searchDirection.searchForward)
        )

        if (!isAvailable) {
          return false
        }
      }
      else {

        if (nearest_stroke.group != state.subjoinedStroke.group) {
          return false
        }
      }
    }

    // get points and index that has same direction with input stroke
    const target_reorderedPoints = this.getReorderedPoints(nearest_stroke.stroke.points, searchDirection.searchForward)

    const target_segmentIndex = this.getReorderedSegmentIndex(nearest_stroke.stroke.points.length, nearest_stroke.segmentIndex, searchDirection.searchForward)

    // get overlapping part
    const input_overlappingInfo = this.getLineOverlappingInfo(
      input_points, 0, target_reorderedPoints, target_segmentIndex, minDistanceRange, searchDirection.searchForward)

    const target_overlappingInfo = this.getLineOverlappingInfo(
      target_reorderedPoints, target_segmentIndex, input_points, 0, minDistanceRange, searchDirection.searchForward)

    if (!input_overlappingInfo.isAvailable || !target_overlappingInfo.isAvailable) {
      return false
    }

    // join the two lines
    const reordered_inputPoints = this.getReorderedPoints(input_points, searchDirection.searchForward)

    const resamplingUnitLengthBrush = ctx.getViewScaledResamplingUnitLengthForBrush()

    const new_stroke = this.createSubjoinedLine(
      nearest_stroke.stroke.points,
      reordered_inputPoints,
      input_overlappingInfo,
      resamplingUnitLengthBrush,
      searchDirection.searchForward
    )

    VectorStrokeLogic.calculateParameters(new_stroke)

    // delete the joined line
    nearest_stroke.stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.delete
    state.deleteLines.push(nearest_stroke.stroke)

    state.newLine = new_stroke
    state.subjoinedStroke = nearest_stroke
    state.subjoinedForward = searchDirection.searchForward

    return true
  }

  protected getReorderedPoints(points: VectorPoint[], searchForward: boolean): VectorPoint[] {

    return (
      searchForward
      ? points
      : Lists.cloneReversed(points)
    )
  }

  protected getReorderedSegmentIndex(strokePointCount: int, segmentIndex: int, searchForward: boolean): int {

    return (
      searchForward
      ? segmentIndex
      : (strokePointCount - 1) - segmentIndex - 1
    )
  }

  protected getReorderedPointIndex(strokePointCount: int, pointIndex: int, searchForward: boolean): int {

    if (pointIndex < 0) {
      return pointIndex
    }

    return (
      searchForward
      ? pointIndex
      : (strokePointCount - 1) - pointIndex
    )
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    if (VectorStrokeLogic.isEmptyStroke(this.editStroke)) {
      return
    }

    let state = new SubjoinProcessingState()

    // process forward direction for edit line
    const forward_isAvailable  = this.executeProcessForStroke(state, this.editStroke, true, ctx)

    // process backward direction for edit line if not processed
    let backward_isAvailable = false
    if (!forward_isAvailable) {

      state = new SubjoinProcessingState()
      backward_isAvailable = this.executeProcessForStroke(state, this.editStroke, false, ctx)
    }

    // process to connect to another line
    if (forward_isAvailable || backward_isAvailable) {

      const first_subjoinedStroke = state.subjoinedStroke

      const limitTargetForSurroundingFillLayer =  VectorLayer.isSurroundingFillLayer(ctx.currentLayer)
      this.executeProcessForStroke(state, state.newLine, !state.subjoinedForward, ctx, limitTargetForSurroundingFillLayer)

      // 注意：囲み塗りレイヤーへの対応のため、ストロークのインデクスが変わらないようにすること

      VectorStrokeLogic.calculateParameters(state.newLine, ctx.currentVectorLayer.lineWidthBiasRate)

      const command = new Command_InsertStroke()
      command.setTarget(
        ctx.currentVectorLayer,
        ctx.currentVectorLayerGeometry,
        first_subjoinedStroke.group,
        state.newLine,
        first_subjoinedStroke.strokeIndex
      )

      ctx.commandHistory.executeCommand(command, ctx)
    }
    else {

      //this.executeAddDrawLine(this.editLine, ctx)
    }

    ctx.setRedrawCurrentLayer()
    ctx.setRedrawEditorWindow()
  }
}

export class Command_InsertStroke extends CommandBase {

  layer: VectorLayer = null
  geometry: VectorLayerGeometry = null
  group: VectorStrokeGroup = null
  stroke: VectorStroke = null
  insertIndex = -1

  setTarget(layer: VectorLayer, geometry: VectorLayerGeometry, group: VectorStrokeGroup, stroke: VectorStroke, insertIndex: int) {

    this.layer = layer
    this.geometry = geometry
    this.group = group
    this.stroke = stroke
    this.insertIndex = insertIndex
  }

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)

    this.defferedProcess.addGroup(this.layer, this.group, PostUpdateSituationTypeID.changesObjectShapes)
    this.defferedProcess.addGeometryForDeletingEmpties(this.geometry)
  }

  undo(_ctx: SubToolContext) { // @override

    Lists.removeAt(this.group.lines, this.insertIndex)
  }

  redo(_ctx: SubToolContext) { // @override

    Lists.insertAt(this.group.lines, this.insertIndex, this.stroke)
  }
}
