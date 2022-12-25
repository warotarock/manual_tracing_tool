import { CommandBase } from '../command'
import { float, int, Lists, Logic_Points, Maths } from '../common-logics'
import { SubToolContext, SubToolDrawingContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import {
  Layer, VectorPointModifyFlagID, VectorLayer, VectorLayerGeometry, VectorPoint, VectorStroke,
  VectorStrokeGroup
} from '../document-data'
import { VectorLayerLogic, VectorPointLogic, VectorStrokeLogic } from '../document-logic'
import { HitTest_VectorStroke_PointToStroke_Nearest } from '../document-logic'
import { ModalToolBase, ToolPointerEvent } from '../tool'
import { ViewKeyframeLayer } from '../view'

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

export class Tool_ScratchLine extends ModalToolBase {

  helpText = '右クリックまたはGで線を選択し、左クリックで線を修正します。'

  enableScratchEdit = true
  enableExtrude = false

  editStroke: VectorStroke = null
  resampledStroke: VectorStroke = null
  candidateStroke: VectorStroke = null
  forwardExtrude = false
  extrudeLine: VectorStroke = null
  cutouted = false
  isEditing = false

  inputLocation = vec3.fromValues(0.0, 0.0, 0.0)
  inputLastLocation = vec3.fromValues(0.0, 0.0, 0.0)
  nearestPointLocation = vec3.fromValues(0.0, 0.0, 0.0)
  samplePoint = vec3.fromValues(0.0, 0.0, 0.0)

  strokeSingleHitTester = new HitTest_VectorStroke_PointToStroke_Nearest()

  strokeSmoothLevel = 3

  selectLine_NonMovedLocationDistanceRate = 0.5

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

    return ctx.isCurrentLayerEditbaleLayer()
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    drawing.editorDrawer.drawPointerCursor(ctx.toolBaseViewRadius)

    if (this.tool_ScratchLine_EditLine_Visible) {

      if (this.editStroke != null && this.resampledStroke == null) {

        drawing.editorDrawer.drawOperatorSolidStroke(this.editStroke)
      }
    }

    if (this.tool_ScratchLine_TargetLine_Visible) {

      const drawPointsAll = false

      if (ctx.activeVectorLine != null) {

        if (drawPointsAll) {

          if (ctx.currentVectorLayer != null) {

            drawing.editorDrawer.drawEditorStrokePoints(
              ctx.activeVectorLine
              , ctx.currentVectorLayer.layerColor
              , false
            )
          }
        }
        else {

          if (ctx.activeVectorLine.points.length >= 2) {

            const firstPoint = ctx.activeVectorLine.points[0]
            const lastPoint = ctx.activeVectorLine.points[ctx.activeVectorLine.points.length - 1]

            drawing.drawCircle(
              firstPoint.location,
              VectorPointLogic.getPointRadius(firstPoint) + ctx.getViewScaledLength(3.0),
              ctx.getViewScaledLength(1.0),
              ctx.drawStyle.sampledPointColor
            )

            drawing.drawCircle(
              lastPoint.location,
              VectorPointLogic.getPointRadius(lastPoint) + ctx.getViewScaledLength(3.0),
              ctx.getViewScaledLength(1.0),
              ctx.drawStyle.sampledPointColor
            )
          }
        }
      }
    }

    if (this.tool_ScratchLine_SampledLine_Visible) {

      if (this.resampledStroke != null) {

        drawing.editorDrawer.drawEditorStrokePoints(this.resampledStroke, drawing.style.sampledPointColor, false)
      }
    }

    if (this.tool_ScratchLine_CandidatePoints_Visible) {

      if (this.candidateStroke != null) {

        drawing.editorDrawer.drawEditorStrokePoints(this.candidateStroke, drawing.style.linePointColor, false)
      }
    }

    if (this.tool_ScratchLine_ExtrudePoints_Visible) {

      if (this.extrudeLine != null) {

        drawing.editorDrawer.drawEditorStrokePoints(this.extrudeLine, drawing.style.extrutePointColor, false)
      }
    }
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    this.setInputLocation(e, true)

    if (e.isLeftButtonPressing) {

      this.resetState(true)

      ctx.tool.startModalTool(this.subtoolID)
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    this.setInputLocation(e, false)

    ctx.setRedrawEditorWindow()

    if (!this.isEditing) {

      // clear the editor line display when user moved the pointer
      this.resetState()
      ctx.setRedrawEditorWindow()
      return
    }

    if (e.isLeftButtonPressing && !this.cutouted) {

      this.addPointToEditLine(ctx)
    }
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    this.setInputLocation(e, false)

    ctx.setRedrawEditorWindow()

    // line selecting with single click
    if (!e.isPointerMoved) {

      this.selectStroke(this.inputLocation, ctx)
      this.resetState()
      return
    }

    if (!this.isEditing
      || ctx.activeVectorLine == null
      || this.editStroke == null
    ) {

      this.resetState()
      return
    }

    VectorStrokeLogic.calculateParameters(this.editStroke)

    if (VectorStrokeLogic.isEmptyStroke(this.editStroke)) {

      this.resetState()
      return
    }

    this.executeCommand(ctx)

    this.isEditing = false
  }

  protected resetState(isForOperationStart = false) {

    this.editStroke = null
    this.resampledStroke = null
    this.candidateStroke = null

    this.isEditing = isForOperationStart
    this.cutouted = false

    if (isForOperationStart) {

      this.editStroke = new VectorStroke()
    }
  }

  private setInputLocation(e: ToolPointerEvent, pointerDown: boolean) {

    if (pointerDown) {

      vec3.copy(this.inputLastLocation, e.location)
    }

    vec3.copy(this.inputLocation, e.location)
  }

  private addPointToEditLine(ctx: SubToolContext) {

    const point = new VectorPoint()
    vec3.copy(point.location, this.inputLocation)
    vec3.copy(point.adjustingLocation, this.inputLocation)
    point.lineWidth = ctx.drawLineBaseWidth

    this.editStroke.points.push(point)

    VectorStrokeLogic.calculateParameters(this.editStroke)

    if (!VectorStrokeLogic.isEmptyStroke(this.editStroke)) {

      this.resampledStroke = this.generateResampledEditorStroke(this.editStroke, ctx)
    }
  }

  private selectStroke(location: Vec3, ctx: SubToolContext) {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    let hitedGeometry: VectorLayerGeometry = null
    let hitedGroup: VectorStrokeGroup = null
    let hitedStroke: VectorStroke = null

    ViewKeyframeLayer.forEachVectorGeometry(viewKeyframeLayers, (geometry: VectorLayerGeometry, layer: VectorLayer) => {

      if (hitedStroke == null) {

        this.strokeSingleHitTester.startProcess()
        this.strokeSingleHitTester.processGeometry(layer, geometry, location, ctx.toolBaseViewRadius)

        hitedGeometry = this.strokeSingleHitTester.hitedGeometry
        hitedGroup = this.strokeSingleHitTester.hitedGroup
        hitedStroke = this.strokeSingleHitTester.hitedStoke
      }
    })

    if (hitedStroke != null) {

      ctx.setActiveVectorStroke(hitedStroke, hitedGroup, hitedGeometry)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
    else {

      ctx.unsetAcrtiveVectorStrokeAndGroup()
    }
  }

  protected executeCommand(ctx: SubToolContext) { // @virtual

    if (VectorStrokeLogic.isEmptyStroke(this.editStroke)) {
      return
    }

    let isExtrudeDone = false
    let isScratchingDone = false

    const targetLine = ctx.activeVectorLine
    const targetGroup = ctx.activeVectorGroup
    const targetLayer = ctx.currentLayer
    const oldPoints = targetLine.points
    const resamplingUnitLengthForBrush = ctx.getViewScaledResamplingUnitLengthForBrush()

    if (this.enableExtrude) {

      this.resampledStroke = VectorStrokeLogic.createResampledLine(this.editStroke, resamplingUnitLengthForBrush)

      isExtrudeDone = this.executeExtrudeLine(targetLine, targetGroup, targetLayer, this.resampledStroke, ctx)
    }

    if (this.enableScratchEdit) {

      this.resampledStroke = this.generateResampledEditorStroke(this.editStroke, ctx)

      isScratchingDone = this.executeScratchingLine(
        targetLine,
        targetGroup,
        targetLayer,
        this.resampledStroke,
        isExtrudeDone,
        ctx
      )
    }

    if (isExtrudeDone || isScratchingDone) {

      this.deleteDuplications(
        targetLine,
        targetGroup,
        targetLayer,
        resamplingUnitLengthForBrush,
        ctx
      )
    }

    VectorLayerLogic.clearPointModifyFlags(oldPoints)

    ctx.setRedrawCurrentLayer()
  }

  // Adjusting edit line

  private cutoutLine(result: VectorStroke): boolean {

    VectorStrokeLogic.smooth(result)

    const startIndex = this.searchCutoutIndex(result, false)
    const endIndex = this.searchCutoutIndex(result, true)

    const lastPointCount = result.points.length

    result.points = Lists.getRange(result.points, startIndex, (endIndex - startIndex) + 1)

    VectorStrokeLogic.applyAdjustments(result)

    return (lastPointCount != result.points.length)
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

  protected generateResampledEditorStroke(editorStroke: VectorStroke, ctx: SubToolContext): VectorStroke { // @virtual

    let resamplingUnitLength = ctx.getViewScaledResamplingUnitLengthForEdit()

    let divisionCount = VectorStrokeLogic.clalculateSamplingDivisionCount(editorStroke.runtime.totalLength, resamplingUnitLength)
    if (divisionCount > this.maxResamplingDivisionCount) {

      resamplingUnitLength = editorStroke.runtime.totalLength / this.maxResamplingDivisionCount
    }

    const resampledLine = VectorStrokeLogic.createResampledLine(editorStroke, resamplingUnitLength)

    VectorStrokeLogic.smooth(resampledLine, this.strokeSmoothLevel)

    this.cutouted = this.cutoutLine(resampledLine)

    return resampledLine
  }

  // Extruding edit

  private executeExtrudeLine(
    targetLine: VectorStroke,
    targetGroup: VectorStrokeGroup,
    targetLayer: Layer,
    resampledLine: VectorStroke,
    ctx: SubToolContext
  ): boolean {

    // Create extrude points

    const baseRadius = ctx.toolBaseViewRadius
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

      command.defferedProcess.addGroup(targetLayer, targetGroup, PostUpdateSituationTypeID.changesObjectShapes)

      ctx.commandHistory.executeCommand(command, ctx)

      return true
    }
    else {

      return false
    }
  }

  private generateExtrudePoints(fromTargetLineTop: boolean, targetLine: VectorStroke, sampleLine: VectorStroke, editExtrudeMinRadius: float, editExtrudeMaxRadius: float): VectorStroke {

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

  private getExtrudePoints(targetLine: VectorStroke, sampleLine: VectorStroke, searchStartIndex: int, forwardSearch: boolean, limitMinDistance: float, limitMaxDistance: float): VectorPoint[] {

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

  private executeScratchingLine(
    targetLine: VectorStroke,
    targetGroup: VectorStrokeGroup,
    targetLayer: Layer,
    resampledLine: VectorStroke,
    isExtrudeDone: boolean,
    ctx: SubToolContext
  ): boolean {

    // Get scratching candidate points

    const baseRadius = ctx.toolBaseViewRadius
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
    this.candidateStroke = new VectorStroke()
    for (const pair of candidatePointPairs) {

      this.candidateStroke.points.push(pair.candidatePoint)
    }

    // Execute command

    if (candidatePointPairs != null && candidatePointPairs.length > 0) {

      const command = new Command_ScratchLine()
      command.isContinued = isExtrudeDone
      command.targetLine = targetLine
      command.layer = <VectorLayer>targetLayer

      for (const pair of candidatePointPairs) {

        const editPoint = new Tool_ScratchLine_EditPoint()
        editPoint.pair = pair
        command.editPoints.push(editPoint)
      }

      command.defferedProcess.addGroup(targetLayer, targetGroup, PostUpdateSituationTypeID.changesObjectShapes)

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
          editorLine.runtime.totalLength
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
          point.modifyFlag = VectorPointModifyFlagID.edit
        }
      }
    }

    return result
  }

  private calculateScratchingCandidatePointInfluence(editorLine_TotalLength: float, sorroundingDistance: float, totalLengthInEditorLine: float, editFalloffRadiusMax: float): float { // @virtual

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

  private deleteDuplications(
    targetLine: VectorStroke,
    targetGroup: VectorStrokeGroup,
    targetLayer: Layer,
    resamplingUnitLength: float,
    ctx: SubToolContext
  ) {

    // Search edited index range of points

    let firstPointIndex = -1
    let lastPointIndex = -1

    for (let i = 0; i < targetLine.points.length; i++) {

      const point = targetLine.points[i]

      if (point.modifyFlag == VectorPointModifyFlagID.edit) {

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

    VectorPointLogic.resamplePoints(
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
    command.layer = <VectorLayer>targetLayer
    command.oldPoints = targetLine.points
    command.newPoints = newPoints

    command.defferedProcess.addGroup(targetLayer, targetGroup, PostUpdateSituationTypeID.changesObjectShapes)

    ctx.commandHistory.executeCommand(command, ctx)
  }

  // Common functions

  private findNearestPointIndex_LineSegmentToPoint(line: VectorStroke, point1: VectorPoint, point2: VectorPoint, limitMinDistance: float, limitMaxDistance: float, includeInnerSide: boolean, includeOuterSide: boolean): int {

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

  private findNearestPointIndex_PointToPoint(line: VectorStroke, point: VectorPoint, limitMinDistance: float, limitMaxDistance: float): int {

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

  private getNearPointCount(targetLine: VectorStroke, sampleLine: VectorStroke, searchStartIndex: int, forwardSearch: boolean, limitMaxDistance: float): int {

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

export class Command_ExtrudeLine extends CommandBase {

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
  layer: VectorLayer = null

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

    VectorStrokeLogic.calculateParameters(this.targetLine, this.layer.lineWidthBiasRate)
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {

      const targetPoint = editPoint.pair.targetPoint

      vec3.copy(targetPoint.location, editPoint.newLocation)
      vec3.copy(targetPoint.adjustingLocation, targetPoint.location)
    }

    VectorStrokeLogic.calculateParameters(this.targetLine, this.layer.lineWidthBiasRate)
  }
}

export class Command_DeleteDuplicationInLine extends CommandBase {

  targetLine: VectorStroke = null
  layer: VectorLayer = null

  oldPoints: VectorPoint[] = null
  newPoints: VectorPoint[] = null

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    this.targetLine.points = this.oldPoints

    VectorStrokeLogic.calculateParameters(this.targetLine, this.layer.lineWidthBiasRate)
  }

  redo(_ctx: SubToolContext) { // @override

    this.targetLine.points = this.newPoints

    VectorStrokeLogic.calculateParameters(this.targetLine, this.layer.lineWidthBiasRate)
  }
}
