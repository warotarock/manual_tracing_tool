import { CommandBase } from '../command/command'
import { float } from '../logics/conversion'
import { VectorLineModifyFlagID, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { Logic_Edit_Line } from '../logics/edit_vector_layer'
import { Maths } from '../logics/math'
import { ISelector_BrushSelect, Selector_LineSegment_BrushSelect, VectorLayerEditorSelectionInfo } from '../logics/selector'
import { SubToolContext } from '../context/subtool_context'
import { Tool_BrushSelectLinePointBase } from './select_brush_select'

class DivideLine_EditGroup {

  targetGroup: VectorStrokeGroup = null

  newLines: VectorStroke[] = []
  oldLines: VectorStroke[] = null

  editLines: DivideLine_EditLine[] = []
}

class DivideLine_EditLine {

  editPoints: DivideLine_EditPoint[] = []
}

class DivideLine_EditPoint {

  targetPoint: VectorPoint = null

  newLengthTo = 0.0
  newLengthFrom = 0.0
  oldLengthTo = 0.0
  oldLengthFrom = 0.0
}

export class Selector_DeleteLinePoint_DivideLine extends Selector_LineSegment_BrushSelect {

  private segmentMat4 = mat4.create()
  private invMat4 = mat4.create()
  private normalVec = vec3.create()
  private localLocation = vec3.create()

  protected onLineSegmentHited(group: VectorStrokeGroup, line: VectorStroke, point1: VectorPoint, point2: VectorPoint, location: Vec3, minDistanceSQ: float, _distanceSQ: float) { // @override

    this.createEditPoint(group, line, point1, point2, location, minDistanceSQ)
  }

  private createEditPoint(group: VectorStrokeGroup, line: VectorStroke, point1: VectorPoint, point2: VectorPoint, location: Vec3, minDistanceSQ: float) {

    let edited = false

    const segmentLength = vec3.distance(point1.location, point2.location)

    if (segmentLength <= 0.0) {

      edited = true
      point1.adjustingLengthFrom = 0.0 // fromを0.0、toを1.0とすることでセグメント全体の削除とする。これによりこのセグメントは描画時にスキップされる。
      point1.adjustingLengthTo = 1.0
    }
    else {

      Maths.mat4SegmentMat(this.segmentMat4, this.normalVec, point1.location, point2.location)
      mat4.invert(this.invMat4, this.segmentMat4)

      vec3.set(this.localLocation, location[0], location[1], 0.0)
      vec3.transformMat4(this.localLocation, this.localLocation, this.invMat4)

      let dy = 0 - this.localLocation[1]

      if (minDistanceSQ - dy * dy < 0) {

        dy = 0.01
      }

      const dx = Math.sqrt(minDistanceSQ - dy * dy)
      const x1 = this.localLocation[0] - dx
      const x2 = this.localLocation[0] + dx

      if (x1 > 0.0 && x1 < segmentLength && x2 >= segmentLength) {

        const fromX = x1 / segmentLength
        if (fromX < point1.adjustingLengthFrom) {

          point1.adjustingLengthFrom = fromX
        }

        edited = true
        point1.adjustingLengthTo = 1.0
      }
      else if (x2 > 0.0 && x2 < segmentLength && x1 <= 0.0) {

        edited = true
        point1.adjustingLengthFrom = 0.0

        const toX = x2 / segmentLength
        if (toX > point1.adjustingLengthTo) {

          point1.adjustingLengthTo = toX
        }
      }
      else if (x1 < 0.0 && x2 > segmentLength) {

        edited = true
        point1.adjustingLengthFrom = 0.0 // セグメント全体が削除
        point1.adjustingLengthTo = 1.0
      }
      else if (x1 > 0.0 && x2 < segmentLength) {

        const fromX = x1 / segmentLength
        if (fromX < point1.adjustingLengthFrom) {

          edited = true
          point1.adjustingLengthFrom = fromX
        }

        const toX = x2 / segmentLength
        if (toX > point1.adjustingLengthTo) {

          edited = true
          point1.adjustingLengthTo = toX
        }
      }
    }

    if (edited) {

      this.selectionInfo.editLine(line)
      this.selectionInfo.editGroup(group)
    }
  }

  protected afterHitTest() { // @override

    // doesn't clear flagas
  }
}

export class Tool_DeletePoints_DivideLine extends Tool_BrushSelectLinePointBase {

  helpText = 'ブラシ選択で点を削除します。'
  isEditTool = false // @override

  selector = new Selector_DeleteLinePoint_DivideLine()
  logic_Selector: ISelector_BrushSelect = this.selector // @override

  protected getSelectionRadius(ctx: SubToolContext) { // @override

    return ctx.eraserRadius
  }

  protected existsResults(): boolean { // @override

    return (this.selector.selectionInfo.selectedGroups.length > 0)
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_DeletePoints_DivideLine()
    if (command.prepareEditTargets(this.selector.selectionInfo)) {

      ctx.commandHistory.executeCommand(command, ctx)
    }

    this.selector.resetModifyStates()

    ctx.setRedrawCurrentLayer()
  }
}

export class Command_DeletePoints_DivideLine extends CommandBase {

  editGroups: DivideLine_EditGroup[] = null

  toLocation = vec3.create()
  fromLocation = vec3.create()

  prepareEditTargets(selectionInfo: VectorLayerEditorSelectionInfo): boolean {

    this.useGroups()

    const editGroups: DivideLine_EditGroup[] = []

    // Collect edit data from adjusting state, it should be same with drawing algorism
    for (const selGroup of selectionInfo.selectedGroups) {

      const group = selGroup.group

      const editGroup = new DivideLine_EditGroup()
      editGroup.targetGroup = group
      editGroup.oldLines = group.lines

      for (const line of group.lines) {

        if (line.modifyFlag == VectorLineModifyFlagID.none) {

          editGroup.newLines.push(line)
          continue
        }

        line.modifyFlag = VectorLineModifyFlagID.none

        let newLine: VectorStroke = null

        let strokeStarted = false
        let drawingRemaining = false

        for (let pointIndex = 0; pointIndex < line.points.length - 1; pointIndex++) {

          const fromPoint = line.points[pointIndex]
          const fromLocation = fromPoint.location
          const toPoint = line.points[pointIndex + 1]
          const toLocation = toPoint.location

          const lengthFrom = fromPoint.adjustingLengthFrom
          const lengthTo = fromPoint.adjustingLengthTo

          fromPoint.adjustingLengthFrom = 1.0
          fromPoint.adjustingLengthTo = 0.0

          if (lengthFrom == 1.0) {

            if (!strokeStarted) {

              newLine = new VectorStroke()
              newLine.points.push(fromPoint)
            }

            newLine.points.push(toPoint)
            strokeStarted = true
            drawingRemaining = true
          }
          else {

            // draw segment's from-side part
            if (lengthFrom > 0.0) {

              if (!strokeStarted) {

                newLine = new VectorStroke()
                newLine.points.push(fromPoint)
              }

              vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom)

              const newPoint = new VectorPoint()

              vec3.copy(newPoint.location, this.toLocation)
              vec3.copy(newPoint.adjustingLocation, newPoint.location)

              newPoint.lineWidth = Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth)
              newPoint.adjustingLineWidth = newPoint.lineWidth

              newLine.points.push(newPoint)

              editGroup.newLines.push(newLine)

              strokeStarted = false
              drawingRemaining = false
            }

            // draw segment's to-side part
            if (lengthTo > 0.0 && lengthTo < 1.0) {

              if (drawingRemaining) {

                editGroup.newLines.push(newLine)
              }

              vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo)

              newLine = new VectorStroke()

              const newPoint = new VectorPoint()

              vec3.copy(newPoint.location, this.fromLocation)
              vec3.copy(newPoint.adjustingLocation, newPoint.location)

              newPoint.lineWidth = Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth)
              newPoint.adjustingLineWidth = newPoint.lineWidth

              newLine.points.push(newPoint)

              newLine.points.push(toPoint)

              strokeStarted = true
              drawingRemaining = true
            }
          }
        }

        if (drawingRemaining) {

          editGroup.newLines.push(newLine)
        }
      }

      Logic_Edit_Line.calculateParametersV(editGroup.newLines)

      editGroups.push(editGroup)

      this.useGroup(group)
    }

    if (editGroups.length > 0) {

      this.editGroups = editGroups
      return true
    }
    else {

      return false
    }
  }

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editGroup of this.editGroups) {

      editGroup.targetGroup.lines = editGroup.oldLines
    }
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editGroup of this.editGroups) {

      editGroup.targetGroup.lines = editGroup.newLines
    }
  }
}
