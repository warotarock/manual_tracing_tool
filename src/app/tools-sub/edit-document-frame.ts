import { CommandBase } from '../command'
import { SubToolContext } from '../context'
import { DocumentData } from '../document-data'
import { ShortcutCommandID } from '../user-setting'
import { Tool_Transform_Lattice, TransformType } from './transform-lattice'

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

    this.bound_contentArea.left = ctx.documentData.documentFrame[0]
    this.bound_contentArea.top = ctx.documentData.documentFrame[1]
    this.bound_contentArea.right = ctx.documentData.documentFrame[2]
    this.bound_contentArea.bottom = ctx.documentData.documentFrame[3]

    this.setLatticePointsByRectangle(this.bound_contentArea, this.bound_contentArea)

    // set integer mode to calculator
    this.grabMove_Calculator.integerValueOnly = true

    return this.existsLatticeRectangleArea()
  }

  protected existsEditData(): boolean { // @override

    return this.existsLatticeRectangleArea()
  }

  // Operation inputs

  keydown(key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (!ctx.tool.isModalToolRunning()) {

      if (commandID == ShortcutCommandID.edit_grabMove) {

        this.startLatticeAffineTransform(TransformType.grabMove, false, ctx)
        return true
      }

      if (commandID == ShortcutCommandID.edit_scale) {

        this.startLatticeAffineTransform(TransformType.scale, false, ctx)
        return true
      }
    }
    else {

      if (this.handleKeyDownForTransformModifying({ g: true, s: true, shift: true, key, ctx })) {

        return true;
      }
    }

    return false
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_EditDocumentFrame()
    command.targetDocument = ctx.documentData
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

  undo(ctx: SubToolContext) { // @override

    vec4.copy(this.targetDocument.documentFrame, this.oldDocumentFrame)

    ctx.setRedrawRibbonUI()
  }

  redo(ctx: SubToolContext) { // @override

    vec4.copy(this.targetDocument.documentFrame, this.newDocumentFrame)

    ctx.setRedrawRibbonUI()
  }

  errorCheck() {

    if (this.targetDocument == null) {

      throw new Error('ERROR 0801:Command_EditDocumentFrame: targetDocument is null!')
    }
  }
}
