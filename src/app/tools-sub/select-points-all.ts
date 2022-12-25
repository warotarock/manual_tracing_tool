import { SubToolContext } from '../context'
import { VectorStrokeGroup } from '../document-data'
import { SelectionEditMode, VectorLayerSelectionInfo } from '../document-logic'
import { SubTool } from '../tool'
import { ViewKeyframeLayer } from '../view'
import { Command_Select } from './select-brush-select'

export class Tool_Select_All_LinePoint extends SubTool {

  executeToggleSelection(ctx: SubToolContext): boolean {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    const existsSelectedPoints = this.isSelectedAnyPoint(viewKeyframeLayers)

    return this.executeModifySelection(viewKeyframeLayers, existsSelectedPoints, ctx)
  }

  executeSelectAll(ctx: SubToolContext): boolean  {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    return this.executeModifySelection(viewKeyframeLayers, false, ctx)
  }

  executeClearSelectAll(ctx: SubToolContext): boolean  {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    return this.executeModifySelection(viewKeyframeLayers, true, ctx)
  }

  private executeModifySelection(editableKeyframeLayers: ViewKeyframeLayer[], clearSelection: boolean, ctx: SubToolContext): boolean {

    let selectionInfo: VectorLayerSelectionInfo

    if (clearSelection) {

      selectionInfo = this.createSelectionInfo_ClearAllSelection(editableKeyframeLayers)
    }
    else {

      selectionInfo = this.createSelectionInfo_SelectAll(editableKeyframeLayers)
    }

    if (selectionInfo.selectedPoints.length == 0) {
      return false
    }

    selectionInfo.updateLineSelectionState()

    this.executeCommand(selectionInfo, ctx)

    selectionInfo.resetModifyStates()

    ctx.setRedrawMainWindowEditorWindow()

    return true
  }

  private isSelectedAnyPoint(viewKeyframeLayers: ViewKeyframeLayer[]): boolean {

    let isSelected = false

    ViewKeyframeLayer.forEachStrokeGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

      for (const line of group.lines) {

        if (line.isSelected) {

          isSelected = true
          break
        }

        for (const point of line.points) {

          if (point.isSelected) {

            isSelected = true
            break
          }
        }
      }
    })

    return isSelected
  }

  private createSelectionInfo_SelectAll(viewKeyframeLayers: ViewKeyframeLayer[]): VectorLayerSelectionInfo {

    const selectionInfo = new VectorLayerSelectionInfo()

    ViewKeyframeLayer.forEachStrokeGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

      for (const line of group.lines) {

        for (const point of line.points) {

          if (!point.isSelected) {

            selectionInfo.selectPoint(line, point, SelectionEditMode.setSelected)
          }
        }
      }
    })

    return selectionInfo
  }

  private createSelectionInfo_ClearAllSelection(viewKeyframeLayers: ViewKeyframeLayer[]): VectorLayerSelectionInfo {

    const selectionInfo = new VectorLayerSelectionInfo()

    ViewKeyframeLayer.forEachStrokeGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

      for (const line of group.lines) {

        for (const point of line.points) {

          if (point.isSelected) {

            selectionInfo.selectPoint(line, point, SelectionEditMode.setUnselected)
          }
        }
      }
    })

    return selectionInfo
  }

  private executeCommand(selectionInfo: VectorLayerSelectionInfo, ctx: SubToolContext) {

    const command = new Command_Select()
    command.selectionInfo = selectionInfo

    ctx.commandHistory.executeCommand(command, ctx)
  }
}
