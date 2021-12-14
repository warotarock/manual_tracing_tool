import { CommandBase } from '../command/command'
import { VectorStroke } from '../document_data'
import { Logic_Edit_Line, Logic_Edit_VectorLayer } from '../logics/edit_vector_layer'
import { Maths } from '../logics/math'
import { SubToolContext } from '../context/subtool_context'
import { Tool_ScratchLine, Tool_ScratchLine_CandidatePair } from './scratch_line'

class Tool_ScratchLineWidth_EditPoint {

  pair: Tool_ScratchLine_CandidatePair = null

  newLineWidth = 0.0
  oldLineWidth = 0.0
  newLocation = vec3.create()
  oldLocation = vec3.create()
}

export class Tool_OverWriteLineWidth extends Tool_ScratchLine {

  helpText = '線を最大の太さに近づけます。Shiftキーで線を細くします。<br />Ctrlキーで最大の太さ固定になります。'

  editFalloffRadiusContainsLineWidth = true

  protected executeCommand(ctx: SubToolContext) { // @override

    const baseRadius = ctx.mouseCursorViewRadius
    const targetLine = ctx.currentVectorLine
    const targetGroup = ctx.currentVectorGroup
    const oldPoints = targetLine.points

    // Resampling editor line
    this.resampledLine = this.generateCutoutedResampledLine(this.editLine, ctx)

    // Get candidate points
    const editFalloffRadiusMin = baseRadius * this.editFalloffRadiusMinRate
    const editFalloffRadiusMax = baseRadius * this.editFalloffRadiusMaxRate
    const candidatePointPairs = this.ganerateScratchingCandidatePoints(
      targetLine
      , this.resampledLine
      , editFalloffRadiusMin
      , editFalloffRadiusMax
      , this.editFalloffRadiusContainsLineWidth
    )

    if (candidatePointPairs != null && candidatePointPairs.length > 0) {

      const command = new Command_ScratchLineWidth()
      command.targetLine = targetLine

      for (const pair of candidatePointPairs) {

        const editPoint = new Tool_ScratchLineWidth_EditPoint()
        editPoint.pair = pair

        editPoint.oldLineWidth = editPoint.pair.targetPoint.lineWidth
        vec3.copy(editPoint.oldLocation, editPoint.pair.targetPoint.location)

        this.processPoint(editPoint, ctx)

        command.editPoints.push(editPoint)
      }

      command.useGroup(targetGroup)

      ctx.commandHistory.executeCommand(command, ctx)
    }

    Logic_Edit_VectorLayer.clearPointModifyFlags(oldPoints)
  }

  protected processPoint(editPoint: Tool_ScratchLineWidth_EditPoint, ctx: SubToolContext) { // @virtual

    let setTo_LineWidth = ctx.drawLineBaseWidth
    if (ctx.isShiftKeyPressing()) {

      setTo_LineWidth = ctx.drawLineMinWidth
    }

    let fixedOverWriting = false
    if (ctx.isCtrlKeyPressing()) {

      fixedOverWriting = true
    }


    vec3.copy(editPoint.newLocation, editPoint.pair.targetPoint.location)

    if (editPoint.pair.influence > 0.0) {

      if (fixedOverWriting) {

        editPoint.newLineWidth = setTo_LineWidth
      }
      else {

        editPoint.newLineWidth = Maths.lerp(
          editPoint.pair.influence * 0.5
          , editPoint.pair.targetPoint.lineWidth
          , setTo_LineWidth)
      }
    }
    else {

      editPoint.newLineWidth = editPoint.pair.targetPoint.lineWidth
    }
  }
}

export class Tool_ScratchLineWidth extends Tool_OverWriteLineWidth {

  helpText = '線の太さを足します。Shiftキーで減らします。'

  editFalloffRadiusMinRate = 0.15
  editFalloffRadiusMaxRate = 1.0
  editInfluence = 1.0

  subtructVector = vec3.create()
  moveVector = vec3.create()

  protected processPoint(editPoint: Tool_ScratchLineWidth_EditPoint, ctx: SubToolContext) { // @override

    const targetPoint = editPoint.pair.targetPoint
    const candidatePoint = editPoint.pair.candidatePoint

    const targetPointRadius = targetPoint.lineWidth * 0.5
    const candidatePointRadius = candidatePoint.lineWidth * 0.5

    const distance = vec3.distance(targetPoint.location, candidatePoint.location)

    if (!ctx.isShiftKeyPressing()) {

      if (distance + candidatePointRadius > targetPointRadius
        && distance - candidatePointRadius > -targetPointRadius) {

        const totalDiameter = targetPointRadius + distance + candidatePointRadius
        const totalRadius = totalDiameter * 0.5

        const newRadius = Maths.lerp(
          editPoint.pair.influence
          , targetPointRadius
          , totalRadius)

        editPoint.newLineWidth = newRadius * 2.0

        vec3.subtract(this.subtructVector, candidatePoint.location, targetPoint.location)
        vec3.normalize(this.subtructVector, this.subtructVector)
        vec3.scale(this.moveVector, this.subtructVector, -targetPointRadius + newRadius)
        vec3.add(editPoint.newLocation, targetPoint.location, this.moveVector)
      }
      else if (candidatePointRadius > targetPointRadius) {

        editPoint.newLineWidth = candidatePointRadius * 2.0
        vec3.copy(editPoint.newLocation, candidatePoint.location)
      }
      else {

        editPoint.newLineWidth = targetPoint.lineWidth
        vec3.copy(editPoint.newLocation, targetPoint.location)
      }
    }
    else {

      if (distance - candidatePointRadius < targetPointRadius
        && distance - candidatePointRadius > -targetPointRadius) {

        const totalDiameter = targetPointRadius + distance - candidatePointRadius
        const totalRadius = totalDiameter * 0.5

        const newRadius = Maths.lerp(
          editPoint.pair.influence
          , targetPointRadius
          , totalRadius)

        editPoint.newLineWidth = newRadius * 2.0

        vec3.subtract(this.subtructVector, candidatePoint.location, targetPoint.location)
        vec3.normalize(this.subtructVector, this.subtructVector)
        vec3.scale(this.moveVector, this.subtructVector, -targetPointRadius + newRadius)
        vec3.add(editPoint.newLocation, targetPoint.location, this.moveVector)


      }
      else if (distance < candidatePointRadius) {

        editPoint.newLineWidth = 0.0
        vec3.copy(editPoint.newLocation, targetPoint.location)
      }
      else {

        editPoint.newLineWidth = targetPoint.lineWidth
        vec3.copy(editPoint.newLocation, targetPoint.location)
      }
    }
  }
}

export class Command_ScratchLineWidth extends CommandBase {

  targetLine: VectorStroke = null
  editPoints: Tool_ScratchLineWidth_EditPoint[] = []

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {
      const targetPoint = editPoint.pair.targetPoint

      targetPoint.lineWidth = editPoint.oldLineWidth
      targetPoint.adjustingLineWidth = editPoint.oldLineWidth

      vec3.copy(targetPoint.location, editPoint.oldLocation)
      vec3.copy(targetPoint.adjustingLocation, editPoint.oldLocation)
    }

    Logic_Edit_Line.calculateParameters(this.targetLine)
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {
      const targetPoint = editPoint.pair.targetPoint

      targetPoint.lineWidth = editPoint.newLineWidth
      targetPoint.adjustingLineWidth = editPoint.newLineWidth

      vec3.copy(targetPoint.location, editPoint.newLocation)
      vec3.copy(targetPoint.adjustingLocation, editPoint.newLocation)
    }

    Logic_Edit_Line.calculateParameters(this.targetLine)
  }
}
