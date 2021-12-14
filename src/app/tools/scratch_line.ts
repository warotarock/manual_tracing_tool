import { CommandBase } from '../command/command'
import { float, int, Lists } from '../logics/conversion'
import { Layer, LinePointModifyFlagID, VectorGeometry, VectorPoint, VectorStroke, VectorStrokeGroup
  } from '../document_data'
import { Logic_Edit_Line, Logic_Edit_Points, Logic_Edit_VectorLayer } from '../logics/edit_vector_layer'
import { HitTest_Line_PointToLineByDistanceSingle } from '../logics/hittest'
import { Maths } from '../logics/math'
import { Logic_Points } from '../logics/points'
import { SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { SubToolDrawingContext } from '../context/subtool_drawing_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { ToolKeyboardEvent } from '../tool/tool_keyboard_event'

export class Tool_ScratchLine_CandidatePair {

  targetPoint: VectorPoint = null
  candidatePoint: VectorPoint = null

  normPosition = 0.0
  totalLength = 0.0
  influence = 0.0
}

class Tool_ScratchLine_EditPoint {

  pair: Tool_ScratchLine_CandidatePair = null

  newLocation = vec3.fromValues(0.0, 0.0, 0.0)
  oldLocation = vec3.fromValues(0.0, 0.0, 0.0)
}

export class Tool_ScratchLine extends SubTool {

  helpText = '右クリックまたはGで線を選択し、左クリックで線を修正します。'

  enableScratchEdit = true
  enableExtrude = false

  editLine: VectorStroke = null
  resampledLine: VectorStroke = null
  candidateLine: VectorStroke = null
  forwardExtrude = false
  extrudeLine: VectorStroke = null

  nearestPointLocation = vec3.fromValues(0.0, 0.0, 0.0)
  samplePoint = vec3.fromValues(0.0, 0.0, 0.0)

  lineSingleHitTester = new HitTest_Line_PointToLineByDistanceSingle()

  isLeftButtonEdit = false
  isRightButtonEdit = false

  maxResamplingDivisionCount = 51
  curveCheckPointCount = 3
  cutoutAngle = 30 / 180.0 * Math.PI

  editFalloffRadiusMinRate = 0.15
  editFalloffRadiusMaxRate = 2.0
  editFalloffRadiusContainsLineWidth = false
  editInfluence = 0.5

  editExtrudeMinRadiusRate = 0.5
  editExtrudeMaxRadiusRate = 1.0

  tool_ScratchLine_EditLine_Visible = true
  tool_ScratchLine_TargetLine_Visible = true
  tool_ScratchLine_SampledLine_Visible = true
  tool_ScratchLine_CandidatePoints_Visible = false
  tool_ScratchLine_ExtrudePoints_Visible = false

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerVectorLayer()
      && Layer.isEditTarget(ctx.currentLayer)
    )
  }

  mouseDown(e: ToolPointerEvent, _ctx: SubToolContext) { // @override

    if (e.isLeftButtonPressing()) {

      this.editLine = new VectorStroke()
      this.resampledLine = null
      this.candidateLine = null
      this.isLeftButtonEdit = true
    }
    else {

      this.isLeftButtonEdit = false
    }

    if (e.isRightButtonPressing()) {

      this.isRightButtonEdit = true
    }
    else {

      this.isRightButtonEdit = false
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.setRedrawEditorWindow()

    if (ctx.currentVectorLine == null || this.editLine == null) {
      return
    }

    if (this.isLeftButtonEdit && e.isLeftButtonPressing()) {

      const point = new VectorPoint()
      vec3.copy(point.location, e.location)
      vec3.copy(point.adjustingLocation, e.location)
      //point.lineWidth = ctx.mouseCursorViewRadius * 2.0
      point.lineWidth = ctx.drawLineBaseWidth

      this.editLine.points.push(point)
    }
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (this.isLeftButtonEdit) {

      this.isLeftButtonEdit = false

      if (ctx.currentVectorLine == null
        || this.editLine == null
        || this.editLine.points.length <= 1) {

        return
      }

      Logic_Edit_Line.calculateParameters(this.editLine)

      this.executeCommand(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()

      return
    }

    if (this.isRightButtonEdit) {

      this.isRightButtonEdit = false

      // Finish selectiong a line
      this.selectLine(e.location, ctx)

      return
    }
  }

  keydown(e: ToolKeyboardEvent, ctx: SubToolContext): boolean { // @override

    if (e.key == 'g') {

      // Select a line
      this.selectLine(ctx.mouseCursorLocation, ctx)

      return true
    }

    return false
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawMouseCursorCircle(ctx.mouseCursorViewRadius)

    if (this.tool_ScratchLine_EditLine_Visible) {

      if (this.editLine != null && this.resampledLine == null) {

        drawing.editorDrawer.drawEditorEditLineStroke(this.editLine)
      }
    }

    if (this.tool_ScratchLine_TargetLine_Visible) {

      const drawPointsAll = false

      if (ctx.currentVectorLine != null) {

        if (drawPointsAll) {

          if (ctx.currentVectorLayer != null) {

            drawing.editorDrawer.drawEditorVectorLinePoints(
              ctx.currentVectorLine
              , ctx.currentVectorLayer.layerColor
              , false
            )
          }
        }
        else {

          if (ctx.currentVectorLine.points.length >= 2) {

            drawing.editorDrawer.drawEditorVectorLinePoint(
              ctx.currentVectorLine.points[0]
              , ctx.drawStyle.sampledPointColor
              , false
            )

            drawing.editorDrawer.drawEditorVectorLinePoint(
              ctx.currentVectorLine.points[ctx.currentVectorLine.points.length - 1]
              , ctx.drawStyle.sampledPointColor
              , false
            )
          }
        }
      }
    }

    if (this.tool_ScratchLine_SampledLine_Visible) {

      if (this.resampledLine != null) {

        drawing.editorDrawer.drawEditorVectorLinePoints(this.resampledLine, drawing.style.sampledPointColor, false)
      }
    }

    if (this.tool_ScratchLine_CandidatePoints_Visible) {

      if (this.candidateLine != null) {

        drawing.editorDrawer.drawEditorVectorLinePoints(this.candidateLine, drawing.style.linePointColor, false)
      }
    }

    if (this.tool_ScratchLine_ExtrudePoints_Visible) {

      if (this.extrudeLine != null) {

        drawing.editorDrawer.drawEditorVectorLinePoints(this.extrudeLine, drawing.style.extrutePointColor, false)
      }
    }
  }

  selectLine(location: Vec3, ctx: SubToolContext) {

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    let hitedLine: VectorStroke = null
    let hitedGroup: VectorStrokeGroup = null

    ViewKeyframeLayer.forEachGeometry(viewKeyframeLayers, (geometry: VectorGeometry) => {

      if (hitedLine == null) {

        this.lineSingleHitTester.startProcess()
        this.lineSingleHitTester.processGeometry(geometry, location, ctx.mouseCursorViewRadius)

        hitedLine = this.lineSingleHitTester.hitedLine
        hitedGroup = this.lineSingleHitTester.hitedGroup
      }
    })

    if (hitedLine != null) {

      ctx.setCurrentVectorLine(hitedLine, hitedGroup)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
  }

  protected executeCommand(ctx: SubToolContext) { // @virtual

    let isExtrudeDone = false
    let isScratchingDone = false

    const targetLine = ctx.currentVectorLine
    const targetGroup = ctx.currentVectorGroup
    const oldPoints = targetLine.points

    if (this.enableExtrude) {

      const resamplingUnitLength = ctx.getViewScaledDrawLineUnitLength()
      const divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(this.editLine.totalLength, resamplingUnitLength)

      this.resampledLine = Logic_Edit_Line.createResampledLine(this.editLine, divisionCount)

      isExtrudeDone = this.executeExtrudeLine(targetLine, targetGroup, this.resampledLine, ctx)
    }

    if (this.enableScratchEdit) {

      this.resampledLine = this.generateCutoutedResampledLine(this.editLine, ctx)

      isScratchingDone = this.executeScratchingLine(targetLine, targetGroup, this.resampledLine, isExtrudeDone, ctx)
    }

    if (isExtrudeDone || isScratchingDone) {

      this.deleteDuplications(targetLine, targetGroup, ctx)
    }

    Logic_Edit_VectorLayer.clearPointModifyFlags(oldPoints)
  }

  // Adjusting edit line

  protected cutoutLine(result: VectorStroke): VectorStroke {

    const startIndex = this.searchCutoutIndex(result, false)
    const endIndex = this.searchCutoutIndex(result, true)

    result.points = Lists.getRange(result.points, startIndex, (endIndex - startIndex) + 1)

    Logic_Edit_Line.smooth(result)
    Logic_Edit_Line.applyAdjustments(result)

    return result
  }

  private searchCutoutIndex(editorLine: VectorStroke, isForward: boolean): int {

    const scanDirection = isForward ? 1 : -1

    let cutoutIndex = isForward ? (editorLine.points.length - 1) : 0

    const centerIndex = Math.floor(editorLine.points.length / 2)

    const limitCurvature = this.cutoutAngle

    let k = centerIndex
    while (k >= 0 && k < editorLine.points.length) {

      let scanCount = this.curveCheckPointCount
      let totalCurvature = 0.0
      let i = k + scanDirection
      while (i >= 0 && i < editorLine.points.length) {

        const point = editorLine.points[i]

        totalCurvature += point.curvature

        scanCount--
        if (scanCount == 0) {
          break
        }

        i += scanDirection
      }

      if (totalCurvature >= limitCurvature) {

        cutoutIndex = i
        break
      }

      k += scanDirection
    }

    return cutoutIndex
  }

  protected generateCutoutedResampledLine(editorLine: VectorStroke, ctx: SubToolContext): VectorStroke {

    const resamplingUnitLength = ctx.getViewScaledDrawLineUnitLength()
    let divisionCount = Logic_Edit_Points.clalculateSamplingDivisionCount(editorLine.totalLength, resamplingUnitLength)
    if (divisionCount > this.maxResamplingDivisionCount) {
      divisionCount = this.maxResamplingDivisionCount
    }

    const resampledLine = Logic_Edit_Line.createResampledLine(editorLine, divisionCount)

    //Logic_Edit_Line.smooth(resampledLine)

    this.cutoutLine(resampledLine)

    return resampledLine
  }

  // Extruding edit

  protected executeExtrudeLine(targetLine: VectorStroke, targetGroup: VectorStrokeGroup, resampledLine: VectorStroke, ctx: SubToolContext): boolean {

    // Create extrude points

    const baseRadius = ctx.mouseCursorViewRadius
    const editExtrudeMinRadius = baseRadius * this.editExtrudeMinRadiusRate
    const editExtrudeMaxRadius = baseRadius * this.editExtrudeMaxRadiusRate

    let forwardExtrude = true

    let extrudeLine = this.generateExtrudePoints(false
      , targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius) // forward extrude

    if (extrudeLine == null) {

      extrudeLine = this.generateExtrudePoints(true
        , targetLine, resampledLine, editExtrudeMinRadius, editExtrudeMaxRadius) // backword extrude

      if (extrudeLine != null) {

        forwardExtrude = false
      }
    }

    // Execute command

    this.forwardExtrude = forwardExtrude
    this.extrudeLine = extrudeLine

    if (extrudeLine != null && extrudeLine.points.length > 0) {

      const command = new Command_ExtrudeLine()
      command.targetLine = targetLine
      command.forwardExtrude = forwardExtrude
      command.extrudeLine = extrudeLine

      command.useGroup(targetGroup)

      ctx.commandHistory.executeCommand(command, ctx)

      return true
    }
    else {

      return false
    }
  }

  protected generateExtrudePoints(fromTargetLineTop: boolean, targetLine: VectorStroke, sampleLine: VectorStroke, editExtrudeMinRadius: float, editExtrudeMaxRadius: float): VectorStroke {

    let startPoint: VectorPoint
    if (fromTargetLineTop) {

      startPoint = targetLine.points[0]
    }
    else {

      startPoint = targetLine.points[targetLine.points.length - 1]
    }

    const sampleLine_NearestPointIndex = this.findNearestPointIndex_PointToPoint(sampleLine, startPoint, 0.0, editExtrudeMaxRadius)
    if (sampleLine_NearestPointIndex == -1) {

      return null
    }

    const nearPointCount_SampleLineForward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, true, editExtrudeMaxRadius)
    const nearPointCount_SampleLineBackward = this.getNearPointCount(targetLine, sampleLine, sampleLine_NearestPointIndex, false, editExtrudeMaxRadius)

    //console.log(sampleLine_NearestPointIndex + ' ' + nearPointCount_SampleLineForward + ' ' + nearPointCount_SampleLineBackward)

    const isForwardExtrudeInSampleLine = (nearPointCount_SampleLineForward < 0 && nearPointCount_SampleLineBackward >= 0)
    const isBackwardExtrudeInSampleLine = (nearPointCount_SampleLineForward >= 0 && nearPointCount_SampleLineBackward < 0)

    const extrudable = (isForwardExtrudeInSampleLine || isBackwardExtrudeInSampleLine)

    if (!extrudable) {

      return null
    }

    const extrudePoints = this.getExtrudePoints(targetLine, sampleLine, sampleLine_NearestPointIndex, isForwardExtrudeInSampleLine, editExtrudeMinRadius, editExtrudeMaxRadius)

    if (extrudePoints == null) {

      // when all points is far away from edit line
      return null
    }

    const extrudeLine = new VectorStroke()
    extrudeLine.points = extrudePoints

    return extrudeLine
  }

  protected getExtrudePoints(targetLine: VectorStroke, sampleLine: VectorStroke, searchStartIndex: int, forwardSearch: boolean, limitMinDistance: float, limitMaxDistance: float): VectorPoint[] {

    const scanDirection = (forwardSearch ? 1 : -1)

    let startIndex = -1

    let currentIndex = searchStartIndex
    let nextIndex = currentIndex + scanDirection
    while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {

      const point1 = sampleLine.points[currentIndex]
      const point2 = sampleLine.points[nextIndex]

      const nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, limitMinDistance, limitMaxDistance, false, true)

      if (nearestPointIndex == -1) {

        startIndex = nextIndex
        break
      }

      currentIndex += scanDirection
      nextIndex += scanDirection
    }

    if (startIndex == -1) {

      return null
    }

    const result: VectorPoint[] = []
    if (forwardSearch) {

      for (let i = startIndex; i < sampleLine.points.length; i++) {

        result.push(sampleLine.points[i])
      }
    }
    else {

      for (let i = startIndex; i >= 0; i--) {

        result.push(sampleLine.points[i])
      }
    }

    return result
  }

  // Scratching edit

  protected executeScratchingLine(targetLine: VectorStroke, targetGroup: VectorStrokeGroup, resampledLine: VectorStroke, isExtrudeDone: boolean, ctx: SubToolContext): boolean {

    // Get scratching candidate points

    const baseRadius = ctx.mouseCursorViewRadius
    const editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate
    const editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate

    const candidatePointPairs = this.ganerateScratchingCandidatePoints(
      targetLine
      , resampledLine
      , editFalloffRadiusMin
      , editFalloffRadiusMax
      , this.editFalloffRadiusContainsLineWidth
    )

    // For display
    this.candidateLine = new VectorStroke()
    for (const pair of candidatePointPairs) {

      this.candidateLine.points.push(pair.candidatePoint)
    }

    // Execute command

    if (candidatePointPairs != null && candidatePointPairs.length > 0) {

      const command = new Command_ScratchLine()
      command.isContinued = isExtrudeDone
      command.targetLine = targetLine

      for (const pair of candidatePointPairs) {

        const editPoint = new Tool_ScratchLine_EditPoint()
        editPoint.pair = pair
        command.editPoints.push(editPoint)
      }

      command.useGroup(targetGroup)

      ctx.commandHistory.executeCommand(command, ctx)

      return true
    }
    else {

      return false
    }
  }

  protected ganerateScratchingCandidatePoints(target_Line: VectorStroke, editorLine: VectorStroke, _editFalloffRadiusMin: float, editFalloffRadiusMax: float, containsPointLineWidth: boolean): Tool_ScratchLine_CandidatePair[] {

    const result: Tool_ScratchLine_CandidatePair[] = []

    for (const point of target_Line.points) {

      let minDistance = 99999.0
      let nearestSegmentIndex = -1

      for (let i = 0; i < editorLine.points.length - 1; i++) {

        const editPoint1 = editorLine.points[i]
        const editPoint2 = editorLine.points[i + 1]

        const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
          editPoint1.location,
          editPoint2.location,
          point.location
        )

        if (distance < minDistance) {

          minDistance = distance
          nearestSegmentIndex = i
        }
      }

      if (nearestSegmentIndex != -1) {

        const nearestLinePoint1 = editorLine.points[nearestSegmentIndex]
        const nearestLinePoint2 = editorLine.points[nearestSegmentIndex + 1]

        // Calculate candidate point
        const nearestPoint_Available = Logic_Points.pointToLine_NearestLocation(
          this.nearestPointLocation,
          nearestLinePoint1.location,
          nearestLinePoint2.location,
          point.location
        )

        if (!nearestPoint_Available) {

          continue
        }

        let directDistance = vec3.distance(point.location, this.nearestPointLocation)

        if (containsPointLineWidth) {

          directDistance -= point.lineWidth * 0.5
          if (directDistance < 0.0) {
            directDistance = 0.0
          }
        }

        if (directDistance > editFalloffRadiusMax) {

          continue
        }

        // Calculate edit influence
        const sorroundingDistance = Logic_Points.pointToLineSegment_SorroundingDistance(
          nearestLinePoint1.location,
          nearestLinePoint2.location,
          this.nearestPointLocation
        )

        if (sorroundingDistance > editFalloffRadiusMax) {

          continue
        }

        const normPositionInEditorLineSegment = Logic_Points.pointToLineSegment_NormalizedPosition(
          nearestLinePoint1.location
          , nearestLinePoint2.location
          , point.location)

        const totalLengthInEditorLine = (
          nearestLinePoint1.totalLength
          + (nearestLinePoint2.totalLength - nearestLinePoint1.totalLength) * normPositionInEditorLineSegment
        )

        const influence = this.calculateScratchingCandidatePointInfluence(
          editorLine.totalLength
          , sorroundingDistance
          , totalLengthInEditorLine
          , editFalloffRadiusMax
        )

        if (influence > 0.0) {

          // Create edit data
          const candidatePoint = new VectorPoint()
          vec3.copy(candidatePoint.location, this.nearestPointLocation)
          vec3.copy(candidatePoint.adjustingLocation, candidatePoint.location)
          candidatePoint.lineWidth = Maths.lerp(normPositionInEditorLineSegment, nearestLinePoint1.lineWidth, nearestLinePoint2.lineWidth)

          const pair = new Tool_ScratchLine_CandidatePair()
          pair.targetPoint = point
          pair.candidatePoint = candidatePoint
          pair.normPosition = normPositionInEditorLineSegment
          pair.totalLength = totalLengthInEditorLine
          pair.influence = influence

          result.push(pair)

          // Set the flag for after editing
          point.modifyFlag = LinePointModifyFlagID.edit
        }
      }
    }

    return result
  }

  protected calculateScratchingCandidatePointInfluence(editorLine_TotalLength: float, sorroundingDistance: float, totalLengthInEditorLine: float, editFalloffRadiusMax: float): float { // @virtual

    let falloffDistance = 1.0

    if (editorLine_TotalLength > editFalloffRadiusMax * 2.0) {

      if (totalLengthInEditorLine < editFalloffRadiusMax) {

        //falloffDistance = 0.0
        falloffDistance = totalLengthInEditorLine / editFalloffRadiusMax
      }

      if (totalLengthInEditorLine > editorLine_TotalLength - editFalloffRadiusMax) {

        //falloffDistance = 0.0
        falloffDistance = (editorLine_TotalLength - totalLengthInEditorLine) / editFalloffRadiusMax
      }
    }
    else {

      falloffDistance = 1.0 - sorroundingDistance / editFalloffRadiusMax
    }
    let influence = Maths.clamp(falloffDistance, 0.0, 1.0)

    if (influence == 0.0) {
      return 0.0
    }

    influence *= this.editInfluence * Maths.sigmoid10(1.0 - sorroundingDistance / editFalloffRadiusMax)

    return influence
  }

  // Delete duplication edit

  protected deleteDuplications(targetLine: VectorStroke, targetGroup: VectorStrokeGroup, ctx: SubToolContext) {

    // Search edited index range of points

    let firstPointIndex = -1
    let lastPointIndex = -1

    for (let i = 0; i < targetLine.points.length; i++) {

      const point = targetLine.points[i]

      if (point.modifyFlag == LinePointModifyFlagID.edit) {

        if (firstPointIndex == -1) {

          firstPointIndex = i
        }

        lastPointIndex = i
      }
    }

    if (firstPointIndex > 0) {

      firstPointIndex--
    }

    if (lastPointIndex < targetLine.points.length - 1) {

      lastPointIndex++
    }

    if (lastPointIndex - firstPointIndex < 2) {
      return
    }

    // Create new point list

    const newPoints = Lists.getRange(targetLine.points, 0, firstPointIndex)

    const resamplingUnitLength = ctx.getViewScaledDrawLineUnitLength()

    Logic_Edit_Points.resamplePoints(
      newPoints
      , targetLine.points
      , firstPointIndex
      , lastPointIndex
      , resamplingUnitLength
    )

    for (let index = lastPointIndex + 1; index < targetLine.points.length; index++) {

      newPoints.push(targetLine.points[index])
    }

    // Execute command

    const command = new Command_DeleteDuplicationInLine()
    command.isContinued = true
    command.targetLine = targetLine
    command.oldPoints = targetLine.points
    command.newPoints = newPoints

    command.useGroup(targetGroup)

    ctx.commandHistory.executeCommand(command, ctx)
  }

  // Common functions

  protected findNearestPointIndex_LineSegmentToPoint(line: VectorStroke, point1: VectorPoint, point2: VectorPoint, limitMinDistance: float, limitMaxDistance: float, includeInnerSide: boolean, includeOuterSide: boolean): int {

    let minDistance = 99999.0
    let nearestPointIndex = -1

    for (let i = 0; i < line.points.length - 1; i++) {
      const linePoint = line.points[i]

      const distance = vec3.distance(point1.location, linePoint.location)

      if (distance < minDistance) {

        const normPosition = Logic_Points.pointToLineSegment_NormalizedPosition(point1.location, point2.location, linePoint.location)

        if ((includeInnerSide && normPosition >= 0.0 && normPosition <= 1.0)
          || (includeOuterSide && (normPosition < 0.0 || normPosition > 1.0))) {

          if (distance > limitMinDistance
            && distance < limitMaxDistance) {

            minDistance = distance
            nearestPointIndex = i
          }
        }
      }
    }

    return nearestPointIndex
  }

  protected findNearestPointIndex_PointToPoint(line: VectorStroke, point: VectorPoint, limitMinDistance: float, limitMaxDistance: float): int {

    let minDistance = 99999.0
    let nearestPointIndex = -1

    for (let i = 0; i < line.points.length - 1; i++) {
      const linePoint = line.points[i]

      const distance = vec3.distance(point.location, linePoint.location)

      if (distance < minDistance
        && distance > limitMinDistance
        && distance < limitMaxDistance) {

        minDistance = distance
        nearestPointIndex = i
      }
    }

    return nearestPointIndex
  }

  protected getNearPointCount(targetLine: VectorStroke, sampleLine: VectorStroke, searchStartIndex: int, forwardSearch: boolean, limitMaxDistance: float): int {

    let nearPointCcount = 0

    const scanDirection = (forwardSearch ? 1 : -1)

    let currentIndex = searchStartIndex
    let nextIndex = currentIndex + scanDirection
    while (nextIndex >= 0 && nextIndex < sampleLine.points.length) {

      const point1 = sampleLine.points[currentIndex]
      const point2 = sampleLine.points[nextIndex]

      // find the nearest point in target-line by the sample-line's segment
      const nearestPointIndex = this.findNearestPointIndex_LineSegmentToPoint(targetLine, point1, point2, 0.0, limitMaxDistance, true, false)

      if (nearestPointIndex != -1) {

        nearPointCcount++
      }
      else {

        nearPointCcount--
      }

      currentIndex += scanDirection
      nextIndex += scanDirection
    }

    return nearPointCcount
  }
}

