import { SubTool } from '../tool'
import { SubToolContext } from '../context'

export class Tool_NoOperation extends SubTool {

  isAvailable(ctx: SubToolContext): boolean { // @override

    return false
  }
}
