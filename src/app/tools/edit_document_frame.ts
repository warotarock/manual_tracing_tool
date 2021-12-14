import { CommandBase } from '../command/command'
import { DocumentData } from '../document_data'
import { SubToolContext } from '../context/subtool_context'
import { ToolKeyboardEvent } from '../tool/tool_keyboard_event'
import { Tool_Transform_Lattice, TransformType } from './transform_lattice'

export class Tool_EditDocumentFrame extends Tool_Transform_Lattice {

  helpText = 'エクスポート範囲を設定します。座標は整数値になります。'

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return true
  }

  // Preparing for operation (Override methods)

  protected checkTarget(_ctx: SubToolContext): boolean { // @override

    return true
  }

  protected prepareLatticePoints(ctx: SubToolContext): boolean { // @override

    // calculate lattice points

    this.rectangleArea.left = ctx.document.documentFrame[0]
    this.rectangleArea.top = ctx.document.documentFrame[1]
    this.rectangleArea.right = ctx.document.documentFrame[2]
    this.rectangleArea.bottom = ctx.document.documentFrame[3]

    this.setLatticePointsByRectangle(this.rectangleArea)

    // set integer mode to calculator
    this.grabMove_Calculator.integerValueOnly = true

    return this.existsLatticeRectangleArea()
  }

  protected existsEditData(): boolean { // @override

    return this.existsLatticeRectangleArea()
  }

  // Operation inputs

  keydown(e: ToolKeyboardEvent, ctx: SubToolContext): boolean { // @override

    if (!ctx.isModalToolRunning()) {

      if (e.key == 'g') {

        this.startLatticeAffineTransform(TransformType.grabMove, false, ctx)
        return true
      }
      else if (e.key == 's') {

        this.startLatticeAffineTransform(TransformType.scale, false, ctx)
        return true
      }
    }
    else {

      if (this.handleKeyDownForTransformModifying({ g: true, s: true, shift: true, e, ctx })) {

        return true;
      }
    }

    return false
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_EditDocumentFrame()
    command.targetDocument = ctx.document
    command.newDocumentFrame[0] = Math.floor(this.latticePoints[0].location[0])
    command.newDocumentFrame[1] = Math.floor(this.latticePoints[0].location[1])
    command.newDocumentFrame[2] = Math.floor(this.latticePoints[2].location[0])
    command.newDocumentFrame[3] = Math.floor(this.latticePoints[2].location[1])

    ctx.commandHistory.executeCommand(command, ctx)
  }
}

class Command_EditDocumentFrame extends CommandBase {

  targetDocument: DocumentData = null

  newDocumentFrame = vec4.create()

  oldDocumentFrame = vec4.create()

  execute(ctx: SubToolContext) { // @override

    this.errorCheck()

    vec4.copy(this.oldDocumentFrame, this.targetDocument.documentFrame)

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    vec4.copy(this.targetDocument.documentFrame, this.oldDocumentFrame)
  }

  redo(_ctx: SubToolContext) { // @override

    vec4.copy(this.targetDocument.documentFrame, this.newDocumentFrame)

    _ctx.setRedrawRibbonUI()
  }

  errorCheck() {

    if (this.targetDocument == null) {

      throw new Error('ERROR 0801:Command_EditDocumentFrame: targetDocument is null!')
    }
  }
}
