import { CommandBase } from '../command'
import { float, Maths } from '../common-logics'
import { SubToolContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import { PointBrushFillLayer, VectorLayer, VectorStrokeModifyFlagID, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document-data'
import { ISelector_VectorLayer, Selector_StrokeSegment_BrushSelect, VectorLayerSelectionInfo, VectorStrokeLogic } from '../document-logic'
import { Tool_BrushSelectLinePointBase } from './select-brush-select'

class DivideLine_EditGroup {

  target_group: VectorStrokeGroup = null
  new_strokes: VectorStroke[] = []
  replaced_strokes: VectorStroke[] = []
  old_strokes: VectorStroke[] = null
}

export class Selector_DeleteLinePoint_DivideLine extends Selector_StrokeSegment_BrushSelect {

  private segmentMat4 = mat4.create()
  private invMat4 = mat4.create()
  private normalVec = vec3.create()
  private localLocation = vec3.create()

  protected onLineSegmentHited(point1: VectorPoint, point2: VectorPoint, location: Vec3, minDistanceSQ: float, _distanceSQ: float) { // @override

    this.createEditPoint(point1, point2, location, minDistanceSQ)
  }

  private createEditPoint(point1: VectorPoint, point2: VectorPoint, location: Vec3, minDistanceSQ: float) {

    let edited = false

    const segmentLength = vec3.distance(point1.location, point2.location)

    if (segmentLength <= 0.0) {

      edited = true
      point1.adjustingLengthFrom = 0.0 // fromを0.0、toを1.0とすることでセグメント全体の削除とする。これによりこのセグメントは描画時にスキップされる。
      point1.adjustingLengthTo = 1.0
    }
    else {

      // 線分を円でけずる計算を行う

      // 線分の逆行列を計算
      Maths.mat4SegmentMat(this.segmentMat4, this.normalVec, point1.location, point2.location)
      mat4.invert(this.invMat4, this.segmentMat4)

      // 線分ローカルな消しゴムの位置を計算
      vec3.set(this.localLocation, location[0], location[1], 0.0)
      vec3.transformMat4(this.localLocation, this.localLocation, this.invMat4)

      // 消しゴムと線分の交差する位置を計算
      let dy = 0 - this.localLocation[1]

      if (minDistanceSQ - dy * dy < 0) {

        dy = 0.01
      }

      const dx = Math.sqrt(minDistanceSQ - dy * dy)
      const x1 = this.localLocation[0] - dx
      const x2 = this.localLocation[0] + dx

      // 線分のfrom側にはみ出す場合
      if (x1 > 0.0 && x1 < segmentLength && x2 >= segmentLength) {

        const fromX = x1 / segmentLength
        if (fromX < point1.adjustingLengthFrom) {

          point1.adjustingLengthFrom = fromX
        }

        edited = true
        point1.adjustingLengthTo = 1.0
      }
      // 線分のto側にはみ出す場合
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
      // 交差する位置が線分の内側にある場合
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

      this.selectionInfo.editStroke(this.currentStroke)
      this.selectionInfo.editGroup(this.currentStrokeGroup, this.currentGeometry, this.currentLayer)
    }
  }

  protected afterHitTest() { // @override

    // doesn't clear flagas
  }
}

export class Tool_DeletePoints_DivideLine extends Tool_BrushSelectLinePointBase {

  helpText = 'ブラシ選択で点を削除します。'
  isEditTool = false // @override

  private selector = new Selector_DeleteLinePoint_DivideLine()
  brushSelector: ISelector_VectorLayer = this.selector // @override

  afterProcessSelection(ctx: SubToolContext) {

    for (const groupSelection of this.selector.selectionInfo.selectedGroups) {

      if (VectorLayer.isPointBrushFillLayer(groupSelection.layer)) {

        ctx.main.setRedrawDrawPathForLayer(groupSelection.layer)
      }
    }
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

  prepareEditTargets(selectionInfo: VectorLayerSelectionInfo): boolean {

    const editGroups: DivideLine_EditGroup[] = []

    // Collect edit data from adjusting state, it must be same with the drawing algorism
    for (const selGroup of selectionInfo.selectedGroups) {

      const edit_group = new DivideLine_EditGroup()
      edit_group.target_group = selGroup.group
      edit_group.old_strokes = selGroup.group.lines

      for (const stroke of selGroup.group.lines) {

        if (stroke.runtime.modifyFlag == VectorStrokeModifyFlagID.none) {

          edit_group.new_strokes.push(stroke)
          continue
        }

        edit_group.replaced_strokes.push(stroke)

        let new_stroke: VectorStroke = null
        let strokeStarted = false
        let drawingRemaining = false

        for (let pointIndex = 0; pointIndex < stroke.points.length - 1; pointIndex++) {

          const fromPoint = stroke.points[pointIndex]
          const fromLocation = fromPoint.location
          const toPoint = stroke.points[pointIndex + 1]
          const toLocation = toPoint.location
          const lengthFrom = fromPoint.adjustingLengthFrom
          const lengthTo = fromPoint.adjustingLengthTo

          fromPoint.adjustingLengthFrom = 1.0
          fromPoint.adjustingLengthTo = 0.0

          if (lengthFrom == 1.0) {

            if (!strokeStarted) {

              new_stroke = new VectorStroke()
              new_stroke.points.push(fromPoint)
            }

            new_stroke.points.push(toPoint)
            strokeStarted = true
            drawingRemaining = true
          }
          else {

            // draw segment's from-side part
            if (lengthFrom > 0.0) {

              if (!strokeStarted) {

                new_stroke = new VectorStroke()
                new_stroke.points.push(fromPoint)
              }

              vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom)

              const newPoint = new VectorPoint()

              vec3.copy(newPoint.location, this.toLocation)
              vec3.copy(newPoint.adjustingLocation, newPoint.location)

              newPoint.lineWidth = Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth)
              newPoint.adjustingLineWidth = newPoint.lineWidth

              new_stroke.points.push(newPoint)

              edit_group.new_strokes.push(new_stroke)

              strokeStarted = false
              drawingRemaining = false
            }

            // draw segment's to-side part
            if (lengthTo > 0.0 && lengthTo < 1.0) {

              if (drawingRemaining) {

                edit_group.new_strokes.push(new_stroke)
              }

              vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo)

              new_stroke = new VectorStroke()

              const newPoint = new VectorPoint()

              vec3.copy(newPoint.location, this.fromLocation)
              vec3.copy(newPoint.adjustingLocation, newPoint.location)

              newPoint.lineWidth = Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth)
              newPoint.adjustingLineWidth = newPoint.lineWidth

              new_stroke.points.push(newPoint)

              new_stroke.points.push(toPoint)

              strokeStarted = true
              drawingRemaining = true
            }
          }
        }

        if (drawingRemaining) {

          edit_group.new_strokes.push(new_stroke)
        }
      }

      for (const stroke of edit_group.new_strokes) {

        VectorStrokeLogic.calculateParameters(stroke, selGroup.layer.lineWidthBiasRate)
      }

      editGroups.push(edit_group)

      this.defferedProcess.addGeometryForDeletingEmpties(selGroup.geometry)
      this.defferedProcess.addGroup(selGroup.layer, selGroup.group, PostUpdateSituationTypeID.deleteObjects)
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

      editGroup.target_group.lines = editGroup.old_strokes

      for (const stroke of editGroup.replaced_strokes) {

        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.none
      }
    }
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editGroup of this.editGroups) {

      editGroup.target_group.lines = editGroup.new_strokes

      for (const stroke of editGroup.replaced_strokes) {

        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.delete
      }
    }
  }
}
