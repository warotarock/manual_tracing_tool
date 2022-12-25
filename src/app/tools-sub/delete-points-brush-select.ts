import { Command_VectorLayer_DeleteFlagged } from '../commands'
import { SubToolContext } from '../context'
import { VectorPoint } from '../document-data'
import { ISelector_VectorLayer, Selector_VectorPoint_BrushSelect } from '../document-logic'
import { Tool_BrushSelectLinePointBase } from './select-brush-select'

export class Selector_DeleteLinePoint_BrushSelect extends Selector_VectorPoint_BrushSelect {

  protected onPointHited(point: VectorPoint) { // @override

    this.selectionInfo.deletePoint(point)
  }

  protected afterHitTest() { // @override

    // doesn't clear flagas when deletion
  }
}

export class Tool_DeletePoints_BrushSelect extends Tool_BrushSelectLinePointBase {

  helpText = 'ブラシ選択で点を削除します。'
  isEditTool = false // @override

  brushSelector: ISelector_VectorLayer = new Selector_DeleteLinePoint_BrushSelect() // @override

  isAvailable(ctx: SubToolContext): boolean { // @override

    return ctx.isCurrentLayerEditbaleLayer()
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_VectorLayer_DeleteFlagged()
    if (command.prepare(ctx)) {

      ctx.commandHistory.executeCommand(command, ctx)
    }

    ctx.setRedrawMainWindow()
  }
}
