import { VectorPoint, VectorStroke, VectorStrokeGroup, Layer } from '../document_data'
import { Command_DeleteFlaggedPoints } from '../commands/delete_points'
import { Selector_LinePoint_BrushSelect, ISelector_BrushSelect } from '../logics/selector'
import { SubToolContext } from '../context/subtool_context'
import { Tool_BrushSelectLinePointBase } from './select_brush_select'

export class Selector_DeleteLinePoint_BrushSelect extends Selector_LinePoint_BrushSelect {

  protected onPointHited(group: VectorStrokeGroup, line: VectorStroke, point: VectorPoint) { // @override

    this.selectionInfo.deletePoint(point)
  }

  protected afterHitTest() { // @override

    // doesn't clear flagas when deletion
  }
}

export class Tool_DeletePoints_BrushSelect extends Tool_BrushSelectLinePointBase {

  helpText = 'ブラシ選択で点を削除します。'
  isEditTool = false // @override

  logic_Selector: ISelector_BrushSelect = new Selector_DeleteLinePoint_BrushSelect() // @override

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerVectorLayer()
      && Layer.isEditTarget(ctx.currentLayer)
    )
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_DeleteFlaggedPoints()
    if (command.prepareEditTargets(ctx)) {

      ctx.commandHistory.executeCommand(command, ctx)
    }

    ctx.setRedrawMainWindow()
  }
}
