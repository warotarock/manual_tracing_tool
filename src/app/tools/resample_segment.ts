import { CommandBase } from '../command/command'
import { float } from '../logics/conversion'
import { Layer, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { OperationUnitID } from '../tool/constants'
import { Logic_Edit_Line, Logic_Edit_Points } from '../logics/edit_vector_layer'
import { SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { ToolKeyboardEvent } from '../tool/tool_keyboard_event'

class Tool_Resample_Segment_EditLine {

  targetLine: VectorStroke = null

  oldPoints: VectorPoint[] = null
  newPoints: VectorPoint[] = null
}

export class Tool_Resample_Segment extends SubTool {

  helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。'

  targetGroups: VectorStrokeGroup[] = null
  editLines: Tool_Resample_Segment_EditLine[] = null

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerVectorLayer()
      && Layer.isEditTarget(ctx.currentVectorLayer)
    )
  }

  toolWindowItemClick(ctx: SubToolContext) { // @override

    ctx.setCurrentOperationUnitID(OperationUnitID.linePoint)
    ctx.setRedrawMainWindow()
  }

  keydown(e: ToolKeyboardEvent, ctx: SubToolContext): boolean { // @override

    if (e.key == 'Enter') {

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
      command.useGroups(this.targetGroups)

      ctx.commandHistory.executeCommand(command, ctx)

      ctx.setRedrawMainWindowEditorWindow()
    }
  }

  private collectEditTargets(ctx: SubToolContext): boolean {

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    const targetGroups: VectorStrokeGroup[] = []
    const editLines: Tool_Resample_Segment_EditLine[] = []

    const resamplingUnitLength = ctx.getViewScaledDrawLineUnitLength()

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

      let existsInGroup = false

      for (const line of group.lines) {

        if (line.isSelected && this.existsSelectedSegment(line)) {

          const editLine = new Tool_Resample_Segment_EditLine()
          editLine.targetLine = line
          editLine.oldPoints = line.points
          editLine.newPoints = this.createResampledPoints(editLine.targetLine, resamplingUnitLength)

          editLines.push(editLine)

          existsInGroup = true
        }
      }

      if (existsInGroup) {

        targetGroups.push(group)
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

          Logic_Edit_Points.resamplePoints(
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

  editLines: Tool_Resample_Segment_EditLine[] = null

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

      Logic_Edit_Line.calculateParameters(editLine.targetLine)
    }
  }
}
