import { DefferedProcessFlagging } from '../deffered-process'
import { SubToolContext } from '../context'
import { RefferenceUpdating } from '../document-logic'

export class CommandBase {

  isContinued = false

  readonly defferedProcess = new DefferedProcessFlagging()
  readonly refferenceUpdate = new RefferenceUpdating()

  execute(_ctx: SubToolContext) { // @virtual
  }

  undo(_ctx: SubToolContext) { // @virtual
  }

  redo(_ctx: SubToolContext) { // @virtual
  }
}
