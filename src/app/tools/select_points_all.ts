import { VectorStrokeGroup } from '../document_data'
import { SelectionEditMode, VectorLayerEditorSelectionInfo } from '../logics/selector'
import { SubTool } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { Command_Select } from './select_brush_select'

export class Tool_Select_All_LinePoint extends SubTool {

  executeToggleSelection(ctx: SubToolContext) {

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    const existsSelectedPoints = this.isSelectedAnyPoint(viewKeyframeLayers)

    this.executeModifySelection(viewKeyframeLayers, existsSelectedPoints, ctx)
  }

  executeSelectAll(ctx: SubToolContext) {

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    this.executeModifySelection(viewKeyframeLayers, false, ctx)
  }

  executeClearSelectAll(ctx: SubToolContext) {

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    this.executeModifySelection(viewKeyframeLayers, true, ctx)
  }

  private executeModifySelection(editableKeyframeLayers: ViewKeyframeLayer[], clearSelection: boolean, ctx: SubToolContext) {

    let selectionInfo: VectorLayerEditorSelectionInfo

    if (clearSelection) {

      selectionInfo = this.createSelectionInfo_ClearAllSelection(editableKeyframeLayers)
    }
    else {

      selectionInfo = this.createSelectionInfo_SelectAll(editableKeyframeLayers)
    }

    if (selectionInfo.selectedPoints.length == 0) {
      return
    }

    selectionInfo.updateLineSelectionState()

    this.executeCommand(selectionInfo, ctx)

    selectionInfo.resetModifyStates()

    ctx.setRedrawMainWindowEditorWindow()
  }

  private isSelectedAnyPoint(viewKeyframeLayers: ViewKeyframeLayer[]): boolean {

    let isSelected = false

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

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

  private createSelectionInfo_SelectAll(viewKeyframeLayers: ViewKeyframeLayer[]): VectorLayerEditorSelectionInfo {

    const selectionInfo = new VectorLayerEditorSelectionInfo()

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

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

  private createSelectionInfo_ClearAllSelection(viewKeyframeLayers: ViewKeyframeLayer[]): VectorLayerEditorSelectionInfo {

    const selectionInfo = new VectorLayerEditorSelectionInfo()

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

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

  private executeCommand(selectionInfo: VectorLayerEditorSelectionInfo, ctx: SubToolContext) {

    const command = new Command_Select()
    command.selectionInfo = selectionInfo

    ctx.commandHistory.executeCommand(command, ctx)
  }
}
