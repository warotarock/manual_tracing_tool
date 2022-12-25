import { CommandBase } from '../command'
import { float } from '../common-logics'
import { SubToolContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import { VectorLayer, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document-data'
import { VectorPointLogic, VectorStrokeLogic } from '../document-logic'
import { OperationUnitID, SubTool } from '../tool'
import { ShortcutCommandID } from '../user-setting'
import { ViewKeyframeLayer } from '../view'

class EditLine {

  targetLine: VectorStroke = null
  layer: VectorLayer = null

  oldPoints: VectorPoint[] = null
  newPoints: VectorPoint[] = null
}

interface TargetGroup {

  group: VectorStrokeGroup
  layer: VectorLayer
}

export class Tool_Resample_Segment extends SubTool {

  helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。'

  targetGroups: TargetGroup[] = null
  editLines: EditLine[] = null

  isAvailable(ctx: SubToolContext): boolean { // @override

    return ctx.isCurrentLayerEditbaleLayer()
  }

  toolWindowItemClick(ctx: SubToolContext) { // @override

    ctx.tool.setOperationUnit(OperationUnitID.strokePoint)
    ctx.setRedrawMainWindow()
  }

  keydown(key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (commandID == ShortcutCommandID.edit_fix) {

      if (ctx.currentVectorLayer != null) {

        this.executeCommand(ctx)
        return true
      }
    }

    return false
  }

  private executeCommand(ctx: SubToolContext) {

    if (this.collectEditTargets(ctx)) {

      const command = new Command_Resample_Segment()
      command.editLines = this.editLines

      for (const targetGroup of this.targetGroups) {

        command.defferedProcess.addGroup(targetGroup.layer, targetGroup.group, PostUpdateSituationTypeID.changesObjectShapes)
      }

      ctx.commandHistory.executeCommand(command, ctx)

      ctx.setRedrawMainWindowEditorWindow()
    }
  }

  private collectEditTargets(ctx: SubToolContext): boolean {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    const targetGroups: TargetGroup[] = []
    const editLines: EditLine[] = []

    const resamplingUnitLength = ctx.getViewScaledResamplingUnitLengthForBrush()

    ViewKeyframeLayer.forEachStrokeGroup(viewKeyframeLayers, (group, layer) => {

      let existsInGroup = false

      for (const line of group.lines) {

        if (line.isSelected && this.existsSelectedSegment(line)) {

          const editLine = new EditLine()
          editLine.targetLine = line
          editLine.layer = layer
          editLine.oldPoints = line.points
          editLine.newPoints = this.createResampledPoints(editLine.targetLine, resamplingUnitLength)

          editLines.push(editLine)

          existsInGroup = true
        }
      }

      if (existsInGroup) {

        targetGroups.push({ group, layer })
      }
    })

    this.targetGroups = targetGroups
    this.editLines = editLines

    return (editLines.length > 0)
  }

  private existsSelectedSegment(line: VectorStroke): boolean {

    let selectedPointCount = 0

    for (const point of line.points) {

      if (point.isSelected) {

        selectedPointCount++

        if (selectedPointCount >= 2) {

          break
        }
      }
      else {

        selectedPointCount = 0
      }
    }

    return (selectedPointCount >= 2)
  }

  private createResampledPoints(line: VectorStroke, resamplingUnitLength: float): VectorPoint[] {

    let currentIndex = 0
    let segmentStartIndex = -1
    let segmentEndIndex = -1

    const newPoints: VectorPoint[] = []

    while (currentIndex < line.points.length) {

      const currentPoint = line.points[currentIndex]

      // selected segment
      if (currentPoint.isSelected) {

        segmentStartIndex = currentIndex

        // search end of selected segment
        for (let i = segmentStartIndex; i < line.points.length; i++) {

          const point = line.points[i]

          if (!point.isSelected) {

            break
          }

          segmentEndIndex = i
        }

        // if exists selected segment, execute resampling
        if (segmentEndIndex > segmentStartIndex) {

          VectorPointLogic.resamplePoints(
            newPoints
            , line.points
            , segmentStartIndex
            , segmentEndIndex
            , resamplingUnitLength
          )
        }
        // if no segment, execute insert current point
        else {

          const point = line.points[currentIndex]

          newPoints.push(point)
        }

        currentIndex = segmentEndIndex + 1
      }
      // non-selected segment
      else {

        segmentStartIndex = currentIndex

        // search end of non-selected segment
        for (let i = segmentStartIndex; i < line.points.length; i++) {

          const point = line.points[i]

          if (point.isSelected) {

            break
          }

          segmentEndIndex = i
        }

        // execute insert original points
        for (let i = segmentStartIndex; i <= segmentEndIndex; i++) {

          const point = line.points[i]

          newPoints.push(point)
        }

        currentIndex = segmentEndIndex + 1
      }
    }

    return newPoints
  }
}

export class Command_Resample_Segment extends CommandBase {

  editLines: EditLine[] = null

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editLine of this.editLines) {

      editLine.targetLine.points = editLine.oldPoints
    }

    this.updateRelatedObjects()
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editLine of this.editLines) {

      editLine.targetLine.points = editLine.newPoints
    }

    this.updateRelatedObjects()
  }

  private updateRelatedObjects() {

    for (const editLine of this.editLines) {

      VectorStrokeLogic.calculateParameters(editLine.targetLine, editLine.layer.lineWidthBiasRate)
    }
  }
}
