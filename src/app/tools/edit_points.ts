import { CommandBase } from '../command/command'
import { LinePointModifyFlagID, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { ISelector_BrushSelect, Selector_LinePoint_BrushSelect, VectorLayerEditorSelectionInfo } from '../logics/selector'
import { SubToolContext } from '../context/subtool_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'
import { Tool_BrushSelectLinePointBase } from './select_brush_select'

export class Selector_HideLinePoint_BrushSelect extends Selector_LinePoint_BrushSelect {

  lineWidth = 0.0

  protected onPointHited(group: VectorStrokeGroup, line: VectorStroke, point: VectorPoint) { // @override

    if (point.modifyFlag == LinePointModifyFlagID.none) {

      point.adjustingLineWidth = this.lineWidth

      this.selectionInfo.editGroup(group)
      this.selectionInfo.editLine(line)
      this.selectionInfo.editPoint(point)
    }
  }
}

export class Tool_HideLinePoint_BrushSelect extends Tool_BrushSelectLinePointBase {

  helpText = '線の太さに最大の太さに設定します。<br />Shiftキーで最小の太さに設定します。Ctrlキーで線をの太さを０にします。'
  isEditTool = false // @override

  selector = new Selector_HideLinePoint_BrushSelect()
  logic_Selector: ISelector_BrushSelect = this.selector // @override

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

    for (const selPoint of this.logic_Selector.selectionInfo.selectedPoints) {

      selPoint.point.adjustingLineWidth = selPoint.point.lineWidth
    }

    this.logic_Selector.endProcess()

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

  prepareEditTargets(selectionInfo: VectorLayerEditorSelectionInfo): boolean {

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

      this.useGroups()

      for (const selGroup of selectionInfo.selectedGroups) {

        this.targetGroups.push(selGroup.group)
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