export class Tool_ExtrudeLine extends Tool_ScratchLine {

  helpText = '右クリックで線を選択し、左クリックで線の端の近くから線を描きはじめると線が延長されます。'

  enableScratchEdit = false
  enableExtrude = true
}

export class Command_ExtrudeLine extends CommandBase {

  targetGroups: VectorStrokeGroup[] = null
  targetLine: VectorStroke = null

  forwardExtrude = false
  extrudeLine: VectorStroke = null

  oldPointList: VectorPoint[] = null
  newPointList: VectorPoint[] = null

  execute(ctx: SubToolContext) { // @override

    this.prepareEditPoints()

    this.redo(ctx)
  }

  private prepareEditPoints() {

    this.oldPointList = this.targetLine.points

    if (this.forwardExtrude) {

      this.newPointList = Lists.clone(this.targetLine.points)
      Lists.addRange(this.newPointList, this.extrudeLine.points)
    }
    else {

      this.newPointList = []

      for (let i = this.extrudeLine.points.length - 1; i >= 0; i--) {

        this.newPointList.push(this.extrudeLine.points[i])
      }

      Lists.addRange(this.newPointList, this.targetLine.points)
    }
  }

  undo(_ctx: SubToolContext) { // @override

    this.targetLine.points = this.oldPointList
  }

