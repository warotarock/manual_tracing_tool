import { CommandBase } from '../command'
import { SubToolContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import { VectorPointModifyFlagID, VectorPoint } from '../document-data'
import { ISelector_VectorLayer, Selector_VectorPoint_BrushSelect, VectorLayerSelectionInfo } from '../document-logic'
import { ToolPointerEvent } from '../tool'
import { Tool_BrushSelectLinePointBase } from './select-brush-select'

export class Selector_HideLinePoint_BrushSelect extends Selector_VectorPoint_BrushSelect {

  lineWidth = 0.0

  protected onPointHited(point: VectorPoint) { // @override

    if (point.modifyFlag == VectorPointModifyFlagID.none) {

      point.adjustingLineWidth = this.lineWidth

      this.selectionInfo.editGroup(this.currentStrokeGroup, this.currentGeometry, this.currentLayer)
      this.selectionInfo.editStroke(this.currentStroke)
      this.selectionInfo.editPoint(point)
    }
  }
}

export class Tool_HideLinePoint_BrushSelect extends Tool_BrushSelectLinePointBase {

  helpText = '線の太さに最大の太さに設定します。<br />Shiftキーで最小の太さに設定します。Ctrlキーで線をの太さを０にします。'
  isEditTool = false // @override

  private selector = new Selector_HideLinePoint_BrushSelect()
  brushSelector: ISelector_VectorLayer = this.selector // @override

  protected onStartSelection(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.isShiftKeyPressing()) {

      this.selector.lineWidth = ctx.drawLineMinWidth
    }
    else if (ctx.isCtrlKeyPressing()) {

      this.selector.lineWidth = 0.0
    }
    else {

      this.selector.lineWidth = ctx.drawLineBaseWidth
    }
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_EditLinePointLineWidth()
    if (command.prepareEditTargets(this.selector.selectionInfo)) {

      ctx.commandHistory.executeCommand(command, ctx)
    }

    ctx.setRedrawMainWindow()
  }

  cancelModal(ctx: SubToolContext) { // @override

    for (const selPoint of this.brushSelector.selectionInfo.selectedPoints) {

      selPoint.point.adjustingLineWidth = selPoint.point.lineWidth
    }

    this.brushSelector.endProcess()

    ctx.setRedrawMainWindowEditorWindow()
  }
}

class Tool_EditLineWidth_EditPoint {

  targetPoint: VectorPoint = null

  newLineWidth = 0.0
  oldLineWidth = 0.0
}

export class Command_EditLinePointLineWidth extends CommandBase {

  editPoints: Tool_EditLineWidth_EditPoint[] = []

  prepareEditTargets(selectionInfo: VectorLayerSelectionInfo): boolean {

    let editPointCount = 0

    for (const selPoint of selectionInfo.selectedPoints) {
      const point = selPoint.point

      const editPoint = new Tool_EditLineWidth_EditPoint()
      editPoint.targetPoint = point
      editPoint.oldLineWidth = point.lineWidth
      editPoint.newLineWidth = point.adjustingLineWidth

      this.editPoints.push(editPoint)

      editPointCount++
    }

    if (editPointCount > 0) {

      for (const selGroup of selectionInfo.selectedGroups) {

        this.defferedProcess.addGroup(selGroup.layer, selGroup.group, PostUpdateSituationTypeID.changesObjectShapes)
      }
    }

    return (editPointCount > 0)
  }

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {
      const targetPoint = editPoint.targetPoint

      targetPoint.lineWidth = editPoint.oldLineWidth
      targetPoint.adjustingLineWidth = targetPoint.lineWidth
    }
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {
      const targetPoint = editPoint.targetPoint

      targetPoint.lineWidth = editPoint.newLineWidth
      targetPoint.adjustingLineWidth = targetPoint.lineWidth
    }
  }
}
