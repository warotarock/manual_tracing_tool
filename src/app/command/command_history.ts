import { Lists } from '../logics/conversion'
import { VectorStrokeGroup } from '../document_data'
import { SubToolContext } from '../context/subtool_context'
import { CommandBase } from './command'

export class CommandHistory {

  maxHistory = 300

  historyList: CommandBase[] = []
  redoList: CommandBase[] = []

  executeCommand(command: CommandBase, ctx: SubToolContext) {

    command.execute(ctx)

    if (command.targetGroups != null) {

      VectorStrokeGroup.setGroupsUpdated(command.targetGroups)

      ctx.setLazyRedraw()
    }

    this.addCommand(command)
  }

  addCommand(command: CommandBase) {

    this.historyList.push(command)

    if (this.historyList.length > this.maxHistory) {

      Lists.removeAt(this.historyList, 0)
    }

    if (this.redoList.length > 0) {

      this.redoList = []
    }
  }

  private getUndoCommand(): CommandBase {

    if (this.historyList.length == 0) {
      return null
    }

    return this.historyList[this.historyList.length - 1]
  }

  private getRedoCommand(): CommandBase {

    if (this.redoList.length == 0) {
      return null
    }

    return this.redoList[this.redoList.length - 1]
  }

  undo(ctx: SubToolContext) {

    let command: CommandBase = null

    do {

      command = this.getUndoCommand()

      if (command == null) {
        return
      }

      command.undo(ctx)

      if (command.targetGroups != null) {

        VectorStrokeGroup.setGroupsUpdated(command.targetGroups)

        ctx.setLazyRedraw()
      }

      this.redoList.push(command)
      Lists.removeAt(this.historyList, this.historyList.length - 1)
    }
    while (command.isContinued)
  }

  redo(ctx: SubToolContext) {

    let command: CommandBase = null

    do {

      command = this.getRedoCommand()

      if (command == null) {
        return
      }

      command.redo(ctx)

      if (command.targetGroups != null) {

        VectorStrokeGroup.setGroupsUpdated(command.targetGroups)

        ctx.setLazyRedraw()
      }

      Lists.removeAt(this.redoList, this.redoList.length - 1)
      this.historyList.push(command)

      command = this.getRedoCommand()
    }
    while (command != null && command.isContinued)
  }
}