  redo(_ctx: SubToolContext) { // @override

    this.targetLine.points = this.newPointList
  }
}

export class Command_ScratchLine extends CommandBase {

  targetLine: VectorStroke = null
  editPoints: Tool_ScratchLine_EditPoint[] = []

  execute(ctx: SubToolContext) { // @override

    this.prepareEditPoints()

    this.redo(ctx)
  }

  private prepareEditPoints() {

    for (const editPoint of this.editPoints) {

      const candidatePoint = editPoint.pair.candidatePoint
      const targetPoint = editPoint.pair.targetPoint

      vec3.copy(editPoint.oldLocation, targetPoint.adjustingLocation)

      if (editPoint.pair.influence > 0.0) {

        vec3.lerp(editPoint.newLocation, targetPoint.location, candidatePoint.location, editPoint.pair.influence)
      }
      else {

        vec3.copy(editPoint.newLocation, targetPoint.location)
      }
    }
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {

      const targetPoint = editPoint.pair.targetPoint

      vec3.copy(targetPoint.location, editPoint.oldLocation)
      vec3.copy(targetPoint.adjustingLocation, targetPoint.location)
    }

    Logic_Edit_Line.calculateParameters(this.targetLine)
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {

      const targetPoint = editPoint.pair.targetPoint

      vec3.copy(targetPoint.location, editPoint.newLocation)
      vec3.copy(targetPoint.adjustingLocation, targetPoint.location)
    }

    Logic_Edit_Line.calculateParameters(this.targetLine)
  }
}

export class Command_DeleteDuplicationInLine extends CommandBase {

  targetLine: VectorStroke = null

  oldPoints: VectorPoint[] = null
  newPoints: VectorPoint[] = null

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    this.targetLine.points = this.oldPoints

    Logic_Edit_Line.calculateParameters(this.targetLine)
  }

  redo(_ctx: SubToolContext) { // @override

    this.targetLine.points = this.newPoints

    Logic_Edit_Line.calculateParameters(this.targetLine)
  }
}
