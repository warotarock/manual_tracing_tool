import { Lists } from '../common-logics'
import { SubToolContext } from '../context'
import { CommandBase } from './command'

export class CommandHistory {

  maxHistory = 300

  historyList: CommandBase[] = []
  redoList: CommandBase[] = []

  executeCommand(command: CommandBase, ctx: SubToolContext) {

    command.execute(ctx)

    command.defferedProcess.setFlags(ctx)

    this.addCommand(command)
  }

  private addCommand(command: CommandBase) {

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

    return this.historyList.at(-1)
  }

  private getRedoCommand(): CommandBase {

    if (this.redoList.length == 0) {
      return null
    }

    return this.redoList.at(-1)
  }

  undo(ctx: SubToolContext) {

    let command: CommandBase = null

    do {

      command = this.getUndoCommand()

      if (command == null) {
        return
      }

      command.undo(ctx)

      command.defferedProcess.setFlags(ctx)

      this.redoList.push(command)
      this.historyList.pop()
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

      command.defferedProcess.setFlags(ctx)

      this.redoList.pop()
      this.historyList.push(command)

      command = this.getRedoCommand()
    }
    while (command != null && command.isContinued)
  }
}
